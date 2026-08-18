// CONTROLADOR DE RAYCASTER POR TOQUE (Sin mover cámara)
AFRAME.registerComponent('touch-to-raycaster', {
    init: function () {
        this.raycaster = new THREE.Raycaster();
        this.coords = new THREE.Vector2();
        this.camera = this.el.sceneEl.camera;

        const handleTouch = (e) => {
            // Importante: No bloqueamos el preventDefault para permitir clics en botones
            if (e.touches.length > 0) {
                let touch = e.touches[0];
                this.coords.x = (touch.clientX / window.innerWidth) * 2 - 1;
                this.coords.y = -(touch.clientY / window.innerHeight) * 2 + 1;

                const camera = this.el.sceneEl.camera;
                if (!camera) return;

                this.raycaster.setFromCamera(this.coords, camera);
                
                // Buscamos intersecciones con las zonas de masaje
                const zones = document.querySelectorAll('.massage-zone');
                const meshes = Array.from(zones).map(z => z.getObject3D('mesh')).filter(m => m);
                const intersects = this.raycaster.intersectObjects(meshes, true);

                if (intersects.length > 0) {
                    // Si tocamos una zona, avisamos al sequence-handler
                    const entity = intersects[0].object.el;
                    this.el.emit('zone-touched', { el: entity });
                }
            }
        };

        window.addEventListener('touchstart', handleTouch);
        window.addEventListener('touchmove', handleTouch);
    }
});

// LÓGICA DE SECUENCIA
AFRAME.registerComponent('sequence-handler', {
    init: function () {
        this.currentStep = 0;
        this.guiaTexto = document.querySelector('#instrucciones-guia');

        this.el.addEventListener('zone-touched', (evt) => {
            const obj = evt.detail.el;
            const stepAttr = obj.getAttribute('data-step');
            if (stepAttr) {
                const step = parseInt(stepAttr.split('-')[0]);
                this.validateStep(step);
            }
        });
    },

    validateStep: function(zoneStep) {
        if (zoneStep === this.currentStep + 1) {
            this.currentStep = zoneStep;
            const msgs = {
                0: "PASO 1:\nInicia en la zona LUMBAR\n(Color Amarillo)",
                1: "PASO 2:\nSube suavemente por la\nzona DORSAL (Naranja)",
                2: "PASO 3:\nExtiende hacia los\nHOMBROS (Azul)",
                3: "PASO 4:\nDesliza por los BRAZOS\n(Cian) para terminar",
                4: "¡EXCELENTE!\nHas completado el ciclo.\nVuelve a la zona lumbar."
            };
            this.updateUI(msgs[this.currentStep] || "¡Bien!", "#00FF00");

            if (this.currentStep === 4) {
                setTimeout(() => {
                    this.currentStep = 0;
                    this.updateUI("PASO 1:\nInicia en la zona LUMBAR", "white");
                }, 3000);
            }
        }
    },

    updateUI: function(txt, color) {
        if (this.guiaTexto) {
            this.guiaTexto.setAttribute('value', txt);
            this.guiaTexto.setAttribute('color', color);
        }
    }
});

document.addEventListener('DOMContentLoaded', () => {
        const btnTeoria = document.getElementById('btn-teoria');
        const modalTeoria = document.getElementById('modal-teoria');
        const btnCerrar = document.getElementById('btn-cerrar');

        btnTeoria.addEventListener('click', () => {
            modalTeoria.classList.add('active');
        });

        btnCerrar.addEventListener('click', () => {
            modalTeoria.classList.remove('active');
        });

        modalTeoria.addEventListener('click', (e) => {
            if (e.target === modalTeoria) {
                modalTeoria.classList.remove('active');
            }
        });
    });

// BOTÓN SALIR 

AFRAME.registerComponent('enlace-menu', {
    init: function() {
        this.el.addEventListener('click', function() {
            window.location.href = "menuMobile.html";
        });
    }
});