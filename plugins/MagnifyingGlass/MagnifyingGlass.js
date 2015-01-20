JSYG.require("MagnifyingGlass.css");

(function() {
	
	"use strict";
	
	/**
	 * <strong>nécessite le module MagnifyingGlass</strong><br/><br/>
	 * Loupe qui s'affiche au survol de l'élément. Fonctionne uniquement avec les images pour IE<9.
	 * @param arg argument JSYG sur lequel appliquer la loupe
	 * @param opt optionnel, objet définissant les options. Si défini, la loupe est activ�e implicitement
	 * @returns {JSYG.MagnifyingGlass}
	 */
	JSYG.MagnifyingGlass = function(arg,opt) {
		/**
		 * Conteneur de la loupe (élément div)
		 */
		this.container = document.createElement('div');
		
		if (arg) this.setNode(arg);
		if (opt) this.enable(opt);
	};
	
	JSYG.MagnifyingGlass.prototype = new JSYG.StdConstruct();
	
	JSYG.MagnifyingGlass.prototype.constructor = JSYG.MagnifyingGlass;
	
	/**
	 * Noeud sur lequel on applique la loupe
	 */
	JSYG.MagnifyingGlass.prototype.node = null;
	
	/**
	 * Classe appliqu�e au conteneur
	 */
	JSYG.MagnifyingGlass.prototype.className = 'magnifyingGlass';
	/**
	 * Taille du conteneur
	 */
	JSYG.MagnifyingGlass.prototype.size = 200;
	/**
	 * Forme du conteneur. "circle" ne fonctionne bien qu'avec Firefox (pas du tout avec IE<9, et pas bien avec Chrome ou Opera,
	 * ce qui d�passe de border-radius n'est pas masqu�).
	 * Toute autre valeur que circle affiche un rectangle.
	 */
	JSYG.MagnifyingGlass.prototype.shape = 'circle';
	/**
	 * Coefficient du zoom
	 */
	JSYG.MagnifyingGlass.prototype.coef = 3;
	/**
	 * Indique si la loupe est active ou non
	 */
	JSYG.MagnifyingGlass.prototype.enabled = false;
	/**
	 * Indique si la loupe est affich�e ou non
	 */
	JSYG.MagnifyingGlass.prototype.display = false;
	/**
	 * Fonction(s) � ex�cuter � l'affichage de la loupe
	 */
	JSYG.MagnifyingGlass.prototype.onshow = null;
	/**
	 * Fonction(s) � ex�cuter quand on masque la loupe
	 */
	JSYG.MagnifyingGlass.prototype.onhide = null;
	/**
	 * Fonction(s) � ex�cuter pendant qu'on bouge la loupe
	 */
	JSYG.MagnifyingGlass.prototype.onmove = null;
	/**
	 * Affiche la loupe
	 * @param {Number} x abcisse relativement au noeud
	 * @param {Number} y ordonn�e relativement au noeud
	 * @example 0,0 affichera la loupe dans le coin sup�rieur gauche du noeud.
	 */
	JSYG.MagnifyingGlass.prototype.show = function(x,y) {
		
		var jCont = new JSYG(this.container).appendTo(document.body),
			jNode = new JSYG(this.node),
			clone = jNode.clone(),
			child,dimNode,dimCont;
		
		//FF merdoie avec les dimensions des conteneurs svg
		if (clone.getTag() === 'svg') { clone = new JSYG('<div>').append( jNode.createThumb() ); }
		
		clone.find('.'+this.className).remove();//pour pas m�langer la loupe du reste
		
		child = jCont.children(1);

		if (child.length > 0) { clone.replace(jCont.children(0)); }
		else { clone.insertBefore(jCont.children(0)); }
		
		dimNode = jNode.getDim('page');
		
		if (clone.getTag() === 'img') {
			clone.setDim({
				width: dimNode.width * this.coef,
				height: dimNode.height * this.coef
			});
		} else {
			clone.setDim(dimNode).transfOrigin('top','left').scale(this.coef);
		}
		
		dimCont = jCont.getDim('page');
		
		this._dim = {
			node : dimNode,
			cont : dimCont,
			clone : clone.getDim('page')
		};
		
		jCont.setDim({
			x : dimNode.x + x - dimCont.width/2,
			y : dimNode.y - dimCont.height/2
		});
		
		this.display = true;
		
		this.trigger('show',this.node);
				
		return this;
	};
	
	/**
	 * Masque la loupe
	 * @returns {JSYG.MagnifyingGlass}
	 */
	JSYG.MagnifyingGlass.prototype.hide = function() {
	
		new JSYG(this.container).remove();
		this.display = false;
		this.trigger('hide',this.node);
		return this;
	};

	/**
	 * Met � jour la position par rapport � la souris
	 * @private
	 * @param {JSYG.Event} e 
	 * @returns {JSYG.MagnifyingGlass}
	 */
	JSYG.MagnifyingGlass.prototype._update = function(e) {
			
		if (!this.container || !this._dim) return this;
		
		var jCont = new JSYG(this.container),
			posCursor = new JSYG(this.node).getCursorPos(e),
			dim = this._dim,
			x = dim.cont.width/2 - posCursor.x * dim.clone.width / dim.node.width,
			y = dim.cont.height/2 - posCursor.y * dim.clone.height / dim.node.height,
			clone = jCont.children(0),
			jCont,dimCont;
		
		if (dim.clone.width + x < dim.cont.width/2 || dim.clone.height + y < dim.cont.height/2 || x > dim.cont.width/2 || y > dim.cont.height/2) {
			return this.hide();
		}
		
		clone.setDim({x:x,y:y});
				
		jCont = new JSYG(this.container);
		dimCont = jCont.getDim();
						
		jCont.setDim({
			x : e.clientX - dimCont.width/2,
			y : e.clientY - dimCont.height/2
		});
		
		this.trigger('move',this.node,e);
		
		return this;
	};
	
	/**
	 * Activation de la loupe au survol de l'élément
	 * @param opt optionnel, objet définissant les options
	 * @returns {JSYG.MagnifyingGlass}
	 */
	JSYG.MagnifyingGlass.prototype.enable = function(opt) {
		
		this.disable();
		
		if (opt) this.set(opt);
		
		var jNode = new JSYG(this.node),
			jCont = new JSYG(this.container).classAdd(this.className),
			show,update,subdiv;
		
		jCont.setDim({ width:this.size , height:this.size });
		
		jCont.css({ 'overflow':'hidden', 'position':'fixed' });
		
		if (this.shape === 'circle') jCont.css('border-radius',this.size/2 +'px');
		
		show = function(e) {
			this.show(e.clientX,e.clientY);
			this._update(e);
		}.bind(this);
		
		update = this._update.bind(this);
		
		subdiv = new JSYG('<div>')
		.css({width:'100%',height:'100%',position:'absolute',opacity:0,left:0,top:0})
		.on('mousemove',update)
		.on('mousedown mousemove click keydown keypress',function(e) { e.stopPropagation(); } )
		.on('mouseout',this.hide.bind(this));
		
		jCont.append(subdiv);
				
		jNode.on({
			'mouseover':show,
			'mousemove':update
		});
				
		this.disable = function() {
		
			this.hide();
			jNode.off({
				'mouseover':show,
				'mousemove':update
			});
			new JSYG(this.container).clear();
			this._dim = null;
			this.enabled = false;
			return this;
		};
		
		this.enabled = true;
				
		return this;		
	};
	/**
	 * D�sactivation de la loupe au survol de l'élément
	 * @returns {JSYG.MagnifyingGlass}
	 */
	JSYG.MagnifyingGlass.prototype.disable = function() { return this; };
	
	var plugin = JSYG.bindPlugin(JSYG.MagnifyingGlass);
	
	/**
	 * <strong>nécessite le module MagnifyingGlass</strong><br/><br/>
	 * Loupe qui s'affiche au survol de l'élément. Fonctionne uniquement avec les images pour IE<9.
	 * @returns {JSYG}
	 * @see JSYG.MagnifyingGlass pour une utilisation d�taill�e
	 * @example <pre>new JSYG('#maDiv').magnifyingGlass();
	 * 
	 * //utilisation avanc�e :
	 * new JSYG('#maDiv').magnifyingGlass({
	 * 	coef : 4,
	 * 	size : 400,
	 * 	onmove : function(e) { console.log(e.pageX,e.pageY); }  
	 * });
	 * </pre>
	 */
	JSYG.prototype.magnifyingGlass = function() { return plugin.apply(this,arguments); };
	
})();