(function() {

	"use strict";
		
	/**
	 * paliers pour "aimanter" la rotation
	 */
	function Steps(list,strength) {
		/**
		 * Tableau des paliers en degr�s
		 */
		this.list = list || [];
		/**
		 * Force de l'aimantation en degr�s
		 */
		this.strength = JSYG.isNumeric(strength) ? strength : 3;
	};
	
	/**
	 * <strong>nécessite le module Rotatable</strong>
	 * Rotation de l'élément. Fonctionne bien avec les éléments SVG. Les r�actions sont un peu bizarres avec les éléments HTML, � �viter.<br/><br/>
	 * @param arg argument JSYG faisant r�f�r�nce � l'élément
	 * @param opt optionnel, objet définissant les options. Si défini, la rotation est activ�e
	 * @returns {JSYG.Rotatable}
	 */
	JSYG.Rotatable = function(arg,opt) {
		
		/**
		 * Element � rotationner
		 */
		this.node = new JSYG(arg).node;
		/**
		 * Element(s) qui contr�le(nt) la rotation (par d�faut l'élément lui-m�me)
		 */
		this.field = this.node;
		/**
		 * Paliers "aimant�s" lors de la rotation, en degr�s
		 */
		this.steps = new Steps();
		
		if (opt) { this.enable(opt); }
	};
	
	JSYG.Rotatable.prototype = new JSYG.StdConstruct();
		
	JSYG.Rotatable.prototype.constructor = JSYG.Rotatable;
	/**
	 * Ev�nement qui d�clenche la rotation (mousedown obligatoirement, mais peut �tre "right-mousedown", "ctrl-mousedown", etc 
	 */
	JSYG.Rotatable.prototype.event = 'left-mousedown';
	/**
	 * Classe appliqu�e � l'élément pendant la rotation
	 */
	JSYG.Rotatable.prototype.className = false;
	
	/**
	 * Fonction(s) � ex�cuter quand on pr�pare un d�placement (mousedown sur le contr�le)
	 */
	JSYG.Rotatable.prototype.onstart=null;
	/**
	 * Fonction(s) � ex�cuter quand on commence la rotation
	 */
	JSYG.Rotatable.prototype.ondragstart=null;
	/**
	 * Fonction(s) � ex�cuter pendant la rotation
	 */
	JSYG.Rotatable.prototype.ondrag=null;
	/**
	 * Fonction(s) � ex�cuter � la fin de la rotation
	 */
	JSYG.Rotatable.prototype.ondragend=null;
	/**
	 * Fonction(s) � ex�cuter au rel�chement du bouton souris (qu'il y ait eu rotation ou non)
	 */
	JSYG.Rotatable.prototype.onend=null;
	/**
	 * Indique si la rotation est activ�e ou non
	 */
	JSYG.Rotatable.prototype.enabled = false;
	/**
	 * Curseur � utiliser pendant la rotation
	 */
	JSYG.Rotatable.prototype.cursor = 'url('+JSYG.require.baseURL+'/Rotatable/rotate.png) 12 12, auto';
	
	/**
	 * D�bute la rotation (fonction d�clench� sur mousedown) 
	 * @param e �v�nement JSYG.Event
	 * @returns {JSYG.Rotatable}
	 */
	JSYG.Rotatable.prototype.start = function(e) {

		e.preventDefault();
		
		var _this = this,
			jNode = new JSYG(this.node),
			cursor = this.cursor;
		
		if (cursor) {
			new JSYG(this.field).each(function() {
				var field = new JSYG(this);
				field.data('cursorInit',field.css('cursor'));
				field.css('cursor',cursor);
			});
		}
		
		if (_this.className) { jNode.classAdd(_this.className); }

		var mtxInit = jNode.getMtx(),
		mtxScreenInit = (function() {
			var mtx = jNode.getMtx('screen');
			if (jNode.type === 'html') {
				var dim = jNode.getDim('page');
				mtx = new JSYG.Matrix().translate(dim.x,dim.y).multiply(mtx);
			}
			return mtx;
		})(),
		scaleX = mtxInit.scaleX(),
		scaleY = mtxInit.scaleY(),
		dec = jNode.getShift(),
		screenDec = dec.mtx(mtxScreenInit),
		angleInit = mtxScreenInit.rotate(),
		angleMouseInit = Math.atan2(e.clientX-screenDec.x,e.clientY-screenDec.y) * 180 / Math.PI,
		
		hasChanged = false,
		triggerDragStart = false;
		
		var mousemoveFct = function(e){
			
			if (!triggerDragStart) {
				_this.trigger('dragstart',_this.node,e);
				triggerDragStart = true;
			}
							
			var newAngle = angleInit + angleMouseInit - Math.atan2(e.clientX-screenDec.x,e.clientY-screenDec.y) * 180 / Math.PI;
							
			if (_this.steps.list.length > 0) {
				_this.steps.list.forEach(function(step) {
					if (Math.abs(newAngle-step) < _this.steps.strength || Math.abs(Math.abs(newAngle-step)-360) < _this.steps.strength) {newAngle = step;}
				});
			}
			
			var mtx = mtxInit.translate(dec.x,dec.y)
			.scaleNonUniform(1/scaleX,1/scaleY)
			.rotate(-angleInit).rotate(newAngle)
			.scaleNonUniform(scaleX,scaleY)
			.translate(-dec.x,-dec.y);
			
			jNode.setMtx(mtx);
			
			hasChanged = true;
			_this.trigger('drag',_this.node,e);
		};
					
		var remove = function(e) {
			
			if (_this.className) { jNode.classRemove(_this.className);}
			
			new JSYG(_this.field).each(function() {
				var field = new JSYG(this);
				field.css('cursor',field.data('cursorInit'));
			});
			
			new JSYG(this).off({
				'mousemove':mousemoveFct,
				'mouseup':remove
			});
			
			if (hasChanged) {
				if (_this.type!=='transform' && _this.shape === 'noAttribute') { jNode.mtx2attrs(); }
				_this.trigger('dragend',_this.node,e);
			}
			_this.trigger('end',_this.node,e);
		};
		
		new JSYG(document).on({
			'mousemove':mousemoveFct,
			'mouseup':remove
		});
		
		this.trigger('start',_this.node,e);
		
		return this;
	};
	
	/**
	 * Activation de la rotation
	 * @param opt optionnel, objet définissant les options
	 * @returns {JSYG.Rotatable}
	 */
	JSYG.Rotatable.prototype.enable = function(opt) {
						
		this.disable();
		
		if (opt) {this.set(opt);}
		
		var _this = this;
		var evt = opt && opt.evt;
					
		var start = this.start.bind(this);
						
		new JSYG(this.field).each(function() {
			var field = new JSYG(this);
			field.on(_this.event,start);
		});
		
		this.disable = function() {
			new JSYG(this.field).each(function() {
				var field = new JSYG(this);
				field.off(_this.event,start);
			});
			this.enabled = false;
			return this;
		};
		
		this.enabled = true;
										
		if (evt) { this.start(evt); }
		
		return this;
	};
	
	/**
	 * D�sactivation de la rotation
	 * @returns {JSYG.Rotatable}
	 */
	JSYG.Rotatable.prototype.disable = function() { return this; };
	
	var plugin = JSYG.bindPlugin(JSYG.Rotatable);
	/**
	 * <strong>nécessite le module Rotatable</strong><br/><br/>
	 * Rotation de l'élément par drag&drop souris.<br/>
	 * Fonctionne bien avec les éléments SVG. Les r�actions sont un peu bizarres avec les éléments HTML, � �viter.<br/><br/>
	 * @returns {JSYG}
	 * @see JSYG.Rotatable pour une utilisation d�taill�e
	 * @example <pre>new JSYG('#myShape').draggable();
	 * 
	 * //utilisation avanc�e
	 * new JSYG('#myShape').draggable({
	 * 	steps : {
	 * 		list : [0,90,180,270]
	 *	},
	 *	event:'ctrl-left-mousedown',
	 *	ondragend:function() {
	 *		alert("Rotation de l'élément : "+ new JSYG(this).rotate() + "�");
	 *	}
	 *});
	 */
	JSYG.prototype.rotatable = function() { return plugin.apply(this,arguments); };
	
})();