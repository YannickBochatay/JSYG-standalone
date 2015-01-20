JSYG.require('ScanDir','Explorer.css',function() {
	
	"use strict";
	/**
	 * <strong>nécessite le module Explorer</strong><br/><br/>
	 * Transforme un champ input en explorateur de fichiers c�t� serveur<br/><br/>
	 * @param arg argument JSYG faisant référence � un champ input
	 * @param opt optionnel, objet définissant les options. Si défini, l'explorateur est activ� implicitement.
	 * @returns {JSYG.Explorer}
	 */
	JSYG.Explorer = function(arg,opt) {
		
		if (arg) this.setNode(arg);
		JSYG.ScanDir.call(this,'<div>');
		
		if (this.node.tagName !== 'INPUT') throw "L'argument doit faire référence � un élément input";
		if (opt) this.enable(opt);
	};
	/**
	 * H�rite de JSYG.Scandir
	 */
	JSYG.Explorer.prototype = new JSYG.ScanDir();
	
	JSYG.Explorer.prototype.constructor = JSYG.Explorer;
	/**
	 * Indique si le module est activ� ou non
	 */
	JSYG.Explorer.prototype.enabled = false;
	/**
	 * type d'affichage 'details' ou 'icons'
	 */
	JSYG.Explorer.prototype.displayType = 'details';
	/**
	 * Indique si l'explorateur est affich� ou non
	 */
	JSYG.Explorer.prototype.display = false;
	/**
	 * Affiche l'explorateur
	 * @returns {JSYG.Explorer}
	 */
	JSYG.Explorer.prototype.show = function(callback) {
				
		var jCont = new JSYG(this.container).clear(),
			jNode = new JSYG(this.node),
			val = jNode.val(),
			dim = jNode.getDim();
				
		jCont.setDim({x:dim.x,y:dim.y+dim.height,width:dim.width})
		.appendTo(jNode.offsetParent());
							
		JSYG.ScanDir.prototype.show.call(this,callback);
		
		return this;
	};
	
	/**
	 * Masque l'explorateur
	 * @returns {JSYG.Explorer}
	 */
	JSYG.Explorer.prototype.hide = function(callback,_preventEvent) {
		
		JSYG.ScanDir.prototype.hide.call(this,callback,_preventEvent);
		new JSYG(this.container).remove();
		return this;
	};
	
	function normalizePath(path) {
		
		var regexp = /\/([^\/:\*\?'"<>\|\\(\.\.)]+\/\.\.|\.?\/)/gi;
		while (path.match(regexp)) path = path.replace(regexp,'/');
		
		// ce qui suit ne marche pas, je n'en ai pas trouv� la raison
		//while (regexp.test(path)) { path = path.replace(regexp,'/'); }
				
		return path;
	};
	
	//en th�orie, e.preventDefault() sur mousedown bloque l'�v�nement blur du champ input.
	//pour ie7 , il faut ajouter unselectable sur tous les champs
	function unselectable(elmt) {
		try { elmt.unselectable = 'on'; }
		catch(e) {};
		if (elmt.childNodes) {
			for (var i=0,N=elmt.childNodes.length;i<N;i++) { unselectable( elmt.childNodes.item(i) ); }
		}
	};
	
	/**
	 * Activation de l'explorateur
	 * @param opt optionnel, objet définissant les options
	 * @returns {JSYG.Explorer}
	 */
	JSYG.Explorer.prototype.enable = function(opt) {
		
		this.disable();
		
		if (opt) this.set(opt);
		
		var jNode = new JSYG(this.node),
			autocomplete = jNode.attr('autocomplete'),
			val = jNode.val(),
			that = this;
		
		if (val) this.path = normalizePath(val);
		
		function changeDir(a) {
			
			unselectable(a);
			new JSYG(a).on({
				'mousedown':JSYG.preventDefault,
				'dblclick':function() {
					
					that.path = normalizePath( that.path+'/'+this.lastChild.nodeValue+'/' );
					
					jNode.val(that.path);
					
					that.show();
				}
			});
		}
		
		function actuFile(a) {
			unselectable(a);
			new JSYG(a).on({
				'mousedown':JSYG.preventDefault,
				'click':function() {
					var path = that.path;
					if (path.substr(path.length-1) !=='/') path+='/';
					path+= this.lastChild.nodeValue;
					jNode.val(path);
				},
				'dblclick':function() { that.hide(); }
			});
		}
		
		this.on({'dir':changeDir,'file':actuFile});
		
		jNode.attr('autocomplete','off');
		
		new JSYG(this.container).css('position','absolute');
		
		var fcts = {
			"focus click" : function() {
				
				var val = this.value,
					path = normalizePath(val);
				
				if (/\.\w{1,4}$/.test(path)) path = path.substr(0,val.lastIndexOf('/'));
				
				if (that.path !== path) { //la valeur a �t� modifi�e manuellement, on actualise
					that.path = path;
					that.show();
				}
				else if (!that.display) that.show();
			},
			blur : function() { that.hide(); }
		};
		
		jNode.on(fcts);
		
		this.disable = function() {
			this.hide();
			jNode.attr('autocomplete',autocomplete);
			jNode.off(fcts);
			this.off({'dir':changeDir,'file':actuFile});
			this.enabled = false;
			return this;
		};
		
		this.enabled = true;
						
		return this;
		
	};
	
	JSYG.Explorer.prototype.disable = function() { return this; };
	
	var plugin = JSYG.bindPlugin(JSYG.Explorer);
	/**
	 * <strong>nécessite le module Explorer</strong><br/><br/>
	 * Activation d'un explorateur de fichier sur l'élément input
	 * @returns {JSYG}
	 * @see JSYG.Explorer pour une utilisation d�taill�e
	 */
	JSYG.prototype.explorer = function() { return plugin.apply(this,arguments); };

});