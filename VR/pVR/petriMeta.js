
AFRAME.registerSystem('petri-massage', {
  init: function () {
    this.targetReps = 10;
    this.repCount = 0;
 
    this.hands = { left: null, right: null };
 
    this.phase = 'start';
    this.activeHand = null; 
    this.startY = { left: null, right: null };
 
    this.moveThreshold = 0.02; 
 
    this.countPanel = null;
    this.guidePanel = null;
 
    this.el.sceneEl.addEventListener('loaded', () => {
      this.countPanel = document.querySelector('#count-panel');
      this.guidePanel = document.querySelector('#instrucciones-guia');
      this.updatePanel('Coloca ambas manos en la zona violeta para iniciar (0/' + this.targetReps + ')');
    });
  },
 
  registerHand: function (id, component) {
    this.hands[id] = component;
  },
 
  updatePanel: function (msg) {
    if (this.countPanel) this.countPanel.setAttribute('value', msg);
  },
 
  evaluate: function () {
    var left = this.hands.left;
    var right = this.hands.right;
    if (!left || !right) return;          
    if (this.phase === 'done') return;    
 
    var lZone = left.currentZoneType;   
    var rZone = right.currentZoneType;
    var lY = left.worldPos.y;
    var rY = right.worldPos.y;
 
    switch (this.phase) {
 
      case 'start':
        if (lZone === 'purple' && rZone === 'purple') {
          this.startY.left = lY;
          this.startY.right = rY;
          this.phase = 'ready';
          this.updatePanel('Repetición ' + (this.repCount + 1) + '/' + this.targetReps +
            ': desliza una mano hacia arriba, la otra hacia abajo');
        }
        break;
 
      case 'ready': {
        if (this.startY.left === null || this.startY.right === null) {
          this.phase = 'start';
          break;
        }
        var dLeft = lY - this.startY.left;
        var dRight = rY - this.startY.right;
 
        if (dLeft > this.moveThreshold && dRight < -this.moveThreshold) {
          this.activeHand = 'left';
          this.phase = 'reaching';
        } else if (dRight > this.moveThreshold && dLeft < -this.moveThreshold) {
          this.activeHand = 'right';
          this.phase = 'reaching';
        } else if (lZone !== 'purple' || rZone !== 'purple') {
          this.phase = 'start';
        }
        break;
      }
 
      case 'reaching': {
        var mover = this.hands[this.activeHand];
        var other = this.hands[this.activeHand === 'left' ? 'right' : 'left'];
 
        if (mover.currentZoneType === 'tope') {
          this.phase = 'returning';
          this.updatePanel('¡Tope alcanzado! Regresa a la posición inicial');
        } else if (mover.currentZoneType === null || other.currentZoneType === null) {
          this.phase = 'start';
          this.activeHand = null;
          this.updatePanel('Contacto perdido, vuelve a colocar ambas manos en la zona violeta');
        }
        break;
      }
 
      case 'returning': {
        var mover2 = this.hands[this.activeHand];
        var other2 = this.hands[this.activeHand === 'left' ? 'right' : 'left'];
 
        if (mover2.currentZoneType === 'purple' && other2.currentZoneType === 'purple') {
          this.repCount++;
          this.pulseHaptics();
 
          if (this.repCount >= this.targetReps) {
            this.phase = 'done';
            this.updatePanel('¡Completado! ' + this.targetReps + '/' + this.targetReps + ' repeticiones');
          } else {
            this.startY.left = left.worldPos.y;
            this.startY.right = right.worldPos.y;
            this.activeHand = null;
            this.phase = 'ready';
            this.updatePanel('Repetición ' + this.repCount + '/' + this.targetReps +
              ' completada. Continúa: una mano sube, la otra baja');
          }
        }
        break;
      }
    }
  },
 
  pulseHaptics: function () {
    ['left', 'right'].forEach((id) => {
      var h = this.hands[id];
      if (h && h.pulse) h.pulse();
    });
  }
});

AFRAME.registerComponent('vr-hand-massage', {
  schema: {
    hand: { type: 'string', default: 'right' },         
    minDist: { type: 'number', default: 0.08 },          
    maxDist: { type: 'number', default: 0.30 },           
    detectionRadius: { type: 'number', default: 0.35 },   
    hapticIntensity: { type: 'number', default: 0.5 },
    hapticDuration: { type: 'number', default: 100 }
  },
 
  init: function () {
    this.worldPos = new THREE.Vector3();
    this.currentZoneType = null;
    this.currentZoneEl = null;
    this.zones = null;
    this.isVibrating = false; 
 
    this.el.sceneEl.addEventListener('loaded', () => {
      this.zones = Array.from(document.querySelectorAll('.massage-zone'));
      var sys = this.el.sceneEl.systems['petri-massage'];
      if (sys) sys.registerHand(this.data.hand, this);
    });
  },
 
  
  findNearestZone: function (handPos) {
    var nearest = null;
    var nearestDist = Infinity;
    var tmp = new THREE.Vector3();
 
    for (var i = 0; i < this.zones.length; i++) {
      var zoneEl = this.zones[i];
      zoneEl.object3D.getWorldPosition(tmp);
      var dist = handPos.distanceTo(tmp);
 
      if (dist <= this.data.detectionRadius && dist < nearestDist) {
        nearest = zoneEl;
        nearestDist = dist;
      }
    }
    return { zoneEl: nearest, dist: nearestDist };
  },
 
  tick: function () {
    if (!this.zones) return;
 
    this.el.object3D.getWorldPosition(this.worldPos);
 
    var result = this.findNearestZone(this.worldPos);
 
    if (result.zoneEl) {
      this.currentZoneEl = result.zoneEl;
      var step = result.zoneEl.getAttribute('data-step');
      this.currentZoneType = (step === '3') ? 'tope' : 'purple';
 
      
      if (result.dist >= this.data.minDist && result.dist <= this.data.maxDist && !this.isVibrating) {
        this.isVibrating = true;
        this.pulse();
        setTimeout(() => { this.isVibrating = false; }, 150);
      }
    } else {
      this.currentZoneEl = null;
      this.currentZoneType = null;
    }
 
    var sys = this.el.sceneEl.systems['petri-massage'];
    if (sys) sys.evaluate();
  },
 
  
  pulse: function (overrideIntensity, overrideDuration) {
    var trackedControls = this.el.components['tracked-controls'];
    if (!trackedControls || !trackedControls.controller) return;
 
    var gamepad = trackedControls.controller.gamepad;
    if (gamepad && gamepad.hapticActuators && gamepad.hapticActuators.length > 0) {
      gamepad.hapticActuators[0].pulse(
        overrideIntensity != null ? overrideIntensity : this.data.hapticIntensity,
        overrideDuration != null ? overrideDuration : this.data.hapticDuration
      );
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
        this.flechaIzq= document.querySelector('#flecha-izq');
        this.flechaDer= document.querySelector('#flecha-der');

        this.actualizar();

        this.flechaIzq.addEventListener('click',()=> this.anterior());
        this.flechaDer.addEventListener('click',()=> this.siguiente());
    
        this.hoveredEl = { left:null, right:null };
        this.setupController(document.querySelector('#leftHand'), 'left');
        this.setupController(document.querySelector('#rightHand'), 'right');
    },
    
    setupController: function(handEl, side) {
        if(!handEl) return;
        handEl.addEventListener('raycaster-intersection', (evt) => {
            const el = evt.detail.els[0];
            if(el === this.flechaIzq || el === this.flechaDer) {
                this.hoveredEl[side] = el;
            }
        });

        handEl.addEventListener('raycaster-intersection-cleared',() =>{
            this.hoveredEl[side] = null;
        });

        handEl.addEventListener('triggerdown', () => {
            const el = this.hoveredEl[side];
            if(el === this. flechaIzq) this.anterior();
            else if(el === this.flechaDer) this.siguiente();

        });  
    
    },

    anterior: function(){
        this.indice = (this.indice - 1 + this.paginas.length) % this.paginas.length;
        this.actualizar();

    },

    siguiente: function(){
        this.indice = (this.indice + 1)% this.paginas.length;
        this.actualizar();

    },


    actualizar: function () {
        this.textoEl.setAttribute('troika-text', 'value', this.paginas[this.indice]);
        this.indicadorEl.setAttribute('troika-text', 'value', `${this.indice + 1} / ${this.paginas.length}`);
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

AFRAME.registerComponent('enlace-menu', {
            init: function() {
                this.el.addEventListener('click', function() {
                    window.location.href = "../menuMeta.html";
                });
            }
        });

