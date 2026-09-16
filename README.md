# Static Site Starter

Clean Gulp starter for multi-page static websites.

## Stack

- Gulp 5
- Nunjucks-style includes via `gulp-include`
- Sass
- esbuild with one JS bundle per page
- Lenis + GSAP ScrollTrigger
- Swiper, Fancybox, Inputmask, Parsley, Selectize

## Commands

```bash
npm install
npm run dev
npm run build
npm run preview
npm run make-page about
```

## Project Structure

```text
assets/src/
  index.html              Source pages
  template/               Shared HTML partials and per-page heads
  styles/                 Base styles and per-page Sass entries
  js/
    pages/                Per-page JS entry points
    common/               Reusable UI initializers
    events/               DOM event modules
    layout/               Layout measurements and CSS vars
    lib/                  Scroll, animation, sliders
    utils/                Small utilities
  img/                    Source images, icons and sprite input
  fonts/                  Source .woff2 fonts
  video/                  Optional source video files
gulp/                     Build tasks and utilities
make-page-templates/      Templates used by npm run make-page
```

## Page Workflow

Create a page:

```bash
npm run make-page about
```

This creates:

- `assets/src/about.html`
- `assets/src/template/head-about.html`
- `assets/src/js/pages/about.js`
- `assets/src/js/events/about-events.js`
- `assets/src/js/lib/animations/pages-anim/about-anim.js`
- `assets/src/styles/about/about.sass`
- `assets/src/styles/about/about-styles.sass`

Each page gets its own CSS and JS bundle.

## Build Output

Generated files are intentionally ignored:

- `assets/build/` for local development
- `assets/dist/` for production builds
- `cache/` for build caches

Deploy settings are read from `.env`. Use `.env.example` as a starting point.
