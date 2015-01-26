JSYG.require('FileManager.css',"Ajax");

(function() {
	
	"use strict";
	
	/**
	 * Gestion de fichiers (basé sur FileReader)
	 * @param opt optionnel, objet définissant les options.
	 * @returns {JSYG.FileManager}
	 * @link https://developer.mozilla.org/fr/DOM/FileReader
	 */
	JSYG.FileManager = function(opt) {
		
		if (!window.FileReader ) throw new Error("Ce navigateur n'implémente pas le constructeur FileReader");
		
		/**
		 * Liste des fichiers
		 */
		this.list = [];
				
		if (opt) this.set(opt);
	};
		
	JSYG.FileManager.prototype = new JSYG.StdConstruct();
		
	JSYG.FileManager.prototype.constructor = JSYG.FileManager;
	
	/**
	 * objet RegExp pour filtrer le type de fichier
	 */
	JSYG.FileManager.prototype.filterType = null;
	/**
	 * objet RegExp pour filtrer le nom de fichier
	 */
	JSYG.FileManager.prototype.filterName = null;
	/**
	 * Autorise ou non les doublons
	 */
	JSYG.FileManager.prototype.duplicate = false;
	/**
	 * Taille maximale des fichiers en Ko
	 */
	JSYG.FileManager.prototype.maxSize = null;
	/**
	 * Classe appliquée aux icones
	 */
	JSYG.FileManager.prototype.classIcon = 'fileIcon';
	/**
	 * Fonction(s) à exécuter une fois que le fichier est lu
	 */
	JSYG.FileManager.prototype.onreaded = null;
	/**
	 * Fonction(s) à exécuter à la validation du choix du(des) fichier(s) dans la boîte de dialogue
	 */
	JSYG.FileManager.prototype.ondialogsubmit = null;
	/**
	 * Fonction(s) à exécuter quand le fichier ne remplit pas les critères précisés
	 */
	JSYG.FileManager.prototype.onfileerror = null;
	/**
	 * Fonction(s) à exécuter à la création d'une icône correspondant au fichier
	 * this fait référence à l'objet FileReader, le premier argument à l'objet File et le 2ème à l'icone (élément DOM a)
	 */
	JSYG.FileManager.prototype.oncreateicon = null;
	
	/**
	 * Ouvre la boîte de dialogue native de choix de fichiers.
	 * @param {Boolean} multiple autorise ou non le choix de plusieurs fichiers simultanément.
	 * @param {Function} callback optionnel, function à exécuter sur le(s) fichier(s) à la validation. Le 1er argument est la liste des fichiers (FileList).
	 * @returns {JSYG.FileManager}
	 */
	JSYG.FileManager.prototype.openDialog = function(multiple,callback) {
			
		var that = this;
		
		var input = new JSYG('<input>').attr({type:'file',name:'toto'});
		
		if (multiple) { input.attr('multiple','true'); }
		
		input.on('change',function() {
			that.trigger('dialogsubmit',that,this.files);
			callback && callback.call(that,this.files);
		});
		
		input.node.click();
		
		return this;
	};
	
	/**
	 * Ajoute une liste de fichiers à la liste courante
	 * @param {Object} files objet FileList
	 * @returns {JSYG.FileManager}
	 * @link https://developer.mozilla.org/fr/DOM/FileList
	 */
	JSYG.FileManager.prototype.mergeList = function(files) {
			
		for (var i=0,N=files.length;i<N;i++) this.addItem(files[i]);
		return this;
	};
	
	/**
	 * Remise à zéro de la liste des fichiers
	 * @returns {JSYG.FileManager}
	 */
	JSYG.FileManager.prototype.clearList = function() {
			
		this.list = this.list.splice(0,this.list.length);
		return this;
	};
	
	/**
	 * définit la liste des fichiers
	 * @param {Object} files objet FileList
	 * @returns {JSYG.FileManager}
	 * @link https://developer.mozilla.org/fr/DOM/FileList
	 */
	JSYG.FileManager.prototype.setList = function(files) {
		
		this.clearList();
		this.mergeList(files);
		return this;
	};
	
	/**
	 * Action à exécuter sur chaque fonction de la liste 
	 * @param {Function} callback
	 * @returns {JSYG.FileManager}
	 */
	JSYG.FileManager.prototype.forEachFile = function(callback) {
		this.list.forEach(callback);
		return this;
	};
	
	/**
	 * Ajout d'un fichier à la liste
	 * @param {Object} file objet File
	 * @returns {JSYG.FileManager}
	 * @link https://developer.mozilla.org/fr/DOM/File
	 */
	JSYG.FileManager.prototype.addItem = function(file) {
			
		if (!(file instanceof window.File)) { throw "l'argument n'est pas une instance de window.File"; }
		
		if (!this.checkFile(file)) { return this; }
		
		this.list.push(file);
		
		return this;
	};
	
	/**
	 * Suppression d'un fichier de la liste
	 * @param file indice ou objet File à supprimer
	 * @returns {JSYG.FileManager}
	 */
	JSYG.FileManager.prototype.removeItem = function(file) {
			
		var ind;
					
		if (file instanceof window.File) ind = this.list.indexOf(file);
		else if (typeof file === 'number') ind = file;
		else throw new Error("l'argument n'est pas correct pour la méthode removeItem");
		
		
		if (JSYG.clip(ind,0,this.list.length-1))	this.list.splice(ind,1);
		
		return this;
	};
	
	/**
	 * Renvoie la liste des fichiers sous forme d'objet FormData
	 * @param name
	 * @param formData
	 * @returns {FormData}
	 * @link https://developer.mozilla.org/en/Ajax/FormData
	 */
	JSYG.FileManager.prototype.toData = function(name,formData) {
			
		formData = formData || new window.FormData();
		
		this.list.forEach(function(file,i) {
			formData.append(name+'_'+i,file);
		});
		
		return formData;
	};
	
	/**
	 * création d'une icône correspondant au fichier (lien avec une image et le nom du fichier)
	 * @param {Object} file 
	 * @param {Function} callback optionnel, équivalent à "onicon".
	 * this fait référence à l'objet FileReader, le premier argument à l'objet File et le 2ème à l'icone (élément DOM a)
	 * @returns {Object} élément DOM a
	 */
	JSYG.FileManager.prototype.createIcon = function(file,callback) {
		
		var a = new JSYG('<a>').href('#'),
			img = new JSYG('<img>').attr('alt','icone'),
			that = this;
	
		this.readFile(file,'url',function(url) {
		
			var icone;
			
			if (/\.(doc|xls|pdf|eml)$/i.test(file.name)) {icone = known.exec(file.name)[0].substr(1);}
			else if (/image/.test(file.type)) {icone = 'jpg';}
			else if (/(audio|video)/.test(file.type)) {icone = 'media';}
			else {icone = 'autre';}
		
			img.attr('src', icone == 'jpg' ? url : JSYG.require.baseURL+'/ScanDir/img/'+icone+'.gif');
			
			a.href(url);
			
			that.trigger('createicon',this,file,a);
			callback && callback.call(this,file,a);
		});
			
		a.append(img)
		.textAppend(file.name)
		.attr('title',file.name)
		.on('click',function(e) { e.preventDefault(); })
		.classAdd(this.classIcon);
		
		return a.node;
	};
	
	/**
	 * vérifie que le fichier remplit les critères précisés dans les propriétés de l'objet JSYG.FileManager
	 * Si une erreur est rencontrée, l'évènement "filerror" est déclenché.
	 * @param {Object} file objet File
	 * @returns {Boolean}
	 */
	JSYG.FileManager.prototype.checkFile = function(file) {
				
		var error = '';
				
		if (!(file instanceof File)) error+= "L'argument file doit être une instance de File\n";
		
		if (!this.duplicate) {
			
			var f;
			
			for (var i=0,N=this.list.length;i<N;i++) {
				
				f = this.list[i];
				
				if (f.name === file.name && f.size === file.size && f.type === file.type) {
					error+= "Le fichier \""+file.name+"\" est d�j� dans la liste";
					break;
				}
			}
		}
		
		if (this.filterType && !this.filterType.test(file.type)) {
			error+= "Le format du fichier \""+file.name+"\" n'est pas correct : type "+this.filterType+" requis\n";
		}
		
		if (this.filterName && !this.filterName.test(file.name)) {
			error+= "Le format du fichier \""+file.name+"\" n'est pas correct : type "+this.filterName+" requis\n";
		}

		if (this.maxSize && file.size > this.maxSize*1000) {
			error+= "Le fichier \""+file.name+"\" est trop lourd ("+Math.round(file.size/1000)+"Ko pour un maxi de "+this.maxSize+"Ko)\n";
		}
		
		if (error) this.trigger('fileerror',this,file,error);
				
		return !error;
	};
	
	/**
	 * vérifie la validité d'un nom de fichier
	 * @param name
	 * @returns {Boolean}
	 */
	JSYG.FileManager.checkFileName = function(name) {
		return name.length > 0 && !/[\/:\*\?'"<>\|\\]/.test(name);
	};

	
	/**
	 * Lit un fichier
	 * @param {Object} file objet File
	 * @param {String} format 'url','text' ou 'binary' 
	 * @param {Function} callback optionnel, action à exécuter à la fin de la lecture. Equivalent à l'évènement "readed"
	 * @returns {JSYG.FileManager}
	 */
	JSYG.FileManager.prototype.readFile = function(file,format,callback) {
		
		if (!this.checkFile(file)) return this;
		
		var that = this;
		
		var reader = new window.FileReader();
		
		reader.onload = function(e) {
			that.trigger('readed',this,e.target.result);
			callback && callback.call(this,e.target.result);
		};
					
		var method;
		
		switch (format) {
			case 'url' : method = 'DataURL'; break;
			case 'text' : method = 'Text'; break;
			case 'binary' : method = 'BinaryString'; break;
			default : throw format+' : format incorrect (url,text ou binary requis)';
		}
		
		reader['readAs'+method](file);
		
		return this;
	};
	
	/**
	 * Crée un élément DOM image à partir d'un fichier
	 * @param file objet File
	 * @param format 'html' ou 'svg'
	 * @param callback function à exécuter une fois prêt, le premier argument est l'élément image 
	 * @returns {Image}
	 */
	JSYG.FileManager.prototype.createImage = function(file,format,callback) {
		
		var img = new Image(),
			svg = (format == 'svg'),
			image = svg && new JSYG('<image>');
		
		this.readFile(file,'url',function(url) {
			
			var fctCallback;
			
			img.src = url;
			
			if (svg) {
				
				image.href(url);
				
				fctCallback = function() {
					image.attr({width:this.width,height:this.height});
					callback.call(image.node,image.node);
				};
				
			} else fctCallback = callback;
			
			img.onload = fctCallback;
		});
		
		return svg ? image.node : img;
	};
	
	JSYG.FileManager.prototype.createSVGNode = function(file,callback) {
	
		if (/svg/.test(file.type)) {
		
			this.readFile(file,'text',function(str) {
				var svg = JSYG.parseSVG(str);
				callback.call(svg.node,svg.node);
			});
		}
		else if (/image/.test(file.type)) {
			this.createImage(file,'svg',callback);
		}
		else {
			this.trigger('fileerror',this,file,"Le format du fichier \""+file.name+"\" est incorrect : type image ou svg requis");
		}
	};
	
})();
