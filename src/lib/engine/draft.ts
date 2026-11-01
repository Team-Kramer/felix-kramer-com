/**
 * Draft game: build an XI by drawing (nation, WC year) cards from the
 * dataset. Each card names exactly one player from that historical squad.
 * Slots are position-locked; the draft ends when all 11 slots are filled.
 *
 * Pure TS, deterministic given the PRNG.
 */

import type { Position } from './formation.js';

/** A player from the curated dataset. */
export interface Player {
	id: string;
	name: string;
	/** Nation id (matches nations.json). */
	nation: string;
	/** World Cup year this player belongs to (e.g. 2022). */
	wcYear: number;
	position: Position;
	/** 0–100 rating. */
	rating: number;
}

/** A drawn card: (nation, WC year) + the one player from that squad. */
export interface DraftCard {
	nation: string;
	wcYear: number;
	player: Player;
}

export interface DraftSlot {
	/** Slot id from the formation (e.g. "ST"). */
	id: string;
	position: Position;
	player: Player | null;
}

export interface DraftState {
	/** Formation slot ids in order (10 field slots; GK implicit). */
	slots: DraftSlot[];
	/** Cards drawn so far (including re-drawn ones). */
	drawn: DraftCard[];
	/** Remaining re-draws (default 3). */
	redrawsLeft: number;
	/** Nation ids already used (one card per nation per draft). */
	usedNations: string[];
}

export interface DraftOptions {
	/** Number of re-draws allowed (default 3). */
	redraws?: number;
}

/**
 * Create a fresh draft state for a formation's slot list.
 */
export function createDraft(
	slotDefs: Array<{ id: string; position: Position }>,
	options: DraftOptions = {}
): DraftState {
	return {
		slots: slotDefs.map((s) => ({ id: s.id, position: s.position, player: null })),
		drawn: [],
		redrawsLeft: options.redraws ?? 3,
		usedNations: [],
	};
}

/**
 * Draw a card: pick a random (nation, wcYear) from the dataset, then a random
 * player from that squad. The nation is excluded if already used.
 *
 * @param state draft state (mutated)
 * @param rng PRNG
 * @param dataset the player dataset (all players)
 * @returns the drawn card
 */
export function drawCard(
	state: DraftState,
	rng: () => number,
	dataset: Player[]
): DraftCard {
	// Build the list of available (nation, year) squads, excluding used nations.
	const squads = new Map<string, Player[]>();
	for (const p of dataset) {
		if (state.usedNations.includes(p.nation)) continue;
		const key = `${p.nation}:${p.wcYear}`;
		const list = squads.get(key);
		if (list) list.push(p);
		else squads.set(key, [p]);
	}

	const keys = [...squads.keys()];
	if (keys.length === 0) throw new Error('No more squads available to draw from');

	const key = keys[Math.floor(rng() * keys.length)];
	const [nation, yearStr] = key.split(':');
	const squad = squads.get(key)!;
	const player = squad[Math.floor(rng() * squad.length)];

	const card: DraftCard = { nation, wcYear: Number(yearStr), player };
	state.drawn.push(card);
	state.usedNations.push(nation);
	return card;
}

/**
 * Place a drawn card into a slot.
 * @throws if the slot is filled or the position does not match (position lock).
 */
export function placeCard(state: DraftState, slotId: string, card: DraftCard): void {
	const slot = state.slots.find((s) => s.id === slotId);
	if (!slot) throw new Error(`Unknown slot: ${slotId}`);
	if (slot.player) throw new Error(`Slot ${slotId} is already filled`);
	if (slot.position !== card.player.position) {
		throw new Error(
			`Position lock: ${card.player.name} is a ${card.player.position}, slot ${slotId} requires ${slot.position}`
		);
	}
	slot.player = card.player;
}

/**
 * Re-draw a card: discard the last drawn (unplaced) card and draw a new one.
 * Costs one re-draw.
 * @throws if no re-draws remain or the last card was already placed.
 */
export function redraw(state: DraftState, rng: () => number, dataset: Player[]): DraftCard {
	if (state.redrawsLeft <= 0) throw new Error('No re-draws left');
	const last = state.drawn[state.drawn.length - 1];
	if (!last) throw new Error('Nothing to re-draw');
	if (state.slots.some((s) => s.player === last.player)) {
		throw new Error('Cannot re-draw a placed card');
	}
	state.redrawsLeft--;
	// Remove the discarded card and free its nation.
	state.drawn.pop();
	state.usedNations = state.usedNations.filter((n) => n !== last.nation);
	return drawCard(state, rng, dataset);
}

/** Whether all 11 slots (10 field + GK) are filled. */
export function isComplete(state: DraftState): boolean {
	return state.slots.every((s) => s.player !== null);
}

/** The drafted XI (11 players, GK first). */
export function lineup(state: DraftState): Player[] {
	if (!isComplete(state)) throw new Error('Draft is not complete');
	return state.slots.map((s) => s.player!);
}

/** Average rating of the drafted XI (0–100). */
export function avgRating(state: DraftState): number {
	const players = state.slots.map((s) => s.player).filter((p): p is Player => p !== null);
	if (players.length === 0) return 0;
	return players.reduce((sum, p) => sum + p.rating, 0) / players.length;
}
