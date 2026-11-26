import { createMinimalDataset } from '$lib/engine/dataset/fixture';
import { DatasetValidationError, validateDataset } from '$lib/engine/dataset/schema';
import { serializeDataset } from '$lib/engine/dataset/export';
import type { FootballDataset } from '$lib/engine/dataset/types';
import { cloneDataset } from './operations';

export function createEditorState(initial: FootballDataset = createMinimalDataset()) {
  let loaded = cloneDataset(initial);
  let working = $state<FootballDataset>(cloneDataset(initial));
  let issues = $state<{ path: string; message: string }[]>([]);
  function validate() { try { validateDataset(working); issues = []; return true; } catch (error) { issues = error instanceof DatasetValidationError ? error.issues : [{ path: '', message: error instanceof Error ? error.message : 'Validation failed' }]; return false; } }
  function replace(dataset: FootballDataset) { loaded = cloneDataset(dataset); working = cloneDataset(dataset); validate(); }
  function reset() { working = cloneDataset(loaded); validate(); }
  function exportJson() { return serializeDataset(working); }
  validate();
  return { get dataset() { return working; }, get issues() { return issues; }, validate, replace, reset, exportJson };
}

export function downloadDataset(dataset: FootballDataset): void {
  const blob = new Blob([serializeDataset(dataset)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a'); link.href = url; link.download = `${dataset.dataset.id}.json`; link.click(); URL.revokeObjectURL(url);
}
