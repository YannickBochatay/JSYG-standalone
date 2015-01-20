JSYG.require("Droppable",function() {
	
	"use strict";
	
	/**
	 * <strong>nécessite le module Droppable</strong><br/><br/>
	 * Liste triable par drag&drop souris.
	 * @returns {JSYG}
	 * @see JSYG.Droppable pour une utilisation d�taill�e
	 * @example <pre>new JSYG('li').sortable();
	 * 
	 * //Equivalent � :
	 * new JSYG('li').droppable({
	 * 	list:'li',
	 * 	copy:false,
	 * 	typeOver:'center',
	 * 	ondragover: function(e,cible) { new JSYG(this).inverse(cible); }
	 * });
	 * 
	 * //utilisation avanc�e
	 * new JSYG('li').sortable({
	 * 	ondragover:function(e,cible) { console.log("je d�place "+cible.id); }
	 * 	ondrop:function() { console.log("ma nouvelle position est " + new JSYG('li').indexOf(this)); }
	 * });
	 */
	JSYG.prototype.sortable = function() {
		
		var a = arguments,
			a0 = a[0] || null,
			options = {
				list:this,
				typeOver:'center',
				copy:false
			},
			list = this;
		
		this.each(function() {
						
			if (!a0 || JSYG.isPlainObject(a0)) {
				
				this.droppable('reset');
				
				var opt = {},
					pos = null;
				
				for (var n in a0) {
					if (n == 'ondragover') this.droppable('on','dragover',a0[n]);
					else opt[n] = a0[n];
				}
				
				this.droppable('on','drag',function(e) {
					pos = new JSYG.Point(e.clientX,e.clientY);
				});
								
				this.droppable('on','dragover',function(e,cible) {
					
					var method = "insert" + ( pos.x < e.clientX ? "After" : "Before" ); 
					
					new JSYG(this)[method](cible);
					
					//on met à jour les positions
					list.each(function() {
						var $this = new JSYG(this);
						try { $this.data("dimDroppable", $this.getDim('screen') ); }
						catch(e) {/*éléments n'ayant pas de dimensions (exemple balise defs)*/}
					});
					
				});
								
				this.droppable( JSYG.extend(options,opt) );
			}
			else this.droppable.apply(this,a);
			
		},true);
		
		return this;
	};
	
});