AFRAME.registerComponent('multi-touch-petri', {
    init: function () {
        this.raycaster = new THREE.Raycaster();
        this.coords = new THREE.Vector2();
        this.scene = this.el.sceneEl;

        this.getZones = () => {
            const zones = document.querySelectorAll('.massage-zone');
            return Array.from(zones).map(z => z.getObject3D('mesh')).filter(m => m);
        };

        const handleTouch = (e) => {
            if (e.touches.length === 0) return;
            if (e.cancelable) e.preventDefault();
            
            const camera = this.scene.camera;
            if (!camera) return;

            let currentTargets = this.getZones();
            let hits = new Set();

            for (let i = 0; i < e.touches.length; i++) {
                let touch = e.touches[i];
                this.coords.x = (touch.clientX / window.innerWidth) * 2 - 1;
                this.coords.y = -(touch.clientY / window.innerHeight) * 2 + 1;

                this.raycaster.setFromCamera(this.coords, camera);
                const intersects = this.raycaster.intersectObjects(currentTargets, true);

                if (intersects.length > 0) {
                    let step = intersects[0].object.el.getAttribute('data-step');
                    hits.add(step);
                }
            }

            if (hits.size > 0) {
                this.el.emit('petri-event', { steps: Array.from(hits) });
            }
        };

        this.scene.canvas.addEventListener('touchstart', handleTouch, { passive: false });
        this.scene.canvas.addEventListener('touchmove', handleTouch, { passive: false });
    }
});

AFRAME.registerComponent('sequence-physics', {
    init: function () {
        this.textoConteo = document.querySelector('#count-panel');
        this.reps = 0;
        this.maxReps = 10;
        this.canCount = true; // Bandera para evitar que una sola pulsación cuente como 100 reps

        this.el.addEventListener('petri-event', (e) => {
            const currentSteps = e.detail.steps;
            
            // Si detecta ambos dedos en los toroides (1 y 2)
            if (this.canCount && currentSteps.includes("1") && currentSteps.includes("2")) {
                this.reps++;
                this.canCount = false; // Bloqueamos hasta que suelte o salga de la zona

                if (this.reps >= this.maxReps) {
                    this.updateUI(`¡MASAJE COMPLETADO!\n${this.reps} / ${this.maxReps}`, "#5BEEF7");
                } else {
                    this.updateUI(`Repetición: ${this.reps}\n¡Sigue así!`, "#00FF00");
                }

                // Pequeño retardo para permitir que el usuario mueva los dedos 
                // y no se disparen las 10 reps en un segundo
                setTimeout(() => { this.canCount = true; }, 800); 
            }
        });
    },

    updateUI: function(msg, col) {
        if (this.textoConteo) {
            this.textoConteo.setAttribute('value', msg);
            this.textoConteo.setAttribute('color', col);
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


    AFRAME.registerComponent('enlace-menu', {
    init: function() {
        this.el.addEventListener('click', function() {
            window.location.href = "menuMobile.html";
        });
    }
});