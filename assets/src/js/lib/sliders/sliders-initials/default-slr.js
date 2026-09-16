export default async function initDefaultSlider() {
	const sliders = document.querySelectorAll('.default_slr');
	if (!sliders.length) return;

	const [{ default: Swiper }, { Navigation }] = await Promise.all([
		import('swiper'),
		import('swiper/modules')
	]);

	await import('swiper/css');
	await import('swiper/css/navigation');

	return [...sliders].map((el) => {
		const sliderWrap = el.closest('.related-products') || el.parentElement;

		return new Swiper(el, {
			modules: [Navigation],
			loop: false,
			slidesPerView: 1.15,
			spaceBetween: 16,
			speed: 700,
			watchOverflow: true,
			observer: true,
			observeParents: true,
			navigation: {
				prevEl: sliderWrap?.querySelector('.related-products-prev'),
				nextEl: sliderWrap?.querySelector('.related-products-next'),
			},
			breakpoints: {
				576: {
					slidesPerView: 2,
					spaceBetween: 18,
				},
				768: {
					slidesPerView: 3,
					spaceBetween: 20,
				},
				1200: {
					slidesPerView: 4,
					spaceBetween: 24,
				},
			},
		});
	});
}
