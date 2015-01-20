JSYG.require("Ajax");

(function() {
	
	"use strict";
	
	JSYG.List = function() {
		
		this.items = [];
		
		this.model = Object;
	};
	
	JSYG.List.prototype = new JSYG.StdConstruct();
	
	JSYG.List.prototype.constructor = JSYG.List;
	
	JSYG.List.prototype.onadd = null;
	JSYG.List.prototype.onremove = null;
	JSYG.List.prototype.onmove = null;
	JSYG.List.prototype.onchange = null;
		
	JSYG.List.prototype.uniqueItems = false;
		
	JSYG.List.prototype.setItems = function(items) {
		
		var that = this;
		
		this.empty();
		
		items.forEach(function(item) { that.add(item); });
		
		return this;
	};
		
	JSYG.List.prototype._getIndexAndItem = function(itemOrIndex) {
		
		var item,index;
		
		if (typeof itemOrIndex != "number") {
			
			if (!this.model || (itemOrIndex instanceof this.model)) {
				
				index = this.items.indexOf(itemOrIndex);
				item = itemOrIndex;
			}
			else {
				try { item = new this.model(itemOrIndex); }
				catch(e) { throw new Error("L'item n'est pas instance de "+this.model); }
				
				index = this.items.indexOf(item);
			}
		}
		else {
			
			index = itemOrIndex < 0 ? this.items.length + itemOrIndex : itemOrIndex;
			item = this.items[index];
		}
				
		return {
			index:index,
			item:item
		};
	};
	
	
	JSYG.List.prototype.add = function(item,index,preventEvent) {
		
		var indexAndItem = this._getIndexAndItem(item);
		
		item = indexAndItem.item;
				
		if (this.uniqueItems && indexAndItem.index != -1)
			throw new Error("Cet item est déjà dans la liste");
		
		if (index == null) {
			index = this.items.push(item);
			index--;
		}
		else {
			if (index < 0) index = this.items.length + index;
			this.items.splice(index,0,item);
		}
		
		if (!preventEvent) {
			
			this.trigger("change", this, item, index );
			this.trigger("add", this, item, index );
		}
		
		return this;
	};
	
	JSYG.List.prototype.move = function(item,index,preventEvent) {
		
		var indexAndItem = this._getIndexAndItem(item);
		
		if (indexAndItem.index == -1) throw new Error("Cet item n'est pas dans la liste");
		
		item = indexAndItem.item;
		
		if (index < 0) index = this.items.length + index;
				
		if (indexAndItem.index == index) return this;
		
		this.items.splice(indexAndItem.index,1);
		this.items.splice(index,0,item);
				
		if (!preventEvent) {
			
			this.trigger("change", this, item, index );
			this.trigger("move", this, item, index);
		}
		
		return this;
	};
	
	JSYG.List.prototype.remove = function(item,preventEvent) {
		
		var indexAndItem = this._getIndexAndItem(item),
			index = indexAndItem.index;
		
		item = indexAndItem.item;
		
		if (index == -1) throw new Error("Cet item n'est pas dans la liste");
				
		this.items.splice(index,1);
				
		if (!preventEvent) {
			
			this.trigger("change", this, item, index );
			this.trigger("remove", this, item, index);
		}
			
		return this;
	};
	
	JSYG.List.prototype.empty = function() {
		
		while (this.items.length) this.remove(-1);
		
		return this;
	};
	
	JSYG.List.prototype.get = function(index) {
		
		if (!JSYG.isNumeric(index)) throw new TypeError(typeof index + " : l'argument doit être numérique");
		
		if (index < 0) index = this.items.length + index;
		
		return this.items[index];
	};
	
	JSYG.List.prototype.sort = function(fct) {
		
		this.items.sort(fct);
		
		return this;
	};
	
}());