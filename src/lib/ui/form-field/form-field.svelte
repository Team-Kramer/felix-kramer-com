<script lang="ts">
	type InputType =
		'text' | 'email' | 'number' | 'date' | 'time' | 'url' | 'tel' | 'search' | 'password';

	let {
		id,
		label,
		value = $bindable(''),
		type = 'text',
		hint,
		error,
		min,
		max,
		maxlength,
		step,
		required = false,
		disabled = false,
		multiline = false,
		rows = 4,
		placeholder = '',
		oninput,
		onchange,
		onkeydown
	}: {
		id: string;
		label: string;
		value?: string;
		type?: InputType;
		hint?: string;
		error?: string;
		min?: number;
		max?: number;
		maxlength?: number;
		step?: number | 'any';
		required?: boolean;
		disabled?: boolean;
		multiline?: boolean;
		rows?: number;
		placeholder?: string;
		oninput?: (value: string) => void;
		onchange?: (value: string) => void;
		onkeydown?: (event: KeyboardEvent) => void;
	} = $props();

	const hintId = $derived(`${id}-hint`);
	const errorId = $derived(`${id}-error`);
	const describedBy = $derived(
		[hint ? hintId : null, error ? errorId : null].filter(Boolean).join(' ') || undefined
	);

	const controlClass = $derived(
		`w-full rounded-md border bg-surface-cream px-3 py-2.5 text-ink font-normal focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-accent focus-visible:shadow-focus ${error
			? 'border-danger'
			: 'border-line'}`
	);
</script>

<div class="grid gap-1 text-ink text-body-md">
	<label for={id} class="grid gap-1.5 font-semibold">
		<span>{label}{#if required}<span aria-hidden="true"> *</span>{/if}</span>
		{#if multiline}
			<textarea
				{id}
				{rows}
				bind:value
				{placeholder}
				{maxlength}
				{required}
				{disabled}
				class="{controlClass} resize-y"
				aria-invalid={error ? 'true' : undefined}
				aria-describedby={describedBy}
				onkeydown={(event) => onkeydown?.(event)}
				oninput={(event) => oninput?.(event.currentTarget.value)}
				onchange={(event) => onchange?.(event.currentTarget.value)}
			></textarea>
		{:else}
			<input
				{id}
				{type}
				bind:value
				{placeholder}
				{min}
				{max}
				{maxlength}
				{step}
				{required}
				{disabled}
				class={controlClass}
				aria-invalid={error ? 'true' : undefined}
				aria-describedby={describedBy}
				onkeydown={(event) => onkeydown?.(event)}
				oninput={(event) => oninput?.(event.currentTarget.value)}
				onchange={(event) => onchange?.(event.currentTarget.value)}
			/>
		{/if}
	</label>
	{#if hint}<small id={hintId} class="text-ink-secondary">{hint}</small>{/if}
	{#if error}<small id={errorId} class="text-danger-ink">{error}</small>{/if}
</div>
