export async function initCommonScripts() {
    // якорные ссылки для мягк. скролла

    if(document.querySelector('a.anchor_lnk') || new URLSearchParams(window.location.search).get('targetId')) {
        const { default: initAnchors } = await import('./anchors.js');
        initAnchors();
    }

    // Popover
    if (document.querySelector('[data-popover]')) {
        const { default: initPopovers } = await import('./popovers.js');
        initPopovers();
    }

    // Поп-апы
    if (document.querySelector('[data-popup]')) {
        const { default: initPopups } = await import('./popups.js');
        initPopups();
    }

    // окно куки
    if (document.querySelector('.cookies_window, .cookies')) {
        const { default: initCookies } = await import('./cookies.js');
        initCookies();
    }

    // Selectize
    if (document.querySelector('[data-selectize]')) {
        const { default: initSelectize } = await import('./selectize-init.js');
        initSelectize();
    }

    // Валидация
    if (document.querySelector('form')) {
        const { initValidation } = await import('./validation.js');
        initValidation();
    }

    // Загрузка файлов в форму
    if (document.querySelector('.blc_file_upload')) {
        const { initFileUpload } = await import('./validation.js');
        initFileUpload('blc_file_upload');
    }
}