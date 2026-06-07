<script lang="ts">
	import { toggleMode } from 'mode-watcher';
	import Sun from '@lucide/svelte/icons/sun';
	import Moon from '@lucide/svelte/icons/moon';
</script>

<button class="btn btn-icon btn-ghost" onclick={toggleMode} aria-label="Hell/Dunkel umschalten" title="Theme wechseln">
	<Sun class="hidden h-5 w-5 dark:block" />
	<Moon class="block h-5 w-5 dark:hidden" />
</button>
