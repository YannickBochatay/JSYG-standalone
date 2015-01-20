(function() {
	
	"use strict";
	
	/**
	 * Requetes ajax.<br/><br/>
	 * Dans tous les évènements ("onload","onabort","onend"), this fait référence à l'objet XMLHttpRequest.<br/>
	 * @param options optionnel, objet définissant les options.<br/>
	 * Si options est une chaîne, elle sera considérée comme l'url de la requête
	 * Si le constructeur est appelé sans le mot clef new et que le paramètre options est défini,
	 * la requête est exécutée implicitement et la fonction renvoie une promesse (voir exemple)
	 * @returns {JSYG.Ajax}
	 * @example <pre>var req = new JSYG.Ajax();
	 * req.url = "monScript.php";
	 * req.on('success',function() { alert(this.responseText); }
	 * req.send();
	 * 
	 * //équivalent à 
	 * new JSYG.Ajax({
	 * 	url:"monScript.php",
	 * 	onsuccess : function() { alert(this.responseText); }
	 * }).send();
	 * //renvoie une instance de JSYG.Ajax
	 * 
	 * //équivalent à 
	 * JSYG.Ajax({
	 * 	url:"monScript.php",
	 * 	onsuccess : function() { alert(this.responseText); }
	 * });
	 * //mais renvoie une instance de JSYG.Promise (promesse)
	 * 
	 * //équivalent à
	 * JSYG.Ajax("monScript.php").then(function(text) { alert(text); });
	 */
	JSYG.Ajax = function(options) {

		if (!(this instanceof JSYG.Ajax)) {
			if (!options) return new JSYG.Ajax();
			else return new JSYG.Ajax(options).send();
		}
		/**
		 * entêtes http
		 */
		this._headers = {};
				
		if (options) {
			
			if (typeof options === 'string') options = {url:options};
			return this.set(options);
		}
	};
	
	function URLdelimiter(url) { return (url.indexOf('?') == -1) ?  '?' : '&'; }
	
	JSYG.Ajax.prototype = new JSYG.StdConstruct();
	
	JSYG.Ajax.prototype.constructor = JSYG.Ajax; 
	
	/**
	 * url de la requête
	 */
	JSYG.Ajax.prototype.url = null;
	/**
	 * méthode http de la requête (GET, POST, PUT, DELETE, etc)
	 * @link http://www.w3.org/Protocols/rfc2616/rfc2616-sec9.html
	 */
	JSYG.Ajax.prototype.method = 'GET';
	/**
	 * données à envoyer.
	 * @type
	 * <ul>
	 * <li>chaîne de caractères de type champ1=valeur1&champ2=valeur2</li>
	 * <li>objet avec en clefs les noms des champs et en valeurs les valeurs des champs</li>
	 * <li>objet FormData</li>
	 * </ul>
	 * @link https://developer.mozilla.org/fr/DOM/File
	 * @link https://developer.mozilla.org/en/DOM/FileList
	 * @link https://developer.mozilla.org/en/Ajax/FormData
	 */
	JSYG.Ajax.prototype.data = null;
	/**
	 * Format d'envoi des données (urlencoded,json,text,formData,binary)
	 */
	JSYG.Ajax.prototype.dataType = "urlencoded";
	/**
	 * Format de réponse (optionnel) text, xml, json, jsonp. Si non précisé, tentera json puis xml et enfin text.
	 */
	JSYG.Ajax.prototype.format = null;
	/**
	 * Utilisation ou non du cache pour la requête
	 */
	JSYG.Ajax.prototype.cache = true;
	/**
	 * Timeout (en ms) au delà duquel la requête sera abandonnée (null pour pas de timeout)
	 */
	JSYG.Ajax.prototype.timeout = null;
	/**
	 * Fonctions à exécuter au lancement de la requête
	 */
	JSYG.Ajax.prototype.onstart = null;
	/**
	 * Fonctions à exécuter quand la requête change d'état
	 */
	JSYG.Ajax.prototype.onchange = null;
	/**
	 * Fonctions à exécuter pendant le téléchargement du résultat de la requête
	 */
	JSYG.Ajax.prototype.onprogress = null;
	/**
	 * Fonctions à exécuter à l'annulation de la requête
	 */
	JSYG.Ajax.prototype.onabort = null;
	/**
	 * Fonctions à exécuter en cas d'erreur ( (statut < 200 || statut >= 300) && statut != 304)
	 */
	JSYG.Ajax.prototype.onerror = null;
	/**
	 * Fonctions à exécuter lorsque la requête est terminée ou abandonnée.
	 */
	JSYG.Ajax.prototype.onend = null;
	/**
	 * Fonctions à exécuter lorsque la requête s'est correctement déroulée (statut >= 200 && statut < 300 || statut == 304)
	 */
	JSYG.Ajax.prototype.onsuccess = null;
	/**
	 * Fonctions à exécuter lorsque la requête est terminée (quel que soit le statut http)
	 */
	JSYG.Ajax.prototype.onload = null;
	/**
	 * Fonctions à exécuter pendant le téléversement des données à envoyer
	 */
	JSYG.Ajax.prototype.onuploadprogress = null;
	/**
	 * Fonctions à exécuter lorsque les données ont été téléverser
	 */
	JSYG.Ajax.prototype.onuploadload = null;
	/**
	 * Ajout d'une entête http
	 * @param name nom de l'entête
	 * @param value valeur de l'entête
	 * @example <pre>var req = new JSYG.Ajax();
	 * req.header('Content-Type','application/json');
	 */
	JSYG.Ajax.prototype.addHeader = function(name,value) {
		this._headers[name] = value;
		return this;
	};
	/**
	 * Annulation de la requête
	 */
	JSYG.Ajax.prototype.abort = function() {
		
		if (!this.req) return;
		
		this.req.abort();
		this.trigger('end',this.req);
		this.trigger('abort',this.req);
		
		return this;
	};
	
	/**
	* Ajoute une donnée à transmettre
	* @param name nom du champ. On peut également passer un objet avec en clefs les noms et en valeurs les valeurs.
	* @param value valeur du champ (chaîne)
	*/
	JSYG.Ajax.prototype.addData = function(name,value) {
		
		var i;
		
		if (JSYG.isPlainObject(name) && value == null) {
			for (i in name) this.addData(i,name[i]);
			return this;
		}
		
		if (!this.data) this.data = {};
		
		this.data[name] = value;
		
		return this;
	};
	
	JSYG.Ajax.prototype._processData = function() {
				
		if (!this.data) return '';
		
		if (["POST","PUT"].indexOf(this.method.toUpperCase()) == -1)
			return (typeof this.data == "string") ? this.data : JSYG.param(this.data);
		
		switch (this.dataType) {
		
			case "formData" :
				
				var formData = new FormData();
				
				if (!JSYG.isPlainObject(this.data))
					throw new TypeError( (typeof this.data)+" : type incorrect pour dataType formData");
				
				for (var n in this.data) formData.append(n,this.data[n]);
				
				this.addHeader('Content-Type','multipart/form-data');
				return formData;
				
			case "text" :
				this.addHeader('Content-Type','text/plain');
				return this.data;
				
			case "json" :
				this.addHeader('Content-Type','application/json');
				return JSON.stringify(this.data);
				
			case "binary":
				if (typeof this.data != "string")
					throw new TypeError( (typeof this.data)+" : type incorrect pour dataType binary");
				return this.data;
			
			default : {
				this.addHeader('Content-Type', 'application/x-www-form-urlencoded');
				return (typeof this.data == "string") ? this.data : JSYG.param(this.data);
			}
		}
		
	};
	
	JSYG.Ajax.prototype._processResponse = function(resolve,reject) {
				
		var content = null,
			req = this.req,
			error;
		
		this.trigger('change',req);

		if (req.readyState !== 4) return;
		
		if (this._timeout) {
			window.clearTimeout(this._timeout);
			this._timeout = null;
		}
				
		this.trigger('end',req);
		
		switch (this.format) {
		
			case "text" : content = req.responseText; break;
			
			case "xml" :
				
				if (!req.responseXML.documentElement) {
					reject(new Error("la réponse n'est pas au format XML : "+req.responseText));
					return false;
				}
				
				content = req.responseXML.documentElement;
				
				break;
				
			case "json" :
				
				try { content = JSON.parse(req.responseText); }
				catch(e) {
					
					reject(new Error("la réponse n'est pas au format JSON : "+req.responseText));
					return false;
				}
				
				break;
				
			default :
				
				try { content = JSON.parse(req.responseText); }
				catch(e) {
					
					if (/^<\?xml /.test(req.responseText) && req.responseXML.documentElement)
						content = req.responseXML.documentElement;
					else
						content = req.responseText;
				}
		}
		
		this.trigger('load',req,content);
				
		if (req.status >= 200 && req.status < 300 || req.status === 304) {
			
			this.trigger('success',req,content);
			resolve(content,req);
		}
		else {
			
			if (!content) content = req.statusText;
			this.trigger('error',req,content);
			
			error = new JSYG.AjaxError(content,req.status,req.statusText);
			reject(error);
		}
	};
	
	var nameFctJSONP = "JSYGJSONP" + Math.random().toString().replace( /\D/g, "" ),
		JSONPCounter = 0;
		
	/**
	 * Soumission de la requête
	 * @param opt optionnel, objet définissant les options
	 */
	JSYG.Ajax.prototype.send = function(opt) {
		
		if (opt) this.set(opt);
		
		var that = this,
			url = this.url,
			callbackName,
			regCallback,
			matches,
			data = that._processData();
		
		if (!this.format || this.format == "jsonp") {
			
			regCallback = /callback=(\?|\w+)($|&)/;
			
			matches = url.match(regCallback);
						
			if (matches || this.format == "jsonp") {
			
				if (!matches || matches[1] == '?') {
										
					callbackName = nameFctJSONP + (JSONPCounter++);
					window[callbackName] = function(response) { that.trigger("success",null,response); };
					
					if (matches) url = url.replace(regCallback,'callback='+callbackName);
					else url = url + URLdelimiter(url) + 'callback='+callbackName;
				}
				
				url+= URLdelimiter(url) + data;
				
				this.req = null;
				
				return JSYG.loadJSFile(url, null, true);
			}
		}
		
		if (this.req) this.abort(); //si une requête a déjà été lancée.
		
		this.req = new XMLHttpRequest(); //pour IE on est obligé de réinstancier à chaque requête.
		
		return new JSYG.Promise(function(resolve,reject) {
		
			var method = that.method.toUpperCase(),
				i, req = that.req;
											
			if (that.binary) method = 'POST';
								
			if (req.overrideMimeType) req.overrideMimeType('text/xml');
						
			if (method == 'GET' && data) {
				url+= URLdelimiter(url) + data;
				data = null;
			}
					
			if (!that.cache) url += URLdelimiter(url)+Math.random();
				
			if (that.onprogress) req.onprogress = function(e) { that.trigger('progress',req,e); };
			
			if (req.upload) {
				if (that.onuploadprogress) {
					req.upload.onprogress = function(e) {
						var percent = e.lengthComputable && Math.round((e.loaded * 100) / e.total);
						that.trigger('uploadprogress',that.req,e,percent);
					};
				}
				if (that.onuploadload) req.upload.onload = function(e) { that.trigger('uploadload',that.req,e); };
			}
			
			req.onreadystatechange = that._processResponse.bind(that,resolve,reject);
			req.onabort = reject;
										
			req.open(method, url, true);
			
			//entêtes http
			for (i in that._headers) req.setRequestHeader(i,that._headers[i]);
			
			that.trigger('start',req);
			
			if (that.dataType == "binary") req.sendAsBinary(data);
			else req.send(data);
			
			if (that.timeout) {
				that._timeout = window.setTimeout(reject,that.timeout);
			}
		});
	};
	
		
	JSYG.AjaxError = function(message,status,statusText) {
		
		Error.call(this,message);
		this.status = status;
		this.statusText = statusText;
		this.message = message;
	};
	
	JSYG.AjaxError.prototype = new Error();
	
	JSYG.AjaxError.prototype.toString = function() {
		
		return this.message;
	};
	
}()); 