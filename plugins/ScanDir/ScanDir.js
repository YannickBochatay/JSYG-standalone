JSYG.require('ScanDir.css','Date','Ajax');

(function() {
	
	"use strict";
	
	var pathPlugin = JSYG.require.baseURL+'/ScanDir/';
	
	/**
	 * <strong>nécessite le module ScanDir</strong><br/><br/>
	 * Analyse d'un r�pertoire. Pas tr�s s�curis� vu que le chemin du r�pertoire passe dans la cha�ne de requ�te.<br/><br/>
	 * @param arg argument JSYG faisant référence � l'élément où sera affich� le contenu
	 * @param opt optionnel, objet définissant les options. Si défini, le contenu du r�pertoire sera implicitement affich�.
	 * @returns {JSYG.ScanDir}
	 */
	JSYG.ScanDir = function(arg,opt) {
		
		if (arg) this.container = new JSYG(arg).node;
		
		if (opt) {
			this.set(opt);
			if (arg) this.show();
		}
	};
	
	JSYG.ScanDir.prototype = new JSYG.StdConstruct();
	
	JSYG.ScanDir.prototype.constructor = null;
	/**
	 * Element où est ins�r� le contenu
	 */
	JSYG.ScanDir.prototype.container = null;
	/**
	 * chemin du r�pertoire � analyser, relative (depuis la page courante) ou absolue (depuis la racine web)
	 */
	JSYG.ScanDir.prototype.path = '.';
	/**
	 * Type d'affichage (icons ou details)
	 */
	JSYG.ScanDir.prototype.displayType = 'icons';
	/**
	 * Filtre sur le type pour ne pas afficher tous les fichiers (objet RegExp)
	 */
	JSYG.ScanDir.prototype.filterType = null;
	/**
	 * Filtre sur le nom de fichier pour ne pas tous les afficher (objet RegExp)
	 */
	JSYG.ScanDir.prototype.filterName = null;
	/**
	 * bool�en, affiche ou non les r�pertoires du dossier
	 */
	JSYG.ScanDir.prototype.displayDirs = true;
	/**
	 * bool�en, affiche l'image en miniature pour les icones images (sinon icone g�n�rique)
	 */
	JSYG.ScanDir.prototype.miniature = false;
	/**
	 * Tri pour l'ordre d'affichage ('nom','date' ou 'taille', 'nom' par défaut)
	 */
	JSYG.ScanDir.prototype.sorting = 'name';
	/**
	 * sens du tri ('asc' ou 'desc')
	 */
	JSYG.ScanDir.prototype.way = 'asc';
	/**
	 * fonction(s) � ex�cuter � chaque fois que le r�pertoire est scann�. Le premier argument est l'objet json renvoy�.
	 */
	JSYG.ScanDir.prototype.onscan = null;
	/**
	 * fonction(s) � ex�cuter sur chaque élément repr�sentant un fichier
	 */
	JSYG.ScanDir.prototype.onfile = null;
	/**
	 * fonction � ex�cuter sur chaque élément repr�sentant un dossier
	 */
	JSYG.ScanDir.prototype.ondir = null;
	/**
	 * fonction(s) � ex�cuter � l'affichage du contenu.
	 */
	JSYG.ScanDir.prototype.onshow = null;
	/**
	 * fonction(s) � ex�cuter quand on masque le contenu
	 */
	JSYG.ScanDir.prototype.onhide = null;
	/**
	 * classe � appliquer � la div si le type d'affichage est "icons"
	 */
	JSYG.ScanDir.prototype.classIcons = 'ScanDirIcons';
	/**
	 * classe � appliquer � la div si le type d'affichage est "details"
	 */
	JSYG.ScanDir.prototype.classDetails = 'ScanDirDetails';
	/**
	 * classe � appliquer au champ date (si le type d'affichage est "details")
	 */
	JSYG.ScanDir.prototype.classDate = 'date';
	/**
	 * classe � appliquer au champ taille (si le type d'affichage est "details")
	 */
	JSYG.ScanDir.prototype.classSize = 'size';
	/**
	 * Indique si le contenu est affich� ou non
	 */
	JSYG.ScanDir.prototype.display = false;

	/**
	 * Insertion d'une ic�ne
	 * @param {cha�ne} nom : nom du fichier ou dossier
	 * @param {cha�ne} type : 'fichier' ou 'dossier'
	 * @param {cha�ne} [taille] : taille en octets du fichier
	 * @param {cha�ne} [date] : timestamp de derni�re modification
	 * @returns élément DOM "a"
	 */
	JSYG.ScanDir.prototype.insertIcon = function(nom,type,taille,date) {
		
		if (type === 'directory' && !this.displayDirs) return false;
		
		var a = new JSYG('<a>');
		
		var path = this.path;
				
		a.href(path+'/'+nom);
		
		var img = document.createElement('img'),
		icone,
		known = /\.(doc|xls|pdf|eml)$/i,
		audio = /\.(og(g|v|a|x)|mp3|wav|wma|flac)$/i,
		video = /\.(og(g|v)|mp4|avi|wmv|mov|flv)$/i,
		imgs = /\.(jpe?g|gif|png|svg)$/i;

		if (type === 'directory') { icone = 'rep'; }
		else if (known.test(nom)) {icone = known.exec(nom)[0].substr(1);}
		else if (imgs.test(nom)) {icone = 'jpg';}
		else if (audio.test(nom) || video.test(nom)) {icone = 'media';}
		else {icone = 'autre';}
		
		img.src = (icone == 'jpg' && this.miniature && this.displayType === 'icons') ? a.href() : pathPlugin+'img/'+icone+'.gif';
		
		if (date) {
			date = new JSYG.Date(date).toString("DD-MM-YYYY HH:MI"); 
			new JSYG('<span>').classAdd(this.classDate).text(date).appendTo(a);
		}
		if (taille) {
			taille = Math.ceil(taille/1000);
			new JSYG('<span>').classAdd(this.classSize).text(taille+'Ko').appendTo(a);
		}
		
		a.append(img).textAppend(nom);
							
		a.attr('title',nom).on('click',function(e) { e.preventDefault(); }).appendTo(this.container);
							
		this.trigger( type === 'directory' ? 'dir' : 'file',this.container,a.node);
		
		return a;
	};

	/**
	 * Ex�cution de la requ�te ajax pour scanner le r�pertoire
	 * @param options optionnel, objet définissant les options.
	 * @param callback optionnel, fonction � ex�cuter au succ�s de la requ�te (this fait référence � l'objet Ajax).
	 * <br/><br/>On peut passer un seul des 2 arguments.<br/><br/>
	 * La requ�te ajax renvoie une cha�ne json repr�sentant un tableau d'objets avec les propriétés suivantes :
	 * <ul>
	 * 	<li>name : nom du fichier</li>
	 * <li>type : 'file' ou 'directory'</li>
	 * <li>date : timestamp de la date de derni�re modification du fichier</li>
	 * <li>size : taille du fichier en octets.</li>
	 * </ul>
	 */
	JSYG.ScanDir.prototype.scan = function(options,callback) {
		
		if (JSYG.isPlainObject(options)) this.set(options);
		else if (typeof options == 'function') callback = options;
		
		var that = this,
			filterType = encodeURIComponent(this.filterType && this.filterType.toString() || ''),
			filterName = encodeURIComponent(this.filterName && this.filterName.toString() || ''),
			location = window.location.pathname,
			path = (this.path.charAt(0) == '/') ? this.path : location.substr(0,location.lastIndexOf('/')) +'/'+ this.path;
				
		path = encodeURIComponent(path);
		
		return JSYG.Ajax(pathPlugin+'ScanDir.php?path='+path+'&sort='+this.sorting+'&way='+this.way+'&filterType='+filterType+'&filterName='+filterName)
			.then(function(list) {
				that.trigger('scan',that.container,list);
				callback && callback.call(that.container,list);
				return list;
			});
	};
	/**
	 * Affichage du contenu du r�pertoire selon les crit�res définis
	 * @param options optionnel, objet définissant les options.
	 * @param callback optionnel, fonction � ex�cuter une fois le contenu affich�. Equivalent � l'�v�nement onshow. Le premier argument de la fonction est l'objet json renvoy�.
	 * <br/><br/>On peut passer un seul des 2 arguments.<br/><br/>
	 * @returns {JSYG.ScanDir}
	 */
	JSYG.ScanDir.prototype.show = function(options,callback) {
		
		var jDiv = new JSYG(this.container),
			that = this;
		
		if (JSYG.isPlainObject(options)) this.set(options);
		else if (typeof options == 'function') callback = options;
		
		if (this.displayType === 'details') {
			jDiv.classRemove(this.classIcons);
			jDiv.classAdd(this.classDetails);
		} else {
			jDiv.classRemove(this.classDetails);
			jDiv.classAdd(this.classIcons);
		}
		
		this.scan(function(list) {
			
			new JSYG(that.container).find('a').remove();
			
			list && list.forEach(function(item) {
				if (item.name == '.') return;
				if (that.displayType === 'details') that.insertIcon(item.name,item.type,item.size,item.date);
				else that.insertIcon(item.name,item.type);
			});
			
			callback && callback.call(that.container,list);
			that.trigger('show',that.container,list);
		});
		
		this.display = true;
		
		return this;
	};

	/**
	 * Effacement du contenu
	 * @returns {JSYG.ScanDir}
	 */
	JSYG.ScanDir.prototype.hide = function(callback,_preventDefault) {
		
		new JSYG(this.container).find('a').remove();
		
		if (!_preventDefault) this.trigger('hide',this.container);
		
		this.display = false;
		
		callback && callback.call(this.container);
		
		return this;
	};
	
}());