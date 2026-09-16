const instances = new Map();
const SELECTOR = '.allow-custom-scroll';

function enableWheelScrollX(el, scrollbar) {
	el.addEventListener('wheel', e => {
			const delta = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;

			const current = scrollbar.offset.x;
			const max = scrollbar.limit.x;

			const isLeft = delta < 0;
			const isRight = delta > 0;

			const canScrollX = (isLeft && current > 0) || (isRight && current < max);

			if (!canScrollX) {
				return;
			}

			e.preventDefault();

			scrollbar.scrollTo(current + delta, 0);
		},
		{ passive: false  }
	);
}

function getOptions(el) {
	const axis = el.dataset.scrollAxis || 'y';
	const damping = parseFloat(el.dataset.scrollDamping) || 0.7;

	return {
		axis,
		damping,
		renderByPixels: true,
		delegateTo: el,
		alwaysShowTracks: true
	};
}

function createNativeScroll(el, options) {
	el.style.overflowX = options.axis === 'x' ? 'auto' : 'hidden';
	el.style.overflowY = options.axis === 'x' ? 'hidden' : 'auto';
	el.style.webkitOverflowScrolling = 'touch';

	return {
		get offset() {
			return {
				x: el.scrollLeft,
				y: el.scrollTop
			};
		},
		get limit() {
			return {
				x: Math.max(0, el.scrollWidth - el.clientWidth),
				y: Math.max(0, el.scrollHeight - el.clientHeight)
			};
		},
		scrollTo(x = 0, y = 0) {
			el.scrollTo({ left: x, top: y, behavior: 'smooth' });
		},
		destroy() {
			el.style.overflowX = '';
			el.style.overflowY = '';
			el.style.webkitOverflowScrolling = '';
		}
	};
}

export function initModalNativeScroll(context = document) {
	const elements = context.querySelectorAll(SELECTOR);
	if (!elements.length) return;

	elements.forEach(el => {
		if (instances.has(el)) return;

		const options = getOptions(el);
		const scrollbar = createNativeScroll(el, options);

		if (options.axis === 'x') {
			enableWheelScrollX(el, scrollbar);
		}

		instances.set(el, scrollbar);
	});
}

export function destroyModalNativeScroll(context = document) {
	const elements = context.querySelectorAll(SELECTOR);

	elements.forEach(el => {
		const instance = instances.get(el);
		if (!instance) return;

		instance.destroy();
		instances.delete(el);
	});
}

export function getModalNativeScroll(el) {
	return instances.get(el);
}
