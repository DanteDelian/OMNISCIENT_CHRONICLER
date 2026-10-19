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
	{ file: '16-begriffe-deutsch-englisch.pdf', teil: 'begriffe' }
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

async function printPdf(cdp, url, file) {
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
	await sleep(300);
	const base = { printBackground: true, preferCSSPageSize: true, displayHeaderFooter: false };
	let pdf;
	try {
		pdf = await cdp.send('Page.printToPDF', { ...base, generateTaggedPDF: true, generateDocumentOutline: true });
	} catch {
		pdf = await cdp.send('Page.printToPDF', base);
	}
	fs.writeFileSync(file, Buffer.from(pdf.data, 'base64'));
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
		await printPdf(cdp, url, file);
		const kb = Math.round(fs.statSync(file).size / 1024);
		console.log(`✓ ${job.file.padEnd(28)} ${String(kb).padStart(6)} KB  ${((Date.now() - t0) / 1000).toFixed(1)} s`);
	}
	console.log(`\nFertig: ${path.relative(process.cwd(), outDir) || outDir}`);
} finally {
	cdp.close();
	await browser.stop();
}
