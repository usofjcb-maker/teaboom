import App from '../../globals/App.js';
import Lenis from 'lenis';
import { gsap, ScrollTrigger } from '../animations/core/gsap';

export function initLenisScroll() {
	const lenis = new Lenis({
		lerp: 0.07,
		smoothWheel: true,
		allowNestedScroll: true,
		prevent: node => node.closest?.('.allow-custom-scroll')
	});

	Object.defineProperties(lenis, {
		scrollTop: {
			get() {
				return lenis.scroll;
			},
			set(value) {
				lenis.scrollTo(value, { immediate: true });
			}
		}
	});

	lenis.addListener = callback => lenis.on('scroll', callback);
	lenis.removeListener = callback => lenis.off('scroll', callback);
	lenis.update = () => lenis.resize();
	lenis.setPosition = (x = 0, y = 0) => {
		lenis.scrollTo(y, { immediate: true });
	};
	lenis.scrollIntoView = (target, options = {}) => {
		lenis.scrollTo(target, {
			offset: -(options.offsetTop || 0),
			lerp: options.damping || 0.07
		});
	};

	App.bodyScrollBar = lenis;

	gsap.ticker.add(time => {
		lenis.raf(time * 1000);
	});
	gsap.ticker.lagSmoothing(0);

	lenis.on('scroll', ScrollTrigger.update);

	lenis.on('scroll', () => {
		const st = App.bodyScrollBar.scrollTop;
		if (document.querySelector('.ms')) {
			if (st >= App.WINDOW_H) {
				App.MENU?.classList.add('menu_for_scroll');
				App.SUBMENU?.classList.add('menu_for_scroll');
			} else {
				App.MENU?.classList.remove('menu_for_scroll');
				App.SUBMENU?.classList.remove('menu_for_scroll');
			}
		} else {
			if (st >= 5) {
				App.MENU?.classList.add('menu_for_scroll');
				App.SUBMENU?.classList.add('menu_for_scroll');
			} else {
				App.MENU?.classList.remove('menu_for_scroll');
				App.SUBMENU?.classList.remove('menu_for_scroll');
			}
		}

		App.lastScrollTop = st <= 0 ? 0 : st;
	});
}
