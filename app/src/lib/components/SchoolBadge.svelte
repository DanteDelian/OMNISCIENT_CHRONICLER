<script lang="ts">
	import { SCHOOL_COLOR } from '$lib/rules';
	let { school, level }: { school: string; level?: number } = $props();
	const label = $derived(level === undefined ? school : `${level === 0 ? 'Zaubertrick' : `Grad ${level}`} · ${school}`);
</script>

<span class="badge" style="--c: {SCHOOL_COLOR[school] ?? 'var(--color-ink-2)'}">{label}</span>
