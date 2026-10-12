import fs from 'node:fs';
import path from 'node:path';
import { error } from '@sveltejs/kit';
import { ASSETS_DIR } from '$lib/server/store';
import type { RequestHandler } from './$types';

const MIME: Record<string, string> = {
	'.png': 'image/png',
	'.jpg': 'image/jpeg',
	'.jpeg': 'image/jpeg',
	'.webp': 'image/webp',
	'.gif': 'image/gif',
	'.svg': 'image/svg+xml'
};

/** Bilder aus campaign/assets/ (Porträt, Karte). */
export const GET: RequestHandler = ({ params }) => {
	const abs = path.resolve(ASSETS_DIR, params.path);
	if (!abs.startsWith(ASSETS_DIR + path.sep)) error(400, 'Ungültiger Pfad');
	if (!fs.existsSync(abs) || !fs.statSync(abs).isFile()) error(404, 'Bild nicht gefunden');
	return new Response(fs.readFileSync(abs), {
		headers: {
			'content-type': MIME[path.extname(abs).toLowerCase()] ?? 'application/octet-stream',
			'cache-control': 'public, max-age=600'
		}
	});
};
