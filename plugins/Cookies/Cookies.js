/*\
	|*|
	|*|  :: cookies.js ::
	|*|
	|*|  A complete cookies reader/writer framework with full unicode support.
	|*|
	|*|  Revision #1 - September 4, 2014
	|*|
	|*|  https://developer.mozilla.org/en-US/docs/Web/API/document.cookie
	|*|  https://developer.mozilla.org/User:fusionchess
	|*|
	|*|  This framework is released under the GNU Public License, version 3 or later.
	|*|  http://www.gnu.org/licenses/gpl-3.0-standalone.html
	|*|
	|*|
	\*/

JSYG.require("Date");

(function() {
	
	"use strict";
	
	function vEnd2sExpires(vEnd,timeUnit) {
		
		if (!vEnd) return "";
	    	
    	switch (vEnd.constructor) {
    	
    		case Number:
    			
    			if (vEnd === Infinity) return vEnd2sExpires("Tue, 19 Jan 2038 03:14:07 GMT");
    			else return vEnd2sExpires( new JSYG.Date().add(timeUnit,vEnd) );
    			
    		case Date: return vEnd2sExpires(vEnd.toUTCString());
    			
    		case JSYG.Date : return vEnd2sExpires(vEnd.date);
    			
    		case String: return "; expires=" + vEnd;
    		
    		default : throw new TypeError((typeof vEnd)+" : type incorrect");
    	}
	}
		
	/**
	 * En interne seulement, utiliser la propriété JSYG.cookies
	 * @private
	 * @returns {JSYG.Cookies}
	 */
	function Cookies() {}
	
	Cookies.prototype = {
		
		constructor : Cookies,
		
		/**
		 * Unit of time
		 */
		timeUnit : "day",
		/**
		 * Read a cookie. If the cookie doesn't exist a null value will be returned.
		 * @param sKey the name of the cookie to read (string).
		 * @return string or null
		 */
		getItem : function(sKey) {
			
			if (!sKey) return null;
			
			return decodeURIComponent(document.cookie.replace(new RegExp("(?:(?:^|.*;)\\s*" + encodeURIComponent(sKey).replace(/[\-\.\+\*]/g, "\\$&") + "\\s*\\=\\s*([^;]*).*$)|^.*$"), "$1")) || null;
		},

		/**
		 * Create/overwrite a cookie
		 * @param sKey the name of the cookie to create/overwrite (string)
		 * @param sValue The value of the cookie (string)
		 * @param vEnd optionnal, the max-age in unity defined in timeUnit property (Infinity for a never-expires cookie),
		 * or the expires date in GMTString format or as Date object;
		 * if not specified the cookie will expire at the end of session (number – finite or Infinity – string, Date object or null).
		 * @param sPath optionnal, the path from where the cookie will be readable.
		 * E.g., "/", "/mydir"; if not specified, defaults to the current path of the current document location (string or null).
		 * The path must be absolute (see RFC 2965).
		 * @param sDomain optionnal, the domain from where the cookie will be readable.
		 * E.g., "example.com", ".example.com" (includes all subdomains) or "subdomain.example.com";
		 * if not specified, defaults to the host portion of the current document location (string or null).
		 * @param bSecure optionnel, the cookie will be transmitted only over secure protocol as https (boolean or null).
		 * @return boolean
		 * */
		setItem : function(sKey, sValue, vEnd, sPath, sDomain, bSecure) {
			
			if (!sKey || /^(?:expires|max\-age|path|domain|secure)$/i.test(sKey)) return false;
			
		    var sExpires = vEnd2sExpires(vEnd,this.timeUnit);
		    
		    document.cookie = encodeURIComponent(sKey) + "=" + encodeURIComponent(sValue) + sExpires + (sDomain ? "; domain=" + sDomain : "") + (sPath ? "; path=" + sPath : "") + (bSecure ? "; secure" : "");
		    
		    return true;
		},
		/**
		 * Delete a cookie
		 * @param sKey the name of the cookie to remove (string).
		 * @param sPath optionnal, E.g., "/", "/mydir";
		 * if not specified, defaults to the current path of the current document location (string or null).
		 * The path must be absolute (see RFC 2965).
		 * @param sDomain optionnal, E.g., "example.com", ".example.com" (includes all subdomains)
		 * or "subdomain.example.com";
		 * if not specified, defaults to the host portion of the current document location (string or null).
		 * Note: To delete cookies that span over subdomains, you need to explicitate the domain attribute in removeItem() as well as setItem().
		 * @return boolean
		 * */
		removeItem : function (sKey, sPath, sDomain) {
			  
		  if (!this.hasItem(sKey)) return false;
			  
		  document.cookie = encodeURIComponent(sKey) + "=; expires=Thu, 01 Jan 1970 00:00:00 GMT" + (sDomain ? "; domain=" + sDomain : "") + (sPath ? "; path=" + sPath : "");			  

		  return true;
		  
		},
		/**
		 * Check whether a cookie exists in the current position.
		 * @param sKey the name of the cookie to test (string).
		 * @return boolean
		 * */
		hasItem: function (sKey) {
			  
			if (!sKey) return false;
			  
			return (new RegExp("(?:^|;\\s*)" + encodeURIComponent(sKey).replace(/[\-\.\+\*]/g, "\\$&") + "\\s*\\=")).test(document.cookie);
		},

		/**
		 * Get the list of all cookies
		 * @return Array of all readable cookies from this location.
		 * */
		keys: function () {
			
			var aKeys = document.cookie.replace(/((?:^|\s*;)[^\=]+)(?=;|$)|^\s*|\s*(?:\=[^;]*)?(?:\1|$)/g, "").split(/\s*(?:\=[^;]*)?;\s*/);

			for (var nLen = aKeys.length, nIdx = 0; nIdx < nLen; nIdx++) { aKeys[nIdx] = decodeURIComponent(aKeys[nIdx]); }
			
		    return aKeys;
		}
	};
	
	/**
	 * Gestion des cookies
	 */
	JSYG.cookies = new Cookies();
	
}());