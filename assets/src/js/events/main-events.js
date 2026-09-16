export default async function initMainEvents() {
	const productCard = document.querySelector('[data-product-card]');

	if (!productCard) return;

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
