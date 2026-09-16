export default function initFixedMenu() {
	const fixedMenu = document.getElementById('fixed-menu');
	// const heroSection = document.querySelector('.hero_section');
	
	if (!fixedMenu) return;

	// Обработка подменю на ховер
	const menuItems = fixedMenu.querySelectorAll('[data-submenu-trigger]');
	const submenu = document.getElementById('fixed-submenu');
	const container = fixedMenu.querySelector('.container');
	
	if (!submenu) return;

	const submenuContents = submenu.querySelectorAll('[data-submenu-content]');
	let activeSubmenuId = null;
	let hoverTimeout = null;
	let isHoveringMenu = false;
	let isHoveringSubmenu = false;
	let closeAnimationTimeout = null;

	const closeSubmenu = () => {
		submenu.classList.remove('is-active');
		fixedMenu.classList.remove('is-active');

		clearTimeout(closeAnimationTimeout);

		closeAnimationTimeout = setTimeout(() => {
			if (submenu.classList.contains('is-active')) return;

			submenuContents.forEach(content => {
				content.classList.remove('is-active');
			});
			menuItems.forEach(item => {
				item.classList.remove('is-active');
			});
			activeSubmenuId = null;
		}, 350);
	};

	const openSubmenu = (submenuId, menuItem) => {
		clearTimeout(closeAnimationTimeout);

		const content = submenu.querySelector(`[data-submenu-content="${submenuId}"]`);
		if (!content) return;

		if (
			activeSubmenuId === submenuId &&
			submenu.classList.contains('is-active')
		) {
			return;
		}

		menuItems.forEach(item => item.classList.remove('is-active'));
		submenuContents.forEach(c => c.classList.remove('is-active'));

		content.classList.add('is-active');
		menuItem.classList.add('is-active');

		submenu.classList.add('is-active');
		fixedMenu.classList.add('is-active');

		activeSubmenuId = submenuId;
	};

	function startCloseTimer() {
		clearTimeout(hoverTimeout);

		hoverTimeout = setTimeout(() => {
			if (!isHoveringMenu && !isHoveringSubmenu) {
				closeSubmenu();
			}
		}, 150);
	}

	menuItems.forEach(menuItem => {
		const submenuId = menuItem.dataset.submenuTrigger;

		menuItem.addEventListener('mouseenter', () => {
			isHoveringMenu = true;
			clearTimeout(hoverTimeout);
			openSubmenu(submenuId, menuItem);
		});

		menuItem.addEventListener('mouseleave', () => {
			isHoveringMenu = false;
			startCloseTimer();
		});
	});

	// Поддержка наведения на само подменю
	submenu.addEventListener('mouseenter', () => {
		isHoveringSubmenu = true;
		clearTimeout(hoverTimeout);
	});

	submenu.addEventListener('mouseleave', () => {
		isHoveringSubmenu = false;
		startCloseTimer();
	});
}
