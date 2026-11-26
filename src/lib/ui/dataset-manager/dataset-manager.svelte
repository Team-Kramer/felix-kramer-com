<script lang="ts">
	import { onMount } from 'svelte';
	import Button from '../button/button.svelte';
	import type { DatasetExportProfile } from '$lib/engine/dataset/export';
	import {
		datasetStore,
		exportDatasetFile,
		initializeDataset,
		importDatasetFileIntoStore,
		resetDataset
	} from '$lib/engine/dataset/store.svelte';

	let fileInput: HTMLInputElement;
	let busy = $state(false);
	let exportProfile = $state<DatasetExportProfile>('internal-complete');

	onMount(initializeDataset);

	async function importFile(event: Event) {
		const input = event.currentTarget as HTMLInputElement;
		const file = input.files?.[0];
		input.value = '';
		if (!file) return;
		busy = true;
		try {
			await importDatasetFileIntoStore(file);
		} catch (error) {
			if (!datasetStore.error) {
				datasetStore.error = error instanceof Error ? error.message : 'Dataset import failed.';
			}
		} finally {
			busy = false;
		}
	}

	function exportFile() {
		exportDatasetFile(exportProfile);
	}
</script>

<section class="mt-6 rounded-xl border border-line bg-surface p-4" aria-label="Dataset-Verwaltung">
	<div class="flex flex-wrap items-center justify-between gap-3">
		<div>
			<p class="text-sm font-semibold text-ink">
				{datasetStore.dataset?.dataset.name ?? 'Dataset wird geladen'}
			</p>
			<p class="text-caption text-ink-tertiary">
				{datasetStore.isUserDataset ? 'User-provided Dataset' : 'Fiktionaler Beispieldatensatz'}
			</p>
		</div>
		<div class="flex flex-wrap gap-2">
			<Button variant="secondary" busy={busy} onclick={() => fileInput?.click()}>
				JSON importieren
			</Button>
			<label class="flex items-center gap-2 text-caption text-ink-tertiary">
				<select bind:value={exportProfile} aria-label="Exportprofil" class="rounded border border-line bg-surface px-2 py-1 text-sm text-ink">
					<option value="minimal">Minimal</option>
					<option value="simulation-compact">Simulation compact</option>
					<option value="simulation">Simulation</option>
					<option value="detailed">Detailed</option>
					<option value="historical">Historical</option>
					<option value="internal-complete">Internal complete</option>
				</select>
				</label>
			<Button variant="icon-outline" aria-label="Aktuelle Liga exportieren" onclick={exportFile}>
				<span class="material-symbols-outlined" aria-hidden="true">download</span>
			</Button>
			{#if datasetStore.isUserDataset}
				<Button variant="icon-outline" aria-label="Fiktionalen Datensatz laden" onclick={resetDataset}>
					<span class="material-symbols-outlined" aria-hidden="true">restart_alt</span>
				</Button>
			{/if}
		</div>
	</div>
	<input bind:this={fileInput} class="hidden" type="file" accept="application/json,.json" onchange={importFile} />
	<p class="mt-3 text-caption text-ink-tertiary">
		Exportierte JSON-Dateien können privat über Google Drive, Dropbox oder OneDrive geteilt werden.
	</p>
	{#if !datasetStore.storageAvailable}
		<p class="mt-2 text-sm text-coral" role="alert">
			Browser-Speicher ist nicht verfügbar — Änderungen werden nicht gespeichert und gehen beim Schließen verloren.
		</p>
	{/if}
	{#if datasetStore.error}
		<p class="mt-2 text-sm text-coral" role="alert">{datasetStore.error}</p>
	{/if}
</section>
