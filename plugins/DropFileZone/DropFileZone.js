(function() {
	
	"use strict";
	/**
	 * définition d'une zone de drag&drop de fichiers (depuis l'explorateur)
	 * @param arg argument JSYG faisant référence � la zone
	 * @param {Object} opt optionnel, objet définissant les options. Si défini, la zone est activ�e implicitement 
	 */
	JSYG.DropFileZone = function(arg,opt) {
		
		this.node = new JSYG(arg).node;
		if (opt) { this.enable(opt); }
	};
	
	JSYG.DropFileZone.prototype = new JSYG.StdConstruct();
	
	JSYG.DropFileZone.prototype.constructor = JSYG.DropFileZone;
	/**
	 * Fonctions � ex�cuter lorsque la souris entre sur la zone
	 */
	JSYG.DropFileZone.prototype.ondragover = null;
	/**
	 * Fonctions � ex�cuter lorsque la souris quitte la zone
	 */
	JSYG.DropFileZone.prototype.ondragout = null;
	/**
	 * Fonctions � ex�cuter lorsque un(des) fichiers est(sont) d�pos�(s)
	 * le 1er argument de ces fonctions fait référence � l'objet JSYG.Event, le 2�me � l'objet FileList correspondant aux fichiers d�pos�s
	 */
	JSYG.DropFileZone.prototype.ondrop = null;
	/**
	 * Indique si la zone est activ�e ou non
	 */
	JSYG.DropFileZone.prototype.enabled = false;
	/**
	 * Activation de la zone
	 */
	JSYG.DropFileZone.prototype.enable = function(opt) {
		
		this.disable();
		
		if (opt) this.set(opt);
		
		var that = this;
		
		var fcts = {
			dragenter : function(e) { e.stopPropagation(); e.preventDefault(); },
			dragover : function(e) { e.stopPropagation(); e.preventDefault(); that.trigger('dragover',that.node,e); },
			dragout : function(e) { that.trigger('dragout',that.node,e); },
			drop : function(e) {
				 e.stopPropagation(); e.preventDefault();
				 var dt = e.dataTransfer;
				 if (dt && dt.files) that.trigger('drop',that.node,e,dt.files);
			}
		};
		
		var jNode = new JSYG(this.node);
		
		jNode.on(fcts);
		
		this.disable = function() {
			jNode.off(fcts);
			this.enable = false;
			return this;
		};
		
		this.enable = true;
		
		return this;
		
	};
	
	/**
	 * D�sactivation de la zone
	 * @returns {JSYG.DropFileZone}
	 */
	JSYG.DropFileZone.prototype.disable = function() { return this; };
	
	var plugin = JSYG.bindPlugin(JSYG.DropFileZone);
	/**
	 * <strong>nécessite le module DropFileZone</strong><br/><br/>
	 * Rend l'élément r�ceptif aux drag&drop de fichiers depuis l'explorateur du client
	 * @returns {JSYG}
	 * @see JSYG.DropFileZone pour une utilisation d�taill�e
	 */
	JSYG.prototype.dropFileZone = function() { return plugin.apply(this,arguments); };
	
}());