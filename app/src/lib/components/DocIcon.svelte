<script lang="ts">
	/** Symbol nach Namen aus dem Frontmatter (Dokumente, Regelkapitel). Unbekannte Namen zeigen ein Blatt. */
	import {
		Activity,
		Backpack,
		BookOpen,
		Compass,
		Crosshair,
		Dices,
		FileText,
		Flag,
		FlaskConical,
		Gem,
		Hammer,
		HeartPulse,
		Lightbulb,
		Mail,
		ScrollText,
		ShieldCheck,
		ShoppingBag,
		Sparkles,
		Swords,
		Telescope,
		Tent
	} from '@lucide/svelte';
	let { name = '', size = 18, class: cls = '' }: { name?: string; size?: number; class?: string } = $props();
	const ICONS = {
		'shield-check': ShieldCheck,
		compass: Compass,
		'scroll-text': ScrollText,
		swords: Swords,
		mail: Mail,
		'book-open': BookOpen,
		'flask-conical': FlaskConical,
		'shopping-bag': ShoppingBag,
		lightbulb: Lightbulb,
		hammer: Hammer,
		telescope: Telescope,
		activity: Activity,
		flag: Flag,
		crosshair: Crosshair,
		'heart-pulse': HeartPulse,
		sparkles: Sparkles,
		dices: Dices,
		tent: Tent,
		backpack: Backpack,
		gem: Gem
	} as const;
	const Icon = $derived(ICONS[name as keyof typeof ICONS] ?? FileText);
</script>

<Icon {size} class={cls} />
