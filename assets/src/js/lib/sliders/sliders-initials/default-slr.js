export default async function initDefaultSlider() {
	const el = document.querySelector('.default_slr');
	if (!el) return;

	const [{ default: Swiper }] = await Promise.all([import('swiper')]);

	await import('swiper/css');

	return new Swiper(el, {
		loop: false,
		slidesPerView: 1,
		spaceBetween: 20,
		speed: 800,
		watchOverflow: true,
		observer: true,
		observeParents: true,
		breakpoints: {
			768: {
				slidesPerView: 2,
			},
			1024: {
				slidesPerView: 3,
			},
		},
	});
}
