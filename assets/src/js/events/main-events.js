export default async function initMainEvents() {
	const productCard = document.querySelector('[data-product-card]');

	if (productCard) {
		initProductOptions(productCard);
	}

	initProductTabs();
}

function initProductOptions(productCard) {
	const optionButtons = productCard.querySelectorAll('.product-option');
	const price = productCard.querySelector('[data-product-price]');
	const oldPrice = productCard.querySelector('[data-product-old-price]');
	const sku = productCard.querySelector('[data-product-sku]');

	optionButtons.forEach((button) => {
		button.addEventListener('click', () => {
			optionButtons.forEach((item) => {
				item.classList.remove('is-active');
				item.setAttribute('aria-pressed', 'false');
			});

			button.classList.add('is-active');
			button.setAttribute('aria-pressed', 'true');

			price.textContent = button.dataset.price;
			oldPrice.textContent = button.dataset.oldPrice;
			sku.textContent = button.dataset.sku;
		});
	});
}

function initProductTabs() {
	const tabs = document.querySelector('[data-product-tabs]');

	if (!tabs) return;

	const links = tabs.querySelectorAll('.product-tab-link');
	const panels = tabs.querySelectorAll('.product-tab-panel');
	const defaultId = links[0]?.getAttribute('href')?.slice(1);

	const activateTab = (id, shouldUpdateHash = false) => {
		const targetPanel = tabs.querySelector(`#${id}`);
		const targetLink = tabs.querySelector(`.product-tab-link[href="#${id}"]`);

		if (!targetPanel || !targetLink) return;

		links.forEach((link) => {
			const isActive = link === targetLink;

			link.classList.toggle('is-active', isActive);
			link.setAttribute('aria-selected', String(isActive));
		});

		panels.forEach((panel) => {
			const isActive = panel === targetPanel;

			panel.classList.toggle('is-active', isActive);
			panel.hidden = !isActive;
		});

		if (shouldUpdateHash) {
			history.replaceState(null, '', `#${id}`);
		}
	};

	links.forEach((link) => {
		link.addEventListener('click', (event) => {
			event.preventDefault();

			activateTab(link.getAttribute('href').slice(1), true);
		});
	});

	const hashId = window.location.hash.slice(1);
	const initialId = hashId && tabs.querySelector(`#${hashId}`) ? hashId : defaultId;

	activateTab(initialId);
}
