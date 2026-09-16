import initScroll from '../lib/scroll/initScroll.js';
import { initCommonAnimations } from '../lib/animations/common/initCommonAnimations.js';
import initMainAnim from '../lib/animations/pages-anim/main-anim.js';
import initSliders from '../lib/sliders/initSliders.js';
import initLayout from '../layout/layout.init.js';

import { initCommonScripts } from '../common/index.js';
import initMainEvents from '../events/main-events.js';
import initCommonEvents from '../events/common-events.js';

async function safe(fn, name) {
    try { await fn(); } catch (e) { console.error(`${name}:`, e); }
}

document.addEventListener('DOMContentLoaded', async () => {

	await safe(initLayout, 'initLayout'); // TODO подумать что делать с layout css variables. Есть баг когда js не успевает их посчитать и высота главного экрана дергается.

	await safe(initSliders, 'initSliders');

	initScroll();

	await Promise.all([
		safe(initCommonEvents, 'initCommonEvents'),
		safe(initMainEvents, 'initMainEvents')
	]);

	initMainAnim();
	initCommonAnimations();

	await safe(initCommonScripts, 'initCommonScripts');
});