JSYG.require("Animation","Legend.css");

(function() {

	"use strict";
	/**
	* <strong>nécessite le module Legend.js</strong><br/><br/>
	* Affiche une l�gende en semi-transparent par dessus un élément 
	*/
	JSYG.Legend = function(arg,opt) {
		
		/**
		 * Div contenant la l�gende
		 */
		this.container = document.createElement('div');
		
		if (arg) { this.setNode(arg); }
		if (opt) { this.show(opt); }
	};
	
	JSYG.Legend.prototype = new JSYG.StdConstruct();
	
	JSYG.Legend.prototype.constructor = JSYG.Legend;
	
	/**
	* Position par rapport � l'élément ("top" ou "bottom")
	*/
	JSYG.Legend.prototype.position = 'bottom';
	/**
	* classe appliqu�e au conteneur
	*/
	JSYG.Legend.prototype.className = 'legend';
	/**
	* texte de la l�gende
	*/
	JSYG.Legend.prototype.content = 'Ceci est ma l�gende';
	/**
	* hauteur de la l�gende
	*/
	JSYG.Legend.prototype.height = 60;
	/**
	* options d'animation
	*/
	JSYG.Legend.prototype.animateOptions = null;
	/**
	* fonction(s) � ex�cuter une fois la l�gende affich�e
	*/
	JSYG.Legend.prototype.onshow = false;
	/**
	* fonction(s) � ex�cuter une fois la l�gende masqu�e
	*/
	JSYG.Legend.prototype.onhide = false;
	/**
	 * Indique si la l�gende est affich�e ou non
	 */
	JSYG.Legend.prototype.display = false;
	/**
	* Affiche la l�gende
	* @param opt optionnel, objet définissant les options.
	* @param callback optionnel, fonction � ex�cuter une fois la l�gende affich�e (équivalent � onshow)
	* @returns {JSYG.Legend}
	*/
	JSYG.Legend.prototype.show = function(opt,callback) {
	
		this.clear();
			
		if (opt) { this.set(opt); }
		
		var jNode = new JSYG(this.node);
		var dim = jNode.getDim();
		
		var jCont = new JSYG(this.container);
		
		jCont.classAdd(this.className)
		.animate('clear')
		.css({
			'position':'absolute',
			'overflow':'hidden',
			'margin':0,
			'height':0
		})
		.text(this.content)
		.classAdd(this.className)
		.appendTo(jNode.offsetParent());
		
		var dimCont = jCont.getDim();
		
		var add = dimCont.height; //padding + border
		
		var y = (this.position == 'bottom') ? dim.y+dim.height-add : dim.y;
		
		jCont.setDim({
			"x":dim.x,
			"y":y,
			"width":dim.height,
			"height":0
		});
		
		var that = this;
		
		var fctCallback = function() {
			that.trigger('show');
			callback && callback.call(that.node);
		};
		
		var options = JSYG.extend({easing:'swing'},this.animateOptions,{onend:fctCallback});
		
		var top = (this.position == 'bottom') ? dim.y+dim.height-this.height-add : dim.y;
				
		jCont.animate({
			"height":this.height,
			"top":top,
			"padding-top":jCont.cssNum('padding-top') || 0,
			"padding-bottom":jCont.cssNum('padding-bottom') || 0,
			"border-top":jCont.cssNum('border-top') || 0,
			"border-bottom":jCont.cssNum('border-bottom') || 0
		},options);
		
		this.display = true;
				
		return this;
	};
	/**
	* Supprime la l�gende imm�diatement (ne d�clenche pas onhide)
	*/
	JSYG.Legend.prototype.clear = function() {
	
		new JSYG(this.container)
		.clear()
		.remove()
		.classRemove(this.className)
		.attrRemove('style');
		
		this.display = false;
		
		return this;
	};
	/**
	* Masque la l�gende
	* @param callback optionnel, fonction � ex�cuter une fois la l�gende masqu�e (équivalent � onhide)
	* @returns {JSYG.Legend}
	*/
	JSYG.Legend.prototype.hide = function(callback) {
		
		if (!this.display) { return this; }
		
		var jCont = new JSYG(this.container);
		
		var jNode = new JSYG(this.node);
		var dim = jNode.getDim();
		
		var that = this;
		
		var fctCallback = function() {
			that.clear();
			that.trigger('hide');
			callback && callback.call(that.node);
		};
						
		var options = JSYG.extend(
			{easing:'swing'},
			this.animateOptions,
			{onend:fctCallback}
		);
		
		var top = (this.position == 'bottom') ? dim.y+dim.height : dim.y;
		
		jCont
		.animate('clear')
		.animate({
			"height":0,
			"top":top,
			"padding-top":0,
			"padding-bottom":0,
			"border-top":0,
			"border-bottom":0
		},options);
		
		this.display = false;
				
		return this;
	};
	/**
	* Affiche ou masque la l�gende
	*/
	JSYG.Legend.prototype.toggle = function() {
		this.display && this.hide() || this.show();
	};
	/**
	* Affiche temporairement la l�gende
	* @param duration dur�e d'affichage en ms
	* @param opt optionnel, objet définissant les options
	*/
	JSYG.Legend.prototype.showhide = function(duration,opt,callback) {
		var that = this;
		this.show(opt,function() { window.setTimeout(function() { that.hide(callback);},duration); });
		return this;
	};
	
	
	var plugin = JSYG.bindPlugin(JSYG.Legend);
	/**
	*
	*/
	JSYG.prototype.legend = function() { return plugin.apply(this,arguments); };
	
}());