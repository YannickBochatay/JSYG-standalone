JSYG.require('LoadingMask','MessageTempo.css');

(function() {
	
	"use strict";
	/**
	 * Affichage d'un message temporaire en plein écran
	 * @param {Object} opt optionnel, objet définissant les options. Si défini, le message est affiché implicitement.
	 */
	JSYG.MessageTempo = function(opt) {
		
		if (!(this instanceof JSYG.MessageTempo)) {
			var mess = new JSYG.MessageTempo(opt);
			return opt ? mess.show() : mess;
		}
		
		/**
		 * conteneur
		 */
		this.container = document.createElement('div');
		
		if (opt) this.set(opt);
	};
	
	JSYG.MessageTempo.prototype = {
		
		constructor : JSYG.MessageTempo,
		/**
		 * durée d'affichage en millisecondes
		 */
		duration : 1000,
		/**
		 * couleur du message
		 */
		color : '#bbffbb',
		/**
		 * texte du message
		 */
		text : 'OK',
		/**
		 * id du conteneur du message
		 */
		id : 'messageTempo',
				
		set : function(opt) {
			
			if (typeof opt == 'string') opt={text:opt};
			
			return JSYG.StdConstruct.prototype.set.call(this,opt);
		},
		/**
		 * Affichage du message
		 * @param {Object} opt optionnel, objet définissant les options. 
		 */
		show : function(opt) {
		
			if (opt) this.set(opt);
			
			var that = this;
			
			return new JSYG.Promise(function(resolve,reject) {
				
				var jBody = new JSYG(document.body),
					jDiv = new JSYG(that.container),
					dim;
				
				jBody.loadingMask('show',{icon:false,text:false});
					
				jDiv
				.id(that.id)
				.text(that.text)
				.css({
					backgroundColor : that.color,
					display : 'none'
				});
				
				jDiv.appendTo(jBody);
				
				dim = jDiv.getDim(); 
				
				jDiv.css({
					marginTop : -dim.height/2 + "px",
					marginLeft : -dim.width/2 + "px"
				});
				
				jDiv.show('fade',function() {
					window.setTimeout(function(){
						jDiv.remove();
						jBody.loadingMask('fadeOut',resolve);
					},that.duration);
				});
			});
		}
	};
	
}());