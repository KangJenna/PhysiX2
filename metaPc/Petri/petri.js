// CONTROLADOR DE MOVIMIENTO Y PRESIÓN
AFRAME.registerComponent('pc-controls', {
    schema: { 
        speed: {type: 'number', default: 0.05}, 
        minZ: {type: 'number', default: -1.2},  
        maxZ: {type: 'number', default: -0.1},  
        radius: {type: 'number', default: 0.1}, 
        angleLimit: {type: 'number', default: 1.5} 
    },

    init: function () {
        this.pressureText = document.querySelector('#pressure-panel');
        this.brazo2 = document.querySelector('#brazo-virtual-2');
        
        window.addEventListener('mousemove', (e) => {
            let mouseY = 1 - (e.clientY / window.innerHeight) * 2; 
            this.updateCircularPosition(mouseY);
        });

        window.addEventListener('wheel', (e) => {
            e.preventDefault();
            let delta = (e.deltaY > 0 ? -1 : 1) * this.data.speed;
            let currentZ = this.el.object3D.position.z;
            let newZ = Math.min(Math.max(currentZ + delta, this.data.minZ), this.data.maxZ);
            this.el.object3D.position.z = newZ;
            if (this.brazo2) this.brazo2.object3D.position.z = newZ;
            this.updatePressureFeedback(newZ);
        }, {passive: false});
    },

    updateCircularPosition: function (mousePos) {
        let angle = mousePos * this.data.angleLimit;
        this.el.object3D.position.x = Math.cos(angle) * this.data.radius;
        this.el.object3D.position.y = Math.sin(angle) * this.data.radius;
        this.el.object3D.rotation.z = angle;

        if (this.brazo2) {
            let invAngle = -angle;
            this.brazo2.object3D.position.x = -(Math.cos(invAngle) * this.data.radius); 
            this.brazo2.object3D.position.y = Math.sin(invAngle) * this.data.radius;
            this.brazo2.object3D.rotation.z = -invAngle; 
        }
    },

    updatePressureFeedback: function(z) {
        let col = "";

        if (z <= -0.75 && z >= -0.85) { col = "green"; }
        else if (z > -0.75) { col = "yellow"; }
        else { col = "red"; }

        if(this.pressureText) {
            this.pressureText.setAttribute('color', col);
            let txt = "PRESION ";
            txt += col === "green" ? "PRESION PERFECTA\n(Manten y desliza)" : (col === "yellow" ? "PRESION MUY SUAVE\n(Empuja un poco mas, usa la rueda del ratón)" : "DEMASIADA FUERZA\n(Retrocede, lastimas)");
            this.pressureText.setAttribute('value', txt);
        }
        
        this.el.querySelector('a-sphere').setAttribute('material', 'color', col);
    }
});

// LÓGICA DE REPETICIONES
AFRAME.registerComponent('sequence-physics', {
    init: function () {
        this.guiaTexto = document.querySelector('#count-panel');
        this.handSphere = this.el.querySelector('a-sphere');
        
        this.startedAtBottom = false; 
        this.reps = 0;
        this.maxReps = 10;
        this.canCount = true; 

        this.el.addEventListener('raycaster-intersection', (e) => {
            if(this.reps >= this.maxReps) 
                return;
            this.inInsideZone = true;
            const intersectedEl = e.detail.els[0];
            const step = intersectedEl.getAttribute('data-step');
            let handZ = this.el.object3D.position.z;

            if (handZ <= -0.75 && handZ >= -0.85) {
                this.handSphere.setAttribute('material', 'color: green'); 
                this.validateSequence(step);
            } else {
                this.handSphere.setAttribute('material', 'color: orange');
                console.warn("Presion incorrecta en zona:", step);
            }
        });

        this.el.addEventListener('raycaster-intersection-cleared', () => {
            if(this.reps >= this.maxReps) 
                return;

          
            let handZ = this.el.object3D.position.z;
            let col = "red";
            if (handZ <= -0.75 && handZ >= -0.85) col = "green";
            else if (handZ > -0.75) col = "yellow";
            
            this.handSphere.setAttribute('material', 'color', col);
            this.canCount = true; 
        });
    },

    validateSequence: function(step) {
        if (step === "1" || step === "2") {
            if (!this.startedAtBottom) {
                this.startedAtBottom = true;
                this.updateUI("Ubicacion correcta", "#00FF00");
                console.log("%c >>> Inicio OK ", "color: #00FF00");
            }
        }

        if (step === "3") {
            if (this.startedAtBottom && this.canCount) {
                this.reps++;
                this.canCount = false; 
                this.startedAtBottom = false; 


                console.log(`%c REP COMPLETA: ${this.reps}`, "color: #5BEEF7; font-weight: bold");

                if (this.reps >= this.maxReps) {
                    this.updateUI(`¡MASAJE COMPLETADO!\n${this.reps} / ${this.maxReps}`, "#5BEEF7");
                } else {
                    this.updateUI(`¡MUY BIEN!\nRepeticion: ${this.reps} / ${this.maxReps}`, "#00FF00");
                }
            }
        }
    },

    updateUI: function(msg, col) {
        if (this.guiaTexto) {
            this.guiaTexto.setAttribute('value', msg);
            this.guiaTexto.setAttribute('color', col);
        }
    }
});


    AFRAME.registerComponent('teoria-carrusel', {
    init: function () {
        this.paginas = [
            "\n\nEn esta maniobra se toma un pliegue de tejido para imprimirle un movimiento de compresión, torsión y empuje.\nEs una de las maniobras más utilizadas en el masaje. También se le conoce como pretissage.",
            "\n\nSe puede definir como una movilización alternada, de dos segmentos de la misma superficie cutánea o muscular, arrastrados por la adherencia de la mano del fisioterapeuta, y orientada de tal manera que los empujes ejercicos sobre los dos segmentos se equilibran mutuamente",
            "\n\nSe describe como amasamiento superficial cuando la maniobra imprime un movimiento a la piel y el tejido celular subcutáneo, o amasamiento profundo cuando alcanza y se moviliza tejido muscular y aponeurótico. ",
            "\n\nEn el amasamiento superficial la toma se realiza con las yemas de los dedos. En este tipo seincluyen maniobras de pinza rodada, muy utilizadas en el tratamiento de retracciones cutáneas y cicatrices adheridas. ",
            "\n\nLos efectos de amasamiento profundo varían según el ritmo: ejecutada a ritmo lento (15-25 maniobras/minuto), posee un efecto calmante, sedante y descontracturante (normalización del tono muscular); a ritmo rápido (30-40 maniobras/minuto) produce una estimulación circulatoria y propioceptiva.",
            "\n\nSu aplicación requiere que existe un cierto grado de acortamiento mecánico del tejido muscular sobre el que se va a incidir, con el objetivo de realizar la compresión, torsión y estiramiento correctamente.",
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