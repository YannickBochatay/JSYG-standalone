(function() {

	"use strict";
	
	JSYG.Container = function(arg) {
		
		if (!arg) { arg = '<g>'; }
		JSYG.call(this,arg);
		
		if (this.getTag() != "g") throw new Error("L'argument ne fait pas référence � un conteneur g.");
	};
	
	JSYG.Container.prototype = new JSYG();
	
	JSYG.Container.prototype.constructor = JSYG.Container;
	
	JSYG.Container.prototype.onadditem = null;
	JSYG.Container.prototype.onfreeitem = null;
	JSYG.Container.prototype.onchange = null;
	JSYG.Container.prototype.onalign = null;
			
	JSYG.Container.prototype.add = function(elmt) {
			
		var that = this,
			mtx = this.getMtx().inverse();
		
		JSYG.makeArray(arguments).forEach(function(elmt) {
			
			new JSYG(elmt).each(function() {
				
				try { this.addMtx(mtx); } //éléments non trac�s
				catch(e){}
				
				this.appendTo(that.node);
				
				that.trigger('additem',that.node,this.node);
				that.trigger('change');
				
			},true);
			
		});
		
		return this;
	};
	
	JSYG.Container.prototype.applyTransform = function() {
		
		var mtx = this.getMtx(),
			that = this;
				
		this.children().each(function() {
			this.setMtx( mtx.multiply(this.getMtx(that)) );
		},true);
		
		this.resetTransf();
				
		return this;
	};
		
	JSYG.Container.prototype.free = function(elmt) {
		
		var parent = this.parent(),
			mtx = this.getMtx(),
			that = this,
			args = JSYG.makeArray( arguments.length == 0 ? this.children() : arguments);
					
		args.forEach(function(elmt) {
				
			new JSYG(elmt).each(function() {
				
				if (!this.isChildOf(that)) return;
				
				try {
					this.setMtx( mtx.multiply(this.getMtx(that)) );
				}
				catch(e) {}
				
				this.appendTo(parent);
			
				that.trigger('freeitem',that.node,this.node);
				that.trigger('change');
				
			},true);
		});
				
		return this;
	};
		
	JSYG.Container.prototype.alignLeft = function() {
		
		var left = this.getDim().x;
		
		this.children().each(function() {
			try { this.setDim({x:left,from:this}); }
			catch(e) {}
		},true);
		
		this.trigger('align');		
		return this;
	};
	
	JSYG.Container.prototype.alignCenter = function() {
		
		var center = this.getCenter(),
			that = this;
		
		this.children().each(function() {
			
			try {
			
				var mtx = this.getMtx().inverse(),
					dim = this.getDim(),
					dimP = this.getDim(that),
					pt1 = new JSYG.Vect(dimP.x+dimP.width/2,0).mtx(mtx),
					pt2 = new JSYG.Vect(center.x,0).mtx(mtx);
							
				this.setDim({
					x : dim.x + pt2.x - pt1.x,
					y : dim.y + pt2.y - pt1.y
				});
			}
			catch(e) {}
			
		},true);
		this.trigger('align');		
		return this;
	};
	
	JSYG.Container.prototype.alignRight = function() {
		
		var dim = this.getDim(),
			right = dim.x + dim.width,
			that = this;
		
		this.children().each(function() {

			try {
			
				var mtx = this.getMtx().inverse(),
					dim = this.getDim(),
					dimP = this.getDim(that),
					pt1 = new JSYG.Vect(dimP.x,0).mtx(mtx),
					pt2 = new JSYG.Vect(right - dimP.width,0).mtx(mtx);
							
				this.setDim({
					x : dim.x + pt2.x - pt1.x,
					y : dim.y + pt2.y - pt1.y
				});
			}
			catch(e) {}
			
		},true);
		
		this.trigger('align');		
		return this;
	};
	
	JSYG.Container.prototype.alignTop = function() {
		
		var top = this.getDim().y,
			that = this;
		
		this.children().each(function() {

			try {
				var mtx = this.getMtx().inverse(),
					dim = this.getDim(),
					dimP = this.getDim(that),
					pt1 = new JSYG.Vect(0,dimP.y).mtx(mtx),
					pt2 = new JSYG.Vect(0,top).mtx(mtx);
							
				this.setDim({
					x : dim.x + pt2.x - pt1.x,
					y : dim.y + pt2.y - pt1.y
				});
			}
			catch(e) {}
			
		},true);
		
		this.trigger('align');		
		return this;
	};
	
	JSYG.Container.prototype.alignMiddle = function() {
		
		var center = this.getCenter(),
			that = this;
		
		this.children().each(function() {
			
			try {
				
				var mtx = this.getMtx().inverse(),
					dim = this.getDim(),
					dimP = this.getDim(that),
					pt1 = new JSYG.Vect(0,dimP.y+dimP.height/2).mtx(mtx),
					pt2 = new JSYG.Vect(0,center.y).mtx(mtx);
							
				this.setDim({
					x : dim.x + pt2.x - pt1.x,
					y : dim.y + pt2.y - pt1.y
				});
			}
			catch(e) {}
			
		},true);
		
		this.trigger('align');		
		return this;
	};
	
	JSYG.Container.prototype.alignBottom = function() {
		
		var dim = this.getDim(),
			bottom = dim.y + dim.height,
			that = this;
		
		this.children().each(function() {

			try {
				
				var mtx = this.getMtx().inverse(),
					dim = this.getDim(),
					dimP = this.getDim(that),
					pt1 = new JSYG.Vect(0,dimP.y).mtx(mtx),
					pt2 = new JSYG.Vect(0,bottom-dimP.height).mtx(mtx);
							
				this.setDim({
					x : dim.x + pt2.x - pt1.x,
					y : dim.y + pt2.y - pt1.y
				});
			}
			catch(e) {}
			
		},true);
		
		this.trigger('align');		
		return this;
	};

}());