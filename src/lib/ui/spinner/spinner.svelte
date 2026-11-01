<script lang="ts">
	let {
		label = 'Loading',
		decorative = false
	}: {
		label?: string;
		decorative?: boolean;
	} = $props();
</script>

<span
	class="inline-block shrink-0 rounded-full border-2 border-line border-t-accent animate-[spinner-turn_700ms_linear_infinite] {decorative
		? 'h-4 w-4'
		: 'h-5 w-5'}"
	role={decorative ? undefined : 'status'}
	aria-label={decorative ? undefined : label}
	aria-hidden={decorative ? 'true' : undefined}
></span>
