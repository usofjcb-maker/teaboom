import $ from "jquery";
import { Fancybox } from "@fancyapps/ui";
import "@fancyapps/ui/dist/fancybox/fancybox.css";

window.$ = window.jQuery = $;

export function openFancybox(trigger) {
  const el = $(trigger);
  const target = el.attr("href");

  Fancybox.close();

  if (el.is("[data-fancybox]")) {
    Fancybox.show(
      [
        {
          src: el.attr("href"),
          type: "image",
        },
      ],
      {
        closeButton: "inside",
        dragToClose: false,
        hideScrollbar: false,
        infinite: false,
      },
    );
    return;
  }

  if (target && target !== "#") {
    Fancybox.show(
      [
        {
          src: target,
          type: "inline",
        },
      ],
      {
        closeButton: "inside",
        dragToClose: false,
        hideScrollbar: false,
        infinite: false,
        Keyboard: {
          Delete: false,
          backspace: false,
        },
      },
    );
  }
}
