(function() {
	
	"use strict";
	
	/**
	 * Gestion d'un formulaire
	 * @param arg argument JSYG faisant référence à un noeud formulaire
	 * @returns {JSYG.Form}
	 */
	JSYG.Form = function(arg) {
		
		var node = new JSYG(arg)[0];
		if (node.tagName!=='FORM') throw new Error('Argument incorrect pour le constructeur JSYG.Form');
		this.node = node;
				
		/**
		 * Champs de formulaire à ne pas prendre en compte
		 */
		//this.skippedElmts = [];
	};
	
	
	JSYG.Form.prototype = {
	
		constructor : JSYG.Form,
		
		_getValue : function(elmt) {
			
			if (!elmt.name) return null;
			//if (!elmt.name || this.skippedElmts.indexOf(elmt.name) !== -1) return null;
			
			var value;
			
			try { value = new JSYG(elmt).val(); }
			catch(e) { return null; }
			
			// checkbox ou radio décochés, pas de donnée
			if ( (elmt.type === 'radio' && !elmt.checked) || (elmt.type === 'checkbox' && value===null) ) return null;
			
			return value;
		},
		/**
		 * sérialisation des données du formulaire
		 * @returns {String}
		 */
		toQueryString : function() {
			
			var str="",
				that = this;
									
			this.elements().each(function() {
				
				var value = that._getValue(this);
				if (value != null) str+= (str ? '&' : '')+this.name+"="+encodeURIComponent(value);			
			});
	
			return str;
		},
		/**
		 * Récupération des données du formulaire sous forme d'objet (noms des champs en cl�s)
		 * @returns {Object}
		 */
		toObject : function() {
			
			var obj={},
				that = this;
						
			this.elements().each(function() {
				var value = that._getValue(this);
				if (value != null) obj[this.name] = value;
			});
			
			return obj;
		},
		
		/**
		 * Récupération des données du formulaire sous forme de chaîne JSON (noms des champs en cl�s)
		 * @returns {String}
		 */
		toJSON : function() {
			return JSON.stringify( this.toObject() );
		},
		
		/**
		 * Récupération des données sous forme d'objet FormData (non compatible IE)
		 * @param formData si défini les données sont ajout�es à cet objet FormData
		 * @returns {FormData}
		 */
		toData : function(formData) {
			
			if (!window.FormData) throw new Error("Ce navigateur n'impl�mente pas le constructeur FormData");
						
			if (!formData) return new FormData(this.node);
			
			this.elements().each(function() {
				
				var value;
				
				if (this.type === 'file') value = this.files && this.files[0];
				else value = that._getValue(this);
				
				if (value != null) formData.append(this.name,value);
			});
	
			return formData;
		},
		
		/**
		 * Réinitialisation de tous les champs du formulaire
		 * @param preventEvent si true, ne déclenche pas les évènements onchange sur les éléments
		 * @returns {JSYG.Form}
		 */
		reset : function(preventEvent) {
		
			var elements = this.node.elements,
				i = elements.length,
				types = ['text','password','textarea','hidden','radio','checkbox','select-one','select-multi'],
				type;
			
			while (i--) {
				
				type = elements.item(i).type.toLowerCase();
				
				if (types.indexOf(type) == -1) continue;
				
				try { new JSYG(elements.item(i)).val('',preventEvent); }
				catch(e) {}
			}
			
			new JSYG(this.node).trigger('reset');
			
			return this;
		},
		
		/**
		 * Initialisation des champs de formulaire à partir d'un xml
		 * @param xml
		 * @param preventEvt si true, ne déclenche pas l'évènement onchange sur les champs
		 * @param tag nom des balises contenant les données
		 * @param attr nom de l'attribut correspondant au nom du champ de formulaire
		 * @returns {JSYG.Form}
		 */
		parseFromXML : function(xml,preventEvt,tag,attr) {
			
			tag = tag || 'champ';
			attr = attr || 'nom';
			
			var champs;
					
			//IE7 plante si on teste l'existence de la méthode xml.getElementsByTagName sur un objet qui ne la poss�de pas
			try { champs = xml.getElementsByTagName(tag); }
			catch(e) { return this; }
									
			var champ,nom,valeur,input,
				i = champs.length;
						
			while (i--) {
				
				champ = champs.item(i);
				
				nom = champ.getAttribute(attr);

				if (!champ.firstChild) continue;
				
				valeur = champ.firstChild.wholeText || champ.firstChild.nodeValue;
								
				input = this.find(nom);
															
				if (input.length > 1) {
					if (input.attr('type') == 'radio') this.radioVal(nom,valeur,preventEvt);
					else throw new Error("Plusieurs champs de formulaire sont nomm�s "+nom);
				}
				else if (input.length == 1) input.val(valeur,preventEvt);
			}
			
			return this;
		},
		
		/**
		 * Initialisation des champs du formulaire à partir d'une chaîne ou objet JSON
		 * @param json
		 * @param preventEvt si true, ne déclenche pas l'évènement onchange sur les champs
		 * @returns {JSYG.Form}
		 */
		parseFromJSON : function(json,preventEvt) {
			
			var input,name=null;
			
			if (typeof json == 'string') json = JSON.parse(json);
						
			for (name in json) {
				
				input = this.find(name);
				
				if (input.length > 1) {
					if (input.attr('type') == 'radio') this.radioVal(name,json[name],preventEvt);
					else throw new Error("Plusieurs champs de formulaire sont nomm�s "+name);
				}
				else if (input.length == 1) input.val(json[name],preventEvt);
			}
			
			return this;
		},
		
		/**
		 * Renvoie l'objet JSYG correspondant au champ de formulaire dont le nom est spécifié en argument
		 * @param name nom du champ
		 * @returns {JSYG} collection JSYG
		 */
		find : function(name) {
			
			var jForm = new JSYG(this.node),
				selector = '[name="'+name+'"]',
				champ = jForm.find(selector);
			
			return champ.length && champ;
		},
		
		elements : function() {
			
			var elements = this.node.elements,
				i,N,tab = [];
			
			if (elements && elements.nodeType == 1) { //IE
				for (i=0,N=elements.length;i<N;i++) tab.push(elements[i]);
				elements = tab;
			}
			
			return new JSYG(elements);
		},
		
		/**
		 * Fixe ou récupère la valeur d'un champ de formulaire de type radio
		 * @param name nom du champ
		 * @param value si définie, fixe la valeur du champ
		 * @param preventEvt si value est définie et preventEvt est true, ne déclenche pas l'évènement "change" sur l'élément. false par défaut.
		 * @returns {String,undefined} la valeur si value est null, undefined sinon.
		 */
		radioVal : function(name,value,preventEvt) {
			
			if (value!=null) {
				
				var oldval = this.radioVal(name),
					selector = 'input[type="radio"][name="'+name+'"][value="'+value+'"]',
					elmt = new JSYG(this.node).find(selector);
				
				if (elmt.length > 1) throw new Error('il y a plusieurs champs "input radio" avec les mêmes attributs "name" et "value"');
				else if (!elmt.length) throw new Error("Aucun champ input de type radio avec name="+name+" et value="+value);
				
				elmt[0].checked = true;
				
				if (oldval !== value && !preventEvt) new JSYG(elmt[0]).trigger('change');
			}
			else {
				
				var list = new JSYG(this.node).find('input[type="radio"][name="'+name+'"]');
				
				for (var i=0,N=list.length;i<N;i++) {
					if (list[i].checked) return list[i].value;
				}
				
				return '';
			}
		}
	};
	
	/**
	 * Sérialise les éléments des champs de formulaire de la collection
	 * sous forme de chaîne de requête.
	 * @returns {String}
	 */
	JSYG.prototype.serialize = function() {
		
		var str = '';
		
		this.each(function(i) {
			
			if (this.tagName !== 'FORM') return;
			
			var form = new JSYG.Form(this);
			str+=form.toQueryString()+'&';
		});
				
		return str.replace(/&$/,'');
	};
	
	/**
	 * Fixe ou récupère la valeur d'un champ de formulaire de type radio
	 * @param name nom du champ
	 * @param value si définie, fixe la valeur du champ
	 * @param preventEvt si value est définie et preventEvt est true, ne déclenche pas l'évènement "change" sur l'élément. false par défaut.
	 * @returns {String,undefined} la valeur si value est null, undefined sinon.
	 */
	JSYG.prototype.radioVal = function(name,value,preventEvt) {
		
		if (value == null) return JSYG.Form.prototype.radioVal.call( this, name, value, preventEvt);
		
		this.each(function() {
			JSYG.Form.prototype.radioVal.call(this, name, value, preventEvt);
		},true);
		
		return this;
	};
	
}());