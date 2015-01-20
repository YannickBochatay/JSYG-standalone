JSYG.require("MultiSelect.css","List","Sortable",function() {
	
	"use strict";
	
	JSYG.MultiSelect = function(arg,opt) {
		
		JSYG.List.call(this);
				
		this.container = document.createElement('div');
		
		this.model = null;
		
		if (arg) this.setNode(arg);
		
		if (opt) this.enable(opt);
	};
	
	JSYG.MultiSelect.prototype = new JSYG.List();
	
	JSYG.MultiSelect.prototype.constructor = JSYG.MultiSelect;
	
	JSYG.MultiSelect.prototype.className = "multiSelect";
				
	JSYG.MultiSelect.prototype.sortable = false;
	
	JSYG.MultiSelect.prototype.separator = ',';
	
	JSYG.MultiSelect.prototype.onitem = null;
	
	JSYG.MultiSelect.prototype.options = null;
		
	JSYG.MultiSelect.prototype.val = function(separator) {
		
		return this.items.join(separator || this.separator);
	};
	
	JSYG.MultiSelect.prototype.enabled = false;
	
	JSYG.MultiSelect.prototype.checkValue = function(value) {
		
		return this.options.indexOf(value) != -1 && this.items.every(function(item) { return item!= value; });
	};
		
	JSYG.MultiSelect.prototype.add = function(value,index,preventEvent) {
						
		if (!this.checkValue(value)) throw new Error(value+" : valeur incorrecte");
		
		var that = this,
			jCont = new JSYG(this.container),
			ul = jCont.find("ul"),
			lis = ul.find("li"),
			li = new JSYG('<li>')
			.classAdd("multiSelection")
			.append("<span>")
			.append(
				new JSYG("<a>")
				.attr({
					href:"#",
					role:"button",
					title:"supprimer"
				})
				.text('X')
			);
				
		if (index == null || !lis.length) ul.append(li);
		else li.insertBefore(lis.eq(index));
		
		if (this.sortable) {
			
			li.sortable({
				list:'.'+this.className+" ul li",
				onsuccess:function(e,oldNode) {
					var oldValue = new JSYG(oldNode).find('span').text(),
						newIndex = that.items.indexOf(oldValue);
					JSYG.List.prototype.move.call(that,value,newIndex);
				}
			});
		}
					
		li.find('a').on("click",function(e) {
			e.preventDefault();
			new JSYG(this.parentNode).remove();
			that._toggleOption(value);
			JSYG.List.prototype.remove.call(that,value);
		});
		
		li.find('span').text(value);
		
		this._toggleOption(value);
				
		JSYG.List.prototype.add.call(this,value,index,preventEvent);
		
		this.trigger("item",this.node,li[0],value);
		
		return this;
	};
	
	JSYG.MultiSelect.prototype._toggleOption = function(value) {
		
		var select = this._findSelect();
		
		select.find("option").each(function() {
			
			var jThis = new JSYG(this);
			
			if (jThis.attr("value") == value || jThis.text() == value) {
				
				if (jThis.attr("disabled")) jThis.attrRemove("disabled");
				else {
					
					jThis.attr("disabled","disabled");
					
					//if (valSelect == value) select[0].selectedIndex++;
				}
				
				return false;
			}
		});
	};
	
	JSYG.MultiSelect.prototype.remove = function(value,preventEvent) {
				
		var indexAndItem = this._getIndexAndItem(value),
			index = indexAndItem.index,
			li = new JSYG(this.container).find("li span").eq(index);
		
		this._toggleOption(value);
		
		JSYG.List.prototype.remove.call(this,value,preventEvent);
		
		if (li) li.parent().remove();
				
		return this;		
	};
	
	JSYG.MultiSelect.prototype.move = function(item,index,preventEvent) {
		
		var indexAndItem = this._getIndexAndItem(item),
			oldIndex = indexAndItem.index,
			lis = new JSYG(this.container).find("li");
		
		JSYG.List.prototype.move.call(this,item,index,preventEvent);
		
		lis.eq(oldIndex).insertBefore( lis.eq(index) );
				
		return this;		
	};
	
	JSYG.MultiSelect.prototype._createContainer = function() {
		
		var jNode = new JSYG(this.node),
			jSelect = jNode.clone().attrRemove("name"),
			jCont = new JSYG(this.container),
			ul = new JSYG('<ul>'),
			that = this,
			firstOption = jNode.find("option:first-child");
		
		this.options = [];
		
		jNode.find("option").each(function(i) {
			that.options.push( this.value || this.textContent );
		});
		
		if (firstOption.attr("value") != "") {
			new JSYG("<option>").prependTo(jSelect);
		}
		
				
		jNode.empty().hide();
		
		jCont
		.classAdd(this.className)
		.replace(this.node)
		.append(ul)
		.append(this.node)
		.append(jSelect);
		
	};
	
	JSYG.MultiSelect.prototype._findSelect = function() {
		
		return new JSYG(this.container).find('select').eq(1);
	};
		
	JSYG.MultiSelect.prototype.enable = function(opt) {
		
		if (this.enabled) this.disable();
		
		if (opt) this.set(opt);
		
		var jNode = new JSYG(this.node),
			valInit = jNode.val(),
			jCont = new JSYG(this.container),
			jSelect,
			that = this;
		
		function updateNodeFct() {
			
			jNode.empty().append(
				new JSYG("<option>").attr({
					selected:"selected",
					value: that.val()
				})
			);
			
			jNode.trigger("change");
		}
		
		this._createContainer();
		
		jSelect = this._findSelect();
				
		jSelect.on({
			"change":function() {
				try {
					that.add(this.value);
					this.selectedIndex = 0;
				}
				catch(e) {}
			}/*,
			"focus":function() { jSelect.classAdd("maximize"); },
			"blur":function() { jSelect.classRemove("maximize"); }*/
		});
		
		if (valInit) {
			that.add(valInit,null,true);
			jSelect[0].selectedIndex = 0;
			updateNodeFct();
		}
		
		jSelect.trigger("blur");
		
		if (!this.onchange) this.onchange = updateNodeFct;
		else if (typeof this.onchange == "function")
			this.onchange = [ updateNodeFct, this.onchange ];
		else if (Array.isArray(this.onchange))
			this.onchange.unshift(updateNodeFct);
				
				
		this.disable = function() {
			
			jSelect.find('option').each(function() {
				that.node.appendChild( this.cloneNode(true) );
			});
			
			new JSYG(this.node).replace(jCont).show();
						
			jCont.empty();
			
			this.off("change",updateNodeFct);
			
			this.options = [];
			
			this.enabled = false;
			
			return this;
		};
				
		this.enabled = true;
		
		return this;
	};
	
	JSYG.MultiSelect.prototype.disable = function() {
		
		return this;
	};
	
	var plugin = JSYG.bindPlugin(JSYG.MultiSelect);
	
	JSYG.prototype.multiSelect = function() { return plugin.apply(this,arguments); };
	
});