//� �tudier : http://www.w3.org/TR/2006/WD-DOM-Level-3-Events-20060413/keyset.html#KeySet-Set
	
	/*
	IE :
	- si e.preventDefault() sur keydown, keypress ne sera pas d�clench�
	- les touches non alphanum�riques ne d�clenchent pas l'�v�nement keypress, � part 'enter'
	- l'appui sur une touche non alphanum�rique bloque l'�v�nement keypress (m�me si une autre touche est enfonc�e).
	- e.charCode == null
	- e.keyCode !== null
	
	FF :
	- keydown,keyup :
		- e.charCode === 0
		- e.keyCode !== 0
	- keypress :
		- les touches non alphanum�riques d�clenchent l'�v�nement
		- (e.charCode !== 0 && e.keyCode === 0) si caract�re alphanum
		- (e.charCode === 0 && e.keyCode !== 0) si non alphanum
		- e.which ne sert pas � grand chose : il renvoie (e.keyCode || e.charCode) mais pour une m�me touche e.keyCode!==e.charCode donc il faut traiter les cas séparément
	
	Chrome :
	- keydown,keyup :
		- e.charCode === 0
		- e.keyCode !== 0
	- keypress :
		- les touches non alphanum�riques ne d�clenchent pas l'�v�nement
		- l'appui sur une touche non alphanum�rique bloque l'�v�nement keypress (m�me si une autre touche est enfonc�e).
		- e.keyCode !== 0 dans tous les cas
		- (e.charCode !== 0 && e.keyCode === e.charCode) si alphanum
		- e.charCode === 0 sinon
		
	
	
*/

(function() {

	"use strict";
	/**
	 * définition d'un raccourci clavier
	 * @param {Object} opt optionnel, objet définissant les options. Si défini, le raccourci clavier est activ� implicitement.
	 */
	JSYG.KeyShortCut = function(opt) {
		if (opt) this.enable(opt);
	};
	
	JSYG.KeyShortCut.prototype = {
		
		/**
		 * nom de la touche de raccourci
		 */
		key : null,
		/**
		 * touche sp�ciale ou tableau des touches sp�ciales (ctrl,shift,alt)
		 * @type {String,Array}
		 */
		specialKeys : null,
		
		set : JSYG.StdConstruct.prototype.set,
		/**
		 * Fonction � ex�cuter lors de la r�alisation du raccourci
		 */
		action : null,
		/**
		 * Bool�en : true pour n'ex�cuter qu'une fois la fonction quand les touches sont enfonc�es, false r�p�te l'action
		 * � intervalles r�guliers
		 */
		unique : true,
		/**
		 * Indique si le raccourci est actif ou non
		 */
		enabled : false,
		/**
		 * Activation du raccourci
		 * @param {Object} opt optionnel, objet définissant les options
		 */
		enable : function(opt) {
		
			if (opt) this.set(opt);
			
			var jDoc = new JSYG(document),
			
				that = this,
				
				dejaPasse = false,
				
				keysPressed = [],
				
				listSpecialKeys = ['shift','alt','meta','ctrl'],
								
				specialKeysRequired  = (function() {
					
					if (!that.specialKeys) return [];
					
					var keys,i;
					
					if (typeof that.specialKeys === 'string') keys = that.specialKeys.split(/\+| /);
					else if (that.specialKeys instanceof Array) keys = that.specialKeys;
					else throw that.specialKeys+' : propriété incorrecte pour JSYG.KeyShortCut';
					
					i = keys.length;
					
					while (i--) { if (keys[i].indexOf('Key') === -1) keys[i]+='Key'; }
					
					return keys;
					
				})(),

				fcts = {
				
					keydown : function keydown(e) {
						
						if (listSpecialKeys.indexOf(e.keyName) == -1 && keysPressed.indexOf(e.keyName) == -1) keysPressed.push(e.keyName); 
				
						if (e.keyName !== that.key) return false;
						
						var i = listSpecialKeys.length,
							specialKey,isRequired;
						
						while (i--) {
							specialKey = listSpecialKeys[i]+'Key';
							isRequired = specialKeysRequired.indexOf(specialKey) != -1;
							if (!e[specialKey] && isRequired || e[specialKey] && !isRequired) return false;
						}
						
						if (that.unique && dejaPasse === true) return false;
						
						dejaPasse = true;
						
						that.action(e);
					},
					
					keyup : function keyup(e) {
						
						var ind = keysPressed.indexOf(e.keyName);
						
						if (ind != -1) keysPressed.splice(ind,1);
				
						dejaPasse = false;
					}
				};
			
			jDoc.on(fcts);
						
			this.disable = function() {
				
				jDoc.off(fcts);
				this.enabled = false;
			};
			
			this.enabled = true;
		},
		/**
		 * D�sactivation du raccourci
		 * @returns {JSYG.KeyShortCut}
		 */
		disable : function() { return this; }
	};
	
}());