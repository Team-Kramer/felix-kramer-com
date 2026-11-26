export type DatasetSourceType =
	| 'synthetic-fixture'
	| 'user-provided'
	| 'internal-tool'
	| 'imported';

export type AssessmentType = 'observed' | 'scouted' | 'derived' | 'estimated' | 'imported';

export interface DatasetUnits {
	distance: 'km';
	speed: 'kmh';
	duration: 'minutes';
}

export interface DatasetMeta {
	id: string;
	name: string;
	schemaVersion: string;
	datasetVersion: string;
	createdAt: string;
	updatedAt: string;
	sourceType: DatasetSourceType;
	defaultTimeZone: string;
	defaultCoordinateSystem: 'normalized-pitch';
	units: DatasetUnits;
}

export interface DatasetCompetition {
	id: string;
	type: 'league' | 'cup' | 'tournament';
	countryCode: string;
	name: string;
	shortName: string;
	level: number;
	gender: 'male' | 'female' | 'mixed';
	seasonIds: string[];
}

export interface DatasetSeason {
	id: string;
	competitionId: string;
	name: string;
	startDate: string;
	endDate: string;
}

export interface DatasetTeam {
	id: string;
	canonicalName: string;
	shortName: string;
	countryCode: string;
	aliases: string[];
	colors?: {
		primary: string;
		secondary?: string;
	};
}

export interface TeamParticipation {
	id: string;
	competitionId: string;
	seasonId: string;
	teamId: string;
	status: 'active' | 'completed' | 'withdrawn';
	position: number | null;
	points: number | null;
	validFrom: string;
	validTo: string | null;
}

export interface DatasetPlayer {
	id: string;
	canonicalName: string;
	dateOfBirth?: string;
	nationalityCodes: string[];
	positions: string[];
	preferredFoot?: 'left' | 'right' | 'both';
	status: 'active' | 'retired' | 'unknown' | 'archived';
}

export interface PlayerMembership {
	id: string;
	playerId: string;
	teamId: string;
	role: 'player' | 'reserve' | 'national-team';
	contractType?: 'permanent' | 'loan' | 'free-agent' | 'unknown';
	squadNumber?: number;
	validFrom: string;
	validTo: string | null;
}

export interface TeamSnapshot {
	id: string;
	teamId: string;
	validFrom: string;
	validTo: string | null;
	rating: {
		elo: number;
		attack?: number;
		midfield?: number;
		defense?: number;
		goalkeeping?: number;
		overall?: number;
	};
	style?: Record<string, number>;
	formationPreferences?: Array<{ formation: string; usage: number }>;
	sourceRefs?: string[];
}

export interface PlayerSnapshot {
	id: string;
	playerId: string;
	validFrom: string;
	validTo: string | null;
	scale: { min: number; max: number };
	ability?: {
		current?: number;
		potential?: number;
		confidence?: number;
	};
	attributes: {
		technical?: Record<string, number>;
		mental?: Record<string, number>;
		physical?: Record<string, number>;
		goalkeeping?: Record<string, number> | null;
	};
	weaknesses?: Array<{ type: string; severity: number; confidence?: number }>;
	traits?: string[];
	assessmentType: AssessmentType;
	sourceRefs?: string[];
}

export interface TacticalProfile {
	id: string;
	playerId: string;
	validFrom: string;
	validTo: string | null;
	role: string;
	position: string;
	roleFit: number;
	attributes?: Record<string, number>;
	preferredZones?: string[];
}

export interface DatasetMatch {
	id: string;
	competitionId: string;
	seasonId: string;
	dateTime: string;
	homeTeamId: string;
	awayTeamId: string;
	status: 'scheduled' | 'live' | 'finished' | 'postponed' | 'cancelled';
	score?: { home: number; away: number };
}

export interface MatchAppearance {
	id: string;
	matchId: string;
	playerId: string;
	teamId: string;
	started: boolean;
	minutes: number;
	position?: string;
	rating?: number;
	stats?: Record<string, number>;
	heatmapRef?: string;
	trackingRef?: string;
}

export interface DatasetEvent {
	id: string;
	matchId: string;
	teamId?: string;
	actorPlayerId?: string;
	type: string;
	period?: number;
	minute?: number;
	location?: { x: number; y: number };
	[key: string]: unknown;
}

export interface Heatmap {
	id: string;
	subjectType: 'player' | 'team';
	subjectId: string;
	scope: 'match' | 'season' | 'rolling-window' | 'career';
	matchId?: string;
	seasonId?: string;
	coordinateSystem: 'normalized-pitch';
	resolution: { width: number; height: number };
	cells: number[][];
	normalization?: { method: string; sum: number };
}

export interface TrackingReference {
	id: string;
	matchId?: string;
	seasonId?: string;
	subjectType: 'player' | 'team';
	subjectId: string;
	coordinateSystem: 'normalized-pitch';
	samplingHz: number;
	pointCount: number;
	storage: {
		format: 'jsonl';
		path: string;
		compression: 'gzip' | 'brotli' | 'none';
		checksum?: string;
	};
}

export interface ChemistrySnapshot {
	id: string;
	teamId: string;
	validFrom: string;
	validTo: string | null;
	overall: number;
	factors?: Record<string, number>;
	pairwise?: Array<{
		playerA: string;
		playerB: string;
		affinity: number;
		passingCompatibility?: number;
		movementCompatibility?: number;
		sampleSize?: number;
	}>;
	modelVersion?: string;
	sourceRefs?: string[];
}

export interface ProvenanceRecord {
	id: string;
	type: string;
	provider: string;
	name: string;
	retrievedAt?: string;
	license: string;
	method: string;
	sourceUrl?: string;
	notes?: string;
}

export interface FootballDataset {
	$schema: 'https://felix-kramer.com/schemas/football-dataset-v1.json';
	dataset: DatasetMeta;
	competitions: DatasetCompetition[];
	seasons: DatasetSeason[];
	teams: DatasetTeam[];
	teamParticipations: TeamParticipation[];
	players: DatasetPlayer[];
	memberships: PlayerMembership[];
	teamSnapshots: TeamSnapshot[];
	playerSnapshots: PlayerSnapshot[];
	tacticalProfiles: TacticalProfile[];
	matches: DatasetMatch[];
	matchAppearances: MatchAppearance[];
	events: DatasetEvent[];
	heatmaps: Heatmap[];
	tracking: TrackingReference[];
	chemistry: ChemistrySnapshot[];
	provenance: ProvenanceRecord[];
}
