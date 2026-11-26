import { validateDataset } from './schema';
import type { FootballDataset } from './types';

export type DatasetExportProfile = 'minimal' | 'simulation' | 'detailed' | 'historical' | 'internal-complete';

const emptyCollections = (): Partial<FootballDataset> => ({
	competitions: [], seasons: [], teamParticipations: [], players: [], memberships: [],
	teamSnapshots: [], playerSnapshots: [], tacticalProfiles: [], matches: [],
	matchAppearances: [], events: [], heatmaps: [], tracking: [], chemistry: [], provenance: [],
});

function projectDataset(dataset: FootballDataset, profile: DatasetExportProfile): FootballDataset {
	const source = structuredClone(dataset);
	if (profile === 'internal-complete') return source;

	const base = { ...source, ...emptyCollections() } as FootballDataset;
	base.teams = source.teams.map((team) => {
		const snapshot = source.teamSnapshots.find((item) => item.teamId === team.id && item.validTo === null) ??
			source.teamSnapshots.find((item) => item.teamId === team.id);
		return {
			id: team.id,
			canonicalName: team.canonicalName,
			shortName: team.shortName,
			countryCode: team.countryCode,
			aliases: [],
			colors: team.colors,
			// These aliases make the minimal export convenient for non-engine consumers.
			name: team.canonicalName,
			short: team.shortName,
			elo: snapshot?.rating.elo,
			color: team.colors?.primary,
		};
	});

	if (profile === 'minimal') return validateDataset(base);

	base.competitions = source.competitions.map((item) => ({ ...item }));
	base.seasons = source.seasons.map((item) => ({ ...item }));
	base.teamParticipations = source.teamParticipations.map((item) => ({ ...item }));
	base.players = source.players.map((player) => ({ ...player }));
	base.memberships = source.memberships.map((item) => ({ ...item }));
	base.teamSnapshots = source.teamSnapshots.map((item) => ({ ...item, sourceRefs: undefined }));
	base.playerSnapshots = source.playerSnapshots.map((item) => ({
		...item,
		weaknesses: profile === 'simulation' ? undefined : item.weaknesses,
		traits: profile === 'simulation' ? undefined : item.traits,
		sourceRefs: undefined,
	}));
	base.tacticalProfiles = source.tacticalProfiles.map((item) => ({ ...item }));

	if (profile === 'simulation' || profile === 'detailed') {
		base.chemistry = profile === 'detailed' ? source.chemistry.map((item) => ({ ...item, sourceRefs: undefined })) : [];
		base.heatmaps = profile === 'detailed' ? source.heatmaps.map((item) => ({ ...item })) : [];
		base.tracking = profile === 'detailed' ? source.tracking.map((item) => ({ ...item })) : [];
		if (profile === 'detailed') {
			// Spatial records may point at a match, so retain the match context they need.
			base.matches = source.matches.map((item) => ({ ...item }));
			base.matchAppearances = source.matchAppearances.map((item) => ({ ...item }));
		}
	}
	if (profile === 'historical') {
		base.chemistry = source.chemistry.map((item) => ({ ...item, sourceRefs: undefined }));
		base.heatmaps = source.heatmaps.map((item) => ({ ...item }));
		base.tracking = source.tracking.map((item) => ({ ...item }));
		base.matches = source.matches.map((item) => ({ ...item }));
		base.matchAppearances = source.matchAppearances.map((item) => ({ ...item }));
		base.events = source.events.map((item) => ({ ...item }));
	}

	return validateDataset(base);
}

/** Minimal and simulation exports are standalone-valid; all profiles are deep-copy projections. */
export function serializeDataset(
	dataset: FootballDataset,
	prettyOrProfile: boolean | DatasetExportProfile = true,
	profile: DatasetExportProfile = 'internal-complete'
): string {
	const pretty = typeof prettyOrProfile === 'boolean' ? prettyOrProfile : true;
	const selectedProfile = typeof prettyOrProfile === 'string' ? prettyOrProfile : profile;
	const projected = projectDataset(validateDataset(dataset), selectedProfile);
	return JSON.stringify(projected, null, pretty ? 2 : 0);
}
