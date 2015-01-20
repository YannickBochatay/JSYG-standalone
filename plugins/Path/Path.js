(function() {
	
	"use strict";
	
	/**
	 * <strong>nécessite le module Path</strong><br/><br/>
	 * Chemins SVG
	 * @param arg optionnel, argument JSYG faisant référence � un chemin svg (balise &lt;path&gt;). Si non d�fni, un nouvel élément sera cr��.
	 * @returns {JSYG.Path}
	 */
	JSYG.Path = function(arg) {
		if (!arg) { arg = '<path>'; }
		JSYG.call(this,arg);
	};

	JSYG.Path.prototype = new JSYG();
	
	JSYG.Path.prototype.constructor = JSYG.Path;
	
	/**
	 * Renvoie la longueur totale du chemin
	 * @returns {Number}
	 */
	JSYG.Path.prototype.getLength = function() {
		return this.node.getTotalLength();
	};
	
	/**
	 * Clone le chemin
	 * @returns {JSYG.Path}
	 */
	JSYG.Path.prototype.clone = function() {
		return new JSYG.Path(new JSYG(this.node).clone());
	};
	
	/**
	 * Cr�e un objet segment.
	 * Le premier argument est la lettre correspondant au segment, les arguments suivants sont les m�mes que les méthodes natives d�crites dans la <a href="http://www.w3.org/TR/SVG/paths.html#InterfaceSVGPathElement">norme SVG</a>
	 * @param type {String} lettre correspondant au segment ('M','L','C','Z', etc)
	 * @returns {SVGPathSeg}
	 * @link http://www.w3.org/TR/SVG/paths.html#DOMInterfaces
	 * @example <pre>var path = new JSYG.Path();
	 * var seg = path.createSeg('M',0,0);
	 * var seg2 = path.createSeg('L',50,50);
	 * var seg3 = path.createSeg('C',50,50,30,10,10,30);
	 */
	JSYG.Path.prototype.createSeg = function(type) {
		
		var method = 'createSVGPathSeg',
		type = arguments[0],
		args = Array.prototype.slice.call(arguments,1),
		low = type.toLowerCase();

		switch (low) {
			case 'z' : method+='ClosePath'; break;
			case 'm' : method+='Moveto'; break;
			case 'l' : method+='Lineto'; break;
			case 'c' : method+='CurvetoCubic'; break;
			case 'q' : method+='CurvetoQuadratic'; break;
			case 'a' : method+='Arc'; break;
			case 'h' : method+='LinetoHorizontal'; break;
			case 'v' : method+='LinetoVertical'; break;
			case 's' : method+='CurvetoCubicSmooth'; break;
			case 't' : method+='CurvetoQuadraticSmooth'; break;
			default : throw type+' is not a correct letter for drawing paths !';
		}
		
		if (low !== 'z') { method+= (low === type) ? 'Rel' : 'Abs'; }
		
		return this.node[method].apply(this.node,args);
	};
	/**
	 * Clone un segment
	 * @param seg segment ou indice du segment � cloner.
	 * @returns {SVGPathSeg}
	 */
	JSYG.Path.prototype.cloneSeg  = function(seg) {
		
		if (typeof seg == 'number') seg = this.getSeg(seg);
		
		var letter = seg.pathSegTypeAsLetter,
		args = [letter];
	
		letter = letter.toLowerCase();
			
		if (letter === 'h') args.push(seg.x);
		else if (letter === 'v') args.push(seg.y);
		else {
		
			args.push(seg.x,seg.y);
			
			switch (letter) {
				case 'c' : args.push(seg.x1,seg.y1,seg.x2,seg.y2); break;
				case 'q' : args.push(seg.x1,seg.y1); break;
				case 'a' : args.push(seg.r1,seg.r2,seg.angle,seg.largeArcFlag,seg.sweepFlag); break;
				case 's' : args.push(seg.x2,seg.y2); break;
			}
		}
	
		return this.createSeg.apply(this,args);
	};
	/**
	 * Ajoute un segment � la liste
	 * @returns {JSYG.Path}
	 * @example <pre>var path = new JSYG.Path();
	 * path.addSeg('M',0,0);
	 * path.addSeg('C',50,50,10,30,30,10);
	 * 
	 * // équivalent �
	 * var seg = path.createSeg('M',0,0);
	 * path.appendSeg(seg);
	 * 
	 * seg = path.createSeg('C',50,50,10,30,30,10);
	 * path.appendSeg(seg);
	 */
	JSYG.Path.prototype.addSeg = function() {
		this.appendSeg(this.createSeg.apply(this,arguments));
		return this;
	};
	
	/**
	 * R�initialise la liste des segments
	 * @returns {JSYG.Path}
	 */
	JSYG.Path.prototype.clear = function() {
		this.node.pathSegList.clear();
		return this;
	};
	
	/**
	 * récupère un segment
	 * @param i indice du segment
	 * @returns {SVGPathSeg}
	 */
	JSYG.Path.prototype.getSeg = function(i) {
		return this.node.pathSegList.getItem(i);
	};
	
	/**
	 * récupère la liste des segments sous forme de tableau
	 * @returns {Array}
	 */
	JSYG.Path.prototype.getSegList = function() {
		return JSYG.makeArray(this.node.pathSegList);
	};
	
	/**
	 * Trace le chemin � partir d'une liste de segments
	 * @param segList tableau de segments
	 * @returns {JSYG.Path}
	 */
	JSYG.Path.prototype.setSegList = function(segList) {
		
		var path = new JSYG.Path();
		segList.forEach(function(seg) { path.appendSeg(seg); });
		this.applyPath(path);
		return this;
	};

	/**
	 * récupère le dernier segment
	 * @returns {SVGPathSeg}
	 */
	JSYG.Path.prototype.getLastSeg = function() {
		return this.getSeg(this.nbSegs()-1);
	};
	
	/**
	 * Ajoute un objet segment � la liste
	 * @param seg objet segment
	 * @returns {JSYG.Path}
	 * @example <pre>var path = new JSYG.Path();
	 * var seg = path.createSeg('M',0,0);
	 * path.appendSeg(seg);
	 * 
	 * //equivalent � 
	 * path.addSeg('M',0,0);
	 */
	JSYG.Path.prototype.appendSeg = function(seg) {
		this.node.pathSegList.appendItem( JSYG.support.needCloneSeg ? this.cloneSeg(seg) : seg );
		return this;
	};
	
	/**
	 * Insert un segment � l'indice donn�
	 * @param seg objet segment
	 * @param i indice ou ins�rer le segment
	 * @returns {JSYG.Path}
	 */
	JSYG.Path.prototype.insertSeg = function(seg,i) {
		this.node.pathSegList.insertItemBefore( JSYG.support.needCloneSeg ? this.cloneSeg(seg) : seg, i);
		return this;
	};

	/**
	 * Remplace un segment
	 * @param i indice du segment � remplacer
	 * @param seg nouveau segment
	 * @returns {JSYG.Path}
	 */
	JSYG.Path.prototype.replaceSeg = function(i,seg) {
		
		if (typeof seg == 'string') {
			var args = Array.prototype.slice.call(arguments,1);
			seg = this.createSeg.apply(this,args);
		} else if (JSYG.support.needCloneSeg) {
			seg = this.cloneSeg(seg);
		}
				
		this.node.pathSegList.replaceItem(seg,i);
		return this;
	};
	
	/**
	 * Supprime un segment
	 * @param i indice du segment � supprimer
	 * @returns {JSYG.Path}
	 */
	JSYG.Path.prototype.removeSeg = function(i) {
		this.node.pathSegList.removeItem(i);
		return this;
	};
	
	/**
	 * Ajoute un segment de d�placement
	 * @param x abcisse
	 * @param y ordonn�e
	 * @returns {JSYG.Path}
	 * @example <pre>var path = new JSYG.Path();
	 * path.moveTo(40,40);
	 * 
	 * //équivalent �
	 * path.addSeg('M',40,40);
	 * 
	 * //ou encore � 
	 * var seg = path.createSeg('M',40,40);
	 * path.appendSeg(seg);
	 */
	JSYG.Path.prototype.moveTo = function(x,y) {
		this.addSeg('M',x,y);
		return this;
	};
	
	/**
	 * Ajout un segment de droite
	 * @param x abcisse
	 * @param y ordonn�e
	 * @returns {JSYG.Path}
	 * @example <pre>var path = new JSYG.Path();
	 * path.lineTo(40,40);
	 * 
	 * //équivalent �
	 * path.addSeg('L',40,40);
	 * 
	 * //ou encore � 
	 * var seg = path.createSeg('L',40,40);
	 * path.appendSeg(seg);
	 */
	JSYG.Path.prototype.lineTo = function(x,y) {
		this.addSeg('L',x,y);
		return this;
	};
	
	/**
	 * Ajoute un segment de B�zier (cubique)
	 * @param x1 abcisse du 1er point de contr�le
	 * @param y1 ordonn�e du 1er point de contr�le
	 * @param x2 abcisse du 2� point de contr�le
	 * @param y2 ordonn�e du 2� point de contr�le
	 * @param x abcisse du point d'arriv�e
	 * @param y ordonn�e du point d'arriv�e
	 * @returns {JSYG.Path}
	 * @example <pre>var path = new JSYG.Path();
	 * path.curveTo(40,40,10,30,30,10);
	 * 
	 * //équivalent �
	 * path.addSeg('C',40,40,10,30,30,10);
	 * 
	 * //ou encore � 
	 * var seg = path.createSeg('C',40,40,10,30,30,10);
	 * path.appendSeg(seg);
	 */
	JSYG.Path.prototype.curveTo = function(x1,y1,x2,y2,x,y) {
		this.addSeg('C',x,y,x1,y1,x2,y2);
		return this;
	};
	
	/**
	 * Ferme le chemin (ajout d'un segment "Z")
	 * @returns {JSYG.Path}
	 * <pre>var path = new JSYG.Path();
	 * path.curveTo(40,40,10,30,30,10);
	 * path.close();
	 * 
	 * //équivalent �
	 * path.addSeg('Z');
	 * 
	 * //ou encore � 
	 * var seg = path.createSeg('Z');
	 * path.appendSeg(seg);
	 */
	JSYG.Path.prototype.close = function() {
		this.addSeg('Z');
		return this;
	};

	/**
	 * récupère le point courant.
	 * Un segment donn� ne renseigne que du point d'arriv�e et non du point de départ dont on a souvent besoin.<br/>
	 * <strong>Attention</strong>, cela ne marche qu'avec des segments définis en absolu et non en relatif. Utilisez
	 * si besoin la méthode rel2abs.
	 * @param i indice du segment
	 * @returns {JSYG.Vect}
	 * @see JSYG.Path.prototype.rel2abs
	 * @example <pre>var path = new JSYG.Path();
	 * path.attr('d','M0,0 h50
	 * 
	 * path.getCurPt(0); // {x:20,y:20}
	 * path.getCurPt(1); // {x:20,y:20}
	 * path.getCurPt(2); // {x:20,y:20}
	 */
	JSYG.Path.prototype.getCurPt = function(i) {
					
		var j=i,
		x=null,y=null,
		seg;
		
		if (i===0) {
			seg = this.getSeg(0);
			return new JSYG.Vect(seg.x,seg.y);
		}
		
		while (x==null || y==null) {
			j--;
			if (j<0) {
				if (x == null) { x = 0; }
				if (y == null) { y = 0; }
			}
			else {
				seg = this.getSeg(j);
				if (seg.x!=null && x == null) { x = seg.x; }
				if (seg.y!=null && y == null) { y = seg.y; }
			}
		}
		
		return new JSYG.Vect(x,y);
	};
	
	/**
	 * Remplace un segment relatif par son équivalent en absolu.
	 */
	function rel2absSeg(jPath,ind) {
		
		var seg = jPath.getSeg(ind),
			letter = seg.pathSegTypeAsLetter.toLowerCase(),
			args,ref;
		
		if (seg.pathSegTypeAsLetter !== letter) return; //d�j� en absolu
		
		args = [ind,letter.toUpperCase()];
		ref = jPath.getCurPt(ind);
		
		if (letter === 'h') args.push(ref.x+seg.x);
		else if (letter === 'v') args.push(ref.y+seg.y);
		else if (letter != "z") {
			
			args.push(ref.x+seg.x,ref.y+seg.y);
			
			switch (letter) {
				case 'c' : args.push(ref.x+seg.x1,ref.y+seg.y1,ref.x+seg.x2,ref.y+seg.y2); break;
				case 'q' : args.push(ref.x+seg.x1,ref.y+seg.y1); break;
				case 'a' : args.push(seg.r1,seg.r2,seg.angle,seg.largArcFlag,seg.sweepFlag); break;
				case 's' : args.push(ref.x+seg.x2,ref.y+seg.y2); break;
			}
		}
		
		jPath.replaceSeg.apply(jPath,args);
	};
	
	/**
	 * Applique le trac� d'un autre chemin
	 * @param path argument JSYG faisant référence � un chemin
	 * @returns {JSYG.Path}
	 */
	JSYG.Path.prototype.applyPath = function(path) {
		
		this.attr('d',path.attr('d'));
		
		return this;
	};

	/**
	 * Remplace les segments relatifs en segments absolus
	 * @returns {JSYG.Path}
	 */
	JSYG.Path.prototype.rel2abs = function() {
		
		var jPath = this.clone();
		
		for (var i=0,N=this.nbSegs();i<N;i++) rel2absSeg(jPath,i);
		
		this.applyPath(jPath);
		return this;
	};

	/**
	 * Teste si le chemin contient des arcs ou non (segments a ou A)
	 * @returns {Boolean}
	 */
	JSYG.Path.prototype.hasArcs = function() {
		return /a/i.test(this.attr('d'));
	};

	/**
	 * Teste si le chemin contient des segments relatifs ou non
	 * @returns
	 */
	JSYG.Path.prototype.hasRelSeg = function() {
		return /(m|l|h|v|c|s|q|t|a)/.test(this.attr('d'));
	};

	/**
	 * Teste si le chemin est normalis� ou non. Normalis� signifie que tous ces segments sont absolus et uniquement de type M, L, C ou Z (z).
	 * @returns {Boolean}
	 */
	JSYG.Path.prototype.isNormalized = function() {
		return !/([a-y]|[A-BD-KN-Y])/.test(this.attr('d'));
	};
	
	/**
	 * Renvoie le nombre de segments
	 * @returns
	 */
	JSYG.Path.prototype.nbSegs = function() {
		return this.node.pathSegList.numberOfItems;
	};

	/**
	 * Scinde le segment en deux et renvoie un objet JSYG.Path contenant les deux nouveaux segments.
	 * @param ind indice du segment � diviser en 2.
	 * @returns {JSYG.Path}
	 */
	JSYG.Path.prototype.splitSeg = function(ind) {

		var seg = this.getSeg(ind);
		var current = this.getCurPt(ind);
		var letter = seg.pathSegTypeAsLetter;
		var jPath = new JSYG.Path();
					
		switch (letter) {
			
			case 'C' :
				
				var m1 = {
					x : (current.x+seg.x1)/2,
					y : (current.y+seg.y1)/2
				},
				m2 = {
					x : (seg.x1+seg.x2)/2,
					y : (seg.y1+seg.y2)/2
				},
				m3 = {
					x : (seg.x2+seg.x)/2,
					y : (seg.y2+seg.y)/2
				},
				mm1 = {
					x : (m1.x+m2.x)/2,
					y : (m1.y+m2.y)/2
				},
				mm2 = {
					x : (m2.x+m3.x)/2,
					y : (m2.y+m3.y)/2
				},
				mmm = {
					x : (mm1.x+mm2.x)/2,
					y : (mm1.y+mm2.y)/2
				};
				
				jPath.addSeg('C',mmm.x,mmm.y,m1.x,m1.y,mm1.x,mm1.y);
				jPath.addSeg('C',seg.x,seg.y,mm2.x,mm2.y,m3.x,m3.y);
				
				break;
				
			case 'L' :
				
				var m = { x: (current.x+seg.x)/2, y: (current.y+seg.y)/2 };
				jPath.addSeg('L',m.x,m.y);
				jPath.addSeg('L',seg.x,seg.y);
				break;
				
			case 'Z' :
				
				seg = this.getSeg(0);
				var m = { x: (current.x+seg.x)/2, y: (current.y+seg.y)/2 };
				jPath.addSeg('L',m.x,m.y);
				jPath.addSeg('Z');
				break;
				
			case 'M' :
			
				jPath.addSeg('M',seg.x,seg.y);
				break;
				
			default : throw "You must normalize the jPath";
		}
		
		return jPath;
	};

	/**
	 * Scinde chaque segment du chemin en 2.
	 * @returns {JSYG.Path}
	 */
	JSYG.Path.prototype.split = function() {

		if (!this.isNormalized()) throw new Error("You must normalize the path");
		
		var list,
			jPath = new JSYG.Path(),
			i,N,j,M;
		
		for(i=0,N=this.nbSegs();i<N;i++) {
			
			list = this.splitSeg(i);
			
			for (j=0,M=list.nbSegs();j<M;j++) jPath.appendSeg(list.getSeg(j));
		}
						
		this.applyPath(jPath);
		return this;
	};
	
	/**
	 * Extrait une portion du chemin et renvoie un objet JSYG.Path contenant les segments de cette portion.
	 * @param begin indice du premier segment. Si n�gatif, on part de la fin.
	 * @param end indice du dernier segment. Si n�gatif, on part de la fin. Si non pr�cis�, dernier segment.
	 * @returns {JSYG.Path}
	 */
	JSYG.Path.prototype.slice = function(begin,end) {
		
		var nbseg = this.nbSegs();
				
		if (begin < 0) { begin = nbseg-begin; }
		if (end == null) { end = nbseg-1; }
		else if (end < 0) { end = nbseg-end; }
		
		var jPath = new JSYG.Path();
		
		begin = Math.max(0,begin);
		end = Math.min(nbseg-1,end);
		
		var pt = this.getCurPt(begin);
		jPath.addSeg('M',pt.x,pt.y);
		
		for (var i=begin;i<=end;i++) {
			jPath.appendSeg(this.getSeg(i));
		}
		
		return jPath;		
	};
	
	/**
	 * Inverse l'ordre des points. Pas de diff�rence visuelle.
	 * @returns {JSYG.Path}
	 */
	JSYG.Path.prototype.reverse = function() {
		
		if (!this.isNormalized()) { throw new Error("il faut normaliser le chemin"); }
		
		var jPath = new JSYG.Path(),
			item,current,i,N = this.nbSegs();
		
		for (i=N-1;i>=0;i--) {
		
			item = this.getSeg(i);
			
			if (i===N-1) { jPath.addSeg('M',item.x,item.y); }
			
			current = this.getCurPt(i);
			
			switch(item.pathSegTypeAsLetter) {
			
				case 'L' :
					if (i===N-1) { break; }
					jPath.addSeg("L",current.x,current.y);
					break;
					
				case 'C' :
					jPath.addSeg("C",current.x,current.y,item.x2,item.y2,item.x1,item.y1);
					break;
					
				case 'Z' : case 'z' :
					current = this.getSeg(N-1);
					jPath.addSeg("L",current.x,current.y);
					break;
			}
			
		}
		
		this.applyPath(jPath);
		return this;
	};
	
	/**
	 * Transforme un segment quelconque en une série de segments de droites.
	 * nécessite un segment normalis� (M,L,C,Z,z).
	 * @param ind indice du segment
	 * @param nbsegs nombre de segments de droite pour approximer le segment initial (dans le cas d'un segment C).
	 * @returns {JSYG.Path}
	 */
	JSYG.Path.prototype.seg2Polyline = function(ind,nbsegs) {
		
		nbsegs = nbsegs || 10;
		
		var seg = this.getSeg(ind),
			letter = seg.pathSegTypeAsLetter.toUpperCase(),
			current = this.getCurPt(ind),
			jPath = new JSYG.Path();
		
		switch (letter) {
			
			case 'M' :
				jPath.addSeg('M',current.x,current.y);
				break;
						
			case 'L' :
				jPath.addSeg('L',seg.x,seg.y);
				break;
			
			case 'C' :
				
				var t,a,b,c,d,x,y;
		
				for (var i=0;i<=nbsegs;i++) {
					
					t = i / nbsegs;
			 
					a = Math.pow(1-t,3);
					b = 3 * t * Math.pow(1-t,2);
					c = 3 * Math.pow(t,2) * (1-t);
					d = Math.pow(t,3);
			 
					x = a * current.x + b * seg.x1 + c * seg.x2 + d * seg.x;
					y = a * current.y + b * seg.y1 + c * seg.y2 + d * seg.y;
					
					jPath.addSeg('L',x,y);
				}
				
				break;
			
			case 'Z' : 
				
				seg = this.getSeg(0);
				jPath.addSeg('L',seg.x,seg.y);
				break;
				
			default : throw new Error("Vous devez normaliser le chemin pour applique la méthode seg2Polyline");
		}
		
	    return jPath;		 
	};
	
	/**
	 * Transforme le chemin en une série de segments de droite.
	 * Le chemin doit �tre normalis�. 
	 * @param nbsegs nombre de segments pour approximer les courbes.
	 * @returns {JSYG.Path}
	 */
	JSYG.Path.prototype.toPolyline = function(nbsegs) {

		var list,
			jPath = new JSYG.Path(),
			i,N,j,M;
		
		if (!this.isNormalized()) { throw new Error("Il faut normaliser le chemin pour la méthode toPolyLine"); }
		
		for(i=0,N=this.nbSegs();i<N;i++) {
			
			list = this.seg2Polyline(i,nbsegs);
			
			for (j=0,M=list.nbSegs();j<M;j++) jPath.appendSeg(list.getSeg(j));
		}
		
		this.applyPath(jPath);
		return this;
	};
	
	/**
	 * réduit le nombre de points du chemin en précisant une distance minimale entre 2 points. 
	 * @param minDistance distance minimale en pixels entre 2 points en dessous de laquelle l'un des 2 sera supprimé. 
	 * @param screen si true, cette distance est la distance en pixels visible à l'écran (donc plus faible si le chemin est zoomé), sinon
	 * c'est la distance absolue entre 2 points du chemin.
	 * @returns {JSYG.Path}
	 */
	JSYG.Path.prototype.slim = function(minDistance,screen) {
		
		var i = 0,
			ctm = screen ? this.parent().getMtx('screen') : new JSYG.Matrix(),
			seg,next;
		
		while (i < this.nbSegs()-2) { //pas le dernier point
			
			seg = new JSYG.Point(this.getSeg(i)).mtx(ctm);
			next = new JSYG.Point(this.getSeg(i+1)).mtx(ctm);
			
			if (JSYG.distance(seg,next) < minDistance) {
				
				if (i < this.nbSegs()-2) this.removeSeg(i+1);
				else this.removeSeg(i);
			}
			else i++;
		}
		
		return this;
	};
	
		
	function getSegDist(p, p1, p2) {
	
	    var x = p1.x,
	        y = p1.y,
	        dx = p2.x - x,
	        dy = p2.y - y;
	
	    if (dx !== 0 || dy !== 0) {
	
	        var t = ((p.x - x) * dx + (p.y - y) * dy) / (dx * dx + dy * dy);
	
	        if (t > 1) {
	            x = p2.x;
	            y = p2.y;
	
	        } else if (t > 0) {
	            x += dx * t;
	            y += dy * t;
	        }
	    }
	
	    dx = p.x - x;
	    dy = p.y - y;
	
	    return Math.sqrt(dx * dx + dy * dy);
	}

	/* Tiré de Simplify.js
	 (c) 2013, Vladimir Agafonkin
	 Simplify.js, a high-performance JS polyline simplification library
	 mourner.github.io/simplify-js
	*/
	/**
	 * Simplification du chemin par l'algorithme de Douglas-Peucker
	 * @param tolerance
	 * @returns {JSYG.Path}
	 * 
	 */
	JSYG.Path.prototype.simplify = function(tolerance,screen) {
		    
	    var segs = this.getSegList(),
			len = segs.length,
			sqTolerance = tolerance ? tolerance * tolerance : 1,
			ctm = screen ? this.parent().getMtx('screen') : new JSYG.Matrix(),
	        markers = new Array(len),
	        first = 0,
	        last = len - 1,
	        stack = [],
	        jPath = new JSYG.Path(),
	        i, maxDist, dist, index = null,
	        p,p1,p2;
	    
	    if (len <= 1) return this;
	
	    markers[first] = markers[last] = 1;
	
	    while (last) {
	
	        maxDist = 0;
	
	        for (i = first + 1; i < last; i++) {
	        	
	        	p = new JSYG.Point(segs[i]).mtx(ctm);
	        	p1 = new JSYG.Point(segs[first]).mtx(ctm);
	        	p2 = new JSYG.Point(segs[last]).mtx(ctm);
	        	
	            dist = getSegDist(p,p1,p2);
	
	            if (dist > maxDist) {
	                index = i;
	                maxDist = dist;
	            }
	        }
	
	        if (maxDist > sqTolerance) {
	            markers[index] = 1;
	            stack.push(first, index, index, last);
	        }
	
	        last = stack.pop();
	        first = stack.pop();
	    }
	
	    for (i = 0; i < len; i++) {
	        if (markers[i]) jPath.appendSeg(segs[i]);
	    }
	    
	    this.applyPath(jPath);
	    
	    return this;
	};

	
	
	
	
	/**
	 * Teste si le chemin est fermé ou non
	 * @returns {Boolean}
	 */
	JSYG.Path.prototype.isClosed = function() {
		
		var seg1 = this.getSeg(0),
			seg2 = this.getLastSeg();
		
		return seg2.pathSegTypeAsLetter.toLowerCase() == 'z' || (seg1.x == seg2.x && seg1.y == seg2.y);
	};

	/**
	 * Lisse le chemin de mani�re automatique, sans avoir � définir de points de contr�les.
	 * @param ind optionnel, indice du segment. Si pr�cis�, le chemin ne sera liss� qu'autour de ce point.
	 * @returns {JSYG.Path}
	 */
	JSYG.Path.prototype.autoSmooth = function(ind) {

		var i,N = this.nbSegs(),
			closed = this.isClosed(),
			dontloop = arguments[1] || null,
			min,max,
			seg,nm1,n0,np1,np2,x0,y0,x1,y1,x2,y2,x3,y3,
			tgx0,tgy0,tgx3,tgy3,dx,dy,d,dt0,dt3,ft0,ft3;
				
		if (ind == null) { min = 0; max = N-1; }
		else {
			if (ind === 0 && !dontloop) { this.autoSmooth(N-1,true); }
			if (ind >= N-2 && !dontloop) { this.autoSmooth(0,true); }
			
			min = Math.max(0,ind-2);
			max = Math.min(N-1,ind+2);
		}
		
		if (this.getLastSeg().pathSegTypeAsLetter.toLowerCase() === 'z') {
			seg = this.getSeg(0);
			this.replaceSeg(this.nbSegs()-1, 'L', seg.x, seg.y);
		}
		
		if (N < 3) {return;}
		
		for (i=min;i<max;i++)
		{	
			nm1 = (i===0) ? (closed ? this.getSeg(N-2) : this.getSeg(i)) : this.getSeg(i-1);
			n0 = this.getSeg(i);
			np1 = this.getSeg(i+1);
			np2 = (i===N-2) ? (closed ? this.getSeg(1) : this.getSeg(i+1)) : this.getSeg(i+2);
									
			x0 = n0.x;  y0 = n0.y;
			x3 = np1.x;	y3 = np1.y;
			
			tgx3 = x0 - np2.x;
			tgy3 = y0 - np2.y;
			tgx0 = nm1.x - np1.x;
			tgy0 = nm1.y - np1.y;
			dx  = Math.abs(x0 - x3);
			dy  = Math.abs(y0 - y3);
			d   = Math.sqrt(dx*dx + dy*dy);
			dt3 = Math.sqrt(tgx3*tgx3 + tgy3*tgy3);
			dt0 = Math.sqrt(tgx0*tgx0 + tgy0*tgy0);
			
					
			if (d !== 0)
			{
				ft3 = (dt3 / d) * 3;
				ft0 = (dt0 / d) * 3;
				
				x1 = x0 - tgx0 / ft0;
				y1 = y0 - tgy0 / ft0;
				x2 = x3 + tgx3 / ft3;
				y2 = y3 + tgy3 / ft3;
				
				this.replaceSeg(i+1,'C',np1.x,np1.y,x1,y1,x2,y2);
			}
		}
		
		return this;
	};

	/**
	 * Teste si le point passé en param�tre est � l'int�rieur du polygone défini par le chemin ou non.
	 * Le chemin doit donc �tre ferm� pour �ventuellement renvoyer true.
	 * @param pt objet JSYG.Vect ou objet quelconque ayant les propriétés x et y.
	 * @returns {Boolean}
	 */
	JSYG.Path.prototype.isPointInside = function(pt) {
			
		if (!this.isClosed()) { return false; }
		
		var counter=0;
		var x_inter;
		var mtx = this.getMtx();
		
		var p1=this.getSeg(0);
		p1 = new JSYG.Vect(p1.x,p1.y).mtx(mtx);
		
		var i,N=this.nbSegs();
		
		for (i=1;i<=N;i++) {
			
			var p2 = this.getSeg(i%N);
			p2 = new JSYG.Vect(p2.x,p2.y).mtx(mtx);

			if ( pt.y > Math.min(p1.y, p2.y)) {
				if ( pt.y <= Math.max(p1.y, p2.y)) {
					if ( pt.x <= Math.max(p1.x, p2.x)) {
						if ( p1.y != p2.y ) {
							x_inter = (pt.y - p1.y) * (p2.x - p1.x) / (p2.y - p1.y) + p1.x;
							if ( p1.x == p2.x || pt.x <= x_inter) {
								counter++;
							}
						}
					}
				}
			}
			p1 = p2;
		}
		
		return ( counter % 2 == 1 );
	};
	
	/**
	 * Normalise le chemin (segments M,L,C,Z,z uniquement).
	 * @returns {JSYG.Path}
	 */
	JSYG.Path.prototype.normalize = function() {

		this.rel2abs();
		
		var seg,letter,currentPoint,
			jPath = new JSYG.Path(),
			x,y,
			i=0,N = this.nbSegs(),
			j,M,bezier;

		for (;i<N;i++) {
			
			seg = this.getSeg(i);
			letter = seg.pathSegTypeAsLetter;
			currentPoint = this.getCurPt(i);
			
			if (letter === 'H') {
				jPath.addSeg('L',seg.x,currentPoint.y);
			}
			else if (letter === 'V') {
				jPath.addSeg('L',currentPoint.x,seg.y);
			}
			else if (letter === 'S') { //transform S to C
				if (i === 0 || this.getSeg(i-1).pathSegTypeAsLetter !== 'C') {
					x = currentPoint.x;
					y = currentPoint.y;
				}
				else {
					x = currentPoint.x * 2 - this.getSeg(i-1).x2;
					y = currentPoint.y * 2 - this.getSeg(i-1).y2;
				}
				this.replaceSeg( i, 'C',seg.x,seg.y,x,y,seg.x2,seg.y2 );
				i--;continue;
			}
			else if (letter === 'Q') {
				jPath.addSeg('C',seg.x,seg.y, 1/3 * currentPoint.x + 2/3 * seg.x1, currentPoint.y/3 + 2/3 *seg.y1,2/3 * seg.x1 + 1/3 * seg.x, 2/3 * seg.y1 + 1/3 * seg.y);
			}
			else if (letter === 'T') { //transform T to Q
				if (i === 0 || this.getSeg(i-1).pathSegTypeAsLetter !== 'Q') {
					x = currentPoint.x;
					y = currentPoint.y;
				}
				else {
					x = currentPoint.x * 2 - this.getSeg(i-1).x1;
					y = currentPoint.y * 2 - this.getSeg(i-1).y1;
				}
				this.replaceSeg( i, 'Q',seg.x,seg.y,x,y,seg.x2,seg.y2 );
				i--;continue;
			}
			else if (letter === 'A') {
				bezier = this.arc2bez(i);
				for (j=0,M=bezier.nbSegs();j<M;j++) {
					jPath.appendSeg(bezier.getSeg(j));
				};
			}
			else jPath.appendSeg(seg);
		}
		
		this.applyPath(jPath);
		return this;
	};
	
	/**
	 * Renvoie la longueur d'un segment
	 * @param i indice du segment
	 * @returns {Number}
	 */
	JSYG.Path.prototype.getSegLength = function(i) {
		return this.slice(0,i).getLength()-this.slice(0,i-1).getLength();
	};
	
	/**
	 * Renvoie la longueur du chemin au niveau du segment pr�cis�
	 * @param i indice du segment
	 * @returns
	 */
	JSYG.Path.prototype.getLengthAtSeg = function(i) {
		return this.slice(0,i).getLength();
	};
	
	/**
	 * Renvoie l'indice du segment situ� � la distance pr�cis�e
	 * @param distance
	 * @returns {Number}
	 */
	JSYG.Path.prototype.getSegAtLength = function(distance) {
		return this.node.getPathSegAtLength(distance);
	};
	
	/**
	 * Renvoie le point du chemin � la distance pr�cis�e
	 * @param distance
	 * @returns {JSYG.Vect}
	 */
	JSYG.Path.prototype.getPointAtLength = function(distance) {
		var pt = this.node.getPointAtLength(distance);
		return new JSYG.Vect(pt.x,pt.y);
	};
	
	/**
	 * Renvoie l'angle du chemin � la distance pr�cis�e
	 * @param distance
	 * @returns {Number}
	 */
	JSYG.Path.prototype.getRotateAtLength = function(distance) {
		var pt = this.getTangentAtLength(distance);
		return Math.atan2(pt.y,pt.x) * 180 / Math.PI;
	};
	
	/**
	 * Renvoie la tangente du chemin � la distance pr�cis�e
	 * @param distance
	 * @returns {JSYG.Vect}
	 */
	JSYG.Path.prototype.getTangentAtLength = function(distance) {
		
		if (!this.isNormalized()) throw new Error("Il faut normaliser le chemin");
		
		var ind = this.node.getPathSegAtLength(distance);
		
		if (ind === -1) return null;
		
		var letter;
		var seg;
		
		do {
			seg = this.getSeg(ind);
			if (!seg) { return null; }
			letter = seg.pathSegTypeAsLetter;
		}
		while (letter === 'M' && ++ind)
			
		var current = this.getCurPt(ind);
		//var jPath = new JSYG.Path();
					
		switch (letter) {
			
			case 'C' :
		
				var l1 = this.getLengthAtSeg(ind-1),
					l2 = this.getLengthAtSeg(ind),
					t = (distance-l1) / (l2-l1),
				
					//inspir� de http://www.planetclegg.com/projects/WarpingTextToSplines.html
				
					a = seg.x - 3  * seg.x2 + 3 * seg.x1 - current.x,
					b = 3 * seg.x2 - 6 * seg.x1 + 3 * current.x,
					c = 3 * seg.x1 - 3 * current.x,
					//d = current.x,
					e = seg.y - 3  * seg.y2 + 3 * seg.y1 - current.y,
					f = 3 * seg.y2 - 6 * seg.y1 + 3 * current.y,
					g = 3 * seg.y1 - 3 * current.y,
					//h = current.y,
				
					//point de la courbe de b�zier (equivalent � getPointAtLength)
					//x = a * Math.pow(t,3) + b * Math.pow(t,2) + c * t + d,
					//y = e * Math.pow(t,3) + f * Math.pow(t,2) + g * t + h,
				
					x = 3 * a * Math.pow(t,2) + 2 * b * t + c,
					y = 3 * e * Math.pow(t,2) + 2 * f * t + g,
				
					vect = new JSYG.Vect(x,y).normalize();
		        
		        return vect;
				
			case 'L' :
				
				var vect = new JSYG.Vect(seg.x-current.x,seg.y-current.y).normalize();

				return vect;
				
			case 'M' : case 'Z' :
				
				return null;
								
			default : throw new Error("You must normalize the jPath");
		}
	};
	
	/**
	 * Trouve le segment le plus proche du point donn� en param�tre
	 * @param point objet avec les propriétés x et y.
	 * @param precision nombre de pixels maximal s�parant le point du chemin
	 * @returns {Number} indice du segment trouv�, ou -1
	 */
	JSYG.Path.prototype.findSeg = function(point,precision) {
		
		precision = precision || 1;
		
		var pt,i,N=this.node.getTotalLength();
		for (i=0;i<=N;i++) {
			pt = this.node.getPointAtLength(i);
			if (JSYG.distance(pt,point) < precision) return this.node.getPathSegAtLength(i);
		}
		
		return -1;
	};
	
	function getFromPoint(node,point,result,precision,borneMin,borneMax) {
		
		var pt,i,N=node.getTotalLength();
		
		var distance,ptmin=null,length=null,min=Infinity;

		precision = Math.ceil(precision || 50);
		borneMin = Math.max(borneMin || 0,0);
		borneMax = Math.min(borneMax || N,N);
		
		for (i=borneMin;i<=borneMax;i+=precision) {
			pt = node.getPointAtLength(i);
			distance = JSYG.distance(pt,point);
			if (distance < min ) {
				ptmin = pt;
				min = distance;
				length = i;
				if (distance < 1) break;
			}
		}
		
		if (precision > 1) {
			return getFromPoint(node,point,result,precision/10,length-precision,length+precision);
		}
		
		return result === 'point' ? new JSYG.Vect(ptmin.x,ptmin.y) : length;
	};
	
	/**
	 * Trouve le point de la courbe le plus proche du point passé en param�tre
	 * @param point objet avec les propriétés x et y
	 * @returns {JSYG.Vect}
	 */
	JSYG.Path.prototype.getNearestPoint = function(point) {
		return getFromPoint(this.node,point,'point');
	};
	
	/**
	 * Trouve la longueur de la courbe au point le plus proche du point passé en param�tre
	 * @param point
	 * @returns
	 */
	JSYG.Path.prototype.getLengthAtPoint = function(point) {
		return getFromPoint(this.node,point,'length');
	};

	/*
	JSYG.Path.prototype.getArea = function() {
		
		var area = 0,
			segs = this.getSegList(),
			i,N = segs.length;
		
		if (segs[N-1].pathSegTypeAsLetter.toLowerCase() == 'z') {
			segs[N-1] = null;
			N--;
		}
		
		for (i=0;i<N-1;i++) {
			area += segs[i].x * segs[i+1].y - segs[i+1].x * segs[i].y;   
		}
		
		return area/2;
	};
	
	JSYG.Path.prototype.getCentroid = function() {
		
		var area = this.getArea(),
			segs = this.getSegList(),
			i,N = segs.length,
			x=0,y=0;
		
		for (i=0;i<N-1;i++) {
			x += (segs[i].x + segs[i+1].x) * (segs[i].x * segs[i+1].y - segs[i+1].x * segs[i].y);
			y += (segs[i].y + segs[i+1].y) * (segs[i].x * segs[i+1].y - segs[i+1].x * segs[i].y);
		}
		
		return { x : x/(6*area) , y : y/(6*area) };
	};*/
	
	
	//cod� � partir de http://www.w3.org/TR/2003/REC-SVG11-20030114/implnote.html#ArcConversionEndpointToCenter
	function computeCenterAndAngles(startPoint,seg) {
		
		var rad = seg.angle * Math.PI / 180,
		x1 = startPoint.x,
		y1 = startPoint.y,
		xp1 = Math.cos(rad) * (x1-seg.x) / 2 + Math.sin(rad) * (y1-seg.y) / 2,
		yp1 = -Math.sin(rad) * (x1-seg.x) / 2 + Math.cos(rad) * (y1-seg.y) / 2,
		r1c = Math.pow(seg.r1,2), r2c = Math.pow(seg.r2,2),
		xp1c = Math.pow(xp1,2), yp1c = Math.pow(yp1,2),
		lambda = xp1c / r1c + yp1c / r2c; //Ensure radii are large enough
		
		if (lambda > 1) { 
			seg.r1*=Math.sqrt(lambda);
			seg.r2*=Math.sqrt(lambda);
			r1c = Math.pow(seg.r1,2);
			r2c = Math.pow(seg.r2,2);
		}
		
		var coef = (seg.largeArcFlag === seg.sweepFlag ? -1 : 1 ) * Math.sqrt( Math.max(0,( r1c*r2c - r1c*yp1c - r2c*xp1c ) / ( r1c*yp1c + r2c*xp1c)) ),
		cpx = coef * ( seg.r1 * yp1 ) / seg.r2,
		cpy = coef * ( - seg.r2 * xp1 ) / seg.r1,
		cx = Math.cos(rad) * cpx - Math.sin(rad) * cpy + (x1 + seg.x) / 2,
		cy = Math.sin(rad) * cpx + Math.cos(rad) * cpy + (y1 + seg.y) / 2,
		cosTheta = ( (xp1-cpx)/seg.r1 ) / Math.sqrt( Math.pow( (xp1-cpx)/seg.r1 , 2 ) + Math.pow( (yp1-cpy)/seg.r2 , 2 ) ),
		theta = ( (yp1-cpy)/seg.r2 > 0 ? 1 : -1) * Math.acos(cosTheta),
		u = { x : (xp1-cpx) /seg.r1 , y : (yp1-cpy) /seg.r2 },
		v = { x : (-xp1-cpx)/seg.r1 , y : (-yp1-cpy)/seg.r2 },
		cosDeltaTheta = ( u.x * v.x + u.y * v.y ) / ( Math.sqrt(Math.pow(u.x,2) + Math.pow(u.y,2)) * Math.sqrt(Math.pow(v.x,2) + Math.pow(v.y,2)) ),
		deltaTheta = (u.x*v.y-u.y*v.x > 0 ? 1 : -1) * Math.acos(Math.max(-1,Math.min(1,cosDeltaTheta))) % (Math.PI*2);
			
		if (seg.sweepFlag === false && deltaTheta > 0) { deltaTheta-=Math.PI*2; }
		else if (seg.sweepFlag === true && deltaTheta < 0) { deltaTheta+=Math.PI*2; }
		
		seg.cx = cx;
		seg.cy = cy;
		seg.eta1 = theta;
		seg.eta2 = theta + deltaTheta;
		
		return seg;
	}
		
	function rationalFunction(x,c) {
		return (x * (x * c[0] + c[1]) + c[2]) / (x + c[3]);
	};

	function estimateError(seg,etaA,etaB,bezierDegree) {
		
		var coefs = {

			degree2 : {
		
				low : [
					[
						[  3.92478,   -13.5822,     -0.233377,    0.0128206   ],
						[ -1.08814,     0.859987,    0.000362265, 0.000229036 ],
						[ -0.942512,    0.390456,    0.0080909,   0.00723895  ],
						[ -0.736228,    0.20998,     0.0129867,   0.0103456   ]
					], [
						[ -0.395018,    6.82464,     0.0995293,   0.0122198   ],
						[ -0.545608,    0.0774863,   0.0267327,   0.0132482   ],
						[  0.0534754,  -0.0884167,   0.012595,    0.0343396   ],
						[  0.209052,   -0.0599987,  -0.00723897,  0.00789976  ]
					]
				],
				
				high : [
					[
						[  0.0863805, -11.5595,     -2.68765,     0.181224    ],
						[  0.242856,   -1.81073,     1.56876,     1.68544     ],
						[  0.233337,   -0.455621,    0.222856,    0.403469    ],
						[  0.0612978,  -0.104879,    0.0446799,   0.00867312  ]
					], [
						[  0.028973,    6.68407,     0.171472,    0.0211706   ],
						[  0.0307674,  -0.0517815,   0.0216803,  -0.0749348   ],
						[ -0.0471179,   0.1288,     -0.0781702,   2.0         ],
						[ -0.0309683,   0.0531557,  -0.0227191,   0.0434511   ]
					]
				],
				
				safety : [ 0.001, 4.98, 0.207, 0.0067 ]
			},
			
			degree3 : {
		
				low : [
					[
						[ 3.85268,   -21.229,      -0.330434,    0.0127842   ],
						[ -1.61486,     0.706564,    0.225945,    0.263682   ],
						[ -0.910164,    0.388383,    0.00551445,  0.00671814 ],
						[ -0.630184,    0.192402,    0.0098871,   0.0102527  ]
					],[
						[ -0.162211,    9.94329,     0.13723,     0.0124084  ],
						[ -0.253135,    0.00187735,  0.0230286,   0.01264    ],
						[ -0.0695069,  -0.0437594,   0.0120636,   0.0163087  ],
						[ -0.0328856,  -0.00926032, -0.00173573,  0.00527385 ]
					]
				],
				
				high : [
					[
						[  0.0899116, -19.2349,     -4.11711,     0.183362   ],
						[  0.138148,   -1.45804,     1.32044,     1.38474    ],
						[  0.230903,   -0.450262,    0.219963,    0.414038   ],
						[  0.0590565,  -0.101062,    0.0430592,   0.0204699  ]
					], [
						[  0.0164649,   9.89394,     0.0919496,   0.00760802 ],
						[  0.0191603,  -0.0322058,   0.0134667,  -0.0825018  ],
						[  0.0156192,  -0.017535,    0.00326508, -0.228157   ],
						[ -0.0236752,   0.0405821,  -0.0173086,   0.176187   ]
					]
				],
				
				safety : [ 0.001, 4.98, 0.207, 0.0067 ]
			}
		};

		var eta  = 0.5 * (etaA + etaB);

		if (bezierDegree < 2) {

			// start point
			var aCosEtaA  = seg.r1 * Math.cos(etaA),
			bSinEtaA = seg.r2 * Math.sin(etaA),
			xA = seg.cx + aCosEtaA * Math.cos(seg.angleRad) - bSinEtaA * Math.sin(seg.angleRad),
			yA = seg.cy + aCosEtaA * Math.sin(seg.angleRad) + Math.sin(seg.angleRad) * Math.cos(seg.angleRad),

			// end point
			aCosEtaB = seg.r1 * Math.cos(etaB),
			bSinEtaB = seg.r2 * Math.sin(etaB),
			xB = seg.cx + aCosEtaB * Math.cos(seg.angleRad) - bSinEtaB * Math.sin(seg.angleRad),
			yB = seg.cy + aCosEtaB * Math.sin(seg.angleRad) + bSinEtaB * Math.cos(seg.angleRad),

			// maximal error point
			aCosEta = seg.r1 * Math.cos(eta),
			bSinEta = seg.r2 * Math.sin(eta),
			x = seg.cx + aCosEta * Math.cos(seg.angleRad) - bSinEta * Math.sin(seg.angleRad),
			y = seg.cy + aCosEta * Math.sin(seg.angleRad) + bSinEta * Math.cos(seg.angleRad),

			dx = xB - xA,
			dy = yB - yA;

			return Math.abs(x * dy - y * dx + xB * yA - xA * yB) / Math.sqrt(dx * dx + dy * dy);
		}
		else {
		
			var x = seg.r2 / seg.r1,
			dEta = etaB - etaA,
			cos2 = Math.cos(2 * eta),
			cos4 = Math.cos(4 * eta),
			cos6 = Math.cos(6 * eta),
			coeffs = (x < 0.25) ? coefs['degree'+bezierDegree].low : coefs['degree'+bezierDegree].high,// select the right coeficients set according to degree and b/a
			c0 = rationalFunction(x, coeffs[0][0]) + cos2 * rationalFunction(x, coeffs[0][1]) + cos4 * rationalFunction(x, coeffs[0][2]) + cos6 * rationalFunction(x, coeffs[0][3]),
			c1 = rationalFunction(x, coeffs[1][0]) + cos2 * rationalFunction(x, coeffs[1][1]) + cos4 * rationalFunction(x, coeffs[1][2]) + cos6 * rationalFunction(x, coeffs[1][3]);
			
			return rationalFunction(x, coefs['degree'+bezierDegree].safety) * seg.r1 * Math.exp(c0 + c1 * dEta);
		}
	}

	/**
	 * Convertit un arc en courbe de b�zier
	 * @param ind indice du segment arc ("A")
	 * @param bezierDegree optionnel, degr� de la courbe de b�zier � utiliser (3 par d�faut)
	 * @param defaultFlatness optionnel, 0.5 (valeur par d�faut) semble �tre la valeur adapt�e.
	 * @returns {JSYG.Path}
	 */
	JSYG.Path.prototype.arc2bez = function(ind,bezierDegree,defaultFlatness) {
		
		defaultFlatness = defaultFlatness || 0.5;
		bezierDegree = bezierDegree || 3;
		
		var seg = this.getSeg(ind);
		if (seg.pathSegTypeAsLetter !== 'A') { throw "You can only comput center and angles on 'A' segments"; }
		
		var startPoint = this.getCurPt(ind);
		
		//from Luc Maisonobe www.spaceroots.org
		seg.angleRad = seg.angle*Math.PI/180;
		seg.r1 = Math.abs(seg.r1);
		seg.r2 = Math.abs(seg.r2);
		
		// find the number of B�zier curves needed
		var found = false,
		i,n = 1,
		dEta,etaA,etaB,
		jPath = new JSYG.Path();
		
		computeCenterAndAngles(startPoint,seg);
		
		while ((!found) && (n < 1024)) {
			dEta = (seg.eta2 - seg.eta1) / n;
			if (dEta <= 0.5 * Math.PI) {
				etaB = seg.eta1;
				found = true;
				for (i=0; found && (i<n); ++i) {
					etaA = etaB;
					etaB += dEta;
					found = ( estimateError(seg, etaA, etaB, bezierDegree) <= defaultFlatness );
				}
			}
			n = n << 1;
		}

		dEta = (seg.eta2 - seg.eta1) / n;
		etaB = seg.eta1;

		var aCosEtaB = seg.r1 * Math.cos(etaB),
		bSinEtaB = seg.r2 * Math.sin(etaB),
		aSinEtaB = seg.r1 * Math.sin(etaB),
		bCosEtaB = seg.r2 * Math.cos(etaB),
		xB = seg.cx + aCosEtaB * Math.cos(seg.angleRad) - bSinEtaB * Math.sin(seg.angleRad),
		yB = seg.cy + aCosEtaB * Math.sin(seg.angleRad) + bSinEtaB * Math.cos(seg.angleRad),
		xADot,
		yADot,
		xBDot = -aSinEtaB * Math.cos(seg.angleRad) - bCosEtaB * Math.sin(seg.angleRad),
		yBDot = -aSinEtaB * Math.sin(seg.angleRad) + bCosEtaB * Math.cos(seg.angleRad);
		
		//jPath.addSeg('M',xB,yB);
		
		var t = Math.tan(0.5 * dEta),
		alpha = Math.sin(dEta) * (Math.sqrt(4 + 3 * t * t) - 1) / 3,
		xA,yA,k;
				
		for (var i = 0; i < n; ++i) {

			etaA = etaB;
			xA = xB;
			yA = yB;
			xADot = xBDot;
			yADot = yBDot;

			etaB += dEta;
			aCosEtaB = seg.r1 * Math.cos(etaB);
			bSinEtaB = seg.r2 * Math.sin(etaB);
			aSinEtaB = seg.r1 * Math.sin(etaB);
			bCosEtaB = seg.r2 * Math.cos(etaB);
			xB       = seg.cx + aCosEtaB * Math.cos(seg.angleRad) - bSinEtaB * Math.sin(seg.angleRad);
			yB       = seg.cy + aCosEtaB * Math.sin(seg.angleRad) + bSinEtaB * Math.cos(seg.angleRad);
			xBDot    = -aSinEtaB * Math.cos(seg.angleRad) - bCosEtaB * Math.sin(seg.angleRad);
			yBDot    = -aSinEtaB * Math.sin(seg.angleRad) + bCosEtaB * Math.cos(seg.angleRad);
			
			if (bezierDegree == 1) { jPath.addSeg('L',xB,yB); }
			else if (bezierDegree == 2) {
				k = (yBDot * (xB - xA) - xBDot * (yB - yA)) / (xADot * yBDot - yADot * xBDot);
				jPath.addSeg('Q', xB , yB , xA + k * xADot , yA + k * yADot);
			} else {
				jPath.addSeg('C', xB , yB , xA + alpha * xADot , yA + alpha * yADot, xB - alpha * xBDot, yB - alpha * yBDot);
			}
		}
		
		return jPath;
	};
	
	/**
	 * Constante pour approximer les arcs
	 */
	JSYG.kappa = 4 * (Math.sqrt(2)-1)/3;
	// JSYG.kappa = 0.551915;
	
	
	/**
	 * récupère les propriétés de mise en page
	 */
	function getLayoutAttrs(elmt) {
		
		var tab,
			i=0,N,
			l={};
		
		switch (elmt.tagName) {
			case 'circle' : tab = ['cx','cy','r']; break;
			case 'ellipse' : tab = ['cx','cy','rx','ry']; break;
			case 'rect' : tab = ['x','y','rx','ry','width','height']; break;
			case 'line' : tab = ['x1','y1','x2','y2']; break;
			case 'polygon' : case 'polyline' : tab = ['points']; break;
			case 'path' : tab = ['d']; break;
			default : tab = ['x','y','width','height']; break;		
		}
		
		for(N=tab.length;i<N;i++) l[tab[i]] = parseFloat(elmt.getAttribute(tab[i]) || 0);
		
		return l;
	};
	
	/**
	 * Convertit une forme svg en chemin
	 * @param opt optionnel, objet pouvant avoir les propriétés suivantes :
	 * <ul>
	 * 	<li>normalize : booleen, normalise ou non le chemin</li>
	 * <li>style : booleen, clone ou non les attributs de style de la forme au chemin</li>
	 * <li>transform : booleen, clone ou non l'attribut de trasnformation de la forme au chemin</li>
	 * </ul>
	 * @returns {JSYG.Path}
	 */
	JSYG.prototype.clonePath = function(opt) {
		
		opt = opt || {};
		
		var normalize = opt.normalize,
			style = opt.style,
			transform = opt.transform,
			jPath = new JSYG.Path(),
			l = getLayoutAttrs(this.node),
			tag = this.getTag(),
			kx,ky,points,thisPath,
			i,N,pt;
		
		if (JSYG.svgShapes.indexOf( this.getTag() ) == -1) return null;
		
		switch (tag) {
							
			case 'circle' : case 'ellipse' :
				
				if (tag === 'circle') { l.rx = l.ry = l.r; }
				
				jPath.moveTo(l.cx+l.rx,l.cy);
				
				if (!normalize) {
					
					jPath.addSeg('A', l.cx-l.rx, l.cy, l.rx, l.ry, 0, 0, 1);
					jPath.addSeg('A', l.cx+l.rx, l.cy, l.rx, l.ry, 0, 0, 1);
				
				} else {
				
					kx = JSYG.kappa * l.rx;
					ky = JSYG.kappa * l.ry;
					
					jPath.curveTo(l.cx+l.rx, l.cy+ky, l.cx+kx, l.cy+l.ry, l.cx, l.cy+l.ry);
					jPath.curveTo(l.cx-kx, l.cy+l.ry, l.cx-l.rx, l.cy+ky,l.cx-l.rx, l.cy);
					jPath.curveTo(l.cx-l.rx, l.cy-ky, l.cx-kx, l.cy-l.ry,l.cx, l.cy-l.ry);
					jPath.curveTo(l.cx+kx, l.cy-l.ry, l.cx+l.rx, l.cy-ky,l.cx+l.rx, l.cy);
				}
				
				jPath.close();
			
				break;
				
			case 'rect' :
				
				jPath.moveTo(l.x+l.rx,l.y);
								
				if (normalize) {
				
					if ((l.rx || l.ry)) {
						kx = JSYG.kappa*( l.rx || 0);
						ky = JSYG.kappa*( l.ry || 0);
					}
							
					jPath.lineTo(l.x+l.width-l.rx,l.y);
					if (l.rx || l.ry) { jPath.curveTo( l.x+l.width-l.rx+kx, l.y,l.x+l.width, l.y+l.ry-ky, l.x+l.width, l.y+l.ry); }
					jPath.lineTo(l.x+l.width,l.y+l.height-l.ry);
					if (l.rx || l.ry) { jPath.curveTo(l.x+l.width, l.y+l.height-l.ry+ky, l.x+l.width-l.rx+kx, l.y+l.height,l.x+l.width-l.rx, l.y+l.height); }
					jPath.lineTo(l.x+l.rx,l.y+l.height);
					if (l.rx || l.ry) { jPath.curveTo(l.x+l.rx-kx, l.y+l.height, l.x, l.y+l.height-l.ry+ky,l.x,l.y+l.height-l.ry); }
					jPath.lineTo(l.x,l.y+l.ry);
					if (l.rx || l.ry) { jPath.curveTo(l.x, l.y+l.ry-ky, l.x+l.rx-kx, l.y,l.x+l.rx,l.y); }
				}
				else {
				
					jPath.addSeg('H',l.x+l.width-l.rx);
					if (l.rx || l.ry) { jPath.addSeg('A', l.x+l.width, l.y+l.ry, l.rx, l.ry, 0, 0, 1); }
					jPath.addSeg('V',l.y+l.height-l.ry);
					if (l.rx || l.ry) { jPath.addSeg('A',l.x+l.width-l.rx, l.y+l.height, l.rx, l.ry, 0, 0, 1); }
					jPath.addSeg('H',l.x+l.rx);
					if (l.rx || l.ry) { jPath.addSeg('A', l.x,l.y+l.height-l.ry, l.rx, l.ry, 0, 0, 1); }
					jPath.addSeg('V',l.y+l.ry);
					if (l.rx || l.ry) { jPath.addSeg('A', l.x+l.rx,l.y, l.rx, l.ry, 0, 0, 1); }
				}

				jPath.addSeg('Z');
				
				break;
				
			case 'line' :
			
				jPath.moveTo(l.x1,l.y1).lineTo(l.x2,l.y2);
				break;
			
			case 'polyline' : case 'polygon' :
				
				points = this.node.points;
				
				pt = points.getItem(0);
				jPath.moveTo(pt.x,pt.y);
				
				for(i=1,N=points.numberOfItems;i<N;i++) {
					pt = points.getItem(i);
					jPath.lineTo(pt.x,pt.y);
				}
				
				if (tag === 'polygon') jPath.close();
				
				break;
								
			case 'path' :
			
				thisPath = new JSYG.Path(this.node);
				
				thisPath.getSegList().forEach(function(seg) {
					jPath.appendSeg(seg);
				});
				
				if (normalize) jPath.normalize();
			
				break;
				/*
			default :
				
				jPath.moveTo(l.x,l.y);
				jPath.lineTo(l.x+l.width,l.y);
				jPath.lineTo(l.x+l.width,l.y+l.height);
				jPath.lineTo(l.x,l.y+l.height);
				jPath.lineTo(l.x,l.y);
				jPath.close();
				
				break;
				*/
		}
		
		if (transform) jPath.setMtx(this.getMtx());
		
		if (style) jPath.styleClone(this.node);
		
		return jPath;				
	};
	
	/**
	 * Teste si la forme passée en param�tre est � l'int�rieur de l'élément.
	 * méthode de calcul un peu bourrin, gagnerait � �tre am�lior�.
	 * @param shape argument JSYG faisant référence � une forme SVG
	 * @returns {Boolean}
	 */
	JSYG.prototype.isShapeInside = function(shape) {
			
		if (!this.isClosed()) { return false; }
		
		var jShape = new JSYG(shape).clonePath({normalize:true,transform:true}).css('visibility','hidden').appendTo(this.parent()).mtx2attrs().toPolyline();
		var clone = this.clonePath({normalize:true,transform:true}).css('visibility','hidden').appendTo(this.parent()).mtx2attrs().toPolyline();
		
		var test = true;
		
		for (var i=0,N=jShape.getLength();i<N;i++) {
			if (!clone.isPointInside(jShape.getPointAtLength(i))) {
				test = false;
				break;
			}
		}
		
		jShape.remove();
		clone.remove();
		return test;
	};
	
	/**
	 * Transforme une courbe quelconque en segments de type C
	 * @returns {JSYG.Path}
	 */
	JSYG.Path.prototype.toCubicCurve = function() {
		
		this.normalize();
		
		var segList = this.getSegList(),
			that = this;
	
		segList.forEach(function(seg,i) {
		
			if (seg.pathSegTypeAsLetter != 'L') return;
		
			var prec = segList[i-1],
				newseg = that.createSeg('C',seg.x,seg.y,prec.x,prec.y,seg.x,seg.y);
		
			that.replaceSeg(i,newseg);
		});
		
		return this;
	};
	
})();