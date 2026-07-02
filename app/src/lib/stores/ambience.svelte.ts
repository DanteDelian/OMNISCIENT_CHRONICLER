/**
 * Prozedurale Ambience-Engine: generative Fantasy-Klangwelten, komplett per
 * WebAudio synthetisiert — keine Dateien, kein Netz, kein Loop-Gefühl (LFO-moduliert).
 */
export type Mood = 'tavern' | 'travel' | 'combat' | 'rest';

export const MOODS: { id: Mood; label: string; hint: string }[] = [
	{ id: 'tavern', label: 'Taverne', hint: 'Harfe & Stimmengemurmel' },
	{ id: 'travel', label: 'Reise', hint: 'Weite Flächen & Wind' },
	{ id: 'combat', label: 'Kampf', hint: 'Trommeln & tiefe Drones' },
	{ id: 'rest', label: 'Ruhe', hint: 'Sanfte Sphärenklänge' }
];

// Pentatonik in a-Moll — klingt immer „richtig"
const SCALE = [220, 261.63, 293.66, 329.63, 392, 440, 523.25];

class AmbienceStore {
	mood = $state<Mood | null>(null);
	volume = $state(0.5);

	#ctx: AudioContext | null = null;
	#master: GainNode | null = null;
	#stops: (() => void)[] = [];

	#ensure(): { ctx: AudioContext; master: GainNode } | null {
		if (typeof window === 'undefined') return null;
		if (!this.#ctx) {
			try {
				this.#ctx = new AudioContext();
				this.#master = this.#ctx.createGain();
				this.#master.gain.value = this.volume * 0.4;
				this.#master.connect(this.#ctx.destination);
			} catch {
				return null;
			}
		}
		if (this.#ctx.state === 'suspended') void this.#ctx.resume();
		return { ctx: this.#ctx, master: this.#master! };
	}

	setVolume(v: number) {
		this.volume = v;
		if (this.#master) this.#master.gain.value = v * 0.4;
	}

	toggle(m: Mood) {
		if (this.mood === m) this.stop();
		else this.play(m);
	}

	stop() {
		for (const s of this.#stops) {
			try {
				s();
			} catch {
				/* ignore */
			}
		}
		this.#stops = [];
		this.mood = null;
	}

	play(m: Mood) {
		this.stop();
		const env = this.#ensure();
		if (!env) return;
		const { ctx, master } = env;
		this.mood = m;

		// --- Bausteine ---
		const drone = (freq: number, type: OscillatorType, gain: number, lfoRate = 0.07) => {
			const osc = ctx.createOscillator();
			const g = ctx.createGain();
			const lfo = ctx.createOscillator();
			const lfoGain = ctx.createGain();
			osc.type = type;
			osc.frequency.value = freq;
			g.gain.value = gain;
			lfo.frequency.value = lfoRate;
			lfoGain.gain.value = gain * 0.35;
			lfo.connect(lfoGain).connect(g.gain);
			osc.connect(g).connect(master);
			osc.start();
			lfo.start();
			this.#stops.push(() => {
				osc.stop();
				lfo.stop();
				g.disconnect();
			});
		};

		const noiseBed = (filterFreq: number, gain: number, lfoDepth = 0) => {
			const len = ctx.sampleRate * 2;
			const buf = ctx.createBuffer(1, len, ctx.sampleRate);
			const data = buf.getChannelData(0);
			let last = 0;
			for (let i = 0; i < len; i++) {
				// gefiltertes „braunes" Rauschen — weicher als weißes
				last = (last + (Math.random() * 2 - 1) * 0.04) * 0.98;
				data[i] = last * 8;
			}
			const src = ctx.createBufferSource();
			src.buffer = buf;
			src.loop = true;
			const lp = ctx.createBiquadFilter();
			lp.type = 'lowpass';
			lp.frequency.value = filterFreq;
			const g = ctx.createGain();
			g.gain.value = gain;
			if (lfoDepth > 0) {
				const lfo = ctx.createOscillator();
				const lg = ctx.createGain();
				lfo.frequency.value = 0.05 + Math.random() * 0.05;
				lg.gain.value = filterFreq * lfoDepth;
				lfo.connect(lg).connect(lp.frequency);
				lfo.start();
				this.#stops.push(() => lfo.stop());
			}
			src.connect(lp).connect(g).connect(master);
			src.start();
			this.#stops.push(() => {
				src.stop();
				g.disconnect();
			});
		};

		const pluck = (freq: number, vol: number) => {
			const t0 = ctx.currentTime;
			const osc = ctx.createOscillator();
			const g = ctx.createGain();
			osc.type = 'triangle';
			osc.frequency.value = freq;
			g.gain.setValueAtTime(0, t0);
			g.gain.linearRampToValueAtTime(vol, t0 + 0.015);
			g.gain.exponentialRampToValueAtTime(0.0001, t0 + 1.4);
			osc.connect(g).connect(master);
			osc.start(t0);
			osc.stop(t0 + 1.5);
		};

		const drum = (vol: number) => {
			const t0 = ctx.currentTime;
			const osc = ctx.createOscillator();
			const g = ctx.createGain();
			osc.type = 'sine';
			osc.frequency.setValueAtTime(110, t0);
			osc.frequency.exponentialRampToValueAtTime(45, t0 + 0.25);
			g.gain.setValueAtTime(vol, t0);
			g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.3);
			osc.connect(g).connect(master);
			osc.start(t0);
			osc.stop(t0 + 0.35);
		};

		const every = (minMs: number, maxMs: number, fn: () => void) => {
			let timer: ReturnType<typeof setTimeout>;
			const tick = () => {
				fn();
				timer = setTimeout(tick, minMs + Math.random() * (maxMs - minMs));
			};
			timer = setTimeout(tick, 300);
			this.#stops.push(() => clearTimeout(timer));
		};

		// --- Stimmungen ---
		if (m === 'tavern') {
			noiseBed(420, 0.05); // Gemurmel
			drone(110, 'triangle', 0.02, 0.05);
			every(700, 1900, () => pluck(SCALE[Math.floor(Math.random() * SCALE.length)], 0.05));
		} else if (m === 'travel') {
			noiseBed(900, 0.045, 0.5); // Wind mit wandernder Filterfrequenz
			drone(146.83, 'triangle', 0.028, 0.06);
			drone(220, 'sine', 0.02, 0.09);
			every(4000, 9000, () => pluck(SCALE[Math.floor(Math.random() * 4)] * 2, 0.03));
		} else if (m === 'combat') {
			drone(55, 'sawtooth', 0.035, 0.12);
			drone(110, 'triangle', 0.02, 0.2);
			let beat = 0;
			every(600, 640, () => {
				beat++;
				drum(beat % 4 === 0 ? 0.16 : 0.1);
			});
		} else {
			// rest
			drone(174.61, 'sine', 0.035, 0.04);
			drone(261.63, 'sine', 0.022, 0.06);
			every(6000, 12000, () => pluck(SCALE[2 + Math.floor(Math.random() * 3)] * 2, 0.02));
		}
	}
}

export const ambience = new AmbienceStore();
