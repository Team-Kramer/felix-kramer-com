<script lang="ts">
	import type { Player } from '$lib/engine/draft';
	import { getFormation } from '$lib/engine/formation';
	import type { Position } from '$lib/engine/formation';

	let {
		formationId = '4-3-3',
		players = {},
		compact = false
	}: {
		formationId: string;
		/** slot id → placed player. */
		players?: Record<string, Player | null>;
		compact?: boolean;
	} = $props();

	const formation = $derived(getFormation(formationId));

	/** Vertical band (top %) per position — GK at the bottom. */
	const BAND: Record<Position, number> = { FWD: 14, MID: 44, DEF: 74, GK: 92 };

	const positioned = $derived.by(() => {
		const lines: Record<Position, number> = { GK: 0, DEF: 0, MID: 0, FWD: 0 };
		const total: Record<Position, number> = { GK: 0, DEF: 0, MID: 0, FWD: 0 };
		for (const s of formation.slots) total[s.position]++;
		return formation.slots.map((slot) => {
			const i = lines[slot.position]++;
			const n = total[slot.position];
			const left = ((i + 1) / (n + 1)) * 100;
			return { slot, left, top: BAND[slot.position] };
		});
	});
</script>

<div
	class="relative w-full overflow-hidden rounded-xl border border-line-strong bg-pitch shadow-card"
	style:aspect-ratio="3/4"
	role="img"
	aria-label="Aufstellung {formation.name}"
>
	<!-- pitch markings -->
	<div class="pointer-events-none absolute inset-0" aria-hidden="true">
		<div class="absolute inset-x-0 top-1/2 h-px bg-white/20"></div>
		<div class="absolute left-1/2 top-1/2 h-16 w-16 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/20"></div>
		<div class="absolute inset-x-[15%] top-0 h-10 border border-t-0 border-white/20"></div>
		<div class="absolute inset-x-[30%] top-0 h-4 border border-t-0 border-white/20"></div>
		<div class="absolute inset-x-[15%] bottom-0 h-10 border border-b-0 border-white/20"></div>
		<div class="absolute inset-x-[30%] bottom-0 h-4 border border-b-0 border-white/20"></div>
	</div>

	<!-- GK (implicit) -->
	<div class="absolute -translate-x-1/2 -translate-y-1/2" style:left="50%" style:top="{BAND.GK}%">
		<div
			class="flex flex-col items-center gap-0.5 {compact ? 'scale-75' : ''}"
			aria-label="Torwart"
		>
			<span class="flex h-7 w-7 items-center justify-center rounded-full border border-white/40 bg-coral/80 text-caption font-bold text-white shadow-md">
				GK
			</span>
		</div>
	</div>

	{#each positioned as { slot, left, top } (slot.id)}
		{@const player = players[slot.id]}
		<div
			class="absolute -translate-x-1/2 -translate-y-1/2 transition-all duration-300 ease-out {compact ? 'scale-75' : ''}"
			style:left="{left}%"
			style:top="{top}%"
		>
			<div class="flex w-16 flex-col items-center gap-0.5" aria-label="{slot.label}{player ? `: ${player.name}` : ': frei'}">
				<span
					class="flex h-7 w-7 items-center justify-center rounded-full text-caption font-bold shadow-md {player ? 'border border-white/50 bg-accent text-on-green' : 'border border-dashed border-white/50 bg-black/30 text-white/70'}"
				>
					{slot.label}
				</span>
				<span
					class="max-w-16 truncate rounded bg-black/50 px-1 text-center text-caption font-semibold text-white backdrop-blur-sm"
				>
					{player ? player.name : '—'}
				</span>
				{#if player}<span class="font-mono text-caption tabular-nums text-white/80">{player.rating}</span>{/if}
			</div>
		</div>
	{/each}
</div>
