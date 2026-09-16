export default function initPopovers() {
    console.log('popover inited');
	document.addEventListener("click", (e) => {
		const btn = e.target.closest("[data-popover]");
		if (!btn) return;

		const id = btn.dataset.popover;
		const popover = document.getElementById(id);
		if (!popover) return;

		popover.classList.toggle("is-active");
	});
}
