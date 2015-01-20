(function() {
	
	"use strict";
		
	JSYG.Alignment = function(arg) {
		
		this.list = arg;
	};
	
	JSYG.Alignment.prototype = new JSYG.StdConstruct();
	
	JSYG.Alignment.prototype.onalign = null;
	
	JSYG.Alignment.prototype.onalignleft = null;
	JSYG.Alignment.prototype.onaligncenter = null;
	JSYG.Alignment.prototype.onalignright = null;
	
	JSYG.Alignment.prototype.onaligntop = null;
	JSYG.Alignment.prototype.onalignmiddle = null;
	JSYG.Alignment.prototype.onalignbottom = null;
	
	JSYG.Alignment.prototype.list = null;
	
	JSYG.Alignment.prototype.getGlobalDim = function() {
		
		var globalDim = {
			left:Infinity,
			top:Infinity,
			bottom:-Infinity,
			right:-Infinity
		};
		
		var list = new JSYG(this.list);
		var parent = list[0].parentNode;
		
		list.each(function() {
			
			if (this[0].parentNode != parent) throw new Error("Les éléments de la collection doivent partager le m�me parent");
			
			var dim = this.getDim(parent);
			
			if (dim.x < globalDim.left) globalDim.left = dim.x;
			if (dim.y < globalDim.top) globalDim.top = dim.y;
			if (dim.x + dim.width > globalDim.right) globalDim.right = dim.x + dim.width;
			if (dim.y + dim.height > globalDim.bottom) globalDim.bottom = dim.y + dim.height;
			
		},true);
				
		return {
			x : globalDim.left,
			y : globalDim.top,
			width : globalDim.right - globalDim.left,
			height : globalDim.bottom - globalDim.top,
		};
	};
	
	JSYG.Alignment.prototype.getCenter = function() {
		
		var globalDim = this.getGlobalDim();
		return new JSYG.Vect( globalDim.x+globalDim.width/2, globalDim.y+globalDim.height/2 );
	};
	
	JSYG.Alignment.prototype.alignLeft = function() {
		
		var globalDim = this.getGlobalDim(),
			left = globalDim.x,
			list = new JSYG(this.list),
			parent = list[0].parentNode;
		
		list.setDim({x:left,from:parent});
		
		this.trigger("align");
		this.trigger("alignleft",null,left);
		
		return this;
	};
	
	JSYG.Alignment.prototype.alignCenter = function() {
		
		var center = this.getCenter(),
			list = new JSYG(this.list),
			parent = list[0].parentNode;
		
		list.each(function() {
			
			var mtx = this.getMtx().inverse(),
				dim = this.getDim(),
				dimP = this.getDim(parent),
				pt1 = new JSYG.Vect(dimP.x+dimP.width/2,0).mtx(mtx),
				pt2 = new JSYG.Vect(center.x,0).mtx(mtx);
						
			this.setDim({
				x : dim.x + pt2.x - pt1.x,
				y : dim.y + pt2.y - pt1.y
			});
			
		},true);
		
		this.trigger("align");
		this.trigger("aligncenter",null,center.x);

		return this;
	};
	
	JSYG.Alignment.prototype.alignRight = function() {
		
		var globalDim = this.getGlobalDim(),
			right = globalDim.x + globalDim.width,
			list = new JSYG(this.list),
			parent = list[0].parentNode;
		
		list.each(function() {

			var mtx = this.getMtx().inverse(),
				dim = this.getDim(),
				dimP = this.getDim(parent),
				pt1 = new JSYG.Vect(dimP.x,0).mtx(mtx),
				pt2 = new JSYG.Vect(right - dimP.width,0).mtx(mtx);
						
			this.setDim({
				x : dim.x + pt2.x - pt1.x,
				y : dim.y + pt2.y - pt1.y
			});
			
		},true);
		
		this.trigger("align");
		this.trigger("alignright",null,right);
		
		return this;
	};
	
	JSYG.Alignment.prototype.alignTop = function() {
		
		var top = this.getGlobalDim().y,
			list = new JSYG(this.list),
			parent = list[0].parentNode;
		
		list.each(function() {

			var mtx = this.getMtx().inverse(),
				dim = this.getDim(),
				dimP = this.getDim(parent),
				pt1 = new JSYG.Vect(0,dimP.y).mtx(mtx),
				pt2 = new JSYG.Vect(0,top).mtx(mtx);
						
			this.setDim({
				x : dim.x + pt2.x - pt1.x,
				y : dim.y + pt2.y - pt1.y
			});
			
		},true);
		
		this.trigger("align");
		this.trigger("aligntop",null,top);
		
		return this;
	};
	
	JSYG.Alignment.prototype.alignMiddle = function() {
		
		var center = this.getCenter(),
			list = new JSYG(this.list),
			parent = list[0].parentNode;
		
		list.each(function() {

			var mtx = this.getMtx().inverse(),
				dim = this.getDim(),
				dimP = this.getDim(parent),
				pt1 = new JSYG.Vect(0,dimP.y+dimP.height/2).mtx(mtx),
				pt2 = new JSYG.Vect(0,center.y).mtx(mtx);
						
			this.setDim({
				x : dim.x + pt2.x - pt1.x,
				y : dim.y + pt2.y - pt1.y
			});
			
		},true);
		
		this.trigger("align");
		this.trigger("alignmiddle",null,center.y);
			
		return this;
	};
	
	JSYG.Alignment.prototype.alignBottom = function() {
		
		var dim = this.getGlobalDim(),
			bottom = dim.y + dim.height,
			list = new JSYG(this.list),
			parent = list[0].parentNode;
		
		list.each(function() {

			var mtx = this.getMtx().inverse(),
				dim = this.getDim(),
				dimP = this.getDim(parent),
				pt1 = new JSYG.Vect(0,dimP.y).mtx(mtx),
				pt2 = new JSYG.Vect(0,bottom-dimP.height).mtx(mtx);
									
			this.setDim({
				x : dim.x + pt2.x - pt1.x,
				y : dim.y + pt2.y - pt1.y
			});
			
		},true);
		
		this.trigger("align");
		this.trigger("alignbottom",null,bottom);
				
		return this;
	};
	
	var aligns = ['top','bottom','left','right','center','middle'];
	
	JSYG.prototype.align = function(alignment) {
		
		if (aligns.indexOf(alignment.toLowerCase()) == -1) { throw new Error(alignment+" : argument incorrect ("+aligns.join()+" requis)"); }
		
		var method = "align" + alignment.charAt(0).toUpperCase() + alignment.substr(1);
		
		new JSYG.Alignment(this)[method]();
	};
	
	
})();