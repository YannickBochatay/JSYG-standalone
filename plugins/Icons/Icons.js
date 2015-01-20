JSYG.require('Icons.css');

(function() {

	"use strict";
	
	/**
	 * création d'une icone dans le cadre de la création d'une liste (constructeur JSYG.Icons)
	 * @param arg référence � l'objet DOM
	 * @param opt options � définir (optionnel)
	 * @returns {JSYG.Icon}
	 */
	JSYG.Icon = function(arg,opt) {
		
		this.node = new JSYG(arg).node;
		
		if (opt) this.set(opt);
	};
	
	JSYG.Icon.prototype = new JSYG.StdConstruct();
	
	JSYG.Icon.prototype.constructor = JSYG.Icon;
	
	/**
	 * Classe � appliquer � l'ic�ne
	 */
	JSYG.Icon.prototype.className = null;
	/**
	 * Classe � appliquer � l'ic�ne lorsque celle-ci est s�lectionn�e
	 */
	JSYG.Icon.prototype.classSelected = 'selected';
	/**
	 * Fonctions � ex�cuter lorsque l'icone est s�lectionn�e
	 */
	JSYG.Icon.prototype.onselect = null;
	/**
	 * Fonctions � ex�cuter lorsque l'icone est d�s�lectionn�e
	 */
	JSYG.Icon.prototype.ondeselect = null;
	/**
	 * Fonctions � ex�cuter lorsque l'icone change d'�tat
	 */
	JSYG.Icon.prototype.ontoggle = null;
	/**
	 * Ajout de l'icone � la liste
	 * @param iconList instance de JSYG.Icons
	 * @param ind optionnel, indice o� ins�rer l'ic�ne
	 * @return {JSYG.Icon}
	 */
	JSYG.Icon.prototype.addTo = function(iconList,ind) {
		if (iconList.constructor !== JSYG.Icons) { throw "L'argument de la méthode addTo doit �tre une instance de JSYG.Icons"; }
		iconList.addItem(this,ind);
		return this;
	};
	
	
	
	/**
	 * Gestion d'ic�nes. Permet de g�rer une liste d'�cones, � chaque fois qu'une ic�ne est s�lectionn�e toutes les autres sont d�selectionn�es.
	 * @param opt optionnel, objet définissant les options. Si défini, la gestion des ic�nes est activ�e.
	 * @returns {JSYG.Icons}
	 */
	JSYG.Icons = function(opt) {
		/**
		 * Liste des icones (tableau d'instances de JSYG.Icon)
		 */
		this.list = [];
		if (opt) { this.enable(opt); }
	};
	
	JSYG.Icons.prototype = new JSYG.StdConstruct();
	
	JSYG.Icons.prototype.constructor = JSYG.Icons;
	
	/**
	 * Ev�nement d�clenchant la s�lection de l'ic�ne
	*/
	JSYG.Icons.prototype.event = 'click';
	/**
	 * Fonction(s) � ex�cuter quand l'ic�ne s�lectionn�e change
	 */
	JSYG.Icons.prototype.onchange = null;
	/**
	 * Indice de l'ic�ne s�lectionn�e
	 */
	JSYG.Icons.prototype.current = -1;
	/** 
	 * Ic�ne s�lectionn�e par d�faut 
	 */
	JSYG.Icons.prototype.defaultIcon = -1;
	/**
	 * Indique si la gestion des ic�nes est active ou non 
	 */
	JSYG.Icons.prototype.enabled = false;
	/**
	 * définit si l'ic�ne s�lectionn�e est stock�e dans un cookie ou non 
	 */
	JSYG.Icons.prototype.cookie = false;
	/**
	 * Boucle ou non lors de la s�lection d'un indice < 0 ou sup�rieur aux nombre d'ic�nes
	 */
	JSYG.Icons.prototype.loop = false;
	
	/**
	 * Ajout d'une ic�ne
	 * @param icon instance de JSYG.Icon
	 * @param ind optionnel, indice o� ins�rer l'ic�ne
	 */
	JSYG.Icons.prototype.addItem = function(icon,ind) {
		
		if (icon.constructor !== JSYG.Icon) {
			if (typeof icon === 'object') {
				icon = new JSYG.Icon(icon);
			}
			else { throw "L'argument slide doit �tre une instance de JSYG.Icon"; }
		}
		
		if (this.list.indexOf(icon) === -1) {
			if (ind == null) { ind = this.list.length; }
			this.list.splice(ind,0,icon);
		}
		else { throw "Cette ic�ne est d�j� dans la liste"; }
		
		return this;
	};
	
	/**
	 * Suppression d'une ic�ne
	 * @param {Number,JSYG.Icon,String} ind ic�ne ou indice ou selecteur de l'ic�ne
	 * @returns {JSYG.Icons}
	 */
	JSYG.Icons.prototype.remove = function(arg) {
		
		var item = this.getItem(arg),
			ind = this.list.indexOf(item);
		
		this.list.splice(ind,1);
		
		if (!this.enabled) return this;
		
		if (this.current === ind) {
			
			if (this.list[ind]) this.select(ind);
			else this.select(ind-1);
		}
		
		return this;
	};
	
	/**
	 * S�lection de l'ic�ne suivante
	 * @returns {JSYG.Icons}
	 */
	JSYG.Icons.prototype.next = function() {
		this.select(this.current+1);
		return this;
	};
	
	/**
	 * S�lection de l'ic�ne pr�c�dente
	 * @returns {JSYG.Icons}
	 */
	JSYG.Icons.prototype.prev = function() {
		this.select(this.current-1);
		return this;
	};
	
	/**
	 * récupère une �cone de la liste définie
	 * @param {Number,JSYG.Icon,String} ind ic�ne ou indice ou selecteur de l'ic�ne
	 * @returns {JSYG.Icon}
	 */
	JSYG.Icons.prototype.getItem = function(arg) {
		
		if (this.list.length === 0) throw new Error("aucune ic�ne n'a �t� définie");
		
		var ind,i,N,node;
		
		if (JSYG.isNumeric(arg)) ind = arg;
		else if (arg instanceof JSYG.Icon) {
			
			if (this.list.indexOf(arg)!= -1) return arg;
			else throw new Error("Cette instance de JSYG.Icon n'est pas dans la liste");
		}
		else if (arg && typeof arg == "string") {
			
			node = new JSYG(arg).node;
			
			for (i=0,N=this.list.length;i<N;i++) {
				
				if (this.list[i].node == node) {
					ind = i;
					break;
				}
			}
			
			if (ind == null) throw new Error(arg+" : aucune icone ne correspond � cet identifiant");
		}
		else throw new Error((typeof arg)+" : type incorrect pour la méthode getItem");
		
		if (ind<0) {
			
			if (this.loop) return this.list[ind+this.list.length];
			else throw new Error(arg+" : indice incorrect");
			
		}
		else if (ind>this.list.length-1) {
			
			if (this.loop) return this.list[ind-this.list.length];
			else throw new Error(arg+" : indice incorrect");
		}
		
		return this.list[ind];
	};
	/**
	 * S�lection d'une ic�ne
	 * @param {Number,JSYG.Icon,String} ind ic�ne ou indice ou selecteur de l'ic�ne
	 * @returns
	 */
	JSYG.Icons.prototype.select = function(arg) {
		
		var item = this.getItem(arg),
			ind = this.list.indexOf(item),
			current;
		
		if (this.list[this.current]) {
						
			current = this.list[this.current];
			current.trigger('toggle');
			current.trigger('deselect');
		}
		
		this.list.forEach(function(icon) {
			new JSYG(icon.node).classRemove(icon.classSelected);
		});
		
		this.current = ind;
		
		current = this.list[ind];
		new JSYG(current.node).classAdd(current.classSelected);
				
		this.trigger('change');
		current.trigger('toggle');
		current.trigger('select');
						
		return this;
	};
	
	/**
	 * D�selectionne l'ic�ne s�lectionn�e s'il y en a une.
	 * L'�v�nement "change" est d�clench�.
	 * @returns {JSYG.Icons}
	 */
	JSYG.Icons.prototype.deselect = function() {
		
		var current;
		
		if (this.list.length === 0) return this;
								
		if (this.list[this.current]) {
			
			current = this.list[this.current];
			current.trigger('toggle');
			current.trigger('deselect');
			
			this.list.forEach(function(icon) {
				new JSYG(icon.node).classRemove(icon.classSelected);
			});
		}
		
		this.current = -1;
		
		this.trigger('change');
				
		return this;
	};
	
	/**
	 * Activation de la gestion des ic�nes
	 * @param opt optionnel, objet définissant les options
	 * @returns {JSYG.Icons}
	 */
	JSYG.Icons.prototype.enable = function(opt) {
		
		var fct = [],
			cookie,
			that = this;
		
		function unload() { JSYG.cookies.write('icons',that.current); };
			
		this.disable();
		
		if (opt) this.set(opt);
				
		this.list.forEach(function(icon,i) {
			
			fct[i] = function(e) { that.select(i); };
			new JSYG(icon.node).classAdd(icon.className).on(that.event,fct[i]);
		});
		
		
		if (this.cookie) {
			
			if (!JSYG.cookies) throw new Error("Il faut inclure le plugin JSYG.Cookies");
			
			cookie = JSYG.cookies.read('icons');
			
			if (cookie!=null) this.select(cookie);
			else if (this.defaultIcon!==-1) this.select(this.defaultIcon);
			
			new JSYG(window).on('unload',unload);
			
		} else if (this.defaultIcon!==-1) this.select(this.defaultIcon);
		
		
		this.disable = function() {
			
			this.deselect();
						
			this.list.forEach(function(icon,i) {
				new JSYG(icon.node).off(that.event,fct[i]);
			});
			
			new JSYG(window).off('unload',unload);
			
			this.current = -1;

			this.enabled = false;
			
			return this;
		};
		
		this.enabled = true;
		
		return this;
	};
	
	/**
	 * D�sactivation de la gstion des ic�nes
	 * @returns {JSYG.Icons}
	 */
	JSYG.Icons.prototype.disable = function() {
		return this;
	};
	
})();