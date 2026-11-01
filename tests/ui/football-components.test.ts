import { render, screen, fireEvent } from '@testing-library/svelte';
import { describe, expect, it } from 'vitest';
import type { Team } from '$lib/engine/types';
import { createSingleBracket } from '$lib/engine/bracket';
import { leagueTable, roundRobin } from '$lib/engine/round-robin';
import { simulateGroupStage, groupDraw } from '$lib/engine/groups';
import { FORMATIONS } from '$lib/engine/formation';
import type { Player } from '$lib/engine/draft';
import type { CampaignResult } from '$lib/engine/campaign';

import MatchCard from '$lib/ui/match-card/match-card.svelte';
import LeagueTable from '$lib/ui/league-table/league-table.svelte';
import Bracket from '$lib/ui/bracket/bracket.svelte';
import GroupTable from '$lib/ui/group-table/group-table.svelte';
import FormationBuilder from '$lib/ui/formation-builder/formation-builder.svelte';
import ProbabilityBar from '$lib/ui/probability-bar/probability-bar.svelte';
import ResultCard from '$lib/ui/result-card/result-card.svelte';
import ChaosSlider from '$lib/ui/chaos-slider/chaos-slider.svelte';

const teams: Team[] = [
	{ id: 'ger', name: 'Deutschland', elo: 1800, color: '#111', code: 'GER' },
	{ id: 'bra', name: 'Brasilien', elo: 1750, color: '#ff0', code: 'BRA' },
	{ id: 'fra', name: 'Frankreich', elo: 1780, color: '#00f', code: 'FRA' },
	{ id: 'arg', name: 'Argentinien', elo: 1760, color: '#9cf', code: 'ARG' }
];
const teamMap = new Map(teams.map((t) => [t.id, t]));

describe('match-card', () => {
	it('renders both team names and a pending score', () => {
		render(MatchCard, { props: { home: teams[0], away: teams[1] } });
		expect(screen.getByText('Deutschland')).toBeDefined();
		expect(screen.getByText('Brasilien')).toBeDefined();
	});

	it('shows the score when a result is set', () => {
		const { container } = render(MatchCard, {
			props: { home: teams[0], away: teams[1], homeScore: 2, awayScore: 1 }
		});
		expect(container.querySelector('[aria-label="Ergebnis 2 zu 1"]')).not.toBeNull();
	});

	it('renders the probability strip when given', () => {
		render(MatchCard, {
			props: {
				home: teams[0],
				away: teams[1],
				probabilities: { home: 0.5, draw: 0.3, away: 0.2 }
			}
		});
		expect(screen.getByText('50%')).toBeDefined();
		expect(screen.getByText('30%')).toBeDefined();
		expect(screen.getByText('20%')).toBeDefined();
	});
});

describe('league-table', () => {
	const table = leagueTable(teams, roundRobin(teams.map((t) => t.id)));

	it('renders one row per team', () => {
		render(LeagueTable, { props: { table } });
		for (const t of teams) expect(screen.getByText(t.name)).toBeDefined();
	});

	it('shows goal difference with sign', () => {
		const rows = table.map((r) => ({ ...r, goalDiff: 3 }));
		render(LeagueTable, { props: { table: rows } });
		expect(screen.getAllByText('+3').length).toBe(4);
	});

	it('renders zone markers without crashing', () => {
		const zones = new Map([[teams[0].id, 'title']]);
		render(LeagueTable, { props: { table, zones } });
		expect(screen.getByText('Deutschland')).toBeDefined();
	});
});

describe('bracket', () => {
	it('renders all teams of a single-elimination bracket', () => {
		const matches = createSingleBracket(teams.map((t) => t.id));
		render(Bracket, { props: { matches, teams: teamMap } });
		expect(screen.getByText('Deutschland')).toBeDefined();
		expect(screen.getByText('Brasilien')).toBeDefined();
	});

	it('shows the champion column when set', () => {
		const matches = createSingleBracket(teams.map((t) => t.id));
		render(Bracket, { props: { matches, teams: teamMap, championId: 'ger' } });
		expect(screen.getByText('Sieger')).toBeDefined();
	});
});

describe('group-table', () => {
	it('renders each group with its table', () => {
		const groups = groupDraw(teams, 2, 2);
		const result = simulateGroupStage(
			groups.map((g) => g.map((t) => t.id)),
			() => 0.5,
			(id) => teamMap.get(id)!.elo,
			0
		);
		render(GroupTable, { props: { result, teams: teamMap } });
		expect(screen.getByText('Gruppe A')).toBeDefined();
		expect(screen.getByText('Gruppe B')).toBeDefined();
		expect(screen.getByText('Deutschland')).toBeDefined();
	});
});

describe('formation-builder', () => {
	it('renders all 10 field slots plus the GK', () => {
		const formation = FORMATIONS[0];
		render(FormationBuilder, { props: { formationId: formation.id } });
		expect(screen.getByText('GK')).toBeDefined();
		for (const slot of formation.slots) {
			expect(screen.getAllByText(slot.label).length).toBeGreaterThan(0);
		}
	});

	it('shows placed player names and ratings', () => {
		const player: Player = {
			id: 'p1',
			name: 'Müller',
			nation: 'ger',
			wcYear: 2022,
			position: 'FWD',
			rating: 91
		};
		render(FormationBuilder, {
			props: { formationId: '4-3-3', players: { ST: player } }
		});
		expect(screen.getByText('Müller')).toBeDefined();
		expect(screen.getByText('91')).toBeDefined();
	});
});

describe('probability-bar', () => {
	it('renders the percentage and progressbar role', () => {
		render(ProbabilityBar, { props: { label: 'Deutschland', value: 0.42 } });
		expect(screen.getByRole('progressbar', { name: 'Deutschland' })).toHaveAttribute(
			'aria-valuenow',
			'42'
		);
		expect(screen.getByText('42%')).toBeDefined();
	});

	it('clamps out-of-range values', () => {
		render(ProbabilityBar, { props: { label: 'X', value: 1.5 } });
		expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '100');
	});
});

describe('result-card', () => {
	const campaign: CampaignResult = {
		userTeamId: 'user',
		champion: 'user',
		placement: 1,
		record: { played: 4, won: 3, drawn: 1, lost: 0, goalsFor: 9, goalsAgainst: 3 },
		overallRating: 87.5,
		matches: [
			{ opponent: 'Brasilien', home: true, homeScore: 2, awayScore: 1, won: true, drawn: false },
			{ opponent: 'Frankreich', home: false, homeScore: 1, awayScore: 1, won: false, drawn: true }
		]
	};

	it('renders the placement badge and rating', () => {
		render(ResultCard, { props: { result: campaign } });
		expect(screen.getByText('🏆 Meister')).toBeDefined();
		expect(screen.getByText('87.5')).toBeDefined();
	});

	it('lists the matches with scores', () => {
		render(ResultCard, { props: { result: campaign } });
		expect(screen.getByText('2:1')).toBeDefined();
		expect(screen.getByText('1:1')).toBeDefined();
	});
});

describe('chaos-slider', () => {
	it('renders the current value and updates on input', async () => {
		render(ChaosSlider, { props: { value: 0 } });
		const input = screen.getByRole('slider');
		expect(input).toHaveValue('0');
		await fireEvent.input(input, { target: { value: 50 } });
		expect(input).toHaveValue('50');
	});

	it('exposes the label', () => {
		render(ChaosSlider, { props: { value: 10, label: 'Chaos-Faktor' } });
		expect(screen.getByLabelText('Chaos-Faktor')).toBeDefined();
	});
});
