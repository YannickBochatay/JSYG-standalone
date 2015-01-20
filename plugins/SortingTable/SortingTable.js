JSYG.require("Ajax","SortingTable.css");

(function() {
	
	"use strict";
		
	function getFromIndex(node,ind) {
			
		return new JSYG(node).children().eq(ind)[0].textContent;
	}
	
	JSYG.SortingTable = function(node,opt) {
				
		if (node) this.setNode(node);
		
		if (opt) this.enable(opt);
	};
	
	JSYG.SortingTable.prototype = new JSYG.StdConstruct();
	
	JSYG.SortingTable.prototype.constructor = JSYG.SortingTable;
	
	JSYG.SortingTable.prototype.onsort = null;
	
	JSYG.SortingTable.prototype.enabled = false;
	
	JSYG.SortingTable.prototype.excludeLastLine = false;
	
	JSYG.SortingTable.prototype.field = null;
	
	JSYG.SortingTable.prototype.direction = "asc";
	
	JSYG.SortingTable.prototype.naturalSort = true;
	
	JSYG.SortingTable.prototype._lastLine = null;
	
	JSYG.SortingTable.prototype._getValue = function(arg) {
		
		var node,value;
				
		if (!this.field) {
			
			if (!(arg instanceof HTMLElement)) throw new Error("Il faut définir la propriété field");
			
			value = getFromIndex(arg,this._index);
		}
		else {
			
			if (arg instanceof HTMLElement) {
				
				node = arg.querySelector("."+this.field);
				
				if (node) value = node.textContent;
				else value = getFromIndex(arg,this._index);
			}
			else value = arg[this.field];
		}
		
		return value;
	};
	
	JSYG.SortingTable.prototype.sortingFunction = function(a,b) {
				
		var valA = this._getValue(a),
			valB = this._getValue(b),
			ind;
		
		if (this.naturalSort) ind = JSYG.naturalSort(valA,valB);
		else {
			if (valA < valB) ind = -1;
			else if (valA > valB) ind = 1;
			else ind = 0;
		}
		
		return this.direction == "asc" ? ind : -ind;
	};
	
	JSYG.SortingTable.prototype.sort = function(field,direction) {
									
		var table = new JSYG(this.node),
			tbody = table.find("tbody"),
			trs = tbody.find('tr').toArray();
					
		if (field) this.field = field;
		
		if (direction) {
			if (["asc","desc"].indexOf(direction) == -1) throw new Error(direction+" n'est un pas un sens correct");
			this.direction = direction;
		}
						
		this._flipButtons();
		
		tbody.remove().empty();
			
		trs.sort(this.sortingFunction).forEach( tbody[0].appendChild.bind(tbody[0]) );
		
		if (this.excludeLastLine) tbody.append(this._lastLine);
		
		table.append(tbody);
							
		this.trigger("sort");
		
		return this;
	};
	
	JSYG.SortingTable.prototype._flipButtons = function() {
		
		new JSYG(this.node).find("thead th svg")[ this.direction == "desc" ? "classAdd" : "classRemove" ]("reverse");
	};
	
	JSYG.SortingTable.prototype._createButton = function(th) {
		
		th = new JSYG(th);
		
		var index = new JSYG(this.node).find("thead th").indexOf(th),
			field = th.dataAttr("sort"),
			a =  new JSYG("<a>").href("#"),
			that = this;
		
		a.on("click",function(e) {
			
			e.preventDefault();
			
			that.field = field;
				
			that._index = index;
			
			that.direction = (that.direction == "asc") ? "desc" : "asc";
			
			that._flipButtons();
			
			that.sort();
		});
		
		a.append(
			new JSYG("<svg>").attr({width:10,height:10}).append(
				new JSYG("<polygon>").attr("points","1,9 5,1 9,9")
			)
		);
		
		a.textAppend(" "+th.text());
		
		th.empty().append(a);
	};
			
	JSYG.SortingTable.prototype.enable = function(opt) {
		
		if (!this.node) throw new Error("Il faut définir la table");
		
		var table = new JSYG(this.node);
				
		if (this.enabled) this.disable();
		
		if (opt) this.set(opt);
		
		this.enabled = true;
			
		this._lastLine = table.find("tbody tr:last-child")[0];
						
		table.find("thead th[data-sort]").toArray().forEach(this._createButton.bind(this));
		
		this.sortingFunction = this.sortingFunction.bind(this); 
		
		this._flipButtons();
		
		this.enabled = true;
		
		return this;
	};
		
	JSYG.SortingTable.prototype.disable = function() {
	
		new JSYG(this.node).find("thead").find("[data-sort]").each(function() {
			this.textContent = this.textContent;
		});
		
		this.enabled = false;
		
		return this;
	};
	
	var plugin = JSYG.bindPlugin(JSYG.SortingTable);
	
	JSYG.prototype.sortingTable = function() { return plugin.apply(this,arguments); };
	
})();