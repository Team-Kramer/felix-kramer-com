<script lang="ts">
	import {
		Button,
		Select,
		SectionTitle,
		FormationBuilder,
		ResultCard,
		Banner
	} from '$lib/ui';
	import { useI18n } from '$lib/i18n';
	import { players, nationsById } from '$lib/engine/data';
	import {
		createDraft,
		drawCard,
		placeCard,
		redraw,
		isComplete,
		avgRating,
		type DraftState,
		type DraftCard
	} from '$lib/engine/draft';
	import { FORMATIONS, teamElo, type Playstyle } from '$lib/engine/formation';
	import { toMemoryMode } from '$lib/engine/memory-mode';
	import { runCampaign, type CampaignResult } from '$lib/engine/campaign';
	import { rngFromString } from '$lib/engine/prng';

	const i18n = useI18n();

	let formationId = $state('4-3-3');
	let playstyle = $state<Playstyle>('balanced');
	let memoryMode = $state(false);
	let playersCount = $state(1);
	let turn = $state(0);
	let draft = $state<DraftState | null>(null);
	let currentCard = $state<DraftCard | null>(null);
	let campaignResult = $state<CampaignResult | null>(null);
	let error = $state<string | null>(null);

	const formationOptions = $derived(FORMATIONS.map((f) => ({ value: f.id, label: f.name })));

	function slotDefs() {
		const formation = FORMATIONS.find((f) => f.id === formationId) ?? FORMATIONS[0];
		return [{ id: 'GK', position: 'GK' as const }, ...formation.slots];
	}

	function newDraft() {
		draft = createDraft(slotDefs());
		currentCard = null;
		campaignResult = null;
		turn = 0;
		error = null;
	}

	function draw() {
		if (!draft) return;
		try {
			const rng = rngFromString('draft-' + draft.drawn.length + '-' + Date.now());
			currentCard = drawCard(draft, rng, players);
			turn = (turn + 1) % playersCount;
			error = null;
		} catch {
			error = 'No more squads available';
		}
	}

	function place(slotId: string) {
		if (!draft || !currentCard) return;
		try {
			placeCard(draft, slotId, currentCard);
			currentCard = null;
			error = null;
		} catch (e) {
			error = e instanceof Error ? e.message : String(e);
		}
	}

	function doRedraw() {
		if (!draft) return;
		try {
			const rng = rngFromString('redraw-' + draft.drawn.length + '-' + Date.now());
			currentCard = redraw(draft, rng, players);
			error = null;
		} catch (e) {
			error = e instanceof Error ? e.message : String(e);
		}
	}

	const complete = $derived(draft ? isComplete(draft) : false);
	const rating = $derived(draft ? avgRating(draft) : 0);
	const elo = $derived(teamElo(rating, playstyle));

	// Memory mode: strip ratings from the displayed card.
	const displayCard = $derived(
		currentCard && memoryMode
			? toMemoryMode({
					slots: [],
					drawn: [currentCard],
					redrawsLeft: 0,
					usedNations: []
				}).drawn[0]
			: currentCard
	);

	function startCampaign() {
		if (!draft || !complete) return;
		const pool = nationsById;
		const teams = [...pool.values()].map((n) => ({
			id: n.id,
			name: n.name.en,
			elo: n.elo
		}));
		campaignResult = runCampaign({
			xi: draft,
			playstyle,
			seed: 'campaign-' + Date.now(),
			teamCount: 16,
			teamPool: teams
		});
	}

	const nationName = (id: string) => nationsById.get(id)?.name.en ?? id;
</script>

<svelte:head>
	<title>{i18n.t('draft.title')} — Felix Kramer</title>
	<meta name="description" content={i18n.t('draft.subtitle')} />
</svelte:head>

<div class="mx-auto max-w-6xl px-4 py-12">
	<SectionTitle emoji="🃏" title={i18n.t('draft.title')} />
	<p class="mt-2 max-w-2xl text-ink-secondary">{i18n.t('draft.subtitle')}</p>

	<!-- Config -->
	<div class="mt-8 grid gap-4 md:grid-cols-4">
		<Select
			id="draft-formation"
			label={i18n.t('draft.formation')}
			value={formationId}
			options={formationOptions}
			onchange={(v) => {
				formationId = v;
				newDraft();
			}}
		/>
		<Select
			id="draft-playstyle"
			label={i18n.t('draft.playstyle')}
			value={playstyle}
			options={[
				{ value: 'defensive', label: i18n.t('draft.defensive') },
				{ value: 'balanced', label: i18n.t('draft.balanced') },
				{ value: 'attacking', label: i18n.t('draft.attacking') }
			]}
			onchange={(v) => (playstyle = v as Playstyle)}
		/>
		<Select
			id="draft-players"
			label={i18n.t('draft.passAndPlay')}
			value={String(playersCount)}
			options={[
				{ value: '1', label: '1' },
				{ value: '2', label: '2' },
				{ value: '3', label: '3' },
				{ value: '4', label: '4' }
			]}
			onchange={(v) => {
				playersCount = Number(v);
				turn = 0;
			}}
		/>
		<div class="flex items-end">
			<label class="flex w-full cursor-pointer items-center justify-between gap-3 rounded-lg border border-line bg-surface p-4">
				<span class="text-sm font-medium text-ink">{i18n.t('draft.memoryMode')}</span>
				<input
					type="checkbox"
					class="h-4 w-4 accent-accent"
					bind:checked={memoryMode}
				/>
			</label>
		</div>
	</div>

	{#if memoryMode}
		<p class="mt-2 text-xs text-ink-tertiary">{i18n.t('draft.memoryModeHint')}</p>
	{/if}

	<!-- Draft board -->
	<div class="mt-8 grid gap-6 lg:grid-cols-2">
		<!-- Pitch -->
		<div>
			<FormationBuilder
				formationId={formationId}
				players={draft
					? Object.fromEntries(draft.slots.map((s) => [s.id, s.player]))
					: {}}
			/>
			<div class="mt-3 flex items-center justify-between text-sm">
				<span class="text-ink-secondary">
					{i18n.t('draft.avgRating')}: <strong class="font-mono tabular-nums">{rating.toFixed(1)}</strong>
				</span>
				<span class="text-ink-secondary">
					{i18n.t('draft.teamElo')}: <strong class="font-mono tabular-nums">{Math.round(elo)}</strong>
				</span>
			</div>
		</div>

		<!-- Card + actions -->
		<div class="space-y-4">
			{#if playersCount > 1}
				<p class="text-sm font-semibold text-ink-secondary">
					👤 {i18n.t('draft.passAndPlay')}: {turn + 1} / {playersCount}
				</p>
			{/if}

			{#if currentCard}
				<div class="glass rounded-xl p-4">
					<p class="text-caption font-semibold uppercase tracking-wide text-ink-tertiary">
						{nationName(currentCard.nation)} · WM {currentCard.wcYear}
					</p>
					<p class="mt-1 text-headline-md font-bold text-ink">{currentCard.player.name}</p>
					<p class="text-sm text-ink-secondary">
						{currentCard.player.position}
						{#if !memoryMode}
							· <span class="font-mono tabular-nums">{currentCard.player.rating}</span>
						{/if}
					</p>
					<div class="mt-3 flex flex-wrap gap-2">
						{#each draft?.slots ?? [] as s (s.id)}
							{#if !s.player && s.position === currentCard.player.position}
								<Button variant="secondary" onclick={() => place(s.id)}>
									{s.id}
								</Button>
							{/if}
						{/each}
						{#if (draft?.redrawsLeft ?? 0) > 0}
							<Button variant="icon-outline" aria-label={i18n.t('draft.redraw')} onclick={doRedraw}>
								<span class="material-symbols-outlined" aria-hidden="true">refresh</span>
							</Button>
						{/if}
					</div>
				</div>
			{:else}
				<div class="rounded-xl border border-dashed border-line bg-surface/50 p-6 text-center text-sm text-ink-tertiary">
					{complete ? i18n.t('draft.completeHint') : i18n.t('draft.drawCard') + '…'}
				</div>
			{/if}

			<div class="flex flex-wrap items-center gap-3">
				<Button onclick={draw} disabled={!!currentCard || complete}>
					{i18n.t('draft.drawCard')}
				</Button>
				<Button variant="secondary" onclick={newDraft}>
					{i18n.t('common.reset')}
				</Button>
				{#if draft}
					<span class="text-xs text-ink-tertiary">
						{i18n.t('draft.redrawsLeft')}: {draft.redrawsLeft}
					</span>
				{/if}
			</div>

			{#if error}
				<Banner variant="warning" message={error} />
			{/if}

			{#if complete}
				<Button variant="primary" pulse onclick={startCampaign}>
					{i18n.t('draft.runCampaign')}
				</Button>
			{/if}
		</div>
	</div>

	<!-- Campaign result -->
	{#if campaignResult}
		<div class="mt-10">
			<SectionTitle emoji="🏁" title={i18n.t('draft.campaign')} />
			<div class="mt-4 max-w-xl">
				<ResultCard result={campaignResult} teamName={i18n.t('draft.yourTeam')} />
			</div>
		</div>
	{/if}
</div>
