JSYG.require('BoundingBox.css');

(function() {

	"use strict";
	/**
	 * <strong>nécessite le module BoundingBox</strong><br/><br/>
	 * Affichage d'un rectangle aux dimensions de l'élément
	 * @param arg argument JSYG faisant référence � l'élément
	 * @param {Object} opt optionnel, objet définissant les options. Si défini, la bounding box est affich�e implicitement
	 */
	JSYG.BoundingBox = function(arg,opt) {
		
		if (arg) { this.setNode(arg); }
		else { this._setType(this._type); }
		
		if (opt) { this.show(opt); }
	};

	JSYG.BoundingBox.prototype = new JSYG.StdConstruct();
	
	JSYG.BoundingBox.prototype.constructor = JSYG.BoundingBox;
	
	/**
	 * conteneur (&lt;div&gt; pour éléments html, &lt;g&gt; pour éléments svg)
	 * @type {Object} objet DOM
	 */
	JSYG.BoundingBox.prototype.container = null;
	/**
	 * pour les éléments svg, chemin tra�ant le contour de la bo�te (�lement &lt;path&gt;)
	 */
	JSYG.BoundingBox.prototype.pathBox = null;
	/**
	 * pour les éléments svg, chemin tra�ant le contour de l'élément (�lement &lt;path&gt;)
	 */
	JSYG.BoundingBox.prototype.pathShadow = null;
	/**
	 * Classe appliqu�e au conteneur
	 */
	JSYG.BoundingBox.prototype.className = 'strokeBox';
	/**
	 * Classe appliqu�e au chemin tra�ant le contour de l'élément (svg uniquement)
	 */
	JSYG.BoundingBox.prototype.classNameShadow = 'shadow';
	/**
	 * Bool�en pour afficher ou non le contour de l'élément (svg uniquement)
	 */
	JSYG.BoundingBox.prototype.displayShadow = false;
	/**
	 * Bool�en pour garder ou non la rotation (si false, le rectangle sera toujours un rectangle droit,
	 * si true il aura la m�me rotation que l'élément)
	 */
	JSYG.BoundingBox.prototype.keepRotation = true;
	/**
	 * Fonctions � ex�cuter � l'affichage de la bo�te
	 */
	JSYG.BoundingBox.prototype.onshow=null;
	/**
	 * Fonctions � ex�cuter � la suppression de la bo�te
	 */
	JSYG.BoundingBox.prototype.onhide=null;
	/**
	 * Fonctions � ex�cuter � la mise � jour de la bo�te
	 */
	JSYG.BoundingBox.prototype.onupdate=null;
	/**
	 * Type de l'élément (svg ou html)
	 */
	JSYG.BoundingBox.prototype._type = 'svg';
	/**
	 * Indique si la bo�te est affich�e ou non
	 */
	JSYG.BoundingBox.prototype.display = false;
	/**
	 * Met � jour les dimensions de la bo�te pour les éléments svg
	 */
	JSYG.BoundingBox.prototype._updatesvg = function(opt) {
		
		if (opt) { this.set(opt); }
		
		var jNode = new JSYG(this.node);
		var ref = new JSYG(this.container).offsetParent();
		
		var CTM = jNode.getMtx(ref);
		
		if (this.keepRotation === false) {	
			var rect = jNode.getDim(ref);
			new JSYG(this.pathBox).attr('d','M'+rect.x+','+rect.y+ 'L'+(rect.x+rect.width)+','+(rect.y)+'L'+(rect.x+rect.width)+','+(rect.y+rect.height)+ 'L'+rect.x+','+(rect.y+rect.height)+ 'L'+rect.x+','+rect.y);
		}
		else {
			var b = jNode.getDim();
			var topleft = new JSYG.Vect(b.x,b.y).mtx(CTM),
			topright = new JSYG.Vect(b.x+b.width,b.y).mtx(CTM),
			bottomleft = new JSYG.Vect(b.x,b.y+b.height).mtx(CTM),
			bottomright = new JSYG.Vect(b.x+b.width,b.y+b.height).mtx(CTM);
			new JSYG(this.pathBox).attr('d','M'+topleft.x+','+topleft.y+ 'L'+topright.x+','+topright.y+'L'+bottomright.x+','+bottomright.y+ 'L'+bottomleft.x+','+bottomleft.y+ 'L'+topleft.x+','+topleft.y);
		}
		
		new JSYG(this.container).classAdd(this.className);
		
		if (this.displayShadow) {
			
			if (!jNode.clonePath) { throw "il faut inclure le module JSYG.Path"; }
			
			var d = jNode.clonePath({normalize:true}).attr('d');
			
			if (!this.pathShadow) { this.pathShadow = new JSYG('<path>').classAdd(this.classNameShadow).appendTo(this.container).node; }
			
			new JSYG(this.pathShadow).attr('d',d).setMtx(CTM).mtx2attrs();
			
		} else if (this.pathShadow) {
			
			new JSYG(this.pathShadow).remove();
			this.pathShadow = null;
		}
		
		return this;
	};
	
	/**
	 * Met � jour les dimensions de la bo�te pour les éléments html
	 */
	JSYG.BoundingBox.prototype._updatehtml = function(opt) {
		
		if (opt) { this.set(opt); }
		
		var jNode = new JSYG(this.node);
		
		var rect = jNode.getDim('page');
		
		new JSYG(this.container).classAdd(this.className).css('position','absolute').setDim(rect);
				
		return this;
	};
	
	/**
	 * Met � jour les dimensions de la bo�te
	 * @param {Object} opt optionnel, objet définissant les options
	 * @returns {JSYG.BoundingBox}
	 */
	JSYG.BoundingBox.prototype.update = function(opt) {
		
		if (!this.node || !this.display) return this;
		this['_update'+this._type](opt);
		this.trigger('update');
		return this;
	};
	
	/**
	 * Affiche la bo�te
	 * @param {Object} opt optionnel, objet définissant les options
	 * @returns {JSYG.BoundingBox}
	 */
	JSYG.BoundingBox.prototype.show = function(opt) {
		
		if (!this.node) return this;
		new JSYG(this.container).appendTo(new JSYG(this.node).offsetParent('farthest'));
		this.display = true;
		this.update(opt);
		this.trigger('show');
		return this;
	};
	
	/**
	 * Suppression de la bo�te du DOM
	 * @returns {JSYG.BoundingBox}
	 */
	JSYG.BoundingBox.prototype.hide = function() {
		new JSYG(this.container).remove();
		this.display = false;
		this.trigger('hide');
		return this;
	};
	
	/**
	 * Affiche ou masque la box
	 * @returns {JSYG.BoundingBox}
	 */
	JSYG.BoundingBox.prototype.toggle = function() {
		
		this.display && this.hide() || this.show();
		return this;
	};
	
	/**
	 * définit les conteneurs en fonction du type de l'élément
	 * @param {String} type type de l'élément (svg ou html)
	 * @returns {JSYG.BoundingBox}
	 */
	JSYG.BoundingBox.prototype._setType = function(type) {
																		//obligatoire pour les constructeurs qui h�ritent de boundingBox (Editable)
		if (type === 'svg' && (this._type!=='svg' || !this.container || !this.hasOwnProperty('container'))) {
			
			this.container = new JSYG('<g>').node;
			this.pathBox = new JSYG('<path>').appendTo(this.container).node;
			this.pathShadow = null;
			
		} else if (type === 'html' && (this._type!=='html' || !this.container  || !this.hasOwnProperty('container'))) {
			
			this.container = new JSYG('<div>').node;
			this.pathBox = null;
			this.pathShadow = null;
		}
		
		this._type = type;
				
		return this;
	};
	
	/**
	 * définition de l'élément cible
	 * @param arg argument JSYG
	 * @returns {JSYG.BoundingBox}
	 */
	JSYG.BoundingBox.prototype.setNode = function(arg) {
				
		var display = this.display;
		
		display && this.hide();
		
		this.node = new JSYG(arg).node;
				
		this._setType(new JSYG(this.node).getType());
		
		if (display) this.show();
		
		return this;
	};
	
	
	var boundingBox = JSYG.bindPlugin(JSYG.BoundingBox);
	/**
	 * <strong>nécessite le module BoundingBox</strong><br/><br/>
	 * Affichage d'une bo�te aux dimensions de l'élément. 1er argument obligatoire ('show','hide' ou 'update' en g�n�ral).<br/><br/>
	 * @returns {JSYG}
	 * @see JSYG.BoundingBox pour une utilisation d�taill�e.
	 * @example new JSYG('#maDiv').boundingBox('show');
	 */	
	JSYG.prototype.boundingBox = function() { return boundingBox.apply(this,arguments); };
	
})();