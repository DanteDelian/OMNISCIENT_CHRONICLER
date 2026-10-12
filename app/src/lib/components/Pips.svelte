<script lang="ts">
	/** Ressourcen-Punkte: voll = verfügbar. Klick auf voll verbraucht, auf leer stellt wieder her. */
	let {
		total,
		left,
		color = 'var(--color-astral)',
		label = '',
		size = 'md',
		ontoggle
	}: {
		total: number;
		left: number;
		color?: string;
		label?: string;
		size?: 'sm' | 'md';
		ontoggle?: (full: boolean) => void;
	} = $props();
</script>

<div class="flex flex-wrap items-center gap-1.5" role="group" aria-label={label}>
	{#each Array.from({ length: total }) as _, i (i)}
		{@const full = i < left}
		<button
			type="button"
			class="pip {full ? '' : 'pip-used'} {size === 'sm' ? '!h-3.5 !w-3.5' : ''}"
			style="--c: {color}"
			title={full ? `${label}: verfügbar (klicken = verbrauchen)` : `${label}: verbraucht (klicken = zurück)`}
			aria-label={full ? `${label} ${i + 1} verfügbar` : `${label} ${i + 1} verbraucht`}
			onclick={() => ontoggle?.(full)}
		></button>
	{/each}
</div>
