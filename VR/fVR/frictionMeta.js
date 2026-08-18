
AFRAME.registerSystem('friction-massage', {
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
      this.updatePanel('Coloca ambas manos en la zona naranja para iniciar (0/' + this.targetReps + ')');
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
        if (lZone === 'orange' && rZone === 'orange') {
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
        } else if (lZone !== 'orange' || rZone !== 'orange') {
          this.phase = 'start';
        }
        break;
      }
 
      case 'reaching': {
        var mover = this.hands[this.activeHand];
        var other = this.hands[this.activeHand === 'left' ? 'right' : 'left'];
 
        if (mover.currentZoneType === 'blue') {
          this.phase = 'returning';
          this.updatePanel('¡Tope alcanzado! Regresa a la posición inicial');
        } else if (mover.currentZoneType === null || other.currentZoneType === null) {
          this.phase = 'start';
          this.activeHand = null;
          this.updatePanel('Contacto perdido, vuelve a colocar ambas manos en la zona naranja');
        }
        break;
      }
 
      case 'returning': {
        var mover2 = this.hands[this.activeHand];
        var other2 = this.hands[this.activeHand === 'left' ? 'right' : 'left'];
 
        if (mover2.currentZoneType === 'orange' && other2.currentZoneType === 'orange') {
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
      var sys = this.el.sceneEl.systems['friction-massage'];
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
      this.currentZoneType = (step === '3') ? 'blue' : 'orange';
 
      
      if (result.dist >= this.data.minDist && result.dist <= this.data.maxDist && !this.isVibrating) {
        this.isVibrating = true;
        this.pulse();
        setTimeout(() => { this.isVibrating = false; }, 150);
      }
    } else {
      this.currentZoneEl = null;
      this.currentZoneType = null;
    }
 
    var sys = this.el.sceneEl.systems['friction-massage'];
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
