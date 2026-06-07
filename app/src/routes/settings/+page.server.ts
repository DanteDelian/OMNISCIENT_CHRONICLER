import os from 'node:os';
import { VAULT_DIR, DATA_DIR } from '$lib/server/paths';
import { pinEnabled } from '$lib/server/auth';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = ({ url }) => {
	const port = url.port;
	const ips: string[] = [];
	const nets = os.networkInterfaces();
	for (const name of Object.keys(nets)) {
		for (const n of nets[name] ?? []) {
			if (n.family === 'IPv4' && !n.internal) ips.push(n.address);
		}
	}
	const lanUrls = ips.map((ip) => `${url.protocol}//${ip}${port ? ':' + port : ''}`);
	return { lanUrls, vaultDir: VAULT_DIR, dataDir: DATA_DIR, pinEnabled: pinEnabled() };
};
