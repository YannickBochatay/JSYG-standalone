JSYG.require('Menu.css','KeyShortCut','Droppable');

(function() {
	
	"use strict";
	
	var pathImages = JSYG.require.baseURL+'/Menu/img/';
	
	/**
	 * <strong>nécessite le module Menu</strong><br/><br/>
	 * Constructeur d'éléments de menu
	 * @param arg optionnel, argument JSYG pointant vers l'élément DOM. Si non défini il sera cr�� (balise "a").
	 * @param opt optionnel, objet définissant les options
	 * @returns {JSYG.MenuItem}
	 * @see {JSYG.Menu}
	 */
	JSYG.MenuItem = function(arg,opt) {
				
		if (JSYG.isPlainObject(arg)) { opt = arg; arg = null; }
		
		if (!arg) arg = '<a>';
				
		this.container = new JSYG(arg).node;
		
		if (opt) this.set(opt);
	};
	
	JSYG.MenuItem.prototype = {
			
		constructor : JSYG.MenuItem, 
		
		set : function(opt) {
				
			var cible = this,
				submenu, n;
			
			if (!JSYG.isPlainObject(opt)) return cible;

			for (n in opt) {
							
				if (n in cible) {
					
					if (n == 'submenu' && Array.isArray(opt.submenu)) {
						
						submenu = new JSYG.Menu();
						opt.submenu.forEach(function(item) { submenu.addItem(item); });
						this.submenu = submenu;
					}
					else cible[n] = opt[n];
				}
			}
			
			return cible;
		},
		/**
		 * url de l'icone
		 */
		icon:null,
		/**
		 * texte � afficher
		 */
		text:null,
		/**
		 * Identifiant de l'item, qui permettra de retrouver l'objet � partir de la méthode getItem de JSYG.Menu
		 */
		name : null,
		/**
		 * pour d�sactiver l'élément 
		 */
		disabled:false,
		/**
		 * Fonction � ex�cuter lors du clic, ou "submenu" pour afficher ou sous-menu
		 */
		action:null,
		/**
		 * Objet sous-menu dans le cas où l'item permet juste l'affichage d'un sous-menu
		 */
		submenu:null,
		/**
		 * Maintient ou non l'affichage du menu � l'ex�cution de l'action
		 */
		keepMenu:false,
		
		droppable:false,
		
		checkbox : false,
		checked : false,
		
		shortCut : null,
		
		globalShortCut : null,

		/**
		 * Ajout de l'élément � un menu contextuel (instance de JSYG.Menu)
		 * @param contextmenu instance de JSYG.Menu ou ContextItem (pour un sous-menu)
		 * @param ind optionnel, indice de l'élément dans le menu
		 * @returns {JSYG.MenuItem}
		 */
		addTo : function(menu,ind) {
		
			if (menu instanceof JSYG.MenuItem) {
				
				if (menu.submenu == null) menu.submenu = new JSYG.Menu();
				menu = menu.submenu;
			}
			
			menu.addItem(this,ind);
			
			return this;
		}
	};
	
	/**
	 * <strong>nécessite le module Menu</strong><br/><br/>
	 * Constructeur de menus
	 * @param {Object} opt optionnel, objet définissant les options. Si défini, le menu est activ� implicitement.
	 * @returns {JSYG.Menu}
	 */
	JSYG.Menu = function(opt) {
		/**
		 * Tableau d'objets JSYG.MenuItem définissant la liste des éléments du menu
		 */
		this.list = [];
		
		/**
		 * Liste des s�parateurs d'éléments
		 */
		this.dividers = [];
		/**
		 * Conteneur du menu contextuel
		 */
		this.container = document.createElement('ul');
		
		this.keyboardCtrls = new KeyboardCtrls(this);
		
		if (opt) this.set(opt); 
	};
	
	JSYG.Menu.prototype = new JSYG.StdConstruct();
				
	JSYG.Menu.prototype.constructor = JSYG.Menu;
		
	JSYG.Menu.prototype.set = function(opt,_cible) {
			
		var cible = _cible || this,
			that = this;
				
		if (Array.isArray(opt)) {
			this.clear();
			opt.forEach(function(item) { that.addItem(item); });
			return cible;
		}
		
		if (!JSYG.isPlainObject(opt)) return cible;
								
		for (var n in opt) {
						
			if (n in cible) {
				if ((JSYG.isPlainObject(opt[n])) && cible[n] || n == 'list' && Array.isArray(opt[n])) this.set(opt[n],cible[n]);
				else cible[n] = opt[n];
			}
		}
		
		return cible;
	};
	/**
	 * Classe appliquée au conteneur
	 */
	JSYG.Menu.prototype.className = 'Menu';
	/**
	 * Classe � appliquer aux éléments du menu d�sactiv�s
	 */
	JSYG.Menu.prototype.classDisabled = "disabled";
	/**
	 * Classe � appliquer aux sous-menus
	 */
	JSYG.Menu.prototype.classSubmenu = "submenu";
	/**
	 * Classe � appliquer aux span pr�cisant le raccourci global
	 */
	JSYG.Menu.prototype.classGlobalShortCut = "globalShortcut";
	/**
	 * Classe � appliquer aux span pr�cisant le raccourci
	 */
	JSYG.Menu.prototype.classShortCut = "shortCut";
	/**
	 * Classe � appliquer aux éléments affichant un sous-menu
	 */
	JSYG.Menu.prototype.classDivider = "divider";
	
	JSYG.Menu.prototype._currentItem = -1;
	JSYG.Menu.prototype._timeout = null;
	
	JSYG.Menu.prototype.parent = 'body';
	
	
	JSYG.Menu.prototype.submenuDelay = 500;
	
	JSYG.Menu.prototype.title = null;
	
	JSYG.Menu.prototype.name = null;
	
	JSYG.Menu.prototype.toolbar = null;
	/**
	 * Ev�nement sur lequel on affiche le menu
	 */
	JSYG.Menu.prototype.event = 'mousedown';

	/**
	 * Indique si le menu est affich� ou non
	 */
	JSYG.Menu.prototype.display = false;
	/**
	 * Fonctions � ex�cuter � l'affichage du menu
	 */
	JSYG.Menu.prototype.onshow = null;
	/**
	 * Fonctions � ex�cuter quand on masque le menu
	 */
	JSYG.Menu.prototype.onhide = null;
	/**
	 * Fonctions � ex�cuter � chaque fois que l'action d'un élément du menu est d�clench�e.
	 */
	JSYG.Menu.prototype.onaction = null;
	/**
	 * Indique si le menu est actif ou non
	 */	
	JSYG.Menu.prototype.enabled = false;
	
	JSYG.Menu.prototype._createShortCut = function(item) {
		
		var that = this,
			str = item.globalShortCut.toLowerCase(),
			specialKeys,
			key;
		
		if (str == "+") {
			specialKeys = null;
			key = "+";
		}
		else {
			
			if (str.indexOf('++')!=-1) { str = str.replace(/\+\+/,'+plus'); }
			
			specialKeys = str.split(/\+/),
			key = specialKeys.splice(-1,1)[0];
			
			if (key == "plus") key = "+";
		}
				
		return new JSYG.KeyShortCut({
			specialKeys : specialKeys,
			key : key,
			action : function(e) {
				that.triggerItem(item,e);
				if (!item.keepMenu) that.hide();
			}
		});
	};
	/**
	 * Ajout d'un élément au menu
	 * @param item instance de JSYG.MenuItem ou plainObject avec les options nécessaires
	 * @param ind optionnel, indice de l'élément dans la liste
	 * @returns {JSYG.Menu}
	 */
	JSYG.Menu.prototype.addItem = function(item,ind) {
		
		if (ind == null) ind = this.list.length;
		
		if (JSYG.isPlainObject(item)) item = new JSYG.MenuItem(item);		

		if (item instanceof JSYG.MenuItem) {
				
			if (this.list.indexOf(item) === -1) {
								
				this.list.splice(ind,0,item);
								
				if (item.globalShortCut && !item._globalShortCut) item._globalShortCut = this._createShortCut(item);
			}
			else throw new Error("L'item existe d�j�");
		}
		else throw new Error(item + " n'est pas une instance de JSYG.MenuItem");
				
		return this;
	};
	
	JSYG.Menu.prototype.addDivider = function(ind) {
	
		if (ind == null) ind = this.list.length;
		if (this.dividers.indexOf(ind) === -1) this.dividers.push(ind);
		return this;
	};
	
	/**
	 * Suppression d'un élément du menu
	 * @param {Number,String,Object} item élément ou indice ou nom ou texte de l'élément � supprimer
	 * @returns {JSYG.Menu}
	 */
	JSYG.Menu.prototype.removeItem = function(item) {
		
		item = this.getItem(item);
		
		if (!item) throw new Error(item+' : indice ou element incorrect');
		
		var i = this.list.indexOf(item);
		
		if (item._globalShortCut) item._globalShortCut.disable();
		this.list.splice(i,1);
					
		return this;
	};
	/**
	 * R�cup�ration d'un élément du menu
	 * @param {Number,String,Object} item élément ou indice ou nom ou texte de l'élément � supprimer
	 * @param {Boolean} recursive si true recherche dans les sous-menus
	 * @returns {JSYG.ContextItem}
	 */
	JSYG.Menu.prototype.getItem = function(item,recursive) {
				
		var menu,menuItem,i,N;
		
		if (recursive) {
			
			menuItem = this.getItem(item);
			
			if (!menuItem) {
			
				for (i=0,N=this.list.length;i<N;i++) {
					
					menu = this.list[i];
					
					if (menu.submenu) {
						menuItem = menu.submenu.getItem(item,true);
						break;
					}
				}
			}
			
			return menuItem;
		}
		
		if (item instanceof JSYG.MenuItem && this.list.indexOf(item) != -1) return item;
		else if (JSYG.isNumeric(item) && this.list[item]) return this.list[item];
		else if (item && typeof item == 'string') {
			
			i = this.list.length;
			
			while (i--) {
				if (this.list[i].name == item || this.list[i].name == null && this.list[i].text == item) return this.list[i];
			}
		}
		
		return null;
	};
	/**
	 * R�initialisation du menu
	 * @returns {JSYG.Menu}
	 */
	JSYG.Menu.prototype.clear = function() {
	
		this.hide();
		this._clear();
		while (this.list.length) this.removeItem(0);
		this.dividers.splice(0,this.dividers.length);
		return this;
	};
	
	JSYG.Menu.prototype.current = function() {
		return this.list[ this._currentItem ] || null;
	};
	
	JSYG.Menu.prototype.triggerItem = function(item,e) {
	
		item = this.getItem(item);
				
		if (typeof item.action != 'function') return this;
			
		if (item.keepMenu) e.stopPropagation();
		
		var val,node,menu,
			input = new JSYG(item.container).find('input');
		
		if (input) {
			val = !input.val();
			input.val(val);
		}
		
		node = this.node,
		menu = this;
		
		//on récupère l'élément
		while (!node && menu) {
			menu = menu.parentMenu;
			node = menu && menu.node;
		}
		
		item.action.call(node,e,val);
				
		//s'il s'agit d'un sous-menu, il faut propager l'�v�nement jusqu'au menu racine.
		menu = this;
		
		while (menu) { 
			menu.trigger('action',node,e,item);
			menu = menu.parentMenu;
		}
			
		if (!item.keepMenu) this.hideAll();
				
		return this;
	};
	
	JSYG.Menu.prototype.focusItem = function(item) {
	
		item = this.getItem(item);
		new JSYG(item.container).trigger('focus');
		this._currentItem = this.list.indexOf(item);
		return this;
	};
	
	JSYG.Menu.prototype.blur = function() {
	
		var current;
		if (current = this.current()) { new JSYG(current.container).trigger('blur'); }
		this._currentItem = -1;
		return this;
	};
	
	JSYG.Menu.prototype.hideSubmenus = function() {
		this.list.forEach(function(item){ item.submenu && item.submenu.hide(); });
		return this;
	};
	
	JSYG.Menu.prototype.showSubmenu = function(item,delay) {
		
		item = this.getItem(item);
			
		var jNode = new JSYG(item.container),
			parent = new JSYG(this.container).offsetParent();
				
		item.submenu.parent = parent;
		
		new JSYG(item.submenu).css('visibility','hidden');
		
		item.submenu.show(delay,function(ul) {	
			
			var sub = new JSYG(ul),
				dimLi = jNode.getDim(parent),
				dimWin = new JSYG(window).getDim(),
				dimSub = sub.getDim(),
				x = dimLi.x + dimLi.width,
				y = dimLi.y;
					
			if (x + dimSub.width > dimWin.width) x = dimLi.x - dimSub.width;
				
			if (y + dimSub.height > dimWin.height) y = dimLi.y + dimLi.height - dimSub.height;
			
			sub.setDim({x:x,y:y}).css('visibility','visible');
		});
					
		return this;
	};
		
		
	var keys =  ['enter','up-arrow','down-arrow','left-arrow','right-arrow','escape'];
		
	JSYG.Menu.prototype._keyboardAction = function(e) {
		
		var shortcuts = [],current,that = this;
		
		this.list.forEach(function(item) { if (item.shortCut) { shortcuts.push(item.shortCut.toLowerCase()); } });
		
		if (!this.display || (keys.indexOf(e.keyName) == -1 && shortcuts.indexOf(e.keyName) == -1) ) return;
		
		e.preventDefault();
		
		switch (e.keyName) {
			
			case 'enter' :
				if (current = this.current()) {
					if (current.submenu) { this.showSubmenu(current); current.submenu.focusItem(0);}
					else {
						this.triggerItem(current,e);
						if (current.keepMenu) { this.focusItem(current); }
					}
				}
				break;
				
			case 'up-arrow' :
				if (this._currentItem <= 0) { this._currentItem = this.list.length; }
				this.focusItem(--this._currentItem);
				break;
			
			case 'down-arrow' :
				if (this._currentItem >= this.list.length-1) { this._currentItem = -1; }
				this.focusItem(++this._currentItem);
				break;
				
			case 'left-arrow' :
				if (this.parentMenu) { this.hide(); }
				break;
			
			case 'right-arrow' :
				if (current = this.current()) {
					if (current.submenu) { this.showSubmenu(current); current.submenu.focusItem(0); }
				}
				break;
				
			case 'escape' :
				this.hide();
				break;
				
			default :
				this.list.forEach(function(item) {
					if (item.shortCut && item.shortCut.toLowerCase() == e.keyName) { that.triggerItem(item,e); return false; }
				});
				break;
		}
	};
	
	function KeyboardCtrls(menu) {
		
		this.menu = menu;
	}
	
	KeyboardCtrls.prototype = {
			
		enabled : false,
	
		enable : function() {
		
			this.disable();
			
			var keydown = this.menu._keyboardAction.bind(this.menu);
			
			new JSYG(document).on('keydown',keydown);
			
			this.disable = function() {
				new JSYG(document).off('keydown',keydown);
				this.enabled = false;
				return this;
			};
			
			this.enabled = true;
			
			return this;
		},
		
		disable : function() { return this; }
	};
	
	JSYG.Menu.prototype.createButton = function(item) {
		
		item = this.getItem(item);
		
		if (!item.icon) throw new Error("il faut définir une ic�ne pour l'élément");
		
		var text = item.text,
			img = new JSYG('<img>'),
			that = this;
			
		function onclick(e) {
				
			if (item.disabled) { return; }
			else if (typeof item.action == "function") { that.triggerItem(item,e); }
			else if (item.submenu) {
				
				var menu = item.submenu;
				
				if (menu.display) { menu.hide(); return; }
				
				var jCont = new JSYG(menu.container),
					oldParent = menu.parent,
					parent = img.offsetParent(),
					pos = parent.getCursorPos(e);
				
				menu.parent = parent; 
				menu.show();
				menu.parent = oldParent;
								
				jCont.setDim({x:pos.x,y:pos.y});
			}
			
		};
		
		if (item.globalShortCut) {
			text+=" ("+ JSYG.ucfirst(item.globalShortCut) +")";
		}
			
		img.href(item.icon).attr("title",text).on("click",onclick);
		
		return img.node;
	};
		
	JSYG.Menu.prototype.create = function() {
	
		var that = this;
		
		this._clear();
		
		var jCont = new JSYG(this.container)
		.classAdd(this.className)
		.preventDefault('contextmenu')
		.stopPropagation('mousedown')
		.on("mouseout",function(e) {
			if (new JSYG(e.target).isChildOf(this)) { return; }
			that.blur();
		});
				
		this.list.forEach(function(item,ind) {
		
			if (that.dividers.indexOf(ind) !== -1) {
				jCont.append(new JSYG('<li>').classAdd(that.classDivider));
			}
			
			var li = new JSYG('<li>').appendTo(jCont),
				jA = new JSYG(item.container).appendTo(li),
				input;
			
			jA.href('#').preventDefault('click');
			
			if (item.icon) jA.css('background-image','url('+item.icon+')');
			
			if (item.text) {
				
				if (item.shortCut && (typeof item.action === 'function')) {
										
					var html = item.text
						.replace(/\s/g,'&nbsp;')
						.replace( new RegExp(item.shortCut,'i') , function(sub) { return '<span>'+sub+'</span>'; } );
					
					jA.html(html);
					jA.find('span').classAdd(that.classShortCut);
				}
				else { jA.text(item.text); }
			}
			
			if (item.checkbox) {
				
				input = new JSYG('<input>')
				.attr({type:"checkbox",name:'test'})
				.prependTo(jA);
				
				if (item.checked) input.attr("checked","checked");
			}
			
			if (item.globalShortCut && (typeof item.action === 'function')) {
				
				var shortCutText = JSYG.ucfirst(item.globalShortCut);
				
				new JSYG('<span>')
				.classAdd(that.classGlobalShortCut)
				.text(shortCutText)
				.appendTo(jA);
			}
			
			
			if (item.disabled) {
				
				jA.classAdd(that.classDisabled);
				jA.on({
					'mouseover':function() { that.focusItem(item); that.hideSubmenus(); }
				});
				
				if (item.checkbox) input.attr("disable","disable"); 
			}
			else if (item.submenu) {
								
				item.submenu.parentMenu = that;
				
				new JSYG(item.submenu.container).classAdd(that.classSubmenu);
				
				new JSYG('<img>').href(pathImages+'submenu.png').appendTo(jA);
																
				jA.on({
					'mouseover':function(e) {
						if (that._currentItem == ind) return;
						that.focusItem(item);
						that.hideSubmenus();
						that.showSubmenu(item,that.submenuDelay);
					},
					'click' : function() { that.showSubmenu(item); }
				});
				
				item.submenu.create();
			}
			else if (typeof item.action === 'function') {
				
				if (item.checkbox) {
					
					input.on('mousedown',function(e) {
						e.preventDefault();
						that.triggerItem(item,e);
						if (!item.keepMenu) { that.hide(); }
					});
				}
				
				jA.on({
					'click':function(e) { that.triggerItem(item,e); if (!item.keepMenu) { that.hide(); } },
					'mouseover':function() {  that.focusItem(item); that.hideSubmenus(); }
				});
			}
			
			if (item.droppable) {
				
				new JSYG(item.container).droppable({
					list: that.toolbar,
					typeOver:'partial',
					className:'droppableMenuItem',
					ondragstart:function() { if (item.submenu) item.submenu.hide(); },
					onsuccess:function() {
						var img = new JSYG(that.createButton(item));
						img.css("display","none").appendTo(that.toolbar).show("fade");
					}
				});
			}
		});
				
		return this;
	};
	
	JSYG.Menu.prototype._clear = function() {
		
		var classDisabled = this.classDisabled;
		this.list.forEach(function(elmt) { new JSYG(elmt.container).classRemove(classDisabled).empty().remove(); });
		new JSYG(this.container).empty();
		this.keyboardCtrls.disable();
	};
			
	JSYG.Menu.prototype.show = function(delay,callback) {
		
		if (this.display) this.hide(true);
		
		var that = this;
		
		if (delay) {
			this._timeout = window.setTimeout( function() { that.show(null,callback); } , delay );
			return this;
		}
		
		this.hide();
				
		new JSYG(this.container)
		.appendTo(this.parent);
				
		this.parentMenu && this.parentMenu.keyboardCtrls.disable();
		
		this.keyboardCtrls.enable();
				
		this.display = true;
		
		callback && callback(this.container);
		
		this.trigger('show');
				
		return this;
	};
	
	JSYG.Menu.prototype.update = function() {
		
		this._clear();
		this.create();
				
		return this;
	};
	
	/**
	 * Masque le menu
	 * @param preventEvent en interne surtout, bool�en permettant de ne pas d�clencher l'�v�nement hide
	 * @returns {JSYG.Menu}
	 */
	JSYG.Menu.prototype.hide = function(preventEvent) {
	
		this.hideSubmenus();
		
		this._timeout && window.clearTimeout(this._timeout);
		this._timeout = null;
		
		this.keyboardCtrls.disable();
		
		new JSYG(this.container).remove();
		
		this.keyboardCtrls.disable();
		
		if (this.parentMenu) {
			var parent = this.parentMenu;
			var current = parent.current();
			current && parent.focusItem(current);
			parent.keyboardCtrls.enable();
		}
				
		this._currentItem = -1;
		
		this.display = false;
		
		if (!preventEvent) this.trigger('hide');
		
		return this;
	};
	
	JSYG.Menu.prototype.toggle = function() {
		var args = JSYG.makeArray(arguments);
		this.display && this.hide() || this.show.apply(this,args);
	};
	
	JSYG.Menu.prototype.hideAll = function() {
		
		var parent = this;
		var rootMenu = this;
		while (parent = parent.parentMenu) { rootMenu = parent; }
		rootMenu.hide();
	};

})();