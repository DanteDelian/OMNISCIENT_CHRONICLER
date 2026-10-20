import {
	LayoutDashboard,
	IdCard,
	Sparkles,
	Skull,
	Backpack,
	FlaskConical,
	NotebookPen,
	Flag,
	Globe,
	Map as MapIcon,
	Puzzle,
	Hand,
	Library,
	Scale,
	Printer
} from '@lucide/svelte';

export const NAV = [
	{
		group: 'Am Tisch',
		items: [
			{ href: '/', label: 'Spieltisch', icon: LayoutDashboard, key: '1' },
			{ href: '/bogen', label: 'Charakterbogen', icon: IdCard, key: '2' },
			{ href: '/zauber', label: 'Zauberbuch', icon: Sparkles, key: '3' },
			{ href: '/gefolge', label: 'Gefolge', icon: Skull, key: '4' },
			{ href: '/inventar', label: 'Inventar', icon: Backpack, key: '5' },
			{ href: '/werkstatt', label: 'Werkstatt', icon: FlaskConical, key: '' }
		]
	},
	{
		group: 'Kampagne',
		items: [
			{ href: '/journal', label: 'Journal', icon: NotebookPen, key: '6' },
			{ href: '/quests', label: 'Quests', icon: Flag, key: '7' },
			{ href: '/raetsel', label: 'Rätselwand', icon: Puzzle, key: '' },
			{ href: '/welt', label: 'Welt', icon: Globe, key: '8' },
			{ href: '/karte', label: 'Karte', icon: MapIcon, key: '9' },
			{ href: '/netzwerk', label: 'Netzwerk', icon: Hand, key: '' }
		]
	},
	{
		group: 'Wissen',
		items: [
			{ href: '/archiv', label: 'Archiv', icon: Library, key: '0' },
			{ href: '/regeln', label: 'Regeln', icon: Scale, key: '' },
			{ href: '/druck', label: 'Druckfassung', icon: Printer, key: '' }
		]
	}
];

export function isActive(path: string, href: string): boolean {
	return href === '/' ? path === '/' : path === href || path.startsWith(href + '/');
}
