export default async function initSliders() {
	const sliders = [
		{
			selector: '.default_slr',
			loader: () => import('./sliders-initials/default-slr.js'),
		}
	];

	const promises = sliders.map(async ({ selector, loader }) => {
		if (document.querySelector(selector)) {
			const module = await loader();

			if (module.default) {
				return module.default();
			}
		}
	});

	await Promise.all(promises);
}
