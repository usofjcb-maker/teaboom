import App from '../../globals/App.js';

export default function initScrollTo(isDesktop = (App.WINDOW_W > App.BREAKPOINT_DESKTOP)) {
	const links = document.querySelectorAll('.linkTo');
	if (!links.length) return;

	if (isDesktop && App.bodyScrollBar) {
		links.forEach(link => {
			const target = link.getAttribute('href');
			link.addEventListener('click', (e) => {
				e.preventDefault();
				const el = document.querySelector(target);
				if (!el) return;
				App.bodyScrollBar.scrollIntoView(el, { damping: 0.07, offsetTop: 0 });
			});
		});
	} else {
		links.forEach(link => {
			link.addEventListener('click', (e) => {
				e.preventDefault();
				const id = link.getAttribute('href');
				const el = document.querySelector(id);
				if (!el) return;
				window.scrollTo({ top: el.offsetTop, behavior: 'smooth' });
			});
		});
	}
}