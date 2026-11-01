<script lang="ts">
	import {
		Button,
		Select,
		ChaosSlider,
		SectionTitle,
		GroupTable,
		Bracket,
		LeagueTable,
		MonteCarloPanel,
		Banner
	} from '$lib/ui';
	import { useI18n } from '$lib/i18n';
	import { nations, toTeam } from '$lib/engine/data';
	import {
		createTournament,
		advance,
		runTournament,
		encodeShare,
		decodeShare,
		type TournamentConfig,
		type TournamentFormat,
		type TournamentState
	} from '$lib/engine/tournament';
	import type { SwissStanding } from '$lib/engine/swiss';
	import type { Team } from '$lib/engine/types';

	const i18n = useI18n();
	const lang = $derived(i18n.lang);
	const allTeams = $derived(nations.map((n) => toTeam(n, lang)));
	const teamById = $derived(new Map(allTeams.map((t) => [t.id, t])));

	interface Preset {
		id: string;
		label: string;
		format: TournamentFormat;
		teamCount: number;
		config: Partial<TournamentConfig>;
	}

	const presets: Preset[] = [
		{
			id: 'wc2026',
			label: 'WM 2026 (48)',
			format: 'wc2026',
			teamCount: 48,
			config: { groupCount: 12, groupSize: 4, topN: 2, bestThirds: 8 }
		},
		{
			id: 'euro',
			label: 'EM (24)',
			format: 'groups-knockout',
			teamCount: 24,
			config: { groupCount: 6, groupSize: 4, topN: 2, bestThirds: 4 }
		},
		{
			id: 'ucl',
			label: 'Champions League (32)',
			format: 'groups-knockout',
			teamCount: 32,
			config: { groupCount: 8, groupSize: 4, topN: 2, bestThirds: 0 }
		},
		{
			id: 'facup',
			label: 'FA Cup (16)',
			format: 'single',
			teamCount: 16,
			config: {}
		},
		{
			id: 'swiss',
			label: 'Schweizer System (16)',
			format: 'swiss',
			teamCount: 16,
			config: { totalRounds: 5 }
		}
	];

	let presetId = $state('wc2026');
	let chaos = $state(0);
	let seed = $state('felix');
	let teams = $state<Team[]>([]);
	let tournament = $state<TournamentState | null>(null);
	let copied = $state(false);

	function applyPreset(id: string) {
		const preset = presets.find((p) => p.id === id);
		if (!preset) return;
		teams = allTeams.slice(0, preset.teamCount);
		tournament = null;
	}

	function addTeam(id: string) {
		if (!id || teams.some((t) => t.id === id)) return;
		const team = teamById.get(id);
		if (team) teams = [...teams, team];
		tournament = null;
	}

	function removeTeam(id: string) {
		teams = teams.filter((t) => t.id !== id);
		tournament = null;
	}

	function buildConfig(): TournamentConfig {
		const preset = presets.find((p) => p.id === presetId)!;
		return {
			format: preset.format,
			teams,
			seed,
			chaos,
			...preset.config
		};
	}

	function simulateAll() {
		if (teams.length < 2) return;
		tournament = runTournament(buildConfig());
	}

	function step() {
		if (!tournament) {
			tournament = createTournament(buildConfig());
			return;
		}
		if (tournament.phase !== 'done') tournament = advance(tournament);
	}

	function reset() {
		tournament = null;
	}

	const shareUrl = $derived(
		tournament
			? `${window.location.origin}/tournament?s=${encodeShare(tournament)}`
			: ''
	);

	function copyShare() {
		if (!shareUrl) return;
		void navigator.clipboard.writeText(shareUrl);
		copied = true;
		setTimeout(() => (copied = false), 2000);
	}

	// Restore from share link (client-only).
	$effect(() => {
		if (typeof window === 'undefined') return;
		const s = new URLSearchParams(window.location.search).get('s');
		if (s) {
			try {
				const restored = decodeShare(s);
				tournament = restored;
				teams = restored.teams;
			} catch {
				// ignore malformed share links
			}
		}
	});

	// Initialize with the default preset on first client render.
	$effect(() => {
		if (typeof window === 'undefined') return;
		if (teams.length === 0) applyPreset(presetId);
	});

	const teamOptions = $derived(
		allTeams
			.filter((t) => !teams.some((x) => x.id === t.id))
			.map((t) => ({ value: t.id, label: t.name }))
	);

	const hasGroups = $derived(
		tournament && (tournament.config.format === 'wc2026' || tournament.config.format === 'groups-knockout')
	);
	const isSwiss = $derived(tournament?.config.format === 'swiss');
	const isLeague = $derived(tournament?.config.format === 'league');

	function sortSwiss(standings: SwissStanding[]): SwissStanding[] {
		return [...standings].sort((a, b) => {
			if (b.points !== a.points) return b.points - a.points;
			if (b.goalDiff !== a.goalDiff) return b.goalDiff - a.goalDiff;
			if (b.goalsFor !== a.goalsFor) return b.goalsFor - a.goalsFor;
			return a.name.localeCompare(b.name);
		});
	}

	const swissStandings = $derived(tournament?.swiss ? sortSwiss(tournament.swiss.standings) : []);
</script>

<svelte:head>
	<title>{i18n.t('tournament.title')} — Felix Kramer</title>
	<meta name="description" content={i18n.t('tournament.subtitle')} />
</svelte:head>

<div class="mx-auto max-w-6xl px-4 py-12">
	<SectionTitle emoji="🏆" title={i18n.t('tournament.title')} />
	<p class="mt-2 max-w-2xl text-ink-secondary">{i18n.t('tournament.subtitle')}</p>

	<!-- Config -->
	<div class="mt-8 grid gap-4 md:grid-cols-3">
		<Select
			id="preset"
			label={i18n.t('tournament.preset')}
			value={presetId}
			options={presets.map((p) => ({ value: p.id, label: p.label }))}
			onchange={applyPreset}
		/>
		<Select
			id="add-team"
			label={i18n.t('common.add')}
			value=""
			options={[{ value: '', label: '—' }, ...teamOptions]}
			onchange={addTeam}
		/>
		<div class="rounded-lg border border-line bg-surface p-4">
			<ChaosSlider bind:value={chaos} label={i18n.t('common.chaos')} />
		</div>
	</div>

	<!-- Team chips -->
	<div class="mt-4 flex flex-wrap gap-1.5" aria-label={i18n.t('common.teams')}>
		{#each teams as team (team.id)}
			<span class="inline-flex items-center gap-1.5 rounded-full border border-line bg-surface px-2.5 py-1 text-xs">
				{#if team.color}<span class="h-2 w-2 rounded-full" style:background-color="{team.color}" aria-hidden="true"></span>{/if}
				{team.name}
				<button
					type="button"
					class="text-ink-tertiary hover:text-coral"
					aria-label="{i18n.t('common.remove')} {team.name}"
					onclick={() => removeTeam(team.id)}
				>
					<span class="material-symbols-outlined text-sm" aria-hidden="true">close</span>
				</button>
			</span>
		{/each}
	</div>

	<!-- Actions -->
	<div class="mt-6 flex flex-wrap items-center gap-3">
		<Button onclick={simulateAll} disabled={teams.length < 2}>
			{i18n.t('common.simulateAll')}
		</Button>
		<Button variant="secondary" onclick={step} disabled={teams.length < 2}>
			{i18n.t('common.stepByStep')}
		</Button>
		{#if tournament}
			<Button variant="icon-outline" aria-label={i18n.t('common.reset')} onclick={reset}>
				<span class="material-symbols-outlined" aria-hidden="true">replay</span>
			</Button>
			<Button variant="secondary" onclick={copyShare}>
				{copied ? i18n.t('common.copied') : i18n.t('common.copyLink')}
			</Button>
		{/if}
	</div>

	{#if teams.length < 2}
		<div class="mt-8">
			<Banner variant="warning" message={i18n.t('common.teams') + ': ' + teams.length} />
		</div>
	{/if}

	<!-- Results -->
	{#if tournament}
		<div class="mt-10 space-y-10">
			{#if tournament.champion}
				<div class="glow-border rounded-2xl bg-surface p-6 text-center">
					<p class="text-caption font-semibold uppercase tracking-wide text-ink-tertiary">
						{i18n.t('tournament.champion')}
					</p>
					<p class="mt-2 text-headline-lg text-gradient-gold">
						{teamById.get(tournament.champion)?.name ?? tournament.champion}
					</p>
				</div>
			{/if}

			{#if hasGroups && tournament.groupResults}
				<section>
					<SectionTitle emoji="📊" title={i18n.t('tournament.groups')} />
					<div class="mt-4">
						<GroupTable
							result={tournament.groupResults}
							teams={teamById}
							qualifying={tournament.config.topN ?? 2}
						/>
					</div>
				</section>
			{/if}

			{#if tournament.bracket}
				<section>
					<SectionTitle emoji="🎯" title={i18n.t('tournament.knockout')} />
					<div class="mt-4 overflow-x-auto">
						<Bracket matches={tournament.bracket} teams={teamById} championId={tournament.champion} />
					</div>
				</section>
			{/if}

			{#if isSwiss && tournament.swiss}
				<section>
					<SectionTitle emoji="🏁" title={i18n.t('common.swiss')} />
					<div class="mt-4 overflow-x-auto rounded-lg border border-line bg-surface">
						<table class="w-full border-collapse text-left text-sm">
							<thead>
								<tr class="border-b border-line text-ink-tertiary">
									<th class="px-3 py-2">#</th>
									<th class="px-3 py-2">{i18n.t('common.teams')}</th>
									<th class="px-3 py-2 text-center">{i18n.t('common.points')}</th>
									<th class="px-3 py-2 text-center">{i18n.t('common.gd')}</th>
								</tr>
							</thead>
							<tbody>
								{#each swissStandings as s, i (s.id)}
									<tr class="border-b border-line last:border-0">
										<td class="px-3 py-2 text-ink-tertiary">{i + 1}</td>
										<td class="px-3 py-2">{teamById.get(s.id)?.name ?? s.name}</td>
										<td class="px-3 py-2 text-center font-mono tabular-nums">{s.points}</td>
										<td class="px-3 py-2 text-center font-mono tabular-nums">{s.goalDiff}</td>
									</tr>
								{/each}
							</tbody>
						</table>
					</div>
				</section>
			{/if}

			{#if isLeague && tournament.table}
				<section>
					<SectionTitle emoji="📋" title={i18n.t('common.table')} />
					<div class="mt-4">
						<LeagueTable table={tournament.table} />
					</div>
				</section>
			{/if}

			<section>
				<SectionTitle emoji="🎲" title={i18n.t('tournament.monteCarlo')} />
				<div class="mt-4">
					<MonteCarloPanel
						format={tournament.config.format}
						teams={tournament.teams}
						options={{ chaos, reverse: tournament.config.reverse }}
					/>
				</div>
			</section>
		</div>
	{/if}
</div>
