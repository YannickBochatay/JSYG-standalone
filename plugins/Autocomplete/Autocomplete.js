JSYG.require("Ajax",'Autocomplete.css','LoadingMask');

(function() {
	
	"use strict";
	
	JSYG.Autocomplete = function(arg,opt) {
		
		this.container = document.createElement('ul');
		
		this.listValues = [];
		
		this.listNodes = [];
		
		this.keyboardCtrls = new KeyboardCtrls(this);
		
		this.ajax = new JSYG.Ajax();
		
		if (arg) this.setNode(arg);
		if (opt) this.enable(opt);
	};
	
	JSYG.Autocomplete.prototype = new JSYG.StdConstruct();
	
	JSYG.Autocomplete.prototype.url = null;
	JSYG.Autocomplete.prototype.autorefresh = true;
	
	JSYG.Autocomplete.prototype.charWildcard = null;
	JSYG.Autocomplete.prototype.strWildcard = null;
	
	JSYG.Autocomplete.prototype.itemProperty = "value";
	
	/**
	 * "contain" (contient la chaîne), "begin" (commence par la chaine), "end" (termine par la chaîne), "is" (correspond exactement)
	 */
	JSYG.Autocomplete.prototype.typeMatch = "contain";
	
	JSYG.Autocomplete.prototype.endWithValue = false;
	
	JSYG.Autocomplete.prototype.caseSensitive = false;
	
	/**
	 * indique si on affiche la liste d'autocomplétion dès le focus du champ input (sinon c'est au clic ou à la saisie)
	 */
	JSYG.Autocomplete.prototype.showOnFocus = false;
		
	JSYG.Autocomplete.prototype.className = 'autocomplete';
	
	JSYG.Autocomplete.prototype.classOptGroup = 'optgroup';
	
	JSYG.Autocomplete.prototype.width = "auto";
	
	JSYG.Autocomplete.prototype.onshow = null;
	JSYG.Autocomplete.prototype.onhide = null;
	JSYG.Autocomplete.prototype.onbeforeselect = null;
	JSYG.Autocomplete.prototype.onselect = null;
		
	JSYG.Autocomplete.prototype._currentItem = -1;
			
	JSYG.Autocomplete.prototype.display = false;
	
	JSYG.Autocomplete.prototype.enabled = false;
	
	JSYG.Autocomplete.prototype.onitem = null;
		
	JSYG.Autocomplete.prototype._addContent = function(list,optgroup) {
				
		var val = this.node.value,
			ul = new JSYG(this.container),
			reg = this.createRegExp(val),
			that = this,
			
			fcts = {
				
				"click" : JSYG.preventDefault,
				
				"mousedown" : function(e){
					e.stopPropagation();
					that.validate(this);
					that.hide();
					that.node.focus();
				},
					
				"mouseover" : function() { that.focusItem(this); }
			};
		
		if (optgroup)
			new JSYG('<li>')
			.classAdd(this.classOptGroup)
			.text(optgroup)
			.on("mousedown",JSYG.stopPropagation)
			.appendTo(ul);
		
		list.forEach(function(item) {
						
			var itemValue = (typeof item == "string") ? item : item [ that.itemProperty ];
			
			itemValue = itemValue || "";
			
			var li = new JSYG('<li>').appendTo(ul),
				html = itemValue.replace(reg,function(st) { return '<strong>'+st+'</strong>'; }),
				a = new JSYG('<a>').html(html)
					.href('#')
					.on(fcts)
					.dataAttr('autocomplete',itemValue)
					.appendTo(li);
			
			that.trigger("item",that.node,a[0],item);
			
			that.listNodes.push(a.node);
		});
				
		return this;
		
	};
		
	JSYG.Autocomplete.prototype._setContent = function(list) {
		
		//on vide le tableau
		this.listNodes.splice(0,this.listNodes.length);
		new JSYG(this.container).empty();
		
		if (Array.isArray(list)) this._addContent(list);
		else if (JSYG.isPlainObject(list)) {
			for (var n in list) this._addContent(list[n],n);
		}
				
		return this;
	};
	
	JSYG.Autocomplete.prototype.focusItem = function(item) {
		
		if (typeof item == 'number') item = this.listNodes[item];
		
		if (!item) throw new Error("Impossible de trouver l'item correpondant");
		
		new JSYG(item).trigger('focus');
		
		this._currentItem = this.listNodes.indexOf(item);
		
		return this;
	};
	
	
	JSYG.Autocomplete.prototype.validate = function(item,preventEvent) {
		
		if (item) this.focusItem(item);
		
		if (this._currentItem < 0 || this._currentItem > this.listNodes.length-1) return this;
		
		var current = this.listNodes[this._currentItem],
			value = new JSYG(current).dataAttr('autocomplete');
		
		if (!this.onbeforeselect || this.trigger('beforeselect',this.node,value)) {
			new JSYG(this.node).val(value,preventEvent);
			this.trigger('select',this.node,value);
		}
		
		return this;
	};
	
	JSYG.Autocomplete.prototype.show = function() {
		
		if (this.display) return this;
		
		var jCont = new JSYG(this.container),
			jNode = new JSYG(this.node),
			dim = jNode.getDim(),
			parent = jNode.offsetParent();
		
		jCont
		.setDim({
			x : dim.x,
			y : dim.y+dim.height,
			width: this.width && this.width != "auto" ? this.width : dim.width
		})
		.appendTo(parent);
				
		this.keyboardCtrls.enable();
				
		this.display = true;
				
		this.trigger('show');
		
		return this;
	};
	
	JSYG.Autocomplete.prototype.hide = function() {
		
		if (!this.display) return this;
				
		new JSYG(this.container).loadingMask("hide").remove();
		
		this.keyboardCtrls.disable();
		
		this.display = false;
		
		this._currentItem = -1;
		
		this.trigger('hide');
				
		return this;
	};
		
	var keys =  ['enter','tab','up-arrow','down-arrow','escape','page-up','page-down'];
	
	JSYG.Autocomplete.prototype._keyboardAction = function(e) {
					
		if (!this.display) return;
		
		if (keys.indexOf(e.keyName) == -1) return this.node.focus();
				
		e.stopPropagation();
		e.preventDefault();
		
		var current = this._currentItem,
			nbNodes = this.listNodes.length;
		
		try {
		
			switch (e.keyName) {
				
				case 'enter' : case 'tab' :
					this.validate();
					this.hide();
					this.node.focus();
					break;
					
				case 'up-arrow' :
					if (current <= 0) current = nbNodes;
					this.focusItem(current-1);
					break;
					
				case 'page-up' :
					if (current == 0) current = nbNodes+4;
					else if (current < 5) current = 5;
					this.focusItem(current-5);
					break;
				
				case 'down-arrow' :
					if (current >= nbNodes-1) current = -1;
					this.focusItem(current+1);
					break;
					
				case 'page-down' :
					if (current == nbNodes-1) current = -5;
					else if (current+5 >= nbNodes-1) current = nbNodes-6;
					this.focusItem(current+5);
					break;
					
					
				case 'escape' :
					this.hide();
					this.node.focus();
					break;
			}
		}
		catch(e) {}
	};
	
	function KeyboardCtrls(autocomplete) {
		
		this.autocomplete = autocomplete;
	}
	
	KeyboardCtrls.prototype = {
			
		enabled : false,
	
		enable : function() {
		
			this.disable();
			
			var keydown = this.autocomplete._keyboardAction.bind(this.autocomplete);
			
			new JSYG(document).on('keydown',keydown);
			
			this.disable = function() {
				new JSYG(document).off('keydown',keydown);
				this.enabled = false;
				return this;
			};
			
			this.enabled = true;
			return this;
		},
		
		disable : function() { return this; }
	};
	
	JSYG.Autocomplete.prototype.getServerData = function(value) {
		
		var ajax = this.ajax,
			that = this;
		
		ajax.abort();
		
		ajax.url = this.url;
		
		if (value != null) ajax.data = 'value='+JSYG.urlencode(value);
		
		return ajax.send().then(function(list) {
			that.listValues = list;
			return list;
		});
	};
	
	JSYG.Autocomplete.prototype.createRegExp = function(value) {
		
		var regStr = this.strWildcard && new RegExp(this.strWildcard,'g'),
			regChar = this.charWildcard && new RegExp(this.charWildcard,'g'),
			testValue = value.replace(regStr,'[\\s\\S]*?').replace(regChar,'[\\s\\S]');
				
		if (this.typeMatch == "begin") testValue = '^'+testValue;
		else if (this.typeMatch == "end") testValue = testValue+'$';
		else if (this.typeMatch == "is") testValue = '^'+testValue+'$';
			
		return new RegExp(testValue, !this.caseSensitive ? 'i' : '');
	};
	
	JSYG.Autocomplete.prototype.filterValues = function(value,_list) {
				
		if (!_list && JSYG.isPlainObject(this.listValues)) {
			
			var list = {};
			
			for (var n in this.listValues) list[n] = this.filterValues(value,this.listValues[n]);
			
			return list;
		}
		
		var regTest = this.createRegExp(value),
			that = this;
		
		_list = _list || this.listValues;
						
		return _list.filter(function(item) {
			
			var str = (typeof item == "string") ? item : item[ that.itemProperty ];
						
			return regTest.test(str);
		});
	};
		
	JSYG.Autocomplete.prototype.process = function(value) {
		
		var jCont = new JSYG(this.container),
			that = this,
			list;
				
		if (this.url && (this.autorefresh || !this.listValues.length)) {
						
			this.show();
			
			jCont.loadingMask("show");
			
			this.getServerData(value)
			.then(function(list) {
				if (!list || !list.length) throw new Error("La liste est vide");
				that._setContent(list);
			})
			['catch'](function() { that.hide(); })
			.then(function() { jCont.loadingMask.hide(); });
		}
		else {
			
			list = this.filterValues(value);
						
			if (list.length) this._setContent(list).show();
			else this.hide();
		}
			
		this._lastPattern = value;
		
		return this;
	};
		
	JSYG.Autocomplete.prototype.enable = function(opt) {
				
		this.disable();
		
		if (opt) this.set(opt);
				
		var jNode = new JSYG(this.node),
			jCont = new JSYG(this.container),
			that = this,
			autocomp = jNode.attr('autocomplete'),
			evtFunctions;
		
		evtFunctions = {
			
			"input" : function(e) {
				
				if (!e.isTrusted) return;
				
				if (!this.value) that.hide();
				else that.process(this.value);
			},
		
			"mousedown" : function(e) {
				
				if (!e.isTrusted || !that.showOnFocus && !new JSYG(this).is(":focus")) return;
				
				if (that.display) that.hide();
				else that.process(this.value);
			}
		};
		
		function hide(e) {	
			if (e.target == that.container || e.target == that.node || new JSYG(e.target).isChildOf(jCont)) return;
			that.hide();
		}
		
		jNode.attr('autocomplete','off');
		
		jCont
		.classAdd(this.className)
		.css({ "font-size":jNode.css('font-size') });
						
		jNode.on(evtFunctions);
		
		new JSYG(document).on('mousedown',hide);
				
		this.disable = function() {
			
			this.hide();
			
			jNode.off(evtFunctions).attr('autocomplete',autocomp);
			
			jCont.empty();
			
			new JSYG(document).off('mousedown',hide);
			
			this.enabled = false;
			
			return this;
		};
		
		this.enable = true;		
		
		return this;
	};
	
	JSYG.Autocomplete.prototype.disable = function() {
		return this;
	};
	
	var plugin = JSYG.bindPlugin(JSYG.Autocomplete);
	
	JSYG.prototype.autocomplete = function() { return plugin.apply(this,arguments); };
	
}());