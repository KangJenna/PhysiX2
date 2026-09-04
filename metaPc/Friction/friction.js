// CONTROLADOR DE MOVIMIENTO SIMÉTRICO (EJE X)
AFRAME.registerComponent('pc-controls', {
    schema: { 
        speed: {type: 'number', default: 0.01}, 
        min: {type: 'number', default: -0.5}, // Límite izquierdo
        max: {type: 'number', default: 0.5}    // Límite derecho
    },

    init: function () {
        this.pressureText = document.querySelector('#pressure-panel');
        this.brazo2 = document.querySelector('#brazo-virtual-2');
        
        window.addEventListener('wheel', this.onScroll.bind(this), {passive: false});
    },

    onScroll: function (e) {
        e.preventDefault(); 
        
        let delta = (e.deltaY > 0 ? -1 : 1) * this.data.speed;
        
        // 1. Mover Brazo 1 en eje X
        let currentX1 = this.el.object3D.position.x;
        let newX1 = Math.min(Math.max(currentX1 + delta, this.data.min), this.data.max);
        this.el.object3D.position.x = newX1;

        // 2. Mover Brazo 2 en dirección contraria (Espejo)
        if (this.brazo2) {
            this.brazo2.object3D.position.x = -newX1; 
        }

        this.updateUIFeedback();
    },

    updateUIFeedback: function() {
        if(this.pressureText) {
            this.pressureText.setAttribute('value', "MOVIMIENTO LATERAL ACTIVO");
            this.pressureText.setAttribute('color', "#5BEEF7");
        }
    }
});

// LÓGICA DE REPETICIONES COLISIÓN
AFRAME.registerComponent('sequence-physics', {
    init: function () {
        this.guiaTexto = document.querySelector('#count-panel');
        this.handSphere = this.el.querySelector('a-sphere');
        
        this.startedAtBottom = false;
        this.reps = 0;
        this.maxReps = 10;
        this.canCount = true; 

        this.el.addEventListener('raycaster-intersection', (e) => {
            const intersectedEl = e.detail.els[0];
            const step = intersectedEl.getAttribute('data-step');
            this.validateSequence(step);
        });

        this.el.addEventListener('raycaster-intersection-cleared', () => {
            this.handSphere.setAttribute('material', 'color: red'); 
        });
    },

    updateUI: function(message, color) {
        if(this.guiaTexto) {
            this.guiaTexto.setAttribute('value', message);
            this.guiaTexto.setAttribute('color', color);
        }
    },

    validateSequence: function(step) {
        // 1. Validar inicio en zona lumbar (Naranja)
        if (!this.startedAtBottom) {
            if (step === "2" || step === "2-2") {
                this.startedAtBottom = true;
                this.canCount = true;
                this.handSphere.setAttribute('material', 'color: #00FF00');
                this.updateUI(`Iniciado. ¡Desliza!`, "#00FF00");
            }
            return;
        }

        // 2. Contar al llegar a zona superior (Azul)
        if (step === "3" && this.canCount) {
            this.reps++;
            this.canCount = false; 
            this.startedAtBottom = false; 

            if (this.reps >= this.maxReps) {
                this.updateUI("¡COMPLETADO!\nEjercicio terminado", "#5BEEF7");
            } else {
                this.updateUI(`¡BIEN!\nRepetición: ${this.reps} / ${this.maxReps}`, "#00FF00");
            }
        }
    },

    resetSequence: function() {
        this.startedAtBottom = false;
        this.reps = 0;
        this.canCount = true;

        if (this.handSphere) {
            this.handSphere.setAttribute('material', 'color: red');
        }

        this.updateUI(`Repetición: 0 / ${this.maxReps}`, "white");
    }

    
});


    AFRAME.registerComponent('teoria-carrusel', {
    init: function () {
        this.paginas = [
            "\n\nCon la aplicación de esta maniobra se pretende realizar un deslizamiento de un plano anatómico sobre otro inferior.\nPara su correcta ejecución, no debe existir desplazamiento de las manos del fisioterapeuta sobre la piel del paciente. Se provoca un deslizamiento de la piel sobre los planos más profundos.",
            "\n\nLa fricción posee un efecto de flexibilización sobre el tejido conjuntivo y aponeurótico; circulatorio, por el calentamiento local (mecánico) y la vasodilatación (fisiológico) que genera, y sobretodo, se emplea por su efecto analgésico y sedante. ",
            "\n\nLa fricción se puede realizar con diferentes tomas, en función de la zona de la parte de la mano que contacta con la piel del paciente y de la dirección del movimiento ejecutado. Por tanto, las maniobras se pueden clasificar de la siguiente forma:",
            "\n\nSegún la dirección del desplazamiento:\n- Fricción longitudinal\n- Fricción transversal\n- Fricción circular\n- Fricción circular + fricción digital",
            "\n\nSegún la parte de la mano con que se aplica:\n- Fricción palma\n- Fricción con los dedos (digital)\n- Fricción dedos reforzados (digital reforzada)\n- Fricción Nudillos (nudillar)\n- Fricción Nudillos reforzados (nudillar reforzada)\n- Fricción con el pulgar",
            "\n\nEs importante diferenciar entre las maniobras de frotación (roce) y fricción. Mientras la frotación actúa sólo sobre la piel, la fricción permite abordar estructuras más profundas.",
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

// COMPONENTE PARA SALIR AL MENÚ
AFRAME.registerComponent('enlace-menu', {
    init: function() {
        this.el.addEventListener('click', function() {
            window.location.href = "../menuPC.html";
        });
    }
});

AFRAME.registerComponent('reiniciar-masaje', {
    init: function () {
        this.el.addEventListener('click', () => {
            const brazoEl = document.querySelector('#brazo-virtual'); // <-- ajusta el ID si es distinto en este HTML
            if (!brazoEl || !brazoEl.components['sequence-physics']) return;

            brazoEl.components['sequence-physics'].resetSequence();
        });
    }
});