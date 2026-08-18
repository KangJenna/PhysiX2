AFRAME.registerComponent('pc-controls', {
    schema: { 
        speed: {type: 'number', default: 0.01}, 
        minZ: {type: 'number', default: -1.5}, 
        maxZ: {type: 'number', default: -0.2},
        handId: {type: 'string', default: 'left'} 
    },

    init: function () {
        this.leftHand = document.querySelector('#brazo-izquierdo');
        this.rightHand = document.querySelector('#brazo-derecho');
        this.camera = document.querySelector('a-camera');

        // Escuchar el scroll para profundidad (Z)
        if (this.data.handId === 'left') {
            window.addEventListener('wheel', (e) => {
                e.preventDefault();
                let delta = (e.deltaY > 0 ? -1 : 1) * this.data.speed;
                this.updateDepth(delta);
            }, {passive: false});
        }
    },

    updateDepth: function(delta) {
        if (!this.leftHand || !this.rightHand) return;
        
        // EJE Z: Una entra, la otra sale
        let currentZ = this.leftHand.object3D.position.z;
        let newZ = Math.min(Math.max(currentZ + delta, this.data.minZ), this.data.maxZ);
        this.leftHand.object3D.position.z = newZ;

        let midZ = (this.data.minZ + this.data.maxZ) / 2;
        this.rightHand.object3D.position.z = midZ - (newZ - midZ);
    },

    tick: function () {
        // EJE Y: Espejo Vertical basado en la rotación de la cámara
        if (this.data.handId === 'left' && this.leftHand && this.rightHand && this.camera) {
            // Obtenemos la rotación X de la cámara (mirar arriba/abajo)
            let pitch = this.camera.object3D.rotation.x;
            
            // Aplicamos un desplazamiento vertical opuesto
            // Multiplicamos por 0.5 para que el movimiento sea suave
            let yOffset = pitch * 0.1; 

            this.leftHand.object3D.position.y = yOffset;
            this.rightHand.object3D.position.y = -yOffset;
        }
    }
});

AFRAME.registerComponent('sequence-physics', {
    init: function () {
        this.guiaTexto = document.querySelector('#count-panel');
        this.reps = 0;
        this.maxReps = 10;
        this.canCount = true; // Para evitar contar múltiples veces en una sola colisión

        // Escuchar cuando el raycaster toca un a-box (massage-zone)
        this.el.addEventListener('raycaster-intersection', (evt) => {
            if (this.reps < this.maxReps && this.canCount) {
                this.reps++;
                this.canCount = false; // Bloqueamos hasta que se separe
                this.updateUI();
                
                // Feedback visual simple al tocar (opcional)
                this.el.querySelector('a-sphere').setAttribute('scale', '1.2 1.2 1.2');
                setTimeout(() => {
                    if(this.el.querySelector('a-sphere')) 
                        this.el.querySelector('a-sphere').setAttribute('scale', '1 1 1');
                }, 100);
            }
        });

        // Cuando la esfera deja de tocar el box, habilitamos el siguiente conteo
        this.el.addEventListener('raycaster-intersection-cleared', () => {
            this.canCount = true;
        });
    },

    updateUI: function() {
        if (this.guiaTexto) {
            if (this.reps >= this.maxReps) {
                this.guiaTexto.setAttribute('value', "¡COMPLETADO!\n Masaje Finalizado");
                this.guiaTexto.setAttribute('color', "#00FF00");
                
                // Efecto de éxito: Las esferas se vuelven verdes
                document.querySelectorAll('a-sphere').forEach(s => s.setAttribute('color', 'green'));
            } else {
                this.guiaTexto.setAttribute('value', `Tecnica Tapotement\nContactos: ${this.reps} / ${this.maxReps}`);
                this.guiaTexto.setAttribute('color', "white");
            }
        }
    }
});

AFRAME.registerComponent('teoria-carrusel', {
    init: function () {
        this.paginas = [
            "\n\nConsiste en la apliación de una presión intermitente de dirección perpendicular al segmento tratado.\nGeneralmente se realiza con las dos manos, de forma alterna y rítmica, donde una mano toma contacto momentáneo cuando la otra está en el aire. ",
            "\n\nEl movimiento se ejecuta con la musculatura flexoextensora del codo del fisioterapeuta, manteniendo la muñeca relajada para que el movimiento sea fluido y no doloroso. ",
            "\n\nEl ritmo y la intensidad se deben adaptar a la zona que se está percutiendo y, se deben evitar ciertas zonas como las de grandes plexos vasculares o las cercanas o órganos abdominales",
            "\n\nLa percusión produce en la zona de contacto una hiperemia, así como una importante estimulación propioceptiva. ",
            "\n\nSegún la zona de la mano que realice el contacto, se pueden distinguir varias formas depercusión:\n- Cachete cubital.\n- Borde dorsal de manos y dedos.\n- Puños.\n- Clapping.\n- Tecleos.\n- Pellizqueos. ",
            "\n\nFuentes bibliográficas utilizadas en esta sección:\n\nFernández Álvarez, M. d. M., Martín Payo, R., y Cachero Rodríguez, J. (2024). Masoterapia: Manual de técnicas y maniobras. Universidad de Oviedo."

        ];
        this.indice = 0;

        this.textoEl = document.querySelector('#teoria');
        this.indicadorEl = document.querySelector('#pagina-indicador');

        this.actualizar();

        document.querySelector('#flecha-izq').addEventListener('click', () => {
            this.indice = (this.indice - 1 + this.paginas.length) % this.paginas.length;
            this.actualizar();
        });

        document.querySelector('#flecha-der').addEventListener('click', () => {
            this.indice = (this.indice + 1) % this.paginas.length;
            this.actualizar();
        });
    },

    actualizar: function () {
        this.textoEl.setAttribute('troika-text', 'value', this.paginas[this.indice]);
        this.indicadorEl.setAttribute('troika-text', 'value', `${this.indice + 1} / ${this.paginas.length}`);
    }
});




//Salir con esfera
    AFRAME.registerComponent('enlace-menu',{
        init:function(){
            this.el.addEventListener('click', function(){
                window.location.href = "../menuPC.html";
            })
        }
    });