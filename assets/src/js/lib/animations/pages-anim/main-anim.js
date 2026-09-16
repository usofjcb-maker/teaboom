import App from "../../../globals/App";
import footerMenuTriggerInit from "../components/footerMenuTriggerInit";
import { gsap, ScrollTrigger } from "../core/gsap";

export default function initMain() {
  const ctx = gsap.context(() => {
    const mm = gsap.matchMedia();

    mm.add(
      `(min-width: 320px) and (max-width: ${App.BREAKPOINT_DESKTOP}px)`,
      () => {},
    );

    mm.add(`(min-width: ${App.BREAKPOINT_DESKTOP + 1}px)`, () => {
      footerMenuTriggerInit();
    });
  });

  return () => ctx.revert();
}
