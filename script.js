
const redirectUrls = {
            pcButton: 'metaPc/menuPC.html',
            metaButton: 'VR/menuMeta.html',
            mobileButton: 'mobile/menuMobile.html'
        };


        document.querySelector('a-scene').addEventListener('loaded', function () {
            const menuButtons = document.querySelectorAll('.menu-button');

            menuButtons.forEach(button => {
                button.addEventListener('click', function () {
                    const buttonId = this.id;
                    const redirectUrl = redirectUrls[buttonId];
                    if (redirectUrl) {
                        window.location.href = redirectUrl;
                    }

                });
            });
        });
    