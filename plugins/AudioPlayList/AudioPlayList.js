(function() {
		
	"use strict";
	
	JSYG.AudioItem = function(src) {
		if (src) { this.src = src; }
	};
	
	//JSYG.AudioItem.prototype = new JSYG.StdConstruct();
	
	JSYG.AudioItem.prototype.constructor = JSYG.AudioItem;
	
	JSYG.AudioItem.prototype.src = null;
	
	JSYG.AudioItem.prototype.title = null;
	JSYG.AudioItem.prototype.artist = null;
	JSYG.AudioItem.prototype.album = null;
	JSYG.AudioItem.prototype.year = null;
	JSYG.AudioItem.prototype.tracknumber = null;
	/*
	JSYG.AudioItem.prototype.onplay = null;
	JSYG.AudioItem.prototype.onpause = null;
	JSYG.AudioItem.prototype.onstart = null;
	JSYG.AudioItem.prototype.onend = null;
	JSYG.AudioItem.prototype.onchangetime = null;
	JSYG.AudioItem.prototype.onmove = null;
	*/
		
	JSYG.AudioItem.prototype.addTo = function(playList,ind) {
		if (!(playList instanceof JSYG.AudioPlayList)) { throw new Error(item+" n'est pas une instance de JSYG.AudioPlayList"); }
		playList.addItem(this,ind);
		return this;
	};
	
	
	/**
	 * Gestion du retour rapide
	 * @param AudioPlayListObj instance de JSYG.AudioPlayList
	 */
	function FastBackward(AudioPlayListObj) {
		this.playList = AudioPlayListObj;
	}
	
	FastBackward.prototype = {
	
		constructor : FastBackward,
			
		_interval : null,
		
		/**
		 * vitesse de retour rapide
		 */
		speed : 100, 
		/**
		 * Lance le retour rapide
		 * @returns {FastBackward}
		 */
		start : function() {
			
			this.stop();
			
			var that = this;
			var audio = this.playList.node;
			
			this._interval = window.setInterval(function() {
				try {
					if (audio.currentTime < 1) {
						that.stop();
						if (that.playList.current > 0) { that.playList.prev(function() { audio.currentTime = audio.duration; that.start(); }); }
					} else {
						audio.currentTime-=1;
					}
				} catch(e) {}
			},this.speed);
					
			return this;
		},
		
		/**
		 * Arr�te le retour rapide
		 * @returns {FastBackward}
		 */
		stop : function() {
			window.clearInterval(this._interval);
			this._interval = null;
			return this;
		},
		
		/**
		 * D�marre ou arr�te le retour rapide
		 * @returns {FastBackward}
		 */
		toggle : function() {
			if (this._interval) { this.stop(); }
			else { this.start(); }
			return this;
		}
	};
	
	/**
	 * Gestion de l'avance rapide
	 * @param AudioPlayListObj instance de JSYG.AudioPlayList
	 */
	function FastForward(AudioPlayListObj) {
			this.playList = AudioPlayListObj;
	};
	
	FastForward.prototype = {
	
		constructor : FastForward,
			
		_interval : null,
		
		/**
		 * Vitesse d'avance rapide
		 */
		speed : 100, 
		/**
		 * D�marrre l'avance rapide
		 * @returns {FastForward}
		 */
		start : function() {
			
			this.stop();
			
			var that = this;
			var audio = this.playList.node;
			
			this._interval = window.setInterval(function() {
				try {
					if (audio.currentTime >= audio.duration) {
						that.stop();
						if (that.playList.current < this.playList.list.length-1) { that.playList.next(function() { that.start(); }); }
					} else {
						audio.currentTime+=1;
					}
				} catch(e) {}
			},this.speed);
					
			return this;
		},
		/**
		 * Arr�te l'avance rapide
		 * @returns {FastForward}
		 */
		stop : function() {
			window.clearInterval(this._interval);
			this._interval = null;
			return this;
		},
		/**
		 * D�marre ou arr�te l'avance rapide
		 * @returns {FastForward}
		 */
		toggle : function() {
			if (this._interval) { this.stop(); }
			else { this.start(); }
			return this;
		}
	};		
	
	/**
	 * <strong>nécessite le module Audio/AudioPlayList</strong><br/><br/>
	 * Gestion de plusieurs fichiers audio
	 * @param arg optionnel, argument JSYG faisant référence � un élément audio, si non défini un nouvel élément sera cr��
	 * @param opt optionnel, objet définissant les options 
	 */
	JSYG.AudioPlayList = function(arg,opt) {
		
		if (!arg) { arg = '<audio>'; }
		
		this.setNode(arg);
		
		/**
		 * Tableau des urls des fichiers audio
		 */
		this.list = [];
		/**
		 * Tableau des fichiers d�j� lus
		 */
		this.alreadyRead = [];
		/**
		 * Gestion du retour rapide
		 */
		this.fastBackward = new FastBackward(this);
		/**
		 * Gestion de l'avance rapide
		 */
		this.fastForward = new FastForward(this);
				
		if (opt) { this.set(opt); }
	};
	
	JSYG.AudioPlayList.prototype = new JSYG.StdConstruct();
	
	JSYG.AudioPlayList.prototype.constructor = JSYG.AudioPlayList;
		
	JSYG.AudioPlayList.prototype.setNode = function(arg) {
		
		var jNode,fct;
		
		if (this.node) {
			jNode = new JSYG(this.node);
			fct = jNode.data('audioplaylist');
			fct && jNode.off('ended',fct);
		}
		
		jNode = new JSYG(arg);
		
		this.node = jNode.node;
		
		var that = this;
		
		fct = function() {
			if (that.autoNext !== true) { return; }
			else if (!that.next()) { that.stop(); }
		};
				
		jNode.on('ended',fct).data('audioplaylist',fct);
		
		return this;
	};
	/**
	 * Liste es �v�nements natifs
	 */
	JSYG.AudioPlayList.prototype.nativeEvents = ['MozAudioAvailable','abort','canplay','canplaythrough','durationchange','emptied','ended','error','loadeddata','loadedmetadata','loadstart','pause','play','playing','progress','ratechange','seeked','seeking','stalled','suspend','timeupdate','volumechange','waiting'];
	/**
	 * Reprend la lecture une fois tous les morceaux lus
	 */
	JSYG.AudioPlayList.prototype.repeatAll = false;
	/**
	 * R�p�te en boucle le morceau cours 
	 */
	JSYG.AudioPlayList.prototype.repeatTrack = false;
	/**
	 * Lecture al�atoire
	 */
	JSYG.AudioPlayList.prototype.shuffle = false;
	/**
	 * Passage automatique au morceau suivant
	 */
	JSYG.AudioPlayList.prototype.autoNext = true;
	/**
	 * Indice du morceau en cours
	 */
	JSYG.AudioPlayList.prototype.current = 0;
	/**
	 * Revient au d�but du morceau en cours en appelant la méthode prev
	 * ou passe directement au morceau d'avant
	 */
	JSYG.AudioPlayList.prototype.keepTrackOnPrevious = true;
	
	JSYG.AudioPlayList.prototype.set = JSYG.StdConstruct.prototype.set;
	/**
	* Fonction(s) � ex�cuter quand on stoppe la lecture
	*/
	JSYG.AudioPlayList.prototype.onstop = null;
	/**
	* Fonction(s) � ex�cuter quand on passe au morceau pr�c�dent
	*/
	JSYG.AudioPlayList.prototype.onprevious = null;
	/**
	* Fonction(s) � ex�cuter quand on passe au morceau suivant
	*/
	JSYG.AudioPlayList.prototype.onnext = null;
	/**
	* Fonction(s) � ex�cuter quand on change de morceau
	*/
	JSYG.AudioPlayList.prototype.onchange = null;
	/**
	* Fonction(s) � ex�cuter quand on modifie la playliste
	*/
	JSYG.AudioPlayList.prototype.onchangelist = null;
	/**
	* Fonction(s) � ex�cuter quand on modifie la position dans le morceau
	*/
	JSYG.AudioPlayList.prototype.onchangetime = null;
	/**
	* Fonction(s) � ex�cuter quand on ajoute un morceau
	*/
	JSYG.AudioPlayList.prototype.onadd = null;
	/**
	* Fonction(s) � ex�cuter quand on supprime un morceau
	*/
	JSYG.AudioPlayList.prototype.onremove = null;
	/**
	* Fonction(s) � ex�cuter quand on d�place un morceau
	*/
	JSYG.AudioPlayList.prototype.onmove = null;
	/**
	 * Ajout d'�couteurs d'�v�nements
	 * @see JSYG.StdConstruct.prototype.on
	 * @returns {JSYG.AudioPlayList}
	 */
	JSYG.AudioPlayList.prototype.on = function(events,fct) {
		
		if (typeof events === 'object' && fct==null) {
			for (var n in events) { if (events.hasOwnProperty(n)) {	this.on(n,events[n]); } }
			return this;
		}
		
		events = events.split(/ +/);
		
		for (var i=0,N=events.length;i<N;i++) {
			if (this.nativeEvents.indexOf(events[i])!==-1) { new JSYG(this.node).on(events[i],fct); }
			else { JSYG.StdConstruct.prototype.on.call(this,events[i],fct); }
		}
		
		return this;
	};
	
	/**
	 * Retrait d'�couteurs d'�v�nements
	 * @see JSYG.StdConstruct.prototype.off
	 * @returns {JSYG.AudioPlayList}
	 */
	JSYG.AudioPlayList.prototype.off = function(events,fct) {
		
		if (typeof events === 'object' && fct==null) {
			for (var n in events) { if (events.hasOwnProperty(n)) {	this.on(n,events[n]); } }
			return this;
		}
		
		events = events.split(/ +/);
		
		for (var i=0,N=events.length;i<N;i++) {
			if (this.nativeEvents.indexOf(events[i])!==-1) { new JSYG(this.node).off(events[i],fct); }
			else { JSYG.StdConstruct.prototype.off.call(this,events[i],fct); }
		}
		
		return this;
	};
		
	/**
	 * Remise � z�ro de la playliste
	 * @param callback optionnel, fonction � �x�cuter � la fin
	 * @returns {JSYG.AudioPlayList}
	 */
	JSYG.AudioPlayList.prototype.clear = function(callback) {
	
		var that = this;
		
		this.pause(function() {
			that.list.splice(0);
			that.current = 0;
			that.trigger('change');
			callback && callback.call(this);
		});
		
		return this;
	};
	
	/**
	 * Ajout d'un morceau.
	 * @param item instance de JSYG.AudioItem
	 * @param ind optionnel, indice o� ins�rer le morceau (un nombre n�gatif permet de partir de la fin de la liste)
	 * @returns {JSYG.AudioPlayList}
	 */
	JSYG.AudioPlayList.prototype.addItem = function(item,ind) {
		
		if (!(item instanceof JSYG.AudioItem)) { throw new Error(item+" n'est pas une instance de JSYG.AudioItem"); }
		
		if (ind == null) { this.list.push(item); }
		else {
			if (ind < 0) { ind = this.list.length - ind; }
			this.list.splice(ind,0,src);
			if (this.current >= ind) { this.current++; }
		}
		
		//pr�chargement
		new Audio().src = item.src;
		
		this.trigger('add');
		this.trigger('change');
			
		return this;
	};

	/**
	 * Suppression d'un morceau.
	 * @param arg indice du morceau ou instance de JSYG.AudioItem
	 * @returns {JSYG.AudioPlayList}
	 */
	JSYG.AudioPlayList.prototype.removeItem = function(arg) {
		
		var ind = !JSYG.isNumeric(arg) ? this.list.indexOf(arg) : arg;
		if (ind === -1) { return this; }
		
		this.list.splice(ind,1);
		
		if (this.list.length === 0) {
			this.current = 0;
			this.node.src = null;
		}
		else if (this.current > ind) {
			this.current--;
			this.trigger('remove');
			this.trigger('changelist');
		}
		else if (this.current === ind) {
			var that = this;
			this.stop(function() {
				that.trigger('remove');
				that.trigger('changelist');
			});
		}
		
		return this;
	};
	
	/**
	 * Change la position d'un morceau dans la playliste
	 * @param arg indice du morceau ou instance de JSYG.AudioItem
	 * @param ind indice o� d�placer le morceau (un nombre n�gatif permet de partir de la fin de la liste)
	 * @returns {JSYG.AudioPlayList}
	 */
	JSYG.AudioPlayList.prototype.moveItem = function(arg,ind) {
		
		var oldInd = !JSYG.isNumeric(arg) ? this.list.indexOf(arg) : arg;
		if (oldInd === -1) { return this; }
		
		if (ind < 0) { ind = this.list.length - ind; }
				
		if (ind == oldInd) { return this; }
		
		var item = this.list[oldInd];
		
		this.list.splice(oldInd,1);
		this.list.splice(ind,0,item);
				
		if (this.current == oldInd) { this.current = ind; }
		else {
			if (this.current > oldInd) { this.current--; }
			if (this.current >= ind) { this.current++; }
		}
		
		this.trigger('move');
		this.trigger('changelist');
										
		return this;
	};

	/**
	 * définit les morceaux de la playliste
	 * @param tab tableau d'instances de JSYG.AudioItem
	 * @param callback fonction � ex�cuter une fois que la liste est définie
	 * @returns {JSYG.AudioPlayList}
	 */
	JSYG.AudioPlayList.prototype.setList = function(tab,callback) {
		var that = this;
		this.pause(function() {
			that.list = tab;
			that.current = 0;
			that.trigger('change');
			callback && callback.call(this);
		});
		return this;
	};

	/**
	 * Passe au morceau pr�c�dent (selon les options définies de r�p�tition)
	 * @param callback optionnel, fonction � �x�cuter une fois le morceau pr�t
	 * @returns {JSYG.AudioPlayList} ou {false} si pas de morceau pr�c�dent
	 */
	JSYG.AudioPlayList.prototype.prev = function(callback) {
		
		if (this.list.length === 0) { throw "La playliste est vide"; }
		
		var that = this;
		
		var fct = function() {
			that.trigger('previous');
			callback && callback.call(this);
		};
		
		if (!this.node.src) { return this.goTo(this.current,fct); }
		
		if (this.alreadyRead.indexOf(this.current) === -1) {
			this.alreadyRead.push(this.current);
		}
			
		if (this.repeatTrack || (this.keepTrackOnPrevious && this.node.readyState === 4 && this.node.currentTime > 1 )) {
			this.goTo(this.current,fct);
		}
		else if (this.shuffle) {
			
			if (this.alreadyRead.length === this.list.length) {
				 if (this.repeatAll) {
					 this.alreadyRead = [];
					 return this.prev(fct);
				 }
				 else { return false; }
			}
			
			var ind;
			
			do { ind = rand(0,this.list.length-1); }
			while (this.alreadyRead.indexOf(ind)!==-1);
			
			this.goTo(ind,fct);
		}
		else if (this.current === 0) {
			if (this.repeatAll !== true) {return false; }
			else { this.goTo(this.list.length-1,fct); }
		}
		else { this.goTo(this.current-1,fct); }
			
		return this;
	};

	/**
	 * Passe au morceau pr�c�dent (selon les options définies de r�p�tition)
	 * @param callback optionnel, fonction � �x�cuter une fois le morceau pr�t
	 * @returns {JSYG.AudioPlayList} ou {false} si pas de morceau pr�c�dent
	 */
	JSYG.AudioPlayList.prototype.next = function(callback) {
			
		if (this.list.length === 0) { throw "La playliste est vide"; }
		
		var that = this;
		
		var fct = function() {
			that.trigger('next');
			callback && callback.call(this);
		};
		
		if (!this.node.src) { return this.goTo(this.current,fct); }
		
		if (this.alreadyRead.indexOf(this.current) === -1) {
			this.alreadyRead.push(this.current);
		}
			
		if (this.repeatTrack) {
			this.goTo(this.current,fct);
		}
		else if (this.shuffle) {
			
			if (this.alreadyRead.length === this.list.length) {
				 if (this.repeatAll) {
					 this.alreadyRead = [];
					 return this.next(fct);
				 }
				 else { return false; }
			}
			
			var ind;
			
			do { ind = rand(0,this.list.length-1); }
			while (this.alreadyRead.indexOf(ind)!==-1);
			
			this.goTo(ind,fct);
		}
		else if (this.current === this.list.length-1) {
			if (this.repeatAll !== true) {return false; }
			else { this.goTo(0,fct); }
		}
		else { this.goTo(this.current+1,fct); }
			
		return this;
	};
	
	/**
	 * Lit le morceau passé en argument
	 * @param ind indice du tableau ou nom du morceau
	 * @param callback optionnel, fonction � �x�cuter une fois le morceau pr�t
	 * @returns {JSYG.AudioPlayList}
	 */
	JSYG.AudioPlayList.prototype.goTo = function(ind,callback) {
		
		if (!JSYG.isNumeric(ind)) { ind = this.list.indexOf(ind); }
		if (ind < 0 || ind > this.list.length-1) { return this; }
		
		var playing = this.isPlaying();
		
		this.node.src = this.list[ind].src;
				
		this.current = ind;
		
		var that = this;
		
		var fct = function() {
			that.node.currentTime = 0;
			if (playing) { that.node.play(); }
			that.trigger('change');
			callback && callback.call(this);
		};
		
		if (this.node.readyState === 4) { fct(); }
		else { new JSYG(this.node).on('unique-loadeddata',fct); }
		
		return this;
	};

	/**
	 * Renvoie ou défini l'url du morceau en cours
	 * @param src url du morceau � jouer
	 * @returns {String,JSYG.AudioPlayList} l'url du morceau si src est indéfini, l'objet lui-m�me sinon
	 */
	JSYG.AudioPlayList.prototype.currentSrc = function(src,callback) {
	
		if (src) { this.goTo(src,callback); }
		else {
			src = this.list[this.current].src;
			callback && callback.call(this.node);
			return src;
		}
	};
	
	/**
	 * Joue la playliste (l� o� elle en est)
	 * @param callback optionnel, fonction � �x�cuter une fois le morceau pr�t
	 * @returns {JSYG.AudioPlayList}
	 */
	JSYG.AudioPlayList.prototype.play = function(callback) {
		
		if (!this.node.src) {
			var that = this;
			this.goTo(0,function() { that.play(callback); });
		}
		else if (this.isPlaying()) {
			callback && callback.call(this.node);
		}
		else {
			if (callback) { new JSYG(this.node).on('unique-playing',callback); }
			this.node.play();
		}
		
		return this;
	};
	
	/**
	 * Arr�te temporairement la lecture
	 * @param callback optionnel, fonction � �x�cuter une fois le morceau pr�t
	 * @returns {JSYG.AudioPlayList}
	 */
	JSYG.AudioPlayList.prototype.pause = function(callback) {
		
		if (this.node.paused) {
			callback && callback.call(this.node);
		}
		else {
			if (callback) { new JSYG(this.node).on('unique-pause',callback); }
			this.node.pause();
		}
		
		return this;
	};
	
	/**
	 * Stoppe la lecture et revient en d�but de playliste
	 * @param callback optionnel, fonction � �x�cuter une fois la lecture arr�t�e
	 * @returns {JSYG.AudioPlayList}
	 */
	JSYG.AudioPlayList.prototype.stop = function(callback) {
		
		var that = this;
		this.pause(function() { that.goTo(0,function() {
			that.trigger('stop');
			callback && callback();
		}); });
		return this;
	};
	
	/**
	 * play/pause
	 * @param callback optionnel, fonction � �x�cuter une fois le morceau pr�t � lire ou arr�t�
	 * @returns {JSYG.AudioPlayList}
	 */
	JSYG.AudioPlayList.prototype.toggle = function(callback) { this[ this.node.paused ? 'play' : 'pause' ](callback); return this; };
	
	/**
	 * Renvoie le temps �coul�
	 * @returns {String} temps format� (HH:MM)
	 */
	JSYG.AudioPlayList.prototype.getElapsedTime = function() {
		try { return JSYG.AudioPlayList.sec2time(this.node.currentTime);}
		catch(e) { return '00:00'; }
	};
	
	/**
	 * définit ou renvoie le temps �coul�
	 * @value value nombre de secondes ou cha�ne de la forme "MI:SS" pour définir la position
	 * @returns {String,JSYG.AudioPlayList} temps format� (MI:SS) si value indéfinie, l'objet lui m�me sinon
	 */
	JSYG.AudioPlayList.prototype.currentTime = function(value,callback) {
		
		if (value == null) {
			var currentTime;
			try { currentTime = JSYG.AudioPlayList.sec2time(this.node.currentTime);}
			catch(e) { currentTime = '00:00'; }
			callback && callback.call(this.node);
			return currentTime;
		}
		
		if (!JSYG.isNumeric(value)) {
			var tab = value.split(/:/);
			value = tab[0] * 60 + Number(tab[1]);
		}
		
		try {
			var that = this;
			var fct = function() {
				that.trigger('changetime');
				callback && callback.call(this);
			};
			new JSYG(this.node).on('unique-timeupdate',fct);
			this.node.currentTime = value;
			return this;
		}
		catch(e) { return false; }
	};
	
	/**
	 * Renvoie la dur�e du morceau courant
	 * @returns {String} temps format� (HH:MM) ou null si indisponible
	 */
	JSYG.AudioPlayList.prototype.getCurrentDuration = function() {
		try { return JSYG.AudioPlayList.sec2time(this.node.duration);}
		catch(e) { return null; }
	};
	
	/**
	 * Renvoie la dur�e totale de la playliste
	 * @param callback optionnel, fonction � ex�cuter une fois la dur�e lue.
	 * Le premier argument est la dur�e format�e (HH:MM)
	 * @returns {JSYG.AudioPlayList}
	 */
	JSYG.AudioPlayList.prototype.getTotalDuration = function(callback) {
		
		var audio = new JSYG('<audio>');
		var list = this.list;
		var ind = 0;
		var duration = 0;
		var that = this;
			
		audio.on('loadedmetadata',function() {
			duration+=this.duration;
			if (ind<list.length-1) { this.src = list[++ind].src; }
			else if (callback) { callback.call(that.node,JSYG.AudioPlayList.sec2time(duration)); }
		});
		
		audio.attr('src',list[0].src);
		
		return this;
	};
	/**
	* Indique si la lecture est en cours ou non
	* @returns {Boolean}
	*/
	JSYG.AudioPlayList.prototype.isPlaying = function() { return !this.node.paused; };
	
	/**
	 * Formate un nombre de secondes
	 * @param seconds
	 * @returns {String} temps format� (MI:SS)
	 */
	JSYG.AudioPlayList.sec2time = function(seconds) {
		
		if (!JSYG.isNumeric(seconds)) return "00:00";
		
		var date = new Date(seconds*1000),
			minutes = date.getMinutes(),
			seconds = date.getSeconds();
				
		return (minutes < 10 ? '0' : '') + minutes + ':' + (secondes < 10 ? '0' : '') + seconds;
	};
		
})();