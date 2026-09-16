import $ from "jquery";
import "selectize/dist/css/selectize.css";
import "selectize/dist/js/standalone/selectize.js";

export default function initSelectize() {
	console.log('Selectize inited');
	const selects = document.querySelectorAll("[data-selectize]");
	if (!selects.length) return;

	selects.forEach((select) => {
		const options = {};

		if (select.dataset.placeholder) options.placeholder = select.dataset.placeholder;
		if (select.dataset.create === "true") options.create = true;

		// кастомный скролл при открытии дропдауна
		options.onDropdownOpen = function () {
			const self = this;
			setTimeout(() => {
				const $dropdownContent = $(self.$dropdown_content);
				const optionCount = $dropdownContent.find(".option").length;
				const $dropdown = $dropdownContent.closest('.selectize-dropdown');

				if (optionCount >= 7) {
					// TODO Добавить альтернативу вместо mCustomScrollbar
				} else {
					// TODO Добавить альтернативу вместо mCustomScrollbar
				}
			}, 100);
		};

		$(select).selectize(options);
	});
}
