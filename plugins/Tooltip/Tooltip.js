JSYG.require("Animation","Ajax","Tooltip.css");

(function() {

	"use strict";
	/**
	 * <strong>nécessite le module Tooltip</strong><br/><br/>
	 * création d'une infobulle qui s'affiche au survol de la souris. Le contenu peut être charg� en ajax.<br/><br/>
	 * @param arg argument JSYG
	 * @param {Object} opt optionnel, objet définissant les options. Si défini, l'infobulle est activ�e implicitement. 
	 * @returns {JSYG.Tooltip}
	 * @example <pre>//exemple1 :
	 * var tooltip = new JSYG.Tooltip('#maDiv');
	 * tooltip.content = "Hello world";
	 * tooltip.position = "above";
	 * tooltip.delay = 200;
	 * tooltip.on('hide',function() { console.log("Bye"); });
	 * tooltip.enable();
	 * 
	 * //exemple2 :
	 * var tooltip = new JSYG.Tooltip('#maDiv');
	 * tooltip.url = "monscript.php";
	 * tooltip.refresh = true; //recharge à chaque survol
	 * tooltip.enable();
	 * 
	 * //exemple 3 :
	 * var tooltip = new JSYG.Tooltip(document.body);
	 * tooltip.content = new JSYG('unElementDejaCree');
	 * new JSYG('.maClasse').on({
	 * 	mouseover:function() { tooltip.show(10,10); },
	 * 	mouseout:function() { tooltip.hide(); }
	 * });
	 * //l'infobulle s'affichera à une position fixe à chaque survol d'un élément contenant la classe maClasse 
	 */
	JSYG.Tooltip = function(arg,opt) {
		
		/**
		 * Div contenant l'infobulle
		 */
		this.container = document.createElement('div');
		
		if (arg) this.setNode(arg);
		if (opt) this.enable(opt);
	};
	
	JSYG.Tooltip.prototype = new JSYG.StdConstruct();
	
	JSYG.Tooltip.prototype.constructor = JSYG.Tooltip;
	/**
	 * contenu de l'infobulle
	 * @type {String,Object} argument JSYG ou chaîne html
	 */
	JSYG.Tooltip.prototype.content = null;
	/**
	 * url pour ramener le contenu par requête ajax
	*/
	JSYG.Tooltip.prototype.url = null;
	/**
	 * si url est défini, recharge ou non le contenu à chaque survol
	 */
	JSYG.Tooltip.prototype.refresh = false;
	/**
	 * si url est défini, url de l'icone pendant le chargement
	 */
	JSYG.Tooltip.prototype.loadingIcon = JSYG.require.baseURL+'/Tooltip/img/loading.gif';
	/**
	 * largeur maximale de l'infobulle
	 * @type {Number}
	 */
	JSYG.Tooltip.prototype.maxWidth = false;
	/**
	 * Position de l'infobulle
	 * 'above','below','left','right','pointer' (pour suivre la souris), ou coordonn�es x et y séparées par une virgule ou espace (position relative à l'élément).
	 */
	JSYG.Tooltip.prototype.position = 'pointer';
	/**
	 * D�calage horizontal par rapport au curseur souris, si position est défini à 'pointer'
	 * @type {Number} : 15 par d�faut
	 */
	JSYG.Tooltip.prototype.shiftX = 15;
	/**
	 * D�calage vertical par rapport au curseur souris, si position est défini à 'pointer'
	 * @type {Number} : 15 par d�faut
	 */
	JSYG.Tooltip.prototype.shiftY = 15;
	/**
	 * classe affectée à la div d'infobulle
	 * @type {String} : 'tooltip' par d�faut
	 */
	JSYG.Tooltip.prototype.className = 'tooltip';
	/**
	 * Effet d'affichage
	 * 'fade','slide' ou 'none'
	 */		
	JSYG.Tooltip.prototype.effect = 'fade';
	/**
	 * Fonctions à ex�cuter à l'affichage de l'infobulle
	 */
	JSYG.Tooltip.prototype.onshow = false;
	/**
	 * Fonctions à ex�cuter quand la souris bouge alors que l'infobulle est affichée (seulement si position est défini à 'pointer')
	 */
	JSYG.Tooltip.prototype.onmove = false;
	/**
	 * Fonctions à ex�cuter quand l'infobulle dispara�t
	 */
	JSYG.Tooltip.prototype.onhide = false;
	/**
	 * Indique si l'infobulle est active ou non
	 */
	JSYG.Tooltip.prototype.enabled = false;
	/**
	 * Indique si l'infobulle est affich�e ou non
	 */
	JSYG.Tooltip.prototype.display = false;
	/**
	 * D�lai pour affichage de l'infobulle
	 */
	JSYG.Tooltip.prototype.delay = 200;
	/**
	 * Affiche l'infobulle et la positionne aux valeurs indiquées ou selon l'option "position" définie si appel sans argument.<br/>
	 */
	JSYG.Tooltip.prototype.show = function(_e) {
		
		if (this.display) return this;
		
		var that = this;
		
		var jCont = new JSYG(this.container)
		.appendTo(document.body)
		.animate('clear')
		.classAdd(this.className)
		.attrRemove('style')
		.css('display','none');
		
		this.update(_e);
				
		if (this.url && (this.refresh || !this._contentLoaded)) {
			
			jCont.show(this.effect);
					
			this._ajax = new JSYG.Ajax({
				
				url:this.url,
				
				onsuccess:function() {
					
					that._contentLoaded = true;
					
					that.content = this.responseText;
					
					that.update();
					
					that.trigger("show");
					
					if (that.refresh) that.content = null;
				}
			});
			
			this._ajax.send();
		}
		else jCont.show(this.effect,function() { that.trigger('show'); });
		
		this.display = true;
				
		return this;
	};
	/**
	 * Met à jour l'infobulle par rapport aux options définies (permet de changer le contenu sans d�sactiver et r�activer l'infobulle)
	 * @param {Object} opt : objet définissant les options
	 * @returns {JSYG.Tooltip}
	 */
	JSYG.Tooltip.prototype.update = function(_e) {
		
		var content = this.content,
			jCont = new JSYG(this.container).empty();
			
		if (!content) {
			if (this.url && this.loadingIcon) content = new JSYG('<img>').href(this.loadingIcon);
			else return this;
		}
		
		if (typeof content == 'number') content = content.toString();
		
		if (typeof content == 'string') jCont.html(content);
		else jCont.append(content);
		
		if (this.maxWidth) jCont.css('maxWidth',this.maxWidth+'px');
		
		this._setPosition(_e);
						
		return this;
	};

	JSYG.Tooltip.prototype._setPosition = function(e) {
				
		var jCont = new JSYG(this.container);
		
		if (jCont.parent().length == 0) return;
		
		var left,top,tab,
			dim = jCont.getDim(),
			dimNode = new JSYG(this.node).getDim('screen');

		switch (this.position) {
			
			case 'pointer' :
				
				if (!e) return;
				
				left = e.clientX+this.shiftX;
				top = e.clientY+this.shiftY;
				
				var dimWin = new JSYG(window).getDim();
				
				if ((left+dim.width) >  dimWin.width) left = Math.max(0, left - dim.width - 2 * this.shiftX);
				if ((top+dim.height) >  dimWin.height) top = Math.max(0, top - dim.height - 2 * this.shiftY);
				
				break;
				
			case 'above' :
				
				left = dimNode.x + (dimNode.width-dim.width) / 2;
				top = dimNode.y + -dim.height;
				break;
				
			case 'below' :
				
				left = dimNode.x + (dimNode.width-dim.width) / 2;
				top = dimNode.y + dimNode.height;
				break;
				
			case 'left' :
				
				left = dimNode.x - dim.width;
				top = dimNode.y + (dimNode.height-dim.height) / 2;
				break;
				
			case 'right' :
				
				left = dimNode.x + dimNode.width;
				top = dimNode.y + (dimNode.height-dim.height) / 2;
				break;
			
			default : 
				
				if (typeof this.position != 'string') throw new Error(this.position+" : position incorrecte");
			
				tab = this.position.trim().split(/\s+|,/);
				
				if (tab.length != 2) throw new Error(this.position+" : position incorrecte");
				
				left = dimNode.x + Number(tab[0]);
				top = dimNode.y + Number(tab[1]);
				break;
		}
		
		jCont.setDim({x:left,y:top});
					
		return this;
	};
	/**
	 * Fermeture de l'infobulle
	 * @returns {JSYG.Tooltip}
	 */
	JSYG.Tooltip.prototype.hide = function() {
		
		if (!this.display) return this;
	
		var that = this,
			jCont = new JSYG(this.container);
		
		if (jCont.parent().length == 0) return;
		
		jCont.animate('clear');
		
		this._ajax && this._ajax.abort();
		
		var callback = function() {
			jCont.attrRemove('style').remove();
			that.trigger('hide',that.node);
		};
		
		jCont.hide(this.effect,callback);
		
		this.display = false;
	
		return this;
	};
	
	/**
	 * Activation de l'infobulle
	 * @param {Object} [opt] : optionnel, objet définissant les options (appel implicite de la méthode set)
	 * @returns {JSYG.Tooltip}
	 */
	JSYG.Tooltip.prototype.enable = function(opt) {
	
		this.disable();
		
		if (opt) {
			if (typeof opt === 'string') opt = {content:opt};
			this.set(opt);
		}
	
		var jNode = new JSYG(this.node),
			alt = jNode.attr('alt'),
			title = jNode.attr('title'),
			that = this,
			timeout,
						
			fcts = {
				mouseover : function(e) {
					timeout = window.setTimeout(function() { that.show(e); } , that.delay);
				},
				mouseout : function(e) {
					/*var target = new JSYG(e.relatedTarget); 
					if (target.node == that.container || target.isChildOf(that.container)) return;*/
					window.clearTimeout(timeout);
					that.hide();
				}
			};
		
		if (this.position == 'pointer') {
			
			fcts.mousemove = function(e) {
				this._setPosition(e);
				this.trigger('move',this.node);
			}.bind(this);
		}
	
		jNode.on(fcts);
		
		jNode.attr({'alt':'','title':''});
		
		if (!this.content && !this.url) this.content = title;
		
		this.disable = function() {
			this.hide();
			this.container = null;
			jNode.off(fcts);
			jNode.attr({'alt':alt,'title':title});
			this.enabled = false;
			return this;
		};
		
		this.enabled = true;
		
		return this;
	};
	
	/**
	 * D�sactivation de l'infobulle
	 * @returns {JSYG.Tooltip}
	 */
	JSYG.Tooltip.prototype.disable = function() { return this; };
	
	var plugin = JSYG.bindPlugin(JSYG.Tooltip);

	/**
	 * <strong>nécessite le module Tooltip</strong><br/><br/>
	 * création d'une infobulle qui s'affiche au survol de la souris. Le contenu peut être chargé en ajax.<br/><br/>
	 * @returns {JSYG}
	 * @see JSYG.Tooltip pour une utilisation détaillée
	 * @example <pre>new JSYG('#maDiv').tooltip({content:'hello world !')});
	 * 
	 *  //utilisation avanc�e
	 *  new JSYG('#maDiv2').tooltip({
	 *  	content : new JSYG('spanDejaCree'),
	 *  	position : 'above',
	 *  	delay : 300,
	 *  	onhide : function() { console.log("bye"); }
	 *  });
	 *  
	 *  //ajax
	 *  new JSYG('#maDiv3').tooltip({
	 *  	url : 'monScript.php',
	 *  	refresh : true //recharge à chaque fois
	 *  });
	 */
	JSYG.prototype.tooltip = function() { return plugin.apply(this,arguments); };
	
}());