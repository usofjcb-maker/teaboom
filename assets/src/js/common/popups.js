export default function initPopups() {
    console.log('data-popup inited');
	document.addEventListener("click", (e) => {
		if (e.target.closest("[data-popup-open]")) {
			e.preventDefault();
			const id = e.target.closest("[data-popup-open]").dataset.popupOpen;
			document.getElementById(id)?.classList.add("is-open");
		}

		if (e.target.closest("[data-popup-close]")) {
			e.preventDefault();
			e.target.closest(".popup")?.classList.remove("is-open");
		}
	});
}
