import App from '../../../globals/App.js';
import { ScrollTrigger } from '../core/gsap.js';

export default function footerMenuTriggerInit() {
    const header = App.HEADER_FOR_SCROLL;
    const footer = App.FOOTER;
    
    ScrollTrigger.create({
        trigger: footer,
        start: "top bottom",
        end: "bottom bottom",
        onEnter: () => {
            App.MENU?.classList.add("hidden");
            App.SUBMENU?.classList.add("hidden");
        },
        onLeaveBack: () => {
            App.MENU?.classList.remove("hidden");
            App.SUBMENU?.classList.remove("hidden");
        }
    });
}