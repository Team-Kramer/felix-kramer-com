import { describe, expect, it } from 'vitest';
import { seedBundesliga } from '../../src/lib/dataset-editor/seed-bundesliga';
import { validateDataset } from '../../src/lib/engine/dataset/schema';

describe('seedBundesliga', () => {
  it('creates a valid deterministic detailed catalog', () => {
    const dataset = seedBundesliga();
    expect(() => validateDataset(dataset)).not.toThrow();
    expect(dataset.teams).toHaveLength(18);
    expect(dataset.players.length).toBeGreaterThanOrEqual(250);
    expect(dataset.memberships).toHaveLength(dataset.players.length);
    expect(dataset.playerSnapshots.every((snapshot) => snapshot.assessmentType === 'estimated')).toBe(true);
    expect(dataset.chemistry).toHaveLength(18);
    expect(dataset.matches.length).toBeGreaterThanOrEqual(30);
    expect(JSON.parse(JSON.stringify(dataset))).toEqual(dataset);
  });
});
