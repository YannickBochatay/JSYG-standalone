JSYG.require('Editor.css','BoundingBox','Path','Draggable','Resizable','Rotatable','Selection','Container','KeyShortCut',function() {
	
	"use strict";
	
	var ctrls = ['Drag','CtrlPoints','MainPoints','Resize','Rotate'];
	var plugins = ['box','selection','clipBoard'];
	
	/**
	 * <strong>nécessite le module Editor</strong>
	 * Edition d'éléments (positionnement, dimensions, rotation, et �dition des formes pour les éléments SVG).
	 * @param arg argument JSYG canvas des éléments � �diter
	 * @param opt optionnel, objet définissant les options.
	 * @returns {JSYG.Editor}
	 */
	JSYG.Editor = function(arg,opt) {
		
		this.ctrlsMainPoints = new MainPoints(this);
		this.ctrlsCtrlPoints = new CtrlPoints(this);
		this.ctrlsResize = new Resize(this);
		this.ctrlsRotate = new Rotate(this);
		this.ctrlsDrag = new Drag(this);
				
		this.selection = new JSYG.Selection();
		this.selection.multiple = false;
		
		this.clipBoard = new ClipBoard(this);
				
		this.box = new JSYG.BoundingBox();
		this.box.className = 'fillBox';
		
		this.container = this.box.container;
				
		this.node = null;
		this.display = false;
		
		this._list = null;
		this._target = null;
		
		this._tempoContainer = new JSYG('<g>').classAdd('tempoContainer').node;
						
		if (arg) this.setNode(arg);
		if (opt) this.enable(opt);
	};
	
	JSYG.Editor.prototype = new JSYG.StdConstruct();
		
	JSYG.Editor.prototype.constructor = JSYG.Editor;
	
	/**
	 * Fonctions � ex�cuter quand on définit une autre cible
	 */
	JSYG.Editor.prototype.onchangetarget = null;
	/**
	 * Fonctions � ex�cuter avant l'affichage de la bo�te d'�dition (renvoyer false pour emp�cher l'�v�nement)
	 */
	JSYG.Editor.prototype.onbeforeshow=null;
	/**
	 * Fonctions � ex�cuter � l'affichage de la bo�te d'�dition
	 */
	JSYG.Editor.prototype.onshow=null;
	/**
	 * Fonctions � ex�cuter avant la suppression de la bo�te d'�dition (renvoyer false pour emp�cher l'�v�nement)
	 */
	JSYG.Editor.prototype.onbeforehide=null;
	/**
	 * Fonctions � ex�cuter � la suppression de la bo�te d'�dition
	 */
	JSYG.Editor.prototype.onhide=null;
	/**
	 * Fonctions � ex�cuter � la mise � jour de la bo�te d'�dition
	 */
	JSYG.Editor.prototype.onupdate=null;
	/**
	 * Fonctions � ex�cuter � chaque fois qu'une action d'�dition se pr�pare, qu'elle est lieu ou non (mousedown sur un contr�le) 
	 */
	JSYG.Editor.prototype.onstart=null;
	/**
	 * Fonctions � ex�cuter � chaque fois qu'une action d'�dition d�bute 
	 */
	JSYG.Editor.prototype.ondragstart=null;
	/**
	 * Fonctions � ex�cuter pendant une action d'�dition 
	 */
	JSYG.Editor.prototype.ondrag=null;
	/**
	 * Fonctions � ex�cuter � la fin d'une action d'�dition 
	 */
	JSYG.Editor.prototype.ondragend=null;
	/**
	 * Fonctions � ex�cuter au rel�chement du bouton de souris, qu'il y ait eu modification ou non
	 */
	JSYG.Editor.prototype.onend=null;
			
	JSYG.Editor.prototype.set = function(options) {
		
		for (var n in options) {
			if (options.hasOwnProperty(n) && (n in this)) {
				if (ctrls.indexOf(n) !== -1 || plugins.indexOf(n) !== -1) this[n].set(options[n]);
				else if (n == 'target' || n == 'list') this[n](options[n]);
				else this[n] = options[n];
			}
		}
		
		return this;
	};
	
	/**
	* définit le canvas d'�dition
	* @param arg argument JSYG
	* @returns {JSYG.Editor}
	*/ 
	JSYG.Editor.prototype.setNode = function(arg) {
		
		JSYG.StdConstruct.prototype.setNode.call(this,arg);
		this.selection.setNode(arg);
		
		return this;
	};
	
	/**
	* définit ou renvoie l'élément � �diter
	* @param arg argument JSYG optionnel, si renseign� définit la cible � �diter
	* @returns {JSYG.Editor,JSYG}
	*/ 
	JSYG.Editor.prototype.target = function(arg,_preventEvent) {
		
		var target,display,container;
		
		if (arg == null) {
			if (!this._target) return null;
			target = new JSYG(this._target);
			return this.isMultiSelection() ? target.children() : target;
		}
					
		display = this.display;
		
		if (display) this.hide(null,true);
		
		target = new JSYG(arg);
		
		if (target.length > 1) {
			
			container = new JSYG.Container(this._tempoContainer)
			.free().remove()
			.appendTo( target.parent() )
			.add(target);
			
			this._target = this._tempoContainer;
			this._oldTargets = container.children();
		}
		else {
			this._target = target.node;
			this._oldTargets = null;
		}
				
		this.box.setNode(this._target);
				
		if (display) this.show(null,true);
		
		if (!_preventEvent) this.trigger('changetarget',this.node,this._target);
		
		return this;
	};
	
	/**
	 * R�initialise la cible
	 */
	JSYG.Editor.prototype.targetRemove = function() {
		
		this._target = null;
	};
	
	/**
	 * Indique si plusieurs éléments sont �dit�s � la fois
	 * @returns {Boolean}
	 */
	JSYG.Editor.prototype.isMultiSelection = function() {
		
		return this._target == this._tempoContainer;
	};
	
	/**
	 * définit ou renvoie la liste des éléments �ditables dans le canvas.
	 */
	JSYG.Editor.prototype.list = null;
	
	if (Object.defineProperty) {
	
		try {
			
			Object.defineProperty(JSYG.Editor.prototype,"list",{
				"get" : function() { return this._list; },
				"set" : function(list) {
					this._list = list;
					this.selection.list = this._list;
				}
			});
		}
		catch(e) {}
	}
		
	/**
	 * Masque le conteneur d'�dition
	 */
	JSYG.Editor.prototype.hide = function(e,_preventEvent) {
		
		if (!_preventEvent && this.trigger("beforehide",this.node,e,this._target) === false) return this;
		
		this.box.hide();

		var ctrl,i,N,container;
		
		for (i=0,N=ctrls.length;i<N;i++) {
			ctrl = this['ctrls'+ctrls[i]];
			if (ctrl && ctrl.enabled) ctrl.hide(_preventEvent);
		}
		
		if (this.isMultiSelection()) {
			
			container = new JSYG.Container(this._tempoContainer);
			container.free().remove();
		}
		
		this.display = false;
		
		if (!_preventEvent) this.trigger('hide',this.node,e,this._target);
		
		return this;
	};
	
	/**
	 * Affiche le conteneur d'�dition
	 * @param e optionnel, objet JSYG.Event afin de commencer tout de suite le d�placement de l'élément
	 * (ainsi sur un m�me �v�nement mousedown on peut afficher le conteneur et commencer le d�placement)
	 * @returns {JSYG.Editor}
	 */
	JSYG.Editor.prototype.show = function(e,_preventEvent) {
		
		if (!_preventEvent && this.trigger("beforeshow",this.node,e,this._target) === false) return this;
		
		if (this.isMultiSelection()) this.target(this._oldTargets,_preventEvent);
		
		this.display = true;
		
		this.box.show();
		
		var ctrl,i,N;
				
		for (i=0,N=ctrls.length;i<N;i++) {
			ctrl = this['ctrls'+ctrls[i]];
			if (ctrl && ctrl.enabled) ctrl.show(_preventEvent);
		}
		
		if (!_preventEvent) this.trigger('show',this.node,e,this._target);

		if ((e instanceof JSYG.Event) && e.type == "mousedown" && this.ctrlsDrag.enabled) this.ctrlsDrag.start(e);
		
		return this;
	};
	
	/**
	 * Mise � jour du conteneur d'�dition. (Si l'élément est modifi� par un autre moyen que les contr�les du conteneur,
	 * il peut s'av�rer utile de mettre � jour le conteneur)
	 * @returns {JSYG.Editor}
	 */
	JSYG.Editor.prototype.update = function(e,_preventEvent) {
				
		if (!this.display) return this;
					
		this.box.update();
		
		var ctrl,i,N;
		
		for (i=0,N=ctrls.length;i<N;i++) {
			ctrl = this['ctrls'+ctrls[i]];
			if (ctrl && ctrl.display) ctrl.update();
		}
		
		if (!_preventEvent) this.trigger('update',this.node,e,this._target);
		
		return this;
	};
	
	/**
	 * Activation des contr�les.<br/>
	 * appelée sans argument, tous les contr�les sont activ�s. Sinon, en arguments (nombre variable) les noms des contr�les � activer
	 * ('Drag','Resize','Rotate','CtrlPoints','MainPoints').
	 */
	JSYG.Editor.prototype.enableCtrls = function() {
		
		if (arguments.length === 0) {
			for (var i=0,N=ctrls.length;i<N;i++) this[ 'ctrls'+ctrls[i] ].enable();
		}
		else {
			
			var that = this;
		
			JSYG.makeArray(arguments).forEach(function(arg) {
				var ctrl = that['ctrls'+ JSYG.ucfirst(arg) ];
				if (ctrl) ctrl.enable();
			});
		}
		
		return this;
	};
	
	/**
	 * D�sactivation des contr�les.<br/>
	 * appelée sans argument, tous les contr�les sont desactiv�s. Sinon, en arguments (nombre variable) les noms des contr�les � desactiver
	 * ('Drag','Resize','Rotate','CtrlPoints','MainPoints').
	 */
	JSYG.Editor.prototype.disableCtrls = function() {
		
		if (arguments.length === 0) {
			for (var i=0,N=ctrls.length;i<N;i++) this[ 'ctrls'+ctrls[i] ].disable();
		}
		else {
			
			var that = this;
			
			JSYG.makeArray(arguments).forEach(function(arg) {
				var ctrl = that['ctrls'+ JSYG.ucfirst(arg) ];
				if (ctrl) ctrl.disable();
			});
		}
		
		return this;
	};
	
	JSYG.Editor.prototype.enable = function(opt) {
		
		var selectFcts,n,
			that = this;
		
		this.disable();
		
		if (opt) this.set(opt);
		
		if (!this._list) this.list = '*';
							
		selectFcts = {
		
			"beforedeselect beforedrag" : function(e) {
				if (e.target == that.container || new JSYG(e.target).isChildOf(that.container)) return false;
			},
			
			"selectover" : function(e,elmt) { new JSYG(elmt).boundingBox('show'); },
			
			"selectout" : function(e,elmt) { new JSYG(elmt).boundingBox('hide'); },
			
			"selectedlist" : function(e,list) {
								
				new JSYG(list).boundingBox("hide");
				
				that.target(list).show(e);
			},
			
			"deselectedlist" : function(e,list) { that.hide(e); }
		};
		
		this.enabled = true;
				
		if (opt) {
			for (n in opt) {
				if (ctrls.indexOf(n) !== -1 || n == "clipBoard") this[n].enable();
			}
		}
				
		this.selection.on(selectFcts).enable();
						
		this.disable = function() {
			this.hide();
			this.selection.off(selectFcts).disable();
			this.enabled = false;
			return this;
		};
		
		return this;
	};
	
	JSYG.Editor.prototype.disable = function() {
		this.hide();
		this.enabled = false;
		return this;
	};
	
	function ClipBoard(editorObject) {
		/**
		 * référence vers l'objet JSYG.Editor parent
		 */
		this.editor = editorObject;
	};
	
	ClipBoard.prototype = new JSYG.StdConstruct();
	
	ClipBoard.prototype.pasteOffset = 10;
	
	ClipBoard.prototype.oncopy = null;
	ClipBoard.prototype.oncut = null;
	ClipBoard.prototype.onpaste = null;
	
	ClipBoard.prototype.enabled = false;
	
	ClipBoard.prototype.buffer = null;
	
	ClipBoard.prototype._parent = null;
	ClipBoard.prototype._multiSelection = null;
	
	ClipBoard.prototype.copy = function() {
		
		var target = new JSYG(this.editor._target);
		
		this._multiSelection = this.editor.isMultiSelection(); 
		
		if (!target.length) return this;
		
		this.buffer = target.clone().node;
		this._parent = target.parent().node;
		
		this.trigger('copy',this.editor.node,target.node,this.buffer.node);
		return this;
	};
		
	ClipBoard.prototype.cut = function() {
		
		var target = new JSYG(this.editor._target);
		
		this._multiSelection = this.editor.isMultiSelection();
		
		if (!target.length) return this;
		
		this.buffer = target.clone().node;
		this._parent = target.parent().node;
		
		this.editor.target().remove();
		
		this.editor.hide();
										
		this.trigger('cut',this.editor.node,this.buffer.node);
		
		return this;
	};
		
	ClipBoard.prototype.paste = function(parent) {
				
		if (!this.buffer) return this;
		
		var clone = new JSYG(this.buffer),
			parent = new JSYG(parent || this._parent),
			children,dim;
						
		clone.appendTo(parent);
		
		dim = clone.getDim(parent);
		
		clone.setDim({
			x : dim.x+this.pasteOffset,
			y : dim.y+this.pasteOffset,
			from : parent
		});
		
		this.buffer = clone.clone().node;
				
		if (this._multiSelection) {
			
			children = clone.children();
			new JSYG.Container(clone).free().remove();
			this.editor.target(children).show(true);
		}
		else this.editor.target(clone).show(true);
						
		this.trigger('paste',this.editor.node,clone.node);
		
		return this;
	};
	
	ClipBoard.prototype.enable = function(opt) {
		
		this.disable();
		
		if (opt) this.set(opt);
		
		var that = this;
		
		var copy = new JSYG.KeyShortCut({
			key:'c',
			specialKeys:'ctrl',
			action : function(e) {
				if (!that.editor.display) return;
				e.preventDefault();
				that.copy();
			}
		});
		
		var cut = new JSYG.KeyShortCut({
			key:'x',
			specialKeys:'ctrl',
			action : function(e) {
				if (!that.editor.display) return;
				e.preventDefault();
				that.cut();
			}
		});
		
		var paste = new JSYG.KeyShortCut({
			key:'v',
			specialKeys:'ctrl',
			action : function(e) {
				if (!that.buffer) return;
				e.preventDefault();
				that.paste();
			}
		});
		
		this.disable = function() {
			copy.disable();
			cut.disable();
			paste.disable();
			this.enabled = false;
			return this;
		};
		
		this.enabled = true;
		return this;
	};
	
	ClipBoard.prototype.disable = function() {
		return this;
	};
	
	
	/**
	 * Edition des points de contr�le des chemins SVG
	 */
	function CtrlPoints(editorObject) {
		/**
		 * référence vers l'objet JSYG.Editor parent
		 */
		this.editor = editorObject;
		/**
		 * liste des contr�les
		 */
		this.list = [];
		/**
		 * Conteneur des contr�les
		 */
		this.container = new JSYG('<g>').node;
	}
	
	CtrlPoints.prototype = {
	
		constructor : CtrlPoints,
		
		container : null,
		/**
		 * Classe appliqu�e au conteneur des contr�les
		 */
		className : 'ctrlPoints',
		/**
		 * Forme utilis�e pour les contr�les
		 */
		shape : 'circle',
		/**
		 * lien utilis� si shape est défini � "use"
		 */
		xlink : null,
		/**
		 * largeur du contr�le
		 */
		width : 10,
		/**
		 * hauteur du contr�le
		 */
		height : 10,
		/**
		 * Points de contr�le li�s ou non (si on en d�place un, l'autre se dp�lace en miroir)
		 */
		linked : true,
		/**
		 * Options suppl�mentaires pour le drag&drop
		 * @see {JSYG.Draggable}
		 */
		draggableOptions:null,
		/**
		 * Fonction(s) � ex�cuter � l'affichage des contr�les
		 */
		onshow:null,
		/**
		 * Fonction(s) � ex�cuter � la suppression des contr�les
		 */
		onhide:null,
		/**
		 * Fonction(s) � ex�cuter quand on pr�pare un d�placement (mousedown sur le contr�le)
		 */
		onstart:null,
		/**
		 * Fonction(s) � ex�cuter quand on commence un d�placement
		 */
		ondragstart:null,
		/**
		 * Fonction(s) � ex�cuter pendant le d�placement
		 */
		ondrag:null,
		/**
		 * Fonction(s) � ex�cuter en fin de d�placement
		 */
		ondragend:null,
		/**
		 * Fonction(s) � ex�cuter au rel�chement de la souris, qu'il y ait eu modification ou non
		 */
		onend:null,
		/**
		 * Indique si les contr�les sont activ�s ou non
		 */
		enabled : false,
		/**
		 * Indique si les contr�les sont affich�s ou non
		 */
		display : false,
		
		set : JSYG.StdConstruct.prototype.set,
		/**
		 * Ajout d'�couteurs d'�v�nements customis�s
		 * @see JSYG.StdConstruct.prototype.on
		 * @returns {CtrlPoints}
		 */
		on : function(evt,fct) { return JSYG.StdConstruct.prototype.on.apply(this,arguments); },
		/**
		 * Retrait d'�couteurs d'�v�nements customis�s
		 * @see JSYG.StdConstruct.prototype.on
		 * @returns {CtrlPoints}
		 */
		off : function(evt,fct) { return JSYG.StdConstruct.prototype.off.apply(this,arguments); },
		/**
		 * D�clenche un �v�nement customis�
		 * @see JSYG.StdConstruct.prototype.trigger
		 */
		trigger : JSYG.StdConstruct.prototype.trigger,
		
		_remove : function(i) {
			
			if (!this.list[i]) return;
			
			var elmts = ['pt1','path1','pt2','path2'],
			that = this;
			
			elmts.forEach(function(elmt) {
				if (that.list[i][elmt]) new JSYG(that.list[i][elmt]).remove();
			});
			
			this.list.splice(i,1);
			
			return this;
		},
		
		/**
		 * Activation des contr�les
		 * @param opt optionnel, objet définissant les options
		 * @returns {CtrlPoints}
		 */
		enable : function(opt) {
						
			this.hide(true);
			
			if (opt) this.set(opt);
			
			var container = this.editor.box.container;
			
			if (container && container.parentNode) this.show();
			
			this.enabled = true;
			
			return this;
		},
		
		/**
		 * D�sactivation des contr�les
		 *  @returns {CtrlPoints}
		 */
		disable : function() {
			
			this.hide();
			this.enabled = false;
			return this;
		},
		
		/**
		 * Affichage des contr�les
		 * @param opt optionnel, objet définissant les options
		 * @returns {CtrlPoints}
		 */
		show : function(opt,_preventEvent) {
						
			if (opt) this.set(opt);
			
			var node = this.editor._target;
			
			if (!node) return this.hide();
			
			this.node = node;
			
			var jNode = new JSYG(node);
			
			if (jNode.getType()!=='svg') return this;
			
			var svg = jNode.offsetParent('farthest'),
				CTM = jNode.getMtx(svg),
				tag = jNode.getTag(),
				needReplace = JSYG.support.needReplaceSeg,
				list = [],N,
				that = this,
				start = function(e){
					new JSYG(that.container).appendTo(that.editor.box.container);
					that.editor.trigger('start',node,e);
					that.trigger('start',node,e);
				},
				dragstart = function(e) {
					that.editor.trigger('dragstart',node,e);
					that.trigger('dragstart',node,e);
				},
				dragend = function(e) {
					that.editor.update();
					that.editor.trigger('dragend',node,e);
					that.trigger('dragend',node,e);
				},
				end = function(e){
					that.editor.trigger('end',node,e);
					that.trigger('end',node,e);
				};
			
			if (!this.container.parentNode) {
				new JSYG(this.container).appendTo(this.editor.box.container).classAdd(this.className);
			}
								
			if (tag === 'path') {
				
				var jPath = new JSYG.Path(node);
				
				jPath.rel2abs();
				
				list = jPath.getSegList();
																
				list.forEach(function(seg,i) {
					
					if (!that.list[i]) { that.list[i] = {}; }
				
					var pt1,pt2,jShape,path,drag,draggable,
					test1 = seg.x1!=null && seg.y1!=null,
					test2 = seg.x2!=null && seg.y2!=null;
										
					if (test1 || test2) {
						
						if (test1) {
								
							pt1 = new JSYG.Vect(seg.x1,seg.y1).mtx(CTM);
							pt2 = jPath.getCurPt(i).mtx(CTM);
							
							if (that.list[i].path1) { path = new JSYG.Path(that.list[i].path1); }
							else { path = new JSYG.Path().appendTo(that.container); }
							
							path.empty().moveTo(pt1.x,pt1.y).lineTo(pt2.x,pt2.y);
							
							that.list[i].path1 = path.node;
							
							drag = function(e) {
								
								var path1 = new JSYG.Path(that.list[i].path1),
								CTM = jPath.getMtx(svg),
								//oldX = seg.x1,
								//oldY = seg.y1,
								jShape = new JSYG(this),
								center = jShape.getCenter(),
								pt = new JSYG.Vect(center.x,center.y).mtx(jShape.getMtx(svg));
								
								path1.replaceSeg(0,'M',pt.x,pt.y);
								pt = pt.mtx(CTM.inverse());
								
								seg.x1 = pt.x;
								seg.y1 = pt.y;
								
								if (i>0 && that.linked) {
									
									var prevSeg = list[i-1];
									
									if (prevSeg.x2!=null && prevSeg.y2!=null) {
										
										//var angleTest1 = Math.atan2(oldY-prevSeg.y,oldX-prevSeg.x),
										//angleTest2 = Math.atan2(oldY-prevSeg.y2,oldX-prevSeg.x2);
										
										//if ( ((angleTest1%Math.PI)*180/Math.PI).toFixed(1) === ((angleTest2%Math.PI)*180/Math.PI).toFixed(1) )
										//{			
											var angle = Math.atan2(seg.y1-prevSeg.y,seg.x1-prevSeg.x)+Math.PI,			
											path2 =new JSYG.Path( that.list[i-1].path2),
											dist = Math.sqrt(Math.pow(prevSeg.x2-prevSeg.x,2) + Math.pow(prevSeg.y2-prevSeg.y,2));
											prevSeg.x2 = prevSeg.x + dist * Math.cos(angle);
											prevSeg.y2 = prevSeg.y + dist * Math.sin(angle);
											
											pt = new JSYG.Vect(prevSeg.x2,prevSeg.y2).mtx(CTM);
											new JSYG(that.list[i-1].pt2).setCenter(pt.x,pt.y);
											path2.replaceSeg(0,'M',pt.x,pt.y);
										//}
									}
								}
								
								needReplace && jPath.replaceSeg(i,seg);
								
								that.editor.trigger('drag',node,e);
								that.trigger('drag',node,e);
							};
							
							
							if (that.list[i].pt1) {
								
								jShape = new JSYG(that.list[i].pt1);
								jShape.draggable('set',{
									event:'direct-left-mousedown',
									onstart:start,
									ondragstart:dragstart,
									ondrag:drag,
									ondragend:dragend,
									onend:end
								});
							}
							else {
								
								jShape = new JSYG('<'+that.shape+'>').appendTo(that.container);
								
								if (that.xlink) jShape.xlink = that.xlink;
								
								jShape.setDim({x:0,y:0,width:that.width,height:that.height});
								
								jShape.draggable('set',{
									event:'direct-left-mousedown',
									onstart:start,
									ondragstart:dragstart,
									ondrag:drag,
									ondragend:dragend,
									onend:end
								});
								
								if (that.draggableOptions) jShape.draggable('set',that.draggableOptions);
								
								jShape.draggable('enable');
								
								that.list[i].pt1 = jShape.node;
							}

							jShape.setCenter(pt1.x,pt1.y);
							
						}
						else {
							if (that.list[i].pt1) { new JSYG(that.list[i].pt1).remove();  that.list[i].pt1 = null; }
							if (that.list[i].path1) { new JSYG(that.list[i].path1).remove();  that.list[i].path1 = null; }
						}
						
						if (test2) {
							
							pt1 = new JSYG.Vect(seg.x2,seg.y2).mtx(CTM);
							pt2 = new JSYG.Vect(seg.x,seg.y).mtx(CTM);
							
							if (that.list[i].path2) { path = new JSYG.Path(that.list[i].path2); }
							else { path = new JSYG.Path().appendTo(that.container); }
							
							path.empty().moveTo(pt1.x,pt1.y).lineTo(pt2.x,pt2.y);
							
							that.list[i].path2 = path.node;
							
							drag = function(e) {
							
								var path2 = new JSYG.Path(that.list[i].path2),
								CTM = jPath.getMtx(svg),
								jShape = new JSYG(this),
								//oldX = seg.x2,
								//oldY = seg.y2,
								center = jShape.getCenter(),
								pt = new JSYG.Vect(center.x,center.y).mtx(jShape.getMtx(svg));
																
								path2.replaceSeg(0,'M',pt.x,pt.y);
								
								pt = pt.mtx(CTM.inverse());
								seg.x2 = pt.x;
								seg.y2 = pt.y;
								
								if (i+1<list.length && that.linked) {
									
									var nextSeg = list[i+1];
									
									if (nextSeg.x1!=null && nextSeg.y1!=null) {
										
										//var angleTest1 = Math.atan2(oldY-seg.y,oldX-seg.x),
										//angleTest2 = Math.atan2(oldY-nextSeg.y1,oldX-nextSeg.x1);

										//if ( ((angleTest1%Math.PI)*180/Math.PI).toFixed(1) === ((angleTest2%Math.PI)*180/Math.PI).toFixed(1) )
										//{			
											var angle = Math.atan2(seg.y2-seg.y,seg.x2-seg.x)+Math.PI,
											path1 = new JSYG.Path(that.list[i+1].path1),
											dist = Math.sqrt(Math.pow(nextSeg.x1-seg.x,2) + Math.pow(nextSeg.y1-seg.y,2));
											nextSeg.x1 = seg.x + dist * Math.cos(angle);
											nextSeg.y1 = seg.y + dist * Math.sin(angle);
											
											pt = new JSYG.Vect(nextSeg.x1,nextSeg.y1).mtx(CTM);
											new JSYG(that.list[i+1].pt1).setCenter(pt.x,pt.y);
											path1.replaceSeg(0,'M',pt.x,pt.y);
										//}
									}
								}
								
								needReplace && jPath.replaceSeg(i,seg);
								
								that.editor.trigger('drag',node,e);
								that.trigger('drag',node,e);
							};
							
							if (that.list[i].pt2) {
								jShape = new JSYG(that.list[i].pt2);
								jShape.draggable('set',{
									event:'direct-left-mousedown',
									onstart:start,
									ondragstart:dragstart,
									ondrag:drag,
									ondragend:dragend,
									onend:end
								});
							}
							else {
								
								jShape = new JSYG('<'+that.shape+'>').appendTo(that.container);
								if (that.xlink) { jShape.xlink = that.xlink; }
								jShape.setDim({x:0,y:0,width:that.width,height:that.height});

								jShape.draggable('set',{
									event:'direct-left-mousedown',
									onstart:start,
									ondragstart:dragstart,
									ondrag:drag,
									ondragend:dragend,
									onend:end
								});
								if (that.draggableOptions) { jShape.draggable('set',that.draggableOptions); }
								jShape.draggable('enable');
								that.list[i].pt2 = jShape.node;
							}
						
							jShape.setCenter(pt1.x,pt1.y);
						}
						else {
							if (that.list[i].pt2) { new JSYG(that.list[i].pt2).remove();  that.list[i].pt2 = null; }
							if (that.list[i].path2) { new JSYG(that.list[i].path2).remove();  that.list[i].path2 = null; }
						}
					}
					else {
						that._remove(i);
						that.list.splice(i,0,null);
					}
				});
			}
			/*else if (tag === 'rect') {
				
				var drag,
				pt,pt1,pt2,
				l = jNode.getDim();
				l.rx = parseFloat(jNode.attr('rx') || 0);
				l.ry = parseFloat(jNode.attr('ry') || 0);
				
				list = [0,1,2,3];
								
				list.forEach(function(i) {
				
					if (!that.list[i]) { that.list[i] = {}; };
					
					if (!that.list[i].path) {
						var path = new JSYG.Path().appendTo(that.container);
						path.classAdd(that.className);
						that.list[i].path = path.node;
					}
					
					if (!that.list[i].pt) {
					
						var point = new JSYG('<'+that.shape+'>').appendTo(that.container);
						point.classAdd(that.className);
						that.list[i].pt = point.node;
						
						drag = function(e) {
						
							var center = point.getCenter().mtx(point.getMtx()),
							pt1 = new JSYG.Vect(center.x,center.y).mtx(jNode.getMtx('ctm').inverse()),
							rx, ry,
							path = new JSYG.Path(that.list[i].path),
							l = jNode.getDim();
							
							path.empty();
							
							switch(i) {
								case 0 :
									rx = Math.max(0,pt1.x - l.x);
									ry = Math.max(0,pt1.y - l.y);
									path.moveTo(l.x,l.y+ry).lineTo(pt1.x,pt1.y).lineTo(l.x+rx,l.y);
									break;
								case 1 :
									rx = Math.max(0,l.x+l.width-pt1.x);
									ry = Math.max(0,pt1.y - l.y);
									path.moveTo(l.x+l.width-rx,l.y).lineTo(pt1.x,pt1.y).lineTo(l.x+l.width,l.y+ry);
									break;
								case 2 :
									rx = Math.max(0,l.x+l.width - pt1.x);
									ry = Math.max(0,l.y+l.height - pt1.y);
									path.moveTo(l.x+l.width,l.y+l.height-ry).lineTo(pt1.x,pt1.y).lineTo(l.x+l.width-rx,l.y+l.height);
									break;
								case 3 :
									rx = Math.max(0,pt1.x - l.x);
									ry = Math.max(0,l.y+l.height - pt1.y);
									path.moveTo(l.x+rx,l.y+l.height).lineTo(pt1.x,pt1.y).lineTo(l.x,l.y+l.height-ry);
									break;
							}
						
							jNode.attr({'rx':rx,'ry':ry});
							
							that.editor.trigger('drag',node,e);
							that.trigger('drag',node,e);
						};
						
						point.draggable({
							type:'attributes',
							ondrag:drag,
							onend:end
						});
					}
					
				});
				
				pt = new JSYG.Vect(l.x+l.rx,l.y+l.ry).mtx(CTM);
				pt1 = new JSYG.Vect(l.x,l.y+l.ry).mtx(CTM);
				pt2 = new JSYG.Vect(l.x+l.rx,l.y).mtx(CTM);
				new JSYG(this.list[0].pt).setDim({x:0,y:0,width:this.width,height:this.height}).setCenter(pt.x,pt.y);
				new JSYG.Path(this.list[0].path).empty().moveTo(pt1.x,pt1.y).lineTo(pt.x,pt.y).lineTo(pt2.x,pt2.y);
				
				pt = new JSYG.Vect(l.x+l.width-l.rx,l.y+l.ry).mtx(CTM);
				pt1 = new JSYG.Vect(l.x+l.width-l.rx,l.y).mtx(CTM);
				pt2 = new JSYG.Vect(l.x+l.width,l.y+l.ry).mtx(CTM);
				new JSYG(this.list[1].pt).setDim({x:0,y:0,width:this.width,height:this.height}).setCenter(pt.x,pt.y);
				new JSYG.Path(this.list[1].path).empty().moveTo(pt1.x,pt1.y).lineTo(pt.x,pt.y).lineTo(pt2.x,pt2.y);
								
				pt = new JSYG.Vect(l.x+l.width-l.rx,l.y+l.height-l.ry).mtx(CTM);
				pt1 = new JSYG.Vect(l.x+l.width-l.rx,l.y+l.height).mtx(CTM);
				pt2 = new JSYG.Vect(l.x+l.width,l.y+l.height-l.ry).mtx(CTM);
				new JSYG(this.list[2].pt).setDim({x:0,y:0,width:this.width,height:this.height}).setCenter(pt.x,pt.y);
				new JSYG.Path(this.list[2].path).clea.emptyveTo(pt1.x,pt1.y).lineTo(pt.x,pt.y).lineTo(pt2.x,pt2.y);
				
				pt = new JSYG.Vect(l.x+l.rx,l.y+l.height-l.ry).mtx(CTM);
				pt1 = new JSYG.Vect(l.x,l.y+l.height-l.ry).mtx(CTM);
				pt2 = new JSYG.Vect(l.x+l.rx,l.y+l.height).mtx(CTM);
				new JSYG(this.list[3].pt).setDim({x:0,y:0,width:this.width,height:this.height}).setCenter(pt.x,pt.y);
				new JSYG.Path(this.list[3].path).empty().moveTo(pt1.x,pt1.y).lineTo(pt.x,pt.y).lineTo(pt2.x,pt2.y);
			}*/
			
			N = list.length;
			while (this.list.length > N) this._remove(this.list.length-1);
			
			this.display = true;
			
			if (!_preventEvent) this.trigger('show',node);
						
			return this;
		},
		
		/**
		 * Masque les contr�les
		 * @returns {CtrlPoints}
		 */
		hide : function(_preventEvent) {
		
			new JSYG(this.container).empty().remove();
			this.list.splice(0,this.list.length);
			this.display = false;
			if (!_preventEvent) this.trigger('hide',this.node);
			return this;
		},
		/**
		 * Met � jour les contr�les
		 * @returns {CtrlPoints}
		 */
		update : function() { return this.display ? this.show() : this; }
	};
	
	/**
	 * Edition des points principaux des chemins SVG 
	 */
	function MainPoints(editorObject) {
		/**
		 * référence vers l'objet JSYG.Editor parent
		 */
		this.editor = editorObject;
		/**
		 * liste des contr�les
		 */
		this.list = [];
		/**
		 * Conteneur des contr�les
		 */
		this.container = new JSYG('<g>').node;
	};
	
	MainPoints.prototype = {
	
		constructor : MainPoints,
		/**
		 * Classe appliqu�e au conteneur des contr�les
		 */
		className : 'mainPoints',
		/**
		 * Forme utilis�e pour les contr�les
		 */
		shape : 'circle',
		/**
		 * largeur des contr�les
		 */
		width:10,
		/**
		 * hauteur des contr�les
		 */
		height:10,
		/**
		 * classe appliqu�e au dernier point d'un chemin si le chemin est ferm�
		 */
		classNameClosing : 'closingPoint',
		/**
		 * Force de la magn�tisation entre les points extr�mes pour fermer le chemin 
		 */
		strengthClosingMagnet : 10,
		/**
		 * Lisse automatiquement les chemins
		 */
		autoSmooth : false,
		/**
		 * Fonction(s) � ex�cuter � l'affichage des contr�les
		 */
		onshow:null,
		/**
		 * Fonction(s) � ex�cuter � la suppression des contr�les
		 */
		onhide:null,
		/**
		 * Fonction(s) � ex�cuter quand on pr�pare un d�placement (mousedown sur le contr�le)
		 */
		onstart:null,
		/**
		 * Fonction(s) � ex�cuter quand on commence un d�placement
		 */
		ondragstart:null,
		/**
		 * Fonction(s) � ex�cuter pendant le d�placement
		 */
		ondrag:null,
		/**
		 * Fonction(s) � ex�cuter en fin de d�placement
		 */
		ondragend:null,
		/**
		 * Fonction(s) � ex�cuter au rel�chement de la souris, qu'il y ait eu modification ou non
		 */
		onend:null,
		
		/**
		 * Options suppl�mentaires pour le drag&drop
		 * @see {JSYG.Draggable}
		 */
		draggableOptions : null,
		
		set : JSYG.StdConstruct.prototype.set,
		/**
		 * Ajout d'�couteurs d'�v�nements customis�s
		 * @see JSYG.StdConstruct.prototype.on
		 * @returns {MainPoints}
		 */
		on : function(evt,fct) { return JSYG.StdConstruct.prototype.on.apply(this,arguments); },
		/**
		 * Retrait d'�couteurs d'�v�nements customis�s
		 * @see JSYG.StdConstruct.prototype.on
		 * @returns {MainPoints}
		 */
		off : function(evt,fct) { return JSYG.StdConstruct.prototype.off.apply(this,arguments); },
		/**
		 * D�clenche un �v�nement customis�
		 * @see JSYG.StdConstruct.prototype.trigger
		 */
		trigger : JSYG.StdConstruct.prototype.trigger,
		
		/**
		 * Indique si les contr�les sont activ�s ou non
		 */
		enabled : false,
		/**
		 * Indique si les contr�les sont affich�s ou non
		 */
		display : false,
		
		_remove : function(i) {
			
			if (!this.list[i]) return;
			new JSYG(this.list[i]).remove();
			this.list.splice(i,1);
			return this;
		},
		
		/**
		 * Activation des contr�les
		 * @param opt optionnel, objet définissant les options
		 * @returns {MainPoints}
		 */
		enable : function(opt) {
			
			this.hide(true);
			
			if (opt) this.set(opt);
			
			var container = this.editor.box.container; 
			
			if (container && container.parentNode) this.show();
			
			this.enabled = true;
		},
		
		/**
		 * D�sactivation des contr�les
		 *  @returns {MainPoints}
		 */
		disable : function() {
			this.hide();
			this.enabled = false;
		},
		
		/**
		 * Affichage des contr�les
		 * @param opt optionnel, objet définissant les options
		 * @returns {MainPoints}
		 */
		show : function(opt,_preventEvent) {
							
			if (opt) this.set(opt);
			
			var node = this.editor._target;
			
			if (!node || this.editor.isMultiSelection() && !this.multiple) return this.hide();
			
			this.node = node;
									
			var jNode = new JSYG(node);
			
			if (jNode.getType()!=='svg') return;
			
			var svg = jNode.offsetParent('farthest'),
				CTM = jNode.getMtx(svg),
				tag = jNode.getTag(),
				list=[],N,
				that = this,
				needReplace = JSYG.support.needReplaceSeg,
				start = function(e){
					new JSYG(that.container).appendTo(that.editor.box.container);
					that.editor.trigger('start',node,e);
					that.trigger('start',node,e);
				},
				dragstart = function(e) {
					that.editor.trigger('dragstart',node,e);
					that.trigger('dragstart',node,e);
				},
				dragend = function(e) {
					that.editor.update();
					that.editor.trigger('dragend',node,e);
					that.trigger('dragend',node,e);
				},
				end = function(e){
					that.editor.trigger('end',node,e);
					that.trigger('end',node,e);
				};
			
			if (!this.container.parentNode) {
				new JSYG(this.container).appendTo(this.editor.box.container).classAdd(this.className);
			}
							
			if (tag === 'path') {
				
				jNode = new JSYG.Path(node);
				list = jNode.getSegList();
				
				var isClosed = jNode.isClosed(),
					mtxScreen,
					ctrlPoints = this.editor.ctrlsCtrlPoints.list;
				
				//on �crase la fonction start
				start = function(e){
					new JSYG(that.container).appendTo(that.editor.box.container);
					isClosed = jNode.isClosed();
					mtxScreen = jNode.getMtx('screen');
					that.editor.trigger('start',node,e);
					that.trigger('start',node,e);
				},
				
				jNode.rel2abs();
				
				list.forEach(function(seg,i) {

					if (seg.x!=null && seg.y!=null) {
						
						var pt = new JSYG.Vect(seg.x,seg.y).mtx(CTM),
							shape,drag;
						
						if (that.list[i]) shape = new JSYG(that.list[i]);
						else {
							
							drag = function(e) {
								
								var seg = jNode.getSeg(i), //we must redefine seg if pathSegList has been modified
									jPoint = new JSYG(this),
									selfCTM = jNode.getMtx(svg),
									center = jPoint.getCenter(),
									posPt = new JSYG.Vect(center.x,center.y).mtx(jPoint.getMtx()), //position dans le rep�re d'�dition
									pt = posPt.mtx(selfCTM.inverse()), //position dans le rep�re de l'élément �dit�
									decX = pt.x-seg.x,
									decY = pt.y-seg.y,
									item,pt1,pt2,
									firstSeg = jNode.getSeg(0),
									lastSeg = jNode.getLastSeg();
																	
								if (seg === lastSeg && isClosed) {
									firstSeg.x = pt.x;
									firstSeg.y = pt.y;
									new JSYG(that.list[0]).setCenter(posPt.x,posPt.y);
									needReplace && jNode.replaceSeg(0,jNode.getSeg(firstSeg));
								}
								
								if (that.strengthClosingMagnet!=null && (seg === lastSeg || seg === firstSeg)) {
									
									var segRef = (seg === lastSeg) ? firstSeg : lastSeg;
									var ref = new JSYG.Vect(segRef.x,segRef.y).mtx(mtxScreen);
									
									if (Math.sqrt(Math.pow(ref.x - e.clientX,2)+Math.pow(ref.y-e.clientY,2)) < that.strengthClosingMagnet) {
										pt.x = segRef.x;
										pt.y = segRef.y;
										var mtx = jNode.getMtx(jPoint);
										jPoint.setCenter( new JSYG.Vect(pt.x,pt.y).mtx(mtx) );
									}
								}

								
								seg.x = pt.x;
								seg.y = pt.y;
								
								if (that.autoSmooth && !that.editor.ctrlsCtrlPoints.enabled) jNode.autoSmooth(i);
								else {
																
									if (seg.x2!=null && seg.y2!=null) {
										
										seg.x2+=decX;
										seg.y2+=decY;
										pt1 = new JSYG.Vect(seg.x2,seg.y2).mtx(selfCTM);
										pt2 = new JSYG.Vect(seg.x,seg.y).mtx(selfCTM);
																				
										if (that.editor.ctrlsCtrlPoints.enabled && (item = ctrlPoints[i])) {
																		
											new JSYG.Path(item.path2)
											.replaceSeg(0, 'M',pt1.x,pt1.y)
											.replaceSeg(1, 'L',pt2.x,pt2.y);
																					
											new JSYG(item.pt2).setCenter(pt1.x,pt1.y);
										}
									}
									
									if (i < jNode.nbSegs()-1) {
									
										var next = jNode.getSeg(i+1);
										
										if (next.x1!=null && next.y1!=null) {
										
											next.x1+=decX;
											next.y1+=decY;
											pt1 = new JSYG.Vect(next.x1,next.y1).mtx(selfCTM);
											pt2 = new JSYG.Vect(seg.x,seg.y).mtx(selfCTM);
											
											if (that.editor.ctrlsCtrlPoints.enabled && (item = ctrlPoints[i+1])) {
																						
												new JSYG.Path(item.path1)
												.replaceSeg(0,'M',pt1.x,pt1.y)
												.replaceSeg(1,'L',pt2.x,pt2.y);
												
												new JSYG(item.pt1).setCenter(pt1.x,pt1.y);
											}
										}
									}
									
									needReplace && jNode.replaceSeg(i,seg);
								}
								
								that.editor.trigger('drag',node,e);
								that.trigger('drag',node,e);
							};
						
							shape = new JSYG('<'+that.shape+'>').appendTo(that.container);
							
							if (that.xlink) shape.xlink = that.xlink;
							
							shape.setDim({x:0,y:0,width:that.width,height:that.height});
							
							shape.draggable('set',{
								event:'direct-left-mousedown',
								onstart:start,
								ondragstart:dragstart,
								ondrag:drag,
								ondragend:dragend,
								onend:end
							});
							
							if (that.draggableOptions) shape.draggable('set',that.draggableOptions);
							
							shape.draggable('enable');
							
							that.list[i] = shape.node;
						}
						
						shape.setCenter(pt.x,pt.y);
					}
					else if (that.list[i]) that._remove(i);
				});
				
				//adaptation des points extr�mes pour courbes ferm�es/ouvertes
				var first = new JSYG(that.list[0]),
					last = new JSYG(that.list[that.list.length-1]),
					center = first.getCenter();
				
				first.setDim({
					width : that.width * (isClosed ? 1.2 : 1),
					height : that.height * (isClosed ? 1.2 : 1)
				});
				
				first.setCenter(center.x,center.y);
				
				center = last.getCenter();
				
				last.setDim({
					width : that.width * (isClosed ? 0.6 : 1),
					height : that.height * (isClosed ? 0.6 : 1)
				});
				
				last.setCenter(center.x,center.y);
				
				last['class'+(isClosed ? 'Add':'Remove')](this.classNameClosing);
				
			}
			else if (tag === 'polyline' || tag === 'polygon') {
				
				list = JSYG.makeArray(node.points);
				
				list.forEach(function(point,i) {
				
					point = new JSYG.Vect(point).mtx(CTM);
					var shape,drag;
						
					if (that.list[i]) shape = new JSYG(that.list[i]);
					else {
						
						drag = function(e) {
					
							var point = node.points.getItem(i), //we must redefine point if points has been modified
								jPoint = new JSYG(this),
								selfCTM = jNode.getMtx(svg),
								center = jPoint.getCenter(),
								pt = new JSYG.Vect(center.x,center.y).mtx(jPoint.getMtx());
								pt = pt.mtx(selfCTM.inverse());
														
							point.x = pt.x;
							point.y = pt.y;
														
							that.editor.trigger('drag',node,e);
							that.trigger('drag',node,e);
						};
						
						shape = new JSYG('<'+that.shape+'>').appendTo(that.container);
						shape.setDim({x:0,y:0,width:that.width,height:that.height});
						shape.draggable('set',{
							event:'direct-left-mousedown',
							onstart:start,
							ondragstart:dragstart,
							ondrag:drag,
							ondragend:dragend,
							onend:end
						});
						
						if (that.draggableOptions) shape.draggable('set',that.draggableOptions);
						
						shape.draggable('enable');
						that.list[i] = shape.node;
					}
					
					shape.setCenter(point.x,point.y);
				});						
			}
			else if (tag === 'line') {
				
				list = [1,2];
				
				list.forEach(function(attr,i) {
					
					var point = new JSYG.Vect(jNode.attr('x'+attr),jNode.attr('y'+attr)).mtx(CTM),
					shape,drag;
						
					if (that.list[i]) shape = new JSYG(that.list[i]);
					else {
						
						drag = function(e) {
					
							var jPoint = new JSYG(this),
							selfCTM = jNode.getMtx(svg),
							center = jPoint.getCenter(),
							pt = new JSYG.Vect(center.x,center.y).mtx(jPoint.getMtx());
							pt = pt.mtx(selfCTM.inverse());
							
							jNode.attr("x"+attr,pt.x).attr("y"+attr,pt.y);
							
							that.editor.trigger('drag',node,e);
							that.trigger('drag',node,e);
						};
						
						shape = new JSYG('<'+that.shape+'>').appendTo(that.container);
						shape.setDim({x:0,y:0,width:that.width,height:that.height});
						
						shape.draggable('set',{
							event:'direct-left-mousedown',
							onstart:start,
							ondragstart:dragstart,
							ondrag:drag,
							ondragend:dragend,
							onend:end
						});
						
						if (that.draggableOptions) shape.draggable('set',that.draggableOptions);
						
						shape.draggable('enable');
						that.list[i] = shape.node;					
					}
					
					shape.setCenter(point.x,point.y);
				});
			}
			
			N = list.length;
			while (this.list.length > N) this._remove(this.list.length-1);
			
			this.display = true;
			
			if (_preventEvent) this.trigger('show',node);
			
			return this;
		},
		
		/**
		 * Masque les contr�les
		 * @returns {MainPoints}
		 */
		hide : function(_preventEvent) {
			
			if (this.container) new JSYG(this.container).empty().remove();
			this.list.splice(0,this.list.length);
			this.display = false;
			if (!_preventEvent) this.trigger('hide',this.node);
			return this;
		},
	
		/**
		 * Met � jour les contr�les
		 * @returns {MainPoints}
		 */
		update : function() { return this.display ? this.show() : this; }
	};

	/**
	 * D�placement de l'élément
	 */
	var Drag = function(editorObject) {
		/**
		 * référence vers l'objet JSYG.Editor parent
		 */
		this.editor = editorObject;
	};
	
	Drag.prototype = {
		
		constructor : Drag,
		/**
		 * Type de d�placement ("attributes" ou "transform" pour agir sur les attributs de mise en page ou sur la matrice de transformation)
		 */
		type : 'attributes',
		/**
		* Permet de limiter le d�placement � l'int�rieur de l'offsetParent (null pour annuler, valeur num�rique n�gative pour aller au del� de l'offsetParent)
		*/
		bounds : null,
		/**
		 * Options suppl�mentaires pour le drag&drop
		 * @see {JSYG.Draggable}
		 */
		options : null,
		/**
		 * Indique si ce contr�le est actif dans le cas d'une s�lection multiple
		 */
		multiple : true,
		/**
		 * Fonction(s) � ex�cuter quand on pr�pare un d�placement (mousedown sur le contr�le)
		 */
		onstart:null,
		/**
		 * Fonction(s) � ex�cuter quand on commence un d�placement
		 */
		ondragstart:null,
		/**
		 * Fonction(s) � ex�cuter pendant le d�placement
		 */
		ondrag:null,
		/**
		 * Fonction(s) � ex�cuter en fin de d�placement
		 */
		ondragend:null,
		/**
		 * Fonction(s) � ex�cuter au rel�chement de la souris, qu'il y ait eu d�placement ou non
		 */
		onend:null,
		
		set : JSYG.StdConstruct.prototype.set,//function(opt) { return JSYG.StdConstruct.prototype.set.apply(this,arguments); },
		/**
		 * Ajout d'�couteurs d'�v�nements customis�s
		 * @see JSYG.StdConstruct.prototype.on
		 * @returns {Drag}
		 */
		on : function(evt,fct) { return JSYG.StdConstruct.prototype.on.apply(this,arguments); },
		/**
		 * Retrait d'�couteurs d'�v�nements customis�s
		 * @see JSYG.StdConstruct.prototype.on
		 * @returns {Drag}
		 */
		off : function(evt,fct) { return JSYG.StdConstruct.prototype.off.apply(this,arguments); },
		/**
		 * D�clenche un �v�nement customis�
		 * @see JSYG.StdConstruct.prototype.trigger
		 */
		trigger : JSYG.StdConstruct.prototype.trigger,

		/**
		 * Indique si le contr�ls est activ� ou non
		 */
		enabled : false,
		/**
		 * Indique si le contr�le est affich� ou non
		 */
		display : false,
		
		/**
		 * Activation du contr�le
		 * @param opt optionnel, objet définissant les options
		 */
		enable : function(opt) {
			
			this.hide();
			
			if (opt) this.set(opt);
			
			var container = this.editor.box.container; 
			
			if (container && container.parentNode) this.show();
			
			this.enabled = true;
			
			return this;
		},
		/**
		 * D�sactivation du contr�le
		 * @returns {Drag}
		 */
		disable : function() {
			this.hide();
			this.enabled = false;
			return this;
		},
		/**
		 * commence le drag&drop
		 * @param e objet JSYG.Event
		 * @returns {Drag}
		 */
		start : function(e) {
			if (!this.display) return this;
			new JSYG(this.node).draggable('start',e);
			return this;
		},
		/**
		 * Affiche le contr�le
		 * @param opt optionnel, objet définissant les options
		 * @returns
		 */
		show : function(opt) {
						
			this.hide();
			
			if (opt) this.set(opt);
									
			var node = this.editor._target;
			if (!node || this.editor.isMultiSelection() && !this.multiple) return;
			
			this.node = node;
			
			var jNode = new JSYG(node),
				field = new JSYG( jNode.getType() ==='svg' ? this.editor.box.pathBox : this.editor.box.container ),
				backup,
				displayShadow = this.editor.box.displayShadow,
				that = this;
							
			jNode.draggable('set',{
				event:'left-mousedown',
				onstart : function(e) {
					backup = {
						ctrlsMainPoints : that.editor.ctrlsMainPoints.enabled,
						ctrlsCtrlPoints : that.editor.ctrlsCtrlPoints.enabled
					};
					that.editor.trigger('start',node,e);
					that.trigger('start',node,e);
				},
				ondragstart : function(e) {
					for (var n in backup) {
						if (!backup[n]) continue;
						new JSYG(that.editor[n].container).hide();
						that.editor[n].display = false;
					}
					that.editor.box.displayShadow = false;
					that.editor.trigger('dragstart',node,e);
					that.trigger('dragstart',node,e);
				},
				ondrag : function(e){
					that.editor.update();
					that.editor.trigger('drag',node,e);
					that.trigger('drag',node,e);
				},
				ondragend : function(e){
					if (that.editor.isMultiSelection()) new JSYG.Container(that.editor._target).applyTransform();
					that.editor.displayShadow = displayShadow;
					for (var n in backup){
						if (!backup[n]) continue;
						new JSYG(that.editor[n].container).show();
						that.editor[n].display = true;
					}
					that.editor.update();
					that.editor.trigger('dragend',node,e);
					that.trigger('dragend',node,e);
				},
				onend : function(e){
					that.editor.trigger('end',node,e);
					that.trigger('end',node,e);
				},
				type : this.type,
				bounds : this.bounds,
				field : field,
				click : 'left',
				keepRotation:true,
				key : false
			});
				
			if (this.options) jNode.draggable('set',this.options);
						
			jNode.draggable('enable');
							
			field.css('cursor','move');
			
			this.display = true;
						
			return this;
		},
		/**
		 * Masque le contr�le
		 * @returns {Drag}
		 */
		hide : function() {
			
			if (this.node) new JSYG(this.node).draggable('disable');
			this.display = false;
			return this;
		},
		/**
		 * Met � jour le contr�le
		 * @returns {Drag}
		 */
		update : function() {
						
			if (!this.display) return this;
			
			var node = this.editor._target;
			if (!node) return this.hide();
			
			this.node = node;
			
			return this;
		}
	};
	
	/**
	 * Edition des dimensions
	 */
	var Resize = function(editorObject) {
		/**
		 * référence vers l'objet JSYG.Editor parent
		 */
		this.editor = editorObject;
		/**
		 * liste des contr�les
		 */
		this.list = [];
		/**
		 * liste des paliers horizontaux (largeurs en px)
		 */
		this.stepsX = [];
		/**
		 * liste des paliers verticaux (hauteurs en px)
		 */
		this.stepsY = [];
		/**
		 * Conteneur des contr�les
		 */
		this.container = new JSYG('<g>').node;
	};
	
	Resize.prototype = {
	
		constructor : Resize,
		
		container : null,
		
		/**
		 * Classe appliqu�e au conteneur des contr�les
		 */
		className : 'resize',
		/**
		 * Forme utilis�e pour les contr�les
		 */
		shape : 'circle',
		/**
		 * lien utilis� si shape est défini � "use"
		 */
		xlink : null,
		/**
		 * largeur des contr�les
		 */
		width:10,
		/**
		 * hauteur des contr�les
		 */
		height:10,
		/**
		 * Type de d�placement ("attributes" ou "transform" pour agir sur les attributs de mise en page ou sur la matrice de transformation)
		 */
		type : 'attributes',
		/**
		 * Indique si ce contr�le est actif dans le cas d'une s�lection multiple
		 */
		multiple : false,
		/**
		 * Fonction(s) � ex�cuter � l'affichage des contr�les
		 */
		onshow:null,
		/**
		 * Fonction(s) � ex�cuter � la suppression des contr�les
		 */
		onhide:null,
		/**
		 * Fonction(s) � ex�cuter quand on pr�pare un d�placement (mousedown sur le contr�le)
		 */
		onstart:null,
		/**
		 * Fonction(s) � ex�cuter quand on commence un d�placement
		 */
		ondragstart:null,
		/**
		 * Fonction(s) � ex�cuter pendant le d�placement
		 */
		ondrag:null,
		/**
		 * Fonction(s) � ex�cuter en fin de d�placement
		 */
		ondragend:null,
		/**
		 * Fonction(s) � ex�cuter au rel�chement de la souris, qu'il y ait eu modification ou non
		 */
		onend:null,
		/**
		 * définit si l'élément est redimensionnable horizontalement
		 */
		horizontal : true,
		/**
		 * définit si l'élément est redimensionnable verticalement
		 */
		vertical : true,
		/**
		 * définit si le ratio doit �tre conservé
		 */
		keepRatio : false,
		/**
		* Permet de limiter le redimensionnement � l'int�rieur de l'offsetParent (null pour annuler, valeur num�rique n�gative pour aller au del� de l'offsetParent)
		*/
		bounds : null,
		/**
		 * Options suppl�mentaires pour le redimensionnement
		 * @see {JSYG.Resizable}
		 */
		options : null,
				
		set : JSYG.StdConstruct.prototype.set,
		/**
		 * Ajout d'�couteurs d'�v�nements customis�s
		 * @see JSYG.StdConstruct.prototype.on
		 * @returns {Resize}
		 */
		on : function(evt,fct) { return JSYG.StdConstruct.prototype.on.apply(this,arguments); },
		/**
		 * Retrait d'�couteurs d'�v�nements customis�s
		 * @see JSYG.StdConstruct.prototype.on
		 * @returns {Resize}
		 */
		off : function(evt,fct) { return JSYG.StdConstruct.prototype.off.apply(this,arguments); },
		/**
		 * D�clenche un �v�nement customis�
		 * @see JSYG.StdConstruct.prototype.trigger
		 */
		trigger : JSYG.StdConstruct.prototype.trigger,
		/**
		 * Indique si les contr�les sont activ�s ou non
		 */
		enabled : false,
		/**
		 * Indique si les contr�les sont affich�s ou non
		 */
		display : false,
		/**
		 * Activation des contr�les
		 * @param opt optionnel, objet définissant les options
		 * @returns {Resize}
		 */
		enable : function(opt) {
			this.hide(true);
			if (opt) this.set(opt);
			var container = this.editor.box.container;
			if (container && container.parentNode) this.show();
			this.enabled = true;
		},
		/**
		 * D�sactivation des contr�les
		 *  @returns {Resize}
		 */
		disable : function() {
			this.hide();
			this.enabled = false;
		},
		/**
		 * Affichage des contr�les
		 * @param opt optionnel, objet définissant les options
		 * @returns {Resize}
		 */
		show : function(opt,_preventEvent) {
			
			this.hide(true);
				
			if (opt) this.set(opt);
			
			var node = this.editor._target;
			if (!node || this.editor.isMultiSelection() && !this.multiple) return this.hide();
			this.node = node;
						
			var jNode = new JSYG(node),
				type = jNode.getType(),
				parent = (type == 'svg') ? this.editor.box.container : document.body;
			
			if (type === 'svg' && this.container.tagName == 'DIV') {
				this.container = new JSYG('<g>').node;
				this.shape = 'circle';
			} else if (type === 'html' && this.container.tagName == 'g') {
				this.container = new JSYG('<div>').node;
				this.shape = 'div';
			}
			
			new JSYG(this.container).appendTo(parent).classAdd(this.className);
			
			var list = [],
				that = this,
				displayShadow = this.editor.box.displayShadow,
				backup,
			
				createShape = function() {
					var shape = new JSYG('<'+that.shape+'>').appendTo(that.container);
					if (that.xlink) { shape.href(that.xlink); }
					shape.setDim({x:0,y:0,width:that.width,height:that.height});
					return shape;
				},
				
				start = function(e) {
					new JSYG(that.container).appendTo(type == 'svg' ? that.editor.box.container : document.body);
					backup = {
						ctrlsMainPoints : that.editor.ctrlsMainPoints.enabled,
						ctrlsCtrlPoints : that.editor.ctrlsCtrlPoints.enabled
					};
					that.editor.trigger('start',node,e);
					that.trigger('start',node,e);
				},
				
				dragstart = function(e) {
					for (var n in backup) {
						if (!backup[n]) continue;
						new JSYG(that.editor[n].container).hide();
						that.editor[n].display = false;
					}
					that.editor.box.displayShadow = false;
					that.editor.trigger('dragstart',node,e);
					that.trigger('dragstart',node,e);
				},
				
				drag = function(e){
					that.editor.update();
					that.editor.trigger('drag',node,e);
					that.trigger('drag',node,e);
				},
				
				dragend = function(e) {
					if (that.editor.isMultiSelection()) new JSYG.Container(that.editor._target).applyTransform();
					that.editor.box.displayShadow = displayShadow;
					for (var n in backup){
						if (!backup[n]) continue;
						new JSYG(that.editor[n].container).show();
						that.editor[n].display = true;
					}
					new JSYG(that.container).appendTo(parent); //pour que les controles restent au 1er plan
					that.editor.update();
					that.editor.trigger('dragend',node,e);
					that.trigger('dragend',node,e);
				},
							
				end = function(e){
					that.editor.trigger('end',node,e);
					that.trigger('end',node,e);
				};
																
			jNode.resizable('set',{ //default options
				event:'direct-left-mousedown',
				onstart:start,
				ondragstart:dragstart,
				ondrag:drag,
				ondragend:dragend,
				onend:end,
				keepRatio:this.keepRatio || false,
				keepRotation:true,
				type:this.type,
				bounds:this.bounds,
				inverse:false,
				method: type === 'svg' ? 'fixedPoint' : 'normal',
				originX:'auto',
				originY:'auto'
			});
			
			if (this.stepsX) { jNode.resizable('set',{stepsX:{list:this.stepsX}}); }
			if (this.stepsY) { jNode.resizable('set',{stepsY:{list:this.stepsY}}); }
			
			if (this.options) { jNode.resizable('set',this.options); }
			
			if (this.horizontal && this.vertical) {
			
				var resizeFromCorner = function(e) {
					jNode.resizable('enable',{horizontal:true,vertical:true,field:this,evt:e});
				};
			
				[0,1,2,3].forEach(function(i) {
					list[i] = createShape().on('mousedown',resizeFromCorner).node;
				});
			}
						
			if (!this.keepRatio) {
							
				if (this.horizontal) {
					
					var horizontalResize = function(e) {
						jNode.resizable('enable',{horizontal:true,vertical:false,field:this,evt:e});
					};
					
					[4,5].forEach(function(i) {
						list[i] = createShape().on('mousedown',horizontalResize).node;
					});
				}
				
				if (this.vertical) {
					
					var verticalResize = function(e) {
						jNode.resizable('enable',{horizontal:false,vertical:true,field:this,evt:e});
					};
					
					[6,7].forEach(function(i) {
						list[i] = createShape().on('mousedown',verticalResize).node;
					});
				}
				
				var jDoc = new JSYG(document);
				
				var documentFct = {
					keydown:function(e) { if (e.keyCode === 17) { jNode.resizable('set',{keepRatio:true}); } },
					keyup:function(e) { if (e.keyCode === 17) { jNode.resizable('set',{keepRatio:false}); } }
				};
				
				jDoc.data('svgeditor',documentFct);
				jDoc.on(documentFct);
			}
														
			this.list = list;
			
			this.display = true;

			this.update();
			
			if (!_preventEvent) this.trigger('show',node);
			
			return this;
		},
		/**
		 * Masque les contr�les
		 * @returns {Resize}
		 */
		hide : function(_preventEvent) {
						
			if (this.container) new JSYG(this.container).empty().remove();
			
			this.list.splice(0,this.list.length);
			
			var jDoc = new JSYG(document);
			var documentFct = jDoc.data('svgeditor');
			if (documentFct) jDoc.off(documentFct);
			
			if (this.node) new JSYG(this.node).resizable('destroy');
			
			this.display = false;
			
			if (!_preventEvent) this.trigger('hide',this.node);
			
			return this;
		},
		/**
		 * Met � jour les contr�les
		 * @returns {Resize}
		 */
		update : function() {
		
			if (!this.display) return this;
			
			var node = this.editor._target;
			if (!node) return this.hide();
			
			//il y a changemet des options, il faut r�afficher tout
			if (!this.keepRatio && !this.list[4] || this.keepRatio && this.list[4]) { return this.show(); }
						
			var jNode = new JSYG(node),
				type = jNode.getType(),
				b = jNode.getDim(),
				CTM = (function() {
					if (type == 'svg') { return jNode.getMtx(jNode.offsetParent("farthest")); }
					else {
						var dimParent = jNode.offsetParent().getDim('page');
						return new JSYG.Matrix().translate(dimParent.x,dimParent.y).multiply(jNode.getMtx());
					}
				}()),
				topleft = new JSYG.Vect(b.x,b.y).mtx(CTM),
				topright = new JSYG.Vect(b.x+b.width,b.y).mtx(CTM),
				bottomleft = new JSYG.Vect(b.x,b.y+b.height).mtx(CTM),
				bottomright = new JSYG.Vect(b.x+b.width,b.y+b.height).mtx(CTM),
				angle = Math.atan2((topright.y-topleft.y)/2,(topright.x-topleft.x)/2),
				angleTest = Math.abs(angle % Math.PI),
				inverse = angleTest > Math.PI/4 && angleTest < Math.PI*3/4;
									
			new JSYG(this.list[0]).setCenter(topleft.x,topleft.y).css('cursor',(inverse ? 'n' : 's' ) + 'e-resize');
			new JSYG(this.list[1]).setCenter(topright.x,topright.y).css('cursor',(inverse ? 's' : 'n' ) + 'e-resize');
			new JSYG(this.list[2]).setCenter(bottomleft.x,bottomleft.y).css('cursor',(inverse ? 's' : 'n' ) + 'e-resize');
			new JSYG(this.list[3]).setCenter(bottomright.x,bottomright.y).css('cursor',(inverse ? 'n' : 's' ) + 'e-resize');
						
			if (!this.keepRatio) {
				
				new JSYG(this.list[4]).setCenter((topright.x+bottomright.x)/2,(topright.y+bottomright.y)/2).css('cursor',(inverse ? 'n' : 'e' ) + '-resize');
				new JSYG(this.list[5]).setCenter((topleft.x+bottomleft.x)/2,(topleft.y+bottomleft.y)/2).css('cursor',(inverse ? 'n' : 'e' ) + '-resize');
				new JSYG(this.list[6]).setCenter((topleft.x+topright.x)/2,(topleft.y+topright.y)/2).css('cursor',(inverse ? 'e' : 'n' ) + '-resize');
				new JSYG(this.list[7]).setCenter((bottomleft.x+bottomright.x)/2,(bottomleft.y+bottomright.y)/2).css('cursor',(inverse ? 'e' : 'n' ) + '-resize');
			}
								
			return this;
		}
	};
	
	/**
	 * Edition de la rotation
	 */
	function Rotate(editorObject) {
		/**
		 * référence vers l'objet JSYG.Editor parent
		 */
		this.editor = editorObject;
		/**
		 * liste des contr�les
		 */
		this.list = [];
		/**
		 * liste des paliers
		 */
		this.steps = [0,90,180,270];
		/**
		 * Conteneur des contr�les
		 */
		this.container = new JSYG('<g>').node;
	};
	
	Rotate.prototype = {
	
		constructor : Rotate,
		/**
		 * Classe appliqu�e au conteneur des contr�les
		 */
		className : 'rotate',
		/**
		 * Forme utilis�e pour les contr�les
		 */
		shape : 'circle',
		/**
		 * lien utilis� si shape est défini � "use"
		 */
		xlink : null,
		/**
		 * largeur des contr�les
		 */
		width:10,
		/**
		 * hauteur des contr�les
		 */
		height:10,
		/**
		 * Indique si ce contr�le est actif dans le cas d'une s�lection multiple
		 */
		multiple : false,
		/**
		 * Curseur � appliquer � l'élément de contr�le
		 */
		cursor: JSYG.Rotatable.prototype.cursor,
		/**
		 * Fonction(s) � ex�cuter � l'affichage des contr�les
		 */
		onshow:null,
		/**
		 * Fonction(s) � ex�cuter � la suppression des contr�les
		 */
		onhide:null,
		/**
		 * Fonction(s) � ex�cuter quand on pr�pare un d�placement (mousedown sur le contr�le)
		 */
		onstart:null,
		/**
		 * Fonction(s) � ex�cuter quand on commence un d�placement
		 */
		ondragstart:null,
		/**
		 * Fonction(s) � ex�cuter pendant le d�placement
		 */
		ondrag:null,
		/**
		 * Fonction(s) � ex�cuter en fin de d�placement
		 */
		ondragend:null,
		/**
		 * Fonction(s) � ex�cuter au rel�chement de la souris, qu'il y ait eu modification ou non
		 */
		onend:null,
		/**
		 * Options suppl�mentaires pour la rotation
		 * @see {JSYG.Rotatable}
		 */
		options : null,
		
		set : JSYG.StdConstruct.prototype.set,
		/**
		 * Ajout d'�couteurs d'�v�nements customis�s
		 * @see JSYG.StdConstruct.prototype.on
		 * @returns {Rotate}
		 */
		on : function(evt,fct) { return JSYG.StdConstruct.prototype.on.apply(this,arguments); },
		/**
		 * Retrait d'�couteurs d'�v�nements customis�s
		 * @see JSYG.StdConstruct.prototype.on
		 * @returns {Rotate}
		 */
		off : function(evt,fct) { return JSYG.StdConstruct.prototype.off.apply(this,arguments); },
		/**
		 * D�clenche un �v�nement customis�
		 * @see JSYG.StdConstruct.prototype.trigger
		 */
		trigger : JSYG.StdConstruct.prototype.trigger,
		/**
		 * Indique si les contr�les sont activ�s ou non
		 */
		enabled : false,
		/**
		 * Indique si les contr�les sont affich�s ou non
		 */
		display : false,
		/**
		 * Activation des contr�les
		 * @param opt optionnel, objet définissant les options
		 * @returns {Rotate}
		 */
		enable : function(opt) {
			this.hide(true);
			if (opt) this.set(opt);
			var container = this.editor.box.container; 
			if (container && container.parentNode) this.show();
			this.enabled = true;			
		},
		/**
		 * D�sactivation des contr�les
		 *  @returns {Rotate}
		 */
		disable : function() {
			this.hide();
			this.enabled = false;
		},
		/**
		 * Affichage des contr�les
		 * @param opt optionnel, objet définissant les options
		 * @returns {Rotate}
		 */
		show : function(opt,_preventEvent) {
		
			this.hide(true);
				
			if (opt) this.set(opt);
			
			var node = this.editor._target;
			
			if (!node || this.editor.isMultiSelection() && !this.multiple) return this.hide();
			
			this.node = node;
			
			var jNode = new JSYG(node),
				type = jNode.getType(),
				parent = (type == 'svg') ? this.editor.box.container : document.body,
				that = this;
			
			if (type !== 'svg') { return this; }
			
			if (type === 'svg' && this.container.tagName == 'DIV') {
				this.container = new JSYG('<g>').node;
				this.shape = 'circle';
			} else if (type === 'html' && this.container.tagName == 'g') {
				this.container = new JSYG('<div>').node;
				this.shape = 'div';
			}
			
			new JSYG(this.container).appendTo(parent).classAdd(this.className);
			
			var shape = new JSYG('<'+this.shape+'>').appendTo(this.container);
			if (this.xlink) shape.href(this.xlink);
			shape.setDim({x:0,y:0,width:this.width,height:this.height});
			shape.css('cursor',this.cursor);
			
			this.list[0] = shape.node;
			
			var displayShadow = this.editor.box.displayShadow;
			
			var backup;
			
			var start = function(e) {
				backup = {
					ctrlsMainPoints : that.editor.ctrlsMainPoints.enabled,
					ctrlsCtrlPoints : that.editor.ctrlsCtrlPoints.enabled
				};
				that.editor.trigger('start',node,e);
				that.trigger('start',node,e);
			},
			
			dragstart = function(e) {
				for (var n in backup) {
					if (!backup[n]) continue;
					new JSYG(that.editor[n].container).hide();
					that.editor[n].display = false;
				}
				that.editor.box.displayShadow = false;
				that.editor.trigger('dragstart',node,e);
				that.trigger('dragstart',node,e);
			},
			
			drag = function(e){
				that.editor.update();
				that.editor.trigger('drag',node,e);
				that.trigger('drag',node,e);
			},
			
			dragend = function(e){
				if (that.editor.isMultiSelection()) new JSYG.Container(that.editor._target).applyTransform();
				that.editor.box.displayShadow = displayShadow;
				for (var n in backup){
					if (!backup[n]) continue;
					new JSYG(that.editor[n].container).show();
					that.editor[n].display = true;
				}
				new JSYG(that.container).appendTo(parent); //pour remettre les controles au 1er plan
				that.editor.update();
				that.editor.trigger('dragend',node,e);
				that.trigger('dragend',node,e);
			},
						
			end = function(e){
				that.editor.trigger('end',node,e);
				that.trigger('end',node,e);
			};
			
			jNode.rotatable('set',{
				event:'direct-left-mousedown',
				field:this.list[0],
				onstart:start,
				ondragstart:dragstart,
				ondrag:drag,
				ondragend:dragend,
				onend:end,
				key:false,
				click:"left",
				cursor:this.cursor
			});
			
			if (this.steps) jNode.rotatable('set',{steps:{list:this.steps}});
			if (this.options) jNode.rotatable('set',this.options);
			
			jNode.rotatable('enable');
			
			this.display = true;
			
			this.update();
			
			if (!_preventEvent) this.trigger('show',node);
								
			return this;
		},
		/**
		 * Masque les contr�les
		 * @returns {Rotate}
		 */
		hide : function(_preventEvent) {
			
			if (this.container) new JSYG(this.container).empty().remove();
			if (this.node) new JSYG(this.node).rotatable('destroy');
			this.list.splice(0,this.list.length);
			this.display = false;
			if (!_preventEvent) this.trigger('hide',this.node);
			return this;
		},
		/**
		 * Met � jour les contr�les
		 * @returns {Rotate}
		 */
		update : function() {
			
			if (!this.display) return this;
			
			var node = this.editor._target;
			
			if (!node) return this.hide();
			this.node = node;

			var jNode = new JSYG(node),
			b = jNode.getDim(),
			CTM = (function() {
				if (jNode.getType() == 'svg') return jNode.getMtx(jNode.offsetParent("farthest"));
				else {
					var dimParent = jNode.offsetParent().getDim('page');
					return new JSYG.Matrix().translate(dimParent.x,dimParent.y).multiply(jNode.getMtx());
				}
			}()),
			topleft = new JSYG.Vect(b.x,b.y).mtx(CTM),
			topright = new JSYG.Vect(b.x+b.width,b.y).mtx(CTM),
			angle = Math.atan2((topright.y-topleft.y)/2,(topright.x-topleft.x)/2);
			
			new JSYG(this.list[0]).setCenter(
				(topleft.x+topright.x)/2 + 15 * Math.sin(angle),
				(topleft.y+topright.y)/2 - 15 * Math.cos(angle)
			);
			
			return this;
		}
	};
});