JSYG.require("Ajax");

(function() {
	
	"use strict";
		
	var rRequire = /^(?:\/\*[\S\s]*?\*\/|\/\/.*?\n|\s)*JSYG\.require\s*\(([\S\s]*?)\)\s*;?\s*/,
		rCallback = /^(?:\/\*[\S\s]*?\*\/|\/\/.*?\n|\s)*JSYG\.require\s*\((?:\s*['"]\S+['"]\s*,)+\s*(function[\s\S]*})\s*\)\s*;?\s*/,
		rUrl = /url\s*\(\s*('|")?([^\/]*?)\1?\s*\)/g,
		rCompileCSS = [ /\/\*[\S\s]*?\*\//g, /\s+/g, / ?([,:;{}]) ?/g, /;}/g ],
		rCleanRequire = [ /\/\*[\s\S]*?\*\//g, /\/\/.*?\n/g, /['"\s]/g ],
		rPlugin = /^\w+$/,
		rFunc = /function\s*\(\s*/,
		rCSSFile = /^\w+\.css$/;

	JSYG.Builder = function() {
		
		this._jsFiles = [];
		this._cssFiles = [];
		
		this._jsContent = '';
		this._cssContent = '';
		
		this.compileJS = this.compileJS.bind(this);
		this.compileCSS = this.compileCSS.bind(this);
	};
	
	JSYG.Builder.prototype.compilation_level = "SIMPLE_OPTIMIZATIONS";
	
	JSYG.Builder.prototype.output_info = ["compiled_code","errors"];
	
	JSYG.Builder.prototype.output_format = "json";
	
	JSYG.Builder.prototype.compileJS = function(str) {
		
		var data = "compilation_level="+this.compilation_level
			+"&output_format="+this.output_format
			+"&js_code="+JSYG.urlencode(str);
		
		this.output_info.forEach(function(info){
			data+="&output_info="+info;
		});
		
		return JSYG.Ajax({
			url:"http://closure-compiler.appspot.com/compile",
			method:"POST",
			cache:true,
			format:"json",
			data:data
		})
		.then(function(results) {
			
			if (results.compiledCode) return results.compiledCode;
			else {
				return JSYG.Promise.reject(results.errors || results);
			}
		});
	};
	
	JSYG.Builder.prototype.compileCSS = function(str) {
			
		var compiledString = new String(str)
		.replace(rCompileCSS[0],'')
		.replace(rCompileCSS[1],' ')
		.replace(rCompileCSS[2],function(s,s1) { return s1; })
		.replace(rCompileCSS[3],'}')
		.valueOf();
		
		return JSYG.Promise.resolve(compiledString);
	};
			
	JSYG.Builder.prototype._getFullPath = function(file) {
		
		var url = JSYG.require.baseURL,
			separator = url.charAt( url.length - 1 ) == '/' ? '' : '/';
				
		if (rPlugin.test(file)) file = url + separator + file + "/"+file+".js";
		else if (rCSSFile.test(file)) {
			
			var path = file.replace(/\.css$/,'');
			file = url + separator + path + "/" + file;
		}
		
		return file;
	};
	
	JSYG.Builder.prototype._getContentFile = function(file,_ind) {
		
		file = this._getFullPath(file);
		
		if (file.indexOf(".css") !== -1) return this._getCSSContentFile(file,_ind);
		else return this._getJSContentFile(file,_ind);
	};
	
		
	JSYG.Builder.prototype._getCSSContentFile = function(file,_ind) {

		if (this._cssFiles.indexOf(file) != -1) return;
		
		var path = file.substr(0, file.lastIndexOf('/') +1 ),
			that = this,
			ajax = new JSYG.Ajax({cache:false,url:file});
		
		if (_ind == null) _ind = this._jsFiles.length;
		
		this._cssFiles.splice(_ind,0,file);
		
		return ajax.send().then(function(css) {
			
			//la concaténation implique de changer les urls dans les fichiers css
			return that._cssContent += css.replace(rUrl,function(s,s1,s2) { return "url("+path+s2+")"; });
		});
	};
	
	JSYG.Builder.prototype._getJSContentFile = function(file,_ind) {
		
		if (this._jsFiles.indexOf(file) != -1) return JSYG.Promise.resolve();
		
		var that = this,
			ajax = new JSYG.Ajax({url:file,cache:false});
		
		if (_ind == null) _ind = this._jsFiles.length;
		
		this._jsFiles.splice(_ind,0,file);
				
		return ajax.send().then(function(content) {
						
			var header = content.substr(0,1000),
				matches = rRequire.exec(header),
				files, lastArg, callback = null,
				subFiles = [], promises = [];
			
			if (matches) {
				
				files = matches[1];
				
				subFiles = files
				.replace(rCleanRequire[0],'')
				.replace(rCleanRequire[1],'')
				.replace(rCleanRequire[2],'')
				.split(/,/);
				
				lastArg = subFiles[ subFiles.length - 1 ];
				
				if (rFunc.test(lastArg)) {
					
					subFiles.pop();
					matches = rCallback.exec(content);
					callback = matches[1];
					
					content = content.replace(rCallback,'');
				}
				else content = content.replace(rRequire,'');
				
			}
							
			subFiles.forEach(function(subFile) {
				
				if (!subFile) return;
				
				promises.push( that._getContentFile(subFile,_ind) );
			});
									
			return JSYG.Promise.all(promises).then(function() {
				
				if (callback) content += '('+callback+'());\n\n';
					
				that._jsContent += "/*File : " +file +"*/\n" + content + "\n\n";

				return content;
			});
			
		});		
	};
	
	function emptyArray(array) {
		
		while(array.length > 0) array.pop();
	}
	
	function copyArray(arrayLike) {
		
		return Array.prototype.slice.call(arrayLike);
	}
	
	JSYG.Builder.prototype._reset = function() {
		
		emptyArray(this._jsFiles);
		emptyArray(this._cssFiles);
		this._jsContent = '';
		this._cssContent = '';
	};
	
	JSYG.Builder.prototype._build = function(files) {
				
		var i=0,N=files.length,
			promise = JSYG.Promise.resolve();
				
		this._reset();
				
		for (;i<N;i++) promise = promise.then( this._getContentFile.bind(this,files[i]) );
			
		return promise;
	};
	
	JSYG.Builder.prototype.build = function(files) {
		
		if (typeof files == "string") files = copyArray(arguments);
		
		var that = this;
					
		return this._build(files).then(function() {
			
			return {
				js : {
					files : copyArray(that._jsFiles),
					content : that._jsContent
				},
				css : {
					files : copyArray(that._cssFiles),
					content : that._cssContent
				}
			};
		});
	};
		
	JSYG.Builder.prototype.buildJS = function(files) {
		
		if (typeof files == "string") files = copyArray(arguments);
		
		var that = this;
					
		return this._build(files).then( function() { return that._jsContent; });
	};
	
	JSYG.Builder.prototype.buildCSS = function(files) {
		
		if (typeof files == "string") files = copyArray(arguments);
		
		var that = this;
					
		return this._build(files).then( function() { return that._cssContent; });
	};
	
	JSYG.Builder.prototype.toDataURL = function(str) {
		
		return "data:text;base64," + JSYG.base64encode(str);
	};
	
}());