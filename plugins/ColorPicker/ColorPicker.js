JSYG.require('Color','Draggable','ColorPicker.css');

(function() {
	
	"use strict";
	
	var path = JSYG.require.baseURL+'/ColorPicker/img';
	
	var imgs = {
		cursor : path+"/position.png", 
		crosshair : path+"/crosshairs.png",
		h : path+"/h.png",
		sv : path+"/sv.png"
	};
		
	JSYG.ColorPicker = function(arg,opt) {
		
		if (!arg) arg = '<div>';
		
		this.container = new JSYG(arg).node;
		
		if (opt) this.set(opt);
	};
	
	JSYG.ColorPicker.prototype = new JSYG.StdConstruct();
	
	JSYG.ColorPicker.prototype.constructor = JSYG.ColorPicker;
	
	/**
	 * Classe appliquée au conteneur
	 */
	JSYG.ColorPicker.prototype.className = 'colorPicker';
	
	JSYG.ColorPicker.prototype.rgbInput = false;
	JSYG.ColorPicker.prototype.hsvInput = false;
	JSYG.ColorPicker.prototype.cmykInput = false;
	
	JSYG.ColorPicker.prototype.transparentInput = false;
	
	JSYG.ColorPicker.prototype.transparentValue = "none";
	/**
	 * fonction(s) � ex�cuter quand on enclenche le bouton souris (�v�nement mousedown)
	 */
	JSYG.ColorPicker.prototype.onstart = null;
	/**
	 * fonction(s) � ex�cuter pendant le cliquer/glisser
	 */
	JSYG.ColorPicker.prototype.ondrag = null;
	/**
	 * fonction(s) � ex�cuter au rel�chement de la souris
	 */
	JSYG.ColorPicker.prototype.onend = null;
	/**
	 * Fonction(s) � ex�cuter quand la valeur change
	 */
	JSYG.ColorPicker.prototype.onchange = null;
		
	JSYG.ColorPicker.prototype.clear = function() {
		
		new JSYG(this.container).empty().attrRemove('style');
		
		return this;
	};
	
	/**
	 * Affiche le colorPicker
	 * @param {Function} callback optionnel, fonction � ex�cuter � la fin de l'effet d'affichage
	 * @returns {JSYG.ColorPicker}
	 */
	JSYG.ColorPicker.prototype.create = function(callback) {
		
		this.clear();
						
		var that = this,
			
			jCont = new JSYG(this.container)
			.classAdd(this.className),
			
			jDivH = new JSYG('<div>')
				.classAdd('divh')
				.append( new JSYG('<img>').href(imgs.h).classAdd('imgh') )
				.appendTo(jCont),
		
			jPos = new JSYG('<img>')
				.href(imgs.cursor)
				.classAdd('imgposition')
				.appendTo(jDivH),
		
			jDivSV = new JSYG('<div>')
				.classAdd('divsv')
				.append( new JSYG('<img>').href(imgs.sv).classAdd('imgsv') )
				.appendTo(jCont),
				
			jCross = new JSYG('<img>')
				.href(imgs.crosshair)
				.classAdd('imgcrosshairs')
				.appendTo(jDivSV),
						
			jCrossDrag = new JSYG.Draggable(jCross),
			jPosDrag = new JSYG.Draggable(jPos),
			
			maxs = { rgb : 255, hsv : 100, cmyk : 100 };
			
			if (this.transparentInput) {
			
				new JSYG('<label>').append(
					new JSYG("<input>").attr("type","checkbox").classAdd("transparent")
					.on("change",function() {
						if (this.checked) that.val(that.transparentValue,false,"inputtransparent");
						else that.val(that.val(),false,"inputtransparent");
					})
				)
				.textAppend("transparent")
				.appendTo(jCont);
			}
			
			
			['rgb','hsv','cmyk'].forEach(function(mode) {
				
				if (!that[mode+"Input"]) { return; }
				
				var div = new JSYG('<div>')
					.classAdd('divinputs '+mode)
					.appendTo(jCont);
				
				JSYG.each(mode,function(i,comp) {
					new JSYG('<label>')
					.text(comp.toUpperCase()+' : ')
					.appendTo(div)
					.append(
						new JSYG('<input>').attr("size","3").classAdd(mode+'input '+comp)
						.on("change",function() {
							this.value = JSYG.clip(this.value,0,comp == 'h' ? 360 : maxs[mode]);
							var color={};
							JSYG.each(mode,function(i,comp) { color[comp] = div.find("."+comp).val(); });
							that.val(color,false,"input"+mode);						
						})
					);
				});
			});

		jCrossDrag.set({
			cursor:false,
			onstart:function(e) {
				that.val(that.val(),false,"crosshair");
				that.trigger('start',this,e);
			},
			ondrag:function(e) {
				that.val(that.val(),false,"crosshair");
				that.trigger('drag',this,e);
			},
			onend:function(e) { that.trigger('end',this,e); }
		});
				
		jDivSV.on('mousedown',function(e) {
			e.preventDefault();
			var pos = new JSYG(this).getCursorPos(e);
			if (that.transparentInput) jCont.find(".transparent").val(false);
			jCross.setCenter(pos);
			jCrossDrag.bounds = Math.floor( jCross.getDim().width / 2 );
			jCrossDrag.start(e);
		});
				
		jPosDrag.set({
			horizontal:false,
			vertical:true,
			cursor:false,
			onstart:function(e) {
				that.val(that.val(),false,"cursor");
				that.trigger('start',this,e);
			},
			ondrag:function(e) {
				that.val(that.val(),false,"cursor");
				that.trigger('drag',this,e);
			},
			onend:function(e) { that.trigger('end',this,e); }
		});
					
		jDivH.on('mousedown',function(e) {
			e.preventDefault();
			var pos = new JSYG(this).getCursorPos(e);
			if (that.transparentInput) { jCont.find(".transparent").val(false); }
			jPos.setCenter(null,pos.y);
			jPosDrag.bounds = Math.floor( jPos.getDim().height / 2 );
			jPosDrag.start(e);
		});
				
		return this;
	};
	
	JSYG.ColorPicker.prototype._lastValue = null;
	
	
	var size = 200; //taille de l'image de fond
	
	function getHSVromPos(jCont) {
		
		var pos = jCont.find('.imgposition').getCenter(),
			cross = jCont.find('.imgcrosshairs').getCenter(),
			h = Math.round( pos.y * 360 / (size));
						
		return {
			h : JSYG.clip(h,0,360), // car h va de -0.5 � 365.5
			s : Math.round( 100 - cross.y * 100 / size),
			v : Math.round( cross.x * 100 / size)
		};
	};
	
	function setCursors(jCont,hsv) {
		
		jCont.find('.imgcrosshairs').setCenter( hsv.v*size/100, (100-hsv.s)*size/100 );
		jCont.find('.imgposition').setCenter(null,hsv.h*size/360);
		jCont.find('.divsv').css('backgroundColor', new JSYG.Color({h:hsv.h,s:100,v:100}).toString() );
	}
		
	function setBackColorFromPos(jCont) {
		
		var h = jCont.find('.imgposition').getCenter().y * 360 / size,
			color = new JSYG.Color({h:h,s:100,v:100}).toString();
		
		jCont.find('.divsv').css('backgroundColor',color);		
	}
	
	function setInputs(mode,jCont,color) {
		
		JSYG.each(mode,function() {
			var composante = this;
			var selector = '.'+mode+'input.'+composante;
			jCont.find(selector).val( color[composante] , true );
		});
	}
						
	JSYG.ColorPicker.prototype.val = function(value,preventEvent,_from) {
		
		var jCont = new JSYG(this.container);
		
		if (value == null) {
			var transp = jCont.find(".transparent");
			if (transp.length && transp.val() == "on") return this.transparentValue;
			else return  new JSYG.Color(getHSVromPos(jCont));
		}
		
		var color,hsv,str,lastValue;
		
		if (value == this.transparentValue) {
			lastValue = value;
			str = value;
			if (_from != "inputtransparent" && this.transparentInput) jCont.find(".transparent").val("on",true);
		}
		else {
			try {
				color = new JSYG.Color(value);
				lastValue = color.toString();
			}
			catch(e) {
				color = new JSYG.Color("black");
				lastValue = value;
			}
					
			hsv = color.toHSV(),
			str = color.toString();
			
			//on force la valeur de h car si v = 0, alors h et s renvoient 0
			if (value.h) hsv.h = value.h;
					
			if (_from != "crosshair" && _from !="cursor") setCursors(jCont,hsv);
			else if (_from == "cursor") setBackColorFromPos(jCont);
			
			if (_from != "inputhsv" && this.hsvInput) setInputs("hsv",jCont,hsv);
			if (_from != "inputtransparent" && this.transparentInput) jCont.find("input.transparent").val(false,true);
			if (_from != "inputrgb" && this.rgbInput) setInputs("rgb",jCont, color.toRGB() );
			if (_from != "inputcmyk" && this.cmykInput) setInputs("cmyk",jCont, color.toCMYK());
		}
		
		if (str != this._lastValue && !preventEvent) this.trigger("change");
		
		this._lastValue = lastValue;
		
		return this;
	};
	
	
	JSYG.InputColorPicker = function(arg,opt) {
		
		JSYG.ColorPicker.call(this);
		
		if (arg) this.setNode(arg);
		
		if (opt) this.enable(opt);
	};
		
	JSYG.InputColorPicker.prototype = new JSYG.ColorPicker();
	
	JSYG.InputColorPicker.prototype.constructor = JSYG.InputColorPicker;
	
	JSYG.InputColorPicker.prototype.className = "colorPicker input";
	
	JSYG.InputColorPicker.prototype.format = "hex";
	
	JSYG.InputColorPicker.prototype.display = false;
	
	JSYG.InputColorPicker.prototype.enabled = false;
	
	JSYG.InputColorPicker.prototype.effect = "slide";
	
	JSYG.InputColorPicker.prototype.onshow = null;
	JSYG.InputColorPicker.prototype.onhide = null;
	JSYG.InputColorPicker.prototype.onbeforesubmit = null;
	JSYG.InputColorPicker.prototype.onsubmit = null;
	JSYG.InputColorPicker.prototype.oncancel = null;
	
	JSYG.InputColorPicker.prototype._initValue = null;
	
	JSYG.InputColorPicker.prototype.val = function(value,preventEvent,_from) {
		
		if (value == null) {
			value = JSYG.ColorPicker.prototype.val.call(this,null,preventEvent);
			return value == this.transparentValue ? value : value.toString(this.format);
		}
		else {
			if (typeof value == "object") value = new JSYG.Color(value).toString(this.format);
			
			if (_from != 'input') new JSYG(this.node).val(value,true);
			
			JSYG.ColorPicker.prototype.val.call(this,value,preventEvent,_from);
			
			return this;
		}
	};
	
	JSYG.InputColorPicker.prototype.create = function() {
		
		var jCont = new JSYG(this.container),
			that = this;
				
		JSYG.ColorPicker.prototype.create.call(this);
		
		jCont.append(
			new JSYG('<form>').classAdd('boutons')
			.append(
				new JSYG('<button>')
				.text("annuler")
				.on('click submit',function(e) {
					
					e.preventDefault(e);
					
					new JSYG(that.node).val(that._initValue,true);
					
					that.hide(function() { that.trigger('cancel'); });
				})
			)
			.append(
				new JSYG('<button>')
				.classAdd("valider")
				.text("valider")
				.on('click submit',function(e) {
					
					e.preventDefault(e);
					
					var color = that.val();
					
					if ( that.trigger('beforesubmit') !== false ) {
						
						new JSYG(that.node).val(color);
						
						if (color != that._initValue) new JSYG(that.node).trigger("change");
						
						that.hide(function() {
							that.trigger('submit');
						});
					}
				})
			)
		);
		
		return this;
	};
	
	JSYG.InputColorPicker.prototype.show = function(callback) {
				
		var jNode = new JSYG(this.node),
			dim = jNode.getDim(),
			jCont = new JSYG(this.container),
			parent = jNode.offsetParent(),
			that = this;
		
		jCont.css("display","none").appendTo(parent);
		
		this._initValue = this.node.value;
		
		jCont.setDim({x:dim.x,y:dim.y+dim.height});
		
		this.val(this._initValue,false,'input');
		
		jCont.show(this.effect,function() {
			that.trigger("show");
			callback && callback.call(that.node);
		});
		
		this.display = true;
		
		return this;
	};
	
	JSYG.InputColorPicker.prototype.hide = function(callback) {
		
		var that = this;
		
		new JSYG(this.container).hide(this.effect,function() {
			that.trigger("hide");
			callback && callback.call(that.node);
		});
		
		this.display = false;
		
		return this;
	};
	
	JSYG.InputColorPicker.prototype.enable = function(opt) {
		
		this.disable();
				
		if (opt) this.set(opt);
				
		var that = this,
			jNode =  new JSYG(this.node),
			active = function() { if (!that.display) that.show(); },
			update = function(e) { that.val(this.value,false,'input'); },
			autocomplete;
			
		this.create();
		
		jNode.on('focus',active).on('change keyup',update);
		
		autocomplete = jNode.attr('autocomplete');
		
		jNode.attr('autocomplete','off');
		
		this.enabled = true;
		
		this.disable = function() {
			
			this.clear();
			
			new JSYG(this.container).remove();
			
			jNode.attr('autocomplete',autocomplete)
			.dataRemove('colorpicker')
			.off('focus',active)
			.off('change keyup',update);
			
			this.enabled = false;
			
			return this;
		};
		
		this.enabled = true;
		
		return this;
	};
	
	JSYG.InputColorPicker.prototype.disable = function() {
		
		this.enabled = false;
		
		return this;
	};
	
	/**
	 * D�sactivation du colorPicker
	 * @returns {JSYG.ColorPicker}
	 */
	JSYG.ColorPicker.prototype.disable = function() { return this; };
	
	var colorPicker = JSYG.bindPlugin(JSYG.InputColorPicker);
	/**
	 * <strong>nécessite le module ColorPicker</strong><br/><br/>
	 * Activation de l'élément (de type input) comme colorPicker<br/><br/>
	 * @returns {JSYG}
	 * @see JSYG.InputColorPicker pour une utilisation d�taill�e
	 * @example <pre>new JSYG('#monInput').colorPicker();
	 * 
	 * //utilisation avanc�e :
	 * new JSYG('#monInput').colorPicker({
	 * 	effect : 'fade',
	 * 	onbeforesubmit : function() {
	 * 		if (this.value == '000000') {
	 * 			alert('Pas de noir svp!');
	 * 			return false;
	 * 		}
	 * 	}
	 * });
	 * </pre>
	 */
	JSYG.prototype.colorPicker = function() { return colorPicker.apply(this,arguments); };
	
	
}());