// Re-export shim: the implementation lives in index.svelte.ts because it
// uses Svelte 5 runes ($state), which require the .svelte.ts extension.
export * from './index.svelte';
