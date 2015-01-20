JSYG.require("Color","Export",function() {
	
	"use trict";
	
	function canvas2gray(canvas) {
		
		var ctx = canvas.getContext('2d'),
			imageData = ctx.getImageData(0,0,canvas.width,canvas.height),
			data = imageData.data,
			i=0,N=data.length,
			color;

	    for(;i<N;i+=4) {
	      color = new JSYG.Color({r:data[i],g:data[i+1],b:data[i+2]});
	      data[i] = data[i+1] = data[i+2] = color.brightness();
	    }
	    
	    ctx.putImageData(imageData,0,0);
	    
	    return canvas;
	}

	/**
	 * Transforme les couleurs de la collection en niveaux de gris
	 * @param recursive si true, transforme récursivement tous les enfants de la collection
	 * @param callback optionnel fonction à exécuter sur chaque élément converti
	 * @param onend optionnel fonction à exécuter une fois que les transformations sont faites
	 */
	JSYG.prototype.toGrayScale = function(recursive) {
		
		var promises = [],
			regURL = /^url\("(.*?)"\)/,
			props = {
				'html' :['background','background-color','color','border-color','box-shadow'],
				'svg' : ['fill','stroke']
			},
			regColors = [
			    /rgba\s*\(\s*([0-9]{1,3})\s*,\s*([0-9]{1,3})\s*,\s*([0-9]{1,3})\s*,\s*([0-9]?\.?[0-9]?)\s*\)/, //RGBA
			    /rgb\s*\(\s*([0-9]{1,3})\s*,\s*([0-9]{1,3})\s*,\s*([0-9]{1,3})\s*\)/, //RGB
			    /#([0-9A-F]{1})([0-9A-F]{1})([0-9A-F]{1})/, //HEXA 3
			    /#([0-9A-F]{2})([0-9A-F]{2})([0-9A-F]{2})/ //HEXA 6
			];
			
		function toGrayScale() {
			
			var jThis = new JSYG(this),
				type = jThis.getType(),
				tag = jThis.getTag(),
				val,matches,
				promise;
						
			if (jThis.type == 'svg' && JSYG.svgGraphics.indexOf(tag) == -1) return;
			
			if (tag == "img" || tag == "image") {
				
				 promise = jThis.toCanvas().then(function(canvas) {
					
					try {
						canvas = canvas2gray(canvas);	
						new JSYG(this).href( canvas.toDataURL() );
					}
					catch(e) {}
					
				});
				 
				promises.push(promise);
			}
			else {
				
				if (type == "svg") {
					
					props[jThis.type].forEach(function(prop) {
						
						var val = jThis.css(prop),
							gray;

						if (!val) return;
						
						try {
							gray = new JSYG.Color(val).grayScale();
							jThis.css(prop, gray.toString() );
						}
						catch(e) { }
					});
				}
				else {
					
					props[jThis.type].forEach(function(prop) {
						
						var val = jThis.css(prop),
							test = false, color;

						if (!val) return;
											
						regColors.forEach(function(regColor) {
							
							var matches = val.match(regColor);
							
							color = matches && matches[0];
													
							if (color) {
								
								try {
									gray = new JSYG.Color(color).grayScale();
									val = val.replace(color,gray);
									test = true;
								}
								catch(e) {} 
							}
							
						});
						
						if (!test) {
							
							for (color in JSYG.Color.htmlCodes) {
																
								if (val.indexOf(color) != -1) {
									
									gray = new JSYG.Color(color).grayScale();
									val = val.replace(color,gray);
									test = true;
								}
							}
						}
											
						test && jThis.css(prop,val);
					});
					
					
					matches = jThis.css("background-image").match(regURL);
					val = matches && matches[1];
					
					if (val) {
						
						promise = new JSYG.Promise(function(resolve,reject) {
							
							var img = new Image(),
								canvas = document.createElement('canvas'),
								ctx = canvas.getContext('2d');
							
							img.onload = function() {
								
								var data;
								
								canvas.width = this.width;
								canvas.height = this.height;
								ctx.drawImage(this,0,0);
								
								canvas = canvas2gray(canvas);
								
								try {
									
									data = canvas.toDataURL("image/png");													
									jThis.css("background-image",'url("'+data+'")');
									resolve();
								}
								catch(e) {
									//security error for cross domain
									reject(e);
								}
							};
							
							img.src = val;
						});
						
						promises.push(promise);
					}
				}
			}
		}
		
		if (recursive) this.each(function() { this.walkTheDom(toGrayScale); },true);
		else this.each(toGrayScale);
														
		return JSYG.Promise.all(promises);
	};


	/**
	 * Fixe la valeur du flou gaussien de la collection ou récupère la valeur du premier élément.
	 * @param stdDeviation optionnel, valeur du flou (0 pas de flou)
	 * @returns valeur du flou si stdDeviation n'est pas défini, la collection JSYG sinon.
	 */
	JSYG.prototype.gaussianBlur = function(stdDeviation) {
		
		if (this.getType() != 'svg') throw new Error("méthode SVG uniquement");
		if (!this.node.parentNode) throw new Error("Il faut d'abord attacher l'élément à l'arbre DOM.");
		
		var root = this.offsetParent(),
			defs,id,reg,filter,feGauss,
			others;
		
		
		filter = this.css("filter");
		
		if (filter) {
			
			reg = /url\((['"]?)(#\w+)\1\)/.exec(filter);
						
			if (reg) {
			
				id = reg[2];
				
				feGauss = root.find(id+" feGaussianBlur");
								
				if (feGauss.length) {
					
					if (stdDeviation == null) {
						
						stdDeviation = feGauss.attr("stdDeviation");
						return Number(stdDeviation) || 0;
					}
					else {
												
						//vérifie qu'il n'y a pas d'autres éléments (hors collection) qui utilisent ce filtre
						others = root.find("*[filter='url("+id+")']").not(this);
					
						if (others.length === 0) {
							feGauss.attr("stdDeviation",stdDeviation);
							return this;
						}
					}
				}
			}
		}
				
		if (stdDeviation == null) return 0;
				
		defs = root.find('defs');
		if (!defs.length) defs = new JSYG('<defs>').prependTo(root);
		
		id = "gaussian_blur"+JSYG.rand(0,99999999);
		
		filter = new JSYG("<filter>").id(id).appendTo(defs);
		feGauss = new JSYG("<feGaussianBlur>").attr({
			"in":"SourceGraphic",
			"stdDeviation":stdDeviation
		}).appendTo(filter);
		
		this.css("filter","url(#"+id+")");
		
		return this;
	};

	/*
	JSYG.prototype.coloredMarker = function(id,type) {
		
		type = type && type.replace(/marker-?/,'');
		
		var tag = this.getTag(),
			color = new JSYG.Color( this.css("stroke") ),
			colorString = color.toString().replace(/#/,''),
			marker = new JSYG("#"+id),
			coloredMarker = new JSYG("#"+id+colorString),
			attr = "marker"+(type ? '-'+type : '');
		
		if (type && ['start','mid','end'].indexOf(type) == -1) throw new Error(type+" : type incorrect");
		
		if (!marker.length) throw new Error("Le marqueur d'id "+id+" est introuvable");
		
		if ( ["path","line","polyline","polygon"].indexOf(tag) == -1)
			throw new Error("Les marqueurs ne s'appliquent pas aux éléments "+tag);
		
		if (!coloredMarker.length) {
			
			coloredMarker = marker.clone().id(id+colorString).appendTo( marker.parent() );
			
			colorString = color.toString();
			
			coloredMarker.walkTheDom(function() {
				if (JSYG.svgShapes.indexOf(this.tagName) == -1) return;
				new JSYG(this).css("stroke",colorString);
			});
		}
		
		this.attr(attr,"#"+id+color);
	};
	*/
	
	
});