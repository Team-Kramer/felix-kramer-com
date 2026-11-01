import nationsJson from './nations.json';
import clubsJson from './clubs.json';
import playersJson from './players.json';
import type { Player } from '../draft.js';
import type { Team } from '../types.js';

export interface Nation {
	id: string;
	code: string;
	name: { en: string; de: string };
	elo: number;
	confederation: string;
	pot: number;
	color: string;
}

export interface Club {
	id: string;
	name: string;
	league: string;
	elo: number;
	color: string;
}

export const nations: Nation[] = nationsJson.nations as Nation[];
export const clubs: Club[] = clubsJson.clubs as Club[];
export const players: Player[] = playersJson.players as Player[];

export const nationsById = new Map(nations.map((nation) => [nation.id, nation]));
export const clubsById = new Map(clubs.map((club) => [club.id, club]));

export function toTeam(n: Nation, lang: 'de' | 'en'): Team {
	return { id: n.id, name: n.name[lang], elo: n.elo, color: n.color, code: n.code };
}

export function toClubTeam(c: Club): Team {
	return { id: c.id, name: c.name, elo: c.elo, color: c.color };
}

export function topNations(n: number, lang: 'de' | 'en'): Team[] {
	return [...nations].sort((a, b) => b.elo - a.elo).slice(0, n).map((nation) => toTeam(nation, lang));
}

const leagueNames: Record<string, string> = {
	bundesliga: 'Bundesliga',
	'premier-league': 'Premier League',
	'la-liga': 'La Liga',
	'serie-a': 'Serie A',
	'ligue-1': 'Ligue 1',
};

export const leagues: { id: string; name: string; clubs: Club[] }[] = Array.from(
	clubs.reduce((groups, club) => {
		const group = groups.get(club.league);
		if (group) group.push(club);
		else groups.set(club.league, [club]);
		return groups;
	}, new Map<string, Club[]>())
).map(([id, leagueClubs]) => ({
	id,
	name: leagueNames[id] ?? id,
	clubs: [...leagueClubs].sort((a, b) => b.elo - a.elo),
}));
