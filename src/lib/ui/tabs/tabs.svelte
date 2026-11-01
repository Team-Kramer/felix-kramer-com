<script lang="ts">
	import type { Snippet } from 'svelte';
	import { onMount } from 'svelte';
	import { bindGlidingPill, supportsAnchorPositioning } from '../effects';

	export type TabDefinition = {
		id: string;
		label: string;
		count?: number;
		attention?: boolean;
		disabled?: boolean;
		content?: Snippet;
	};

	let {
		tabs,
		activeId = $bindable(''),
		label = 'Sections',
		gliding = false
	}: {
		tabs: TabDefinition[];
		activeId?: string;
		label?: string;
		gliding?: boolean;
	} = $props();

	const id = $props.id();
	let tablist = $state<HTMLElement | undefined>(undefined);
	let indicator = $state<HTMLElement | undefined>(undefined);
	let activeTab = $derived(
		tabs.find((tab) => tab.id === activeId && !tab.disabled) ?? tabs.find((tab) => !tab.disabled)
	);
	let tabStopId = $state('');
	let useNativeAnchors = $derived(gliding && supportsAnchorPositioning());

	$effect(() => {
		if (activeTab && activeId !== activeTab.id) activeId = activeTab.id;
	});

	onMount(() => {
		if (!gliding || useNativeAnchors || !tablist || !indicator) return;
		const activeTablist = tablist;
		const activeIndicator = indicator;
		const binding = bindGlidingPill(activeTablist, activeIndicator, () =>
			activeTablist.querySelector<HTMLElement>('[aria-selected="true"]')
		);
		return () => binding.destroy();
	});

	$effect(() => {
		activeId;
		if (gliding && !useNativeAnchors) {
			requestAnimationFrame(() => {
				if (tablist && indicator) {
					const active = tablist.querySelector<HTMLElement>('[aria-selected="true"]');
					if (active) {
						const x = active.offsetLeft;
						indicator.style.inlineSize = `${active.offsetWidth}px`;
						indicator.style.transform = `translate3d(${x}px, 0, 0)`;
					}
				}
			});
		}
	});

	function focusTab(index: number) {
		const enabled = tabs.filter((tab) => !tab.disabled);
		if (!enabled.length) return;
		const target = enabled[(index + enabled.length) % enabled.length];
		tabStopId = target.id;
		document.getElementById(`${id}-tab-${target.id}`)?.focus();
	}

	function onKeydown(event: KeyboardEvent) {
		const enabled = tabs.filter((tab) => !tab.disabled);
		const current = enabled.findIndex((tab) => tab.id === (tabStopId || activeTab?.id));
		if (event.key === 'ArrowRight') {
			event.preventDefault();
			focusTab(current + 1);
		} else if (event.key === 'ArrowLeft') {
			event.preventDefault();
			focusTab(current - 1);
		} else if (event.key === 'Home') {
			event.preventDefault();
			focusTab(0);
		} else if (event.key === 'End') {
			event.preventDefault();
			focusTab(enabled.length - 1);
		}
	}
</script>

<section class="overflow-hidden rounded-lg border border-line bg-surface shadow-card">
	<div
		bind:this={tablist}
		class="relative flex gap-1 overflow-x-auto border-b border-line px-3"
		role="tablist"
		tabindex="-1"
		aria-label={label}
		onkeydown={onKeydown}
	>
		{#if gliding}
			<span
				bind:this={indicator}
				class="pointer-events-none absolute top-1 left-0 z-0 rounded-full bg-accent-light transition-[transform,inline-size] duration-350 ease-[cubic-bezier(0.65,0,0.35,1)] {useNativeAnchors
					? '[position-anchor:--glide-active][inset:anchor(top)_auto_anchor(bottom)_anchor(left)][inline-size:anchor-size(width)]'
					: ''}"
				aria-hidden="true"
			></span>
		{/if}
		{#each tabs as tab (tab.id)}
			<button
				id="{id}-tab-{tab.id}"
				type="button"
				role="tab"
				aria-selected={tab.id === activeTab?.id}
				aria-controls="{id}-panel-{tab.id}"
				tabindex={(tabStopId || activeTab?.id) === tab.id ? 0 : -1}
				disabled={tab.disabled}
				class="relative z-10 inline-flex min-h-11 cursor-pointer items-center gap-2 whitespace-nowrap border-0 border-b-[2.5px] border-b-transparent bg-transparent px-3 py-2 text-tab-label text-ink-secondary transition-colors duration-150 ease-out focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-accent disabled:cursor-not-allowed disabled:opacity-50 {tab.id === activeTab?.id
					? 'border-b-accent font-bold text-accent-hover'
					: ''}"
				style:anchor-name={useNativeAnchors && tab.id === activeTab?.id ? '--glide-active' : undefined}
				onclick={() => {
					if (tab.disabled) return;
					activeId = tab.id;
					tabStopId = tab.id;
				}}
			>
				<span>{tab.label}</span>
				{#if tab.count !== undefined}
					<span
						class="rounded-full px-1.5 py-px text-caption {tab.attention
							? 'bg-accent-light font-bold text-accent-hover'
							: 'bg-surface-variant text-ink-secondary'}"
					>
						{tab.count}
					</span>
				{/if}
			</button>
		{/each}
	</div>
	{#each tabs as tab (tab.id)}
		<div
			id="{id}-panel-{tab.id}"
			role="tabpanel"
			aria-labelledby="{id}-tab-{tab.id}"
			tabindex="0"
			hidden={tab.id !== activeTab?.id}
			class="p-4 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-accent"
		>
			{@render tab.content?.()}
		</div>
	{/each}
</section>
