JSYG.require('Menu',function() {
	
	"use strict";
	
	JSYG.ContextMenu = function(arg,opt) {
		
		if (arg) this.setNode(arg);
		
		JSYG.Menu.call(this);
		
		if (opt) this.enable(opt);
	};
	
	JSYG.ContextMenu.prototype = new JSYG.Menu();
	
	JSYG.ContextMenu.prototype.node = null;
	/**
	 * Fonctions à exécuter avant l'affichage du menu (renvoyer false pour l'empêcher)
	 */
	JSYG.ContextMenu.prototype.onbeforeshow = null;
		
	JSYG.ContextMenu.prototype.enabled = false;
	
	JSYG.ContextMenu.prototype.show = function(x,y) {
		
		JSYG.ContextMenu.list.forEach(function(menu){ menu.hide(); });
		
		var jCont = new JSYG(this.container);
		jCont.css('visibility','hidden');
		
		JSYG.Menu.prototype.show.call(this);
		
		var dimCont = jCont.getDim(),
			dimWin = new JSYG(window).getDim();
		
		if (x - dimWin.x + dimCont.width > dimWin.width) {
			x-= dimCont.width;
			if (x < dimWin.x) x = dimWin.x + dimWin.width - dimCont.width;
		}
		
		if (y - dimWin.y + dimCont.height > dimWin.height) {
			y-= dimCont.height;
			if (y < dimWin.y) { y = dimWin.y + dimWin.height - dimCont.height;}
		}
		
		jCont.setDim({x:x,y:y}).css('visibility','visible');
		
		return this;
	};
	
	JSYG.ContextMenu.prototype.enable = function(opt) {
		
		this.disable();
		
		if (opt) this.set(opt);
	
		var jNode = new JSYG(this.node),
		
			backup = {
				title : this.node.title,
				alt : this.node.alt
			},
		
			that = this,
			
			fct = function(e) {
				e.stopPropagation();
				if (that.trigger("beforeshow",that.node,e)!==false) that.show(e.pageX,e.pageY);
			},
			
			hide = function(e) { that.hide(); };
		
		jNode.preventDefault('contextmenu');
		jNode.on('right-mousedown',fct);
				
		new JSYG(document).on('mousedown',hide);
		new JSYG(window).on('blur',hide);
		
		this.disable = function() {
			
			this.hide();
			this._clear();
			
			jNode.off('right-mousedown',fct);
			
			new JSYG(document).off('mousedown',hide);
			new JSYG(window).off('blur',hide);
			
			jNode.releaseDefault('contextmenu');
			jNode.attr(backup);
			
			this.enabled = false;
			
			var ind = JSYG.ContextMenu.list.indexOf(this);
			JSYG.ContextMenu.list.splice(ind,1);
			
			return this;
		};
		
		this.create();
		
		this.enabled = true;
		
		JSYG.ContextMenu.list.push(this);
		
		return this;
	};
	
	JSYG.ContextMenu.prototype.disable = function() {
		
		this.hide();
		this._clear();
		
		return this;
	};
	
	JSYG.ContextMenu.list = [];
	
		
	var plugin = JSYG.bindPlugin(JSYG.ContextMenu);
	/**
	 * <strong>nécessite le module ContextMenu</strong><br/><br/>
	 * menu contextuel sur l'élément
	 * @returns {JSYG}
	 * @see JSYG.ContextMenu pour une utilisation d�taill�e
	 * @example <pre>new JSYG('#maDiv').contextMenu([
	 * 	{icon:'/icones/bin_closed.png',text:'supprimer',action:function() { new JSYG(this).remove(); } },
	 *  {icon:'/icones/application_edit.png',text:'editer',action:function() { new JSYG(this).classAdd('editable'); } },
	 *  {icon:'/icones/shading.png',text:'opacit�',submenu:[
	 *  	{text:'0%',action:function() { new JSYG(this).css('opacity',0); } },
	 *  	{text:'50%',action:function() { new JSYG(this).css('opacity',0.5); } },
	 *  	{text:'100%',action:function() { new JSYG(this).css('opacity',1); } }
	 *  ]}
	 * ]);
	 */
	JSYG.prototype.contextMenu = function() { return plugin.apply(this,arguments); };
	
});