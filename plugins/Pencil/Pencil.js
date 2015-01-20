JSYG.require('Path');

(function() {
	
	"use strict";
	
	/**
	 * <strong>nécessite le module Pencil</strong>
	 * tracé de chemins SVG � la souris
	 * @param arg optionnel, argument JSYG faisant référence � un chemin SVG. Si non défini, un nouveau chemin est cr��.
	 * Il pourra �tre modifi� par la méthode setNode.
	 * @param opt optionnel, objet définissant les options.
	 * @returns {JSYG.Pencil}
	 */
	JSYG.Pencil = function(arg,opt) {
		
		if (!arg) { arg = '<path>'; }
		this.setNode(arg);
		
		if (opt) { this.set(opt); }
	};
	
	JSYG.Pencil.prototype = new JSYG.StdConstruct();
	
	JSYG.Pencil.prototype.constructor = JSYG.Pencil;
	
	/**
	 * Type de segment utilis�s pour le tracé ("L","T", etc). La valeur sp�ciale "autosmooth" permet un lissage
	 * automatique sans se soucier des points de contr�le.
	 */
	JSYG.Pencil.prototype.segment = 'autosmooth';
	/**
	 * Type de tracé "freehand" (� main lev�e) ou "point2point" (ou tout autre valeur) pour tracé point par point.
	 */
	JSYG.Pencil.prototype.type = 'freehand';
	/**
	 * Indique si un tracé est en cours ou non
	 */
	JSYG.Pencil.prototype.inProgress = false;
	/**
	 * Pour le tracé à main levée, indique le nombre d'évènement "mousemove" à ignorer entre chaque point
	 * (sinon on aurait trop de points)
	 */
	JSYG.Pencil.prototype.skip = 4;
	/**
	 * Pour le tracé à main levée, indique la distance minimale entre 2 points pour qu'ils soient pris en compte.
	 */
	JSYG.Pencil.prototype.minDistance = 30;
	/**
	 * Indique la force de l'aimantation en pixels �cran des points extr�mes entre eux.
	 * La valeur null permet d'annuler l'aimantation
	 */
	JSYG.Pencil.prototype.strengthClosingMagnet = 5;
	/**
	 * Ferme syst�matiquement ou non le chemin (segment Z)
	 */
	JSYG.Pencil.prototype.closePath = false;
	/**
	 * fonction(s) � �x�cuter pendant le tracé
	 */
	JSYG.Pencil.prototype.ondraw = false;
	/**
	 * fonction(s) � �x�cuter avant la fin du tracé
	 */
	JSYG.Pencil.prototype.onbeforeend = false;
	/**
	 * fonction(s) � �x�cuter � la fin du tracé
	 */
	JSYG.Pencil.prototype.onend = false;
	/**
	 * fonction(s) � �x�cuter avant un nouveau point (type "point2point" uniquement)
	 */
	JSYG.Pencil.prototype.onbeforenewseg = false;
	/**
	 * fonction(s) � �x�cuter � la création d'un nouveau point
	 */
	JSYG.Pencil.prototype.onnewseg = false;
	/**
	 * définition du chemin svg li� au pinceau.
	 */
	JSYG.Pencil.prototype.setNode = function(arg) {
		this.node = new JSYG(arg).node;
		return this;
	};
	/**
	 * Attache le chemin svg au parent pr�cis�.
	 * @param arg argument JSYG parent.
	 * @returns {JSYG.Pencil}
	 */
	JSYG.Pencil.prototype.appendTo = function(arg) {
		new JSYG(this.node).appendTo(arg);
		return this;
	};
	
	/**
	 * Commence le tracé point � point.
	 * @param e objet JSYG.Event
	 * @returns {JSYG.Pencil}
	 */
	JSYG.Pencil.prototype.drawPoint2Point = function(e)
	{
		if (!this.node.parentNode) { throw new Error("Il faut attacher l'objet path � l'arbre DOM"); return; }

		var path = new JSYG.Path(this.node),
			jSvg = path.offsetParent('farthest'),
			autoSmooth = this.segment.toLowerCase() === 'autosmooth',
			segment = autoSmooth ? 'L' : this.segment,
			mtx = path.getMtx('screen').inverse(),
			xy = new JSYG.Vect(e.clientX,e.clientY).mtx(mtx),
			that = this;
				
		function mousemove(e) {
			
			var mtx = path.getMtx('screen').inverse(),
				xy = new JSYG.Vect(e.clientX,e.clientY).mtx(mtx),
				nbSegs = path.nbSegs(),
				seg = path.getSeg(nbSegs-1),
				pos,first,ref;
			
			if (that.strengthClosingMagnet!=null) {
				
				first = path.getSeg(0);
				ref = new JSYG.Vect(first.x,first.y).mtx(mtx.inverse());
				pos = new JSYG.Vect(e.clientX,e.clientY);
				
				if (JSYG.distance(ref,pos) < that.strengthClosingMagnet) {
					xy.x = first.x;
					xy.y = first.y;
				}
			}
			
			seg.x = xy.x;
			seg.y = xy.y;
			
			path.replaceSeg(nbSegs-1,seg);
			
			if (autoSmooth) path.autoSmooth(nbSegs-1);
			
			that.trigger('draw',that.node,e);
		}
		
		function mousedown(e) {
		
			if (that.trigger('beforenewseg',that.node,e) === false) return;
			
			//si la courbe est ferm�e, un clic suffit pour terminer.
			if (path.nbSegs() > 3 && path.isClosed()) return dblclick(e,true);
			
			if (e.detail === 2) return; //pas d'action au double-clic
			
			var mtx = path.getMtx('screen').inverse(),
				xy = new JSYG.Vect(e.clientX,e.clientY).mtx(mtx);
			
			path.addSeg(segment,xy.x,xy.y,xy.x,xy.y,xy.x,xy.y);
			
			if (autoSmooth) path.autoSmooth(path.nbSegs()-1);
			
			that.trigger('newseg',that.node,e);
		}
		
		function dblclick(e,keepLastSeg) {
			
			if (keepLastSeg!==true) path.removeSeg(path.nbSegs()-1);
			
			if (that.trigger('beforeend',that.node,e) === false) return;
			
			that.end();
			
			that.trigger('end',that.node,e);
		}

		this.end = function() {
			
			var first;
			
			if (that.closePath && !path.isClosed()) {
				first = path.getSeg(0);
				path.addSeg(segment,first.x,first.y,first.x,first.y,first.x,first.y);
			}
			
			if (autoSmooth) path.autoSmooth(path.nbSegs()-1);
			
			jSvg.off({
				'mousemove':mousemove,
				'mousedown':mousedown,
				'dblclick':dblclick
			});
			
			that.inProgress = false;
			
			that.end = function() { return this; };
		};

		if (path.nbSegs() === 0) path.addSeg('M',xy.x,xy.y);
		
		that.inProgress = true;
					
		jSvg.on({
			'mousemove':mousemove,
			'mousedown':mousedown,
			'dblclick':dblclick
		});		
				
		mousedown(e);
		mousemove(e);
		
		return this;
	};
	
	/**
	 * Commence le tracé � main lev�e.
	 * @param e objet JSYG.Event (évènement mousedown).
	 * @returns {JSYG.Pencil}
	 */
	JSYG.Pencil.prototype.drawFreeHand = function(e) {
		
		if (!this.node.parentNode) throw new Error("Il faut attacher l'objet path � l'arbre DOM");
				
		var path = new JSYG.Path(this.node),
			autoSmooth = this.segment.toLowerCase() === 'autosmooth',
			segment = autoSmooth ? 'L' : this.segment,
			jSvg = path.offsetParent('farthest'),
			mtx = path.getMtx('screen').inverse(),
			cpt = 1,
			xy = new JSYG.Vect(e.clientX,e.clientY).mtx(mtx),
			that = this;
		
		function mousemove(e) {
		
			var xy = new JSYG.Vect(e.clientX,e.clientY).mtx(mtx);
			
			if (!that.skip || cpt % (that.skip+1) === 0)  {
				path.addSeg(segment,xy.x,xy.y,xy.x,xy.y,xy.x,xy.y);
				that.trigger('newseg',that.node,e);
			}
			cpt++;
			that.trigger('draw',that.node,e);
		}
		
		function mouseup(e) {
			that.end();
			that.trigger('end',that.node,e);
		}
		
		this.end = function() {
			
			var nbSegs = path.nbSegs(),
				last = path.getLastSeg(),
				first = path.getSeg(0);
		
			jSvg.off('mousemove',mousemove);
			
			new JSYG(document).off('mouseup',mouseup);
						
			if (that.strengthClosingMagnet!=null) {
				
				if (JSYG.distance(first,last) < that.strengthClosingMagnet) {
					last.x = first.x;
					last.y = first.y;
				}
				path.replaceSeg(nbSegs-1,last);
			}
			
			if (this.closePath && !path.isClosed()) {
				path.addSeg(segment,first.x,first.y,first.x,first.y,first.x,first.y);
			}
			
			if (this.minDistance) path.slim(this.minDistance,true);
			
			if (autoSmooth) path.autoSmooth();
			
			that.inProgress = false;
			
			that.end = function() { return this; };
		};
				
		jSvg.on('mousemove',mousemove);
		new JSYG(document).on('mouseup',mouseup);
		
		e.preventDefault();
		
		path.clear();
		path.addSeg('M',xy.x,xy.y);
				
		this.inProgress = true;
		
		return this;
	};
	
	/**
	 * Commence le tracé selon le type défini ("freehand" ou "point2point") 
	 * @param e objet JSYG.Event (évènement mousedown).
	 * @returns
	 */
	JSYG.Pencil.prototype.draw = function(e) {

		if (this.type.toLowerCase() === 'freehand') this.drawFreeHand(e);
		else this.drawPoint2Point(e);
		
		return this;
	};
	
	/**
	 * Termine le tracé.
	 * @returns {JSYG.Pencil}
	 */
	JSYG.Pencil.prototype.end = function() { return this; };
	
}());