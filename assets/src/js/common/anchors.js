import App from "../globals/App.js";
import { gsap } from "../lib/animations/core/gsap.js";
import { ScrollToPlugin } from "gsap/ScrollToPlugin";
gsap.registerPlugin(ScrollToPlugin);

export default function initAnchors() {
	console.log("anchors inited");

	function scrollToTarget(targetElement, offsetTop = 0) {
		console.log("targetElement", targetElement);
		if (!targetElement) return;

		if (App.WINDOW_W > App.BREAKPOINT_DESKTOP && App.bodyScrollBar) {
			App.bodyScrollBar.scrollIntoView(targetElement, {
				damping: 0.07,
				offsetTop,
			});
		} else {
			// const top = targetElement.getBoundingClientRect().top - App.HEADER_H + window.scrollY;
			gsap.to(window, {
				scrollTo: {
					y: targetElement,
					offsetY: offsetTop,
				},
				// duration: 1,
				// ease: 'none'
			});
		}
	}

	function handleTargetFromUrl() {
		const targetId = new URLSearchParams(window.location.search).get(
			"targetId",
		);
		if (!targetId) return;

		const targetElement = document.getElementById(targetId);
		if (!targetElement) return;

		requestAnimationFrame(() => {
			requestAnimationFrame(() => {
				scrollToTarget(targetElement, 0);
			});
		});
	}

	document.addEventListener("click", (event) => {
		const link = event.target.closest("a.anchor_lnk");
		if (!link) return;

		event.preventDefault();
		event.stopImmediatePropagation();

		const href = link.getAttribute("href");
		const targetId = link.dataset.target;

		const currentPath = window.location.pathname;
		const linkPath = new URL(href, window.location.origin).pathname;
		const isSamePage = linkPath === currentPath;

		if (isSamePage) {
			const selector = href.includes("#")
				? href
				: targetId
					? `#${targetId}`
					: null;
			console.log(targetId);
			if (!selector) return;
			scrollToTarget(document.querySelector(selector), 0);
		} else {
			if (!targetId) return;
			window.location.href = `${href}?targetId=${targetId}`;
		}
	});

	handleTargetFromUrl();
}