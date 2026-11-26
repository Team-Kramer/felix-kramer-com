import { randInt, rngFromString } from '$lib/engine/prng';
import type {
  ChemistrySnapshot,
  DatasetEvent,
  DatasetMatch,
  DatasetPlayer,
  DatasetTeam,
  FootballDataset,
  MatchAppearance,
  PlayerMembership,
  PlayerSnapshot,
  ProvenanceRecord,
  TacticalProfile,
  TeamParticipation,
  TeamSnapshot,
} from '$lib/engine/dataset/types';

const date = '2026-08-01';
const competitionId = 'competition-bundesliga';
const seasonId = 'season-bundesliga-2026-27';

const teamData: Array<[string, string, string, string, string]> = [
  ['team-bayern-munchen', 'Bayern München', 'FCB', '#dc052d', '#0066b2'],
  ['team-borussia-dortmund', 'Borussia Dortmund', 'BVB', '#fde100', '#000000'],
  ['team-bayer-leverkusen', 'Bayer Leverkusen', 'B04', '#e32221', '#000000'],
  ['team-rb-leipzig', 'RB Leipzig', 'RBL', '#dd0741', '#ffffff'],
  ['team-eintracht-frankfurt', 'Eintracht Frankfurt', 'SGE', '#e1000f', '#000000'],
  ['team-vfb-stuttgart', 'VfB Stuttgart', 'VfB', '#ffffff', '#e32221'],
  ['team-sc-freiburg', 'SC Freiburg', 'SCF', '#e2001a', '#000000'],
  ['team-borussia-mgladbach', 'Borussia Mönchengladbach', 'BMG', '#ffffff', '#000000'],
  ['team-tsg-hoffenheim', 'TSG Hoffenheim', 'TSG', '#1961ad', '#ffffff'],
  ['team-fsv-mainz-05', '1. FSV Mainz 05', 'M05', '#c8102e', '#ffffff'],
  ['team-werder-bremen', 'Werder Bremen', 'SVW', '#1d9053', '#ffffff'],
  ['team-fc-augsburg', 'FC Augsburg', 'FCA', '#ba0c2f', '#ffffff'],
  ['team-union-berlin', '1. FC Union Berlin', 'FCU', '#eb1923', '#ffffff'],
  ['team-vfl-wolfsburg', 'VfL Wolfsburg', 'WOB', '#65b32e', '#ffffff'],
  ['team-st-pauli', 'FC St. Pauli', 'STP', '#5a2a19', '#ffffff'],
  ['team-tsg-heidenheim', '1. FC Heidenheim', 'FCH', '#034694', '#e30613'],
  ['team-1-fc-koln', '1. FC Köln', 'KOE', '#ed1c24', '#ffffff'],
  ['team-1-fc-nurnberg', '1. FC Nürnberg', 'FCN', '#e32221', '#ffffff'],
];

const names = [
  ['Jonas', 'Müller'], ['Lukas', 'Schneider'], ['Noah', 'Weber'], ['Emil', 'Fischer'],
  ['Maximilian', 'Wagner'], ['Finn', 'Becker'], ['Leon', 'Hoffmann'], ['Paul', 'Schulz'],
  ['Moritz', 'Koch'], ['Elias', 'Richter'], ['Tim', 'Klein'], ['Julian', 'Wolf'],
  ['Matteo', 'Rossi'], ['Amir', 'Haddad'], ['Kofi', 'Mensah'], ['Diego', 'Santos'],
  ['Arthur', 'Dubois'], ['Milan', 'Petrovic'], ['Samir', 'Yilmaz'], ['Oliver', 'Brown'],
  ['Kacper', 'Nowak'], ['Hugo', 'Martin'], ['Nils', 'Jensen'], ['Ibrahim', 'Diallo'],
  ['Alex', 'Popescu'], ['Sven', 'Lindberg'], ['Rafael', 'Costa'], ['Marek', 'Kowalski'],
  ['Liam', 'O’Connor'], ['Kenji', 'Tanaka'],
];
const positions = ['GK', 'DEF', 'DEF', 'DEF', 'DEF', 'DEF', 'MID', 'MID', 'MID', 'MID', 'MID', 'FWD', 'FWD', 'FWD'];
const roles: Record<string, string[]> = { GK: ['sweeper-keeper'], DEF: ['ball-playing-defender', 'full-back', 'centre-back'], MID: ['deep-lying-playmaker', 'box-to-box', 'attacking-midfielder'], FWD: ['inside-forward', 'target-forward', 'pressing-forward'] };

export function seedBundesliga(): FootballDataset {
  const rng = rngFromString('felix-kramer-bundesliga-2026-27');
  const teams: DatasetTeam[] = teamData.map(([id, canonicalName, shortName, primary, secondary]) => ({ id, canonicalName, shortName, countryCode: 'DE', aliases: [], colors: { primary, secondary } }));
  const competitions = [{ id: competitionId, type: 'league' as const, countryCode: 'DE', name: 'Bundesliga', shortName: 'BL', level: 1, gender: 'male' as const, seasonIds: [seasonId] }];
  const seasons = [{ id: seasonId, competitionId, name: '2026/27', startDate: date, endDate: '2027-05-31' }];
  const teamParticipations: TeamParticipation[] = teams.map((team, i) => ({ id: `participation-bundesliga-${i + 1}`, competitionId, seasonId, teamId: team.id, status: 'active', position: i + 1, points: null, validFrom: date, validTo: null }));
  const teamSnapshots: TeamSnapshot[] = teams.map((team, i) => ({ id: `team-snapshot-${team.id}`, teamId: team.id, validFrom: date, validTo: null, rating: { elo: 1950 - i * 22, attack: 82 - Math.floor(i / 3), midfield: 84 - Math.floor(i / 2), defense: 83 - Math.floor(i / 2), goalkeeping: 78 - Math.floor(i / 3), overall: 84 - Math.floor(i / 3) }, sourceRefs: ['provenance-synthetic-generator'] }));

  const players: DatasetPlayer[] = [];
  const memberships: PlayerMembership[] = [];
  const playerSnapshots: PlayerSnapshot[] = [];
  const tacticalProfiles: TacticalProfile[] = [];
  teams.forEach((team, teamIndex) => positions.forEach((position, squadIndex) => {
    const [first, last] = names[(teamIndex * positions.length + squadIndex) % names.length];
    const playerId = `player-${team.id.replace(/^team-/, '')}-${position.toLowerCase()}-${squadIndex + 1}`;
    const nationalityCodes = teamIndex % 5 === 0 ? ['DE'] : [['DE'], ['AT'], ['FR'], ['NL'], ['PL'], ['ES'], ['GB'], ['TR']][(teamIndex + squadIndex) % 8];
    players.push({ id: playerId, canonicalName: `${first} ${last}`, dateOfBirth: `${1994 + (squadIndex % 8)}-${String((squadIndex % 12) + 1).padStart(2, '0')}-15`, nationalityCodes, positions: [position], preferredFoot: squadIndex % 3 === 0 ? 'left' : 'right', status: 'active' });
    memberships.push({ id: `membership-${playerId}-${team.id}`, playerId, teamId: team.id, role: 'player', contractType: 'permanent', squadNumber: squadIndex + 1, validFrom: date, validTo: null });
    const current = randInt(rng, 68, 94); const potential = Math.max(current + 2, randInt(rng, 72, 99));
    const mental = { composure: randInt(rng, 8, 18), decisions: randInt(rng, 8, 18), offTheBall: randInt(rng, 7, 18), positioning: randInt(rng, 8, 19), teamwork: randInt(rng, 8, 19), workRate: randInt(rng, 7, 19) };
    const physical = { acceleration: randInt(rng, 7, 19), pace: randInt(rng, 7, 19), stamina: randInt(rng, 8, 19), strength: randInt(rng, 7, 19), jumpingReach: randInt(rng, 7, 18) };
    const attributes = position === 'GK' ? { mental, physical, goalkeeping: { aerialReach: randInt(rng, 8, 19), commandOfArea: randInt(rng, 7, 18), handling: randInt(rng, 8, 19), reflexes: randInt(rng, 9, 19), oneOnOnes: randInt(rng, 7, 18), kicking: randInt(rng, 7, 18) } } : { technical: { finishing: randInt(rng, 7, 19), firstTouch: randInt(rng, 8, 19), heading: randInt(rng, 7, 18), passing: randInt(rng, 8, 19), technique: randInt(rng, 8, 19) }, mental, physical, goalkeeping: null };
    playerSnapshots.push({ id: `player-snapshot-${playerId}`, playerId, validFrom: date, validTo: null, scale: { min: 1, max: 20 }, ability: { current, potential, confidence: 0.72 }, attributes, weaknesses: [{ type: squadIndex % 3 === 0 ? 'injury-prone' : 'aerial-duels', severity: Number((0.2 + rng() * 0.35).toFixed(2)) }], traits: squadIndex % 4 === 0 ? ['leader', 'professional'] : ['team-player'], assessmentType: 'estimated', sourceRefs: ['provenance-synthetic-generator'] });
    roles[position].slice(0, squadIndex % 2 === 0 ? 2 : 1).forEach((role, roleIndex) => tacticalProfiles.push({ id: `tactical-${playerId}-${roleIndex + 1}`, playerId, validFrom: date, validTo: null, role, position, roleFit: Number((0.55 + rng() * 0.4).toFixed(2)) }));
  }));

  const provenance: ProvenanceRecord[] = Array.from({ length: 10 }, (_, i) => ({ id: `provenance-synthetic-${i + 1}`, type: 'synthetic', provider: 'Felix Kramer', name: i === 0 ? 'Synthetic generator' : `Synthetic generation batch ${i + 1}`, retrievedAt: '2026-08-01T00:00:00Z', license: 'CC0-1.0', method: 'Deterministic generated catalog for editor and simulation testing.', notes: 'Fictional data; not affiliated with any real club or player.' }));
  // Keep the canonical source reference used above stable while documenting ten batches.
  provenance[0].id = 'provenance-synthetic-generator';

  const matches: DatasetMatch[] = [];
  for (let i = 0; i < 30; i++) { const home = (i * 2) % teams.length; const away = (home + 1 + (i % 5)) % teams.length; matches.push({ id: `match-bundesliga-${String(i + 1).padStart(2, '0')}`, competitionId, seasonId, dateTime: `2026-08-${String(21 + Math.floor(i / 9)).padStart(2, '0')}T${String(15 + (i % 3) * 2).padStart(2, '0')}:30:00Z`, homeTeamId: teams[home].id, awayTeamId: teams[away].id, status: 'finished', score: { home: (i * 3 + 1) % 4, away: (i * 2 + 2) % 3 } }); }
  const matchAppearances: MatchAppearance[] = []; const events: DatasetEvent[] = [];
  matches.forEach((match, matchIndex) => { for (let j = 0; j < 17; j++) { const player = players[(matchIndex * 17 + j) % players.length]; const team = j % 2 === 0 ? match.homeTeamId : match.awayTeamId; matchAppearances.push({ id: `appearance-${match.id}-${j + 1}`, matchId: match.id, playerId: player.id, teamId: team, started: j < 11, minutes: j < 11 ? 90 : randInt(rng, 8, 35), position: player.positions[0], rating: Number((6.2 + rng() * 2.5).toFixed(1)), stats: { passes: randInt(rng, 8, 64) } }); } const scorer = players[(matchIndex * 7) % players.length]; events.push({ id: `event-${match.id}-goal`, matchId: match.id, teamId: match.homeTeamId, actorPlayerId: scorer.id, type: 'goal', period: 1, minute: 20 + (matchIndex % 60) }); events.push({ id: `event-${match.id}-assist`, matchId: match.id, teamId: match.homeTeamId, actorPlayerId: players[(matchIndex * 7 + 1) % players.length].id, type: 'assist', period: 1, minute: 19 + (matchIndex % 60) }); });
  const chemistry: ChemistrySnapshot[] = teams.map((team, i) => { const squadPlayers = players.slice(i * positions.length, (i + 1) * positions.length); return { id: `chemistry-${team.id}`, teamId: team.id, validFrom: date, validTo: null, overall: Number((0.6 + rng() * 0.3).toFixed(2)), pairwise: [0, 1, 2, 3].map((offset) => ({ playerA: squadPlayers[offset].id, playerB: squadPlayers[offset + 1].id, affinity: Number((0.55 + rng() * 0.4).toFixed(2)), passingCompatibility: Number((0.55 + rng() * 0.4).toFixed(2)), movementCompatibility: Number((0.55 + rng() * 0.4).toFixed(2)), sampleSize: 12 })) }; });
  return { $schema: 'https://felix-kramer.com/schemas/football-dataset-v1.json', dataset: { id: 'bundesliga-2026-27-synthetic', name: 'Synthetic Bundesliga 2026/27', schemaVersion: '1.0.0', datasetVersion: '1.0.0', createdAt: '2026-08-01T00:00:00Z', updatedAt: '2026-08-01T00:00:00Z', sourceType: 'synthetic-fixture', defaultTimeZone: 'Europe/Berlin', defaultCoordinateSystem: 'normalized-pitch', units: { distance: 'km', speed: 'kmh', duration: 'minutes' } }, competitions, seasons, teams, teamParticipations, players, memberships, teamSnapshots, playerSnapshots, tacticalProfiles, matches, matchAppearances, events, heatmaps: [], tracking: [], chemistry, provenance };
}
