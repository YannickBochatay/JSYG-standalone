JSYG.require('Animation','ZoomAndPan.css','Resizable','Cookies');

(function() {
	
	"use strict";
	
	/**
	 * chemin pour les images
	 */
	var path = JSYG.require.baseURL+'/ZoomAndPan/img/';
	
	/**
	 * liste des plugins associ�s au zoomAndPan
	 */
	var plugins = ['mouseWheelZoom','marqueeZoom','resizable','mousePan'];
		
	/**
	 * <strong>nécessite le module ZoomAndPan</strong><br/><br/>
	 * Gestion du zoom et panoramique d'un canvas SVG.<br/><br/>
	 * @param arg argument JSYG référence au canvas SVG
	 * @param opt optionnel, objet définissant les propriétés. S'il est pr�cis�, le module sera implicitement activ�. Si les modules ("mouseWheelZoom",
	 * "marqueeZoom","resizable","mousePan") sont définis � true, il seront activ�s avec les options par d�faut.
	 * @example <pre>var zap = new JSYG.ZoomAndPan("svg");
	 * zap.overflow = "auto";
	 * zap.enable();
	 * zap.mouseWheelZoom.key = "ctrl";
	 * zap.mouseWheelZoom.enable();
	 * zap.mousePan.enable();
	 * 
	 * //Equivalent �
	 * new JSYG.ZoomAndPan("svg",{
	 *    overflow:"auto",
	 *    mouseWheelZoom:{key:"ctrl"},
	 *    mousePan:true
	 * });
	 * </pre>
	 * @returns {JSYG.ZoomAndPan}
	 */
	JSYG.ZoomAndPan = function(arg,opt) {
		
		/**
		 * Gestion du zoom par la molette de la souris
		 */
		this.mouseWheelZoom = new MouseWheelZoom(this);
		/**
		 * Gestion du zoom par trac� d'un cadre
		 */
		this.marqueeZoom = new MarqueeZoom(this);
		/**
		 * Gestion de la taille du canvas SVG
		 */
		this.resizable = new Resizable(this);
		/**
		 * D�placement dans le canvas avec la souris
		 */
		this.mousePan = new MousePan(this);
		/**
		 * gestion du cookie pour m�moriser zoom et position
		 */
		this.cookie = new Cookie(this);
		/**
		 * Element g permettant de g�rer le zoom
		 */
		this.innerFrame = new JSYG('<g>').node;
		/**
		 * Element div permettant de g�rer les ascenceurs (si overflow!="hidden")
		 */
		this.outerFrame = new JSYG('<div>').node;
	
		if (arg) this.setNode(arg);
		if (opt) this.enable(opt);
	};
	
	JSYG.ZoomAndPan.prototype = new JSYG.StdConstruct();
	
	JSYG.ZoomAndPan.prototype.constructor = JSYG.ZoomAndPan;
	
	/**
	 * définitions des options
	 * @param options
	 * @returns {JSYG.ZoomAndPan}
	 */
	JSYG.ZoomAndPan.prototype.set = function(options) {
		
		for (var n in options) {
			if (options.hasOwnProperty(n) && (n in this)) {
				if (plugins.indexOf(n) !== -1) { this[n].set(options[n]); }
				else { this[n] = options[n]; }
			}
		}
		
		return this;
	};
	
	/**
	 * définition du canvas SVG
	 * @param arg argument JSYG
	 */
	JSYG.ZoomAndPan.prototype.setNode = function(arg) {
			
		var enabled = this.enabled,
			jNode = new JSYG(arg);
		
		if (enabled) this.disable();
		
		if (this.node) new JSYG(this.node).dataRemove('zoomandpan');
		
		this.node = jNode.node;
					
		jNode.data('zoomandpan',{});
					
		if (enabled) { this.enable(); }
	};

	/**
	 * module actif ou non
	 */
	JSYG.ZoomAndPan.prototype.enabled = false;
	/**
	 * Gestion du contenu d�passant du canvas de visualisation
	 * 'hidden' ou 'auto' ou 'scroll' (scroll-x,scroll-y)
	 */
	JSYG.ZoomAndPan.prototype.overflow = 'hidden';
	/**
	 * conteneur (g) qui g�re le zoom et la position du contenu
	 */
	JSYG.ZoomAndPan.prototype.innerFrame = null;
	/**
	 * conteneur (div) auquel est attach� le canvas SVG (si overflow!='hidden').
	 * Cela permet de g�rer des ascenceurs, qui n'existent pas en SVG.
	 */
	JSYG.ZoomAndPan.prototype.outerFrame = null;
	/**
	 * effet d'animation ou non pour le zoom et le d�placement
	 * Attention, cela nécessite une bonne carte graphique
	 */
	JSYG.ZoomAndPan.prototype.animate = false;
	/**
	 * Options suppl�mentaires d'animation
	 */
	JSYG.ZoomAndPan.prototype.animateOptions = null;
	/**
	 * Echelle minimale. Si = "canvas", l'échelle minimale correspond � la taille du canvas (en tenant compte des bornes définies
	 * par la propriétés bounds ou les propriétés minLeft,maxRight,minTop,maxBottom).
	 */
	JSYG.ZoomAndPan.prototype.scaleMin = "canvas";
	/**
	 * Echelle maximale. Si = "canvas", l'échelle minimale correspond � la taille du canvas (en tenant compte des bornes définies
	 * par la propriétés bounds ou les propriétés minLeft,maxRight,minTop,maxBottom).
	 */
	JSYG.ZoomAndPan.prototype.scaleMax = null;
	/**
	 * Abcisse minimale au del� de laquelle on ne peut plus naviguer
	 */
	JSYG.ZoomAndPan.prototype.minLeft = null;
	/**
	 * Abcisse maximale au del� de laquelle on ne peut plus naviguer
	 */
	JSYG.ZoomAndPan.prototype.maxRight = null;
	/**
	 * Ordonn�e minimale au del� de laquelle on ne peut plus naviguer
	 */
	JSYG.ZoomAndPan.prototype.minTop = null;
	/**
	 * Ordonn�e maximale au del� de laquelle on ne peut plus naviguer
	 */
	JSYG.ZoomAndPan.prototype.maxBottom = null;
	/**
	 * permet de définir les abcisses et ordonn�es extr�mes de navigation � x pixels du bord du contenu
	 * (si la valeur est positive, on peut aller au del� du contenu).
	 */
	JSYG.ZoomAndPan.prototype.bounds = null;
	/**
	 * largeur minimale du canvas
	 */
	JSYG.ZoomAndPan.prototype.minWidth = 5;
	/**
	 * hauteur minimale du canvas
	 */
	JSYG.ZoomAndPan.prototype.minHeight = 5;
	/**
	 * largeur maximale du canvas
	 */
	JSYG.ZoomAndPan.prototype.maxWidth = 3000;
	/**
	 * hauteur maximale du canvas
	 */
	JSYG.ZoomAndPan.prototype.maxHeight = 3000;
	/**
	 * Fonction(s) � ex�cuter � tout changment de zoom
	 */
	JSYG.ZoomAndPan.prototype.onscale = null;
	/**
	 * Fonction(s) � ex�cuter � tout changment de position
	 */
	JSYG.ZoomAndPan.prototype.ontranslate = null;
	/**
	 * Fonction(s) � ex�cuter � tout changment de taille du canvas
	 */
	JSYG.ZoomAndPan.prototype.onresize = null;
	/**
	 * Fonction(s) � ex�cuter � tout changement
	 */
	JSYG.ZoomAndPan.prototype.onchange = null;
	/**
	 * Fonction(s) � ex�cuter pendant les animations
	 */
	JSYG.ZoomAndPan.prototype.onanimate = null;
	/**
	 * Renvoie la taille du contenu de la navigation (contenu + bornes définies)
	 * @param ctm optionnel, si true renvoie la taille en tenant compte de la matrice de transformation
	 */
	JSYG.ZoomAndPan.prototype._getBounds = function(ctm) {
		
		var initDim = new JSYG(this.innerFrame).getDim();
				
		var bounds = {
			left : this.minLeft == null ? initDim.x - this.bounds : this.minLeft,
			right : this.maxRight == null ? initDim.x + initDim.width + this.bounds : this.maxRight,
			top : this.minTop == null ? initDim.y - this.bounds : this.minTop,
			bottom : this.maxBottom == null ? initDim.y + initDim.height + this.bounds : this.maxBottom
		};
		
		if (ctm) {
			
			var mtx = new JSYG(this.innerFrame).getMtx(),
				hg = new JSYG.Vect(bounds.left,bounds.top).mtx(mtx),
				bd = new JSYG.Vect(bounds.right,bounds.bottom).mtx(mtx);
			
			bounds.left = hg.x;
			bounds.top = hg.y;
			bounds.right = bd.x;
			bounds.bottom = bd.y;
		}
		
		bounds.width = bounds.right - bounds.left;
		bounds.height = bounds.bottom - bounds.top;
				
		return bounds;
	};

	/**
	 * Active la gestion du zoom et panoramique.
	 * Cette méthode ins�re un conteneur (propriété innerFrame) � la racine du canvas
	 * et tout le contenu y est d�plac�. Les éléments cr��s ensuite doivent donc �tre
	 * attach�s � "innerFrame" et non � l'élément svg lui-m�me (sauf si cela est voulu),
	 * sinon ils ne suivront pas le zoom et panoramique avec le reste.
	 * Si la propriété "overflow" est diff�rente de "hidden", un conteneur (propriété
	 * outerFrame) div est ins�r� et le canvas y est attach� afin de g�rer le scroll
	 * (les ascenseurs n'existent pas en SVG). 
	 * @param opt optionnel, objet définissant les options
	 * @returns {JSYG.ZoomAndPan}
	 */
	JSYG.ZoomAndPan.prototype.enable = function(opt) {
			
		this.disable();
		
		if (opt) { this.set(opt); }
		
		if (['auto','hidden'].indexOf(this.overflow) === -1 && this.overflow.indexOf('scroll')===-1) {
			throw new Error(this.overflow + ' : valeur incorrecte pour la propriété overflow');
		}
		
		if (!this.node) throw new Error("Il faut d'abord définir la propriété node par la méthode setNode");
		
		var jSVG = new JSYG(this.node),
			backup = jSVG.data('zoomandpan') || {},
			hidden = this.overflow == "hidden",
			n;
		
		backup.dimInit = jSVG.getDim();
		delete backup.dimInit.x; delete backup.dimInit.y;
		
		///////////////////////////////////////////////////
		//INNERFRAME			
		var viewBox = this.node.viewBox.baseVal,
			exclude = {
				tags :['switch','defs'],
				list : []
			},
			child,
			innerFrame = new JSYG(this.innerFrame).transfOrigin('left','top'),
			mtx = new JSYG.Matrix();
				
		while (this.node.firstChild) {
			child = this.node.firstChild;
			if (exclude.tags.indexOf(child.tagName)!==-1) {
				this.node.removeChild(child);
				exclude.list.push(child);
			}
			else innerFrame.append(child);
		}
		
		jSVG.append(exclude.list).append(innerFrame);
		
		//suppression de la viewbox
			
		if (viewBox && viewBox.width && viewBox.height) {
			
			mtx = mtx.scaleNonUniform(
				jSVG.cssNum('width')/viewBox.width,
				jSVG.cssNum('height')/viewBox.height
			);
		}
		
		if (hidden && viewBox) mtx = mtx.translate(-viewBox.x,-viewBox.y);
				
		jSVG.attrRemove('viewBox');
		backup.viewBoxInit = viewBox;
		
		innerFrame.setMtx(mtx);
							
		//////////////////////////////////////////////
		// OUTERFRAME
		
		if (!hidden) {
							
			var outerFrame = new JSYG(this.outerFrame),
				position = jSVG.css('position'),
				bounds = this._getBounds("ctm"),
				origin,
				left = jSVG.css('left'),
				top = jSVG.css('top'),
				margin = jSVG.css('margin');
				
			outerFrame.css({
				width : Math.ceil(jSVG.cssNum('width')),
				height : Math.ceil(jSVG.cssNum('height')),
				overflow : this.overflow,
				padding : '0px',
				margin : margin,
				display : 'inline-block',
				left : left,
				top : top,
				visibility : jSVG.css('visibility'),
				position : position === "static" ? "relative" : position,
				border : jSVG.css('border'),
				backgroundColor : jSVG.css('backgroundColor')
			});
			
			backup.cssInit = {
				left : left,
				top : top,
				margin : margin,
				position : position
			};
			
			jSVG.css({
				"left":0,
				"top":0,
				"margin":0,
				"position":"absolute",
				"width":bounds.width,
				"height":bounds.height
			});
			
			mtx = new JSYG.Matrix().translate(-bounds.left,-bounds.top).multiply(mtx);
			innerFrame.setMtx(mtx);
			
			origin = new JSYG.Vect(viewBox && viewBox.x || 0 , viewBox && viewBox.y || 0).mtx(mtx);
			
			outerFrame
			.replace(this.node)
			.append(this.node)
			.scrollLeft(origin.x)
			.scrollTop(origin.y);
		}
								
		this.enabled = true;
		
		if (backup.plugins) {
			for (n in backup.plugins) this[n].enable();
		}
		
		if (opt) {
			for (n in opt) {
				if (plugins.indexOf(n) !== -1) this[n].enable(opt[n]);
			}
		}
		
		jSVG.data('zoomandpan',backup);
								
		return this;			
	};
	
	/**
	 * D�sactivation de la gestion du zoom et panoramique
	 * @returns {JSYG.ZoomAndPan}
	 */
	JSYG.ZoomAndPan.prototype.disable = function() {
			
		if (!this.enabled || !this.node) return this;
		
		var jSVG = new JSYG(this.node),
			plugins = {},
			backup = jSVG.data('zoomandpan') || {},
			viewBox = backup.viewBoxInit;
						
		if (this.mouseWheelZoom.enabled) { plugins.mouseWheelZoom = true; this.mouseWheelZoom.disable(); }
		if (this.marqueeZoom.enabled) { plugins.marqueeZoom = true; this.marqueeZoom.disable(); }
		if (this.resizable.enabled) { plugins.resizable = true; this.resizable.disable(); }
		if (this.mousePan.enabled) { plugins.mousePan = true; this.mousePan.disable(); }
		
		backup.plugins = plugins;
					
		while (this.innerFrame.firstChild) jSVG.append(this.innerFrame.firstChild);
		new JSYG(this.innerFrame).remove();
		
		if (this.outerFrame.parentNode) {
			jSVG.replace(this.outerFrame);
			new JSYG(this.outerFrame).remove();
		}
				
		if (viewBox && viewBox.width && viewBox.height) {
			jSVG.attr('viewBox',viewBox.x+' '+viewBox.y+' '+viewBox.width+' '+viewBox.height);
		}
		
		delete backup.viewBoxInit;
		
		if (backup.cssInit) {
			jSVG.css(backup.cssInit);
			delete backup.cssInit;
		}
				
		if (backup.dimInit) {
			jSVG.setDim(backup.dimInit);
			delete backup.dimInit;
		}
				
		this.enabled = false;
		
		return this;
	};
	
	/**
	 * Ajustement nécessaire d� aux ascenceurs
	 * @returns {Number}
	 */
	JSYG.ZoomAndPan.prototype._getAdd = function() {
		return (this.overflow == "hidden") ? 0 : (this.overflow == "auto" ? 2 : 20);
	};
	
	JSYG.ZoomAndPan.prototype._limitSize = function() {};
	/**
	 * Renvoie (appel sans argument) ou définit la taille du canvas
	 * @param width optionnel, largeur du canvas. Si non défini, largeur proportionnelle � la hauteur définie
	 * @param height optionnel, hauteur du canvas. Si non défini, hauteur proportionnelle � la largeur définie
	 * @param keepViewBox bool�en optionnel, si true garde le cadrage apr�s redimensionnement.
	 * @returns {JSYG.ZoomAndPan} si appel� avec arguments, objet avec les propriétés width et height sinon.
	 */
	JSYG.ZoomAndPan.prototype.size = function(width,height,keepViewBox) {
		
		var hidden = this.overflow == "hidden",
			canvas = new JSYG( hidden ? this.node : this.outerFrame),
			size = canvas.innerDim(),
			mtx, that = this,
			keepRatio = width == null || height == null,
			widthTest,heightTest,
			animate = this.animate,
			opt,
			pt;
		
		if (width == null && height == null) return size;
		
		if (JSYG.isPlainObject(width)) {
			opt = width;
			keepViewBox = opt.keepViewBox || height;
			height = opt.height;
			width = opt.width;
		}
		
		if (width == null) width = size.width * height / size.height;
		else if (height == null) height = size.height * width / size.width;
		
		widthTest = JSYG.clip(width,this.minWidth,this.maxWidth);
		heightTest = JSYG.clip(height,this.minHeight,this.maxHeight);
		
		if (keepRatio && widthTest!=width) return this.size(widthTest,null,keepViewBox);
		else width = widthTest;
		
		if (keepRatio && heightTest!=height) return this.size(null,heightTest,keepViewBox);
		else height = heightTest;
		
		canvas.setDim({width:width,height:height});
		
		mtx = this.transform();
				
		if (keepViewBox) {
			pt = new JSYG.Vect(0,0).mtx(mtx.inverse());
			mtx = mtx.scaleNonUniform(width/size.width,height/size.height,pt.x,pt.y);
		}
		
		this.animate = false;
			
		this.transform(mtx,function() {
			that.trigger('resize');
			that.animate = animate;
		});
													
		return this;
	};
	
	/**
	 * Applique une transformation au contenu du canvas
	 * @param mtx objet JSYG.Matrix, matrice de transformation � appliquer
	 * @param callback fonction � ex�cuter � la fin (équivalent � l'�v�nement onchange)
	 * @returns
	 */
	JSYG.ZoomAndPan.prototype.transform = function(mtx,callback) {
		
		var innerFrame =  new JSYG(this.innerFrame),
			hidden = this.overflow == "hidden",
			outerFrame = !hidden && new JSYG(this.outerFrame),
			scrollLeft = outerFrame && outerFrame.scrollLeft(),
			scrollTop = outerFrame && outerFrame.scrollTop();
		
		if (mtx == null) {
			mtx = innerFrame.getMtx();
			return hidden ? mtx : new JSYG.Matrix().translate(-scrollLeft,-scrollTop).multiply(mtx);
		}
		
		var transf = mtx.decompose(),
			scaleX = transf.scaleX,
			scaleY = transf.scaleY,
			translX = transf.translateX,
			translY = transf.translateY,
			mtxInv = mtx.inverse(),
			bounds = this._getBounds();
		
		if (!hidden) {
			mtx = mtx.translate(scrollLeft,scrollTop).translate(-bounds.left,-bounds.top);
			mtxInv = mtx.inverse();
		}
		
		var options = Object.create(this.animateOptions),
			that = this,
						
			outerDim = this.size(),
			add = this._getAdd(),
			
			jSVG = new JSYG(this.node),
						
			centerIn = innerFrame.getCenter(),
			centerOut = new JSYG.Vect((outerDim.width-add)/2,(outerDim.height-add)/2).mtx(mtxInv),
						
			hg = new JSYG.Vect(0,0).mtx(mtxInv),
			bd = new JSYG.Vect(outerDim.width-add,outerDim.height-add).mtx(mtxInv);
				
		//le contenu est moins large que le cadre, on centre le contenu
		if (bounds.width * scaleX + add < outerDim.width) {
			
			mtx = mtx.translateX(centerOut.x - centerIn.x);
			
			//on �tend le canvas svg � la largeur ext�rieure
			if (!hidden) jSVG.css("width",outerDim.width-add);  
		}
		else {
			
			if (!hidden) {
				jSVG.css("width",bounds.width*scaleX);
				mtx = mtx.translateX(hg.x - bounds.left);
			}
			else {
				//on emp�che de sortir du cadre
				if (hg.x < bounds.left) mtx = mtx.translateX( hg.x - bounds.left);
				else if (bd.x > bounds.right) mtx = mtx.translateX(bd.x - bounds.right);
			}
		}
		
		//le contenu est moins haut que le cadre, on centre le contenu
		if (bounds.height * scaleY + add < outerDim.height) {
			
			mtx = mtx.translateY(centerOut.y - centerIn.y);
			
			//on �tend le canvas svg � la hauteur ext�rieure
			if (!hidden) jSVG.css("height",outerDim.height-add);  
		}
		else {
			
			if (!hidden) {
				jSVG.css("height",bounds.height*scaleY);
				mtx = mtx.translateY(hg.y - bounds.top);
			}
			else {
				//on emp�che de sortir du cadre
				if (hg.y < bounds.top) mtx = mtx.translateY( hg.y - bounds.top);
				else if (bd.y > bounds.bottom) mtx = mtx.translateY( bd.y - bounds.bottom);				
			}
		}
				
		if (!hidden) {
			transf = mtx.decompose();
			outerFrame.scrollLeft( Math.round(transf.translateX - translX) );
			outerFrame.scrollTop( Math.round(transf.translateY - translY) );
		}
		
		if (!this.animate || !hidden) {
			
			innerFrame.setMtx(mtx);
			this.trigger('change');
			callback && callback.call(this.node);
		}
		else {
			
			innerFrame.animate(
				JSYG.extend(options,{
					to:{mtx:mtx},
					onanimate : function() { that.trigger('animate'); },
					onend: function() {
						that.trigger('change');
						callback && callback.call(that.node);
					}
				})
			);
		}
		
		return this;
	};
	
	/**
	 * Renvoie ou applique l'échelle (si la méthode est appelée avec des arguments).
	 * @param scale optionnel, si défini facteur de l'échelle (multiplie l'échelle courante, ne la remplace pas).
	 * @param originX optionnel, abcisse du point fixe (centre du canvas par d�faut)
	 * @param originY optionnel, ordonn�e du point fixe (centre du canvas par d�faut)
	 * @param callback optionnel, fonction � ex�cuter une fois le zoom effectu� (équivalent � l'�v�nement onscale)
	 * @returns {Number,JSYG.ZoomAndPan} l'échelle si la méthode est appelée sans argument, l'objet lui-m�me sinon.
	 */
	JSYG.ZoomAndPan.prototype.scale = function(scale,originX,originY,callback) {
		
		var mtx = this.transform(),
			transf = mtx.decompose();
					
		if (scale == null) return transf.scaleX;
		
		var size = this.size(),
			bounds = this._getBounds(),
			add = this._getAdd(),
			scaleTest = mtx.scale(scale).scaleX(),
			scaleCanvas = Math.min( (size.width-add) / bounds.width , (size.height-add) / bounds.height),
			scaleMin = (this.scaleMin == 'canvas') ? scaleCanvas : this.scaleMin,
			scaleMax = (this.scaleMax == 'canvas') ? scaleCanvas : this.scaleMax,
			origin,
			that = this;
		
		if (scaleMin && scaleTest < scaleMin) scale = scaleMin / transf.scaleX;
		if (scaleMax && scaleTest > scaleMax) scale = scaleMax / transf.scaleX;
		
		originX = (originX!=null) ? originX : size.width/2;
		originY = (originY!=null) ? originY : size.height/2;
		origin = new JSYG.Vect(originX,originY).mtx(mtx.inverse());
				
		mtx = mtx.scale(scale,origin.x,origin.y);
				
		this.transform(mtx,function() {
			that.trigger("scale");
			callback && callback.call(that.node);
		});
			
		return this;
	};
	
	/**
	 * Renvoie ou applique le d�placement dans le canvas (unit�s initiales).
	 * @example Si l'échelle est de 2, un d�placement horizontal de 1 d�placera visuellement le contenu de 2 pixels.
	 * @param x d�placement horizontal
	 * @param y d�placement vertical
	 * @param callback, optionnel, fonction � ex�cuter une fois la translation effectu�e (équivalent � l'�v�nement ontranslate)
	 * @returns {JSYG.ZoomAndPan,JSYG.Vecteur} un vecteur si appel� sans argument, l'objet lui-m�me sinon.
	 */
	JSYG.ZoomAndPan.prototype.translate = function(x,y,callback) {
						
		var mtx = this.transform(),
			that = this;
		
		if (x == null && y == null) return new JSYG.Vect(0,0).mtx( mtx.inverse() );
		
		x*=-1;
		y*=-1;
					
		mtx = mtx.translate(x,y);
			
		this.transform(mtx,function() {
			that.trigger('translate',that.node);
			callback && callback.call(that.node);
		});
		
		return this;
	};
	
	/**
	 * D�placement dans le canvas (en pixels �cran).
	 * @example Si l'échelle est de 2, un d�placement horizontal de 1 d�placera visuellement le contenu de 1 pixel.
	 * @param x d�placement horizontal
	 * @param y d�placement vertical
	 * @param callback optionnel, fonction � ex�cuter une fois la translation effectu�e (équivalent � l'�v�nement ontranslate)
	 * @returns {JSYG.ZoomAndPan}
	 */
	JSYG.ZoomAndPan.prototype.screenTranslate = function(x,y,callback) {
		
		var transf = this.transform().decompose();
		
		if (x == null && y == null) return new JSYG.Vect(transf.translateX,transf.translateY);
				
		this.translate(x/transf.scaleX,y/transf.scaleY,callback);
		
		return this;
	};
	/**
	 * Fixe la valeur de l'échelle
	 * @param scale valeur de l'échelle
	 * @param originX optionnel, abcisse du point fixe (centre par d�faut)
	 * @param originY optionnel, ordonn�e du point fixe (centre par d�faut)
	 * @param callback optionnel, fonction � ex�cuter une fois le zoom effectu� (équivalent � l'�v�nement onscale)
	 * @returns {JSYG.ZoomAndPan}
	 */
	JSYG.ZoomAndPan.prototype.scaleTo = function(scale,originX,originY,callback) {
		
		this.scale(
			scale / this.scale(),
			originX,originY,callback
		);
		
		return this;
	};
	
	/**
	 * Adapte le contenu � la taille du canvas
	 * @returns {JSYG.ZoomAndPan}
	 */
	JSYG.ZoomAndPan.prototype.fitToCanvas = function() {
		
		var bounds = this._getBounds("ctm"),
			outerDim = this.size(),
			add = this._getAdd(),
			rapX = (outerDim.width - add) / bounds.width,
			rapY = (outerDim.height - add) / bounds.height;
		
		this.scale( Math.min(rapX,rapY) );

		return this;
	};
		
	/**
	 * Fixe les valeurs de la translation (point sup�rieur gauche)
	 * @param x abcisse
	 * @param y ordoon�e
	 * @param callback optionnel, fonction � ex�cuter une fois la translation effectu�e (équivalent � l'�v�nement ontranslate)
	 * @returns {JSYG.ZoomAndPan}
	 */
	JSYG.ZoomAndPan.prototype.translateTo = function(x,y,callback) {
		
		var transl = this.translate();
		this.translate(x-transl.x,y-transl.y,callback);
		return this;
	};
	
	/**
	 * définit ou fixe la position du centre du canvas (si appel� avec arguments)
	 * @param x abcisse
	 * @param y ordoon�e
	 * @param callback optionnel, fonction � ex�cuter une fois la translation effectu�e (équivalent � l'�v�nement ontranslate)
	 * @returns {JSYG.ZoomAndPan}
	 */
	JSYG.ZoomAndPan.prototype.center = function(x,y,callback) {
		
		if (x==null && y==null) {
			
			var size = this.size(),
				mtx = this.transform();
			
			return new JSYG.Vect(size.width/2,size.height/2).mtx( mtx.inverse() );
		}
		else {
			
			var center = this.center();
			
			this.translate(x-center.x,y-center.y);
			return this;
		}
	};
	
	if (Object.defineProperty) {
		
		try {
			
			Object.defineProperty(JSYG.ZoomAndPan.prototype,"overflow",{
				get : function() { return this._overflow || "hidden"; },
				set : function(val) {
					
					if (['hidden','auto','scroll'].indexOf(val) === -1) {
						throw new Error(val+" : valeur incorrecte pour la propriété overflow");
					}
					if (val == this._overflow) { return; }
					
					var enabled = this.enabled;
					
					if (enabled) this.disable();
					
					this._overflow = val;
					
					if (enabled) this.enable();
				}
			});
			
		} catch(e) {}
		
	}

	/**
	 * Gestion du cookie pour conservation de l'état
	 */
	function Cookie(zoomAndPanObject) {
		this.zap = zoomAndPanObject;
	}
	
	/**
	 * expiration du cookie:  objet Date, JSYG.Date (inclure le plugin) ou nombre de jours à partir de la date courante, ou null pour session courante.
	 */
	Cookie.prototype.expires = null;
	/**
	 * Lit le cookie et positionne le canvas en cons�quence
	 * @returns {JSYG.Cookie}
	 */
	Cookie.prototype.read = function() {
		
		var zap = this.zap,
			node = zap.node;
			
		if (!node.id) throw new Error("Il faut définir un id pour la balise SVG pour pouvoir utiliser les cookies");
		
		var cookie = JSYG.cookies.read(node.id);
		
		if (!cookie) return this;
		
		var dimensions = cookie.split(';'),
			css = { 'width' : dimensions[0], 'height' : dimensions[1] },
			newmtx = dimensions[2];
			
		new JSYG(node).css(css);
		
		new JSYG(zap.innerFrame).css(css).attr('transform',newmtx);
					
		if (zap.overflow!=='hidden' && dimensions[3] && dimensions[4] && dimensions[5]!=null && dimensions[6]!=null) {
			
			new JSYG(zap.outerFrame)
			.css({ width : dimensions[3], height : dimensions[4] })
			.scrollLeft(dimensions[5])
			.scrollTop(dimensions[6]);
		}
		
		return this;
	};
		
	/**
	 * Ecrit un cookie pour m�moriser l'�tat du canvas SVG
	 * @returns {Cookie}
	 */
	Cookie.prototype.write = function() {
		
		var zap = this.zap,
			node = zap.node;
		
		if (!node.id) { throw "Il faut définir un id pour la balise SVG pour pouvoir utiliser les cookies"; }
		
		var jSVG = new JSYG(node),
			valcookie = "",
			outerFrame;
									
		valcookie+= jSVG.cssNum('width')+';'+jSVG.cssNum('height')+';';
		valcookie+= new JSYG(zap.innerFrame).getMtx().toString();

		if (zap.overflow !== 'hidden') {
			outerFrame = new JSYG(zap.outerFrame);
			valcookie+=';'+outerFrame.css('width')+';'+outerFrame.css('height')+';';
			valcookie+= outerFrame.scrollLeft()+';'+outerFrame.scrollTop();
		}
					
		JSYG.cookies.write(node.id,valcookie,this.cookieExpire);
		
		return this;
	};
	
	/**
	 * Supprime le cookie
	 * @returns {Cookie}
	 */
	Cookie.prototype.remove = function() {
		
		JSYG.cookies.remove(this.zap.node.id);
		return this;
	};
	
	/**
	 * Active le cookie
	 * @returns {Cookie}
	 */
	Cookie.prototype.enable = function() {
		
		this.disable();
		
		var unloadFct = this.write.bind(this);
		
		new JSYG(window).on('unload',unloadFct);
		
		this.disable = function() {
			new JSYG(window).off("unload",unloadFct);
			this.enabled = false;
			return this;
		};
		
		this.read();
		
		this.enabled = true;
		
		return this;
	};
	
	/**
	 * D�sactive le cookie
	 * @returns {Cookie}
	 */
	Cookie.prototype.disable = function() {
		return this;
	};
	                            
	
	/**
	 * Gestion du zoom par molette de la souris (+ une touche sp�ciale �ventuellement).
	 * Attention, google chrome ne permet pas d'annuler l'action par d�faut pour ctrl+molette
	 * @link http://code.google.com/p/chromium/issues/detail?id=111059
	 */
	function MouseWheelZoom(zoomAndPanObject) {
		this.zap = zoomAndPanObject;
	};
	
	MouseWheelZoom.prototype = new JSYG.StdConstruct();
	
	MouseWheelZoom.prototype.constructor = MouseWheelZoom;
	/**
	 * Touche sp�ciale � maintenir enfonc�e pour rendre le zoom actif ("ctrl","shift","alt")
	 */
	MouseWheelZoom.prototype.key = null;
	/**
	 * Pas du zoom � chaque coup de molette
	 */
	MouseWheelZoom.prototype.step = 0.1;	
	/**
	 * Fonction(s) � ex�cuter avant de zoomer
	 */
	MouseWheelZoom.prototype.onstart = null;
	/**
	 * Fonction(s) � ex�cuter apr�s avoir zoom�
	 */
	MouseWheelZoom.prototype.onend = null;
	/**
	 * Module actif ou non
	 */
	MouseWheelZoom.prototype.enabled = false;
	/**
	 * Fonction ex�cut�e sur �v�nement mouseWheel
	 */
	MouseWheelZoom.prototype.wheel = function(e) {
						
		if (this.key && !e[this.key] && !e[this.key+'Key']) return;
		
		var innerFrame = new JSYG(this.zap.innerFrame),
			scale = 1 + this.step * e.wheelDelta/120,
			animate = this.zap.animate,
			origin;
				
		if (animate === true && innerFrame.animate("get","inProgress")) return;
		
		e.preventDefault();
		
		this.trigger('start',this.zap.node,e);
						
		if (this.zap.overflow == 'hidden') {
			origin = innerFrame.getCursorPos(e).mtx(innerFrame.getMtx('ctm'));
		} else {
			origin = new JSYG(this.zap.outerFrame).getCursorPos(e);
		}
		 
		this.zap.animate = false;
				
		this.zap.scale(scale,origin.x,origin.y);
		
		this.zap.animate = animate;
		
		this.trigger('end',this.zap.node,e);
	};
	
	/**
	 * Activation du module
	 * @param opt optionnel, objet définissant les options.
	 * @returns {MouseWheelZoom}
	 */
	MouseWheelZoom.prototype.enable = function(opt) {
		
		if (!this.zap.enabled) this.zap.enable();
		
		this.disable();
		
		if (opt) this.set(opt);
		
		this.disable(); //par pr�caution si plusieurs appels
		
		var mousewheelFct = this.wheel.bind(this);
		
		var cible = new JSYG( this.zap.overflow === 'hidden' ? this.zap.node : this.zap.outerFrame );
		
		cible.on('mousewheel',mousewheelFct,false);
		
		this.disable = function() {
			cible.off('mousewheel',mousewheelFct);
			this.enabled = false;
			return this;
		}; 
		
		this.enabled = true;
		
		return this;
	};
	
	/**
	 * D�sactivation du module
	 * @returns {MouseWheelZoom}
	 */
	MouseWheelZoom.prototype.disable = function() { return this; };
	
	/**
	 * définition du zoom par trac� d'un rectangle
	 */
	function MarqueeZoom(zoomAndPanObject) {
		
		this.zap = zoomAndPanObject;
		
		/**
		 * Element SVG rect dessinant le trac�
		 */
		this.container = new JSYG("<rect>").node;
	};
	
	MarqueeZoom.prototype = new JSYG.StdConstruct();
	
	MarqueeZoom.prototype.constructor = MarqueeZoom;
	/**
	 * Evenement d�clenchant le trac�
	 */
	MarqueeZoom.prototype.event = 'left-mousedown';
	/**
	 * Fonction(s) � ex�cuter au d�but du trac�
	 */
	MarqueeZoom.prototype.onstart = null;
	/**
	 * Fonction(s) � ex�cuter pendant le trac�
	 */
	MarqueeZoom.prototype.ondrag = null;
	/**
	 * Fonction(s) � ex�cuter � la fin du trac�
	 */
	MarqueeZoom.prototype.onend = null;
	/**
	 * Classe � appliquer au conteneur
	 */
	MarqueeZoom.prototype.className = 'marqueeZoom';
	/**
	 * Module actif ou non
	 */
	MarqueeZoom.prototype.enabled = false;
	
	/**
	 * Fonction ex�cut�e sur l'�v�nement event
	 */
	MarqueeZoom.prototype.start = function(e) {
								
		var node = this.zap.node,
			jSVG = new JSYG(node),
			pos = jSVG.getCursorPos(e),
			that = this,
			resize = new JSYG.Resizable(this.container);
		
		new JSYG(this.container).classAdd(this.className)
		.setDim({
			x:Math.round(pos.x)-1,
			y:Math.round(pos.y)-1,
			width:1,
			height:1
		})
		.appendTo(node);
		
		resize.set({
			keepRatio:false,
			type:'attributes',
			originY:'top',
			originX:'left',
			cursor:false,
			inverse:true
		});
		
		if (this.onstart) { resize.on('start',function(e) {that.trigger('start',node,e);}); }
		if (this.ondrag) { resize.on('drag',function(e) {that.trigger('draw',node,e);}); }
		
		resize.on('end',function(e) {

			var size = that.zap.size(),
				dim = new JSYG(this).getDim(),
				coef = Math.min( size.width/dim.width , size.height/dim.height ),
				mtx = new JSYG(that.zap.innerFrame).getMtx(),
				pt1 = new JSYG.Vect(dim.x,dim.y).mtx(mtx.inverse()),
				pt2;
						
			if (coef < 20 ) {
								
				mtx = mtx.scale(coef,pt1.x,pt1.y);
				pt1 = new JSYG.Vect(0,0).mtx(mtx.inverse());
				pt2 = new JSYG.Vect(dim.x,dim.y).mtx(mtx.inverse());
				mtx = mtx.translate(pt1.x-pt2.x,pt1.y-pt2.y);
					
				that.zap.transform(mtx);
				that.trigger("end",node,e);
			}
			
			new JSYG(this).remove();
		});
		
		resize.start(e);
	};
	
	/**
	 * Activation du module
	 * @param opt optionnel, objet définissant les options
	 * @returns {MarqueeZoom}
	 */
	MarqueeZoom.prototype.enable = function(opt) {
		
		this.disable(); //par pr�caution si plusieurs appels
		
		if (opt) { this.set(opt);}
		
		if (!this.zap.enabled) this.zap.enable();
		
		var start = this.start.bind(this);
				
		new JSYG(this.zap.node).on(this.event,start);
			
		this.disable = function() {
			new JSYG(this.zap.node).off(this.event,start);
			this.enabled = false;
			return this;
		}; 
		
		this.enabled = true;
		
		return this;
	};
	
	/**
	 * D�sactivation du module
	 * @returns {MarqueeZoom}
	 */
	MarqueeZoom.prototype.disable = function() { return this;};
	
	/**
	 * Gestion du panoramique (navigation fa�on googlemaps)
	 */
	function MousePan(zoomAndPanObject) {
		this.zap = zoomAndPanObject;
	};
	
	MousePan.prototype = new JSYG.StdConstruct();
	
	MousePan.prototype.constructor = MousePan;
	
	/**
	 * Ev�nement d�clenchant le panoramique
	 */
	MousePan.prototype.event = 'left-mousedown';
	/**
	 * Classe � appliquer quand le module est actif.
	 */
	MousePan.prototype.className = 'MousePanOpenHand';
	/**
	 * Classe � appliquer pendant le cliquer/glisser.
	 */
	MousePan.prototype.classDrag = 'MousePanClosedHand';
	/**
	 * D�placement horizontal
	 */
	MousePan.prototype.horizontal = true;
	/**
	 * D�placement vertical
	 */
	MousePan.prototype.vertical = true;
	/**
	 * Fonction(s) � ex�cuter au d�but du cliquer/glisser
	 */
	MousePan.prototype.onstart = null;
	/**
	 * Fonction(s) � ex�cuter pendant le cliquer/glisser
	 */
	MousePan.prototype.ondrag = null;
	/**
	 * Fonction(s) � ex�cuter � la fin du cliquer/glisser
	 */
	MousePan.prototype.onend = null;
	/**
	 * Module actif ou non
	 */
	MousePan.prototype.enabled = false;
	/**
	 * Teste si un d�placement est possible ou non (selon l'échelle)
	 */
	MousePan.prototype._canMove = function() {
		
		var bounds = this.zap._getBounds("ctm"),
			size = this.zap.size();
		
		return this.horizontal && Math.round(size.width) < Math.round(bounds.width) || this.vertical && Math.round(size.height) < Math.round(bounds.height);
	};
	
	/**
	 * Fonction ex�cut�e sur l'�v�nement défini
	 * @param e JSYG.Event
	 */
	MousePan.prototype.start = function(e) {
		
		if (!this._canMove()) return;
		
		e.preventDefault();
		
		var jSVG = new JSYG(this.zap.node),
		
			lastX = e.clientX,
			lastY = e.clientY,
			
			animate = this.zap.animate,
			
			that = this,
							
			mousemoveFct = function(e) {
				that.zap.screenTranslate(that.horizontal && lastX-e.clientX, that.vertical && lastY-e.clientY);
				lastX = e.clientX;
				lastY = e.clientY;
				that.trigger('drag',that.zap.node,e);
			},
			
			jDoc = new JSYG(document),
			
			remove = function(e) {
				that.zap.animate = animate;
				jSVG.off('mousemove',mousemoveFct).classRemove(that.classDrag).classAdd(that.className);
				jDoc.off('mouseup',remove);
				that.trigger('end',e);
			};
		
		this.zap.animate = false;
			
		jSVG.classAdd(this.classDrag).classRemove(this.className);
		
		jSVG.on('mousemove',mousemoveFct);
		jDoc.on('mouseup',remove);
		
		this.trigger('start',this.zap.node,e);
	};
	
	/**
	 * Activation du module
	 * @param opt optionnel, objet définissant les options
	 * @returns {MousePan}
	 */
	MousePan.prototype.enable = function(opt) {
		
		if (opt) this.set(opt);
												
		this.disable();
		
		if (!this.zap.enabled) this.zap.enable();
		
		var jSVG = new JSYG(this.zap.node),
			start = this.start.bind(this),
			that = this,
			setClassName = function() {
				if (that.className) jSVG[ 'class' + (that._canMove() ? 'Add' : 'Remove') ](that.className);
			};
		
		jSVG.on(this.event,start);
		
		this.zap.on("scale",setClassName);
		setClassName();
				
		this.disable = function() {
			jSVG.classRemove(this.className).off(this.event,start);
			this.zap.off("scale",setClassName);
			this.enabled = false;
			return this;
		};
		
		this.enabled = true;
		
		return this;
	};
	
	/**
	 * D�sactivation du module
	 * @returns {MousePan}
	 */
	MousePan.prototype.disable = function() { return this; };
	
	
	/**
	 * Redimensionnement du canvas � la souris
	 */
	function Resizable(zoomAndPanObject) {
		this.zap = zoomAndPanObject;
	};
	
	Resizable.prototype = new JSYG.StdConstruct();
	
	Resizable.prototype.constructor = Resizable;
	/**
	 * Ev�nement d�clenchant le redimensionnement
	 */
	Resizable.prototype.event = 'left-mousedown';
	/**
	 * El�ment d�clechant le redimensionnement. La valeur "defaut" ins�re une image dans le coin inf�rieur droit.
	 */
	Resizable.prototype.field = 'default';
	/**
	 * Curseur � appliquer � l'élément pendant le cliquer/glisser
	 */
	Resizable.prototype.cursor = 'auto';
	/**
	 * Redimensionnement horizontal
	 */
	Resizable.prototype.horizontal = true;
	/**
	 * Redimensionnement vertical
	 */
	Resizable.prototype.vertical = true;
	/**
	 * Maintien des proportions
	 */
	Resizable.prototype.keepRatio = true;
	/**
	 * Maintien de la partie visible
	 */
	Resizable.prototype.keepViewBox = true;
	/**
	 * Fonction(s) � ex�cuter au d�but du cliquer/glisser
	 */
	Resizable.prototype.onstart = null;
	/**
	 * Fonction(s) � ex�cuter pendant cliquer/glisser
	 */
	Resizable.prototype.onresize = null;
	/**
	 * Fonction(s) � ex�cuter � la fin du cliquer/glisser
	 */
	Resizable.prototype.onend = null;
	/**
	 * Module actif ou non
	 */
	Resizable.prototype.enabled = false;
	/**
	 * Fonction ex�cut�e sur l'�v�nement défini
	 */
	Resizable.prototype.start = function(e) {
									
		e.preventDefault();
		
		var fields = (this.field === 'default') ? this._field : new JSYG(this.field),
			that = this,
			cursor = null,
			xInit = e.clientX,
			yInit = e.clientY,
			size = this.zap.size(),
			
			fcts = {
				
				"mousemove" : function(e) {
					
					var width = size.width + (that.horizontal ? e.clientX - xInit : 0),
						height = size.height + (that.vertical ? e.clientY - yInit : 0);
					
					if (that.keepRatio) height = null;
					
					that.zap.size(width, height, that.keepViewBox);
					that.trigger('resize',that.zap.node,e);
				},
				
				"mouseup" : function(e) {
					
					new JSYG(window).off(fcts);
					
					if (cursor) {
						fields.each(function() { this.css('cursor',this.data('svgresizable')); },true);
					}
					
					that.trigger('end',that.zap.node,e);
				}
			};
		
		new JSYG(window).on(fcts);
		
		if (this.cursor === 'auto') {
			if (this.horizontal === false) cursor = 'n';
			else if (this.vertical === false) cursor = 'e';
			else cursor = 'se';
			cursor+='-resize';
		} else if (this.cursor) cursor = that.cursor;
		
		if (cursor) {
			fields.each(function() { this.data('svgresizable',this.css('cursor')).css('cursor',cursor); },true);
		}

		this.trigger('start',this.zap.node,e);
	};
	
	/**
	 * Activation du module
	 * @param opt optionnel, objet définissant les options
	 * @returns {Resizable}
	 */
	Resizable.prototype.enable = function(opt) {
		
		var start = this.start.bind(this),
			fields,
			that = this;
			
		this.disable();
		
		if (opt) { this.set(opt); }
					
		if (!this.zap.enabled) { this.zap.enable(); }
		
		if (this.horizontal === false || this.vertical === false) this.keepRatio = false;
		
		if (this.field === 'default') {
			
			this._field = new JSYG('<img>')
			.href(path+'resize.png').classAdd('SVGResize')
			.insertAfter(this.zap.overflow == "hidden" ? this.zap.node : this.zap.outerFrame);
			
			fields = this._field;
		}
		else fields = new JSYG(this.field);
		
		fields.each(function() { this.on(that.event,start); },true);
		
		this.disable = function() {
			
			fields.each(function() { this.off(that.event,start); },true);
			
			if (this.field === 'default') this._field.remove();
			
			this.enabled = false;
			return this;
		};
		
		this.enabled = true;
		
		return this;
	};
	
	/**
	 * D�sactivation du module
	 */
	Resizable.prototype.disable = function() {};
		
})();