JSYG.require("Animation","WindowsLike.css");

(function() {

	"use strict";
	
	var pathImages = JSYG.require.baseURL+'/WindowsLike/img/'; 
	/**
	 * <strong>nécessite le module WindowsLike</strong><br/><br/>
	 * fenêtres de type windows<br/><br/>
	 * @param node argument JSYG faisant référence � une div
	 * @param opt optionnel, objet définissant les options. Si défini, le module est activ� implicitement.
	 * @returns {JSYG.WindowsLike}
	 * @example <pre>var win = new JSYG.WindowsLike('#maDiv');
	 * win.iconifiable = true;
	 * win.closable = true;
	 * win.title = "Ma fenêtre";
	 * win.enable();
	 * 
	 * //équivalent � 
	 * new JSYG.WindowsLike('#maDiv',{
	 * 	iconifiable:true,
	 * 	closable:true,
	 * 	title:"Ma fenêtre"
	 * })
	 */
	JSYG.WindowsLike = function(arg,opt) {
		/**
		 * élément div
		 * @type {Object}
		 */
		this.node = new JSYG(arg).node;
			
		if (opt) this.enable(opt);
	};
	
	/**
	 * Liste des fenêtres mobiles de la page
	 */
	JSYG.WindowsLike.list = [];
	
	JSYG.WindowsLike.prototype = {
		
		constructor : JSYG.WindowsLike,
		
		/**
		 * fenêtre redimensionnable
		 */
		resizable : false,
		/**
		 * Redimensionne les éléments � l'int�rieur de la div
		 * (dont les dimensions sont pr�cis�s en dur dans l'attribute style)
		 * de mani�re proportionnelle.
		 */
		innerResize : false,

		iconifiable : false,
		
		focusable : true,
		/**
		 * Affiche ou non l'ic�ne pour tout iconifier/restaurer
		 */
		desktop : false,
		
		closable : false,
		
		removeOnClose : true,
		
		maximizable : false,
		/**
		 * laisse la fenêtre toujours au premier plan
		 */
		forefront : false,
		/**
		 * laisse la fenêtre toujours � l'arri�re plan
		 */
		background : false,
		/**
		 * mise en avant de la fenêtre par rapport au reste (fond gris�)
		 */
		popup : false,
		
		/**
		 * mémorisation de la position dans un cookie
		 */
		cookiePos : false,
		/**
		 * mémorisation de la fermeture de la fenêtre dans un cookie
		 */
		cookieClose : false,
		/**
		 * mémorisation de la taille de la fenêtre dans un cookie
		 */
		cookieSize : false,
		/**
		 * durée de conservation des cookies position et taille (nombre de jours ou objet Date ou null pour session en cours)
		 */
		cookiePosSizeExpire : 2,
		/**
		 * durée de conservation du cookie de fermeture (nombre de jours ou objet Date ou null pour session en cours)
		 */
		cookieCloseExpire : null,
		/**
		 * pour repositionner les fenêtres avec un effet de délai
		 */
		delayEffect : false,
		/**
		 * Classe appliquée à la div
		 */
		className : 'windowsLike',
		
		/**
		 * centre la fenêtre horizontalement
		 */
		centerX : false,
		/**
		 * centre la fenêtre verticalement
		 */
		centerY : false,
		/**
		 * Garde la fenêtre au centre quand on scrolle dans la page.
		 * false par défaut car dangereux si la fenêtre est plus grande que la fenêtre du navigateur
		 */
		keepCenterOnScroll : false,
		/**
		 * url de l'icône à insérer dans le bandeau
		 */
		icon : null,
		/**
		 * classe de l'icône à insérer dans le bandeau, à partir d'un sprite css
		 */
		iconFromSprite : null,
		/**
		 * Titre à insérer dans le bandeau
		 */
		title : false,
		/**
		 * classe appliquée au bandeau de la fenêtre
		 */
		classHeadband : 'headband',
		/**
		 * Classe appliquée aux boutons du bandeau (fermer, iconifier, etc)
		 */
		classButton : 'button',
		/**
		 * class appliquée � l'image pour le redimensionnement
		 */
		classResizeCtrl : 'resize',
		/**
		 * classe appliquée � l'ic�ne
		 */
		classIcon : 'icone',
		/**
		 * id de la barre des t�ches
		 */
		idTaskbar : 'taskbar',
		/**
		 * id de l'image pour tout iconifier/restaurer
		 */
		idShowDesktop : 'iconifyAll',
		/**
		 * id du filtre pour mettre en �vidence la popup
		 */
		idPopupFilter : 'popupFilter',
		
		/**
		 * Fonction(s) à exécuter quand on réduit la fenêtre
		 */
		onreduce : null,
		/**
		 * Fonction(s) à exécuter quand on maximise la fenêtre
		 */
		onmaximize : null,
		/**
		 * Fonction(s) à exécuter quand on ferme la fenêtre
		 */
		onclose : null,
		/**
		 * Fonction(s) à exécuter quand on ouvre la fenêtre
		 */
		onopen : null,
		/**
		 * Fonction(s) à exécuter avant la fermeture de la fenêtre (jeter une exception pour annuler la fermeture)
		 */
		onbeforeclose : null,
		/**
		 * Fonction(s) à exécuter quand on fait passer la fenêtre au 1er plan
		 */
		onfocus : null,
		/**
		 * Fonction(s) à exécuter � la perte du focus
		 */
		onblur : null,
		/**
		 * Fonction(s) à exécuter quand on commence � d�placer la fenêtre
		 */
		ondragstart : null,
		/**
		 * Fonction(s) à exécuter quand on d�place la fenêtre
		 */
		ondrag : null,
		/**
		 * Fonction(s) à exécuter quand on finit de d�placer la fenêtre
		 */
		ondragend : null,
		/**
		 * Fonction(s) à exécuter quand la fenêtre est recentr�e horizontalement
		 */
		oncenterx : null,
		/**
		 * Fonction(s) à exécuter quand la fenêtre est recentr�e verticalement
		 */
		oncentery : null,
		/**
		 * Fonction(s) à exécuter quand la fenêtre est iconifi�e
		 */
		oniconify : null,
		/**
		 * Fonction(s) à exécuter quand la fenêtre est restaur�e
		 */
		onrestore : null,
		/**
		 * Fonction(s) à exécuter quand on commence � redimensionner la fenêtre
		 */
		onresizestart : null,
		/**
		 * Fonction(s) à exécuter quand on redimensionne la fenêtre
		 */
		onresizedrag : null,
		/**
		 * Fonction(s) à exécuter quand on finit de redimensionner la fenêtre
		 */
		onresizeend : null,
		
		/**
		 * utilis� en interne pour savoir si le fenêtre est maximis�e ou non
		 */
		_isMaxi : false,
		/**
		 * Indique si le module fenêtre mobile est actif ou non
		 */
		enabled : false,

		set : JSYG.StdConstruct.prototype.set,
		
		reset : JSYG.StdConstruct.prototype.reset,
		destroy : JSYG.StdConstruct.prototype.destroy,
		toggle : JSYG.StdConstruct.prototype.toggle,

		/**
		 * Ajout d'un �couteur d'�v�nement.
		 * @see {JSYG.StdConstruct.prototype.on}
		 */
		on : function(evt,fct) { return JSYG.StdConstruct.prototype.on.call(this,evt,fct); },
		/**
		 * Retrait d'un �couteur d'�v�nement.
		 * @see {JSYG.StdConstruct.prototype.off}
		 */
		off : function(evt,fct) { return JSYG.StdConstruct.prototype.off.call(this,evt,fct); },
		
		trigger : JSYG.StdConstruct.prototype.trigger,
		
		/**
		 * Met au premier plan la fenêtre par rapport aux autres fenêtres mobiles
		 * @returns {JSYG.WindowsLike}
		 */
		focus : function() {
						
			if (document.getElementById(this.idPopupFilter)) return; //si une popup est affich�e, pas de souci de focus
						
			var list = JSYG.WindowsLike.list,
				zindex = false,
				zmax = 0,
				indblur = null,
				i,nb = list.length,
				e = arguments[0] || null;
		
			if (this.forefront) {
				this.node.style.zIndex = nb+1;
				return;
			}
						
			if (this.node.style.zIndex == nb && !this.background) return; //pas d'action si la fenêtre a d�j� le focus 
			
			for (i=0;i<nb;i++) {
				
				if (list[i]===this) {

					if (!this.background) {
						this.node.style.zIndex = nb;
						this.trigger('focus',this.node,e);
					}
					else this.node.style.zIndex = 0;
				}	
				else if (list[i].forefront) list[i].node.style.zIndex = nb+1; //pour s'assurer que les fenêtres au premier plan le sont bien
				else if (list[i].focusable) {
					
					zindex = list[i].node.style.zIndex;
					list[i].node.style.zIndex = JSYG.clip(zindex-1,0,nb-1);
					
					if (zindex > zmax) {
						indblur = i;
						zmax = zindex;
					}
				} 
			}
			
			if (indblur!=null) list[indblur].trigger('blur',list[indblur].node,e);
			
			return this;
		},
		
		/**
		 * Redimensionne la fenêtre
		 * @param width nouvelle largeur
		 * @param height nouvelle hauteur
		 * @returns {JSYG.WindowsLike}
		 */
		resize : function(width,height) {
						
			var jNode = new JSYG(this.node),
				largIni = this.node.offsetWidth,
				hautInit = this.node.offsetHeight,
				incr, ref;
						
			width = JSYG.clip(width , jNode.cssNum('min-width') || 0 , jNode.cssNum('max-width') || Infinity);
			height = JSYG.clip(height , jNode.cssNum('min-height') || 0 , jNode.cssNum('max-height') || Infinity);
						
			if (!this.innerResize) {
				jNode.setDim({width:width,height:height});
				return this;
			}
			
			function retaille(elmt,val,param) {
												
				var dim = elmt.style[param],
					children = elmt.childNodes,
					i = children.length,
					child;
				
				if (dim && dim.indexOf('px') != -1) {
					dim = parseInt(dim,10) + val;
					elmt.style[param] = dim+'px';
				}
				
				while (i--) {
					child = children.item(i);
					if (child.nodeType==1) retaille(child,val,param);
				}
			}
			
			incr = (width-largIni > 0) ? Math.ceil((width-largIni)/5) : Math.floor((width-largIni)/5);
			
			ref = largIni;
			
			while (ref * incr < width * incr) {
				retaille(this.node,incr,'width');
				if (this.node.offsetWidth == ref) break;
				ref = this.node.offsetWidth;
			}
		
			incr = (height-hautInit > 0) ? Math.ceil((height-hautInit)/5) : Math.floor((height-hautInit)/5);
						
			ref = hautInit;
			
			while (ref * incr < height * incr){
				retaille(this.node,incr,'height');
				if (this.node.offsetHeight == ref) break;
				ref = this.node.offsetHeight;
			}
						
			return this;
		},
		
		/**
		 * Maximise la fenêtre aux dimensions de la fenêtre du navigateur
		 * @returns {JSYG.WindowsLike}
		 */
		maximize : function() {
			
			var jNode = new JSYG(this.node);
						
			var dim = jNode.getDim(),
				
				e = arguments[0] || null,
								
				backup = {
					width : jNode.css("width"),
					height : jNode.css("height"),
					left : jNode.css("left"),
					top : jNode.css("top"),
					position : jNode.css("position")
				},
						
				jWin = new JSYG(window),
				dimWin = jWin.getDim(),
				dimDoc = new JSYG(document).getDim(),
				
				larg = dimWin.width - (dimDoc.width !=  dimWin.width ? 15 : 0), //ascenceur
				haut = dimWin.height - (dimDoc.height != dimWin.height ? 15 : 0);
			
			jNode.css({
				"position":"fixed",
				"left":0,
				"top":0
			});
									
			this.resize(larg-5,haut-5,true);
			this.resize(larg,haut);
			
			this._isMaxi = true;
			
			this.trigger('maximize',this.node,e);
			
			this.reduce = function() {
				
				var e = arguments[0] || null;
				
				jNode.css({
					'left':backup.left,
					'top':backup.top,
					'position':backup.position
				});
								
				this.resize(dim.width-5,dim.height-5,true);
				this.resize(dim.width,dim.height);
				
				jNode.css({
					'width':backup.width,
					'height':backup.height
				});
				
				this._isMaxi = false;
				
				this.trigger('reduce',this.node,e);
				
				return this;
			};
						
			return this;
		},
		
		/**
		 * réduit la fenêtre (apr�s maximisation)
		 * @returns {JSYG.WindowsLike}
		 */
		reduce : function() { return this; },
		
		/**
		 * Iconifie la fenêtre
		 * @returns {JSYG.WindowsLike}
		 */
		iconify : function() {
					
			var jNode = new JSYG(this.node),
				data = jNode.data('windowsLike') || {},
				e = arguments[0] || null,
				jDiv,t;
			
			if (jNode.css('display') == "none") return;
				
			jNode.hide();
	
			jDiv = new JSYG('<div>').hide();
					
			new JSYG('<img>').attr({
				src : pathImages+"restaure.gif",
				alt : "restaurer",
				title : "restaurer"
			})
			.classAdd(this.classButton)
			.appendTo(jDiv)
			.on('click',this.restore.bind(this));
			
			if (this.icon || this.iconFromSprite) jDiv.append( jNode.find('.'+this.classIcon).clone() );
						
			if (this.title) {
				t = (this.title.length > 25) ? this.title.substring(0,22)+'...' : this.title;
				jDiv.textAppend(t);
			}
			
			new JSYG('#'+this.idTaskbar).css('zIndex',JSYG.WindowsLike.list.length+10).append(jDiv);
									
			jDiv.show('fade');
						
			data.iconified = jDiv;
			
			jNode.data('windowsLike',data);
			
			this.trigger('iconify',this.node,e);
			
			return this;
		},
		
		/**
		 * Iconifie toutes les fenêtres mobiles de la page
		 * @returns {JSYG.WindowsLike}
		 */
		iconifyAll : function() {

			var e = arguments[0] || null;
			
			for (var i=0;i<JSYG.WindowsLike.list.length;i++) {
				if (JSYG.WindowsLike.list[i].iconifiable) JSYG.WindowsLike.list[i].iconify(e);
			}
			return this;
		},
		
		/**
		 * Restaure la fenêtre iconifi�e
		 * @returns {JSYG.WindowsLike}
		 */
		restore : function() {
		
			var jNode = new JSYG(this.node),
				data = jNode.data('windowsLike') || {},
				e = arguments[0] || null;
				
			if (!data.iconified) return;
		
			jNode.show();
			this.focusable && this.focus();
			
			data.iconified.animate({
				to:{opacity:0,width:'0px'},
				style:'swing',
				duration:'fast',
				onend:function(){ new JSYG(this).remove(); }
			});
			
			data.iconified = false;
			
			jNode.data('windowsLike',data);
			
			this.trigger('restore',new JSYG(this.node),e);
						
			return this;
		},
		/**
		 * Restaure toutes les fenêtres mobiles iconifi�es de la page
		 * @returns {JSYG.WindowsLike}
		 */
		restoreAll : function() {
		
			var e = arguments[0] || null,
				i=0,N=JSYG.WindowsLike.list.length;
			
			for (i=0;i<N;i++) JSYG.WindowsLike.list[i].restore(e);
			
			return this;
		},
		
		/**
		 * Ferme la fenêtre
		 * @returns {JSYG.WindowsLike}
		 */
		close : function (callback) {
			
			var jNode = new JSYG(this.node),
				data = jNode.data('windowsLike') || {},
				e = arguments[1] || null,
				that = this;
			
			return new JSYG.Promise(function(resolve,reject) {
				
				function onend() {
					data.filter && data.filter.animate('clear').remove();
					that.trigger('close',that.node,e);
					callback && callback.call(that.node,e);
					resolve(e);
				};
					
				if (that.closable) {
					try { that.trigger('beforeclose',that.node,e); }
					catch(e) { return reject(e); }
				}
				
				that.removeOnClose ? jNode.remove() : jNode.hide();
				
				if (data.filter) data.filter.animate( {to:{opacity:0},duration:'fast',onend:onend} );
				else onend();
			});
		},
		
		/**
		 * Ouvre la fenêtre
		 * @returns {JSYG.WindowsLike}
		 */
		open : function() {
			
			var jNode = new JSYG(this.node);
			
			if (jNode.css('display') == 'none') {
			
				jNode.show();
				
				if (this.popup) this._displayFilter();
				
				this.trigger("open");
			}
						
			this.focus();
			
			return this;
		},
		
		_displayFilter : function() {
			
			//AFFICHAGE DU FILTRE
			var jNode = new JSYG(this.node),
				data = jNode.data('windowsLike'),
				jFiltre = new JSYG('#'+this.idPopupFilter),
				z = JSYG.WindowsLike.list.length;
							
			if (!jFiltre.length) {
				jFiltre = new JSYG("<div>",true).id(this.idPopupFilter)
				.css('zIndex',z+2).appendTo(document.body);
			}
			else jFiltre.animate("clear").css("opacity",0.5);
			
			jNode.css('zIndex',jFiltre.cssNum('zIndex') + 1);
			
			if (!data) {
				data = {filter:jFiltre};
				jNode.data('windowsLike',data);
			}
			else data.filter = jFiltre;
			
			return this;
		},
		
		/**
		 * Change le titre dans le bandeau
		 * @returns {JSYG.WindowsLike}
		 */
		setTitle : function (title) {
			
			this.node.firstChild.lastChild.nodeValue = title;
			this.title = title;
			return this;
		},
		
		/**
		 * Recentre la fenêtre horizontalement dans la page
		 * @returns {JSYG.WindowsLike}
		 */
		moveToCenterX : function (callback) {
				
			var jNode = new JSYG(this.node);
						
			var dim = jNode.getDim(),
				jWin = new JSYG(window),
				left = Math.max(0,Math.round((jWin.getDim().width-dim.width)/2)+jWin.scrollLeft()),
				depl = (left-dim.x)/100,
				that = this,
				recentreX,i;
			
			if (this.delayEffect) {
				
				recentreX = function(i) {
					return function () {
						that.node.style.left = Math.round(dim.x + depl*i) + "px";
						if (i===100) {
							that.trigger('centerx',that.node);
							callback && callback.call(that.node);
						}
					};
				};
			
				for(i=0;i<=100;i+=2) window.setTimeout(recentreX(i),i*4);
			}
			else {
				this.node.style.left = left+'px';
				that.trigger('centerx',that.node);
				typeof callback == "function" && callback.call(that.node);
			}
			
			return this;
		},
	
		/**
		 * Recentre la fenêtre verticalement dans la page
		 * @returns {JSYG.WindowsLike}
		 */
		moveToCenterY : function (callback) {
	
			var jNode = new JSYG(this.node);
						
			var dim = jNode.getDim(),
				jWin = new JSYG(window),
				top = Math.max(0,Math.round((jWin.getDim().height-dim.height)/2)+jWin.scrollTop()),
				depl = (top-dim.y)/100,
				that = this,
				recentreY,i;
	
			if (this.delayEffect)
			{
				recentreY = function(i) {
					return function (){
						that.node.style.top = Math.round(dim.y + depl*i) + "px";
						if (i===100) {
							that.trigger('centery',that.node);
							callback && callback.call(that.node);
						}
					};
				};
				
				for(i=0;i<=100;i+=2) {window.setTimeout(recentreY(i),i*4);}
			}
			else {
				this.node.style.top = top+'px';
				this.trigger('centery',this.node);
				typeof callback == "function" && callback.call(that.node);
			}
			
			return this;
		},
		
		/**
		 * Ecrit le cookie pour m�moriser position, taille (et fermeture) en fonction des options choisies
		 * @returns {JSYG.WindowsLike}
		 */
		cookieWrite : function() {
						
			if (!this.node.id) throw "Il faut définir un id pour la fenêtre pour pouvoir utiliser les cookies";
			
			var valcookie,
				jNode = new JSYG(this.node),
				data = jNode.data('windowsLike') || {};
						
			if (this._isMaxi === true) this.reduce();
			 
			if (new JSYG(this.node).css("display") == "none" && !data.iconified) { //si la fenêtre a �t� ferm�e
				
				if (this.closable && this.cookieClose) {
					
					valcookie = 'close';
										
					JSYG.cookies.write(this.node.id,valcookie,this.cookieCloseExpire);
				}
			}
			else
			{
				valcookie = this.node.style.left+","+this.node.style.top+","+this.node.style.zIndex+","+this.node.style.display;
			
				if (this.resizable && this.cookieSize) { valcookie+= ","+this.node.offsetWidth+","+this.node.offsetHeight; }

				JSYG.cookies.write(this.node.id,valcookie,this.cookieSizePosExpire);
			}
						
			return this;
		},
		
		/**
		 * Lit le cookie pour r�tablir position, taille (et fermeture) en fonction des options choisies
		 * @returns {JSYG.WindowsLike}
		 */
		cookieRead : function() {
			
			var jNode = new JSYG(this.node),
				dim = jNode.getDim(),
				cookie = [],
				valcookie = JSYG.cookies.read(this.node.id),
				gauche,hauteur,deplx,deply,
				larg,haut,i,recentre,
				that = this;
						
			if (valcookie) cookie = valcookie.split(',');
			
			if (this.cookieSize || this.cookiePos) {
			
				if (cookie.length > 2) {
					
					if (this.cookiePos) {
						
						gauche = parseInt(cookie[0],10);
						hauteur = parseInt(cookie[1],10);
																		
						if (this.delayEffect) {
							
							deplx = (gauche-dim.x)/100;
							deply = (hauteur-dim.y)/100;
							
							recentre = function(i) {
								return function () {
									if (!isNaN(gauche)) that.node.style.left = Math.round(dim.x + deplx*i) + "px";
									if (!isNaN(hauteur)) that.node.style.top = Math.round(dim.y + deply*i) + "px";
								};
							};
			
							for(i=0;i<=100;i+=2) window.setTimeout(recentre(i),i*4);
						}
						else {
							
							if (!isNaN(gauche)) this.node.style.left = gauche+"px";
							if (!isNaN(hauteur)) this.node.style.top = hauteur+"px";
						}
						
						if (this.focusable) this.node.style.zIndex = cookie[2];
						
						if (cookie[3] && cookie[3] == 'hidden') this.iconify();
					}
					
					if (cookie[4] && cookie[5] && this.cookieSize) {
						
						larg = cookie[4];
						haut = cookie[5];
						this.resize(larg -5,haut -5);
						this.resize(larg,haut);
					}
				}
			}
			
			 //cookie de fermeture persistante, valable m�me si cookie est défini � false
			if (this.cookieClose && cookie.length > 0 && cookie[0]=='close') jNode.hide();
			
			return this;
		},
		
		/**
		 * Transforme la div en fenêtre mobile selon les options définies
		 * @param opt optionnel, objet définissant les options 
		 */
		enable : function(opt) {
	
			this.disable();
			
			if (opt) this.set(opt);
												
			var jNode = new JSYG(this.node),
				jWin = new JSYG(window),
				that = this,
				taskbar = document.getElementById(that.idTaskbar),
				backupEtat = {},
				headband = new JSYG('<div>');		
						
			jNode.classAdd(this.className);
												
			if (JSYG.WindowsLike.list.indexOf(this) === -1) JSYG.WindowsLike.list.push(this);
				
			if (!taskbar) {
				taskbar = document.createElement('div');
				taskbar.id = that.idTaskbar;
				document.body.appendChild(taskbar);
			}			

			//CREATION DU BANDEAU	
			headband.classAdd(this.classHeadband);
			
			function mousedown(e) {
				
				e.preventDefault();
								
				var dim = jNode.getDim(),
					xInit = e.pageX,
					yInit = e.pageY,
					jDoc = new JSYG(document),
					hasMoved = false;
				
				function mousemove(e) {
					
					var x = e.pageX - xInit + dim.x,
						y = e.pageY - yInit + dim.y;
				
					if (!hasMoved) {
						that.trigger('dragstart',that.node,e);
						hasMoved = true;
					}
										
					if (y < 0 || (x + dim.width < 20)) return;
							
					that.node.style.left = x+"px";
					that.node.style.top = y+"px";
					
					that.trigger('drag',that.node,e);
				}
				
				function remove() {
					
					jDoc.off({ 'mousemove':mousemove , 'mouseup':remove });
					if (hasMoved) that.trigger('dragend',that.node,e);
				};
				
				jDoc.on({ 'mousemove':mousemove , 'mouseup':remove });
			};
			
			headband.on('mousedown',mousedown);
			headband.prependTo(this.node);

			if (this.node.unselectable) { backupEtat.unselectable = this.node.unselectable; }
			this.node.unselectable = 'on'; //drag&drop ie
			
			backupEtat.zIndex = jNode.css('zIndex');
			
			var focus = this.focus.bind(this);

			if (this.focusable) jNode.on('mousedown',focus);
						
			if (this.closable) {
			
				new JSYG("<img>")
				.classAdd(this.classButton)
				.attr({
					src : pathImages+"fermer.gif",
					alt : 'fermer',
					title : "fermer"
				}).on({
					'mousedown':function(e) { e.stopPropagation(); },
					'click':function(e) { that.close(null,e); }
				}).appendTo(headband);
			}
			
			var maximize = function(e) { that.maximize(e); };
			
			if (this.maximizable) {
				
				(function() {
					
					var jImg = new JSYG('<img>')
					.classAdd(that.classButton)
					.attr({
						src : pathImages+"maximise.gif",
						id : "ajuster_carte",
						alt : "maximiser",
						title : "maximiser"
					}).appendTo(headband)
					.on({
						mousedown:function(e) { e.stopPropagation(); },
						click : fct_maximize
					});
					
					function fct_maximize(e) {
						
						var jImg2 = new JSYG("<img>")
						.classAdd(that.classButton)
						.attr({
							src : pathImages+"restaure.gif",
							alt : "r�duire",
							title : "r�duire"
						}).replace(jImg.node);
																					
						var jLast = new JSYG(that.node.lastChild);
												
						if (jLast.node.nodeType === 1 && jLast.classContains('resize')) jLast.hide();
						
						that.maximize(e);
						
						function fct_reduit(e) {
							that.reduce(e);
							jWin.off('resize',maximize);
							jImg.replace(jImg2.node);
							var jLast = new JSYG(that.node.lastChild);
							if (jLast.node.nodeType === 1 && jLast.classContains('resize')) jLast.show();
						};
						
						jImg2.on('click',fct_reduit);
						jWin.on('resize',maximize);
					}
					
				})();
			}
			
			if (this.iconifiable) 
			{
				new JSYG("<img>")
				.classAdd(this.classButton)
				.attr({
					src:pathImages+"iconifie.gif",
					alt:'iconifier',
					title:'iconifier'
				}).on({
					'mousedown':function(e) { e.stopPropagation(); },
					'click':function(e) {that.iconify(e);}
				}).appendTo(headband);
				
				taskbar.style.zIndex = JSYG.WindowsLike.list.length+2;
			}
			
			if (this.desktop) {
				
				(function() {
					
					if (document.getElementById(that.idShowDesktop)) return;
					
					new JSYG("<img>").attr({
						src : pathImages+"bureau.gif",
						id : that.idShowDesktop,
						alt : "tout iconifier",
						title : "tout iconifier"
					}).
					on('click',function(e) {
						
						var win,jNode,i,N;
						
						for (i=0,N=JSYG.WindowsLike.list.length;i<N;i++) {
							
							win = JSYG.WindowsLike.list[i];
							jNode = new JSYG(win.node);
							
							if (win.iconifiable && jNode.css('display') != 'none') {
								that.iconifyAll(e);
								return;
							}
						}
						that.restoreAll();
					})
					.prependTo(taskbar);
					
				})();
			}
			
			if (this.resizable) {
				
				(function() {
				
					var jImg = new JSYG('<img>')
					.classAdd(that.classResizeCtrl)
					.attr({
						src:pathImages+'retaille.png',
						unselectable:'on'
					}).appendTo(that.node);
	
					that.node.style.overflow = 'hidden';
							
					function mousedown(e) {
						
						e.preventDefault();
						
						var jDoc = new JSYG(document),
							widthInit = that.node.offsetWidth,
							heightInit = that.node.offsetHeight,
							xInit = e.pageX,
							yInit = e.pageY,
							hasChanged = false;
							
						function mousemove(e) {
							
							if (!hasChanged) {
								that.trigger('resizestart',that.node,e);
								hasChanged = true;
							}
							
							that.resize( widthInit+e.pageX-xInit , heightInit+e.pageY-yInit , true);
							that.trigger('resizedrag',that.node,e);
						};
						
						function mouseup(e) {
							
							jDoc.off({
								'mousemove':mousemove,
								'mouseup':mouseup
							});
							
							if (hasChanged) that.trigger('resizeend',that.node,e);
						};
	
						jDoc.on({
							'mousemove':mousemove,
							'mouseup':mouseup
						});
					};			
							
					jImg.on('mousedown',mousedown);
					
				})();
			
			}
						
			if (this.icon) {
			
				new JSYG('<img>').classAdd(this.classIcon)
				.attr({
					alt:'icone',
					src:this.icon
				})
				.appendTo(headband);
			}
			else if (this.iconFromSprite) {
				
				new JSYG('<i>').classAdd(this.iconFromSprite,this.classIcon).appendTo(headband);
			}
			
			if (!this.title) this.title = jNode.attr('title');
							
			headband.append(document.createTextNode(this.title || ' '));
						
			if (this.forefront || this.forefront){
				this.node.style.zIndex = JSYG.WindowsLike.list.length+1;
				this.forefront = true;
			}
			
			
			
			//Affectation de la taille pour IE, car si on utilise float ou width=100%, il ne fige pas la taille de la div
			if (!JSYG.support.inlineBlock) {
			
				//il faut attendre que les images soient charg�es pour �tre s�r d'avoir la bonne taille.
				new JSYG(window).on('load',function() {
					
					var tab = [];
										
					backupEtat.width = jNode.css('width');
					
					headband.css('width','auto');
										
					jNode.walkTheDom(function() {
						var jNode = new JSYG(this);
						if (jNode.css('float') == 'right') {
							jNode.css('float','left');
							tab.push(jNode);
						}
					});
					
					if (tab.length) {
						jNode.setDim({ width:jNode.getDim().width });
						headband.css('width','100%');
						tab.forEach(function(jNode) { jNode.css('float','right'); });
					}
					else if (backupEtat.width == 'auto') headband.setDim({ width:jNode.getDim().width });
				});
			}
			
			var recentreX,recentreY;
			
			if (this.centerX) {
				
				this.moveToCenterX();
				recentreX = this.moveToCenterX.bind(this);
				jWin.on('resize'+( this.keepCenterOnScroll ? ' scroll' : ''),recentreX);
			}		
			
			if (this.centerY) {
				
				this.moveToCenterY();
				recentreY = this.moveToCenterY.bind(this);
				jWin.on('resize'+( this.keepCenterOnScroll ? ' scroll' : ''),recentreY);
			}
			
			var cookieWrite = this.cookieWrite.bind(this);
						
			if (this.cookiePos || this.cookieSize || this.cookieClose) {
				
				if (!JSYG.cookies) throw new Error("Il faut inclure le plugin JSYG.Cookies");
				
				new JSYG(window).on('unload',cookieWrite);
				this.cookieRead();
			}
							  //la fenêtre peut �tre referm�e par cookieClose
			if (this.popup && jNode.css('display') != 'none') this._displayFilter();
			
			this.enabled = true;
			
			this.disable = function() {
				
				var jNode = new JSYG(this.node),
					data = jNode.css('zIndex'),
					ind = JSYG.WindowsLike.list.indexOf(this);
				
				if (headband) headband.remove();
				
				jNode.off('mousedown',focus);
				jNode.css(backupEtat);
				jNode.classRemove(this.className);
				
				if (backupEtat.unselectable) jNode.attr('unselectable',backupEtat.unselectable);
				
				jWin.off({
					'resize scroll':recentreX,
					'unload':cookieWrite
				})
				.off('resize scroll',recentreY)
				.off('resize',maximize); //pas possible d'avoir 2 propriétés du m�me nom !
				
				data = jNode.data('windowsLike');
				if (data && data.filter) data.filter.animate('clear').css('opacity',"0.5").remove();
				
				jNode.dataRemove('windowsLike');
				
				if (ind!=-1) JSYG.WindowsLike.list.splice(ind,1);
				
				if (JSYG.WindowsLike.list.length === 0) new JSYG('#'+this.idTaskbar+',#'+this.desktop).remove();
				
				this.enabled = false;
				
				return this;
			};
						
			return this;
		},
		
		/**
		 * Annule la fenêtre mobile et r�tablit la div telle quelle.
		 * @returns {JSYG.WindowsLike}
		 */
		disable : function() { return this; }
	};
	
	var plugin = JSYG.bindPlugin(JSYG.WindowsLike);
		
	/**
	 * <strong>nécessite le module WindowsLike</strong><br/><br/>
	 * fenêtre de type windows.
	 * @returns {JSYG}
	 * @see JSYG.WindowsLike pour une utilisation d�taill�e
	 * @example <pre>new JSYG('#maDiv').windowsLike();
	 * 
	 * //utilisation avanc�e
	 * new JSYG('#maDiv').windowsLike({
	 * 	iconifiable:true,
	 * 	closable:true,
	 * 	title:"ma fenêtre",
	 * 	icon:'/icones/selection.png',
	 * 	onfocus:function(){ console.log('focused!'); }
	 * });
	 */
	JSYG.prototype.windowsLike = function() { return plugin.apply(this,arguments); };

})();