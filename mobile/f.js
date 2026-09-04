 AFRAME.registerComponent('multi-touch-friction', {
            init: function () {
                this.raycaster = new THREE.Raycaster();
                this.coords = new THREE.Vector2();
                this.scene = this.el.sceneEl;
                
                // Función para obtener los targets cada vez que sea necesario
                this.getZones = () => {
                    const zones = document.querySelectorAll('.massage-zone');
                    return Array.from(zones).map(z => z.getObject3D('mesh')).filter(m => m);
                };

                const handleTouch = (e) => {
                    if (e.cancelable) e.preventDefault();
                    const camera = this.scene.camera;
                    if (!camera) 
                        return;

                    let currentTargets = this.getZones();
                    let hits = [];
                    let touchedMassaZone = false;

                    for (let i = 0; i < e.touches.length; i++) {
                        let touch = e.touches[i];
                        this.coords.x = (touch.clientX / window.innerWidth) * 2 - 1;
                        this.coords.y = -(touch.clientY / window.innerHeight) * 2 + 1;

                        this.raycaster.setFromCamera(this.coords, camera);
                        const intersects = this.raycaster.intersectObjects(currentTargets, true);

                        if (intersects.length > 0) {
                            // Buscamos el ID o step del objeto tocado
                            let step = intersects[0].object.el.getAttribute('data-step');
                            hits.push(step);
                            touchedMassaZone = true;
                        }
                    }

                    if(touchedMassaZone && e.cancelable) {
                        e.preventDefault();
                    }
                    if (hits.length > 0) {
                        this.el.emit('friction-event', { steps: hits });
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
        this.active = false;
        this.isFinished = false;

        this.el.addEventListener('friction-event', (e) => {
            if (this.isFinished) return; // Detener todo si ya terminó

            const steps = e.detail.steps;
            
            // Iniciar: Detecta ambos verdes/naranjas (paso 2 y 2-2)
            if (!this.active && steps.includes("2") && steps.includes("2-2")) {
                this.active = true;
                this.updateUI("¡ZONA ALCANZADA!", "#FFA500");
            }

            // Finalizar repetición: Toca zona azul (paso 3)
            if (this.active && steps.includes("3")) {
                this.reps++;
                this.active = false; 

                if (this.reps >= this.maxReps) {
                    this.isFinished = true;
                    this.updateUI(`¡EJERCICIO COMPLETADO!\n${this.reps} / ${this.maxReps}`, "#5BEEF7");
                } else {
                    this.updateUI(`Repetición: ${this.reps} / ${this.maxReps}`, "#00FF00");
                }
            }
        });
    },

    updateUI: function(msg, col) {
        // Actualiza el panel de conteo inferior
        if (this.textoConteo) {
            this.textoConteo.setAttribute('value', msg);
            this.textoConteo.setAttribute('color', col);
        }
        
    },
    
    resetSequence: function() {
        this.reps = 0;
        this.active = false;
        this.isFinished = false; // Clave: sin esto, friction-event se seguiría ignorando

        this.updateUI(`Repetición: 0 / ${this.maxReps}`, "white");
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

AFRAME.registerComponent('reiniciar-masaje', {
    init: function () {
        this.el.addEventListener('click', () => {
            const entidad = document.querySelector('[sequence-physics]'); // ajusta el selector si aplica
            if (!entidad || !entidad.components['sequence-physics']) return;

            entidad.components['sequence-physics'].resetSequence();
        });
    }
});