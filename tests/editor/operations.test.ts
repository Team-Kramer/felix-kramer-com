import { describe, expect, it } from 'vitest';
import { createMinimalDataset } from '$lib/engine/dataset/fixture';
import { parseDatasetJson } from '$lib/engine/dataset/import';
import { serializeDataset } from '$lib/engine/dataset/export';
import { DatasetValidationError, validateDataset } from '$lib/engine/dataset/schema';
import { addCompetition, addMembership, addPlayer, addTeam, createStableId, removePlayer, updateTeam, addPlayerSnapshot } from '$lib/dataset-editor/operations';

describe('dataset editor operations', () => {
 it('adds, updates and removes core entities without mutating input', () => {
  const original = { ...createMinimalDataset(), competitions: [], players: [] };
  const withCompetition = addCompetition(original, { name: 'Premier League', shortName: 'PL', type: 'league', countryCode: 'GB', level: 1, gender: 'male', seasonIds: [] });
  const withTeam = addTeam(withCompetition, { canonicalName: 'New Club', shortName: 'NC', countryCode: 'GB', aliases: [] });
  const withPlayer = addPlayer(withTeam, { canonicalName: 'New Player', nationalityCodes: ['GB'], positions: ['ST'], status: 'active' });
  expect(withPlayer.competitions).toHaveLength(original.competitions.length + 1);
  expect(withPlayer.players).toHaveLength(1);
  const updated = updateTeam(withPlayer, withTeam.teams.at(-1)!.id, { shortName: 'NEW' });
  expect(updated.teams.at(-1)?.shortName).toBe('NEW');
  expect(removePlayer(updated, withPlayer.players[0].id).players).toHaveLength(0);
 });
 it('creates collision-safe stable kebab IDs', () => {
  const dataset = createMinimalDataset();
  const first = createStableId('Bayern München', 'teams', dataset);
  const changed = addTeam(dataset, { id: first, canonicalName: 'Bayern München', shortName: 'FCB', countryCode: 'DE', aliases: [] });
  expect(createStableId('Bayern München', 'teams', changed)).toBe(`${first}-2`);
 });
 it('adds memberships and rejects invalid snapshot intervals through validation', () => {
  let dataset = addPlayer({ ...createMinimalDataset(), players: [], memberships: [], playerSnapshots: [] }, { canonicalName: 'A', nationalityCodes: [], positions: [], status: 'unknown' });
  dataset = addMembership(dataset, { playerId: dataset.players[0].id, teamId: dataset.teams[0].id, role: 'player', validFrom: '2026-01-01', validTo: null });
  expect(dataset.memberships).toHaveLength(1);
  const invalid = addPlayerSnapshot(dataset, { playerId: dataset.players[0].id, validFrom: '2027-01-01', validTo: '2026-01-01', scale: { min: 1, max: 20 }, attributes: {}, assessmentType: 'estimated' });
  expect(() => validateDataset(invalid)).toThrow(DatasetValidationError);
 });
 it('round-trips serialized datasets', () => {
  const dataset = createMinimalDataset();
  expect(parseDatasetJson(serializeDataset(dataset))).toEqual(dataset);
 });
});
