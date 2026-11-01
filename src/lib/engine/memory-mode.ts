/**
 * Memory mode (B13): a toggle that hides ratings and recommendations from
 * the draft UI state. The engine data is untouched — this only produces a
 * "view" of the draft with sensitive fields stripped.
 */

import type { DraftCard, DraftState } from './draft.js';

export interface MemoryModePlayer {
	id: string;
	name: string;
	nation: string;
	wcYear: number;
	position: string;
	/** Always undefined in memory mode. */
	rating?: never;
}

export interface MemoryModeCard {
	nation: string;
	wcYear: number;
	player: MemoryModePlayer;
}

export interface MemoryModeDraft {
	slots: Array<{
		id: string;
		position: string;
		player: MemoryModePlayer | null;
	}>;
	drawn: MemoryModeCard[];
	redrawsLeft: number;
	usedNations: string[];
}

/**
 * Strip ratings (and any recommendation hints) from a draft state for
 * display in memory mode.
 */
export function toMemoryMode(state: DraftState): MemoryModeDraft {
	const strip = (p: { id: string; name: string; nation: string; wcYear: number; position: string; rating: number }): MemoryModePlayer => ({
		id: p.id,
		name: p.name,
		nation: p.nation,
		wcYear: p.wcYear,
		position: p.position,
	});

	return {
		slots: state.slots.map((s) => ({
			id: s.id,
			position: s.position,
			player: s.player ? strip(s.player) : null,
		})),
		drawn: state.drawn.map((c: DraftCard) => ({
			nation: c.nation,
			wcYear: c.wcYear,
			player: strip(c.player),
		})),
		redrawsLeft: state.redrawsLeft,
		usedNations: [...state.usedNations],
	};
}

/** Whether a value is safe to show in memory mode (no rating leakage). */
export function isMemorySafe(value: unknown): boolean {
	if (value === null || value === undefined) return true;
	if (typeof value === 'number' || typeof value === 'string' || typeof value === 'boolean') {
		return true;
	}
	if (Array.isArray(value)) return value.every(isMemorySafe);
	if (typeof value === 'object') {
		return Object.entries(value as Record<string, unknown>).every(
			([k, v]) => k.toLowerCase() !== 'rating' && isMemorySafe(v)
		);
	}
	return false;
}
