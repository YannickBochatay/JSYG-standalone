JSYG.require("Animation","LoadingMask.css");

(function() {

	"use strict";
	
	var pathImages = JSYG.require.baseURL+'/LoadingMask/img/';
	/**
	 * <strong>nécessite le module LoadingMask</strong><br/><br/>
	 * Affichage d'un masque de chargement par dessus un élément.
	 * @param arg argument JSYG faisant référence � l'élément
	 * @param {Object} opt optionnel, objet définissant les options. Si défini, le masque est affich� implicitement.
	 */
	JSYG.LoadingMask = function(arg,opt) {
		
		if (arg) this.node = arg;
		
		/**
		 * Conteneur (élément DOM &lt;div&gt;)
		 */
		this.container = document.createElement('div');
		/**
		 * div d'info si text ou icon sont définis (élément DOM &lt;div&gt;)
		 */
		this.divInfo = document.createElement('div');
		
		if (opt) this.show(opt);
	};

	JSYG.LoadingMask.prototype = {
		/**
		 * Element cible
		 */
		node : null,
		/**
		 * Classe � appliquer au masque de chargement (g�n�ralement semi-transparent)
		 */
		classMask : 'loadingMask',
		/**
		 * Classe � appliquer � la div d'information (optionnelle) par dessus le container
		 */
		classInfo : 'loadingMessage',
		/**
		 * Classe � appliquer � la div d'information (optionnelle) par dessus le masque quand elle contient du texte
		 */
		classInfoText : 'withText',
		/**
		 * {Boolean} permet de rendre invisible le masque, pour n'afficher que la div d'info
		 */
		maskInvisible : false,
		/**
		 * Texte � afficher dans la div d'infos
		 */
		text : false,
		/**
		 * Icone � afficher dans la div d'infos. Ce peut �tre 'long','small','big' ou l'url compl�te de l'image.
		 * La valeur sp�ciale 'progressBar' affiche une balise "progress" (html5)
		 */
		icon : 'small',
		/**
		 * Pour les ic�nes pr�définies ('long','small','big'), format � utiliser (les png anim�s ne fonctionnent pas avec IE même 9)
		 */
		ext : 'gif',
		/**
		 * @see JSYG.StdConstruct.prototype.set
		 */
		set : JSYG.StdConstruct.prototype.set,
		/**
		 * Indique si le masque est affich� ou non
		 */
		display : false,
		
		/**
		 * Affichage du masque de chargement
		 * @param {Object} opt optionnel, objet définissant les options 
		 * @returns {JSYG.LoadingMask}
		 */
		show : function(opt) {
			
			if (!this.node) return;
			
			if (this.display) this.hide();
			
			if (opt) this.set(opt);
			
			var mask = new JSYG(this.container).animate('clear').attrRemove('style'),//si un fondu est en cours
				jTarget = new JSYG(this.node),
				dim = jTarget.getDim('page'),
				backupPos = jTarget.css('position'),
				jDiv = new JSYG(this.divInfo).empty(),
				img = {},
				opacity = this.maskInvisible ? 0 : 0.5,
				that = this;
			
			function insertDivInfos() {
				
				if (!that.display) return; //si hide est appelé entre temps...
				
				var dimDiv;
				
				if (jTarget.type == 'svg') {
					jDiv.appendTo(document.body);
					jDiv.setDim({x:dim.x+dim.width/2,y:dim.y+dim.height/2});
				} else {
					jDiv.appendTo(jTarget);
				}
				
				dimDiv = jDiv.getDim();
								
				jDiv.css({
					marginTop : -dimDiv.height/2+"px",
					marginLeft : -dimDiv.width/2+"px",
					zIndex : parseInt(mask.css('zIndex'),10)+1
				});
			}
							
			if (!backupPos || backupPos == 'static') {
				jTarget.css('position','relative').data('loadingMaskData',{ backupPos:backupPos });
			}
			
			mask.classAdd(this.classMask);									
			
			if (jTarget.node === document.body) {
				mask.css({zIndex:'49',position:'fixed'});
			} else {
				var zindex = jTarget.cssNum('z-index');
				zindex && mask.css('zIndex',zindex+1);
				
				if (jTarget.type === 'svg') mask.setDim(dim);
			}
								
			mask.css('opacity',opacity);
			
			mask.appendTo(jTarget.type === 'svg' ? document.body : jTarget);
			
			this.display = true;
			
			if (this.text || this.icon) {
				
				jDiv.attrRemove("class");
				
				jDiv.css('zIndex',mask.css('zIndex'));
				
				jDiv.classAdd(this.classInfo);
				
				if (jTarget.node == document.body) { jDiv.css('position','fixed'); }
				
				if (this.text){
					jDiv.classAdd(this.classInfoText);
					jDiv.text(this.text);
				}
				
				if (this.icon)
				{
					if (this.text) { jDiv.br(); }
					
					if (this.icon === 'progressBar') {
							
						img = document.createElement("progress");
						img.setAttribute('value','0');
						img.setAttribute('max','100');
					}
					else {
						
						img = document.createElement("img");
						
						if (this.text) {
							if (this.icon === true) this.icon = 'long';
						}
						else if (this.icon === true) this.icon = 'big';
						
						if (['long','big','small'].indexOf(this.icon)!==-1) {
							img.src = pathImages+this.icon+'.'+this.ext;
						}
						else img.src = this.icon;
									
						img.alt = "...";
					}
					
					jDiv.append(img);
				}
				
				if (this.icon && this.icon!=='progressBar' && !img.complete) img.onload = insertDivInfos; //pour les dimensions
				else insertDivInfos();
			}
			else jDiv.remove();
			
			return this;
		},
		
		/**
		 * Efface le masque avec un effet de fondu
		 * @param {Function} callback optionnel, fonction � ex�cuter � la fin du fondu
		 * @returns {JSYG.LoadingMask}
		 */
		fadeOut : function(callback) {
			
			if (!this.node) return;
			
			var that = this;
			
			return new JSYG.Promise(function(resolve) {
				
				that.display = false;
				
				if (!that.display) resolve();
				 
				var jTarget = new JSYG(that.node), 
					data = jTarget.data('loadingMaskData') || {},
					mask = new JSYG(that.container);
				
				new JSYG(that.divInfo).remove().clear();
								
				mask.animate('clear'); //si un fondu est en cours
					
				mask.animate({
					to:{opacity:'0'},
					step:50,
					onend:function() {
						that.hide();
						if (callback) callback.call(jTarget.node);
						resolve(jTarget.node);
					}
				});
			});
		},
		
		/**
		 * Retire le masque
		 * @returns {JSYG.LoadingMask}
		 */
		hide : function() {
			
			if (!this.node) return;
			
			var jTarget = new JSYG(this.node),
				mask = new JSYG(this.container),
				data = jTarget.data('loadingMaskData') || {};
			
			mask.animate('clear').remove();
						
			new JSYG(this.divInfo).remove().clear();
			 
			if (data.backupPos) jTarget.css('position',data.backupPos);
			
			jTarget.dataRemove('loadingMaskData');
			
			this.display = false;
			
			return this;
		},
						
		/**
		 * Affiche le masque avec un effet de fondu
		  * @param {Object} opt optionnel, objet définissant les options
		  * @param {Function} callback optionnel, fonction � ex�cuter � la fin du fondu<br/>
		  * On peut passer une fonction en argument unique si on n'a pas besoin de opt 
		 * @returns {JSYG.LoadingMask}
		 */
		fadeIn : function(opt,callback) {
			
			if (!this.node) return;
			
			if (typeof opt === 'function' && callback == null) {
				callback = opt;
				opt = null;
			}
			
			var that = this;
			
			return new JSYG.Promise(function(resolve) {
				
				that.display = false;
				
				var jTarget = new JSYG(that.node),
					mask = new JSYG(that.container),
					invisible = that.maskInvisible;
			
				mask.animate('clear');
					 
				that.maskInvisible = true;
				
				that.show(opt);
				
				that.maskInvisible = invisible;
				
				if (!invisible) {
				
					mask.animate({
						to:{opacity:'0.5'},
						step:50,
						onend:function() {
							if (callback) callback.call(jTarget.node);
							resolve(jTarget.node);
						}
					});
				}
			});
		}
	};
	
	var plugin = JSYG.bindPlugin(JSYG.LoadingMask);
	
	/**
	 * <strong>nécessite le module LoadingMask</strong><br/><br/>
	 * Affichage d'un masque de chargement.
	 * Le premier argument est obligatoire ("show", "hide", "fadeIn", "fadeOut" en g�n�ral).<br/><br/>
	 * @returns {JSYG}
	 * @see JSYG.LoadingMask pour une utilisation d�taill�e
	 * @example <pre>new JSYG("#maDiv").loadingMask('fadeIn');
	 * 
	 * //utilisation avanc�e
	 * new JSYG("#maDiv").loadingMask('fadeIn',{
	 * 	icon : 'big',
	 * 	text : 'Veuillez patienter'
	 * });
	 */
	JSYG.prototype.loadingMask = function() { return plugin.apply(this,arguments); };
	
}());