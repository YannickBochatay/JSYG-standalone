JSYG.require("Animation");

(function() {

	"use strict";

	/**
	 * <strong>nécessite le module TextAnim</strong><br/><br/>
	 * Animation de texte
	 * @param arg argument JSYG faisant référence � un élément texte
	 * @param opt optionnel, objet définissant les options. Si défini, l'animation est lanc�e implicitement (méthode "show").
	 * @returns {JSYG.TextAnim}
	 */
	JSYG.TextAnim = function(arg,opt) {
		
		if (arg) this.setNode(arg);
		
		this._letters = [];
		this._timers = [];
		
		if (opt) this.show(opt);
	};
	
	JSYG.TextAnim.prototype = new JSYG.StdConstruct();
	
	JSYG.TextAnim.prototype.constructor = JSYG.TextAnim;
	/**
	 * Fonction(s) � �x�cuter � chaque lettre affich�e
	 * 
	 */
	JSYG.TextAnim.prototype.onshowletter = null;
	/**
	 * Fonction(s) � �x�cuter � chaque lettre supprim�e
	 */
	JSYG.TextAnim.prototype.onhideletter = null;
	/**
	 * Fonction(s) � �x�cuter � la fin de l'affichage complet
	 */
	JSYG.TextAnim.prototype.onshow = null;
	/**
	 * Fonction(s) � �x�cuter � la fin du retrait complet
	 */
	JSYG.TextAnim.prototype.onhide = null;
	/**
	 * Fonction(s) � �x�cuter � la fin de chaque animation
	 */
	JSYG.TextAnim.prototype.onend = null;
	/**
	 * Fonction(s) � �x�cuter quand on change une lettre
	 */
	JSYG.TextAnim.prototype.onchange = null;
	/**
	 * R�tablit ou non le texte initial en fin d'animation
	 */
	JSYG.TextAnim.prototype.restoreOnEnd = false;
	/**
	 * Rotation de départ
	 */
	JSYG.TextAnim.prototype.fromRotate = 0;
	/**
	 * Echelle de départ. Pour une échelle diff�rente en x et y, utilisez une cha�ne de caract�res
	 * avec les valeurs x et y séparées par un espace ou une virgule
	 */
	JSYG.TextAnim.prototype.fromScale = 1;
	/**
	 * Translation de départ. Pour une translation diff�rente en x et y, utilisez une cha�ne de caract�res
	 * avec les valeurs x et y séparées par un espace ou une virgule
	 */
	JSYG.TextAnim.prototype.fromTranslate = 0;
	
	/**
	 * Dur�e de l'animation en ms
	 */
	JSYG.TextAnim.prototype.duration = 1500;
	/**
	 * Style de l'animation
	 * @see JSYG.Animation.easing
	 */
	JSYG.TextAnim.prototype.easing = 'swing';
	/**
	 * D�lai en ms entre chaque lettre
	 */
	JSYG.TextAnim.prototype.delay = 150;
		
	JSYG.TextAnim.prototype._createLetter = function(caractere,ind) {
		
		var jNode = new JSYG(this.node),
			dim = jNode.getDim(),
			str = jNode.text(),
			parent = jNode.offsetParent(),
		
			newLetter = jNode.clone()
			.css('visibility','hidden')
			.text(caractere)
			.css('position','absolute')
			.css('margin','0')
			.appendTo(parent)
			.setDim({x:dim.x,y:dim.y}),
				
			wordtest = jNode.clone()
			.css('visibility','hidden')
			.text(str.substr(0,ind)
			.replace(/ /g,'o'))
			.css('position','absolute')
			.css('margin','0')
			.appendTo(parent),

			width = wordtest.getDim().width;
		
		wordtest.remove();
			
		if (jNode.type === 'html') {
			newLetter.setDim({
				x : newLetter.getDim().x + width,
				y : dim.y
			});
		} else {
			newLetter.attr('x',(parseInt(newLetter.attr('x'),10)||0)+width);
		}

		this._letters[ind] = newLetter;
		
		return this;
	};
	
	function getScale(arg) {
		
		if (typeof arg === 'string') {
			arg = arg.split(/\s+|,/);
			return {
				x : parseFloat(arg[0]),
				y : parseFloat( arg[1]!=null ? arg[1] : arg[0] )
			};
		} else { return { x : arg, y : arg }; }
	};
	
	function getTransl(arg) {
		if (typeof arg === 'string') {
			arg = arg.split(/\s+|,/);
			return {
				x : parseFloat(arg[0]),
				y : arg[1]!=null ? parseFloat(arg[1]) : 0
			};
		} else { return { x : arg, y : 0 }; }
	};
	
	JSYG.TextAnim.prototype._showLetter = function(letter,ind,evt) {
			
		var that = this,
			transl = getTransl(this.fromTranslate),
			scale = getScale(this.fromScale),
			jNode = new JSYG(this.node),
			to = jNode.getMtx().decompose();
				
		letter.translate(transl.x,transl.y).rotate(this.fromRotate).scaleNonUniform(scale.x,scale.y);
		
		letter.css('visibility','visible');
		
		to = {
			scaleX : to.scaleX,
			scaleY : to.scaleY,
			rotate : to.rotate,
			translateX : to.translateX,
			translateY : to.translateY
		};
						
		letter.animate({
			to:to,
			duration:this.duration,
			easing:this.easing,
			onend: function() {
				that.trigger('showletter',that.node);
				if (ind!=null && ind === that._letters.length-1) {
					that.trigger(evt,that.node);
					that.trigger('end',that.node);
					that.restoreOnEnd && that.restore();
				}
			}
		});
		
		return this;
	};
	
	JSYG.TextAnim.prototype._hideLetter = function(letter,ind) {
		
		var jNode = new JSYG(this.node);
		var that = this;
		
		var transl = getTransl(this.fromTranslate);
		var scale = getScale(this.fromScale);
		
		letter.setMtx(jNode.getMtx());
		letter.css('visibility','visible');
		
		letter.animate({
			to:{
				translateX : transl.x,
				translateY : transl.y,
				rotate : this.fromRotate,
				scaleX : scale.x,
				scaleY : scale.y
			},
			duration:this.duration,
			easing:this.easing,
			onend: function() {
				var letter = new JSYG(this);
				letter.remove();
				that._letters.splice(that._letters.indexOf(letter),1);
				that.trigger('hideletter',that.node);
				if (ind===0) {
					that.trigger('hide',that.node);
					that.trigger('end',that.node);
					that.restoreOnEnd && that.restore();
				}
			}
		});
	};
	
	/**
	 * Affichage anim�
	 * @param opt optionnel, objet définissant les options
	 * @returns {JSYG.TextAnim}
	 */
	JSYG.TextAnim.prototype.show = function(opt) {
			
		this.restore();
		if (opt) { this.set(opt); }
					
		var cpt = 0,
			jNode = new JSYG(this.node),
			that = this,
			position;
		
		jNode.css('visibility','hidden');
		
		if (jNode.type === 'html') {
			position = jNode.css('position');
			if (position == 'static') {
				jNode.css({'position':'relative',left:'0px',top:'0px'});
				jNode.data('textanim',position);
			}
		}
		
		JSYG.each(jNode.text(),this._createLetter.bind(this));
				
		this._letters.forEach(function(letter,ind) {
			letter.css('visibility','hidden');
			that._timers.push(window.setTimeout(function() { that._showLetter(letter,ind,'show'); },cpt));
			cpt+=that.delay;
		});
		
		return this;
	};
	
	/**
	 * Retrait anim� des lettres
	 * @param opt optionnel, objet définissant les options
	 * @returns {JSYG.TextAnim}
	 */
	JSYG.TextAnim.prototype.hide = function(opt) {
			
		this.restore();
		if (opt) { this.set(opt); }
					
		var cpt = 0,
			jNode = new JSYG(this.node),
			that = this;
				
		jNode.css('visibility','hidden');
		
		JSYG.each(jNode.text(),this._createLetter.bind(this));
		
		var length = that._letters.length;
				
		this._letters.reverse().forEach(function(letter,ind) {
			letter.css('visibility','visible');
			that._timers.push(window.setTimeout(function() { that._hideLetter(letter,length-ind-1); },cpt));
			cpt+=that.delay;
		});
		
		return this;
	};
	
	/**
	 * Affichage de lettre de type "implosion"
	 * @param opt optionnel, objet définissant les options
	 * @returns {JSYG.TextAnim}
	 */
	JSYG.TextAnim.prototype.implode = function(opt) {
		
		this.restore();
		if (opt) { this.set(opt); }
					
		var jNode = new JSYG(this.node);
		var that = this;
		var position;
		
		jNode.css('visibility','hidden');
		
		if (jNode.type === 'html') {
			position = jNode.css('position');
			if (position == 'static') {
				jNode.css({'position':'relative',left:'0px',top:'0px'});
				jNode.data('textanim',position);
			}
		}
		
		JSYG.each(jNode.text(),this._createLetter.bind(this));
		
		var backup = {
			fromRotate : this.fromRotate,
			fromScale : this.fromScale,
			fromTranslate : this.fromTranslate,
			easing : this.easing
		};
		
		//var length = that._letters.length;
		var bornes = new JSYG(window).getDim();
				
		this._letters.forEach(function(letter,ind) {
			letter.css('visibility','hidden');
			that.fromRotate = JSYG.rand(-180,+180);
			that.fromScale = JSYG.rand(3,20);
			//that.fromTranslate = 2*(ind * bornes.width*2/length - bornes.width)+','+JSYG.rand(-bornes.height,+bornes.height);
			that.fromTranslate = JSYG.rand(-bornes.width,+bornes.width)+','+JSYG.rand(-2*bornes.height,+2*bornes.height);
			that.easing = 'swing';
			that._showLetter(letter,ind,'show');
		});
		
		for (var n in backup) { this[n] = backup[n]; }
		
		return this;
	};
	/**
	 * Retrait des lettres de type "explosion"
	 * @param opt optionnel, objet définissant les options
	 * @returns {JSYG.TextAnim}
	 */
	JSYG.TextAnim.prototype.explode = function(opt) {
		
		this.restore();
		if (opt) { this.set(opt); }
					
		var jNode = new JSYG(this.node);
		var that = this;
				
		jNode.css('visibility','hidden');
		
		JSYG.each(jNode.text(),this._createLetter.bind(this));
		
		var length = that._letters.length;
		
		var backup = {
			fromRotate : this.fromRotate,
			fromScale : this.fromScale,
			fromTranslate : this.fromTranslate,
			easing : this.easing
		};
		
		var bornes = new JSYG(window).getDim();
				
		this._letters.reverse().forEach(function(letter,ind) {
			letter.css('visibility','visible');
			that.fromRotate = 720;
			that.fromScale = JSYG.rand(3,40);
			//that.fromTranslate = 2*((length-ind-1) * bornes.width*2/length - bornes.width)+','+JSYG.rand(-bornes.height,+bornes.height);
			that.fromTranslate = JSYG.rand(-bornes.width,+bornes.width)+','+JSYG.rand(-2*bornes.height,+2*bornes.height);
			that.easing = 'easeInQuart';
			that._hideLetter(letter,length-ind-1);
		});
		
		for (var n in backup) { this[n] = backup[n]; }
		
		return this;
	};
	
	/**
	 * R�tablit la cha�ne de caract�res initiale
	 * @returns {JSYG.TextAnim}
	 */
	JSYG.TextAnim.prototype.restore = function() {
		
		this._timers.forEach(function(timer) { window.clearTimeout(timer); });
		this._timers = [];
		this._letters.forEach(function(letter) {letter.animate('clear'); letter.remove();});
		this._letters = [];
		
		var jNode = new JSYG(this.node);
		
		if (jNode.type === 'html') {
			var position = jNode.data('textanim',position);
			if (position) {	jNode.css('position',position); }
			jNode.dataRemove('textanim');
		}
		
		jNode.css('visibility','visible');
		
		return this;
	};
	
	/**
	 * Change la cha�ne de caract�re de mani�re anim�e.
	 * @param newstr nouvelle cha�ne
	 * @param opt optionnel, objet définissant les options
	 * @returns {JSYG.TextAnim}
	 */
	JSYG.TextAnim.prototype.change = function(newstr,opt) {
		
		if (opt) { this.set(opt); }
		
		var jNode = new JSYG(this.node);
		
		if (newstr === str.valueOf()) { return; }
		
		this.restore();
		
		JSYG.each(jNode.text(),this._createLetter.bind(this));
		
		jNode.css('visibility','hidden').text(newstr);
		
		str = str.valueOf();
		
		var letter,
		oldstr = str,
		cpt = 0,
		redraw = false,
		that = this;
		
		while (newstr.length < str.length){
			letter = that._letters[str.length-1];
			letter.remove();
			this._letters.splice(this._letters.indexOf(letter),1);
			str = str.substr(0,str.length-1);
		}
				
		JSYG.each(newstr,function(caractere,ind) {
			
			if (oldstr[ind]==null || caractere!=oldstr[ind]) {
				
				if (oldstr[ind]!=null) {that._letters[ind].remove();}
				that._createLetter(caractere,ind);
				that._timers.push(window.setTimeout(function() {that._showLetter(that._letters[ind],ind,'change');},cpt));
				cpt+=that.delay;
				redraw = true; //il y a eu un changement, il faut repositionner les caract�res suivants m�me s'ils sont identiques
				
			} else {
				
				if (redraw){
					that._letters[ind].remove();
					that._createLetter(caractere,ind);
				}	
				that._letters[ind].css('visibility','visible');
			}
		});
		
		return this;
	};
	
	var plugin = JSYG.bindPlugin(JSYG.TextAnim);
	/**
	 * <strong>nécessite le module TextAnim</strong><br/><br/>
	 * Animation de texte
	 * @returns {JSYG}
	 * @see JSYG.TextAnim pour une utilisation d�taill�e
	 * @example <pre>new JSYG('#monSpan').textAnim('show',{fromRotate:180,fromScale:10});
	 */
	JSYG.prototype.textAnim = function() { return plugin.apply(this,arguments); };
	
}());