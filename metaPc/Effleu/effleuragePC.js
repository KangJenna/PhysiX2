      // CONTROLADOR DE MOVIMIENTO Y PRESIÓN

    AFRAME.registerComponent('pc-controls', {
        schema: { speed: {type: 'number', default: 0.01}, 
                    min: {type: 'number', default: -1.5}, 
                    max: {type: 'number', default: -0.2} },

        init: function () {
            this.pressureText = document.querySelector('#pressure-panel');
            window.addEventListener('wheel', this.onScroll.bind(this), {passive: false});
        },

        onScroll: function (e) {
            e.preventDefault(); 
            let delta = (e.deltaY > 0 ? -1 : 1) * this.data.speed;
            let newZ = Math.min(Math.max(this.el.object3D.position.z + delta, this.data.min), this.data.max);
            this.el.object3D.position.z = newZ;
            
            
            console.log("Profundidad actual (Z):", newZ.toFixed(3));

            this.updatePressureFeedback(newZ);
        },

        updatePressureFeedback: function(z) {
            let msg = "";
            let col = "";
            if (z > -1.0) { 
                msg = "MANO EN EL AIRE\n(Usa la rueda del raton)"; col = "#AAA"; 
            
            }
            else if (z > -1.15) { 
                msg = "PRESION MUY SUAVE\n(Empuja un poco mas)"; col = "yellow"; 
            }
            else if (z > -1.25 && z <= -1.15) { 
                msg = "PRESION PERFECTA\n(Manten y desliza)"; col = "#00FF00";
            }
            else { 
                msg = "DEMASIADA FUERZA\n(Retrocede, lastimas)"; col = "red"; 
            }


            

            if(this.pressureText) {
                this.pressureText.setAttribute('value', msg);
                this.pressureText.setAttribute('color', col);
            }
        }
    });

      // LÓGICA DE SECUENCIA E INSTRUCCIONES DINÁMICAS
    AFRAME.registerComponent('sequence-physics', {
        init: function () {
            this.currentStep = 0; 
            this.guiaTexto = document.querySelector('#instrucciones-guia');
            this.handSphere = this.el.children[0];
            this.lastStepHit = -1;

            // Instrucciones que se mostrarán en el panel
            this.mensajesPasos = {
                0: "PASO 1:\nInicia en la zona LUMBAR\n(Color Amarillo)",
                1: "PASO 2:\nSube suavemente por la\nzona DORSAL (Naranja)",
                2: "PASO 3:\nExtiende hacia los\nHOMBROS (Azul)",
                3: "PASO 4:\nDesliza por los BRAZOS\n(Cian) para terminar",
                4: "¡EXCELENTE!\nHas completado el ciclo.\nVuelve a la zona lumbar."
            };

            this.el.addEventListener('raycaster-intersection', (e) => {
                const intersectedEl = e.detail.els[0];
                const stepRaw = intersectedEl.getAttribute('data-step');
                let zoneStep = parseInt(stepRaw.split('-'[0]));
                let handZ = this.el.object3D.position.z;
                this.validateMassage(zoneStep, handZ);
            });
        },

        validateMassage: function(zoneStep, handZ) {
            let pressureOk = (handZ <= -1.15 && handZ >= -1.25);

            if (!pressureOk) {
                this.handSphere.setAttribute('material', 'color: orange');
                return; 
            }

            if(zoneStep === this.currentStep) 
                return;

            // Validar si es el paso correcto en la secuencia
            if (zoneStep === this.currentStep + 1) {
                this.currentStep = zoneStep;
                this.handSphere.setAttribute('material', 'color: #00FF00');
                
                // ACTUALIZAR EL PANEL DE INSTRUCCIONES
                if(this.guiaTexto) {
                    this.guiaTexto.setAttribute('value', this.mensajesPasos[this.currentStep]);
                    this.guiaTexto.setAttribute('color', "#00FF00");
                    // Volver a blanco después de un segundo
                    setTimeout(() => this.guiaTexto.setAttribute('color', "white"), 500);
                }

                // Si termina el ciclo
                if (this.currentStep === 4) {
                    setTimeout(() => {
                        this.currentStep = 0;
                        this.guiaTexto.setAttribute('value', this.mensajesPasos[0]);
                    }, 2000);
                }
            } else if (zoneStep > this.currentStep + 1) {
                if(this.guiaTexto) this.guiaTexto.setAttribute('value', "¡ORDEN INCORRECTO!\nSigue la secuencia de colores");
            }
        }
    });


    AFRAME.registerComponent('teoria-carrusel', {
    init: function () {
        this.paginas = [
            "Consiste en el deslizamiento de las manos del fisioterapeuta sobre la piel del paciente de forma rítmica y sin interrupción.\n\nEn función de la presión que se ejerza, el roce puede ser superficial o profundo.",
            "\n\nEn el roce superficial, se ejerce una presión suave y tangencial, con un ángulo de incidencia mano-piel de 15°, limitando la acción a la piel y el tejido celular subcutáneo principalmente. Es una maniobra confortable que facilita la toma de contacto al inicio de la aplicación del masaje, y es bien aceptada por los pacientes ya que produce un aumento del calor local y un aumento progresivo del umbral detolerancia a la presión.",
            "\n\nLa maniobra es adireccional, con un ritmo constante, y con su aplicación se prepara la zona diana para recibir maniobras de mayor intensidad. Se caracteriza por tener como principal efecto la analgesia, ya que insensibiliza poco a poco la superficie de la piel. ",
            "\n\n\nEn el roce profundo la presión perpendicular que se ejerce es mayor y se aumenta el ángulo de ataque (hasta 35-40º), actuando también en estructuras más profundas como músculos, tendones, fascias, vasos y planos cápsuloligamentosos. En este casola presión se ejerce con una dirección centrípeta, siguiendo la circulación de retornom venoso. En el caso de ser aplicada en las extremidades, se suele colocar además el segmento en posición de declive para favorecer dicho retorno vascular.",
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




    //Salir 
    AFRAME.registerComponent('enlace-menu', {
    init: function() {
        this.el.addEventListener('click', function() {
            window.location.href = "../menuPC.html";
        });
    }
});


    