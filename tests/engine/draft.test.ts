import { describe, it, expect } from 'vitest';
import {
	createDraft,
	drawCard,
	placeCard,
	redraw,
	isComplete,
	lineup,
	avgRating,
	type Player,
} from '$lib/engine/draft.js';
import { getFormation } from '$lib/engine/formation.js';
import { rngFromString } from '$lib/engine/prng.js';
import { toMemoryMode, isMemorySafe } from '$lib/engine/memory-mode.js';
import { runCampaign } from '$lib/engine/campaign.js';
import type { Team } from '$lib/engine/types.js';

/**
 * Build a deterministic player dataset: 120 nations × 7 players
 * (1 GK, 2 DEF, 2 MID, 2 FWD). Large enough that a full 11-slot draft
 * with re-draws cannot exhaust the squads.
 */
function makeDataset(): Player[] {
	const players: Player[] = [];
	let n = 0;
	for (let i = 0; i < 120; i++) {
		const nation = `N${String(i + 1).padStart(3, '0')}`;
		const positions = ['GK', 'DEF', 'DEF', 'MID', 'MID', 'FWD', 'FWD'] as const;
		for (const position of positions) {
			n += 1;
			players.push({
				id: `p${String(n).padStart(3, '0')}`,
				name: `${nation} ${position}-${n}`,
				nation,
				wcYear: 2022,
				position,
				rating: 60 + (n % 40),
			});
		}
	}
	return players;
}

/** Slot list: 10 field slots of 4-3-3 + implicit GK. */
function slotDefs() {
	const f = getFormation('4-3-3');
	return [{ id: 'GK', position: 'GK' as const }, ...f.slots];
}

/** Fill a draft deterministically: draw until every slot is filled. */
function fillDraft(dataset: Player[], seed = 'fill') {
	const state = createDraft(slotDefs(), { redraws: 200 });
	const rng = rngFromString(seed);
	let guard = 0;
	while (!isComplete(state) && guard++ < 500) {
		const card = drawCard(state, rng, dataset);
		const slot = state.slots.find((s) => s.player === null && s.position === card.player.position);
		if (slot) placeCard(state, slot.id, card);
		else redraw(state, rng, dataset);
	}
	return state;
}

describe('draft', () => {
	it('draws cards from unused nations only', () => {
		const dataset = makeDataset();
		const state = createDraft(slotDefs());
		const rng = rngFromString('nations');
		const seen = new Set<string>();
		for (let i = 0; i < 6; i++) {
			const card = drawCard(state, rng, dataset);
			expect(seen.has(card.nation)).toBe(false);
			seen.add(card.nation);
		}
	});

	it('enforces position locking', () => {
		const dataset = makeDataset();
		const state = createDraft(slotDefs());
		const rng = rngFromString('lock');
		const card = drawCard(state, rng, dataset);
		const wrongSlot = state.slots.find(
			(s) => s.player === null && s.position !== card.player.position
		)!;
		expect(() => placeCard(state, wrongSlot.id, card)).toThrow(/Position lock/);
	});

	it('rejects placing into a filled slot', () => {
		const dataset = makeDataset();
		const state = createDraft(slotDefs());
		const rng = rngFromString('filled');
		const card = drawCard(state, rng, dataset);
		const slot = state.slots.find((s) => s.position === card.player.position)!;
		placeCard(state, slot.id, card);
		// Draw until we get another card of the same position.
		let card2 = drawCard(state, rng, dataset);
		let guard = 0;
		while (card2.player.position !== card.player.position && guard++ < 100) {
			card2 = drawCard(state, rng, dataset);
		}
		expect(card2.player.position).toBe(card.player.position);
		expect(() => placeCard(state, slot.id, card2)).toThrow(/already filled/);
	});

	it('completes to 11 players with a deterministic seed', () => {
		const dataset = makeDataset();
		const a = fillDraft(dataset, 'same');
		const b = fillDraft(dataset, 'same');
		expect(isComplete(a)).toBe(true);
		expect(lineup(a).map((p) => p.id)).toEqual(lineup(b).map((p) => p.id));
		expect(lineup(a)).toHaveLength(11);
	});

	it('limits re-draws', () => {
		const dataset = makeDataset();
		const state = createDraft(slotDefs(), { redraws: 1 });
		const rng = rngFromString('redraw');
		const card = drawCard(state, rng, dataset);
		redraw(state, rng, dataset);
		expect(state.redrawsLeft).toBe(0);
		expect(() => redraw(state, rng, dataset)).toThrow(/No re-draws/);
	});

	it('re-draw discards the last card and frees its nation', () => {
		const dataset = makeDataset();
		const state = createDraft(slotDefs());
		const rng = rngFromString('free');
		const card = drawCard(state, rng, dataset);
		const drawnBefore = state.drawn.length;
		redraw(state, rng, dataset);
		// The discarded card is gone from the drawn list (replaced by a new one).
		expect(state.drawn.length).toBe(drawnBefore);
		expect(state.drawn).not.toContain(card);
		// The freed nation is no longer locked (it may be re-drawn, so we
		// assert the discard happened, not that the nation is absent).
		expect(state.usedNations).toHaveLength(drawnBefore);
	});

	it('computes average rating', () => {
		const dataset = makeDataset();
		const state = fillDraft(dataset, 'avg');
		const expected = lineup(state).reduce((s, p) => s + p.rating, 0) / 11;
		expect(avgRating(state)).toBeCloseTo(expected, 10);
	});
});

describe('memory mode', () => {
	it('strips ratings from the draft view', () => {
		const dataset = makeDataset();
		const state = fillDraft(dataset, 'mem');
		const view = toMemoryMode(state);
		for (const slot of view.slots) {
			expect(slot.player).not.toHaveProperty('rating');
		}
		for (const card of view.drawn) {
			expect(card.player).not.toHaveProperty('rating');
		}
	});

	it('isMemorySafe rejects rating keys', () => {
		expect(isMemorySafe({ name: 'x', rating: 88 })).toBe(false);
		expect(isMemorySafe({ name: 'x', rating: [1, 2] })).toBe(false);
		expect(isMemorySafe({ name: 'x', team: { rating: 1 } })).toBe(false);
		expect(isMemorySafe({ name: 'x', team: { id: 'y' } })).toBe(true);
	});
});

describe('campaign', () => {
	const opponents: Team[] = Array.from({ length: 15 }, (_, i) => ({
		id: `o${i + 1}`,
		name: `Opponent ${i + 1}`,
		elo: 1500 + i * 50,
	}));

	it('runs a full single-elimination campaign deterministically', () => {
		const dataset = makeDataset();
		const xi = fillDraft(dataset, 'camp');
		const a = runCampaign({ xi, playstyle: 'balanced', seed: 'c1', opponents });
		const b = runCampaign({ xi, playstyle: 'balanced', seed: 'c1', opponents });
		expect(a).toEqual(b);
		expect(a.record.played).toBeGreaterThanOrEqual(1);
		expect(a.record.won + a.record.drawn + a.record.lost).toBe(a.record.played);
		expect(a.placement).toBeGreaterThanOrEqual(1);
		expect(a.placement).toBeLessThanOrEqual(16);
		expect(a.overallRating).toBeGreaterThanOrEqual(0);
		expect(a.overallRating).toBeLessThanOrEqual(100);
	});

	it('records goals for/against consistently', () => {
		const dataset = makeDataset();
		const xi = fillDraft(dataset, 'goals');
		const r = runCampaign({ xi, playstyle: 'attacking', seed: 'g1', opponents });
		const gf = r.matches.reduce((s, m) => s + (m.home ? m.homeScore : m.awayScore), 0);
		const ga = r.matches.reduce((s, m) => s + (m.home ? m.awayScore : m.homeScore), 0);
		expect(r.record.goalsFor).toBe(gf);
		expect(r.record.goalsAgainst).toBe(ga);
	});

	it('champion placement is 1', () => {
		const dataset = makeDataset();
		const xi = fillDraft(dataset, 'champ');
		// Give the user a huge Elo edge via a high-rated XI is not possible
		// (ratings ≤ ~82); instead find a seed where the user wins.
		for (let i = 0; i < 200; i++) {
			const r = runCampaign({ xi, playstyle: 'attacking', seed: `hunt-${i}`, opponents });
			if (r.champion === 'user') {
				expect(r.placement).toBe(1);
				return;
			}
		}
		throw new Error('No seed found where the user wins');
	});
});
