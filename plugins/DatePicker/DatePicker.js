JSYG.require('DatePicker.css','Date',function() {
	
	"use strict";
	
	/**
	 * <strong>Nécessite le module DatePicker</strong><br/><br/>
	 * Calendrier
	 * @param arg optionnel argument JSYG faisant référence au conteneur du datepicker (si non défini il sera créé).
	 * @param opt optionnel, objet définissant les options.  
	 * @returns {JSYG.DatePicker}
	 */
	JSYG.DatePicker = function(arg,opt) {
		
		if (!arg) arg = '<div>';
		
		/**
		 * div contenant le datepicker
		 */
		this.container = new JSYG(arg).node;
				
		if (opt) this.set(opt);
	};
	
	JSYG.DatePicker.prototype = new JSYG.StdConstruct();
	
	JSYG.DatePicker.prototype.constructor = JSYG.DatePicker;
	
	/**
	 * Valeur courante du datepicker (accessible via la méthode val)
	 * @type JSYG.Date
	 */
	JSYG.DatePicker.prototype._value = new JSYG.Date();
	/**
	 * Classe appliquée au conteneur
	 */
	JSYG.DatePicker.prototype.className = 'datePicker';
	/**
	 * Indique si on peut changer manuellement de mois et d'année
	 */
	JSYG.DatePicker.prototype.browse = true;
	/**
	 * Fonction(s) à exécuter quand on change la valeur
	 */
	JSYG.DatePicker.prototype.onchange = null;
	
	/**
	 * Fonction(s) à exécuter à la création de chaque cellule du tableau
	 * (1er argument l'élément DOM td, 2ème argument la date correspondante, instance de JSYG.Date)
	 */
	JSYG.DatePicker.prototype.oncreatecell = null;
	/**
	 * Date plancher
	 * @type type compatible avec le constructeur JSYG.Date
	 */
	JSYG.DatePicker.prototype.min = null;
	/**
	 * Date plafond
	 * @type type compatible avec le constructeur JSYG.Date
	 */
	JSYG.DatePicker.prototype.max = null;
	
	/**
	 * Effacement du contenu
	 */
	JSYG.DatePicker.prototype.clear = function() {
		
		new JSYG(this.container).empty();
		
		return this;
	};
	
	JSYG.DatePicker.prototype._getMinMax = function() {
		
		return {
			min : this.min && new JSYG.Date(this.min).reset("day").date,
			max : this.max && new JSYG.Date(this.max).add("days",1).reset("day").add("seconds",-1).date
		};
	};
	/**
	 * Crée le datepicker
	 * @param _date1 date sur laquelle le datepicker va se caler. Type compatible avec le constructeur JSYG.Date
	 * @returns {JSYG.DatePicker}
	 */
	JSYG.DatePicker.prototype.create = function(_date1) {
				
		var date1 = new JSYG.Date(_date1 || this._value).set("day",1),
			i,N,date=null,
			dateTest,jTD,tr,
			tabDates = [],
			jours = ['Lu','Ma','Me','Je','Ve','Sa','Di'],
			joursem = date1.get('dayOfWeek'),
			an = date1.get('year'),
			mois = date1.get('month'),
			nomMois,
			table = document.createElement('table'),
			bornes = this._getMinMax(),
			that = this,
			jCont = new JSYG(this.container);

		//définition des dates à afficher
		i = 0;
		
		while (!date || date.get("month") == mois || i%7!=0) {
			date = new JSYG.Date(an,mois,i-joursem+2); //on cale au 1er lundi précédent
			tabDates.push(date);
			i++;
		}
								
		jCont.classAdd(this.className).append(table);
		
		/////////////////////////////////////////
		// Entête du tableau
		tr = table.insertRow(-1);
		tr.className='line1';
		
		///////////////////////////////////////
		// Année précédente
		jTD = new JSYG(tr.insertCell(0));
				
		if (this.browse) {
		
			dateTest = new JSYG.Date(date1).add("-1 year +1 month -1 day").date;
			
			if (!bornes.min || bornes.min <= dateTest) {
				jTD.text('<<').classAdd("browse").on('click',function(){
					that.clear().create( date1.add("years",-1) );
				});
			}
		}
		
		///////////////////////////////////////
		// Mois précédent
		jTD = new JSYG(tr.insertCell(-1));
		
		if (this.browse) {
		
			dateTest = new JSYG.Date(date1).add("-1 day").date;
								
			if (!bornes.min || bornes.min <= dateTest) {
				jTD.text('<').classAdd("browse").on('click',function(){
					that.clear().create( date1.add("months",-1) );
				});
			}
		}
		
		////////////////////////////////////////
		// Nom du mois
		nomMois = date1.toString('MONTH YEAR');
		nomMois = nomMois.charAt(0).toUpperCase() + nomMois.substr(1);
		
		jTD = new JSYG(tr.insertCell(-1)).text( nomMois );
		jTD.classAdd('month');
		jTD.attr('colSpan',3);
		
		
		///////////////////////////////////////
		// Mois suivant
		jTD = new JSYG(tr.insertCell(-1));
		
		if (this.browse) {
			
			dateTest = new JSYG.Date(date1).add("1 month").date;
			
			if (!bornes.max || bornes.max >= dateTest) {
				jTD.text('>').classAdd("browse").on('click',function(){
					that.clear().create(date1.add("1 month"));
				});
			}
		}
		
		///////////////////////////////////////
		// Année suivante
		jTD = new JSYG(tr.insertCell(-1));
		
		if (this.browse) {
			
			dateTest = new JSYG.Date(date1).add("1 year").date;
			
			if (!bornes.max || bornes.max >= dateTest) {
				jTD.text('>>').classAdd("browse").on('click',function() {
					that.clear().create(date1.add("1 year"));
				});
			}
		}
	
		///////////////////////////////////////
		// nom des jours de la semaine
		tr = table.insertRow(-1);
		tr.className='week';

		for (i=0;i<7;i++) new JSYG(tr.insertCell(-1)).text(jours[i]);
		
		
		///////////////////////////////////////
		// jours du mois
		tr = table.insertRow(-1);
		tr.className = 'day';
		
		for (i=0,N=tabDates.length;i<N;i++) {
			
			jTD = new JSYG(tr.insertCell(-1));
			
			date = tabDates[i];
			
			if (date.get("month") != mois) jTD.classAdd('otherMonth');
			if (date.isToday()) jTD.classAdd('today');
			if (date.isWe() || date.isOff()) jTD.classAdd('off');
			
			jTD.text(date.toString('DD'));
			
			if ((bornes.min && bornes.min > date.date) || (bornes.max && bornes.max < date.date)) jTD.classAdd('disable');
			else jTD.on('click', function(date) { that.val(date); }.bind(null,date) );
				
			if ((i+1) % 7 === 0 && (i+1)!=tabDates.length) {
				tr = table.insertRow(-1);
				tr.className = 'day';
			}
			
			if (date.toString() == this._value.toString()) jTD.classAdd("selected");
			
			jTD.data("date",date);
			
			this.trigger("createcell",this.node,jTD.node,date);
		}
			
		return this;
	};
	
	/**
	 * Définit ou renvoie la valeur du datepicker
	 * @param value si précisée définit la valeur du datepicker (type compatible avec le constructeur JSYG.Date)
	 * @param preventEvent optionnel, si true ne déclenche pas l'évènement onchange
	 * @returns {JSYG.DatePicker}
	 */
	JSYG.DatePicker.prototype.val = function(value,preventEvent,_from) {
				
		if (value == null) return this._value;
		
		value = new JSYG.Date(value);
		
		if (value.toString() == this._value.toString()) return this;
		
		var strValue,
			testValue = false,
			bornes = this._getMinMax();
		
		if (bornes.min && bornes.min > value.date || bornes.max && bornes.max < value.date) return false;
		
										//this.node n'existe que pour InputDatePicker mais ça simplifie les choses
		if (this.trigger("beforechange",this.node,value) === false) return false;
			
		this._value = new JSYG.Date(value);
		
		strValue = this._value.toString();
		
		new JSYG(this.container).find("tr.day td").each(function() {
			
			var td = new JSYG(this),
				date = td.data("date"),
				isVal = date && (date.toString() == strValue);
			
			if (!date) return;
			
			td[ isVal ? "classAdd" : "classRemove"]("selected");
			
			if (isVal) testValue = true;
		});
		
		if (!testValue) this.clear().create(value);
		
		//this.node n'existe que pour InputDatePicker mais ça simplifie les choses
		if (_from != 'input') {
			strValue = this._value.toString(this.format);
			new JSYG(this.node).val(strValue,preventEvent);
		}
		
		if (!preventEvent) this.trigger("change",null,value);
				
		return this;
	};
	
	/**
	 * <strong>Nécessite le module DatePicker</strong><br/><br/>
	 * Calendrier
	 * @param arg argument JSYG faisant référence à un champ input
	 * @param opt optionnel, objet définissant les options (ou juste un chaîne définissant le format de date).
	 * Si défini, le module est activé implicitement.  
	 * @returns {JSYG.DatePicker}
	 */
	JSYG.InputDatePicker = function(arg,opt) {
		
		JSYG.DatePicker.call(this);
		
		if (arg) this.setNode(arg);
		
		if (opt) {
			if (typeof opt === 'string') { opt = {format:opt}; }
			this.enable(opt);
		}
	};
	
	JSYG.InputDatePicker.prototype = new JSYG.DatePicker();
	
	JSYG.InputDatePicker.prototype.constructor = JSYG.InputDatePicker;
	/**
	 * Classe appliquée au conteneur du datepicker
	 */
	JSYG.InputDatePicker.prototype.className = 'datePicker input';
	/**
	 * Format de la date
	 * @see JSYG.Date pour les formats possibles
	 */
	JSYG.InputDatePicker.prototype.format = 'YYYY-MM-DD';
	/**
	 * Fonction(s) à exécuter avant la validation de la date.
	 * Le premier argument de la fonction est un objet JSYG.Date représentant la date sélectionnée
	 * Renvoyer false emp�che la validation
	 */
	JSYG.InputDatePicker.prototype.onbeforechange = null;
	/**
	 * Fonction(s) à exécuter à l'affichage du conteneur
	 */
	JSYG.InputDatePicker.prototype.onshow = null;
	/**
	 * Fonction(s) à exécuter quand on masque le conteneur
	 */ 
	JSYG.InputDatePicker.prototype.onhide = null;
	/**
	 * Effet d'affichage ('fade','slide','none')
	 */
	JSYG.InputDatePicker.prototype.effect = 'none';
	/**
	 * Indique si le datepicker est actif ou non
	 */
	JSYG.InputDatePicker.prototype.enabled = false;
	/**
	 * Indique si le datepicker est affiché ou non
	 */
	JSYG.InputDatePicker.prototype.display = false;
	
	/**
	 * Masque le datepicker
 	 * @param {Function} callback optionnel, fonction à exécuter une fois le conteneur masqué.
 	 * this fait référence à l'élément input.
	 * @returns {JSYG.DatePicker}
	 */
	JSYG.InputDatePicker.prototype.hide = function(callback){
		
		if (!this.display) {
			callback && callback.call(this.node);
			return this;
		}
		
		var that = this;
				
		function callbackFct() {
			new JSYG(this).empty().remove();
			that.trigger('hide',that.node);
			callback && callback.call(that.node);
		}
		
		new JSYG(this.container).hide(this.effect,callbackFct);
		
		this.display = false;
		
		return this;
	};
	
	/**
	 * Crée le contenu en fonction de la valeur du datepicker ou de l'argument _date1 si précisé (objet JSYG.Date)
	 */
	JSYG.InputDatePicker.prototype.create = function(_date1) {
				
		JSYG.DatePicker.prototype.create.call(this,_date1);
		
		var table = new JSYG(this.container).find('table').node,
			tr = table.insertRow(-1),
			that = this;
		
		tr.insertCell(-1);
		tr.insertCell(-1);
		
		new JSYG(tr.insertCell(-1))
		.attr('colSpan',3)
		.classAdd('close')
		.text('fermer')
		.on('click',function() { that.hide(); });
				
		return this;
	};
		
	/**
	 * Affiche le datepicker
	 * @param {Function} callback optionnel, fonction à exécuter une fois le conteneur affiché.
	 * this fait référence à l'élément input.
	 * @returns {JSYG.DatePicker}
	 */	
	JSYG.InputDatePicker.prototype.show = function(callback) {
		
		if (this.display) {
			callback && callback.call(this.node);
			return this;
		}
		
		var that = this,
			jCont = new JSYG(this.container),
			jNode = new JSYG(this.node), 
			dim = jNode.getDim(),
			value = this.node.value,
			date = null;
	
		if (value) { 
			try { date = new JSYG.Date(value); }
			catch(e) {}
		}
	
		if (!date) date = new JSYG.Date();
		
		this.clear().create(date).val(date,true);
		
		jCont.appendTo(jNode.offsetParent())
		.setDim({x : dim.x,y : dim.y + dim.height});
		
		function callbackFct() {
			that.trigger('show',that.node);
			callback && callback.call(that.node);
		}
				
		jCont.show(this.effect,callbackFct);
		
		this.display = true;
		
		return this;
	};
	

	JSYG.InputDatePicker.prototype.checkFormat = function(strDate) {
	
		var pattern = this.format.replace(/(YYYY|YEAR)/g,'\\d{4}')
		.replace(/(MONTH|DAY)/g,'\\w{3,}')
		.replace(/MSS/g,'\\d{3}')
		.replace(/MS/g,'\\d{2,3}')
		.replace(/(YY|MM|DD|HH|MI|SS)/g,'\\d{2}')
		.replace(/[SIHMD]/g,'\\d{1,2}');
		
		var regExp = new RegExp(pattern);
		
		return regExp.test(strDate);
	};
	
	/**
	 * Active le datepicker
	 * @param {Object} opt optionnel, objet définissant les options
	 * @returns {JSYG.InputDatePicker}
	 */
	JSYG.InputDatePicker.prototype.enable = function(opt) {
		
		this.disable();
	
		if (opt) {
			if (typeof opt === 'string') opt = {format:opt};
			this.set(opt);
		}
		
		var jNode = new JSYG(this.node),
			autocomplete = jNode.attr('autocomplete'),
			value = this.node.value,
			that = this,
			fcts = {
				focus : function() { that.show(); },
				input : function() {
					
					var resul = null;
					
					try { resul = that.val(this.value,false,'input'); }
					catch(e) {}
					
					if (resul && that.checkFormat(this.value)) that.hide();
					else that.show();
				}
			};
											
		jNode.attr('autocomplete','off').on(fcts);
		
		if (value) { 
			try { this._value = new JSYG.Date(value); }
			catch(e) {}
		}
				
		this.disable = function() {
			this.enabled = false;
			jNode.attr('autocomplete',autocomplete);
			jNode.off(fcts);
			return this;
		};
		
		this.enabled = true;
						
		return this;
	};
		
	JSYG.InputDatePicker.prototype.disable = function() { return this; };
	
	
	var plugin = JSYG.bindPlugin(JSYG.InputDatePicker);
	/**
	 * <strong>Nécessite le module DatePicker</strong><br/><br/>
	 * Activation d'un sélecteur de date sur l'élément input
	 * @returns {JSYG}
	 * @see JSYG.DatePicker et JSYG.InputDatePicker pour une utilisation détaillée
	 * @example <pre>new JSYG("#monInput").datePicker();
	 * 
	 * //utilisation avancée
	 * new JSYG("#monInput").datePicker({
	 * 	effect:'slide',
	 * 	format: 'JJ-MM-AAAA',
	 * 	onbeforechange:function(date) {
	 * 		if (date.isOff()) {
	 * 			alert("Ah non ce jour est férié");
	 * 			return false;
	 * 		}
	 * 	},
	 * 	min : new JSYG.Date().add("-1 year"),
	 * 	max : new JSYG.Date().add("+1 year")
	 * });
	 * 
	 * </pre>
	 */
	JSYG.prototype.datePicker = function() { return plugin.apply(this,arguments); };
	
});