JSYG.require("Console.css","Cookies","BoundingBox","WindowsLike","Slider","ContextMenu","Slides","DomTree");

(function() {
	
	"use strict";
	
	function afficheObj(obj) {
		
		if (obj && typeof obj === 'object') {
			
			return new JSYG('<a>')
			.href('#')
			.text((obj instanceof Array ? '{Array}  ':'')+obj)
			.on('click',function(e) {
				e.preventDefault();
				var next = this.nextSibling;
				if (next && next.tagName.toLowerCase() === 'ul') {
					next.parentNode.removeChild(next);
				}
				else if (next) {
					this.parentNode.insertBefore( afficheProps(obj).node , next );
				} else {
					this.parentNode.appendChild( afficheProps(obj).node );
				}
			});
			
		} else {
			return new JSYG('<pre>').text('{'+(typeof obj)+'}  '+(obj===null ? 'null' : (obj===undefined ? 'undefined' : obj.toString().trim())));
		}                
	}
	
	function afficheProps(ref) {
		
		var ul = new JSYG('<ul>'),
			i,N;
		
		if (ref instanceof Array) {
			for (i=0,N=ref.length;i<N;i++) {
				new JSYG('<li>').append(new JSYG('<strong>').text(i+' : ')).append( afficheObj(ref[i]) ).appendTo(ul);
			}
		}
		else if (typeof ref === 'object') {
			for (i in ref) {
				new JSYG('<li>').append(new JSYG('<strong>').text(i+' : ')).append( afficheObj(ref[i]) ).appendTo(ul);
			}
		}
			
		return ul;
	}
	
	/**
	 * <strong>nécessite le module Console</strong><br/><br/>
	 * Console JSYG. Peut s'av�rer utile pour IE<9 qui n'en dispose pas,
	 * et m�me pour IE9 dont l'affichage des variables est tr�s limit�.
	 * @returns {JSYG.Console}
	 */
	JSYG.Console = function() {
		/**
		 * Conteneur de la console
		 */
		this.container = document.createElement('div');		
	};
	
	JSYG.Console.prototype = {
			
		constructor : JSYG.Console,
		/**
		 * 'screen' affichera les logs dans la console JSYG, sinon dans la console natie du navigateur (ou firebug).
		 * Ceci permet de passer simplement de l'une � l'autre 
		 */
		output : 'screen',
		/**
		 * id appliqu� au conteneur
		 */
		id : "consoleWeb",
		/**
		 * Options de la fenêtre mobile du conteneur
		 * @see JSYG.WindowsLike
		 */
		winOptions : null,
		/**
		 * Indique si la console est affich�e
		 */
		display : false,
		/**
		 * Indique si la console est active
		 */
		enabled : false,
		
		_createConsole : function() {
			
			var ul = new JSYG('<ul>').id('consoleConsole').css({'overflow':'scroll',padding:'8px'}),
				that = this; 
			
			new JSYG.ContextMenu(ul,[{
				icon: JSYG.require.baseURL + '/Console/img/bin_closed.png',
				text:'effacer la console',
				action:function() { that.clear(); }
			}]);
			
			return ul;
		},
		
		_createScratchpad : function() {
			
			var div = new JSYG('<div>').id('consoleScratchpad').attr("contentEditable","true").css({'overflow':'scroll',padding:'8px'});
			
			new JSYG.ContextMenu(div,[{
				icon: JSYG.require.baseURL + '/Console/img/wand.png',
				text:'executer le code',
				action:function() {
					
					var html = JSYG.stripTagsR( div.html() ,'br','p')
					.replace(/&lt;/g,'<')
					.replace(/&gt;/,'>')
					.replace(/&nbsp;/,' ');
					
					JSYG.globalEval(html);
				}
			},{
				icon: JSYG.require.baseURL + '/Console/img/bin_closed.png',
				text:'effacer le contenu',
				action:function() { div.clear(); }
			}]);
			
			return div;
		},	
		
		_domtree : null,
		
		_createDomTree : function() {
			
			var div = new JSYG('<div>').id('consoleDomTree').css({'overflow':'scroll',padding:'8px'}),
				tree = new JSYG.DomTree(document.body),
				box = new JSYG.BoundingBox();
			
			tree.set({
				container:div,
				blackList:'#'+this.id+',.contextMenu',
				type:'html',
				effect:'none'
			});
			 
			box.className = 'domTreeBox';
			
			tree.on('createelement',function(a) {
				// noeud cible
				var node = this;
				//lien cr�� dans l'arborescence
				new JSYG(a).on('mouseover',function() {
					box.setNode(node); box.show();
				})
				.on('mouseout',function() {	box.hide(); });
				
			});
			
			this._domtree = tree;
			
			new JSYG.ContextMenu(div,[{
				icon:'/icones/arrow_refresh.png',
				text:"actualiser l'arbre",
				action:function() { tree.show(); }
			}]);
			
			return div;
			
		},
		
		/**
		 * Affiche la console
		 * @returns {JSYG.Console}
		 */
		show : function() {
			
			if (this.output === 'console') return this;
			
			this.hide();
			
			var jDiv = new JSYG(this.container).id(this.id).appendTo(document.body),
				fieldConsole = new JSYG('<span>').text('console').appendTo(jDiv),
				fieldScratchPad = new JSYG('<span>').text('ardoise').appendTo(jDiv),
				fieldDomTree = new JSYG('<span>').text('arbre dom').appendTo(jDiv),
				fieldErrors = new JSYG('<span>').id('consoleErrors').css('float','right').appendTo(jDiv),
				jcontent = new JSYG('<div>').id('consoleWebContent').appendTo(jDiv),
				tabs = new JSYG.Slides(jcontent),
				jConsole = this._createConsole(),
				tab = new JSYG.Slide(),
				that = this,
				input,span,dim,dimContent,dec;
			
			tab.field = fieldConsole;
			tab.content = jConsole;
			tab.addTo(tabs);
			
			tab = new JSYG.Slide();
			tab.field = fieldScratchPad;
			tab.content = this._createScratchpad();
			tab.addTo(tabs);
			
			tab = new JSYG.Slide();
			tab.field = fieldDomTree;
			tab.content = this._createDomTree();
			tab.on('show', function() { that._domtree.show(); });
			tab.addTo(tabs);
			
			tabs.effect = 'slide';
			tabs.enable();
			
			jDiv.textAppend("opacité : ");
			
			input = new JSYG('<input type="text" value="0.9"/>').appendTo(jDiv);
			
			input.slider({
				min:0.1,
				max:1,
				step:0.1,
				onchange :function() {
					jDiv.css('opacity',this.value);
				}
			});
			
			span = new JSYG('<span>').classAdd('position').appendTo(jDiv);
			
			this._docFct = function(e) {
				span.text('x : '+e.clientX+' y : '+e.clientY);
			};
			
			new JSYG(document).on('mousemove',this._docFct);
			
			dim = jDiv.getDim();
			dimContent = jcontent.getDim();
						
			dec = { x : dim.width - dimContent.width, y : dim.height - dimContent.height + 15 };
						
			new JSYG.WindowsLike(jDiv,
				JSYG.extend({
					'title':'Outils de développement web',
					'closable':true,
					'resizable':true,
					'iconifiable':true,
					'innerResize':false,
					'onresizedrag':function() {
						jcontent.setDim({
							width:this.clientWidth-dec.x,
							height:this.clientHeight-dec.y
						});
					},
					'onresizeend':function() {
						jcontent.setDim({
							width:this.clientWidth-dec.x,
							height:this.clientHeight-dec.y
						});
						tabs.updateDim();
					},
					'onclose':function() { that.hide(); },
					'cookiePos':true,
					'cookieSize':true,
					'focusable':false
				},
				this.winOptions)
			);
			
			dim = jDiv.getDim();
			
			jcontent.setDim({
				width:dim.width-dec.x,
				height:dim.height-dec.y
			});
			
			tabs.updateDim();
			
			this.display = true;
			
			return this;
		},
		/**
		 * Masque la console
		 * @returns {JSYG.Console}
		 */
		hide : function() {

			new JSYG(this.container).clear().remove();
			
			new JSYG(document).off('mousemove',this._docFct);
			
			this.display = false;
			return this;
		},
		
		/**
		 * Affiche des informations. Le nombre d'arguments n'est pas limit�
		 * @returns {JSYG.Console}
		 */
		log : function() {
			
			if (this.output === 'console') {
				if (window.console) {
					if (window.console.log.apply) { window.console.log.apply(console,arguments); }
					else { window.console.log(Array.prototype.slice.call(arguments).join()); } //IE
				}
				return;
			}
			
			if (!this.display) { this.show(); }
						
			var console = new JSYG(this.container).find('#consoleConsole');
			
			var i,N=arguments.length;
						
			for (i=0;i<N;i++) {
				new JSYG('<li>').appendTo(console).append(afficheObj(arguments[i])).append('<br>');
			}
			
			return this;
		},
		
		/**
		 * Vide la console
		 * @returns {JSYG.Console}
		 */
		clear : function() {
			
			if (this.output === 'console' && window.console) { window.console.clear(); }
			else {
				var jCont = new JSYG(this.container);			
				var jConsole = jCont.find('#consoleConsole');
				jConsole.clear();
				var jError = jCont.find('#consoleErrors');
				jError.clear('');
			}
			return this;
		},
		
		/**
		 * Active la console
		 * @returns {JSYG.Console}
		 */
		enable : function() {
			
			var that = this;
			
			window.onerror = function (msg,url,line) {
				
				that.show();
				
				var jCont = new JSYG(that.container);
				
				var jConsole = jCont.find('#consoleConsole');
				
				jConsole
				.append( new JSYG('<span>').css({'color':'red','margin-right':'15px'}).text(msg) )
				.append( new JSYG('<span>').text('('+url+' ligne '+line+')') )
				.br();
				
				var jError = jCont.find('#consoleErrors');
				jError.text("Erreur !");
			};
			
			this.enabled = true;
			
			return this;
		},
		
		/**
		 * D�sactive la console
		 * @returns {JSYG.Console}
		 */
		disable :function() {
			this.hide();
			window.onerror = null;
			this.enabled = false;
			return this;
		}
	};
	
	/**
	 * <strong>nécessite le module Console</strong><br/><br/>
	 * Console JSYG. Peut s'av�rer utile pour IE<9 qui n'en dispose pas,
	 * et m�me pour IE9 dont l'affichage des variables est tr�s limit�.
	 */
	JSYG.console = new JSYG.Console();

	/**
	 * <strong>nécessite le module Console</strong><br/><br/>
	 * Affiche les arguments dans la console JSYG
	 * @see JSYG.Console pour une utilisation d�taill�e
	 * @example JSYG.log(document.body,'toto',['tata','titi']);
	 */
	JSYG.log = function() {
				
		if (!JSYG.console.enabled) { JSYG.console.enable(); }
		
		JSYG.console.log.apply(JSYG.console,arguments); 
	};
	
}());