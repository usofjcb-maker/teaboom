import gsap from "gsap";
import { openFancyboxOnDemand } from "../common/fancybox/fancybox-core.js";
import { initInputmaskOnDemand } from "../common/inpumask/inputmask-core.js";

export default async function initCommonEvents() {
  if (document.getElementById("fixed-menu")) {
    const { default: initFixedMenu } =
      await import("./components/fixedMenu.js");
    initFixedMenu();
  }

  if (document.querySelector("[data-tabs]")) {
    const { default: initDefaultTabs } =
      await import("./components/defaultTabs.js");
    initDefaultTabs();
  }

  document.addEventListener("click", (e) => {
    // language
    const langBtn = e.target.closest(".header_lng_select .t");
    if (langBtn) {
      langBtn.classList.toggle("active");
      langBtn
        .closest(".header_lng_select")
        ?.querySelector(".lngs_hd")
        ?.classList.toggle("is-open");
      return;
    }

    // fancybox
    const fancyTrigger = e.target.closest(".fap, [data-fancybox]");
    if (fancyTrigger) {
      e.preventDefault();
      openFancyboxOnDemand(fancyTrigger);
      return;
    }
    const burgerTrigger = e.target.closest(".header_burger");
    if (burgerTrigger) {
      e.preventDefault();
      burgerTrigger.classList.toggle("active");
      document.body.classList.toggle("burger-open");
      return;
    }
    let accTarget = e.target.closest(".acc_head");
    if (accTarget) {
      e.preventDefault();
      accTarget = e.target.closest(".acc");
      const accBody = accTarget.querySelector(".acc_body");
      if (!accTarget.classList.contains("active")) {
        gsap.to(accBody, {
          height: "auto",
          opacity: 1,
          duration: 0.4,
          ease: "power2.inOut",
        });
      } else {
        gsap.to(accBody, {
          height: 0,
          opacity: 0,
          duration: 0.4,
          ease: "power2.inOut",
        });
      }
      accTarget.classList.toggle("active");
      return;
    }
  });

  // inputmask
  let inputmaskInited = false;

  document.addEventListener("focusin", (e) => {
    if (inputmaskInited) return;
    if (!e.target.matches("input.phone, input.email")) return;

    initInputmaskOnDemand();
    inputmaskInited = true;
  });
  document.querySelectorAll("[data-map-link]").forEach((item) => {
    item.addEventListener("click", (e) => {
      const mapId = e.target.closest("[data-map-link]").dataset.mapLink;
      const mapContainers = document.querySelectorAll("[data-map]");
      mapContainers.forEach((item) => item.classList.remove("active"));
      document.querySelector(`[data-map="${mapId}"]`).classList.add("active");
    });
  });
}
