JSYG.require('DataBase','Ajax',function() {
	
	"use strict";
	
	var db = null;
	
	function addSlash(url) {
		
		return url.charAt(url.length-1) == '/' ? url : url+'/';
	}
		
	JSYG.Model = function(arg) {
		
		this.attributes = {};
		
		if (arg) this.set(arg,undefined,true);
	};
	
	JSYG.Model.prototype = {
			
		constructor : JSYG.Model,
		
		name : null,
		
		key : "id",
			
		url : null,
		
		sendJSON : true,
		
		onchange : null,
		onsave : null,
		ondestroy : null,
		onfetch : null,
		
		set : function(name,value,_dontTrigger) {
			
			if (JSYG.isPlainObject(name)) {
				
				for (var n in name) this.set(n,name[n],true);
			}
			else if (value === undefined && JSYG.isNumeric(name)) {
				
				this.attributes[this.key] = name;
			}
			else {
			
				this.attributes[name] = value;
			}
			
			if (!_dontTrigger) this.trigger("change",this);
			
			return this;
		},
		
		get : function(name) {
			
			return this.attributes[name];
		},
		
		on : function() { JSYG.StdConstruct.prototype.on.apply(this,arguments); },
		
		off : function() { JSYG.StdConstruct.prototype.off.apply(this,arguments); },
		
		trigger : function() { JSYG.StdConstruct.prototype.trigger.apply(this,arguments); },
		
		_getUrl : function() {
			
			if (typeof this.url == "function") return this.url();
			else if (this.url) {
				var id = this.get(this.key);
				return id ? addSlash(this.url)+id : this.url;
			}
		},
		
		_createQuery : function() {
			
			if (!this.name) throw new Error("Le nom du modèle n'a pas été défini.");
			
			if (!db) db = new JSYG.DataBase("ModelesJSYG").open();
			
			return db.use(this.name).createQuery();
		},
		
		save : function() {
			
			var that = this,
				id = this.get(this.key),
				url = this._getUrl(),
				ajax,
				promise;
			
			if (url) {
				
				ajax = new JSYG.Ajax({
					url : url,
					method: id ? "PUT" : "POST"
				});
				
				if (this.sendJSON) {
					//An attempt was made to use an object that is not, or is no longer, usable
					//ajax._headers["Content-Type"] = "application/json";
					ajax.data = JSON.stringify(this.attributes);
				}
				else ajax.addData(this.attributes);
				
				promise = ajax.send();
			}
			else {
				
				if (!this.name) throw new Error("Le nom du modèle n'a pas été défini.");
				
				promise = this._createQuery()[ id ? "put" : "add"](this.attributes);
			}
						
			return promise.then(function(id) {
				if (id) that.attributes[that.key] = id;
				that.trigger("save",that,id);
				return id;
			});
		},
		
		fetch : function() {
			
			var that = this,
				id = this.get(this.key),
				url = this._getUrl(),
				promise;
			
			if (!id) throw new Error("La clef n'a pas été définie.");
			
			if (url) {
				
				promise = JSYG.Ajax({
					url : url,
					method : "GET"
				});
			}
			else promise = this._createQuery().get(id);
		
			return promise.then(function(properties) {
				that.set(properties,undefined,true);
				that.trigger("fetch",that,properties);
				return properties;
			});
		},
		
		destroy : function() {
			
			var that = this,
				id = this.get(this.key),
				url = this._getUrl(),
				promise;
			
			if (!id) throw new Error("la clef n'a pas été définie.");
		
			if (url) {
				
				promise = JSYG.Ajax({
					url : url,
					method : "DELETE"
				});
			}
			else promise = this._createQuery()["delete"](id);
			
			return promise.then(function() {
				that.attributes[that.key] = null;
				that.trigger("destroy",that);
			});
		}
	};
	
});