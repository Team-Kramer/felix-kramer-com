<script lang="ts">
	import SimulatorPlaceholder from '$lib/components/simulator-placeholder.svelte';
</script>

<SimulatorPlaceholder
	title="Match-Simulation"
	icon="sports_soccer"
	description="Zwei Teams, 10.000 Monte-Carlo-Läufe. Wer gewinnt — und mit welcher Wahrscheinlichkeit?"
	features={[
		'10.000 Monte-Carlo-Simulationen pro Match',
		'Poisson-Verteilung für Torschüsse',
		'8 Taktikformationen (4-4-2 bis 3-5-2)',
		'Heimvorteil & Form der letzten 5 Spiele',
		'Erwartete Torschüsse (xG) pro Team',
		'Wahrscheinlichkeiten: Sieg / Unentschieden / Niederlage'
	]}
/>
