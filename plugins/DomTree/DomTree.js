JSYG.require('DomTree.css');

(function() {
	
	"use strict";
	
	var dirImages = JSYG.require.baseURL+'/DomTree/img/';
	
	/**
	 * <strong>nécessite le module DomTree</strong><br/><br/>
	 * Affichage du contenu d'un noeud DOM sous forme d'arborescence. Le noeud lui-m�me n'est pas pris en compte (seulement ses enfants).<br/>
	 * @param arg argument JSYG faisant référence au noeud � inspecter
	 * @param opt optionnel, objet définissant les options. Si défini, le plugin est activ�.<br/><br/>
	 * Attention, l'activation du plugin utilise les �v�nements de mutation DOMNodeInserted et DOMNodeRemoved, tr�s gourmands en ressources,
	 * et d�sormais d�conseill�s par le W3C. Pour une meilleure optimisation, appeler la méthode update "manuellement "quand cela est nécessaire.
	 * @link http://www.w3.org/TR/DOM-Level-3-Events/#events-mutationevents
	 * @returns {JSYG.DomTree}
	 */
	JSYG.DomTree = function(arg,opt) {
		
		if (arg) this.setNode(arg);
		if (opt) this.enable(opt);
	};
	
	JSYG.DomTree.prototype = new JSYG.StdConstruct();
	
	JSYG.DomTree.prototype.constructor = JSYG.DomTree;
	/**
	 * Noeud � analyser
	 */	
	JSYG.DomTree.prototype.node = null;
	/**
	 * Argument JSYG faisant référence au conteneur o� on affichera l'arborescence
	 */
	JSYG.DomTree.prototype.container = null;
	/**
	 * Indique si le module est actif ou non
	 */
	JSYG.DomTree.prototype.enabled = false;
	/**
	 * définit si l'arborescence est d�roul�e ou non par d�faut
	 */
	JSYG.DomTree.prototype.displayDefault = false;
	/**
	 * Liste des éléments � prendre en compte
	 * @type argument JSYG
	 */
	JSYG.DomTree.prototype.whiteList = null;
	/**
	 * Liste des balises � ne pas prendre en compte
	 * @type argument JSYG
	 */
	JSYG.DomTree.prototype.blackList = null;
	/**
	 * Classe affect�e au conteneur
	 */
	JSYG.DomTree.prototype.className = 'domTree';
	/**
	 * Affichage simple ou affichage des balises html
	 */
	JSYG.DomTree.prototype.type = 'simple'; //ou html
	/**
	 * Effet d'affichage ('slide','fade','none')
	 */
	JSYG.DomTree.prototype.effect = 'slide';
	/**
	 * Fonctions � ex�cuter sur chaque élément cr�er dans l'arborescence.
	 * this fait référence au noeud enfant analys� et le premier argument
	 * est le lien cr�� dans l'arborescence
	 */
	JSYG.DomTree.prototype.oncreateelement = null;
	
	/**
	 * Indique si l'arborescence est affich�e ou non
	 */
	JSYG.DomTree.prototype.display = false;

	JSYG.DomTree.prototype._create = function(noeudAnalyse,parentNodeAffiche,blackList,whiteList) {
		
		var ul = new JSYG('<ul>');
		
		var jDiv = new JSYG(this.container);

		if (parentNodeAffiche!==jDiv.node && this.displayDefault === false) { ul.css('display','none'); }
				
		var li,a,img,src,text,i,N,attr;
						
		while (noeudAnalyse) {
						
			if (noeudAnalyse.nodeType === 1 && (!whiteList || whiteList.indexOf(noeudAnalyse)!==-1) && (!blackList || blackList.indexOf(noeudAnalyse)===-1)) {
							
				li = new JSYG('<li>').appendTo(ul);
						
				img = new JSYG('<img>').attr('unselectable','on').preventDefault('mousedown');
				
				src = new JSYG(noeudAnalyse).find('*').length >  0 ? "suiv" : "blank";  
				
				img.attr('src',dirImages + src + ".png").appendTo(li);
				
				if (this.displayDefault) { img.classAdd('unrolled'); }
				
				if (this.type != 'html') {
					text = noeudAnalyse.id || noeudAnalyse.tagName;
				} else {
					text = "<"+noeudAnalyse.tagName;
					for (i=0,N=noeudAnalyse.attributes.length;i<N;i++) {
						attr = noeudAnalyse.attributes[i];
						
						//0 doit �tre pris en compte				//IE7 d�balle tous les �v�nements 
						if (attr.value != null && attr.value !='' && !attr.name.match(/^on/)) {
							text+=' '+attr.name+'="'+attr.value+'"';
						}
					}
					text+=">";
				}
				
				//if (noeudAnalyse.firstChild && noeudAnalyse.firstChild.nodeValue) { text+= ' '+noeudAnalyse.firstChild.nodeValue.trim(); }
				
				a = new JSYG('<a>').href('#').textAppend(text).appendTo(li).preventDefault('click');
				
				this.trigger('createelement',noeudAnalyse,a);

				if (noeudAnalyse.firstChild) {
					li.append(this._create(noeudAnalyse.firstChild,li.node,blackList,whiteList));
				}
			}
			
			noeudAnalyse = noeudAnalyse.nextSibling;
		}
		
		if (parentNodeAffiche!==jDiv.node) {
				
			var _this = this;
			
			new JSYG(parentNodeAffiche.firstChild).on('click',function() {
				
				if (ul.css('display') == 'none') {
					new JSYG(this).classAdd('unrolled');
					ul.show(_this.effect);
				}
				else {
					new JSYG(this).classRemove('unrolled');
					ul.hide(_this.effect);
				}
			});
		}
		
		return ul;
	};

	/**
	 * Affiche l'arborescence
	 * @returns {JSYG.DomTree}
	 */
	JSYG.DomTree.prototype.show = function() {
				
		this.hide();
		
		var jDiv = new JSYG(this.container).classAdd(this.className),
			jNode = new JSYG(this.node),
			blackList = this.blackList && jNode.find(this.blackList),
			whiteList = this.whiteList && jNode.find(this.whiteList);
				
		jDiv.append( this._create(this.node.firstChild,jDiv.node,blackList,whiteList) );
		
		this.display = true;
		
		return this;
	};
	
	/**
	 * Masque l'arborescence
	 * @returns {JSYG.DomTree}
	 */
	JSYG.DomTree.prototype.hide = function() {
		if (!this.container) throw "Il faut d'abord définir le conteneur";
		new JSYG(this.container).empty();
		this.display = false;
		return this;
	};
	
	/**
	 * Met � jour l'arborescence
	 * @returns {JSYG.DomTree}
	 */
	JSYG.DomTree.prototype.update = function() {
		if (this.display) this.show();
		return this;
	};
	
	/**
	 * définit le noeud � analyser
	 * @param arg arugment JSYG
	 * @returns {JSYG.DomTree}
	 */
	JSYG.DomTree.prototype.setNode = function(arg) {
		var display = this.display;
		if (display) this.hide();
		this.node = new JSYG(arg).node;
		if (display) this.show();
		return this;
	};
	

	/**
	 * Activation du module.
	 * @deprecated utilise les �v�nements de mutation DOMNodeInserted et DOMNodeRemoved, tr�s gourmands en ressources,
	 * et d�sormais d�conseill�s par le W3C. Pour une meilleure optimisation, appeler la méthode update "manuellement "quand cela est nécessaire.
	 * @param opt optionnel, objet définissant les options
	 * @returns {JSYG.DomTree}
	 */
	JSYG.DomTree.prototype.enable = function(opt) {
	
		if (opt) this.set(opt);
		
		var update = this.update.bind(this);
		
		var fcts = {
			'DOMNodeInserted':update,
			'DOMNodeRemoved':update
		};
		
		new JSYG(this.node).on(fcts);
		
		this.show();
		
		this.disable = function() {
			this.hide();
			new JSYG(this.node).off(fcts);
			return this;
		};
		
		return this;
	};
	/**
	 * D�sactivation du module
	 * @returns {JSYG.DomTree}
	 */
	JSYG.DomTree.prototype.disable = function() { return this; };
	
	
})();