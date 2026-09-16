import { gsap, ScrollTrigger } from '../core/gsap';
import App from '../../../globals/App.js';

export default function init${PageKey}() {
	const ctx = gsap.context(() => {
		const mm = gsap.matchMedia();

		mm.add(`(min-width: ${App.BREAKPOINT_DESKTOP + 1}px)`, () => {
			const header = App.HEADER_FOR_SCROLL;
            
			if (!header) return;
 
			ScrollTrigger.create({
				id: 'tlFixHeader',
				trigger: header,
				start: 'top top',
				end: '+=50000',
				scrub: true,
				pin: header,
				pinSpacing: false
			});
		});
	});

	return () => ctx.revert();
}
