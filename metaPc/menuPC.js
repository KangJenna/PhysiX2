const redirectUrls = {
            effleurageButton: 'Effleu/effleuragePC.html',
            frictionButton: 'Friction/friction.html',
            petrissageButton: 'Petri/petri.html',
            tapotementButton: 'Tapo/tapo.html',
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


        
    //Salir con esfera
    AFRAME.registerComponent('enlace-menu',{
        init:function(){
            this.el.addEventListener('click', function(){
                window.location.href = "index.html";
            })
        }
    });

    //Salir Oculus
  
    AFRAME.registerComponent('boton-escape-hibrido', {
        init: function () {
            this.el.addEventListener('menuchanged', (evt) =>{
                if(evt.detail.value === true){
                    window.location.href = "index.html";
                }
            })
        }
        
    });
    