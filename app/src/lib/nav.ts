import type { Component } from 'svelte';
import LayoutDashboard from '@lucide/svelte/icons/layout-dashboard';
import Shield from '@lucide/svelte/icons/shield';
import UsersRound from '@lucide/svelte/icons/users-round';
import Swords from '@lucide/svelte/icons/swords';
import ClipboardList from '@lucide/svelte/icons/clipboard-list';
import NotebookPen from '@lucide/svelte/icons/notebook-pen';
import ScrollText from '@lucide/svelte/icons/scroll-text';
import BookOpen from '@lucide/svelte/icons/book-open';
import Users from '@lucide/svelte/icons/users';
import WandSparkles from '@lucide/svelte/icons/wand-sparkles';
import Lightbulb from '@lucide/svelte/icons/lightbulb';
import Map from '@lucide/svelte/icons/map';
import Settings from '@lucide/svelte/icons/settings';

export type NavGroup = 'Kampagne' | 'Held' | 'System';

export interface NavItem {
	href: string;
	label: string;
	icon: Component;
	group: NavGroup;
	/** In der mobilen Bottom-Nav sichtbar (max. 5). */
	primary?: boolean;
}

export const navItems: NavItem[] = [
	{ href: '/', label: 'Dashboard', icon: LayoutDashboard, group: 'Kampagne', primary: true },
	{ href: '/chronik', label: 'Chronik', icon: BookOpen, group: 'Kampagne' },
	{ href: '/karte', label: 'Karte', icon: Map, group: 'Kampagne' },
	{ href: '/wissen', label: 'Wissen', icon: Lightbulb, group: 'Kampagne' },
	{ href: '/glossar', label: 'Glossar', icon: Users, group: 'Kampagne' },
	{ href: '/quests', label: 'Quests', icon: ScrollText, group: 'Kampagne' },
	{ href: '/character', label: 'Charakter', icon: Shield, group: 'Held', primary: true },
	{ href: '/combat', label: 'Kampf', icon: Swords, group: 'Held', primary: true },
	{ href: '/notes', label: 'Notizen', icon: NotebookPen, group: 'Held', primary: true },
	{ href: '/prep', label: 'Vorbereitung', icon: ClipboardList, group: 'Held' },
	{ href: '/characters', label: 'Charaktere', icon: UsersRound, group: 'Held' },
	{ href: '/settings', label: 'Einstellungen', icon: Settings, group: 'System' }
];

/** Prominente Haupt-Aktion (nicht Teil der Gruppen-Navigation). */
export const featuredNav = {
	href: '/werkstatt',
	label: 'Session verarbeiten',
	icon: WandSparkles
};

export const NAV_GROUPS: NavGroup[] = ['Kampagne', 'Held', 'System'];
