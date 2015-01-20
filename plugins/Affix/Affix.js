JSYG.require("Affix.css");

(function() {
	
	"use strict";
	
	JSYG.Affix = function(arg,opt) {
		
		if (arg) {
			this.setNode(arg);
			if (opt) this.enable(opt);
		}
		else if (opt) this.set(opt);
	};
	
	JSYG.Affix.prototype = new JSYG.StdConstruct();
	
	JSYG.Affix.prototype.constructor = JSYG.Affix;
	
	JSYG.Affix.prototype.enabled = false;
	
	JSYG.Affix.prototype.enable = function(opt) {
		
		if (this.enabled) this.disable();
		
		if (opt) this.set(opt);
		
		var jNode = new JSYG(this.node),
			zombie = new JSYG('<'+ jNode.getTag()+'>'),
			offset = jNode.getDim('page');
		
		function checkScroll() {
			
			var classContains = jNode.classContains("affix"),
				dim;
			
			if (this.pageYOffset > offset.y) {
				
				if (!classContains) {
					
					zombie.styleClone(jNode).css('visibility','hidden');
					
					dim = jNode.getDim();
					
					jNode.classAdd("affix");
					
					zombie.insertBefore(jNode);
					
					zombie.setDim(dim);
				}
			}
			else if (classContains) {
				
				jNode.classRemove("affix");
				zombie.remove();
			}
		};
		
		new JSYG(window).on("scroll",checkScroll);
		
		this.disable = function() {
			
			jNode.classRemove("affix");
			zombie.remove();
			
			new JSYG(window).off("scroll",checkScroll);
			
			this.enabled = false;
		};
		
		checkScroll.call(window);
		
		this.enabled = true;
		
		return this;
	};
	
	JSYG.Affix.prototype.disable = function() {
		
		return this;
	};
	
	
	var plugin = JSYG.bindPlugin(JSYG.Affix);
	
	JSYG.prototype.affix = function() { return plugin.apply(this,arguments); };
	
}());