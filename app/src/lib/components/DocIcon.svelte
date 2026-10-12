<script lang="ts">
	import { ShieldCheck, Compass, ScrollText, Swords, Mail, BookOpen, FlaskConical, ShoppingBag, FileText } from '@lucide/svelte';
	let { name = '', size = 18, class: cls = '' }: { name?: string; size?: number; class?: string } = $props();
	const ICONS = {
		'shield-check': ShieldCheck,
		compass: Compass,
		'scroll-text': ScrollText,
		swords: Swords,
		mail: Mail,
		'book-open': BookOpen,
		'flask-conical': FlaskConical,
		'shopping-bag': ShoppingBag
	} as const;
	const Icon = $derived(ICONS[name as keyof typeof ICONS] ?? FileText);
</script>

<Icon {size} class={cls} />
