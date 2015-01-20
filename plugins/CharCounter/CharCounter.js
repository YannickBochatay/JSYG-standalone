JSYG.require("CharCounter.css");

(function() {

	"use strict";
	/**
	 * <strong>nécessite le module CharCounter</strong><br/><br/>
	 * Compteur de caract�res pour champs texte
	 * @param arg argument JSYG faisant référence � l'élément DOM o� l'on va afficher le nombre de caract�res
	 * @param {Object} opt optionnel, objet définissant les options. Si défini, le compteur de caract�res est activ� implicitement.
	 * @returns {JSYG.CharCounter}
	 */
	JSYG.CharCounter = function(arg,opt) {
	
		this.node = new JSYG(arg).node;
		/**
		 * nombres de caract�res impliquant un changement de classe du compteur
		 */
		this.limits = [200];
		/**
		 * classes � appliquer au compteur selon le nombre de caract�res ( this.classNames.length === this.limits.length+1 )
		 */
		this.classNames = ['green','red'];
		
		if (opt) { this.enable(opt); }
	};
	
	JSYG.CharCounter.prototype = new JSYG.StdConstruct();
	
	/**
	 * Champs textarea (ou input text) pris en compte par le compteur
	 * @type argument JSYG
	 */
	JSYG.CharCounter.prototype.textareas = null;
	/**
	 * Indique si le compteur est actif
	 */
	JSYG.CharCounter.prototype.enabled = false;
	/**
	 * fonctions � ex�cuter quand le compteur est mis � jour
	 */
	JSYG.CharCounter.prototype.onupdate = null;
	/**
	 * Suppression des balises pour compter les caract�res (richTextAreas)
	 */
	JSYG.CharCounter.prototype.stripTags = true;
	/**
	 * Renvoie le nombre de caract�res calcul�
	 * @returns {Number}
	 */
	JSYG.CharCounter.prototype.getLength = function() {
		var length = 0;
		var strip = this.stripTags;
		new JSYG(this.textareas).each(function() {
			length+= ( strip ? JSYG.stripTags(this.value) : this.value ).length;
		});
		return length;
	};
	/**
	 * Renvoie la classe associ�e au nombre de caract�res courant
	 * @returns {String }
	 */
	JSYG.CharCounter.prototype.getClassName = function() {
		var nbc = this.getLength();
		var limits = Array.isArray(this.limits) ? this.limits : [this.limits];
		var i=0;
		while ( nbc > limits[i]) { i++; }
		return this.classNames[i] ? this.classNames[i] : this.classNames[this.classNames.length-1];
	};
	
	/**
	 * Mise � jour du compteur
	 * @returns {JSYG.CharCounter}
	 */
	JSYG.CharCounter.prototype.update = function() {
		var jNode = new JSYG(this.node);
		jNode.classRemove.apply(jNode,this.classNames);
		jNode.text(this.getLength()).classAdd(this.getClassName());
		this.trigger('update',this.node);
		return this;
	};
	
	/**
	 * Activation du compteur
	 * @param {Object} opt optionnel, objet définissant les options
	 * @returns {JSYG.CharCounter}
	 */
	JSYG.CharCounter.prototype.enable = function(opt) {
	
		if (opt) { this.set(opt); }
		
		var update = this.update.bind(this);
		
		var jAreas = new JSYG(this.textareas).on('input',update);
		
		this.disable = function() {
			jAreas.off('input',update);
			this.enabled = false;
		};
		
		this.update();
		
		this.enabled = true;
		
		return this;
	};
	
	/**
	 * D�sactivation du compteur
	 * @returns {JSYG.CharCounter}
	 */
	JSYG.CharCounter.prototype.disable = function() { return this; };
	
	var charCounter = JSYG.bindPlugin(JSYG.CharCounter);
	
	/**
	 * <strong>nécessite le module CharCounter</strong><br/><br/>
	 * Activation du champ comme compteur de caract�res.<br/><br/>
	 * Options � définir obligatoirement :
	 * <ul>
	 * <li>textareas : argument JSYG faisant référence au(x) champ(s) pris en compte par le compteur </li>
	 * <li>limits : valeur faisant changer la classe du compteur (par d�faut vert ou rouge)</li>
	 * </ul><br/>
	 * @returns {JSYG}
	 * @see JSYG.CharCounter pour une utilisation d�taill�e
	 * @example <pre>new JSYG('#monSpan').charCounter({
	 * 	textareas:'.mesTextAreasPrisesEnCompte',
	 * 	limits:200
	 * });
	 * 
	 * //Utilisation avanc�e
	 * new JSYG('#monSpan').charCounter({
	 * 	textareas:'.mesTextAreasPrisesEnCompte',
	 * 	limits:[200,250],
	 * 	classNames:['green','orange','red']
	 * });
	 * </pre>
	 */
	JSYG.prototype.charCounter = function() { return charCounter.apply(this,arguments); };
	
}());