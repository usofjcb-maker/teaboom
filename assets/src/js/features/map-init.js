export function initMap(container) {
  if (!container || !window.ymaps) return;

  ymaps.ready(() => {
    container.forEach((item) => {
      let coords = JSON.parse(item.dataset.coords);
      const map = new ymaps.Map(item, {
        center: coords,
        zoom: 17,
        controls: [],
      });

      const placemark = new ymaps.Placemark(
        coords,
        {},
        // {
        //   // hintContent: '117105, Москва, вн.Тер.Г. Муниципальный округ<br> донской, шоссе варшавское, д. 9 стр. 1'
        //   visible: true,
        // },
        {
          iconLayout: "default#image",
          iconImageHref: "img/s22.svg",
          iconImageSize: [56, 56],
          iconImageOffset: [-28, -56],
          hideIconOnBalloonOpen: false,
        },
      );

      // hover — меняем иконку
      // placemark.events.add("mouseenter", () => {
      //   placemark.options.set("iconImageHref", "img/p10h.png");
      // });

      // placemark.events.add("mouseleave", () => {
      //   placemark.options.set("iconImageHref", "img/p10.png");
      // });
      map.controls.add("zoomControl", {
        float: "none",
        position: {
          right: 10,
          top: 5,
        },
      });
      map.behaviors.disable("scrollZoom");
      map.geoObjects.add(placemark);
    });
  });
}
