JSYG.require('Slider');

(function() {
	
	"use strict";
	
	/**
	 * <strong>nécessite le module Audio/AudioSpectrum</strong><br/><br/>
	 * Trac� d'un spectre audio 
	 * @param arg  argument JSYG faisant référence � un élément audio (cr�� si non défini)
	 * @param opt optionnel, objet définissant les options. Si défini, le trac� de spectre est activ�.
	 * @returns {JSYG.AudioSpectrum}
	 */
	JSYG.AudioSpectrum = function(arg,opt) {
		
		if (!arg) { arg = '<audio>'; }
		this.node = new JSYG(arg).node;
		
		/**
		 * Contr�le du zoom
		 */
		this.zoomCtrl = new JSYG.Slider();
		
		var zoom = this.zoomCtrl;
		
		zoom.set({
			min:0.1,max:10,step:0.1,
			height:100,
			width:7,
			cursorOverflow:4,
			orientation:'vertical'
		});
		
		if (opt) { this.enable(opt); }
	};

	
	JSYG.AudioSpectrum.prototype = {
		
		constructor : JSYG.AudioSpectrum,
		/**
		 * Chemin SVG � définir pour le trac� 
		 */
		path : null,
		/**
		 * Zoom initial
		 */
		initialZoom : 400,
		/**
		 * largeur (largeur du canvas SVG par d�faut)
		 */
		width : null,
		/**
		 * hauteur (hauteur du canvas SVG par d�faut)
		 */
		height : null,
		/**
		 * Indique si le trac� est actif ou non
		 */
		enabled : false,
		/**
		 * Remise � z�ro du spectre
		 */
		clear : function() {
			
			var path = new JSYG(this.path);
			if (path.length > 0) { path.attr('d','M0,0'); }
		},
		
		set : JSYG.StdConstruct.prototype.set,
		
		setNode : function(arg) {
			var enabled = this.enabled;
			this.disable();
			this.node = new JSYG(arg).node;
			if (enabled) { this.enable(); }
			return this;
		},
		
		/**
		 * Activation du spectre
		 * @param opt optionnel, objet définissant les options
		 * @returns {JSYG.AudioSpectrum}
		 */
		enable : function(opt) {
			
			this.disable();
			
			if (opt) { this.set(opt); }
			
			var jNode = new JSYG(this.node);
			var path = new JSYG(this.path);
			if (path.length == 0) { throw new Error("Il faut définir la propriété path"); }
			
			var svg = path.offsetParent();
			var dim = svg.getDim();
			var that = this;
			var bufferLength;
			var channels,fft;
			var width = this.width || dim.width;
			var height = this.height || dim.height;
			var request = null;	
			
			
			
			var fcts = {
			
				'loadedmetadata' : function() {
					if (that.zoomCtrl.enabled) { that.zoomCtrl.val(path.scaleY()); }
					if (path.parent().node!==svg.node) {
						var pt = new JSYG.Vect(width,height).mtx(path.parent().getMtx('ctm').inverse());
						width = pt.x; height=pt.y;
					}
					//duration = this.duration;
					bufferLength = this.mozFrameBufferLength;
					channels = this.mozChannels;
					fft = new FFT(bufferLength / channels, this.mozSampleRate);
				},
				
				'MozAudioAvailable' : function (e) {
					
					var fb = e.originalEvent.frameBuffer;
					var signal = new Float32Array(fb.length / channels);
					var i=0,N=bufferLength / 2;
					var d='M0,'+height;
					var x,y;
					
					for (;i<N;i++) { signal[i] = (fb[2*i] + fb[2*i+1]) / 2; }
					
					fft.forward(signal);
					
					for (i=0,N=fft.spectrum.length/2;i<N; i++ ) {
						x = Math.round( 10 * ( i * width * 2 /N ) ) / 10;
						y = Math.round( 10 * (height - fft.spectrum[i]*that.initialZoom) ) / 10;
						d+='L'+x+','+y;
					}
					
					window.cancelAnimationFrame(request);
					request = window.requestAnimationFrame(function() { path.attr('d',d); });
				}
			};
			
			jNode.on(fcts);
			
			function changeZoom() {
				var path = new JSYG(that.path);
				path.resetTransf().transfOrigin(0,'bottom').scaleNonUniform(1,this.value);
			}
			
			this.zoomCtrl.on('change',changeZoom);
						
			if (this.zoomCtrl.enabled) { this.zoomCtrl.val(path.scaleY()); }
						
			this.disable = function() {
				jNode.off(fcts);
				this.zoomCtrl.off('change',changeZoom);
				this.enabled = false;
				return this;
			};
			
			this.enabled = true;
			
			return this;
		},
		
		/**
		 * D�sactivation du trac�
		 * @returns {JSYG.AudioSpectrum}
		 */
		disable : function() { return this; }
	};
	
	
	//tir� de dsp.js (https://github.com/corbanbrook/dsp.js/)
	function FFT(bufferSize, sampleRate) {
		
	  this.bufferSize   = bufferSize;
	  this.sampleRate   = sampleRate;
	  this.spectrum     = new Float32Array(bufferSize/2);
	  this.real         = new Float32Array(bufferSize);
	  this.imag         = new Float32Array(bufferSize);
	  this.reverseTable = new Uint32Array(bufferSize);
	  this.sinTable     = new Float32Array(bufferSize);
	  this.cosTable     = new Float32Array(bufferSize);
	
	  var limit = 1,
	      bit = bufferSize >> 1;
	
	  while ( limit < bufferSize ) {
	    for ( var i = 0; i < limit; i++ ) {
	      this.reverseTable[i + limit] = this.reverseTable[i] + bit;
	    }
	
	    limit = limit << 1;
	    bit = bit >> 1;
	  }
	
	  for ( var i = 0; i < bufferSize; i++ ) {
	    this.sinTable[i] = Math.sin(-Math.PI/i);
	    this.cosTable[i] = Math.cos(-Math.PI/i);
	  }
	}
	
	FFT.prototype.forward = function(buffer) {
		
	  var bufferSize   = this.bufferSize,
	      cosTable     = this.cosTable,
	      sinTable     = this.sinTable,
	      reverseTable = this.reverseTable,
	      real         = this.real,
	      imag         = this.imag,
	      spectrum     = this.spectrum;
	
	  if ( bufferSize !== buffer.length ) {
	    throw "Supplied buffer is not the same size as defined FFT. FFT Size: " + bufferSize + " Buffer Size: " + buffer.length;
	  }
	
	  for ( var i = 0; i < bufferSize; i++ ) {
	    real[i] = buffer[reverseTable[i]];
	    imag[i] = 0;
	  }
	
	  var halfSize = 1,
	      phaseShiftStepReal,	
	      phaseShiftStepImag,
	      currentPhaseShiftReal,
	      currentPhaseShiftImag,
	      off,
	      tr,
	      ti,
	      tmpReal,	
	      i;
	
	  while ( halfSize < bufferSize ) {
	    phaseShiftStepReal = cosTable[halfSize];
	    phaseShiftStepImag = sinTable[halfSize];
	    currentPhaseShiftReal = 1.0;
	    currentPhaseShiftImag = 0.0;
	
	    for ( var fftStep = 0; fftStep < halfSize; fftStep++ ) {
	      i = fftStep;
	
	      while ( i < bufferSize ) {
	        off = i + halfSize;
	        tr = (currentPhaseShiftReal * real[off]) - (currentPhaseShiftImag * imag[off]);
	        ti = (currentPhaseShiftReal * imag[off]) + (currentPhaseShiftImag * real[off]);
	
	        real[off] = real[i] - tr;
	        imag[off] = imag[i] - ti;
	        real[i] += tr;
	        imag[i] += ti;
	
	        i += halfSize << 1;
	      }
	
	      tmpReal = currentPhaseShiftReal;
	      currentPhaseShiftReal = (tmpReal * phaseShiftStepReal) - (currentPhaseShiftImag * phaseShiftStepImag);
	      currentPhaseShiftImag = (tmpReal * phaseShiftStepImag) + (currentPhaseShiftImag * phaseShiftStepReal);
	    }
	
	    halfSize = halfSize << 1;
	  }
	
	  i = bufferSize/2;
	  
	  while(i--) {
	    spectrum[i] = 2 * Math.sqrt(real[i] * real[i] + imag[i] * imag[i]) / bufferSize;
	  }
	};
	
})();

