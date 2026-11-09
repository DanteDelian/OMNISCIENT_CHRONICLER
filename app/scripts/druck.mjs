#!/usr/bin/env node
/**
 * Erzeugt die Druckfassung als PDF-Dateien im Ordner druck/ (Projektwurzel).
 * Steuert Edge oder Chrome ohne Fenster über das DevTools-Protokoll an.
 *
 * Voraussetzung: Das Grimoire läuft (start.bat oder npm run dev).
 * Aufruf:  npm run druck
 *          npm run druck -- --url http://localhost:3000
 *          npm run druck -- --nur zauber,bogen
 * Mit gesetzter APP_PIN (.env) meldet sich das Skript selbst an.
 */
import { spawn } from 'node:child_process';
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..', '..');
const outDir = path.join(root, 'druck');

/** Welche PDFs entstehen: Dateiname → Teile der Druckfassung (siehe src/lib/print.ts). */
const JOBS = [
	{ file: '00-grimoire-komplett.pdf', teil: null },
	{ file: '01-charakterbogen.pdf', teil: 'bogen' },
	{ file: '02-sitzungsbogen.pdf', teil: 'spielbogen' },
	{ file: '03-zauberbuch.pdf', teil: 'zauber' },
	{ file: '04-gefolge.pdf', teil: 'gefolge' },
	{ file: '05-regeln.pdf', teil: 'regeln' },
	{ file: '06-inventar.pdf', teil: 'inventar' },
	{ file: '07-quests.pdf', teil: 'quests' },
	{ file: '08-journal.pdf', teil: 'journal' },
	{ file: '09-welt.pdf', teil: 'welt' },
	{ file: '10-karte.pdf', teil: 'karte' },
	{ file: '11-archiv.pdf', teil: 'archiv' },
	{ file: '12-zauberkarten.pdf', teil: 'zauberkarten' },
	{ file: '13-fragen-an-den-dm.pdf', teil: 'fragen' },
	{ file: '14-raetselwand.pdf', teil: 'raetsel' },
	{ file: '15-netzwerk.pdf', teil: 'netzwerk' },
	{ file: '16-begriffe-deutsch-englisch.pdf', teil: 'begriffe' },
	{ file: '17-wer-weiss-was.pdf', teil: 'geheimnisse' }
];

// ---------- Argumente und .env ----------
const args = process.argv.slice(2);
const arg = (name) => {
	const i = args.indexOf(`--${name}`);
	return i >= 0 ? args[i + 1] : undefined;
};

function readEnv() {
	const file = path.join(root, '.env');
	const env = {};
	if (!fs.existsSync(file)) return env;
	for (const line of fs.readFileSync(file, 'utf-8').split(/\r?\n/)) {
		const m = line.match(/^\s*([A-Z_]+)\s*=\s*(.*)\s*$/);
		if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, '');
	}
	return env;
}
const env = { ...readEnv(), ...process.env };

async function findServer() {
	const candidates = arg('url') ? [arg('url')] : ['http://localhost:5173', `http://localhost:${env.PORT || 3000}`];
	for (const url of candidates) {
		try {
			// Großzügig: Der erste Aufruf nach dem Start eines Dev-Servers kompiliert erst.
			const res = await fetch(`${url.replace(/\/$/, '')}/api/health`, { signal: AbortSignal.timeout(15000) });
			if (res.ok) return url.replace(/\/$/, '');
		} catch {
			/* nächster Kandidat */
		}
	}
	return null;
}

function findBrowser() {
	const list = [
		env.BROWSER,
		'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
		'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
		'C:/Program Files/Google/Chrome/Application/chrome.exe',
		'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
		'/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
		'/usr/bin/google-chrome',
		'/usr/bin/chromium',
		'/usr/bin/chromium-browser',
		'/usr/bin/microsoft-edge'
	].filter(Boolean);
	return list.find((p) => fs.existsSync(p));
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ---------- Minimaler DevTools-Client ----------
class Cdp {
	constructor(ws) {
		this.ws = ws;
		this.id = 0;
		this.pending = new Map();
		this.listeners = new Map();
		ws.addEventListener('message', (ev) => {
			const msg = JSON.parse(typeof ev.data === 'string' ? ev.data : Buffer.from(ev.data).toString());
			if (msg.id && this.pending.has(msg.id)) {
				const { resolve, reject } = this.pending.get(msg.id);
				this.pending.delete(msg.id);
				if (msg.error) reject(new Error(msg.error.message));
				else resolve(msg.result);
			} else if (msg.method) {
				for (const fn of this.listeners.get(msg.method) ?? []) fn(msg.params);
			}
		});
	}
	static async connect(url) {
		const ws = new WebSocket(url);
		await new Promise((resolve, reject) => {
			ws.addEventListener('open', resolve, { once: true });
			ws.addEventListener('error', reject, { once: true });
		});
		return new Cdp(ws);
	}
	send(method, params = {}) {
		const id = ++this.id;
		this.ws.send(JSON.stringify({ id, method, params }));
		return new Promise((resolve, reject) => this.pending.set(id, { resolve, reject }));
	}
	once(method) {
		return new Promise((resolve) => {
			const list = this.listeners.get(method) ?? [];
			const fn = (p) => {
				this.listeners.set(method, (this.listeners.get(method) ?? []).filter((x) => x !== fn));
				resolve(p);
			};
			list.push(fn);
			this.listeners.set(method, list);
		});
	}
	close() {
		this.ws.close();
	}
}

async function startBrowser(exe) {
	const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'grimoire-druck-'));
	const proc = spawn(exe, ['--headless=new', '--remote-debugging-port=0', `--user-data-dir=${profile}`, '--no-first-run', '--no-default-browser-check', '--disable-extensions', 'about:blank'], {
		stdio: 'ignore'
	});
	const portFile = path.join(profile, 'DevToolsActivePort');
	for (let i = 0; i < 100 && !fs.existsSync(portFile); i++) await sleep(100);
	if (!fs.existsSync(portFile)) throw new Error('Der Browser hat keinen DevTools-Port geöffnet.');
	const port = fs.readFileSync(portFile, 'utf-8').split(/\r?\n/)[0].trim();
	const stop = async () => {
		// Sauber beenden, damit alle Unterprozesse das Profil freigeben.
		try {
			const { webSocketDebuggerUrl } = await (await fetch(`http://127.0.0.1:${port}/json/version`)).json();
			const browser = await Cdp.connect(webSocketDebuggerUrl);
			await Promise.race([browser.send('Browser.close'), sleep(2000)]);
		} catch (e) {
			console.warn(`Browser ließ sich nicht sauber schließen: ${e instanceof Error ? e.message : e}`);
			proc.kill();
		}
		await Promise.race([new Promise((r) => (proc.exitCode !== null ? r() : proc.once('exit', r))), sleep(5000)]);
		for (let i = 0; i < 20; i++) {
			try {
				fs.rmSync(profile, { recursive: true, force: true });
				return;
			} catch {
				await sleep(250);
			}
		}
		console.warn(`Hinweis: Temporäres Browser-Profil blieb liegen: ${profile}`);
	};
	return { port, stop };
}

async function newPage(port) {
	const res = await fetch(`http://127.0.0.1:${port}/json/new?about:blank`, { method: 'PUT' });
	const target = await res.json();
	return Cdp.connect(target.webSocketDebuggerUrl);
}

/**
 * Blätter, die im Druck breiter als der Satzspiegel (180 mm) werden. Ist eines zu breit, verkleinert Edge seit
 * Version 157 die ganze PDF. Die Zauberkarten haben eigene, schmalere Ränder und zählen nicht.
 */
async function tooWide(cdp) {
	await cdp.send('Emulation.setEmulatedMedia', { media: 'print' });
	await cdp.send('Emulation.setDeviceMetricsOverride', { width: 680, height: 1000, deviceScaleFactor: 1, mobile: false });
	try {
		const r = await cdp.send('Runtime.evaluate', {
			expression: `[...document.querySelectorAll('.druck .sheet:not(.cards-sheet)')]
				.filter((el) => el.scrollWidth > el.clientWidth + 2)
				.map((el) => (el.id || el.className).replace(/^doc-/, ''))`,
			returnByValue: true
		});
		return r.result?.value ?? [];
	} finally {
		await cdp.send('Emulation.clearDeviceMetricsOverride');
		await cdp.send('Emulation.setEmulatedMedia', { media: '' });
	}
}

/** Druckt eine Seite als PDF und gibt die Datei als Buffer zurück. */
async function printPdf(cdp, url) {
	const loaded = cdp.once('Page.loadEventFired');
	await cdp.send('Page.navigate', { url });
	await loaded;
	// Warten, bis die Druckfassung gerendert ist, Schriften und Bilder geladen sind.
	const ready = `(async () => {
		await document.fonts.ready;
		const sheets = document.querySelectorAll('.druck .sheet').length;
		const imgs = [...document.images].every((i) => i.complete && i.naturalWidth > 0);
		return sheets > 0 && imgs;
	})()`;
	let ok = false;
	for (let i = 0; i < 60 && !ok; i++) {
		const r = await cdp.send('Runtime.evaluate', { expression: ready, awaitPromise: true, returnByValue: true });
		ok = r.result?.value === true;
		if (!ok) await sleep(250);
	}
	if (!ok) throw new Error(`Seite nicht fertig geladen: ${url}`);
	const wide = await tooWide(cdp);
	if (wide.length) console.warn(`  Achtung, breiter als die Seite: ${wide.join(', ')}. Edge verkleinert dann die ganze PDF.`);
	await sleep(300);
	const base = { printBackground: true, preferCSSPageSize: true, displayHeaderFooter: false };
	let pdf;
	try {
		pdf = await cdp.send('Page.printToPDF', { ...base, generateTaggedPDF: true, generateDocumentOutline: true });
	} catch {
		pdf = await cdp.send('Page.printToPDF', base);
	}
	return Buffer.from(pdf.data, 'base64');
}

/**
 * Benannte Sprungziele eines Chrome-PDFs mit ihrer Seitenzahl (ab 1). Chrome legt sie für jedes Element an, auf das
 * ein interner Link zeigt (Inhaltsverzeichnis, Kapitelübersicht). Liest nur das einfache Format ohne Objekt-Streams,
 * das Chrome schreibt. Klappt das nicht, gibt es eine leere Liste und das Inhaltsverzeichnis bleibt ohne Zahlen.
 */
function pdfDestPages(buf) {
	const s = buf.toString('latin1');
	const offsets = new Map();
	for (const m of s.matchAll(/(?:^|[\r\n])(\d+) 0 obj\b/g)) offsets.set(Number(m[1]), m.index + m[0].length);
	const obj = (n) => {
		const at = offsets.get(n);
		return at === undefined ? '' : s.slice(at, s.indexOf('endobj', at));
	};
	const at = s.search(/\/Type\s*\/Catalog\b/);
	if (at < 0) return new Map();
	const catalog = s.slice(at, s.indexOf('endobj', at));
	const pagesRoot = Number(catalog.match(/\/Pages (\d+) 0 R/)?.[1]);
	const destsObj = Number(catalog.match(/\/Dests (\d+) 0 R/)?.[1]);
	if (!pagesRoot || !destsObj) return new Map();
	const order = [];
	const walk = (n, depth = 0) => {
		const o = obj(n);
		if (depth < 32 && /\/Type\s*\/Pages\b/.test(o)) {
			for (const k of (o.match(/\/Kids\s*\[([^\]]*)\]/)?.[1] ?? '').matchAll(/(\d+) 0 R/g)) walk(Number(k[1]), depth + 1);
		} else order.push(n);
	};
	walk(pagesRoot);
	const pageNo = new Map(order.map((n, i) => [n, i + 1]));
	const result = new Map();
	for (const m of obj(destsObj).matchAll(/\/([^\s/\[\]<>()]+)\s*(?:\[\s*(\d+) 0 R|(\d+) 0 R)/g)) {
		const name = m[1].replace(/#([0-9a-f]{2})/gi, (_, h) => String.fromCharCode(parseInt(h, 16)));
		const page = m[2] ? Number(m[2]) : Number(obj(Number(m[3])).match(/\[\s*(\d+) 0 R/)?.[1]);
		if (pageNo.has(page)) result.set(name, pageNo.get(page));
	}
	return result;
}

/** Seitenzahlen für die Druckseite: Teile (Sprungziel doc-<id>) und Kapitel (kap-<n>) als „id:seite,…“. */
function pageParam(dests) {
	return [...dests]
		.filter(([name]) => name.startsWith('doc-') || name.startsWith('kap-'))
		.map(([name, page]) => `${name.startsWith('doc-') ? name.slice(4) : name}:${page}`)
		.join(',');
}

// ---------- Ablauf ----------
const server = await findServer();
if (!server) {
	console.error('Das Grimoire läuft nicht. Erst start.bat (oder npm run dev) starten, dann erneut: npm run druck');
	process.exit(1);
}
const exe = findBrowser();
if (!exe) {
	console.error('Kein Edge oder Chrome gefunden. Pfad per Umgebungsvariable BROWSER angeben.');
	process.exit(1);
}

const only = arg('nur')?.split(',').map((s) => s.trim());
const jobs = only ? JOBS.filter((j) => only.includes(j.teil ?? 'komplett')) : JOBS;

fs.mkdirSync(outDir, { recursive: true });
const browser = await startBrowser(exe);
const cdp = await newPage(browser.port);
try {
	await cdp.send('Page.enable');
	await cdp.send('Runtime.enable');
	if (env.APP_PIN) {
		const token = createHash('sha256').update('valerius:' + env.APP_PIN).digest('hex');
		await cdp.send('Network.enable');
		await cdp.send('Network.setCookie', { name: 'grimoire_pin', value: token, url: server });
	}
	for (const job of jobs) {
		const teil = job.teil;
		const url = `${server}/druck?nolive${teil ? `&teil=${encodeURIComponent(teil)}` : ''}`;
		const file = path.join(outDir, job.file);
		const t0 = Date.now();
		let pdf = await printPdf(cdp, url);
		// Zweiter Durchlauf mit Seitenzahlen für Inhaltsverzeichnis und Kapitelübersicht. Die Zahlen stehen in
		// freigehaltenen Feldern, der Umbruch bleibt also gleich.
		let numbered = '';
		if (teil === null || teil === 'journal') {
			const seiten = pageParam(pdfDestPages(pdf));
			if (seiten) {
				pdf = await printPdf(cdp, `${url}&seiten=${encodeURIComponent(seiten)}`);
				numbered = '  mit Seitenzahlen';
			}
		}
		fs.writeFileSync(file, pdf);
		const kb = Math.round(fs.statSync(file).size / 1024);
		console.log(`✓ ${job.file.padEnd(28)} ${String(kb).padStart(6)} KB  ${((Date.now() - t0) / 1000).toFixed(1)} s${numbered}`);
	}
	console.log(`\nFertig: ${path.relative(process.cwd(), outDir) || outDir}`);
} finally {
	cdp.close();
	await browser.stop();
}
