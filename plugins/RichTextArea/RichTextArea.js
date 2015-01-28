JSYG.require("RichTextArea.css","Color");

(function() {

	"use strict";
	
	/**
	 * Chemin pour les images
	 */
	var pathImages = JSYG.require.baseURL+'/RichTextArea/img/';
	
	/**
	 * <strong>nécessite le module RichTextArea</strong><br/><br/>
	 * Transformation d'un champ textarea en �diteur de texte riche.<br/><br/>
	 * @param arg argument JSYG faisant référence � un champ textarea.
	 * @param opt optionnel, objet définissant les options. Si défini, le module est activ� implicitement.
	 * @returns {JSYG.RichTextArea}
	 */
	JSYG.RichTextArea = function(arg,opt) {
	
		this.node = new JSYG(arg).node;
		
		/**
		 * Conteneur de la richTextArea (élément iframe)
		 */
		this.container = new JSYG('<iframe>').node;
		
		/**
		 * Gestion des titres
		 */
		this.heading = new Heading(this);
		/**
		 * Gestion des familles de police
		 */
		this.fontFamily = new FontFamily(this);
		/**
		 * Gestion de la taille de la police
		 */
		this.fontSize = new FontSize(this);
		/**
		 * Gestion de l'alignement
		 */
		this.textAlign = new TextAlign(this);
		/**
		 * Gsetion de la couleur de police
		 */
		this.fontColor = new FontColor(this);
		/**
		 * Gestion du gras
		 */
		this.fontWeight = new FontWeight(this);
		/**
		 * Gestion de l'italique
		 */
		this.fontStyle = new FontStyle(this);
		/**
		 * Gestion du soulignage
		 */
		this.textDecoration = new TextDecoration(this);
		/**
		 * Insertion de liens
		 */
		this.createLink = new CreateLink(this);
		/**
		 * Insertion de listes ordonnées ou non ordonnées
		 */
		this.insertList = new InsertList(this);
		/**
		 * Gestion des smileys
		 */
		this.smileys = new Smileys(this);
		/**
		 * Gestion de la r�initialisation du style
		 */
		this.styleReset = new Reset(this);
		
		if (opt) this.enable(opt);
	};
		
	JSYG.RichTextArea.prototype = {
		
		constructor : JSYG.RichTextArea,
		
		/**
		 * Classe appliquée � l'iframe rempla�ant la textarea
		 */
		className : 'rich',
		/**
		 * Class appliquée � la barre d'outils
		 */
		classToolBar : 'richToolBar',
		/**
		 * Contenu de l'iframe (contentDocument)
		 */
		frame : null,
				
		lists : [],
		/**
		 * Indique si le module est actif ou non
		 */
		enabled : false,
				
		set : JSYG.StdConstruct.prototype.set,
		/**
		 * Fonction(s) � ex�cuter � chaque fois qu'on ex�cute une commande de style
		 */
		onexec : null,
		/**
		 * Fonction(s) � ex�cuter � chaque fois que le contenu est modifi�
		 */
		onchange : null,
		/**
		 * Ajout d'un �couteur d'�v�nement, soit customis� ("exec","change"), soit natif ("mousedown","keypress", etc)
		 * @returns {JSYG.RichTextArea}
		 * @see JSYG.StdConstruct.prototype.on
		 */
		on : function(evt,fct) {
			if (this['on'+evt] !== undefined) JSYG.StdConstruct.prototype.on.call(this,evt,fct);
			else new JSYG(this.frame).on(evt,fct);
			return this;
		},
		
		/**
		 * Retrait d'un �couteur d'�v�nement, soit customis� ("exec","change"), soit natif ("mousedown","keypress", etc)
		 * @returns {JSYG.RichTextArea}
		 * @see JSYG.StdConstruct.prototype.on
		 */
		off : function(evt,fct) {
			if (this['on'+evt] !== undefined) JSYG.StdConstruct.prototype.off.call(this,evt,fct);
			else new JSYG(this.frame).off(evt,fct);
			return this;
		},
		
		trigger : JSYG.StdConstruct.prototype.trigger,
		
		/**
		 * Ex�cution d'une fonction quand l'iframe est pr�te � l'emploi
		 * @param callback fonction � ex�cuter
		 * @returns {JSYG.RichTextArea}
		 */
		whenReady : function(callback) {//Le onload n'est pas suffisant pour acc�der au body avec IE
		
			var frame = this.frame;
			
			var fct = function() {
				if (!frame.body) return window.setTimeout(fct,100);
				else callback();
			};
			
			fct();
						
			return this;
		},
		
		/**
		 * Ex�cution d'une commande d'�dition
		 * @param cmd nom de la commande
		 * @param arg argument si nécessaire
		 * @returns {JSYG.RichTextArea}
		 * @link https://developer.mozilla.org/en-US/docs/Rich-Text_Editing_in_Mozilla#Executing_Commands
		 */
		exec : function(cmd,arg) {
			
			var frame = this.frame; 
			
			this.container.contentWindow.focus();
			
			frame.execCommand(cmd,false,arg);
			
			new JSYG(this.node).val(frame.body.innerHTML); //mise à jour de la textarea originale
			
			this.trigger('exec',frame);
			
			if (frame.body.innerHTML !== this._oldHtml) {
				
				this.trigger('change',frame);
				this._oldHtml = frame.body.innerHTML;
			}
			return this;
		},
		
		/**
		 * Réinitialise tous les attributs de style du contenu
		 */
		reinitialize : function() {
			
			var frame = this.frame;
			
			this.container.contentWindow.focus();
			
			var html = frame.body.innerHTML;
			
			html = JSYG.stripTags(html,'<br>').replace(/\r|\n/g,'').replace(/\s+/g,' ');
			
			frame.body.innerHTML = html;
			
			this.trigger('exec',frame);
			
			if (html!== this._oldHtml) {
				
				this.trigger('change',frame);
				this._oldHtml = html;
			}
		},
		
		/**
		 * définit ou récupère le contenu
		 * @param val si défini, remplace le contenu. Si non défini, renvoie le contenu
		 * @returns
		 */
		html : function(val) {
			
			if (val != null) {
				var that = this;
				this.whenReady(function() {	that.frame.body.innerHTML = val; });
				return this;
			}
			
			if (!this.frame ||!this.frame.body) { return false; }
			return this.frame.body.innerHTML;
		},
		
		/**
		 * récupère le noeud de texte sélectionn�
		 * @returns {JSYG}
		 */
		getNodeSelection : function() {
			
			var content = this.container.contentWindow,
				ieContent = this.frame.selection,
				selection = content.getSelection ? content.getSelection().getRangeAt(0).commonAncestorContainer : ieContent.createRange().parentElement();
				
			if (selection.nodeType !== 1) selection = selection.parentNode;
			
			//console.log(content.getSelection().containsNode());
						
			return new JSYG(selection);
		},
				
		_createList : function() {
			var list = new JSYG('<div>').css('display','none');
			this.lists.push(list);
			return list;
		},
		
		/**
		 * Masque toutes les menus affich�s
		 */
		hideLists : function() {
			for (var i=0,N=this.lists.length;i<N;i++) this.lists[i].css('display','none');
			return this;
		},
		
		_oldHtml : '', 
		
		/**
		 * définition de la fonction qui mettra � jour les options de style en fonction du texte sélectionn�
		 */
		_addUpdateFunction : function(fct) {
			
			new JSYG(this.frame).on("click keyup",fct);
			/*
			if (JSYG.support.inputAutoFireEvent) {
				//IE déclenche l'évènement input même quand on change la valeur en javascript
				//ce qui provoque des choses inattendues parfois
				//donc on applique une version dégradée
				new JSYG(this.frame).on("click keyup",fct);
				
			}
			else new JSYG(this.frame).on("input",fct);
			*/
			return this;
		},
		
		_removeUpdateFunction : function(fct) {
			new JSYG(this.frame).off({
				click:fct, keyup:fct
			});
			return this;
		},
		
		/**
		 * création de la barre d'outils
		 * @param nom des fonctionnalit�s � activer (nombre d'arguments variables, parmi 'heading', 'fontFamily','fontSize','fontColor','textAlign','fontWeight','fontStyle','textDecoration','createLink','insertList','smileys','styleReset').
		 * "all" pour tout activer.
		 * @returns {JSYG} objet JSYG de la div cr��e
		 */
		createToolBar : function() {
			
			var opt = [], n,
				div = new JSYG('<div>').classAdd(this.classToolBar),
				that = this;
			
			if (arguments.length === 0 || arguments[0] === 'all') {
				opt = ['heading','fontFamily','fontSize','fontColor','textAlign','fontWeight','fontStyle','textDecoration','createLink','insertList','smileys','styleReset'];
			}
			else if (arguments.length ==1 && JSYG.isPlainObject(arguments[0])) {
				for (n in arguments[0]) if (arguments[0][n]) opt.push(n); 
			}
			else opt = Array.prototype.slice.call(arguments);
			
			function createButton(name) {
				
				var a = new JSYG('<a>').href('#')
					.on('click',function(e) { e.preventDefault(); })
					.classAdd('richIcon',name).appendTo(div);
				
				if (name === 'smileys') {
					
					new JSYG('<img>').attr({
						src:pathImages+'smileys/smile.png',
						alt:'smileys'
					}).appendTo(a);
					
				}
				else if (name === 'createLink') {
					
					new JSYG('<img>').attr({
						src:pathImages+'link.png',
						alt:'link'
					}).appendTo(a);
					
				} else if (name === 'insertList') {
					
					new JSYG('<img>').attr({
						src:pathImages+'lists/text_list_bullets.png',
						alt:'list'
					}).appendTo(a);
					
				} else {
										
					switch (name) {
						case 'fontWeight' : a.text('B').css('font-weight','bold'); break;
						case 'fontStyle' : a.text('I').css('font-style','italic'); break;
						case 'textDecoration' : a.text('U').css('text-decoration','underline'); break;
						case 'styleReset' : a.text('X').css('color','red'); break;
						default : a.text(name); break;
					};
					
					
				}
				
				return a;
			}
			
			opt.forEach(function(opt) {
				
				var name = JSYG.camelize(opt);
				
				if (that[name] != null) that[name].enable({field:createButton(name)});
			});
						
			return div;
		},
			
		/**
		 * Activation de la richTextArea
		 * @param opt optionnel, objet définissant les options
		 * @returns {JSYG.RichTextArea}
		 */
		enable : function(opt) {
		
			this.disable();
			
			if (opt) this.set(opt);
			
			var jNode = new JSYG(this.node),
				that = this,
				iframe = new JSYG(this.container),
				frame,
				display;
			
			iframe.insertBefore(jNode);
						
			iframe.attr("frameborder",0)
			.classAdd(this.className)
			.setDim({
				width : jNode.css('width') || 400,
				height : jNode.css('height') || 200
			});
						
			frame = this.container.contentDocument ? this.container.contentDocument : this.container.contentWindow.document;
			
			frame.open();
			frame.write('<html><head><style>i{font-style:italic}a{color:blue}</style></head><body> </body></html>');
			frame.close();
			frame.designMode = 'On';
			
			this.frame = frame;
			
			display = jNode.css('display');
			jNode.css('display','none'); //on masque la textarea et on la remplace par l'iframe
			
			jNode.on('change',function() {
				if (this.value !== frame.body.innerHTML) frame.body.innerHTML = this.value;
			});
			
			this.whenReady(function() {
				
				//synchronisation des styles
				var liste = ['fontFamily','fontSize','color','textAlign','fontStyle','fontWeight','backgroundColor'];
				for (var i=0,N=liste.length;i<N;i++) frame.body.style[liste[i]] = jNode.css(liste[i]);
				
				//synchronisation du contenu
				frame.body.innerHTML = that._oldHtml = jNode.val();
												
				that._addUpdateFunction(function() {
					
					if (frame.body.innerHTML !== that._oldHtml) {
						that.trigger('change'); //d�clenchement artificiel de l'�v�nement onchange
						var html = frame.body.innerHTML;
						that._oldHtml = html;
						jNode.val(html);
					}
				});
			});
									
			function hideLists() { that.hideLists(); };
			new JSYG(document).on('click',hideLists);
			new JSYG(this.frame).on('click',hideLists);
			
			this.enabled = true;
			
			this.disable = function() {
				jNode.css('display',display);
				new JSYG(document).off('click',hideLists);
				new JSYG(this.container).clear().remove();
				this.frame = null;
				this.enabled = false;
				return this;
			};
			
			return this;
		},
		/**
		 * D�sactivation de la richTextArea
		 * @returns {JSYG.RichTextArea}
		 */
		disable : function() { return this; }
	};
	
	
	/**
	 * Gestion de l'alignement
	 */
	function Heading(richTextObject) {
		/**
		 * Référence vers l'objet JSYG.RichTextArea
		 */
		this.richTextArea = richTextObject;
	};
	
	Heading.prototype = new JSYG.StdConstruct();
	
	Heading.prototype.constructor = Heading;
	/**
	 * Champ permettant d'afficher la liste
	 */
	Heading.prototype.field = null;
	/**
	 * Classe appliquée à la liste affichée
	 */
	Heading.prototype.classNameList = 'richList heading';
	/**
	 * Fonction(s) à exécuter lorsqu'une valeur est sélectionnée
	 */
	Heading.prototype.onexec = null;
	/**
	 * Indique si le module est actif
	 */
	Heading.prototype.enabled = false;
	
	Heading.prototype._regExp = /h([1-6])/i;
		
	/**
	 * Changement du titre
	 * @param tag 'H1','H2','H3','H4','H5','H6' ou 'normal'
	 * @returns {Heading}
	 */
	Heading.prototype.exec = function(tag) {
							
		var ie = !!this.richTextArea.frame.selection;
		
		if (!this._regExp.test(tag)) this.richTextArea.exec('removeFormat');
		else {
			
			tag = tag.toUpperCase();
			if (ie) tag = '<' + tag + '>';
			
			this.richTextArea.exec('formatBlock',tag);
		}
		
		//this.richTextArea.exec('insertBrOnReturn');
		
		this.trigger('exec',this.richTextArea.frame);
		
		return this;
	};
	/**
	 * Activation du module
	 * @param opt optionnel, objet définissant les options.
	 * La propriété field doit être définie
	 * @returns {TextAlign}
	 */
	Heading.prototype.enable = function(opt) {
			
		this.disable();
		
		if (opt) this.set(opt);
		
		if (!this.field) throw new Error("Il faut d'abord définir la propriété field");
		
		var jField = new JSYG(this.field),
			content = jField.html(),
			rta = this.richTextArea,
			that = this,
			list,i,N;
		
		if (!rta.enabled) throw new Error("Il faut d'abord activer l'object RichTextArea par la méthode enable");
								
		function action(tag) {
			
			return function(e){
				e.preventDefault();
				that.exec(tag);
				updateField(tag);
			};
		}
		
		function showList(e) {
			e.stopPropagation();
			rta.hideLists();
			var dim = jField.getDim();
			list.appendTo(jField.offsetParent()).setDim({x:dim.x,y:dim.y+dim.height});
			list.css('display','block');
		}
		
		function updateFct() {
			var selection = rta.getNodeSelection(), 
				tag = selection && selection.getTag();
			updateField(tag);
		}
		
		function updateField(tag) {
			var matches = that._regExp.exec(tag);
			if (matches) jField.text("Titre "+matches[1]);
			else jField.text("Normal");
		}
		
		jField.text("Normal");

		list = rta._createList().classAdd(this.classNameList);
				
		for (i=1,N=6;i<=N;i++) {
									
			new JSYG('<a>').href('#')
			.append( new JSYG("<h"+i+">").text('Titre '+i) )
			.classAdd("heading"+i)
			.on('click',action("H"+i))
			.appendTo(list);
		}
		
		jField.on('click',showList);
		
		rta._addUpdateFunction(updateFct);
					
		this.disable = function() {
			
			jField.html(content);
			jField.off('click',showList);
			rta.lists.splice(rta.lists.indexOf(list),1);
			rta._removeUpdateFunction(updateFct);
			list.remove();
			this.enabled = false;
			return this;
		};
		
		this.enabled = true;
		
		return this;
	};
	
	Heading.prototype.disable = function() { return this; };
	
	
	/**
	 * Gestion de la famille de police
	 */
	var FontFamily = function(richTextObject) {
		/**
		 * référence vers l'objet JSYG.RichTextArea
		 */
		this.richTextArea = richTextObject;
		/**
		 * Liste des familles possibles
		 */
		this.list = ['Arial','Bookman Old Style','Courier New','Garamond','Helvetica','Lucida Console','Tahoma','Times New Roman','Verdana'];
	};
	
	FontFamily.prototype = new JSYG.StdConstruct();
	
	FontFamily.prototype.constructor = FontFamily;
	/**
	 * Champ permettant de choisir la famille
	 */
	FontFamily.prototype.field = null;
	/**
	 * Classe appliquée � la liste affich�e
	 */
	FontFamily.prototype.classNameList = 'richList';
	/**
	 * Indique si le module est actif
	 */
	FontFamily.prototype.enabled = false;
	/**
	 * Fonction(s) � ex�cuter quand on change la police
	 */
	FontFamily.prototype.onexec = null;
	/**
	 * Changement de la police
	 * @param fontname nom de la police
	 */
	FontFamily.prototype.exec = function(fontname) {
		this.richTextArea.exec('fontname',fontname);
		this.trigger('exec',this.richTextArea.frame);
		return this;
	};
	/**
	 * Activation de la gestion des familles de police
	 * @param opt optionnel, objet définissant les options.
	 * La propriété field doit �tre définie.
	 * @returns {FontFamily}
	 */
	FontFamily.prototype.enable = function(opt) {
			
		this.disable();
		
		if (opt) this.set(opt);
		
		if (!this.field) throw new Error("Il faut d'abord définir la propriété field");
					
		var jField = new JSYG(this.field),
			rta = this.richTextArea,
			content = jField.html(),
			family,
			that = this,
			list,fontname,
			i,N;
		
		if (!rta.enabled) throw new Error("Il faut d'abord activer l'object RichTextArea par la méthode enable");
				
		function action(fontname) {
			return function(e){
				e.preventDefault();
				jField.text(fontname).css('font-family',fontname);
				that.exec(fontname);
			};
		}
		
		function showList(e) {
			e.stopPropagation();
			rta.hideLists();
			var dim = jField.getDim();
			list.appendTo(jField.offsetParent()).setDim({x:dim.x,y:dim.y+dim.height});
			list.css('display','block');
		}
		
		function updateFct() {
			var fontname = rta.getNodeSelection().css('font-family');
			if (!fontname) return;
			jField.text(fontname).css('fontFamily',fontname);
		}
					
		list = rta._createList().classAdd(this.classNameList);
				
		for (i=0,N=this.list.length;i<N;i++) {
		
			fontname = this.list[i];
			
			new JSYG('<a>').href('#').text(fontname)
			.css('font-family',fontname)
			.on('click',action(fontname))
			.appendTo(list);
		}
		
		jField.on('click',showList);
		
		
		rta._addUpdateFunction(updateFct);
		
		this.disable = function() {
			
			if (family) jField.css('font-family','family');
			
			jField.html(content).off('click',showList);
			
			rta.lists.splice(rta.lists.indexOf(list),1);
			
			rta._removeUpdateFunction(updateFct);
			
			list.remove();
			
			this.enabled = false;
			
			return this;
		};
		
		this.enabled = true;
		
		rta.whenReady(function() {
			family = rta.frame.body.style.fontFamily;
			jField.css('font-family',family).text(family);			
		});
		
		return this;
	};
	/**
	 * D�sactivation de la gestion des familles de police
	 * @returns {FontFamily}
	 */
	FontFamily.prototype.disable = function() { return this; };
	
	
	function size2pt(size) {
		
		size = size.toString();
		var val;
		
		switch(true) {
			case /px/.test(size) : val = Math.round(size.replace(/px/,'') / 1.33 ); break;
			case /pt/.test(size) : val = size.replace(/pt/,''); break;
			case size == 1 : val=7; break;
			case size == 2 : val=8; break;
			case size == 3 : val=9; break;
			case size == 4 : val=11; break;
			case size == 5 : val=14; break;
			case size == 6 : val=18; break;
			case size == 7 : val=28; break;
			default : val = 9;
		}
		
		return val+'pt';
	};
	
	
	/**
	 * Gestion de la taille de police
	 */
	function FontSize(richTextObject) {
		/**
		 * référence vers l'objet JSYG.RichTextArea
		 */
		this.richTextArea = richTextObject;
		this.list = [1,2,3,4,5,6,7];
	};
	
	FontSize.prototype = new JSYG.StdConstruct();
	
	FontSize.prototype.constructor = FontSize;
	/**
	 * Champ permettant d'afficher la liste
	 */
	FontSize.prototype.field = null;
	/**
	 * Classe appliquée � la liste
	 */
	FontSize.prototype.classNameList = 'richList';
	/**
	 * Fonction(s) � ex�cuter quand la taille de police est modifi�e
	 */
	FontSize.prototype.onexec = null;
	/**
	 * Indique si le module est actif
	 */
	FontSize.prototype.enabled = false;
	
	/**
	 * Changement de la taille de police
	 * @param fontsize taille de la police (1 � 7)
	 * @returns {FontSize}
	 */
	FontSize.prototype.exec = function(fontsize) {
		this.richTextArea.exec('fontsize',fontsize);
		this.trigger('exec',this.richTextArea.frame);
		return this;
	};
	/**
	 * Activation du module
	 * @param opt optionnel, objet définissant les options.
	 * La propriété field doit �tre définie
	 * @returns {FontSize}
	 */
	FontSize.prototype.enable = function(opt) {
			
		this.disable();
		
		if (opt) { this.set(opt); }
		
		if (!this.field) { throw "Il faut d'abord définir la propriété field"; }
		
		var jField = new JSYG(this.field);
		var rta = this.richTextArea;
		var that = this;
		
		if (!rta.enabled) { throw "Il faut d'abord activer l'object RichTextArea par la méthode enable"; }
		
		var size;
		var content = jField.html();
						
		var action = function(i) {
			return function(e){
				e.preventDefault();
				jField.text(size2pt(i));
				that.exec(i);
			};
		};
		
		var list = rta._createList().classAdd(this.classNameList);
		var fontsize;
		
		for (var i=0,N=this.list.length;i<N;i++) {
		
			fontsize = size2pt(this.list[i]);
			
			new JSYG('<a>').href('#').appendTo(list)
			.css('fontSize',fontsize).text(fontsize)
			.on('click',action(this.list[i]));
		}
		
		function showList(e) {
			e.stopPropagation();
			rta.hideLists();
			var dim = jField.getDim();
			list.appendTo(jField.offsetParent()).setDim({x:dim.x,y:dim.y+dim.height});
			list.css('display','block');
		};
		
		jField.on('click',showList);
		
		var updateFct = function() {
			var fontsize = size2pt(rta.getNodeSelection().css('fontSize'));
			if (!fontsize) {return;}
			jField.text(fontsize);
		};
		
		rta._addUpdateFunction(updateFct);
					
		this.disable = function() {
			if (size) { jField.css('fontSize',size); }
			jField.html(content);
			jField.off('click',showList);
			rta.lists.splice(rta.lists.indexOf(list),1);
			rta._removeUpdateFunction(updateFct);
			list.remove();
			this.enabled = false;
			return this;
		};
		
		rta.whenReady(function() {
			size = size2pt(rta.frame.body.style.fontSize);
			jField.text(size);			
		});
		
		this.enabled = true;
		
		return this;
	};
	/**
	 * D�sactivation du module.
	 * @returns {FontSize}
	 */
	FontSize.prototype.disable = function() { return this; };
	
	/**
	 * Gestion de l'alignement
	 */
	function TextAlign(richTextObject) {
		/**
		 * référence vers l'objet JSYG.RichTextArea
		 */
		this.richTextArea = richTextObject;
		/**
		 * Alignements possibles
		 */
		this.list = ['left','right','center','full'];
	};
	
	TextAlign.prototype = new JSYG.StdConstruct();
	
	TextAlign.prototype.constructor = TextAlign;
	/**
	 * Champ permettant d'afficher la liste
	 */
	TextAlign.prototype.field = null;
	/**
	 * Classe appliquée � la liste affich�e
	 */
	TextAlign.prototype.classNameList = 'richList';
	/**
	 * Fonction(s) � ex�cuter lorsqu'une valeur est sélectionn�e
	 */
	TextAlign.prototype.onexec = null;
	/**
	 * Indique si le module est actif
	 */
	TextAlign.prototype.enabled = false;
	
	TextAlign.prototype._getSrc = function(textAlign) {
		if (this.list.indexOf(textAlign) === -1) { textAlign = 'left'; }
		else if (textAlign === 'justify') { textAlign = 'full'; }
		return pathImages+'alignment/'+textAlign+'.gif';
	};
	
	/**
	 * Changement de l'alignement
	 * @param align 'left','right','center','full'
	 * @returns {TextAlign}
	 */
	TextAlign.prototype.exec = function(align) {
		this.richTextArea.exec('justify'+align);
		this.trigger('exec',this.richTextArea.frame);
		return this;
	};
	/**
	 * Activation du module
	 * @param opt optionnel, objet définissant les options.
	 * La propriété field doit �tre définie
	 * @returns {TextAlign}
	 */
	TextAlign.prototype.enable = function(opt) {
			
		this.disable();
		
		if (opt) this.set(opt);
		
		if (!this.field) throw "Il faut d'abord définir la propriété field";
		
		var jField = new JSYG(this.field),
			content = jField.html(),
			rta = this.richTextArea,
			img = new JSYG('<img>'),
			that = this;
		
		if (!rta.enabled) throw "Il faut d'abord activer l'object RichTextArea par la méthode enable";
		
		jField.clear().append(img);
								
		var action = function(textAlign) {
			return function(e){
				e.preventDefault();
				that.exec(textAlign);
				img.attr('src',that._getSrc(textAlign));
			};
		};

		var list = rta._createList().classAdd(this.classNameList);
		var a,textAlign;
		
		for (var i=0,N=this.list.length;i<N;i++) {
		
			textAlign = this.list[i];
							
			a = new JSYG('<a>').href('#')
			.on('click',action(textAlign))
			.appendTo(list);
			
			new JSYG('<img>').attr('src',this._getSrc(textAlign)).appendTo(a);
		}
		
		
		function showList(e) {
			e.stopPropagation();
			rta.hideLists();
			var dim = jField.getDim();
			list.appendTo(jField.offsetParent()).setDim({x:dim.x,y:dim.y+dim.height});
			list.css('display','block');
		};
		jField.on('click',showList);
		
		var updateFct = function() {
			var selection = rta.getNodeSelection(); 
			var textAlign = selection && selection.css('text-align');
			img.src = that._getSrc(textAlign);
		};
		
		rta._addUpdateFunction(updateFct);
					
		this.disable = function() {
			jField.html(content);
			jField.off('click',showList);
			rta.lists.splice(rta.lists.indexOf(list),1);
			rta._removeUpdateFunction(updateFct);
			list.remove();
			this.enabled = false;
			return this;
		};
		
		rta.whenReady(function() {
			textAlign = rta.frame.body.style.textAlign;
			img.attr('src',that._getSrc(textAlign));
		});
		
		this.enabled = true;
		
		return this;
	};
	
	TextAlign.prototype.disable = function() { return this; };
	
	/**
	 * Gestion de la couleur de police
	 */
	function FontColor(richTextObject) {
		/**
		 * référence vers l'objet JSYG.RichTextArea
		 */
		this.richTextArea = richTextObject;
		/**
		 * Liste des couleurs possibles
		 */
		this.list = [ 'black','brown','red','orange','yellow','green','blue','violet' ];
	};
	
	FontColor.prototype = new JSYG.StdConstruct();
		
	FontColor.prototype.constructor = FontColor;
	/**
	 * Champ permettant d'afficher la liste
	 */
	FontColor.prototype.field = null;
	/**
	 * Classe appliquée � la liste affich�e
	 */
	FontColor.prototype.classNameList = 'richList';
	/**
	 * Fonction(s) � ex�cuter lorsqu'une valeur est sélectionn�e
	 */
	FontColor.prototype.onexec = null;
	/**
	 * Indique si le module est actif
	 */
	FontColor.prototype.enabled = false;
	/**
	 * D�sactivation du module
	 * @returns {FontColor}
	 */
	FontColor.prototype.disable = function() { return this; };
	
	/**
	 * Changement de la couleur
	 * @param color nom de la couleur
	 * @returns {FontColor}
	 */
	FontColor.prototype.exec = function(color) {
		this.richTextArea.exec('forecolor',color);
		this.trigger('exec',this.richTextArea.frame);
		return this;
	};
	/**
	 * Activation du module
	 * @param opt optionnel, objet définissant les options.
	 * La propriété field doit �tre définie
	 * @returns {FontColor}
	 */
	FontColor.prototype.enable = function(opt) {
			
		this.disable();
		
		if (opt) this.set(opt);
		
		if (!this.field) throw new Error("Il faut d'abord définir la propriété field");
		
		var jField = new JSYG(this.field);
		var rta = this.richTextArea;
		
		if (!rta.enabled) throw new Error("Il faut d'abord activer l'object RichTextArea par la méthode enable");
				
		var content = jField.html();
							
		var colorInit = jField.css('color');
		var that = this;
						
		var action = function(color) {
			return function(e){
				e.preventDefault();
				that.exec(color);
				jField.text(color).css('color',color);
			};
		};

		var list = rta._createList().classAdd(this.classNameList);
		var color;
		
		for (var i=0,N=this.list.length;i<N;i++) {
		
			color = this.list[i];
							
			new JSYG('<a>').href('#')
			.text(color).css('color',color)
			.on('click',action(color))
			.appendTo(list);
		}
		
		function showList(e) {
			e.stopPropagation();
			rta.hideLists();
			var dim = jField.getDim();
			list.appendTo(jField.offsetParent()).setDim({x:dim.x,y:dim.y+dim.height});
			list.css('display','block');
		};
		jField.on('click',showList);
		
		var updateFct = function() {
			
			var selection = rta.getNodeSelection(),
				color = new JSYG.Color(selection && selection.css('color'));
			
			jField.text(color.toString('name') || color.toString('hex'));
			jField.css('color',color.toString());
		};
		
		rta._addUpdateFunction(updateFct);
		
		this.disable = function() {
			jField.css('color',colorInit).html(content);
			jField.off('click',showList);
			rta.lists.splice(rta.lists.indexOf(list),1);
			rta._removeUpdateFunction(updateFct);
			list.remove();
			this.enabled = false;
			return this;
		};
		
		rta.whenReady(function() {
			var color = new JSYG.Color(rta.frame.body.style.color);
			jField.text(color.toString('name') || color.toString('hex'));
		});
		
		this.enabled = true;
		
		return this;
	};
	
	
	function enableFct(action,opt) {

		this.disable();
		
		if (opt) this.set(opt);
		
		if (!this.field) throw new Error("Il faut d'abord définir la propriété field");
		
		var jField = new JSYG(this.field);
		var rta = this.richTextArea;
		
		if (!rta.enabled) throw new Error("Il faut d'abord activer l'object RichTextArea par la méthode enable");
		
		var that = this;
						
		var fct = function(e) {
			that.exec(action);
			jField.classToggle(that.classSelected);
		};

		jField.on('click',fct);
		
		var prop;
		
		switch (action) {
			case 'bold' : prop = 'fontWeight';break;
			case 'italic' : prop = 'fontStyle';break;
			case 'underline' : prop = 'textDecoration';break;
		}

		var updateFct = function() {
			var selection = rta.getNodeSelection(); 
			var val = selection && selection.css(prop);
			if (prop == 'fontWeight' && val == 700) val = 'bold'; //IE renvoie 700 pour bold
			if (val == action) jField.classAdd(that.classSelected);
			else jField.classRemove(that.classSelected);
		};
		
		rta._addUpdateFunction(updateFct);
		
		this.disable = function() {
			jField.classRemove(that.classSelected);
			jField.off('click',action);
			rta._removeUpdateFunction(updateFct);
			this.enabled = false;
			return this;
		};
		
		rta.whenReady(function() {
			if (rta.frame.body.style.fontWeight == 'bold') jField.classAdd(that.classSelected);
		});
		
		this.enabled = true;
		
		return this;
	};
	
	/**
	 * Gestion du gras
	 */
	function FontWeight(richTextObject) {
		/**
		 * référence vers l'objet JSYG.RichTextArea
		 */
		this.richTextArea = richTextObject;
	};
	
	FontWeight.prototype = new JSYG.StdConstruct();
	
	FontWeight.prototype.constructor = FontWeight;
	/**
	 * Champ d�clencheur du changement d'�paisseur
	 */
	FontWeight.prototype.field = null;
	/**
	 * Classe appliquée au champ quand le "gras" est actif
	 */
	FontWeight.prototype.classSelected = 'selected';
	/**
	 * Fonction(s) � ex�cuter lorsqu'on change la valeur
	 */
	FontWeight.prototype.onexec = null;
	/**
	 * Indique si le module est actif
	 */
	FontWeight.prototype.enabled = false;
	
	/**
	 * Change l'�paisseur de la police
	 */
	FontWeight.prototype.exec = function() {
		this.richTextArea.exec('bold');
		this.trigger('exec',this.richTextArea.frame);
		return this;
	};
	/**
	 * Activation du module
	 * @param opt optionnel, objet définissant les options.
	 * La propriété field doit �tre définie
	 * @returns {FontWeight}
	 */
	FontWeight.prototype.enable = function(opt) {
		enableFct.call(this,'bold',opt);
		return this;
	};
	/**
	 * D�sactivation du module
	 * @returns {FontWeight}
	 */
	FontWeight.prototype.disable = function() { return this; };
		
	/**
	 * Gestion de l'italique
	 */
	function FontStyle(richTextObject) {
		/**
		 * référence vers l'objet JSYG.RichTextArea
		 */
		this.richTextArea = richTextObject;
	};
	
	FontStyle.prototype = new JSYG.StdConstruct();
		
	FontStyle.prototype.constructor = FontStyle;
	/**
	 * Champ d�clencheur
	 */
	FontStyle.prototype.field = null;
	/**
	 * Classe appliquée au champ quand l'italique est actif
	 */
	FontStyle.prototype.classSelected = 'selected';
	/**
	 * Fonction(s) � ex�cuter lorsqu'on change la valeur
	 */
	FontStyle.prototype.onexec = null;
	/**
	 * Indique si le module est actif
	 */
	FontStyle.prototype.enabled = false;
	/**
	 * Changement italique/normal
	 */
	FontStyle.prototype.exec = function() {
		this.richTextArea.exec('italic');
		this.trigger('exec',this.richTextArea.frame);
		return this;
	};
	/**
	 * Activation du module
	 * @param opt optionnel, objet définissant les options.
	 * La propriété field doit �tre définie
	 * @returns {FontStyle}
	 */
	FontStyle.prototype.enable = function(opt) {
		enableFct.call(this,'italic',opt);
		return this;
	};
	/**
	 * D�sactivation du module
	 * @returns {FontStyle}
	 */
	FontStyle.prototype.disable = function() { return this; };
	
	/**
	 * Gestion du soulignement
	 */
	function TextDecoration(richTextObject) {
		/**
		 * référence vers l'objet JSYG.RichTextArea
		 */
		this.richTextArea = richTextObject;
	};
	
	TextDecoration.prototype = new JSYG.StdConstruct();
			
	TextDecoration.prototype.constructor = TextDecoration;
	/**
	 * Champ d�clencheur
	 */
	TextDecoration.prototype.field = null;
	/**
	 * Classe appliquée au champ quand le soulignement est actif
	 */
	TextDecoration.prototype.classSelected = 'selected';
	/**
	 * Fonction(s) � ex�cuter lorsqu'on change la valeur
	 */
	TextDecoration.prototype.onexec = null;
	/**
	 * Indique si le module est actif
	 */
	TextDecoration.prototype.enabled = false;
	
	/**
	 * Changement soulign�/normal
	 */
	TextDecoration.prototype.exec = function() {
		this.richTextArea.exec('underline');
		this.trigger('exec',this.richTextArea.frame);
		return this;
	};
	/**
	 * Activation du module
	 * @param opt optionnel, objet définissant les options.
	 * La propriété field doit �tre définie
	 * @returns {TextDecoration}
	 */
	TextDecoration.prototype.enable = function(opt) {
		enableFct.call(this,'underline',opt);
		return this;
	};
	/**
	 * D�sactivation du module
	 * @returns {TextDecoration}
	 */
	TextDecoration.prototype.disable = function() { return this; };
	
	
	/**
	 * Ajout d'un lien
	 */
	function CreateLink(richTextObject) {
		/**
		 * référence vers l'objet JSYG.RichTextArea
		 */
		this.richTextArea = richTextObject;
	};
	
	CreateLink.prototype = new JSYG.StdConstruct();
	
	CreateLink.prototype.constructor = CreateLink;
	/**
	 * Champ d�clencheur du changement d'�paisseur
	 */
	CreateLink.prototype.field = null;
	/**
	 * Fonction(s) à exécuter lorsqu'on change la valeur
	 */
	CreateLink.prototype.onexec = null;
	/**
	 * Indique si le module est actif
	 */
	CreateLink.prototype.enabled = false;
	
	/**
	 * Message à afficher pour la saisie de l'url
	 */
	CreateLink.prototype.prompt = "Saisissez l'URL du lien : ";
	/**
	 * Change l'épaisseur de la police
	 */
	CreateLink.prototype.exec = function() {
		
		var node = this.richTextArea.getNodeSelection();
			
		if (!node.text()) return;
				
		var link = window.prompt(this.prompt,node.href() || '');
		
		if (link == null) return;
		else if (link == "") this.richTextArea.exec('unlink');
		else this.richTextArea.exec('createLink',link);
		
		console.log(node,link);
		
		this.trigger('exec',this.richTextArea.frame);
		
		return this;
	};
	/**
	 * Activation du module
	 * @param opt optionnel, objet définissant les options.
	 * La propriété field doit être définie
	 * @returns {CreateLink}
	 */
	CreateLink.prototype.enable = function(opt) {
		enableFct.call(this,'createLink',opt);
		return this;
	};
	/**
	 * Désactivation du module
	 * @returns {CreateLink}
	 */
	CreateLink.prototype.disable = function() { return this; };
	
	
	
	function Smileys(richTextObject) {
		/**
		 * référence vers l'objet JSYG.RichTextArea
		 */
		this.richTextArea = richTextObject;
		/**
		 * Liste des smileys � afficher
		 */
		this.list = ['confuse','cool','cry','evilgrin','fat','grin','happy','mad','red','roll','slim','smile','surprised','tongue','unhappy','waii','wink','yell'];
	};

	Smileys.prototype = new JSYG.StdConstruct();
	
	Smileys.prototype.constructor = Smileys;
	/**
	 * Champ permettant d'afficher la liste
	 */
	Smileys.prototype.field = null;
	/**
	 * Classe appliquée � la liste affich�e
	 */
	Smileys.prototype.classNameList = 'richList smileys';
	/**
	 * Fonction(s) � ex�cuter lorsqu'une valeur est sélectionn�e
	 */
	Smileys.prototype.onexec = null;
	/**
	 * Indique si le module est actif
	 */
	Smileys.prototype.enabled = false;
	/**
	 * Insertion d'un smiley
	 * @param src url du smiley
	 * @returns {Smileys}
	 */	
	Smileys.prototype.exec = function(src) {
		this.richTextArea.exec('insertimage',src);
		this.trigger('exec',this.richTextArea.frame);
		return this;
	};
	
	/**
	 * Activation du module
	 * @param opt optionnel, objet définissant les options.
	 * La propriété field doit �tre définie
	 * @returns {Smileys}
	 */
	Smileys.prototype.enable = function(opt) {
			
		this.disable();
		
		if (opt) this.set(opt);
		
		if (!this.field) throw "Il faut d'abord définir la propriété field";
		
		var jField = new JSYG(this.field);
		var rta = this.richTextArea;
		
		if (!rta.enabled) { throw "Il faut d'abord activer l'object RichTextArea par la méthode enable"; }
				
		var content = jField.html();
					
		var that = this;
						
		var action = function(src) {
			return function(e){
				e.preventDefault();
				that.exec(src);
			};
		};

		var list = rta._createList().classAdd(this.classNameList);
		var a,smiley,src;
					
		for (var i=0,N=this.list.length;i<N;i++) {
		
			smiley = this.list[i];
			src = pathImages+'smileys/'+smiley+'.png';
							
			a = new JSYG('<a>').href('#')
			.on('click',action(src))
			.appendTo(list);
			
			new JSYG('<img>').attr('src',src).appendTo(a);
			
			if ((i+1) % 3 === 0 && i!==0 && i!=N-1) list.br();	
		}
		
		
		function showList(e) {
			e.stopPropagation();
			rta.hideLists();
			var dim = jField.getDim();
			list.appendTo(jField.offsetParent()).setDim({x:dim.x,y:dim.y+dim.height});
			list.css('display','block');
		};
		jField.on('click',showList);
								
		this.disable = function() {
			jField.html(content);
			jField.off('click',showList);
			rta.lists.splice(rta.lists.indexOf(list),1);
			list.remove();
			this.enabled = false;
			return this;
		};
					
		this.enabled = true;
		
		return this;
	};
	
	Smileys.prototype.disable = function() { return this; };
	
	
	
	function InsertList(richTextObject) {
		/**
		 * Référence vers l'objet JSYG.RichTextArea
		 */
		this.richTextArea = richTextObject;
	};

	InsertList.prototype = new JSYG.StdConstruct();
	
	InsertList.prototype.constructor = InsertList;
	/**
	 * Champ permettant d'afficher la liste
	 */
	InsertList.prototype.field = null;
	/**
	 * Classe appliquée à la liste affich�e
	 */
	InsertList.prototype.classNameList = 'richList insertList';
	/**
	 * Fonction(s) à exécuter lorsqu'une valeur est sélectionnée
	 */
	InsertList.prototype.onexec = null;
	/**
	 * Indique si le module est actif
	 */
	InsertList.prototype.enabled = false;
	/**
	 * Insertion d'un smiley
	 * @param src url du smiley
	 * @returns {Smileys}
	 */	
	InsertList.prototype.exec = function(ordered) {
		this.richTextArea.exec( ordered ? "insertOrderedList" : "insertUnorderedList");
		this.trigger('exec',this.richTextArea.frame);
		return this;
	};
	
	/**
	 * Activation du module
	 * @param opt optionnel, objet définissant les options.
	 * La propriété field doit être définie
	 * @returns {Smileys}
	 */
	InsertList.prototype.enable = function(opt) {
			
		this.disable();
		
		if (opt) this.set(opt);
		
		if (!this.field) throw new Error("Il faut d'abord définir la propriété field");
		
		var jField = new JSYG(this.field),
			rta = this.richTextArea,
			list, a, 
			that = this;
		
		if (!rta.enabled) throw new Error("Il faut d'abord activer l'object RichTextArea par la méthode enable");
				
		content = jField.html();
				
		function showList(e) {
			e.stopPropagation();
			rta.hideLists();
			var dim = jField.getDim();
			list.appendTo(jField.offsetParent()).setDim({x:dim.x,y:dim.y+dim.height});
			list.css('display','block');
		}

		list = rta._createList().classAdd(this.classNameList);
					
		a = new JSYG('<a>').href('#').on('click',function(e) { e.preventDefault(); that.exec(false); }).appendTo(list);
		new JSYG('<img>').attr('src',pathImages+'lists/text_list_bullets.png').appendTo(a);
		
		a = new JSYG('<a>').href('#').on('click',function(e) { e.preventDefault(); that.exec(true); }).appendTo(list);
		new JSYG('<img>').attr('src',pathImages+'lists/text_list_numbers.png').appendTo(a);
				
		jField.on('click',showList);
								
		this.disable = function() {
			jField.html(content);
			jField.off('click',showList);
			rta.lists.splice(rta.lists.indexOf(list),1);
			list.remove();
			this.enabled = false;
			return this;
		};
					
		this.enabled = true;
		
		return this;
	};
	
	InsertList.prototype.disable = function() { return this; };
	
	
	/**
	 * Gestion de la r�initialisation
	 */
	function Reset(richTextObject) {
		/**
		 * référence vers l'objet JSYG.RichTextArea
		 */
		this.richTextArea = richTextObject;
	};
	
	Reset.prototype = new JSYG.StdConstruct();
	
	Reset.prototype.constructor = Smileys;
	/**
	 * Champ d�clencheur
	 */
	Reset.prototype.field = null;
	/**
	 * Message de confirmation � afficher avant r�initialisation
	 * null pour ne pas afficher de message
	 */
	Reset.prototype.confirm = "Etes-vous sûr de vouloir supprimer la mise en forme du texte ?";
	/**
	 * Fonction(s) � ex�cuter lorsqu'on ex�cute la commande
	 */
	Reset.prototype.onexec = null;
	/**
	 * Indique si le module est actif
	 */
	Reset.prototype.enabled = false;
	
	/**
	 * R�initialise toutes les balises de style
	 */
	Reset.prototype.exec = function(src) {
		if (!this.confirm || window.confirm(this.confirm)) this.richTextArea.reinitialize();
		this.trigger('exec',this.richTextArea.frame);
		return this;
	};
	/**
	 * Activation du module
	 * @param opt optionnel, objet définissant les options.
	 * La propriété field doit �tre définie
	 * @returns {Reset}
	 */
	Reset.prototype.enable = function(opt) {
		
		this.disable();
		
		if (opt) this.set(opt);
		
		if (!this.field) throw new Error("Il faut d'abord définir la propriété field");
					
		var jField = new JSYG(this.field);
		var action = this.exec.bind(this);
		
		jField.on('click',action);
		
		this.disable = function() {
			jField.off('click',action);
			this.enabled = false;
			return this;
		};
		
		this.enabled = true;
		
		return this;
	};
	/**
	 * D�sactivation du module
	 * @returns {Reset}
	 */
	Reset.prototype.disable = function() { return this; };
	
})();