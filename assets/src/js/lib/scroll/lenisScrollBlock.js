import App from '../../globals/App.js';

let scrollBlocked = false;
let lastScrollPos = { x: 0, y: 0 };

export function lenisScrollBlock() {
	if (scrollBlocked || !App.bodyScrollBar) return;

	lastScrollPos = {
		x: 0,
		y: App.bodyScrollBar.scrollTop
	};
	scrollBlocked = true;

	App.bodyScrollBar.stop();
}

export function lenisScrollUnblock() {
	if (!scrollBlocked || !App.bodyScrollBar) return;

	scrollBlocked = false;
	App.bodyScrollBar.start();
	App.bodyScrollBar.setPosition(lastScrollPos.x, lastScrollPos.y);
}
