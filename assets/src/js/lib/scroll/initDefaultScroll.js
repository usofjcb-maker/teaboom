import App from '../../globals/App.js';
import initScrollTo from './initScrollTo.js';

export default function initDefaultScroll() {
	// App.HEADER_FOR_SCROLL && (App.HEADER_FOR_SCROLL.style.position = 'fixed');
	App.BODY.style.overflow = 'auto';
	initScrollTo(false);

	const updateHeaderScrollState = () => {
		const currentScrollTop = window.scrollY;

		if(document.querySelector('.ms')){
			// if (st >= App.WINDOW_H * 2) {
			if (currentScrollTop >= App.WINDOW_H) {
				App.MENU?.classList.add("menu_for_scroll");
				App.SUBMENU?.classList.add("menu_for_scroll");
				// App.HEADER_FOR_SCROLL?.classList.add("header_for_scroll");
			} else {
				App.MENU?.classList.remove("menu_for_scroll");
				App.SUBMENU?.classList.remove("menu_for_scroll");
				// App.HEADER_FOR_SCROLL?.classList.remove("header_for_scroll");
			}	
		} else {
			if (currentScrollTop >= 5) {
				App.MENU?.classList.add("menu_for_scroll");
				App.SUBMENU?.classList.add("menu_for_scroll");
				// App.HEADER_FOR_SCROLL?.classList.add("header_for_scroll");
			} else {
				App.MENU?.classList.remove("menu_for_scroll");
				App.SUBMENU?.classList.remove("menu_for_scroll");
				// App.HEADER_FOR_SCROLL?.classList.remove("header_for_scroll");
			}
		}

		// if (currentScrollTop > App.lastScrollTop) {
		// 	// Скролл вниз
		// 	App.HEADER_FOR_SCROLL.classList.add("header_for_scroll", "header_fix");
		// } else if (currentScrollTop <= 5) {
		// 	// Вверху страницы
		// 	App.HEADER_FOR_SCROLL.classList.remove("header_for_scroll");
		// } else {
		// 	// Скролл вверх
		// 	App.HEADER_FOR_SCROLL.classList.remove("header_fix");
		// }

		// if (currentScrollTop >= MN_SCREEN_H) {
		//     if (App.TECH_LINKS) {
		//         App.TECH_LINKS.classList.add("active");
		//     }
		//     App.HEADER_FOR_SCROLL.classList.add("header_dark");
		// } else {
		//     if (App.TECH_LINKS) {
		//         App.TECH_LINKS.classList.remove("active");
		//     }
		//     App.HEADER_FOR_SCROLL.classList.remove("header_dark");
		// }

		App.lastScrollTop = currentScrollTop <= 0 ? 0 : currentScrollTop;
	};

	window.addEventListener('scroll', updateHeaderScrollState);
	updateHeaderScrollState();

	// поддержка targetId=…
	const params = new URLSearchParams(window.location.search);
	const targetId = params.get('targetId');
	if (targetId) {
		const el = document.getElementById(targetId);
		if (el) {
			if (App.bodyScrollBar) {
				App.bodyScrollBar.scrollIntoView(el, { damping: 0.07, offsetTop: 90 });
			} else {
				window.scrollTo({ top: el.offsetTop, behavior: 'smooth' });
			}
		}
	}
}