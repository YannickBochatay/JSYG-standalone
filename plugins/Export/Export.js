(function() {
	
	"use strict";
	
	/**
	 * Sérialise le noeud sous forme de chaîne de caractère svg 
	 * @param node noeud a représenter
	 * @returns {String}
	 * Le résultat représente un fichier svg complet
	 */
	JSYG.serializeSVG = function(node,_dim) {
			
		var serializer = new XMLSerializer(),
			jNode = new JSYG(node),
			tag = jNode.getTag(),
			type = jNode.type,
			str,entete;
						
		if (tag == "svg") jNode.attr("xmlns",'http://www.w3.org/2000/svg'); //chrome

		str = serializer.serializeToString(jNode.node),
				
		entete = '<?xml version="1.0" encoding="UTF-8"?>'
			+ "\n"
			+ '<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">'
			+ "\n";
		
		//sans �a, la conversion en pdf avec rsvg pose parfois des probl�mes
		str = str.replace(/ \w+:href=/g,' xlink:href=');
		str = str.replace(/ xmlns:\w+="http:\/\/www\.w3\.org\/1999\/xlink"/g,'');
									
		if (tag === 'svg') {
			
			if (!/xmlns:xlink="http:\/\/www\.w3\.org\/1999\/xlink"/.test(str)) { //rsvg toujours
				str = str.replace(/^<svg /,'<svg xmlns:xlink="http://www.w3.org/1999/xlink" ');
			}
			str = entete + str;
		}
		else {
			
			if (!_dim) _dim = jNode.getDim();
			
			entete+= '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"';
			if (_dim) entete+=' width="'+_dim.width+'" height="'+_dim.height+'"';
			entete+= '>\n';
			
			if (type == 'html') {
				str = "<foreignObject width='100%' height='100%'>"
					+ "<style>"+JSYG.getStyleRules()+"</style>"
					+ str
					+ "</foreignObject>";
			}
			
			str = entete + str + "\n" + "</svg>";
		}
					
		return str;
	};

	/**
	 * Convertit le 1er élément de la collection en chaîne de caractères correspondant directement à un fichier SVG.
	 * L'élément lui-même n'est pas impacté.
	 * @param {Boolean} standalone si true, copiera en temps qu'attribut les propriétés de style définies en css,
	 * et les images seront intégrées au document (plutôt que liées).
	 * @param imagesQuality optionnel, qualité de 0 à 100 pour les images. Utile uniquement si standalone est à true.
	 * @returns {JSYG.Promise}
	 */
	JSYG.prototype.toSVGString = function(standalone,imagesQuality) {
		
		var jNode = this.clone(),
			dim = this.getTag() != 'svg' && this.getDim(),
			promise;
			 			
		jNode.find('script').remove();
			
		if (standalone && this.type == "svg") {
			jNode.walkTheDom(function() {
				new JSYG(this).style2attr().attrRemove("style");
			});
		}
		
		if (standalone) promise = jNode.url2data(true,null,imagesQuality);
		else promise = JSYG.Promise.resolve();
				
		return promise.then(function() {
			return JSYG.serializeSVG(jNode,dim);
		});
	};
		
	/**
	 * Convertit la collection en images sous forme d'url.
	 * L'élément lui-même n'est pas impacté.
	* @param {Boolean} standalone si true, copiera en temps qu'attribut les propriétés de style définies en css,
	 * et les images seront intégrées au document (plutôt que liées).
	 * @param imagesQuality optionnel, qualité de 0 à 100 pour les images. Utile uniquement si standalone est à true.
	 * @returns {JSYG.Promise}  
	 * @example <pre>new JSYG('#monSVG").toDataURL().then(function(src) {
	 * 
	 *     new JSYG("<img>").href(src).appendTo('body');
	 *     
	 *     //ou en javascript pur :
	 *     var img = new Image();
	 *     img.src = src;
	 *     document.body.appendChild(img);
	 * 
	 *     //afficher le r�sultat dans une nouvelle fenêtre :
	 *     window.open(src);
	 * });
	 *  
	 */
	JSYG.prototype.toDataURL = function(standalone,imagesQuality) {
				
		return this.toSVGString(standalone,imagesQuality).then(function(svg) {
			return "data:image/svg+xml;base64," + JSYG.base64encode(svg);
		});
	};
		
	/**
	 * Transforme les liens des images de la collection par le contenu de celles-ci.
	 * Utile pour exporter du svg en intégrant les images (sinon le svg reste dépendant des fichiers images).
	 * @param {Boolean} recursive si true cherche dans les descendants de la collection
	 * @param format optionnel, "png", "jpeg" ("png" par défaut)
	 * @param quality optionnel, qualité de 0 à 100
	 * @returns {JSYG.Promise}
	 * @example <pre>//envoi du contenu svg côté serveur :
	 * new JSYG("svg image").url2data().then(function() {
	 *   return JSYG.Ajax({
	 *   	url:"sauve_image.php",
	 *   	method:"post",
	 *   	data:"img="+new JSYG('svg').toSVGString()
	 *   });
	 * });
	 */
	JSYG.prototype.url2data = function(recursive,format,quality) {
		
		var regURL = /^url\("(.*?)"\)/,
			promises = [];
				
		format = format || 'png';
		
		if (quality!=null) quality /= 100;
				
		function url2data() {
			
			var node = this,
				jNode = new JSYG(this),
				tag = jNode.getTag(),
				isImage = ['image','img'].indexOf(tag) != -1,
				matches = null,
				href;
						
			if (!isImage) {
				
				matches = jNode.css("background-image").match(regURL);
				href = matches && matches[1];
			}
			else href = jNode.href();
							
			if (!href || /^data:/.test(href)) return;
			
			promises.push( new JSYG.Promise(function(resolve,reject) {
					
				var img = new Image(),
					canvas = document.createElement('canvas'),
					ctx = canvas.getContext('2d');
				
				img.onload = function() {
					
					var data;
					
					canvas.width = this.width;
					canvas.height = this.height;
					ctx.drawImage(this,0,0);
					
					try {
						
						data = canvas.toDataURL("image/"+format,quality);
											
						if (isImage) jNode.href(data); 
						else jNode.css("background-image",'url("'+data+'")');
						
						resolve(node);
					}
					catch(e) {
						/*security error for cross domain */
						reject(e);
					}
				};
				
				img.onerror = reject;
				
				img.src = href;
				
			}) );
		}

		if (recursive) this.each(function() { this.walkTheDom(url2data); },true);
		else this.each(url2data);
														
		return JSYG.Promise.all(promises);
	};

	/**
	 * Convertit le 1er élément de la collection en élément canvas.
	 * L'élément lui-même n'est pas impacté.
	 * @return {JSYG.Promise}
	 * @example <pre>new JSYG('#monSVG").toCanvas().then(function(canvas) {
	 *   new JSYG(canvas).appendTo("body");
	 * });
	 */
	JSYG.prototype.toCanvas = function() {
		
		var dim = this.getDim( this.offsetParent() ),
			canvas = document.createElement("canvas"),
			node = this.node,
			ctx = canvas.getContext('2d'),
			tag = this.getTag(),
			promise;
			
		canvas.width = dim.width;
		canvas.height = dim.height;
		
		if (tag == "img" || tag == "image") promise = JSYG.Promise.resolve( this.href() );
		else promise = this.toDataURL();
		
		return promise.then(function(src) {
			
			return new JSYG.Promise(function(resolve,reject) {
								
				function onload() {
					
					try {
						ctx.drawImage(this,0,0,dim.width,dim.height);
						resolve(canvas);
					}
					catch(e) { reject(new Error("Impossible de dessiner le noeud "+tag)); }
				}
				
				if (tag == 'canvas') return onload.call(node);
				
				var img = new Image();
				img.onload = onload;
				img.onerror = function() { reject( new Error("Impossible de charger l'image") ); };
				img.src = src;
			});
		});
	};

	/**
	 * Convertit le 1er élément de la collection en fichier image
	 * @param format optionnel, "png", "jpeg" ("png" par défaut)
	 * @param quality optionnel, qualité de 0 à 100
	 */
	JSYG.prototype.toImageFile = function(format,quality) {
		
		format = format || 'png';
		
		if (quality!=null) quality /= 100;
		
		return this.toCanvas(format,quality)
		.then(function(canvas) {
			return new JSYG.Promise(function(resolve,reject) {
				if (canvas.toBlob) canvas.toBlob(resolve,'image/'+format,quality);
				else if (canvas.mozGetAsFile) {
					var file = canvas.mozGetAsFile("myFile",'image/'+format,quality);
					resolve(file);
				}
			});
		});
	};
	
	//Pour éviter plusieurs chargements par JSYG.require
	JSYG.Export = {};
	
}());