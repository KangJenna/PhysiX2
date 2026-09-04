AFRAME.registerComponent('tapotement-touch-logic', {
    init: function () {
        this.raycaster = new THREE.Raycaster();
        this.coords = new THREE.Vector2();
        
        const handleTouch = (e) => {
            const camera = this.el.sceneEl.camera;
            if (!camera) return;

            // 1. Detectar qué estamos tocando
            let touch = e.touches[0];
            this.coords.x = (touch.clientX / window.innerWidth) * 2 - 1;
            this.coords.y = -(touch.clientY / window.innerHeight) * 2 + 1;
            this.raycaster.setFromCamera(this.coords, camera);

            // 2. Verificar si es el botón de salir
            const salirBtn = document.querySelector('#botonSalir3D').getObject3D('mesh');
            const intersectBtn = this.raycaster.intersectObject(salirBtn, true);

            // Si tocamos el botón de salir, NO hacemos nada aquí y dejamos que el click funcione
            if (intersectBtn.length > 0) return;

            // 3. Lógica de Masaje (solo si no es el botón)
            const zones = document.querySelectorAll('.massage-zone');
            const meshes = Array.from(zones).map(z => z.getObject3D('mesh')).filter(m => m);
            const intersects = this.raycaster.intersectObjects(meshes, true);

            if (intersects.length > 0) {
                if (e.cancelable) e.preventDefault(); // Bloquea scroll solo en el masaje
                this.el.emit('tap-hit');
                
                let obj = intersects[0].object.el;
                obj.setAttribute('material', 'opacity', 0.9);
                setTimeout(() => obj.setAttribute('material', 'opacity', 0.5), 100);
            }
        };

        window.addEventListener('touchstart', handleTouch, { passive: false });
    }
});



AFRAME.registerComponent('sequence-physics', {
    init: function () {
        this.texto = document.querySelector('#instrucciones-guia');
        this.reps = 0;
        this.maxReps = 10;
        this.canHit = true;

        this.el.addEventListener('tap-hit', () => {
            if (this.reps < this.maxReps && this.canHit) {
                this.reps++;
                
                // Bloqueo momentáneo para evitar que un solo toque cuente como 50
                this.canHit = false;
                setTimeout(() => { this.canHit = true; }, 100); 

                this.updateUI();
                
                if (navigator.vibrate) navigator.vibrate(30);
            }
        });
    },

    updateUI: function() {
        if (!this.texto) return;
        
        if (this.reps >= this.maxReps) {
            this.texto.setAttribute('value', "MASAJE COMPLETADO!");
            this.texto.setAttribute('color', "#00FF00");
            
            // Cambiar color de las zonas a verde
            document.querySelectorAll('.massage-zone').forEach(z => z.setAttribute('color', 'green'));
        } else {
            this.texto.setAttribute('value', `TAPOTEMENT\nToques: ${this.reps} / ${this.maxReps}`);
            this.texto.setAttribute('color', "white");
        }
    },

    resetSequence: function() {
        this.reps = 0;
        this.canHit = true;

        document.querySelectorAll('.massage-zone').forEach(z => z.setAttribute('color', 'purple'));

        this.updateUI();
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
    init: function () {
        this.el.addEventListener('click', function () {
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