export default function initCssVarsFromDom(config = []) {
	return new Promise(resolve => {
		if (!Array.isArray(config) || !config.length) {
			resolve();
			return;
		}

		const root = document.documentElement;
		let resolved = false;

		const update = (item) => {
			const el = document.querySelector(item.selector);
			if (!el) return;

			const rect = el.getBoundingClientRect();

			Object.entries(item.vars).forEach(([cssVar, prop]) => {
				let value = 0;

				if (prop === 'height') value = rect.height;
				else if (prop === 'width') value = rect.width;
				else if (typeof prop === 'function') value = prop(el, rect);

				root.style.setProperty(cssVar, `${Math.round(value)}px`);
			});

			if (!resolved) {
				resolved = true;
				resolve();
			}
		};

		config.forEach(item => {
			update(item);

			const el = document.querySelector(item.selector);
			if (!el) return;

			const ro = new ResizeObserver(() => {
				update(item);

				if (window.ScrollTrigger) ScrollTrigger.refresh();
				if (window.App?.bodyScrollBar) App.bodyScrollBar.update();
			});

			ro.observe(el);
		});
	});
}
