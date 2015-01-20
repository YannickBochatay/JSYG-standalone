(function() {
	
	"use strict";
		
	var indexedDB = window.indexedDB || window.webkitIndexedDB || window.mozIndexedDB || window.oIndexedDB || window.msIndexedDB,
		IDBTransaction = window.IDBTransaction || window.webkitIDBTransaction || window.msIDBTransaction,
		IDBKeyRange = window.IDBKeyRange || window.webkitIDBKeyRange || window.msIDBKeyRange;
	
	JSYG.DataBase = function(name) {
		
		this._name = name;
		
		this._db = null;
				
		this._objectStoreName = null;
		
		this.version = 1;
	};
	
	JSYG.DataBase.prototype = new JSYG.StdConstruct();
	
	JSYG.DataBase.prototype.onopen = null;
	
	JSYG.DataBase.prototype.onupgrade = null;
	
	JSYG.DataBase.prototype.onerror = null;
	
	JSYG.DataBase.prototype.onget = null;
	JSYG.DataBase.prototype.onadd = null;
	JSYG.DataBase.prototype.onput = null;
	JSYG.DataBase.prototype.ondelete = null;
		
	JSYG.DataBase.prototype.use = function(objectStoreName) {
		
		this._objectStoreName = objectStoreName;
		
		return this;
	};
	
	JSYG.DataBase.prototype.createQuery = function() {
		
		return new JSYG.DataBase.Query(this,this._objectStoreName);
	};
	
	JSYG.DataBase.prototype.get = function(uniqueID) {
		
		var query = new JSYG.DataBase.Query(this,this._objectStoreName); 
		return query.get(uniqueID);
	};
	
	JSYG.DataBase.prototype.add = function(data) {
		
		var query = new JSYG.DataBase.Query(this,this._objectStoreName); 
		return query.add(data);
	};
	
	JSYG.DataBase.prototype.put = function(data) {
		
		var query = new JSYG.DataBase.Query(this,this._objectStoreName); 
		return query.put(data);
	};
	
	JSYG.DataBase.prototype["delete"] = function(data) {
		
		var query = new JSYG.DataBase.Query(this,this._objectStoreName);
		return query["delete"](data);
	};
		
	JSYG.DataBase.prototype.open = function() {
		
		if (!indexedDB) throw new Error("IndexedDB n'est pas implémenté dans votre navigateur");
		if (!this._name) throw new Error("Aucun nom de base n'a été défini");
		
		var request = indexedDB.open(this._name, this.version),
			that = this;
		
		request.onupgradeneeded = function(e) {
			
		    that._db = e.target.result;
		    that.trigger("upgrade",that._db,e);
		};
		  
		return new JSYG.Promise(function(resolve,reject) {
			 
			request.onsuccess = function(e) {
				that._db = e.target.result;
				that.trigger("open",that._db,e);
				resolve(that._db);
			};

			request.onerror = function(e) {
				that.trigger("error",that._db,e);
				reject(e);
			};
		});		
	};
	
	JSYG.DataBase.prototype["delete"] = function() {
		
		if (!this._name) throw new Error("Aucun nom de base n'a été défini");
		
		var request = indexedDB.deleteDatabase(this._name),
			that = this;
				
		return new JSYG.Promise(function(resolve,reject) {
			 
			request.onsuccess = function(e) {
				that._db = null;
				that.trigger("delete",null,e);
				resolve(e);
			};

			request.onerror = function(e) {
				that.trigger("error",that._db,e);
				reject(e);
			};
		});
	};
	
	JSYG.DataBase.prototype.close = function() {
		
		this._db.close();
	};
	
	JSYG.DataBase.prototype.setSchema = function(schemaFct) {
		
		var that = this;
		
		this.on("upgrade",function(e) {
			schemaFct.call(that._db,e);
		});
	};
		
	
	JSYG.DataBase.Query = function(db,storeObjectName) {
		
		if (!storeObjectName) throw new Error("Il faut définir un nom de storeObject");
		
		this.jdb = db;
		this._db = db._db;
		this._storeObjectName = storeObjectName;
		this._index = null;
		this._bounds = {};
		this._distinct = false;
		this._desc;
		this._first = 0;
		this._nbl = Infinity;
	};
	
	JSYG.DataBase.Query.prototype = new JSYG.StdConstruct();
	
	JSYG.DataBase.Query.prototype.onget = null;
	JSYG.DataBase.Query.prototype.onadd = null;
	JSYG.DataBase.Query.prototype.onput = null;
	JSYG.DataBase.Query.prototype.ondelete = null;
	
	JSYG.DataBase.Query.prototype.index = function(indexName) {
			
		this._index = indexName;
		
		return this;
	};
	
	JSYG.DataBase.Query.prototype.limit = function(min,nbl) {
		
		this._first = min || 0;
		if (nbl) this._nbl = nbl;
		
		return this;
	};
		
	JSYG.DataBase.Query.prototype.lowerBound = function(value,strict) {
			
		this._bounds.min = value;
		this._bounds.minStrict = strict;
		return this;
	};
				
	JSYG.DataBase.Query.prototype.upperBound = function(value,strict) {
			
		this._bounds.max = value;
		this._bounds.maxStrict = strict;
		return this;
	};
		
	JSYG.DataBase.Query.prototype.distinct = function() {
		
		this._distinct = true;
		
		return this;
	};
		
	JSYG.DataBase.Query.prototype.desc = function() {
			
		this._desc = true;
		
		return this;
	};
	
	JSYG.DataBase.Query.prototype.asc = function() {
		
		this._desc = false;
		
		return this;
	};
		
	JSYG.DataBase.Query.prototype._exec = function(commande,data) {
				
		var transaction = this._db.transaction(this._storeObjectName, "readwrite"),
			objectStore = transaction.objectStore(this._storeObjectName),
			promises = [],
			that = this;
				
		function exec(item) {
						
			var request = objectStore[commande](item);
				
			return new JSYG.Promise(function(resolve,reject){
					
				request.onsuccess = function(e) {
					that.jdb.trigger(commande,that._db,e);
					that.trigger(commande,objectStore,e);
					resolve(e.target.result);
				};
					
				request.onerror = function(e) {
					that.jdb.trigger("error",that._db,e);
					that.trigger("error",objectStore,e);
					reject(e);
				};
			});
		}
		
		if (Array.isArray(data)) {
			
			data.forEach(function(item) {
				promises.push(exec(item));
			});
						
			return JSYG.Promise.all(promises);
		}
		else return exec(data);
	};
		
	JSYG.DataBase.Query.prototype.add = function(data) {
			
		return this._exec("add",data);
	};
	
	JSYG.DataBase.Query.prototype.put = function(data) {
		
		return this._exec("put",data);
	};
		
	JSYG.DataBase.Query.prototype["delete"] = function(item) {
			
		if (item) return this._exec("delete",item);
		
		var that = this;
			
		return this.get().then(function(items) {
			return that["delete"](items);	
		});
	};
		
	JSYG.DataBase.Query.prototype.get = function(uniqueID) {
						
		var transaction = this._db.transaction(this._storeObjectName),
			objectStore = transaction.objectStore(this._storeObjectName),
			index = this._index && objectStore.index(this._index),
			keyRange, cursor, request,
			resul = [],
			methodNext,
			cpt = 0,
			that = this;
		
		if (uniqueID) {
			
			request = objectStore.get(uniqueID);
			
			return new JSYG.Promise(function(resolve,reject) {
				
				request.onsuccess = function(e) {
					that.jdb.trigger("get",that._db,e.target.result);
					that.trigger("get",objectStore,e.target.result);
					resolve(e.target.result);
				};
				
				request.onerror = function(e) {
					that.jdb.trigger("error",transaction,e);
					that.trigger("error",transaction,e);
					reject(e);
				};
			});
		}
		
		if (this._bounds.min != null && this._bounds.max != null)
			keyRange = IDBKeyRange.bound( this._bounds.min, this._bounds.max, this._bounds.minStrict || false, this._bounds.maxStrict || false);
		else if (this._bounds.min != null) {
			keyRange = IDBKeyRange.lowerBound( this._bounds.min, this._bounds.minStrict || false);
		}
		else if (this._bounds.max != null) {
			keyRange = IDBKeyRange.upperBound( this._bounds.max, this._bounds.maxStrict || false);
		}
		
		methodNext = (this._desc ? "prev" : "next") + (this._distinct ? "unique" : "");
					
		cursor = (index ? index : objectStore).openCursor(keyRange, methodNext);
					
		cursor.onsuccess = function(e) {
			
			var cursor = e.target.result,
				nbl = resul.length;
			
			if (cursor) {
				
				if (cursor.value) {
										
					if (cpt>=that._first && nbl < that._nbl) {
						resul.push(cursor.value);
						nbl++;
					}
					cpt++;
				}
				
				if (nbl < that._nbl) cursor["continue"]();
			}
		};
		
		return new JSYG.Promise(function(resolve,reject) {
			
			transaction.oncomplete = function() {
				that.jdb.trigger("get",that._db,resul);
				that.trigger("get",objectStore,resul);
				resolve(resul);
			};
			
			transaction.onerror = function(e) {
				that.jdb.trigger("error",that._db,e);
				that.trigger("error",objectStore,e);
				reject(e);
			};
		});
	};
	
	return JSYG.DataBase;
	
}());