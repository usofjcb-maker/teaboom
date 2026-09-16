export default function initSocialShare() {
    const shareButtons = document.querySelectorAll(".share-btn");

    shareButtons.forEach((button) => {
        button.addEventListener("click", function (e) {
            e.preventDefault();

            const pageUrl = window.location.href;
            const pageTitle = document.title;

            const socialType = this.getAttribute("data-social");
            let shareUrl;

            switch (socialType) {
                case "tg":
                    shareUrl = `https://t.me/share/url?url=${encodeURIComponent(pageUrl)}&text=${encodeURIComponent(pageTitle)}`;
                    break;

                case "vk":
                    shareUrl = `https://vk.com/share.php?url=${encodeURIComponent(pageUrl)}&title=${encodeURIComponent(pageTitle)}`;
                    break;

                case "ok":
                    shareUrl = `https://connect.ok.ru/offer?url=${encodeURIComponent(pageUrl)}&title=${encodeURIComponent(pageTitle)}`;
                    break;

                case "wa":
                    shareUrl = `https://wa.me/?text=${encodeURIComponent(`${pageTitle}${pageUrl}`)}`;
                    break;

                default:
                    return;
            }


            window.open(shareUrl, "_blank", "width=600,height=600");
        });
    });   
}