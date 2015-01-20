JSYG.require("WindowsLike","Popup.css", function() {

	"use strict";
	
	/**
	 * Affichage d'une popup
	 */
	function Popup() {
		/**
		 * élément div conteneur de la popup
		 */
		this.container = document.createElement('div');
		/**
		 * plugin windowsLike
		 */
		this.windowsLike = new JSYG.WindowsLike(this.container);
	};
			
	Popup.prototype.constructor = Popup;
	
	/**
	 * Boutons à ajouter (tableau d'objets avec les propriétés "label", "action" et optionnellement "className"
	 */
	Popup.prototype.buttons = null;
		
	Popup.prototype.set = function(opt) {
			
		if (typeof opt == 'string') opt = {content:opt};
					
		if (!JSYG.isPlainObject(opt)) return this;
								
		for (var n in opt) {
			if (n in this) this[n] = opt[n];
		}
		
		this.windowsLike.set(opt);
		
		return this;
	},
	/**
	 * id appliqu� au conteneur
	 */
	Popup.prototype.id = 'popupWindowsLike';
	
	/**
	 * indique si la popup est affich�e ou non
	 */
	Popup.prototype.display = false;
	/**
	 * Contenu de la popup
	 */
	Popup.prototype.content = null;
	/**
	 * Largeur de la popup
	 */
	Popup.prototype.width = null;
	/**
	 * Effet à l'affichae (fade,slide,none)
	 */
	Popup.prototype.effect = "fade";
	
	Popup.prototype.moveToCenter = function(callback) {
		
		this.windowsLike.moveToCenterX().moveToCenterY(callback);
	};
	
	function Button(opt) {
		/**
		 * Classe à appliquer au bouton
		 */
		this.className = "popupButton";
		/**
		 * Texte du bouton
		 */
		this.label = "No label";
		
		if (opt) this.set(opt);
	}
	
	Button.prototype.set = JSYG.StdConstruct.prototype.set ;
	
	/**
	 * Action a exécuter au clic 
	 */
	Button.prototype.action = function() { window.alert("No action"); };
	
	function createForm(buttons) {
		
		var form = new JSYG('<form>')
		.classAdd("popupButtons")
		.on("submit",function(e) {
			e.preventDefault();
			JSYG.popup.close();
		});
		
		buttons.forEach(function(button) {
			
			button = new Button(button);
			
			new JSYG('<button>')
			.text(button.label)
			.classAdd(button.className)
			.appendTo(form)
			.on("click",function(e) {
				e.preventDefault();
				button.action();
				form.trigger("submit");
			});
		});
		
		return form;
	}
	/**
	 * Affiche la popup
	 * @param options cha�ne html du contenu à afficher ou objet avec les propriétés possibles suivantes :
	 * <ul>
	 * <li>content : argument JSYG, contenu à afficher</li>
	 * <li>width : largeur de la popup</li>
	 * <li>effect : effet d'affichage (none,fade,slide)</li>
	 * <li>callback : function à ex�cuter une fois le contenu affich�</li>
	 * <li>toutes les options de JSYG.WindowsLike ("title","icon","closable",etc)</li>
	 * </ul>
	 * @returns {Popup}
	 * @see JSYG.WindowsLike
	 */
	Popup.prototype.open = function (opt) {
				
		var jDiv,form,that=this;
				
		this.windowsLike.reset().set({
			centerX : true,	centerY : true,
			popup : true, delayEffect : false,
			closable : true
		});
			
		if (opt) this.set(opt);
		
		this.windowsLike.on("close",function() {
			that.display = false;
			that.windowsLike.disable();
			new JSYG(this).empty().remove();
		});
		
		jDiv = new JSYG(this.container)
			.empty().id(this.id)
			.css({'visibility':'hidden','width':'auto','display':'block'})
			.appendTo(document.body);
		
		if (this.width!=null) jDiv.setDim('width',this.width);
		
		try {
			
			if (typeof this.content == 'string') {
				 if (this.content.indexOf("<") != -1) jDiv.html(this.content);
				 else jDiv.text(this.content);
			}
			else jDiv.append(this.content);
		}
		catch(e) { jDiv.text(this.content); }
		
		if (this.buttons && this.buttons.length) {
			form = createForm(this.buttons);
			jDiv.append(form);
		}	
		
		this.windowsLike.enable();
						
		jDiv.css({'visibility':'visible',display:'none'});
		
		this.display = true;
		
		return new JSYG.Promise(function(resolve,reject){
			jDiv.show(that.effect,resolve);
		});
	};
	/**
	 * Retrait de la popup
	 * @returns {Popup}
	 */
	Popup.prototype.close = function() {
		
		return this.windowsLike.close();
	};
	
	/**
	 * <strong>nécessite le module Popup</strong>
	 * Affichage d'une popup sur la page.
	 * @example <pre>JSYG.popup.show('#monContenu');
	 * 
	 * //Utilisation avanc�e
	 * JSYG.popup.show({
	 * 	content:'#monContenu',
	 * 	title:'Ma Popup',
	 * 	icon:'/icones/pencil.png',
	 * 	callback:function() { console.log("Ma popup est affich�e"); }
	 * })
	 */
	JSYG.popup = new Popup();
	
	JSYG.popup.close = JSYG.popup.close.bind(JSYG.popup);
	JSYG.popup.open = JSYG.popup.open.bind(JSYG.popup);
	
		
	JSYG.alert = function(message) {
				
		message = JSYG.makeArray(arguments).join('<br/>');
		
		return new JSYG.Promise(function(resolve) {
			
			JSYG.popup.open({
				content:message,
				closable:false,
				buttons:[{
					label:"OK",
					action: function() { JSYG.popup.close(); }
				}],
				onclose:resolve
			});
		});
	};
	
	JSYG.confirm = function(message) {
		
		return new JSYG.Promise(function(resolve,reject) {
			
			JSYG.popup.open({
				content:message,
				closable:false,
				buttons:[{
					label:"Oui",
					action: function() { JSYG.popup.close().then(resolve); }
				},{
					label:"Non",
					action: function() { JSYG.popup.close().then(reject); }
				}]
			});
		});
	};

});