JSYG.require('UndoRedo.css');

(function() {

	"use strict";
	
	/**
	 * <strong>nécessite le module UndoRedo</strong>
	 * Constructeur permettant la gestion de fonctions annuler/refaire.<br/>
	 * A chaque fois que la méthode saveState est appelée, le noeud est clon� et stock� dans une pile.<br/>
	 * Quand on appelle les méthodes undo ou redo, le noeud est remplac� par le clone ad�quat.<br/>
	 * Ailleurs dans le code il faut donc faire attention � ne pas faire référence directement � ce noeud, car celui-ci change.
	 * Il vaut mieux utiliser un selecteur css pour retrouver le bon élément � chaque fois.
	 */
	JSYG.UndoRedo = function(arg,opt) {
		
		/**
		 * Pile contenant les noeuds clon�s
		 */
		this.stack = [];
		
		/**
		 * Raccourci clavier pour annuler (CTRL-Z)
		 */
		this.keyShortCutUndo = new JSYG.KeyShortCut();
		
		this.keyShortCutUndo.set({
			key:'z',
			specialKeys:'ctrl',
			action:this.undo.bind(this)
		});
		
		/**
		 * Raccourci clavier pour refaire (CTRL-Y)
		 */
		this.keyShortCutRedo = new JSYG.KeyShortCut();
		
		this.keyShortCutRedo.set({
			key:'y',
			specialKeys:'ctrl',
			action:this.redo.bind(this)
		});
		
		if (arg) {
			/**
			 * Noeud sur lequel s'applique la fonction
			 */
			this.node = new JSYG(arg).node;
		}
		if (opt) this.enable(opt);
	};
	
	JSYG.UndoRedo.prototype = new JSYG.StdConstruct();
	
	JSYG.UndoRedo.prototype.constructor = JSYG.UndoRedo;

	/**
	 * Champ annuler
	 * @type argument JSYG
	 */
	JSYG.UndoRedo.prototype.fieldUndo = null;
	
	/**
	 * Champ refaire
	 * @type argument JSYG
	 */
	JSYG.UndoRedo.prototype.fieldRedo = null;
	
	/**
	 * Nombre d'�tats que l'on conserve en m�moire
	 * @type {Number}
	 */
	JSYG.UndoRedo.prototype.depth = 10;
	
	/**
	 * Classe � appliquer aux champs annuler ou refaire quand ils sont inactifs (en bout de pile)
	 */
	JSYG.UndoRedo.prototype.classInactive = 'disabled';
	
	/**
	 * Indice de l'�tat courant
	 */
	JSYG.UndoRedo.prototype.current = 0;	
	/**
	 * Fonctions � ex�cuter � chaque fois qu'on annule une action
	 */
	JSYG.UndoRedo.prototype.onundo = null;
	
	/**
	 * Fonctions � ex�cuter � chaque fois qu'on r�tablit une action
	 */
	JSYG.UndoRedo.prototype.onredo = null;
	
	/**
	 * Fonctions � ex�cuter � chaque fois qu'on annule ou refait une action
	 */
	JSYG.UndoRedo.prototype.onchange = null;
	
	/**
	 * Fonctions � ex�cuter � chaque fois qu'on sauve l'�tat courant
	 */
	JSYG.UndoRedo.prototype.onsave = null;
	
	/**
	 * Indique si le module est actif ou non
	 */
	JSYG.UndoRedo.prototype.enabled = null;
	
	/**
	 * Change le noeud par le noeud situ� dans la pile � l'indice passé en argument 
	 */
	JSYG.UndoRedo.prototype.change = function(indice) {
		
		if (this.stack[indice] == null) return;
				
		var clone = new JSYG(this.stack[indice].node).clone(this.keepEvents);
				
		clone.replace(this.node);
		
		this.node = clone.node;
		
		this.current = indice;
		
		if (this.fieldUndo) {
			if (this.stack.length > 1 && this.current < this.stack.length-1) new JSYG(this.fieldUndo).classRemove(this.classInactive);
			else new JSYG(this.fieldUndo).classAdd(this.classInactive);
		}
		
		if (this.fieldRedo) {
			if (this.stack.length > 1 && this.current > 0) new JSYG(this.fieldRedo).classRemove(this.classInactive);
			else new JSYG(this.fieldRedo).classAdd(this.classInactive);
		}
				
		this.trigger('change',this.node);
	};
	
	/**
	 * Sauve l'�tat courant
	 * @param label optionnel, intitul� de l'action effectu�e
	 * @returns {JSYG.UndoRedo}
	 */
	JSYG.UndoRedo.prototype.saveState = function(label,_preventEvent) {
		
		//on vide le d�but du tableau si on avait annul� quelque chose
		while (this.current>0) { this.stack.shift(); this.current--; }
		
		var clone = new JSYG(this.node).clone();
		
		if (!clone.length) return this;
		
		this.stack.unshift( { "label":label, "node" : clone.node } );
		
		if (this.stack.length > this.depth){this.stack.pop();}
		
		if (this.fieldRedo) new JSYG(this.fieldRedo).classAdd(this.classInactive);
		if (this.fieldUndo) new JSYG(this.fieldUndo).classRemove(this.classInactive);
		
		if (!_preventEvent) this.trigger('save',this.node);
				
		return this;
	};
	
	/**
	* définit si on peut annuler
	*/
	JSYG.UndoRedo.prototype.hasUndo = function() {
		return this.current < this.stack.length-1;
	};
	
	/**
	* définit si on peut refaire
	*/
	JSYG.UndoRedo.prototype.hasRedo = function() {
		return this.current >= 1;
	};
	/**
	 * Annule l'action pr�c�dente (remplace le noeud par le dernier �tat sauvegard�)
	 * @returns {JSYG.UndoRedo}
	 */
	JSYG.UndoRedo.prototype.undo = function() {
		
		if (!this.hasUndo()) return;
		
		this.change(++this.current);
		
		this.trigger('undo',this.node);
		
		return this;
	};
	
	/**
	 * R�tablit l'action pr�c�dente (remplace le noeud par l'�tat suivant dans la pile).
	 * @returns {JSYG.UndoRedo}
	 */
	JSYG.UndoRedo.prototype.redo = function() {
		
		if (!this.hasRedo()) return;
				
		this.change(--this.current);
		
		this.trigger('redo',this.node);
		
		return this;
	};
	
	/**
	 * Vide la pile
	 * @returns {JSYG.UndoRedo}
	 */
	JSYG.UndoRedo.prototype.clear = function(_preventEvent) {
		
		this.current=0;
		this.stack.splice(0,this.stack.length);
		this.fieldRedo && new JSYG(this.fieldRedo).classAdd(this.classInactive);
		this.saveState(null,_preventEvent);
		this.fieldUndo && new JSYG(this.fieldUndo).classAdd(this.classInactive);
		
		return this;
	};
	
	/**
	 * Sauve l'�tat courant et active les fonctions si les propriétés fieldUndo et/ou fieldRedo ont �t� définies.
	 * @returns {JSYG.UndoRedo}
	 */
	JSYG.UndoRedo.prototype.enable = function(opt) {
				
		var undo = this.undo.bind(this),
			redo = this.redo.bind(this);
		
		this.disable();
		
		if (opt) this.set(opt);
		
		this.saveState(null,true);
		
		this.fieldUndo && new JSYG(this.fieldUndo).on('click',undo).classAdd(this.classInactive);
		this.fieldRedo && new JSYG(this.fieldRedo).on('click',redo);
		
		
		this.disable = function() {
			
			this.clear(true);
			
			this.stack.splice(0,this.stack.length);
			
			this.fieldUndo && new JSYG(this.fieldUndo).off('click',undo).classRemove(this.classInactive);
			this.fieldRedo && new JSYG(this.fieldRedo).off('click',redo).classRemove(this.classInactive);
			this.enabled = false;
			
			this.keyShortCutUndo.disable();
			this.keyShortCutRedo.disable();
			
			return this;
		};
		
		this.enabled = true;
		
		return this;
	};
	
	/**
	 * Vide la pile et d�sactive les fonctions.
	 * @returns {JSYG.UndoRedo}
	 */
	JSYG.UndoRedo.prototype.disable = function() { return this; };
	
})();