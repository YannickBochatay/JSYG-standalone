JSYG.require("Animation");

(function() {

	"use strict";
	/**
	 * <strong>nécessite le module Beacon</strong><br/><br/>
	 * Animation en boucle de la couleur d'un élément pour un effet "gyrophare"
	 * @param arg argument JSYG faisant référence � l'élément
	 * @param {Object} opt optionnel, objet définissant les options . Si défini,
	 * @returns {JSYG.Beacon}
	 * @example <pre>var beacon = new JSYG.Beacon('#maDiv');
	 * beacon.color = 'violet';
	 * beacon.duration = 500;
	 * beacon.on('loop',function() { console.log("j'ai fait un tour et je recommence"); });
	 * beacon.enable();
	 * setTimeout(function() { beacon.disable(); },3000});
	 */
	JSYG.Beacon = function(arg,opt) {
		if (arg) this.setNode(arg);
		if (opt) this.enable(opt);
	};
	
	JSYG.Beacon.prototype = new JSYG.StdConstruct();
	
	JSYG.Beacon.prototype.constructor = JSYG.Beacon;
	/**
	 * Couleur d'arriv�e
	 */
	JSYG.Beacon.prototype.color = 'red';
	/**
	 * dur�e de l'animation entre la couleur de départ et celle d'arriv�e
	 */
	JSYG.Beacon.prototype.duration = 1000;
	/**
	 * Options suppl�mentaires pour l'animation
	 * @see JSYG.Animation
	 */
	JSYG.Beacon.prototype.animateOptions = null;
	/**
	 * Fonctions � ex�cuter pendant l'animation
	 */
	JSYG.Beacon.prototype.onanimate = null;
	/**
	 * Fonctions � ex�cuter � chaque fois que l'animation change de sens
	 */
	JSYG.Beacon.prototype.onchangeway = null;
	/**
	 * Fonctions � ex�cuter � chaque fois qu'on revient � la couleur initiale
	 */
	JSYG.Beacon.prototype.onloop = null;
	/**
	 * Activation du "gyrophare"
	 */
	JSYG.Beacon.prototype.enable = function(opt) {
			
		this.disable();
					
		if (opt) this.set(opt);
		
		var jNode = new JSYG(this.node),
			prop = (jNode.getType() === 'html') ? 'background-color' : 'fill',
			beacon = jNode.data('beaconanimation'),
			_this = this;
		
		if (beacon) beacon.stop();
		
		beacon = new JSYG.Animation(this.node);
		
		beacon.to = {};
		beacon.to[prop] = this.color;
		beacon.duration = this.duration;
		beacon.onanimate = this.onanimate;

		if (this.animateOptions) beacon.set(this.animateOptions);
		
		beacon.on('end',function() {
			_this.trigger('changeway',this);
			if (beacon.way === -1) _this.trigger('loop',this);
			beacon.way*= -1;
			beacon.play();
		});
		
		beacon.play();
		
		jNode.data('beaconanimation',beacon);
		
		return this;
	};
	
	/**
	 * D�sactivation du gyrophare
	 * @returns {JSYG.Beacon}
	 */
	JSYG.Beacon.prototype.disable = function() {
		
		var jNode = new JSYG(this.node),
			beacon = jNode.data('beaconanimation');
		
		if (beacon) {
			beacon.stop();
			jNode.dataRemove('beaconanimation');
		}
		
		return this;
	};
	
	var plugin = JSYG.bindPlugin(JSYG.Beacon);
	/**
	 * <strong>nécessite le module Beacon</strong><br/><br/>
	 * Animation en boucle de la couleur d'un élément pour un effet "gyrophare"
	 * @returns {JSYG}
	 * @see JSYG.Beacon pour une utilisation d�taill�e
	 * @example <pre>new JSYG('#madiv').beacon({color:'violet'});
	 */
	JSYG.prototype.beacon = function() { return plugin.apply(this,arguments); };
	
}());