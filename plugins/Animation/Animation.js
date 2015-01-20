//http://paulirish.com/2011/requestanimationframe-for-smart-animating/
(function() {
	
	"use strict";

	var x,lastTime = 0,
		vendors = ['ms', 'moz', 'webkit', 'o'];
    
    for(x = 0; x < vendors.length && !window.requestAnimationFrame; ++x) {
        window.requestAnimationFrame = window[vendors[x]+'RequestAnimationFrame'];
        window.cancelAnimationFrame = window[vendors[x]+'CancelAnimationFrame'] || window[vendors[x]+'CancelRequestAnimationFrame'];
    }
 
    if (!window.requestAnimationFrame) {
    	 /**
    	 * Tells the browser that you wish to perform an animation;
    	 * this requests that the browser schedule a repaint of the window for the next animation frame.
    	 * The method takes as an argument a callback to be invoked before the repaint.
    	 * @see https://developer.mozilla.org/en/DOM/window.requestAnimationFrame
    	 */
        window.requestAnimationFrame = function(callback, element) {
        	
            var currTime = new Date().getTime(),
            	timeToCall = Math.max(0, 16 - (currTime - lastTime)),
            	id = window.setTimeout(function() { callback(currTime + timeToCall); },timeToCall);
            
            lastTime = currTime + timeToCall;
            
            return id;
        };
    }
 
    if (!window.cancelAnimationFrame) {
    	/**
    	 * Cancels an animation frame request previously scheduled through a call to window.requestAnimationFrame().
    	 * @see https://developer.mozilla.org/en/DOM/window.cancelAnimationFrame
    	 */
        window.cancelAnimationFrame = function(id) { clearTimeout(id); };
    }
	
})();

(function() {
	
	"use strict";
	
	/**
	 * Renvoie un nombre à partir d'un nombre, d'un chaîne num�rique ou d'un "additionneur" ("+=20","-=20")
	 * @param time temps initial
	 * @param arg si c'est un nombre (ou chaîne num�rique), il remplace time, si c'est une chaîne de la forme "+=20" "-=20" il s'aditionne à time.
	 */
	function setCurrentTime(time,arg) {
		
		if (typeof arg == 'string' && !JSYG.isNumeric(arg)) {
			
			var match = /(\+|-)=([0-9]+)/.exec(arg),
				signe = match && match[1],
				val = match && Number(match[2]);
			
			return time + (signe == '+' ? 1 : -1 ) * val;
			
		}
		else if (JSYG.isNumeric(arg)) return Number(arg);
		else throw new Error(arg+" : argument incorrect.");
	}
	
	function getDuration(duration) {
		
	    if (JSYG.isNumeric(duration)) return duration;
	    else if (duration == "slow") return 600;
	    else if (duration == "fast") return 200;
	    else throw new Error(duration+" : argument incorrect.");
	}
	

	/**
	 * Gestion d'une file d'animations
	 * @returns {JSYG.AnimationQueue}
	 */
	JSYG.AnimationQueue = function() {
		
		/**
		 * file des animations
		 */
		this.list = [];
		
	};
	
	JSYG.AnimationQueue.prototype = {
			
		constructor : JSYG.AnimationQueue,
		
		/**
		 * indice de l'animation en cours
		 */
		ind : -1,
		
		/**
		 * définit si la file s'exécute en boucle ou non
		 */
		loop : false,
		/**
		 * Fonctions à exécuter au lancement de la file
		 */
		onstart : null,
		/**
		 * Fonctions à exécuter à la fin de l'exécution de la file
		 */
		onend : null,
		/**
		 * Fonctions a exécuter pendant l'exécution de la file
		 */
		onanimate : null,
		/**
		 * Fonctions à exécuter quand on lance la file (quelle que soit la position)
		 */
		onplay : null,
		/**
		 * Fonctions à exécuter quand on suspend la file (quelle que soit la position)
		 */
		onpause : null,
		/**
		 * Fonctions à exécuter quand on arr�te la file.
		 */
		onstop : null,
		
		/**
		 * définition d'un écouteur d'évènement
		 * @param evt
		 * @param fct
		 * @returns {JSYG.AnimationQueue}
		 * @see {JSYG.StdConstruct}
		 */
		on : function(evt,fct) { JSYG.StdConstruct.prototype.on.call(this,evt,fct); return this;},
		/**
		 * 
		 * @param evt
		 * @param fct
		 * @returns {JSYG.AnimationQueue}
		 * @see {JSYG.StdConstruct}
		 */
		off : function(evt,fct) { JSYG.StdConstruct.prototype.off.call(this,evt,fct); return this;},
		
		trigger : JSYG.StdConstruct.prototype.trigger,
		
		set : JSYG.StdConstruct.prototype.set,
		
		/**
		 * R�initialisation de la file et des options
		 */
		reset : function() {
			JSYG.StdConstruct.prototype.reset.call(this);
			this.list = [];
		},
		
		/**
		 * stoppe l'animation en cours (dans l'état courant) et r�initialise la file et les options
		 */
		clear : function() {
			this.pause();
			this.reset();
		},
		
		/**
		 * Renvoie l'objet animation en cours
		 * @returns {JSYG.Animation}
		 */
		current : function() { return this.list[this.ind]; },
		
		/**
		 * Passe à l'animation pr�c�dente
		 * @returns {JSYG.AnimationQueue}
		 */
		prev : function() {
			
			var current = this.current();
			current && current._currentTime > 0 && current.currentTime(0);
			
			if (this.ind === 0) {
				if (this.loop === false) return false;
				else {
					while (this.ind < this.list.length-1) this.next();
					current = this.list[this.list.length-1];
					current.currentTime( getDuration(current.duration) );
					return this;
				}
			}
			else this.ind--;
			
			current = this.current();
			current._currentTime = getDuration(current.duration);
			
			return this;
		},
		
		/**
		 * Passe à l'animation suivante
		 * @returns {JSYG.AnimationQueue}
		 */
		next : function() {
			
			var current = this.current(),
				duration = current && getDuration(current.duration);
			
			if (current && current._currentTime < duration) current.currentTime(duration);

			if (this.ind === this.list.length-1) {
				if (this.loop === false) return false;
				else {
					while (this.ind > 0) this.prev();
					this.list[0].currentTime(0);
					return this;
				}
			}
			else this.ind++;
			
			current = this.current();
			if (current) current._currentTime = 0;
									
			return this;
		},
		
		/**
		 * Renvoie true si l'animation est en cours
		 * @returns {Boolean}
		 */
		inProgress : function() {
			var current = this.current();
			return !!(current && current.inProgress);
		},
		
		/**
		 * Joue la file d'animations (l� ou elle en est)
		 * @returns {JSYG.AnimationQueue}
		 */
		play : function() {
			
			if (this.ind === -1) throw new Error("Aucune animation n'a été définie.");
						
			var current = this.current();
			
			if (current) {
				
				if (current.inProgress) return this;
			
				if (current._currentTime === 0 && this.ind === 0 && this._way === 1 ||
					current._currentTime === getDuration(current.duration) && this.ind === this.list.length-1 && this._way === -1
				) this.trigger('start');
				
				this.trigger('play');
				
				current.play();
			}
						
			return this;
		},
		
		/**
		 * Fige l'animation en cours
		 * @returns {JSYG.AnimationQueue}
		 */
		pause : function() {
			
			var current = this.current();
			if (current && !current.inProgress) return this;
			this.trigger('pause');
			current && current.pause();
			return this;
		},
		
		/**
		* Joue ou suspend l'animation.
		* @returns {JSYG.AnimationQueue}
		*/
		toggle : function() {
			if (this.inProgress()) this.pause();
			else this.play();
			return this;
		},
		
		/**
		 * Stoppe l'animation et revient à l'état initial de la file
		 * @returns {JSYG.AnimationQueue}
		 */
		stop : function() {
			
			var current;
			current = this.current();
			
			if (this.ind === 0 && current._currentTime == 0) return this;
			
			current && current.stop();
			
			while (this.ind > 0) this.prev();
			
			current = this.current();
			current && current.currentTime(0);
			
			//on purge les états de départ au cas où l'élément est modifi� entre 2 lancements d'animation.
			this.list.forEach(function(anim) { anim.from = null; });
			
			this.trigger('stop');
			
			return this;
		},	
		
		/**
		* récupère ou fixe la position dans le temps
		* @param ms optionnel, si défini fixe la position
		* @returns {JSYG.AnimationQueue,Number} position (en millisecondes) ou objet lui-même.
		*/
		currentTime : function(ms) {
			
			var i,currentTime,current,duration;
			
			if (ms == null) {
				ms=0;
				for (i=0;i<this.ind;i++) ms+= getDuration(this.list[i].duration);
				ms+= this.current()._currentTime;
				return ms;
			}
			else {
			
				currentTime = this.currentTime();
				ms = setCurrentTime( currentTime, ms );
				ms = JSYG.clip(ms,0,this.duration());
				
				if (currentTime == ms) return this;
				
				//RAZ par simplicit�
				while (this.ind > 0) this.prev();
				
				current = this.current();
				current && current.currentTime(0);
				
				duration = getDuration(current.duration);
				
				while (ms > duration && this.next()) {
					ms-= duration;
					current = this.current();
					duration = getDuration(current.duration);
				}
				
				current.currentTime(ms);
				
				return this;
			}
		},
		
		/**
		* Renvoie la dur�e totale en millisecondes de la file.
		*/
		duration : function() {
			var ms=0;
			for (var i=0,N=this.list.length;i<N;i++) ms+= getDuration(this.list[i].duration);
			return ms;
		},
		
		_way : 1,
		/**
		 * définit ou récupère le sens d'exécution de la file et des animations
		 * @param val optionnel, si défini fixe le sens de l'animation (1 sens normal, -1 sens inverse). La valeur sp�ciale "toogle" permet
		 * d'inverser la valeur.
		 * @returns {Number,JSYG.AnimationQueue} le sens de l'animation si val est indéfini, l'objet lui-même sinon.
		 */
		way : function(val) {
			
			var inProgress;
			
			if (val == null) return this._way;
			else {
				
				if (val == 'toggle') val = this._way * -1;
				
				if (val !== 1 && val !== -1) throw new Error("la valeur de 'way' doit être 1 ou -1");
				
				inProgress = this.inProgress();
				inProgress && this.pause();
				
				this._way = val;
				this.list.forEach(function(anim) { anim.way = val; });
				
				inProgress && this.play();
								
				return this;
			}
		},
		
		/**
		 * Insert une animation à la file
		 * @param animation instance de JSYG.Animation
		 * @param ind optionnel, indice où insérer l'animation
		 * @returns {JSYG.AnimationQueue}
		 */
		add : function(animation,ind) {
			
			if(!(animation instanceof JSYG.Animation)) throw new Error("Argument incorrect pour la méthode JSYG.AnimationQueue.add : "+animation);
			if (this.list.indexOf(animation) !== -1) throw new Error("l'animation est déjà dans la liste.");
			
			var that = this;
			
			animation.queueFunctions = {
				end : function() {
					if ((that._way === 1 && that.next()) || (that._way===-1 && that.prev())) {
						that.current().play();
					}
					else that.trigger('end');
				},				
				animate : function() {
					that.trigger('animate');
				}
			};
			
			animation.on(animation.queueFunctions);
			
			if (ind == null) ind = this.list.length;
			this.list.splice(ind,0,animation);
			
			if (this.ind == -1) this.ind = 0;
			
			return this;
		},
		
		/**
		 * Suppression d'une animation de la file
		 * @param {Number} ind indice de l'animation (ou objet JSYG.Animation)
		 * @returns {JSYG.AnimationQueue}
		 */
		remove : function(ind) {
			
			if (ind instanceof JSYG.Animation) ind = this.list.indexOf(ind);
			
			var animation = this.list[ind];
			animation.off(animation.queueFunctions);
			
			this.list.splice(ind,1);
			
			if (this.list.length === 0) this.ind = -1;
			
			return this;
		}
	};
	
	/**
	 * Animation d'un élément (html et svg, prise en compte des transformations 2d rotate, translate, scale etc, et aussi window/document pour les propriétés scrollLeft et scrollTop).
	 * @param arg argument JSYG, élément DOM à animer
	 * @param {Object} opt options de l'animation. Si défini, l'animation est lanc�e imm�diatement. 
	 */
	JSYG.Animation = function(arg,opt) {
		
		/**
		 * élément DOM à animer
		 * @type Object dom
		 * @private
		 */
		if (arg) this.node = new JSYG(arg)[0];
		
		/**
		 * Etat d'arriv�e demand�
		 */
		this.to = {};
		
		if (opt) this.play(opt);
	};
	
	function transfAnim(obj) {
		
		if (!JSYG.support.twoDimTransf) return false;
		
		for (var n in obj) {  if (JSYG.listTransf.indexOf(n)!==-1) return true; }
		
		return false;
	}
	
	/**
	 * Renvoie les deux points (d'affil�e) d'un chemin les plus �loign�s l'un de l'autre.
	 * Cela permet d'ajouter un point sur la courbe l� où il y a le plus de "place".
	 */
	function indMaxDistance(jPath) {
		
		if (!jPath.isNormalized()) throw new Error("You must normalize the path");
		
		var max = 0,
			ind=-1,
			distance,
			i=1,N=jPath.nbSegs();
		
		for(;i<N;i++) {
			
			distance = jPath.getSegLength(i);
			
			if (distance > max) {
				max = distance;
				ind = i;
			}
		}
		
		return ind;
	};
	
	
	JSYG.Animation.prototype = {
			
		constructor : JSYG.Animation,
		
		setNode : JSYG.StdConstruct.prototype.setNode,
		/**
		 * dur�e de l'animation en millisecondes
		 * @type Number ou chaîne ("fast" pour 200ms et "slow" pour 600ms)
		 * @default 400
		 */
		duration : 400,
		/**
		 * pourcentage de l'animation en cours
		 * @type Number
		 * @private
		 */
		_currentTime : 0,
		/**
		 * style d'animation : voir JSYG.Animation.easing pour la liste des choix possibles
		 * @type String,Array
		 */
		easing : 'linear',
		/**
		 * Sens de l'animation
		 * @type {Number} 1 ou -1 
		 */
		way : 1,
		/**
		 * Indique si l'animation est en cours
		 * @type {Boolean}
		 */
		inProgress : false,
		/**
		 * Fonctions à exécuter au départ de l'animation
		 */
		onstart : null,
		/**
		 * Fonctions à exécuter à la fin de l'animation
		 */
		onend : null,
		/**
		 * Fonctions à exécuter pendant l'animation
		 */
		onanimate : null,
		/**
		 * Fonctions à exécuter quand on lance l'animation quelle que soit la position
		 */
		onplay : null,
		/**
		 * Fonctions à exécuter quand on suspend l'animation
		 */
		onpause : null,
		/**
		 * Fonctions à exécuter quand on stoppe l'animation
		 */
		onstop : null,
		
		/**
		 * Ajout d'un écouteur d'évènement
		 * @param evt
		 * @param fct
		 * @returns {JSYG.Animation}
		 * @see JSYG.StdConstruct.prototype.on
		 */
		on : function(evt,fct) { return JSYG.StdConstruct.prototype.on.apply(this,arguments); },
		/**
		 * Suppression d'un écouteur d'évènement
		 * @param evt
		 * @param fct
		 * @returns {JSYG.Animation}
		 * @see JSYG.StdConstruct.prototype.off
		 */
		off : function(evt,fct) { return JSYG.StdConstruct.prototype.off.apply(this,arguments); },
		
		trigger : JSYG.StdConstruct.prototype.trigger,
		
		set : function(opt) {

			for (var n in opt) {
				if (n in this && opt[n]!==undefined) { this[n] = opt[n]; }
			}
			
			return this;
		},
		
		/**
		* Insert l'animation à une file
		* @param queue instance de JSYG.AnimationQueue
		* @param ind indice dans la file où insérer l'animation
		*/
		addTo : function(queue,ind) {
			if (!(queue instanceof JSYG.AnimationQueue)) throw new Error(queue+" n'est pas une instance de JSYG.AnimationQueue");
			queue.add(this,ind);
			return this;
		},
		
		/**
		 * Cas particulier pour la transformation des chemins
		 */
		_setPathFromTo : function() {
			
			var pathFrom = new JSYG.Path( JSYG(this.node).clone() ).toCubicCurve(),
				fromList = pathFrom.getSegList(),
				pathTo = (typeof this.to.d == 'string') ?
					new JSYG.Path().attr('d',this.to.d).toCubicCurve() : new JSYG.Path().setSegList(this.to.d),
				toList = pathTo.getSegList(),
				ind,subPath,
				target = fromList.length > toList.length ? pathTo : pathFrom;
					
			while (fromList.length != toList.length) {
				
				ind = indMaxDistance(target);
				subPath = target.splitSeg(ind);
				
				target.removeSeg(ind)
				.insertSeg(subPath.getSeg(1),ind)
				.insertSeg(subPath.getSeg(0),ind);
				
				fromList = pathFrom.getSegList();
				toList = pathTo.getSegList();
			}
			
			this._from.d = fromList;
			this._to.d = toList;
		},
		/**
		 * Harmonisation de l'état d'arriv�e
		 * @private
		 * @returns {JSYG.Animation}
		 */
		_setTo : function() {
			
			var jNode = new JSYG(this.node),
				to = Object.create(this.to),
				n,shift,decompose,value;
			
			this._to = {};
			
			if (jNode.length === 0) return this;
			
			if (!this.to) return this; //pour d�lai sans animation
			
			if (this.to instanceof JSYG.Matrix) to = { mtx : this.to };
			
			if ("mtx" in to) {
				
				shift = jNode.getShift();
				decompose = to.mtx.decompose(shift.x,shift.y);
				
				for (n in decompose) {
					if (n != 'skew') to[n] = decompose[n];
				}
				
				delete to.mtx;
				
				this._transf = true;
			}
			else if (transfAnim(to)) {
			
				decompose = jNode.getTransf();
				
				if (to.scale && !to.scaleX && !to.scaleY) {
					to.scaleX = to.scaleY = to.scale;
				}
				
				for (n in decompose) {
										
					if (n != 'skew' && !this._to[n]) this._to[n] = (to[n] == null) ? decompose[n] : to[n];
				}
				
				this._transf = true;
			}
			
			for (n in to) {
				
				if (n == "d") continue;
					
				if (/color|fill|stroke/.test(n)) {
					
					if (!JSYG.Color) throw new Error("Il faut inclure le plugin JSYG.Color");
					if (!(to[n] instanceof JSYG.Color)) this._to[n] = new JSYG.Color(to[n]);
					
				} else {
										
					if (typeof to[n] !== 'object') {
						value = jNode._getAbsValue(n,to[n]);
						this._to[n] = JSYG._separateValAndUnits(value);
					}
				}
			}
						
			return this;
		},
		
		/**
		 * Réinitialisation de l'animation et des options
		 */
		reset : function() {
			JSYG.StdConstruct.prototype.reset.call(this);
			this._from = null;
			this._to = null;
			this.to = {};
		},
		
		/**
		 * En interne seulement, harmonisation de l'état de départ
		 * @private
		 */
		_setFrom : function() {
					
			var jNode = new JSYG(this.node),
				tag,type,dim,n,decomposeMtx,isXY;
			
			this._from = {};
			
			if (!jNode.length) return this;
			
			type = jNode.getType();
			dim = jNode.getDim();
			tag = jNode.getTag();
			
			if (this._transf) {
				decomposeMtx = jNode.getTransf();
				for (n in decomposeMtx) if (n!="skew") this._from[n] = decomposeMtx[n];
			}
			
			for (n in this._to) {
			
				if (n == "d") continue;
				
				isXY = (n == "x") || (n == "y");
				
				if (isXY && tag == "text") this._from[n] = jNode.attr(n);
				else if (isXY || type=='svg' && ['width','height'].indexOf(n)!==-1) this._from[n] = dim[n];
				else if (JSYG.listTransf.indexOf(n) === -1) this._from[n] = jNode.css(n) || 0;
									
				if (/color|fill|stroke/.test(n)) {
					
					if (!JSYG.Color) throw new Error("Il faut inclure le plugin JSYG.Color");
					
					try { this._from[n] = new JSYG.Color(this._from[n]); }
					catch(e) { this._from[n] = "white"; }
					
				}
				else {
					
					this._from[n] = JSYG._separateValAndUnits(this._from[n]);
					
					if (!JSYG.isNumeric(this._from[n].value)) this._from[n].value = 0;
											
					if (this._to[n].units === '') this._to[n].units = this._from[n].units;
				}
			}
															
			return this;
		},
		
		/**
		 * récupère ou fixe la position dans l'animation (en millisecondes).
		 * @param ms optionnel, si défini nombre de millisecondes th�oriques dans l'animation où se placer.
		 * @returns {JSYG.Animation,Number} la position si ms est indéfini, l'objet lui-même sinon
		 */				
		currentTime : function(ms) {
						
			if (ms == null) return this._currentTime;
			
			var duration = getDuration(this.duration),
				jNode = new JSYG(this.node),
				type = jNode.getType(),
				val,coef,recompose={},
				n,shift,color,path,
				that = this;
			
			ms = setCurrentTime( this._currentTime , ms );
			ms = this._currentTime = JSYG.clip(ms,0,duration);
									
			if (!this._from) { //si l'animation n'est pas lanc�e par la méthode play
				
				this._setTo();
				this._setFrom();
				
				if (this.to && ('d' in this.to)) {
					if (!JSYG.Path) throw new Error("Il faut inclure le module JSYG.Path");
					this._setPathFromTo();
				}
			}
																			
			coef = JSYG.Animation.easing[this.easing](null,ms,0,100,duration);
			
			for (n in this._to){
									
				if (/color|fill|stroke/.test(n)) {
					
					color = new JSYG.Color();
					color.r = parseInt( (this._from[n].r * (100-coef) + this._to[n].r*coef) / 100 , 10);
					color.g = parseInt( (this._from[n].g * (100-coef) + this._to[n].g*coef) / 100 , 10);
					color.b = parseInt( (this._from[n].b * (100-coef) + this._to[n].b*coef) / 100 , 10);
					
					jNode.css(n,color.toString());
					
				} else if (n == "d") {
					
					if (!JSYG.Path) throw new Error("Il faut inclure le module JSYG.Path");
					
					path = new JSYG.Path();
										
					this._from.d.forEach(function(segFrom,i) {
						
						var seg = {},
							segTo = that._to.d[i];
						
						['x','y','x1','y1','x2','y2'].forEach(function(n) {
							if (segFrom[n]==null || segTo[n]==null) return;
							seg[n] = (segFrom[n] * (100-coef) + segTo[n] * coef) / 100;   
						});
						
						if (seg.x == null && segTo.pathSegTypeAsLetter.toUpperCase() == "Z") path.addSeg("Z");
						else if (seg.x1==null) path.addSeg(i==0 ? 'M' : 'L',seg.x,seg.y);
						else path.addSeg('C',seg.x,seg.y,seg.x1,seg.y1,seg.x2,seg.y2);
					});
											
					jNode.attr('d', path.attr('d') );
				}
				else {
					
					val = (this._from[n].value * (100-coef) + this._to[n].value*coef) / 100;
												
					if (['x','y'].indexOf(n)!==-1) {
						jNode.getTag() == "text" ? jNode.attr(n,val) : jNode.setDim(n,val);
					}
					else if (type=='svg' && ['width','height'].indexOf(n)!==-1) jNode.setDim(n,val);
					else if (JSYG.listTransf.indexOf(n) !== -1) recompose[n] = val;
					else jNode.css(n,val+this._to[n].units);
				}
			}
			
			if (this._transf) {
				
				shift=jNode.getShift();
				jNode.setMtx(new JSYG.Matrix().recompose(recompose,shift.x,shift.y));
			}
					
			return this;
		},
				
		_request : function() {
			
			var that = this,
				duration = getDuration(this.duration);
									
			this.inProgress = window.requestAnimationFrame(function() {
				
				if (that._currentTime === 0 && that.way === 1 || that._currentTime === duration && that.way === -1) that.trigger('start');
				
				that.currentTime( that._currentTime + that.way * (Date.now() - that._last) );
				
				that.trigger('animate');
				
				that._last = Date.now();
				
				if ((that._currentTime <= 0 && that.way===-1 || that._currentTime >= duration && that.way===1)) {
					that.inProgress = false;
					that.trigger('end');
				}
				else that._request();
			});
		},
		
		/**
		 * Joue l'animation (l� où elle en est)
		 * @returns {JSYG.Animation}
		 */
		play : function(opt) {
		
			if (opt) this.set(opt);
			if (this.inProgress) return this;
			this.trigger("play");
			this._last = Date.now();
			this._request();
			return this;
		},
		
		/**
		 * Fige l'animation
		 * @returns {JSYG.Animation}
		 */
		pause : function() {
		
			if (!this.inProgress) return this;
			window.cancelAnimationFrame(this.inProgress);
			this.inProgress = false;
			this.trigger("pause");
			return this;
		},
				
		/**
		 * Stoppe l'animation et retourne au point de départ
		 * @returns {JSYG.Animation}
		 */
		stop : function() {
		
			if (!this.inProgress && this._currentTime === 0) return this;
			window.cancelAnimationFrame(this.inProgress);
			this.currentTime(0);
			this._from = null;
			this.inProgress = false;
			this.trigger("stop");
			return this;
		}
	};
		
	/*
	Copyright 2008 George McGinley Smith
	Copyright 2001 Robert Penner
	All rights reserved.
	// t: current time, b: begInnIng value, c: change In value, d: duration
	*/
	/**
	* Liste des styles d'animation possibles
	*/
	JSYG.Animation.easing = {
		
		linear : function(x,t,b,c,d) { return t * (c-b) / d; },
		
		swing : function() { return this.easeInOutQuad.apply(this,arguments); },
		
		easeInQuad: function (x, t, b, c, d) { return c*(t/=d)*t + b; },
		
		easeOutQuad: function (x, t, b, c, d) { return -c *(t/=d)*(t-2) + b; },
		
		easeInOutQuad: function (x, t, b, c, d) {
			if ((t/=d/2) < 1) return c/2*t*t + b;
			return -c/2 * ((--t)*(t-2) - 1) + b;
		},
		
		easeInCubic: function (x, t, b, c, d) { return c*(t/=d)*t*t + b; },
		
		easeOutCubic: function (x, t, b, c, d) { return c*((t=t/d-1)*t*t + 1) + b; },
		
		easeInOutCubic: function (x, t, b, c, d) {
			if ((t/=d/2) < 1) return c/2*t*t*t + b;
			return c/2*((t-=2)*t*t + 2) + b;
		},
		easeInQuart: function (x, t, b, c, d) { return c*(t/=d)*t*t*t + b; },
		
		easeOutQuart: function (x, t, b, c, d) { return -c * ((t=t/d-1)*t*t*t - 1) + b; },
		
		easeInOutQuart: function (x, t, b, c, d) {
			if ((t/=d/2) < 1) return c/2*t*t*t*t + b;
			return -c/2 * ((t-=2)*t*t*t - 2) + b;
		},
		easeInQuint: function (x, t, b, c, d) { return c*(t/=d)*t*t*t*t + b; },
		easeOutQuint: function (x, t, b, c, d) { return c*((t=t/d-1)*t*t*t*t + 1) + b; },
		easeInOutQuint: function (x, t, b, c, d) {
			if ((t/=d/2) < 1) return c/2*t*t*t*t*t + b;
			return c/2*((t-=2)*t*t*t*t + 2) + b;
		},
		easeInSine: function (x, t, b, c, d) {
			return -c * Math.cos(t/d * (Math.PI/2)) + c + b;
		},
		easeOutSine: function (x, t, b, c, d) {
			return c * Math.sin(t/d * (Math.PI/2)) + b;
		},
		easeInOutSine: function (x, t, b, c, d) {
			return -c/2 * (Math.cos(Math.PI*t/d) - 1) + b;
		},
		easeInExpo: function (x, t, b, c, d) {
			return (t==0) ? b : c * Math.pow(2, 10 * (t/d - 1)) + b;
		},
		easeOutExpo: function (x, t, b, c, d) {
			return (t==d) ? b+c : c * (-Math.pow(2, -10 * t/d) + 1) + b;
		},
		easeInOutExpo: function (x, t, b, c, d) {
			if (t==0) return b;
			if (t==d) return b+c;
			if ((t/=d/2) < 1) return c/2 * Math.pow(2, 10 * (t - 1)) + b;
			return c/2 * (-Math.pow(2, -10 * --t) + 2) + b;
		},
		easeInCirc: function (x, t, b, c, d) {
			return -c * (Math.sqrt(1 - (t/=d)*t) - 1) + b;
		},
		easeOutCirc: function (x, t, b, c, d) {
			return c * Math.sqrt(1 - (t=t/d-1)*t) + b;
		},
		easeInOutCirc: function (x, t, b, c, d) {
			if ((t/=d/2) < 1) return -c/2 * (Math.sqrt(1 - t*t) - 1) + b;
			return c/2 * (Math.sqrt(1 - (t-=2)*t) + 1) + b;
		},
		easeInElastic: function (x, t, b, c, d) {
			var s=1.70158;var p=0;var a=c;
			if (t==0) return b;  if ((t/=d)==1) return b+c;  if (!p) p=d*.3;
			if (a < Math.abs(c)) { a=c; s=p/4; }
			else s = p/(2*Math.PI) * Math.asin (c/a);
			return -(a*Math.pow(2,10*(t-=1)) * Math.sin( (t*d-s)*(2*Math.PI)/p )) + b;
		},
		easeOutElastic: function (x, t, b, c, d) {
			var s=1.70158;var p=0;var a=c;
			if (t==0) return b;  if ((t/=d)==1) return b+c;  if (!p) p=d*.3;
			if (a < Math.abs(c)) { a=c; s=p/4; }
			else s = p/(2*Math.PI) * Math.asin (c/a);
			return a*Math.pow(2,-10*t) * Math.sin( (t*d-s)*(2*Math.PI)/p ) + c + b;
		},
		easeInOutElastic: function (x, t, b, c, d) {
			var s=1.70158;var p=0;var a=c;
			if (t==0) return b;  if ((t/=d/2)==2) return b+c;  if (!p) p=d*(.3*1.5);
			if (a < Math.abs(c)) { a=c; s=p/4; }
			else s = p/(2*Math.PI) * Math.asin (c/a);
			if (t < 1) return -.5*(a*Math.pow(2,10*(t-=1)) * Math.sin( (t*d-s)*(2*Math.PI)/p )) + b;
			return a*Math.pow(2,-10*(t-=1)) * Math.sin( (t*d-s)*(2*Math.PI)/p )*.5 + c + b;
		},
		easeInBack: function (x, t, b, c, d, s) {
			if (s == undefined) s = 1.70158;
			return c*(t/=d)*t*((s+1)*t - s) + b;
		},
		easeOutBack: function (x, t, b, c, d, s) {
			if (s == undefined) s = 1.70158;
			return c*((t=t/d-1)*t*((s+1)*t + s) + 1) + b;
		},
		easeInOutBack: function (x, t, b, c, d, s) {
			if (s == undefined) s = 1.70158; 
			if ((t/=d/2) < 1) return c/2*(t*t*(((s*=(1.525))+1)*t - s)) + b;
			return c/2*((t-=2)*t*(((s*=(1.525))+1)*t + s) + 2) + b;
		},
		easeInBounce: function (x, t, b, c, d) {
			return c - this.easeOutBounce (x, d-t, 0, c, d) + b;
		},
		easeOutBounce: function (x, t, b, c, d) {
			if ((t/=d) < (1/2.75)) {
				return c*(7.5625*t*t) + b;
			} else if (t < (2/2.75)) {
				return c*(7.5625*(t-=(1.5/2.75))*t + .75) + b;
			} else if (t < (2.5/2.75)) {
				return c*(7.5625*(t-=(2.25/2.75))*t + .9375) + b;
			} else {
				return c*(7.5625*(t-=(2.625/2.75))*t + .984375) + b;
			}
		},
		easeInOutBounce: function (x, t, b, c, d) {
			if (t < d/2) return this.easeInBounce (x, t*2, 0, c, d) * .5 + b;
			return this.easeOutBounce (x, t*2-d, 0, c, d) * .5 + c*.5 + b;
		}
	};
	
	/**
	 * Raccourci pour l'animation de la collection. Utiliser les constructeurs JSYG.Animation et JSYG.AnimationQueue
	 * pour profiter de l'autocompl�tion. 
	 * @param properties objet décrivant l'état d'arriv�e.
	 * @param options optionnel, objet décrivant les options de l'animation.
	 * 
	 * On peut aussi passer le tout dans un seul argument. L'état d'arriv�e doit alors
	 * être d�crit dans une propriété nomm�e "to".
	 * Pour insérer une pause, il faut passer "delay" en 1er argument, et le nombre
	 * de ms en second argument.
	 * 
	 * @returns {JSYG}
	 * @see JSYG.AnimationQueue JSYG.Animation
	 * @example new JSYG('#divAnime').animate({left:"120px",top:"50px"});<br/>
	 * new JSYG('#divAnime').animate({rotate:90,scale:3},{duration:1000});<br/>
	 * new JSYG('#divAnime').animate({<br/>
	 * 		to:{rotate:90,scale:3},<br/>
	 * 		easing:'swing',<br/>
	 * 		onend:function() { alert('terminé'); }<br/>
	 * });<br/>
	 * new JSYG(window).animate("delay",300).animate({scrollTop:80});
	 */
	JSYG.prototype.animate = function(properties,options) {
		
		var args = arguments,
			method = (typeof properties == 'string') ? properties : null,
			value,opt;
		
		if (!method) {
			
			if (options) {
				opt = JSYG.extend({},options);
				opt.to = properties;
			}
			else if (!('to' in properties)) {
				opt = {to: JSYG.extend({},properties) };
			}
			else opt = JSYG.extend({},properties);
		}
		
		this.each(function() {
		
			var queue = this.data('AnimationQueue'),
				animation;
							
			if (!queue) {
				queue = new JSYG.AnimationQueue();
				this.data('AnimationQueue',queue);
			}
			
			if (method) {
								
				if (method == "get") {
					
					value = queue[args[1]];
					if (typeof value == "function") value =  queue[args[1]]();
					return false;
				}
				else if (queue[method] ) {
					
					if (method.substr(0,1) === '_') throw new Error("La méthode " +  method + " est priv�e.");
					else queue[method].apply(queue,Array.prototype.slice.call(args,1));
				}
				else if (method === 'destroy') {
					
					queue.clear();
					this.dataRemove('AnimationQueue');
				}
				else if (method === 'delay') {
					this.animate(null,args[1] && {duration:args[1]});
				}
				else {
					throw new Error("La méthode " +  method + " n'existe pas ");
				}
			}
			else {
			
				animation = new JSYG.Animation(this.node);
				
				animation.set(opt); 
				
				if (!queue.inProgress()) queue.reset();
							
				queue.add(animation);
				
				if (!queue.inProgress()) queue.play();
			}
			
		},true);
				
		return method == "get" ? value : this;
	};
	
}());