<script lang="ts">
	import { enhance } from '$app/forms';
	import Feather from '@lucide/svelte/icons/feather';
	let { form } = $props();
</script>

<svelte:head><title>Anmelden · Omniscient Chronicler</title></svelte:head>

<div class="grid min-h-[70vh] place-items-center">
	<div class="card card-pad w-full max-w-sm text-center">
		<span class="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-2xl bg-primary text-primary-fg">
			<Feather class="h-6 w-6" />
		</span>
		<h1 class="font-display text-xl font-bold">Omniscient Chronicler</h1>
		<p class="mb-4 text-sm text-muted">Bitte PIN eingeben</p>
		<form method="POST" use:enhance class="flex flex-col gap-3">
			<input
				class="input text-center text-2xl tracking-[0.5em]"
				type="password"
				name="pin"
				inputmode="numeric"
				autocomplete="current-password"
				placeholder="••••"
			/>
			{#if form?.error}<p class="text-sm text-danger">{form.error}</p>{/if}
			<button class="btn btn-primary" type="submit">Entsperren</button>
		</form>
	</div>
</div>
