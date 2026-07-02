<script lang="ts">
	import { onMount } from 'svelte';
	import Music from '@lucide/svelte/icons/music';
	import X from '@lucide/svelte/icons/x';

	let url = $state('');
	let saved = $state('');

	/** open.spotify.com/(playlist|album|track|artist)/<id> → Embed-URL */
	const embedSrc = $derived.by(() => {
		const m = saved.match(
			/open\.spotify\.com\/(?:intl-[a-z]+\/)?(playlist|album|track|artist|episode|show)\/([A-Za-z0-9]+)/
		);
		return m ? `https://open.spotify.com/embed/${m[1]}/${m[2]}?theme=0` : null;
	});

	onMount(async () => {
		try {
			const r = await fetch('/api/meta');
			if (r.ok) {
				const meta = await r.json();
				saved = meta.spotifyUrl ?? '';
				url = saved;
			}
		} catch {
			/* offline */
		}
	});

	async function save(next: string) {
		saved = next;
		url = next;
		await fetch('/api/meta', {
			method: 'PATCH',
			headers: { 'content-type': 'application/json' },
			body: JSON.stringify({ spotifyUrl: next })
		});
	}
</script>

{#if embedSrc}
	<div class="overflow-hidden rounded-xl">
		<iframe
			title="Spotify"
			src={embedSrc}
			width="100%"
			height="152"
			frameborder="0"
			allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
			loading="lazy"
		></iframe>
	</div>
	<button class="btn btn-ghost mt-2 w-full text-xs text-muted" onclick={() => save('')}>
		<X class="h-3.5 w-3.5" /> Playlist entfernen
	</button>
{:else}
	<div class="flex flex-col gap-2">
		<p class="flex items-center gap-2 text-sm text-muted">
			<Music class="h-4 w-4 text-primary" /> Spotify-Playlist/Album-Link einfügen:
		</p>
		<form
			class="flex gap-2"
			onsubmit={(e) => {
				e.preventDefault();
				if (url.trim()) save(url.trim());
			}}
		>
			<input class="input text-sm" placeholder="https://open.spotify.com/playlist/…" bind:value={url} />
			<button class="btn btn-primary" type="submit">OK</button>
		</form>
		<p class="text-[11px] text-muted">
			Braucht Internet · volle Wiedergabe mit eingeloggtem Spotify. Offline-Alternative: das Musik-Widget.
		</p>
	</div>
{/if}
