JSYG.require("MultiInput.css","List","Sortable","Autocomplete",function() {
	
	"use strict";
	
	JSYG.MultiInput = function(arg,opt) {
		
		JSYG.List.call(this);
				
		this.container = new JSYG('<div>').node;
		
		this.autocomplete = new JSYG.Autocomplete();
				
		this.model = null;
		
		if (arg) this.setNode(arg);
		
		if (opt) this.enable(opt);
	};
	
	JSYG.MultiInput.prototype = new JSYG.List();
	
	JSYG.MultiInput.prototype.constructor = JSYG.MultiInput;
	
	JSYG.MultiInput.prototype.className = "multiInput";
		
	JSYG.MultiInput.prototype.autoValidate = false;
	/**
	 * Indique si la valeur du champ doit nécessairement correspondre à une valeur de la liste d'autocomplétion ou non
	 */
	JSYG.MultiInput.prototype.strictList = true;
		
	JSYG.MultiInput.prototype.sortable = false;
	
	JSYG.MultiInput.prototype.separator = ',';
	
	JSYG.MultiInput.prototype.onitem = null;
	
	JSYG.MultiInput.prototype._listValues = true;
			
	JSYG.MultiInput.prototype.val = function(separator) {
		
		return this.items.join(separator || this.separator);
	};
	
	JSYG.MultiInput.prototype.enabled = false;
	
	JSYG.MultiInput.prototype.checkValue = function(value) {
						
		if (this.uniqueItems && this.items.indexOf(value) != -1) return false;
		
		if (!this.strictList || !this.autocomplete) return true;
		
		if (!this.autocomplete.listValues.length) return true;
				
		var type = this.autocomplete.typeMatch;
		
		this.autocomplete.typeMatch = "contain";
		
		var regExp = this.autocomplete.createRegExp(value),
			regTest = new RegExp('^'+regExp.source+'$'),
			list = this.autocomplete.listValues,
			i=0,N=list.length,val;
		
		this.autocomplete.typeMatch = type;
								
		for (;i<N;i++) {
			
			val = (typeof list[i] == "string") ? list[i] : list[i][ this.autocomplete.itemProperty ];

			if (regTest.test(val)) return true;
		}
		
		return false;
	};
	
	JSYG.MultiInput.prototype._removeValues = function(value) {
						
		var tabValues = this.autocomplete.filterValues(value),
			list = this.autocomplete.listValues,
			i,N;
		
		for (i=0,N=tabValues.length ; i<N ; i++) {
		
			value = tabValues[i];
			list.splice(list.indexOf(value),1);
		}
		
		if (tabValues.length) this.autocomplete._setContent(list);
						
		return this;
	};
	
	JSYG.MultiInput.prototype._restoreValues = function(value) {
		
		this.autocomplete.listValues = this._listValues.slice();
		
		this.items.forEach(this._removeValues.bind(this));
				
		return this;
	};
		
	JSYG.MultiInput.prototype.add = function(value,index,preventEvent) {
				
		if (!this.checkValue(value)) throw new Error(value+" : valeur incorrecte");
		
		if (this.uniqueItems) this._removeValues(value);
		
		var that = this,
			jCont = new JSYG(this.container),
			ul = jCont.find("ul"),
			lis = ul.find("li"),
			li = new JSYG('<li>')
			.classAdd("multiInputSelection")
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
			
			JSYG.List.prototype.remove.call(that,value);
			
			if (that.uniqueItems) that._restoreValues();
		});
		
		li.find('span').text(value);
				
		JSYG.List.prototype.add.call(this,value,index,preventEvent);
		
		this.trigger("item",this.node,li[0],value);
		
		return this;
	};
	
	JSYG.MultiInput.prototype.remove = function(value,preventEvent) {
				
		var indexAndItem = this._getIndexAndItem(value),
			index = indexAndItem.index,
			li = new JSYG(this.container).find("li span").eq(index);
		
		JSYG.List.prototype.remove.call(this,value,preventEvent);
		
		if (li) li.parent().remove();
				
		return this;		
	};
	
	JSYG.MultiInput.prototype.move = function(item,index,preventEvent) {
		
		var indexAndItem = this._getIndexAndItem(item),
			oldIndex = indexAndItem.index,
			lis = new JSYG(this.container).find("li");
		
		JSYG.List.prototype.move.call(this,item,index,preventEvent);
		
		lis.eq(oldIndex).insertBefore( lis.eq(index) );
				
		return this;		
	};
	
	JSYG.MultiInput.prototype._createContainer = function() {
		
		var jNode = new JSYG(this.node),
			jInput = jNode.clone().attrRemove("name","list").val(""),
			jCont = new JSYG(this.container),	
			ul = new JSYG('<ul>');
	
		jNode.hide();
		
		jCont
		.classAdd(this.className)
		.replace(this.node)
		.append(ul)
		.append(this.node)
		.append(jInput);
		
	};
		
	JSYG.MultiInput.prototype.enable = function(opt) {
		
		if (this.enabled) this.disable();
		
		if (opt) this.set(opt);
		
		var that = this,
			jNode = new JSYG(this.node),
			idListe = jNode.attr("list"),
			event = this.autoValidate ? "input" : "change",
			jCont,jInput,
			liste = (function() {
				
				if (!idListe) return null;
				
				var selector = 'datalist#'+idListe,
					liste;
				
				liste = new JSYG(selector);
				
				if (liste.length == 0) liste = jNode.parent().find(selector);
				
				return liste.length == 1 ? liste : null;
				
			}()); 
		
		this._createContainer();
		
		jCont = new JSYG(this.container);
		jInput = jCont.find('input').eq(1);
		
		
		function onFocus() { jInput.trigger("focus"); }
		
		jCont.on("click",onFocus);
	
		function onInput() {
			
			try {
				that.add(this.value);
				this.value = "";
				this.blur();
				this.focus();
			}
			catch(e) { }
		}
		
		jInput.on(event,onInput);
		event = null;
		
		if (this.autocomplete) {
			
			if (liste && !this.autocomplete.listValues.length) {
				
				liste.find("option").each(function() {
					
					that.autocomplete.listValues.push(this.value || this.textContent);
				});
			}
						
			liste = null;
			
			jNode.attrRemove("list");
			
			this.autocomplete.setNode(jInput).enable();
			
			this._listValues = this.autocomplete.listValues.slice();
		}
		
		
		if (this.node.value) {
			
			this.node.value.split(this.separator).forEach(function(item) {
				that.add(item,null,true);
			});
		}
		
		function updateNodeFct() {
			new JSYG(that.node).val( that.val() );
		}
		
		if (!this.onchange) this.onchange = updateNodeFct;
		else if (typeof this.onchange == "function")
			this.onchange = [ updateNodeFct, this.onchange ];
		else if (Array.isArray(this.onchange))
			this.onchange.unshift(updateNodeFct);
		
		this.disable = function() {
			
			jNode.replace(jCont).show();
			
			if (idListe) jNode.attr("list",idListe);
			
			jCont.empty().off("click",onFocus);
			
			this.off("change",updateNodeFct);
			
			if (this.autocomplete) {
				
				this.autocomplete.disable();
				this._listValues = this._listValues.splice(0, this._listValues.length);
			}
			
			
			this.enabled = false;
			
			return this;
		};
				
		this.enabled = true;
		
		return this;
	};
	
	JSYG.MultiInput.prototype.disable = function() {
		
		return this;
	};
	
	var plugin = JSYG.bindPlugin(JSYG.MultiInput);
	
	JSYG.prototype.multiInput = function() { return plugin.apply(this,arguments); };
	
});