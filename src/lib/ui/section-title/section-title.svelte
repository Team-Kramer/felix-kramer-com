<script lang="ts">
	let { emoji, title }: { emoji: string; title: string } = $props();
</script>

<h2 class="flex items-center gap-2.5 m-0 border-b-[3px] border-b-dashed border-line pb-2 text-ink text-headline-md font-bold">
	<span class="inline-grid h-9 w-9 flex-none place-items-center text-3xl leading-none" aria-hidden="true">{emoji}</span>
	<span>{title}</span>
</h2>
