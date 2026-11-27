<script lang="ts">
	import { onMount } from 'svelte';
	import { DatasetManager, SectionTitle } from '$lib/ui';
	import { useI18n } from '$lib/i18n';
	import { datasetStore, initializeDataset } from '$lib/engine/dataset/store.svelte';

	const i18n = useI18n();

	let query = $state('');
	let position = $state('');
	let initialized = $state(false);

	onMount(async () => {
		await initializeDataset();
		initialized = true;
	});

	const teamsById = $derived(
		new Map((datasetStore.dataset?.teams ?? []).map((team) => [team.id, team.canonicalName]))
	);

	const currentMembershipByPlayer = $derived(
		new Map(
			(datasetStore.dataset?.memberships ?? [])
				.filter((membership) => membership.validTo === null)
				.map((membership) => [membership.playerId, membership.teamId])
		)
	);

	const snapshotByPlayer = $derived.by(() => {
		const snapshots = datasetStore.dataset?.playerSnapshots ?? [];
		const result = new Map<string, (typeof snapshots)[number]>();
		for (const snapshot of snapshots) {
			const current = result.get(snapshot.playerId);
			if (!current || snapshot.validFrom > current.validFrom) result.set(snapshot.playerId, snapshot);
		}
		return result;
	});

	const positions = $derived(
		Array.from(new Set((datasetStore.dataset?.players ?? []).flatMap((player) => player.positions))).sort()
	);

	const filteredPlayers = $derived.by(() => {
		const normalizedQuery = query.trim().toLocaleLowerCase();
		return (datasetStore.dataset?.players ?? [])
			.filter((player) => !position || player.positions.includes(position))
			.filter((player) => {
				if (!normalizedQuery) return true;
				const teamId = currentMembershipByPlayer.get(player.id);
				const teamName = teamId ? teamsById.get(teamId) : '';
				return `${player.canonicalName} ${teamName ?? ''} ${player.positions.join(' ')}`
					.toLocaleLowerCase()
					.includes(normalizedQuery);
			})
			.sort((left, right) => left.canonicalName.localeCompare(right.canonicalName));
	});
</script>

<svelte:head>
	<title>{i18n.t('players.title')} — Felix Kramer</title>
	<meta name="description" content={i18n.t('players.subtitle')} />
</svelte:head>

<div class="mx-auto max-w-6xl px-4 py-12">
	<SectionTitle emoji="👤" title={i18n.t('players.title')} />
	<p class="mt-2 max-w-2xl text-ink-secondary">{i18n.t('players.subtitle')}</p>
	<DatasetManager />

	{#if initialized && (datasetStore.dataset?.players.length ?? 0) > 0}
		<section class="mt-8 rounded-xl border border-line bg-surface p-4" aria-label={i18n.t('common.search')}>
			<div class="grid gap-3 md:grid-cols-[1fr_220px_auto] md:items-end">
				<label class="grid gap-1.5 text-body-md font-semibold text-ink" for="player-search">
					<span>{i18n.t('common.search')}</span>
					<input
						id="player-search"
						type="search"
						bind:value={query}
						placeholder={i18n.t('players.searchPlaceholder')}
						class="min-h-10 rounded-md border border-line bg-surface-cream px-3 text-ink outline-none transition-[border-color,box-shadow] duration-150 focus-visible:border-accent focus-visible:shadow-focus"
					/>
				</label>
				<label class="grid gap-1.5 text-body-md font-semibold text-ink" for="player-position">
					<span>{i18n.t('players.allPositions')}</span>
					<select
						id="player-position"
						bind:value={position}
						class="select-control min-h-10 cursor-pointer appearance-none rounded-md border border-line bg-surface-cream px-3 pr-9 font-normal text-ink"
					>
						<option value="">{i18n.t('players.allPositions')}</option>
						{#each positions as item}
							<option value={item}>{item}</option>
						{/each}
					</select>
				</label>
				<div class="flex items-center justify-between gap-3 text-sm text-ink-secondary md:justify-start">
					<span>{filteredPlayers.length} {i18n.t('players.showing')}</span>
					{#if query || position}
						<button
							type="button"
							class="rounded-full border border-line px-3 py-1.5 font-semibold text-ink transition-colors duration-150 hover:bg-surface-elevated active:scale-95"
							onclick={() => {
								query = '';
								position = '';
							}}
						>
							{i18n.t('players.clearSearch')}
						</button>
					{/if}
				</div>
			</div>
		</section>

		<div class="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
			{#each filteredPlayers as player (player.id)}
				{@const teamId = currentMembershipByPlayer.get(player.id)}
				{@const snapshot = snapshotByPlayer.get(player.id)}
				<article class="rounded-xl border border-line bg-surface p-4 transition-[border-color,transform] duration-150 hover:-translate-y-0.5 hover:border-accent">
					<div class="flex items-start justify-between gap-3">
						<div>
							<h2 class="font-bold text-ink">{player.canonicalName}</h2>
							<p class="mt-1 text-sm text-ink-secondary">
								{teamId ? (teamsById.get(teamId) ?? i18n.t('players.team')) : i18n.t('players.team')}
							</p>
						</div>
						{#if snapshot?.ability?.current !== undefined}
							<span class="rounded-full bg-accent-light px-2.5 py-1 font-mono text-sm font-bold text-accent">
								{snapshot.ability.current}
							</span>
						{/if}
					</div>
					<div class="mt-4 flex flex-wrap gap-1.5">
						{#each player.positions as item}
							<span class="rounded-full border border-line px-2 py-0.5 text-xs font-semibold text-ink-secondary">{item}</span>
						{/each}
					</div>
					{#if snapshot?.ability?.potential !== undefined}
						<p class="mt-3 text-xs text-ink-tertiary">
							{i18n.t('players.potential')}: <span class="font-mono text-ink-secondary">{snapshot.ability.potential}</span>
						</p>
					{/if}
				</article>
			{:else}
				<p class="col-span-full rounded-xl border border-dashed border-line-strong p-8 text-center text-ink-secondary">
					{i18n.t('players.noPlayers')}
				</p>
			{/each}
		</div>
	{:else if initialized}
		<section class="mt-8 rounded-xl border border-dashed border-line-strong bg-surface p-10 text-center">
			<span class="material-symbols-outlined text-4xl text-accent" aria-hidden="true">person_search</span>
			<h2 class="mt-3 text-headline-md">{i18n.t('players.noPlayers')}</h2>
			<p class="mx-auto mt-2 max-w-md text-ink-secondary">{i18n.t('players.importHint')}</p>
		</section>
	{:else}
		<div class="mt-8 h-40 animate-pulse rounded-xl bg-surface" aria-label={i18n.t('common.loading')}></div>
	{/if}
</div>

<style>
	.select-control {
		background-repeat: no-repeat;
		background-position: right 0.75rem center;
		background-size: 1.25rem 1.25rem;
		background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23a7a7a7' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E");
	}
</style>
