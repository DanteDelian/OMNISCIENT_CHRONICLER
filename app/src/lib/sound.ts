/**
 * Sound-Design ohne Asset-Dateien: alle Effekte werden per WebAudio synthetisiert.
 * Dezent abgemischt; global abschaltbar über den Sound-Toggle (ui.sound).
 */
import { ui } from '$lib/stores/ui.svelte';

let ctx: AudioContext | null = null;

function ac(): AudioContext | null {
	if (typeof window === 'undefined') return null;
	if (!ctx) {
		try {
			ctx = new AudioContext();
		} catch {
			return null;
		}
	}
	// Autoplay-Policy: Kontext wird erst nach User-Geste aktiv
	if (ctx.state === 'suspended') void ctx.resume();
	return ctx;
}

interface ToneOpts {
	type?: OscillatorType;
	dur?: number;
	vol?: number;
	delay?: number;
	slide?: number;
}

function tone(freq: number, { type = 'triangle', dur = 0.18, vol = 0.07, delay = 0, slide }: ToneOpts = {}) {
	const a = ac();
	if (!a) return;
	const t0 = a.currentTime + delay;
	const osc = a.createOscillator();
	const gain = a.createGain();
	osc.type = type;
	osc.frequency.setValueAtTime(freq, t0);
	if (slide) osc.frequency.exponentialRampToValueAtTime(Math.max(20, slide), t0 + dur);
	gain.gain.setValueAtTime(0, t0);
	gain.gain.linearRampToValueAtTime(vol, t0 + 0.012);
	gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
	osc.connect(gain).connect(a.destination);
	osc.start(t0);
	osc.stop(t0 + dur + 0.05);
}

function noise(dur = 0.05, vol = 0.05, delay = 0, freq = 1800) {
	const a = ac();
	if (!a) return;
	const t0 = a.currentTime + delay;
	const len = Math.max(1, Math.floor(a.sampleRate * dur));
	const buf = a.createBuffer(1, len, a.sampleRate);
	const data = buf.getChannelData(0);
	for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
	const src = a.createBufferSource();
	src.buffer = buf;
	const bp = a.createBiquadFilter();
	bp.type = 'bandpass';
	bp.frequency.value = freq;
	bp.Q.value = 1.4;
	const gain = a.createGain();
	gain.gain.setValueAtTime(vol, t0);
	gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
	src.connect(bp).connect(gain).connect(a.destination);
	src.start(t0);
}

export const sound = {
	/** Würfel klackern im Becher */
	diceRattle() {
		if (!ui.sound) return;
		[0, 0.06, 0.13, 0.21, 0.3].forEach((d, i) =>
			noise(0.035, 0.05 - i * 0.007, d, 1600 + Math.random() * 700)
		);
	},
	/** Krit-Fanfare (aufsteigender Dur-Akkord) */
	crit() {
		if (!ui.sound) return;
		tone(523.25, { dur: 0.14 });
		tone(659.25, { delay: 0.09, dur: 0.14 });
		tone(783.99, { delay: 0.18, dur: 0.2 });
		tone(1046.5, { delay: 0.28, dur: 0.35, vol: 0.08 });
	},
	/** Patzer (tiefer Sweep) */
	fumble() {
		if (!ui.sound) return;
		tone(200, { type: 'sawtooth', dur: 0.35, vol: 0.05, slide: 65 });
	},
	/** Level-Up-Fanfare */
	levelUp() {
		if (!ui.sound) return;
		[523.25, 659.25, 783.99, 1046.5, 1318.5].forEach((f, i) =>
			tone(f, { delay: i * 0.1, dur: 0.22, vol: 0.07 })
		);
		noise(0.5, 0.018, 0.4, 4200);
	},
	/** Münzklang */
	coin() {
		if (!ui.sound) return;
		tone(2500, { type: 'sine', dur: 0.07, vol: 0.045 });
		tone(3150, { type: 'sine', dur: 0.11, vol: 0.045, delay: 0.06 });
	},
	/** Zauber gewirkt (Shimmer) */
	cast() {
		if (!ui.sound) return;
		tone(880, { type: 'sine', dur: 0.16, vol: 0.05, slide: 1760 });
		noise(0.12, 0.02, 0.02, 5200);
	},
	/** dezenter UI-Klick */
	click() {
		if (!ui.sound) return;
		noise(0.02, 0.028, 0, 3000);
	}
};
