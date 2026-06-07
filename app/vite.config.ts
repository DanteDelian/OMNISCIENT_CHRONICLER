import tailwindcss from '@tailwindcss/vite';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import { SvelteKitPWA } from '@vite-pwa/sveltekit';

export default defineConfig({
	plugins: [
		tailwindcss(),
		sveltekit(),
		SvelteKitPWA({
			registerType: 'autoUpdate',
			injectRegister: 'auto',
			manifest: {
				name: 'Omniscient Chronicler',
				short_name: 'Chronicler',
				description: 'Lokal-first D&D Dashboard & Omni-Notizbuch',
				lang: 'de',
				theme_color: '#0b0a10',
				background_color: '#0b0a10',
				display: 'standalone',
				orientation: 'any',
				start_url: '/',
				icons: [
					{ src: '/favicon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
					{ src: '/favicon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'maskable' }
				]
			},
			workbox: {
				globPatterns: ['**/*.{js,css,html,svg,woff,woff2}'],
				navigateFallback: null
			},
			devOptions: { enabled: false }
		})
	],
	server: { host: true }
});
