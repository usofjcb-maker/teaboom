import App from "../../globals/App.js";
import { initLenisScroll } from "./lenisScroll.js";
import initScrollTo from "./initScrollTo.js";

export default function initScroll() {
  const isDesktop = App.WINDOW_W > App.BREAKPOINT_DESKTOP;

  if (isDesktop) {
    initLenisScroll();
    initScrollTo(true);
  } else {
    // Планшет и мобильные устройства: нативный window scroll без Lenis.
    App.HEADER_FOR_SCROLL && (App.HEADER_FOR_SCROLL.style.position = "fixed");
    initScrollTo(false);

    const updateHeaderScrollState = () => {
      const currentScrollTop = window.scrollY;
      if (document.querySelector(".hero_section")) {
        const HERO_SECTION = document.querySelector(".hero_section");
        const HERO_SECTION_HEIGHT = HERO_SECTION.getBoundingClientRect().height;

        if (currentScrollTop >= 20) {
          App.HEADER_FOR_SCROLL?.classList.add("header_for_scroll");
        } else {
          App.HEADER_FOR_SCROLL?.classList.remove("header_for_scroll");
        }
      } else {
        if (currentScrollTop >= 5)
          App.HEADER_FOR_SCROLL?.classList.add("header_for_scroll");
        else App.HEADER_FOR_SCROLL?.classList.remove("header_for_scroll");
      }

      App.lastScrollTop = currentScrollTop <= 0 ? 0 : currentScrollTop;
    };

    window.addEventListener("scroll", updateHeaderScrollState);
    updateHeaderScrollState();
  }

  // поддержка targetId=…
  const params = new URLSearchParams(window.location.search);
  const targetId = params.get("targetId");
  if (targetId) {
    const el = document.getElementById(targetId);
    if (el) {
      if (App.bodyScrollBar) {
        App.bodyScrollBar.scrollIntoView(el, { damping: 0.07, offsetTop: 90 });
      } else {
        window.scrollTo({ top: el.offsetTop, behavior: "smooth" });
      }
    }
  }
}
