JSYG.require('Resizable','Selection.css');

(function() {
	
	"use strict";
	
	/**
	 * <strong>nécessite le module Selection</strong><br/><br/>
	 * sélection d'éléments par tracé d'un cadre avec la souris<br/><br/>
	 * @param arg optionnel, argument JSYG, conteneur sur lequel s'applique la selection (si non défini, ce sera window.document)
	 * @param opt optionnel, objet définissant les options. Si défini, le tracé de sélection est activé implicitement
	 * @returns {JSYG.Selection}
	 * @example <pre>var select = new JSYG.Selection();
	 * select.list = ".selectable"; //liste des éléments sélectionnables
	 * select.on("selectedlist",function(liste,e) {
	 * 	alert("j'ai sélectionné "+liste.length+" éléments");
	 * });
	 * select.enable();
	 */
	JSYG.Selection = function(arg,opt) {
		
		/**
		 * Liste des éléments sélectionnés
		 */
		this.selected = [];
		/**
		 * Liste des éléments survolés
		 */
		this.selectedOver = [];
		/**
		 * élément div de tracé de sélection
		 */
		this.container = document.createElement('div');
		
		if (arg) this.setNode(arg);
		if (opt) this.enable(opt);
	};
		
	JSYG.Selection.prototype = new JSYG.StdConstruct();
	
	JSYG.Selection.prototype.constructor = JSYG.Selection;
	
	/**
	 * id appliqué à l'élément de tracé de sélection (this.container)
	*/
	JSYG.Selection.prototype.id = 'Selection';
	/**
	 * argument JSYG définissant les objets sélectionnables
	 */
	JSYG.Selection.prototype.list = null;
	/**
	 * Autorise ou non la sélection multiple (par tracé ou ctrl+clic)
	 */
	JSYG.Selection.prototype.multiple = true;
	/**
	 * Type de recouvrement pour considéré l'élément comme sélectionné.
	 * 'full' : la sélection doit recouvrir entièrement l'élément,
	 * 'partial' : la sélection doit chevaucher l'élément
	 * 'center' : la sélection doit chevaucher le centre de l'élément
	 * @see JSYG.isOver
	 */
	JSYG.Selection.prototype.typeOver = 'full';
	
	/**
	 * Raccourci clavier pour tout sélectionner
	 */
	JSYG.Selection.prototype.shortCutSelectAll = 'Ctrl+A';
	/**
	 * Fonction(s) à exécuter avant le début du tracé (renvoyer false pour l'empêcher)
	 */
	JSYG.Selection.prototype.onbeforedrag = null;
	
	JSYG.Selection.prototype.onbeforeselect = null;
	JSYG.Selection.prototype.onbeforedeselect = null;
	/**
	 * Fonction(s) à exécuter au début du tracé
	 */
	JSYG.Selection.prototype.ondragstart = null;
	/**
	 * Fonction(s) à exécuter pendant tracé
	 */
	JSYG.Selection.prototype.ondrag = null;
	/**
	 * Fonction(s) à exécuter à la fin du tracé
	 */
	JSYG.Selection.prototype.ondragend = null;
	 /**
	 * Fonction(s) à exécuter sur chaque élément nouvellement recouvert par la sélection
	 * this fait référence au conteneur sur lequel s'applique la selection (ou undefined si non défini)
	 * 1er argument : l'élément survolé
	 * 2ème argument : évènement JSYG.Event
	 */
	JSYG.Selection.prototype.onselectover = null;
	 /**
	 * Fonction(s) à exécuter sur chaque élément recouvert pendant le tracé de la sélection
	 * this fait référence au conteneur sur lequel s'applique la selection (ou undefined si non défini)
	 * 1er argument : l'élément survolé
	 * 2ème argument : évènement JSYG.Event
	 */
	JSYG.Selection.prototype.onselectmove = null;
	 /**
	 * Fonction(s) à exécuter sur chaque élément qui sort du tracé de la sélection
	 * this fait référence au conteneur sur lequel s'applique la selection (ou undefined si non défini)
	 * 1er argument : l'élément survol�
	 * 2ème argument : évènement JSYG.Event
	 */
	JSYG.Selection.prototype.onselectout = null;
	 /**
	 * Fonction(s) à exécuter sur chaque élément sélectionné (au rel�chement de la souris)
	 * this fait référence au conteneur sur lequel s'applique la selection (ou undefined si non défini)
	 * 1er argument : l'élément survol�
	 * 2ème argument : évènement JSYG.Event
	 */
	JSYG.Selection.prototype.onselect = null;
	 /**
	 * Fonction(s) à exécuter sur chaque élément d�sélectionné (début d'une nouvelle sélection)
	 * this fait référence au conteneur sur lequel s'applique la selection (ou undefined si non défini)
	 * 1er argument : l'élément survol�
	 * 2ème argument : évènement JSYG.Event
	 */
	JSYG.Selection.prototype.ondeselect = null;
	 /**
	 * Fonction(s) à exécuter sur la liste des éléments sélectionnés (au rel�chement de la souris)
	 * this fait référence au conteneur sur lequel s'applique la selection (ou undefined si non défini)
	 * 1er argument : tableau des éléments sélectionnés
	 * 2ème argument : évènement JSYG.Event
	 */
	JSYG.Selection.prototype.onselectedlist = null;
	 /**
	 * Fonction(s) à exécuter sur la liste des éléments désélectionnés (début d'une nouvelle sélection)
	 * this fait référence au conteneur sur lequel s'applique la selection (ou undefined si non défini)
	 * 1er argument : tableau des éléments sélectionnés
	 * 2ème argument : évènement JSYG.Event
	 */
	JSYG.Selection.prototype.ondeselectedlist = null;
	/**
	 * Indique si la sélection est active ou non
	 */
	JSYG.Selection.prototype.enabled = false;
	/**
	 * Classe à appliquer aux éléments sélectionnés
	 */
	JSYG.Selection.prototype.classSelected = 'selected';
	
	/**
	 * sélectionne un élément
	 * @param item argument JSYG à ajouter à la sélection
	 * @param e JSYG.Event (dans le cas à la méthode est appelée depuis un évènement)
	 */
	JSYG.Selection.prototype.addElmt = function(elmt,e) {
			
		var node = new JSYG(elmt).classAdd(this.classSelected).node;
		
		if (new JSYG(this.list).indexOf(elmt) == -1) throw new Error("L'élément n'est pas sélectionnable");
				
		if (this.selected.indexOf(node) != -1) throw new Error("L'élément est d�j� dans la liste");
		
		if (!node.parentNode) throw new Error("L'élément n'est pas attach� au DOM");
		
		this.selected.push(node);
		
		this.trigger('select',this.node,e,node);
	};
	
	/**
	 * Supprime un élément de la sélection
	 * @param item argument JSYG à ajouter à la sélection
	 * @param e JSYG.Event (dans le cas à la méthode est appelée depuis un évènement)
	 */
	JSYG.Selection.prototype.removeElmt = function(elmt,e) {
				
		var node = new JSYG(elmt).classRemove(this.classSelected).node;
		
		var ind = this.selected.indexOf(node);
		
		if (ind == -1) throw new Error("L'élément n'est pas dans la liste");
		
		this.selected.splice(ind,1);
		
		this.trigger('deselect',this.node,e,elmt.node);
	};
	
	/**
	 * définit la sélection
	 * @param arg argument JSYG faisant référence à la sélection
	 * @param e JSYG.Event (dans le cas à la méthode est appelée depuis un évènement)
	 * @returns {JSYG.Selection}
	 */
	JSYG.Selection.prototype.setSelection = function(arg,e) {
		
		var that = this;
				
		this.deselectAll(e);
		
		new JSYG(arg).each(function() { that.addElmt(this,e); });
		
		if (this.selected.length > 0) this.trigger('selectedlist',this.node,e,this.selected);
		
		return this;
	};
	
	/**
	 * Supprime la sélection
	 * @param e JSYG.Event (dans le cas à la méthode est appelée depuis un évènement)
	 * @returns {JSYG.Selection}
	 */
	JSYG.Selection.prototype.deselectAll = function(e) {
		
		var that = this;
		
		new JSYG(this.list).classRemove(this.classSelected); //par pr�caution
				
		if (this.selected.length > 0) {
			this.selected.forEach(function(elmt) { that.removeElmt(elmt,e); });
		}
		
		this.trigger('deselectedlist',this.node,e,this.selected);
		
		this.selectedOver.forEach(function(elmt) {
			var elmt = new JSYG(elmt).classRemove(that.classSelected);
			that.trigger('selectout',that.node,e,elmt.node);
		});
		
		this.selected = [];
		this.selectedOver = [];
				
		return this;
	};
		
	JSYG.Selection.prototype._draw = function(e) {
		
		var list = new JSYG(this.list),
			container = new JSYG(this.container),
			resize = new JSYG.Resizable(container),
			that = this;
		
		container.id(this.id)
		.appendTo(document.body)
		.setDim({
			x:e.pageX,y:e.pageY,
			width:1,height:1
		});
		
		resize.set({
			click:'left',
			keepRatio:false,
			type:'attributes',
			originY:'top',
			originX:'left',
			cursor:false,
			inverse:true
		});
		
		if (this.resizableOptions) resize.set(resizableOptions);
				
		resize.on('dragstart',function(e) {
			
			list.each(function() {
				
				var dim;
				try {
					dim = this.getDim('screen');
					this.data("dimSelection",dim);
				}
				catch(e) {
					//éléments n'ayant pas de dimensions (exemple balise defs)
				}
				
			},true);
			
			that.trigger('dragstart',that.node,e);
		});
				
		resize.on('drag',function(e) {
						
			var div = new JSYG(this),
				dimDiv = div.getDim('screen');
												
			list.each(function() {
								
				var elmt = new JSYG(this),
					dimElmt = elmt.data("dimSelection"),
					indOver = dimElmt && that.selectedOver.indexOf(this),
					isNewElmt = (indOver === -1);
					
				if (!dimElmt) return;
				
				if (JSYG.isOver(dimDiv,dimElmt,that.typeOver)) {
					
					if (isNewElmt) {
						
						elmt.classAdd(that.classSelected);
						that.trigger('selectover',that.node,e,this);
						that.selectedOver.push(this);
					}
					else that.trigger('selectmove',that.node,e,this);
				}
				else {
					
					if (!isNewElmt) {
						elmt.classRemove(that.classSelected);
						that.trigger('selectout',that.node,e,this);
						that.selectedOver.splice(indOver,1);
					}
				}
			});
			
			that.trigger('drag',that.node,e,this);
		});
		
		resize.on('dragend',function(e) {
			
			var elmts = [];
			
			list.each(function() {
				
				var indOver = that.selectedOver.indexOf(this);
								
				if (indOver !== -1) {
					
					that.trigger('selectout',that.node,e,this);
					
					if (that.trigger("beforeselect",that.node,e,this)) elmts.push(this);
				}
			});

			that.setSelection(elmts,e);
			
			that.trigger('dragend',that.node,e,this);
			
			new JSYG(this).remove();
		});
		
		resize.on('end',function(e) { new JSYG(this).remove(); });
				
		resize.start(e);
				
		return this;
		
	};
	
	JSYG.Selection.prototype._getTarget = function(e) {
		
		var list = new JSYG(this.list);
		
		if (list.indexOf(e.target) !== -1) return e.target;
		
		var child = new JSYG(e.target),
			target = null;
		
		list.each(function() {
			if (child.isChildOf(this)) { target = this; return false; }
		});
		
		return target;
	};
	
	JSYG.Selection.prototype._createShortCut = function() {
		
		var that = this,
			str = this.shortCutSelectAll.toLowerCase(),
			specialKeys = str.split(/\+/),
			key = specialKeys.splice(-1,1)[0];
				
		return new JSYG.KeyShortCut({
			specialKeys : specialKeys,
			key : key,
			action : function(e) {
				e.preventDefault();
				that.setSelection(that.list,e);
			}
		});
	};
	
	/**
	 * Activation du tracé de sélection
	 * @param opt optionnel, objet définissant les options
	 * @returns {JSYG.Selection}
	 */
	JSYG.Selection.prototype.enable = function(opt) {
			
		this.disable();
		
		if (opt) this.set(opt);
		
		var that = this,
		
			drawing = false,
		
			fcts = {
		
				"left-mousedown" : function(e) {
					
					if ((!e.ctrlKey || !that.multiple) && that.trigger("beforedeselect",that.node,e)!==false) that.deselectAll(e);
								
					var cible = that._getTarget(e);
					
					if (cible) {
						
						if (that.trigger("beforeselect",that.node,e,cible)!==false) {
							that.setSelection( that.selected.concat(cible), e);
						}
					}
					else if (e.target == that.node || new JSYG(e.target).isChildOf(that.node)) drawing = true;
				},
				
				"_dragstart" : function(e) {
					if (that.multiple && that.trigger("beforedrag",that.node,e) !== false) that._draw(e);
					else drawing = false;
				},
							
				"mouseup" : function() { drawing = false; },
				
				"mousemove" : function(e) {
									
					if (drawing) return;
									
					var lastOver = that.selectedOver[0] || null,
						cible = that._getTarget(e);
					
					if (lastOver && lastOver !== cible) {
						new JSYG(lastOver).classRemove(that.classSelected);
						that.trigger('selectout',that.node,e,lastOver);
						that.selectedOver = [];
					}
													
					if (cible) {
						if (lastOver === cible) that.trigger('selectmove',that.node,e,lastOver);
						else {
							that.trigger('selectover',that.node,e,cible);
							new JSYG(cible).classAdd(that.classSelected);
						}
						that.selectedOver = [cible];
					}
				},
				
				"mouseout" : function(e) {
					
					if (drawing) return;
					
					var lastOver = that.selectedOver[0];
					
					if (lastOver) {
						new JSYG(lastOver).classRemove(that.classSelected);
						that.trigger('selectout',that.node,e,lastOver);
						that.selectedOver = [];
					}
				}
			},
			
			shortCut = this.shortCutSelectAll && this._createShortCut();
		
		new JSYG(this.node || document).on(fcts);
						
		this.enabled = true;
		
		this.disable = function() {
			new JSYG(this.node || document).off(fcts);
			shortCut && shortCut.disable();
			this.enabled = false;
			return this;
		};
		
		return this;
	};
	
	/**
	 * Désactivation du tracé de sélection
	 * @returns {JSYG.Selection}
	 */
	JSYG.Selection.prototype.disable = function() { return this; };
	
	
}());