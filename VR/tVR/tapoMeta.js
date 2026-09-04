AFRAME.registerSystem('tapo-massage', {
  init: function () {
    this.targetReps = 10;
    this.repCount = 0;
    this.done = false;

    this.hands = { left: null, right: null };
    this.countPanel = null;

    // Guarda si en el frame anterior ambas manos ya estaban en puño,
    // para solo actualizar el panel cuando el estado CAMBIA (evita
    // sobrescribir el mensaje de conteo en cada frame sin necesidad).
    this.lastBothFists = false;

    this.el.sceneEl.addEventListener('loaded', () => {
      this.countPanel = document.querySelector('#count-panel');
      this.updatePanel('Cierra el puño con ambas manos (gatillo + grip + pulgar en el centro del stick) y golpea la zona indicada (0/' + this.targetReps + ')');
    });
  },

  registerHand: function (id, component) {
    this.hands[id] = component;
  },

  updatePanel: function (msg) {
    if (this.countPanel) this.countPanel.setAttribute('value', msg);
  },

  bothFistsFormed: function () {
    var left = this.hands.left;
    var right = this.hands.right;
    return !!(left && right && left.fistFormed && right.fistFormed);
  },

  // Se ejecuta automáticamente cada frame (A-Frame llama tick() en los
  // systems igual que en los componentes). Aquí solo vigilamos el CAMBIO
  // de estado de las manos para avisar "posición correcta / incorrecta".
  tick: function () {
    if (this.done) return;

    var nowBoth = this.bothFistsFormed();

    if (nowBoth && !this.lastBothFists) {
      // Acaba de lograrse el puño correcto en ambas manos
      this.updatePanel('¡Posición correcta! Ambas manos en puño. Golpea la zona (' + this.repCount + '/' + this.targetReps + ')');
    } else if (!nowBoth && this.lastBothFists) {
      // Se perdió la posición correcta (soltó trigger/grip o descentró el pulgar)
      this.updatePanel('Forma el puño con AMBAS manos (gatillo + grip + pulgar centrado) (' + this.repCount + '/' + this.targetReps + ')');
    }

    this.lastBothFists = nowBoth;
  },

  // Llamado por una mano cuando detecta un golpeteo válido (borde de entrada a la zona).
  registerTap: function (handId) {
    if (this.done) return;

    if (!this.bothFistsFormed()) {
      this.updatePanel('Forma el puño con AMBAS manos antes de golpetear (gatillo + grip + pulgar centrado)');
      return;
    }

    this.repCount++;
    var mover = this.hands[handId];
    if (mover) mover.pulse();

    if (this.repCount >= this.targetReps) {
      this.done = true;
      this.updatePanel('¡Completado! ' + this.targetReps + '/' + this.targetReps + ' golpeteos');
    } else {
      this.updatePanel('Golpeteo ' + this.repCount + '/' + this.targetReps + ' registrado. Continúa');
    }
  },
  
  resetSequence: function () {
    this.repCount = 0;
    this.done = false;
    this.lastBothFists = false;

    // Resetear el estado interno de cada mano (tapArmed/inZone),
    // para que ninguna quede bloqueada por haber reiniciado a mitad de un golpe
    ['left', 'right'].forEach((id) => {
      var hand = this.hands[id];
      if (hand) {
        hand.inZone = false;
        hand.tapArmed = true;
      }
    });

    this.updatePanel('Cierra el puño con ambas manos (gatillo + grip + pulgar en el centro del stick) y golpea la zona indicada (0/' + this.targetReps + ')');
  }
});


AFRAME.registerComponent('vr-hand-massage', {
  schema: {
    hand: { type: 'string', default: 'right' },
    tapEnterDist: { type: 'number', default: 0.12 },
    tapExitDist: { type: 'number', default: 0.20 },
    downThreshold: { type: 'number', default: 0.004 },
    thumbstickDeadzone: { type: 'number', default: 0.25 },
    hapticIntensity: { type: 'number', default: 0.5 },
    hapticDuration: { type: 'number', default: 100 }
  },

  init: function () {
    this.worldPos = new THREE.Vector3();
    // Antes: this.tapZoneEl guardaba UNA sola caja y this.tapZones nunca
    // se creaba (causaba el error "Cannot read properties of undefined"
    // en cada tick). Ahora guardamos todas las .massage-zone.
    this.tapZones = [];
    this.inZone = false;
    this.tapArmed = true;
    this.fistFormed = false;
    this.lastY = null;

    this.el.sceneEl.addEventListener('loaded', () => {
      this.tapZones = Array.from(document.querySelectorAll('.massage-zone'));
      // Antes decía 'percussion-massage' (nombre que no existe en este
      // archivo); el sistema aquí se llama 'tapo-massage'.
      var sys = this.el.sceneEl.systems['tapo-massage'];
      if (sys) sys.registerHand(this.data.hand, this);
    });
  },

 updateFistState: function () {
    var trackedControls = this.el.components['tracked-controls'];
    var controller = trackedControls && trackedControls.controller;
    var gamepad = controller && controller.gamepad;

    if (!gamepad || !gamepad.buttons || gamepad.buttons.length < 4) {
      this.fistFormed = false;
      return;
    }

    var trigger = gamepad.buttons[0];
    var grip = gamepad.buttons[1];

    var triggerPressed = !!(trigger && trigger.pressed);
    var gripPressed = !!(grip && grip.pressed);

    // Quitamos la exigencia de 'touched' en el thumbstick: en el navegador
    // del Quest ese sensor capacitivo casi nunca se reporta de forma
    // confiable vía WebXR, así que bloqueaba fistFormed aunque trigger+grip
    // estuvieran bien (esto se confirmó viendo el video: el puño se cierra
    // visualmente pero el panel nunca reconocía la posición correcta).
    // Ahora solo pedimos que el stick esté centrado (sin exigir "tocado"),
    // que sigue sirviendo como filtro de "pulgar no está desviando el stick".
    var axisX = (gamepad.axes && gamepad.axes.length > 2) ? gamepad.axes[2] : 0;
    var axisY = (gamepad.axes && gamepad.axes.length > 3) ? gamepad.axes[3] : 0;
    var thumbCentered = Math.abs(axisX) < this.data.thumbstickDeadzone && Math.abs(axisY) < this.data.thumbstickDeadzone;

    this.fistFormed = triggerPressed && gripPressed && thumbCentered;
  },
  getNearestZoneDist: function () {
    var nearestDist = Infinity;
    var zonePos = new THREE.Vector3();
    for (var i = 0; i < this.tapZones.length; i++) {
      this.tapZones[i].object3D.getWorldPosition(zonePos);
      var d = this.worldPos.distanceTo(zonePos);
      if (d < nearestDist) nearestDist = d;
    }
    return nearestDist;
  },

  tick: function () {
    this.updateFistState();

    if (this.tapZones.length === 0) return;

    this.el.object3D.getWorldPosition(this.worldPos);

    var dy = (this.lastY !== null) ? (this.worldPos.y - this.lastY) : 0;
    this.lastY = this.worldPos.y;
    var movingDown = dy < -this.data.downThreshold;

    var dist = this.getNearestZoneDist();

    if (!this.inZone && dist <= this.data.tapEnterDist) {
      this.inZone = true;

      if (this.tapArmed && movingDown) {
        this.tapArmed = false;
        var sys = this.el.sceneEl.systems['tapo-massage'];
        if (sys) sys.registerTap(this.data.hand);
      }
    } else if (this.inZone && dist >= this.data.tapExitDist) {
      this.inZone = false;
      this.tapArmed = true;
    }
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



AFRAME.registerComponent('enlace-menu', {
    init: function () {
        this.el.addEventListener('click', () => { window.location.href = "../menuMeta.html"; });
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


AFRAME.registerComponent('reiniciar-masaje', {
    init: function () {
        this.el.addEventListener('click', () => {
            const sys = this.el.sceneEl.systems['tapo-massage'];
            if (sys) sys.resetSequence();
        });
    }
});