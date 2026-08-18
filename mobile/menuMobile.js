const redirectUrls = {
            effleurageButton: 'e.html',
            frictionButton: 'f.html',
            petrissageButton: 'p.html',
            tapotementButton: 't.html',
            backButton: '../index.html'
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
    