<script lang="ts">
	import { untrack } from 'svelte';
	import { Tween } from 'svelte/motion';
	import { cubicOut } from 'svelte/easing';

	let {
		value,
		duration = 450,
		class: cls = ''
	}: { value: number; duration?: number; class?: string } = $props();

	const tween = new Tween(untrack(() => value), {
		duration: untrack(() => duration),
		easing: cubicOut
	});
	$effect(() => {
		tween.target = value;
	});
</script>

<span class={cls}>{Math.round(tween.current)}</span>
