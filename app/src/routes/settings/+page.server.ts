import os from 'node:os';
import { CAMPAIGN_DIR } from '$lib/server/campaign';
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
	return { lanUrls, campaignDir: CAMPAIGN_DIR, pinEnabled: pinEnabled() };
};
