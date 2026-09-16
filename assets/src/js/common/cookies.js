export default function initCookies() {
    // Функция для чтения cookie
    console.log('cookies inited');
    function getCookie(name) {
        const matches = document.cookie.match(
            new RegExp("(?:^|; )" + name.replace(/([\.$?*|{}\(\)\[\]\\\/\+^])/g, "\\$1") + "=([^;]*)")
        );
        return matches ? decodeURIComponent(matches[1]) : undefined;
    }

    const cookiewin = document.querySelector(".cookies_window");
    if (!cookiewin) return;

    const cookieReady = getCookie("Evoheat");
    if (cookieReady === "ok") {
        // если cookie уже есть, убрать окно
        cookiewin.classList.remove("cookie_show");
        return;
    }

    // показ окна
    cookiewin.classList.add("cookie_show");

    const btn = document.querySelector("#cookies-btn");
    if (!btn) return;

    btn.addEventListener("click", () => {
        // cookie на 30 дней
        document.cookie = "Evoheat=ok; path=/; max-age=2592000;";
        cookiewin.classList.remove("cookie_show");
    });
}
