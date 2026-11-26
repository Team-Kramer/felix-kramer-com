import { describe, expect, it } from 'vitest';
import { createDetailedFixture } from '$lib/engine/dataset/fixture';
import { serializeDataset, type DatasetExportProfile } from '$lib/engine/dataset/export';
import { parseDatasetJson } from '$lib/engine/dataset/import';

const profiles: DatasetExportProfile[] = ['minimal', 'simulation', 'detailed', 'historical', 'internal-complete'];

describe('dataset export profiles', () => {
	it.each(profiles)('round-trips the %s profile without a server', (profile) => {
		const source = createDetailedFixture();
		const exported = serializeDataset(source, profile);
		const imported = parseDatasetJson(exported);
		expect(imported.dataset.id).toBe(source.dataset.id);
		expect(imported.teams).toHaveLength(source.teams.length);
	});

	it('does not mutate the source dataset', () => {
		const source = createDetailedFixture();
		const before = JSON.stringify(source);
		serializeDataset(source, 'simulation');
		expect(JSON.stringify(source)).toBe(before);
	});
});
