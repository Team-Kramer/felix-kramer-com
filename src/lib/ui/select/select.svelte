<script lang="ts">
	export interface SelectOption {
		value: string;
		label: string;
		disabled?: boolean;
	}

	let {
		id,
		label,
		value = $bindable(''),
		options,
		disabled = false,
		required = false,
		onchange
	}: {
		id: string;
		label: string;
		value?: string;
		options: SelectOption[];
		disabled?: boolean;
		required?: boolean;
		onchange?: (value: string) => void;
	} = $props();
</script>

<label for={id} class="grid gap-1.5 text-ink text-body-md font-semibold">
	<span>{label}</span>
	<select
		{id}
		bind:value
		{disabled}
		{required}
		class="w-full min-h-10 cursor-pointer appearance-none rounded-md border border-line bg-surface-cream px-3 pr-9 text-ink font-normal focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-accent focus-visible:shadow-focus [background-image:url('data:image/svg+xml,%3Csvg%20xmlns=%27http://www.w3.org/2000/svg%27%20viewBox=%270%200%2024%2024%27%20fill=%27none%27%20stroke=%27%23a7a7a7%27%20stroke-width=%272%27%3E%3Cpath%20d=%27m6%209%206%206%206-6%27/%3E%3C/svg%3E')]"
		onchange={(event) => onchange?.(event.currentTarget.value)}
	>
		{#each options as option (option.value)}
			<option value={option.value} disabled={option.disabled}>{option.label}</option>
		{/each}
	</select>
</label>
