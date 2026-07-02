import fs from 'node:fs';
import path from 'node:path';
import { error } from '@sveltejs/kit';
import { ASSETS_DIR } from '$lib/server/campaign';
import type { RequestHandler } from './$types';

const MIME: Record<string, string> = {
	'.png': 'image/png',
	'.jpg': 'image/jpeg',
	'.jpeg': 'image/jpeg',
	'.gif': 'image/gif',
	'.webp': 'image/webp',
	'.svg': 'image/svg+xml'
};

/** Liefert Bilder aus campaign/assets/ (Porträt, Karten, …). */
export const GET: RequestHandler = ({ params }) => {
	const rel = params.path.replace(/\\/g, '/');
	const abs = path.resolve(ASSETS_DIR, rel);
	if (abs !== ASSETS_DIR && !abs.startsWith(ASSETS_DIR + path.sep)) {
		throw error(400, 'Ungültiger Pfad');
	}
	if (!fs.existsSync(abs) || !fs.statSync(abs).isFile()) {
		throw error(404, 'Asset nicht gefunden');
	}
	const type = MIME[path.extname(abs).toLowerCase()] ?? 'application/octet-stream';
	return new Response(fs.readFileSync(abs), {
		headers: { 'content-type': type, 'cache-control': 'public, max-age=3600' }
	});
};
