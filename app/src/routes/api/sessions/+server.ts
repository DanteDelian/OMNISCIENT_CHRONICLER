import { json } from '@sveltejs/kit';
import { listSessions } from '$lib/server/sessions';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = () => json(listSessions());
