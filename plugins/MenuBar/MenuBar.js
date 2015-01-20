JSYG.require('Menu','MenuBar.css',function() {
	
	"use strict";
	
	JSYG.MenuBar = function(arg,opt) {
		
		this.list = [];
		
		if (arg) this.setNode(arg);
		
		if (opt) this.enable(opt);
	};
	
	JSYG.MenuBar.prototype = new JSYG.StdConstruct();
	
	JSYG.MenuBar.prototype.className = "menuBar";
	
	JSYG.MenuBar.prototype.classDisabled = "disabled";
	
	JSYG.MenuBar.prototype.current = -1;
	
	JSYG.MenuBar.prototype.enabled = false;
	
	JSYG.MenuBar.prototype.addMenu = function(menu,ind) {
		
		if (ind == null) ind = this.list.length;

		if (menu instanceof JSYG.Menu) {
				
			if (this.list.indexOf(menu) === -1) {
				if (!menu.title) throw new Error("Il faut définir la propriété title du menu");
				this.list.splice(ind,0,menu);
			}
			else throw new Error("Le menu existe d�j�");
		}
		else throw new Error(menu + " n'est pas une instance de JSYG.Menu");
		
		return this;
	};
	
	JSYG.MenuBar.prototype.getMenu = function(menu) {
		
		if (menu instanceof JSYG.Menu && this.list.indexOf(menu) != -1) return menu;
		else if (JSYG.isNumeric(menu) && this.list[menu]) return this.list[menu];
		else if (menu && typeof menu == 'string') {
			var i = this.list.length;
			while (i--) {
				if (this.list[i].name == menu || this.list[i].title == menu) return this.list[i];
			}
		}
		
		return null;
	};
	
	JSYG.MenuBar.prototype.getItem = function(item,recursive) {
		
		var menuItem;
		
		for (var i=0,N=this.list.length;i<N;i++) {
			
			menuItem = this.list[i].getItem(item,recursive);
			if (menuItem) return menuItem;
		}
		
		return null;
	};
	
	JSYG.MenuBar.prototype.removeMenu = function(menu) {
		
		menu = this.getMenu(menu);
		
		if (!menu) throw new Error(menu+' : indice ou element incorrect');
		
		menu.hide();
		
		this.list.splice(i,1);
			
		return this;
	};
		
	
	JSYG.MenuBar.prototype.create = function() {
						
		var ul = new JSYG(this.node).clear().classAdd(this.className);
		
		var that = this;
		
		this.list.forEach(function(menu,i) {
				
			menu.create();
			
			menu.on('hide',function() { that.display = false; that.current = -1; });
			
			var li = new JSYG('<li>')		
			.text(menu.title);
			
			if (menu.disabled) li.classAdd(that.classDisabled);
			else {
				li.on({
					"mouseover" : function(e) {
						if (that.current!=-1) that.showMenu(menu);
					},
					"mousedown" : function(e) {
						if (that.current == i) that.hideMenus();
						else that.showMenu(menu);
					}
				});
			}
			
			li.appendTo(ul);
			
			menu.node = li.node; 
		});
		
		return this;
	};
	
	JSYG.MenuBar.prototype.clear = function() {
		
		this.hideMenus();
		while (this.list.length) { this.removeMenu(0); }
		return this;
	};
	
	JSYG.MenuBar.prototype.hideMenus = function() {
		
		this.list.forEach(function(menu) { menu.hide(); });
		
		this.display = false;
		this.current = -1;
		
		return this;
	};
	
	JSYG.MenuBar.prototype.showMenu = function(menu) {
		
		menu = this.getMenu(menu);
		
		if (!menu) return this;
		
		this.hideMenus();
		
		var jCont = new JSYG(menu.container);
		var jNode = new JSYG(menu.node);
		
		jCont.css('visibility','hidden');
		menu.parent = jNode.offsetParent();
				
		menu.show();
		
		var dim = jNode.getDim();
						
		jCont.setDim({ x:dim.x, y:dim.y+dim.height }).css('visibility','visible');
		
		this.current = this.list.indexOf(menu);
		
		return this;
	};
	
	JSYG.MenuBar.prototype.enable = function(opt) {
		
		this.disable();
		
		if (opt) { this.set(opt); }
		
		this.create();
		
		var jDoc = new JSYG(document),
			jWin = new JSYG(window),
			that = this,
			hide = function(e) {
				var test = true;
				that.list.forEach(function(menu) {
					if (menu.node == e.target) test = false;
				});
				test && that.hideMenus();
			};
		
		jDoc.on('mousedown',hide);
		jWin.on('blur',hide);
				
		this.disable = function() {
			
			jDoc.off('mousedown',hide);
			jWin.off('blur',hide);
			
			this.enabled = false;
			
			return this;
		};
		
		this.enabled = true;
		
		return this;
	};
	
	JSYG.MenuBar.prototype.disable = function() { return this; };
	
});