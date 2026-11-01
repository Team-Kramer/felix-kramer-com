<script lang="ts">
	let {
		id,
		label,
		checked = $bindable(false),
		kind = 'checkbox',
		disabled = false,
		onchange
	}: {
		id: string;
		label: string;
		checked?: boolean;
		kind?: 'checkbox' | 'switch';
		disabled?: boolean;
		onchange?: (checked: boolean) => void;
	} = $props();
</script>

<label for={id} class="inline-flex min-h-10 cursor-pointer items-center gap-2.5 text-ink">
	<input
		{id}
		type="checkbox"
		role={kind === 'switch' ? 'switch' : undefined}
		bind:checked
		{disabled}
		aria-checked={checked}
		class="h-5 w-5 cursor-pointer accent-accent focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-accent disabled:cursor-not-allowed disabled:opacity-60 {kind === 'switch'
			? 'h-6 w-10'
			: ''}"
		onchange={(event) => {
			checked = event.currentTarget.checked;
			onchange?.(checked);
		}}
	/>
	<span class={disabled ? 'cursor-not-allowed opacity-60' : ''}>{label}</span>
</label>
