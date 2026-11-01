<script lang="ts">
	let {
		orientation = 'horizontal',
		label
	}: {
		orientation?: 'horizontal' | 'vertical';
		label?: string;
	} = $props();
</script>

<hr
	class="flex-none border-0 bg-line {orientation === 'horizontal'
		? 'h-px w-full m-0'
		: 'w-px h-full min-h-1em m-0'}"
	aria-orientation={orientation}
	aria-label={label}
/>
