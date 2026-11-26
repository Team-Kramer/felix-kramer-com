import type {
  ChemistrySnapshot,
  DatasetCompetition,
  DatasetPlayer,
  DatasetSeason,
  DatasetTeam,
  FootballDataset,
  PlayerMembership,
  PlayerSnapshot,
  TeamParticipation,
  TeamSnapshot,
} from '$lib/engine/dataset/types';

export type EntityCollection = keyof Pick<FootballDataset, 'competitions' | 'seasons' | 'teams' | 'players' | 'memberships' | 'teamParticipations' | 'teamSnapshots' | 'playerSnapshots' | 'chemistry' | 'provenance'>;

export function cloneDataset(dataset: FootballDataset): FootballDataset {
  return JSON.parse(JSON.stringify(dataset)) as FootballDataset;
}

export function toKebabCase(value: string): string {
  return value.trim().normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-zA-Z0-9]+/g, '-').replace(/^-+|-+$/g, '').toLowerCase() || 'item';
}

export function createStableId(label: string, collection: EntityCollection, dataset: FootballDataset, preferred?: string): string {
  const base = toKebabCase(preferred || label);
  const used = new Set((dataset[collection] as Array<{ id: string }>).map((entry) => entry.id));
  const prefix = collection === 'memberships' ? 'membership' : collection === 'teamSnapshots' || collection === 'playerSnapshots' ? 'snapshot' : collection === 'chemistry' ? 'chemistry' : collection.slice(0, -1);
  const candidate = base.startsWith(prefix + '-') ? base : `${prefix}-${base}`;
  if (!used.has(candidate)) return candidate;
  let index = 2;
  while (used.has(`${candidate}-${index}`)) index += 1;
  return `${candidate}-${index}`;
}

function next(dataset: FootballDataset, changes: Partial<FootballDataset>): FootballDataset {
  return { ...dataset, ...changes, dataset: { ...dataset.dataset, updatedAt: new Date().toISOString() } };
}

export function addCompetition(dataset: FootballDataset, input: Omit<DatasetCompetition, 'id'> & { id?: string }): FootballDataset {
  const entry = { ...input, id: createStableId(input.name, 'competitions', dataset, input.id) };
  return next(dataset, { competitions: [...dataset.competitions, entry] });
}
export function updateCompetition(dataset: FootballDataset, id: string, patch: Partial<DatasetCompetition>): FootballDataset { return next(dataset, { competitions: dataset.competitions.map((e) => e.id === id ? { ...e, ...patch, id } : e) }); }
export function removeCompetition(dataset: FootballDataset, id: string): FootballDataset { return next(dataset, { competitions: dataset.competitions.filter((e) => e.id !== id), seasons: dataset.seasons.filter((e) => e.competitionId !== id), teamParticipations: dataset.teamParticipations.filter((e) => e.competitionId !== id) }); }

export function addSeason(dataset: FootballDataset, input: Omit<DatasetSeason, 'id'> & { id?: string }): FootballDataset { const entry = { ...input, id: createStableId(input.name, 'seasons', dataset, input.id) }; return next(dataset, { seasons: [...dataset.seasons, entry] }); }
export function updateSeason(dataset: FootballDataset, id: string, patch: Partial<DatasetSeason>): FootballDataset { return next(dataset, { seasons: dataset.seasons.map((e) => e.id === id ? { ...e, ...patch, id } : e) }); }
export function removeSeason(dataset: FootballDataset, id: string): FootballDataset { return next(dataset, { seasons: dataset.seasons.filter((e) => e.id !== id), teamParticipations: dataset.teamParticipations.filter((e) => e.seasonId !== id) }); }

export function addTeam(dataset: FootballDataset, input: Omit<DatasetTeam, 'id'> & { id?: string }): FootballDataset { const entry = { ...input, id: createStableId(input.canonicalName, 'teams', dataset, input.id) }; return next(dataset, { teams: [...dataset.teams, entry] }); }
export function updateTeam(dataset: FootballDataset, id: string, patch: Partial<DatasetTeam>): FootballDataset { return next(dataset, { teams: dataset.teams.map((e) => e.id === id ? { ...e, ...patch, id } : e) }); }
export function removeTeam(dataset: FootballDataset, id: string): FootballDataset { return next(dataset, { teams: dataset.teams.filter((e) => e.id !== id), teamParticipations: dataset.teamParticipations.filter((e) => e.teamId !== id), memberships: dataset.memberships.filter((e) => e.teamId !== id), teamSnapshots: dataset.teamSnapshots.filter((e) => e.teamId !== id), chemistry: dataset.chemistry.filter((e) => e.teamId !== id) }); }

export function addPlayer(dataset: FootballDataset, input: Omit<DatasetPlayer, 'id'> & { id?: string }): FootballDataset { const entry = { ...input, id: createStableId(input.canonicalName, 'players', dataset, input.id) }; return next(dataset, { players: [...dataset.players, entry] }); }
export function updatePlayer(dataset: FootballDataset, id: string, patch: Partial<DatasetPlayer>): FootballDataset { return next(dataset, { players: dataset.players.map((e) => e.id === id ? { ...e, ...patch, id } : e) }); }
export function removePlayer(dataset: FootballDataset, id: string): FootballDataset { return next(dataset, { players: dataset.players.filter((e) => e.id !== id), memberships: dataset.memberships.filter((e) => e.playerId !== id), playerSnapshots: dataset.playerSnapshots.filter((e) => e.playerId !== id), tacticalProfiles: dataset.tacticalProfiles.filter((e) => e.playerId !== id) }); }

export function addMembership(dataset: FootballDataset, input: Omit<PlayerMembership, 'id'> & { id?: string }): FootballDataset { const entry = { ...input, id: createStableId(`${input.playerId}-${input.teamId}`, 'memberships', dataset, input.id) }; return next(dataset, { memberships: [...dataset.memberships, entry] }); }
export function updateMembership(dataset: FootballDataset, id: string, patch: Partial<PlayerMembership>): FootballDataset { return next(dataset, { memberships: dataset.memberships.map((e) => e.id === id ? { ...e, ...patch, id } : e) }); }
export function removeMembership(dataset: FootballDataset, id: string): FootballDataset { return next(dataset, { memberships: dataset.memberships.filter((e) => e.id !== id) }); }

export function addTeamParticipation(dataset: FootballDataset, input: Omit<TeamParticipation, 'id'> & { id?: string }): FootballDataset { const entry = { ...input, id: createStableId(`${input.teamId}-${input.seasonId}`, 'teamParticipations' as EntityCollection, dataset, input.id) }; return next(dataset, { teamParticipations: [...dataset.teamParticipations, entry] }); }
export function addPlayerSnapshot(dataset: FootballDataset, input: Omit<PlayerSnapshot, 'id'> & { id?: string }): FootballDataset { const entry = { ...input, id: createStableId(`${input.playerId}-${input.validFrom}`, 'playerSnapshots', dataset, input.id) }; return next(dataset, { playerSnapshots: [...dataset.playerSnapshots, entry] }); }
export function addTeamSnapshot(dataset: FootballDataset, input: Omit<TeamSnapshot, 'id'> & { id?: string }): FootballDataset { const entry = { ...input, id: createStableId(`${input.teamId}-${input.validFrom}`, 'teamSnapshots', dataset, input.id) }; return next(dataset, { teamSnapshots: [...dataset.teamSnapshots, entry] }); }
export function setTeamAttributesSnapshot(dataset: FootballDataset, input: Omit<TeamSnapshot, 'id'> & { id?: string }): FootballDataset { const withoutCurrent = dataset.teamSnapshots.filter((snapshot) => snapshot.teamId !== input.teamId || snapshot.validFrom !== input.validFrom); return addTeamSnapshot({ ...dataset, teamSnapshots: withoutCurrent }, input); }
export function addChemistryPair(dataset: FootballDataset, chemistry: ChemistrySnapshot): FootballDataset { const entry = { ...chemistry, id: createStableId(chemistry.teamId, 'chemistry', dataset, chemistry.id) }; return next(dataset, { chemistry: [...dataset.chemistry, entry] }); }

export function addAttributeSnapshot(dataset: FootballDataset, input: Omit<PlayerSnapshot, 'id'> & { id?: string }): FootballDataset;
export function addAttributeSnapshot(dataset: FootballDataset, input: Omit<TeamSnapshot, 'id'> & { id?: string }): FootballDataset;
export function addAttributeSnapshot(dataset: FootballDataset, input: (Omit<PlayerSnapshot, 'id'> | Omit<TeamSnapshot, 'id'>) & { id?: string }): FootballDataset {
  return 'playerId' in input ? addPlayerSnapshot(dataset, input as Omit<PlayerSnapshot, 'id'> & { id?: string }) : addTeamSnapshot(dataset, input as Omit<TeamSnapshot, 'id'> & { id?: string });
}
