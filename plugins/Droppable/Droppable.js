JSYG.require('Draggable',function() {
	
	"use strict";
	/**
	 * <strong>nécessite le module Droppable</strong><br/><br/>
	 * Element "d�posable".<br/<br/>
	 * @param arg argument JSYG faisant référence � l'élément
	 * @param opt optionnel, objet définissant les options. Si défini, le module est activ� implicitement.
	 * @returns {JSYG.Droppable}
	 */
	JSYG.Droppable = function(arg,opt) {
		
		this.node = new JSYG(arg).node;
		
		if (opt) this.enable(opt);
	};
	
	JSYG.Droppable.prototype = new JSYG.StdConstruct();
	
	JSYG.Droppable.prototype.constructor = JSYG.Droppable;
	/**
	 * classe appliquée au clone d�plac�
	 */
	JSYG.Droppable.prototype.className = 'droppable';
	/**
	 * classe appliquée aux réceptacles quand l'élément est au dessus
	 */
	JSYG.Droppable.prototype.classActive = 'selected';
	/**
	 * argument JSYG définissant la liste des réceptacles
	 */
	JSYG.Droppable.prototype.list = null;
	/**
	 * Masque ou non l'élément à sa place initiale pendant le darg&drop 
	 */
	JSYG.Droppable.prototype.copy = true;
	/**
	 * Type de survol ('full','partial','center')
	 * @see JSYG.prototype.isOver
	 */
	JSYG.Droppable.prototype.typeOver = 'full';
	/**
	 * Fonction(s) à éxécuter au d�but du drag&drop
	 */
	JSYG.Droppable.prototype.ondragstart = null;
	/**
	 * Fonction(s) à éxécuter quand l'élément survole un réceptacle
	 * le 1er argument est l'évènement JSYG.Event
	 * le 2� argument est l'élément réceptacle
	 */
	JSYG.Droppable.prototype.ondragover = null;
	/**
	 * Fonction(s) à éxécuter quand l'élément quitte un réceptacle
	 * le 1er argument est l'évènement JSYG.Event
	 * le 2� argument est l'élément réceptacle
	 */
	JSYG.Droppable.prototype.ondragout = null;
	/**
	 * Fonction(s) à éxécuter pendant le d�placement
	 */
	JSYG.Droppable.prototype.ondrag = null;
	/**
	 * Fonction(s) à éxécuter � la fin du drag&drop (qu'il ait r�ussi ou non)
	 */
	JSYG.Droppable.prototype.ondrop = null;
	/**
	 * Fonction(s) à éxécuter lors du dépôt sur un réceptacle
	 * le 1er argument est l'évènement JSYG.Event
	 * le 2� argument est l'élément réceptacle
	 */
	JSYG.Droppable.prototype.onsuccess = null;
	/**
	 * Fonction(s) à éxécuter lors du dépôt hors d'un réceptacle 
	 * le 1er argument est l'évènement JSYG.Event
	 */
	JSYG.Droppable.prototype.onfail = null;
	/**
	 * Indique si le module est actif ou non
	 */
	JSYG.Droppable.prototype.enabled = false;
	
	/**
	 * Démarre le drag&drop
	 * @param e évènement JSYG.Event
	 */
	JSYG.Droppable.prototype.start = function(e) {
		
		var jNode = new JSYG(this.node);
				
		var clone = (jNode.type == 'svg') ? new JSYG('<div>').append(jNode.createThumb()) : jNode.clone(),
			dim = jNode.getDim('page'),
			visi = jNode.css('visibility'),
			that = this,
			drag = new JSYG.Draggable(clone),
			lastTarget = null,
			list = new JSYG(this.list);
				
		if (!this.copy && jNode.type=='html') jNode.css('visibility','hidden');
		
		clone
		.styleClone(jNode)
		.css({
			"position":'absolute',
			"z-index":100,
			"visibility":"visible"
		})
		.classAdd(this.className)
		.appendTo(document.body)
		.setDim(dim);
		
		list.each(function() {
			try { this.data("dimDroppable", this.getDim('screen') ); }
			catch(e) {/*éléments n'ayant pas de dimensions (exemple balise defs)*/}
		},true);
		
		
		drag.autoScroll = true;
						
		drag.on('drag',function(e) {
			
			var newTarget = null,
				dimClone = clone.getDim("screen");
			
			list.each(function() {
												
				if (this == that.node ||  this == clone.node) return;
				
				var $this = new JSYG(this),
					dim = $this.data("dimDroppable"),
					over = dim && JSYG.isOver(dimClone, dim, that.typeOver);
												
				if (over && !newTarget) {
				
					newTarget = this;
					
					if (lastTarget !== this) {
						$this.classAdd(that.classActive);
						that.trigger('dragover',that.node,e,this);
					}
				}
				else if (lastTarget == this) {
					
					$this.classRemove(that.classActive);
					that.trigger('dragout',that.node,e,this);
					lastTarget = null;
				}
			});
			
			lastTarget = newTarget;
												
			that.trigger('drag',that.node,e);
		});
		
		drag.on('dragend',function(e) {
			
			var success = false,
				dimClone = clone.getDim("screen");
			
			function onsuccess() {
				jNode.css('visibility',visi);
				clone.remove();
				that.trigger('drop',that.node,e);
				that.trigger('success',that.node,e,this);
			}
			
			function onfail() {
				jNode.css('visibility',visi);
				clone.remove();
				that.trigger('drop',that.node,e);
				that.trigger('fail',that.node,e);
			}
			
			list.each(function() {
				
				var $this = new JSYG(this),
					dim = $this.data("dimDroppable"),
					over = dim && JSYG.isOver(dimClone, dim, that.typeOver);
				
				if (this!==that.node && this!==clone.node && over) {
					
					$this.classRemove(that.classActive);
					e.target = this; //on force la cible (sinon on aura l'élément cloné)
					
					onsuccess.call(this);
					return false;
				}
			});
						
			if (!success) {
				
				var dim = jNode.getDim('page'),
					dimClone = clone.getDim('page'),
					distance = JSYG.distance(dim,dimClone);
				
				if (!JSYG.Animation) {
					clone.setDim({x:dim.x,y:dim.y});
					onfail();
				}
				else {
				
					clone.animate({
						to:{left:dim.x,top:dim.y},
						duration : 200 + distance / 5,
						easing:'swing',
						onend:onfail
					});
				}
			}
		});
		
		this.trigger('dragstart',this.node,e);
				
		drag.start(e);
		
		return this;
	};
	
	/**
	 * Active le module
	 * @param opt optionnel, objet définissant les options
	 * @returns {JSYG.Droppable}
	 */
	JSYG.Droppable.prototype.enable = function(opt) {
		
		this.disable();
		
		if (opt) this.set(opt);
		
		var jNode = new JSYG(this.node);
		
		var start = this.start.bind(this);
		
		jNode.on('_dragstart',start);
		
		var unselectable = jNode.attr("unselectable");
		if (!unselectable) jNode.attr("unselectable","on");
				
		this.disable = function() {
			
			jNode.off('_dragstart',start);
			if (!unselectable) jNode.attrRemove("unselectable");
			this.enabled = false;
			return this;
		};
				
		this.enabled = true;
		return this;
	};
	
	/**
	 * D�sactive le module
	 * @returns {JSYG.Droppable}
	 */
	JSYG.Droppable.prototype.disable = function() {
		
		this.enabled = false;
		return this;
	};
	
	var plugin = JSYG.bindPlugin(JSYG.Droppable);
	/**
	 * <strong>nécessite le module Droppable</strong><br/><br/>
	 * El�ment "d�posable" sur un autre
	 * @returns {JSYG}
	 * @see JSYG.Droppable pour une utilisation d�taill�e
	 * @example <pre>new JSYG('#monElement').droppable({
	 * 	list:'.droppable',
	 * 	ondrop: function(e,cible) { alert("d�pos� dans l'élément"+cible.id); }
	 * });
	 * 
	 * //liste triable :
	 * new JSYG('li').droppable({
	 * 	list:'li',
	 * 	copy:false,
	 * 	typeOver:'center',
	 * 	ondragover: function(e,cible) { new JSYG(this).inverse(cible); }
	 * });
	 * //equivalent �
	 * new JSYG('li').sortable();
	 */
	JSYG.prototype.droppable = function() { return plugin.apply(this,arguments); };
	
});