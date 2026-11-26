<script lang="ts">
 import { onMount } from 'svelte';
 import Button from '$lib/ui/button/button.svelte';
 import { datasetStore, initializeDataset } from '$lib/engine/dataset/store.svelte';
 import { createEditorState, downloadDataset, addCompetition, addTeam, addPlayer, addMembership, removeCompetition, removeTeam, removePlayer, removeMembership } from '$lib/dataset-editor';
 import type { FootballDataset } from '$lib/engine/dataset/types';

 let editor: ReturnType<typeof createEditorState> | null = $state(null);
 let selected = $state('competitions');
 let competitionName = $state('');
 let teamName = $state('');
 let playerName = $state('');
 let membershipPlayer = $state('');
 let membershipTeam = $state('');
 let membershipFrom = $state('2026-08-01');
 let membershipTo = $state('');
 let status = $state('');

 onMount(() => {
   initializeDataset();
   editor = createEditorState(datasetStore.dataset ?? undefined);
 });

 function update(fn: (dataset: FootballDataset) => FootballDataset) {
   if (!editor) return;
   editor.replace(fn(editor.dataset));
 }
 function addCompetitionEntry() {
   if (!competitionName.trim()) return;
   update((dataset) => addCompetition(dataset, { name: competitionName, shortName: competitionName.slice(0, 3).toUpperCase(), type: 'league', countryCode: 'XX', level: 1, gender: 'mixed', seasonIds: [] }));
   competitionName = ''; status = 'Competition added';
 }
 function addTeamEntry() {
   if (!teamName.trim()) return;
   update((dataset) => addTeam(dataset, { canonicalName: teamName, shortName: teamName.slice(0, 3).toUpperCase(), countryCode: 'XX', aliases: [] }));
   teamName = ''; status = 'Team added';
 }
 function addPlayerEntry() {
   if (!playerName.trim()) return;
   update((dataset) => addPlayer(dataset, { canonicalName: playerName, nationalityCodes: [], positions: [], status: 'unknown' }));
   playerName = ''; status = 'Player added';
 }
 function addMembershipEntry() {
   if (!membershipPlayer || !membershipTeam || !membershipFrom) return;
   update((dataset) => addMembership(dataset, { playerId: membershipPlayer, teamId: membershipTeam, role: 'player', contractType: 'unknown', validFrom: membershipFrom, validTo: membershipTo || null }));
   status = 'Membership added';
 }
 function exportFile() {
   if (!editor) return;
   if (!editor.validate()) { status = 'Fix validation errors before exporting'; return; }
   downloadDataset(editor.dataset); status = 'Dataset exported';
 }
</script>

<svelte:head><title>Dataset editor — Felix Kramer</title><meta name="description" content="Internal football dataset creation tool" /></svelte:head>

<div class="mx-auto max-w-6xl px-4 py-10">
 <div class="flex flex-wrap items-start justify-between gap-4">
  <div><h1 class="text-3xl font-bold text-ink">Dataset editor</h1><p class="mt-2 text-ink-secondary">Create and validate a local FootballDataset.</p></div>
  <div class="flex gap-2"><Button variant="secondary" disabled={!editor} onclick={exportFile}>Export JSON</Button><Button variant="icon-outline" aria-label="Reset to loaded dataset" disabled={!editor} onclick={() => editor?.reset()}>↺</Button></div>
 </div>
 {#if editor}
  <div class="mt-6 rounded-xl border border-line bg-surface p-4">
   <div class="flex flex-wrap gap-2" role="tablist" aria-label="Dataset sections">
    {#each ['competitions', 'teams', 'players', 'memberships'] as tab}<button type="button" role="tab" class="rounded-full px-4 py-2 text-sm font-bold {selected === tab ? 'bg-accent text-on-teal' : 'border border-line text-ink-secondary'}" aria-selected={selected === tab} onclick={() => selected = tab}>{tab[0].toUpperCase() + tab.slice(1)}</button>{/each}
   </div>
   {#if selected === 'competitions'}
    <section class="mt-6" aria-labelledby="competitions-heading"><h2 id="competitions-heading" class="text-xl font-semibold">Competitions</h2><form class="mt-3 flex flex-wrap gap-2" onsubmit={(e) => { e.preventDefault(); addCompetitionEntry(); }}><input class="rounded border border-line bg-transparent px-3 py-2" aria-label="Competition name" placeholder="Name" bind:value={competitionName} /><Button type="submit">Add competition</Button></form><ul class="mt-4 space-y-2">{#each editor.dataset.competitions as entry (entry.id)}<li class="flex items-center justify-between rounded border border-line px-3 py-2"><span><strong>{entry.name}</strong> <small class="text-ink-tertiary">{entry.id}</small></span><Button variant="destructive" onclick={() => update((d) => removeCompetition(d, entry.id))}>Remove</Button></li>{:else}<li class="text-ink-tertiary">No competitions yet.</li>{/each}</ul></section>
   {:else if selected === 'teams'}
    <section class="mt-6" aria-labelledby="teams-heading"><h2 id="teams-heading" class="text-xl font-semibold">Teams</h2><form class="mt-3 flex flex-wrap gap-2" onsubmit={(e) => { e.preventDefault(); addTeamEntry(); }}><input class="rounded border border-line bg-transparent px-3 py-2" aria-label="Team name" placeholder="Canonical name" bind:value={teamName} /><Button type="submit">Add team</Button></form><ul class="mt-4 space-y-2">{#each editor.dataset.teams as entry (entry.id)}<li class="flex items-center justify-between rounded border border-line px-3 py-2"><span><strong>{entry.canonicalName}</strong> <small class="text-ink-tertiary">{entry.id}</small></span><Button variant="destructive" onclick={() => update((d) => removeTeam(d, entry.id))}>Remove</Button></li>{/each}</ul></section>
   {:else if selected === 'players'}
    <section class="mt-6" aria-labelledby="players-heading"><h2 id="players-heading" class="text-xl font-semibold">Players</h2><form class="mt-3 flex flex-wrap gap-2" onsubmit={(e) => { e.preventDefault(); addPlayerEntry(); }}><input class="rounded border border-line bg-transparent px-3 py-2" aria-label="Player name" placeholder="Canonical name" bind:value={playerName} /><Button type="submit">Add player</Button></form><ul class="mt-4 space-y-2">{#each editor.dataset.players as entry (entry.id)}<li class="flex items-center justify-between rounded border border-line px-3 py-2"><span><strong>{entry.canonicalName}</strong> <small class="text-ink-tertiary">{entry.id}</small></span><Button variant="destructive" onclick={() => update((d) => removePlayer(d, entry.id))}>Remove</Button></li>{:else}<li class="text-ink-tertiary">No players yet.</li>{/each}</ul></section>
   {:else}
    <section class="mt-6" aria-labelledby="memberships-heading"><h2 id="memberships-heading" class="text-xl font-semibold">Memberships</h2><form class="mt-3 grid gap-2 md:grid-cols-4" onsubmit={(e) => { e.preventDefault(); addMembershipEntry(); }}><select class="rounded border border-line bg-transparent px-3 py-2" aria-label="Player" bind:value={membershipPlayer}><option value="">Player</option>{#each editor.dataset.players as player}<option value={player.id}>{player.canonicalName}</option>{/each}</select><select class="rounded border border-line bg-transparent px-3 py-2" aria-label="Team" bind:value={membershipTeam}><option value="">Team</option>{#each editor.dataset.teams as team}<option value={team.id}>{team.canonicalName}</option>{/each}</select><input class="rounded border border-line bg-transparent px-3 py-2" type="date" aria-label="Valid from" bind:value={membershipFrom} /><Button type="submit">Add membership</Button></form><ul class="mt-4 space-y-2">{#each editor.dataset.memberships as entry (entry.id)}<li class="flex items-center justify-between rounded border border-line px-3 py-2"><span>{entry.playerId} → {entry.teamId} <small class="text-ink-tertiary">from {entry.validFrom}</small></span><Button variant="destructive" onclick={() => update((d) => removeMembership(d, entry.id))}>Remove</Button></li>{:else}<li class="text-ink-tertiary">No memberships yet.</li>{/each}</ul></section>
   {/if}
  </div>
  <section class="mt-6 rounded-xl border border-line bg-surface p-4" aria-labelledby="validation-heading"><div class="flex items-center justify-between"><h2 id="validation-heading" class="text-xl font-semibold">Validation</h2><Button variant="secondary" onclick={() => editor?.validate()}>Validate</Button></div>{#if editor.issues.length === 0}<p class="mt-3 text-accent" role="status">Dataset is valid and ready to export.</p>{:else}<ul class="mt-3 space-y-1 text-sm text-coral" role="alert">{#each editor.issues as issue}<li><code>{issue.path || '$'}</code>: {issue.message}</li>{/each}</ul>{/if}{#if status}<p class="mt-3 text-sm text-ink-tertiary" role="status">{status}</p>{/if}</section>
 {:else}<p class="mt-8 text-ink-secondary">Loading dataset…</p>{/if}
</div>
