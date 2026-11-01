<script lang="ts" module>
	export const ACTION_ICONS = {
		view: 'visibility',
		edit: 'edit',
		delete: 'delete',
		more: 'more_horiz'
	} as const;
	export type ActionIcon = (typeof ACTION_ICONS)[keyof typeof ACTION_ICONS];
</script>

<script lang="ts">
	let {
		name,
		label,
		class: className = ''
	}: {
		name: string;
		label?: string;
		class?: string;
	} = $props();
</script>

<span
	class="material-symbols-outlined {className}"
	role={label ? 'img' : undefined}
	aria-label={label}
	aria-hidden={label ? undefined : 'true'}
>{name}</span>
