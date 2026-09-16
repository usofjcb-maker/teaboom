import { initTabs } from './initTabs.js';

export default function initDefaultTabs() {
	if(document.querySelector('.types_of_buildings_section')){
		initTabs({
			tabSelector: '.types_of_buildings_section .tbs_top_buttons_list ul li',
			contentSelector: '.tbs_tab'
		});
	}
	if(document.querySelector('.about_atlas_section')){
		initTabs({
			tabSelector: '.about_atlas_section .about_section_info_tabs_buttons_list ul li',
			contentSelector: '.about_section_info_tab'
		});
	}
	if(document.querySelector('.fixed_submenu')){
		document.querySelectorAll('.fixed_submenu_content').forEach((submenuContent) => {
			// Проверяем, есть ли табы в этом контенте
			if (submenuContent.querySelector('.fs_menu_tabs_buttons')) {
				initTabs({
					root: submenuContent,
					tabSelector: '.fs_menu_tabs_buttons ul li',
					contentSelector: '.fs_menu_tab'
				});
			}
		});
	}
}