JSYG.require("Color");

(function() {

	"use strict";
	
	/**
	 * <strong>nécessite le module Canvas</strong><br/><br/>
	 * Manipulation de l'élément canvas. Expérimental.<br/><br/>
	 * @param arg optionnel, référence vers un élément canvas, ou création d'un nouveau si non défini.
	 * @returns {JSYG.Canvas}
	 */
	JSYG.Canvas = function(arg) {
	
		if (!arg) arg = '<canvas>';
		JSYG.call(this,arg);
		
		this.ctx = this.node.getContext('2d');
		this.mtx = new JSYG.Matrix();
	};
	
	JSYG.Canvas.prototype = new JSYG();
	
	JSYG.Canvas.prototype.constructor = JSYG.Canvas;
	
	/**
	 * Clone l'élément canvas
	 * @returns {JSYG.Canvas}
	 */
	JSYG.Canvas.prototype.clone = function() {
		return new JSYG.Canvas(new JSYG(this.node).clone());
	};
	
	/**
	 * Exporte le contenu du canvas
	 * @param type
	 * <ul>
	 * <li>canvas : élément DOM Canvas</li>
	 * <li>file : objet File</li>
	 * <li>url : fichier traitable comme une url</li>
	 * <li>html : élément DOM Image</li>
	 * <li>svg : élément DOM SVG Image</li>
	 * </ul>
	 * @param quality 0 � 100 �a n'a pas l'air de marcher...
	 * @param format 'png', 'jpeg' 'webp'
	 */
	JSYG.Canvas.prototype.exportTo = function(type,quality,format) {
		
		type = type || 'html';
		format = format || 'png';
		quality = quality/100;
		
		var node = this.node;
		
		switch (type) {
			
			case 'canvas' : return JSYG.Promise.resolve(node);
				
			case 'file' :
				
				if (node.toBlob) {
					
					return new JSYG.Promise(function(resolve,reject) {
						node.toBlob(resolve,'image/'+format,quality);
					});
				}
				else if (node.mozGetAsFile) {
					
					return JSYG.Promise.resolve( node.mozGetAsFile("peuimporte",'image/'+format,quality) );
				}
					
			case 'url' : return JSYG.Promise.resolve( node.toDataURL('image/'+format,quality) );
			
			case 'html' : case 'svg' :
				
				return this.exportTo('url',quality,format).then(function(url) {
					var tag = (type == "svg") ? "image" : "img";
					return new JSYG('<'+tag+'>').href('src',url).node;
				});
			
			default : throw new Error(type + " : type d'export incorrect");
		}
	};
	
	function parseArgument(arg,ref) {
		
		if (JSYG.isNumeric(arg)) return arg;
		else if (typeof arg == "string" && arg.charAt( arg.length -1 ) == '%') return ref * parseFloat(arg) / 100;
		else throw new Error(typeof arg + " : type incorrect");
	}
	
	/**
	 * Rogne l'image et renvoie un nouvel objet JSYG.Canvas
	 * @param x 
	 * @param y 
	 * @param width
	 * @param height
	 * @returns {JSYG.Canvas}
	 */
	JSYG.Canvas.prototype.crop = function(x,y,width,height)  {
		
		var canvas = this.clone(),
			cWidth = this.attr("width"),
			cHeight = this.attr("height"),
		
		x = parseArgument(x,cWidth);
		y = parseArgument(y,cHeight);
		width = parseArgument(width,cWidth);
		height = parseArgument(height,cHeight);
		
		canvas.attr('width',width);
		canvas.attr('height',height);
		canvas.ctx.drawImage(this.node,x,y,width,height,0,0,width,height);
		
		return canvas;
	};
	
	/**
	 * Redimensionne l'image et renvoie un nouvel objet JSYG.Canvas
	 * @param width
	 * @param height
	 * @returns
	 */
	JSYG.Canvas.prototype.resize = function(width,height)  {
				
		if (width != null) {
			
			width = parseArgument(width,this.attr("width"));
			
			if (height == null) height = Math.round(this.attr('height') * width / this.attr('width'));
			
		} else if (height != null) {
			
			height = parseArgument(height,this.attr("height"));
			
			width = Math.round(this.attr('width') * height / this.attr('height'));
			
		} else {
			
			height = this.attr('height');
			width = this.attr('width');
		}
		
		var canvas = this.clone();
		canvas.attr('width',width);
		canvas.attr('height',height);
		
		canvas.ctx.drawImage(this.node,0,0,width,height);
		
		return canvas;
	};
	
	/**
	 * récupère la matrice de transformation courante
	 * @param mtx
	 * @returns {JSYG.Matrix}
	 */
	JSYG.Canvas.prototype.getMtx = function() {
		return this.mtx;
	};
	
	/**
	 * Fixe la matrice courante
	 * @param mtx objet JSYG.Matrix (ou SVGMatrix)
	 * @returns {JSYG.Canvas}
	 */
	JSYG.Canvas.prototype.setMtx = function(mtx) {
	
		if (mtx instanceof JSYG.Matrix) mtx = mtx.mtx;
		this.ctx.setTransform(mtx.a,mtx.b,mtx.c,mtx.d,mtx.e,mtx.f);
		this.mtx = new JSYG.Matrix(mtx);
		
		return this;
	};
	
	/**
	 * Multiplie la matrice courante par une autre matrice 
	 * @param mtx objet JSYG.Matrix (ou SVGMatrix)
	 * @returns {JSYG.Canvas}
	 */
	JSYG.Canvas.prototype.addMtx = function(mtx) {
	
		if (mtx instanceof JSYG.Matrix) mtx = mtx.mtx;
		this.ctx.transform(mtx.a,mtx.b,mtx.c,mtx.d,mtx.e,mtx.f);
		this.mtx = this.mtx.multiply(mtx);
		
		return this;
	};
	
	/**
	 * R�initialise les transformations
	 * @returns {JSYG.Canvas}
	 */
	JSYG.Canvas.prototype.resetTransf = function() {
		this.setMtx(new JSYG.Matrix());
		return this;
	};
	
	/**
	 * définit une série de propriétés du contexte canvas
	 * @param obj
	 * @returns {JSYG.Canvas}
	 * @example var canvas = new JSYG.Canvas();
	 * canvas.set({
	 * 	font : "15px arial",
	 * 	textBaseline : "middle",
	 * 	fillStyle : "black",
	 * 	textAlign : "center"
	 * });					
	 */
	JSYG.Canvas.prototype.set = function(obj) {
		for (var n in obj) {
			if (this.ctx[n]) this.ctx[n] = obj[n];
		}
		return this;
	};
	
	/**
	 * Convertit l'image en niveaux de gris
	 * @returns {JSYG.Canvas}
	 */
	JSYG.Canvas.prototype.toGrayScale = function() {
		
		var width = Number(this.attr("width")),
			height = Number(this.attr("height")),
			imageData = this.ctx.getImageData(0,0,width,height),
			data = imageData.data,
			i=0,N=data.length,
			color;
		
        for(;i<N;i+=4) {
          color = new JSYG.Color({r:data[i],g:data[i+1],b:data[i+2]});
          data[i] = data[i+1] = data[i+2] = color.brightness();
        }
        
        this.ctx.putImageData(imageData,0,0);
        
        return this;
	};	
	
})();
