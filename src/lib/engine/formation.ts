/**
 * Formations: 8 classic formations as slot maps (position per slot) plus
 * playstyle modifiers (defensive / balanced / attacking).
 *
 * Each formation has exactly 10 field slots; the goalkeeper is implicit and
 * always required (11 players total).
 */

export type Position = 'GK' | 'DEF' | 'MID' | 'FWD';
export type Playstyle = 'defensive' | 'balanced' | 'attacking';

export interface FormationSlot {
	/** Stable slot id, e.g. "LB", "CM1", "ST". */
	id: string;
	/** Required position for this slot (position locking). */
	position: Position;
	/** Short display label. */
	label: string;
}

export interface Formation {
	id: string;
	name: string;
	/** 10 field slots (GK is implicit). */
	slots: FormationSlot[];
}

function slots(defs: Array<[string, Position]>): FormationSlot[] {
	return defs.map(([id, position]) => ({ id, position, label: id }));
}

export const FORMATIONS: Formation[] = [
	{
		id: '4-3-3',
		name: '4-3-3',
		slots: slots([
			['LB', 'DEF'],
			['CB1', 'DEF'],
			['CB2', 'DEF'],
			['RB', 'DEF'],
			['CM1', 'MID'],
			['CM2', 'MID'],
			['CM3', 'MID'],
			['LW', 'FWD'],
			['ST', 'FWD'],
			['RW', 'FWD'],
		]),
	},
	{
		id: '4-4-2',
		name: '4-4-2',
		slots: slots([
			['LB', 'DEF'],
			['CB1', 'DEF'],
			['CB2', 'DEF'],
			['RB', 'DEF'],
			['LM', 'MID'],
			['CM1', 'MID'],
			['CM2', 'MID'],
			['RM', 'MID'],
			['ST1', 'FWD'],
			['ST2', 'FWD'],
		]),
	},
	{
		id: '4-2-3-1',
		name: '4-2-3-1',
		slots: slots([
			['LB', 'DEF'],
			['CB1', 'DEF'],
			['CB2', 'DEF'],
			['RB', 'DEF'],
			['CDM1', 'MID'],
			['CDM2', 'MID'],
			['LW', 'MID'],
			['CAM', 'MID'],
			['RW', 'MID'],
			['ST', 'FWD'],
		]),
	},
	{
		id: '4-2-4',
		name: '4-2-4',
		slots: slots([
			['LB', 'DEF'],
			['CB1', 'DEF'],
			['CB2', 'DEF'],
			['RB', 'DEF'],
			['CDM1', 'MID'],
			['CDM2', 'MID'],
			['LW', 'FWD'],
			['ST1', 'FWD'],
			['ST2', 'FWD'],
			['RW', 'FWD'],
		]),
	},
	{
		id: '3-5-2',
		name: '3-5-2',
		slots: slots([
			['CB1', 'DEF'],
			['CB2', 'DEF'],
			['CB3', 'DEF'],
			['LWB', 'MID'],
			['CM1', 'MID'],
			['CDM', 'MID'],
			['CM2', 'MID'],
			['RWB', 'MID'],
			['ST1', 'FWD'],
			['ST2', 'FWD'],
		]),
	},
	{
		id: '5-3-2',
		name: '5-3-2',
		slots: slots([
			['LB', 'DEF'],
			['CB1', 'DEF'],
			['CB2', 'DEF'],
			['CB3', 'DEF'],
			['RB', 'DEF'],
			['CM1', 'MID'],
			['CM2', 'MID'],
			['CM3', 'MID'],
			['ST1', 'FWD'],
			['ST2', 'FWD'],
		]),
	},
	{
		id: '4-5-1',
		name: '4-5-1',
		slots: slots([
			['LB', 'DEF'],
			['CB1', 'DEF'],
			['CB2', 'DEF'],
			['RB', 'DEF'],
			['LM', 'MID'],
			['CM1', 'MID'],
			['CDM', 'MID'],
			['CM2', 'MID'],
			['RM', 'MID'],
			['ST', 'FWD'],
		]),
	},
	{
		id: '3-4-3',
		name: '3-4-3',
		slots: slots([
			['CB1', 'DEF'],
			['CB2', 'DEF'],
			['CB3', 'DEF'],
			['LM', 'MID'],
			['CM1', 'MID'],
			['CM2', 'MID'],
			['RM', 'MID'],
			['LW', 'FWD'],
			['ST', 'FWD'],
			['RW', 'FWD'],
		]),
	},
];

/** Look up a formation by id. @throws if unknown. */
export function getFormation(id: string): Formation {
	const f = FORMATIONS.find((x) => x.id === id);
	if (!f) throw new Error(`Unknown formation: ${id}`);
	return f;
}

export interface PlaystyleModifiers {
	/** Multiplier applied to the team's attack rating. */
	attack: number;
	/** Multiplier applied to the team's defense rating. */
	defense: number;
	/** Elo nudge applied to the team's effective rating. */
	eloDelta: number;
}

/**
 * Playstyle modifies the team's attack/defense balance:
 * attacking pushes the line up (more goals for, more conceded),
 * defensive does the opposite.
 */
export function playstyleModifiers(playstyle: Playstyle): PlaystyleModifiers {
	switch (playstyle) {
		case 'attacking':
			return { attack: 1.1, defense: 0.9, eloDelta: 25 };
		case 'defensive':
			return { attack: 0.9, defense: 1.1, eloDelta: -25 };
		case 'balanced':
		default:
			return { attack: 1.0, defense: 1.0, eloDelta: 0 };
	}
}

/**
 * Convert an average player rating (0–100) into an Elo rating.
 * Rating 80 → 1800, 90 → 1900, 95 → 1950.
 */
export function ratingToElo(avgRating: number): number {
	return Math.round(1000 + avgRating * 10);
}

/**
 * Effective team Elo for a drafted XI with a playstyle.
 */
export function teamElo(avgRating: number, playstyle: Playstyle): number {
	return ratingToElo(avgRating) + playstyleModifiers(playstyle).eloDelta;
}
