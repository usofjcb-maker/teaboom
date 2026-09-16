import App from '../globals/App.js';
import initScroll from '../lib/scroll/initScroll.js';
import { initCommonAnimations } from '../lib/animations/common/initCommonAnimations.js';
import initTestAnim from '../lib/animations/pages-anim/test-anim.js';
import initSliders from '../lib/sliders/initSliders.js';

import { initCommonScripts } from '../common/index.js';
import initTestEvents from '../events/test-events.js';
import initCommonEvents from '../events/common-events.js';

document.addEventListener('DOMContentLoaded', async () => {

	initCommonEvents();
	initTestEvents();

	initScroll();

	initTestAnim();
	initCommonAnimations();

	initSliders();

	initCommonScripts();
});
