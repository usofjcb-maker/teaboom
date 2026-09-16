import { loadInputmask } from './inputmask-loader.js';

let initialized = false;

export async function initInputmaskOnDemand() {
	if (initialized) return;
	initialized = true;

	const module = await loadInputmask();
	module.initInputmask();
}