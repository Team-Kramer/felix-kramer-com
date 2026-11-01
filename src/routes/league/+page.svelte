<script lang="ts">
	import {
		Button,
		Select,
		ChaosSlider,
		SectionTitle,
		LeagueTable,
		MonteCarloPanel,
		Banner
	} from '$lib/ui';
	import { useI18n } from '$lib/i18n';
	import { leagues, clubs, toClubTeam } from '$lib/engine/data';
	import {
		createTournament,
		advance,
		runTournament,
		encodeShare,
		decodeShare,
		type TournamentConfig,
		type TournamentState
	} from '$lib/engine/tournament';
	import { leagueTable, zoneMarkers } from '$lib/engine/round-robin';
	import type { Team } from '$lib/engine/types';

	const i18n = useI18n();

	const allClubs = $derived(clubs.map(toClubTeam));
	const clubById = $derived(new Map(allClubs.map((t) => [t.id, t])));

	let presetId = $state('bundesliga');
	let chaos = $state(0);
	let seed = $state('felix');
	let teams = $state<Team[]>([]);
	let season = $state<TournamentState | null>(null);
	let copied = $state(false);
	let matchday = $state(1);

	const presetOptions = $derived(leagues.map((l) => ({ value: l.id, label: l.name })));

	function applyPreset(id: string) {
		const league = leagues.find((l) => l.id === id);
		if (!league) return;
		teams = league.clubs.map(toClubTeam);
		season = null;
		matchday = 1;
	}

	function addTeam(id: string) {
		if (!id || teams.some((t) => t.id === id)) return;
		const team = clubById.get(id);
		if (team) teams = [...teams, team];
		season = null;
	}

	function removeTeam(id: string) {
		teams = teams.filter((t) => t.id !== id);
		season = null;
	}

	function buildConfig(): TournamentConfig {
		return { format: 'league', teams, seed, chaos };
	}

	function simulateAll() {
		if (teams.length < 2) return;
		season = runTournament(buildConfig());
	}

	function step() {
		if (!season) {
			season = createTournament(buildConfig());
			return;
		}
		if (season.phase !== 'done') season = advance(season);
	}

	function reset() {
		season = null;
		matchday = 1;
	}

	const totalRounds = $derived(
		season?.fixtures ? Math.max(...season.fixtures.map((f) => f.round)) : 0
	);
	const shownMatchday = $derived(Math.min(matchday, Math.max(totalRounds, 1)));
	const currentFixtures = $derived(
		season?.fixtures?.filter((f) => f.round === shownMatchday) ?? []
	);
	const table = $derived(
		season?.fixtures ? leagueTable(season.teams, season.fixtures) : []
	);
	const zones = $derived(
		table.length >= 3
			? zoneMarkers(table, { title: 1, europa: 4, relegation: 3 })
			: new Map<string, string>()
	);

	function prevMatchday() {
		matchday = Math.max(1, shownMatchday - 1);
	}

	function nextMatchday() {
		matchday = Math.min(totalRounds, shownMatchday + 1);
	}

	const shareUrl = $derived(
		season ? `${window.location.origin}/league?s=${encodeShare(season)}` : ''
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
				season = restored;
				teams = restored.teams;
			} catch {
				// ignore malformed share links
			}
		}
	});

	// Initialize with the default league on first client render.
	$effect(() => {
		if (typeof window === 'undefined') return;
		if (teams.length === 0) applyPreset(presetId);
	});

	const teamOptions = $derived(
		allClubs
			.filter((t) => !teams.some((x) => x.id === t.id))
			.map((t) => ({ value: t.id, label: t.name }))
	);
</script>

<svelte:head>
	<title>{i18n.t('league.title')} — Felix Kramer</title>
	<meta name="description" content={i18n.t('league.subtitle')} />
</svelte:head>

<div class="mx-auto max-w-6xl px-4 py-12">
	<SectionTitle emoji="⚽" title={i18n.t('league.title')} />
	<p class="mt-2 max-w-2xl text-ink-secondary">{i18n.t('league.subtitle')}</p>

	<!-- Config -->
	<div class="mt-8 grid gap-4 md:grid-cols-3">
		<Select
			id="league-preset"
			label={i18n.t('league.preset')}
			value={presetId}
			options={presetOptions}
			onchange={applyPreset}
		/>
		<Select
			id="add-club"
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
			{i18n.t('league.fullSeason')}
		</Button>
		<Button variant="secondary" onclick={step} disabled={teams.length < 2}>
			{i18n.t('common.stepByStep')}
		</Button>
		{#if season}
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
	{#if season}
		<div class="mt-10 space-y-10">
			{#if season.champion}
				<div class="glow-border rounded-2xl bg-surface p-6 text-center">
					<p class="text-caption font-semibold uppercase tracking-wide text-ink-tertiary">
						{i18n.t('common.champion')}
					</p>
					<p class="mt-2 text-headline-lg text-gradient-gold">
						{clubById.get(season.champion)?.name ?? season.champion}
					</p>
				</div>
			{/if}

			<section>
				<SectionTitle emoji="📋" title={i18n.t('league.table')} />
				<div class="mt-4">
					<LeagueTable table={table} zones={zones} />
				</div>
			</section>

			<section>
				<SectionTitle emoji="🗓️" title={i18n.t('league.fixtures')} />
				<div class="mt-4 flex items-center justify-between gap-3">
					<Button variant="icon-outline" aria-label="◀" onclick={prevMatchday} disabled={shownMatchday <= 1}>
						<span class="material-symbols-outlined" aria-hidden="true">chevron_left</span>
					</Button>
					<p class="text-sm font-semibold tabular-nums text-ink-secondary">
						{i18n.t('common.matchday')} {shownMatchday} / {totalRounds}
					</p>
					<Button variant="icon-outline" aria-label="▶" onclick={nextMatchday} disabled={shownMatchday >= totalRounds}>
						<span class="material-symbols-outlined" aria-hidden="true">chevron_right</span>
					</Button>
				</div>
				<div class="mt-3 overflow-x-auto rounded-lg border border-line bg-surface">
					<ul class="divide-y divide-line-subtle">
						{#each currentFixtures as f (f.round + f.home + f.away)}
							<li class="flex items-center justify-between gap-3 px-4 py-2 text-sm">
								<span class="flex-1 text-right font-medium text-ink">
									{clubById.get(f.home)?.name ?? f.home}
								</span>
								<span class="rounded-md bg-surface-variant px-2 py-0.5 font-mono tabular-nums text-ink-secondary">
									{f.homeScore !== undefined && f.awayScore !== undefined
										? `${f.homeScore}:${f.awayScore}`
										: '–:–'}
								</span>
								<span class="flex-1 font-medium text-ink">
									{clubById.get(f.away)?.name ?? f.away}
								</span>
							</li>
						{/each}
					</ul>
				</div>
			</section>

			<section>
				<SectionTitle emoji="🎲" title={i18n.t('league.titleRace')} />
				<div class="mt-4">
					<MonteCarloPanel
						format="league"
						teams={season.teams}
						options={{ chaos }}
					/>
				</div>
			</section>
		</div>
	{/if}
</div>
