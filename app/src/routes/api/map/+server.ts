import { json } from '@sveltejs/kit';
import { buildMapGraph } from '$lib/server/map';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = () => json(buildMapGraph());
