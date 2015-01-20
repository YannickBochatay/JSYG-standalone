JSYG.require('Menu',function() {
	
	"use strict";
	
	JSYG.DropDownMenu = function(arg,opt) {
		
		if (arg) this.setNode(arg);
		
		JSYG.Menu.call(this);
		
		if (opt) this.enable(opt);
	};
	
	JSYG.DropDownMenu.prototype = new JSYG.Menu();
	
	JSYG.DropDownMenu.prototype.node = null;
	
	JSYG.DropDownMenu.prototype.enabled = false;
	
	JSYG.DropDownMenu.prototype.show = function() {
		
		var jCont = new JSYG(this.container); 
		jCont.css('visibility','hidden');
		
		JSYG.Menu.prototype.show.call(this);
		
		var dim = new JSYG(this.node).getDim();
		
		jCont.setDim({ x:dim.x, y:dim.y+dim.height }).css('visibility','visible');
	};
	
	JSYG.DropDownMenu.prototype.enable = function(opt) {
	
		this.disable();
		
		if (opt) this.set(opt);
	
		var jNode = new JSYG(this.node);
		
		var backup = {
			title : this.node.title,
			alt : this.node.alt
		};
		
		var that = this;
		
		this.parent = jNode.offsetParent();
				
		var fct = function(e) {
			e.stopPropagation();
			that.toggle();
		};
		
		jNode.on('mousedown',fct);
				
		var hide = function() { that.hide(); };
		
		new JSYG(document).on('mousedown',hide);
		new JSYG(window).on('blur',hide);
		
		this.disable = function() {
			
			this.hide();
			this._clear();
			
			jNode.off('mousedown',fct);
			
			new JSYG(document).off('mousedown',hide);
			new JSYG(window).off('blur',hide);
			
			jNode.attr(backup);
			
			this.enabled = false;
			
			return this;
		};
		
		this.create();
		
		this.enabled = true;
		
		return this;
	};
	
	JSYG.DropDownMenu.prototype.disable = function() {
		
		this.hide();
		this._clear();
		
		return this;
	};
	
});