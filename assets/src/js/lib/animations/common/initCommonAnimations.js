import { gsap, ScrollTrigger } from '../core/gsap';

export function initCommonAnimations() {
	const mm = gsap.matchMedia();

	mm.add("(min-width: 320px)", () => {

		if(document.querySelector('.prlx')){
			gsap.utils.toArray(".prlx").forEach(el => {
				const shift = +el.dataset.shift || 100;
				const speed = +el.dataset.speed || 1;

				gsap.to(el, {
					y: shift * speed,
					ease: "none",
					scrollTrigger: {
						trigger: el,
						start: "top bottom",
						end: `bottom top-=${shift * speed}`,
						scrub: true,
						refreshPriority: -1
					}
				});
			});
		}

		if(document.querySelector('.moveUp')){
			gsap.utils.toArray(".moveUp").forEach(el => {
				gsap.from(el, {
					autoAlpha: 0,
					y: 25,
					scrollTrigger: {
						trigger: el,
						start: "top 85%",
						once: true,
						refreshPriority: -1
					}
				});
			});
		}

		if(document.querySelector('.anim_ln_horizontal')){
			ScrollTrigger.batch('.anim_ln_horizontal span', {
				onEnter: batch => gsap.to(batch, {
					scaleX: 1,
					stagger: 0.05,
					ease: 'none',
					refreshPriority: -1
				}),
				start: 'top bottom-=50'
			});
		}

		if(document.querySelector('.anim_ln_vertical')){
			ScrollTrigger.batch('.anim_ln_vertical span', {
				onEnter: batch => gsap.to(batch, {
					scaleY: 1,
					duration: 1,
					stagger: 0.05,
					ease: 'none',
					refreshPriority: -1
				}),
				start: 'top bottom-=50'
			});
		}

		if(document.querySelector('.clip_overflow_bg')){
			gsap.utils.toArray('.clip_overflow_bg').forEach((elem) => {
				let tlUp = gsap
					.timeline({
						scrollTrigger: {
							trigger: elem,
							start: `top bottom-=${elem.offsetHeight / 2}`
						}
					})
					.fromTo(elem, { clipPath: 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)' }, { clipPath: 'polygon(0% 0%,100% 0%,100% 0%,0% 0%)', duration: 1, ease: 'power3.Out' });
			});
		}

		if(document.querySelector('.clip_overflow_bg_h')){
			gsap.utils.toArray('.clip_overflow_bg_h').forEach((elem) => {
				let tlUp = gsap
					.timeline({
						scrollTrigger: {
							trigger: elem,
							start: `top bottom-=${elem.offsetHeight / 2}`
						}
					})
					.fromTo(
						elem,
						{ clipPath: 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)' },
						{
							clipPath: 'polygon(100% 0, 100% 0, 100% 100%, 100% 100%)',
							duration: 1,
							ease: 'power3.Out'
						}
					);
			});
		}

		if(document.querySelector('.splitted_text_colors')){
			const items = document.querySelectorAll('.splitted_text_colors');
			if (!items.length) return;

			items.forEach((item, index) => {

				const chars = item.querySelectorAll('.char');
				if (!chars.length) return;

				if (item.dataset.charColorsInited) return;
				item.dataset.charColorsInited = 'true';

				const fromColor = item.dataset.fromColor || '#bbb';
				const toColor = item.dataset.toColor || getComputedStyle(item).color;
				const stagger = +item.dataset.stagger || 0.05;
				const start = item.dataset.start || 'top bottom';
				const end = item.dataset.end || '+=100%';

				gsap.set(chars, {
					color: fromColor
				});

				gsap.timeline({
					scrollTrigger: {
						trigger: item,
						start,
						end,
						scrub: true
					}
				}).to(chars, {
					color: toColor,
					duration: 0.15,
					stagger: {
						each: stagger,
						from: 'start'
					},
					ease: 'none'
				});
			});
		}
	});

	return () => mm.revert();
}