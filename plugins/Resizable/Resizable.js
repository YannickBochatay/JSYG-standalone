(function() {
	
	"use strict";
	
	/**
	 * Paliers vers lesquels l'objet sera attir�
	 * @returns {JSYG.Guides}
	 */
	var Steps = function(list,strength) {
		/**
		 * liste des paliers
		 */
		this.list = list || [];
		/**
		 * force de l'aimantation
		 */
		this.strength = JSYG.isNumeric(strength) ? strength : 10;
		/**
		 * type de donn�es ("scale" pour liste d'échelles ou "dim" pour liste de dimensions)
		 */
		this.type = 'dim';
	};
	
	/**
	 * <strong>nécessite le plugin Resizable</strong><br/><br/>
	 * Element redimensionnable
	 * @param arg argument JSYG faisant référence � l'élément � redimensionner
	 * @param opt optionnel, objet définissant les options. Si défini, le redimensionnement est activ�.
	 * @returns {JSYG.Resizable}
	 * @example <pre>var resizable = new JSYG.Resizable('#monElement');
	 * resizable.keepRatio = false;
	 * resizable.type = "transform";
	 * resizable.enable();
	 * 
	 * //Equivalent � 
	 * new JSYG.Resizable('#monElement',{
	 * 	keepRatio:false,
	 * 	type:"transform"
	 * });
	 */
	JSYG.Resizable = function(arg,opt) {
		/**
		 * Element DOM � redimensionner
		 */
		this.node = new JSYG(arg).node;
		/**
		 * argument JSYG faisant référence aux éléments qui activent le redimensionnement.
		 * Par d�faut l'élément lui-m�me
		 */
		this.field = this.node;
		/**
		 * Paliers horizontaux
		 */
		this.stepsX = new Steps();
		/**
		 * Paliers verticaux
		 */
		this.stepsY = new Steps();
		
		if (opt) { this.enable(opt); }
	};
	
	function shape(node) {
		if (['path','polyline','polygon','g','text','use'].indexOf(node.tagName) !== -1 || new JSYG(node).isSVGImage() ) { return 'noAttribute'; }
		else return 'shape';
	}
	
	
	JSYG.Resizable.prototype = new JSYG.StdConstruct();
	
	JSYG.Resizable.prototype.constructor = JSYG.Resizable;
	/**
	 * Ev�nement qui d�clenche le redimensionnement
	 */	
	JSYG.Resizable.prototype.event = 'left-mousedown';
	/**
	 * Classe appliqu�e � l'élément pendant le redimensionnement
	 */
	JSYG.Resizable.prototype.className = false;
	/**
	 * Cursor � utiliser pendant le redimensionnement.
	 * La valeur sp�ciale "auto" permet un curseur adapt� aux options.
	 */
	JSYG.Resizable.prototype.cursor = 'auto';
	/**
	 * Redimensionnement vertical
	 */
	JSYG.Resizable.prototype.vertical = true;
	/**
	 * Redimensionnement horizontal
	 */
	JSYG.Resizable.prototype.horizontal = true;
	/**
	 * Maintien du ratio
	 */
	JSYG.Resizable.prototype.keepRatio = true;
	/**
	 * Type de redimensionnement (éléments SVG uniquement)
	 * - "attributes" : action sur les attributs de mise en page
	 * - "transform" : action sur la matrice de transformation 
	 */
	JSYG.Resizable.prototype.type = 'attributes';
	/**
	 * méthode de redimensionnement (éléments SVG uniquement):
	 * - "normal" : l'élément est agrandi du d�placement de la souris
	 * - "fixedPoint" : l'élément est agrandi de fa�on � ce que le point sous la souris y reste 
	 */
	JSYG.Resizable.prototype.method = 'normal';
	/**
	 * Si le type est "attributes", indique si la rotation doit �tre conservée
	 * lors de la conversion de la matrice en attributs (éléments SVG uniquement)
	 */
	JSYG.Resizable.prototype.keepRotation = false;
	/**
	 * largeur minimale
	 */
	JSYG.Resizable.prototype.minWidth = 1;
	/**
	 * hauteur minimale
	 */
	JSYG.Resizable.prototype.minHeight = 1;
	/**
	 * largeur maximale
	 */
	JSYG.Resizable.prototype.maxWidth = 3000;
	/**
	 * hauteur maximale
	 */
	JSYG.Resizable.prototype.maxHeight = 3000;
	/**
	* Permet de fixer automatiquement les valeurs minLeft,maxRight,minTop,maxBottom par rapport au offsetParent
	* (valeur positive ou nulle pour brider � l'int�rieur du offsetParent, valeur n�gative pour brider au del� du offsetParent
	**/
	JSYG.Resizable.prototype.bounds = null;
	/**
	 * abcisse minimale
	 */
	JSYG.Resizable.prototype.minLeft = null;
	/**
	 * ordonn�e minimale
	 */
	JSYG.Resizable.prototype.minTop = null;
	/**
	 * abcisse maximale
	 */
	JSYG.Resizable.prototype.maxRight = null;
	/**
	 * ordonn�e maximale
	 */
	JSYG.Resizable.prototype.maxBottom = null;
	/**
	 * Abcisse du point fixe lors du redimensionnement
	 * La valeur "auto" définit le point fixe en fonction de la position du curseur par rapport � l'élément
	 */
	JSYG.Resizable.prototype.originX = 'auto';
	/**
	 * Ordonn�e du point fixe lors du redimensionnement
	 * La valeur "auto" définit le point fixe en fonction de la position du curseur par rapport � l'élément
	 */
	JSYG.Resizable.prototype.originY = 'auto';
	/**
	 * Permet ou non de "retourner" l'élément
	 */
	JSYG.Resizable.prototype.inverse = false;
	/**
	 * fonction(s) � ex�cuter � la pr�paration d'un redimensionnement (�v�nement mousedown)
	 */			
	JSYG.Resizable.prototype.onstart = null;
	/**
	 * fonction(s) � ex�cuter au d�but du redimensionnement
	 */
	JSYG.Resizable.prototype.ondragstart = null;
	/**
	 * fonction(s) � ex�cuter pendant le redimensionnement
	 */
	JSYG.Resizable.prototype.ondrag = null;
	/**
	 * fonction(s) � ex�cuter � la fin du redimensionnement
	 */
	JSYG.Resizable.prototype.ondragend = null;
	/**
	 * fonction(s) � ex�cuter au rel�chement de la souris qu'il y ait eu redimensionnement ou non
	 */
	JSYG.Resizable.prototype.onend = null;
	/**
	 * Indique si le redimensionnement est actif ou non
	 */
	JSYG.Resizable.prototype.enabled = false;
	
	
	function getRect(box,mtx) {
			
		var hg = new JSYG.Vect(box.x,box.y).mtx(mtx);
		var hd = new JSYG.Vect(box.x+box.width,box.y).mtx(mtx);
		var bg = new JSYG.Vect(box.x,box.y+box.height).mtx(mtx);
		var bd = new JSYG.Vect(box.x+box.width,box.y+box.height).mtx(mtx);
		
		return {
			left : Math.min(hg.x,hd.x,bg.x,bd.x),
			right : Math.max(hg.x,hd.x,bg.x,bd.x),
			top : Math.min(hg.y,hd.y,bg.y,bd.y),
			bottom : Math.max(hg.y,hd.y,bg.y,bd.y)
		};
	}
	
	/**
	 * D�clenche le redimensionnement (�v�nement mousedown)
	 * @param e objet JSYG.Event
	 * @returns {JSYG.Resizable}
	 */
	JSYG.Resizable.prototype.start = function(e) {
		
		e.preventDefault();
		
		var jNode = new JSYG(this.node),
			parent = jNode.offsetParent();
		
		if (JSYG.isNumeric(this.bounds)) {
			var dimParent = parent.getDim();
			this.minLeft = - this.bounds;
			this.minTop = - this.bounds;
			this.maxRight = dimParent.width + this.bounds;
			this.maxBottom = dimParent.height + this.bounds;
		}
		
		var that = this,
			
			mtxScreenInit = (function() {
				if (jNode.type == 'svg') { return jNode.getMtx('screen').inverse(); }
				else {
					var dimParent = parent.getDim('screen');
					return new JSYG.Matrix().translate(dimParent.x,dimParent.y).inverse();
				}
			}()),
			
			mtxInit = jNode.getMtx(),
			
			transfInit = mtxInit.decompose(),
			
			xInit = e.clientX,
			
			yInit = e.clientY,
			
			mouseInit =  new JSYG.Vect(e.clientX,e.clientY).mtx(mtxScreenInit),
			
			dimInit = jNode.getDim(),
			
			boundsInit = jNode.getDim('screen'),
			
			scaleParent = (function() {
				
				var mtxScreenParent;
				
				if (jNode.getType() == 'svg') { mtxScreenParent = parent.getMtx('screen'); }
				else {
					var dimParent = parent.getDim('screen');
					mtxScreenParent = new JSYG.Matrix().translate(dimParent.x,dimParent.y);
				}
				
				var decomposeParent = mtxScreenParent.decompose();
				
				return {x:decomposeParent.scaleX,y:decomposeParent.scaleY};
			})(),
			
			originX = (that.originX !== 'auto') ? that.originX : (mouseInit.x < dimInit.x + dimInit.width/2) ? 'right' : 'left',					
			originY = (that.originY !== 'auto') ? that.originY : (mouseInit.y < dimInit.y + dimInit.height/2) ? 'bottom' : 'top',
					
			bornes = this.minLeft != null || this.maxRight!= null || this.minTop!= null || this.maxBottom!= null,
			
			dec = (function() {
				var dec = jNode.getShift(originX,originY);
				if (that.horizontal === false) { dec.x = 0; }
				else if (that.vertical === false) { dec.y = 0; }
				return dec;
			})(),
			
			hasChanged = false,
			triggerDragStart = false,
			stepsX,stepsY;
					
		if (this.type !== 'transform' && this.shape !== 'noAttribute') {
			
			stepsX =  (this.stepsX.type == 'scale') ? this.stepsX.list.map(function(scale) { return dimInit.width * scale; }) : this.stepsX.list; 
			stepsY =  (this.stepsY.type == 'scale') ? this.stepsY.list.map(function(scale) { return dimInit.height * scale; }) : this.stepsY.list;
		}
		else {
			stepsX =  (this.stepsX.type != 'scale') ? this.stepsX.list.map(function(width) { return width / dimInit.width; }) : this.stepsX.list; 
			stepsY =  (this.stepsY.type != 'scale') ? this.stepsY.list.map(function(height) { return height / dimInit.height; }) : this.stepsY.list;
		}
								
		var mousemoveFct = function(e) {
				
			if (!triggerDragStart) {
				that.trigger('dragstart',that.node,e);
				triggerDragStart = true;
			}
			
			var scaleX,scaleY,
			mtx=mtxInit,
			mouse;
			
			if (that.method === 'fixedPoint') {
				mouse = new JSYG.Vect(e.clientX,e.clientY).mtx(mtxScreenInit);
				scaleX = (mouse.x-dec.x) / (mouseInit.x-dec.x);
				scaleY = (mouse.y-dec.y) / (mouseInit.y-dec.y);
			}
			else {
				scaleX = 1 + (originX == 'center' ? 2 : 1) * (e.clientX - xInit) / boundsInit.width * (originX == 'right' ? -1 : 1);
				scaleY = 1 + (originY == 'center' ? 2 : 1) * (e.clientY - yInit) / boundsInit.height * (originY == 'bottom' ? -1 : 1);
			}
								
			if (Math.abs(scaleX) === Infinity || Math.abs(scaleY) === Infinity) { return; }
								
			if (that.horizontal === false) { scaleX = 1; }
			else if (that.vertical === false) { scaleY = 1; }
			else if (that.keepRatio) { scaleX = scaleY;}
			
			if (that.type !== 'transform' && that.shape !== 'noAttribute') {
										
				var coefX,coefY;
				
				if (originX === 'left') coefX = (that.inverse === false || scaleX > 0) ? 0 : -1;
				else if (originX === 'center') coefX = 0.5;
				else coefX = (that.inverse === false || scaleX > 1) ? 1 : 0;			
				
				if (originY === 'top') coefY = (that.inverse === false || scaleY > 0) ? 0 : -1;
				else if (originY === 'center') coefY = 0.5;
				else coefY = (that.inverse === false || scaleY > 1) ? 1 : 0;
										
				var newDim = {
						width : dimInit.width * (that.inverse === false || scaleX > 0 ? 1 : -1) * scaleX,
						height : dimInit.height * (that.inverse === false || scaleY > 0 ? 1 : -1) * scaleY,
						x : dimInit.x + (1-scaleX) * dimInit.width * coefX,
						y : dimInit.y + (1-scaleY) * dimInit.height * coefY
					},
					newWidth = newDim.width * transfInit.scaleX,
					newHeight = newDim.height * transfInit.scaleY,
					overflowX = newWidth < that.minWidth || newWidth > that.maxWidth,
					overflowY = newHeight < that.minHeight || newHeight > that.maxHeight,
					magnetX,magnetY,i,N,step,
					width=Infinity,height=Infinity;
									
				for (i=0,N=stepsX.length;i<N;i++) {
					step = stepsX[i];
					if (Math.abs(step-newWidth)*scaleParent.x < that.stepsX.strength) { magnetX = step; break;}
				}
				
				for (i=0,N=that.stepsY.list.length;i<N;i++) {
					step = stepsY[i];
					if (Math.abs(step-newHeight)*scaleParent.y < that.stepsY.strength) { magnetY = step; break;}
				}
				
				if (bornes) {
				
					var rect = getRect(newDim,mtxInit);				
					var x=0,y=0;
					
					if (that.minLeft!=null && rect.left < that.minLeft) { x = rect.left - that.minLeft;}
					else if (that.maxRight!=null && rect.right > that.maxRight) { x = that.maxRight - rect.right;}
					
					if (that.minTop!=null && rect.top < that.minTop) { y = rect.top - that.minTop;}
					else if (that.maxBottom!=null && rect.bottom > that.maxBottom) { y = that.maxBottom - rect.bottom;}
															
					if (x!==0 || y!==0) {
						
						if (that.keepRatio) {
							
							if (x) {
								width = scaleX * dimInit.width + x;
								height = dimInit.height * width / dimInit.width;
							}
							
							if (y) {								
								height = (scaleY * dimInit.height + y) < height ? scaleY * dimInit.height + y : height;
								width = dimInit.width * height / dimInit.height;
							}
							
							newDim = {
								width : width,
								height : height,
								x : dimInit.x + (dimInit.width - width) * coefX,
								y : dimInit.y + (dimInit.height - height) * coefY
							};
						}
						else {
						
							newDim = {
								width : scaleX * dimInit.width + x,
								height : scaleY * dimInit.height + y,
								x : dimInit.x + (dimInit.width-scaleX * dimInit.width - x) * coefX,
								y : dimInit.y + (dimInit.height-scaleY * dimInit.height - y) * coefY
							};
						}
					}
				}
				
				if (overflowX || overflowY) {
					
					if (that.keepRatio) { return ;}
					else {
						width = overflowX ? (newWidth < that.minWidth ? that.minWidth : that.maxWidth) / transfInit.scaleX : dimInit.width * scaleX;
						height = overflowY ? (newHeight < that.minHeight ? that.minHeight : that.maxHeight) / transfInit.scaleY : dimInit.height * scaleY;
						newDim = {
							width : width,
							height : height,
							x : dimInit.x + (dimInit.width-width) * coefX,
							y : dimInit.y + (dimInit.height-height) * coefY
						};
					}
				}
				else if (magnetX || magnetY) {
					
					if (magnetX) {
						scaleX = magnetX / (transfInit.scaleX*dimInit.width);
						if (that.keepRatio) { scaleY = scaleX; }
					}
					if (magnetY) {
						scaleY = magnetY / (transfInit.scaleY*dimInit.height);
						if (that.keepRatio) { scaleX = scaleY; }
					}
					
					newDim = {
						width : dimInit.width * scaleX,
						height : dimInit.height * scaleY,
						x : dimInit.x + dimInit.width * (1-scaleX) * coefX,
						y : dimInit.y + dimInit.height * (1-scaleY) * coefY
					};
				}
				
				jNode.setDim(newDim);
			}
			else {
				
				mtx = mtxInit.translate(dec.x,dec.y).scaleNonUniform(scaleX,scaleY);
								
				//pour ne pas retourner l'élément, sauf si inverse=true
				if (!that.inverse && (mtx.a/Math.abs(mtx.a) != mtxInit.a/Math.abs(mtxInit.a) || mtx.d/Math.abs(mtx.d) != mtxInit.d/Math.abs(mtxInit.d))) { return;}
				
				var newScaleX = mtx.scaleX(),
				newScaleY = mtx.scaleY(),
				overflowX = newScaleX * dimInit.width < that.minWidth || newScaleX * dimInit.width > that.maxWidth,
				overflowY = newScaleY * dimInit.height < that.minHeight || newScaleY * dimInit.height > that.maxHeight,
				magnetX,magnetY,i,N,step;
				
				for (i=0,N=stepsX.length;i<N;i++) {
					step = stepsX[i];
					if (Math.abs(step-newScaleX)*dimInit.width*scaleParent.x < that.stepsX.strength) { magnetX = step; break;}
				}
				for (i=0,N=stepsY.length;i<N;i++) {
					step = that.stepsY[i];
					if (Math.abs(step-newScaleY)*dimInit.height*scaleParent.y < that.stepsY.strength) { magnetY = step; break;}
				}
				
				if (bornes) {

					var rect = getRect(dimInit,mtx.translate(-dec.x,-dec.y));				
					var x=0,y=0;
					
					if (that.minLeft!=null && rect.left < that.minLeft) { x = rect.left - that.minLeft;}
					else if (that.maxRight!=null && rect.right > that.maxRight) { x = that.maxRight - rect.right;}
					
					if (that.minTop!=null && rect.top < that.minTop) { y = rect.top - that.minTop;}
					else if (that.maxBottom!=null && rect.bottom > that.maxBottom) { y = that.maxBottom - rect.bottom;}
						
					if (x!==0 || y!==0) {
						
						if (that.keepRatio) {
							if (x) { mtx = mtx.scale(1 + x / (dimInit.width * mtx.scaleX()) ); }
							else if (y) { mtx = mtx.scale(1 + y / (dimInit.height * mtx.scaleY()) ); }
						}
						else {
						
							mtx = mtx.scaleNonUniform(
								1 + x / (dimInit.width * mtx.scaleX()),
								1 + y / (dimInit.height * mtx.scaleY())
							);
						}
					}
				}

				if (overflowX || overflowY) {
					
					if (that.keepRatio) { return ;}
					else {
						mtx = mtxInit.translate(dec.x,dec.y)
						.scaleNonUniform(
							overflowX ? (newScaleX * dimInit.width < that.minWidth ? that.minWidth : that.maxWidth) / (dimInit.width*transfInit.scaleX) : scaleX,
							overflowY ? (newScaleY * dimInit.height < that.minHeight ? that.minHeight : that.maxHeight) / (dimInit.height*transfInit.scaleY) : scaleY
						);
					}
				}
				else if (magnetX || magnetY)
				{
					mtx = mtxInit.translate(dec.x,dec.y);
					if (that.keepRatio) {
						if (magnetX) { mtx = mtx.scale(magnetX/transfInit.scaleX); }
						else if (magnetY) { mtx = mtx.scale(magnetY/transfInit.scaleY); }
					}
					else {
						mtx = mtx.scaleNonUniform(magnetX ? magnetX/transfInit.scaleX : scaleX , magnetY ? magnetY/transfInit.scaleY : scaleY);
					}
				}
			
				mtx = mtx.translate(-dec.x,-dec.y);
				
				jNode.setMtx(mtx);
			}
								
			hasChanged = true;
			that.trigger('drag',that.node,e);
		},
		
		cursor = (that.cursor !== 'auto') ? that.cursor : (function() {
	
			var cursor,
			rotate = jNode.getMtx('screen').rotate(),
			angle = Math.abs( rotate * Math.PI / 180 % Math.PI),
			test = angle > Math.PI/4 && angle < Math.PI*3/4;
			
			if (that.horizontal === false) {cursor = test ? 'e' : 'n';}
			else if (that.vertical === false) {cursor = test ? 'n' : 'e';}
			else {
				if (originX == 'left') {
					if (originY =='top') { cursor = test ? 'ne' : 'se'; }
					else {cursor = test ? 'se' : 'ne';}
				}
				else {
					if (originY =='top') { cursor = test ? 'se' : 'ne'; }
					else {cursor = test ? 'ne' : 'se';}
				}
			}
			return cursor+'-resize';
			
		})(),
		
		remove = function remove(e) {
			
			if (that.className) { jNode.classRemove(that.className);}
			
			if (cursor) {
			
				new JSYG(that.field).each(function() {
					var field = new JSYG(this);
					field.css('cursor',field.data('cursorInit'));
				});
			}
			
			new JSYG(document).off({
				'mousemove':mousemoveFct,
				'mouseup':remove
			});
			
			if (hasChanged) {
				if (that.type!=='transform' && that.shape === 'noAttribute') {
					jNode.mtx2attrs({keepRotation:that.keepRotation});
				}
				that.trigger('dragend',that.node,e);
			}
			
			that.trigger('end',that.node,e);
		};
	
		if (cursor) {
		
			new JSYG(this.field).each(function() {
				var field = new JSYG(this);
				field.data('cursorInit',field.css('cursor'));
				field.css('cursor',cursor);
			});
		}
		
		if (that.className) { jNode.classAdd(that.className); }
		
		new JSYG(document).on({
			'mousemove':mousemoveFct,
			'mouseup':remove
		});
		
		this.trigger('start',that.node,e);
		
		return this;
	};
	
	/**
	 * Active le redimensionnement
	 * @param opt optionnel, objet définissant les options
	 * @returns {JSYG.Resizable}
	 */
	JSYG.Resizable.prototype.enable = function(opt) {
		
		this.disable();
		
		if (opt) { this.set(opt);}
		var that = this;
		var evt = opt && opt.evt;
		
		this.shape = shape(this.node);
				
		var start = this.start.bind(this);
					
		new JSYG(this.field).each(function() {
			var field = new JSYG(this);
			field.data('resizableUnselect',field.node.unselectable);
			field.node.unselectable = 'on'; //IE
			field.on(that.event,start);
		});
		
		this.disable = function() {
			new JSYG(this.field).each(function() {
				var field = new JSYG(this);
				field.off(that.event,start);
				this.unselectable = field.data('resizableUnselect');
			});
			this.enabled = false;
			return this;
		};
		
		if (this.node.tagName.toUpperCase() === 'IMAGE' && this.keepRatio === false) {
			this.node.setAttribute('preserveAspectRatio','none');
		}
		
		this.enabled = true;
		
		if (evt) { this.start(evt);}
						
		return this;
	};
	/**
	 * D�sactive le redimensionnement
	 * @returns {JSYG.Resizable}
	 */
	JSYG.Resizable.prototype.disable = function() {return this;};

	
	var plugin = JSYG.bindPlugin(JSYG.Resizable);
	/**
	 * <strong>nécessite le module Resizable</strong><br/><br/>
	 * El�ment redimensionnable
	 * @returns {JSYG}
	 * @see JSYG.Resizable pour une utilisation d�taill�e
	 * @example <pre>new JSYG('#maDiv").resizable();
	 * 
	 * //utilisation avanc�e
	 * new JSYG('#maDiv").resizable({
	 * 	minLeft:0,
	 * 	maxRight:500,
	 * 	minWidth:10,
	 * 	maxWidth:200,
	 *  vertical:false,
	 *  ondragend:function() {
	 *  	alert("nouvelle échelle horizontale : "+new JSYG(this).scaleX());
	 *  }
	 * });
	 */
	JSYG.prototype.resizable = function() { return plugin.apply(this,arguments); };
	
})();