import type { Team } from '../types';
import type { FootballDataset } from './types';

export interface DatasetTeamOptions {
	asOf?: string;
}

function isWithinInterval(asOf: string, validFrom: string, validTo: string | null): boolean {
	return asOf >= validFrom && (validTo === null || asOf <= validTo);
}

function latestSnapshot<T extends { validFrom: string; validTo: string | null }>(
	snapshots: T[],
	asOf: string
): T | undefined {
	return snapshots
		.filter((snapshot) => isWithinInterval(asOf, snapshot.validFrom, snapshot.validTo))
		.sort((left, right) => right.validFrom.localeCompare(left.validFrom))[0];
}

export function toEngineTeams(
	dataset: FootballDataset,
	{ asOf = dataset.dataset.updatedAt.slice(0, 10) }: DatasetTeamOptions = {}
): Team[] {
	return dataset.teams.map((team) => {
		const snapshot = latestSnapshot(
			dataset.teamSnapshots.filter((candidate) => candidate.teamId === team.id),
			asOf
		);
		return {
			id: team.id,
			name: team.canonicalName,
			elo: snapshot?.rating.elo ?? 1500,
			color: team.colors?.primary,
		};
	});
}

export function teamsForCompetition(
	dataset: FootballDataset,
	competitionId: string,
	seasonId: string
): Team[] {
	const teamIds = new Set(
		dataset.teamParticipations
			.filter(
				(participation) =>
					participation.competitionId === competitionId &&
					participation.seasonId === seasonId &&
					participation.status !== 'withdrawn'
			)
			.map((participation) => participation.teamId)
	);
	return toEngineTeams(dataset).filter((team) => teamIds.has(team.id));
}
