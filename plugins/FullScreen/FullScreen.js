JSYG.require('FullScreen.css');

(function() {
	
	"use strict";
	
	
	JSYG.FullScreen = function(arg,opt) {
		
		if (arg) this.setNode(arg);
		if (opt) this.enable(opt);
	};
	
	JSYG.FullScreen.prototype = new JSYG.StdConstruct();
		
	JSYG.FullScreen.prototype._prefixes = JSYG.vendorPrefixes.map(function(item){ return item.toLowerCase(); });
	
	JSYG.FullScreen.prototype.onenable = null;
	
	JSYG.FullScreen.prototype.ondisable = null;
	
	JSYG.FullScreen.prototype.onerror = null;
			
	JSYG.FullScreen.prototype.setNode = function(arg) {
		
		var changeEvts = "",
			errorEvts = "",
			that = this,
			oldNode,
			jNode = new JSYG(arg),
			length = this._prefixes.length,
			fcts = {};
		
		this._prefixes.forEach(function(p,i) {
			changeEvts += p+"fullscreenchange";
			errorEvts += p+"fullscreenerror";
			if (i < length - 1) {
				changeEvts+=" ";
				errorEvts+=" ";
			}
		});
		
		if (this.node) {
			oldNode = new JSYG(this.node);
			new JSYG(document).off(oldNode.data("fullscreenevents") );
		}
		
		this.node = jNode.node;
		
		fcts[changeEvts] = function() {
			if (that.enabled) that.trigger("enable");
			else that.trigger("disable");
		};
		
		fcts[errorEvts] = function(e) {
			that.trigger("error",that.node,e);
		};
					
		new JSYG(document).on(fcts);
		
		jNode.data("fullscreenevents",fcts);
		
		return this;
	};
	
	JSYG.FullScreen.prototype.enable = function() {
		
		var that = this;
		
		JSYG.each(this._prefixes,function(i,v) {
			
			var fullMethod = (v == '') ? 'requestFullScreen' : v+'RequestFullScreen';
			
			if (that.node[fullMethod] !== undefined) {
				that.node[fullMethod]();
				return false;
			}
		});
		
		return this;
	};
	
	JSYG.FullScreen.prototype.disable = function() {
				
		JSYG.each(this._prefixes,function(i,v) {
			
			var fullMethod = (v == '') ? 'cancelFullScreen' : v+'CancelFullScreen';
			
			if (document[fullMethod] !== undefined) {
				document[fullMethod]();
				return false;
			}
		});
		
		return this;
	};
	
	JSYG.FullScreen.prototype.toggle = function() {
		
		if (this.enabled) { this.disable(); }
		else { this.enable(); }
		return this;
	};
	
	if (Object.defineProperty) {
		
		try {
		
			Object.defineProperty(JSYG.FullScreen.prototype,"enabled",{
				
				get:function() {
					
					var test=false;
					
					JSYG.each(this._prefixes,function(i,v) {
						
						var prop;
						
						switch(v) {
							case '' : prop = 'fullscreen'; break;
							case 'webkit' :  prop = 'webkitIsFullScreen'; break;
							default : prop = v+'FullScreen'; break;
						}
						
						if (document[prop]) { test = true; return false; }
					});
					
					return test;
				}
			});
			
		} catch(e) {}
	}
	
	var plugin = JSYG.bindPlugin(JSYG.FullScreen);
	
	JSYG.prototype.fullScreen = function() { return plugin.apply(this,arguments); };
	
})();