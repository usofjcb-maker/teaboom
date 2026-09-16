import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { CSSPlugin } from 'gsap/CSSPlugin';

gsap.registerPlugin(ScrollTrigger, CSSPlugin);

// ОДИН инстанс на всё приложение
export { gsap, ScrollTrigger };