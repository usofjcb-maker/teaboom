import { loadFancybox } from './fancybox-loader';

export async function openFancyboxOnDemand(trigger) {
	const { openFancybox } = await loadFancybox();
	openFancybox(trigger);
}