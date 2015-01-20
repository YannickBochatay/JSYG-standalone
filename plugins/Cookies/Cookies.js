(function() {
	
	"use strict";
	
	/**
	 * récupère un objet Date à partir d'un objet Date, JSYG.Date, ou un nombre de jours à ajouter à la date courante
	 */
	function getDateFromArg(arg) {
		
		var dateExpire = null;
		
		if (JSYG.type(arg) == 'date') dateExpire = arg;
		else if (arg instanceof JSYG.Date) dateExpire = arg.date;
		else if (JSYG.isNumeric(arg) && arg < Date.now()) { //pour être sûr qu'on ne passe pas un timestamp
			
			if (!JSYG.Date) throw new Error("Il faut inclure le plugin JSYG.Date");
			
			dateExpire = new JSYG.Date();
			dateExpire = dateExpire.add("days",arg).date;
		}
		return dateExpire;
	}
	
	/**
	 * En interne seulement, utiliser la propriété JSYG.cookies
	 * @private
	 * @returns {JSYG.Cookies}
	 */
	function Cookies() {}
	
	Cookies.prototype = {
		
		constructor : Cookies,
		/**
		 * Ecrit une donnée dans un cookie
		 * @param nom nom du cookie 
		 * @param valeur valeur du cookie (chaîne)
		 * @param expires nombre de jours de conservation du cookie (session courante par défaut) ou objet Date.
		 * @returns {Cookies}
		 */
		write : function(nom,valeur, expires) {
			
			var chaine = nom+"="+encodeURIComponent(valeur);
			if (expires) { chaine+="; expires="+getDateFromArg(expires).toGMTString(); }
			document.cookie = chaine;
			
			return this;
		},
		
		/**
		 * Lecture d'un cookie
		 * @param nom nom du cookie 
		 * @returns {String} valeur du cookie
		 */
		read : function(nom) {
			
			function recupVal(offset) {
				
				var endstr=document.cookie.indexOf(";", offset);
				if (endstr==-1) { endstr=document.cookie.length;}
				return decodeURIComponent(document.cookie.substring(offset, endstr));
			}
			
			var arg=nom+"=",
				alen=arg.length,
				clen=document.cookie.length,
				i=0,j;
			
			while (i<clen) {
				j=i+alen;
				if (document.cookie.substring(i, j)==arg) return recupVal(j);
				i=document.cookie.indexOf(" ",i)+1;
				if (i===0) break;
			}
			return undefined;
		},
	
		/**
		 * Effacement d'un cookie
		 * @param nom nom du cookie à effacer
		 * @returns {Cookies}
		 */
		remove : function(nom)	{
			
			var date=new Date();
			date.setFullYear(date.getFullYear()-1);
			this.write(nom,null,date);
			
			return this;
		}
	};
	
	/**
	 * Gestion des cookies
	 */
	JSYG.cookies = new Cookies();
	
}());