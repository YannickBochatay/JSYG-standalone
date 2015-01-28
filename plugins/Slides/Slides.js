JSYG.require("Animation",'Slides.css','LoadingMask','Ajax');

(function() {

	"use strict";
	
	/**
	 * <strong>nécessite le module Slides</strong><br/><br/>
	 * création d'un slide dans le cadre d'une création de slides par JSYG.Slides<br/><br/>
	 * @param opt optionnel, objet définissant les options.
	 * @returns {JSYG.Slide}
	 * @see JSYG.Slides
	 * @example <pre>var slides = new JSYG.Slides('#maDiv');
	 * 
	 * var slide = new JSYG.Slide();
	 * slide.content = '#monContenu1';
	 * slide.addTo(slides);
	 * 
	 * var slide2 = new JSYG.Slide();
	 * slide2.type = 'image';
	 * slide2.url = 'monImage.png';
	 * slide2.on('show',function() { alert('voici mon image!'); });
	 * slide2.addTo(slides);
	 * 
	 * new JSYG.Slide({
	 * 	type:'iframe',
	 * 	url:'http://monlien'
	 * }).addTo(slides);
	 * 
	 * new JSYG.Slide({
	 * 	type:'ajax',
	 * 	url:'monScript.php',
	 * 	onshow:function() { alert('voici un slide ajax!'); }
	 * }).addTo(slides);
	 * 
	 * slides.enable();
	 */
	JSYG.Slide = function(opt) {
	
		if (opt) {
			if (JSYG.isPlainObject(opt)) this.set(opt);
			else this.content = opt;
		}
	};
	
	JSYG.Slide.prototype = new JSYG.StdConstruct();
	
	JSYG.Slide.prototype.constructor = JSYG.Slide;
	/**
	 * Nom du slide
	 */
	JSYG.Slide.prototype.name = 'null';
	/**
	 * Type de contenu 'html','iframe','ajax','image'
	 */
	JSYG.Slide.prototype.type = 'html';
	/**
	 * si type === 'html' argument JSYG définissant le contenu
	 */
	JSYG.Slide.prototype.content = null;
	/**
	 * si type !='html' url où aller chercher les donn�es
	 */
	JSYG.Slide.prototype.url = null;
	/**
	 * si type=='ajax', indique si le contenu doit être recharg� à chaque fois ou non
	 */
	JSYG.Slide.prototype.refresh = false;
	/**
	 * Si le contenu doit être chargé (ajax, image, iframe), utilise ou non le masque de chargement.
	 * Valeurs possibles : true ou false, ou objet définissant les options du masque.
	 */
	JSYG.Slide.prototype.loading = true;
	/**
	 * Noeud créé à l'activation des slides
	 */
	JSYG.Slide.prototype.node = null;
	/**
	 * Champ permettant de sélectionner ce slide
	 */			
	JSYG.Slide.prototype.field = null;
	/**
	 * Classe appliquée au champ
	 */
	JSYG.Slide.prototype.classField = 'slideField';
	/**
	 * Classe ajoutée au champ lorsqu'il est sélectionn�
	 */
	JSYG.Slide.prototype.classFieldSelected = 'selected';
	/**
	 * Effet de transition (si null, c'est l'effet défini dans JSYG.Slides qui est utilis�)
	 */
	JSYG.Slide.prototype.effect = null;
	/**
	 * si effect!=null définit d'�ventuelles options supplémentaires de l'effet
	 */
	JSYG.Slide.prototype.effectOptions = null;
	/**
     * Fonction(s) à éxécuter quand le slide est chargé
     */
	JSYG.Slide.prototype.onload = null;
	/**
	 * Fonction(s) à éxécuter quand le slide est affiché
	 */
	JSYG.Slide.prototype.onshow = null;
	/**
	 * Fonction(s) à éxécuter quand le slide est masqué
	 */
	JSYG.Slide.prototype.onhide = null;
	/**
	 * Fonction(s) à éxécuter quand le slide est masqué ou affiché
	 */
	JSYG.Slide.prototype.ontoggle = null;
	/**
	 * Ajout du slide à une liste de slides
	 * @param slideList instance de JSYG.Slides
	 * @param ind optionnel, indice du slide dans la liste
	 * @see JSYG.Slides
	 */
	JSYG.Slide.prototype.addTo = function(slideList,ind) {
		if (slideList.constructor !== JSYG.Slides) throw "L'argument de la méthode addTo doit être une instance de JSYG.Slides";
		slideList.addItem(this,ind);
		return this;
	};
	
	
	/**
	 * <strong>nécessite le module Slides</strong><br/><br/>
	 * création de slides.
	 * @param arg argument JSYG faisant référence au conteneur auiv a acceuillir les slides.
	 * @param opt optionnel, objet définissant les options. Si défini, les slides sont activ� implicitement.
	 * @returns {JSYG.Slides}
	 * @example <pre>var slides = new JSYG.Slides('#maDiv');
	 * 	
	 * slides.effect = 'fade';
	 * slides.anticipate = true; //anticipe le chargement du slide suivant.
	 * 
	 * var slide = new JSYG.Slide();
	 * slide.content = '#monContenu1';
	 * slides.addItem(slide);
	 * 
	 * var slide2 = new JSYG.Slide();
	 * slide2.type = 'image';
	 * slide2.url = 'monImage.png';
	 * slide2.on('show',function() { alert('voici mon image!'); });
	 * slide2.addTo(slides);
	 * 
	 * //raccourci
	 * new JSYG.Slide({
	 * 	type:'iframe',
	 * 	url:'http://monlien'
	 * }).addTo(slides);
	 * 
	 * //raccourci diff�rent
	 * slides.addItem({
	 * 	type:'ajax',
	 * 	url:'monScript.php',
	 * 	onshow:function() { alert('voici un slide ajax!'); }
	 * });
	 * 
	 * slides.enable();
	 */
	JSYG.Slides = function(arg,opt) {
		/**
		 * Liste des slides
		 */
		this.list = [];
		
		/**
		 * élément div (ins�r�e dans this.node) qui contient la série de slides c�te à c�te
		 */
		this.container = document.createElement('div');
		
		if (arg) this.setNode(arg);
		if (opt) this.set(opt);
	};
	
	JSYG.Slides.prototype = new JSYG.StdConstruct();
	
	JSYG.Slides.prototype.constructor = JSYG.Slides;
	/**
	 * élément accueillant les slides
	 */
	JSYG.Slides.prototype.node = null;
	/**
	 * Fonction(s) à éxécuter à chaque changement de slide
	 */
	JSYG.Slides.prototype.onchange = null;
	/**
	 * Indice du slide courant
	 */
	JSYG.Slides.prototype.current = -1;
	/**
	 * Slide à afficher par défaut (une valeur est obligatoire)
	 */
	JSYG.Slides.prototype.defaultSlide = 0;
	/**
	 * Indique si les slides sont actifs ou non
	 */
	JSYG.Slides.prototype.enabled = false;
	/**
	 * Effet entre chaque slide ('slide','fade','accordion','none'),
	 * si elle n'est pas définie au niveau du slide lui-même (objet JSYG.Slide), 
	 */
	JSYG.Slides.prototype.effect = 'none';
	/**
	 * Options supplémentaires pour l'effet
	 */
	JSYG.Slides.prototype.effectOptions = null;
	/**
	 * Pour adapter la hauteur au slide affiché
	 */
	JSYG.Slides.prototype.flexibleHeight = false;
	/**
	 * définit si le slide suivant doit être chargé par anticipation (slide-1)
	 */
	JSYG.Slides.prototype.anticipate = false;
	/**
	 * définit si le slide en cours doit être conservé dans un cookie
	 */
	JSYG.Slides.prototype.cookie = false;
	/**
	 * définit si les slides peuvent tourner en boucle ou non
	 */
	JSYG.Slides.prototype.loop = false;
	
	JSYG.Slides.prototype.set = function(opt,_cible) {
		
		var cible = _cible || this,
			that = this;
		
		function addSlide(slide) {  that.addItem(slide); };
				
		if (Array.isArray(opt)) {
			this.clear();
			opt.forEach(addSlide);
			return cible;
		}
		
		if (!JSYG.isPlainObject(opt)) return cible;
								
		for (var n in opt) {
						
			if (n in cible) {
				if (JSYG.isPlainObject(opt[n]) && cible[n]) this.set(opt[n],cible[n]);
				else if (n == 'list' && Array.isArray(opt[n])) opt[n].forEach(addSlide);
				else cible[n] = opt[n];
			}
		}
		
		return cible;
	};
	
	JSYG.Slides.prototype.clear = function() {
		
		this.disable();
		this.list.splice(0,this.list.length);
		
		return this;
	};

	JSYG.Slides.prototype._setDim = function(jElmt) {
		
		var margin = {
				marginLeft:0,
				marginRight:this.clientWidth-this.width,
				marginTop:0,
				marginBottom:0	
			},
			dim = {
				width:this.width,
				height:this.height
			},
			backup = jElmt.data('slides') || {},
			minHeight,
			n, width, height;
			
					
		if (jElmt.getTag() === 'img') {
		
			width = jElmt[0].width;
			height = jElmt[0].height;
			
			if (!this.flexibleHeight && width/height < this.width/this.height) {
				dim.height = Math.min(height,this.height);
				dim.width = Math.round(width * dim.height / height);
			}
			else {
				dim.width = Math.min(width,this.width);
				dim.height = Math.round(height * dim.width / width);
			}
			
			margin.marginLeft = Math.floor((this.width - dim.width)/2);
			margin.marginRight = Math.ceil((this.width - dim.width)/2);
			margin.marginTop = !this.flexibleHeight && Math.floor((this.height - dim.height)/2) || 0;
			margin.marginBottom = !this.flexibleHeight && Math.ceil((this.height - dim.height)/2) || 0;
		}
						
		for (n in dim) backup[n] = jElmt.css(n);
		
		for (n in margin) backup[n] = jElmt.css(n);
		
		jElmt.data('slides',backup);
		jElmt.css(margin);
		
		if (this.flexibleHeight) {
			delete dim.height;
			minHeight = jElmt.css('min-height');
			if (!minHeight || !parseInt(minHeight,10)) jElmt.css('min-height','1px'); //si height=0 alors width=0 avec FF
		}
		
		jElmt.setDim(dim);
				
		return this;
	};
	/**
	 * R�cup�ration d'un slide de la liste
	 * @param {Number,String,Object} item indice ou nom de l'élément à récupèrer
	 * @returns {JSYG.ContextItem}
	 */
	JSYG.Slides.prototype.getSlide = function(slide) {
		
		if (slide instanceof JSYG.Slide && this.list.indexOf(slide) != -1) return slide;
		else if (JSYG.isNumeric(slide) && slide>=0 && slide<this.list.length) return this.list[slide];
		else if (typeof slide == 'string') {
			var i = this.list.length;
			while (i--) {
				if (this.list[i].name == slide) return this.list[i];
			}
		}
		
		return null;
	};
	/**
	 * Chargement d'un slide.
	 * @param ind slide ou indice ou nom du slide
	 * @param callback optionnel, fonction à ex�cuter apr�s chargement. Elle est ex�cut�e quel que soit le r�sultat du chargement
	 * (� la diff�rence de l'évènement onload qui ne s'ex�cute qu'en cas de chargement complet).
	 */
	JSYG.Slides.prototype.load = function(ind,callback) {
		
		var slide = this.getSlide(ind),
			jDiv = new JSYG(this.node),
			loading = callback && slide.loading, //si pas de fonction de rappel, on consid�re que le chargement se fait discr�tement.
			that = this;
		
		if (!slide) return this;
		
		if (loading === true) loading = {icon:"small"};
                
		callback = callback || function() {};
										
		if (slide.type == 'ajax' && (!slide.node.firstChild || slide.refresh === true)) {
		
			return JSYG.Ajax({
				url:slide.url,
				onstart : loading ? function() { jDiv.loadingMask('fadeIn',loading); } : null,
				onend : loading ? function() { jDiv.loadingMask('fadeOut'); } : null,
				onsuccess:function() {
					if (!slide.onload) new JSYG(slide.node).html(this.responseText);
					else slide.trigger("load",slide.node,this.responseText);
					callback();
				},
				onerror:callback
			});
		}
		else if (slide.type == 'image' && !slide.node.firstChild) {

			return new JSYG.Promise(function(resolve,reject) {
				
				var img = new Image();
				slide.node.appendChild(img);
	                        		
				loading && jDiv.loadingMask('fadeIn',loading);
	                        
				img.onload = function() {
					that._setDim(new JSYG(this));
				    loading && jDiv.loadingMask('fadeOut');
				    slide.trigger("load",slide.node,this);
				    callback && callback.call(slide.node,this);
				    resolve(this);
				};
							
				img.onerror = function() {
					this.alt="Error loading "+slide.url;
				    loading && jDiv.loadingMask('fadeOut');
				    callback && callback.call(slide.node,this);
				    resolve(this);
				};
										
				img.src = slide.url;
			});
		}
		else if (slide.type == 'iframe' && (!slide.node.firstChild || slide.refresh === true)) {
		
			return new JSYG.Promise(function(resolve,reject) {
				
				var iframe = new JSYG('<iframe>')
				.setDim({'width':that.width,'height':that.height})
				.attr('frameborder',0)
				.appendTo(slide.node);
				
				iframe.on("load",function() {
				     loading && jDiv.loadingMask('fadeOut');
				     slide.trigger("load",slide.node,this);
				     callback && callback.call(slide.node,this);
				     resolve(this);
				});
				
				iframe.on("error",function() {
				     loading && jDiv.loadingMask('fadeOut');
				     callback && callback.call(slide.node,this);
				     resolve(this);
				});
							
				iframe.href(slide.url);
			});
		}
		else return JSYG.Promise.resolve( callback && callback.call(slide.node) );
	};
	
	/**
	 * Met à jour les dimensions de chaque slide et du conteneur si du contenu a �t� modifi�.
	 * @returns {JSYG.Slides}
	 */
	JSYG.Slides.prototype.updateDim = function() {
			
		var jNode = new JSYG(this.node),
			innerDim = jNode.innerDim(),
			that = this,
			dim;
		
		this.width = innerDim.width;
		this.height = innerDim.height;
		
		this.clientWidth = jNode.getDim().width;
		
		dim = {
			height:this.height,
			width:this.clientWidth * this.list.length,
			x:-this.current*this.clientWidth
		};
		
		if (this.flexibleHeight) delete dim.height;
				
		new JSYG(this.container).setDim(dim);
		
		this.list.forEach(function(slide) {
			that._setDim(new JSYG(slide.node));
		});
					
		return this;
	};
	
	/**
	 * Ajout d'un slide. Cela peut se faire "� chaud" (alors que les slides sont d�j� actifs)
	 * @param slide instance de JSYG.Slide
	 * @param ind optionnel, indice d'insertion
	 * @returns {JSYG.Slides}
	 * @see JSYG.Slide
	 */
	JSYG.Slides.prototype.addItem = function(slide,ind) {
			
		if (slide.constructor !== JSYG.Slide) {
			if (JSYG.isPlainObject(slide)) slide = new JSYG.Slide(slide);
			else throw new Error("L'argument slide doit être une instance de JSYG.Slide");
		}
		
		if (this.list.indexOf(slide) !== -1) throw new Error("Ce slide est d�j� dans la liste");
		
		var jSlide,
			style = {
				"float":"left",
				"display":"block",
				"overflow-x":"hidden",
				"position":"relative"
			},
			jContent = new JSYG(this.container),
			that = this,
			backup = {},n;
		
		if (slide.type === 'html') {
			
			jSlide = new JSYG(slide.content);
						
			for (n in style) backup[n] = jSlide.css(n) || '';
			
			if (jSlide.parent().length > 0) {
				backup.parent = jSlide.parent();
				backup.next = jSlide.next();
			}
			
			jSlide.css(style).data('slides',backup);
			
			slide.node = jSlide.node;
			
		} else {
			jSlide = new JSYG('<div>').css(style);
			slide.node = jSlide.node;
		}
					
		if (jSlide.getTag() == 'img' && !jSlide.node.complete) {

			jSlide.node.onload = function() {
				if (that.enabled) that._setDim(jSlide);
			};
		}
		else if (this.container.parentNode) this._setDim(jSlide);
					
		if (ind!=null) {
			
			if (this.enabled) {
				
				jSlide.insertBefore(this.list[ind].node);
				
				if (this.current !==-1 && ind <= this.current) {
					this.current++;
					jContent.css('left',-this.current*this.clientWidth);
				}
			}
			
			this.list.splice(ind,0,slide);
		}
		else {
			if (this.enabled) jContent.append(jSlide.node);
			this.list.push(slide);
		}
		
		if (this.enabled) jContent.setDim({width : (this.clientWidth * this.list.length) } );
		
		return this;
	};
	
	/**
	 * Suppression d'un slide. Cela peut se faire "� chaud" (alors que les slides sont d�j� actifs)
	 * @param ind slide ou indice du slide à supprimer
	 * @returns {JSYG.Slides}
	 */
	JSYG.Slides.prototype.removeItem = function(ind) {
		
		var slide = this.getSlide(ind),
			jContent = new JSYG(this.container);
		
		if (!slide) return this;
		
		this.list.splice(ind,1);
		
		if (!this.enabled) return this;
		
		new JSYG(slide.node).remove();
				
		if (this.current!==-1 && ind < this.current) {
			this.current--;
			jContent.css('left',-this.current*this.clientWidth);
		}
		
		jContent.setDim({width : (this.clientWidth * this.list.length)});
		
		if (this.current === ind) {
			if (this.list[ind]) this.show(ind);
			else this.show(ind-1);
		}
		
		return this;
	};
	
	/**
	 * Affiche le slide suivant
	 * @param callback optionnel, fonction à ex�cuter à l'affichage du suivant
	 * @returns {JSYG.Slides}
	 */
	JSYG.Slides.prototype.next = function(callback) {
		this.show(this.current+1,callback);
		return this;
	};
	
	/**
	 * Affiche le slide pr�c�dent
	 * @param callback optionnel, fonction à ex�cuter à l'affichage du pr�c�dent
	 * @returns {JSYG.Slides}
	 */
	JSYG.Slides.prototype.prev = function(callback) {
		this.show(this.current-1,callback);
		return this;
	};
	
	/**
	 * Actualise le slide courant
	 * @param callback optionnel, fonction à ex�cuter à l'actualisation
	 * @returns {JSYG.Slides}
	 */
	JSYG.Slides.prototype.refresh = function(callback) {
		this.show(this.current,callback);
		return this;
	};
	
	/**
	 * récupère le slide courant
	 * @returns JSYG.Slide
	 */
	JSYG.Slides.prototype.getCurrent = function() {
		
		return this.list[ this.current ];
	};
	
	/**
	 * Affiche un slide donn�
	 * @param ind slide ou indice ou nom du slide à afficher
	 * @param callback optionnel, function à ex�cuter apr�s affichage
	 * @returns
	 */
	JSYG.Slides.prototype.show = function(ind,callback) {
	
		if (!this.enabled) return this;
				
		if (this.list.length === 0) throw new Error("aucun slide n'a �t� défini");
		
		if (!JSYG.isNumeric(ind)) {
			ind = this.list.indexOf( this.getSlide(ind) );
			if (ind===-1) return this;
		}
				
		if (ind<0) return this.loop ? this.show(ind+this.list.length) : this;
		else if (ind>this.list.length-1) return this.loop ? this.show(ind-this.list.length) : this;
					
		var that = this,
			go,current,
			jContent = new JSYG(this.container),
			changeSlide = (ind !== this.current);
		
		function trigger() {
			
			changeSlide && that.trigger('change');
			changeSlide && current.trigger('toggle');
			current.trigger('show');
			callback && callback();
		}
		 
		if (changeSlide && this.current.refresh === false) return this;
				
		if (changeSlide && this.list[this.current]) {
			
			current = this.list[this.current];
			current.trigger('toggle');
			current.trigger('hide');
			
			this.list.forEach(function(slide) {
				if (!slide.field || !slide.classFieldSelected) return;
				new JSYG(slide.field).classRemove(slide.classFieldSelected);
			});
		}
		
		this.current = ind;
		current = this.list[ind];
                
        if (!changeSlide) go = trigger;
        else {
        	
            switch (current.effect || this.effect) {

                case 'none' :
                    go = function() {
                		jContent.css('left',-ind*that.clientWidth);
                        trigger();
                    };
                    break;

                case 'slide' :
                    go = function() {
                		jContent.animate(
                            JSYG.extend(
                                {to:{left:-ind*that.clientWidth},easing:'swing'},
                                that.effectOptions,
                                current.effectOptions,
                                {onend:trigger}
                            )
                        );
                    };
                    break;

                case 'fade' :
                    go = function() {
                		jContent.css('display','none');
                        jContent.css('left',-ind*that.clientWidth);
                        jContent.show('fade',trigger);
                    };
                    break;

                case 'accordion' :
                    go = function() {
                		var jDiv = new JSYG(that.node);
                		jDiv.hide('slide',function() { jContent.css('left',-ind*that.clientWidth); })
                        .show('slide',trigger);
                    };
                    break;
            }   
        }
        
        if (current.field && current.classFieldSelected) {
			new JSYG(current.field).classAdd(current.classFieldSelected);
		}
		                
		this.load(ind).then(go);
		
		if (changeSlide && this.anticipate) this.load(ind+1);
		
		return this;
	};
	
	/**
	 * Activation des slides
	 * @param opt optionnel, objet définissant les options
	 * @returns {JSYG.Slides}
	 */
	JSYG.Slides.prototype.enable = function(opt) {
		
		this.disable();
		
		if (opt) this.set(opt);
		
		var that = this,
			jDiv = new JSYG(this.node),
			jCont = new JSYG(this.container),
		
			overflow = jDiv.css('overflow'),
			position = jDiv.css('position'),
			dim = jDiv.getDim(),
			innerDim = jDiv.innerDim();
		
		this.width = innerDim.width;
		this.height = innerDim.height;
				
		this.clientWidth = dim.width;		
		
		jCont
		.css({
			left:'0px',
			padding:0,
			margin:0,
			width:this.clientWidth * this.list.length +'px',
			position:'relative'
		});
		
		if (!this.flexibleHeight) jCont.css('height',this.height+'px');
		
		jCont.appendTo(jDiv);
					
		jDiv.css('overflow','hidden').setDim({width:dim.width});
		
		if (!this.flexibleHeight) jDiv.setDim({height:dim.height});
		
		if (position == 'static') jDiv.css('position','relative');
		
		this.list.forEach(function(slide,i) {
		
			var node = slide.node,
				jNode,data;
			
			if (node.tagName == 'IMG' && !node.complete) node.onload = function() { that._setDim(new JSYG(node)); };
			else that._setDim(new JSYG(node));
			
			that.container.appendChild(node);
			
			if (!slide.field) return;
							
			jNode = new JSYG(slide.node);
			data = jNode.data('slides');
			
			function fct(e) {
				e.preventDefault();
				that.show(slide);
			}
			
			new JSYG(slide.field).each(function() {
				new JSYG(this).classAdd(slide.classField).on('click',fct);
			});
			
			if (!data) {
				data = {fct:fct};
				jNode.data('slides',data);
			}
			else data.fct = fct;
		});
		
		this.enabled = true;

		var unload;
		
		if (this.cookie) {
			
			if (!JSYG.cookies) throw new Error("Il faut inclure le plugin JSYG.Cookies");
			
			unload = function() { JSYG.cookies.setItem('slides',that.current); };
			
			var cookie = JSYG.cookies.getItem('slides');
			
			if (cookie!=null) this.show(cookie);
			else this.show(this.defaultSlide);
			
			new JSYG(window).on('unload',unload);
			
		}
		else this.show(this.defaultSlide);
		
		
		this.disable = function() {
			
			jDiv.css({
				overflow : overflow,
				position : position
			});
			
			var slide,data,jSlide,fct;
			
			for (var i=0,N=this.list.length;i<N;i++) {
				
				slide = this.list[i];
				
				jSlide = new JSYG(slide.node);
				
				data = jSlide.data('slides');
				
				if (!data) continue;
				
				if (data.fct) {
					fct = data.fct;
					delete data.fct;
				} else { fct = null; }
				
				if (slide.type === 'html') {
										
					if (data.parent) {
						if (data.next) jSlide.insertBefore(data.next);
						else jSlide.appendTo(data.parent);
						delete data.parent;
						delete data.next;
					}

					jSlide.css(data);
				}
				
				if (!slide.field || !fct) continue;
				
				new JSYG(slide.field).each(function() {
					new JSYG(this).classRemove(slide.classField,slide.classFieldSelected).off('click',fct);
				});
			}
			
			new JSYG(window).off('unload',unload);
			
			this.current = -1;
							
			new JSYG(this.container).remove();
			this.width = null;
			this.clientWidth = null;
			this.height = null;
			this.enabled = false;
			
			return this;
		};
		
		return this;
	};
	
	/**
	 * Désactivation des slides
	 * @returns {JSYG.Slides}
	 */
	JSYG.Slides.prototype.disable = function() {
		return this;
	};
	
	/**
	 * Désactivation et r�mise à z�ro des slides
	 */
	JSYG.Slides.prototype.destroy = function() {
		this.disable();
		this.list = [];
		this.reset();
	};
	
	
	var plugin = JSYG.bindPlugin(JSYG.Slides);
	/**
	 * <strong>nécessite le module Slides</strong><br/><br/>
	 * slides de pr�sentation
	 * @returns {JSYG}
	 * @see JSYG.Slides pour une utilisation d�taill�e
	 * @example <pre>new JSYG('#maDiv').Slides([
	 * 	{type:'html',content:'#contenu1',field:'#champ1'},
	 *  {type:'ajax',url:'affiche.php',field:'#champ2'},
	 *  {type:'image',url:'monImage.png',field:'#champ3'}
	 * ]);
	 */
	JSYG.prototype.slides = function() { return plugin.apply(this,arguments); };
	
})();