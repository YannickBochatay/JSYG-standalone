(function() {
		
	"use strict";

	/**
	 * Aimants vers lesquels l'objet sera attir�
	 * @returns {JSYG.Guides}
	 */
	var Guides = function() {};
	
	Guides.prototype = new JSYG.StdConstruct();
	
	Guides.prototype.constructor = Guides;
	/**
	 * Liste des aimants : liste d'objets de coordonn�es (propriété(s) <strong>x</strong> et/ou <strong>y</strong>)
	 */
	Guides.prototype.list = null;
	/**
	 * Nombre de pixels pour lesquels l'élément DOM sera attir� vers l'aimant
	 */
	Guides.prototype.strength = 10;
	/**
	 * Abcisses(s) de référence de l'élément séparés par un espace
	 */
	Guides.prototype.originX = 'left center right';
	/**
	 * Ordonn�es(s) de référence de l'élément séparés par un espace
	 */
	Guides.prototype.originY = 'top center bottom';
	/**
	 * Exige que l'élément soit d�pos� sur un guide (sinon il retournera � sa place)
	 * @type {Boolean}
	 */
	Guides.prototype.require = false;
	/**
	 * Classe � appliquer � l'élément lorsqu'il est en contact avec un aimant
	 */
	Guides.prototype.className = 'aimant';
	/**
	 * Fonction(s) � ex�cuter lorsque l'élément entre en int�raction avec un aimant.
	 */
	Guides.prototype.onreach = null;
	/**
	 * Fonction(s) � ex�cuter lorsque l'élément quitte un aimant.
	 */
	Guides.prototype.onleave = null;
	/**
	 * Fonction(s) � ex�cuter lorsque l'élément est rel�ch� sur un aimant.
	 */
	Guides.prototype.onsuccess = null;
	/**
	 * Fonction(s) � ex�cuter lorsque l'élément est rel�ch� hors de port�e d'un aimant.
	 */
	Guides.prototype.onfail = null;
		
	/**
	 * <strong>nécessite le module Draggable</strong><br/><br/>
	 * Drag&drop d'un élément DOM 
	 * @param arg argument JSYG faisant référence � l'élément
	 * @param opt optionnel, objet définissant les options. Si défini le drag&drop est activ� implicitement. 
	 * @returns {JSYG.Draggable}
	 */
	JSYG.Draggable = function(arg,opt) {
		
		/**
		 * Element DOM
		 */
		this.node = new JSYG(arg).node;
		/**
		 * Argument JSYG faisant référence au(x) Champ(s) sur le(s)quel(s) on clique pour d�clencher le drag&drop. Par d�faut l'élément lui-m�me.
		 */
		this.field = this.node;
		
		/**
		 * Aimants vers lesquels l'objet sera attir�
		 */
		this.guides = new Guides();
		
		if (opt) { this.enable(opt); }
	};
		
	function shape(node) {
		return ['path','polyline','polygon','g','text'].indexOf(node.tagName) !== -1 ?  'noAttribute' : 'shape';
	};
	
	function rap(dec) {
		if (dec == null || dec === 'center') return 0.5;
		else if (dec === 'top' || dec === 'left') return 0;
		else if (dec === 'bottom' || dec === "right") return 1;
	};
	
	
	JSYG.Draggable.prototype = new JSYG.StdConstruct();
	
	JSYG.Draggable.prototype.constructor = JSYG.Draggable;
	/**
	 * Evenement pour d�clencher le drag&drop
	 */
	JSYG.Draggable.prototype.event = 'left-mousedown';
	/**
	 * Classe � appliquer pendant le drag&drop
	 */
	JSYG.Draggable.prototype.className = null;
	/**
	 * D�placement horizontal
	 */
	JSYG.Draggable.prototype.horizontal = true;
	/**
	 * D�placement vertical
	 */
	JSYG.Draggable.prototype.vertical = true;
	/**
	 * 'attributes' ou 'transform'. Agit sur les attrobuts de mise en page
	 * ou sur la matrice de transformation
	 */
	JSYG.Draggable.prototype.type = 'attributes';
	/**
	 * Garde ou non la rotation � la conversion de la matrice en attributs
	 * de mise en page (si type=="attributes")
	 */
	JSYG.Draggable.prototype.keepRotation = false;
	/**
	* Permet de fixer automatiquement les valeurs minLeft,maxRight,minTop,maxBottom par rapport au offsetParent
	* (valeur positive ou nulle pour brider � l'int�rieur du offsetParent, valeur n�gative pour brider au del� du offsetParent
	**/
	JSYG.Draggable.prototype.bounds = null;
	/**
	 * abcisse minimale
	 */
	JSYG.Draggable.prototype.minLeft = null;
	/**
	 * ordonn�e minimale
	 */
	JSYG.Draggable.prototype.minTop = null;
	/**
	 * abcisse maximale
	 */
	JSYG.Draggable.prototype.maxRight = null;
	/**
	 * ordonn�e maximale
	 */
	JSYG.Draggable.prototype.maxBottom = null;
	
	/**
	 * Scrolle ou non automatiquement si on sort de la fenêtre
	 */
	JSYG.Draggable.prototype.autoScroll = false;
	/**
	 * type de curseur � appliquer pendant le drag& drop.
	 * La valeur 'auto' permet un curseur adapt� aux options définies.
	 */
	JSYG.Draggable.prototype.cursor = 'auto';
	/**
	 * fonction(s) � ex�cuter � la pr�paration d'un d�placement (�v�nement mousedown)
	 */			
	JSYG.Draggable.prototype.onstart = null;
	/**
	 * fonction(s) � ex�cuter au d�but du d�placement
	 */
	JSYG.Draggable.prototype.ondragstart = null;
	/**
	 * fonction(s) � ex�cuter pendant le d�placement
	 */
	JSYG.Draggable.prototype.ondrag = null;
	/**
	 * fonction(s) � ex�cuter � la fin du d�placement
	 */
	JSYG.Draggable.prototype.ondragend = null;
	/**
	 * fonction(s) � ex�cuter au rel�chement de la souris qu'il y ait eu d�placement ou non
	 */
	JSYG.Draggable.prototype.onend = null;
	/**
	 * Indique si le drag&drop est actif ou non
	 */
	JSYG.Draggable.prototype.enabled = false;
			
	/**
	 * D�marrage du drag&drop. méthode ex�cut�e sur l'�v�nement "mousedown".
	 * @param {Object} e : objet JSYG.Event.
	 */
	JSYG.Draggable.prototype.start = function(e) {
				
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
			type = jNode.getType(),
			mtxScreenInitInv = jNode.getMtx("screen").inverse(),
			mtxInit = jNode.getMtx(),
			mouseInit = new JSYG.Vect(e.clientX,e.clientY).mtx(mtxScreenInitInv),
			dimInit = jNode.getDim(),
			mtxScreenParent = parent.getMtx('screen'),
			cursor,
			bornes = (this.minLeft!=null || this.minTop!=null || this.maxRight!=null || this.maxBottom!=null) ? true : false,
			guides = this.guides,
			hasChanged = false,
			triggerDragStart = false,
			dimWin = new JSYG(window).getDim();
						
		if (this.cursor === 'auto') {
			
			if (this.horizontal && this.vertical) cursor = 'move';
			else if (this.horizontal) cursor = 'e-resize';
			else cursor = 'n-resize';
		}
		else cursor = this.cursor;
		
		if (cursor) {
			
			new JSYG(this.field).each(function() {
				var field = new JSYG(this);
				field.data('cursorInit',field.css('cursor'));
				field.css('cursor',cursor);
			});
		}
		
		if (this.className) jNode.classAdd(this.className);
		
		if (guides.list && guides.list.length > 0) {
			
			guides.offsetX = (function() {
				var tab = guides.originX.trim().split(/ +/),
					dec = [];
				tab.forEach(function(origin) { dec.push(rap(origin)); });
				return dec;
			})();
			
			guides.offsetY = (function() {
				var tab = guides.originY.trim().split(/ +/),
					dec = [];
				tab.forEach(function(origin) { dec.push(rap(origin)); });
				return dec;
			})();
		}
		
		function mousemoveFct(e) {
			
			if (!triggerDragStart) {
				that.trigger('dragstart',that.node,e);
				triggerDragStart = true;
			}
			
			var oldOk = false,
				mtxScreenInv,
				mtxScreenParentInv,
				magnet,guide,ref,
				i,j,k,N,M,P,
				mtx,dim,rect,
				x,y,
				pt1,pt2,
				mouse,
				reachedX=false,
				reachedY=false,
				dimFromWin,
				scrollX=0,scrollY=0;
			
			function applyMagnet(pt1,pt2) {
				
				mtx = mtx.translate(pt2.x-pt1.x,pt2.y-pt1.y);
												
				if (that.type !== 'transform' && that._shape !== 'noAttribute') {
					dim.x+= pt2.x-pt1.x;
					dim.y+= pt2.y-pt1.y;
					jNode.setDim(dim);
				}
				else { jNode.setMtx(mtx); }
				
				jNode.classAdd(guides.className);
				
				guides.ok = true;
				
				if (!oldOk) guides.trigger('reach',that.node,e);
			}
			
			mouse = new JSYG.Vect(e.clientX,e.clientY).mtx(mtxScreenInitInv);
			
			mtx = mtxInit.translate(that.horizontal ? mouse.x - mouseInit.x : 0, that.vertical ? mouse.y - mouseInit.y : 0);
			
			dim = {
				x : !that.horizontal ? dimInit.x : dimInit.x + mouse.x - mouseInit.x,
				y : !that.vertical ? dimInit.y : dimInit.y + mouse.y - mouseInit.y
			};
										
			if (guides) {
				oldOk = guides.ok;
				guides.ok = false;
				if (guides.className) { jNode.classRemove(guides.className); }
			}
					
			if (that.type !== 'transform' && that._shape !== 'noAttribute') jNode.setDim(dim);
			else jNode.setMtx(mtx);
							
			if (bornes) {
				
				rect = jNode.getDim(type == 'svg' ? 'screen' : null);
				mtxScreenParentInv = mtxScreenParent.inverse();
				pt1 = new JSYG.Vect(rect.x,rect.y).mtx(mtxScreenParentInv);
				pt2 = new JSYG.Vect(rect.x+rect.width,rect.y+rect.height).mtx(mtxScreenParentInv);
								
				x=0;y=0;
				
				if (that.horizontal) {
					if (that.minLeft!=null && pt1.x < that.minLeft) { x = that.minLeft - pt1.x;}
					else if (that.maxRight!=null && pt2.x > that.maxRight) { x = that.maxRight - pt2.x;}
				}
				
				if (that.vertical) {
					if (that.minTop!=null && pt1.y < that.minTop) { y = that.minTop - pt1.y;}
					else if (that.maxBottom!=null && pt2.y > that.maxBottom) { y = that.maxBottom - pt2.y;}
				}
									
				if (x!==0 || y!==0) {
					
					mtx = new JSYG.Matrix().translate(x,y).multiply(mtx);
					
					if (that.type !== 'transform' && that._shape !== 'noAttribute') {
						pt1 = new JSYG.Vect(0,0).mtx(mtxInit.inverse());
						pt2 = new JSYG.Vect(x,y).mtx(mtxInit.inverse());
						dim.x+= pt2.x-pt1.x;
						dim.y+= pt2.y-pt1.y;
						jNode.setDim(dim);
					}
					else jNode.setMtx(mtx);
				}
			}
			
			if (guides.list && guides.list.length > 0) {
				
				rect = jNode.getDim(type == 'svg' ? 'screen' : null);
				mtxScreenInv = jNode.getMtx("screen").inverse();
													
				for (i=0,N=guides.list.length;i<N;i++) {
					
					guide = guides.list[i];
					
					magnet = new JSYG.Vect(
						guide.x != null ? guide.x : 0,
						guide.y != null ? guide.y : 0
					)
					.mtx(mtxScreenParent);
					
					if (guide.x != null && guide.y != null && !reachedX && !reachedY) {
						
						loop : 
						
						for (j=0,M=guides.offsetX.length;j<M;j++) {
							
							ref = {};
							ref.x = rect.x + rect.width * guides.offsetX[j];
							
							for (k=0,P=guides.offsetY.length;k<P;k++) {
								
								ref.y = rect.y + rect.height * guides.offsetY[k];

								if (JSYG.distance(magnet,ref) < guides.strength) {
									pt1 = new JSYG.Vect(ref).mtx(mtxScreenInv);
									pt2 = new JSYG.Vect(magnet).mtx(mtxScreenInv);
									applyMagnet(pt1,pt2);
									reachedX = reachedY = true;
									break loop;
								}
							}
						}
					}
					else if (guide.x != null && !reachedX) {
						
						for (j=0,M=guides.offsetX.length;j<M;j++) {
							
							ref = rect.x + rect.width * guides.offsetX[j];
							
							if (Math.abs(magnet.x - ref) < guides.strength) {
								pt1 = new JSYG.Vect(ref,0).mtx(mtxScreenInv);
								pt2 = new JSYG.Vect(magnet.x,0).mtx(mtxScreenInv);
								applyMagnet(pt1,pt2);
								reachedX = true;
								break;
							}
						}
					}
					else if (guide.y != null && !reachedY) {
						
						for (j=0,M=guides.offsetY.length;j<M;j++) {
							
							ref = rect.y + rect.height * guides.offsetY[j];
							
							if (Math.abs(magnet.y - ref) < guides.strength) {
								pt1 = new JSYG.Vect(0,ref).mtx(mtxScreenInv);
								pt2 = new JSYG.Vect(0,magnet.y).mtx(mtxScreenInv);
								applyMagnet(pt1,pt2);
								reachedY = true;
								break;
							}
						}
					}
					
					if (reachedX && reachedY) break;
				}
				
				if (oldOk && !guides.ok) guides.trigger('leave',that.node,e);
			}
			
			if (that.autoScroll) {
				
				dimFromWin = jNode.getDim(window);
				
				if (dimFromWin.x < 0) scrollX = dimFromWin.x;
				else if (dimFromWin.x + dimFromWin.width > dimWin.width) {
					scrollX = dimFromWin.x + dimFromWin.width - dimWin.width;
				}
								
				if (dimFromWin.y < 0) scrollY = dimFromWin.y;
				else if (dimFromWin.y + dimFromWin.height > dimWin.height) {
					scrollY = dimFromWin.y + dimFromWin.height - dimWin.height;
				}
								
				window.scrollBy(scrollX,scrollY);
			}
						
			hasChanged = true;
			that.trigger('drag',that.node,e);
		};
		
		function remove(e) {

			if (cursor) {
				new JSYG(that.field).each(function() {
					var field = new JSYG(this);
					field.css('cursor',field.data('cursorInit'));
				});
			}
			
			if (guides) {
				
				if (guides.className) jNode.classRemove(guides.className);
				if (that.className) jNode.classRemove(that.className);
				if (guides.ok) guides.trigger('success',that.node,e);
				else if (guides.require) {
				
					var to;
					//var backupTransf = null;
					
					if (that.type!=='transform') {
						
						if (that._shape === 'noAttribute') jNode.mtx2attrs({keepRotation:that.keepRotation});
						to = (jNode.type === 'svg') ? {x:dimInit.x,y:dimInit.y} : {'left':dimInit.x+'px','top':dimInit.y+'px'};
						
					} else {
						to = mtxInit;
						/*backupTransf = jNode.transfOrigin();
						jNode.transfOrigin(0,0);*/
					}
					
					if (!JSYG.Animation) {
						
						if (that.type!=='transform') jNode.setDim({x:dimInit.x,y:dimInit.y});
						else jNode.setMtx(mtxInit);						
					}
					else {
					
						jNode.animate({
							to:to,
							easing:'swing',
							callback:function() {
								/*if (backupTransf) {
									jNode.transfOrigin(backupTransf);
								}*/
								guides.trigger('fail',that.node,e);
							}
						});
					}
				}
			}
			
			if (hasChanged && that.type!=='transform' && that._shape === 'noAttribute') jNode.mtx2attrs({keepRotation:that.keepRotation});
							
			new JSYG(document).off({
				'mousemove':mousemoveFct,
				'mouseup':remove
			});
			
			if (hasChanged) that.trigger('dragend',that.node,e);
			that.trigger('end',that.node,e);
		}
		
		new JSYG(document).on({
			'mousemove':mousemoveFct,
			'mouseup':remove
		});
		
		this.trigger('start',this.node,e);
	};
		
	/**
	 * Activation de la mobilit�
	 * @param opt optionnel, objet définissant les options
	 */
	JSYG.Draggable.prototype.enable = function(opt) {	

		this.disable(); //si plusieurs appels
		
		if (opt) this.set(opt);
								
		var evt = opt && opt.evt,
			jNode= new JSYG(this.node),
			start = this.start.bind(this),
			that = this;
		
		this._shape = shape(this.node);
						
		new JSYG(this.field).each(function() {
			var field = new JSYG(this);
			field.data('draggableUnselect',field.node.unselectable);
			field.node.unselectable = 'on'; //IE
			field.on(that.event,start);
		});
		
		this.disable = function() {
			new JSYG(this.field).each(function() {
				var field = new JSYG(this);
				field.off(that.event,start);
				this.unselectable = field.data('draggableUnselect');
			});
			jNode.dataRemove('draggable');
			this.enabled = false;
			return this;
		};
		
		this.enabled = true;
		
		 // pour commencer tout de suite
		if (evt) this.start(evt);
		
		return this;
	};
	
	/**
	 * D�sactivation de la mobilit�
	 */
	JSYG.Draggable.prototype.disable = function() { return this; }; //définie lors de l'appel de la méthode on() car on a besoin du contexte
	
	var plugin = JSYG.bindPlugin(JSYG.Draggable);
	/**
	 * <strong>nécessite le module Draggable</strong><br/><br/>
	 * El�ment d�pla�able
	 * @returns {JSYG}
	 * @see JSYG.Draggable pour une utilisation d�taill�e
	 * @example <pre>new JSYG('#maDiv').draggable();
	 * 
	 * //utilisation avanc�e
	 * new JSYG('#maDiv').draggable({
	 * 	minLeft:0,
	 * 	maxRight:500,
	 * 	vertical:false,
	 * 	type:'transform',
	 * 	ondragend:function() { alert('translation horizontale : '+new JSYG(this).translateX(); }
	 * });
	 */
	JSYG.prototype.draggable = function() { return plugin.apply(this,arguments); };
	
})();