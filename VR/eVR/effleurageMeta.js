
        // DETECTA "TODA zona de LA MANO"
        AFRAME.registerComponent('vr-hand-massage', {
    schema: {
        hand: { type: 'string', default: 'right' },
        minDist: { type: 'number', default: 0.10 },
        maxDist: { type: 'number', default: 0.25 },
        detectionRadius: { type: 'number', default: 0.40 },
        hapticIntensity: { type: 'number', default: 0.6 },
        hapticDuration: { type: 'number', default: 100 }
    },

    init: function () {
        this.pressureText = document.querySelector('#pressure-panel');
        this.guiaTexto = document.querySelector('#instrucciones-guia');
        this.currentZone = null;
        this.currentStep = 0;
        this.isVibrating = false;

        this.mensajesPasos = {
            0: "PASO 1:\nInicia en la zona LUMBAR\n(Color Magenta)",
            1: "PASO 2:\nSube suavemente por la\nzona DORSAL (Naranja)",
            2: "PASO 3:\nExtiende hacia los\nHOMBROS (Azul)",
            3: "PASO 4:\nDesliza por los BRAZOS\n(Cian) para terminar",
            4: "¡EXCELENTE!\nHas completado el ciclo.\nVuelve a la zona lumbar."
        };

        
        this.zonesCache = null;
    },

    getZones: function () {
        if (!this.zonesCache) {
            this.zonesCache = Array.from(document.querySelectorAll('.massage-zone'));
        }
        return this.zonesCache;
    },

    findNearestZone: function (handPos) {
        const zones = this.getZones();
        let nearest = null;
        let nearestDist = Infinity;
        const zonePos = new THREE.Vector3();

        for (let i = 0; i < zones.length; i++) {
            const zoneEl = zones[i];
            zoneEl.object3D.getWorldPosition(zonePos);
            const dist = handPos.distanceTo(zonePos);

            if (dist <= this.data.detectionRadius && dist < nearestDist) {
                nearest = zoneEl;
                nearestDist = dist;
            }
        }
        return { zoneEl: nearest, dist: nearestDist };
    },

    triggerHaptic: function (intensity, duration) {
        const trackedControls = this.el.components['tracked-controls'];
        if (!trackedControls || !trackedControls.controller) return;
        const gamepad = trackedControls.controller.gamepad;
        if (gamepad && gamepad.hapticActuators && gamepad.hapticActuators.length > 0) {
            gamepad.hapticActuators[0].pulse(intensity, duration);
        }
    },

    tick: function () {
        const handPos = new THREE.Vector3();
        this.el.object3D.getWorldPosition(handPos);

        const { zoneEl, dist } = this.findNearestZone(handPos);
        this.currentZone = zoneEl;

        if (!this.currentZone) {
            this.updatePressureUI("MANO EN EL AIRE\n(Acerca la mano)", "#AAA");
            return;
        }

        const distance = dist;
        let isPressureOk = false;

        if (distance > this.data.maxDist) {
            this.updatePressureUI("PRESION MUY SUAVE\n(Empuja un poco más)", "yellow");
        } else if (distance >= this.data.minDist && distance <= this.data.maxDist) {
            this.updatePressureUI("PRESION PERFECTA\n(Mantén y desliza)", "#00FF00");
            isPressureOk = true;

            if (!this.isVibrating) {
                this.isVibrating = true;
                this.triggerHaptic(this.data.hapticIntensity, this.data.hapticDuration);
                setTimeout(() => { this.isVibrating = false; }, 150);
            }
        } else {
            this.updatePressureUI("DEMASIADA FUERZA\n(Retrocede, lastimas)", "red");
            this.triggerHaptic(1.0, 50);
        }

        if (isPressureOk) {
            this.validateSequence();
        }
    },

    updatePressureUI: function (msg, col) {
        if (this.pressureText) {
            this.pressureText.setAttribute('value', msg);
            this.pressureText.setAttribute('color', col);
        }
    },

    validateSequence: function () {
        if (!this.currentZone) return;

        const stepRaw = this.currentZone.getAttribute('data-step');
        if (!stepRaw) return;

        const zoneStep = parseInt(stepRaw.split('-')[0]);

        if (zoneStep === this.currentStep + 1) {
            this.currentStep = zoneStep;
            this.triggerHaptic(0.9, 250);

            if (this.guiaTexto) {
                this.guiaTexto.setAttribute('value', this.mensajesPasos[this.currentStep]);
                this.guiaTexto.setAttribute('color', "#00FF00");
                setTimeout(() => this.guiaTexto.setAttribute('color', "white"), 500);
            }

            if (this.currentStep === 4) {
                setTimeout(() => {
                    this.currentStep = 0;
                    if (this.guiaTexto) this.guiaTexto.setAttribute('value', this.mensajesPasos[0]);
                }, 2500);
            }
        } else if (zoneStep > this.currentStep + 1) {
            if (this.guiaTexto) {
                this.guiaTexto.setAttribute('value', "¡ORDEN INCORRECTO!\nSigue la secuencia de colores");
            }
        }
    }
});

        
        AFRAME.registerComponent('teoria-carrusel', {
            init: function () {
                this.paginas = [
                    "Consiste en el deslizamiento de las manos del fisioterapeuta sobre la piel del paciente de forma rítmica y sin interrupción.\n\nEn función de la presión que se ejerza, el roce puede ser superficial o profundo.",
                    "En el roce superficial, se ejerce una presión suave y tangencial, con un ángulo de incidencia mano-piel de 15°, limitando la acción a la piel y el tejido celular subcutáneo principalmente.",
                    "La maniobra es adireccional, con un ritmo constante, y con su aplicación se prepara la zona diana para recibir maniobras de mayor intensidad.",
                    "En el roce profundo la presión perpendicular que se ejerce es mayor (hasta 35-40º), actuando en estructuras más profundas como músculos, tendones y fascias.",
                    "Fuentes bibliográficas:\nFernández Álvarez, M. d. M., Martín Payo, R., y Cachero Rodríguez, J. (2024). Masoterapia: Manual de técnicas y maniobras."
                ];
                this.indice = 0;
                this.textoEl = document.querySelector('#teoria');
                this.indicadorEl = document.querySelector('#pagina-indicador');

                this.actualizar();

                const izq = document.querySelector('#flecha-izq');
                const der = document.querySelector('#flecha-der');

                if (izq) izq.addEventListener('click', () => {
                    this.indice = (this.indice - 1 + this.paginas.length) % this.paginas.length;
                    this.actualizar();
                });

                if (der) der.addEventListener('click', () => {
                    this.indice = (this.indice + 1) % this.paginas.length;
                    this.actualizar();
                });
            },

            actualizar: function () {
                if (this.textoEl) this.textoEl.setAttribute('troika-text', 'value', this.paginas[this.indice]);
                if (this.indicadorEl) this.indicadorEl.setAttribute('troika-text', 'value', `${this.indice + 1} / ${this.paginas.length}`);
            }
        });

        AFRAME.registerComponent('enlace-menu', {
            init: function() {
                this.el.addEventListener('click', function() {
                    window.location.href = "../menuMeta.html";
                });
            }
        });
    
AFRAME.registerComponent('recalibrar-altura', {
  init: function () {
    this.el.addEventListener('abuttondown', this.recenter.bind(this));
    this.el.addEventListener('xbuttondown', this.recenter.bind(this));
  },
  recenter: function () {
    const cameraEl = document.querySelector('[camera]');
    if (!cameraEl) return;

    const alturaRealUsuario = cameraEl.object3D.position.y; 

    const alturaCinturaIdeal = alturaRealUsuario * 0.70;

    const room = document.querySelector('[gltf-model="#asset-room"]');
    if (room) {
      const posActual = room.getAttribute('position');
      
      room.setAttribute('position', {
        x: posActual.x,
        y: -alturaCinturaIdeal,
        z: posActual.z
      });
    }
  }
});