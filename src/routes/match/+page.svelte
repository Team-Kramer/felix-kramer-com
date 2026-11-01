<script lang="ts">
	import {
		Button,
		MatchCard,
		Select,
		ProbabilityBar,
		ChaosSlider,
		SectionTitle,
		Banner
	} from '$lib/ui';
	import { useI18n } from '$lib/i18n';
	import { nations, toTeam } from '$lib/engine/data';
	import { expectedGoals } from '$lib/engine/elo';
	import { matchProbabilities, simulateMatch } from '$lib/engine/poisson';
	import { rngFromString } from '$lib/engine/prng';
	import type { MatchEvent, MatchResult, Team } from '$lib/engine/types';

	const i18n = useI18n();

	const lang = $derived(i18n.lang);
	const allTeams = $derived(nations.map((n) => toTeam(n, lang)));
	const teamById = $derived(new Map(allTeams.map((t) => [t.id, t])));
	const teamOptions = $derived(allTeams.map((t) => ({ value: t.id, label: t.name })));

	// Default: top two nations so a visitor can hit "Simulate" immediately.
	let homeId = $state('ger');
	let awayId = $state('fra');
	const home = $derived(teamById.get(homeId) ?? allTeams[0]);
	const away = $derived(teamById.get(awayId) ?? allTeams[1]);

	let chaos = $state(0);
	let seed = $state('felix');

	const xg = $derived(expectedGoals(home.elo, away.elo, { chaos }));
	const probs = $derived(matchProbabilities(xg.home, xg.away));

	// ---- Live minute-by-minute simulation (B3) ----
	type Phase = 'idle' | 'running' | 'paused' | 'done';
	let phase = $state<Phase>('idle');
	let speed = $state<1 | 4 | 16>(1);
	let minute = $state(0);
	let result = $state<MatchResult | null>(null);
	let shownEvents = $state<MatchEvent[]>([]);
	const liveHome = $derived(shownEvents.filter((e) => e.type === 'goal' && e.team === 'home').length);
	const liveAway = $derived(shownEvents.filter((e) => e.type === 'goal' && e.team === 'away').length);

	let timer: ReturnType<typeof setInterval> | null = null;

	function stopTimer() {
		if (timer) {
			clearInterval(timer);
			timer = null;
		}
	}

	function startLive() {
		const rng = rngFromString(seed);
		const res = simulateMatch(rng, xg.home, xg.away);
		result = res;
		shownEvents = [];
		minute = 0;
		phase = 'running';
		stopTimer();
		timer = setInterval(tick, 1000 / speed);
	}

	function tick() {
		if (!result) return;
		minute += 1;
		const upto = result.events.filter((e) => e.minute <= minute);
		shownEvents = upto;
		if (minute >= 90) {
			stopTimer();
			phase = 'done';
		}
	}

	function pause() {
		stopTimer();
		phase = 'paused';
	}

	function resume() {
		if (!result) return;
		phase = 'running';
		stopTimer();
		timer = setInterval(tick, 1000 / speed);
	}

	function resetLive() {
		stopTimer();
		phase = 'idle';
		result = null;
		shownEvents = [];
		minute = 0;
	}

	function setSpeed(s: 1 | 4 | 16) {
		const wasRunning = phase === 'running';
		speed = s;
		if (wasRunning) {
			stopTimer();
			timer = setInterval(tick, 1000 / speed);
		}
	}

	function swap() {
		const t = homeId;
		homeId = awayId;
		awayId = t;
		resetLive();
	}

	// ---- Instant (non-live) result ----
	let instant = $state<MatchResult | null>(null);
	function runInstant() {
		const rng = rngFromString(seed + '-instant');
		instant = simulateMatch(rng, xg.home, xg.away);
	}

	function eventIcon(type: MatchEvent['type']): string {
		switch (type) {
			case 'goal':
				return '⚽';
			case 'yellow':
				return '🟨';
			case 'red':
				return '🟥';
			default:
				return '🔁';
		}
	}

	function eventSide(e: MatchEvent): string {
		return e.team === 'home' ? home.name : away.name;
	}
</script>

<svelte:head>
	<title>{i18n.t('match.title')} — Felix Kramer</title>
	<meta name="description" content={i18n.t('match.subtitle')} />
</svelte:head>

<div class="mx-auto max-w-4xl px-4 py-12">
	<SectionTitle emoji="⚽" title={i18n.t('match.title')} />
	<p class="mt-2 max-w-2xl text-ink-secondary">{i18n.t('match.subtitle')}</p>

	<!-- Team pickers -->
	<div class="mt-8 grid gap-4 md:grid-cols-[1fr_auto_1fr] md:items-end">
		<Select
			id="home"
			label={i18n.t('match.pickHome')}
			value={homeId}
			options={teamOptions}
			onchange={(v) => {
				homeId = v;
				resetLive();
			}}
		/>
		<Button variant="icon-outline" aria-label={i18n.t('match.swap')} onclick={swap} class="mb-0.5">
			<span class="material-symbols-outlined" aria-hidden="true">swap_horiz</span>
		</Button>
		<Select
			id="away"
			label={i18n.t('match.pickAway')}
			value={awayId}
			options={teamOptions}
			onchange={(v) => {
				awayId = v;
				resetLive();
			}}
		/>
	</div>

	<!-- Chaos + match card + probabilities -->
	<div class="mt-8 grid gap-6 md:grid-cols-2">
		<div class="flex flex-col gap-4">
			<MatchCard home={home} away={away} probabilities={probs} />
			<div class="rounded-lg border border-line bg-surface p-4">
				<ChaosSlider bind:value={chaos} label={i18n.t('common.chaos')} />
			</div>
		</div>

		<div class="flex flex-col gap-4">
			<div class="rounded-lg border border-line bg-surface p-4">
				<h2 class="text-caption font-semibold uppercase tracking-wide text-ink-tertiary">
					{i18n.t('match.probabilities')}
				</h2>
				<div class="mt-4 flex flex-col gap-3">
					<ProbabilityBar label={home.name} value={probs.home} color="accent" />
					<ProbabilityBar label={i18n.t('common.draw')} value={probs.draw} color="sky" />
					<ProbabilityBar label={away.name} value={probs.away} color="coral" />
				</div>
				<p class="mt-4 text-caption text-ink-tertiary">
					{i18n.t('match.expectedGoals')}: {xg.home.toFixed(2)} – {xg.away.toFixed(2)}
				</p>
			</div>
			<Button variant="secondary" onclick={runInstant}>{i18n.t('match.startSim')}</Button>
		</div>
	</div>

	<!-- Instant result -->
	{#if instant}
		<div class="mt-8">
			<MatchCard home={home} away={away} homeScore={instant.homeScore} awayScore={instant.awayScore} />
		</div>
	{/if}

	<!-- Live simulation -->
	<section class="mt-12">
		<SectionTitle emoji="📺" title={i18n.t('match.live')} />
		<p class="mt-2 text-ink-secondary">{i18n.t('match.liveHint')}</p>

		<div class="mt-6 flex flex-wrap items-center gap-3">
			{#if phase === 'idle'}
				<Button onclick={startLive}>{i18n.t('common.play')}</Button>
			{:else if phase === 'running'}
				<Button variant="secondary" onclick={pause}>{i18n.t('common.pause')}</Button>
			{:else if phase === 'paused'}
				<Button onclick={resume}>{i18n.t('common.resume')}</Button>
			{/if}
			{#if phase !== 'idle'}
				<Button variant="icon-outline" aria-label={i18n.t('common.reset')} onclick={resetLive}>
					<span class="material-symbols-outlined" aria-hidden="true">replay</span>
				</Button>
			{/if}

			<div class="ml-auto flex items-center gap-1 rounded-full border border-line p-1" role="group"
				aria-label={i18n.t('common.speed')}>
				{#each [1, 4, 16] as s}
					<button
						type="button"
						class="rounded-full px-3 py-1 text-xs font-bold transition-colors duration-150 {speed === s
							? 'bg-accent text-on-green'
							: 'text-ink-secondary hover:text-ink'}"
						aria-pressed={speed === s}
						onclick={() => setSpeed(s as 1 | 4 | 16)}
					>
						{s}×
					</button>
				{/each}
			</div>
		</div>

		{#if phase !== 'idle'}
			<div class="mt-6 grid gap-6 md:grid-cols-2">
				<div>
					<MatchCard
						home={home}
						away={away}
						homeScore={liveHome}
						awayScore={liveAway}
						round={phase === 'done' ? i18n.t('common.result') : `${minute}'`}
					/>
					<div class="mt-3 h-2 w-full overflow-hidden rounded-full bg-surface-variant" role="progressbar"
						aria-label={i18n.t('common.minute')} aria-valuemin={0} aria-valuemax={90} aria-valuenow={minute}>
						<div class="h-full bg-accent transition-[width] duration-200" style:width="{(minute / 90) * 100}%"></div>
					</div>
				</div>
				<div class="rounded-lg border border-line bg-surface p-4">
					<h3 class="text-caption font-semibold uppercase tracking-wide text-ink-tertiary">
						{i18n.t('common.minute')}
					</h3>
					<ul class="mt-3 flex max-h-64 flex-col gap-1.5 overflow-y-auto text-sm" aria-live="polite">
						{#each shownEvents as e (shownEvents.indexOf(e))}
							<li class="flex items-center gap-2">
								<span class="w-8 shrink-0 text-right font-mono tabular-nums text-ink-tertiary">{e.minute}'</span>
								<span aria-hidden="true">{eventIcon(e.type)}</span>
								<span class="truncate text-ink-secondary">{eventSide(e)}</span>
							</li>
						{:else}
							<li class="text-ink-tertiary">—</li>
						{/each}
					</ul>
				</div>
			</div>
		{:else}
			<Banner variant="info" message={i18n.t('match.liveHint')} />
		{/if}
	</section>
</div>
