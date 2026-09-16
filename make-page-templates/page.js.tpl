import App from '../globals/App.js';
import initScroll from '../lib/scroll/initScroll.js';
import { initCommonAnimations } from '../lib/animations/common/initCommonAnimations.js';
import init${PageKey}Anim from '../lib/animations/pages-anim/${pageName}-anim.js';
import initSliders from '../lib/sliders/initSliders.js';

import { initCommonScripts } from '../common/index.js';
import init${PageKey}Events from '../events/${pageName}-events.js';
import initCommonEvents from '../events/common-events.js';

document.addEventListener('DOMContentLoaded', async () => {

	initCommonEvents();
	init${PageKey}Events();

	initScroll();

	init${PageKey}Anim();
	initCommonAnimations();

	initSliders();

	initCommonScripts();
});
