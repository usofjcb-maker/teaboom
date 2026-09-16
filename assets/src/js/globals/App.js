const App = {
  BODY: document.body,
  bodyScrollBar: null,
  currentScrollTop: 0,
  lastScrollTop: 0,
  select: (e) => document.querySelector(e),

  BREAKPOINT_DESKTOP: 1023,
  BREAKPOINT_TABLET: 767,
  get HEADER_FOR_SCROLL() {
    return document.getElementById("header");
  },
  get OVERLAY_BG() {
    return document.querySelector(".overlay_bg");
  },
  get FOOTER() {
    return document.getElementById("footer");
  },
  get MENU() {
    return document.querySelector(".fixed_menu");
  },
  get SUBMENU() {
    return document.querySelector(".fixed_submenu");
  },
  get WINDOW_H() {
    return window.innerHeight;
  },
  get WINDOW_W() {
    return window.innerWidth;
  },
  get HEADER_H() {
    return this.HEADER_FOR_SCROLL?.getBoundingClientRect().height || 0;
  },
  get FOOTER_H() {
    return this.FOOTER?.getBoundingClientRect().height || 0;
  },
  api: {},
};

export default App;
