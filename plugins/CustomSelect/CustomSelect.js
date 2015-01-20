JSYG.require('Animation','CustomSelect.css');

(function(){

	"use strict";
	
	/**
	 * Select customis�. Il permet notamment d'ajouter une image � chaque option.
	 * @param arg arguments JSYG faisant référence � un champ select
	 * @param opt optionnel, objet définissant les options. Si défini, active le module implicitement.
	 * @returns {JSYG.CustomSelect}
	 */
	JSYG.CustomSelect = function(arg,opt) {
		/**
		 * élément DIV conteneur
		 */
		this.container = document.createElement('div');
		/**
		 * bouton rempla�ant le select (élément a)
		 */
		this.button = document.createElement('a');
		
		if (arg) this.setNode(arg);
		if (opt) this.enable(opt);
	};
	
	JSYG.CustomSelect.prototype = new JSYG.StdConstruct();
	
	/**
	 * Classe du conteneur
	 */
	JSYG.CustomSelect.prototype.classMenu = 'cSelect_menu';
	/**
	 * Classe appliqu�e au bouton
	 */
	JSYG.CustomSelect.prototype.classButton = 'cSelect_button';
	/**
	 * Classe appliqu�e � l'élément s�lectionn�
	 */
	JSYG.CustomSelect.prototype.classSelected = 'selected';
	/**
	 * Classe appliqu�e aux éléments inactifs
	 */
	JSYG.CustomSelect.prototype.classDisabled = 'disabled';
	/**
	 * Titre
	 */
	JSYG.CustomSelect.prototype.title = null;
	/**
	 * Affiche ou non le texte des options
	 */
	JSYG.CustomSelect.prototype.displayText = true;
	/**
	 * Affiche ou non le texte de l'option s�lectionn�e
	 */
	JSYG.CustomSelect.prototype.displayTextSelected = true;
	/**
	 * Position du conteneur par rapport au bouton ('shifted','center','relative')
	 */
	JSYG.CustomSelect.prototype.position = 'shifted';
	/**
	 * Fonctions � ex�cuter � l'affichage du conteneur
	 */
	JSYG.CustomSelect.prototype.onshow = null;
	/**
	 * Fonctions � ex�cuter quand on change la valeur
	 * Le premier argument est l'élément DOM &lt;option&gt; correspondant � la valeur s�lectionn�e
	 */
	JSYG.CustomSelect.prototype.onchange = null;
	/**
	 * Fonctions � ex�cuter avant de valider la valeur.
	 * Le premier argument est l'élément DOM &lt;option&gt; correspondant � la valeur s�lectionn�e
	 */
	JSYG.CustomSelect.prototype.onbeforechange = null;	
	/**
	 * Fonctions � ex�cuter quand on masque le conteneur
	 */
	JSYG.CustomSelect.prototype.onhide = null;
	/**
	 * Effet d'affichage ('slide','fade','none')
	 */
	JSYG.CustomSelect.prototype.effect = 'none';
	/**
	 * Indique si le customSelect est actif ou non
	 */
	JSYG.CustomSelect.prototype.enabled = false;
	
	function createThumb(src,label) {
		
		if (src.indexOf('#') == 0) return new JSYG(src).attr('title',label).createThumb();
		else return new JSYG('<img>').attr({
			src : src,
			alt : label,
			title : label
		});
	}
		
	JSYG.CustomSelect.prototype._createMenu = function() {
		
		var jCont = new JSYG(this.container).classAdd(this.classMenu);
		
		if (this.title) new JSYG('<h3>').text(this.title).appendTo(jCont);
		
		var choice = new JSYG('<div>').appendTo(jCont),
			classDisabled = this.classDisabled,
			that = this;
		
		JSYG.makeArray(this.node.options).forEach(function(option,i) {
			
			option = new JSYG(option);
			
			var a = new JSYG('<a>').href('#').preventDefault('click').appendTo(choice),
				src = option.dataAttr('src') || option.attr('src'),//pour compatibilit� avec ancien customselect
				label = option.text() || option.attr('value');
			
			if (src) createThumb(src,label).appendTo(a);
			
			if ((that.displayText || !src) && option.text()) new JSYG('<span>').text(option.text()).appendTo(a);
			else a.attr('title',label);
			
			if (option.attr('disabled')) {
				a.classAdd(classDisabled).preventDefault('mousedown');
			}
			else {
				
				a.on('mousedown',function(e) {
					e.preventDefault();
					that.val(i).hide();
				});
			}
		});
		
		return this;
	};
	
	/**
	 * Fixe ou récupère la valeur du select
	 * @param i optionel, si défini, fixe la valeur du select (indice ou valeur)
	 * @param preventEvent, si true ne d�clenche pas l'�v�nement onchange
	 * @returns {JSYG.CustomSelect,String}
	 */
	JSYG.CustomSelect.prototype.val = function(i,preventEvent,_from) {
				
		if (i == null) return new JSYG(this.node).val();
		
		if (this.trigger('beforechange') === false) return this;
				
		if (_from != 'input') new JSYG(this.node).val(i,preventEvent);
		
		var jBut = new JSYG(this.button),
			option = new JSYG( this.node.options[this.node.selectedIndex] ),
			src = option.dataAttr('src') || option.attr('src'),//pour compatibilit� avec ancien customSelect
			label = option.text() || option.attr('value'),
			txt;
		
		jBut.find('img,svg').remove();
			
		if (src) createThumb(src,label).prependTo(this.button);
					
		txt = (this.displayText && this.displayTextSelected || !src) && option.text() ? option.text() : "";
		
		jBut.find('span').text(txt);
		
		if (!preventEvent) this.trigger('change');
		
		return this;
	};
	/**
	 * Indique si le conteneur est affich� ou non
	 */
	JSYG.CustomSelect.prototype.display = false;
	
	/**
	 * Affiche le conteneur
	 * @param callback optionnel, function � ex�cuter une fois le conteneur affich� (équivalent � "onshow")
	 * @return {JSYG.CustomSelect}
	 */
	JSYG.CustomSelect.prototype.show = function(callback) {

		if (this.display) return this;
		
		var jBut = new JSYG(this.button),
			jParent = jBut.offsetParent(),
			jCont = new JSYG(this.container)
				.animate('clear')
				.attrRemove('style')
				.css({
					'position':'absolute',
					'display':'none'
				})
				.appendTo(jParent),
			dimBut = jBut.getDim(),
			dimCont = jCont.getDim(),
			dimParent = jParent.getDim('screen'),
			dimWin = new JSYG(window).getDim(),
			that = this,
			selected,dimSelected,
			x,y;
		
		jCont.css('position','absolute');
		jCont.setDim({x:dimBut.x,y:dimBut.y});
		
		jCont.find('a').classRemove(this.classSelected);
		
		selected = jCont.find('a')[this.node.selectedIndex] || null;
		
		if (selected) {
			selected = new JSYG(selected).classAdd(this.classSelected);
			dimSelected = selected.getDim();
		}
		
		switch (this.position) {
			
			case 'center' :
				
				x = dimBut.x + (dimBut.width - dimCont.width)/2;
				y = dimBut.y + dimBut.height;
				break;
								
			case 'relative' :
				x = dimBut.x - dimSelected.x - dimSelected.width / 2;
				y = dimBut.y - dimSelected.y - dimSelected.height / 2;
				break;
				
			case 'shifted' : default :
				
				x = dimBut.x;
				y = dimBut.y + dimBut.height;
				break;
		}
		
		if (x + dimCont.width + dimParent.x > dimWin.width) x = dimWin.width - dimCont.width - dimParent.x;
		if (y + dimCont.height + dimParent.y > dimWin.height) y = dimWin.height - dimCont.height - dimParent.y;
				
		if (x + dimParent.x < 0) x = -dimParent.x;
		if (y + dimParent.y < 0) y = -dimParent.y;
		
	
		// Placement
		jCont.setDim({x:x,y:y});
		
		jCont.show(this.effect,function() {
			that.trigger('show');
			callback && callback.call(that.node);
		});
		
		this.display = true;
		
		return this;
	};
	
	/**
	 * Masque le conteneur
	 * @param callback optionnel, fonction � ex�cuter une fois le conteneur masqu� (équivalent � onhide) 
	 * @returns {JSYG.CustomSelect}
	 */
	JSYG.CustomSelect.prototype.hide = function(callback) {
		
		if (!this.display) return this;
		
		var that = this;
		
		function fct() {
			new JSYG(that.container).remove();
			that.trigger('hide');
			callback && callback.call(that.node);
		};
		
		new JSYG(this.container).animate('clear').hide(this.effect,fct);
				
		this.display = false;
		
		return this;
	};
	
	/**
	 * Active le customSelect
	 * @param opt optionnel, objet définissant les options
	 * @returns {JSYG.CustomSelect}
	 */
	JSYG.CustomSelect.prototype.enable = function enable(opt) {
		
		this.disable();
		
		if (opt) this.set(opt);
		
		var jNode = new JSYG(this.node),
			jBut = new JSYG(this.button),
			that = this,
			display = jNode.css('dislay'),
			fcts = {  //focus ne fonctionne pas avec Chrome
				"focus mousedown" : function() { that.show(); },
				"blur" : function(e) { that.hide(); }
			};
		
		function change() { that.val(this.selectedIndex,false,"input"); }
		
		function hide(e) {
			
			if (!that.display) return;
			
			var target = new JSYG(e.target);
			
			if (target.node!=that.button && !target.isChildOf(that.button)
				&& target.node!=that.container && !target.isChildOf(that.container)) that.hide();
		}
		
		jBut.href('#')
		.classAdd(this.classButton)
		.preventDefault('click')
		.insertBefore(this.node);
		
		new JSYG(document).on("click",hide);
		new JSYG(window).on('blur',hide);
		
		//if (this.displayText)
			jBut.append('<span>');
				
		this.val( this.val() );
		
		jNode.css('display','none');
				
		this._createMenu();
		
		jNode.on('change',change);
		
		jBut.on(fcts);
		
		this.disable = function disable() {
			
			jNode.off('change',change);
			
			jBut.off(fcts).remove();
			
			jNode.css('display',display);
			
			new JSYG(document).off("click",hide);
			new JSYG(window).off('blur',hide);
			
			this.enable = false;
			
			return this;
		};
		
		this.enable = true;
		
		return this;		
	};
	
	/**
	 * D�sactive le customSelect
	 * @returns {JSYG.CustomSelect}
	 */
	JSYG.CustomSelect.prototype.disable = function disable() { return this; };
	
	var plugin = JSYG.bindPlugin(JSYG.CustomSelect);
	
	/**
	 * <strong>nécessite le module CustomSelect</strong><br/><br/>
	 * Element select am�lior�. On peut ajouter aux balises options l'attribut "data-src" pour définir l'url d'une image.
	 * @returns {JSYG}
	 * @see JSYG.CustomSelect pour une utilisation d�taill�e
	 * @example <pre>new JSYG('#monSelect").customSelect();
	 * 
	 * //Utilisation avanc�e :
	 * new JSYG('#monSelect").customSelect({
	 * 	title:'Votre choix',
	 * 	effect:'slide',
	 * 	onbeforechange:function(option) {
	 * 		if (option.value == 'toto') {
	 * 			console.log('toto');
	 * 			return false; //annule le choix
	 * 		} 
	 * 	},
	 * 	onchange:function() { alert('chang�'); }
	 * });
	 */
	JSYG.prototype.customSelect = function() { return plugin.apply(this,arguments); };

})();