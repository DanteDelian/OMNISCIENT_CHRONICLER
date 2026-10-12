<script lang="ts">
	import { enhance } from '$app/forms';
	let { form } = $props();
</script>

<svelte:head><title>Anmelden · Valerius</title></svelte:head>

<div class="relative z-10 grid min-h-dvh place-items-center p-4">
	<form method="POST" use:enhance class="panel panel-glow w-full max-w-sm p-6 text-center">
		<img src="/favicon.svg" alt="" class="mx-auto h-12 w-12" />
		<h1 class="title-display mt-3 text-3xl">Valerius' Grimoire</h1>
		<p class="mt-1 text-sm text-ink-3">PIN eingeben</p>
		<input class="input num mt-5 !h-12 text-center text-xl tracking-[0.4em]" type="password" name="pin" aria-label="PIN" inputmode="numeric" autocomplete="current-password" required />
		{#if form?.wrong}<p class="mt-2 text-sm text-blood">Falsche PIN.</p>{/if}
		<button class="btn btn-primary mt-4 w-full">Öffnen</button>
	</form>
</div>
