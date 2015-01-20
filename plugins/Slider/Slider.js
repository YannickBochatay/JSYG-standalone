JSYG.require('Slider.css','Tooltip','Draggable');

(function() {
	
	"use strict";
	
	/**
	 * <strong>nécessite le module Slider</strong><br/><br/>
	 * création et gestion d'un slider ("glissi�re")
	 * @param arg optionnel, argument JSYG faisant référence � une div. Si non défini, cr�e une nouvelle div.
	 * @param opt optionnel, objet définissant les options.
	 * @returns {JSYG.Slider}
	 */
	JSYG.Slider = function(arg,opt) {
	
		if (!arg) arg = '<div>';
		
		/**
		 * div contenant le slider
		 */
		this.container = new JSYG(arg).node;
		
		if (opt) this.set(opt);
	};

	JSYG.Slider.prototype = new JSYG.StdConstruct();
	
	JSYG.Slider.prototype.constructor = JSYG.Slider;
	
	/**
	 * orientation du slider 'horizontal' ou 'vertical'
	 */
	JSYG.Slider.prototype.orientation = 'horizontal';
	
	/**
	 * Valeur minimale (peut �tre défini comme attribut du champ input)
	 */
	JSYG.Slider.prototype.min = null;
	/**
	 * Valeur maximale (peut �tre défini comme attribut du champ input)
	 */
	JSYG.Slider.prototype.max = null;
	/**
	 * Pas entre 2 valeurs (peut �tre défini comme attribut du champ input)
	 */
	JSYG.Slider.prototype.step = null;
	/**
	 * Valeur par d�faut
	 */
	JSYG.Slider.prototype.defaultValue = null;
	/**
	 * Largeur du slider (pour InputSlider, la valeur par d�faut est la largeur du champ input si orientation='horizontal' ou sa hauteur si orientation='vertical')
	 */
	JSYG.Slider.prototype.width = null;
	/**
	 * Hauteur du slider (pour InputSlider, la valeur par d�faut est par d�faut la hauteur du champ input si orientation='vertical' ou sa largeur si orientation='horizontal')
	 */
	JSYG.Slider.prototype.height = null;
	/**
	 * Epaisseur du curseur
	 */
	JSYG.Slider.prototype.cursorThickness = 12;
	/**
	 * D�passement du curseur de chaque c�t� de la glissi�re, en pixels
	 */
	JSYG.Slider.prototype.cursorOverflow = 3;
	/**
	 * Classe appliqu�e au conteneur
	 */
	JSYG.Slider.prototype.className = "slider";
	/**
	 * Affiche ou non une infobulle au survol de la souris
	 */
	JSYG.Slider.prototype.tooltip = false;
	/**
	 * Classe appliqu�e � l'infobulle si tooltip===true
	 */
	JSYG.Slider.prototype.classTooltip = "sliderTooltip";
	/**
	 * Fonction pour formater la valeur dans l'infobulle
	 * @example <pre>function(value) {
	 * 	return value+" km/h";
	 * }
	 */
	JSYG.Slider.prototype.tooltipFct = null;
	/**
	 * fonction(s) � ex�cuter quand on enclenche le bouton souris (�v�nement mousedown)
	 */
	JSYG.Slider.prototype.onstart = null;
	/**
	 * fonction(s) � ex�cuter pendant le cliquer/glisser
	 */
	JSYG.Slider.prototype.ondrag = null;
	/**
	 * fonction(s) � ex�cuter au rel�chement de la souris (mouseup)
	 */
	JSYG.Slider.prototype.onend = null;
	/**
	 * Fonction(s) � ex�cuter quand la valeur change
	 */
	JSYG.Slider.prototype.onchange = null;
	
	/**
	 * Ajustement de la valeur en fonction de min, max et step
	 */
	JSYG.Slider.prototype._adjustValue = function(value) {
		
		var step = this.step.toString(),
			nbdec = step.length-1-step.lastIndexOf('.'),
			precision = Math.pow(10,nbdec);
		
		step = this.step*precision;
		
		value = Math.round(value*precision);
		
		return JSYG.clip( (value - value%step) / precision , this.min , this.max );
	};
		
	JSYG.Slider.prototype._getValueFromPos = function(pos) {
		
		var horiz = this.orientation.indexOf('horiz') === 0,
			sliderSize = this[ horiz ? "width" : "height" ],
			prop = pos[ horiz ? "x" : "y" ],
			value = prop * (this.max - this.min) / sliderSize + this.min;
				
		return this._adjustValue(value);
	};
			
	JSYG.Slider.prototype._setPosFromValue = function(value) {
		
		var cursor = new JSYG(this.container.firstChild),
			horiz = this.orientation.indexOf('horiz') === 0,
			sliderSize = this[ horiz ? "width" : "height" ],
			prop = horiz ? "x" : "y",
			center = {};
		
		center[prop] = Math.round( (value-this.min)*sliderSize / (this.max - this.min) );
		
		cursor.setCenter(center);
		
		return this;
	};
	
	JSYG.Slider.prototype._lastValue = null;
	
	/**
	 * Renvoie la valeur th�orique en fonction d'un �v�nement souris
	 * @param e JSYG.Event
	 * @returns {Number}
	 */
	JSYG.Slider.prototype.getValueFromEvent = function(e) {
		
		var val,pos;
		
		if (e.target === this.container.firstChild) val = this.val();
		else {
			pos = new JSYG(this.container).getCursorPos(e);
			val = this._getValueFromPos(pos);
		}
		
		return val;
	};
	
	/**
	 * Fixe ou récupère la valeur du slider
	 * @param value si défini fixe la valeur, sinon la renvoie
	 */	
	JSYG.Slider.prototype.val = function(value,preventEvent,_from) {
					
		if (value == null) return this._lastValue;
			
		value = this._adjustValue(value);
								
		if (value != this._lastValue) {
			
			this._setPosFromValue(value);
			
			//bidouille pour simplifier les choses avec InputSlider
			if (_from!='input' && this.node && value!=this.node.value) new JSYG(this.node).val(value,preventEvent);
			
			if (!preventEvent) this.trigger("change",this.node,value);
			
			this._lastValue = value;
		}
				
		return this;
	};
	
	/**
	 * Affecte la valeur pr�c�dente
	 * @returns {JSYG.Slider}
	 */
	JSYG.Slider.prototype.prevVal = function(preventEvent) {
		this.val(this.val() - this.step,preventEvent);
		return this;
	};
	
	/**
	 * Affecte la valeur suivante
	 * @returns {JSYG.Slider}
	 */
	JSYG.Slider.prototype.nextVal = function(preventEvent) {
		this.val( this.val() + this.step,preventEvent);
		return this;
	};
	
	/**
	 * création du slider
	 * @returns {JSYG.Slider}
	 */
	JSYG.Slider.prototype.create = function() {
		
		this.clear();
		
		if (!this.container.parentNode) throw new Error("Il faut d'abord attacher le conteneur au DOM");
		
		var jCont = new JSYG(this.container),
			defaultValue = this.defaultValue || this.min,
			horiz = this.orientation.indexOf('horiz') === 0,
			dim = jCont.getDim(),
			node = this.node, //défini seulement dans le cas de InputSlider, mais cela permet de simplifier les choses
			valInit,
			jCurs,
			that = this;
		
		if (this.width == null) this.width = dim.width || (horiz ? 200 : 8);
		if (this.height == null) this.height = dim.height || (horiz ? 8 : 200);
				
		jCont.classAdd(this.className)
		.css({
			width : this.width + 'px',
			height : this.height + 'px',
			position : 'relative'
		});
		
		jCurs = new JSYG('<div>');
		jCurs.css('position','relative').appendTo(jCont);
					
		if (horiz) {
			jCurs.css({
				width : this.cursorThickness + 'px',
				height : this.height + this.cursorOverflow*2 + 'px',
				top : -this.cursorOverflow + 'px'
			});
		} else {
			jCurs.css({
				width : this.width + this.cursorOverflow*2 + 'px',
				height : this.cursorThickness + 'px',
				left : -this.cursorOverflow + 'px'
			});
		}
		
		function mousedown(e) {
			
			e.preventDefault();
			
			var pos = jCont.getCursorPos(e),
				value = that._getValueFromPos(pos); 
			
			valInit = that.val();
						
			that.val(value);
			
			new JSYG(document).on({
				"mousemove":mousemove,
				"mouseup":mouseup
			});
			
			that.trigger('start',node,e,value);
			
			if (that.tooltip) {
				if (typeof that.tooltipFct == "function") value = that.tooltipFct(value);
				jCont.tooltip('update',{content:value});
			}
		}
		
		function mousemove(e) {
			
			var pos = jCont.getCursorPos(e),
				value = that._getValueFromPos(pos);
			
			that.val(value);
			
			that.trigger('drag',node,e,value);
		}
		
		function mouseup(e) {
			
			new JSYG(document).off({
				"mousemove":mousemove,
				"mouseup":mouseup
			});
			
			var pos = jCont.getCursorPos(e),
				value = that._getValueFromPos(pos);
			
			that.val(value);
			
			that.trigger('end',node,e,value); 
			
			if (node && valInit != value) {
				new JSYG(node).trigger("change");
				that.trigger('change',node,e,value);
			}
		}
								
		jCont.on('mousedown',mousedown);
		
		if (this.tooltip) {
			
			jCont.tooltip({effect : 'none', content: defaultValue, className:this.classTooltip })
			.on('mousemove',function(e) {
				var content = that.getValueFromEvent(e);
				if (typeof that.tooltipFct == "function") content = that.tooltipFct(content);
				jCont.tooltip('update',{content:content});
			});
		}
		
		this.val(defaultValue,true);
		
		return this;
	};
	
	/**
	 * Suppression du contenu du slider
	 * @returns {JSYG.Slider}
	 */
	JSYG.Slider.prototype.clear = function() {
		
		new JSYG(this.container).empty();
		return this;
	};
	
	/**
	 * <strong>nécessite le module Slider</strong><br/><br/>
	 * Transformation d'un champ input text en slider.
	 * @param arg argument JSYG faisant référence au champ input
	 * @param opt optionnel, objet définissant les options. Si défini, le slider est activ� implicitement.
	 * @returns {JSYG.InputSlider}
	 */
	JSYG.InputSlider = function(arg,opt) {
		
		JSYG.Slider.call(this);
		
		if (arg) this.setNode(arg);
		
		if (opt) this.enable(opt);
	};
	
	JSYG.InputSlider.prototype = new JSYG.Slider();
		
	JSYG.InputSlider.prototype.enabled = false;
	
	/**
	 * Active le slider
	 * @param opt optionnel, objet définissant les options
	 * @returns {JSYG.Slider}
	 */
	JSYG.InputSlider.prototype.enable = function(opt) {
		
		this.disable();
		
		if (opt) this.set(opt);

		var jCont = new JSYG(this.container),
			jNode = new JSYG(this.node),
			horiz = this.orientation.indexOf('horiz') === 0,
			that = this,
			changeValue = function() { that.val(this.value,false,'input'); },
			display;
				
		if (this.min == null) this.min = parseFloat(jNode.attr('min'));
		if (this.max == null) this.max = parseFloat(jNode.attr('max'));
		if (this.step == null) this.step = parseFloat(jNode.attr('step'));
		
		this.defaultValue = this.node.value;
				
		if (this.width == null) this.width = horiz ? this.node.clientWidth : 8;
		if (this.height == null) this.height = horiz ? 8 : this.node.clientWidth;
				
		jNode.on('change',changeValue);
		
		display = jNode.css('display'); 
		jNode.css('display','none');
					
		jCont.insertBefore(this.node);
		
		this.create();
		
		this.disable = function() {
			
			jNode.css('display',display).off('change',changeValue);
			this.clear();
			jCont.remove();
			this.enabled = false;
			return this;
		};
		
		this.enabled = true;
		
		return this;
	};
	/**
	 * D�ssactivation du slider
	 * @returns {JSYG.Slider}
	 */
	JSYG.InputSlider.prototype.disable = function() {
		return this;
	};
	
	var plugin = JSYG.bindPlugin(JSYG.InputSlider);
	/**
	 * <strong>nécessite le module Slider</strong><br/><br/>
	 * Transformation de l'élément input (text) en "glissi�re". Pour ne pas avoir � le faire dans la définition des options (et pour coller
	 * � la syntaxe des champs input type="range" non impl�ment� dans ff), on peut définir les attributs html "min", "max" et "step".<br/><br/>
	 * @returns {JSYG}
	 * @see JSYG.Slider pour une utilisation d�taill�e
	 * @example <pre>new JSYG('#monInput').slider();
	 * 
	 * //utilisation avanc�e
	 * new JSYG('#monInput').slider({
	 * 	tooltip:true,
	 * 	orientation:'vertical',
	 * 	min:1,
	 * 	max:10,
	 * 	step:0.2,
	 * 	onchange:function() { new JSYG('#maDiv').resetTransf().scale(this.value); }
	 * });
	 */
	JSYG.prototype.slider = function() { return plugin.apply(this,arguments); };
	
})();