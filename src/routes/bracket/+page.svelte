<script lang="ts">
	import {
		Button,
		Select,
		SectionTitle,
		Bracket,
		Banner
	} from '$lib/ui';
	import { useI18n } from '$lib/i18n';
	import { nations, toTeam } from '$lib/engine/data';
	import {
		createSingleBracket,
		createDoubleBracket,
		setResult,
		clearResult,
		champion,
		readyMatches
	} from '$lib/engine/bracket';
	import { expectedGoals } from '$lib/engine/elo';
	import { simulateMatch } from '$lib/engine/poisson';
	import { rngFromString } from '$lib/engine/prng';
	import type { BracketMatch, Team } from '$lib/engine/types';

	const i18n = useI18n();
	const lang = $derived(i18n.lang);
	const allTeams = $derived(nations.map((n) => toTeam(n, lang)));
	const teamById = $derived(new Map(allTeams.map((t) => [t.id, t])));

	type Format = 'single' | 'double';

	let format = $state<Format>('single');
	let teamCount = $state(16);
	let seeded = $state(true);
	let reverse = $state(false);
	let teams = $state<Team[]>([]);
	let matches = $state<BracketMatch[] | null>(null);
	let copied = $state(false);
	let layout = $state<'classic' | 'compact'>('classic');

	const countOptions = $derived(
		[4, 8, 16, 32, 64].map((n) => ({ value: String(n), label: String(n) }))
	);

	function pickTeams(): Team[] {
		const pool = seeded
			? [...allTeams].sort((a, b) => b.elo - a.elo)
			: [...allTeams].sort(() => Math.random() - 0.5);
		return pool.slice(0, teamCount);
	}

	function buildBracket() {
		teams = pickTeams();
		const ids = teams.map((t) => t.id);
		matches = format === 'single' ? createSingleBracket(ids) : createDoubleBracket(ids);
	}

	function addTeam(id: string) {
		if (!id || teams.some((t) => t.id === id)) return;
		const team = teamById.get(id);
		if (team) teams = [...teams, team];
		matches = null;
	}

	function removeTeam(id: string) {
		teams = teams.filter((t) => t.id !== id);
		matches = null;
	}

	function simulateAll() {
		if (!matches) return;
		const rng = rngFromString('bracket-' + Date.now());
		const eloOf = (id: string) => teamById.get(id)?.elo ?? 1500;
		let guard = 0;
		while (readyMatches(matches).length > 0 && guard < 512) {
			const m = readyMatches(matches)[0];
			const g = expectedGoals(eloOf(m.home!), eloOf(m.away!));
			const r = simulateMatch(rng, g.home, g.away, { events: false });
			setResult(matches, m.id, r.homeScore, r.awayScore, { reverse });
			guard++;
		}
	}

	function undo(matchId: string) {
		if (!matches) return;
		clearResult(matches, matchId);
	}

	const champ = $derived(matches ? champion(matches) : null);
	const ready = $derived(matches ? readyMatches(matches) : []);

	// ---- Share (custom encoding: format + teams + matches) ----
	function encodeShare(): string {
		if (!matches) return '';
		const payload = JSON.stringify({
			v: 1,
			format,
			reverse,
			teamIds: teams.map((t) => t.id),
			matches
		});
		const bytes = new TextEncoder().encode(payload);
		let bin = '';
		for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
		return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
	}

	function decodeShare(encoded: string) {
		const b64 = encoded.replace(/-/g, '+').replace(/_/g, '/');
		const pad = b64.length % 4 === 0 ? '' : '='.repeat(4 - (b64.length % 4));
		const bin = atob(b64 + pad);
		const bytes = new Uint8Array(bin.length);
		for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
		const data = JSON.parse(new TextDecoder().decode(bytes)) as {
			v: number;
			format: Format;
			reverse: boolean;
			teamIds: string[];
			matches: BracketMatch[];
		};
		if (data.v !== 1) throw new Error('unsupported version');
		format = data.format;
		reverse = data.reverse;
		teams = data.teamIds
			.map((id) => teamById.get(id))
			.filter((t): t is Team => t !== undefined);
		matches = data.matches;
	}

	const shareUrl = $derived(matches ? `${window.location.origin}/bracket?b=${encodeShare()}` : '');

	function copyShare() {
		if (!shareUrl) return;
		void navigator.clipboard.writeText(shareUrl);
		copied = true;
		setTimeout(() => (copied = false), 2000);
	}

	// Restore from share link (client-only).
	$effect(() => {
		if (typeof window === 'undefined') return;
		const b = new URLSearchParams(window.location.search).get('b');
		if (b) {
			try {
				decodeShare(b);
			} catch {
				// ignore malformed share links
			}
		}
	});

	// Initialize with a default bracket on first client render.
	$effect(() => {
		if (typeof window === 'undefined') return;
		if (teams.length === 0) buildBracket();
	});

	const teamOptions = $derived(
		allTeams
			.filter((t) => !teams.some((x) => x.id === t.id))
			.map((t) => ({ value: t.id, label: t.name }))
	);

	// ---- Manual result entry (B7/B8) ----
	// Plain (non-reactive) map: input values persist across re-renders.
	const scoreInputs = new Map<string, { home: string; away: string }>();

	function scoreFor(matchId: string) {
		if (!scoreInputs.has(matchId)) scoreInputs.set(matchId, { home: '', away: '' });
		return scoreInputs.get(matchId)!;
	}

	function submitResult(m: BracketMatch) {
		const s = scoreInputs.get(m.id);
		if (!s) return;
		const homeScore = Number(s.home);
		const awayScore = Number(s.away);
		if (s.home === '' || s.away === '' || Number.isNaN(homeScore) || Number.isNaN(awayScore)) return;
		if (homeScore === awayScore) return; // knockout: no draws
		if (!matches) return;
		setResult(matches, m.id, homeScore, awayScore, { reverse });
		scoreInputs.delete(m.id);
	}
</script>

<svelte:head>
	<title>{i18n.t('bracket.title')} — Felix Kramer</title>
	<meta name="description" content={i18n.t('bracket.subtitle')} />
</svelte:head>

<div class="mx-auto max-w-6xl px-4 py-12">
	<SectionTitle emoji="🎯" title={i18n.t('bracket.title')} />
	<p class="mt-2 max-w-2xl text-ink-secondary">{i18n.t('bracket.subtitle')}</p>

	<!-- Config -->
	<div class="mt-8 grid gap-4 md:grid-cols-4">
		<Select
			id="bracket-format"
			label={i18n.t('bracket.format')}
			value={format}
			options={[
				{ value: 'single', label: i18n.t('common.single') },
				{ value: 'double', label: i18n.t('common.double') }
			]}
			onchange={(v) => {
				format = v as Format;
				buildBracket();
			}}
		/>
		<Select
			id="bracket-count"
			label={i18n.t('bracket.teamCount')}
			value={String(teamCount)}
			options={countOptions}
			onchange={(v) => {
				teamCount = Number(v);
				buildBracket();
			}}
		/>
		<Select
			id="bracket-seeding"
			label={i18n.t('bracket.seeded')}
			value={seeded ? 'seeded' : 'random'}
			options={[
				{ value: 'seeded', label: i18n.t('bracket.seeded') },
				{ value: 'random', label: i18n.t('bracket.randomize') }
			]}
			onchange={(v) => {
				seeded = v === 'seeded';
				buildBracket();
			}}
		/>
		<Select
			id="bracket-layout"
			label={i18n.t('bracket.layout')}
			value={layout}
			options={[
				{ value: 'classic', label: i18n.t('bracket.classic') },
				{ value: 'compact', label: i18n.t('bracket.compact') }
			]}
			onchange={(v) => (layout = v as 'classic' | 'compact')}
		/>
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
		<Button onclick={buildBracket}>
			{i18n.t('common.reset')}
		</Button>
		<Button variant="secondary" onclick={simulateAll} disabled={!matches || ready.length === 0}>
			{i18n.t('bracket.simulateAll')}
		</Button>
		{#if matches}
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
	{#if matches}
		<div class="mt-10 space-y-10">
			{#if champ}
				<div class="glow-border rounded-2xl bg-surface p-6 text-center">
					<p class="text-caption font-semibold uppercase tracking-wide text-ink-tertiary">
						{i18n.t('common.champion')}
					</p>
					<p class="mt-2 text-headline-lg text-gradient-gold">
						{teamById.get(champ)?.name ?? champ}
					</p>
				</div>
			{/if}

			<section>
				<SectionTitle emoji="🏆" title={i18n.t('bracket.enterResults')} />
				{#if layout === 'classic'}
					<div class="mt-4 overflow-x-auto">
						<Bracket matches={matches} teams={teamById} championId={champ} />
					</div>
				{:else}
					<div class="mt-4 grid gap-3 md:grid-cols-2">
						{#each matches as m (m.id)}
							<div class="rounded-lg border border-line bg-surface p-3 text-sm">
								<p class="text-caption font-semibold uppercase tracking-wide text-ink-tertiary">
									R{m.round + 1} · {m.bracket}
								</p>
								<div class="mt-2 flex items-center justify-between gap-2">
									<span class="flex-1 truncate font-medium text-ink">
										{m.home ? teamById.get(m.home)?.name ?? m.home : 'TBD'}
									</span>
									<span class="font-mono tabular-nums text-ink-secondary">
										{m.decided ? `${m.homeScore}:${m.awayScore}` : '–:–'}
									</span>
									<span class="flex-1 truncate text-right font-medium text-ink">
										{m.away ? teamById.get(m.away)?.name ?? m.away : 'TBD'}
									</span>
								</div>
								{#if m.decided}
									<button
										type="button"
										class="mt-2 text-xs text-ink-tertiary hover:text-coral"
										onclick={() => undo(m.id)}
									>
										{i18n.t('bracket.undo')}
									</button>
								{/if}
							</div>
						{/each}
					</div>
				{/if}
			</section>

			{#if ready.length > 0}
				<section>
					<SectionTitle emoji="⏭️" title={i18n.t('bracket.ready')} />
					<div class="mt-4 space-y-2">
						{#each ready as m (m.id)}
							{@const s = scoreFor(m.id)}
							<div class="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-line bg-surface px-4 py-2 text-sm">
								<span class="flex-1 truncate font-medium text-ink">
									{m.home ? teamById.get(m.home)?.name ?? m.home : 'TBD'}
								</span>
								<span class="flex items-center gap-2">
									<input
										type="number"
										min="0"
										max="99"
										inputmode="numeric"
										class="w-14 rounded-md border border-line bg-surface-variant px-2 py-1 text-center font-mono tabular-nums text-ink"
										aria-label={i18n.t('common.home')}
										bind:value={s.home}
									/>
									<span class="text-ink-tertiary">:</span>
									<input
										type="number"
										min="0"
										max="99"
										inputmode="numeric"
										class="w-14 rounded-md border border-line bg-surface-variant px-2 py-1 text-center font-mono tabular-nums text-ink"
										aria-label={i18n.t('common.away')}
										bind:value={s.away}
									/>
								</span>
								<span class="flex-1 truncate text-right font-medium text-ink">
									{m.away ? teamById.get(m.away)?.name ?? m.away : 'TBD'}
								</span>
								<Button variant="secondary" onclick={() => submitResult(m)}>
									{i18n.t('common.confirm')}
								</Button>
							</div>
						{/each}
					</div>
				</section>
			{/if}
		</div>
	{/if}
</div>
