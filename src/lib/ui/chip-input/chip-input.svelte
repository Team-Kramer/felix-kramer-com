<script lang="ts">
	let {
		id,
		label,
		value = [],
		placeholder = 'Add a value',
		validate,
		onchange
	}: {
		id: string;
		label: string;
		value?: string[];
		placeholder?: string;
		validate?: (token: string) => string | null;
		onchange?: (value: string[]) => void;
	} = $props();

	let draft = $state('');
	let error = $state<string | null>(null);

	function addToken() {
		const token = draft.trim();
		if (!token) return;
		const validationError = validate?.(token) ?? null;
		if (validationError) {
			error = validationError;
			return;
		}
		if (value.includes(token)) {
			draft = '';
			error = null;
			return;
		}
		onchange?.([...value, token]);
		draft = '';
		error = null;
	}

	function removeToken(token: string) {
		onchange?.(value.filter((item) => item !== token));
	}
</script>

<div class="grid gap-1.5 text-ink text-body-md font-semibold">
	<label for={id}>{label}</label>
	<div class="flex min-h-[42px] flex-wrap items-center gap-1.5 rounded-md border border-line bg-surface-cream p-1.5">
		{#each value as token (token)}
			<span class="inline-flex items-center gap-1 rounded-full bg-accent-light px-2 py-1 text-caption text-accent-hover">
				{token}
				<button type="button" class="cursor-pointer border-0 bg-transparent text-inherit" aria-label="Remove {token}" onclick={() => removeToken(token)}>×</button>
			</span>
		{/each}
		<input
			{id}
			bind:value={draft}
			{placeholder}
			class="min-w-30 flex-1 border-0 bg-transparent text-ink outline-none font-normal"
			aria-describedby={error ? `${id}-error` : undefined}
			aria-invalid={error ? 'true' : undefined}
			onkeydown={(event) => {
				if (event.key === 'Enter' || event.key === ',') {
					event.preventDefault();
					addToken();
				} else if (event.key === 'Backspace' && !draft && value.length) {
					removeToken(value[value.length - 1]);
				}
			}}
		/>
	</div>
	{#if error}<small id="{id}-error" class="text-danger">{error}</small>{/if}
</div>
