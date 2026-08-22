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
import Settings from '@lucide/svelte/icons/settings';

export interface NavItem {
	href: string;
	label: string;
	icon: Component;
	/** In der mobilen Bottom-Nav sichtbar (max. 5). */
	primary?: boolean;
}

export const navItems: NavItem[] = [
	{ href: '/', label: 'Dashboard', icon: LayoutDashboard, primary: true },
	{ href: '/character', label: 'Charakter', icon: Shield, primary: true },
	{ href: '/werkstatt', label: 'Werkstatt', icon: WandSparkles, primary: true },
	{ href: '/combat', label: 'Kampf', icon: Swords, primary: true },
	{ href: '/notes', label: 'Notizen', icon: NotebookPen, primary: true },
	{ href: '/characters', label: 'Charaktere', icon: UsersRound },
	{ href: '/prep', label: 'Vorbereitung', icon: ClipboardList },
	{ href: '/quests', label: 'Quests', icon: ScrollText },
	{ href: '/chronik', label: 'Chronik', icon: BookOpen },
	{ href: '/glossar', label: 'Glossar', icon: Users },
	{ href: '/settings', label: 'Einstellungen', icon: Settings }
];
