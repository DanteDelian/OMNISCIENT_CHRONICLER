<script lang="ts">
	/**
	 * Sternenfeld hinter allem: drei Tiefenebenen, die sehr langsam ziehen und funkeln, ein ruhender Nebel und
	 * gelegentlich eine Sternschnuppe. Pausiert, wenn der Tab verdeckt ist, steht still bei reduzierter Bewegung
	 * und zeichnet höchstens 30 Bilder pro Sekunde, damit Tablets kühl bleiben.
	 */
	import { onMount } from 'svelte';

	let canvas: HTMLCanvasElement;

	interface Star {
		x: number;
		y: number;
		/** Tiefe 0 (fern) bis 1 (nah) */
		z: number;
		r: number;
		phase: number;
		speed: number;
		tint: number;
	}
	interface Meteor {
		x: number;
		y: number;
		vx: number;
		vy: number;
		life: number;
		max: number;
	}

	const TINTS = ['255,255,255', '214,208,255', '190,226,255', '255,236,200'];

	onMount(() => {
		const ctx = canvas.getContext('2d', { alpha: true });
		if (!ctx) return;
		const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
		let w = 0;
		let h = 0;
		let dpr = 1;
		let stars: Star[] = [];
		let meteor: Meteor | null = null;
		let nextMeteor = performance.now() + 9000 + Math.random() * 14000;
		let raf = 0;
		let lastDraw = 0;
		let lastTick = 0;
		const sprites: HTMLCanvasElement[] = [];
		let nebula: HTMLCanvasElement | null = null;

		// Ein weicher Stern als Bild, je Farbton einmal gezeichnet: drawImage ist viel schneller als Verläufe pro Stern.
		for (const tint of TINTS) {
			const s = document.createElement('canvas');
			s.width = s.height = 32;
			const g = s.getContext('2d');
			if (!g) continue;
			const grad = g.createRadialGradient(16, 16, 0, 16, 16, 16);
			grad.addColorStop(0, `rgba(${tint},1)`);
			grad.addColorStop(0.18, `rgba(${tint},0.85)`);
			grad.addColorStop(0.45, `rgba(${tint},0.18)`);
			grad.addColorStop(1, `rgba(${tint},0)`);
			g.fillStyle = grad;
			g.fillRect(0, 0, 32, 32);
			sprites.push(s);
		}

		function paintNebula() {
			nebula = document.createElement('canvas');
			nebula.width = Math.max(1, Math.round(w * dpr * 0.5));
			nebula.height = Math.max(1, Math.round(h * dpr * 0.5));
			const g = nebula.getContext('2d');
			if (!g) return;
			const W = nebula.width;
			const H = nebula.height;
			const blob = (x: number, y: number, r: number, color: string) => {
				const grad = g.createRadialGradient(x, y, 0, x, y, r);
				grad.addColorStop(0, color);
				grad.addColorStop(1, 'rgba(0,0,0,0)');
				g.fillStyle = grad;
				g.fillRect(0, 0, W, H);
			};
			blob(W * 0.18, H * 0.12, Math.max(W, H) * 0.55, 'rgba(120,104,255,0.10)');
			blob(W * 0.86, H * 0.05, Math.max(W, H) * 0.45, 'rgba(90,180,255,0.08)');
			blob(W * 0.62, H * 0.78, Math.max(W, H) * 0.5, 'rgba(160,90,220,0.05)');
			blob(W * 0.35, H * 1.05, Math.max(W, H) * 0.4, 'rgba(230,189,110,0.035)');
		}

		function seed() {
			const count = Math.round(Math.min(900, (w * h) / 2300));
			stars = Array.from({ length: count }, () => {
				const z = Math.random() ** 1.6;
				return {
					x: Math.random() * w,
					y: Math.random() * h,
					z,
					r: 0.35 + z * 1.15 + (Math.random() < 0.04 ? 0.9 : 0),
					phase: Math.random() * Math.PI * 2,
					speed: 0.35 + Math.random() * 1.3,
					tint: Math.random() < 0.7 ? 0 : 1 + Math.floor(Math.random() * 3)
				};
			});
		}

		function resize() {
			dpr = Math.min(2, window.devicePixelRatio || 1);
			w = window.innerWidth;
			h = window.innerHeight;
			canvas.width = Math.round(w * dpr);
			canvas.height = Math.round(h * dpr);
			seed();
			paintNebula();
			draw(performance.now(), 0);
		}

		function draw(t: number, dt: number) {
			if (!ctx) return;
			ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
			ctx.clearRect(0, 0, w, h);

			// Nebel: ruht fast, atmet nur ganz leicht
			if (nebula) {
				const ox = Math.sin(t / 47000) * 18;
				const oy = Math.cos(t / 61000) * 12;
				ctx.globalAlpha = 0.92 + Math.sin(t / 23000) * 0.08;
				ctx.drawImage(nebula, ox - 20, oy - 20, w + 40, h + 40);
			}

			for (const s of stars) {
				if (dt) {
					// Nahe Sterne ziehen schneller: Tiefe ohne Kamera
					s.x -= dt * 0.0025 * (0.15 + s.z);
					if (s.x < -4) s.x += w + 8;
				}
				const tw = reduce.matches ? 0.8 : 0.55 + 0.45 * Math.sin(t * 0.001 * s.speed + s.phase);
				const alpha = (0.25 + 0.75 * s.z) * tw;
				const size = s.r * 5;
				ctx.globalAlpha = alpha;
				ctx.drawImage(sprites[s.tint] ?? sprites[0], s.x - size / 2, s.y - size / 2, size, size);
			}

			// Sternschnuppe
			if (meteor) {
				const m = meteor;
				const p = m.life / m.max;
				const fade = p < 0.15 ? p / 0.15 : 1 - (p - 0.15) / 0.85;
				const tail = 120;
				const len = Math.hypot(m.vx, m.vy) || 1;
				const grad = ctx.createLinearGradient(m.x, m.y, m.x - (m.vx / len) * tail, m.y - (m.vy / len) * tail);
				grad.addColorStop(0, `rgba(255,246,223,${0.9 * fade})`);
				grad.addColorStop(1, 'rgba(255,246,223,0)');
				ctx.globalAlpha = 1;
				ctx.strokeStyle = grad;
				ctx.lineWidth = 1.4;
				ctx.beginPath();
				ctx.moveTo(m.x, m.y);
				ctx.lineTo(m.x - (m.vx / len) * tail, m.y - (m.vy / len) * tail);
				ctx.stroke();
			}
			ctx.globalAlpha = 1;
		}

		function frame(t: number) {
			raf = requestAnimationFrame(frame);
			if (t - lastDraw < 33) return;
			const dt = Math.min(80, lastTick ? t - lastTick : 16);
			lastTick = t;
			lastDraw = t;
			if (!meteor && t > nextMeteor) {
				const fromLeft = Math.random() < 0.5;
				meteor = { x: fromLeft ? Math.random() * w * 0.5 : w * (0.5 + Math.random() * 0.5), y: Math.random() * h * 0.35, vx: (fromLeft ? 1 : -1) * (0.5 + Math.random() * 0.4), vy: 0.22 + Math.random() * 0.2, life: 0, max: 900 + Math.random() * 500 };
				nextMeteor = t + 14000 + Math.random() * 26000;
			}
			if (meteor) {
				meteor.x += meteor.vx * dt;
				meteor.y += meteor.vy * dt;
				meteor.life += dt;
				if (meteor.life > meteor.max) meteor = null;
			}
			draw(t, dt);
		}

		function start() {
			cancelAnimationFrame(raf);
			lastTick = 0;
			if (reduce.matches || document.hidden) {
				draw(performance.now(), 0);
				return;
			}
			raf = requestAnimationFrame(frame);
		}

		let resizeTimer: ReturnType<typeof setTimeout> | undefined;
		const onResize = () => {
			clearTimeout(resizeTimer);
			resizeTimer = setTimeout(resize, 150);
		};
		const onVisibility = () => (document.hidden ? cancelAnimationFrame(raf) : start());

		resize();
		start();
		window.addEventListener('resize', onResize);
		document.addEventListener('visibilitychange', onVisibility);
		reduce.addEventListener('change', start);
		return () => {
			cancelAnimationFrame(raf);
			clearTimeout(resizeTimer);
			window.removeEventListener('resize', onResize);
			document.removeEventListener('visibilitychange', onVisibility);
			reduce.removeEventListener('change', start);
		};
	});
</script>

<canvas bind:this={canvas} class="starfield-canvas" aria-hidden="true"></canvas>
