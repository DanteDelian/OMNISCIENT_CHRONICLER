import type { Component } from 'svelte';
import LayoutDashboard from '@lucide/svelte/icons/layout-dashboard';
import Shield from '@lucide/svelte/icons/shield';
import NotebookPen from '@lucide/svelte/icons/notebook-pen';
import ScrollText from '@lucide/svelte/icons/scroll-text';
import BookOpen from '@lucide/svelte/icons/book-open';
import Users from '@lucide/svelte/icons/users';
import Sparkles from '@lucide/svelte/icons/sparkles';
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
	{ href: '/notes', label: 'Notizen', icon: NotebookPen, primary: true },
	{ href: '/quests', label: 'Quests', icon: ScrollText, primary: true },
	{ href: '/chronik', label: 'Chronik', icon: BookOpen },
	{ href: '/glossar', label: 'Glossar', icon: Users },
	{ href: '/ingest', label: 'KI-Import', icon: Sparkles },
	{ href: '/settings', label: 'Einstellungen', icon: Settings, primary: true }
];
