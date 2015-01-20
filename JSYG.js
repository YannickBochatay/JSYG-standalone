/**
 * @preserve JSYG - javascript library for SVG and HTML5
 * Copyright 2013, Yannick Bochatay
 * Released under the GNU/GPL license
**/
var JSYG;

(function(root) {
	
	'use strict';
	
	var NS = {
			html : 'http://www.w3.org/1999/xhtml',
			svg : 'http://www.w3.org/2000/svg',
			xlink : 'http://www.w3.org/1999/xlink'
		},
	
		svg = document.createElementNS && document.createElementNS(NS.svg,'svg'),
	
		//passe à true dès que l'arbre DOM est chargé (évènement DOMContentLoaded)
		DOMReady = false,
	
		//raccourci
		slice = Array.prototype.slice,
		
		//tiré de jQuery
		rxhtmlTag = /<(?!area|br|col|embed|hr|img|input|link|meta|param)(([\w:]+)[^>]*)\/>/gi,
		wrapMap = {
			option: [ 1, "<select multiple='multiple'>", "</select>" ],
			thead: [ 1, "<table>", "</table>" ],
			col: [ 2, "<table><colgroup>", "</colgroup></table>" ],
			tr: [ 2, "<table><tbody>", "</tbody></table>" ],
			td: [ 3, "<table><tbody><tr>", "</tr></tbody></table>" ],
			_default: [ 0, "", "" ]
		};
		wrapMap.optgroup = wrapMap.option;
		wrapMap.tbody = wrapMap.tfoot = wrapMap.colgroup = wrapMap.caption = wrapMap.thead;
		wrapMap.th = wrapMap.td;
	
	/**
	 * Constructeur d'objets JSYG. JSYG sert aussi d'espace de noms pour des méthodes statiques et des constructeurs. 
	 * @param arg types possibles
	 * <ul>
	 * 	<li>chaîne de caractères :
	 * 		<ul>
	 * 			<li>sélecteur css (".maClasse","#monID", etc) pour récupèrer un ou des éléments du DOM.
	 * 			<li>nom de balise pour cr�er un nouvel élément (html ou svg, "&lt;a&gt;","&lt;img&gt;","&lt;div&gt;" et aussi "&lt;svg&gt;","&lt;path&gt;" etc.
	 * 				Cas particulier : pour cr�er un lien svg, il faut utiliser la chaîne "&lt;svg:a&gt;"
	 * 			</li>
	 * 			<li>chaîne html à parser (attention, ne fonctionne pas en svg). Le javascript et css contenu seront également interprétés.</li>
	 * 		</ul>
	 * 	</li>
	 * 	<li>objet :
	 * 		<ul>
	 * 			<li>objet JSYG : retournera une nouvelle instance JSYG avec les mêmes éléments DOM</li>
	 * 			<li>élément DOM</li>
	 * 			<li>NodeList</li>
	 * 			<li>document</li>
	 * 			<li>window</li>
	 * 		</ul>
	 * 	</li>
	 * 	<li>tableau : tableau d'objets DOM
	 * 	</li>	
	 * 	<li>fonction :
	 * 		<ul>
	 * 			<li>fonction a exécuter dès que la page est pr�te et que les fichiers inclus sont chargés.</li>
	 * 		</ul>
	 * 	</li>
	 * </ul>
	 * @returns {JSYG}
	 */
	JSYG = function(arg) {
		
		if (!(this instanceof JSYG)) return new JSYG(arg); //permet de ne pas utiliser le mot clef "new"
		
		var i,N,allLoaded,node,ret,p,div,tab,wrap;
		/**
		 * Type d'élément 'html' ou 'svg'
		 */
		this.type = null;
		/**
		 * Premier élément de la collection
		 */
		this.node = null;
		/**
		* Nombre d'éléments dans la collection
		*/
		this.length = 0;
		
		if (typeof arg === 'function') {
			
			allLoaded = JSYG.include.allLoaded();
			
			if (DOMReady && allLoaded) setTimeout(arg,0);
			else if (DOMReady) JSYG.include.load(arg);
			else if (allLoaded) new JSYG(window).on('DOMContentLoaded',arg);
			else new JSYG(window).on('DOMContentLoaded',function() { JSYG.include.load(arg); });
			
			return this;
		}
		//création d'un nouvel élément si on passe une chaîne de type <nombalise> (inspir� de jQuery)
		else if (typeof arg === 'string') {
			
			arg = arg.trim();
			
			if (arg.charAt(0) === "<" && arg.charAt( arg.length - 1 ) === ">" && arg.length >= 3) {
			
				if (arg == '<svg:a>') { //cas spécial pour cr�er un lien svg
					node = document.createElementNS(NS.svg,'a');
				}
				else {
				
					ret = /^<(\w+)\s*\/?>(?:<\/\1>)?$/.exec(arg);
					
					//balise seule -> createElement et non pas innerHTML
					if (ret) {
						
						if (document.createElementNS) {
							
							node = document.createElementNS(JSYG.svgTags.indexOf(ret[1]) !== -1 ? NS.svg : NS.html , ret[1]);
							
							//if (ret[1] == "svg") node.setAttribute("xmlns","http://www.w3.org/2000/svg");
						}
						else node = document.createElement(ret[1]);
						
					} //chaîne html
					else {
						
						ret = /<([\w:]+)/.exec( arg.trim() );
						
						if (!ret) {
							
							p = document.createElement('p');
							p.appendChild(document.createTextNode(arg));
							node = p;
						}
						else if (JSYG.svgTags.indexOf(ret[1]) !==-1) {
							throw new Error('Impossible de parser une chaîne avec des balises SVG');
						}
						else {
							
							if (arguments[1] && JSYG.isPlainObject(arguments[1]) && JSYG.template)
								arg = JSYG.template.apply(null,arguments);
							
							wrap = wrapMap[ ret[1] ] || wrapMap._default;
							arg = wrap[1] + arg.replace(rxhtmlTag,"<$1></$2>") + wrap[2];
							
							div = new JSYG('<div>').html(arg);
							
							for(i=0;i<=wrap[0];i++) div = div.children();
							
							return div;
						}
					}
				}
				
				this[0] = node;
				this.length = 1;
			}
			else {
				tab = querySelectorAll(arg);
				for (i=0,N=tab.length;i<N;i++) this[i] = tab[i];
				this.length = N;
				tab = null;
			}
		}
		else if (arg && typeof arg === 'object') {
						
			if (arg.nodeType != null || JSYG.isWindow(arg)) { this[0] = arg; this.length = 1; }
			else if (typeof arg.length == "number") {
				for (i=0,N=arg.length;i<N;i++) this[i] = arg[i];
				this.length = N;
			}
		}
						
		if (!this[0]) return this;
		
		this.node = this[0];
		
		switch (this[0].namespaceURI) {
			case NS.html : this.type = 'html'; break;
			case NS.svg : this.type = 'svg'; break;
			default : this.type = 'html';
		}
		
		return this;
	};
	
	JSYG.prototype.constructor = JSYG;
	
	/**
	 * objet contenant des informations liées à la compatibilité entre navigateurs 
	 */
	JSYG.support = {};
	
	function getExtension(file) {
		var match = file.match(/\.([a-z]{1,4})$/i);
		return match && match[1];
	}
	
	/**
	 * Renvoie l'url du fichier javascript courant
	 * @returns {String}
	 */
	JSYG.currentScript = function() {
		
		var error = new Error();
		if (error.fileName) return error.fileName;
		
		var scripts = document.getElementsByTagName("script"),
			currentScript = scripts.item( scripts.length-1 );
		
		return currentScript.src;
	};
	
	/**
	 * Renvoie le répertoire du fichier javascript courant
	 * @returns {String}
	 */
	JSYG.currentPath = function() {
		
		var currentScript = JSYG.currentScript();
		
		return currentScript.substr(0,currentScript.lastIndexOf('/')+1);
	};
	
	/**
	 * Inclus des plugins JSYG ou des fichiers (javascript ou css).
	 * Le nombre d'arguments n'est pas limité (callback doit toujours être le dernier argument).
	 * @param file fichier ou plugin à inclure
	 * <ul>
	 * <li>Sans extension, charge le plugin correspondant depuis le répertoire JSYG.require.baseURL.</li>
	 * <li>Avec extension (js ou css), charge le fichier correspondant depuis le répertoire courant.</li>
	 * <ul>
	 * @param callback optionnel, fonction a exécuter une fois le(s) fichier(s) chargé(s).
	 * @example JSYG.require("ZoomAndPan","../monFichier.js",function() { alert('ready'); });
	 */
	JSYG.require = function(file,callback) {
		
		var a = JSYG.makeArray(arguments),
			ext,i,N=a.length;
				
		if (typeof a[N-1] == 'function') {
			callback = a[N-1];
			N--;
		} else callback = null;
						
		for (i=0;i<N;i++) {
			
			ext = getExtension(a[i]);
						
			if (!ext) {
				if (JSYG[ a[i] ]) continue; //le plugin a déjà été chargé sans utiliser JSYG.include
				a[i] = JSYG.require.baseURL + a[i] + '/' + a[i] + '.js';
			}
			else if (ext == 'css' && a[i].indexOf('/') === -1) {
				a[i] = a[i].replace('.'+ext,'');
				a[i] = JSYG.require.baseURL + a[i] + '/' + a[i] + '.css';
			}
						
			JSYG.include.add(a[i],!JSYG.require.useCache);
		}
				
		return JSYG.include.load(callback);
	};
	
	/**
	 * répertoire des plugins
	 */
	JSYG.require.baseURL = JSYG.currentPath()+'plugins/';
		
	/**
	 * Utilisation du cache ou non
	 */
	JSYG.require.useCache = true;
	
	
	
	//Promesses
	//tiré de https://github.com/jakearchibald/es6-promise
	(function() {

		var PENDING = void(0), SEALED = 0, FULFILLED = 1, REJECTED = 2;
		
		var queue = [];
			
		var scheduleFlush = (function() {

			var browserGlobal = (typeof window !== 'undefined') ? window : {},
				BrowserMutationObserver = browserGlobal.MutationObserver || browserGlobal.WebKitMutationObserver,
				local = (typeof root.global !== 'undefined') ? root.global : (this === undefined ? window : this);
			
			// node
			function useNextTick() {
				return function() {
					root.process.nextTick(flush);
				};
			}
			
			function useMutationObserver() {
				
				var iterations = 0,
					observer = new BrowserMutationObserver(flush),
					node = document.createTextNode('');

				observer.observe(node, {
					characterData : true
				});

				return function() {
					node.data = (iterations = ++iterations % 2);
				};
			}

			function useSetTimeout() {
				return function() {
					local.setTimeout(flush, 1);
				};
			}

			function flush() {

				var tuple, callback, i, arg;

				for (i = 0; i < queue.length; i++) {
					tuple = queue[i];
					callback = tuple[0];
					arg = tuple[1];
					callback(arg);
				}

				queue = [];
			}

			// Decide what async method to use to triggering processing of queued
			// callbacks:
			if (typeof root.process !== 'undefined' && {}.toString.call(root.process) === '[object process]')
				return useNextTick();
			else if (BrowserMutationObserver)
				return useMutationObserver();
			else
				return useSetTimeout();

		}());
		
		function asap(callback, arg) {
			
			var length = queue.push([ callback, arg ]);
			
			if (length === 1) scheduleFlush();
		}

		function invokeCallback(settled, promise, callback, detail) {

			var hasCallback = typeof callback == "function",
				value = null, error = null, succeeded;
			
			if (hasCallback) {

				try {
					value = callback(detail);
					succeeded = true;
				} catch (e) {
					succeeded = false;
					error = e;
				}

			} else {
				value = detail;
				succeeded = true;
			}

			if (handleThenable(promise, value))
				return;
			else if (hasCallback && succeeded)
				resolve(promise, value);
			else if (!succeeded)
				reject(promise, error);
			else if (settled === FULFILLED)
				resolve(promise, value);
			else if (settled === REJECTED)
				reject(promise, value);
		}

		function subscribe(parent, child, onFulfillment, onRejection) {

			var subscribers = parent._subscribers,
				length = subscribers.length;

			subscribers[length] = child;
			subscribers[length + FULFILLED] = onFulfillment;
			subscribers[length + REJECTED] = onRejection;
		}

		function publish(promise, settled) {
			
			var child, callback,
				subscribers = promise._subscribers,
				detail = promise._detail,
				i = 0;
			
			for (; i < subscribers.length; i += 3) {
				
				child = subscribers[i];
				callback = subscribers[i + settled];

				invokeCallback(settled, child, callback, detail);
			}

			promise._subscribers = null;
		}

		function handleThenable(promise, value) {

			var then = null, resolved = null;

			try {

				if (promise === value)
					throw new TypeError("A promise callback cannot return that same promise.");

				if (typeof value == "function" || (typeof value === "object" && value !== null)) {

					then = value.then;

					if (typeof then == "function") {
						
						then.call(value, function(val) {
							
							if (resolved) return true;					
							resolved = true;

							if (value !== val)
								resolve(promise, val);
							else
								fulfill(promise, val);

						}, function(val) {

							if (resolved) return true;							
							resolved = true;							
							reject(promise, val);
						});

						return true;
					}
				}
			} catch (error) {
				
				if (resolved) return true;
				reject(promise, error);
				return true;
			}

			return false;
		}

		function resolve(promise, value) {
			
			if (promise === value || !handleThenable(promise, value)) fulfill(promise, value);
		}

		function fulfill(promise, value) {
						
			if (promise._state !== PENDING) return;
			
			promise._state = SEALED;
			promise._detail = value;

			asap(publishFulfillment, promise);
		}

		function reject(promise, reason) {
			
			if (promise._state !== PENDING) return;
			
			promise._state = SEALED;
			promise._detail = reason;

			asap(publishRejection, promise);
		}

		function publishFulfillment(promise) {
			publish(promise, promise._state = FULFILLED);
		}

		function publishRejection(promise) {
			publish(promise, promise._state = REJECTED);
		}
		
		function invokeResolver(resolver,promise) {
			
			function resolvePromise(value) {
				resolve(promise, value);
			}

			function rejectPromise(reason) {
				reject(promise, reason);
			}

			try {
				resolver(resolvePromise, rejectPromise);
			} catch (e) {
				rejectPromise(e);
			}
		}

		JSYG.Promise = function(resolver) {

			if (typeof resolver != "function")
				throw new TypeError('You must pass a resolver function as the first argument to the promise constructor');

			if (!(this instanceof JSYG.Promise)) return new JSYG.Promise(resolver);

			this._subscribers = [];

			invokeResolver(resolver, this);
		};

		JSYG.Promise.prototype = {

			constructor : JSYG.Promise,

			_state : undefined,
			_detail : undefined,
			_subscribers : undefined,
			
			then : function(onFulfillment, onRejection) {

				var promise = this,
					thenPromise = new this.constructor(function() {}),
					callbacks = arguments;

				if (this._state) {
					
					asap(function invokePromiseCallback() {
						invokeCallback(promise._state, thenPromise,
								callbacks[promise._state - 1], promise._detail);
					});
				}
				else subscribe(this, thenPromise, onFulfillment, onRejection);

				return thenPromise;
			},

			'catch' : function(onRejection) {
				return this.then(null, onRejection);
			}
		};

		
		JSYG.Promise.cast = function(object) {
			
			if (object && typeof object === 'object' && object.constructor === this) return object;

			return new JSYG.Promise(function(resolve) {
				resolve(object);
			});
		};
		
		
		/**
		 * @method all
		 * @param {Array}
		 *            promises
		 * @return {JSYG.Promise} promise that is fulfilled when all `promises` have been
		 *         fulfilled, or rejected if any of them become rejected.
		 */
		JSYG.Promise.all = function(promises) {

			if (!Array.isArray(promises))
				throw new TypeError('You must pass an array to all.');

			return new JSYG.Promise(function(resolve, reject) {

				var results = [], remaining = promises.length, promise;

				if (remaining === 0)
					resolve([]);

				function resolver(index) {
					return function(value) {
						resolveAll(index, value);
					};
				}

				function resolveAll(index, value) {
					results[index] = value;
					if (--remaining === 0) {
						resolve(results);
					}
				}

				for ( var i = 0; i < promises.length; i++) {

					promise = promises[i];

					if (promise && typeof promise.then == "function")
						promise.then(resolver(i), reject);
					else
						resolveAll(i, promise);
				}
			});
		};

		JSYG.Promise.race = function(promises) {

			if (!Array.isArray(promises))
				throw new TypeError('You must pass an array to race.');

			return new JSYG.Promise(function(resolve, reject) {

				var promise;

				for ( var i = 0; i < promises.length; i++) {

					promise = promises[i];

					if (promise && typeof promise.then === 'function')
						promise.then(resolve, reject);
					else
						resolve(promise);
				}
			});
		};

		JSYG.Promise.reject = function(reason) {

			return new JSYG.Promise(function(resolve, reject) {
				reject(reason);
			});
		};

		JSYG.Promise.resolve = function(value) {

			if (value && typeof value === 'object' && value.constructor === JSYG.Promise)
				return value;

			return new JSYG.Promise(function(resolve) {
				resolve(value);
			});
		};
		
		/*
		JSYG.prototype.then = function(callback) {
			
			console.log(new Error());
			
			var promises = [];
			
			this.each(function() {
			
				var $this = new JSYG(this),
					promise = $this.data("promise");
				
				if (!promise) promise = JSYG.Promise.resolve();
				
				promise = promise.then(callback);
					
				promises.push(promise);
				
				$this.data("promise",promise);
			});
			
			JSYG.Promise.all(promises);
			
			return this;
		};*/

	}());
	
	
	
	
	
	/**
	 * Ajoute une règle de style css
	 * @param str chaîne css
	 * @example
	 * JSYG.addStyle(".maClass { font-style:italic }");
	 */
	JSYG.addStyle = function(str) {
		
		var head = document.getElementsByTagName('head').item(0),
		    style = document.createElement('style'),
		    rules = document.createTextNode(str);

		style.type = 'text/css';
		
		if (style.styleSheet) style.styleSheet.cssText = rules.nodeValue;
		else style.appendChild(rules);
		
		head.appendChild(style);
	};
		
	/**
	 * Teste si l'argument est numérique (au sens large)
	 * @param arg
	 * @returns {Boolean}
	 * @example JSYG.isNumeric("14") === true
	 */
	JSYG.isNumeric = function(arg) {
		return !isNaN(parseFloat(arg)) && isFinite(arg);
	};
		
	/**
	 * Renvoie un tableau d'objets à partir d'une liste.
	 * @param list collection de type JSYG, NodeList, SVGList, FileList, etc.
	 * @returns {Array}
	 */
	JSYG.makeArray = function(list) {
		
		var tab = [],i,N;
		
		if (list && typeof list === 'object') {
			
			if (list.nodeType!= null || JSYG.isWindow(list)) tab = [list];
			else if (typeof list.length == "number") {
			    try { tab = slice.call(list); } //IE7 ne l'accepte qu'avec des objets natifs (pas les objets DOM)
			    catch(e) {
			    	for (i=0,N=list.length;i<N;i++) tab.push(list[i]);
			    }
			}
			else if (list.numberOfItems!=null && JSYG.type(list.getItem) === 'function') { //SVGList
				for (i=0,N=list.numberOfItems;i<N;i++) tab.push(list.getItem(i));
			}
		}
		
		return tab;
	};
	
	/**
	* Renvoie la collection d'objets DOM sous forme de tableau.
	*/
	JSYG.prototype.toArray = function() { return JSYG.makeArray(this); };
	
	/**
	* exécute une fonction sur chaque élément de la liste.
	* @param list liste à traiter (Array, NodeList, SVGList, FileList, JSYG, etc)
	* @param callback fonction a �x�cuter sur chaque élément. this fait référence à l'élément, le 1er argument son indice.
	* Si la fonction renvoie false, on sort de la boucle.
	* @returns list
	*/
	JSYG.each = function(list,callback) {
		
		var i,N,item;
		
		if (typeof list == 'object' || typeof list == "string") {
		
			if (typeof list.length == "number") {
			
				for (i=0,N=list.length;i<N;i++) {
					item = list[i];
					if (callback.call(item,i,item) === false) return list;
				}
			}
			else if (typeof list.numberOfItems == "number") { //SVGList
			
				for (i=0,N=list.numberOfItems;i<N;i++) {
					item = list.getItem(i);
					if (callback.call(item,i,item) === false) return list;
				}
			}
			else {
				for (i in list) {
					item = list[i];
					if (callback.call(item,i,item) === false) return list;
				}
			}
		}
		
		return list;
	};
	
	/**
	 * Ajoute les propriétés des objets passés en arguments au premier argument.
	 * Si le premier poss�de déjà la propriété, elle est �cras�e. Si la propriété est un objet, la méthode s'applique r�cursivement.
	 * @param target objet à étendre
	 * @param source objet dont les propriétés doivent être copi�es.
	 * Le nombre d'arguments n'est pas limit�.
	 * @returns target l'objet étendu
	 */
	JSYG.extend = function(target,source) {
	
		if (target == null) target = {};
	
		slice.call(arguments,1).forEach(function(source) {
			for (var n in source) {
				if (source[n] !== undefined){
					if (JSYG.isPlainObject(source[n]) && JSYG.isPlainObject(target[n])) JSYG.extend(target[n],source[n]);
					else target[n] = source[n];
				}
			}
		});
				
		return target;
	};
	
	/**
	 * Teste si l'argument est un objet pur (instance de Object, sans h�ritage). Tir� de jQuery isPlainObject.
	 * @param obj
	 * @returns {Boolean}
	 */
	JSYG.isPlainObject = function(obj) {
				
		if (!obj || typeof obj !== "object" || obj.nodeType || JSYG.isWindow(obj)) return false;
		
		try {
			if ( obj.constructor && !obj.hasOwnProperty("constructor") && !obj.constructor.prototype.hasOwnProperty("isPrototypeOf") ) return false;
		} catch (e) { return false; }
		
		for (var key in obj) {}
		
		return key == null || obj.hasOwnProperty(key);
	};
	
	/**
	 * Teste si l'argument est un objet window
	 * @param obj
	 * @returns {Boolean}
	 */
	JSYG.isWindow = function(obj) {
		//pas terrible, mais c'est la méthode jQuery
		return !!(typeof obj === 'object' && obj!==null && 'setInterval' in obj);
	};
	
	//tir� de jQuery
	var class2type = {};
	
	"Boolean Number String Function Array Date RegExp Object".split(" ").forEach(function(name) {
		class2type[ "[object " + name + "]" ] = name.toLowerCase();
	});
	
	/**
	 * Renvoie le type d'objet natif javascript (boolean,number,string,function,array,date,regexp,null,undefined,object)
	 * @param obj
	 * @returns {String}
	 */
	JSYG.type = function(obj) {
		return obj == null ? String( obj ) : class2type[ Object.prototype.toString.call(obj) ] || "object";
	};
	
	/**
	 * récupère l'objet window de l'élément DOM passé en argument
	 * @param arg
	 * @returns objet window
	 */
	JSYG.getWindow = function(arg) {
		if (JSYG.isWindow(arg)) return arg;
		else if (arg.nodeType === 9) return arg.defaultView || arg.parentWindow;
		else return JSYG.getWindow(arg.ownerDocument);
	};
	
	/**
	 * Renvoie le chemin relatif d'une url (par rapport au chemin courant)
	 * @param url
	 * @returns {String}
	 */
	JSYG.relativePath = function(url) {
		var href = window.location.href;
		href = href.replace(window.location.hash,'');
		href = href.replace(window.location.search,'');
		return url.replace(href,'');
	};
	
	/**
	 * Renvoie un nombre entier al�atoire entre min et max, ou une valeur al�atoire d'un tableau
	 * @param min valeur plancher, ou tableau de données
	 * @param max valeur plafond
	 * @returns {Number} entier, ou valeur du tableau
	 */
	JSYG.rand = function(min,max) {
		if (min instanceof Array) return min[ JSYG.rand(0,min.length-1) ];
		else if ( typeof min === 'string') return min.charAt(JSYG.rand(0,min.length-1)); // min[ind] ne fonctionne pas avec IE7
		return Math.floor(Math.random() * (max - min + 1)) + min;
	};
	
	/**
	 * Arrondi d'un nombre avec nombre de d�cimales pr�cis�
	 * @param number
	 * @param precision nombre de d�cimales
	 * @returns {Number}
	 */
	JSYG.round = function(number,precision) {
		return Math.round(number * Math.pow(10,precision)) / Math.pow(10,precision);
	};
		
	/**
	 * eval "propre"
	 * @param {String,Object} data : chaîne javascript ou noeud xml/html à �valuer
	 */
	JSYG.globalEval = function(data) {
		
		var allscript,head,script,i,N;
	
		if (typeof data === 'object' && data.getElementsByTagName) {
			allscript = data.getElementsByTagName('script');
			for (i=0,N=allscript.length;i<N;i++) { JSYG.globalEval(allscript.item(i).text); }
			return;
		}
	
		head = document.getElementsByTagName("head").item(0);
		script = document.createElement("script");
		script.text = data;
		head.appendChild(script);
		head.removeChild(script);
	};
	
	/**
	 * Renvoie la chaîne de requête sous forme d'objet
	 * @returns {Object}
	 */
	JSYG.queryString = function() {
		
		var chaine = window.location.search.substr(1),
			tab = chaine.split('&'),
			champ,obj = {},
			i=0,N=tab.length;
		
		for (;i<N;i++) {
			champ = tab[i].split('=');
			obj[champ[0]] = champ[1];
		}
		
		return obj;
	};
	
	/**
	 * Renvoie ou définit l'encre (sans le #)
	 * @returns {String}
	 */
	JSYG.hash = function(hash) {
				
		if (hash) window.location.hash = '#'+hash;
		else return window.location.hash.replace(/^#/,'');
	};
	
	
	var cptPlugin = 0;
	
	/**
	 * Permet d'attacher un plugin aux instances JSYG, qui fonctionne ensuite selon la philosophie jQuery.
	 * @param Construct constructeur
	 * @link http://docs.jquery.com/Plugins/Authoring#Plugin_Methods
	 * @returns {Function}
	 */
	JSYG.bindPlugin = function(Construct) {
		
		var name = 'dataPlugin' + cptPlugin;
		
		cptPlugin++;
		
		return function(method) {
			
			var args = arguments,
				value;
			
			this.each(function() {
			
				var plugin = this.data(name);
				
				if (!plugin) {
					plugin = new Construct(this);
					this.data(name,plugin);
				}
				
				if (method == 'get') {
					value = plugin[args[1]];
					if (typeof value == "function") value = plugin[args[1]]();
					return false;
				}
				else if (method === 'destroy') {
					plugin.disable();
					this.dataRemove(name);
				}
				else if (typeof method === 'object' || !method) {
					if (plugin.enable) plugin.enable.apply(plugin,args);
					else {
						throw new Error("Ce plugin n'a pas de méthode enable,'" +
						"il faut donc préciser en premier argument la méthode désirée");
					}
				}
				else if (typeof method === 'string' && plugin[method]) {
					if (method.substr(0,1) === '_')	throw new Error("La méthode " +  method + " est privée.");
					else plugin[method].apply(plugin,slice.call(args,1));
				}
				else throw new Error("La méthode " +  method + " n'existe pas ");
				
				return null;
			}
			,true);
						
			return method == 'get' ? value : this;
		};
	};
	
	/**
	 * Renvoie un nombre born� aux limites spécifiées
	 * @param nb nombre
	 * @param min limite inf�rieure
	 * @param max limite sup�rieure
	 * @returns {Number}
	 * @example
	 * JSYG.clip(5,0,10) === 5;
	 * JSYG.clip(50,0,10) === 10;
	 * JSYG.clip(-50,0,10) === 0;
	 */
	JSYG.clip = function(nb,min,max) {
		return nb < min ? min : (nb > max ? max : nb);
	};
	
	/**
	 * Renvoie la position du pointeur de la souris relativement à l'élément, sous forme d'objet point JSYG.Point
	 * @param evt objet Event
	 * @param ref argument JSYG (noeud DOM, chaîne css, etc) 
	 * @returns {JSYG.Point}
	 * @see JSYG.Point
	 */
	JSYG.getCursorPos = function(evt,ref) {
		
		var mtx,rect;
		
		if (ref && !(ref instanceof JSYG)) ref = new JSYG(ref);
		
		if (ref.type === 'svg') {
			
			mtx = ref.getMtx('screen').inverse();
						
			return new JSYG.Point(evt.clientX,evt.clientY).mtx(mtx);
		}
		else {
			
			rect = ref && ref.getDim('page') || {x:0,y:0};

			return new JSYG.Point(
				evt.pageX - rect.x,
				evt.pageY - rect.y
			);
			
		}
	};
	
	/**
	 * Renvoie la position du pointeur de la souris relativement à l'élément, sous forme d'objet vecteur JSYG.Point
	 * @param e objet Event
	 * @returns {JSYG.Point}
	 */
	JSYG.prototype.getCursorPos = function(e) {
		return JSYG.getCursorPos(e,this);
	};
	
	/**
	 * récupère un tableau d'objets DOM à partir d'un sélecteur css.
	 * @param arg sélecteur css
	 * @param root optionnel, le noeud parent à partir duquel on fait la recherche
	 * @returns {Array} tableau d'objets DOM
	 */
	function querySelectorAll(arg,root) {
		
		var liste;
		
		root = root || window.document;

		if (root.querySelectorAll) {
			
			try { liste = root.querySelectorAll(arg); }
			catch(e) { throw new Error(arg+" : sélecteur incorrect."); }
		}
		else if (window.Sizzle) liste = window.Sizzle(arg,root);
		else throw new Error("Il faut inclure Sizzle.js pour ce navigateur");
						
		return JSYG.makeArray(liste);
	}
		
	/**
	 * récupère les descendants de chaque élément de la collection filtrés par un sélecteur css.
	 * @param arg sélecteur css
	 * @returns {JSYG}
	 */
	JSYG.prototype.find = function(arg) {
		
		arg = arg.trim();
		
		var list = [],
			c0 = arg.charAt(0);
		
		//findAll shim
		if ([">","+","~"].indexOf(c0)!=-1) {
			
			this.each(function() {
				
				var sel = new JSYG(this).getUniqueSelector();
				
				new JSYG(sel+arg).each(function() { list.push(this); });
				
			});
			
		}
		else this.each( function() { list = list.concat(querySelectorAll(arg,this)); } );
		
		return new JSYG(list);
	};
	
	

	JSYG.prototype.getUniqueSelector = function () {

	    var path ="",
	    	jNode = new JSYG(this[0]),
	    	realNode,
	    	name,
	    	parent,
	    	siblings;
	    
	    while (jNode.length) {
	    	
	    	realNode = jNode[0];
	    	
	    	if (realNode.id) return '#'+realNode.id + (path ? '>' + path : '');
	    	
	        name = realNode.localName;
	        
	        if (!name) break;
	        
	        name = name.toLowerCase();

	        parent = jNode.parent();

	        siblings = parent.children().filter(name);
	        
	        if (siblings.length > 1) name += ':nth-child(' + (siblings.indexOf(realNode)+1) + ')';

	        path = name + (path ? '>' + path : '');
	        
	        jNode = parent;
	    }

	    return path;
	};
	
	

	/**
	 * Execute une fonction sur le noeud et r�cursivement sur tous les descendants (nodeType==1 uniquement)
	 * @param fct le mot cl� this fait référence au noeud courant. Si la fonction renvoie false, on sort de la boucle
	 * @param node noeud parent
	 */
	JSYG.walkTheDom = function(fct,node) {
		
		if (fct.call(node) === false) return false;
		
        node = node.firstChild;
        
        while (node) {
            if (node.nodeType == 1) {
            	if (JSYG.walkTheDom(fct,node) === false) return false;
            }
            node = node.nextSibling;
        }
    };
	
	/**
	 * exécute une fonction sur la collection et r�cursivement sur tous les descendants
	 * @param fct le mot cl� this fait référence au noeud courant. Si la fonction renvoie false, on sort de la boucle
	 * @returns {JSYG}
	 */
	JSYG.prototype.walkTheDom = function(fct) {
		this.each(function() { return JSYG.walkTheDom(fct,this); });
		return this;
	};
    
    /**
     * Calcule la distance entre deux points
     * @param pt1 JSYG.Point ou objet quelconque avec les propriétés x et y
     * @param pt2 JSYG.Point ou objet quelconque avec les propriétés x et y
     * @return {Number} distance en pixels (non arrondi) 
     */
    JSYG.distance = function(pt1,pt2) {
    	return Math.sqrt( Math.pow(pt1.x-pt2.x,2) + Math.pow(pt1.y-pt2.y,2) );
    };
	
	/**
	 * Fonction qui stoppe la propagation des évènements
	 * <code>function(e) { e.stopPropagation(); }</code>
	 */
	JSYG.stopPropagation = function(e) { e.stopPropagation(); };
	
	/**
	 * Fonction qui annule le comportement par défaut
	 * <code>function(e) { preventDefault(); }</code>
	 */
	JSYG.preventDefault = function(e) { e.preventDefault(); };
	
	/**
	 * Stoppe la propagation de l'évènement donn�
	 * @param evt nom de l'évènement
	 */
	JSYG.prototype.stopPropagation = function(evt) { return this.on(evt,JSYG.stopPropagation); };
	
	/**
	 * R�tablit la propagation de l'évènement donn�
	 * @param evt nom de l'évènement
	 */
	JSYG.prototype.releasePropagation = function(evt) { return this.off(evt,JSYG.stopPropagation); };
	
	/**
	 * Annule l'action par défaut de l'évènement donn�
	 * @param evt nom de l'évènement
	 */
	JSYG.prototype.preventDefault = function(evt) { return this.on(evt,JSYG.preventDefault); };
	
	/**
	 * R�tablit l'action par défaut de l'évènement donn�
	 * @param evt nom de l'évènement
	 */
	JSYG.prototype.releaseDefault = function(evt) { return this.off(evt,JSYG.preventDefault); };
	
	/**
	 * exécute une fonction sur chaque élément de la collection JSYG.
	 * On peut sortir de la boucle en renvoyant false.
	 * Dans la fonction de rappel, this fait référence (par défaut) à l'élément DOM de la collection,
	 * et le premier argument est l'indice de l'élément dans la collection.
	 * @param callback fonction de rappel
	 * @param jsynObj si true this dans la fonction ne fait plus référence à l'objet DOM mais à l'objet JSYG de l'élément 
	 * @returns {JSYG}
	 */
	JSYG.prototype.each = function(callback,jsynObj) {
						
		var resul;
		for (var i=0,N=this.length;i<N;i++) {
			resul = callback.call(jsynObj ? new JSYG(this[i]) : this[i],i,this[i]);
			if (resul === false) break;
		}
		return this;
	};
	
	/**
	 * Renvoie l'index d'un noeud DOM de la collection
	 * @param node noeud DOM (ou objet JSYG)
	 * @returns {Number}
	 */
	JSYG.prototype.indexOf = function(node) {
		if (node instanceof JSYG) node = node[0];
		return Array.prototype.indexOf.call(this,node);
	};
	
	
	var propListeners = 'JSYGListeners';
	
	//test� sur un clavier fran�ais uniquement
	/**
	 * Liste des touches non alphanumériques d'un clavier fran�ais
	 */
	JSYG.nonAlphaNumKeys = {8:'backspace',9:'tab',13:'enter',16:'shift',17:'ctrl',18:'alt',19:'pause',20:'caps-lock',27:'escape',32:" ",33:'page-up',34:'page-down',37:'left-arrow',38:'up-arrow',39:'right-arrow',40:'down-arrow',45:'insert',46:'delete',48:'à',35:'end',36:'home',49:'&', 50:'é', 51:'"', 52:"'", 53:'(', 54:'-', 55:'è', 56:'_', 57:'ç', 58:'à', 59:'$', 91:'left-window-key',92:'right-window-key',93:'select',96:'0', 97:'1', 98:'2', 99:'3', 100:'4', 101:'5', 102:'6', 103:'7', 104:'8', 105:'9', 106:'*', 107:'+', 109:'-', 110:'.', 111:'/',112:"f1",113:"f2",114:"f3",115:"f4",116:"f5",117:"f6",118:"f7",119:"f8",120:"f9",121:"f10",122:"f11",123:"f12",144:'num-lock',145:'scroll-lock',188:',',190:';',191:':',192:'ù',219:')',220:'*',222:'²',223:'!',226:'<',221:'^'};
	
	/**
	 * Constructeur d'objets JSYG.Event, qui est l'objet passé par défaut aux écouteurs d'évènements (objet Event customis�).
	 * Il permet de mettre à niveau IE, et d'ajouter quelques propriétés :
	 * <ul>
	 * 		<li><strong>buttonName</strong>: nom du bouton enclench� ('left' ou 'right')</li>
	 * 		<li><strong>keyName</strong>: nom de la touche clavier enclench�e (voir la liste JSYG.nonAlphaNumKeys pour les caractères non alphanumériques)</li>
	 *		<li>wheelDelta (molette de la souris, propriété impl�ment�e dans IE,Chrome mais non standard)</li>
	 * </ul>
	 * @param e objet Event original
	 * @returns {JSYG.Event}
	 */
	JSYG.Event = function(e) {
				
		if (e instanceof JSYG.Event) e = e.originalEvent;
		else if (!e) e = {};
		
		/**
		 * Objet Event original
		 */
		this.originalEvent = e;
		/**
		 * Used to indicate whether this event was generated by the user agent (trusted) or by script (untrusted).
		 */
		this.isTrusted = e.isTrusted;
		/**
		 * abcisse du pointeur dans la fenêtre
		 */
		this.clientX = e.clientX;
		/**
		 * ordonnée du pointeur dans la fenêtre
		 */
		this.clientY = e.clientY;
		/**
		 * Type d'évènement
		 */
		this.type = e.type;
		/**
		 * D�tails sur le clic
		 */
		this.detail = e.detail;
		/**
		* molette de la souris
		*/
		this.wheelDelta = (e.wheelDelta === undefined && e.detail) ? -e.detail * 40 : e.wheelDelta;
		/**
		 * Nom du bouton souris enclench� (left ou right)
		 */
		this.buttonName = (e.button === 2) ? 'right' : 'left';
		/**
		 * Cible associ�e à l'évènement
		 */
		this.relatedTarget = e.relatedTarget || e.toElement;
		/**
		 * Cible de l'évènement
		 */
		this.target = e.target || e.srcElement || document;
		
		/**
		 * en SVG avec Chrome et IE, avec les éléments use
		 */
		if (!this.target.parentNode && this.target.correspondingUseElement) this.target = e.target.correspondingUseElement;
		/**
		 * données transf�r�es par l'évènement (lors des drag&drop notamment)
		 */
		this.dataTransfer = e.dataTransfer;
		
		var elmt = document.documentElement,
			body = document.body;
		
		/**
		 * abcisse du pointeur dans le document (clientX+scrollLeft)
		 */
		this.pageX = e.pageX != null ? e.pageX : e.clientX + (elmt && elmt.scrollLeft || body && body.scrollLeft || 0) - (elmt.clientLeft || 0);
		
		/**
		 * ordonnée du pointeur dans le document (clientY+scrollTop)
		 */
		this.pageY = e.pageY != null ? e.pageY : e.clientY + (elmt && elmt.scrollTop || body && body.scrollTop || 0) - (elmt.clientTop || 0);
		
		if (/key(up|down)/i.test(e.type)) {
			/**
			 * Nom de la touche clavier enclench�e
			 */
			this.keyName = JSYG.nonAlphaNumKeys[e.keyCode]!== undefined ? JSYG.nonAlphaNumKeys[e.keyCode] : String.fromCharCode(e.charCode || e.keyCode).toLowerCase();
		} else if (e.type === 'keypress') {
			this.keyName = (e.charCode !== 0) ? String.fromCharCode(e.charCode || e.keyCode).toLowerCase() : null;
		} else {
			this.keyName = null;
		}
		
		this.keyCode = e.keyCode;
		
		/**
		 * Bool�en indiquant si la touche ctrl est enclench�e
		 */
		this.ctrlKey = (this.keyName == "ctrl") ? true : e.ctrlKey; //pb avec chrome sur keydown
				
		/**
		 * Bool�en indiquant si la touche alt est enclench�e
		 */
		this.altKey = (this.keyName == "alt") ? true : e.altKey; //pb avec chrome sur keydown
		/**
		 * Bool�en indiquant si la touche shift est enclench�e
		 */
		this.shiftKey = (this.keyName == "shift") ? true : e.shiftKey; //pb avec chrome sur keydown
		/**
		 * Bool�en indiquant si la touche meta est enclench�e (mac)
		 */
		this.metaKey = (this.keyName == "meta") ? true : e.metaKey;
	};
	
	JSYG.Event.prototype = {
			
		constructor : JSYG.Event, 
		
		/**
		 * Annule l'action par défaut
		 */
		preventDefault : function() {
			this.originalEvent.preventDefault && this.originalEvent.preventDefault();
			if (window.event) window.event.returnValue = false;
		},
		
		/**
		 * Stoppe la propagation de l'évènement
		 */
		stopPropagation : function() {
			this.originalEvent.stopPropagation && this.originalEvent.stopPropagation();
			if (window.event) window.event.cancelBubble = true;
		}
	};
	
	/**
	 * Renvoie true si aucune touche n'est définie ni d�clench�e, ou si une touche est définie et elle et elle seule est enclench�e 
	 */
	function checkStrictKey(e,key) {
		
		var shortcutKeys = ['shift','ctrl','alt','meta'],
			prop,i,N=shortcutKeys.length;
		
		for (i=0;i<N;i++) {
			prop = shortcutKeys[i];
			if ((key && prop == key && !e[prop+'Key']) || (!key && e[prop+'Key']) ) return false;
		}
		
		return true;
	}

	/**
	 * Cr�e une fonction qui permet d'executer la fonction fct sur les évènements mouseup ou click seulement si la souris
	 * n'a pas boug� pendant que le bouton �tait enclench�.
	 * Un bouton et une touche sp�ciale (ctrl,alt,shift,meta) peuvent être spécifiés également.
	 */
	function createStrictClickFunction(node,evt,selector,fct,button,key,direct,uniqueCallback) {
		
		return function(e) {
			
			if (selector) {
				e = new JSYG.Event(e);
				if (querySelectorAll(selector,node).indexOf(e.target) === -1) return;
			}
			
			if (direct && e.target != node) return;
			
			var jNode = new JSYG( selector ? e.target : node),
			
				posInit = {x:e.clientX,y:e.clientY},
											
				off = function() { jNode.off('mouseout',off).off(evt,release); },
			
				release = function(e) {
			
					off();
					
					var pos = {x:e.clientX,y:e.clientY};
									
					if (JSYG.distance(posInit,pos) > jNode.dragTolerance()) return;
										
					e = new JSYG.Event(e);
					
					if (!checkStrictKey(e,key)) return;
					if (button && e.buttonName !== button) return;
					
					fct.call(selector ? e.target : node,e);
				};
		
			jNode.on('mouseout',off).on(evt,release);
			
			uniqueCallback && uniqueCallback();
		};
	}
	
	/**
	 * Cr�e une fonction qui execute fct seulement si la combinaison touche et bouton est respect�e
	 */
	function createCustomFunction(node,evt,selector,fct,button,key,strict,direct,uniqueCallback) {
								
		return function(e) {
			
			e = new JSYG.Event(e);
			
			if (selector && querySelectorAll(selector,node).indexOf(e.target) === -1) return;
			else if (direct && e.target != node) return;
			else if (strict && !checkStrictKey(e,key)) return;
			else if (key && !e[key+'Key']) return;
			//else if (evt !== 'contextmenu' && button && e.buttonName !== button) return;
			else if (button && e.buttonName !== button) return;
						
			fct.call( selector ? e.target : node,e);
			
			uniqueCallback && uniqueCallback(); //pour retirer l'écouteur aussitôt executé
		};
	}
	
	var dragPrefixe = "_drag";
	/**
	 * création artificielle des évènements dragstart,drag et dragend
	 */
	function createFakeDragFunction(node,evt,fct) {
				
		return function(e) {
			
			e = new JSYG.Event(e);
			
			var jNode = new JSYG(node),
			
				hasMoved = false,
			
				posInit = {x:e.clientX,y:e.clientY},
						
				fcts = {
					
					mousemove : function(e) {
						
						if (hasMoved === false) {
							
							var pos = {x:e.clientX,y:e.clientY};
							
							if (JSYG.distance(posInit,pos) > jNode.dragTolerance()) {
								evt == dragPrefixe+'start' && fct.call(this,e);
								hasMoved = true;
							}
						}
						else { evt == dragPrefixe && fct.call(this,e); }
					},
				
					mouseup : function(e) {
						hasMoved === true && evt == dragPrefixe+'end' && fct.call(this,e);
						jNode.off(fcts);
					},
					
					mouseout : function(e) { jNode.off(fcts); } 
				};
			
			e.preventDefault();
			
			jNode.on(fcts);
		};
	}
		
	/**
	 * Solution de contournement pour l'évènement DOMContentLoaded sur IE (Diego Perini)
	 *
	 * Author: Diego Perini (diego.perini at gmail.com) NWBOX S.r.l.
	 * Summary: DOMContentLoaded emulation for IE browsers
	 * Updated: 05/10/2007
	 * License: GPL
	 * Version: TBD
	 *
	 * Copyright (C) 2007 Diego Perini & NWBOX S.r.l.
	 */
	function IEDOMContentLoaded(fct) {
		
		var done = false,
			init = function () {
				if (!done) { done = true; fct();}
			};

		(function fonct() {
			try { document.documentElement.doScroll('left');}
			catch (e) { window.setTimeout(fonct, 50); return; }
			init();
		})();
		
		document.onreadystatechange = function() {
			if (document.readyState == 'complete') { document.onreadystatechange = null; init(); }
		};
	}
	
	
	var rSearches = {
		button : /(left|right)-/,
		key : /(alt|ctrl|shift|meta)-/,
		strict : /strict-/,
		direct : /direct-/,
		unique : /unique-/,
		all : /(left|right|ctrl|alt|shift|meta|strict|unique|direct)-/g
	};
	
	
	var windowLoaded = false;
	/**
	 * Ajout d'un écouteur d'évènement sur la collection. Compatible IE6+<br/><br/>
	 * On peut également passer en argument un objet avec en cl�s les noms des évènements et en valeurs les fonctions.<br/><br/>
	 * Par cette méthode :
	 * <ul>
	 * 	<li>dans la fonction le mot cl� this fait référence à l'élément DOM</li>
	 * 	<li>Les évènements doubl�s sont ignor�s (même déclencheur, même fonction)</li>
	 * 	<li>l'objet Event est une instance de JSYG.Event et dispose, en plus des propriétés standards, les propriétés suivantes :
	 * 		<ul>
	 *			<li>buttonName ("left" ou "right")</li>
	 * 			<li>keyName (nom de la touche clavier enfonc�e, voir JSYG.nonAlphaNumKeys pour les touches non alphanumériques)</li>
	 *			<li>wheelDelta (molette de la souris, propriété impl�ment�e dans IE,Chrome mais non standard)</li>
	 * 		</ul>
	 * 	</li>
	 * </ul>
	 * @param evt nom du ou des évènements du DOM ('mousedown','keypress',etc) séparés par des espaces.
	 * On peut ajouter les pr�cisions suivantes aux évènements, séparées par un tiret :
	 * 	<ul>
	 * 		<li>"left" ou "right" : seulement sur un bouton sp�cifique.</li>
	 * 		<li>"ctrl","alt","shift" : seulement si la touche spécifiée est enclench�e.</li>
	 * 		<li>"strict" :
	 * 			<ul>
	 * 				<li>Si une touche est spécifiée, ne se déclenche que si cette touche et uniquement celle-ci est enclench�e.</li>
	 * 				<li>Si aucune touche n'est spécifiée, ne se déclenche que si aucune touche n'est enclench�e.</li>
	 *  			<li>Sur les évènements "mouseup" et "click", ne se déclenche que si la souris n'a pas boug� pendant le clic.
	 *  				Une tol�rance peut être définie par la méthode JSYG.prototype.dragTolerance.
	 *  			</li>
	 *  		</ul>
	 * 		</li>
	 * 		<li>unique : l'écouteur sera détaché aussitôt la fonction exécutée.</li>
	 * 		<li>direct : seulement si l'élément est la cible directe (et non par propagation ou bouillonnement).</li>
	 * 	</ul>
	 * </li>
	 * @param selector optionnel (si non défini, <code>fct</code> devient le deuxi�me argument),
		selecteur css pour d�l�gation d'évènement. L'écouteur d'évènement est attach� à la collection mais
		la fonction s'exécute seulement si la cible r�pond aux crit�res de ce sélecteur.
		Dans <code>fct</code>, le mot cl� this fait alors référence à la cible et non à l'élément de la collection initiale.
	 * @param fct fonction à exécuter lors du déclenchement de l'évènement.
	 * @returns {JSYG}
	 * @example <pre>new JSYG("#maDiv").on("click",function() { alert("toto"); });
	 * 
	 * new JSYG("#maDiv").on({
	 * 	"mouseover" : function() { alert("bonjour"); },
	 * 	"mouseout" : function() { alert("au revoir"); }
	 * });
	 * 
	 * new JSYG("#maDiv").on("mouseover click",function(e) { e.preventDefault(); });
	 * 
	 * //D�l�gation d'évènements
	 * new JSYG(document.body).on("click",'.cliquable',function() {
	 * 	alert('ceci est un élément cliquable');
	 * });
	 * //équivalent à 
	 * new JSYG(document.body).on({
	 *   click : function() { alert('ceci est un élément cliquable'); }
	 *  },'.cliquable');
	 * 
	 * new JSYG("#maDiv").on("strict-left-ctrl-click",function(e) {
	 * 	alert("clic gauche, touche ctrl enfonc�e et la souris n'a pas boug�");
	 * });
	 * 
	 * new JSYG("#maDiv").on("unique-click",function(e) {
	 * 	alert("Ceci est un message qui ne s'affichera qu'une seule fois");
	 * });
	 * 
	 */
	JSYG.prototype.on = function(evt,selector,fct) {
				
		if (typeof(evt) === 'object') { //appel r�cursif si on passe un objet en paramêtre
			for (var n in evt) {
				if (evt.hasOwnProperty(n)) this.on(n,selector,evt[n]);
			}
			return this;
		}
		
		if (typeof selector == 'function') { fct = selector; selector = null; }
		
		if (!fct) return this;
		
		var evts = evt.split(/ +/);
		
		this.each(function() {
			
			var that = this,
				evtAttached,
				fctAttached,
				search,button,key,strict,direct,unique,
				i,j,N,M,
				ls = this.data(propListeners);
			
			if (!ls) { ls = []; this.data(propListeners,ls); }
			
			boucle :
			
			for (i=0,N=evts.length;i<N;i++) {
				
				evt = evts[i];
				
				//s'il s'agit de l'évènement window.load et que la page est déjà chargée, on exécute aussitôt
				if (evt == 'load' && this[0] === window && windowLoaded) return fct.call(window);
								
				if (evt.indexOf('-') !== -1) {
					
					search = rSearches.button.exec(evt);
					button = search && search[1] || null;
					
					search = rSearches.key.exec(evt);
					key = search && search[1] || null;
					
					strict = rSearches.strict.test(evt);			
					direct = rSearches.direct.test(evt);
					unique = rSearches.unique.test(evt);
										
					evtAttached = evt.replace(rSearches.all,'');
					
					if (unique) { unique = function(evt) { that.off(evt,selector,fct); }.bind(null,evt); }
										
					if (strict && (evtAttached == 'mouseup' || evtAttached == "click")) {
						
						fctAttached = createStrictClickFunction(this[0],evtAttached,selector,fct,button,key,direct,unique);
						evtAttached = 'mousedown';
					}
					else {
						
						fctAttached = createCustomFunction(this[0],evtAttached,selector,fct,button,key,strict,direct,unique);
					}
				}
				else {
					
					fctAttached = function(e) {
						e = new JSYG.Event(e);
						if (selector && querySelectorAll(selector,that[0]).indexOf(e.target) === -1) return;
						fct.call(selector ? e.target : that[0],e);
					};
					evtAttached = evt;
				}
				
				if (evtAttached.indexOf(dragPrefixe) === 0) {
					fctAttached = createFakeDragFunction(this[0],evtAttached,fctAttached);
					evtAttached = 'mousedown';
				}
				
				for (j=0,M=ls.length;j<M;j++) {
					//l'évènement est déjà enregistr�
					if (ls[j].evt === evt && ls[j].fct === fct && ls[j].selector === selector) continue boucle;
				}
												 
				if (this[0].addEventListener) {

					this[0].addEventListener(evtAttached,fctAttached,false);
													
					if (evt === 'mousewheel') this[0].addEventListener('DOMMouseScroll',fctAttached,false); //special pour FF
				}
				else if (this[0].attachEvent) {
					
					if (evt == 'DOMContentLoaded' && JSYG.isWindow(this[0])) {
						
						IEDOMContentLoaded(fct);
						continue;
					}
					else {
						
						if (evt == 'input') evtAttached = 'propertychange';
						
						this[0].attachEvent('on'+evtAttached,fctAttached);
					}
				}
				
				ls.push({
					evt:evt, evtAttached:evtAttached,
					fct:fct, fctAttached:fctAttached,
					selector:selector
				});
			}
						
		},true);
		
		return this;
	};
		
	/**
	 * Suppression d'un écouteur d'évènement sur la collection.<br/><br/>
	 * On peut également passer en argument un objet avec en cl�s les noms des évènements et en valeurs les fonctions.<br/><br/>
	 * @param evt chaîne, nom du ou des évènements ('mousedown','keypress',etc) séparés par des espaces.
	 * @param selector optionnel, chaîne, sélecteur css pour d�l�gation d'évènements.
	 * @param fct fonction à exécuter lors du déclenchement de l'évènement.
	 * @returns {JSYG}
	 * @see JSYG.prototype.on
	 */
	JSYG.prototype.off = function(evt,selector,fct) {
		
		if (typeof(evt) === 'object') { //appel r�cursif si on passe un objet en paramêtre
			for (var n in evt) {
				if (evt.hasOwnProperty(n)) this.off(n,selector,evt[n]);
			}
			return this;
		}
				
		if (typeof selector == 'function') { fct = selector; selector = null; }
		
		var evts = evt && evt.split(/ +/);
		
		this.each(function() {
		
			var node = this[0],
				i,N,j,M,
				ls = this.data(propListeners);
			
			if (!ls) { ls = []; this.data(propListeners,ls); }
			
			//pas d'argument, on efface tout
			if (fct == null) {
				
				var suppr = [];
				
				for (i=0,N=ls.length;i<N;i++) {
					if ((evt == null || evts.indexOf(ls[i].evt)!==-1) && (selector == null || ls[i].selector == selector)) { suppr.push(ls[i]); }
				}
				
				for (i=0,N=suppr.length;i<N;i++) { this.off(suppr[i].evt,selector,suppr[i].fct); }
				
				return this;
			}
			
			for (i=0,N=evts.length;i<N;i++) {
				
				evt = evts[i];
									
				for (j=0,M=ls.length;j<M;j++) {
					
					if (ls[j].evt === evt && ls[j].fct === fct && ls[j].selector == selector) {
						
						if (node.removeEventListener) {
							
							node.removeEventListener(ls[j].evtAttached,ls[j].fctAttached,false);
							
							if (evt === 'mousewheel') node.removeEventListener('DOMMouseScroll',ls[j].fctAttached,false); //FF
						}
						else node.detachEvent('on'+ls[j].evtAttached,ls[j].fctAttached);
						
						ls.splice(j,1);
						
						break;
					}
				}
			}
			
			return null;
			
		},true);
		
		return this;
	};
	
	/**
	 * même principe que la méthode JSYG.prototype.on mais la fonction n'est execut�e qu'une seule fois.
	 * @see JSYG.prototype.on
	 * @param evt
	 * @param fct
	 * @returns {JSYG}
	 
	JSYG.prototype.one = function(evt,selector,fct) {
		
		if (typeof(evt) === 'object') { //appel r�cursif si on passe un objet en paramêtre
			for (var n in evt) {
				if (evt.hasOwnProperty(n)) {this.one(n,selector,evt[n]); }
			}
			return this;
		}
		
		if (typeof selector == 'function') { fct = selector; selector = null; }
		
		var that = this;
		var evts = evt && evt.split(/ +/) || [];
				
		evts.forEach(function(evt) {
			var newfct = function(e) {
				fct.call(this,e);
				that.off(evt,selector,newfct);
			};
			that.on(evt,selector,newfct);
		});
		
		return this;
	};*/
	
	/**
	 * vérifie si les éléments de la collection contiennent un écouteur d'évènements pour la fonction spécifiée
	 * @param evt nom de l'évènement
	 * @param fct
	 * @returns {Boolean}
	 */
	JSYG.prototype.checkEvtListener = function(evt,fct) {
		
		var test = true;
		
		this.each(function() {
			
			var localtest = false;
			
			var ls = this.data(propListeners);
			if (!ls) { ls = []; this.data(propListeners,ls); }
				
			for (var i=0,N=ls.length;i<N;i++) {
				if (ls[i].evt === evt && ls[i].fct === fct) {
					localtest = true;
					break;
				}
			}
			
			if (!localtest) {
				test = false;
				return false;
			}
			
			return null;
			
		},true);
		
		return test;
	};
	
	/**
	 * déclenchement artificiel d'un évènement donn� sur la collection.
	 * Ne fonctionne (du moins pour le moment) qu'avec les évènements natifs (pas de 'strict-left-click' par exemple).
	 * @param type chaîne, évènement
	 * @returns {JSYG}
	 */
	JSYG.prototype.trigger = function(type) {
		
		if (JSYG.StdConstruct && this['on'+type] !== undefined) { //évènement customis�
			return JSYG.StdConstruct.prototype.trigger.apply(this,arguments);
		}
		
		this.each(function() {
		
			var evt;
			
			if (type == 'focus' || type == 'blur') {
				this[type]();
			}
			else if (document.createEvent) {
				evt = document.createEvent("HTMLEvents");
				evt.initEvent(type, false, true);
				this.dispatchEvent(evt);
			}
			else if (document.createEventObject) {
				
				evt = document.createEventObject();
				try {
					this.fireEvent('on'+type,evt);
				} catch (e) {}
			}
			
		});
		
		return this;
		
		/*
		
		e = e || {};
		
		if (type.match(/(mouse|click)/)) {
			
			evt = document.createEvent("MouseEvents");
			
			evt.initMouseEvent(
				type,					//the string to set the event's type to. Possible types for mouse events include: click, mousedown, mouseup, mouseover, mousemove, mouseout.
				true,					//whether or not the event can bubble. Sets the value of event.bubbles.
				true,					//whether or not the event's default action can be prevented. Sets the value of event.cancelable.
				window,					//the Event's AbstractView. You should pass the window object here. Sets the value of event.view.
				e.detail||0,			//the Event's mouse click count. Sets the value of event.detail.
				e.screenX||0,			//the Event's screen x coordinate. Sets the value of event.screenX.
				e.screenY||0,			//the Event's screen y coordinate. Sets the value of event.screenY.
				e.clientX||0,			//the Event's client x coordinate. Sets the value of event.clientX.
				e.clientY||0,			//the Event's client y coordinate. Sets the value of event.clientY.
				e.ctrlKey||false,		//whether or not control key was depressed during the Event. Sets the value of event.ctrlKey.
				e.altKey||false,		//whether or not alt key was depressed during the Event. Sets the value of event.altKey.
				e.shiftKey||false,		//whether or not shift key was depressed during the Event. Sets the value of event.shiftKey.
				e.metaKey || false,		//whether or not meta key was depressed during the Event. Sets the value of event.metaKey.
				e.button||0,			//the Event's mouse event.button.
				e.relatedTarget||null	//the Event's related EventTarget. Only used with some event types (e.g. mouseover and mouseout). In other cases, pass null.
			);
		}
		else if (type.match(/key/)) {
			
			evt = document.createEvent("KeyboardEvent");
			
			if (evt.initKeyBoardEvent) { //W3C
				
				var arg = '';
				if (e.ctrlKey) { arg+='Control ';}
				if (e.altKey) { arg+='Alt ';}
				if (e.shiftKey) { arg+='Shift ';}
				if (e.metaKey) { arg+='Meta '; }
				
				arg = arg.replace('/ $/','');
				
				evt.initKeyBoardEvent(                                                                                      
					type,        					//  in DOMString typeArg,                                                           
					true,            				//  in boolean canBubbleArg,                                                        
					true,             				//  in boolean cancelableArg,                                                       
					null,             				//  in nsIDOMAbstractView viewArg,  Specifies UIEvent.view. This value may be null.
					e.key || null,					// The key identifier. This value is returned in the key property of the event.
					e.location || null,				// The location of the key on the device. This value is returned in the location property of the event. 
					arg								// A white space separated list of modifier key identifiers to be activated on this object.
				);
			}
			else if (evt.initKeyEvent) { //Firefox mais pas W3C
				
				evt.initKeyEvent(                                                                                      
					type,        					//  in DOMString typeArg,                                                           
					true,            				//  in boolean canBubbleArg,                                                        
					true,             				//  in boolean cancelableArg,                                                       
					null,             				//  in nsIDOMAbstractView viewArg,  Specifies UIEvent.view. This value may be null.     
					e.ctrlKey || false,            	//  in boolean ctrlKeyArg,                                                               
	                e.altKey || false,            	//  in boolean altKeyArg,                                                        
	                e.shiftKey || false,            //  in boolean shiftKeyArg,                                                      
	                e.metaKey || false,            	//  in boolean metaKeyArg,                                                       
	                e.keyCode || 9,               	//  in unsigned long keyCodeArg,                                                      
	                e.charCode || 0					//  in unsigned long charCodeArg);
				);
			} else { //sinon version d�grad�e : initKeyboardEvent 
				evt.initEvent(type, false, true);
			}
			
		}
		else {
		    
			evt = document.createEvent("HTMLEvents");
		    evt.initEvent(type, false, true);
		}

		
		if (!evt) { throw type+" n'est pas un évènement connu."; }
				
		this[0].dispatchEvent(evt);
				
		return this;
		*/
	};
	
	/**
	 * Renvoie ou définit le nombre de pixels d'un d�placement souris au del� duquel
			les évènements customis�s 'strict-click' et 'strict-mouseup' ne seront pas d�clench�s.
	 * @param px nombre de pixels
	 * @returns {Number,JSYG}
	 */
	JSYG.prototype.dragTolerance = function(px) {
		
		if (px == null) { return this.data('dragTolerance') || 0; }
		
		this.data('dragTolerance',px);
		return this;
	};
	
	
	var cacheData = [];
	//nom de propriété unique à attacher à l'objet DOM pour retrouver ses données dans le cache
	var propData = "JSYG" + Math.random().toString().replace( /\D/g, "" );
	
	/**
	 * Stockage ou Récupération de données sur les éléments DOM de la collection. Ainsi, on retrouve ces données dans toutes les instances JSYG pointant vers ces éléments.
	 * @param key chaîne, identifiant de la donnée
	 * @param value optionnel et de type libre. Si non renseign�, renvoie la valeur de la donnée identifi�e par key (du premier élément), sinon affecte la valeur à la donnée identifi�e par key. 
	 * @returns {JSYG} si value est renseign�, la donnée du premier élément de la collection sinon
	 */
	JSYG.prototype.data = function(key,value) {

		if (typeof(key) == 'object') { //appel r�cursif si on passe un objet en paramêtre
			for (var n in key) {
				if (key.hasOwnProperty(n)) { this.data(n,key[n]); }
			}
			return this;
		}
		
		var val;
						
		this.each(function() {
		
			if (this[propData] == null) { this[propData] = cacheData.length; cacheData.push({}); }
			
			var ind = this[propData];
					
			//lecture
			if (value == null) { val = cacheData[ind] && cacheData[ind][key]; return false; }
			else { cacheData[ind][key] = value; }
			
			return null;
		});
		
		return (value == null) ? val : this;
	};
	
	/**
	 * Suppression d'une donnée sur les éléments de la collection.
	 * @param key identifiant de la donnée. Si non renseign�, efface toutes les données de la collection.
	 * @returns {JSYG}
	 */
	JSYG.prototype.dataRemove = function(key) {
				
		var a=arguments,
		i,N=a.length;
		
		this.each(function() {
			
			var ind = this[propData];
			if (ind == null) return;

			if (key==null) {
				delete cacheData[ind];//on efface tout
				try { delete this[propData]; }
				catch(e) { this[propData] = null; } //IE7
			} 
			else {
				for (i=0;i<N;i++) {
					if (a[i] in cacheData[ind]) { delete cacheData[ind][a[i]]; }
				}
			}
		});
		
		return this;
	};
	
	/**
	 * Stockage ou Récupération de données sur les éléments DOM de la collection sous forme d'attribut html data.
	 * Les diff�rences avec la méthode JSYG.prototype.data sont que :
	 * <ul>
	 *	<li>les valeurs sont sérialis�es (ce ne sont pas des références vers des objets) par la méthode JSON.stringify</li>
	 *	<li>on ne peut donc pas stocker des fonctions (sp�cification JSON)</li>
	 *	<li>les données sont visibles dans le code html puisque ce sont des attributs (au sens html du terme)</li>
	 *	<li>ces données sont conservées si on clone le noeud (utile notamment pour le module UndoRedo)</li>
	 * </ul>
	 * @param key identifiant de la donnée
	 * @param value optionnel et de type libre. Si non renseign�, renvoie la valeur de la donnée identifi�e par key, sinon affecte la valeur à la donnée identifi�e par key. 
	 * @returns {JSYG} si value est renseign�, la donnée du premier élément de la collection sinon
	 * @link https://developer.mozilla.org/en/DOM/element.dataset
	 * @see JSYG.prototype.data
	 */
	JSYG.prototype.dataAttr = function(key,value) {
				
		if (typeof(key) == 'object') { //appel r�cursif si on passe un objet en paramêtre
			for (var n in key) {
				if (key.hasOwnProperty(n)) this.dataAttr(n,key[n]);
			}
			return this;
		}
		
		var val;
		
		if (value == null) val = null;
		else if (['string','number'].indexOf(typeof value) != -1 ) val = value;
		else val = JSON.stringify(value);
								
		this.each(function() {
				
			//lecture
			if (value == null) {
				
				if (key == null) {
					
					if (this.dataset) val = this.dataset;
					else {
						
						var i=0,
							N=this.attributes.length,
							r = /^data-/,
							attr;
						
						val = {};
						
						for (;i<N;i++) {
							attr = this.attributes[i];
							if (attr.name.match(r)) val[ attr.name.replace(r,'') ] = JSON.parse(attr.value);
						}	
					}
				}
				else {
					
					val = this.dataset ? this.dataset[key] : this.getAttribute("data-"+key);
					if (val) {
						try { val = JSON.parse(val); }
						catch(e) { }
					}
				}
				
				return false; //on sort de la boucle
			}
			else {
				if (this.dataset) this.dataset[key] = val;
				else this.setAttribute("data-"+key,val);
			}
			
			return null;
		});
		
		return value == null ? val : this;
	};
	
	/**
	 * Suppression d'un attribut donnée sur les éléments de la collection.
	 * @param key identifiant de la donnée. Si non renseign�, efface tous les attributs données de la collection.
	 * @returns {JSYG}
	 */
	JSYG.prototype.dataAttrRemove = function(key) {
		
		var a = arguments;
				
		this.each(function() {
			
			var i,N,r,attr;
		
			if (key==null) { //on efface tout
				
				if (this.dataset) {
					for (i in this.dataset) { delete this.dataset[i]; }
				}
				else {
					
					i=0; N=this.attributes.length;
					r = /^data-/;
					
					for (i=0;i<N;i++) {
						attr = this.attributes[i].name;
						if (attr.match(r)) { this.removeAttribute(attr); }
					}	
				}
	
			}
			else {
				
				i=0; N=a.length;
				
				if (this.dataset) { for (i=0;i<N;i++) { this.dataset[a[i]] = null; } }
				else { for (;i<N;i++) { this.removeAttribute('data-'+a[i]); } }
						
			}
		});
			
		return this;
	};
	
	/**
	 * Clone et affecte tous les écouteurs d'évènements de l'élément passé en argument à la collection.
	 * @param elmt argument JSYG
	 * @returns {JSYG}
	
	JSYG.prototype.cloneEvents = function(elmt) {
		
		events = new JSYG(elmt).data(propListeners);
		var i,N=events.length;
		
		if (events) {
			this.each(function() {
				for (i=0;i<N;i++) { this.on(events[i].evt,events[i].fct); }
			},true);
		}
				
		return this;
	}; */
	
	/**
	 * Clone le noeud DOM (et ses enfants). Les écouteurs d'évènements ne sont pas clon�s.
	 * @returns {JSYG} objet clon�
	 */
	JSYG.prototype.clone = function(/*events*/) {
		
		var list = [];
		
		this.each(function() {
					
			var clone = this.cloneNode(true);
					
			//tir� de jQuery
			if (!JSYG.support.cloneEvent) { //IE
				
				clone[propData] = null;
				
				// We do not need to do anything for non-Elements
				if ( clone.nodeType !== 1 ) return null;
				
				if (clone.clearAttributes && clone.mergeAttributes) {
					// clearAttributes removes the attributes, which we don't want, but also removes the attachEvent events, which we *do* want
					clone.clearAttributes();
					// mergeAttributes, in contrast, only merges back on the original attributes, not the events
					if (clone.mergeAttributes) clone.mergeAttributes(this);
				}
				
				
				clone[propData] = undefined;
			}
			
			//if (events) { new JSYG(clone).cloneEvents(this); }
			
			list.push(clone);
			
			return null;
		});
							
		return new JSYG(list);
	};
	
	/**
	 * Supprime tous les écouteurs d'évènements, les données et les "données attributs" de la collection
	 * @returns {JSYG}
	 */
	JSYG.prototype.clean = function() {
		
		this.each(function() {
			this.off(); //suppression de tous les écouteurs d'évènement
			this.dataRemove(); //suppression des données attach�es à l'élément
			this.dataAttrRemove();
		},true);
		return this;
	};
	
	/**
	 * Vide le contenu DOM de la collection
	 * @returns {JSYG}
	 */
	JSYG.prototype.empty = function() {
		
		this.each(function() {
			while (this.firstChild) { this.removeChild(this.firstChild); }
		});
		
		return this;
	};
	
	/**
	 * Alias de de JSYG.prototype.empty
	 * @deprecated utiliser la méthode JSYG.prototype.empty
	 */
	JSYG.prototype.clear = function() { return JSYG.prototype.empty.call(this); };
	
	
	JSYG.isOver = function(dim1,dim2,typeOver) {
		
		var test = { x : false , y : false };
		
		typeOver = typeOver || 'full';
		
		if (typeOver === 'full') {
		
			if (dim1.width < dim2.width) {
				test.x = dim1.x > dim2.x && dim1.x+dim1.width<=dim2.x+dim2.width;
			} else {
				test.x = dim1.x <= dim2.x && dim1.x+dim1.width>=dim2.x+dim2.width;
			}
			
			if (dim1.height < dim2.height) {
				test.y = dim1.y > dim2.y && dim1.y+dim1.height<=dim2.y+dim2.height;
			} else {
				test.y = dim1.y <= dim2.y && dim1.y+dim1.height>=dim2.y+dim2.height;
			}
		}
		else if (typeOver === 'partial') {
			
			test.x = dim1.x > dim2.x && dim1.x <= dim2.x+dim2.width || dim1.x+dim1.width > dim2.x && dim1.x+dim1.width <= dim2.x+dim2.width;
			if (dim1.width > dim2.width && test.x === false) {
				test.x = dim1.x <= dim2.x && dim1.x+dim1.width >= dim2.x+dim2.width;
			}
			
			test.y = dim1.y > dim2.y && dim1.y <= dim2.y+dim2.height || dim1.y+dim1.height > dim2.y && dim1.y+dim1.height <= dim2.y+dim2.height;
			if (dim1.height > dim2.height && test.y === false) {
				test.y = dim1.y <= dim2.y && dim1.y+dim1.height >= dim2.y+dim2.height;
			}
			
		} else if (typeOver === 'center') {
			
			var center = { x : dim2.x+dim2.width/2, y : dim2.y+dim2.height/2 };
			test.x = center.x > dim1.x && center.x < dim1.x+dim1.width;
			test.y = center.y > dim1.y && center.y < dim1.y+dim1.height;
		}
				
		return test.x && test.y;
	};
	
	/**
	 * Teste si le premier element de la collection est au dessus de l'élément passé en argument
	 * @param node argument JSYG
	 * @param type 'full','partial','center'
	 * <ul>
	 * 	<li>full : l'élément est enti�rement au dessus de l'autre</li>
	 *  <li>partial : les deux éléments se chevauchent</li>
	 *  <li>center : l'élément recouvre le centre de l'élément argument</li>
	 * </ul>
	 * @returns {Boolean}
	 */
	JSYG.prototype.isOver = function(node,type) {
		
		var dim1 = this.getDim('screen'),
			dim2 = new JSYG(node).getDim('screen');
		
		return JSYG.isOver(dim1,dim2,type);
	};
	
	/**
	 * Teste si le premier élément de la collection est enfant de l'élément passé en argument
	 * @param arg argument JSYG
	 * @returns {Boolean}
	 */
	JSYG.prototype.isChildOf = function(arg) {
		var node = new JSYG(arg)[0];
		var parent = this[0].parentNode;
		while (parent) {
			if (parent === node) return true;
			parent = parent.parentNode;
		}
		return false;
	};

	
	/**
	 * Supprime la collection de l'arbre DOM. La collection existe toujours en m�moire.
	 * @param {Boolean} clean si true vide les données et les écouteurs d'évènements liés à la collection
	 * @returns {JSYG}
	 */
	JSYG.prototype.remove = function(clean) {
		
		this.each(function() {
			if (clean) new JSYG(this).clean();
			this.parentNode && this.parentNode.removeChild(this);
		});
		
		return this;
	};
	
	
	/**
	* Display par défaut des éléments
	*/
	var elementDisplay = {};
	
	/**
	* Renvoie le display par défaut de l'élément. Tir� de zepto.js. Peut mieux faire.
	*/
	function defaultDisplay(obj) {
	
		var element, display,
			nodeName = obj.getTag(),
			type, parent;
		
		if (!elementDisplay[nodeName]) {
			
			type = obj.getType();
			
			parent = (type == 'svg') ? new JSYG('<svg>').appendTo('body') : 'body';
			
			element = new JSYG('<'+nodeName+'>').appendTo(parent);
			display = element.css('display');
			
			if (type == 'svg') parent.remove();
			else element.remove();
			
			if (display == "none") display = "block";
			
			elementDisplay[nodeName] = display;
		}
		
		return elementDisplay[nodeName];
	}
	
	var regValAndUnits = /(-?\d*\.?\d+)(px|pt|em|%|deg)$/,
		regOperator = /^ *(\+|-|\*|\/)=/;
		
	JSYG._separateValAndUnits = function(str) {
		
		str = (str != null) ? str.toString() : "";
		
		var result = regValAndUnits.exec(str);
		
		return {
			value: (result && result[1]!=null) ? parseFloat(result[1]) : JSYG.isNumeric(str) ? parseFloat(str) : str,
			units:result && result[2] || ''
		};
	};
	
	JSYG.listTransf = ['rotate','scale','scaleX','scaleY','skewX','skewY','translateX','translateY'];
	
	JSYG.prototype._getAbsValue = function(prop,str) {
				
		str = str.toString();
		
		var op = regOperator.exec(str) || '',
			donnee, transf, initialValue;
		
		if (op && op[1]) str = str.replace( op[1]+'=' ,'');
				
		donnee = JSYG._separateValAndUnits(str);
						
		if (!op) return donnee.value+donnee.units;
			
		if (JSYG.listTransf.indexOf(prop)!==-1) {
			
			if (prop === 'scale') prop = 'scaleX';
			transf = this.getTransf();
			initialValue = JSYG._separateValAndUnits( transf[prop] );
			
		} else initialValue = JSYG._separateValAndUnits( this.css(prop) );
		
		op = op[1]; //sous-chaîne trouvée
						
		if (!JSYG.isNumeric(initialValue.value) || !JSYG.isNumeric(donnee.value)) return initialValue.value+initialValue.units;
				
		switch (op) {
			case '+' : return initialValue.value + donnee.value + initialValue.units;
			case '-' : return initialValue.value - donnee.value + initialValue.units;
			case '*' : return initialValue.value * donnee.value + initialValue.units;
			case '/' : return initialValue.value / donnee.value + initialValue.units;
		}
	};
	
	/**
	 * Liste des propriétés SVG stylables en css
	 */
	JSYG.svgCssProperties = [ 'font','font-family','font-size','font-size-adjust','font-stretch','font-style','font-variant','font-weight', 'direction','letter-spacing','text-decoration','unicode-bidi','word-spacing', 'clip','color','cursor','display','overflow','visibility', 'clip-path','clip-rule','mask','opacity', 'enable-background','filter','flood-color','flood-opacity','lighting-color','stop-color','stop-opacity','pointer-events', 'color-interpolation','color-interpolation-filters','color-profile','color-rendering','fill','fill-opacity','fill-rule','image-rendering','marker','marker-end','marker-mid','marker-start','shape-rendering','stroke','stroke-dasharray','stroke-dashoffset','stroke-linecap','stroke-linejoin','stroke-miterlimit','stroke-opacity','stroke-width','text-rendering','alignment-baseline','baseline-shift','dominant-baseline','glyph-orientation-horizontal','glyph-orientation-vertical','kerning','text-anchor','writing-mode' ];
	
	/**
	 * Liste des propriétés css3 nécessitant un pr�fixe (-moz,-webkit, etc)
	 */
	JSYG.css3Properties = [];
	
	/**
	 * Liste des pr�fixes des diff�rents navigateurs
	 */
	JSYG.vendorPrefixes = ['','Moz','Webkit','O','ms'];
		
	/**
	 * Affecte ou récupère des éléments de style.<br/><br/>
	 * Pour définir rapidement plusieurs propriétés, on peut passer en paramêtre un objet dont les cl�s sont les noms de propriétés et les valeurs les valeurs à affecter.<br/> <br/>
	 * @param prop nom de la propriété au format css ("z-index") ou js ("zIndex").
	 * @param val si définie, fixe la valeur de cette propriété de style. Dans certains cas, une valeur numérique est admise.
	 * <br/><br/>
	 * Valeurs sp�ciales uniformis�es :
	 * <ul>
	 * <li>float</li>
	 * <li>opacity</li>
	 * <li>scrollTop</li>
	 * <li>scrollLeft</li>
	 * </ul>
	 * @example :<ul>
	 * <li><strong>jsynObjet.css('visibility')</strong> : renvoie la propriété de style 'visibility'</li>
	 * <li><strong>jsynObjet.css('visibility','hidden')</strong> : fixe la propriété de style 'visibility' à 'hidden'</li>
	 * <li><strong>jsynObjet.css({'visibility':'visible','width':'50px'})</strong> : fixe les valeurs de 'visibility' et 'width'</li> 
	 * </ul>
	 * @returns {String,JSYG} valeur de la propriété si val est indéfini, l'objet JSYG lui même si la méthode est appelée pour définir des valeurs.
	 */
	JSYG.prototype.css = function(prop,val) {
				
		if (typeof(prop) == 'object') { //appel récursif si on passe un objet en paramêtre
			for (var n in prop) {
				if (prop.hasOwnProperty(n)) this.css(n,prop[n]);
			}
			return this;
		}
		
		if (val == null && prop == 'float') return this.css('cssFloat');
		
		var jsFormat = JSYG.camelize(prop),
			cssFormat =  JSYG.dasherize(prop);
		
		//lecture
		if (val == null) {
			
			if (jsFormat == 'scrollLeft') return this.scrollLeft();
			else if (jsFormat == 'scrollTop') return this.scrollTop();

			//propriété écrite en dur (soit dans la balise, soit déjà forcée en javascript)
			else if (this[0].style && this[0].style[jsFormat]) val = this[0].style[jsFormat];
			 //propriété standard
			else if (this[0].getAttribute && this[0].getAttribute(cssFormat)) val = this[0].getAttribute(cssFormat);
			 //écrite dans une feuille de style (W3C)
			else if (window.getComputedStyle) val = window.getComputedStyle(this[0],null).getPropertyValue(cssFormat) || undefined; //sinon renvoie une chaîne nulle
			 //écrite dans une feuille de style (IE)
			else if (this[0].currentStyle && this[0].currentStyle[jsFormat]) return this[0].currentStyle[jsFormat];
			//compatibilité IE
			else if (prop == 'cssFloat') return this.css('styleFloat');
			else if (prop == 'opacity') {
				val = this[0].style.filter;
				if (val != null) {
					val = /alpha\(opacity=([^)]*)\)/i.exec(val);
					val = val && val[1] || 1;
				}
				else val = 1;
			}
			else val = undefined;
							
			return val;
			
		}
		else {
			
			this.each(function() {
				
				var jThis = new JSYG(this);
				
				if (jsFormat == "display" && val === "") return jThis.css("display",defaultDisplay(jThis));
		
				var type = jThis.getType();
										
				val = jThis._getAbsValue(prop,val);
								
				if (type === 'html') {
					
					if (prop == 'scrollLeft') jThis.scrollLeft(val);
					else if (prop == 'scrollTop') jThis.scrollTop(val);
					else if (this.style) {
						
						if (JSYG.isNumeric(val) && jsFormat.match(/^(padding|margin|width|height|border|left|top|bottom|right|fontSize)/)) val+= 'px';
						
						this.style[jsFormat] = val;
											
						//iframes, svg, etc
						if ((jsFormat == 'width' || jsFormat == 'height') && this.getAttribute(jsFormat) != null)
							this.setAttribute(cssFormat,val);
						
						if (jsFormat == 'opacity' && this.style.filter!=null) {
							val = (val==1) ? '' : 'alpha(opacity='+Math.round(val*100)+')';
							this.style.filter = val;
							this.style.zoom = 1;
						}
						else if (jsFormat == 'float')
							this.style.cssFloat = this.style.styleFloat = val;
						
						else if (jsFormat == 'display' && val === '')
							this.style.display = defaultDisplay(jThis);
						
						else if (JSYG.css3Properties.indexOf(cssFormat) !== -1)
							JSYG.vendorPrefixes.forEach( function(prefix) { this.css(prefix+prop,val); }.bind(jThis) );
					}
				} else if (type === 'svg') {
					
					if (JSYG.svgCssProperties.indexOf(cssFormat)!==-1) {
						this.setAttribute(cssFormat,val);
						this.style[jsFormat] = val;
					}
					else if ((jsFormat == 'width' || jsFormat == 'height') && this.getAttribute(jsFormat) != null) {
						this.setAttribute(cssFormat,val);
					}
				}
				
			});
		
			return this;
		}
	};
	
	
	/**
	 * Récupération d'un élément de style sous forme de nombre, si celui-ci a été défini sans unit� ou en pixel
	 * (ne fonctionne pas si défini en pourcentage ou en em).
	 * @param prop nom de la propriété à récupèrer
	 * @returns {Number}
	 */
	JSYG.prototype.cssNum = function(prop) {
		
		var val = this.css(prop),
			floatVal;
		
		//si la valeur n'est pas en pixels
		/*
		if (/^-?(?:\d*\.)?\d+(?!px)[^\d\s]+$/i.test(val)) {
			
			//IE  (tir� de chez Dean Edwards)
			if (document.documentElement.currentStyle) {
			
				var left = this[0].style.left,
					runtimeStyle = this[0].runtimeStyle.left;
				
				this[0].runtimeStyle.left = this[0].currentStyle.left;
				this[0].style.left = (prop === "fontSize" || prop === "font-size") ? "1em" : ( val || 0 );
				val = this[0].style.pixelLeft+'px';
				this[0].style.left = left;
				this[0].runtimeStyle.left = runtimeStyle;
			}
			else { return undefined; }
		}*/

		floatVal = parseFloat(val);
		
		return isNaN(floatVal) ? undefined : floatVal;
	};
	
	/**
	 * récupère ou fixe la valeur d'un attribut (au sens xml).<br/><br/>
	 * Pour définir rapidement plusieurs attributs, on peut passer en paramêtre un objet dont les cl�s sont les noms des attributs et les valeurs les valeurs à affecter.<br/> <br/>
	 * @param attr nom de l'attribut.
	 * @param val si définie, fixe la valeur de l'attribut.
	 * <br/><br/>
	 * @example :<ul>
	 * <li><strong>jsynObjet.attr('name')</strong> : renvoie l'attribut name de l'élément.</li>
	 * <li><strong>jsynObjet.attr('name','toto')</strong> : définit l'attribut name de l'élément.</li> 
	 * </ul>
	 * @returns {String,JSYG} valeur de l'attribut si val est indéfini, l'objet JSYG lui même si la méthode est appelée pour définir des valeurs.
	 */
	JSYG.prototype.attr = function(attr,val) {
		
		if (attr==null) return this;
		
		if (typeof(attr) == 'object') { //appel r�cursif si on passe un objet en paramêtre
			for (var n in attr) {
				if (attr.hasOwnProperty(n)) this.attr(n,attr[n]);
			}
			return this;
		}
		
		if (val == null) {
			
			if (this.type == 'svg') return this[0].getAttribute(attr);
			else {
				val = this[0][attr];
				if (typeof val == "string") return val;
				else return this[0].getAttribute(attr);
			}
		}
		else {
						
			this.each(function() {
				if (new JSYG(this).type == 'svg') this.setAttribute(attr,val);
				else {
					try { this.setAttribute(attr,val); }
					catch(e) { this[attr] = val; }
				}
			});
		}

		return this;
	};
	

	/**
	 * récupère ou fixe la valeur d'un attribut (au sens xml) dans un espace de noms donn�.<br/><br/>
	 * Pour définir rapidement plusieurs attributs, on peut passer en paramêtre un objet dont les cl�s sont les noms des attributs et les valeurs les valeurs à affecter.<br/> <br/>
	 * @param ns espace de nom.
	 * @param attr nom de l'attribut.
	 * @param val si définie, fixe la valeur de l'attribut.
	 * <br/><br/>
	 * @example :<ul>
	 * <li><strong>jsynObjet.attrNS('http://www.w3.org/2000/svg','name')</strong> : renvoie l'attribut name de l'élément.</li>
	 * <li><strong>jsynObjet.attr('name','toto')</strong> : définit l'attribut name de l'élément.</li> 
	 * </ul>
	 * @returns {String,JSYG} valeur de l'attribut si val est indéfini, l'objet JSYG lui même si la méthode est appelée pour définir des valeurs.
	*/
	JSYG.prototype.attrNS = function(ns,attr,val) {
		
		if (ns == null || attr == null) return this;
		
		if (typeof(attr) == 'object') { //appel r�cursif si on passe un objet en paramêtre
			for (var n in attr) {
				if (attr.hasOwnProperty(n)) this.attrNS(ns,n,attr[n]);
			}
			return this;
		}
		
		if (val == null) return this[0].getAttributeNS(ns,attr);
		else {				
			this.each(function() { this.setAttributeNS(ns,attr,val); });
		}
		return this;
	};
	
	/**
	 * Suppression d'un ou plusieurs attributs des éléments de la collection.
	 * @param attr nom de l'attribut. Le nombre d'arguments n'est pas limit�.
	 * @returns {JSYG}
	 */
	JSYG.prototype.attrRemove = function(attr) {	
		
		var a=arguments,
			i,N=a.length;
			
		this.each(function() {
			for (i=0;i<N;i++) this.removeAttribute(a[i]);
		});
		
		return this;
	};
	
	/**
	 * Suppression d'un ou plusieurs attributs des éléments de la collection dans un espace de noms donn�.
	 * @param ns espace de nom.
	 * @param attr nom de l'attribut. Le nombre d'arguments n'est pas limit�.
	 * @returns {JSYG}
	 */
	JSYG.prototype.attrNSremove = function(ns,attr) {	
		
		var a=arguments,
			i,N=a.length;
			
		this.each(function() {
			for (i=1;i<N;i++) this.removeAttributeNS(ns,a[i]);
		});
		
		return this;
	};
	
	/**
	 * M�morise la position de chaque élément dans l'arbre DOM
	 */
	JSYG.prototype.hierarchySave = function() {
		
		this.each(function() {
			
			if (!this[0].parentNode) throw new Error("Il faut attacher l'élément à l'arbre DOM");
			
			this.data("hierarchy",{
				parent : this[0].parentNode,
				next : this[0].nextSibling
			});
			
		},true);
		
		return this;
	};
	
	/**
	 * Remet chaque élément à sa position initiale dans l'arbre DOM
	 * @example<pre>var span = new JSYG('#monSpan');
	 * span.hierarchySave();
	 * span.remove();
	 * span.hierarchyRestore(); 
	 */
	JSYG.prototype.hierarchyRestore = function() {
		
		this.each(function() {
			
			var data = this.data("hierarchy");
			
			if (!data) return;
			
			if (data.next) data.parent.insertBefore(this[0],data.next);
			else data.parent.appendChild(this[0]);
			
		},true);
		
		return this;
	};
	
	/**
	 * récupère ou définit le lien de l'élément DOM. Cette méthode est utile pour harmoniser le html et le svg.
	 * Cette méthode permet de ce fait de définir l'attribut src des balises img.
	 * @param val si défini, fixe la valeur du lien.
	 * @returns {String,JSYG} valeur du lien si val est indéfini, l'objet JSYG lui-même sinon.
	 */
	JSYG.prototype.href = function(val) {
		
		if (val == null) {
			
			if (this.type === 'html') {
				if (['img','iframe','video','audio'].indexOf(this.getTag())!=-1) val = this[0].src;
				else val = this[0].href;
			}
			else val = this[0].getAttributeNS(NS.xlink,'href');
			
			return val;
		}
		else {
			
			this.each(function() {
		
				if (this.type === 'html') {
					if (['img','iframe','video','audio'].indexOf(this.getTag())!=-1) this[0].src = val;
					else this[0].href = val;
				}
				else {
					this[0].removeAttributeNS(NS.xlink,'href'); //sinon ajoute un nouvel attribut...
					this[0].setAttributeNS(NS.xlink,'href',val);
				}
				
			},true);
			
			return this;
		}
	};
	
	/**
	 * Remplit la collection de la couleur spécifiée, ou récupère la couleur du premier élément. Cette méthode est plut�t r�serv�e aux tests, il est pr�f�rable de jouer sur les classes, pour laisser les styles à part.
	 * @param color couleur html (ou objet JSYG.Color). Si non définie, renvoie la couleur du premier élément.
	 * @returns {String,JSYG} l'objet JSYG si color est définie, la valeur sinon
	 */
	JSYG.prototype.fill = function(color) {
		
		if (color == null) {
			var type = this.getType();
			return this.css( type === 'svg' ? 'fill' : 'background-color');
		}
		
		if (JSYG.Color && color instanceof JSYG.Color) color = color.toString();
							
		this.each(function() {
			
			if (this.getType() == 'svg') {
				this.css('fill', color == 'transparent' ? 'none' : color);
			} else {
				this.css('background-color', color == 'none' ? 'transparent' : color);
			}
			
		},true);
		
		return this;
	};
	
	/**
	 * Borde la collection selon la valeur spécifiée. Cette méthode est plut�t r�serv�e aux tests, il est pr�f�rable de jouer sur les classes, pour laisser les styles à part.
	 * Elle permet de définir rapidement, comme en html (attribut css border) la bordure des éléments SVG.
	 * @param val définition de la bordure ("1px solid black", "2px dashed gray", etc) ou objet JSYG.Color
	 * @returns {String,JSYG} l'objet JSYG si color est définie, la valeur sinon
	 */
	JSYG.prototype.stroke = function(val) {
	
		var type,onlyColor;
		
		if (val == null) {
			type = this.getType();
			return this.css( type === 'svg' ? 'stroke' : 'border' );
		}	

		if (JSYG.Color && val instanceof JSYG.Color) val = val.toString("hex");
				
		try { new JSYG.Color(val); onlyColor = true; }
		catch(e) {}
				
		this.each(function() {
			
			var type = this.getType(),props;
			
			if (type === 'html') { onlyColor && this.css('border-color',val) || this.css('border',val); }
			else {
				if (onlyColor) this.css('stroke',val);
				else {
					
					props = val.split(/ +/);
					props[0] && this.css('stroke-width',props[0]);
					var px = parseInt(props[0],10);
					switch(props[1]) {
						case 'dotted' : this.css('stroke-dasharray',px+','+px); break;
						case 'dashed' : this.css('stroke-dasharray',px*4+','+px*4); break;
						case 'none' : this.css('stroke','none'); break;
					}
					props[2] && this.css('stroke',props[2]);
				}
			}
			
		},true);
		
		
		return this;
	};
	/**
	 * Attache un ou plusieurs noeuds au premier élément de la collection. 
	 * @param arg argument JSYG. Le nombre d'arguments n'est pas limité.
	 * @returns {JSYG}
	 */
	JSYG.prototype.append = function(arg) {
		
		var a = arguments,
			node = this[0],
			i,N=a.length;
		
		for (i=0;i<N;i++) {
			new JSYG(a[i]).each(function() { node.appendChild(this); });
		}
		
		return this;
	};
	
	/**
	 * Attache la collection à l'élément passé en argument
	 * @param arg argument JSYG
	 * @returns {JSYG}
	 */
	JSYG.prototype.appendTo = function(arg) {
		
		var jArg = new JSYG(arg); 
		jArg.append.apply(jArg,JSYG.makeArray(this));
		return this;
	};
	
	/**
	 * Attache un ou plusieurs noeuds au premier élément de la collection, avant son premier enfant.
	 * @param arg argument JSYG. Le nombre d'arguments n'est pas limit�.
	 * @returns {JSYG}
	 */
	JSYG.prototype.prepend = function(arg) {
		
		var a = arguments,
			node = this[0],
			i,N=a.length;
	
		for (i=0;i<N;i++) {
			new JSYG(a[i]).each(function() {
				if (node.firstChild) node.insertBefore(this,node.firstChild);
				else node.appendChild(this);
			});
		}
		
		return this;
	};
	
	/**
	 * Attache la collection avant le premier enfant de l'élément passé en argument.
	 * @param arg argument JSYG
	 * @returns {JSYG}
	 */
	JSYG.prototype.prependTo = function(arg) {
		
		var jArg = new JSYG(arg); 
		jArg.prepend.apply(jArg,JSYG.makeArray(this));
		return this;
	};
	
	/**
	 * Remplace l'élément passé en argument par le premier élément de la collection.
	 * @param arg argument JSYG
	 * @returns {JSYG}
	 */
	JSYG.prototype.replace = function(arg) {
		
		var node = new JSYG(arg)[0];
		if (!node || !node.parentNode) throw new Error(node +" n'est pas un noeud DOM ou n'est pas attaché au DOM");
		node.parentNode.replaceChild(this[0],node);
		return this;
	};
	
	/**
	 * Remplace le premier élément de la collection par l'élément passé en argument
	 * @param arg argument JSYG
	 * @returns {JSYG}
	 */
	JSYG.prototype.replaceWith = function(arg) {

		new JSYG(arg).replace(this);
		return this;
	};
	
	/**
	 * Insert la collection avant l'élément passé en argument.
	 * @param arg argument JSYG
	 * @returns {JSYG}
	 */
	JSYG.prototype.insertBefore = function(arg) {
		
		var node = new JSYG(arg)[0];
		if (!node) throw new Error("Argument incorrect pour la méthode insertBefore");
		this.each(function() { node.parentNode.insertBefore(this,node); });
		return this;
	};
	
	/**
	 * Insert la collection apr�s l'élément passé en argument.
	 * @param arg argument JSYG
	 * @returns {JSYG}
	 */
	JSYG.prototype.insertAfter = function(arg) {
		
		var node = new JSYG(arg)[0];
		if (!node) throw new Error("Argument incorrect pour la méthode insertAfter");
		
		this.each(function() {
			if (node.nextSibling) node.parentNode.insertBefore(this,node.nextSibling);
			else node.parentNode.appendChild(this);
		});
		return this;
	};
	
	/**
	 * Inverse la position dans le DOM du premier élément de la collection avec l'élément passé en argument
	 * @param arg argument JSYG
	 * @returns {JSYG}
	 */
	JSYG.prototype.inverse = function(arg) {
		
		var node = new JSYG(arg)[0];
		if (!node) throw new Error("Argument incorrect pour la méthode inverse");
		
		var ref = this.next();
		
		if (ref.length > 0 && ref[0]!==node) {
			this.replace(node);
			ref[0].parentNode.insertBefore(node,ref[0]);
		} else if (ref && ref[0] === node) {
			this.replace(node);
			this.parent()[0].insertBefore(node,this[0]);
		} else {
			this.replace(node);
			this.parent().append(node);
		}
		return this;
	};
	
	/**
	 * récupère les coordonnées du centre de l'élément.
	 * @param arg optionnel, 'screen','page' ou élément référent (voir JSYG.prototype.getDim pour les détails)
	 * @returns {JSYG.Point}
	 * @see JSYG.prototype.getDim
	 */
	JSYG.prototype.getCenter = function(arg) {
		var rect = this.getDim(arg);
		return new JSYG.Point(rect.x+rect.width/2,rect.y+rect.height/2);
	};
	

	/**
	 * définit les coordonnées du centre de l'élément par rapport au parent positionn�, avant transformation.
	 * On peut aussi passer en argument un objet contenant les propriétés x et y.
	 * Il est possible de ne passer qu'une valeur sur les deux (ou null) pour centrer horizontalement ou verticalement uniquement.
	 * @param x abcisse
	 * @param y ordonnée
	 * @returns {JSYG}
	 */
	JSYG.prototype.setCenter = function(x,y) {
				
		if (x!=null && typeof x === 'object' && y == null) {
			y = x.y;
			x = x.x;
		}
		
		this.each(function() {
		
			var rect = this.getDim(),
				dim = {};
						
			if (x!=null) dim.x = x - rect.width/2;
			if (y!=null) dim.y = y - rect.height/2;
			
			this.setDim(dim);

		},true);
						
		return this;
	};
	
	/**
	 * récupère le nom de la balise en minuscule du premier élément de la collection (sinon html renvoie majuscules et svg minuscules)
	 * @returns {String}
	 */
	JSYG.prototype.getTag = function() {
		return this[0] && this[0].tagName && this[0].tagName.toLowerCase();
	};
	
	/**
	 * récupère le type d'élément, html ou svg. La diff�rence avec la propriété type est la suivante :<br/>
	 * Les balises &lt;svg&gt; sont consid�r�es comme éléments svg si elles sont imbriqu�es dans une autre balise &lt;svg&gt;,
	 * et comme un élément html si son parent direct est de type 'html' (car son comportement est alors beaucoup plus proche d'un élément html).<br/>
	 * Si la balise &lt;svg&gt; n'est pas attach�e au DOM, elle est consid�r� comme "html".
	 * @returns {String}
	 */
	JSYG.prototype.getType = function() {
		
		if (this.type == 'svg' && this.getTag() == 'svg') {
			
			var parent = this.parent();
			if (parent.length > 0 && parent.type == 'svg') return 'svg';
			else return 'html';
		}
		else return this.type;	
	};
	
	/**
	 * récupère ou définit le texte à l'int�rieur des éléments de la collection
	 * @param str si défini, définit le texte de l'élément. Attention cela écrase le html contenu dans l'élément.
	 * @link https://developer.mozilla.org/fr/DOM/element.textContent
	 * @returns contenu du texte si val est indéfini, l'objet JSYG lui-même sinon.
	 */
	JSYG.prototype.text = function(str) {
				
		if (str == null) {
			
			if (this[0].textContent!=null) return this[0].textContent;
			else if (this[0].innerText!=null) return this[0].innerText;
			return null;
			
		} else {
			
			this.each(function() {
				if (this.textContent!=null) this.textContent = str;
				else if (this.innerText!=null) this.innerText = str;
			});
			
			return this;
		}
	};
	
	/**
	 * Ajoute du texte aux éléments de la collection. Les retours chariots sont convertis en balises &lt;br/&gt;.
	 * @param str texte à ajouter. Le nombre d'arguments n'est pas limit� (un retour à la ligne est inséré entre 2 arguments).
	 * @returns {JSYG}
	 */
	JSYG.prototype.textAppend = function(str) {
				
		var i,N,j,M,tab;
		
		for (i=0,N=arguments.length;i<N;i++) {
		
			tab = arguments[i].split(/\n/);
			
			for (j=0,M=tab.length;j<M;j++) {
				
				this.each(function() {
					this.appendChild( document.createTextNode(tab[j]) );
					if (j<M-1) this.appendChild(document.createElement('br'));
				});
			}
		}
		
		return this;
	};
	
	/**
	* Supprime les noeuds texte des éléments de la collection.
	* @returns {JSYG}
	*/
	JSYG.prototype.textRemove = function() {
				
		this.each(function() {
			
			var tabSuppr = [],
				child,i,N;
		
			for (i=0,N=this.childNodes.length;i<N;i++) {
				child = this.childNodes.item(i);
				if (child.nodeType == 3) tabSuppr.push(child);
			}
			
			for (i=0,N=tabSuppr.length;i<N;i++) this.removeChild(tabSuppr[i]);
		});
		
		return this;
	};
			
	/**
	 * Ajoute un retour chariot (balise &lt;br/&gt;) aux éléments de la collection
	 * @returns {JSYG}
	 */
	JSYG.prototype.br = function() {
		
		this.each(function() {
			this.appendChild(document.createElement('br'));
		});
		return this;
	};
	
	/**
	 * Fixe ou récupère l'id du 1er élément de la collection
	 * @param val
	 * @returns {String,JSYG} la valeur de l'id si val est null, l'objet JSYG sinon
	 */
	JSYG.prototype.id = function(val) {
		
		if (val!=null) {
			this[0].id = val;
			return this;
		}
		else return this[0].id;
	};
	
	/**
	 * récupère ou définit la valeur (attribut value) du(des) champ(s) de formulaire de la collection
	 * @param value si défini, fixe la valeur de l'attribut "value"
	 * @param preventEvt si value est définie et preventEvt est true, ne déclenche pas l'évènement "change" sur l'élément. false par défaut.
	 * @returns la valeur si val est indéfini, l'objet JSYG lui-même sinon.
	 */
	JSYG.prototype.val = function(value,preventEvt) {
		
		var val;
				
		this.each(function() {
		
			var node = this[0],
				tag = this.getTag(),
				type = null,
				oldval,
				options,i,N,ind;
			
			if (['textarea','select'].indexOf(tag) !== -1) type = tag;
			else if (tag == 'input') type = this.attr("type");
			
			if (type == null) throw new Error("La méthode val n'est pas valable pour les éléments "+tag);
			
			type = type.toLowerCase();
						
			if (value === undefined) {
				
				switch (type) {
					
					case 'checkbox' :
						
						val = node.checked ? 'on' : null;
						break;
						
					case 'select' :
						
						if (node.selectedIndex == -1) val = null;
						else if (node.options[node.selectedIndex].value) val = node.options[node.selectedIndex].value;
						else val = node.options[node.selectedIndex].text;
						break;
						
					case 'option' :
						
						val = node.value === '' ? node.text : node.value;
						break;
						
					default :
						
						val = node.value;
						break;
				}
				
				return false;
			}
			else {
			
				oldval = this.val();
											
				switch (type) {
					
					case 'radio' : case 'checkbox' :
						
						node.checked = !!value;
						break;
						
					case 'select' :
						
						options = node.options;
												
						if (typeof value !== 'number') {
							
							ind = -1;
							
							for (i=0,N=options.length;i<N;i++) {
								
								if (options[i].value == value || options[i].text == value) {
									ind = i;
									break;
								}
							}
						}
						else ind = value;
						
						node.selectedIndex = ind;
						
						break;
						
					default :
						
						node.value = value;
						break;
				}
								
				if (this.val() != oldval && !preventEvt) {
					
					if (!JSYG.support.inputAutoFireEvent) this.trigger('input');
					
					this.trigger('change');
				}
			}
			
		},true);
		
		return value === undefined ? val : this;
	};
	
	/**
	 * récupère ou définit le contenu html de la collection.
	 * Le css contenu dans les balises &lt;style&gt; et le javascript dans les balises &lt;script&gt; sont interprétés.
	 * @param html si défini, fixe le contenu html
	 * @returns contenu html si html est indéfini, l'objet JSYG lui-même sinon.
	 */
	JSYG.prototype.html = function(html) {
		
		var jsContent = [],
			cssContent = [];
		
		if (html == null) return this[0] && this[0].innerHTML;
			
		html = JSYG.stripTagAndContent(html,'script',jsContent);
		html = JSYG.stripTagAndContent(html,'style',cssContent);
		
		cssContent.forEach(function(style) { JSYG.addStyle(style); });
		
		this.each(function() {
			this.innerHTML = html;
			jsContent.forEach(function(script) { JSYG.globalEval(script); });
		});
		
		return this;
	};
	
	function searchNodes(jObj,search) {
		
		var tab = [];
		
		jObj.each(function() {
			var elmt = this[search];
			while (elmt && elmt.nodeType !== 1) elmt = elmt[search];
			elmt && tab.push(elmt);
		});
		
		return new JSYG(tab);
	}
	
	/**
	 * Renvoie l'objet JSYG des parents des éléments de la collection
	 * @returns {JSYG}
	 */
	JSYG.prototype.parent = function() {
		return searchNodes(this,'parentNode');
	};
	
	var rroot = /^(?:body|html)$/i;
	
	/**
	 * Renvoie l'objet JSYG des parents positionn�s ('relative','absolute','fixed' ou viewport pour les éléments svg) de la collection.<br/><br/>
	 * @param arg optionnel, si on passe "farthest" renvoie le viewport (balise &lt;svg&gt;) le plus �loign� pour les éléments svg, et document.body par souci de compatibilité pour les éléments html.
	 * @returns {JSYG}
	 */
	JSYG.prototype.offsetParent = function(arg) {
		
		var tab = [];
		
		this.each(function() {
			
			var elmt,farthest=null;
			
			if (this.getType() == 'svg') {
				
				if (arg === 'farthest') elmt = this[0].farthestViewportElement;
				else elmt = this[0].nearestViewportElement;
				
				if (!elmt) { //les éléments non tracés (dans une balise defs) ne renvoient rien, par simplicit� on renvoit la balise svg parente
					
					elmt = this[0].parentNode;
					
					while (elmt && (arg == "farthest" || JSYG.svgViewBoxTags.indexOf(elmt.tagName) == -1)) {
						elmt = elmt.parentNode;
						if (elmt.tagName == "svg") farthest = elmt;
					}
					
					if (farthest) elmt = farthest;
				}
			}
			else {
			
				if (arg === 'farthest') elmt = document.body;
				else {
					elmt = this[0].offsetParent;
					if (!elmt || elmt.nodeName == 'HTML' && this[0].nodeName != 'BODY') { elmt = document.body; }
					while (elmt && !rroot.test(elmt.nodeName) && new JSYG(elmt).css("position") === "static") { elmt = elmt.offsetParent; }
				}
			}
			
			elmt && tab.push(elmt);
			
		},true);
		
		return new JSYG(tab);
	};
	
	/*
	JSYG.prototype.parentsUntil = function(selector) {
		
		var tab = [];
		
		this.each(function() {
			
			var parent = new JSYG(this).parent();
			
			while (parent.length && !parent.is(selector)) {
				tab.push(parent[0]);
				parent = parent.parent();
			}
		});
		
		return new JSYG(tab);
		
	};
	*/
	
	/**
	 * Renvoie l'objet JSYG des éléments DOM (textNodes exclus) pr�c�dant imm�diatement les éléments de la collection 
	 * @returns {JSYG}
	 */
	JSYG.prototype.prev = function() {
		return searchNodes(this,'previousSibling');
	};
	
	/**
	 * Renvoie l'objet JSYG des éléments DOM (textNodes exclus) suivant imm�diatement les éléments de la collection 
	 * @returns {JSYG}
	 */
	JSYG.prototype.next = function(i) {
		return searchNodes(this,'nextSibling');
	};

	/**
	 * Renvoie les enfants directs de la collection (textNodes exclus) 
	 * @param ind optionnel, indice de l'enfant dans la liste des enfants directs.<br/>
	 * Si négatif, part de la fin de la collection.<br/>
	 * Si non renseigné, renvoie tous les enfants directs.
	 * @returns {JSYG}
	 */
	JSYG.prototype.children = function(ind) {
		
		var tab = [],
			reverse = (ind < 0), 
			ref = reverse ? -ind-1 : ind;
		
		function push(node) { if (node.nodeType == 1) tab.push(node); }
		
		this.each(function() {
			
			var elmt, i;
			
			if (ind == null) JSYG.makeArray(this.childNodes).forEach(push);
			else {
				
				i = -1;
				
				elmt = this[ (reverse ? 'last':'first') + 'Child' ];
				
				if (elmt && elmt.nodeType == 1) i++;
				
				while (elmt && i < ref) {
					elmt = elmt[ (reverse ? 'previous':'next') + 'Sibling' ];
					if (elmt && elmt.nodeType == 1) i++;
				}
				
				elmt && tab.push(elmt);
			}
		});
		
		return new JSYG(tab);
	};
	
	/**
	 * réduit la collection à l'élément à l'index spécifié.
	 * @param i indice de l'élément. Si négatif, part de la fin de la collection.
	 * @returns {JSYG} ou null si pas d'élément DOM correspondant
	 */
	JSYG.prototype.eq = function(i) {
		if (i < 0) i = this.length + i;
		return this[i] ? new JSYG(this[i]) : null;
	};
	
	/**
	 * Filtre les éléments de la collection qui correspondent au sélecteur
	 * @param selector sélecteur css
	 * @returns {JSYG} nouvelle colleciton
	 */
	JSYG.prototype.filter = function(selector) {
		
		var elmts = [];
		
		this.each(function() {
			if (new JSYG(this).is(selector)) elmts.push(this);
		});
		
		return new JSYG(elmts);
	};
	
	/**
	 * Ajoute les éléments de l'arguments à la collection
	 * @param arg argument JSYG
	 * @returns {JSYG} nouvelle instance JSYG
	 */
	JSYG.prototype.add = function(arg) {
		
		var tab1 = JSYG.makeArray( this ),
			tab2 = JSYG.makeArray( new JSYG(arg) );
		
		return new JSYG( tab1.concat(tab2) );
	};
	
	/**
	 * réduit la collection aux indices spécifiés
	 * @param start indice de l'élément de départ. Si négatif, part de la fin de la collection.
	 * @param end indice de l'élément de fin. Si négatif, part de la fin de la collection.
	 * @returns {JSYG}
	 */
	JSYG.prototype.slice = function(start,end) {
		
		if (start < 0) start = this.length + start;
		
		if (end == null) end = this.length;
		else if (end < 0) end = this.length + end;
		
		return new JSYG( slice.call(this,start,end) );
	};
	
	
	var matchesSelector = (function() {
		
		var div = document.createElement('div'),
			method = null;
		
		if (typeof div.matches == "function") return "matches";
		
		JSYG.vendorPrefixes.forEach(function(pre) {
			var testmethod = pre.toLowerCase()+'MatchesSelector'; 
			if (div[testmethod]) method = testmethod;
		});
		
		return method;
		
	}());

	function matches(element, selector) {
		
		if (!element || element.nodeType !== 1) return false;
		
		if (matchesSelector) return element[matchesSelector](selector);
		else if (window.Sizzle) return Sizzle.matchesSelector(element,selector);
		else return querySelectorAll(selector,element.parentNode).indexOf(element) !== -1;
	}
	
	/**
	 * Teste si au moins un élément de la collection serait sélectionné par le sélecteur (ou la collection) passé en argument. 
	 * @param selector argument JSYG
	 * @returns {Boolean}
	 */
	JSYG.prototype.is = function(selector) {
		
		var test = false;
		
		var type = 'str';
		if (typeof selector != 'string') { type = 'jsyg'; selector = new JSYG(selector); }
		
		this.each(function() {
			if (type == 'str' && matches(this,selector) || selector.indexOf(this) !== -1) { test = true; return false; }
		});
		
		return test;
	};
	
	JSYG.prototype.closest = function(selector) {
		
		var tab = [];
		
		this.each(function() {
			
			var elmt = new JSYG(this);
			
			while (elmt.length && !elmt.is(selector)) elmt = elmt.parent();
			
			if (elmt[0] && tab.indexOf(elmt[0]) == -1) tab.push(elmt[0]);
		});
		
		return new JSYG(tab);
	};
	
	/**
	 * Exclut les éléments passés en arguments.
	 * @param selector argument JSYG. On peut également passer une fonction, auquel cas
	 * tous les éléments pour lesquels la fonction renvoie false sont conservés
	 * (this fait référence à chaque élément DOM).
	 * @example <pre>//renvoie tous les enfants sauf les balises images
	 * var list = new JSYG("#maDiv *").not('img');
	 * 
	 * var list = new JSYG("#maDiv *");
	 * list = list.not(function() {
	 *	//conserve uniquement les éléments contenant une donnée toto
	 *	if (new JSYG(this).data("toto")) return false;
	 * });
	 * </pre>
	 * @returns {JSYG}
	 **/
	JSYG.prototype.not = function(selector) {
	    
	    var nodes=[];
	    
	    if (typeof selector == "function") {
		
	      this.each(function(i){
	    	  if (!selector.call(this,i)) { nodes.push(this); }
	      });
	      
	    }
	    else {
		
			var excludes = new JSYG(selector);
			
			this.each(function() {
			   if (excludes.indexOf(this) == -1) nodes.push(this);		   
			});
	    }
	    
	    return new JSYG(nodes);
	};
		
	/**
	 * Renvoie le nombre de classes affectées à l'élément
	 * @returns {Number}
	 */
	JSYG.prototype.classLength = function() {
		
		var type = this.getType(),
			classe;
		
		if (this[0].classList && type == 'html') return this[0].classList.length;
		
		classe = (type == 'svg') ? this[0].getAttribute('class') : this[0].className;
		
		return classe && classe.split(/\s+/).length || 0;
	};
	
	/**
	 * Ajoute une ou plusieurs classes à la collection. On peut passer autant d'arguments que de classes nécessaires, ou un seul argument
	 * avec les classes séparées par des espaces.
	 * @param name nom de la classe
	 * @returns {JSYG}
	 */
	JSYG.prototype.classAdd = function(name) {
		
		var className,
			a = arguments,
			i,N=a.length,
			classe;
		
		this.each(function() {
			
			var natif = JSYG.support.classList && JSYG.support.classList[this.type];
		
			if (!natif) {
				classe = (this.type === 'svg') ? this[0].getAttribute('class') : this[0].className;
			}
			
			for (i=0;i<N;i++) {
				
				className = a[i];
				
				if (typeof className !== 'string') continue;
								
				className = className.trim();
			
				if (className.indexOf(' ')===-1) {
					
					if (natif) this[0].classList.add(className);
					else if (!this.classContains(className)) classe = (classe ? classe+' ' : '') + className;
				}
				else this.classAdd.apply(this,className.split(/\s+/));
			}
					
			if (!natif) {
				
				if (this.type === 'svg') this[0].setAttribute('class',classe);
				else this[0].className = classe;
			}
			
			return null;
			
		},true);
		
		return this;
	};
	
	/**
	 * Supprime une ou plusieurs classes à la collection. On peut passer autant d'arguments que de classes nécessaires, ou un seul argument
	 * avec les classes séparées par des espaces.
	 * @param name nom de la classe
	 * @returns {JSYG}
	 */
	JSYG.prototype.classRemove = function(name) {
		
		var className, reg,
			a = arguments,
			i,N=a.length,
			classe;
		
		this.each(function() {
		
			var natif = JSYG.support.classList && JSYG.support.classList[this.type];
		
			if (!natif) {
				classe = (this.type === 'svg' ? this[0].getAttribute('class') : this[0].className) || '';
			}
					
			for (i=0;i<N;i++) {
				
				className = a[i];
				if (typeof className !== 'string') continue;
				className = className.trim();
							
				if (!className.match(/\s/)) {
					
					if (natif) this[0].classList.remove(className);
					else {
						reg = new RegExp('(^|\\s+)'+className);
						classe = classe.replace(reg,'');
					}
				}
				else this.classRemove.apply(this,className.split(/\s+/));
			}
			
			if (!natif) {
				if (this.type === 'svg') this[0].setAttribute('class',classe);
				else this[0].className = classe;
			}
			
			return null;
			
		},true);
		
		return this;
	};

	
	/**
	 * vérifie si les éléments de la collection contiennent la ou les classes. On peut passer autant d'arguments que de classes nécessaires, ou un seul argument
	 * avec les classes séparées par des espaces.
	 * @param name nom de la classe
	 * @returns {Boolean}
	 */
	JSYG.prototype.classContains = function(name) {
		
		var className,reg,
			a=arguments,
			i,N=a.length,
			classe,
			test=true;
		
		this.each(function() {
			
			var natif = JSYG.support.classList && JSYG.support.classList[this.type];
			
			if (!natif) {
				classe = (this.type === 'svg' ? this[0].getAttribute('class') : this[0].className) || '';
			}
			
			for (i=0;i<N;i++) {
				
				className = a[i];
				if (typeof className !== 'string') continue;
				className = className.trim();
							
				if (className.indexOf(' ')===-1) {
				
					if (natif) {
						if (!this[0].classList.contains(className)) { test = false; return false;}
					}
					else {
						reg = new RegExp('(^|\\s+)'+className);
						if (!classe.match(reg)) { test = false; return false;}
					}
				}
				else {
					
					if (!this.classContains.apply(this,className.split(/ +/))) { test = false; return false;}
				}
			}
			
			return null;
			
		},true);
		
		return test;		
	};
	
	/**
	 * Ajoute la ou les classes que les éléments de la collection ne contiennent pas, retire les autres. On peut passer autant d'arguments que de classes nécessaires, ou un seul argument
	 * avec les classes séparées par des espaces.
	 * @param name nom de la classe
	 * @returns {JSYG}
	 */
	JSYG.prototype.classToggle = function(name) {
	
		var className,
			a = arguments,
			i,N=a.length;
					
		this.each(function() {
		
			var natif = JSYG.support.classList && JSYG.support.classList[this.type];
	
			for (i=0;i<N;i++) {
				
				className = a[i];
				if (typeof className !== 'string') continue;
				className = className.trim();
							
				if (className.indexOf(' ')===-1) {
					
					if (natif) this[0].classList.toggle(className);
					else {
						if (this.classContains(className)) this.classRemove(className);
						else this.classAdd(className);
					}
				}
				else this.classToggle.apply(this,className.split(/\s+/));
			}
			
			return null;
			
		},true);
		
		return this;
	};
	

	/**
	 * Récupère ou définit le scroll horizontal. Fonctionne avec window, document (équivalent à window) ou des éléments du DOM.
	 * @param val valeur du scroll
	 * @returns scroll si val est indéfini, l'objet JSYG lui-même sinon.
	 */
	JSYG.prototype.scrollLeft = function(val) {
		
		if (val == null) {
			
			var elem = this[0];
			
			if (JSYG.isWindow(elem)) {
				return elem.pageXOffset || elem.document.documentElement.scrollLeft;
			} else if (elem.nodeType === 9) {
				return JSYG.getWindow(elem).pageXOffset || elem.documentElement.scrollLeft;
			}
			
			return elem.scrollLeft || 0;
		}
		
		this.each(function() {
			if (JSYG.isWindow(this) || this.nodeType === 9) JSYG.getWindow(this).scrollTo(val,0); 
			else this.scrollLeft = val;
		});
		
		return this;
	};
	
	/**
	 * Récupère ou définit le scroll vertical. Fonctionne avec window, document (équivalent à window) ou des éléments du DOM.
	 * @param val valeur du scroll
	 * @returns scroll si val est indéfini, l'objet JSYG lui-même sinon.
	 */
	JSYG.prototype.scrollTop = function(val) {
		
		if (val == null) {
			
			var elem = this[0];
			
			if (JSYG.isWindow(elem)) {
				return elem.pageYOffset || elem.document.documentElement.scrollTop;
			} else if (elem.nodeType === 9) {
				return JSYG.getWindow(elem).pageYOffset || elem.documentElement.scrollTop;
			}
			return elem.scrollTop || 0;
		}
		
		this.each(function() {
			if (JSYG.isWindow(this) || this.nodeType === 9) JSYG.getWindow(this).scrollTo(0,val);
			else this.scrollTop = val;
		});
		
		return this;
	};
	
		
	var slideProperties = {
			height : ['paddingTop','paddingBottom','marginTop','marginBottom'],
			width : ['paddingLeft','paddingRight','marginLeft','marginRight']
	};
	
	function noEffect(effect) { return !JSYG.Animation || !effect || effect.indexOf("slide") != 0 && effect != "fade"; }
	
	/**
	 * Masque la collection.
	 * @param effect 'fade','slide' (ou 'slideY'),'slideX','none' ('none' par défaut)
	 * @param callback fonction de rappel à exécuter une fois l'effet terminé
	 * @param options optionnel, objet décrivant les options de l'animation
	 * @returns {JSYG}
	 */
	JSYG.prototype.hide = function(effect,callback,options) {
		
		if (noEffect(effect)) {
			
			this.each(function() {
				
				var display = this.css("display");
				
				if (!display || display!="none") {
					this.css("display","none");
					display && this.originalDisplay(display);
				}
				
				callback && callback.call(this);
				
			},true);
			
			return this;
		}
		
		var isSlide = effect.indexOf("slide") == 0,
			slideProp = null;
		
		if (isSlide) slideProp = (effect == "slideX") ? "width" : "height";
				
		options = Object.create(options || null);
		options.to = {};
		
		options.onstart = function() {
			
			var jNode = new JSYG(this),
				display = jNode.css("display"),
				queue = (display == 'none') && jNode.data("AnimationQueue"),
				anim = queue && queue.current(),
				prop = slideProp && jNode.innerDim()[slideProp];
			
			if (effect == "fade") jNode.data('backupHide',{opacity:jNode.css('opacity')});
			else jNode.styleSave("hide");
			
			if (display == 'none') {
				anim.currentTime(anim.duration);
				return;
			}
			
			jNode.originalDisplay(display);
									
			if (isSlide && jNode.getType() == 'html') {
				
				jNode.css("overflow","hidden").css(slideProp,prop);
			}
		};
		
		options.onend = function() {
			
			var jNode = new JSYG(this),
				backup = jNode.data('backupHide');
							
			if (backup) jNode.css(backup);
			
			jNode.styleRestore("hide");
						
			jNode.css('display','none');
			
			callback && callback.call(this);
		};
		
		if (isSlide) {
		
			if (!options.easing) options.easing = "swing";
			slideProperties[slideProp].forEach(function(prop) { options.to[prop] = 0; });
			options.to[slideProp] = 0;
		}
		else options.to.opacity = 0;
			
		this.animate(options);
		
		return this;
		
	};
	
	
	JSYG.prototype.originalDisplay = function(_value) {
		
		var prop = "originalDisplay";
		
		if (_value == null) return this.data(prop) || defaultDisplay(this);
		else { this.data(prop,_value); return this; }
	};
	
	/**
	 * Affiche la collection.
	 * @param effect 'fade','slide' (ou 'slideY'),'slideX','none' ('none' par défaut)
	 * @param callback fonction de rappel a exécuter une fois l'effet terminé
	 * @param options optionnel, objet décrivant les options de l'animation
	 * @returns {JSYG}
	 */
	JSYG.prototype.show = function(effect,callback,options) {	
		
		if (noEffect(effect)) {
			
			this.each(function() {
				
				var jThis = new JSYG(this),
					display = jThis.css("display");
				
				if (!display || display == "none") jThis.css('display', jThis.originalDisplay() );
				
				callback && callback.call(this);
			});
			
			return this;
		}
								
		this.each(function() {
			
			var jNode = new JSYG(this),
				opt = Object.create(options || null),
				slideProp;
			
			opt.to = {};
			
			opt.onend = function() {
				
				jNode.styleRestore("show");
				jNode.css('display',jNode.originalDisplay());
				
				callback && callback.call(this);
			};
					
			switch (effect) {
				
				case "slide" : case "slideY" : case "slideX" :
					
					slideProp = (effect == "slideX") ? "width" : "height";
					
					if (!opt.easing) opt.easing = "swing";
					
					opt.onstart = function() {
						
						var queue = jNode.data("AnimationQueue"),
							anim = queue.current();
						
						jNode.styleSave("show");
												
						//si déjà affiché pas d'action
						if (jNode.css('display') != 'none') {
							anim.currentTime(anim.duration);
							return;
						}
												
						var to = {};
						
						to[slideProp] = jNode.innerDim()[slideProp];
																
						slideProperties[slideProp].forEach(function(prop) { to[prop] = jNode.cssNum(prop) || 0; });
						
						jNode.css({
							"overflow":"hidden",
							"display":jNode.originalDisplay()
						});
						
						jNode.css(slideProp,0);
						
						slideProperties[slideProp].forEach(function(prop) { jNode.css(prop,0); });
												
						anim.to = to;
					};
										
					break;
					
				case "fade" :
																				
					opt.onstart =  function() {
						
						var queue = jNode.data("AnimationQueue"),
							anim = queue.current();
						
						opt.to.opacity = jNode.css('opacity');
						
						//si déjà affiché pas d'action
						if (jNode.css('display') != 'none') {
							anim.currentTime(anim.duration);
							return;
						}
																		
						jNode.css({"display":jNode.originalDisplay(),opacity:0});
					};
										
					break;
			}
						
			jNode.animate(opt);
			
		});
		
		return this;
		
	};
	
	/**
	 * Affiche ou masque la collection.
	 * @param effect 'fade','slide' (ou 'slideY'),'slideX','none' ('none' par défaut)
	 * @param callback fonction de rappel a exécuter une fois l'effet terminé
	 * @param options optionnel, objet décrivant les options de l'animation
	 * @returns {JSYG}
	 */
	JSYG.prototype.toggle = function(effect,callback,options) {
		
		this.each(function() {
			var jThis = new JSYG(this),
				method = (jThis.css('display') == 'none') ? "show" : "hide"; 
			jThis[method](effect,callback,options);
		});
		
		return this;
	};
	
	/**
	 * récupère ou définit l'origine pour les transformations 2D (html et svg). On peut passer un seul argument avec l'origine en x et en y séparées
	 * par des espaces ou deux arguments séparés. Pour les valeurs possibles, voir le lien ci-dessous.
	 * @param x chaîne, origine horizontale
	 * @param y chaîne, origine verticale
	 * @link https://developer.mozilla.org/en/CSS/transform-origin
	 * @returns {JSYG} si passé avec un ou des arguments, sinon renvoie une chaîne repr�sentant l'origine en x et y.
	 */
	JSYG.prototype.transfOrigin = function(x,y) {
		
		var value,
			a = arguments;
		
		this.each(function() {
			
			var val,
				originX="50%",
				originY="50%";
			
			if (a[0] == null) {
				value = this.data('transfOrigin') || originX+' '+originY;
				return false;
			}
			
			if (a.length === 1) { val = a[0].split(/ +/); }
			else if (a.length === 2) { val = [ a[0] , a[1] ];}
			
			if (['top','bottom'].indexOf(val[0])!==-1 || val[1]!=null && ['left','right'].indexOf(val[1])!==-1) {
				if (val[1]!=null) { originX = val[1]; }
				if (val[0]!=null) { originY = val[0]; }
			}
			else {
				if (val[1]!=null) { originY = val[1]; }
				if (val[0]!=null) { originX = val[0]; }
			}

			this.data('transfOrigin',originX+' '+originY);
			
			return null;
			
		},true);
				
		return a[0] == null ? value : this;
	};
	
	/**
	 * Annule toutes les transformations 2D de la collection.
	 * @returns {JSYG}
	 */
	JSYG.prototype.resetTransf = function() {
		
		if (!svg) { return this; }
		
		this.each(function() {
		
			if (this.type === 'svg') {
				this[0].transform.baseVal.clear();
			} else if (this.type === 'html' && JSYG.support.twoDimTransf) {
				this[0].style[JSYG.support.twoDimTransf] = '';
			}
			
		},true);
		
		return this;
	};
	
	/**
	 * Ajoute une transformation à la collection selon l'échelle spécifiée, ou récupère l'échelle en x du premier élément de la collection
	 * @param scale si définie, transforme la collection
	 * @returns {JSYG} si scale est définie, la valeur de l'échelle sinon
	 */
	JSYG.prototype.scale = function(scale) {
		
		if (!svg) return scale == null ? null : this;
		
		if (scale == null) return this[0] && this.getMtx().scaleX();
		
		this.each(function() {
			var dec = this.getShift();
			this.addMtx( new JSYG.Matrix().scale(scale,dec.x,dec.y) );
		},true);
		
		return this;
	};
	
	/**
	 * Ajoute une transformation à la collection selon l'échelle en x spécifiée, ou récupère l'échelle en x du premier élément de la collection.
	 * @param scale si définie, transforme la collection
	 * @returns {JSYG} si scale est définie, la valeur de l'échelle en x sinon
	 */
	JSYG.prototype.scaleX = function(scale) {
		
		if (!svg) return scale == null ? null : this;
		if (scale == null) return this[0] && this.getMtx().scaleX();
		this.scaleNonUniform(scale,1);
		return this;
	};
	
	/**
	 * Ajoute une transformation à la collection selon l'échelle en y spécifiée, ou récupère l'échelle en y du premier élément de la collection.
	 * @param scale si définie, transforme la collection
	 * @returns {JSYG} si scale est définie, la valeur de l'échelle en y sinon
	 */
	JSYG.prototype.scaleY = function(scale) {
		
		if (!svg) return scale == null ? null : this;
		if (scale == null) return this[0] && this.getMtx().scaleY();
		this.scaleNonUniform(1,scale);
		return this;
	};
	
	/**
	 * Ajoute une transformation à la collection selon l'échelle non uniforme spécifiée, ou récupère l'échelle du premier élément de la collection.
	 * @param scaleX
	 * @param scaleY
	 * @returns {JSYG} si scaleX et scaleY sont définis, sinon objet avec les propriétés scaleX et scaleY
	 */
	JSYG.prototype.scaleNonUniform = function(scaleX,scaleY) {
		
		if (!svg) return (scaleX == null && scaleY == null) ? null : this;
		
		var mtx;
		
		if (scaleX == null && scaleY == null) {
			mtx = this.getMtx();
			return { scaleX : mtx.scaleX() , scaleY : mtx.scaleY() };
		}
		
		this.each(function() {
			var dec = this.getShift();
			this.addMtx( new JSYG.Matrix().scaleNonUniform(scaleX,scaleY,dec.x,dec.y) );
		},true);
		
		return this;
	};
	
	/**
	 * Ajoute une transformation à la collection selon la translation spécifiée, ou récupère la translation du premier élément de la collection.
	 * @param x
	 * @param y
	 * @returns {JSYG} si x et y sont définis, sinon objet JSYG.Vect
	 */
	JSYG.prototype.translate = function(x,y) {
		
		if (!svg) return (x == null && y == null) ? null : this;
		
		var mtx;
		
		if (x == null && y == null) {
			mtx = this.getMtx();
			return new JSYG.Vect(mtx.translateX(),mtx.translateY());
		}
		
		this.addMtx( new JSYG.Matrix().translate(x,y) );
		
		return this;
	};
	
	/**
	 * Ajoute une transformation à la collection selon la translation horizontale spécifiée, ou récupère la translation horizontale du premier élément de la collection.
	 * @param x
	 * @returns {JSYG} si x est défini, valeur de la translation horizontale sinon
	 */
	JSYG.prototype.translateX = function(x) {
		
		if (!svg) return x == null ? null : this;

		if (x == null) return this.getMtx().translateX();
		
		this.translate(x,0);
			
		return this;
	};
	
	/**
	 * Ajoute une transformation à la collection selon la translation verticale spécifiée, ou récupère la translation verticale du premier élément de la collection.
	 * @param y
	 * @returns {JSYG} si y est défini, valeur de la translation verticale sinon
	 */
	JSYG.prototype.translateY = function(y) {
		
		if (!svg) return y == null ? null : this;
		
		if (y == null) return this.getMtx().translateY();
		
		this.translate(0,y);
		
		return this;
	};
	
	/**
	 * Ajoute une transformation à la collection selon la rotation spécifiée, ou récupère la rotation du premier élément de la collection.
	 * @param angle (degr�s)
	 * @returns {JSYG} si angle est défini, valeur de la rotation sinon
	 */
	JSYG.prototype.rotate = function(angle) {
	
		if (!svg) return angle == null ? null : this;
		
		if (angle == null) return this.getMtx().rotate();
		
		this.each(function() {
			
			var dec = this.getShift();
			
			this.addMtx( new JSYG.Matrix().rotate(angle,dec.x,dec.y) );
			
		},true);
		
		return this;
	};
	
	/**
	 * Ajoute une transformation à la collection selon le "skew" spécifié, ou récupère le "skew" du premier élément de la collection.
	 * @param angle (degrés)
	 * @returns {JSYG} si angle est défini, valeur du "skew" sinon
	 */
	JSYG.prototype.skewX = function(angle) {
	
		if (!svg) return angle == null ? null : this;
		
		if (angle == null) return this.getMtx().skewX();
		
		this.each(function() {
			
			var dec = this.getShift();
			
			this.addMtx( new JSYG.Matrix().skewX(angle,dec.x,dec.y) );
			
		},true);
		
		return this;
	};
	
	/**
	 * Ajoute une transformation à la collection selon le "skew" spécifié, ou récupère le "skew" du premier élément de la collection.
	 * @param angle (degrés)
	 * @returns {JSYG} si angle est défini, valeur du "skew" sinon
	 */
	JSYG.prototype.skewY = function(angle) {
	
		if (!svg) return angle == null ? null : this;
		
		if (angle == null) return this.getMtx().skewY();
		
		this.each(function() {
			
			var dec = this.getShift();
			
			this.addMtx( new JSYG.Matrix().skewY(angle,dec.x,dec.y) );
			
		},true);
		
		return this;
	};

	
	/**
	 * Récupération de l'objet matrice du 1er élément de la collection, instance de JSYG.Matrix.
	 * Pour les éléments HTML, seule la transformation de l'élément lui-même est support�
	 * @param arg (éléments svg seulement)
	 * <ul>
	 * 		<li>null : transformation de l'élément lui-même</li>
	 * 		<li>'ctm' : transformation de l'élément par rapport à son viewport (balise &lt;svg&gt;)</li>
	 * 		<li>'screen' : transformation de l'élément par rapport à l'�cran</li>
	 * 		<li>'page' : transformation de l'élément par rapport à la page (screen + scroll)</li>
	 * 		<li>objet DOM SVG : transformation de l'élément par rapport à cet objet</li>
	 * </ul>
	 * @returns {JSYG.Matrix}
	 * @see JSYG.Matrix
	 */
	JSYG.prototype.getMtx = function(arg) {

		var mtx = null,
			transf,regexp,coefs,
			type = this.getType();
		
		if (!this[0]) return null;
		
		if (JSYG.isWindow(this[0]) || this[0].nodeType === 9) return new JSYG.Matrix();
				
		if (type === 'svg') {
					
			if (arg == null) {
				transf = this[0].transform && this[0].transform.baseVal.consolidate();
				mtx = transf && transf.matrix || svg.createSVGMatrix();
			}
			else if (JSYG.support.svgUseTransform && this.getTag() == "use") {
				
				//les matrices de transformation tiennent compte des attributs x et y 
				//getCTM, getScreenCTM, getTransformToElement, mais ne modifie pas l'attribut transform de l'élément 
				//(bug de firefox avant la version 12 ou 13)
				//donc on prend la matrice de l'élément parent et on multiplie par la matrice de l'attribut transform
				return this.parent().getMtx(arg).multiply(this.getMtx()); 
			}
			else if (typeof arg === 'string') {
				
				arg = arg.toLowerCase();
				
				if (arg === 'ctm') mtx = this[0].getCTM();
				else if (arg === 'screen') mtx = this[0].getScreenCTM();
				else if (arg === 'page') {
					mtx = this[0].getScreenCTM();
					mtx = svg.createSVGMatrix().translate(window.pageXOffset,window.pageYOffset).multiply(mtx);
				}
			}
			else if (arg.nodeType != null || arg instanceof JSYG) {
				
				if (arg instanceof JSYG) arg = arg[0];
				
				//mtx = this[0].getTransformToElement(arg[0] || arg); //bug avec chrome
				
				mtx = arg.getScreenCTM() || svg.createSVGMatrix();			
				mtx = mtx.inverse().multiply( this[0].getScreenCTM() );
				
				if (this.getTag() == 'svg') mtx = mtx.translate(-this.attr('x') || 0,-this.attr('y') || 0) ; //la matrice tient compte des attributs x et y dans ce cas...
			}
						
		} else if (type === 'html') {
			
			if (JSYG.support.twoDimTransf) {
				
				transf = this[0].style[JSYG.support.twoDimTransf];
				regexp = /matrix\((-?\d*\.?\d+) *, *(-?\d*\.?\d+) *, *(-?\d*\.?\d+) *, *(-?\d*\.?\d+) *, *(-?\d*\.?\d+) *, *(-?\d*\.?\d+) *\)/;
				coefs = regexp.exec(transf);
				mtx = svg.createSVGMatrix();
				
				if (coefs) {
					mtx.a = coefs[1];
					mtx.b = coefs[2];
					mtx.c = coefs[3];
					mtx.d = coefs[4];
					mtx.e = coefs[5];
					mtx.f = coefs[6];
				}
				
				/*
				if (arg !=null && this[0].offsetParent) {
					if (arg == 'ctm') { arg = 'screen'; }
					var dim = this.offsetParent().getDim(arg);
					mtx = svg.createSVGMatrix().translate(dim.x,dim.y).multiply(mtx);
				}*/
			}
		}
		
		return new JSYG.Matrix(mtx);
	};

	/**
	 * définit la matrice de transformation de l'élément
	 * @param mtx instance de JSYG.Matrix (ou SVGMatrix natif)
	 * @returns {JSYG}
	 */
	JSYG.prototype.setMtx = function(mtx) {
	
		var attr = JSYG.support.twoDimTransf;
		
		if (mtx instanceof JSYG.Matrix) mtx = mtx.mtx;
				
		this.each(function() {
		
			var type = this.getType(),
				list;
		
			if (type === 'svg') {
					
				list = this[0].transform.baseVal;
				list.initialize(list.createSVGTransformFromMatrix(mtx));
			}
			else if (type === 'html' && attr) {
							
				this[0].style[attr+'Origin'] = '0 0';
				this[0].style[attr] = new JSYG.Matrix(mtx).toString();
			}
			
		},true);
		
		return this;
	};
		
	/**
	 * Ajoute une transformation sous forme d'objet matrice (multiplication de la matrice avec la matrice courante)
	 * @param mtx instance de JSYG.Matrix (ou SVGMatrix natif)
	 * @returns {JSYG}
	 */
	JSYG.prototype.addMtx = function(mtx) {
		
		if (mtx instanceof JSYG.Matrix) mtx = mtx.mtx;
		
		var attr = JSYG.support.twoDimTransf;
		
		this.each(function() {
		
			var type = this.getType(),
				list;
						
			if (type === 'svg') {
				
				list = this[0].transform.baseVal;
				list.appendItem(list.createSVGTransformFromMatrix(mtx));
				list.consolidate();	
			}
			else if (type === 'html' && attr) {
				
				mtx = this.getMtx().multiply(mtx);
				this.setMtx(mtx);
			}
			
		},true);
		
		return this;
	};
	
	
		
	function addTransform(rect,mtx) {
		
		if (!mtx.isIdentity()) {
				
			var hg = new JSYG.Point(0,0).mtx(mtx),
				hd = new JSYG.Point(rect.width,0).mtx(mtx),
				bg = new JSYG.Point(0,rect.height).mtx(mtx),
				bd = new JSYG.Point(rect.width,rect.height).mtx(mtx),
			
				xmin = Math.min(hg.x,hd.x,bg.x,bd.x),
				ymin = Math.min(hg.y,hd.y,bg.y,bd.y),
				xmax = Math.max(hg.x,hd.x,bg.x,bd.x),
				ymax = Math.max(hg.y,hd.y,bg.y,bd.y);
							
			return {
				x : Math.round(xmin + rect.x),
				y : Math.round(ymin + rect.y),
				width : Math.round(xmax - xmin),
				height : Math.round(ymax - ymin)
			};	
		}
		else return rect;
	};
	
	function getPos(type,node,ref) {
		var cpt=0,obj=node;
		do {cpt+=obj['offset'+type];} while ((obj = obj.offsetParent) && obj!==ref);
		return cpt;
	}
	
	function swapDisplay(jNode,callback) {
		
		var returnValue;
		
		jNode.styleSave('swapDisplay');				
			
		jNode.css({
			"visibility":"hidden",
			"position":"absolute",
			"display": jNode.originalDisplay()
		});
		
		try { returnValue = callback.call(jNode); }
		catch (e) {
			jNode.styleRestore('swapDisplay');
			throw new Error(e);
		}
						
		jNode.styleRestore('swapDisplay');
			
		return returnValue;
	}
	
	
	/**
	 * Récupération des dimensions de l'élément sous forme d'objet avec les propriétés x,y,width,height.
	 * Pour les éléments HTML, Les dimensions prennent en compte padding, border mais pas margin.<br/><br/>
	 * Pour les éléments SVG (balises &lt;svg&gt; comprises), ce sont les dimensions sans tenir compte de l'�paisseur du trac� (stroke-width)
	 * @param type
	 * <ul>
	 * <li>null : dimensions avant toute transformation par rapport au parent positionn� (viewport pour les éléments svg)</li>
	 * <li>"page" : dimensions dans la page</li>
	 * <li>"screen" : dimensions à l'�cran</li>
	 * <li>objet DOM : dimensions relativement à cet objet</li>
	 * @returns {Object} objet avec les propriétés x,y,width,height
	 */
	JSYG.prototype.getDim = function(type) {
		
		var node = this[0],
			dim,parent,box,boundingRect,
			hg,hd,bg,bd,
			x,y,width,height,
			viewBox,jWin,ref,dimRef,
			mtx,
			tag = this.getTag();
		
		if (node.nodeType == 1 && this.css("display") == "none") {
			
			return swapDisplay(this,function() { return this.getDim(); });
		}
		
		if (JSYG.isWindow(node)) {
						
			dim = {
				x : node.pageXOffset || document.documentElement.scrollLeft,
				y : node.pageYOffset || document.documentElement.scrollTop,
				/*width : node.innerWidth || node.document.documentElement.clientWidth,
				height : node.innerHeight || node.document.documentElement.clientHeight*/
				width : node.document.documentElement.clientWidth,
				height : node.document.documentElement.clientHeight
			};
		}
		else if (node.nodeType === 9) {
		
			dim = {
				x : 0,
				y : 0,
				width : Math.max(node.documentElement.scrollWidth,node.documentElement.clientWidth,node.body && node.body.scrollWidth || 0),
				height : Math.max(node.documentElement.scrollHeight,node.documentElement.clientHeight,node.body && node.body.scrollHeight || 0)
			};
		}
		else if (!node.parentNode) { throw new Error(node+" : Il faut d'abord attacher l'élément au DOM."); }
		else if (!type) {
			
			if (this.type === 'svg') {
																		
				if (tag == 'svg') {
					
					parent = this.parent();
					
					if (parent.type == 'svg') {
						
						dim = {
							x : parseFloat(this.attr('x')) || 0,
							y : parseFloat(this.attr('y')) || 0,
							width : parseFloat(this.attr('width')),
							height : parseFloat(this.attr('height'))
						};
					}
					else {
						
						if (parent.css('position') == 'static') parent = parent.offsetParent();
						dim = this.getDim(parent);
					}
					
				}
				else {
					
					box = this[0].getBBox();
					/*
					if (tag == "use" || tag == "text" || tag == "g") {
						
						mtx = this.getMtx(this.parent());
										
						if (!mtx.isIdentity()) {
							
							hg = new JSYG.Point(box.x,box.y).mtx(mtx);
							hd = new JSYG.Point(box.x+box.width,box.y).mtx(mtx);
							bg = new JSYG.Point(box.x,box.y+box.height).mtx(mtx);
							bd = new JSYG.Point(box.x+box.width,box.y+box.height).mtx(mtx);
							
							x = Math.min(hg.x,hd.x,bg.x,bd.x);
							y = Math.min(hg.y,hd.y,bg.y,bd.y);
							width = Math.max(hg.x,hd.x,bg.x,bd.x)-x;
							height = Math.max(hg.y,hd.y,bg.y,bd.y)-y;
							
							dim = { x:x, y:y, width:width, height:height };
												
						} else { dim = box; }
					}
					else {
						*/
						dim = { //box est en lecture seule
							x : box.x,
							y : box.y,
							width : box.width,
							height : box.height
						};
						
						if (tag === 'use' && !JSYG.support.svgUseBBox) {
							//bbox fait alors référence à l'élément source donc il faut ajouter les attributs de l'élément lui-même
							dim.x += parseFloat(this.attr('x'))  || 0;
							dim.y += parseFloat(this.attr('y')) || 0;
						}
					//}
				}
				
			} else if (this.type === 'html') {
				
				dim = this.getDim( this.offsetParent() );
			}
		}
		else if (type === 'page') {
			
			if (tag === 'svg') { // && this.parent().type != 'svg') {
				
				//pas de getBBox, getBoundingClientRect est faux avec FF, pas de offsetWidth, bref un peu la galère
								
				x = parseFloat(this.css("left") || this.attr('x')) || 0;
				y = parseFloat(this.css("top") || this.attr('y')) || 0;
				width = this.cssNum("width");
				height = this.cssNum("height");
				
				viewBox = this.attr("viewBox");
				viewBox && this.attrRemove("viewBox");
				/*
				var mtx = new JSYG.Matrix();
				
				if (viewBox.width && viewBox.height) {
					mtx = mtx.scaleNonUniform(width/viewBox.width,height/viewBox.height);
					mtx = mtx.translate(-viewBox.x,-viewBox.y);	
				}
								
				mtx = this.getMtx('screen').multiply( mtx.inverse() );
				*/
				
				mtx = this.getMtx('screen');
				
				viewBox && this.attr("viewBox",viewBox);
																									
				hg = new JSYG.Point(x,y).mtx(mtx);
				bd = new JSYG.Point(x+width,y+height).mtx(mtx);
				
				boundingRect = {
					left : hg.x,
					top : hg.y,
					width: bd.x - hg.x,
					height : bd.y - hg.y
				};
				
			} else {
			
				if (this.type === 'svg' && this.rotate() == 0) {
					
					//sans rotation, cette méthode est meilleure car getBoundingClientRect
					//tient compte de l'épaisseur de tracé (stroke-width)
					
					mtx = this[0].getScreenCTM();
					
					box = this.getDim();
											
					hg = new JSYG.Point(box.x,box.y).mtx(mtx);
					bd = new JSYG.Point(box.x+box.width,box.y+box.height).mtx(mtx);
					
					boundingRect = { left : hg.x, right : bd.x, top : hg.y, bottom : bd.y };
					
					/*	
					var hg = new JSYG.Point(box.x,box.y).mtx(mtx);
					var hd = new JSYG.Point(box.x+box.width,box.y).mtx(mtx);
					var bg = new JSYG.Point(box.x,box.y+box.height).mtx(mtx);
					var bd = new JSYG.Point(box.x+box.width,box.y+box.height).mtx(mtx);
					
					boundingRect = {
						left : Math.min(hg.x,hd.x,bg.x,bd.x),
						right : Math.max(hg.x,hd.x,bg.x,bd.x),
						top : Math.min(hg.y,hd.y,bg.y,bd.y),
						bottom : Math.max(hg.y,hd.y,bg.y,bd.y)
					};*/
										
				} else {
					//tient compte de l'épaisseur de tracé
					boundingRect = node.getBoundingClientRect();
				}
			}
						
			jWin = new JSYG(window);
			
			x = boundingRect.left + jWin.scrollLeft() - document.documentElement.clientLeft;
			y = boundingRect.top + jWin.scrollTop() - document.documentElement.clientTop;
			width = boundingRect.width != null ? boundingRect.width : boundingRect.right - boundingRect.left;
			height = boundingRect.height != null ? boundingRect.height : boundingRect.bottom - boundingRect.top;

			dim = {
				x : x,
				y : y,
				width : width,
				height : height
			};
			
			if (this.type === 'html' && JSYG.support.addTransfForBoundingRect) { dim = addTransform(dim,this.getMtx()); } //FF
		}
		else if (type === 'screen' || JSYG.isWindow(type) || (type instanceof JSYG && JSYG.isWindow(type[0]) ) ) {
			/*
			if (this[0].getScreenBBox) { à �tudier, ce n'est pas si simple
			
				box = this[0].getScreenBBox();
				//box est en lecture seule
				dim = {
					x : box.x,
					y : box.y,
					width : box.width,
					height : box.height
				};
			}*/
						
			jWin = new JSYG(window);
			dim = this.getDim('page');
			dim.x-=jWin.scrollLeft();
			dim.y-=jWin.scrollTop();
		}
		else if (type.nodeType!=null || type instanceof JSYG) {
			
			ref = type.nodeType!=null ? type : type[0];
			
			if (this.type === 'svg') {
				
				if (this.getTag() === 'svg' && this.parent().type !="svg") {
					
					dimRef = new JSYG(ref).getDim('page');
					dim = this.getDim('page');
										
					dim.x -= dimRef.x;
					dim.y -= dimRef.y;
				}
				else {
				
					box = this.getDim();
					mtx = this.getMtx(ref);
									
					if (!mtx.isIdentity()) {
						
						hg = new JSYG.Point(box.x,box.y).mtx(mtx);
						hd = new JSYG.Point(box.x+box.width,box.y).mtx(mtx);
						bg = new JSYG.Point(box.x,box.y+box.height).mtx(mtx);
						bd = new JSYG.Point(box.x+box.width,box.y+box.height).mtx(mtx);
						
						x = Math.min(hg.x,hd.x,bg.x,bd.x);
						y = Math.min(hg.y,hd.y,bg.y,bd.y);
						width = Math.max(hg.x,hd.x,bg.x,bd.x)-x;
						height = Math.max(hg.y,hd.y,bg.y,bd.y)-y;
						
						dim = { x:x, y:y, width:width, height:height };
											
					} else { dim = box; }
				}
				
			} else if (this.type === 'html') {
				
				width = node.offsetWidth;
				height = node.offsetHeight;
				
				if (!width && !height) {
					
					width = (this.cssNum('border-left-width') || 0) + (this.cssNum('border-right-width') || 0);
					height = (this.cssNum('border-top-width') || 0) + (this.cssNum('border-top-width') || 0);
					
					if (node.clientWidth || node.clientHeight) {
						width+= node.clientWidth;
						height+= node.clientHeight;
					}
					else if (node.width || node.height) {
						width+= (this.cssNum('padding-left') || 0) + (this.cssNum('padding-right') || 0) + node.width;
						height+= (this.cssNum('padding-top') || 0) + (this.cssNum('padding-bottom') || 0) + node.height;
						height+= node.clientHeight;
					}
				}
				
				dim = {
					x : getPos('Left',node,ref),
					y : getPos('Top',node,ref),
					width : width,
					height : height
				};
			}
			
		}
		else throw new Error(type+' : argument incorrect');
		
		return dim;
	};
	
	/**
	 * Utile surtout en interne.
	 * Permet de savoir s'il s'agit d'une balise &lt;image&gt; faisant référence à du contenu svg, car auquel cas elle
	 * se comporte plus comme un conteneur (du moins avec firefox). 
	 */
	JSYG.prototype.isSVGImage = function() {
		return this.getTag() == 'image' && /(image\/svg\+xml|\.svg$)/.test(this.href());
	};
	
	
	function parseDimArgs(args,opt) {
		['x','y','width','height'].forEach(function(prop,i) {
			if (args[i]!=null) { opt[prop] = args[i]; }
		});
	}
	/**
	 * définit les dimensions de la collection par rapport au parent positionn�, avant transformation.
	 * Pour les éléments HTML, Les dimensions prennent en compte padding, border mais pas margin.<br/><br/>
	 * Pour les éléments SVG (balises &lt;svg&gt; comprises), ce sont les dimensions sans tenir compte de l'�paisseur du trac� (stroke-width).<br/><br/>
	 * En argument, au choix :
	 * <ul>
	 * <li>1 argument : objet avec les propriétés parmi x,y,width,height.</li>
	 * <li>2 arguments : nom de la propriété parmi x,y,width,height et valeur.</li>
	 * <li>4 arguments : valeurs de x,y,width et height. On peut passer null pour ignorer une valeur.</li>
	 * </ul>
	 * @returns {JSYG}
	 * @example <pre> new JSYG('#monElement').setDim({x:50,y:50,width:250,height:300});
	 * 
	 * //équivalent à :
	 * new JSYG('#monElement').setDim("x",50).setDim("y",50).setDim("width",250).setDim("height",300);
	 * 
	 * //équivalent à :
	 * new JSYG('#monElement').setDim(50,50,250,300);
	 */
	JSYG.prototype.setDim = function() {
		
		var opt = {},
			n, a = arguments,
			ref;
				
		switch (typeof a[0]) {
		
			case 'string' : opt[ a[0] ] = a[1]; break;
			
			case 'number' : parseDimArgs(a,opt); break;
				
			case 'object' :
				
				if (a[0] == null) parseDimArgs(a,opt);
				else {
					for (n in a[0]) opt[n] = a[0][n];
				}
				
				break;
				
			default : throw new Error("argument(s) incorrect(s) pour la méthode setDim"); 
		}
		
		ref = opt.from && new JSYG(opt.from);
				
		this.each(function() {
						
			var tag, dim, mtx, box, dec, decx, decy, position,
				node = this[0];
			
			if (('keepRatio' in opt) && ('width' in opt || 'height' in opt)) {
				dim = this.getDim();
				if (!('width' in opt)) opt.width = dim.width * opt.height / dim.height;
				else if (!('height' in opt)) opt.height = dim.height * opt.width / dim.width;
			}
			
			if (JSYG.isWindow(node) || node.nodeType === 9) {
				this.getWindow().resizeTo( parseFloat(opt.width) || 0, parseFloat(opt.height) || 0 );
				return;
			}
			
			tag = this.getTag();
			
			if ('from' in opt) {
				
				mtx = this.getMtx(ref).inverse();
				dim = this.getDim();
								
				var dimRef = this.getDim(ref),
					
					x = (opt.x == null) ? 0 : opt.x,
					y = (opt.y == null) ? 0 : opt.y,
					xRef = (opt.x == null) ? 0 : dimRef.x,
					yRef = (opt.y == null) ? 0 : dimRef.y,
					
					width = (opt.width == null) ? 0 : opt.width,
					height = (opt.height == null) ? 0 : opt.height,
					widthRef = (opt.width == null) ? 0 : dimRef.width,
					heightRef = (opt.height == null) ? 0 : dimRef.height,
					
					pt1 = new JSYG.Point(xRef,yRef).mtx(mtx),
					pt2 = new JSYG.Point(x,y).mtx(mtx),
					pt3 = new JSYG.Point(widthRef,heightRef).mtx(mtx),
					pt4 = new JSYG.Point(width,height).mtx(mtx),
					
					newDim = {};
								
				if (tag == "g") mtx = this.getMtx();
				
				if (opt.x!=null) newDim.x = dim.x + pt2.x - pt1.x;
				if (opt.y!=null) newDim.y = dim.y + pt2.y - pt1.y;
				if (opt.width!=null) newDim.width = dim.width + pt4.x - pt3.x;
				if (opt.height!=null) newDim.height = dim.height + pt4.y - pt3.y;
				
				this.setDim(newDim);
				
				if (tag == "g") this.setMtx( mtx.multiply(this.getMtx()) );
				
				return;
			}
			
			switch (tag) {
			
				case 'circle' :
					
					if ("width" in opt) { 
						node.setAttribute('cx',(node.getAttribute('cx') || 0)-(node.getAttribute('r') || 0)+opt.width/2);
						node.setAttribute('r',opt.width/2);
					}
					if ("height" in opt) {
						node.setAttribute('cy',(node.getAttribute('cy') || 0)-(node.getAttribute('r') || 0)+opt.height/2);
						node.setAttribute('r',opt.height/2);
					}
					if ("x" in opt) node.setAttribute('cx',opt.x + parseFloat(node.getAttribute('r') || 0));
					if ("y" in opt) node.setAttribute('cy',opt.y + parseFloat(node.getAttribute('r') || 0));
					
					/*
					for (n in opt) {
						
						switch (n) {
							case 'x' :
								node.setAttribute('cx',opt[n] + parseFloat(node.getAttribute('r') || 0));	break;
							case 'y' :
								node.setAttribute('cy',opt[n] + parseFloat(node.getAttribute('r') || 0));	break;
							case 'width' :
								node.setAttribute('cx',(node.getAttribute('cx') || 0)-(node.getAttribute('r') || 0)+opt[n]/2);
								node.setAttribute('r',opt[n]/2);
								break;
							case 'height' :
								node.setAttribute('cy',(node.getAttribute('cy') || 0)-(node.getAttribute('r') || 0)+opt[n]/2);
								node.setAttribute('r',opt[n]/2);
								break;	
						}
					}*/
					
					break;
				
				case 'ellipse' :
					
					if ("width" in opt) {
						node.setAttribute('cx',(node.getAttribute('cx') || 0)-(node.getAttribute('rx') || 0)+opt.width/2);
						node.setAttribute('rx',opt.width/2);
					}
					if ("height" in opt) {
						node.setAttribute('cy',(node.getAttribute('cy') || 0)-(node.getAttribute('ry') || 0)+opt.height/2);
						node.setAttribute('ry',opt.height/2);
					}
					if ("x" in opt) node.setAttribute('cx',opt.x + parseFloat(node.getAttribute('rx') || 0));
					if ("y" in opt) node.setAttribute('cy',opt.y + parseFloat(node.getAttribute('ry') || 0));
										
					break;
				
				case 'line' : case 'polyline' : case 'polygon' : case 'path' :
									
					if (!this[0].parentNode) { throw new Error("Pour fixer les dimensions d'un élément \""+tag+"\", il faut d'abord l'attacher à l'arbre DOM"); }
									
					mtx = new JSYG.Matrix();
					box = node.getBBox();
					
					if ("x" in opt) mtx = mtx.translate(opt.x-box.x,0);
					if ("y" in opt) mtx = mtx.translate(0,opt.y-box.y);
					if ("width" in opt && box.width!=0)	mtx = mtx.scaleX(opt.width/box.width,box.x,box.y);
					if ("height" in opt && box.height!=0)	mtx = mtx.scaleY(opt.height/box.height,box.x,box.y);
								
					this.mtx2attrs({mtx:mtx});
					
					break;
					
				case 'text' : case 'use' : //on peut répercuter x et y mais pas width ni height
					
					if (('x' in opt || 'y' in opt) && !this[0].parentNode) { throw new Error("Pour fixer la position d'un élément \""+tag+"\", il faut d'abord l'attacher à l'arbre DOM"); }
					
					dim = this[0].getBBox();
					mtx = this.getMtx();
										
					if ('x' in opt) {
							
						if (tag == 'text') dec = (parseFloat(this.attr("x")) || 0) - dim.x;
						else {
							dec = -dim.x;
							if (JSYG.support.svgUseBBox) dec += parseFloat(this.attr('x'));
						}
							
						this.attr('x',opt.x + dec);
					}
					
					if ('y' in opt) {
							
						if (tag == 'text') dec = (parseFloat(this.attr("y")) || 0) - dim.y;
						else {
							dec = -dim.y;
							if (JSYG.support.svgUseBBox) dec += parseFloat(this.attr('y'));
						}
						
						this.attr('y',opt.y + dec);
					}
					
					if ('width' in opt || 'height' in opt) {
					
						mtx = new JSYG.Matrix();
						
						if ('width' in opt && dim.width!=0) {
							mtx = mtx.scaleNonUniform(opt.width/dim.width,1,dim.x,dim.y);
						}
						
						if ('height' in opt && dim.height!=0) {
							mtx = mtx.scaleNonUniform(1,opt.height/dim.height,dim.x,dim.y);
						}
						
						this.mtx2attrs({mtx:mtx});
					}
	
					break;
					
				case 'g' : //on ne peut rien répercuter
										
					if (!this[0].parentNode) { throw new Error("Pour fixer les dimensions d'un élément \""+tag+"\", il faut d'abord l'attacher à l'arbre DOM"); }
					
					dim = this.getDim();
					mtx = this.getMtx();
					
					var dimP = this.getDim( this[0].parentNode );
					
					if ("x" in opt) mtx = new JSYG.Matrix().translateX( opt.x - dimP.x ).multiply(mtx);
					if ("y" in opt) mtx = new JSYG.Matrix().translateY( opt.y - dimP.y ).multiply(mtx);
					if ("width" in opt) mtx = mtx.scaleX( opt.width / dimP.width, dim.x, dim.y );
					if ("height" in opt) mtx = mtx.scaleY( opt.height / dimP.height, dim.x, dim.y );
										
					this.setMtx(mtx);
										
					break;
					
				case 'iframe' : case 'canvas' :
					
					if ("x" in opt) this.css('left',opt.x+'px');
					if ("y" in opt) this.css('top',opt.y+'px');
					if ("width" in opt) this.attr('width',opt.width);
					if ("height" in opt) this.attr('height',opt.height);
						
					break;
													
				default :
															
					if (this.getType() == 'svg') {
						
						//les images dont l'url est un fichier svg se comportent plus comme des conteneurs (du moins avec ff)
						if (this.isSVGImage()) {
							
							if ('x' in opt) this.attr('x',opt.x);
							if ('y' in opt) this.attr('y',opt.y);
							
							if ('width' in opt || 'height' in opt) {
								
								if (!this[0].parentNode) throw new Error("Pour fixer la position d'une image svg, il faut d'abord l'attacher à l'arbre DOM");
								
								dim = this[0].getBBox();
							
								mtx = new JSYG.Matrix();
								
								if ('width' in opt && dim.width!=0)
									mtx = mtx.scaleNonUniform(opt.width/dim.width,1,dim.x,dim.y);
								
								if ('height' in opt && dim.height!=0)
									mtx = mtx.scaleNonUniform(1,opt.height/dim.height,dim.x,dim.y);
								
								this.mtx2attrs({mtx:mtx});
							}
						}						
						else this.attr(opt);
					}
					else {

						position = this.css('position');
						
						decx = this.cssNum('marginLeft') || 0;
						decy = this.cssNum('marginTop') || 0;
								
						if ('x' in opt || 'y' in opt) {
													
							if (!position || position === 'static') {
								
								if (node.parentNode) {
									this.css('position','relative');
									position = 'relative';
								}
								else this.css('position','absolute');
							}
							
							if (position == 'relative'){
								
								dim = this.getDim();
								
								if ('x' in opt) decx = dim.x - (this.cssNum('left') || 0);
								if ('y' in opt) decy = dim.y - (this.cssNum('top') || 0);
							}
						}
																														
						if ("x" in opt) node.style.left = opt.x - decx + 'px';
						if ("y" in opt) node.style.top = opt.y - decy + 'px';
						
						if ("width" in opt) {
									
							if (tag == 'svg') this.css('width',opt.width).attr('width',opt.width);
							else {
								
								node.style.width = Math.max(0,opt.width
								-(this.cssNum('border-left-width') || 0)
								-(this.cssNum('padding-left') || 0)
								-(this.cssNum('border-right-width') || 0)
								-(this.cssNum('padding-right') || 0))+'px';
							}
						}
									
						if ("height" in opt) {
									
							if (tag == 'svg') this.css('height',opt.height).attr('height',opt.height);
							else {
								node.style.height = Math.max(0,opt.height
								-(this.cssNum('border-top-width') || 0)
								-(this.cssNum('padding-top') || 0)
								-(this.cssNum('border-bottom-width') || 0)
								-(this.cssNum('padding-bottom') || 0))+'px';
							}
						}
					}
				
					break;
			}
						
		},true);
		
		return this;
	};
	
	/**
	 * Récupération des dimensions du premier élément de la collection,
	 * sans tenir compte de <strong>margin, border et padding</strong>(équivalent aux valeurs css width et height si définies en pixels).
	 * Pour les éléments svg, renvoie les mêmes valeurs qu'avec la méthode getDim.
	 * @returns {Object} objet avec les propriétés width et height (nombres)
	 */
	JSYG.prototype.innerDim = function() {
		
		var dim,width,height;
		
		if (this.getType() == 'svg') {
			
			dim = this.getDim();
			delete dim.x; delete dim.y;
			
			return dim;
		}
					
		width = this.cssNum('width');
		height = this.cssNum('height');
		
		if (!width || !height) {
			
			if (this.css("display") == "none") {
				return swapDisplay(this,function() { return this.innerDim(); });
			}
			
			width = this[0].clientWidth;
			height = this[0].clientHeight;
			
			if (!width || !height) {
				
				width = this[0].offsetWidth;
				height = this[0].offsetHeight;
				
				width-= (this.cssNum('margin-left') || 0) + (this.cssNum('margin-right') || 0);
				height-= (this.cssNum('margin-top') || 0) + (this.cssNum('margin-bottom') || 0);
			}
			
			width-= (this.cssNum('padding-left') || 0) + (this.cssNum('padding-right') || 0);
			height-= (this.cssNum('padding-top') || 0) + (this.cssNum('padding-bottom') || 0);
		}
		
		return {
			width : width,
			height : height
		};
	};
	
	/**
	 * création de miniatures de la collection (éléments SVG uniquement).
	 * @param width largeur des miniatures ou null pour proportionelle à height
	 * @param height hauteur des miniatures ou null pour proportionelle à width
	 * @returns {JSYG} collection JSYG dont les éléments sont des canvas SVG
	 * @example new JSYG('#myShape').createThumb().appendTo('body')
	 */
	JSYG.prototype.createThumb = function(width,height) {
		
		var thumbs = [];
		
		this.each(function() {
		
			if (this.type !== 'svg') return;
			
			if (!this.id()) this.id('thumb'+JSYG.rand(0,999999));
			
			var dim, use;
			
			try {
				dim = this.getDim();
				if (this.getTag() == 'svg') { dim.x = dim.y = 0; }
				
			} catch(e) {
				use = new JSYG('<use>').href('#'+this.id()).css("visibility","hidden").appendTo(this.offsetParent());
				dim = use.getDim();
				use.remove();
			}
					
			var svg = new JSYG('<svg>').viewBox(dim);
			
			if (width == null && height == null) { width = dim.width; height = dim.height; }
			else if (width == null) width = dim.width * height / dim.height;
			else if (height == null) height = dim.height * width / dim.width;

			svg.setDim({width:width,height:height});
			
			svg.append(new JSYG('<use>').href('#'+this.id()));
			
			thumbs.push(svg[0]);
			
		},true);
		
		return new JSYG(thumbs);
	};
	
		
	/**
	 * Utile plut�t en interne ou pour la création de modules.
	 * récupère le d�calage (pour les transformations) en pixels à partir d'arguments de types diff�rents.
	 * @param pivotX 'left','right','center', nombre ou pourcentage. Si non renseign�, l'origine par défaut de l'élément ("center")
	 * @param pivotY 'top','bottom','center', nombre ou pourcentage. Si non renseign�, l'origine par défaut de l'élément ("center")
	 * @returns {JSYG.Vect}
	 * @see JSYG.prototype.transfOrigin
	 */
	JSYG.prototype.getShift = function(pivotX,pivotY) {
		
		var transfOrigin;
		
		if (pivotX == null || pivotY == null) transfOrigin = this.transfOrigin().split(/ +/);
		
		pivotX = (pivotX != null) ? pivotX : transfOrigin[0];
		pivotY = (pivotY != null) ? pivotY : transfOrigin[1];
				
		if (JSYG.isNumeric(pivotX) && JSYG.isNumeric(pivotY)) return new JSYG.Vect(parseFloat(pivotX),parseFloat(pivotY));
		
		var box = this.getDim(), // dimensions r�elles de l'élément (avant transformation(s))
			translX,translY, 
			pourcent = /^([0-9]+)%$/,
			execX = pourcent.exec(pivotX),
			execY = pourcent.exec(pivotY);
				
		if (execX) translX = box.width * execX[1] / 100;
		else {
			switch (pivotX) {
				case 'left' : translX = 0; break; 
				case 'right' : translX = box.width; break;
				default : translX = box.width/2; break;
			}
		}
		
		if (execY) translY = box.height * execY[1] / 100;
		else {
			switch (pivotY) {
				case 'top' : translY = 0; break; 
				case 'bottom' : translY = box.height; break;
				default : translY = box.height/2; break;
			}
		}
				
		if (this.getType() === 'html') return new JSYG.Vect(translX,translY);
		else return new JSYG.Vect(box.x+translX,box.y+translY);
	};
	
	/**
	 * répercute les transformations sur les attributs (autant que possible).<br/>
	 * Le type de transformations répercutable est variable selon les éléments.
	 * La rotation ne l'est pas sauf pour les chemins (path,line,polyline,polygone).
	 * Pour les conteneurs (&lt;g&gt;), aucune ne l'est. etc.
	 * @param opt si indéfini, répercute la matrice de transformation propre à l'élément.
	 * Si défini, il est un objet contenant les propriétés possibles suivantes :
	 * <ul>
	 * <li>mtx : instance JSYG.Matrix pour répercuter les transformations de celle-ci plut�t que de la matrice propre à l'élément</li>
	 * <li>keepRotation : pour les éléments permettant de répercuter la rotation sur les attributs ('circle','line','polyline','polygon','path'),
	 * le choix est donn� de le faire ou non</li>
	 * </ul>
	 * @returns {JSYG}
	 * @example new JSYG('&lt;rect&gt;').attr({x:0,y:0,width:100,height:100}).translate(50,50).mtx2attrs().attr("x") === 50
	 */
	JSYG.prototype.mtx2attrs = function(opt) {
		
		if (opt instanceof JSYG.Matrix) opt = {mtx:opt};
		else opt = JSYG.extend({},opt);
		
		this.each(function() {
		
			var mtx = opt.mtx || this.getMtx(),
			    keepRotation = opt.keepRotation || false,
			    shift = this.getShift(),
			    d = mtx.decompose(shift.x,shift.y),
			    dim = this.getDim(),
			    tag = this.getTag(),
			    tagsChoixRotation = ['circle','line','polyline','polygon','path'],
			    pt,pt1,pt2,
			    hg,bg,bd,
			    list,
			    jPath,seg,letter,
				x,y,
			    i,N;
			
			if (!dim) return;
			
			if (keepRotation && tagsChoixRotation.indexOf(tag)!==-1) {
				
				mtx = mtx.rotate(-d.rotate,shift.x,shift.y);
			}
			
			//les images dont l'url est un fichier svg se comportent plus comme des conteneurs (du moins avec ff)
			if (this.isSVGImage()) tag = "use";
			
			switch(tag) {
			
				case 'circle' :
						
					pt = new JSYG.Point(this.attr('cx'),this.attr('cy')).mtx(mtx);
					
					this.attr({
						'cx':pt.x,
						'cy':pt.y,
						'r':this.attr('r')*d.scaleX
					});
					
					if (!opt.mtx) this.resetTransf();
					
					break;
				
				case 'ellipse' :
					
					pt = new JSYG.Point(this.attr('cx'),this.attr('cy')).mtx(mtx);
					
					this.attr({
						'cx':pt.x,
						'cy':pt.y,
						'rx':this.attr('rx')*d.scaleX,
						'ry':this.attr('ry')*d.scaleY
					});
					
					if (!opt.mtx) this.resetTransf();
					
					this.setMtx( this.getMtx().rotate(d.rotate,pt.x,pt.y) );
										
					break;
				
				case 'line' : 
					
					pt1 = new JSYG.Point(this.attr('x1'),this.attr('y1')).mtx(mtx),
					pt2 = new JSYG.Point(this.attr('x2'),this.attr('y2')).mtx(mtx);
					
					this.attr({'x1':pt1.x,'y1':pt1.y,'x2':pt2.x,'y2':pt2.y});
					
					if (!opt.mtx) this.resetTransf();
					
					break;
				
				case 'polyline' : case 'polygon' :  
					
					list = this[0].points;
					i=0;N=list.numberOfItems;
					
					for (;i<N;i++) {
						list.replaceItem(list.getItem(i).matrixTransform(mtx.mtx),i);
					}
					
					if (!opt.mtx) this.resetTransf();
					
					break;
				
				case 'path' :
					
					if (!JSYG.Path) throw new Error("Il faut inclure le module JSYG.Path pour pouvoir utiliser la méthode mtx2attrs sur les chemins");
					
					jPath = new JSYG.Path(this[0]).rel2abs();
					list = this[0].pathSegList;
					i=0,N=list.numberOfItems;
							
					for (;i<N;i++) {
						
						seg = list.getItem(i);
						letter = seg.pathSegTypeAsLetter;
						
						['','1','2'].forEach(function(ind) {
	
							if (seg['x'+ind] == null && seg['y'+ind] == null) return;
							
							if (seg['x'+ind] != null) { x = seg['x'+ind]; }
							if (seg['y'+ind] != null) { y = seg['y'+ind]; }
							
							if (x!=null && y!=null) {
								var point = new JSYG.Point(x,y).mtx(mtx);
								seg['x'+ind] = point.x;
								seg['y'+ind] = point.y;
							}
						});
						
						if (keepRotation && letter === 'A') {
							seg.r1 *= mtx.scaleX();
							seg.r2 *= mtx.scaleY();
						}
						
						jPath.replaceSeg(i,seg);
					}
					
					if (!opt.mtx) this.resetTransf();
					
					break;
					
				case 'g' :
				
					opt.mtx && this.addMtx(mtx);
					break;
					
				case 'use' :
					
					hg = new JSYG.Point(this.attr('x') || 0, this.attr('y') || 0).mtx(mtx);
																	
					this.attr({'x':hg.x,'y':hg.y});
					
					if (!opt.mtx) this.resetTransf();
									
					this.setMtx(this.getMtx()
						.translate(hg.x,hg.y)
						.scaleNonUniform(d.scaleX,d.scaleY)
						.rotate(d.rotate)
						.translate(-hg.x,-hg.y)
					);
					
					break;
								
				case 'text' :
					
					x = parseFloat(this.attr("x") || 0);					
					y = parseFloat(this.attr("y")) || 0;
					
					pt = new JSYG.Point(x,y).mtx(mtx);
													
					this.attr({'x':pt.x,'y':pt.y});
					
					if (!opt.mtx) this.resetTransf();
									
					this.setMtx(this.getMtx()
						.translate(pt.x,pt.y)
						.scaleNonUniform(d.scaleX,d.scaleY)
						.rotate(d.rotate)
						.translate(-pt.x,-pt.y)
					);
					
					break;
			
				case 'rect' :
									
					hg = new JSYG.Point(dim.x,dim.y).mtx(mtx),
					bg = new JSYG.Point(dim.x,dim.y+dim.height).mtx(mtx),
					bd = new JSYG.Point(dim.x+dim.width,dim.y+dim.height).mtx(mtx);
													
					this.attr({
						'x' : hg.x,
						'y' : hg.y,
						'width' : JSYG.distance(bd,bg),
						'height' : JSYG.distance(bg,hg),
						'rx' : this.attr('rx') * d.scaleX,
						'ry' : this.attr('ry') * d.scaleY
					});
					
					if (!opt.mtx) this.resetTransf();
					
					this.setMtx( this.getMtx().rotate(d.rotate,hg.x,hg.y) );
										
					break;
					
				default :
					
					if (this.type === 'html') {
						
						hg = new JSYG.Point(0,0).mtx(mtx),
						bg = new JSYG.Point(0,dim.height).mtx(mtx),
						bd = new JSYG.Point(dim.width,dim.height).mtx(mtx);
						
						this.setDim({
							'x' : dim.x + hg.x,
							'y' : dim.y + hg.y,
							'width' : JSYG.distance(bd,bg),
							'height' : JSYG.distance(bg,hg)
						});
					
						if (!opt.mtx) this.resetTransf();
						
						this.setMtx(this.getMtx().rotate(d.rotate));
						
					}
					else if (this.type === 'svg') {
					
						hg = new JSYG.Point(dim.x,dim.y).mtx(mtx),
						bg = new JSYG.Point(dim.x,dim.y+dim.height).mtx(mtx),
						bd = new JSYG.Point(dim.x+dim.width,dim.y+dim.height).mtx(mtx);
						
						this.attr({
							'x' : hg.x,
							'y' : hg.y,
							'width' : JSYG.distance(bd,bg),
							'height' : JSYG.distance(bg,hg)
						});
					
						if (!opt.mtx) this.resetTransf();
						
						this.setMtx( this.getMtx().rotate(d.rotate,hg.x,hg.y) );
					}
			}
			
			if (keepRotation && tagsChoixRotation.indexOf(tag)!==-1) {
							
				shift = this.getShift();
				
				this.setMtx(this.getMtx().rotate(d.rotate,shift.x,shift.y));
			}
			
		},true);
		
		return this;
	};
	
	/**
	 * Renvoie les transformations du 1er élément de la collection
	 * @returns objet avec les propriétés "scaleX","scaleY","rotate","translateX","translateY"
	 */
	JSYG.prototype.getTransf = function() {
		
		var shift = this.getShift(),
			transf = this.getMtx().decompose(shift.x,shift.y);
		
		//delete transf.skew;
		
		return transf;
	};
		
	/**
	 * Liste des balises SVG
	 */
	JSYG.svgTags = ['altGlyph','altGlyphDef','altGlyphItem','animate','animateColor','animateMotion','animateTransform','circle','clipPath','color-profile','cursor','definition-src','defs','desc','ellipse','feBlend','feColorMatrix','feComponentTransfer','feComposite','feConvolveMatrix','feDiffuseLighting','feDisplacementMap','feDistantLight','feFlood','feFuncA','feFuncB','feFuncG','feFuncR','feGaussianBlur','feImage','feMerge','feMergeNode','feMorphology','feOffset','fePointLight','feSpecularLighting','feSpotLight','feTile','feTurbulence','filter','font','font-face','font-face-format','font-face-name','font-face-src','font-face-uri','foreignObject','g','glyph','glyphRef','hkern','image','line','linearGradient','marker','mask','metadata','missing-glyph','mpath','path','pattern','polygon','polyline','radialGradient','rect','set','stop','style','svg','switch','symbol','text','textPath','title','tref','tspan','use','view','vkern'];
	/**
	 * Liste des balises des formes svg
	 */
	JSYG.svgShapes = ['circle','ellipse','line','polygon','polyline','path','rect'];
	/**
	 * Liste des balises des conteneurs svg
	 */
	JSYG.svgContainers = ['a','defs','glyphs','g','marker','mask','missing-glyph','pattern','svg','switch','symbol'];
	/**
	 * Liste des balises des éléments graphiques svg
	 */
	JSYG.svgGraphics = ['circle','ellipse','line','polygon','polyline','path','rect','use','image','text'];
	/**
	 * Liste des balises des éléments textes svg
	 */
	JSYG.svgTexts = ['altGlyph','textPath','text','tref','tspan'];
	/**
	 * Liste des elements SVG pouvant utiliser l'attribut viewBox
	 */
	JSYG.svgViewBoxTags = ['svg','symbol','image','marker','pattern','view'];
		
	JSYG.prototype.attrsSave = function() {
		
		this.each(function() {
			
			var attrs = {},
				attr,
				i=0,N=this.attributes.length;
			
			for (;i<N;i++) {
				attr = this.attributes[i];
				attrs[ attr.name ] = attr.value;
			}
			
			new JSYG(this).data('attrsSaved',attrs);
		});
		
		return this;
	};
	
	JSYG.prototype.attrsRestore = function() {
		
		this.each(function() {
			
			var attrs = this.data('attrsSaved');
			
			if (!attrs) return;
						
			for (var n in attrs) this.attr(n,attrs[n]);
						
			this.dataRemove('attrsSaved');
						
		},true);
		
		return this;
	};
	
	JSYG.prototype.attrsRemove = function() {
		
		this.each(function() {
			
			while (this.attributes[0]) this.removeAttribute(this.attributes[0].name);			
		});
		
		return this;
	};
	
	/**
	 * Retire l'attribut de style "style" + tous les attributs svg concernant le style.
	 */
	JSYG.prototype.styleRemove = function() {
		
		this.each(function() {
			
			var that = this;
			
			this.attrRemove('style');
			
			if (this.type == 'svg') {
				JSYG.svgCssProperties.forEach(function(attr) { that.attrRemove(attr); });
			}
			
		},true);
		
		return this;		
	};
	
	/**
	 * Sauvegarde le style pour être r�tabli plus tard par la méthode styleRestore
	 * @param id identifiant de la sauvegarde du style (pour ne pas interf�rer avec d'autres styleSave)
	 * @returns {JSYG}
	 */
	JSYG.prototype.styleSave = function(id) {
		
		var prop = "styleSaved";
		
		if (id) prop+=id;
		
		this.each(function() {
			
			var attrs={},
				style,
				that = this;
							
			if (this.getType() == 'svg') {
				
				JSYG.svgCssProperties.forEach(function(attr) {
					var val = that.attr(attr);
					if (val!= null) attrs[attr] = val;
				});
			}
			
			style = this.attr('style');
			
			if (typeof style == 'object') style = JSON.stringify(style); //IE
			
			attrs.style = style;
						
			this.data(prop,attrs);
						
		},true);
		
		return this;
	};
	
	/**
	 * Restaure le style pr�alablement sauv� par la méthode styleSave.
	 * Attention avec des éléments html et Google Chrome la méthode est asynchrone.
	 * @param id identifiant de la sauvegarde du style (pour ne pas interf�rer avec d'autres styleSave)
	 * @returns {JSYG}
	 */
	JSYG.prototype.styleRestore = function(id) {
		
		var prop = "styleSaved";
		
		if (id) prop+=id;
		
		this.each(function() {
			
			var attrs = this.data(prop),
				style;
						
			if (!attrs) return;
			
			this.styleRemove();
						
			if (this.getType() == 'svg') this.attr(attrs);
			else {
			
				try {
					style = JSON.parse(attrs.style);
					for (var n in style) { if (style[n]) this[0].style[n] = style[n]; }
				}
				catch(e) { this.attr('style',attrs.style); }
			}
			
			this.dataRemove(prop);
									
		},true);
		
		return this;
	};
	
	/**
	 * Applique aux éléments de la collection tous les éléments de style de l'élément passé en argument.
	 * @param elmt argument JSYG
	 * @returns {JSYG}
	 */
	JSYG.prototype.styleClone = function(elmt) {
		
		elmt = new JSYG(elmt);
		
		var foreignStyle = elmt.getComputedStyle(),
			name,value,
			i=0,N=foreignStyle.length;
		
		this.styleRemove();
				
		this.each(function() {
				
			var ownStyle = this.getComputedStyle();
			var type = this.getType();
									
			for (i=0;i<N;i++) {
				
				name = foreignStyle.item(i);
				
				if (type == 'svg' && JSYG.svgCssProperties.indexOf(name)===-1) continue;
				
				value = foreignStyle.getPropertyValue(name);
				//priority = foreignStyle.getPropertyPriority(name);
				
				if (ownStyle.getPropertyValue(name) !== value) {
					//ownStyle.setProperty(name,value,priority); //-> Modifications are not allowed for this document (?)
					this.css(name,value);
				}
			}
			
		},true);
						
		return this;
	};
		
	
	/**
	 * récupère ou fixe les attributs de la viewBox d'un élément SVG (qui dispose de cet attribut, essentiellement les balise &lt;svg&gt;)
	 * @param dim optionnel, objet, si défini fixe les attributs
	 * @returns {JSYG} si dim est défini, objet avec propriétés x,y,width,height
	 */
	JSYG.prototype.viewBox = function(dim) {
		
		var val;
		
		this.each(function() {
			
			if (JSYG.svgViewBoxTags.indexOf(this.tagName) == -1)
				throw new Error("la méthode viewBox ne s'applique qu'aux conteneurs svg.");
		
			var viewBoxInit = this.viewBox.baseVal,
				viewBox = viewBoxInit || {} ;
			
			if (dim == null) {
				
				val = {
					x : viewBox.x || 0,
					y : viewBox.y || 0,
					width : viewBox.width || parseFloat(this.getAttribute('width')),
					height : viewBox.height || parseFloat(this.getAttribute('height'))
				};
				
				return false;
			}
			else {
								
				for (var n in dim) {
					if (["x","y","width","height"].indexOf(n)!=-1) viewBox[n] = dim[n];
				}
			}
			
			if (!viewBoxInit) this.setAttribute('viewBox', viewBox.x+" "+viewBox.y+" "+viewBox.width+" "+viewBox.height);
			
		});
		
		return val ? val : this;
	};
	
	/**
	 * Renvoit la matrice de transformation équivalente à la viewbox
	 */
	function viewBox2mtx(svgElmt) {
		
		var viewBox = svgElmt.viewBox.baseVal,
			mtx = new JSYG.Matrix(),
			scaleX,scaleY,ratio;
		
		if (!viewBox) return mtx;
			
		if (viewBox.width && viewBox.height) {
															
			scaleX = svgElmt.getAttribute('width')/viewBox.width;
			scaleY = svgElmt.getAttribute('height')/viewBox.height;
			ratio = svgElmt.getAttribute("preserveAspectRatio");
		
			if (ratio && ratio!="none") throw new Error(ratio+" : d�sol�, la méthode ne fonctionne pas avec une valeur de preserveAspectRatio diff�rente de 'none'.");
			
			mtx = mtx.scaleNonUniform(scaleX,scaleY);
		}
		
		mtx = mtx.translate(-viewBox.x,-viewBox.y);
		
		return mtx;
	};
	
	/**
	 * Transforme les éléments &lt;svg&gt; de la collection en conteneurs &lt;g&gt;.
	 * Cela peut être utile pour insérer un document svg dans un autre et �viter d'avoir des balises svg imbriqu�es.
	 * @returns {JSYG} objet JSYG contenant la collection des éléments g.
	 */
	JSYG.prototype.svg2g = function() {
		
		var list = [];
				
		this.each(function() {
			
			if (this.getTag() != "svg") throw new Error(this.getTag()+" : la méthode ne concerne que les balises svg");
						
			var g = new JSYG('<g>'),
				mtx = new JSYG.Matrix();
		
			while (this[0].firstChild) g.append(this[0].firstChild);
			
			mtx = mtx.translate( this.attr("x")||0 , this.attr("y")||0);
						
			mtx = mtx.multiply( viewBox2mtx(this[0]) );
						
			g.setMtx(mtx).replace(this);
						
			list.push(g[0]);
			
		},true);
		
		return new JSYG(list);
	};
	
	/**
	 * Ajoute tous les éléments de style possiblement définis en css comme attributs.<br/>
	 * Cela est utile en cas d'export SVG, afin d'avoir le style dans les balises et non dans un fichier à part.<br/>
	 * @param recursive si true applique la méthode à tous les enfants.
	 * @returns {JSYG}
	 */
	JSYG.prototype.style2attr = function(recursive) {
		
		var href = window.location.href.replace('#'+window.location.hash,'');
		
		function fct() {
			
			var jThis = new JSYG(this),
				type = jThis.getType();
			
			if (type == 'svg' && JSYG.svgGraphics.indexOf(this.tagName) == -1) return;
			
			var style = jThis.getComputedStyle(),
				defaultStyle = jThis.getDefaultStyle(),
				styleAttr = '',
				name,value,
				i=0,N=style.length;
			
			for (;i<N;i++) {
				
				name = style.item(i);
				
				if (type == 'svg' && JSYG.svgCssProperties.indexOf(name)===-1) continue;
				
				value = style.getPropertyValue(name);
				
				if (defaultStyle[name] != value) {
					
					//la fonction getPropertyValue renvoie url("http://monsite.fr/toto/#anchor") au lieu de url(#anchor)
					if (value.indexOf(href) != -1) value = value.replace(href,'').replace(/"|'/g,'');
					
					if (type == 'svg') this.setAttribute(name,value);
					else styleAttr+= name+':'+value+';';
				}
			}
			
			if (type == 'html') this.setAttribute('style',styleAttr);
		};
		
		if (recursive) this.walkTheDom(fct);
		else fct.call(this.node);
		
		return this;
	};

	JSYG.getStyleRules = function() {
		
		var css = '';
		
		function addStyle(rule) { css+=rule.cssText; }
		
		JSYG.makeArray(document.styleSheets).forEach(function(styleSheet) {
			
			JSYG.makeArray(styleSheet.cssRules || styleSheet.rules).forEach(addStyle);
		});
		    
		return css;
	};
	
	
	/**
	 * Parse une chaîne svg en renvoit l'objet JSYG correspondant
	 * @param svgString chaîne svg
	 * @returns {JSYG}
	 */
	JSYG.parseSVG = function(svgString) {
		
		var parser = new DOMParser(),
			doc = parser.parseFromString(svgString, "image/svg+xml"),
			node = doc.documentElement;
		
		return new JSYG(node);
	};
	
	

	/**
	 * Encode une chaîne en base 64.
	 * @param input chaîne à encoder
	 * @returns {String}
	 */
	JSYG.base64encode = function(input) { return window.btoa( JSYG.utf8encode(input) ); };

	/**
	 * Décode une chaîne cod�e en base 64.
	 * @param input chaîne à d�coder
	 * @returns {String}
	 */
	JSYG.base64decode  = function(input) { return JSYG.utf8decode( window.atob(input) ); };
	
	/**
	* Formate une chaîne pour transmission par chaîne de requête
	* @param str chaîne à formater
	* @returns {String}
	*/
	JSYG.urlencode = function(str) {
		return window.encodeURIComponent(str);
	};
	
	/**
	* Décode une chaîne apr�s transmission par chaîne de requête
	* @param str chaîne à d�coder
	* @returns {String}
	*/
	JSYG.urldecode = function(str) {
		
		return window.decodeURIComponent(str);
	};
			
	/**
	 * Encodage d'une chaîne au format UTF8
	 * @param string
	 * @returns {String}
	 */
	JSYG.utf8encode = function(string) {
				
		//Johan Sundstr�m
		return window.unescape( JSYG.urlencode( string ) );
	};
	
	/**
	 * Décodage d'une chaîne UTF8 en ISO-8859-1
	 * @param string
	 * @returns {String}
	 */
	JSYG.utf8decode = function(string) {
		
		//Johan Sundstr�m
		return JSYG.urldecode( window.escape(string) );
	};
	
	/**
	 * Met la première lettre de la chaîne en majuscule
	 * @param str chaîne à analyser
	 * @returns {String}
	 */
	JSYG.ucfirst = function(str) {
		
		return str.charAt(0).toUpperCase() + str.substr(1);
	};
	
	/**
	 * Met la première lettre de la chaîne en minuscule
	 * @param str chaîne à analyser
	 * @returns {String}
	 */
	JSYG.lcfirst = function(str) {
		
		return str.charAt(0).toLowerCase() + str.substr(1);
	};
	
	/**
	 * Met la première lettre de chaque mot en majuscule
	 * @param str chaîne à analyser
	 * @returns {String}
	 */
	JSYG.ucwords = function(str) {
		return str.replace(/\b\w/g,function(s){ return s.toUpperCase(); });
	};
	
	/**
	 * Retire les accents de la chaîne
	 * @param str chaîne à analyser
	 * @returns {String}
	 */
	JSYG.stripAccents = function(str) {
		
		var accent = [
		              /[\300-\306]/g, /[\340-\346]/g, // A, a
		              /[\310-\313]/g, /[\350-\353]/g, // E, e
		              /[\314-\317]/g, /[\354-\357]/g, // I, i
		              /[\322-\330]/g, /[\362-\370]/g, // O, o
		              /[\331-\334]/g, /[\371-\374]/g, // U, u
		              /[\321]/g, /[\361]/g, // N, n
		              /[\307]/g, /[\347]/g // C, c
		              ];
		
		var noaccent = ['A','a','E','e','I','i','O','o','U','u','N','n','C','c'];
   
		for(var i = 0; i < accent.length; i++) str = str.replace(accent[i], noaccent[i]);
  
		return str;
	};
	
	
	var rTags = /<\/?([a-z]\w*)\b[^>]*>/gi;
	function regexpTag(tag) { return new RegExp("<("+tag+")\\b[^>]*>([\\s\\S]*?)<\\/\\1>","gi");};
	
	/**
	 * Retire les balises de la chaîne
	 * @param str chaîne à analyser
	 * @param allowed balise autorisée. Le nombre d'arguments n'est pas limité.
	 * @returns {String}
	 * @example JSYG.stripTags('&lt;tata&gt;toto&lt;/tata&gt;','br','span') == 'toto';
	 * @see stripTagsR
	 */
	JSYG.stripTags = function(str,allowed) {
		
		allowed = slice.call(arguments,1);
		
	    return str.replace(rTags, function (s, s1) { return allowed.indexOf(s1.toLowerCase()) !== -1 ? s : '';});
	};
	
	/**
	 * Retire les balises de la chaîne.
	 * A la différence de stripTags, cette méthode fonction avec une liste noire plutôt qu'une liste blanche.
	 * @param str chaîne à analyser
	 * @param forbidden balise à retirer. Le nombre d'arguments n'est pas limité.
	 * @returns {String}
	 * @see stripTags
	 */
	JSYG.stripTagsR = function(str,forbidden) {
		
		forbidden = slice.call(arguments,1);
		
	    return str.replace(rTags, function (s, s1) { return forbidden.indexOf(s1.toLowerCase()) !== -1 ? '' : s;});
	};
	
	/**
	 * Retire les attributs des balises
	 * @param str chaîne à analyser 
	 * @returns {String}
	 */
	JSYG.stripAttributes = function(str) {
		
		return str.replace('/<([a-z]\w*)\b[^>]*>/i', function(s) { return '<'+s+'>'; });
	};
	
	/**
	 * Récupère le(s) contenu(s) d'une balise donnée sous forme de tableau de chaînes
	 * @param str chaîne à analyser 
	 * @param tag nom de la balise dont on veut récupèrer le contenu
	 * @returns {Array} chaque élément du tableau est le contenu d'une balise tag
	 */
	JSYG.getTagContent = function(str,tag) {
			
		var regexp = regexpTag(tag),
			occ = str.match(regexp),
			i,N;
				
		if (occ===null) return null;
		
		for (i=0,N=occ.length;i<N;i++) occ[i] = occ[i].replace(regexp,function(str,p1) { return p1; });
		
		return occ;
	};
	
	/**
	 * Retire les balises et leur contenu
	 * @param str chaîne à analyser 
	 * @param tag nom de la balise à supprimer
	 * @param {Array} content tableau qui sera rempli par le contenu des balises trouv�es (les tableaux passent par référence)
	 * @@returns {String}
	 */
	JSYG.stripTagAndContent = function(str,tag,content) {
		return str.replace(regexpTag(tag),function(str,p1,p2) { content && content.push(p2); return ''; });
	};
	
	/**
	 * Transforme la chaîne en chaîne de type camelCase (style javascript, les majuscules remplacent les espaces/tirets/underscores)
	 * @param str chaîne à analyser 
	 * @returns {String}
	 */
	JSYG.camelize = function(str) {
		return str.replace(/(-|_|\s+)([a-z])/ig,function(str,p1,p2){ return p2.toUpperCase();});
	};
	
	/**
	 * Remplace les majuscules d'une chaîne camelCase par un tiret
	 * @param str chaîne à analyser 
	 * @returns {String}
	 */
	JSYG.dasherize = function(str) {
		return str.replace(/[A-Z]/g,function(str){ return '-'+str.toLowerCase();});
	};
	
	
	
	JSYG.Point = function(x,y) {
		
		if (typeof x === 'object' && y == null) {
			y = x.y;
			x = x.x;
		}
		/**
		 * abcisse
		 */
		this.x = (typeof x == "number") ? x : parseFloat(x);
		/**
		 * ordonnée
		 */
		this.y = (typeof y == "number") ? y : parseFloat(y);
	};
	
	JSYG.Point.prototype = {
			
		constructor : JSYG.Point,
		/**
		 * Applique une matrice de transformation et renvoie le point transformé. 
		 * @param mtx instance de JSYG.Matrix (ou SVGMatrix)
		 * @returns {JSYG.Point} nouvelle instance de JSYG.Point
		 */
		mtx : function(mtx) {
			
			if (mtx instanceof JSYG.Matrix) mtx = mtx.mtx;
			if (!mtx) return new this.constructor(this.x,this.y);
			
			var point = svg.createSVGPoint();
			point.x = this.x;
			point.y = this.y;
			point = point.matrixTransform(mtx);
			
			return new this.constructor(point.x,point.y);
		},
		/**
		 * Renvoie un objet natif SVGPoint équivalent (utile pour certaines méthodes native comme getCharNumAtPosition).
		 */
		toSVGPoint : function() {
			
			var point = svg.createSVGPoint();
			point.x = this.x;
			point.y = this.y;
			
			return point;
		}
	};
	
	
	
	/**
	 * Constructeur de vecteurs.
	 * On peut passer en argument un objet avec les propriétés x et y.
	 * @param x abcisse
	 * @param y ordonnée
	 * @returns {JSYG.Vect}
	 * @link http://www.w3.org/TR/SVG/coords.html#InterfaceSVGPoint
	 */
	JSYG.Vect = function(x,y) {
		
		JSYG.Point.apply(this,arguments);
	};
	
	JSYG.Vect.prototype = new JSYG.Point(0,0);
	
	JSYG.Vect.prototype.constructor = JSYG.Vect;
	/**
	 * Longueur du vecteur
	 * @returns {Number}
	 */
	JSYG.Vect.prototype.length = function() { return Math.sqrt( Math.pow(this.x,2) + Math.pow(this.y,2) ); };
		
	/**
	 * Normalise le vecteur
	 * @returns {JSYG.Vect} nouvelle instance de JSYG.Vect
	 */
	JSYG.Vect.prototype.normalize = function() {
		var length = this.length();
		return new JSYG.Vect( this.x / length,this.y / length );
	};
		
	/**
	 * Combine deux vecteurs
	 * @returns {JSYG.Vect} nouvelle instance de JSYG.Vect
	 */
	JSYG.Vect.prototype.combine = function(pt,ascl,bscl) {
		return new JSYG.Vect(
			(ascl * this.x) + (bscl * pt.x),
			(ascl * this.y) + (bscl * pt.y)
		);
	};
		
	/**
	 * Renvoie le produit scalaire de deux vecteurs
	 * @param vect instance de JSYG.Vect ou tout objet avec les propriétés x et y.
	 * @returns {Number}
	 */
	JSYG.Vect.prototype.dot = function(vect) { return (this.x * vect.x) + (this.y * vect.y); };
		
	/**
	 * Attache un élément DOM dont le centre correspond aux coordonnées du vecteur.
	 * Utile surtout pour le d�veloppement
	 * @param parent argument JSYG auquel attacher la forme cr��e.
	 * @param size taille de la forme cr��e.
	 * @returns objet JSYG de la forme cr��e.
	 */
	JSYG.Vect.prototype.toShape = function(parent,size) {
			
		parent = new JSYG(parent);
		
		return new JSYG((parent.type === 'svg') ? '<circle>' : '<div>')
			.appendTo(parent)
			.setDim({
				width:size||5,
				height:size||5
			})
			.setCenter(this.x,this.y);
	};
	
	/**
	 * Constructeur de matrices JSYG
	 * @param arg optionnel, si défini reprend les coefficients de l'argument. arg peut être
	 * une instance de SVGMatrix (DOM SVG) ou de JSYG.Matrix.
	 * On peut également passer 6 arguments numériques pour définir chacun des coefficients.
	 * @returns {JSYG.Matrix}
	 */
	JSYG.Matrix = function(arg) {
	
		if (arg && arguments.length === 1) {
			if (arg instanceof window.SVGMatrix) this.mtx = arg.scale(1);
			else if (arg instanceof JSYG.Matrix) this.mtx = arg.mtx.scale(1);
			else if (typeof arg == "string") return JSYG.Matrix.parse(arg);
			else throw new Error(arg+" : argument incorrect pour JSYG.Matrix.");
		}
		else {
			this.mtx = svg && svg.createSVGMatrix();
			if (arguments.length === 6) {
			    var a = arguments, that = this;
			    ['a','b','c','d','e','f'].forEach(function(prop,ind){ that[prop] = a[ind]; });
			}
		}	
	};
	
	JSYG.Matrix.prototype = {
		
		constructor : JSYG.Matrix,
		
		/**
		 * Coefficients de la matrice
		 */
		a : null,
		b : null,
		c : null,
		d : null,
		e : null,
		f : null,
		
		/**
		 * Objet SVGMatrix original
		 */
		mtx : null,
		
		/**
		 * Transforme un point par cette matrice.
		 * On peut passer en argument un objet avec les propriétés x et y.
		 * @param x abcisse
		 * @param y ordonnée
		 * @returns {JSYG.Point}
		 */
		transformPoint : function(x,y) {
			return new JSYG.Point(x,y).mtx(this.mtx);
		},
	
		/**
		 * Cr�e une matrice identique
		 * @returns {JSYG.Matrix}
		 */
		clone : function() {
			return new JSYG.Matrix(this.mtx);
		},
		
		/**
		 * Teste si la matrice est la matrice identit� (pas de transformation)
		 * @returns {Boolean}
		 */
		isIdentity : function() {
			if (!this.mtx) return true;
			return this.mtx.a === 1 && this.mtx.b === 0 && this.mtx.c === 0 && this.mtx.d === 1 && this.mtx.e === 0 && this.mtx.f === 0;
		},
		
		/**
		 * Multiplie la matrice par celle passée en argument
		 * @param mtx instance de JSYG.Matrix (ou SVGMatrix) 
		 * @returns {JSYG.Matrix} nouvelle instance
		 */
		multiply : function(mtx) {
			mtx = (mtx instanceof JSYG.Matrix) ? mtx.mtx : mtx;
			return new JSYG.Matrix(this.mtx && this.mtx.multiply(mtx));
		},
		
		/**
		 * Inverse la matrice
		 * @returns {JSYG.Matrix} nouvelle instance
		 */
		inverse : function() {
			return new JSYG.Matrix(this.mtx && this.mtx.inverse());
		},
	
		/**
		 * Applique un coefficient d'échelle
		 * @param scale
		 * @param originX optionnel, abcisse du point fixe lors du changement d'échelle
		 * @param originY optionnel, ordonnée du point fixe lors du changement d'échelle
		 * @returns {JSYG.Matrix} nouvelle instance
		 */
		scale : function(scale,originX,originY) {
			originX = originX || 0;
			originY = originY || 0;
			return new JSYG.Matrix(this.mtx && this.mtx.translate(originX,originY).scale(scale).translate(-originX,-originY));
		},
		
		/**
		 * Applique un coefficient d'échelle horizontale / Renvoie l'échelle horizontale (appel sans argument). 
		 * @param scale
		 * @param originX optionnel, abcisse du point fixe lors du changement d'échelle
		 * @param originY optionnel, ordonnée du point fixe lors du changement d'échelle
		 * @returns {JSYG.Matrix} nouvelle instance
		 */
		scaleX : function(scale,originX,originY) {
			
			if (scale == null) return this.decompose(this.mtx).scaleX;
			
			originX = originX || 0;
			originY = originY || 0;
			
			return new JSYG.Matrix(this.mtx && this.mtx.translate(originX,originY).scaleNonUniform(scale,1).translate(-originX,-originY));
		},
		
		/**
		 * Applique un coefficient d'échelle verticale / Renvoie l'échelle verticale (appel sans argument). 
		 * @param scale
		 * @param originX optionnel, abcisse du point fixe lors du changement d'échelle
		 * @param originY optionnel, ordonnée du point fixe lors du changement d'échelle
		 * @returns {JSYG.Matrix} nouvelle instance
		 */
		scaleY : function(scale,originX,originY) {
			
			if (scale == null) return this.decompose(this.mtx).scaleY;
			
			originX = originX || 0;
			originY = originY || 0;
			
			return new JSYG.Matrix(this.mtx && this.mtx.translate(originX,originY).scaleNonUniform(1,scale).translate(-originX,-originY));
		},
		
		/**
		 * Applique un coefficient d'échelle non uniforme en x et en y
		 * @param scaleX échelle horizontale
		 * @param scaleY échelle verticale
		 * @param originX optionnel, abcisse du point fixe lors du changement d'échelle
		 * @param originY optionnel, ordonnée du point fixe lors du changement d'échelle
		 * @returns {JSYG.Matrix} nouvelle instance
		 */
		scaleNonUniform : function(scaleX,scaleY,originX,originY) {
			
			originX = originX || 0;
			originY = originY || 0;
			return new JSYG.Matrix(this.mtx && this.mtx.translate(originX,originY).scaleNonUniform(scaleX,scaleY).translate(-originX,-originY));
		},
		
		/**
		 * Translation
		 * @param x translation horizontale 
		 * @param y translation verticale
		 * @returns {JSYG.Matrix} nouvelle instance
		 */
		translate : function(x,y) {
			return new JSYG.Matrix(this.mtx && this.mtx.translate(x,y));
		},
		
		/**
		 * Translation horizontale / Renvoie la translation horizontale (appel sans argument). 
		 * @param x translation horizontale 
		 * @returns {JSYG.Matrix} nouvelle instance
		 */
		translateX : function(x) {
			
			if (x == null) return this.decompose(this.mtx).translateX;
			
			return new JSYG.Matrix(this.mtx && this.mtx.translate(x,0));
		},
		
		/**
		 * Translation verticale / Renvoie la translation verticale (appel sans argument). 
		 * @param y translation verticale
		 * @returns {JSYG.Matrix} nouvelle instance
		 */
		translateY : function(y) {
			
			if (y == null) return this.decompose(this.mtx).translateY;
			
			return new JSYG.Matrix(this.mtx && this.mtx.translate(0,y));
		},
		
		/**
		 * Rotation / Renvoie la rotation
		 * @param angle en degr�s
		 * @param originX optionnel, abcisse du point fixe lors de la rotation
		 * @param originY optionnel, ordonnée du point fixe lors de la rotation
		 * @returns {JSYG.Matrix} nouvelle instance
		 */
		rotate : function(angle,originX,originY) {
			
			if (angle == null) return this.decompose(this.mtx).rotate;
					
			originX = originX || 0;
			originY = originY || 0;
			
			var mtx = this.decompose();
					
			return new JSYG.Matrix(this.mtx && this.mtx.translate(originX,originY)
			.scaleNonUniform(1/mtx.scaleX,1/mtx.scaleY)
			.rotate(angle)
			.scaleNonUniform(mtx.scaleX,mtx.scaleY)
			.translate(-originX,-originY));
		},
		
		skewX : function(angle,originX,originY) {
			
			if (angle == null) return this.decompose(this.mtx).skew;
			
			originX = originX || 0;
			originY = originY || 0;
			
			var mtx = this.decompose();
					
			return new JSYG.Matrix(this.mtx && this.mtx.translate(originX,originY)
			.scaleNonUniform(1/mtx.scaleX,1/mtx.scaleY)
			.skewX(angle)
			.scaleNonUniform(mtx.scaleX,mtx.scaleY)
			.translate(-originX,-originY));
		},
		
		skewY : function(angle,originX,originY) {
			
			if (angle == null) return this.decompose(this.mtx).skew;
			
			originX = originX || 0;
			originY = originY || 0;
			
			var mtx = this.decompose();
					
			return new JSYG.Matrix(this.mtx && this.mtx.translate(originX,originY)
			.scaleNonUniform(1/mtx.scaleX,1/mtx.scaleY)
			.skewY(angle)
			.scaleNonUniform(mtx.scaleX,mtx.scaleY)
			.translate(-originX,-originY));
		},
				
		/**
		 * D�composition de la matrice
		 * @param originX optionnel, abcisse du point fixe lors des transformations
		 * @param originY optionnel, ordonnée du point fixe lors des transformations
		 * @returns {Object} avec les propriétés translateX,translateY,rotate,skew,scaleX,scaleY
		 * @link http://www.w3.org/TR/css3-2d-transforms/#matrix-decomposition
		 */
		decompose : function(originX,originY) {
					
			if (!this.mtx) { return {
					translateX : 0,
					translateY : 0,
					rotate : 0,
					skew : 0,
					scaleX : 1,
					scaleY : 1
				};
			}
			
			var mtx = this.mtx;
			
			if ((mtx.a * mtx.d - mtx.b * mtx.c) === 0) return false;
	
			var rowx = new JSYG.Vect(mtx.a,mtx.b);
			var scaleX = rowx.length();
			rowx = rowx.normalize();
			
			var rowy = new JSYG.Vect(mtx.c,mtx.d);
			var skew = rowx.dot(rowy);
			rowy = rowy.combine(rowx, 1.0, -skew);
			
			var scaleY = rowy.length();
			rowy = rowy.normalize();
			skew /= scaleY;
			
			var rotate = Math.atan2(mtx.b,mtx.a) * 180 / Math.PI;
			
			var decompose = {
				translateX : mtx.e,
				translateY : mtx.f,
				rotate : rotate,
				skew : skew,
				scaleX : scaleX,
				scaleY : scaleY
			};
			
			if (originX != null && originY != null) {
				
				//pour obtenir les translations r�elles (non li�es aux rotations et échelles)
				mtx = mtx.translate(originX,originY) 
				.rotate(-decompose.rotate)
				.scaleNonUniform(1/decompose.scaleX,1/decompose.scaleY)
				.translate(-originX,-originY);
																		
				decompose.translateX = mtx.e;
				decompose.translateY = mtx.f;
			}
			
			return decompose;
		},
		
		/**
		 * Renvoie une matrice à partir d'un objet décrivant les transformations.
		 * @param transf objet contenant les propriétés possibles suivantes :
		 * translateX,translateY,rotate,skew,scaleX,scaleY.
		 * @param originX optionnel, abcisse du point fixe lors des transformations
		 * @param originY optionnel, ordonnée du point fixe lors des transformations
		 * @returns {JSYG.Matrix}
		 * @link http://www.w3.org/TR/css3-2d-transforms/#recomposing-the-matrix
		 */
		recompose : function(transf,originX,originY) {
			
			return new JSYG.Matrix( svg && svg.createSVGMatrix()
				.translate(transf.translateX || 0,transf.translateY || 0)
				.translate(originX || 0,originY || 0)
				.rotate(transf.rotate || 0)
				.skewX(transf.skew || 0)
				.scaleNonUniform(transf.scaleX || 1,transf.scaleY || 1)
				.translate(-originX || 0, -originY || 0)
			);
		},
	
		/**
		 * Convertit la matrice en chaîne de caractères (de type attribut transform : matrix(a,b,c,d,e,f) )
		 * @param precision nombre de d�cimales pour les coefficients (5 par défaut)
		 * @returns {String}
		 */
		toString : function(precision) {
			
			if (precision == null) precision = 5;
			
			return 'matrix('
				+JSYG.round(this.mtx.a,precision)+','
				+JSYG.round(this.mtx.b,precision)+','
				+JSYG.round(this.mtx.c,precision)+','
				+JSYG.round(this.mtx.d,precision)+','
				+JSYG.round(this.mtx.e,precision)+','
				+JSYG.round(this.mtx.f,precision)+')';
		}
	};
	
	var regParseMtx = (function() {
		
		var regNbSc = "[-+]?[0-9]*\\.?[0-9]+(?:[e][-+]?[0-9]+)?",
			regCoef = "\\s*("+regNbSc+")\\s*",
			regexp = "matrix\\s*\\("+regCoef+','+regCoef+','+regCoef+','+regCoef+','+regCoef+','+regCoef+"\\)";
			
		return new RegExp(regexp,'i');
		
	}());
	
	JSYG.Matrix.parse = function(str) {
		
		var coefs = regParseMtx.exec(str);
		
		if (!coefs) throw new Error(str+" n'est pas une chaîne valide pour repr�senter une matrice");
		
		return new JSYG.Matrix(coefs[1],coefs[2],coefs[3],coefs[4],coefs[5],coefs[6]);
	};
	
	if (Object.defineProperty) {
	
		try {
		
			['a','b','c','d','e','f'].forEach(function(coef) {
				
				Object.defineProperty(JSYG.Matrix.prototype,coef,{
					get:function() { return this.mtx[coef]; },
					set:function(val) { this.mtx[coef] = val; }
				});
			});
			
		} catch(e) {}
	}
	
	function URLdelimiter(url) { return (url.indexOf('?') == -1) ?  '?' : '&'; }
	
	JSYG.loadJSFile = function(file,callback,nocache) {
		
		return new JSYG.Promise(function(resolve,reject) {
			
			var js = document.createElement('script');
			
			js.async = true;
			
			js.onload = js.onreadystatechange = function() {
				if (this.readyState && (this.readyState != 'loaded' && this.readyState != 'complete') ) return false;
				callback && callback();
				resolve();
			};
			js.onerror = function() {
				reject(new Error("Erreur de chargement du fichier "+file));
			};
			
			js.src = file + (nocache ? URLdelimiter(file) + Math.random() : '');
			
			document.getElementsByTagName('head').item(0).appendChild(js);
		});
	};
	
	JSYG.loadCSSFile = function(file,callback,nocache) {
		
		return new JSYG.Promise(function(resolve,reject) {
		
			var css,img,head,onloadEvt,url;
			
			url = file + (nocache ? URLdelimiter(file) + Math.random() : '');
			
			css = document.createElement('link');
			css.rel = 'stylesheet';
			css.type = 'text/css';
			css.href = url;
			
			head = document.getElementsByTagName('head').item(0);
			
			onloadEvt = ("onload" in css);
			
			if (onloadEvt) {
				css.onload = function() {
					callback && callback();
					resolve();
				};
			}
				
			head.appendChild(css);
				
			// http://www.backalleycoder.com/2011/03/20/link-tag-css-stylesheet-load-event/
			if (!onloadEvt) {
				
				img = document.createElement('img');
				
				img.onerror = function() {
					callback && callback();
					resolve();
				};
				
				img.src = url;
		    }
		});
	};
	
	var callbackStack = [];
	
	/**
	 * En interne seulement, utiliser la propriété JSYG.include
	 * @private
	 */
	function Include() {}
	
	Include.prototype = {
			
		constructor : Include,
		/**
		 * Liste des fichiers inclus ou à inclure
		 * @type Array
		 */
		files : [],
		/**
		 * Indique si un chargement est en cours
		 * @type Boolean
		 */
		inProgress : false,

		/**
		 * teste si un fichier est déjà chargé ou non
		 * @param file
		 * @returns {Boolean}
		 */
		isIncluded : function(file) {
			
			for (var i=0,N=this.files.length;i<N;i++) {
				if (this.files[i].src == file) return true;
			}
			return false;
		},
		
		/**
		 * Ajoute un fichier à la liste (qui sera chargée à l'appel de la méthode load)
		 * @param file url du fichier (.css ou .js)
		 * @param nocache bool�en, true si on ne veut pas utiliser le cache du navigateur
		 * @returns {Include}
		 */
		add : function(file,nocache) {
			
			var type;
			
			if (this.isIncluded(file)) return this;
						
			if (file.match(/\.css$/)) type = 'css';
			else if (file.match(/\.js$/)) type = 'js';
			else throw new Error(file+' : type de fichier inconnu');
			
			this.files.push({
				src: file,
				nocache:nocache,
				isLoaded:false,
				isPromised:false,
				type:type
			});
						
			return this;
		},
				
		/**
		 * Teste si tous les fichiers ont été chargés
		 * @returns {Boolean}
		 */
		allLoaded : function() {
			
			for (var i=0,N=this.files.length;i<N;i++) {
				if (!this.files[i].isLoaded) return false;
			}
			
			return true;
		},
		
		/**
		 * Charge la liste des fichiers
		 * @param callback fonction à exécuter une fois le chargement terminé
		 * @returns {Include}
		 */	
		load : function(callback) {
			
			var that = this,
				i,N,
				file,files,
				promise,promises = [],
				load = this.load.bind(this);
			
			function fctCallback() { this.isLoaded = true; }
			
			if (callback && (typeof callback == "function")) callbackStack.unshift(callback);
						
			if (this.allLoaded()) {
				
				return new JSYG.Promise(function(resolve) {
					
					setTimeout(function() {
												
						slice.call(callbackStack).forEach(function(callback,i) {
							var ind = callbackStack.indexOf(callback);
							callbackStack.splice(ind,1);
							callback();
						});
						
						if (callbackStack.length !== 0) load(resolve);
						else resolve();
						
					},0);
					
				});
			}
			else {
							
				files = slice.call(this.files);
													
				for (i=0,N=this.files.length;i<N;i++) {
				
					file = files[i];
					
					if (!file.isPromised) {
						
						if (file.type == 'css') promise = JSYG.loadCSSFile(file.src,fctCallback.bind(file),file.nocache);
						else if (file.type == 'js') promise = JSYG.loadJSFile(file.src,fctCallback.bind(file),file.nocache);
						else throw new Error(file.src+" : type de fichier inconnu");
						
						promises.push(promise);
						file.isPromised = true;
					}
				}
								
				if (promises.length) return JSYG.Promise.all(promises).then(load);
				else return new JSYG.Promise(function(resolve) {
					window.setTimeout(function() { load(resolve); },10);
				});
			}
		}
	};
	
	/**
	 * Inclusion à la vol�e de fichiers javascript et css 
	 */
	JSYG.include = new Include();
	
	
	/**
	 * Constructeur standard définissant une liste de fonctions utiles pour les plugins
	 * @returns {JSYG.StdConstruct}
	 */
	JSYG.StdConstruct = function() { };
	
	JSYG.StdConstruct.prototype = {
	
		constructor : JSYG.StdConstruct,
		/**
		 * Permet de définir les propriétés de l'objet et des sous-objets de mani�re r�cursive, sans écraser les objets existants
		 * (seules les propriétés pr�cis�es sont mises à jour)
		 * @param opt objet contenant les propriétés à modifier
		 * @param _cible en interne seulement pour appel r�cursif
		 * @returns {JSYG.StdConstruct}
		 */
		set : function(opt,_cible) {
			
			var cible = _cible || this;
			
			if (!JSYG.isPlainObject(opt)) return cible;
									
			for (var n in opt) {
				if (n in cible) {
					if (JSYG.isPlainObject(opt[n]) && cible[n]) this.set(opt[n],cible[n]);
					else if (opt[n] !== undefined) cible[n] = opt[n];
				}
			}
			
			return cible;
		},
		
		/**
		 * Changement du noeud sur lequel s'applique le plugin
		 * @param arg argument JSYG
		 * @returns {JSYG.StdConstruct}
		 */
		setNode : function(arg) {
			
			var node = new JSYG(arg)[0];
			if (!node) throw new Error(arg+" n'est pas un argument correct pour la méthode setNode : aucun élément DOM renvoyé.");
			
			var enabled = (this.enabled === true);
			if (enabled) this.disable();
			
			this.node = node;
			
			if (enabled) this.enable();
			
			return this;
		},
		
		/**
		 * réinitialisation de toutes les propriétés du plugin
		 * @returns {JSYG.StdConstruct}
		 */
		reset : function() {
						
			var ref = Object.getPrototypeOf ? Object.getPrototypeOf(this) : this.__proto__ ? this.__proto__ : this.constructor.prototype; 
			
			for (var n in ref) {
				if (typeof ref[n] !== 'function') this[n] = ref[n];
			}
				
			return this;
		},

		/**
		 * Ajout d'un écouteur d'évènement.<br/>
		 * Cela permet d'ajouter plusieurs fonctions, elles seront conservées dans un tableau.<br/>
		 * Les doublons sont ignor�s (même évènement même fonction).<br/>
		 * On peut passer en argument un objet avec les évènements en cl�s et les fonctions en valeur.<br/>
		 * Par défaut, le mot cl� this fait référence au noeud DOM sur lequel s'applique le plugin.
		 * @param events type(s) d'évènement (propre à chaque module, 'click', 'start', 'end', etc) séparés par des espaces.
		 * @param fct fonction à exécuter lors du déclenchement de l'évènement
		 * @returns {JSYG.StdConstruct}
		 * @see JSYG.StdConstruct.off
		 */
		on : function(events,fct) {
			
			var p,i,n,N;
					
			if (JSYG.isPlainObject(events) && fct==null) {
				for (n in events) this.on(n,events[n]);
				return this;
			}
			
			if (typeof fct!== 'function') return this;
			
			events = events.split(/\s+/);
						
			for (i=0,N=events.length;i<N;i++) {
				
				p = this['on'+events[i]];
				
				if (p===undefined) throw events[i]+" n'est pas un évènement connu";
				else if (p === false || p === null) p = [fct];
				else if (typeof p == "function") { if (p!==fct) p = [p,fct]; }
				else if (Array.isArray(p)) { if (p.indexOf(fct)===-1)  p.push(fct); }
				else throw new Error(typeof p + "Type incorrect pour la propriété on"+events[i]);
				
				this['on'+events[i]] = p;
			}
			
			return this;
		},
		
		/**
		 * Suppression d'un écouteur d'évènement (Event Listener) de la liste.<br/>
		 * On peut passer en argument un objet avec les évènements en cl�s et les fonctions en valeur.
		 * @param events type(s) d'évènement (propre à chaque module, 'click', 'start', 'end', etc) séparés par des espaces.
		 * @param fct fonction à supprimer
		 * @returns {JSYG.StdConstruct}
		 * @see JSYG.StdConstruct.on
		 */
		off : function(events,fct) {
			
			var p,i,n,N;
			
			if (JSYG.isPlainObject(events) && fct == null) {
				for (n in events) this.off(n,events[n]);
				return this;
			}
			
			if (typeof fct!== 'function') return this;
			
			events = events.split(/\s+/);
						
			for (i=0,N=events.length;i<N;i++) {
				
				p = this['on'+events[i]];
				
				if (p===undefined) throw new Error(event+" n'est pas un évènement connu");
				else if ((typeof p == "function") && p === fct) p = null;
				else if (Array.isArray(p)) { p.splice(p.indexOf(fct),1); }
				else if (p!==null) throw new Error(typeof p + "Type incorrect pour la propriété on"+events[i]);
			}
			
			return this;
		},
		
		/**
		 * Execution d'un évènement donn�
		 * @param event nom de l'évènement
		 * @param context optionnel, objet r�f�renc� par le mot clef "this" dans la fonction, le noeud DOM sur lequel le plugin s'applique par défaut.
		 * Les arguments suivants sont les arguments passés à la fonction (nombre non défini)
		 * @returns {JSYG.StdConstruct}
		 */
		trigger : function(event,context) {
			
			context = context || this.node || null;
			
			var p = this['on'+event],
				returnValue = true,
				i,N;
			
			if (p===undefined) throw new Error(event+" n'est pas un évènement connu");
			else if (p instanceof Function) returnValue = p.apply(context,slice.call(arguments,2));
			else if (p instanceof Array) {
				for (i=0,N=p.length;i<N;i++) {
					if (p[i].apply(context,slice.call(arguments,2)) === false) returnValue = false;
				}
			} 
			else if (p!==null && p!==false) throw new Error(typeof p + "Type incorrect pour la propriété on"+event);
			
			return returnValue;
		},
		
		/**
		 * Active ou désactive le plugin 
		 * @param opt
		 */
		toggle : function(opt) {
			if (this.enabled) this.disable();
			else this.enable(opt);
			return this;
		},
		
		/**
		 * Désactive le plugin et réinitialise les propriétés.
		 */
		destroy : function() {
			this.disable();
			this.reset();
			return this;
		}
		
	};
	
	
	JSYG.Error = function(message) {
		
		Error.call(this,message);
	};
	
	JSYG.Error.prototype = new Error();
	
	JSYG.Error.prototype.toString = function() {
		
		var str = Error.prototype.toString.call(this) + "\n";
		
		for (var n in Error.prototype) str += n+" : "+this[n]+"\n";
		
		return str;
	};
	
	
	
	
	JSYG.param = function(a) {
		
		var s=[],n=null;
		
		for (n in a) {
			
			if (a.hasOwnProperty(n))
				s.push( JSYG.urlencode(n)+"="+JSYG.urlencode(a[n]) );
		}
		
		return s.join( "&" ).replace( /%20/g, "+" );
	};
	
	
	(function() {
		
		var containsNum = /\d/,
			beginsNum = /^\d+/;
	
		JSYG.naturalSort = function naturalSort (a, b) {
		
			a = String(a),
			b = String(b);
						
			var i,N = a.length,aN,bN,charA,charB,test,value=null;
			
			if ( !containsNum.test(a) && !containsNum.test(b) ) value = a.localeCompare(b);
			else {
			
				for (i=0;i<N;i++) {
					
					charA = a.charAt(0);
					charB = b.charAt(0);
					
					if (JSYG.isNumeric(charA)) {
						
						aN = beginsNum.exec(a);
						bN = beginsNum.exec(b);
						
						if (bN) {
							
							aN = aN[0];
							bN = bN[0];
							
							if (aN != bN) {
								value = Number(aN) > Number(bN) ? 1 : -1;
								break;
							}
						}
						else {
							value = -1;
							break;
						}
					}
					
					test = charA.localeCompare(charB);
					
					if (test != 0) {
						value = test;
						break;
					}
										
					a = a.substr(1);
					b = b.substr(1);
				}
			}
			
			return value!== null ? value : 0;
		};
				
	}());
	
	/**
	 * Donne la valeur calculée finale de toutes les propriétés CSS sur le premier élément de la collection.
	 * @returns {Object} objet CSSStyleDeclaration
	 */
	JSYG.prototype.getComputedStyle = function() {
		
		return window.getComputedStyle && window.getComputedStyle(this[0]) || this[0].currentStyle;
	};

	/**
	 * Style par défaut des éléments html
	 */
	var defaultStyles = {};
	
	/**
	 * Renvoie les propriétés de style par défaut du 1er élément de la collection
	 * @returns {Object}
	 */
	JSYG.prototype.getDefaultStyle = function() {
		
		var tag = this.getTag(),
			type = this.getType(),
			elmt,style,i,N,prop;
		
		if (tag == 'a' && type == 'svg') tag = 'svg:a';
		
		if (!defaultStyles[tag]) {
			
			defaultStyles[tag] = {};
			
			elmt = new JSYG('<'+tag+'>');
			style = elmt.getComputedStyle();
			
			for (i=0,N=style.length;i<N;i++) {
				prop = style.item(i);
				defaultStyles[tag][prop] = style.getPropertyValue(prop);
			}
		}
		
		return defaultStyles[tag];
	};			
		
	(function() {
		var scripts = document.getElementsByTagName('script');
		for (var i=0,N=scripts.length;i<N;i++) {
			var main = scripts.item(i).getAttribute('data-main');
			if (main) JSYG.include.add(main);
		}
	}());
	
	if (JSYG.include.files.length > 0) JSYG.include.load();
	
	new JSYG(window).on('load',function() { windowLoaded = true; });
	
	//////////////////////////////////////////////////
	// Pour ces tests, on est obligé d'attendre que le DOM soit pr�t (sinon bug avec IE)
	new JSYG(window).on('DOMContentLoaded',function() {
	
		DOMReady = true;
				
		var jDiv = new JSYG('<div>').text('toto').css('visibility','hidden').appendTo(document.body),
			node = jDiv[0];
				
		// support des transformations 2D
		JSYG.support.twoDimTransf = (function() {
			
			var attr,attributs = JSYG.vendorPrefixes;
			
			for (var i=0;i<attributs.length;i++) {
				attr = attributs[i]+'Transform';
				if (node.style && node.style[attr]!=null) return attr;
			}
			return false;
		})();
				
		//firefox ne répercute pas les transformations 2D d'éléments HTML sur la méthode getBoundingClientRect
		JSYG.support.addTransfForBoundingRect = (function() {
					
			if (!JSYG.support.twoDimTransf) return false;
						
			var rect1 = node.getBoundingClientRect();
			jDiv.rotate(30);
			var rect2 = node.getBoundingClientRect();
			
			if (rect1.left === rect2.left) return true;
			
			jDiv.resetTransf();
			
			return false;
		})();
		
		//IE clone les écouteurs d'évènements quand il clone un objet
		JSYG.support.cloneEvent = true;
			
		if (!node.addEventListener && node.attachEvent && node.fireEvent) {
			node.attachEvent("onclick", function() { JSYG.support.cloneEvent = false;});
			node.cloneNode(true).fireEvent( "onclick" );
		}
		
		//IE déclenche l'évènement input même si on change la valeur d'un champ en javascript
		JSYG.support.inputAutoFireEvent = (function() {
			
			var change = false,
				input = new JSYG('<input>')
					.attr('type','text')
					.on('input',function() { change = true; })
					.appendTo(node);
			
			input[0].value = 'toto';
			
			return change;
			
		}());
			
		JSYG.support.classList = {
			
			html : !!(node.classList && typeof node.classList.add === 'function'),
		
			//classList peut exister sur les éléments SVG mais être sans effet...
			svg : (function() {
				var el = new JSYG('<ellipse>')[0];
				if (!el || !el.classList || !el.classList.add) return false;
				el.classList.add('toto');
				return el.getAttribute('class') === 'toto';
			})()
		};
		
		JSYG.support.inlineBlock = (function() {
			
			var width = jDiv.getDim().width;
			jDiv.css('display','inline-block');
			var width2 = jDiv.getDim().width;
			
			return !(width === width2);
			
		})();
				
		jDiv.remove();
		
		////////////////////////
		//SVG
		JSYG.support.svg = !!svg;
		JSYG.support.svgUseBBox = null;
		JSYG.support.svgUseTransform = null;
		JSYG.support.needReplaceSeg = null;
		JSYG.support.needCloneSeg = null;
		
		if (svg) {
				
			var defs,use,
				id = 'rect'+ Math.random().toString().replace( /\D/g, "" );
		
			defs = new JSYG('<defs>').appendTo(svg);
			
			new JSYG('<rect>').id(id).attr({x:10,y:10,width:10,height:10}).appendTo(defs);
						
			use = new JSYG('<use>').id("use").attr({x:10,y:10}).href('#'+id).appendTo(svg);
						
			document.body.appendChild(svg);
						
			JSYG.support.svgUseBBox = use[0].getBBox().x == 20;
						
			JSYG.support.svgUseTransform = use[0].getTransformToElement(svg).e != 0;

			use.remove();
			defs.remove();			
			document.body.removeChild(svg);
						
			
			var path = new JSYG('<path>').attr('d','M0,0 L10,10')[0];
		
			JSYG.support.needReplaceSeg = (function() {
				
				var seg = path.pathSegList.getItem(1);
				seg.x = 20;
				
				return !(path.pathSegList.getItem(1).x === 20);
				
			})();
			
			
			
			var path2 = new JSYG('<path>').attr('d','M0,0 L10,10')[0];
			
			JSYG.support.needCloneSeg = (function() {
				
				var seg = path.pathSegList.getItem(1);
				path2.pathSegList.appendItem(seg);
				
				return path.pathSegList.numberOfItems === 1;
				
			})();
		}
	});
	
	 if (!window.console) {
		 window.console = { log : function() {} };
	 }
	
})(this);

