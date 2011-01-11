/*
---

script: Core.js

description: The core of MooTools, contains all the base functions and the Native and Hash implementations. Required by all the other scripts.

license: MIT-style license.

copyright: Copyright (c) 2006-2008 [Valerio Proietti](http://mad4milk.net/).

authors: The MooTools production team (http://mootools.net/developers/)

inspiration:
- Class implementation inspired by [Base.js](http://dean.edwards.name/weblog/2006/03/base/) Copyright (c) 2006 Dean Edwards, [GNU Lesser General Public License](http://opensource.org/licenses/lgpl-license.php)
- Some functionality inspired by [Prototype.js](http://prototypejs.org) Copyright (c) 2005-2007 Sam Stephenson, [MIT License](http://opensource.org/licenses/mit-license.php)

provides: [Mootools, Native, Hash.base, Array.each, $util]

...
*/

var MooTools = {
	'version': '1.2.4',
	'build': '0d9113241a90b9cd5643b926795852a2026710d4'
};

var Native = function(options){
	options = options || {};
	var name = options.name;
	var legacy = options.legacy;
	var protect = options.protect;
	var methods = options.implement;
	var generics = options.generics;
	var initialize = options.initialize;
	var afterImplement = options.afterImplement || function(){};
	var object = initialize || legacy;
	generics = generics !== false;

	object.constructor = Native;
	object.$family = {name: 'native'};
	if (legacy && initialize) object.prototype = legacy.prototype;
	object.prototype.constructor = object;

	if (name){
		var family = name.toLowerCase();
		object.prototype.$family = {name: family};
		Native.typize(object, family);
	}

	var add = function(obj, name, method, force){
		if (!protect || force || !obj.prototype[name]) obj.prototype[name] = method;
		if (generics) Native.genericize(obj, name, protect);
		afterImplement.call(obj, name, method);
		return obj;
	};

	object.alias = function(a1, a2, a3){
		if (typeof a1 == 'string'){
			var pa1 = this.prototype[a1];
			if ((a1 = pa1)) return add(this, a2, a1, a3);
		}
		for (var a in a1) this.alias(a, a1[a], a2);
		return this;
	};

	object.implement = function(a1, a2, a3){
		if (typeof a1 == 'string') return add(this, a1, a2, a3);
		for (var p in a1) add(this, p, a1[p], a2);
		return this;
	};

	if (methods) object.implement(methods);

	return object;
};

Native.genericize = function(object, property, check){
	if ((!check || !object[property]) && typeof object.prototype[property] == 'function') object[property] = function(){
		var args = Array.prototype.slice.call(arguments);
		return object.prototype[property].apply(args.shift(), args);
	};
};

Native.implement = function(objects, properties){
	for (var i = 0, l = objects.length; i < l; i++) objects[i].implement(properties);
};

Native.typize = function(object, family){
	if (!object.type) object.type = function(item){
		return ($type(item) === family);
	};
};

(function(){
	var natives = {'Array': Array, 'Date': Date, 'Function': Function, 'Number': Number, 'RegExp': RegExp, 'String': String};
	for (var n in natives) new Native({name: n, initialize: natives[n], protect: true});

	var types = {'boolean': Boolean, 'native': Native, 'object': Object};
	for (var t in types) Native.typize(types[t], t);

	var generics = {
		'Array': ["concat", "indexOf", "join", "lastIndexOf", "pop", "push", "reverse", "shift", "slice", "sort", "splice", "toString", "unshift", "valueOf"],
		'String': ["charAt", "charCodeAt", "concat", "indexOf", "lastIndexOf", "match", "replace", "search", "slice", "split", "substr", "substring", "toLowerCase", "toUpperCase", "valueOf"]
	};
	for (var g in generics){
		for (var i = generics[g].length; i--;) Native.genericize(natives[g], generics[g][i], true);
	}
})();

var Hash = new Native({

	name: 'Hash',

	initialize: function(object){
		if ($type(object) == 'hash') object = $unlink(object.getClean());
		for (var key in object) this[key] = object[key];
		return this;
	}

});

Hash.implement({

	forEach: function(fn, bind){
		for (var key in this){
			if (this.hasOwnProperty(key)) fn.call(bind, this[key], key, this);
		}
	},

	getClean: function(){
		var clean = {};
		for (var key in this){
			if (this.hasOwnProperty(key)) clean[key] = this[key];
		}
		return clean;
	},

	getLength: function(){
		var length = 0;
		for (var key in this){
			if (this.hasOwnProperty(key)) length++;
		}
		return length;
	}

});

Hash.alias('forEach', 'each');

Array.implement({

	forEach: function(fn, bind){
		for (var i = 0, l = this.length; i < l; i++) fn.call(bind, this[i], i, this);
	}

});

Array.alias('forEach', 'each');

function $A(iterable){
	if (iterable.item){
		var l = iterable.length, array = new Array(l);
		while (l--) array[l] = iterable[l];
		return array;
	}
	return Array.prototype.slice.call(iterable);
};

function $arguments(i){
	return function(){
		return arguments[i];
	};
};

function $chk(obj){
	return !!(obj || obj === 0);
};

function $clear(timer){
	clearTimeout(timer);
	clearInterval(timer);
	return null;
};

function $defined(obj){
	return (obj != undefined);
};

function $each(iterable, fn, bind){
	var type = $type(iterable);
	((type == 'arguments' || type == 'collection' || type == 'array') ? Array : Hash).each(iterable, fn, bind);
};

function $empty(){};

function $extend(original, extended){
	for (var key in (extended || {})) original[key] = extended[key];
	return original;
};

function $H(object){
	return new Hash(object);
};

function $lambda(value){
	return ($type(value) == 'function') ? value : function(){
		return value;
	};
};

function $merge(){
	var args = Array.slice(arguments);
	args.unshift({});
	return $mixin.apply(null, args);
};

function $mixin(mix){
	for (var i = 1, l = arguments.length; i < l; i++){
		var object = arguments[i];
		if ($type(object) != 'object') continue;
		for (var key in object){
			var op = object[key], mp = mix[key];
			mix[key] = (mp && $type(op) == 'object' && $type(mp) == 'object') ? $mixin(mp, op) : $unlink(op);
		}
	}
	return mix;
};

function $pick(){
	for (var i = 0, l = arguments.length; i < l; i++){
		if (arguments[i] != undefined) return arguments[i];
	}
	return null;
};

function $random(min, max){
	return Math.floor(Math.random() * (max - min + 1) + min);
};

function $splat(obj){
	var type = $type(obj);
	return (type) ? ((type != 'array' && type != 'arguments') ? [obj] : obj) : [];
};

var $time = Date.now || function(){
	return +new Date;
};

function $try(){
	for (var i = 0, l = arguments.length; i < l; i++){
		try {
			return arguments[i]();
		} catch(e){}
	}
	return null;
};

function $type(obj){
	if (obj == undefined) return false;
	if (obj.$family) return (obj.$family.name == 'number' && !isFinite(obj)) ? false : obj.$family.name;
	if (obj.nodeName){
		switch (obj.nodeType){
			case 1: return 'element';
			case 3: return (/\S/).test(obj.nodeValue) ? 'textnode' : 'whitespace';
		}
	} else if (typeof obj.length == 'number'){
		if (obj.callee) return 'arguments';
		else if (obj.item) return 'collection';
	}
	return typeof obj;
};

function $unlink(object){
	var unlinked;
	switch ($type(object)){
		case 'object':
			unlinked = {};
			for (var p in object) unlinked[p] = $unlink(object[p]);
		break;
		case 'hash':
			unlinked = new Hash(object);
		break;
		case 'array':
			unlinked = [];
			for (var i = 0, l = object.length; i < l; i++) unlinked[i] = $unlink(object[i]);
		break;
		default: return object;
	}
	return unlinked;
};


/*
---

script: Browser.js

description: The Browser Core. Contains Browser initialization, Window and Document, and the Browser Hash.

license: MIT-style license.

requires: 
- /Native
- /$util

provides: [Browser, Window, Document, $exec]

...
*/

var Browser = $merge({

	Engine: {name: 'unknown', version: 0},

	Platform: {name: (window.orientation != undefined) ? 'ipod' : (navigator.platform.match(/mac|win|linux/i) || ['other'])[0].toLowerCase()},

	Features: {xpath: !!(document.evaluate), air: !!(window.runtime), query: !!(document.querySelector)},

	Plugins: {},

	Engines: {

		presto: function(){
			return (!window.opera) ? false : ((arguments.callee.caller) ? 960 : ((document.getElementsByClassName) ? 950 : 925));
		},

		trident: function(){
			return (!window.ActiveXObject) ? false : ((window.XMLHttpRequest) ? ((document.querySelectorAll) ? 6 : 5) : 4);
		},

		webkit: function(){
			return (navigator.taintEnabled) ? false : ((Browser.Features.xpath) ? ((Browser.Features.query) ? 525 : 420) : 419);
		},

		gecko: function(){
			return (!document.getBoxObjectFor && window.mozInnerScreenX == null) ? false : ((document.getElementsByClassName) ? 19 : 18);
		}

	}

}, Browser || {});

Browser.Platform[Browser.Platform.name] = true;

Browser.detect = function(){

	for (var engine in this.Engines){
		var version = this.Engines[engine]();
		if (version){
			this.Engine = {name: engine, version: version};
			this.Engine[engine] = this.Engine[engine + version] = true;
			break;
		}
	}

	return {name: engine, version: version};

};

Browser.detect();

Browser.Request = function(){
	return $try(function(){
		return new XMLHttpRequest();
	}, function(){
		return new ActiveXObject('MSXML2.XMLHTTP');
	}, function(){
		return new ActiveXObject('Microsoft.XMLHTTP');
	});
};

Browser.Features.xhr = !!(Browser.Request());

Browser.Plugins.Flash = (function(){
	var version = ($try(function(){
		return navigator.plugins['Shockwave Flash'].description;
	}, function(){
		return new ActiveXObject('ShockwaveFlash.ShockwaveFlash').GetVariable('$version');
	}) || '0 r0').match(/\d+/g);
	return {version: parseInt(version[0] || 0 + '.' + version[1], 10) || 0, build: parseInt(version[2], 10) || 0};
})();

function $exec(text){
	if (!text) return text;
	if (window.execScript){
		window.execScript(text);
	} else {
		var script = document.createElement('script');
		script.setAttribute('type', 'text/javascript');
		script[(Browser.Engine.webkit && Browser.Engine.version < 420) ? 'innerText' : 'text'] = text;
		document.head.appendChild(script);
		document.head.removeChild(script);
	}
	return text;
};

Native.UID = 1;

var $uid = (Browser.Engine.trident) ? function(item){
	return (item.uid || (item.uid = [Native.UID++]))[0];
} : function(item){
	return item.uid || (item.uid = Native.UID++);
};

var Window = new Native({

	name: 'Window',

	legacy: (Browser.Engine.trident) ? null: window.Window,

	initialize: function(win){
		$uid(win);
		if (!win.Element){
			win.Element = $empty;
			if (Browser.Engine.webkit) win.document.createElement("iframe"); //fixes safari 2
			win.Element.prototype = (Browser.Engine.webkit) ? window["[[DOMElement.prototype]]"] : {};
		}
		win.document.window = win;
		return $extend(win, Window.Prototype);
	},

	afterImplement: function(property, value){
		window[property] = Window.Prototype[property] = value;
	}

});

Window.Prototype = {$family: {name: 'window'}};

new Window(window);

var Document = new Native({

	name: 'Document',

	legacy: (Browser.Engine.trident) ? null: window.Document,

	initialize: function(doc){
		$uid(doc);
		doc.head = doc.getElementsByTagName('head')[0];
		doc.html = doc.getElementsByTagName('html')[0];
		if (Browser.Engine.trident && Browser.Engine.version <= 4) $try(function(){
			doc.execCommand("BackgroundImageCache", false, true);
		});
		if (Browser.Engine.trident) doc.window.attachEvent('onunload', function(){
			doc.window.detachEvent('onunload', arguments.callee);
			doc.head = doc.html = doc.window = null;
		});
		return $extend(doc, Document.Prototype);
	},

	afterImplement: function(property, value){
		document[property] = Document.Prototype[property] = value;
	}

});

Document.Prototype = {$family: {name: 'document'}};

new Document(document);


/*
---

script: Array.js

description: Contains Array Prototypes like each, contains, and erase.

license: MIT-style license.

requires:
- /$util
- /Array.each

provides: [Array]

...
*/

Array.implement({

	every: function(fn, bind){
		for (var i = 0, l = this.length; i < l; i++){
			if (!fn.call(bind, this[i], i, this)) return false;
		}
		return true;
	},

	filter: function(fn, bind){
		var results = [];
		for (var i = 0, l = this.length; i < l; i++){
			if (fn.call(bind, this[i], i, this)) results.push(this[i]);
		}
		return results;
	},

	clean: function(){
		return this.filter($defined);
	},

	indexOf: function(item, from){
		var len = this.length;
		for (var i = (from < 0) ? Math.max(0, len + from) : from || 0; i < len; i++){
			if (this[i] === item) return i;
		}
		return -1;
	},

	map: function(fn, bind){
		var results = [];
		for (var i = 0, l = this.length; i < l; i++) results[i] = fn.call(bind, this[i], i, this);
		return results;
	},

	some: function(fn, bind){
		for (var i = 0, l = this.length; i < l; i++){
			if (fn.call(bind, this[i], i, this)) return true;
		}
		return false;
	},

	associate: function(keys){
		var obj = {}, length = Math.min(this.length, keys.length);
		for (var i = 0; i < length; i++) obj[keys[i]] = this[i];
		return obj;
	},

	link: function(object){
		var result = {};
		for (var i = 0, l = this.length; i < l; i++){
			for (var key in object){
				if (object[key](this[i])){
					result[key] = this[i];
					delete object[key];
					break;
				}
			}
		}
		return result;
	},

	contains: function(item, from){
		return this.indexOf(item, from) != -1;
	},

	extend: function(array){
		for (var i = 0, j = array.length; i < j; i++) this.push(array[i]);
		return this;
	},
	
	getLast: function(){
		return (this.length) ? this[this.length - 1] : null;
	},

	getRandom: function(){
		return (this.length) ? this[$random(0, this.length - 1)] : null;
	},

	include: function(item){
		if (!this.contains(item)) this.push(item);
		return this;
	},

	combine: function(array){
		for (var i = 0, l = array.length; i < l; i++) this.include(array[i]);
		return this;
	},

	erase: function(item){
		for (var i = this.length; i--; i){
			if (this[i] === item) this.splice(i, 1);
		}
		return this;
	},

	empty: function(){
		this.length = 0;
		return this;
	},

	flatten: function(){
		var array = [];
		for (var i = 0, l = this.length; i < l; i++){
			var type = $type(this[i]);
			if (!type) continue;
			array = array.concat((type == 'array' || type == 'collection' || type == 'arguments') ? Array.flatten(this[i]) : this[i]);
		}
		return array;
	},

	hexToRgb: function(array){
		if (this.length != 3) return null;
		var rgb = this.map(function(value){
			if (value.length == 1) value += value;
			return value.toInt(16);
		});
		return (array) ? rgb : 'rgb(' + rgb + ')';
	},

	rgbToHex: function(array){
		if (this.length < 3) return null;
		if (this.length == 4 && this[3] == 0 && !array) return 'transparent';
		var hex = [];
		for (var i = 0; i < 3; i++){
			var bit = (this[i] - 0).toString(16);
			hex.push((bit.length == 1) ? '0' + bit : bit);
		}
		return (array) ? hex : '#' + hex.join('');
	}

});


/*
---

script: Function.js

description: Contains Function Prototypes like create, bind, pass, and delay.

license: MIT-style license.

requires:
- /Native
- /$util

provides: [Function]

...
*/

Function.implement({

	extend: function(properties){
		for (var property in properties) this[property] = properties[property];
		return this;
	},

	create: function(options){
		var self = this;
		options = options || {};
		return function(event){
			var args = options.arguments;
			args = (args != undefined) ? $splat(args) : Array.slice(arguments, (options.event) ? 1 : 0);
			if (options.event) args = [event || window.event].extend(args);
			var returns = function(){
				return self.apply(options.bind || null, args);
			};
			if (options.delay) return setTimeout(returns, options.delay);
			if (options.periodical) return setInterval(returns, options.periodical);
			if (options.attempt) return $try(returns);
			return returns();
		};
	},

	run: function(args, bind){
		return this.apply(bind, $splat(args));
	},

	pass: function(args, bind){
		return this.create({bind: bind, arguments: args});
	},

	bind: function(bind, args){
		return this.create({bind: bind, arguments: args});
	},

	bindWithEvent: function(bind, args){
		return this.create({bind: bind, arguments: args, event: true});
	},

	attempt: function(args, bind){
		return this.create({bind: bind, arguments: args, attempt: true})();
	},

	delay: function(delay, bind, args){
		return this.create({bind: bind, arguments: args, delay: delay})();
	},

	periodical: function(periodical, bind, args){
		return this.create({bind: bind, arguments: args, periodical: periodical})();
	}

});


/*
---

script: Number.js

description: Contains Number Prototypes like limit, round, times, and ceil.

license: MIT-style license.

requires:
- /Native
- /$util

provides: [Number]

...
*/

Number.implement({

	limit: function(min, max){
		return Math.min(max, Math.max(min, this));
	},

	round: function(precision){
		precision = Math.pow(10, precision || 0);
		return Math.round(this * precision) / precision;
	},

	times: function(fn, bind){
		for (var i = 0; i < this; i++) fn.call(bind, i, this);
	},

	toFloat: function(){
		return parseFloat(this);
	},

	toInt: function(base){
		return parseInt(this, base || 10);
	}

});

Number.alias('times', 'each');

(function(math){
	var methods = {};
	math.each(function(name){
		if (!Number[name]) methods[name] = function(){
			return Math[name].apply(null, [this].concat($A(arguments)));
		};
	});
	Number.implement(methods);
})(['abs', 'acos', 'asin', 'atan', 'atan2', 'ceil', 'cos', 'exp', 'floor', 'log', 'max', 'min', 'pow', 'sin', 'sqrt', 'tan']);


/*
---

script: String.js

description: Contains String Prototypes like camelCase, capitalize, test, and toInt.

license: MIT-style license.

requires:
- /Native

provides: [String]

...
*/

String.implement({

	test: function(regex, params){
		return ((typeof regex == 'string') ? new RegExp(regex, params) : regex).test(this);
	},

	contains: function(string, separator){
		return (separator) ? (separator + this + separator).indexOf(separator + string + separator) > -1 : this.indexOf(string) > -1;
	},

	trim: function(){
		return this.replace(/^\s+|\s+$/g, '');
	},

	clean: function(){
		return this.replace(/\s+/g, ' ').trim();
	},

	camelCase: function(){
		return this.replace(/-\D/g, function(match){
			return match.charAt(1).toUpperCase();
		});
	},

	hyphenate: function(){
		return this.replace(/[A-Z]/g, function(match){
			return ('-' + match.charAt(0).toLowerCase());
		});
	},

	capitalize: function(){
		return this.replace(/\b[a-z]/g, function(match){
			return match.toUpperCase();
		});
	},

	escapeRegExp: function(){
		return this.replace(/([-.*+?^${}()|[\]\/\\])/g, '\\$1');
	},

	toInt: function(base){
		return parseInt(this, base || 10);
	},

	toFloat: function(){
		return parseFloat(this);
	},

	hexToRgb: function(array){
		var hex = this.match(/^#?(\w{1,2})(\w{1,2})(\w{1,2})$/);
		return (hex) ? hex.slice(1).hexToRgb(array) : null;
	},

	rgbToHex: function(array){
		var rgb = this.match(/\d{1,3}/g);
		return (rgb) ? rgb.rgbToHex(array) : null;
	},

	stripScripts: function(option){
		var scripts = '';
		var text = this.replace(/<script[^>]*>([\s\S]*?)<\/script>/gi, function(){
			scripts += arguments[1] + '\n';
			return '';
		});
		if (option === true) $exec(scripts);
		else if ($type(option) == 'function') option(scripts, text);
		return text;
	},

	substitute: function(object, regexp){
		return this.replace(regexp || (/\\?\{([^{}]+)\}/g), function(match, name){
			if (match.charAt(0) == '\\') return match.slice(1);
			return (object[name] != undefined) ? object[name] : '';
		});
	}

});


/*
---

script: Hash.js

description: Contains Hash Prototypes. Provides a means for overcoming the JavaScript practical impossibility of extending native Objects.

license: MIT-style license.

requires:
- /Hash.base

provides: [Hash]

...
*/

Hash.implement({

	has: Object.prototype.hasOwnProperty,

	keyOf: function(value){
		for (var key in this){
			if (this.hasOwnProperty(key) && this[key] === value) return key;
		}
		return null;
	},

	hasValue: function(value){
		return (Hash.keyOf(this, value) !== null);
	},

	extend: function(properties){
		Hash.each(properties || {}, function(value, key){
			Hash.set(this, key, value);
		}, this);
		return this;
	},

	combine: function(properties){
		Hash.each(properties || {}, function(value, key){
			Hash.include(this, key, value);
		}, this);
		return this;
	},

	erase: function(key){
		if (this.hasOwnProperty(key)) delete this[key];
		return this;
	},

	get: function(key){
		return (this.hasOwnProperty(key)) ? this[key] : null;
	},

	set: function(key, value){
		if (!this[key] || this.hasOwnProperty(key)) this[key] = value;
		return this;
	},

	empty: function(){
		Hash.each(this, function(value, key){
			delete this[key];
		}, this);
		return this;
	},

	include: function(key, value){
		if (this[key] == undefined) this[key] = value;
		return this;
	},

	map: function(fn, bind){
		var results = new Hash;
		Hash.each(this, function(value, key){
			results.set(key, fn.call(bind, value, key, this));
		}, this);
		return results;
	},

	filter: function(fn, bind){
		var results = new Hash;
		Hash.each(this, function(value, key){
			if (fn.call(bind, value, key, this)) results.set(key, value);
		}, this);
		return results;
	},

	every: function(fn, bind){
		for (var key in this){
			if (this.hasOwnProperty(key) && !fn.call(bind, this[key], key)) return false;
		}
		return true;
	},

	some: function(fn, bind){
		for (var key in this){
			if (this.hasOwnProperty(key) && fn.call(bind, this[key], key)) return true;
		}
		return false;
	},

	getKeys: function(){
		var keys = [];
		Hash.each(this, function(value, key){
			keys.push(key);
		});
		return keys;
	},

	getValues: function(){
		var values = [];
		Hash.each(this, function(value){
			values.push(value);
		});
		return values;
	},

	toQueryString: function(base){
		var queryString = [];
		Hash.each(this, function(value, key){
			if (base) key = base + '[' + key + ']';
			var result;
			switch ($type(value)){
				case 'object': result = Hash.toQueryString(value, key); break;
				case 'array':
					var qs = {};
					value.each(function(val, i){
						qs[i] = val;
					});
					result = Hash.toQueryString(qs, key);
				break;
				default: result = key + '=' + encodeURIComponent(value);
			}
			if (value != undefined) queryString.push(result);
		});

		return queryString.join('&');
	}

});

Hash.alias({keyOf: 'indexOf', hasValue: 'contains'});


/*
---

script: Event.js

description: Contains the Event Class, to make the event object cross-browser.

license: MIT-style license.

requires:
- /Window
- /Document
- /Hash
- /Array
- /Function
- /String

provides: [Event]

...
*/

var Event = new Native({

	name: 'Event',

	initialize: function(event, win){
		win = win || window;
		var doc = win.document;
		event = event || win.event;
		if (event.$extended) return event;
		this.$extended = true;
		var type = event.type;
		var target = event.target || event.srcElement;
		while (target && target.nodeType == 3) target = target.parentNode;

		if (type.test(/key/)){
			var code = event.which || event.keyCode;
			var key = Event.Keys.keyOf(code);
			if (type == 'keydown'){
				var fKey = code - 111;
				if (fKey > 0 && fKey < 13) key = 'f' + fKey;
			}
			key = key || String.fromCharCode(code).toLowerCase();
		} else if (type.match(/(click|mouse|menu)/i)){
			doc = (!doc.compatMode || doc.compatMode == 'CSS1Compat') ? doc.html : doc.body;
			var page = {
				x: event.pageX || event.clientX + doc.scrollLeft,
				y: event.pageY || event.clientY + doc.scrollTop
			};
			var client = {
				x: (event.pageX) ? event.pageX - win.pageXOffset : event.clientX,
				y: (event.pageY) ? event.pageY - win.pageYOffset : event.clientY
			};
			if (type.match(/DOMMouseScroll|mousewheel/)){
				var wheel = (event.wheelDelta) ? event.wheelDelta / 120 : -(event.detail || 0) / 3;
			}
			var rightClick = (event.which == 3) || (event.button == 2);
			var related = null;
			if (type.match(/over|out/)){
				switch (type){
					case 'mouseover': related = event.relatedTarget || event.fromElement; break;
					case 'mouseout': related = event.relatedTarget || event.toElement;
				}
				if (!(function(){
					while (related && related.nodeType == 3) related = related.parentNode;
					return true;
				}).create({attempt: Browser.Engine.gecko})()) related = false;
			}
		}

		return $extend(this, {
			event: event,
			type: type,

			page: page,
			client: client,
			rightClick: rightClick,

			wheel: wheel,

			relatedTarget: related,
			target: target,

			code: code,
			key: key,

			shift: event.shiftKey,
			control: event.ctrlKey,
			alt: event.altKey,
			meta: event.metaKey
		});
	}

});

Event.Keys = new Hash({
	'enter': 13,
	'up': 38,
	'down': 40,
	'left': 37,
	'right': 39,
	'esc': 27,
	'space': 32,
	'backspace': 8,
	'tab': 9,
	'delete': 46
});

Event.implement({

	stop: function(){
		return this.stopPropagation().preventDefault();
	},

	stopPropagation: function(){
		if (this.event.stopPropagation) this.event.stopPropagation();
		else this.event.cancelBubble = true;
		return this;
	},

	preventDefault: function(){
		if (this.event.preventDefault) this.event.preventDefault();
		else this.event.returnValue = false;
		return this;
	}

});


/*
---

script: Class.js

description: Contains the Class Function for easily creating, extending, and implementing reusable Classes.

license: MIT-style license.

requires:
- /$util
- /Native
- /Array
- /String
- /Function
- /Number
- /Hash

provides: [Class]

...
*/

function Class(params){
	
	if (params instanceof Function) params = {initialize: params};
	
	var newClass = function(){
		Object.reset(this);
		if (newClass._prototyping) return this;
		this._current = $empty;
		var value = (this.initialize) ? this.initialize.apply(this, arguments) : this;
		delete this._current; delete this.caller;
		return value;
	}.extend(this);
	
	newClass.implement(params);
	
	newClass.constructor = Class;
	newClass.prototype.constructor = newClass;

	return newClass;

};

Function.prototype.protect = function(){
	this._protected = true;
	return this;
};

Object.reset = function(object, key){
		
	if (key == null){
		for (var p in object) Object.reset(object, p);
		return object;
	}
	
	delete object[key];
	
	switch ($type(object[key])){
		case 'object':
			var F = function(){};
			F.prototype = object[key];
			var i = new F;
			object[key] = Object.reset(i);
		break;
		case 'array': object[key] = $unlink(object[key]); break;
	}
	
	return object;
	
};

new Native({name: 'Class', initialize: Class}).extend({

	instantiate: function(F){
		F._prototyping = true;
		var proto = new F;
		delete F._prototyping;
		return proto;
	},
	
	wrap: function(self, key, method){
		if (method._origin) method = method._origin;
		
		return function(){
			if (method._protected && this._current == null) throw new Error('The method "' + key + '" cannot be called.');
			var caller = this.caller, current = this._current;
			this.caller = current; this._current = arguments.callee;
			var result = method.apply(this, arguments);
			this._current = current; this.caller = caller;
			return result;
		}.extend({_owner: self, _origin: method, _name: key});

	}
	
});

Class.implement({
	
	implement: function(key, value){
		
		if ($type(key) == 'object'){
			for (var p in key) this.implement(p, key[p]);
			return this;
		}
		
		var mutator = Class.Mutators[key];
		
		if (mutator){
			value = mutator.call(this, value);
			if (value == null) return this;
		}
		
		var proto = this.prototype;

		switch ($type(value)){
			
			case 'function':
				if (value._hidden) return this;
				proto[key] = Class.wrap(this, key, value);
			break;
			
			case 'object':
				var previous = proto[key];
				if ($type(previous) == 'object') $mixin(previous, value);
				else proto[key] = $unlink(value);
			break;
			
			case 'array':
				proto[key] = $unlink(value);
			break;
			
			default: proto[key] = value;

		}
		
		return this;

	}
	
});

Class.Mutators = {
	
	Extends: function(parent){

		this.parent = parent;
		this.prototype = Class.instantiate(parent);

		this.implement('parent', function(){
			var name = this.caller._name, previous = this.caller._owner.parent.prototype[name];
			if (!previous) throw new Error('The method "' + name + '" has no parent.');
			return previous.apply(this, arguments);
		}.protect());

	},

	Implements: function(items){
		$splat(items).each(function(item){
			if (item instanceof Function) item = Class.instantiate(item);
			this.implement(item);
		}, this);

	}
	
};


/*
---

script: Class.Extras.js

description: Contains Utility Classes that can be implemented into your own Classes to ease the execution of many common tasks.

license: MIT-style license.

requires:
- /Class

provides: [Chain, Events, Options]

...
*/

var Chain = new Class({

	$chain: [],

	chain: function(){
		this.$chain.extend(Array.flatten(arguments));
		return this;
	},

	callChain: function(){
		return (this.$chain.length) ? this.$chain.shift().apply(this, arguments) : false;
	},

	clearChain: function(){
		this.$chain.empty();
		return this;
	}

});

var Events = new Class({

	$events: {},

	addEvent: function(type, fn, internal){
		type = Events.removeOn(type);
		if (fn != $empty){
			this.$events[type] = this.$events[type] || [];
			this.$events[type].include(fn);
			if (internal) fn.internal = true;
		}
		return this;
	},

	addEvents: function(events){
		for (var type in events) this.addEvent(type, events[type]);
		return this;
	},

	fireEvent: function(type, args, delay){
		type = Events.removeOn(type);
		if (!this.$events || !this.$events[type]) return this;
		this.$events[type].each(function(fn){
			fn.create({'bind': this, 'delay': delay, 'arguments': args})();
		}, this);
		return this;
	},

	removeEvent: function(type, fn){
		type = Events.removeOn(type);
		if (!this.$events[type]) return this;
		if (!fn.internal) this.$events[type].erase(fn);
		return this;
	},

	removeEvents: function(events){
		var type;
		if ($type(events) == 'object'){
			for (type in events) this.removeEvent(type, events[type]);
			return this;
		}
		if (events) events = Events.removeOn(events);
		for (type in this.$events){
			if (events && events != type) continue;
			var fns = this.$events[type];
			for (var i = fns.length; i--; i) this.removeEvent(type, fns[i]);
		}
		return this;
	}

});

Events.removeOn = function(string){
	return string.replace(/^on([A-Z])/, function(full, first){
		return first.toLowerCase();
	});
};

var Options = new Class({

	setOptions: function(){
		this.options = $merge.run([this.options].extend(arguments));
		if (!this.addEvent) return this;
		for (var option in this.options){
			if ($type(this.options[option]) != 'function' || !(/^on[A-Z]/).test(option)) continue;
			this.addEvent(option, this.options[option]);
			delete this.options[option];
		}
		return this;
	}

});


/*
---

script: Element.js

description: One of the most important items in MooTools. Contains the dollar function, the dollars function, and an handful of cross-browser, time-saver methods to let you easily work with HTML Elements.

license: MIT-style license.

requires:
- /Window
- /Document
- /Array
- /String
- /Function
- /Number
- /Hash

provides: [Element, Elements, $, $$, Iframe]

...
*/

var Element = new Native({

	name: 'Element',

	legacy: window.Element,

	initialize: function(tag, props){
		var konstructor = Element.Constructors.get(tag);
		if (konstructor) return konstructor(props);
		if (typeof tag == 'string') return document.newElement(tag, props);
		return document.id(tag).set(props);
	},

	afterImplement: function(key, value){
		Element.Prototype[key] = value;
		if (Array[key]) return;
		Elements.implement(key, function(){
			var items = [], elements = true;
			for (var i = 0, j = this.length; i < j; i++){
				var returns = this[i][key].apply(this[i], arguments);
				items.push(returns);
				if (elements) elements = ($type(returns) == 'element');
			}
			return (elements) ? new Elements(items) : items;
		});
	}

});

Element.Prototype = {$family: {name: 'element'}};

Element.Constructors = new Hash;

var IFrame = new Native({

	name: 'IFrame',

	generics: false,

	initialize: function(){
		var params = Array.link(arguments, {properties: Object.type, iframe: $defined});
		var props = params.properties || {};
		var iframe = document.id(params.iframe);
		var onload = props.onload || $empty;
		delete props.onload;
		props.id = props.name = $pick(props.id, props.name, iframe ? (iframe.id || iframe.name) : 'IFrame_' + $time());
		iframe = new Element(iframe || 'iframe', props);
		var onFrameLoad = function(){
			var host = $try(function(){
				return iframe.contentWindow.location.host;
			});
			if (!host || host == window.location.host){
				var win = new Window(iframe.contentWindow);
				new Document(iframe.contentWindow.document);
				$extend(win.Element.prototype, Element.Prototype);
			}
			onload.call(iframe.contentWindow, iframe.contentWindow.document);
		};
		var contentWindow = $try(function(){
			return iframe.contentWindow;
		});
		((contentWindow && contentWindow.document.body) || window.frames[props.id]) ? onFrameLoad() : iframe.addListener('load', onFrameLoad);
		return iframe;
	}

});

var Elements = new Native({

	initialize: function(elements, options){
		options = $extend({ddup: true, cash: true}, options);
		elements = elements || [];
		if (options.ddup || options.cash){
			var uniques = {}, returned = [];
			for (var i = 0, l = elements.length; i < l; i++){
				var el = document.id(elements[i], !options.cash);
				if (options.ddup){
					if (uniques[el.uid]) continue;
					uniques[el.uid] = true;
				}
				if (el) returned.push(el);
			}
			elements = returned;
		}
		return (options.cash) ? $extend(elements, this) : elements;
	}

});

Elements.implement({

	filter: function(filter, bind){
		if (!filter) return this;
		return new Elements(Array.filter(this, (typeof filter == 'string') ? function(item){
			return item.match(filter);
		} : filter, bind));
	}

});

Document.implement({

	newElement: function(tag, props){
		if (Browser.Engine.trident && props){
			['name', 'type', 'checked'].each(function(attribute){
				if (!props[attribute]) return;
				tag += ' ' + attribute + '="' + props[attribute] + '"';
				if (attribute != 'checked') delete props[attribute];
			});
			tag = '<' + tag + '>';
		}
		return document.id(this.createElement(tag)).set(props);
	},

	newTextNode: function(text){
		return this.createTextNode(text);
	},

	getDocument: function(){
		return this;
	},

	getWindow: function(){
		return this.window;
	},
	
	id: (function(){
		
		var types = {

			string: function(id, nocash, doc){
				id = doc.getElementById(id);
				return (id) ? types.element(id, nocash) : null;
			},
			
			element: function(el, nocash){
				$uid(el);
				if (!nocash && !el.$family && !(/^object|embed$/i).test(el.tagName)){
					var proto = Element.Prototype;
					for (var p in proto) el[p] = proto[p];
				};
				return el;
			},
			
			object: function(obj, nocash, doc){
				if (obj.toElement) return types.element(obj.toElement(doc), nocash);
				return null;
			}
			
		};

		types.textnode = types.whitespace = types.window = types.document = $arguments(0);
		
		return function(el, nocash, doc){
			if (el && el.$family && el.uid) return el;
			var type = $type(el);
			return (types[type]) ? types[type](el, nocash, doc || document) : null;
		};

	})()

});

if (window.$ == null) Window.implement({
	$: function(el, nc){
		return document.id(el, nc, this.document);
	}
});

Window.implement({

	$$: function(selector){
		if (arguments.length == 1 && typeof selector == 'string') return this.document.getElements(selector);
		var elements = [];
		var args = Array.flatten(arguments);
		for (var i = 0, l = args.length; i < l; i++){
			var item = args[i];
			switch ($type(item)){
				case 'element': elements.push(item); break;
				case 'string': elements.extend(this.document.getElements(item, true));
			}
		}
		return new Elements(elements);
	},

	getDocument: function(){
		return this.document;
	},

	getWindow: function(){
		return this;
	}

});

Native.implement([Element, Document], {

	getElement: function(selector, nocash){
		return document.id(this.getElements(selector, true)[0] || null, nocash);
	},

	getElements: function(tags, nocash){
		tags = tags.split(',');
		var elements = [];
		var ddup = (tags.length > 1);
		tags.each(function(tag){
			var partial = this.getElementsByTagName(tag.trim());
			(ddup) ? elements.extend(partial) : elements = partial;
		}, this);
		return new Elements(elements, {ddup: ddup, cash: !nocash});
	}

});

(function(){

var collected = {}, storage = {};
var props = {input: 'checked', option: 'selected', textarea: (Browser.Engine.webkit && Browser.Engine.version < 420) ? 'innerHTML' : 'value'};

var get = function(uid){
	return (storage[uid] || (storage[uid] = {}));
};

var clean = function(item, retain){
	if (!item) return;
	var uid = item.uid;
	if (Browser.Engine.trident){
		if (item.clearAttributes){
			var clone = retain && item.cloneNode(false);
			item.clearAttributes();
			if (clone) item.mergeAttributes(clone);
		} else if (item.removeEvents){
			item.removeEvents();
		}
		if ((/object/i).test(item.tagName)){
			for (var p in item){
				if (typeof item[p] == 'function') item[p] = $empty;
			}
			Element.dispose(item);
		}
	}	
	if (!uid) return;
	collected[uid] = storage[uid] = null;
};

var purge = function(){
	Hash.each(collected, clean);
	if (Browser.Engine.trident) $A(document.getElementsByTagName('object')).each(clean);
	if (window.CollectGarbage) CollectGarbage();
	collected = storage = null;
};

var walk = function(element, walk, start, match, all, nocash){
	var el = element[start || walk];
	var elements = [];
	while (el){
		if (el.nodeType == 1 && (!match || Element.match(el, match))){
			if (!all) return document.id(el, nocash);
			elements.push(el);
		}
		el = el[walk];
	}
	return (all) ? new Elements(elements, {ddup: false, cash: !nocash}) : null;
};

var attributes = {
	'html': 'innerHTML',
	'class': 'className',
	'for': 'htmlFor',
	'defaultValue': 'defaultValue',
	'text': (Browser.Engine.trident || (Browser.Engine.webkit && Browser.Engine.version < 420)) ? 'innerText' : 'textContent'
};
var bools = ['compact', 'nowrap', 'ismap', 'declare', 'noshade', 'checked', 'disabled', 'readonly', 'multiple', 'selected', 'noresize', 'defer'];
var camels = ['value', 'type', 'defaultValue', 'accessKey', 'cellPadding', 'cellSpacing', 'colSpan', 'frameBorder', 'maxLength', 'readOnly', 'rowSpan', 'tabIndex', 'useMap'];

bools = bools.associate(bools);

Hash.extend(attributes, bools);
Hash.extend(attributes, camels.associate(camels.map(String.toLowerCase)));

var inserters = {

	before: function(context, element){
		if (element.parentNode) element.parentNode.insertBefore(context, element);
	},

	after: function(context, element){
		if (!element.parentNode) return;
		var next = element.nextSibling;
		(next) ? element.parentNode.insertBefore(context, next) : element.parentNode.appendChild(context);
	},

	bottom: function(context, element){
		element.appendChild(context);
	},

	top: function(context, element){
		var first = element.firstChild;
		(first) ? element.insertBefore(context, first) : element.appendChild(context);
	}

};

inserters.inside = inserters.bottom;

Hash.each(inserters, function(inserter, where){

	where = where.capitalize();

	Element.implement('inject' + where, function(el){
		inserter(this, document.id(el, true));
		return this;
	});

	Element.implement('grab' + where, function(el){
		inserter(document.id(el, true), this);
		return this;
	});

});

Element.implement({

	set: function(prop, value){
		switch ($type(prop)){
			case 'object':
				for (var p in prop) this.set(p, prop[p]);
				break;
			case 'string':
				var property = Element.Properties.get(prop);
				(property && property.set) ? property.set.apply(this, Array.slice(arguments, 1)) : this.setProperty(prop, value);
		}
		return this;
	},

	get: function(prop){
		var property = Element.Properties.get(prop);
		return (property && property.get) ? property.get.apply(this, Array.slice(arguments, 1)) : this.getProperty(prop);
	},

	erase: function(prop){
		var property = Element.Properties.get(prop);
		(property && property.erase) ? property.erase.apply(this) : this.removeProperty(prop);
		return this;
	},

	setProperty: function(attribute, value){
		var key = attributes[attribute];
		if (value == undefined) return this.removeProperty(attribute);
		if (key && bools[attribute]) value = !!value;
		(key) ? this[key] = value : this.setAttribute(attribute, '' + value);
		return this;
	},

	setProperties: function(attributes){
		for (var attribute in attributes) this.setProperty(attribute, attributes[attribute]);
		return this;
	},

	getProperty: function(attribute){
		var key = attributes[attribute];
		var value = (key) ? this[key] : this.getAttribute(attribute, 2);
		return (bools[attribute]) ? !!value : (key) ? value : value || null;
	},

	getProperties: function(){
		var args = $A(arguments);
		return args.map(this.getProperty, this).associate(args);
	},

	removeProperty: function(attribute){
		var key = attributes[attribute];
		(key) ? this[key] = (key && bools[attribute]) ? false : '' : this.removeAttribute(attribute);
		return this;
	},

	removeProperties: function(){
		Array.each(arguments, this.removeProperty, this);
		return this;
	},

	hasClass: function(className){
		return this.className.contains(className, ' ');
	},

	addClass: function(className){
		if (!this.hasClass(className)) this.className = (this.className + ' ' + className).clean();
		return this;
	},

	removeClass: function(className){
		this.className = this.className.replace(new RegExp('(^|\\s)' + className + '(?:\\s|$)'), '$1');
		return this;
	},

	toggleClass: function(className){
		return this.hasClass(className) ? this.removeClass(className) : this.addClass(className);
	},

	adopt: function(){
		Array.flatten(arguments).each(function(element){
			element = document.id(element, true);
			if (element) this.appendChild(element);
		}, this);
		return this;
	},

	appendText: function(text, where){
		return this.grab(this.getDocument().newTextNode(text), where);
	},

	grab: function(el, where){
		inserters[where || 'bottom'](document.id(el, true), this);
		return this;
	},

	inject: function(el, where){
		inserters[where || 'bottom'](this, document.id(el, true));
		return this;
	},

	replaces: function(el){
		el = document.id(el, true);
		el.parentNode.replaceChild(this, el);
		return this;
	},

	wraps: function(el, where){
		el = document.id(el, true);
		return this.replaces(el).grab(el, where);
	},

	getPrevious: function(match, nocash){
		return walk(this, 'previousSibling', null, match, false, nocash);
	},

	getAllPrevious: function(match, nocash){
		return walk(this, 'previousSibling', null, match, true, nocash);
	},

	getNext: function(match, nocash){
		return walk(this, 'nextSibling', null, match, false, nocash);
	},

	getAllNext: function(match, nocash){
		return walk(this, 'nextSibling', null, match, true, nocash);
	},

	getFirst: function(match, nocash){
		return walk(this, 'nextSibling', 'firstChild', match, false, nocash);
	},

	getLast: function(match, nocash){
		return walk(this, 'previousSibling', 'lastChild', match, false, nocash);
	},

	getParent: function(match, nocash){
		return walk(this, 'parentNode', null, match, false, nocash);
	},

	getParents: function(match, nocash){
		return walk(this, 'parentNode', null, match, true, nocash);
	},
	
	getSiblings: function(match, nocash){
		return this.getParent().getChildren(match, nocash).erase(this);
	},

	getChildren: function(match, nocash){
		return walk(this, 'nextSibling', 'firstChild', match, true, nocash);
	},

	getWindow: function(){
		return this.ownerDocument.window;
	},

	getDocument: function(){
		return this.ownerDocument;
	},

	getElementById: function(id, nocash){
		var el = this.ownerDocument.getElementById(id);
		if (!el) return null;
		for (var parent = el.parentNode; parent != this; parent = parent.parentNode){
			if (!parent) return null;
		}
		return document.id(el, nocash);
	},

	getSelected: function(){
		return new Elements($A(this.options).filter(function(option){
			return option.selected;
		}));
	},

	getComputedStyle: function(property){
		if (this.currentStyle) return this.currentStyle[property.camelCase()];
		var computed = this.getDocument().defaultView.getComputedStyle(this, null);
		return (computed) ? computed.getPropertyValue([property.hyphenate()]) : null;
	},

	toQueryString: function(){
		var queryString = [];
		this.getElements('input, select, textarea', true).each(function(el){
			if (!el.name || el.disabled || el.type == 'submit' || el.type == 'reset' || el.type == 'file') return;
			var value = (el.tagName.toLowerCase() == 'select') ? Element.getSelected(el).map(function(opt){
				return opt.value;
			}) : ((el.type == 'radio' || el.type == 'checkbox') && !el.checked) ? null : el.value;
			$splat(value).each(function(val){
				if (typeof val != 'undefined') queryString.push(el.name + '=' + encodeURIComponent(val));
			});
		});
		return queryString.join('&');
	},

	clone: function(contents, keepid){
		contents = contents !== false;
		var clone = this.cloneNode(contents);
		var clean = function(node, element){
			if (!keepid) node.removeAttribute('id');
			if (Browser.Engine.trident){
				node.clearAttributes();
				node.mergeAttributes(element);
				node.removeAttribute('uid');
				if (node.options){
					var no = node.options, eo = element.options;
					for (var j = no.length; j--;) no[j].selected = eo[j].selected;
				}
			}
			var prop = props[element.tagName.toLowerCase()];
			if (prop && element[prop]) node[prop] = element[prop];
		};

		if (contents){
			var ce = clone.getElementsByTagName('*'), te = this.getElementsByTagName('*');
			for (var i = ce.length; i--;) clean(ce[i], te[i]);
		}

		clean(clone, this);
		return document.id(clone);
	},

	destroy: function(){
		Element.empty(this);
		Element.dispose(this);
		clean(this, true);
		return null;
	},

	empty: function(){
		$A(this.childNodes).each(function(node){
			Element.destroy(node);
		});
		return this;
	},

	dispose: function(){
		return (this.parentNode) ? this.parentNode.removeChild(this) : this;
	},

	hasChild: function(el){
		el = document.id(el, true);
		if (!el) return false;
		if (Browser.Engine.webkit && Browser.Engine.version < 420) return $A(this.getElementsByTagName(el.tagName)).contains(el);
		return (this.contains) ? (this != el && this.contains(el)) : !!(this.compareDocumentPosition(el) & 16);
	},

	match: function(tag){
		return (!tag || (tag == this) || (Element.get(this, 'tag') == tag));
	}

});

Native.implement([Element, Window, Document], {

	addListener: function(type, fn){
		if (type == 'unload'){
			var old = fn, self = this;
			fn = function(){
				self.removeListener('unload', fn);
				old();
			};
		} else {
			collected[this.uid] = this;
		}
		if (this.addEventListener) this.addEventListener(type, fn, false);
		else this.attachEvent('on' + type, fn);
		return this;
	},

	removeListener: function(type, fn){
		if (this.removeEventListener) this.removeEventListener(type, fn, false);
		else this.detachEvent('on' + type, fn);
		return this;
	},

	retrieve: function(property, dflt){
		var storage = get(this.uid), prop = storage[property];
		if (dflt != undefined && prop == undefined) prop = storage[property] = dflt;
		return $pick(prop);
	},

	store: function(property, value){
		var storage = get(this.uid);
		storage[property] = value;
		return this;
	},

	eliminate: function(property){
		var storage = get(this.uid);
		delete storage[property];
		return this;
	}

});

window.addListener('unload', purge);

})();

Element.Properties = new Hash;

Element.Properties.style = {

	set: function(style){
		this.style.cssText = style;
	},

	get: function(){
		return this.style.cssText;
	},

	erase: function(){
		this.style.cssText = '';
	}

};

Element.Properties.tag = {

	get: function(){
		return this.tagName.toLowerCase();
	}

};

Element.Properties.html = (function(){
	var wrapper = document.createElement('div');

	var translations = {
		table: [1, '<table>', '</table>'],
		select: [1, '<select>', '</select>'],
		tbody: [2, '<table><tbody>', '</tbody></table>'],
		tr: [3, '<table><tbody><tr>', '</tr></tbody></table>']
	};
	translations.thead = translations.tfoot = translations.tbody;

	var html = {
		set: function(){
			var html = Array.flatten(arguments).join('');
			var wrap = Browser.Engine.trident && translations[this.get('tag')];
			if (wrap){
				var first = wrapper;
				first.innerHTML = wrap[1] + html + wrap[2];
				for (var i = wrap[0]; i--;) first = first.firstChild;
				this.empty().adopt(first.childNodes);
			} else {
				this.innerHTML = html;
			}
		}
	};

	html.erase = html.set;

	return html;
})();

if (Browser.Engine.webkit && Browser.Engine.version < 420) Element.Properties.text = {
	get: function(){
		if (this.innerText) return this.innerText;
		var temp = this.ownerDocument.newElement('div', {html: this.innerHTML}).inject(this.ownerDocument.body);
		var text = temp.innerText;
		temp.destroy();
		return text;
	}
};


/*
---

script: Element.Event.js

description: Contains Element methods for dealing with events. This file also includes mouseenter and mouseleave custom Element Events.

license: MIT-style license.

requires: 
- /Element
- /Event

provides: [Element.Event]

...
*/

Element.Properties.events = {set: function(events){
	this.addEvents(events);
}};

Native.implement([Element, Window, Document], {

	addEvent: function(type, fn){
		var events = this.retrieve('events', {});
		events[type] = events[type] || {'keys': [], 'values': []};
		if (events[type].keys.contains(fn)) return this;
		events[type].keys.push(fn);
		var realType = type, custom = Element.Events.get(type), condition = fn, self = this;
		if (custom){
			if (custom.onAdd) custom.onAdd.call(this, fn);
			if (custom.condition){
				condition = function(event){
					if (custom.condition.call(this, event)) return fn.call(this, event);
					return true;
				};
			}
			realType = custom.base || realType;
		}
		var defn = function(){
			return fn.call(self);
		};
		var nativeEvent = Element.NativeEvents[realType];
		if (nativeEvent){
			if (nativeEvent == 2){
				defn = function(event){
					event = new Event(event, self.getWindow());
					if (condition.call(self, event) === false) event.stop();
				};
			}
			this.addListener(realType, defn);
		}
		events[type].values.push(defn);
		return this;
	},

	removeEvent: function(type, fn){
		var events = this.retrieve('events');
		if (!events || !events[type]) return this;
		var pos = events[type].keys.indexOf(fn);
		if (pos == -1) return this;
		events[type].keys.splice(pos, 1);
		var value = events[type].values.splice(pos, 1)[0];
		var custom = Element.Events.get(type);
		if (custom){
			if (custom.onRemove) custom.onRemove.call(this, fn);
			type = custom.base || type;
		}
		return (Element.NativeEvents[type]) ? this.removeListener(type, value) : this;
	},

	addEvents: function(events){
		for (var event in events) this.addEvent(event, events[event]);
		return this;
	},

	removeEvents: function(events){
		var type;
		if ($type(events) == 'object'){
			for (type in events) this.removeEvent(type, events[type]);
			return this;
		}
		var attached = this.retrieve('events');
		if (!attached) return this;
		if (!events){
			for (type in attached) this.removeEvents(type);
			this.eliminate('events');
		} else if (attached[events]){
			while (attached[events].keys[0]) this.removeEvent(events, attached[events].keys[0]);
			attached[events] = null;
		}
		return this;
	},

	fireEvent: function(type, args, delay){
		var events = this.retrieve('events');
		if (!events || !events[type]) return this;
		events[type].keys.each(function(fn){
			fn.create({'bind': this, 'delay': delay, 'arguments': args})();
		}, this);
		return this;
	},

	cloneEvents: function(from, type){
		from = document.id(from);
		var fevents = from.retrieve('events');
		if (!fevents) return this;
		if (!type){
			for (var evType in fevents) this.cloneEvents(from, evType);
		} else if (fevents[type]){
			fevents[type].keys.each(function(fn){
				this.addEvent(type, fn);
			}, this);
		}
		return this;
	}

});

Element.NativeEvents = {
	click: 2, dblclick: 2, mouseup: 2, mousedown: 2, contextmenu: 2, //mouse buttons
	mousewheel: 2, DOMMouseScroll: 2, //mouse wheel
	mouseover: 2, mouseout: 2, mousemove: 2, selectstart: 2, selectend: 2, //mouse movement
	keydown: 2, keypress: 2, keyup: 2, //keyboard
	focus: 2, blur: 2, change: 2, reset: 2, select: 2, submit: 2, //form elements
	load: 1, unload: 1, beforeunload: 2, resize: 1, move: 1, DOMContentLoaded: 1, readystatechange: 1, //window
	error: 1, abort: 1, scroll: 1 //misc
};

(function(){

var $check = function(event){
	var related = event.relatedTarget;
	if (related == undefined) return true;
	if (related === false) return false;
	return ($type(this) != 'document' && related != this && related.prefix != 'xul' && !this.hasChild(related));
};

Element.Events = new Hash({

	mouseenter: {
		base: 'mouseover',
		condition: $check
	},

	mouseleave: {
		base: 'mouseout',
		condition: $check
	},

	mousewheel: {
		base: (Browser.Engine.gecko) ? 'DOMMouseScroll' : 'mousewheel'
	}

});

})();


/*
---

script: Element.Style.js

description: Contains methods for interacting with the styles of Elements in a fashionable way.

license: MIT-style license.

requires:
- /Element

provides: [Element.Style]

...
*/

Element.Properties.styles = {set: function(styles){
	this.setStyles(styles);
}};

Element.Properties.opacity = {

	set: function(opacity, novisibility){
		if (!novisibility){
			if (opacity == 0){
				if (this.style.visibility != 'hidden') this.style.visibility = 'hidden';
			} else {
				if (this.style.visibility != 'visible') this.style.visibility = 'visible';
			}
		}
		if (!this.currentStyle || !this.currentStyle.hasLayout) this.style.zoom = 1;
		if (Browser.Engine.trident) this.style.filter = (opacity == 1) ? '' : 'alpha(opacity=' + opacity * 100 + ')';
		this.style.opacity = opacity;
		this.store('opacity', opacity);
	},

	get: function(){
		return this.retrieve('opacity', 1);
	}

};

Element.implement({

	setOpacity: function(value){
		return this.set('opacity', value, true);
	},

	getOpacity: function(){
		return this.get('opacity');
	},

	setStyle: function(property, value){
		switch (property){
			case 'opacity': return this.set('opacity', parseFloat(value));
			case 'float': property = (Browser.Engine.trident) ? 'styleFloat' : 'cssFloat';
		}
		property = property.camelCase();
		if ($type(value) != 'string'){
			var map = (Element.Styles.get(property) || '@').split(' ');
			value = $splat(value).map(function(val, i){
				if (!map[i]) return '';
				return ($type(val) == 'number') ? map[i].replace('@', Math.round(val)) : val;
			}).join(' ');
		} else if (value == String(Number(value))){
			value = Math.round(value);
		}
		this.style[property] = value;
		return this;
	},

	getStyle: function(property){
		switch (property){
			case 'opacity': return this.get('opacity');
			case 'float': property = (Browser.Engine.trident) ? 'styleFloat' : 'cssFloat';
		}
		property = property.camelCase();
		var result = this.style[property];
		if (!$chk(result)){
			result = [];
			for (var style in Element.ShortStyles){
				if (property != style) continue;
				for (var s in Element.ShortStyles[style]) result.push(this.getStyle(s));
				return result.join(' ');
			}
			result = this.getComputedStyle(property);
		}
		if (result){
			result = String(result);
			var color = result.match(/rgba?\([\d\s,]+\)/);
			if (color) result = result.replace(color[0], color[0].rgbToHex());
		}
		if (Browser.Engine.presto || (Browser.Engine.trident && !$chk(parseInt(result, 10)))){
			if (property.test(/^(height|width)$/)){
				var values = (property == 'width') ? ['left', 'right'] : ['top', 'bottom'], size = 0;
				values.each(function(value){
					size += this.getStyle('border-' + value + '-width').toInt() + this.getStyle('padding-' + value).toInt();
				}, this);
				return this['offset' + property.capitalize()] - size + 'px';
			}
			if ((Browser.Engine.presto) && String(result).test('px')) return result;
			if (property.test(/(border(.+)Width|margin|padding)/)) return '0px';
		}
		return result;
	},

	setStyles: function(styles){
		for (var style in styles) this.setStyle(style, styles[style]);
		return this;
	},

	getStyles: function(){
		var result = {};
		Array.flatten(arguments).each(function(key){
			result[key] = this.getStyle(key);
		}, this);
		return result;
	}

});

Element.Styles = new Hash({
	left: '@px', top: '@px', bottom: '@px', right: '@px',
	width: '@px', height: '@px', maxWidth: '@px', maxHeight: '@px', minWidth: '@px', minHeight: '@px',
	backgroundColor: 'rgb(@, @, @)', backgroundPosition: '@px @px', color: 'rgb(@, @, @)',
	fontSize: '@px', letterSpacing: '@px', lineHeight: '@px', clip: 'rect(@px @px @px @px)',
	margin: '@px @px @px @px', padding: '@px @px @px @px', border: '@px @ rgb(@, @, @) @px @ rgb(@, @, @) @px @ rgb(@, @, @)',
	borderWidth: '@px @px @px @px', borderStyle: '@ @ @ @', borderColor: 'rgb(@, @, @) rgb(@, @, @) rgb(@, @, @) rgb(@, @, @)',
	zIndex: '@', 'zoom': '@', fontWeight: '@', textIndent: '@px', opacity: '@'
});

Element.ShortStyles = {margin: {}, padding: {}, border: {}, borderWidth: {}, borderStyle: {}, borderColor: {}};

['Top', 'Right', 'Bottom', 'Left'].each(function(direction){
	var Short = Element.ShortStyles;
	var All = Element.Styles;
	['margin', 'padding'].each(function(style){
		var sd = style + direction;
		Short[style][sd] = All[sd] = '@px';
	});
	var bd = 'border' + direction;
	Short.border[bd] = All[bd] = '@px @ rgb(@, @, @)';
	var bdw = bd + 'Width', bds = bd + 'Style', bdc = bd + 'Color';
	Short[bd] = {};
	Short.borderWidth[bdw] = Short[bd][bdw] = All[bdw] = '@px';
	Short.borderStyle[bds] = Short[bd][bds] = All[bds] = '@';
	Short.borderColor[bdc] = Short[bd][bdc] = All[bdc] = 'rgb(@, @, @)';
});


/*
---

script: Element.Dimensions.js

description: Contains methods to work with size, scroll, or positioning of Elements and the window object.

license: MIT-style license.

credits:
- Element positioning based on the [qooxdoo](http://qooxdoo.org/) code and smart browser fixes, [LGPL License](http://www.gnu.org/licenses/lgpl.html).
- Viewport dimensions based on [YUI](http://developer.yahoo.com/yui/) code, [BSD License](http://developer.yahoo.com/yui/license.html).

requires:
- /Element

provides: [Element.Dimensions]

...
*/

(function(){

Element.implement({

	scrollTo: function(x, y){
		if (isBody(this)){
			this.getWindow().scrollTo(x, y);
		} else {
			this.scrollLeft = x;
			this.scrollTop = y;
		}
		return this;
	},

	getSize: function(){
		if (isBody(this)) return this.getWindow().getSize();
		return {x: this.offsetWidth, y: this.offsetHeight};
	},

	getScrollSize: function(){
		if (isBody(this)) return this.getWindow().getScrollSize();
		return {x: this.scrollWidth, y: this.scrollHeight};
	},

	getScroll: function(){
		if (isBody(this)) return this.getWindow().getScroll();
		return {x: this.scrollLeft, y: this.scrollTop};
	},

	getScrolls: function(){
		var element = this, position = {x: 0, y: 0};
		while (element && !isBody(element)){
			position.x += element.scrollLeft;
			position.y += element.scrollTop;
			element = element.parentNode;
		}
		return position;
	},

	getOffsetParent: function(){
		var element = this;
		if (isBody(element)) return null;
		if (!Browser.Engine.trident) return element.offsetParent;
		while ((element = element.parentNode) && !isBody(element)){
			if (styleString(element, 'position') != 'static') return element;
		}
		return null;
	},

	getOffsets: function(){
		if (this.getBoundingClientRect){
			var bound = this.getBoundingClientRect(),
				html = document.id(this.getDocument().documentElement),
				htmlScroll = html.getScroll(),
				elemScrolls = this.getScrolls(),
				elemScroll = this.getScroll(),
				isFixed = (styleString(this, 'position') == 'fixed');

			return {
				x: bound.left.toInt() + elemScrolls.x - elemScroll.x + ((isFixed) ? 0 : htmlScroll.x) - html.clientLeft,
				y: bound.top.toInt()  + elemScrolls.y - elemScroll.y + ((isFixed) ? 0 : htmlScroll.y) - html.clientTop
			};
		}

		var element = this, position = {x: 0, y: 0};
		if (isBody(this)) return position;

		while (element && !isBody(element)){
			position.x += element.offsetLeft;
			position.y += element.offsetTop;

			if (Browser.Engine.gecko){
				if (!borderBox(element)){
					position.x += leftBorder(element);
					position.y += topBorder(element);
				}
				var parent = element.parentNode;
				if (parent && styleString(parent, 'overflow') != 'visible'){
					position.x += leftBorder(parent);
					position.y += topBorder(parent);
				}
			} else if (element != this && Browser.Engine.webkit){
				position.x += leftBorder(element);
				position.y += topBorder(element);
			}

			element = element.offsetParent;
		}
		if (Browser.Engine.gecko && !borderBox(this)){
			position.x -= leftBorder(this);
			position.y -= topBorder(this);
		}
		return position;
	},

	getPosition: function(relative){
		if (isBody(this)) return {x: 0, y: 0};
		var offset = this.getOffsets(),
				scroll = this.getScrolls();
		var position = {
			x: offset.x - scroll.x,
			y: offset.y - scroll.y
		};
		var relativePosition = (relative && (relative = document.id(relative))) ? relative.getPosition() : {x: 0, y: 0};
		return {x: position.x - relativePosition.x, y: position.y - relativePosition.y};
	},

	getCoordinates: function(element){
		if (isBody(this)) return this.getWindow().getCoordinates();
		var position = this.getPosition(element),
				size = this.getSize();
		var obj = {
			left: position.x,
			top: position.y,
			width: size.x,
			height: size.y
		};
		obj.right = obj.left + obj.width;
		obj.bottom = obj.top + obj.height;
		return obj;
	},

	computePosition: function(obj){
		return {
			left: obj.x - styleNumber(this, 'margin-left'),
			top: obj.y - styleNumber(this, 'margin-top')
		};
	},

	setPosition: function(obj){
		return this.setStyles(this.computePosition(obj));
	}

});


Native.implement([Document, Window], {

	getSize: function(){
		if (Browser.Engine.presto || Browser.Engine.webkit){
			var win = this.getWindow();
			return {x: win.innerWidth, y: win.innerHeight};
		}
		var doc = getCompatElement(this);
		return {x: doc.clientWidth, y: doc.clientHeight};
	},

	getScroll: function(){
		var win = this.getWindow(), doc = getCompatElement(this);
		return {x: win.pageXOffset || doc.scrollLeft, y: win.pageYOffset || doc.scrollTop};
	},

	getScrollSize: function(){
		var doc = getCompatElement(this), min = this.getSize();
		return {x: Math.max(doc.scrollWidth, min.x), y: Math.max(doc.scrollHeight, min.y)};
	},

	getPosition: function(){
		return {x: 0, y: 0};
	},

	getCoordinates: function(){
		var size = this.getSize();
		return {top: 0, left: 0, bottom: size.y, right: size.x, height: size.y, width: size.x};
	}

});

// private methods

var styleString = Element.getComputedStyle;

function styleNumber(element, style){
	return styleString(element, style).toInt() || 0;
};

function borderBox(element){
	return styleString(element, '-moz-box-sizing') == 'border-box';
};

function topBorder(element){
	return styleNumber(element, 'border-top-width');
};

function leftBorder(element){
	return styleNumber(element, 'border-left-width');
};

function isBody(element){
	return (/^(?:body|html)$/i).test(element.tagName);
};

function getCompatElement(element){
	var doc = element.getDocument();
	return (!doc.compatMode || doc.compatMode == 'CSS1Compat') ? doc.html : doc.body;
};

})();

//aliases
Element.alias('setPosition', 'position'); //compatability

Native.implement([Window, Document, Element], {

	getHeight: function(){
		return this.getSize().y;
	},

	getWidth: function(){
		return this.getSize().x;
	},

	getScrollTop: function(){
		return this.getScroll().y;
	},

	getScrollLeft: function(){
		return this.getScroll().x;
	},

	getScrollHeight: function(){
		return this.getScrollSize().y;
	},

	getScrollWidth: function(){
		return this.getScrollSize().x;
	},

	getTop: function(){
		return this.getPosition().y;
	},

	getLeft: function(){
		return this.getPosition().x;
	}

});


/*
---

script: Selectors.js

description: Adds advanced CSS-style querying capabilities for targeting HTML Elements. Includes pseudo selectors.

license: MIT-style license.

requires:
- /Element

provides: [Selectors]

...
*/

Native.implement([Document, Element], {

	getElements: function(expression, nocash){
		expression = expression.split(',');
		var items, local = {};
		for (var i = 0, l = expression.length; i < l; i++){
			var selector = expression[i], elements = Selectors.Utils.search(this, selector, local);
			if (i != 0 && elements.item) elements = $A(elements);
			items = (i == 0) ? elements : (items.item) ? $A(items).concat(elements) : items.concat(elements);
		}
		return new Elements(items, {ddup: (expression.length > 1), cash: !nocash});
	}

});

Element.implement({

	match: function(selector){
		if (!selector || (selector == this)) return true;
		var tagid = Selectors.Utils.parseTagAndID(selector);
		var tag = tagid[0], id = tagid[1];
		if (!Selectors.Filters.byID(this, id) || !Selectors.Filters.byTag(this, tag)) return false;
		var parsed = Selectors.Utils.parseSelector(selector);
		return (parsed) ? Selectors.Utils.filter(this, parsed, {}) : true;
	}

});

var Selectors = {Cache: {nth: {}, parsed: {}}};

Selectors.RegExps = {
	id: (/#([\w-]+)/),
	tag: (/^(\w+|\*)/),
	quick: (/^(\w+|\*)$/),
	splitter: (/\s*([+>~\s])\s*([a-zA-Z#.*:\[])/g),
	combined: (/\.([\w-]+)|\[(\w+)(?:([!*^$~|]?=)(["']?)([^\4]*?)\4)?\]|:([\w-]+)(?:\(["']?(.*?)?["']?\)|$)/g)
};

Selectors.Utils = {

	chk: function(item, uniques){
		if (!uniques) return true;
		var uid = $uid(item);
		if (!uniques[uid]) return uniques[uid] = true;
		return false;
	},

	parseNthArgument: function(argument){
		if (Selectors.Cache.nth[argument]) return Selectors.Cache.nth[argument];
		var parsed = argument.match(/^([+-]?\d*)?([a-z]+)?([+-]?\d*)?$/);
		if (!parsed) return false;
		var inta = parseInt(parsed[1], 10);
		var a = (inta || inta === 0) ? inta : 1;
		var special = parsed[2] || false;
		var b = parseInt(parsed[3], 10) || 0;
		if (a != 0){
			b--;
			while (b < 1) b += a;
			while (b >= a) b -= a;
		} else {
			a = b;
			special = 'index';
		}
		switch (special){
			case 'n': parsed = {a: a, b: b, special: 'n'}; break;
			case 'odd': parsed = {a: 2, b: 0, special: 'n'}; break;
			case 'even': parsed = {a: 2, b: 1, special: 'n'}; break;
			case 'first': parsed = {a: 0, special: 'index'}; break;
			case 'last': parsed = {special: 'last-child'}; break;
			case 'only': parsed = {special: 'only-child'}; break;
			default: parsed = {a: (a - 1), special: 'index'};
		}

		return Selectors.Cache.nth[argument] = parsed;
	},

	parseSelector: function(selector){
		if (Selectors.Cache.parsed[selector]) return Selectors.Cache.parsed[selector];
		var m, parsed = {classes: [], pseudos: [], attributes: []};
		while ((m = Selectors.RegExps.combined.exec(selector))){
			var cn = m[1], an = m[2], ao = m[3], av = m[5], pn = m[6], pa = m[7];
			if (cn){
				parsed.classes.push(cn);
			} else if (pn){
				var parser = Selectors.Pseudo.get(pn);
				if (parser) parsed.pseudos.push({parser: parser, argument: pa});
				else parsed.attributes.push({name: pn, operator: '=', value: pa});
			} else if (an){
				parsed.attributes.push({name: an, operator: ao, value: av});
			}
		}
		if (!parsed.classes.length) delete parsed.classes;
		if (!parsed.attributes.length) delete parsed.attributes;
		if (!parsed.pseudos.length) delete parsed.pseudos;
		if (!parsed.classes && !parsed.attributes && !parsed.pseudos) parsed = null;
		return Selectors.Cache.parsed[selector] = parsed;
	},

	parseTagAndID: function(selector){
		var tag = selector.match(Selectors.RegExps.tag);
		var id = selector.match(Selectors.RegExps.id);
		return [(tag) ? tag[1] : '*', (id) ? id[1] : false];
	},

	filter: function(item, parsed, local){
		var i;
		if (parsed.classes){
			for (i = parsed.classes.length; i--; i){
				var cn = parsed.classes[i];
				if (!Selectors.Filters.byClass(item, cn)) return false;
			}
		}
		if (parsed.attributes){
			for (i = parsed.attributes.length; i--; i){
				var att = parsed.attributes[i];
				if (!Selectors.Filters.byAttribute(item, att.name, att.operator, att.value)) return false;
			}
		}
		if (parsed.pseudos){
			for (i = parsed.pseudos.length; i--; i){
				var psd = parsed.pseudos[i];
				if (!Selectors.Filters.byPseudo(item, psd.parser, psd.argument, local)) return false;
			}
		}
		return true;
	},

	getByTagAndID: function(ctx, tag, id){
		if (id){
			var item = (ctx.getElementById) ? ctx.getElementById(id, true) : Element.getElementById(ctx, id, true);
			return (item && Selectors.Filters.byTag(item, tag)) ? [item] : [];
		} else {
			return ctx.getElementsByTagName(tag);
		}
	},

	search: function(self, expression, local){
		var splitters = [];

		var selectors = expression.trim().replace(Selectors.RegExps.splitter, function(m0, m1, m2){
			splitters.push(m1);
			return ':)' + m2;
		}).split(':)');

		var items, filtered, item;

		for (var i = 0, l = selectors.length; i < l; i++){

			var selector = selectors[i];

			if (i == 0 && Selectors.RegExps.quick.test(selector)){
				items = self.getElementsByTagName(selector);
				continue;
			}

			var splitter = splitters[i - 1];

			var tagid = Selectors.Utils.parseTagAndID(selector);
			var tag = tagid[0], id = tagid[1];

			if (i == 0){
				items = Selectors.Utils.getByTagAndID(self, tag, id);
			} else {
				var uniques = {}, found = [];
				for (var j = 0, k = items.length; j < k; j++) found = Selectors.Getters[splitter](found, items[j], tag, id, uniques);
				items = found;
			}

			var parsed = Selectors.Utils.parseSelector(selector);

			if (parsed){
				filtered = [];
				for (var m = 0, n = items.length; m < n; m++){
					item = items[m];
					if (Selectors.Utils.filter(item, parsed, local)) filtered.push(item);
				}
				items = filtered;
			}

		}

		return items;

	}

};

Selectors.Getters = {

	' ': function(found, self, tag, id, uniques){
		var items = Selectors.Utils.getByTagAndID(self, tag, id);
		for (var i = 0, l = items.length; i < l; i++){
			var item = items[i];
			if (Selectors.Utils.chk(item, uniques)) found.push(item);
		}
		return found;
	},

	'>': function(found, self, tag, id, uniques){
		var children = Selectors.Utils.getByTagAndID(self, tag, id);
		for (var i = 0, l = children.length; i < l; i++){
			var child = children[i];
			if (child.parentNode == self && Selectors.Utils.chk(child, uniques)) found.push(child);
		}
		return found;
	},

	'+': function(found, self, tag, id, uniques){
		while ((self = self.nextSibling)){
			if (self.nodeType == 1){
				if (Selectors.Utils.chk(self, uniques) && Selectors.Filters.byTag(self, tag) && Selectors.Filters.byID(self, id)) found.push(self);
				break;
			}
		}
		return found;
	},

	'~': function(found, self, tag, id, uniques){
		while ((self = self.nextSibling)){
			if (self.nodeType == 1){
				if (!Selectors.Utils.chk(self, uniques)) break;
				if (Selectors.Filters.byTag(self, tag) && Selectors.Filters.byID(self, id)) found.push(self);
			}
		}
		return found;
	}

};

Selectors.Filters = {

	byTag: function(self, tag){
		return (tag == '*' || (self.tagName && self.tagName.toLowerCase() == tag));
	},

	byID: function(self, id){
		return (!id || (self.id && self.id == id));
	},

	byClass: function(self, klass){
		return (self.className && self.className.contains && self.className.contains(klass, ' '));
	},

	byPseudo: function(self, parser, argument, local){
		return parser.call(self, argument, local);
	},

	byAttribute: function(self, name, operator, value){
		var result = Element.prototype.getProperty.call(self, name);
		if (!result) return (operator == '!=');
		if (!operator || value == undefined) return true;
		switch (operator){
			case '=': return (result == value);
			case '*=': return (result.contains(value));
			case '^=': return (result.substr(0, value.length) == value);
			case '$=': return (result.substr(result.length - value.length) == value);
			case '!=': return (result != value);
			case '~=': return result.contains(value, ' ');
			case '|=': return result.contains(value, '-');
		}
		return false;
	}

};

Selectors.Pseudo = new Hash({

	// w3c pseudo selectors

	checked: function(){
		return this.checked;
	},
	
	empty: function(){
		return !(this.innerText || this.textContent || '').length;
	},

	not: function(selector){
		return !Element.match(this, selector);
	},

	contains: function(text){
		return (this.innerText || this.textContent || '').contains(text);
	},

	'first-child': function(){
		return Selectors.Pseudo.index.call(this, 0);
	},

	'last-child': function(){
		var element = this;
		while ((element = element.nextSibling)){
			if (element.nodeType == 1) return false;
		}
		return true;
	},

	'only-child': function(){
		var prev = this;
		while ((prev = prev.previousSibling)){
			if (prev.nodeType == 1) return false;
		}
		var next = this;
		while ((next = next.nextSibling)){
			if (next.nodeType == 1) return false;
		}
		return true;
	},

	'nth-child': function(argument, local){
		argument = (argument == undefined) ? 'n' : argument;
		var parsed = Selectors.Utils.parseNthArgument(argument);
		if (parsed.special != 'n') return Selectors.Pseudo[parsed.special].call(this, parsed.a, local);
		var count = 0;
		local.positions = local.positions || {};
		var uid = $uid(this);
		if (!local.positions[uid]){
			var self = this;
			while ((self = self.previousSibling)){
				if (self.nodeType != 1) continue;
				count ++;
				var position = local.positions[$uid(self)];
				if (position != undefined){
					count = position + count;
					break;
				}
			}
			local.positions[uid] = count;
		}
		return (local.positions[uid] % parsed.a == parsed.b);
	},

	// custom pseudo selectors

	index: function(index){
		var element = this, count = 0;
		while ((element = element.previousSibling)){
			if (element.nodeType == 1 && ++count > index) return false;
		}
		return (count == index);
	},

	even: function(argument, local){
		return Selectors.Pseudo['nth-child'].call(this, '2n+1', local);
	},

	odd: function(argument, local){
		return Selectors.Pseudo['nth-child'].call(this, '2n', local);
	},
	
	selected: function(){
		return this.selected;
	},
	
	enabled: function(){
		return (this.disabled === false);
	}

});


/*
---

script: DomReady.js

description: Contains the custom event domready.

license: MIT-style license.

requires:
- /Element.Event

provides: [DomReady]

...
*/

Element.Events.domready = {

	onAdd: function(fn){
		if (Browser.loaded) fn.call(this);
	}

};

(function(){

	var domready = function(){
		if (Browser.loaded) return;
		Browser.loaded = true;
		window.fireEvent('domready');
		document.fireEvent('domready');
	};
	
	window.addEvent('load', domready);

	if (Browser.Engine.trident){
		var temp = document.createElement('div');
		(function(){
			($try(function(){
				temp.doScroll(); // Technique by Diego Perini
				return document.id(temp).inject(document.body).set('html', 'temp').dispose();
			})) ? domready() : arguments.callee.delay(50);
		})();
	} else if (Browser.Engine.webkit && Browser.Engine.version < 525){
		(function(){
			(['loaded', 'complete'].contains(document.readyState)) ? domready() : arguments.callee.delay(50);
		})();
	} else {
		document.addEvent('DOMContentLoaded', domready);
	}

})();


/*
---

script: JSON.js

description: JSON encoder and decoder.

license: MIT-style license.

See Also: <http://www.json.org/>

requires:
- /Array
- /String
- /Number
- /Function
- /Hash

provides: [JSON]

...
*/

// NOTE: This was modified in order to fix issue with browser which
// have native implementations of JSON parser/serialiser

if(typeof JSON === "undefined") {
  var JSON = {};
  
  Native.implement([Hash, Array, String, Number], {
	  toJSON: function(){
		  return JSON.encode(this);
	  }
  });
}

$extend(JSON, {
	
	$specialChars: {'\b': '\\b', '\t': '\\t', '\n': '\\n', '\f': '\\f', '\r': '\\r', '"' : '\\"', '\\': '\\\\'},

	$replaceChars: function(chr){
		return JSON.$specialChars[chr] || '\\u00' + Math.floor(chr.charCodeAt() / 16).toString(16) + (chr.charCodeAt() % 16).toString(16);
	},

	encode: function(obj){
		switch ($type(obj)){
			case 'string':
				return '"' + obj.replace(/[\x00-\x1f\\"]/g, JSON.$replaceChars) + '"';
			case 'array':
				return '[' + String(obj.map(JSON.encode).clean()) + ']';
			case 'object': case 'hash':
				var string = [];
				Hash.each(obj, function(value, key){
					var json = JSON.encode(value);
					if (json) string.push(JSON.encode(key) + ':' + json);
				});
				return '{' + string + '}';
			case 'number': case 'boolean': return String(obj);
			case false: return 'null';
		}
		return null;
	},

	decode: function(string, secure){
		if ($type(string) != 'string' || !string.length) return null;
		if (secure && !(/^[,:{}\[\]0-9.\-+Eaeflnr-u \n\r\t]*$/).test(string.replace(/\\./g, '@').replace(/"[^"\\\n\r]*"/g, ''))) return null;
		return eval('(' + string + ')');
	}

});


/*
---

script: Fx.js

description: Contains the basic animation logic to be extended by all other Fx Classes.

license: MIT-style license.

requires:
- /Chain
- /Events
- /Options

provides: [Fx]

...
*/

var Fx = new Class({

	Implements: [Chain, Events, Options],

	options: {
		/*
		onStart: $empty,
		onCancel: $empty,
		onComplete: $empty,
		*/
		fps: 50,
		unit: false,
		duration: 500,
		link: 'ignore'
	},

	initialize: function(options){
		this.subject = this.subject || this;
		this.setOptions(options);
		this.options.duration = Fx.Durations[this.options.duration] || this.options.duration.toInt();
		var wait = this.options.wait;
		if (wait === false) this.options.link = 'cancel';
	},

	getTransition: function(){
		return function(p){
			return -(Math.cos(Math.PI * p) - 1) / 2;
		};
	},

	step: function(){
		var time = $time();
		if (time < this.time + this.options.duration){
			var delta = this.transition((time - this.time) / this.options.duration);
			this.set(this.compute(this.from, this.to, delta));
		} else {
			this.set(this.compute(this.from, this.to, 1));
			this.complete();
		}
	},

	set: function(now){
		return now;
	},

	compute: function(from, to, delta){
		return Fx.compute(from, to, delta);
	},

	check: function(){
		if (!this.timer) return true;
		switch (this.options.link){
			case 'cancel': this.cancel(); return true;
			case 'chain': this.chain(this.caller.bind(this, arguments)); return false;
		}
		return false;
	},

	start: function(from, to){
		if (!this.check(from, to)) return this;
		this.from = from;
		this.to = to;
		this.time = 0;
		this.transition = this.getTransition();
		this.startTimer();
		this.onStart();
		return this;
	},

	complete: function(){
		if (this.stopTimer()) this.onComplete();
		return this;
	},

	cancel: function(){
		if (this.stopTimer()) this.onCancel();
		return this;
	},

	onStart: function(){
		this.fireEvent('start', this.subject);
	},

	onComplete: function(){
		this.fireEvent('complete', this.subject);
		if (!this.callChain()) this.fireEvent('chainComplete', this.subject);
	},

	onCancel: function(){
		this.fireEvent('cancel', this.subject).clearChain();
	},

	pause: function(){
		this.stopTimer();
		return this;
	},

	resume: function(){
		this.startTimer();
		return this;
	},

	stopTimer: function(){
		if (!this.timer) return false;
		this.time = $time() - this.time;
		this.timer = $clear(this.timer);
		return true;
	},

	startTimer: function(){
		if (this.timer) return false;
		this.time = $time() - this.time;
		this.timer = this.step.periodical(Math.round(1000 / this.options.fps), this);
		return true;
	}

});

Fx.compute = function(from, to, delta){
	return (to - from) * delta + from;
};

Fx.Durations = {'short': 250, 'normal': 500, 'long': 1000};


/*
---

script: Fx.CSS.js

description: Contains the CSS animation logic. Used by Fx.Tween, Fx.Morph, Fx.Elements.

license: MIT-style license.

requires:
- /Fx
- /Element.Style

provides: [Fx.CSS]

...
*/

Fx.CSS = new Class({

	Extends: Fx,

	//prepares the base from/to object

	prepare: function(element, property, values){
		values = $splat(values);
		var values1 = values[1];
		if (!$chk(values1)){
			values[1] = values[0];
			values[0] = element.getStyle(property);
		}
		var parsed = values.map(this.parse);
		return {from: parsed[0], to: parsed[1]};
	},

	//parses a value into an array

	parse: function(value){
		value = $lambda(value)();
		value = (typeof value == 'string') ? value.split(' ') : $splat(value);
		return value.map(function(val){
			val = String(val);
			var found = false;
			Fx.CSS.Parsers.each(function(parser, key){
				if (found) return;
				var parsed = parser.parse(val);
				if ($chk(parsed)) found = {value: parsed, parser: parser};
			});
			found = found || {value: val, parser: Fx.CSS.Parsers.String};
			return found;
		});
	},

	//computes by a from and to prepared objects, using their parsers.

	compute: function(from, to, delta){
		var computed = [];
		(Math.min(from.length, to.length)).times(function(i){
			computed.push({value: from[i].parser.compute(from[i].value, to[i].value, delta), parser: from[i].parser});
		});
		computed.$family = {name: 'fx:css:value'};
		return computed;
	},

	//serves the value as settable

	serve: function(value, unit){
		if ($type(value) != 'fx:css:value') value = this.parse(value);
		var returned = [];
		value.each(function(bit){
			returned = returned.concat(bit.parser.serve(bit.value, unit));
		});
		return returned;
	},

	//renders the change to an element

	render: function(element, property, value, unit){
		element.setStyle(property, this.serve(value, unit));
	},

	//searches inside the page css to find the values for a selector

	search: function(selector){
		if (Fx.CSS.Cache[selector]) return Fx.CSS.Cache[selector];
		var to = {};
		Array.each(document.styleSheets, function(sheet, j){
			var href = sheet.href;
			if (href && href.contains('://') && !href.contains(document.domain)) return;
			var rules = sheet.rules || sheet.cssRules;
			Array.each(rules, function(rule, i){
				if (!rule.style) return;
				var selectorText = (rule.selectorText) ? rule.selectorText.replace(/^\w+/, function(m){
					return m.toLowerCase();
				}) : null;
				if (!selectorText || !selectorText.test('^' + selector + '$')) return;
				Element.Styles.each(function(value, style){
					if (!rule.style[style] || Element.ShortStyles[style]) return;
					value = String(rule.style[style]);
					to[style] = (value.test(/^rgb/)) ? value.rgbToHex() : value;
				});
			});
		});
		return Fx.CSS.Cache[selector] = to;
	}

});

Fx.CSS.Cache = {};

Fx.CSS.Parsers = new Hash({

	Color: {
		parse: function(value){
			if (value.match(/^#[0-9a-f]{3,6}$/i)) return value.hexToRgb(true);
			return ((value = value.match(/(\d+),\s*(\d+),\s*(\d+)/))) ? [value[1], value[2], value[3]] : false;
		},
		compute: function(from, to, delta){
			return from.map(function(value, i){
				return Math.round(Fx.compute(from[i], to[i], delta));
			});
		},
		serve: function(value){
			return value.map(Number);
		}
	},

	Number: {
		parse: parseFloat,
		compute: Fx.compute,
		serve: function(value, unit){
			return (unit) ? value + unit : value;
		}
	},

	String: {
		parse: $lambda(false),
		compute: $arguments(1),
		serve: $arguments(0)
	}

});


/*
---

script: Fx.Tween.js

description: Formerly Fx.Style, effect to transition any CSS property for an element.

license: MIT-style license.

requires: 
- /Fx.CSS

provides: [Fx.Tween, Element.fade, Element.highlight]

...
*/

Fx.Tween = new Class({

	Extends: Fx.CSS,

	initialize: function(element, options){
		this.element = this.subject = document.id(element);
		this.parent(options);
	},

	set: function(property, now){
		if (arguments.length == 1){
			now = property;
			property = this.property || this.options.property;
		}
		this.render(this.element, property, now, this.options.unit);
		return this;
	},

	start: function(property, from, to){
		if (!this.check(property, from, to)) return this;
		var args = Array.flatten(arguments);
		this.property = this.options.property || args.shift();
		var parsed = this.prepare(this.element, this.property, args);
		return this.parent(parsed.from, parsed.to);
	}

});

Element.Properties.tween = {

	set: function(options){
		var tween = this.retrieve('tween');
		if (tween) tween.cancel();
		return this.eliminate('tween').store('tween:options', $extend({link: 'cancel'}, options));
	},

	get: function(options){
		if (options || !this.retrieve('tween')){
			if (options || !this.retrieve('tween:options')) this.set('tween', options);
			this.store('tween', new Fx.Tween(this, this.retrieve('tween:options')));
		}
		return this.retrieve('tween');
	}

};

Element.implement({

	tween: function(property, from, to){
		this.get('tween').start(arguments);
		return this;
	},

	fade: function(how){
		var fade = this.get('tween'), o = 'opacity', toggle;
		how = $pick(how, 'toggle');
		switch (how){
			case 'in': fade.start(o, 1); break;
			case 'out': fade.start(o, 0); break;
			case 'show': fade.set(o, 1); break;
			case 'hide': fade.set(o, 0); break;
			case 'toggle':
				var flag = this.retrieve('fade:flag', this.get('opacity') == 1);
				fade.start(o, (flag) ? 0 : 1);
				this.store('fade:flag', !flag);
				toggle = true;
			break;
			default: fade.start(o, arguments);
		}
		if (!toggle) this.eliminate('fade:flag');
		return this;
	},

	highlight: function(start, end){
		if (!end){
			end = this.retrieve('highlight:original', this.getStyle('background-color'));
			end = (end == 'transparent') ? '#fff' : end;
		}
		var tween = this.get('tween');
		tween.start('background-color', start || '#ffff88', end).chain(function(){
			this.setStyle('background-color', this.retrieve('highlight:original'));
			tween.callChain();
		}.bind(this));
		return this;
	}

});


/*
---

script: Fx.Morph.js

description: Formerly Fx.Styles, effect to transition any number of CSS properties for an element using an object of rules, or CSS based selector rules.

license: MIT-style license.

requires:
- /Fx.CSS

provides: [Fx.Morph]

...
*/

Fx.Morph = new Class({

	Extends: Fx.CSS,

	initialize: function(element, options){
		this.element = this.subject = document.id(element);
		this.parent(options);
	},

	set: function(now){
		if (typeof now == 'string') now = this.search(now);
		for (var p in now) this.render(this.element, p, now[p], this.options.unit);
		return this;
	},

	compute: function(from, to, delta){
		var now = {};
		for (var p in from) now[p] = this.parent(from[p], to[p], delta);
		return now;
	},

	start: function(properties){
		if (!this.check(properties)) return this;
		if (typeof properties == 'string') properties = this.search(properties);
		var from = {}, to = {};
		for (var p in properties){
			var parsed = this.prepare(this.element, p, properties[p]);
			from[p] = parsed.from;
			to[p] = parsed.to;
		}
		return this.parent(from, to);
	}

});

Element.Properties.morph = {

	set: function(options){
		var morph = this.retrieve('morph');
		if (morph) morph.cancel();
		return this.eliminate('morph').store('morph:options', $extend({link: 'cancel'}, options));
	},

	get: function(options){
		if (options || !this.retrieve('morph')){
			if (options || !this.retrieve('morph:options')) this.set('morph', options);
			this.store('morph', new Fx.Morph(this, this.retrieve('morph:options')));
		}
		return this.retrieve('morph');
	}

};

Element.implement({

	morph: function(props){
		this.get('morph').start(props);
		return this;
	}

});


/*
---

script: Fx.Transitions.js

description: Contains a set of advanced transitions to be used with any of the Fx Classes.

license: MIT-style license.

credits:
- Easing Equations by Robert Penner, <http://www.robertpenner.com/easing/>, modified and optimized to be used with MooTools.

requires:
- /Fx

provides: [Fx.Transitions]

...
*/

Fx.implement({

	getTransition: function(){
		var trans = this.options.transition || Fx.Transitions.Sine.easeInOut;
		if (typeof trans == 'string'){
			var data = trans.split(':');
			trans = Fx.Transitions;
			trans = trans[data[0]] || trans[data[0].capitalize()];
			if (data[1]) trans = trans['ease' + data[1].capitalize() + (data[2] ? data[2].capitalize() : '')];
		}
		return trans;
	}

});

Fx.Transition = function(transition, params){
	params = $splat(params);
	return $extend(transition, {
		easeIn: function(pos){
			return transition(pos, params);
		},
		easeOut: function(pos){
			return 1 - transition(1 - pos, params);
		},
		easeInOut: function(pos){
			return (pos <= 0.5) ? transition(2 * pos, params) / 2 : (2 - transition(2 * (1 - pos), params)) / 2;
		}
	});
};

Fx.Transitions = new Hash({

	linear: $arguments(0)

});

Fx.Transitions.extend = function(transitions){
	for (var transition in transitions) Fx.Transitions[transition] = new Fx.Transition(transitions[transition]);
};

Fx.Transitions.extend({

	Pow: function(p, x){
		return Math.pow(p, x[0] || 6);
	},

	Expo: function(p){
		return Math.pow(2, 8 * (p - 1));
	},

	Circ: function(p){
		return 1 - Math.sin(Math.acos(p));
	},

	Sine: function(p){
		return 1 - Math.sin((1 - p) * Math.PI / 2);
	},

	Back: function(p, x){
		x = x[0] || 1.618;
		return Math.pow(p, 2) * ((x + 1) * p - x);
	},

	Bounce: function(p){
		var value;
		for (var a = 0, b = 1; 1; a += b, b /= 2){
			if (p >= (7 - 4 * a) / 11){
				value = b * b - Math.pow((11 - 6 * a - 11 * p) / 4, 2);
				break;
			}
		}
		return value;
	},

	Elastic: function(p, x){
		return Math.pow(2, 10 * --p) * Math.cos(20 * p * Math.PI * (x[0] || 1) / 3);
	}

});

['Quad', 'Cubic', 'Quart', 'Quint'].each(function(transition, i){
	Fx.Transitions[transition] = new Fx.Transition(function(p){
		return Math.pow(p, [i + 2]);
	});
});


/*
---

script: Request.js

description: Powerful all purpose Request Class. Uses XMLHTTPRequest.

license: MIT-style license.

requires:
- /Element
- /Chain
- /Events
- /Options
- /Browser

provides: [Request]

...
*/

var Request = new Class({

	Implements: [Chain, Events, Options],

	options: {/*
		onRequest: $empty,
		onComplete: $empty,
		onCancel: $empty,
		onSuccess: $empty,
		onFailure: $empty,
		onException: $empty,*/
		url: '',
		data: '',
		headers: {
			'X-Requested-With': 'XMLHttpRequest',
			'Accept': 'text/javascript, text/html, application/xml, text/xml, */*'
		},
		async: true,
		format: false,
		method: 'post',
		link: 'ignore',
		isSuccess: null,
		emulation: true,
		urlEncoded: true,
		encoding: 'utf-8',
		evalScripts: false,
		evalResponse: false,
		noCache: false
	},

	initialize: function(options){
		this.xhr = new Browser.Request();
		this.setOptions(options);
		this.options.isSuccess = this.options.isSuccess || this.isSuccess;
		this.headers = new Hash(this.options.headers);
	},

	onStateChange: function(){
		if (this.xhr.readyState != 4 || !this.running) return;
		this.running = false;
		this.status = 0;
		$try(function(){
			this.status = this.xhr.status;
		}.bind(this));
		this.xhr.onreadystatechange = $empty;
		if (this.options.isSuccess.call(this, this.status)){
			this.response = {text: this.xhr.responseText, xml: this.xhr.responseXML};
			this.success(this.response.text, this.response.xml);
		} else {
			this.response = {text: null, xml: null};
			this.failure();
		}
	},

	isSuccess: function(){
		return ((this.status >= 200) && (this.status < 300));
	},

	processScripts: function(text){
		if (this.options.evalResponse || (/(ecma|java)script/).test(this.getHeader('Content-type'))) return $exec(text);
		return text.stripScripts(this.options.evalScripts);
	},

	success: function(text, xml){
		this.onSuccess(this.processScripts(text), xml);
	},

	onSuccess: function(){
		this.fireEvent('complete', arguments).fireEvent('success', arguments).callChain();
	},

	failure: function(){
		this.onFailure();
	},

	onFailure: function(){
		this.fireEvent('complete').fireEvent('failure', this.xhr);
	},

	setHeader: function(name, value){
		this.headers.set(name, value);
		return this;
	},

	getHeader: function(name){
		return $try(function(){
			return this.xhr.getResponseHeader(name);
		}.bind(this));
	},

	check: function(){
		if (!this.running) return true;
		switch (this.options.link){
			case 'cancel': this.cancel(); return true;
			case 'chain': this.chain(this.caller.bind(this, arguments)); return false;
		}
		return false;
	},

	send: function(options){
		if (!this.check(options)) return this;
		this.running = true;

		var type = $type(options);
		if (type == 'string' || type == 'element') options = {data: options};

		var old = this.options;
		options = $extend({data: old.data, url: old.url, method: old.method}, options);
		var data = options.data, url = String(options.url), method = options.method.toLowerCase();

		switch ($type(data)){
			case 'element': data = document.id(data).toQueryString(); break;
			case 'object': case 'hash': data = Hash.toQueryString(data);
		}

		if (this.options.format){
			var format = 'format=' + this.options.format;
			data = (data) ? format + '&' + data : format;
		}

		if (this.options.emulation && !['get', 'post'].contains(method)){
			var _method = '_method=' + method;
			data = (data) ? _method + '&' + data : _method;
			method = 'post';
		}

		if (this.options.urlEncoded && method == 'post'){
			var encoding = (this.options.encoding) ? '; charset=' + this.options.encoding : '';
			this.headers.set('Content-type', 'application/x-www-form-urlencoded' + encoding);
		}

		if (this.options.noCache){
			var noCache = 'noCache=' + new Date().getTime();
			data = (data) ? noCache + '&' + data : noCache;
		}

		var trimPosition = url.lastIndexOf('/');
		if (trimPosition > -1 && (trimPosition = url.indexOf('#')) > -1) url = url.substr(0, trimPosition);

		if (data && method == 'get'){
			url = url + (url.contains('?') ? '&' : '?') + data;
			data = null;
		}

		this.xhr.open(method.toUpperCase(), url, this.options.async);

		this.xhr.onreadystatechange = this.onStateChange.bind(this);

		this.headers.each(function(value, key){
			try {
				this.xhr.setRequestHeader(key, value);
			} catch (e){
				this.fireEvent('exception', [key, value]);
			}
		}, this);

		this.fireEvent('request');
		this.xhr.send(data);
		if (!this.options.async) this.onStateChange();
		return this;
	},

	cancel: function(){
		if (!this.running) return this;
		this.running = false;
		this.xhr.abort();
		this.xhr.onreadystatechange = $empty;
		this.xhr = new Browser.Request();
		this.fireEvent('cancel');
		return this;
	}

});

(function(){

var methods = {};
['get', 'post', 'put', 'delete', 'GET', 'POST', 'PUT', 'DELETE'].each(function(method){
	methods[method] = function(){
		var params = Array.link(arguments, {url: String.type, data: $defined});
		return this.send($extend(params, {method: method}));
	};
});

Request.implement(methods);

})();

Element.Properties.send = {

	set: function(options){
		var send = this.retrieve('send');
		if (send) send.cancel();
		return this.eliminate('send').store('send:options', $extend({
			data: this, link: 'cancel', method: this.get('method') || 'post', url: this.get('action')
		}, options));
	},

	get: function(options){
		if (options || !this.retrieve('send')){
			if (options || !this.retrieve('send:options')) this.set('send', options);
			this.store('send', new Request(this.retrieve('send:options')));
		}
		return this.retrieve('send');
	}

};

Element.implement({

	send: function(url){
		var sender = this.get('send');
		sender.send({data: this, url: url || sender.options.url});
		return this;
	}

});


/*
---

script: Request.JSON.js

description: Extends the basic Request Class with additional methods for sending and receiving JSON data.

license: MIT-style license.

requires:
- /Request JSON

provides: [Request.HTML]

...
*/

Request.JSON = new Class({

	Extends: Request,

	options: {
		secure: true
	},

	initialize: function(options){
		this.parent(options);
		this.headers.extend({'Accept': 'application/json', 'X-Request': 'JSON'});
	},

	success: function(text){
		this.response.json = JSON.decode(text, this.options.secure);
		this.onSuccess(this.response.json, text);
	}

});

//MooTools More, <http://mootools.net/more>. Copyright (c) 2006-2009 Aaron Newton <http://clientcide.com/>, Valerio Proietti <http://mad4milk.net> & the MooTools team <http://mootools.net/developers>, MIT Style License.

/*
---

script: More.js

description: MooTools More

license: MIT-style license

authors:
- Guillermo Rauch
- Thomas Aylott
- Scott Kyle

requires:
- core:1.2.4/MooTools

provides: [MooTools.More]

...
*/

MooTools.More = {
	'version': '1.2.4.4',
	'build': '6f6057dc645fdb7547689183b2311063bd653ddf'
};

/*
---

script: MooTools.Lang.js

description: Provides methods for localization.

license: MIT-style license

authors:
- Aaron Newton

requires:
- core:1.2.4/Events
- /MooTools.More

provides: [MooTools.Lang]

...
*/

(function(){

	var data = {
		language: 'en-US',
		languages: {
			'en-US': {}
		},
		cascades: ['en-US']
	};
	
	var cascaded;

	MooTools.lang = new Events();

	$extend(MooTools.lang, {

		setLanguage: function(lang){
			if (!data.languages[lang]) return this;
			data.language = lang;
			this.load();
			this.fireEvent('langChange', lang);
			return this;
		},

		load: function() {
			var langs = this.cascade(this.getCurrentLanguage());
			cascaded = {};
			$each(langs, function(set, setName){
				cascaded[setName] = this.lambda(set);
			}, this);
		},

		getCurrentLanguage: function(){
			return data.language;
		},

		addLanguage: function(lang){
			data.languages[lang] = data.languages[lang] || {};
			return this;
		},

		cascade: function(lang){
			var cascades = (data.languages[lang] || {}).cascades || [];
			cascades.combine(data.cascades);
			cascades.erase(lang).push(lang);
			var langs = cascades.map(function(lng){
				return data.languages[lng];
			}, this);
			return $merge.apply(this, langs);
		},

		lambda: function(set) {
			(set || {}).get = function(key, args){
				return $lambda(set[key]).apply(this, $splat(args));
			};
			return set;
		},

		get: function(set, key, args){
			if (cascaded && cascaded[set]) return (key ? cascaded[set].get(key, args) : cascaded[set]);
		},

		set: function(lang, set, members){
			this.addLanguage(lang);
			langData = data.languages[lang];
			if (!langData[set]) langData[set] = {};
			$extend(langData[set], members);
			if (lang == this.getCurrentLanguage()){
				this.load();
				this.fireEvent('langChange', lang);
			}
			return this;
		},

		list: function(){
			return Hash.getKeys(data.languages);
		}

	});

})();

/*
---

script: Log.js

description: Provides basic logging functionality for plugins to implement.

license: MIT-style license

authors:
- Guillermo Rauch
- Thomas Aylott
- Scott Kyle

requires:
- core:1.2.4/Class
- /MooTools.More

provides: [Log]

...
*/

(function(){

var global = this;

var log = function(){
	if (global.console && console.log){
		try {
			console.log.apply(console, arguments);
		} catch(e) {
			console.log(Array.slice(arguments));
		}
	} else {
		Log.logged.push(arguments);
	}
	return this;
};

var disabled = function(){
	this.logged.push(arguments);
	return this;
};

this.Log = new Class({
	
	logged: [],
	
	log: disabled,
	
	resetLog: function(){
		this.logged.empty();
		return this;
	},

	enableLog: function(){
		this.log = log;
		this.logged.each(function(args){
			this.log.apply(this, args);
		}, this);
		return this.resetLog();
	},

	disableLog: function(){
		this.log = disabled;
		return this;
	}
	
});

Log.extend(new Log).enableLog();

// legacy
Log.logger = function(){
	return this.log.apply(this, arguments);
};

})();

/*
---

script: Class.Refactor.js

description: Extends a class onto itself with new property, preserving any items attached to the class's namespace.

license: MIT-style license

authors:
- Aaron Newton

requires:
- core:1.2.4/Class
- /MooTools.More

provides: [Class.refactor]

...
*/

Class.refactor = function(original, refactors){

	$each(refactors, function(item, name){
		var origin = original.prototype[name];
		if (origin && (origin = origin._origin) && typeof item == 'function') original.implement(name, function(){
			var old = this.previous;
			this.previous = origin;
			var value = item.apply(this, arguments);
			this.previous = old;
			return value;
		}); else original.implement(name, item);
	});

	return original;

};

/*
---

script: Class.Binds.js

description: Automagically binds specified methods in a class to the instance of the class.

license: MIT-style license

authors:
- Aaron Newton

requires:
- core:1.2.4/Class
- /MooTools.More

provides: [Class.Binds]

...
*/

Class.Mutators.Binds = function(binds){
    return binds;
};

Class.Mutators.initialize = function(initialize){
	return function(){
		$splat(this.Binds).each(function(name){
			var original = this[name];
			if (original) this[name] = original.bind(this);
		}, this);
		return initialize.apply(this, arguments);
	};
};


/*
---

script: Class.Occlude.js

description: Prevents a class from being applied to a DOM element twice.

license: MIT-style license.

authors:
- Aaron Newton

requires: 
- core/1.2.4/Class
- core:1.2.4/Element
- /MooTools.More

provides: [Class.Occlude]

...
*/

Class.Occlude = new Class({

	occlude: function(property, element){
		element = document.id(element || this.element);
		var instance = element.retrieve(property || this.property);
		if (instance && !$defined(this.occluded))
			return this.occluded = instance;

		this.occluded = false;
		element.store(property || this.property, this);
		return this.occluded;
	}

});

/*
---

script: Array.Extras.js

description: Extends the Array native object to include useful methods to work with arrays.

license: MIT-style license

authors:
- Christoph Pojer

requires:
- core:1.2.4/Array

provides: [Array.Extras]

...
*/
Array.implement({

	min: function(){
		return Math.min.apply(null, this);
	},

	max: function(){
		return Math.max.apply(null, this);
	},

	average: function(){
		return this.length ? this.sum() / this.length : 0;
	},

	sum: function(){
		var result = 0, l = this.length;
		if (l){
			do {
				result += this[--l];
			} while (l);
		}
		return result;
	},

	unique: function(){
		return [].combine(this);
	},

	shuffle: function(){
		for (var i = this.length; i && --i;){
			var temp = this[i], r = Math.floor(Math.random() * ( i + 1 ));
			this[i] = this[r];
			this[r] = temp;
		}
		return this;
	}

});

/*
---

script: Date.js

description: Extends the Date native object to include methods useful in managing dates.

license: MIT-style license

authors:
- Aaron Newton
- Nicholas Barthelemy - https://svn.nbarthelemy.com/date-js/
- Harald Kirshner - mail [at] digitarald.de; http://digitarald.de
- Scott Kyle - scott [at] appden.com; http://appden.com

requires:
- core:1.2.4/Array
- core:1.2.4/String
- core:1.2.4/Number
- core:1.2.4/Lang
- core:1.2.4/Date.English.US
- /MooTools.More

provides: [Date]

...
*/

(function(){

var Date = this.Date;

if (!Date.now) Date.now = $time;

Date.Methods = {
	ms: 'Milliseconds',
	year: 'FullYear',
	min: 'Minutes',
	mo: 'Month',
	sec: 'Seconds',
	hr: 'Hours'
};

['Date', 'Day', 'FullYear', 'Hours', 'Milliseconds', 'Minutes', 'Month', 'Seconds', 'Time', 'TimezoneOffset',
	'Week', 'Timezone', 'GMTOffset', 'DayOfYear', 'LastMonth', 'LastDayOfMonth', 'UTCDate', 'UTCDay', 'UTCFullYear',
	'AMPM', 'Ordinal', 'UTCHours', 'UTCMilliseconds', 'UTCMinutes', 'UTCMonth', 'UTCSeconds'].each(function(method){
	Date.Methods[method.toLowerCase()] = method;
});

var pad = function(what, length){
	return new Array(length - String(what).length + 1).join('0') + what;
};

Date.implement({

	set: function(prop, value){
		switch ($type(prop)){
			case 'object':
				for (var p in prop) this.set(p, prop[p]);
				break;
			case 'string':
				prop = prop.toLowerCase();
				var m = Date.Methods;
				if (m[prop]) this['set' + m[prop]](value);
		}
		return this;
	},

	get: function(prop){
		prop = prop.toLowerCase();
		var m = Date.Methods;
		if (m[prop]) return this['get' + m[prop]]();
		return null;
	},

	clone: function(){
		return new Date(this.get('time'));
	},

	increment: function(interval, times){
		interval = interval || 'day';
		times = $pick(times, 1);

		switch (interval){
			case 'year':
				return this.increment('month', times * 12);
			case 'month':
				var d = this.get('date');
				this.set('date', 1).set('mo', this.get('mo') + times);
				return this.set('date', d.min(this.get('lastdayofmonth')));
			case 'week':
				return this.increment('day', times * 7);
			case 'day':
				return this.set('date', this.get('date') + times);
		}

		if (!Date.units[interval]) throw new Error(interval + ' is not a supported interval');

		return this.set('time', this.get('time') + times * Date.units[interval]());
	},

	decrement: function(interval, times){
		return this.increment(interval, -1 * $pick(times, 1));
	},

	isLeapYear: function(){
		return Date.isLeapYear(this.get('year'));
	},

	clearTime: function(){
		return this.set({hr: 0, min: 0, sec: 0, ms: 0});
	},

	diff: function(date, resolution){
		if ($type(date) == 'string') date = Date.parse(date);
		
		return ((date - this) / Date.units[resolution || 'day'](3, 3)).toInt(); // non-leap year, 30-day month
	},

	getLastDayOfMonth: function(){
		return Date.daysInMonth(this.get('mo'), this.get('year'));
	},

	getDayOfYear: function(){
		return (Date.UTC(this.get('year'), this.get('mo'), this.get('date') + 1) 
			- Date.UTC(this.get('year'), 0, 1)) / Date.units.day();
	},

	getWeek: function(){
		return (this.get('dayofyear') / 7).ceil();
	},
	
	getOrdinal: function(day){
		return Date.getMsg('ordinal', day || this.get('date'));
	},

	getTimezone: function(){
		return this.toString()
			.replace(/^.*? ([A-Z]{3}).[0-9]{4}.*$/, '$1')
			.replace(/^.*?\(([A-Z])[a-z]+ ([A-Z])[a-z]+ ([A-Z])[a-z]+\)$/, '$1$2$3');
	},

	getGMTOffset: function(){
		var off = this.get('timezoneOffset');
		return ((off > 0) ? '-' : '+') + pad((off.abs() / 60).floor(), 2) + pad(off % 60, 2);
	},

	setAMPM: function(ampm){
		ampm = ampm.toUpperCase();
		var hr = this.get('hr');
		if (hr > 11 && ampm == 'AM') return this.decrement('hour', 12);
		else if (hr < 12 && ampm == 'PM') return this.increment('hour', 12);
		return this;
	},

	getAMPM: function(){
		return (this.get('hr') < 12) ? 'AM' : 'PM';
	},

	parse: function(str){
		this.set('time', Date.parse(str));
		return this;
	},

	isValid: function(date) {
		return !!(date || this).valueOf();
	},

	format: function(f){
		if (!this.isValid()) return 'invalid date';
		f = f || '%x %X';
		f = formats[f.toLowerCase()] || f; // replace short-hand with actual format
		var d = this;
		return f.replace(/%([a-z%])/gi,
			function($0, $1){
				switch ($1){
					case 'a': return Date.getMsg('days')[d.get('day')].substr(0, 3);
					case 'A': return Date.getMsg('days')[d.get('day')];
					case 'b': return Date.getMsg('months')[d.get('month')].substr(0, 3);
					case 'B': return Date.getMsg('months')[d.get('month')];
					case 'c': return d.toString();
					case 'd': return pad(d.get('date'), 2);
					case 'H': return pad(d.get('hr'), 2);
					case 'I': return ((d.get('hr') % 12) || 12);
					case 'j': return pad(d.get('dayofyear'), 3);
					case 'm': return pad((d.get('mo') + 1), 2);
					case 'M': return pad(d.get('min'), 2);
					case 'o': return d.get('ordinal');
					case 'p': return Date.getMsg(d.get('ampm'));
					case 'S': return pad(d.get('seconds'), 2);
					case 'U': return pad(d.get('week'), 2);
					case 'w': return d.get('day');
					case 'x': return d.format(Date.getMsg('shortDate'));
					case 'X': return d.format(Date.getMsg('shortTime'));
					case 'y': return d.get('year').toString().substr(2);
					case 'Y': return d.get('year');
					case 'T': return d.get('GMTOffset');
					case 'Z': return d.get('Timezone');
				}
				return $1;
			}
		);
	},

	toISOString: function(){
		return this.format('iso8601');
	}

});

Date.alias('toISOString', 'toJSON');
Date.alias('diff', 'compare');
Date.alias('format', 'strftime');

var formats = {
	db: '%Y-%m-%d %H:%M:%S',
	compact: '%Y%m%dT%H%M%S',
	iso8601: '%Y-%m-%dT%H:%M:%S%T',
	rfc822: '%a, %d %b %Y %H:%M:%S %Z',
	'short': '%d %b %H:%M',
	'long': '%B %d, %Y %H:%M'
};

var parsePatterns = [];
var nativeParse = Date.parse;

var parseWord = function(type, word, num){
	var ret = -1;
	var translated = Date.getMsg(type + 's');

	switch ($type(word)){
		case 'object':
			ret = translated[word.get(type)];
			break;
		case 'number':
			ret = translated[month - 1];
			if (!ret) throw new Error('Invalid ' + type + ' index: ' + index);
			break;
		case 'string':
			var match = translated.filter(function(name){
				return this.test(name);
			}, new RegExp('^' + word, 'i'));
			if (!match.length)    throw new Error('Invalid ' + type + ' string');
			if (match.length > 1) throw new Error('Ambiguous ' + type);
			ret = match[0];
	}

	return (num) ? translated.indexOf(ret) : ret;
};

Date.extend({

	getMsg: function(key, args) {
		return MooTools.lang.get('Date', key, args);
	},

	units: {
		ms: $lambda(1),
		second: $lambda(1000),
		minute: $lambda(60000),
		hour: $lambda(3600000),
		day: $lambda(86400000),
		week: $lambda(608400000),
		month: function(month, year){
			var d = new Date;
			return Date.daysInMonth($pick(month, d.get('mo')), $pick(year, d.get('year'))) * 86400000;
		},
		year: function(year){
			year = year || new Date().get('year');
			return Date.isLeapYear(year) ? 31622400000 : 31536000000;
		}
	},

	daysInMonth: function(month, year){
		return [31, Date.isLeapYear(year) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][month];
	},

	isLeapYear: function(year){
		return ((year % 4 === 0) && (year % 100 !== 0)) || (year % 400 === 0);
	},

	parse: function(from){
		var t = $type(from);
		if (t == 'number') return new Date(from);
		if (t != 'string') return from;
		from = from.clean();
		if (!from.length) return null;

		var parsed;
		parsePatterns.some(function(pattern){
			var bits = pattern.re.exec(from);
			return (bits) ? (parsed = pattern.handler(bits)) : false;
		});

		return parsed || new Date(nativeParse(from));
	},

	parseDay: function(day, num){
		return parseWord('day', day, num);
	},

	parseMonth: function(month, num){
		return parseWord('month', month, num);
	},

	parseUTC: function(value){
		var localDate = new Date(value);
		var utcSeconds = Date.UTC(
			localDate.get('year'),
			localDate.get('mo'),
			localDate.get('date'),
			localDate.get('hr'),
			localDate.get('min'),
			localDate.get('sec')
		);
		return new Date(utcSeconds);
	},

	orderIndex: function(unit){
		return Date.getMsg('dateOrder').indexOf(unit) + 1;
	},

	defineFormat: function(name, format){
		formats[name] = format;
	},

	defineFormats: function(formats){
		for (var name in formats) Date.defineFormat(name, formats[name]);
	},

	parsePatterns: parsePatterns, // this is deprecated
	
	defineParser: function(pattern){
		parsePatterns.push((pattern.re && pattern.handler) ? pattern : build(pattern));
	},
	
	defineParsers: function(){
		Array.flatten(arguments).each(Date.defineParser);
	},
	
	define2DigitYearStart: function(year){
		startYear = year % 100;
		startCentury = year - startYear;
	}

});

var startCentury = 1900;
var startYear = 70;

var regexOf = function(type){
	return new RegExp('(?:' + Date.getMsg(type).map(function(name){
		return name.substr(0, 3);
	}).join('|') + ')[a-z]*');
};

var replacers = function(key){
	switch(key){
		case 'x': // iso8601 covers yyyy-mm-dd, so just check if month is first
			return ((Date.orderIndex('month') == 1) ? '%m[.-/]%d' : '%d[.-/]%m') + '([.-/]%y)?';
		case 'X':
			return '%H([.:]%M)?([.:]%S([.:]%s)?)? ?%p? ?%T?';
	}
	return null;
};

var keys = {
	d: /[0-2]?[0-9]|3[01]/,
	H: /[01]?[0-9]|2[0-3]/,
	I: /0?[1-9]|1[0-2]/,
	M: /[0-5]?\d/,
	s: /\d+/,
	o: /[a-z]*/,
	p: /[ap]\.?m\.?/,
	y: /\d{2}|\d{4}/,
	Y: /\d{4}/,
	T: /Z|[+-]\d{2}(?::?\d{2})?/
};

keys.m = keys.I;
keys.S = keys.M;

var currentLanguage;

var recompile = function(language){
	currentLanguage = language;
	
	keys.a = keys.A = regexOf('days');
	keys.b = keys.B = regexOf('months');
	
	parsePatterns.each(function(pattern, i){
		if (pattern.format) parsePatterns[i] = build(pattern.format);
	});
};

var build = function(format){
	if (!currentLanguage) return {format: format};
	
	var parsed = [];
	var re = (format.source || format) // allow format to be regex
	 .replace(/%([a-z])/gi,
		function($0, $1){
			return replacers($1) || $0;
		}
	).replace(/\((?!\?)/g, '(?:') // make all groups non-capturing
	 .replace(/ (?!\?|\*)/g, ',? ') // be forgiving with spaces and commas
	 .replace(/%([a-z%])/gi,
		function($0, $1){
			var p = keys[$1];
			if (!p) return $1;
			parsed.push($1);
			return '(' + p.source + ')';
		}
	).replace(/\[a-z\]/gi, '[a-z\\u00c0-\\uffff]'); // handle unicode words

	return {
		format: format,
		re: new RegExp('^' + re + '$', 'i'),
		handler: function(bits){
			bits = bits.slice(1).associate(parsed);
			var date = new Date().clearTime();
			if ('d' in bits) handle.call(date, 'd', 1);
			if ('m' in bits || 'b' in bits || 'B' in bits) handle.call(date, 'm', 1);
			for (var key in bits) handle.call(date, key, bits[key]);
			return date;
		}
	};
};

var handle = function(key, value){
	if (!value) return this;

	switch(key){
		case 'a': case 'A': return this.set('day', Date.parseDay(value, true));
		case 'b': case 'B': return this.set('mo', Date.parseMonth(value, true));
		case 'd': return this.set('date', value);
		case 'H': case 'I': return this.set('hr', value);
		case 'm': return this.set('mo', value - 1);
		case 'M': return this.set('min', value);
		case 'p': return this.set('ampm', value.replace(/\./g, ''));
		case 'S': return this.set('sec', value);
		case 's': return this.set('ms', ('0.' + value) * 1000);
		case 'w': return this.set('day', value);
		case 'Y': return this.set('year', value);
		case 'y':
			value = +value;
			if (value < 100) value += startCentury + (value < startYear ? 100 : 0);
			return this.set('year', value);
		case 'T':
			if (value == 'Z') value = '+00';
			var offset = value.match(/([+-])(\d{2}):?(\d{2})?/);
			offset = (offset[1] + '1') * (offset[2] * 60 + (+offset[3] || 0)) + this.getTimezoneOffset();
			return this.set('time', this - offset * 60000);
	}

	return this;
};

Date.defineParsers(
	'%Y([-./]%m([-./]%d((T| )%X)?)?)?', // "1999-12-31", "1999-12-31 11:59pm", "1999-12-31 23:59:59", ISO8601
	'%Y%m%d(T%H(%M%S?)?)?', // "19991231", "19991231T1159", compact
	'%x( %X)?', // "12/31", "12.31.99", "12-31-1999", "12/31/2008 11:59 PM"
	'%d%o( %b( %Y)?)?( %X)?', // "31st", "31st December", "31 Dec 1999", "31 Dec 1999 11:59pm"
	'%b( %d%o)?( %Y)?( %X)?', // Same as above with month and day switched
	'%Y %b( %d%o( %X)?)?', // Same as above with year coming first
	'%o %b %d %X %T %Y' // "Thu Oct 22 08:11:23 +0000 2009"
);

MooTools.lang.addEvent('langChange', function(language){
	if (MooTools.lang.get('Date')) recompile(language);
}).fireEvent('langChange', MooTools.lang.getCurrentLanguage());

})();

/*
---

script: Hash.Extras.js

description: Extends the Hash native object to include getFromPath which allows a path notation to child elements.

license: MIT-style license

authors:
- Aaron Newton

requires:
- core:1.2.4/Hash.base
- /MooTools.More

provides: [Hash.Extras]

...
*/

Hash.implement({

	getFromPath: function(notation){
		var source = this.getClean();
		notation.replace(/\[([^\]]+)\]|\.([^.[]+)|[^[.]+/g, function(match){
			if (!source) return null;
			var prop = arguments[2] || arguments[1] || arguments[0];
			source = (prop in source) ? source[prop] : null;
			return match;
		});
		return source;
	},

	cleanValues: function(method){
		method = method || $defined;
		this.each(function(v, k){
			if (!method(v)) this.erase(k);
		}, this);
		return this;
	},

	run: function(){
		var args = arguments;
		this.each(function(v, k){
			if ($type(v) == 'function') v.run(args);
		});
	}

});

/*
---

script: String.Extras.js

description: Extends the String native object to include methods useful in managing various kinds of strings (query strings, urls, html, etc).

license: MIT-style license

authors:
- Aaron Newton
- Guillermo Rauch

requires:
- core:1.2.4/String
- core:1.2.4/$util
- core:1.2.4/Array

provides: [String.Extras]

...
*/

(function(){
  
var special = ['À','à','Á','á','Â','â','Ã','ã','Ä','ä','Å','å','Ă','ă','Ą','ą','Ć','ć','Č','č','Ç','ç', 'Ď','ď','Đ','đ', 'È','è','É','é','Ê','ê','Ë','ë','Ě','ě','Ę','ę', 'Ğ','ğ','Ì','ì','Í','í','Î','î','Ï','ï', 'Ĺ','ĺ','Ľ','ľ','Ł','ł', 'Ñ','ñ','Ň','ň','Ń','ń','Ò','ò','Ó','ó','Ô','ô','Õ','õ','Ö','ö','Ø','ø','ő','Ř','ř','Ŕ','ŕ','Š','š','Ş','ş','Ś','ś', 'Ť','ť','Ť','ť','Ţ','ţ','Ù','ù','Ú','ú','Û','û','Ü','ü','Ů','ů', 'Ÿ','ÿ','ý','Ý','Ž','ž','Ź','ź','Ż','ż', 'Þ','þ','Ð','ð','ß','Œ','œ','Æ','æ','µ'];

var standard = ['A','a','A','a','A','a','A','a','Ae','ae','A','a','A','a','A','a','C','c','C','c','C','c','D','d','D','d', 'E','e','E','e','E','e','E','e','E','e','E','e','G','g','I','i','I','i','I','i','I','i','L','l','L','l','L','l', 'N','n','N','n','N','n', 'O','o','O','o','O','o','O','o','Oe','oe','O','o','o', 'R','r','R','r', 'S','s','S','s','S','s','T','t','T','t','T','t', 'U','u','U','u','U','u','Ue','ue','U','u','Y','y','Y','y','Z','z','Z','z','Z','z','TH','th','DH','dh','ss','OE','oe','AE','ae','u'];

var tidymap = {
	"[\xa0\u2002\u2003\u2009]": " ",
	"\xb7": "*",
	"[\u2018\u2019]": "'",
	"[\u201c\u201d]": '"',
	"\u2026": "...",
	"\u2013": "-",
	"\u2014": "--",
	"\uFFFD": "&raquo;"
};

var getRegForTag = function(tag, contents) {
	tag = tag || '';
	var regstr = contents ? "<" + tag + "[^>]*>([\\s\\S]*?)<\/" + tag + ">" : "<\/?" + tag + "([^>]+)?>";
	reg = new RegExp(regstr, "gi");
	return reg;
};

String.implement({

	standardize: function(){
		var text = this;
		special.each(function(ch, i){
			text = text.replace(new RegExp(ch, 'g'), standard[i]);
		});
		return text;
	},

	repeat: function(times){
		return new Array(times + 1).join(this);
	},

	pad: function(length, str, dir){
		if (this.length >= length) return this;
		var pad = (str == null ? ' ' : '' + str).repeat(length - this.length).substr(0, length - this.length);
		if (!dir || dir == 'right') return this + pad;
		if (dir == 'left') return pad + this;
		return pad.substr(0, (pad.length / 2).floor()) + this + pad.substr(0, (pad.length / 2).ceil());
	},

	getTags: function(tag, contents){
		return this.match(getRegForTag(tag, contents)) || [];
	},

	stripTags: function(tag, contents){
		return this.replace(getRegForTag(tag, contents), '');
	},

	tidy: function(){
		var txt = this.toString();
		$each(tidymap, function(value, key){
			txt = txt.replace(new RegExp(key, 'g'), value);
		});
		return txt;
	}

});

})();

/*
---

script: String.QueryString.js

description: Methods for dealing with URI query strings.

license: MIT-style license

authors:
- Sebastian Markbåge, Aaron Newton, Lennart Pilon, Valerio Proietti

requires:
- core:1.2.4/Array
- core:1.2.4/String
- /MooTools.More

provides: [String.QueryString]

...
*/

String.implement({

	parseQueryString: function(){
		var vars = this.split(/[&;]/), res = {};
		if (vars.length) vars.each(function(val){
			var index = val.indexOf('='),
				keys = index < 0 ? [''] : val.substr(0, index).match(/[^\]\[]+/g),
				value = decodeURIComponent(val.substr(index + 1)),
				obj = res;
			keys.each(function(key, i){
				var current = obj[key];
				if(i < keys.length - 1)
					obj = obj[key] = current || {};
				else if($type(current) == 'array')
					current.push(value);
				else
					obj[key] = $defined(current) ? [current, value] : value;
			});
		});
		return res;
	},

	cleanQueryString: function(method){
		return this.split('&').filter(function(val){
			var index = val.indexOf('='),
			key = index < 0 ? '' : val.substr(0, index),
			value = val.substr(index + 1);
			return method ? method.run([key, value]) : $chk(value);
		}).join('&');
	}

});

/*
---

script: URI.js

description: Provides methods useful in managing the window location and uris.

license: MIT-style license

authors:
- Sebastian Markb�ge
- Aaron Newton

requires:
- core:1.2.4/Selectors
- /String.QueryString

provides: URI

...
*/

var URI = new Class({

	Implements: Options,

	options: {
		/*base: false*/
	},

	regex: /^(?:(\w+):)?(?:\/\/(?:(?:([^:@\/]*):?([^:@\/]*))?@)?([^:\/?#]*)(?::(\d*))?)?(\.\.?$|(?:[^?#\/]*\/)*)([^?#]*)(?:\?([^#]*))?(?:#(.*))?/,
	parts: ['scheme', 'user', 'password', 'host', 'port', 'directory', 'file', 'query', 'fragment'],
	schemes: {http: 80, https: 443, ftp: 21, rtsp: 554, mms: 1755, file: 0},

	initialize: function(uri, options){
		this.setOptions(options);
		var base = this.options.base || URI.base;
		if(!uri) uri = base;
		
		if (uri && uri.parsed) this.parsed = $unlink(uri.parsed);
		else this.set('value', uri.href || uri.toString(), base ? new URI(base) : false);
	},

	parse: function(value, base){
		var bits = value.match(this.regex);
		if (!bits) return false;
		bits.shift();
		return this.merge(bits.associate(this.parts), base);
	},

	merge: function(bits, base){
		if ((!bits || !bits.scheme) && (!base || !base.scheme)) return false;
		if (base){
			this.parts.every(function(part){
				if (bits[part]) return false;
				bits[part] = base[part] || '';
				return true;
			});
		}
		bits.port = bits.port || this.schemes[bits.scheme.toLowerCase()];
		bits.directory = bits.directory ? this.parseDirectory(bits.directory, base ? base.directory : '') : '/';
		return bits;
	},

	parseDirectory: function(directory, baseDirectory) {
		directory = (directory.substr(0, 1) == '/' ? '' : (baseDirectory || '/')) + directory;
		if (!directory.test(URI.regs.directoryDot)) return directory;
		var result = [];
		directory.replace(URI.regs.endSlash, '').split('/').each(function(dir){
			if (dir == '..' && result.length > 0) result.pop();
			else if (dir != '.') result.push(dir);
		});
		return result.join('/') + '/';
	},

	combine: function(bits){
		return bits.value || bits.scheme + '://' +
			(bits.user ? bits.user + (bits.password ? ':' + bits.password : '') + '@' : '') +
			(bits.host || '') + (bits.port && bits.port != this.schemes[bits.scheme] ? ':' + bits.port : '') +
			(bits.directory || '/') + (bits.file || '') +
			(bits.query ? '?' + bits.query : '') +
			(bits.fragment ? '#' + bits.fragment : '');
	},

	set: function(part, value, base){
		if (part == 'value'){
			var scheme = value.match(URI.regs.scheme);
			if (scheme) scheme = scheme[1];
			if (scheme && !$defined(this.schemes[scheme.toLowerCase()])) this.parsed = { scheme: scheme, value: value };
			else this.parsed = this.parse(value, (base || this).parsed) || (scheme ? { scheme: scheme, value: value } : { value: value });
		} else if (part == 'data') {
			this.setData(value);
		} else {
			this.parsed[part] = value;
		}
		return this;
	},

	get: function(part, base){
		switch(part){
			case 'value': return this.combine(this.parsed, base ? base.parsed : false);
			case 'data' : return this.getData();
		}
		return this.parsed[part] || '';
	},

	go: function(){
		document.location.href = this.toString();
	},

	toURI: function(){
		return this;
	},

	getData: function(key, part){
		var qs = this.get(part || 'query');
		if (!$chk(qs)) return key ? null : {};
		var obj = qs.parseQueryString();
		return key ? obj[key] : obj;
	},

	setData: function(values, merge, part){
		if (typeof values == 'string'){
			data = this.getData();
			data[arguments[0]] = arguments[1];
			values = data;
		} else if (merge) {
			values = $merge(this.getData(), values);
		}
		return this.set(part || 'query', Hash.toQueryString(values));
	},

	clearData: function(part){
		return this.set(part || 'query', '');
	}

});

URI.prototype.toString = URI.prototype.valueOf = function(){
	return this.get('value');
};

URI.regs = {
	endSlash: /\/$/,
	scheme: /^(\w+):/,
	directoryDot: /\.\/|\.$/
};

URI.base = new URI(document.getElements('base[href]', true).getLast(), {base: document.location});

String.implement({

	toURI: function(options){
		return new URI(this, options);
	}

});

/*
---

script: URI.Relative.js

description: Extends the URI class to add methods for computing relative and absolute urls.

license: MIT-style license

authors:
- Sebastian Markbåge


requires:
- /Class.refactor
- /URI

provides: [URI.Relative]

...
*/

URI = Class.refactor(URI, {

	combine: function(bits, base){
		if (!base || bits.scheme != base.scheme || bits.host != base.host || bits.port != base.port)
			return this.previous.apply(this, arguments);
		var end = bits.file + (bits.query ? '?' + bits.query : '') + (bits.fragment ? '#' + bits.fragment : '');

		if (!base.directory) return (bits.directory || (bits.file ? '' : './')) + end;

		var baseDir = base.directory.split('/'),
			relDir = bits.directory.split('/'),
			path = '',
			offset;

		var i = 0;
		for(offset = 0; offset < baseDir.length && offset < relDir.length && baseDir[offset] == relDir[offset]; offset++);
		for(i = 0; i < baseDir.length - offset - 1; i++) path += '../';
		for(i = offset; i < relDir.length - 1; i++) path += relDir[i] + '/';

		return (path || (bits.file ? '' : './')) + end;
	},

	toAbsolute: function(base){
		base = new URI(base);
		if (base) base.set('directory', '').set('file', '');
		return this.toRelative(base);
	},

	toRelative: function(base){
		return this.get('value', new URI(base));
	}

});

/*
---

script: Element.Forms.js

description: Extends the Element native object to include methods useful in managing inputs.

license: MIT-style license

authors:
- Aaron Newton

requires:
- core:1.2.4/Element
- /MooTools.More

provides: [Element.Forms]

...
*/

Element.implement({

	tidy: function(){
		this.set('value', this.get('value').tidy());
	},

	getTextInRange: function(start, end){
		return this.get('value').substring(start, end);
	},

	getSelectedText: function(){
		if (this.setSelectionRange) return this.getTextInRange(this.getSelectionStart(), this.getSelectionEnd());
		return document.selection.createRange().text;
	},

	getSelectedRange: function() {
		if ($defined(this.selectionStart)) return {start: this.selectionStart, end: this.selectionEnd};
		var pos = {start: 0, end: 0};
		var range = this.getDocument().selection.createRange();
		if (!range || range.parentElement() != this) return pos;
		var dup = range.duplicate();
		if (this.type == 'text') {
			pos.start = 0 - dup.moveStart('character', -100000);
			pos.end = pos.start + range.text.length;
		} else {
			var value = this.get('value');
			var offset = value.length;
			dup.moveToElementText(this);
			dup.setEndPoint('StartToEnd', range);
			if(dup.text.length) offset -= value.match(/[\n\r]*$/)[0].length;
			pos.end = offset - dup.text.length;
			dup.setEndPoint('StartToStart', range);
			pos.start = offset - dup.text.length;
		}
		return pos;
	},

	getSelectionStart: function(){
		return this.getSelectedRange().start;
	},

	getSelectionEnd: function(){
		return this.getSelectedRange().end;
	},

	setCaretPosition: function(pos){
		if (pos == 'end') pos = this.get('value').length;
		this.selectRange(pos, pos);
		return this;
	},

	getCaretPosition: function(){
		return this.getSelectedRange().start;
	},

	selectRange: function(start, end){
		if (this.setSelectionRange) {
			this.focus();
			this.setSelectionRange(start, end);
		} else {
			var value = this.get('value');
			var diff = value.substr(start, end - start).replace(/\r/g, '').length;
			start = value.substr(0, start).replace(/\r/g, '').length;
			var range = this.createTextRange();
			range.collapse(true);
			range.moveEnd('character', start + diff);
			range.moveStart('character', start);
			range.select();
		}
		return this;
	},

	insertAtCursor: function(value, select){
		var pos = this.getSelectedRange();
		var text = this.get('value');
		this.set('value', text.substring(0, pos.start) + value + text.substring(pos.end, text.length));
		if ($pick(select, true)) this.selectRange(pos.start, pos.start + value.length);
		else this.setCaretPosition(pos.start + value.length);
		return this;
	},

	insertAroundCursor: function(options, select){
		options = $extend({
			before: '',
			defaultMiddle: '',
			after: ''
		}, options);
		var value = this.getSelectedText() || options.defaultMiddle;
		var pos = this.getSelectedRange();
		var text = this.get('value');
		if (pos.start == pos.end){
			this.set('value', text.substring(0, pos.start) + options.before + value + options.after + text.substring(pos.end, text.length));
			this.selectRange(pos.start + options.before.length, pos.end + options.before.length + value.length);
		} else {
			var current = text.substring(pos.start, pos.end);
			this.set('value', text.substring(0, pos.start) + options.before + current + options.after + text.substring(pos.end, text.length));
			var selStart = pos.start + options.before.length;
			if ($pick(select, true)) this.selectRange(selStart, selStart + current.length);
			else this.setCaretPosition(selStart + text.length);
		}
		return this;
	}

});

/*
---

script: Element.Delegation.js

description: Extends the Element native object to include the delegate method for more efficient event management.

credits:
- "Event checking based on the work of Daniel Steigerwald. License: MIT-style license.	Copyright: Copyright (c) 2008 Daniel Steigerwald, daniel.steigerwald.cz"

license: MIT-style license

authors:
- Aaron Newton
- Daniel Steigerwald

requires:
- core:1.2.4/Element.Event
- core:1.2.4/Selectors
- /MooTools.More

provides: [Element.Delegation]

...
*/

(function(addEvent, removeEvent){
	
	var match = /(.*?):relay\(([^)]+)\)$/,
		combinators = /[+>~\s]/,
		splitType = function(type){
			var bits = type.match(match);
			return !bits ? {event: type} : {
				event: bits[1],
				selector: bits[2]
			};
		},
		check = function(e, selector){
			var t = e.target;
			if (combinators.test(selector = selector.trim())){
				var els = this.getElements(selector);
				for (var i = els.length; i--; ){
					var el = els[i];
					if (t == el || el.hasChild(t)) return el;
				}
			} else {
				for ( ; t && t != this; t = t.parentNode){
					if (Element.match(t, selector)) return document.id(t);
				}
			}
			return null;
		};

	Element.implement({

		addEvent: function(type, fn){
			var splitted = splitType(type);
			if (splitted.selector){
				var monitors = this.retrieve('$moo:delegateMonitors', {});
				if (!monitors[type]){
					var monitor = function(e){
						var el = check.call(this, e, splitted.selector);
						if (el) this.fireEvent(type, [e, el], 0, el);
					}.bind(this);
					monitors[type] = monitor;
					addEvent.call(this, splitted.event, monitor);
				}
			}
			return addEvent.apply(this, arguments);
		},

		removeEvent: function(type, fn){
			var splitted = splitType(type);
			if (splitted.selector){
				var events = this.retrieve('events');
				if (!events || !events[type] || (fn && !events[type].keys.contains(fn))) return this;

				if (fn) removeEvent.apply(this, [type, fn]);
				else removeEvent.apply(this, type);

				events = this.retrieve('events');
				if (events && events[type] && events[type].keys.length == 0){
					var monitors = this.retrieve('$moo:delegateMonitors', {});
					removeEvent.apply(this, [splitted.event, monitors[type]]);
					delete monitors[type];
				}
				return this;
			}
			return removeEvent.apply(this, arguments);
		},

		fireEvent: function(type, args, delay, bind){
			var events = this.retrieve('events');
			if (!events || !events[type]) return this;
			events[type].keys.each(function(fn){
				fn.create({bind: bind || this, delay: delay, arguments: args})();
			}, this);
			return this;
		}

	});

})(Element.prototype.addEvent, Element.prototype.removeEvent);

/*
---

script: Element.Measure.js

description: Extends the Element native object to include methods useful in measuring dimensions.

credits: "Element.measure / .expose methods by Daniel Steigerwald License: MIT-style license. Copyright: Copyright (c) 2008 Daniel Steigerwald, daniel.steigerwald.cz"

license: MIT-style license

authors:
- Aaron Newton

requires:
- core:1.2.4/Element.Style
- core:1.2.4/Element.Dimensions
- /MooTools.More

provides: [Element.Measure]

...
*/

Element.implement({

	measure: function(fn){
		var vis = function(el) {
			return !!(!el || el.offsetHeight || el.offsetWidth);
		};
		if (vis(this)) return fn.apply(this);
		var parent = this.getParent(),
			restorers = [],
			toMeasure = []; 
		while (!vis(parent) && parent != document.body) {
			toMeasure.push(parent.expose());
			parent = parent.getParent();
		}
		var restore = this.expose();
		var result = fn.apply(this);
		restore();
		toMeasure.each(function(restore){
			restore();
		});
		return result;
	},

	expose: function(){
		if (this.getStyle('display') != 'none') return $empty;
		var before = this.style.cssText;
		this.setStyles({
			display: 'block',
			position: 'absolute',
			visibility: 'hidden'
		});
		return function(){
			this.style.cssText = before;
		}.bind(this);
	},

	getDimensions: function(options){
		options = $merge({computeSize: false},options);
		var dim = {};
		var getSize = function(el, options){
			return (options.computeSize)?el.getComputedSize(options):el.getSize();
		};
		var parent = this.getParent('body');
		if (parent && this.getStyle('display') == 'none'){
			dim = this.measure(function(){
				return getSize(this, options);
			});
		} else if (parent){
			try { //safari sometimes crashes here, so catch it
				dim = getSize(this, options);
			}catch(e){}
		} else {
			dim = {x: 0, y: 0};
		}
		return $chk(dim.x) ? $extend(dim, {width: dim.x, height: dim.y}) : $extend(dim, {x: dim.width, y: dim.height});
	},

	getComputedSize: function(options){
		options = $merge({
			styles: ['padding','border'],
			plains: {
				height: ['top','bottom'],
				width: ['left','right']
			},
			mode: 'both'
		}, options);
		var size = {width: 0,height: 0};
		switch (options.mode){
			case 'vertical':
				delete size.width;
				delete options.plains.width;
				break;
			case 'horizontal':
				delete size.height;
				delete options.plains.height;
				break;
		}
		var getStyles = [];
		//this function might be useful in other places; perhaps it should be outside this function?
		$each(options.plains, function(plain, key){
			plain.each(function(edge){
				options.styles.each(function(style){
					getStyles.push((style == 'border') ? style + '-' + edge + '-' + 'width' : style + '-' + edge);
				});
			});
		});
		var styles = {};
		getStyles.each(function(style){ styles[style] = this.getComputedStyle(style); }, this);
		var subtracted = [];
		$each(options.plains, function(plain, key){ //keys: width, height, plains: ['left', 'right'], ['top','bottom']
			var capitalized = key.capitalize();
			size['total' + capitalized] = size['computed' + capitalized] = 0;
			plain.each(function(edge){ //top, left, right, bottom
				size['computed' + edge.capitalize()] = 0;
				getStyles.each(function(style, i){ //padding, border, etc.
					//'padding-left'.test('left') size['totalWidth'] = size['width'] + [padding-left]
					if (style.test(edge)){
						styles[style] = styles[style].toInt() || 0; //styles['padding-left'] = 5;
						size['total' + capitalized] = size['total' + capitalized] + styles[style];
						size['computed' + edge.capitalize()] = size['computed' + edge.capitalize()] + styles[style];
					}
					//if width != width (so, padding-left, for instance), then subtract that from the total
					if (style.test(edge) && key != style &&
						(style.test('border') || style.test('padding')) && !subtracted.contains(style)){
						subtracted.push(style);
						size['computed' + capitalized] = size['computed' + capitalized]-styles[style];
					}
				});
			});
		});

		['Width', 'Height'].each(function(value){
			var lower = value.toLowerCase();
			if(!$chk(size[lower])) return;

			size[lower] = size[lower] + this['offset' + value] + size['computed' + value];
			size['total' + value] = size[lower] + size['total' + value];
			delete size['computed' + value];
		}, this);

		return $extend(styles, size);
	}

});

/*
---

script: Element.Pin.js

description: Extends the Element native object to include the pin method useful for fixed positioning for elements.

license: MIT-style license

authors:
- Aaron Newton

requires:
- core:1.2.4/Element.Event
- core:1.2.4/Element.Dimensions
- core:1.2.4/Element.Style
- /MooTools.More

provides: [Element.Pin]

...
*/

(function(){
	var supportsPositionFixed = false;
	window.addEvent('domready', function(){
		var test = new Element('div').setStyles({
			position: 'fixed',
			top: 0,
			right: 0
		}).inject(document.body);
		supportsPositionFixed = (test.offsetTop === 0);
		test.dispose();
	});

	Element.implement({

		pin: function(enable){
			if (this.getStyle('display') == 'none') return null;
			
			var p,
					scroll = window.getScroll();
			if (enable !== false){
				p = this.getPosition();
				if (!this.retrieve('pinned')){
					var pos = {
						top: p.y - scroll.y,
						left: p.x - scroll.x
					};
					if (supportsPositionFixed){
						this.setStyle('position', 'fixed').setStyles(pos);
					} else {
						this.store('pinnedByJS', true);
						this.setStyles({
							position: 'absolute',
							top: p.y,
							left: p.x
						}).addClass('isPinned');
						this.store('scrollFixer', (function(){
							if (this.retrieve('pinned'))
								var scroll = window.getScroll();
								this.setStyles({
									top: pos.top.toInt() + scroll.y,
									left: pos.left.toInt() + scroll.x
								});
						}).bind(this));
						window.addEvent('scroll', this.retrieve('scrollFixer'));
					}
					this.store('pinned', true);
				}
			} else {
				var op;
				if (!Browser.Engine.trident){
					var parent = this.getParent();
					op = (parent.getComputedStyle('position') != 'static' ? parent : parent.getOffsetParent());
				}
				p = this.getPosition(op);
				this.store('pinned', false);
				var reposition;
				if (supportsPositionFixed && !this.retrieve('pinnedByJS')){
					reposition = {
						top: p.y + scroll.y,
						left: p.x + scroll.x
					};
				} else {
					this.store('pinnedByJS', false);
					window.removeEvent('scroll', this.retrieve('scrollFixer'));
					reposition = {
						top: p.y,
						left: p.x
					};
				}
				this.setStyles($merge(reposition, {position: 'absolute'})).removeClass('isPinned');
			}
			return this;
		},

		unpin: function(){
			return this.pin(false);
		},

		togglepin: function(){
			this.pin(!this.retrieve('pinned'));
		}

	});

})();

/*
---

script: Element.Position.js

description: Extends the Element native object to include methods useful positioning elements relative to others.

license: MIT-style license

authors:
- Aaron Newton

requires:
- core:1.2.4/Element.Dimensions
- /Element.Measure

provides: [Elements.Position]

...
*/

(function(){

var original = Element.prototype.position;

Element.implement({

	position: function(options){
		//call original position if the options are x/y values
		if (options && ($defined(options.x) || $defined(options.y))) return original ? original.apply(this, arguments) : this;
		$each(options||{}, function(v, k){ if (!$defined(v)) delete options[k]; });
		options = $merge({
			// minimum: { x: 0, y: 0 },
			// maximum: { x: 0, y: 0},
			relativeTo: document.body,
			position: {
				x: 'center', //left, center, right
				y: 'center' //top, center, bottom
			},
			edge: false,
			offset: {x: 0, y: 0},
			returnPos: false,
			relFixedPosition: false,
			ignoreMargins: false,
			ignoreScroll: false,
			allowNegative: false
		}, options);
		//compute the offset of the parent positioned element if this element is in one
		var parentOffset = {x: 0, y: 0}, 
				parentPositioned = false;
		/* dollar around getOffsetParent should not be necessary, but as it does not return
		 * a mootools extended element in IE, an error occurs on the call to expose. See:
		 * http://mootools.lighthouseapp.com/projects/2706/tickets/333-element-getoffsetparent-inconsistency-between-ie-and-other-browsers */
		var offsetParent = this.measure(function(){
			return document.id(this.getOffsetParent());
		});
		if (offsetParent && offsetParent != this.getDocument().body){
			parentOffset = offsetParent.measure(function(){
				return this.getPosition();
			});
			parentPositioned = offsetParent != document.id(options.relativeTo);
			options.offset.x = options.offset.x - parentOffset.x;
			options.offset.y = options.offset.y - parentOffset.y;
		}
		//upperRight, bottomRight, centerRight, upperLeft, bottomLeft, centerLeft
		//topRight, topLeft, centerTop, centerBottom, center
		var fixValue = function(option){
			if ($type(option) != 'string') return option;
			option = option.toLowerCase();
			var val = {};
			if (option.test('left')) val.x = 'left';
			else if (option.test('right')) val.x = 'right';
			else val.x = 'center';
			if (option.test('upper') || option.test('top')) val.y = 'top';
			else if (option.test('bottom')) val.y = 'bottom';
			else val.y = 'center';
			return val;
		};
		options.edge = fixValue(options.edge);
		options.position = fixValue(options.position);
		if (!options.edge){
			if (options.position.x == 'center' && options.position.y == 'center') options.edge = {x:'center', y:'center'};
			else options.edge = {x:'left', y:'top'};
		}

		this.setStyle('position', 'absolute');
		var rel = document.id(options.relativeTo) || document.body,
				calc = rel == document.body ? window.getScroll() : rel.getPosition(),
				top = calc.y, left = calc.x;

		var dim = this.getDimensions({computeSize: true, styles:['padding', 'border','margin']});
		var pos = {},
				prefY = options.offset.y,
				prefX = options.offset.x,
				winSize = window.getSize();
		switch(options.position.x){
			case 'left':
				pos.x = left + prefX;
				break;
			case 'right':
				pos.x = left + prefX + rel.offsetWidth;
				break;
			default: //center
				pos.x = left + ((rel == document.body ? winSize.x : rel.offsetWidth)/2) + prefX;
				break;
		}
		switch(options.position.y){
			case 'top':
				pos.y = top + prefY;
				break;
			case 'bottom':
				pos.y = top + prefY + rel.offsetHeight;
				break;
			default: //center
				pos.y = top + ((rel == document.body ? winSize.y : rel.offsetHeight)/2) + prefY;
				break;
		}
		if (options.edge){
			var edgeOffset = {};

			switch(options.edge.x){
				case 'left':
					edgeOffset.x = 0;
					break;
				case 'right':
					edgeOffset.x = -dim.x-dim.computedRight-dim.computedLeft;
					break;
				default: //center
					edgeOffset.x = -(dim.totalWidth/2);
					break;
			}
			switch(options.edge.y){
				case 'top':
					edgeOffset.y = 0;
					break;
				case 'bottom':
					edgeOffset.y = -dim.y-dim.computedTop-dim.computedBottom;
					break;
				default: //center
					edgeOffset.y = -(dim.totalHeight/2);
					break;
			}
			pos.x += edgeOffset.x;
			pos.y += edgeOffset.y;
		}
		pos = {
			left: ((pos.x >= 0 || parentPositioned || options.allowNegative) ? pos.x : 0).toInt(),
			top: ((pos.y >= 0 || parentPositioned || options.allowNegative) ? pos.y : 0).toInt()
		};
		var xy = {left: 'x', top: 'y'};
		['minimum', 'maximum'].each(function(minmax) {
			['left', 'top'].each(function(lr) {
				var val = options[minmax] ? options[minmax][xy[lr]] : null;
				if (val != null && pos[lr] < val) pos[lr] = val;
			});
		});
		if (rel.getStyle('position') == 'fixed' || options.relFixedPosition){
			var winScroll = window.getScroll();
			pos.top+= winScroll.y;
			pos.left+= winScroll.x;
		}
		if (options.ignoreScroll) {
			var relScroll = rel.getScroll();
			pos.top-= relScroll.y;
			pos.left-= relScroll.x;
		}
		if (options.ignoreMargins) {
			pos.left += (
				options.edge.x == 'right' ? dim['margin-right'] : 
				options.edge.x == 'center' ? -dim['margin-left'] + ((dim['margin-right'] + dim['margin-left'])/2) : 
					- dim['margin-left']
			);
			pos.top += (
				options.edge.y == 'bottom' ? dim['margin-bottom'] : 
				options.edge.y == 'center' ? -dim['margin-top'] + ((dim['margin-bottom'] + dim['margin-top'])/2) : 
					- dim['margin-top']
			);
		}
		pos.left = Math.ceil(pos.left);
		pos.top = Math.ceil(pos.top);
		if (options.returnPos) return pos;
		else this.setStyles(pos);
		return this;
	}

});

})();

/*
---

script: Element.Shortcuts.js

description: Extends the Element native object to include some shortcut methods.

license: MIT-style license

authors:
- Aaron Newton

requires:
- core:1.2.4/Element.Style
- /MooTools.More

provides: [Element.Shortcuts]

...
*/

Element.implement({

	isDisplayed: function(){
		return this.getStyle('display') != 'none';
	},

	isVisible: function(){
		var w = this.offsetWidth,
			h = this.offsetHeight;
		return (w == 0 && h == 0) ? false : (w > 0 && h > 0) ? true : this.isDisplayed();
	},

	toggle: function(){
		return this[this.isDisplayed() ? 'hide' : 'show']();
	},

	hide: function(){
		var d;
		try {
			//IE fails here if the element is not in the dom
			d = this.getStyle('display');
		} catch(e){}
		return this.store('originalDisplay', d || '').setStyle('display', 'none');
	},

	show: function(display){
		display = display || this.retrieve('originalDisplay') || 'block';
		return this.setStyle('display', (display == 'none') ? 'block' : display);
	},

	swapClass: function(remove, add){
		return this.removeClass(remove).addClass(add);
	}

});


/*
---

script: OverText.js

description: Shows text over an input that disappears when the user clicks into it. The text remains hidden if the user adds a value.

license: MIT-style license

authors:
- Aaron Newton

requires:
- core:1.2.4/Options
- core:1.2.4/Events
- core:1.2.4/Element.Event
- /Class.Binds
- /Class.Occlude
- /Element.Position
- /Element.Shortcuts

provides: [OverText]

...
*/

var OverText = new Class({

	Implements: [Options, Events, Class.Occlude],

	Binds: ['reposition', 'assert', 'focus', 'hide'],

	options: {/*
		textOverride: null,
		onFocus: $empty()
		onTextHide: $empty(textEl, inputEl),
		onTextShow: $empty(textEl, inputEl), */
		element: 'label',
		positionOptions: {
			position: 'upperLeft',
			edge: 'upperLeft',
			offset: {
				x: 4,
				y: 2
			}
		},
		poll: false,
		pollInterval: 250,
		wrap: false
	},

	property: 'OverText',

	initialize: function(element, options){
		this.element = document.id(element);
		if (this.occlude()) return this.occluded;
		this.setOptions(options);
		this.attach(this.element);
		OverText.instances.push(this);
		if (this.options.poll) this.poll();
		return this;
	},

	toElement: function(){
		return this.element;
	},

	attach: function(){
		var val = this.options.textOverride || this.element.get('alt') || this.element.get('title');
		if (!val) return;
		this.text = new Element(this.options.element, {
			'class': 'overTxtLabel',
			styles: {
				lineHeight: 'normal',
				position: 'absolute',
				cursor: 'text'
			},
			html: val,
			events: {
				click: this.hide.pass(this.options.element == 'label', this)
			}
		}).inject(this.element, 'after');
		if (this.options.element == 'label') {
			if (!this.element.get('id')) this.element.set('id', 'input_' + new Date().getTime());
			this.text.set('for', this.element.get('id'));
		}

		if (this.options.wrap) {
			this.textHolder = new Element('div', {
				styles: {
					lineHeight: 'normal',
					position: 'relative'
				},
				'class':'overTxtWrapper'
			}).adopt(this.text).inject(this.element, 'before');
		}

		this.element.addEvents({
			focus: this.focus,
			blur: this.assert,
			change: this.assert
		}).store('OverTextDiv', this.text);
		window.addEvent('resize', this.reposition.bind(this));
		this.assert(true);
		this.reposition();
	},

	wrap: function(){
		if (this.options.element == 'label') {
			if (!this.element.get('id')) this.element.set('id', 'input_' + new Date().getTime());
			this.text.set('for', this.element.get('id'));
		}
	},

	startPolling: function(){
		this.pollingPaused = false;
		return this.poll();
	},

	poll: function(stop){
		//start immediately
		//pause on focus
		//resumeon blur
		if (this.poller && !stop) return this;
		var test = function(){
			if (!this.pollingPaused) this.assert(true);
		}.bind(this);
		if (stop) $clear(this.poller);
		else this.poller = test.periodical(this.options.pollInterval, this);
		return this;
	},

	stopPolling: function(){
		this.pollingPaused = true;
		return this.poll(true);
	},

	focus: function(){
		if (this.text && (!this.text.isDisplayed() || this.element.get('disabled'))) return;
		this.hide();
	},

	hide: function(suppressFocus, force){
		if (this.text && (this.text.isDisplayed() && (!this.element.get('disabled') || force))){
			this.text.hide();
			this.fireEvent('textHide', [this.text, this.element]);
			this.pollingPaused = true;
			if (!suppressFocus){
				try {
					this.element.fireEvent('focus');
					this.element.focus();
				} catch(e){} //IE barfs if you call focus on hidden elements
			}
		}
		return this;
	},

	show: function(){
		if (this.text && !this.text.isDisplayed()){
			this.text.show();
			this.reposition();
			this.fireEvent('textShow', [this.text, this.element]);
			this.pollingPaused = false;
		}
		return this;
	},

	assert: function(suppressFocus){
		this[this.test() ? 'show' : 'hide'](suppressFocus);
	},

	test: function(){
		var v = this.element.get('value');
		return !v;
	},

	reposition: function(){
		this.assert(true);
		if (!this.element.isVisible()) return this.stopPolling().hide();
		if (this.text && this.test()) this.text.position($merge(this.options.positionOptions, {relativeTo: this.element}));
		return this;
	}

});

OverText.instances = [];

$extend(OverText, {

	each: function(fn) {
		return OverText.instances.map(function(ot, i){
			if (ot.element && ot.text) return fn.apply(OverText, [ot, i]);
			return null; //the input or the text was destroyed
		});
	},
	
	update: function(){

		return OverText.each(function(ot){
			return ot.reposition();
		});

	},

	hideAll: function(){

		return OverText.each(function(ot){
			return ot.hide(true, true);
		});

	},

	showAll: function(){
		return OverText.each(function(ot) {
			return ot.show();
		});
	}

});

if (window.Fx && Fx.Reveal) {
	Fx.Reveal.implement({
		hideInputs: Browser.Engine.trident ? 'select, input, textarea, object, embed, .overTxtLabel' : false
	});
}

/*
---

script: Fx.Elements.js

description: Effect to change any number of CSS properties of any number of Elements.

license: MIT-style license

authors:
- Valerio Proietti

requires:
- core:1.2.4/Fx.CSS
- /MooTools.More

provides: [Fx.Elements]

...
*/

Fx.Elements = new Class({

	Extends: Fx.CSS,

	initialize: function(elements, options){
		this.elements = this.subject = $$(elements);
		this.parent(options);
	},

	compute: function(from, to, delta){
		var now = {};
		for (var i in from){
			var iFrom = from[i], iTo = to[i], iNow = now[i] = {};
			for (var p in iFrom) iNow[p] = this.parent(iFrom[p], iTo[p], delta);
		}
		return now;
	},

	set: function(now){
		for (var i in now){
			var iNow = now[i];
			for (var p in iNow) this.render(this.elements[i], p, iNow[p], this.options.unit);
		}
		return this;
	},

	start: function(obj){
		if (!this.check(obj)) return this;
		var from = {}, to = {};
		for (var i in obj){
			var iProps = obj[i], iFrom = from[i] = {}, iTo = to[i] = {};
			for (var p in iProps){
				var parsed = this.prepare(this.elements[i], p, iProps[p]);
				iFrom[p] = parsed.from;
				iTo[p] = parsed.to;
			}
		}
		return this.parent(from, to);
	}

});

/*
---

script: Fx.Move.js

description: Defines Fx.Move, a class that works with Element.Position.js to transition an element from one location to another.

license: MIT-style license

authors:
- Aaron Newton

requires:
- core:1.2.4/Fx.Morph
- /Element.Position

provides: [Fx.Move]

...
*/

Fx.Move = new Class({

	Extends: Fx.Morph,

	options: {
		relativeTo: document.body,
		position: 'center',
		edge: false,
		offset: {x: 0, y: 0}
	},

	start: function(destination){
		return this.parent(this.element.position($merge(this.options, destination, {returnPos: true})));
	}

});

Element.Properties.move = {

	set: function(options){
		var morph = this.retrieve('move');
		if (morph) morph.cancel();
		return this.eliminate('move').store('move:options', $extend({link: 'cancel'}, options));
	},

	get: function(options){
		if (options || !this.retrieve('move')){
			if (options || !this.retrieve('move:options')) this.set('move', options);
			this.store('move', new Fx.Move(this, this.retrieve('move:options')));
		}
		return this.retrieve('move');
	}

};

Element.implement({

	move: function(options){
		this.get('move').start(options);
		return this;
	}

});


/*
---

script: Fx.Reveal.js

description: Defines Fx.Reveal, a class that shows and hides elements with a transition.

license: MIT-style license

authors:
- Aaron Newton

requires:
- core:1.2.4/Fx.Morph
- /Element.Shortcuts
- /Element.Measure

provides: [Fx.Reveal]

...
*/

Fx.Reveal = new Class({

	Extends: Fx.Morph,

	options: {/*	  
		onShow: $empty(thisElement),
		onHide: $empty(thisElement),
		onComplete: $empty(thisElement),
		heightOverride: null,
		widthOverride: null, */
		link: 'cancel',
		styles: ['padding', 'border', 'margin'],
		transitionOpacity: !Browser.Engine.trident4,
		mode: 'vertical',
		display: 'block',
		hideInputs: Browser.Engine.trident ? 'select, input, textarea, object, embed' : false
	},

	dissolve: function(){
		try {
			if (!this.hiding && !this.showing){
				if (this.element.getStyle('display') != 'none'){
					this.hiding = true;
					this.showing = false;
					this.hidden = true;
					this.cssText = this.element.style.cssText;
					var startStyles = this.element.getComputedSize({
						styles: this.options.styles,
						mode: this.options.mode
					});
					this.element.setStyle('display', this.options.display);
					if (this.options.transitionOpacity) startStyles.opacity = 1;
					var zero = {};
					$each(startStyles, function(style, name){
						zero[name] = [style, 0];
					}, this);
					this.element.setStyle('overflow', 'hidden');
					var hideThese = this.options.hideInputs ? this.element.getElements(this.options.hideInputs) : null;
					this.$chain.unshift(function(){
						if (this.hidden){
							this.hiding = false;
							$each(startStyles, function(style, name){
								startStyles[name] = style;
							}, this);
							this.element.style.cssText = this.cssText;
							this.element.setStyle('display', 'none');
							if (hideThese) hideThese.setStyle('visibility', 'visible');
						}
						this.fireEvent('hide', this.element);
						this.callChain();
					}.bind(this));
					if (hideThese) hideThese.setStyle('visibility', 'hidden');
					this.start(zero);
				} else {
					this.callChain.delay(10, this);
					this.fireEvent('complete', this.element);
					this.fireEvent('hide', this.element);
				}
			} else if (this.options.link == 'chain'){
				this.chain(this.dissolve.bind(this));
			} else if (this.options.link == 'cancel' && !this.hiding){
				this.cancel();
				this.dissolve();
			}
		} catch(e){
			this.hiding = false;
			this.element.setStyle('display', 'none');
			this.callChain.delay(10, this);
			this.fireEvent('complete', this.element);
			this.fireEvent('hide', this.element);
		}
		return this;
	},

	reveal: function(){
		try {
			if (!this.showing && !this.hiding){
				if (this.element.getStyle('display') == 'none' ||
					 this.element.getStyle('visiblity') == 'hidden' ||
					 this.element.getStyle('opacity') == 0){
					this.showing = true;
					this.hiding = this.hidden =  false;
					var startStyles;
					this.cssText = this.element.style.cssText;
					//toggle display, but hide it
					this.element.measure(function(){
						//create the styles for the opened/visible state
						startStyles = this.element.getComputedSize({
							styles: this.options.styles,
							mode: this.options.mode
						});
					}.bind(this));
					$each(startStyles, function(style, name){
						startStyles[name] = style;
					});
					//if we're overridding height/width
					if ($chk(this.options.heightOverride)) startStyles.height = this.options.heightOverride.toInt();
					if ($chk(this.options.widthOverride)) startStyles.width = this.options.widthOverride.toInt();
					if (this.options.transitionOpacity) {
						this.element.setStyle('opacity', 0);
						startStyles.opacity = 1;
					}
					//create the zero state for the beginning of the transition
					var zero = {
						height: 0,
						display: this.options.display
					};
					$each(startStyles, function(style, name){ zero[name] = 0; });
					//set to zero
					this.element.setStyles($merge(zero, {overflow: 'hidden'}));
					//hide inputs
					var hideThese = this.options.hideInputs ? this.element.getElements(this.options.hideInputs) : null;
					if (hideThese) hideThese.setStyle('visibility', 'hidden');
					//start the effect
					this.start(startStyles);
					this.$chain.unshift(function(){
						this.element.style.cssText = this.cssText;
						this.element.setStyle('display', this.options.display);
						if (!this.hidden) this.showing = false;
						if (hideThese) hideThese.setStyle('visibility', 'visible');
						this.callChain();
						this.fireEvent('show', this.element);
					}.bind(this));
				} else {
					this.callChain();
					this.fireEvent('complete', this.element);
					this.fireEvent('show', this.element);
				}
			} else if (this.options.link == 'chain'){
				this.chain(this.reveal.bind(this));
			} else if (this.options.link == 'cancel' && !this.showing){
				this.cancel();
				this.reveal();
			}
		} catch(e){
			this.element.setStyles({
				display: this.options.display,
				visiblity: 'visible',
				opacity: 1
			});
			this.showing = false;
			this.callChain.delay(10, this);
			this.fireEvent('complete', this.element);
			this.fireEvent('show', this.element);
		}
		return this;
	},

	toggle: function(){
		if (this.element.getStyle('display') == 'none' ||
			 this.element.getStyle('visiblity') == 'hidden' ||
			 this.element.getStyle('opacity') == 0){
			this.reveal();
		} else {
			this.dissolve();
		}
		return this;
	},

	cancel: function(){
		this.parent.apply(this, arguments);
		this.element.style.cssText = this.cssText;
		this.hidding = false;
		this.showing = false;
	}

});

Element.Properties.reveal = {

	set: function(options){
		var reveal = this.retrieve('reveal');
		if (reveal) reveal.cancel();
		return this.eliminate('reveal').store('reveal:options', options);
	},

	get: function(options){
		if (options || !this.retrieve('reveal')){
			if (options || !this.retrieve('reveal:options')) this.set('reveal', options);
			this.store('reveal', new Fx.Reveal(this, this.retrieve('reveal:options')));
		}
		return this.retrieve('reveal');
	}

};

Element.Properties.dissolve = Element.Properties.reveal;

Element.implement({

	reveal: function(options){
		this.get('reveal', options).reveal();
		return this;
	},

	dissolve: function(options){
		this.get('reveal', options).dissolve();
		return this;
	},

	nix: function(){
		var params = Array.link(arguments, {destroy: Boolean.type, options: Object.type});
		this.get('reveal', params.options).dissolve().chain(function(){
			this[params.destroy ? 'destroy' : 'dispose']();
		}.bind(this));
		return this;
	},

	wink: function(){
		var params = Array.link(arguments, {duration: Number.type, options: Object.type});
		var reveal = this.get('reveal', params.options);
		reveal.reveal().chain(function(){
			(function(){
				reveal.dissolve();
			}).delay(params.duration || 2000);
		});
	}


});

/*
---

script: Fx.Slide.js

description: Effect to slide an element in and out of view.

license: MIT-style license

authors:
- Valerio Proietti

requires:
- core:1.2.4/Fx Element.Style
- /MooTools.More

provides: [Fx.Slide]

...
*/

Fx.Slide = new Class({

	Extends: Fx,

	options: {
		mode: 'vertical',
		wrapper: false,
		hideOverflow: true
	},

	initialize: function(element, options){
		this.addEvent('complete', function(){
			this.open = (this.wrapper['offset' + this.layout.capitalize()] != 0);
			if (this.open) this.wrapper.setStyle('height', '');
			if (this.open && Browser.Engine.webkit419) this.element.dispose().inject(this.wrapper);
		}, true);
		this.element = this.subject = document.id(element);
		this.parent(options);
		var wrapper = this.element.retrieve('wrapper');
		var styles = this.element.getStyles('margin', 'position', 'overflow');
		if (this.options.hideOverflow) styles = $extend(styles, {overflow: 'hidden'});
		if (this.options.wrapper) wrapper = document.id(this.options.wrapper).setStyles(styles);
		this.wrapper = wrapper || new Element('div', {
			styles: styles
		}).wraps(this.element);
		this.element.store('wrapper', this.wrapper).setStyle('margin', 0);
		this.now = [];
		this.open = true;
	},

	vertical: function(){
		this.margin = 'margin-top';
		this.layout = 'height';
		this.offset = this.element.offsetHeight;
	},

	horizontal: function(){
		this.margin = 'margin-left';
		this.layout = 'width';
		this.offset = this.element.offsetWidth;
	},

	set: function(now){
		this.element.setStyle(this.margin, now[0]);
		this.wrapper.setStyle(this.layout, now[1]);
		return this;
	},

	compute: function(from, to, delta){
		return [0, 1].map(function(i){
			return Fx.compute(from[i], to[i], delta);
		});
	},

	start: function(how, mode){
		if (!this.check(how, mode)) return this;
		this[mode || this.options.mode]();
		var margin = this.element.getStyle(this.margin).toInt();
		var layout = this.wrapper.getStyle(this.layout).toInt();
		var caseIn = [[margin, layout], [0, this.offset]];
		var caseOut = [[margin, layout], [-this.offset, 0]];
		var start;
		switch (how){
			case 'in': start = caseIn; break;
			case 'out': start = caseOut; break;
			case 'toggle': start = (layout == 0) ? caseIn : caseOut;
		}
		return this.parent(start[0], start[1]);
	},

	slideIn: function(mode){
		return this.start('in', mode);
	},

	slideOut: function(mode){
		return this.start('out', mode);
	},

	hide: function(mode){
		this[mode || this.options.mode]();
		this.open = false;
		return this.set([-this.offset, 0]);
	},

	show: function(mode){
		this[mode || this.options.mode]();
		this.open = true;
		return this.set([0, this.offset]);
	},

	toggle: function(mode){
		return this.start('toggle', mode);
	}

});

Element.Properties.slide = {

	set: function(options){
		var slide = this.retrieve('slide');
		if (slide) slide.cancel();
		return this.eliminate('slide').store('slide:options', $extend({link: 'cancel'}, options));
	},

	get: function(options){
		if (options || !this.retrieve('slide')){
			if (options || !this.retrieve('slide:options')) this.set('slide', options);
			this.store('slide', new Fx.Slide(this, this.retrieve('slide:options')));
		}
		return this.retrieve('slide');
	}

};

Element.implement({

	slide: function(how, mode){
		how = how || 'toggle';
		var slide = this.get('slide'), toggle;
		switch (how){
			case 'hide': slide.hide(mode); break;
			case 'show': slide.show(mode); break;
			case 'toggle':
				var flag = this.retrieve('slide:flag', slide.open);
				slide[flag ? 'slideOut' : 'slideIn'](mode);
				this.store('slide:flag', !flag);
				toggle = true;
			break;
			default: slide.start(how, mode);
		}
		if (!toggle) this.eliminate('slide:flag');
		return this;
	}

});


/*
---

script: Drag.js

description: The base Drag Class. Can be used to drag and resize Elements using mouse events.

license: MIT-style license

authors:
- Valerio Proietti
- Tom Occhinno
- Jan Kassens

requires:
- core:1.2.4/Events
- core:1.2.4/Options
- core:1.2.4/Element.Event
- core:1.2.4/Element.Style
- /MooTools.More

provides: [Drag]

*/

var Drag = new Class({

	Implements: [Events, Options],

	options: {/*
		onBeforeStart: $empty(thisElement),
		onStart: $empty(thisElement, event),
		onSnap: $empty(thisElement)
		onDrag: $empty(thisElement, event),
		onCancel: $empty(thisElement),
		onComplete: $empty(thisElement, event),*/
		snap: 6,
		unit: 'px',
		grid: false,
		style: true,
		limit: false,
		handle: false,
		invert: false,
		preventDefault: false,
		stopPropagation: false,
		modifiers: {x: 'left', y: 'top'}
	},

	initialize: function(){
		var params = Array.link(arguments, {'options': Object.type, 'element': $defined});
		this.element = document.id(params.element);
		this.document = this.element.getDocument();
		this.setOptions(params.options || {});
		var htype = $type(this.options.handle);
		this.handles = ((htype == 'array' || htype == 'collection') ? $$(this.options.handle) : document.id(this.options.handle)) || this.element;
		this.mouse = {'now': {}, 'pos': {}};
		this.value = {'start': {}, 'now': {}};

		this.selection = (Browser.Engine.trident) ? 'selectstart' : 'mousedown';

		this.bound = {
			start: this.start.bind(this),
			check: this.check.bind(this),
			drag: this.drag.bind(this),
			stop: this.stop.bind(this),
			cancel: this.cancel.bind(this),
			eventStop: $lambda(false)
		};
		this.attach();
	},

	attach: function(){
		this.handles.addEvent('mousedown', this.bound.start);
		return this;
	},

	detach: function(){
		this.handles.removeEvent('mousedown', this.bound.start);
		return this;
	},

	start: function(event){
		if (event.rightClick) return;
		if (this.options.preventDefault) event.preventDefault();
		if (this.options.stopPropagation) event.stopPropagation();
		this.mouse.start = event.page;
		this.fireEvent('beforeStart', this.element);
		var limit = this.options.limit;
		this.limit = {x: [], y: []};
		for (var z in this.options.modifiers){
			if (!this.options.modifiers[z]) continue;
			if (this.options.style) this.value.now[z] = this.element.getStyle(this.options.modifiers[z]).toInt();
			else this.value.now[z] = this.element[this.options.modifiers[z]];
			if (this.options.invert) this.value.now[z] *= -1;
			this.mouse.pos[z] = event.page[z] - this.value.now[z];
			if (limit && limit[z]){
				for (var i = 2; i--; i){
					if ($chk(limit[z][i])) this.limit[z][i] = $lambda(limit[z][i])();
				}
			}
		}
		if ($type(this.options.grid) == 'number') this.options.grid = {x: this.options.grid, y: this.options.grid};
		this.document.addEvents({mousemove: this.bound.check, mouseup: this.bound.cancel});
		this.document.addEvent(this.selection, this.bound.eventStop);
	},

	check: function(event){
		if (this.options.preventDefault) event.preventDefault();
		var distance = Math.round(Math.sqrt(Math.pow(event.page.x - this.mouse.start.x, 2) + Math.pow(event.page.y - this.mouse.start.y, 2)));
		if (distance > this.options.snap){
			this.cancel();
			this.document.addEvents({
				mousemove: this.bound.drag,
				mouseup: this.bound.stop
			});
			this.fireEvent('start', [this.element, event]).fireEvent('snap', this.element);
		}
	},

	drag: function(event){
		if (this.options.preventDefault) event.preventDefault();
		this.mouse.now = event.page;
		for (var z in this.options.modifiers){
			if (!this.options.modifiers[z]) continue;
			this.value.now[z] = this.mouse.now[z] - this.mouse.pos[z];
			if (this.options.invert) this.value.now[z] *= -1;
			if (this.options.limit && this.limit[z]){
				if ($chk(this.limit[z][1]) && (this.value.now[z] > this.limit[z][1])){
					this.value.now[z] = this.limit[z][1];
				} else if ($chk(this.limit[z][0]) && (this.value.now[z] < this.limit[z][0])){
					this.value.now[z] = this.limit[z][0];
				}
			}
			if (this.options.grid[z]) this.value.now[z] -= ((this.value.now[z] - (this.limit[z][0]||0)) % this.options.grid[z]);
			if (this.options.style) {
				this.element.setStyle(this.options.modifiers[z], this.value.now[z] + this.options.unit);
			} else {
				this.element[this.options.modifiers[z]] = this.value.now[z];
			}
		}
		this.fireEvent('drag', [this.element, event]);
	},

	cancel: function(event){
		this.document.removeEvent('mousemove', this.bound.check);
		this.document.removeEvent('mouseup', this.bound.cancel);
		if (event){
			this.document.removeEvent(this.selection, this.bound.eventStop);
			this.fireEvent('cancel', this.element);
		}
	},

	stop: function(event){
		this.document.removeEvent(this.selection, this.bound.eventStop);
		this.document.removeEvent('mousemove', this.bound.drag);
		this.document.removeEvent('mouseup', this.bound.stop);
		if (event) this.fireEvent('complete', [this.element, event]);
	}

});

Element.implement({

	makeResizable: function(options){
		var drag = new Drag(this, $merge({modifiers: {x: 'width', y: 'height'}}, options));
		this.store('resizer', drag);
		return drag.addEvent('drag', function(){
			this.fireEvent('resize', drag);
		}.bind(this));
	}

});


/*
---

script: Drag.Move.js

description: A Drag extension that provides support for the constraining of draggables to containers and droppables.

license: MIT-style license

authors:
- Valerio Proietti
- Tom Occhinno
- Jan Kassens
- Aaron Newton
- Scott Kyle

requires:
- core:1.2.4/Element.Dimensions
- /Drag

provides: [Drag.Move]

...
*/

Drag.Move = new Class({

	Extends: Drag,

	options: {/*
		onEnter: $empty(thisElement, overed),
		onLeave: $empty(thisElement, overed),
		onDrop: $empty(thisElement, overed, event),*/
		droppables: [],
		container: false,
		precalculate: false,
		includeMargins: true,
		checkDroppables: true
	},

	initialize: function(element, options){
		this.parent(element, options);
		element = this.element;
		
		this.droppables = $$(this.options.droppables);
		this.container = document.id(this.options.container);
		
		if (this.container && $type(this.container) != 'element')
			this.container = document.id(this.container.getDocument().body);
		
		var styles = element.getStyles('left', 'top', 'position');
		if (styles.left == 'auto' || styles.top == 'auto')
			element.setPosition(element.getPosition(element.getOffsetParent()));
		
		if (styles.position == 'static')
			element.setStyle('position', 'absolute');

		this.addEvent('start', this.checkDroppables, true);

		this.overed = null;
	},

	start: function(event){
		if (this.container) this.options.limit = this.calculateLimit();
		
		if (this.options.precalculate){
			this.positions = this.droppables.map(function(el){
				return el.getCoordinates();
			});
		}
		
		this.parent(event);
	},
	
	calculateLimit: function(){
		var offsetParent = this.element.getOffsetParent(),
			containerCoordinates = this.container.getCoordinates(offsetParent),
			containerBorder = {},
			elementMargin = {},
			elementBorder = {},
			containerMargin = {},
			offsetParentPadding = {};

		['top', 'right', 'bottom', 'left'].each(function(pad){
			containerBorder[pad] = this.container.getStyle('border-' + pad).toInt();
			elementBorder[pad] = this.element.getStyle('border-' + pad).toInt();
			elementMargin[pad] = this.element.getStyle('margin-' + pad).toInt();
			containerMargin[pad] = this.container.getStyle('margin-' + pad).toInt();
			offsetParentPadding[pad] = offsetParent.getStyle('padding-' + pad).toInt();
		}, this);

		var width = this.element.offsetWidth + elementMargin.left + elementMargin.right,
			height = this.element.offsetHeight + elementMargin.top + elementMargin.bottom,
			left = 0,
			top = 0,
			right = containerCoordinates.right - containerBorder.right - width,
			bottom = containerCoordinates.bottom - containerBorder.bottom - height;

		if (this.options.includeMargins){
			left += elementMargin.left;
			top += elementMargin.top;
		} else {
			right += elementMargin.right;
			bottom += elementMargin.bottom;
		}
		
		if (this.element.getStyle('position') == 'relative'){
			var coords = this.element.getCoordinates(offsetParent);
			coords.left -= this.element.getStyle('left').toInt();
			coords.top -= this.element.getStyle('top').toInt();
			
			left += containerBorder.left - coords.left;
			top += containerBorder.top - coords.top;
			right += elementMargin.left - coords.left;
			bottom += elementMargin.top - coords.top;
			
			if (this.container != offsetParent){
				left += containerMargin.left + offsetParentPadding.left;
				top += (Browser.Engine.trident4 ? 0 : containerMargin.top) + offsetParentPadding.top;
			}
		} else {
			left -= elementMargin.left;
			top -= elementMargin.top;
			
			if (this.container == offsetParent){
				right -= containerBorder.left;
				bottom -= containerBorder.top;
			} else {
				left += containerCoordinates.left + containerBorder.left;
				top += containerCoordinates.top + containerBorder.top;
			}
		}
		
		return {
			x: [left, right],
			y: [top, bottom]
		};
	},

	checkAgainst: function(el, i){
		el = (this.positions) ? this.positions[i] : el.getCoordinates();
		var now = this.mouse.now;
		return (now.x > el.left && now.x < el.right && now.y < el.bottom && now.y > el.top);
	},

	checkDroppables: function(){
		var overed = this.droppables.filter(this.checkAgainst, this).getLast();
		if (this.overed != overed){
			if (this.overed) this.fireEvent('leave', [this.element, this.overed]);
			if (overed) this.fireEvent('enter', [this.element, overed]);
			this.overed = overed;
		}
	},

	drag: function(event){
		this.parent(event);
		if (this.options.checkDroppables && this.droppables.length) this.checkDroppables();
	},

	stop: function(event){
		this.checkDroppables();
		this.fireEvent('drop', [this.element, this.overed, event]);
		this.overed = null;
		return this.parent(event);
	}

});

Element.implement({

	makeDraggable: function(options){
		var drag = new Drag.Move(this, options);
		this.store('dragger', drag);
		return drag;
	}

});


/*
---

script: Slider.js

description: Class for creating horizontal and vertical slider controls.

license: MIT-style license

authors:
- Valerio Proietti

requires:
- core:1.2.4/Element.Dimensions
- /Class.Binds
- /Drag
- /Element.Dimensions
- /Element.Measure

provides: [Slider]

...
*/

var Slider = new Class({

	Implements: [Events, Options],

	Binds: ['clickedElement', 'draggedKnob', 'scrolledElement'],

	options: {/*
		onTick: $empty(intPosition),
		onChange: $empty(intStep),
		onComplete: $empty(strStep),*/
		onTick: function(position){
			if (this.options.snap) position = this.toPosition(this.step);
			this.knob.setStyle(this.property, position);
		},
		initialStep: 0,
		snap: false,
		offset: 0,
		range: false,
		wheel: false,
		steps: 100,
		mode: 'horizontal'
	},

	initialize: function(element, knob, options){
		this.setOptions(options);
		this.element = document.id(element);
		this.knob = document.id(knob);
		this.previousChange = this.previousEnd = this.step = -1;
		var offset, limit = {}, modifiers = {'x': false, 'y': false};
		switch (this.options.mode){
			case 'vertical':
				this.axis = 'y';
				this.property = 'top';
				offset = 'offsetHeight';
				break;
			case 'horizontal':
				this.axis = 'x';
				this.property = 'left';
				offset = 'offsetWidth';
		}
		
		this.full = this.element.measure(function(){ 
			this.half = this.knob[offset] / 2; 
			return this.element[offset] - this.knob[offset] + (this.options.offset * 2); 
		}.bind(this));
		
		this.min = $chk(this.options.range[0]) ? this.options.range[0] : 0;
		this.max = $chk(this.options.range[1]) ? this.options.range[1] : this.options.steps;
		this.range = this.max - this.min;
		this.steps = this.options.steps || this.full;
		this.stepSize = Math.abs(this.range) / this.steps;
		this.stepWidth = this.stepSize * this.full / Math.abs(this.range) ;

		this.knob.setStyle('position', 'relative').setStyle(this.property, this.options.initialStep ? this.toPosition(this.options.initialStep) : - this.options.offset);
		modifiers[this.axis] = this.property;
		limit[this.axis] = [- this.options.offset, this.full - this.options.offset];

		var dragOptions = {
			snap: 0,
			limit: limit,
			modifiers: modifiers,
			onDrag: this.draggedKnob,
			onStart: this.draggedKnob,
			onBeforeStart: (function(){
				this.isDragging = true;
			}).bind(this),
			onCancel: function() {
				this.isDragging = false;
			}.bind(this),
			onComplete: function(){
				this.isDragging = false;
				this.draggedKnob();
				this.end();
			}.bind(this)
		};
		if (this.options.snap){
			dragOptions.grid = Math.ceil(this.stepWidth);
			dragOptions.limit[this.axis][1] = this.full;
		}

		this.drag = new Drag(this.knob, dragOptions);
		this.attach();
	},

	attach: function(){
		this.element.addEvent('mousedown', this.clickedElement);
		if (this.options.wheel) this.element.addEvent('mousewheel', this.scrolledElement);
		this.drag.attach();
		return this;
	},

	detach: function(){
		this.element.removeEvent('mousedown', this.clickedElement);
		this.element.removeEvent('mousewheel', this.scrolledElement);
		this.drag.detach();
		return this;
	},

	set: function(step){
		if (!((this.range > 0) ^ (step < this.min))) step = this.min;
		if (!((this.range > 0) ^ (step > this.max))) step = this.max;

		this.step = Math.round(step);
		this.checkStep();
		this.fireEvent('tick', this.toPosition(this.step));
		this.end();
		return this;
	},

	clickedElement: function(event){
		if (this.isDragging || event.target == this.knob) return;

		var dir = this.range < 0 ? -1 : 1;
		var position = event.page[this.axis] - this.element.getPosition()[this.axis] - this.half;
		position = position.limit(-this.options.offset, this.full -this.options.offset);

		this.step = Math.round(this.min + dir * this.toStep(position));
		this.checkStep();
		this.fireEvent('tick', position);
		this.end();
	},

	scrolledElement: function(event){
		var mode = (this.options.mode == 'horizontal') ? (event.wheel < 0) : (event.wheel > 0);
		this.set(mode ? this.step - this.stepSize : this.step + this.stepSize);
		event.stop();
	},

	draggedKnob: function(){
		var dir = this.range < 0 ? -1 : 1;
		var position = this.drag.value.now[this.axis];
		position = position.limit(-this.options.offset, this.full -this.options.offset);
		this.step = Math.round(this.min + dir * this.toStep(position));
		this.checkStep();
	},

	checkStep: function(){
		if (this.previousChange != this.step){
			this.previousChange = this.step;
			this.fireEvent('change', this.step);
		}
	},

	end: function(){
		if (this.previousEnd !== this.step){
			this.previousEnd = this.step;
			this.fireEvent('complete', this.step + '');
		}
	},

	toStep: function(position){
		var step = (position + this.options.offset) * this.stepSize / this.full * this.steps;
		return this.options.steps ? Math.round(step -= step % this.stepSize) : step;
	},

	toPosition: function(step){
		return (this.full * Math.abs(this.min - step)) / (this.steps * this.stepSize) - this.options.offset;
	}

});

/*
---

script: Sortables.js

description: Class for creating a drag and drop sorting interface for lists of items.

license: MIT-style license

authors:
- Tom Occhino

requires:
- /Drag.Move

provides: [Slider]

...
*/

var Sortables = new Class({

	Implements: [Events, Options],

	options: {/*
		onSort: $empty(element, clone),
		onStart: $empty(element, clone),
		onComplete: $empty(element),*/
		snap: 4,
		opacity: 1,
		clone: false,
		revert: false,
		handle: false,
		constrain: false
	},

	initialize: function(lists, options){
		this.setOptions(options);
		this.elements = [];
		this.lists = [];
		this.idle = true;

		this.addLists($$(document.id(lists) || lists));
		if (!this.options.clone) this.options.revert = false;
		if (this.options.revert) this.effect = new Fx.Morph(null, $merge({duration: 250, link: 'cancel'}, this.options.revert));
	},

	attach: function(){
		this.addLists(this.lists);
		return this;
	},

	detach: function(){
		this.lists = this.removeLists(this.lists);
		return this;
	},

	addItems: function(){
		Array.flatten(arguments).each(function(element){
			this.elements.push(element);
			var start = element.retrieve('sortables:start', this.start.bindWithEvent(this, element));
			(this.options.handle ? element.getElement(this.options.handle) || element : element).addEvent('mousedown', start);
		}, this);
		return this;
	},

	addLists: function(){
		Array.flatten(arguments).each(function(list){
			this.lists.push(list);
			this.addItems(list.getChildren());
		}, this);
		return this;
	},

	removeItems: function(){
		return $$(Array.flatten(arguments).map(function(element){
			this.elements.erase(element);
			var start = element.retrieve('sortables:start');
			(this.options.handle ? element.getElement(this.options.handle) || element : element).removeEvent('mousedown', start);
			
			return element;
		}, this));
	},

	removeLists: function(){
		return $$(Array.flatten(arguments).map(function(list){
			this.lists.erase(list);
			this.removeItems(list.getChildren());
			
			return list;
		}, this));
	},

	getClone: function(event, element){
		if (!this.options.clone) return new Element('div').inject(document.body);
		if ($type(this.options.clone) == 'function') return this.options.clone.call(this, event, element, this.list);
		var clone = element.clone(true).setStyles({
			margin: '0px',
			position: 'absolute',
			visibility: 'hidden',
			'width': element.getStyle('width')
		});
		//prevent the duplicated radio inputs from unchecking the real one
		if (clone.get('html').test('radio')) {
			clone.getElements('input[type=radio]').each(function(input, i) {
				input.set('name', 'clone_' + i);
			});
		}
		
		return clone.inject(this.list).setPosition(element.getPosition(element.getOffsetParent()));
	},

	getDroppables: function(){
		var droppables = this.list.getChildren();
		if (!this.options.constrain) droppables = this.lists.concat(droppables).erase(this.list);
		return droppables.erase(this.clone).erase(this.element);
	},

	insert: function(dragging, element){
		var where = 'inside';
		if (this.lists.contains(element)){
			this.list = element;
			this.drag.droppables = this.getDroppables();
		} else {
			where = this.element.getAllPrevious().contains(element) ? 'before' : 'after';
		}
		this.element.inject(element, where);
		this.fireEvent('sort', [this.element, this.clone]);
	},

	start: function(event, element){
		if (!this.idle) return;
		this.idle = false;
		this.element = element;
		this.opacity = element.get('opacity');
		this.list = element.getParent();
		this.clone = this.getClone(event, element);

		this.drag = new Drag.Move(this.clone, {
			snap: this.options.snap,
			container: this.options.constrain && this.element.getParent(),
			droppables: this.getDroppables(),
			onSnap: function(){
				event.stop();
				this.clone.setStyle('visibility', 'visible');
				this.element.set('opacity', this.options.opacity || 0);
				this.fireEvent('start', [this.element, this.clone]);
			}.bind(this),
			onEnter: this.insert.bind(this),
			onCancel: this.reset.bind(this),
			onComplete: this.end.bind(this)
		});

		this.clone.inject(this.element, 'before');
		this.drag.start(event);
	},

	end: function(){
		this.drag.detach();
		this.element.set('opacity', this.opacity);
		if (this.effect){
			var dim = this.element.getStyles('width', 'height');
			var pos = this.clone.computePosition(this.element.getPosition(this.clone.offsetParent));
			this.effect.element = this.clone;
			this.effect.start({
				top: pos.top,
				left: pos.left,
				width: dim.width,
				height: dim.height,
				opacity: 0.25
			}).chain(this.reset.bind(this));
		} else {
			this.reset();
		}
	},

	reset: function(){
		this.idle = true;
		this.clone.destroy();
		this.fireEvent('complete', this.element);
	},

	serialize: function(){
		var params = Array.link(arguments, {modifier: Function.type, index: $defined});
		var serial = this.lists.map(function(list){
			return list.getChildren().map(params.modifier || function(element){
				return element.get('id');
			}, this);
		}, this);

		var index = params.index;
		if (this.lists.length == 1) index = 0;
		return $chk(index) && index >= 0 && index < this.lists.length ? serial[index] : serial;
	}

});


/*
---

script: Request.JSONP.js

description: Defines Request.JSONP, a class for cross domain javascript via script injection.

license: MIT-style license

authors:
- Aaron Newton
- Guillermo Rauch

requires:
- core:1.2.4/Element
- core:1.2.4/Request
- /Log

provides: [Request.JSONP]

...
*/

Request.JSONP = new Class({

	Implements: [Chain, Events, Options, Log],

	options: {/*
		onRetry: $empty(intRetries),
		onRequest: $empty(scriptElement),
		onComplete: $empty(data),
		onSuccess: $empty(data),
		onCancel: $empty(),
		log: false,
		*/
		url: '',
		data: {},
		retries: 0,
		timeout: 0,
		link: 'ignore',
		callbackKey: 'callback',
		injectScript: document.head
	},

	initialize: function(options){
		this.setOptions(options);
		if (this.options.log) this.enableLog();
		this.running = false;
		this.requests = 0;
		this.triesRemaining = [];
	},

	check: function(){
		if (!this.running) return true;
		switch (this.options.link){
			case 'cancel': this.cancel(); return true;
			case 'chain': this.chain(this.caller.bind(this, arguments)); return false;
		}
		return false;
	},

	send: function(options){
		if (!$chk(arguments[1]) && !this.check(options)) return this;

		var type = $type(options), 
				old = this.options, 
				index = $chk(arguments[1]) ? arguments[1] : this.requests++;
		if (type == 'string' || type == 'element') options = {data: options};

		options = $extend({data: old.data, url: old.url}, options);

		if (!$chk(this.triesRemaining[index])) this.triesRemaining[index] = this.options.retries;
		var remaining = this.triesRemaining[index];

		(function(){
			var script = this.getScript(options);
			this.log('JSONP retrieving script with url: ' + script.get('src'));
			this.fireEvent('request', script);
			this.running = true;

			(function(){
				if (remaining){
					this.triesRemaining[index] = remaining - 1;
					if (script){
						script.destroy();
						this.send(options, index).fireEvent('retry', this.triesRemaining[index]);
					}
				} else if(script && this.options.timeout){
					script.destroy();
					this.cancel().fireEvent('failure');
				}
			}).delay(this.options.timeout, this);
		}).delay(Browser.Engine.trident ? 50 : 0, this);
		return this;
	},

	cancel: function(){
		if (!this.running) return this;
		this.running = false;
		this.fireEvent('cancel');
		return this;
	},

	getScript: function(options){
		var index = Request.JSONP.counter,
				data;
		Request.JSONP.counter++;

		switch ($type(options.data)){
			case 'element': data = document.id(options.data).toQueryString(); break;
			case 'object': case 'hash': data = Hash.toQueryString(options.data);
		}

		var src = options.url + 
			 (options.url.test('\\?') ? '&' :'?') + 
			 (options.callbackKey || this.options.callbackKey) + 
			 '=Request.JSONP.request_map.request_'+ index + 
			 (data ? '&' + data : '');
		if (src.length > 2083) this.log('JSONP '+ src +' will fail in Internet Explorer, which enforces a 2083 bytes length limit on URIs');

		var script = new Element('script', {type: 'text/javascript', src: src});
		Request.JSONP.request_map['request_' + index] = function(){ this.success(arguments, script); }.bind(this);
		return script.inject(this.options.injectScript);
	},

	success: function(args, script){
		if (script) script.destroy();
		this.running = false;
		this.log('JSONP successfully retrieved: ', args);
		this.fireEvent('complete', args).fireEvent('success', args).callChain();
	}

});

Request.JSONP.counter = 0;
Request.JSONP.request_map = {};

/*
---

script: Request.Periodical.js

description: Requests the same URL to pull data from a server but increases the intervals if no data is returned to reduce the load

license: MIT-style license

authors:
- Christoph Pojer

requires:
- core:1.2.4/Request
- /MooTools.More

provides: [Request.Periodical]

...
*/

Request.implement({

	options: {
		initialDelay: 5000,
		delay: 5000,
		limit: 60000
	},

	startTimer: function(data){
		var fn = function(){
			if (!this.running) this.send({data: data});
		};
		this.timer = fn.delay(this.options.initialDelay, this);
		this.lastDelay = this.options.initialDelay;
		this.completeCheck = function(response){
			$clear(this.timer);
			this.lastDelay = (response) ? this.options.delay : (this.lastDelay + this.options.delay).min(this.options.limit);
			this.timer = fn.delay(this.lastDelay, this);
		};
		return this.addEvent('complete', this.completeCheck);
	},

	stopTimer: function(){
		$clear(this.timer);
		return this.removeEvent('complete', this.completeCheck);
	}

});

/*
---

script: Keyboard.js

description: KeyboardEvents used to intercept events on a class for keyboard and format modifiers in a specific order so as to make alt+shift+c the same as shift+alt+c.

license: MIT-style license

authors:
- Perrin Westrich
- Aaron Newton
- Scott Kyle

requires:
- core:1.2.4/Events
- core:1.2.4/Options
- core:1.2.4/Element.Event
- /Log

provides: [Keyboard]

...
*/

(function(){
	
	var Keyboard = this.Keyboard = new Class({

		Extends: Events,

		Implements: [Options, Log],

		options: {
			/*
			onActivate: $empty,
			onDeactivate: $empty,
			*/
			defaultEventType: 'keydown',
			active: false,
			events: {},
			nonParsedEvents: ['activate', 'deactivate', 'onactivate', 'ondeactivate', 'changed', 'onchanged']
		},

		initialize: function(options){
			this.setOptions(options);
			this.setup();
		}, 
		setup: function(){
			this.addEvents(this.options.events);
			//if this is the root manager, nothing manages it
			if (Keyboard.manager && !this.manager) Keyboard.manager.manage(this);
			if (this.options.active) this.activate();
		},

		handle: function(event, type){
			//Keyboard.stop(event) prevents key propagation
			if (event.preventKeyboardPropagation) return;
			
			var bubbles = !!this.manager;
			if (bubbles && this.activeKB){
				this.activeKB.handle(event, type);
				if (event.preventKeyboardPropagation) return;
			}
			this.fireEvent(type, event);
			
			if (!bubbles && this.activeKB) this.activeKB.handle(event, type);
		},

		addEvent: function(type, fn, internal){
			return this.parent(Keyboard.parse(type, this.options.defaultEventType, this.options.nonParsedEvents), fn, internal);
		},

		removeEvent: function(type, fn){
			return this.parent(Keyboard.parse(type, this.options.defaultEventType, this.options.nonParsedEvents), fn);
		},

		toggleActive: function(){
			return this[this.active ? 'deactivate' : 'activate']();
		},

		activate: function(instance){
			if (instance) {
				//if we're stealing focus, store the last keyboard to have it so the relenquish command works
				if (instance != this.activeKB) this.previous = this.activeKB;
				//if we're enabling a child, assign it so that events are now passed to it
				this.activeKB = instance.fireEvent('activate');
				Keyboard.manager.fireEvent('changed');
			} else if (this.manager) {
				//else we're enabling ourselves, we must ask our parent to do it for us
				this.manager.activate(this);
			}
			return this;
		},

		deactivate: function(instance){
			if (instance) {
				if(instance === this.activeKB) {
					this.activeKB = null;
					instance.fireEvent('deactivate');
					Keyboard.manager.fireEvent('changed');
				}
			}
			else if (this.manager) {
				this.manager.deactivate(this);
			}
			return this;
		},

		relenquish: function(){
			if (this.previous) this.activate(this.previous);
		},

		//management logic
		manage: function(instance){
			if (instance.manager) instance.manager.drop(instance);
			this.instances.push(instance);
			instance.manager = this;
			if (!this.activeKB) this.activate(instance);
			else this._disable(instance);
		},

		_disable: function(instance){
			if (this.activeKB == instance) this.activeKB = null;
		},

		drop: function(instance){
			this._disable(instance);
			this.instances.erase(instance);
		},

		instances: [],

		trace: function(){
			Keyboard.trace(this);
		},

		each: function(fn){
			Keyboard.each(this, fn);
		}

	});
	
	var parsed = {};
	var modifiers = ['shift', 'control', 'alt', 'meta'];
	var regex = /^(?:shift|control|ctrl|alt|meta)$/;
	
	Keyboard.parse = function(type, eventType, ignore){
		if (ignore && ignore.contains(type.toLowerCase())) return type;
		
		type = type.toLowerCase().replace(/^(keyup|keydown):/, function($0, $1){
			eventType = $1;
			return '';
		});

		if (!parsed[type]){
			var key, mods = {};
			type.split('+').each(function(part){
				if (regex.test(part)) mods[part] = true;
				else key = part;
			});

			mods.control = mods.control || mods.ctrl; // allow both control and ctrl
			
			var keys = [];
			modifiers.each(function(mod){
				if (mods[mod]) keys.push(mod);
			});
			
			if (key) keys.push(key);
			parsed[type] = keys.join('+');
		}

		return eventType + ':' + parsed[type];
	};

	Keyboard.each = function(keyboard, fn){
		var current = keyboard || Keyboard.manager;
		while (current){
			fn.run(current);
			current = current.activeKB;
		}
	};

	Keyboard.stop = function(event){
		event.preventKeyboardPropagation = true;
	};

	Keyboard.manager = new Keyboard({
		active: true
	});
	
	Keyboard.trace = function(keyboard){
		keyboard = keyboard || Keyboard.manager;
		keyboard.enableLog();
		keyboard.log('the following items have focus: ');
		Keyboard.each(keyboard, function(current){
			keyboard.log(document.id(current.widget) || current.wiget || current);
		});
	};
	
	var handler = function(event){
		var keys = [];
		modifiers.each(function(mod){
			if (event[mod]) keys.push(mod);
		});
		
		if (!regex.test(event.key)) keys.push(event.key);
		Keyboard.manager.handle(event, event.type + ':' + keys.join('+'));
	};
	
	document.addEvents({
		'keyup': handler,
		'keydown': handler
	});

	Event.Keys.extend({
		'shift': 16,
		'control': 17,
		'alt': 18,
		'capslock': 20,
		'pageup': 33,
		'pagedown': 34,
		'end': 35,
		'home': 36,
		'numlock': 144,
		'scrolllock': 145,
		';': 186,
		'=': 187,
		',': 188,
		'-': Browser.Engine.Gecko ? 109 : 189,
		'.': 190,
		'/': 191,
		'`': 192,
		'[': 219,
		'\\': 220,
		']': 221,
		"'": 222
	});

})();


/*
---

script: Keyboard.js

description: Enhances Keyboard by adding the ability to name and describe keyboard shortcuts, and the ability to grab shortcuts by name and bind the shortcut to different keys.

license: MIT-style license

authors:
- Perrin Westrich

requires:
- core:1.2.4/Function
- /Keyboard.Extras

provides: [Keyboard.Extras]

...
*/
Keyboard.prototype.options.nonParsedEvents.combine(['rebound', 'onrebound']);

Keyboard.implement({

	/*
		shortcut should be in the format of:
		{
			'keys': 'shift+s', // the default to add as an event.
			'description': 'blah blah blah', // a brief description of the functionality.
			'handler': function(){} // the event handler to run when keys are pressed.
		}
	*/
	addShortcut: function(name, shortcut) {
		this.shortcuts = this.shortcuts || [];
		this.shortcutIndex = this.shortcutIndex || {};
		
		shortcut.getKeyboard = $lambda(this);
		shortcut.name = name;
		this.shortcutIndex[name] = shortcut;
		this.shortcuts.push(shortcut);
		if(shortcut.keys) this.addEvent(shortcut.keys, shortcut.handler);
		return this;
	},

	addShortcuts: function(obj){
		for(var name in obj) this.addShortcut(name, obj[name]);
		return this;
	},

	getShortcuts: function(){
		return this.shortcuts || [];
	},

	getShortcut: function(name){
		return (this.shortcutIndex || {})[name];
	}

});

Keyboard.rebind = function(newKeys, shortcuts){
	$splat(shortcuts).each(function(shortcut){
		shortcut.getKeyboard().removeEvent(shortcut.keys, shortcut.handler);
		shortcut.getKeyboard().addEvent(newKeys, shortcut.handler);
		shortcut.keys = newKeys;
		shortcut.getKeyboard().fireEvent('rebound');
	});
};


Keyboard.getActiveShortcuts = function(keyboard) {
	var activeKBS = [], activeSCS = [];
	Keyboard.each(keyboard, [].push.bind(activeKBS));
	activeKBS.each(function(kb){ activeSCS.extend(kb.getShortcuts()); });
	return activeSCS;
};

Keyboard.getShortcut = function(name, keyboard, opts){
	opts = opts || {};
	var shortcuts = opts.many ? [] : null,
		set = opts.many ? function(kb){
				var shortcut = kb.getShortcut(name);
				if(shortcut) shortcuts.push(shortcut);
			} : function(kb) { 
				if(!shortcuts) shortcuts = kb.getShortcut(name);
			};
	Keyboard.each(keyboard, set);
	return shortcuts;
};

Keyboard.getShortcuts = function(name, keyboard) {
	return Keyboard.getShortcut(name, keyboard, { many: true });
};


/*
---

script: Tips.js

description: Class for creating nice tips that follow the mouse cursor when hovering an element.

license: MIT-style license

authors:
- Valerio Proietti
- Christoph Pojer

requires:
- core:1.2.4/Options
- core:1.2.4/Events
- core:1.2.4/Element.Event
- core:1.2.4/Element.Style
- core:1.2.4/Element.Dimensions
- /MooTools.More

provides: [Tips]

...
*/

(function(){

var read = function(option, element){
	return (option) ? ($type(option) == 'function' ? option(element) : element.get(option)) : '';
};

this.Tips = new Class({

	Implements: [Events, Options],

	options: {
		/*
		onAttach: $empty(element),
		onDetach: $empty(element),
		*/
		onShow: function(){
			this.tip.setStyle('display', 'block');
		},
		onHide: function(){
			this.tip.setStyle('display', 'none');
		},
		title: 'title',
		text: function(element){
			return element.get('rel') || element.get('href');
		},
		showDelay: 100,
		hideDelay: 100,
		className: 'tip-wrap',
		offset: {x: 16, y: 16},
		windowPadding: {x:0, y:0},
		fixed: false
	},

	initialize: function(){
		var params = Array.link(arguments, {options: Object.type, elements: $defined});
		this.setOptions(params.options);
		if (params.elements) this.attach(params.elements);
		this.container = new Element('div', {'class': 'tip'});
	},

	toElement: function(){
		if (this.tip) return this.tip;

		return this.tip = new Element('div', {
			'class': this.options.className,
			styles: {
				position: 'absolute',
				top: 0,
				left: 0
			}
		}).adopt(
			new Element('div', {'class': 'tip-top'}),
			this.container,
			new Element('div', {'class': 'tip-bottom'})
		).inject(document.body);
	},

	attach: function(elements){
		$$(elements).each(function(element){
			var title = read(this.options.title, element),
				text = read(this.options.text, element);
			
			element.erase('title').store('tip:native', title).retrieve('tip:title', title);
			element.retrieve('tip:text', text);
			this.fireEvent('attach', [element]);
			
			var events = ['enter', 'leave'];
			if (!this.options.fixed) events.push('move');
			
			events.each(function(value){
				var event = element.retrieve('tip:' + value);
				if (!event) event = this['element' + value.capitalize()].bindWithEvent(this, element);
				
				element.store('tip:' + value, event).addEvent('mouse' + value, event);
			}, this);
		}, this);
		
		return this;
	},

	detach: function(elements){
		$$(elements).each(function(element){
			['enter', 'leave', 'move'].each(function(value){
				element.removeEvent('mouse' + value, element.retrieve('tip:' + value)).eliminate('tip:' + value);
			});
			
			this.fireEvent('detach', [element]);
			
			if (this.options.title == 'title'){ // This is necessary to check if we can revert the title
				var original = element.retrieve('tip:native');
				if (original) element.set('title', original);
			}
		}, this);
		
		return this;
	},

	elementEnter: function(event, element){
		this.container.empty();
		
		['title', 'text'].each(function(value){
			var content = element.retrieve('tip:' + value);
			if (content) this.fill(new Element('div', {'class': 'tip-' + value}).inject(this.container), content);
		}, this);
		
		$clear(this.timer);
		this.timer = (function(){
			this.show(this, element);
			this.position((this.options.fixed) ? {page: element.getPosition()} : event);
		}).delay(this.options.showDelay, this);
	},

	elementLeave: function(event, element){
		$clear(this.timer);
		this.timer = this.hide.delay(this.options.hideDelay, this, element);
		this.fireForParent(event, element);
	},

	fireForParent: function(event, element){
		element = element.getParent();
		if (!element || element == document.body) return;
		if (element.retrieve('tip:enter')) element.fireEvent('mouseenter', event);
		else this.fireForParent(event, element);
	},

	elementMove: function(event, element){
		this.position(event);
	},

	position: function(event){
		if (!this.tip) document.id(this);

		var size = window.getSize(), scroll = window.getScroll(),
			tip = {x: this.tip.offsetWidth, y: this.tip.offsetHeight},
			props = {x: 'left', y: 'top'},
			obj = {};
		
		for (var z in props){
			obj[props[z]] = event.page[z] + this.options.offset[z];
			if ((obj[props[z]] + tip[z] - scroll[z]) > size[z] - this.options.windowPadding[z]) obj[props[z]] = event.page[z] - this.options.offset[z] - tip[z];
		}
		
		this.tip.setStyles(obj);
	},

	fill: function(element, contents){
		if(typeof contents == 'string') element.set('html', contents);
		else element.adopt(contents);
	},

	show: function(element){
		if (!this.tip) document.id(this);
		this.fireEvent('show', [this.tip, element]);
	},

	hide: function(element){
		if (!this.tip) document.id(this);
		this.fireEvent('hide', [this.tip, element]);
	}

});

})();

/*
---

script: Date.English.US.js

description: Date messages for US English.

license: MIT-style license

authors:
- Aaron Newton

requires:
- /Lang
- /Date

provides: [Date.English.US]

...
*/

MooTools.lang.set('en-US', 'Date', {

	months: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
	days: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
	//culture's date order: MM/DD/YYYY
	dateOrder: ['month', 'date', 'year'],
	shortDate: '%m/%d/%Y',
	shortTime: '%I:%M%p',
	AM: 'AM',
	PM: 'PM',

	/* Date.Extras */
	ordinal: function(dayOfMonth){
		//1st, 2nd, 3rd, etc.
		return (dayOfMonth > 3 && dayOfMonth < 21) ? 'th' : ['th', 'st', 'nd', 'rd', 'th'][Math.min(dayOfMonth % 10, 4)];
	},

	lessThanMinuteAgo: 'less than a minute ago',
	minuteAgo: 'about a minute ago',
	minutesAgo: '{delta} minutes ago',
	hourAgo: 'about an hour ago',
	hoursAgo: 'about {delta} hours ago',
	dayAgo: '1 day ago',
	daysAgo: '{delta} days ago',
	weekAgo: '1 week ago',
	weeksAgo: '{delta} weeks ago',
	monthAgo: '1 month ago',
	monthsAgo: '{delta} months ago',
	yearAgo: '1 year ago',
	yearsAgo: '{delta} years ago',
	lessThanMinuteUntil: 'less than a minute from now',
	minuteUntil: 'about a minute from now',
	minutesUntil: '{delta} minutes from now',
	hourUntil: 'about an hour from now',
	hoursUntil: 'about {delta} hours from now',
	dayUntil: '1 day from now',
	daysUntil: '{delta} days from now',
	weekUntil: '1 week from now',
	weeksUntil: '{delta} weeks from now',
	monthUntil: '1 month from now',
	monthsUntil: '{delta} months from now',
	yearUntil: '1 year from now',
	yearsUntil: '{delta} years from now'

});


/*
---

script: Form.Validator.English.js

description: Form Validator messages for English.

license: MIT-style license

authors:
- Aaron Newton

requires:
- /Lang
- /Form.Validator

provides: [Form.Validator.English]

...
*/

MooTools.lang.set('en-US', 'Form.Validator', {

	required:'This field is required.',
	minLength:'Please enter at least {minLength} characters (you entered {length} characters).',
	maxLength:'Please enter no more than {maxLength} characters (you entered {length} characters).',
	integer:'Please enter an integer in this field. Numbers with decimals (e.g. 1.25) are not permitted.',
	numeric:'Please enter only numeric values in this field (i.e. "1" or "1.1" or "-1" or "-1.1").',
	digits:'Please use numbers and punctuation only in this field (for example, a phone number with dashes or dots is permitted).',
	alpha:'Please use letters only (a-z) with in this field. No spaces or other characters are allowed.',
	alphanum:'Please use only letters (a-z) or numbers (0-9) only in this field. No spaces or other characters are allowed.',
	dateSuchAs:'Please enter a valid date such as {date}',
	dateInFormatMDY:'Please enter a valid date such as MM/DD/YYYY (i.e. "12/31/1999")',
	email:'Please enter a valid email address. For example "fred@domain.com".',
	url:'Please enter a valid URL such as http://www.google.com.',
	currencyDollar:'Please enter a valid $ amount. For example $100.00 .',
	oneRequired:'Please enter something for at least one of these inputs.',
	errorPrefix: 'Error: ',
	warningPrefix: 'Warning: ',

	//Form.Validator.Extras

	noSpace: 'There can be no spaces in this input.',
	reqChkByNode: 'No items are selected.',
	requiredChk: 'This field is required.',
	reqChkByName: 'Please select a {label}.',
	match: 'This field needs to match the {matchName} field',
	startDate: 'the start date',
	endDate: 'the end date',
	currendDate: 'the current date',
	afterDate: 'The date should be the same or after {label}.',
	beforeDate: 'The date should be the same or before {label}.',
	startMonth: 'Please select a start month',
	sameMonth: 'These two dates must be in the same month - you must change one or the other.',
	creditcard: 'The credit card number entered is invalid. Please check the number and try again. {length} digits entered.'

});

if(!this.console)
  this.console = {
    log: function () {}
  };


/**
 * da
 *
 * The root namespace. Shorthand for '[Daaw](http://en.wikipedia.org/wiki/Lake_Tahoe#Native_people)'.
 *
 **/
if(typeof da === "undefined")
  this.da = {};

/**
 * da.vendor
 *
 * Interfce to 3rd party libraries.
 *
 **/

if(!da.vendor)
  da.vendor = {};


(function () {
/**
 *  class da.vendor.Persist
 *  
 *  Persist.JS
 *
 *  #### Links
 *  * [PersistJS project page](http://google.com)
 **/
 
// tiny hack which allows us to use
// index_devel.html
if(typeof Persist === "undefined") {
  var Persist;
//
// Copyright (c) 2008, 2009 Paul Duncan (paul@pablotron.org)
// 
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
// 
// The above copyright notice and this permission notice shall be included in
// all copies or substantial portions of the Software.
// 
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
// THE SOFTWARE.
//


/* 
 * The contents of gears_init.js; we need this because Chrome supports
 * Gears out of the box, but still requires this constructor.  Note that
 * if you include gears_init.js then this function does nothing.
 */
/*
(function() {
  // We are already defined. Hooray!
  if (window.google && google.gears)
    return;

  // factory 
  var F = null;

  // Firefox
  if (typeof GearsFactory != 'undefined') {
    F = new GearsFactory();
  } else {
    // IE
    try {
      F = new ActiveXObject('Gears.Factory');
      // privateSetGlobalObject is only required and supported on WinCE.
      if (F.getBuildInfo().indexOf('ie_mobile') != -1)
        F.privateSetGlobalObject(this);
    } catch (e) {
      // Safari
      if ((typeof navigator.mimeTypes != 'undefined')
           && navigator.mimeTypes["application/x-googlegears"]) {
        F = document.createElement("object");
        F.style.display = "none";
        F.width = 0;
        F.height = 0;
        F.type = "application/x-googlegears";
        document.documentElement.appendChild(F);
      }
    }
  }

  // *Do not* define any objects if Gears is not installed. This mimics the
  // behavior of Gears defining the objects in the future.
  if (!F)
    return;

  // Now set up the objects, being careful not to overwrite anything.
  //
  // Note: In Internet Explorer for Windows Mobile, you can't add properties to
  // the window object. However, global objects are automatically added as
  // properties of the window object in all browsers.
  if (!window.google)
    google = {};

  if (!google.gears)
    google.gears = {factory: F};
})(); */

/**
 * Persist - top-level namespace for Persist library.
 * @namespace
 */
Persist = (function() {
  var VERSION = '0.2.0', P, B, esc, init, empty, ec = {enabled: false};

  // easycookie 0.2.1 (pre-minified)
  // (see http://pablotron.org/software/easy_cookie/)
  /*ec = (function(){var EPOCH='Thu, 01-Jan-1970 00:00:01 GMT',RATIO=1000*60*60*24,KEYS=['expires','path','domain'],esc=escape,un=unescape,doc=document,me;var get_now=function(){var r=new Date();r.setTime(r.getTime());return r;}
var cookify=function(c_key,c_val){var i,key,val,r=[],opt=(arguments.length>2)?arguments[2]:{};r.push(esc(c_key)+'='+esc(c_val));for(i=0;i<KEYS.length;i++){key=KEYS[i];if(val=opt[key])
r.push(key+'='+val);}
if(opt.secure)
r.push('secure');return r.join('; ');}
var alive=function(){var k='__EC_TEST__',v=new Date();v=v.toGMTString();this.set(k,v);this.enabled=(this.remove(k)==v);return this.enabled;}
me={set:function(key,val){var opt=(arguments.length>2)?arguments[2]:{},now=get_now(),expire_at,cfg={};if(opt.expires){opt.expires*=RATIO;cfg.expires=new Date(now.getTime()+opt.expires);cfg.expires=cfg.expires.toGMTString();}
var keys=['path','domain','secure'];for(i=0;i<keys.length;i++)
if(opt[keys[i]])
cfg[keys[i]]=opt[keys[i]];var r=cookify(key,val,cfg);doc.cookie=r;return val;},has:function(key){key=esc(key);var c=doc.cookie,ofs=c.indexOf(key+'='),len=ofs+key.length+1,sub=c.substring(0,key.length);return((!ofs&&key!=sub)||ofs<0)?false:true;},get:function(key){key=esc(key);var c=doc.cookie,ofs=c.indexOf(key+'='),len=ofs+key.length+1,sub=c.substring(0,key.length),end;if((!ofs&&key!=sub)||ofs<0)
return null;end=c.indexOf(';',len);if(end<0)
end=c.length;return un(c.substring(len,end));},remove:function(k){var r=me.get(k),opt={expires:EPOCH};doc.cookie=cookify(k,'',opt);return r;},keys:function(){var c=doc.cookie,ps=c.split('; '),i,p,r=[];for(i=0;i<ps.length;i++){p=ps[i].split('=');r.push(un(p[0]));}
return r;},all:function(){var c=doc.cookie,ps=c.split('; '),i,p,r=[];for(i=0;i<ps.length;i++){p=ps[i].split('=');r.push([un(p[0]),un(p[1])]);}
return r;},version:'0.2.1',enabled:false};me.enabled=alive.call(me);return me;}()); */

  // wrapper for Array.prototype.indexOf, since IE doesn't have it
  var index_of = (function() {
    if (Array.prototype.indexOf)
      return function(ary, val) { 
        return Array.prototype.indexOf.call(ary, val);
      };
    else
      return function(ary, val) {
        var i, l;

        for (i = 0, l = ary.length; i < l; i++)
          if (ary[i] == val)
            return i;

        return -1;
      };
  })();


  // empty function
  empty = function() { };

  /**
   * Escape spaces and underscores in name.  Used to generate a "safe"
   * key from a name.
   *
   * @private
   */
  esc = function(str) {
    return 'PS' + str.replace(/_/g, '__').replace(/ /g, '_s');
  };

  C = {
    /* 
     * Backend search order.
     * 
     * Note that the search order is significant; the backends are
     * listed in order of capacity, and many browsers
     * support multiple backends, so changing the search order could
     * result in a browser choosing a less capable backend.
     */ 
    search_order: [
      // TODO: air
      'localstorage',
      'whatwg_db', 
      'globalstorage', 
      'gears',
      'ie', 
      'flash',
      'cookie'
    ],

    // valid name regular expression
    name_re: /^[a-z][a-z0-9_ -]+$/i,

    // list of backend methods
    methods: [
      'init', 
      'get', 
      'set', 
      'remove', 
      'load', 
      'save'
      // TODO: clear method?
    ],

    // sql for db backends (gears and db)
    sql: {
      version:  '1', // db schema version

      // XXX: the "IF NOT EXISTS" is a sqlite-ism; fortunately all the 
      // known DB implementations (safari and gears) use sqlite
      create:   "CREATE TABLE IF NOT EXISTS persist_data (k TEXT UNIQUE NOT NULL PRIMARY KEY, v TEXT NOT NULL)",
      get:      "SELECT v FROM persist_data WHERE k = ?",
      set:      "INSERT INTO persist_data(k, v) VALUES (?, ?)",
      remove:   "DELETE FROM persist_data WHERE k = ?" 
    },

    // default flash configuration
    flash: {
      // ID of wrapper element
      div_id:   '_persist_flash_wrap',

      // id of flash object/embed
      id:       '_persist_flash',

      // default path to flash object
      path: 'persist.swf',
      size: { w:1, h:1 },

      // arguments passed to flash object
      args: {
        autostart: true
      }
    } 
  };

  // built-in backends
  B = {
    // gears db backend
    // (src: http://code.google.com/apis/gears/api_database.html)
    gears: {
      // no known limit
      size:   -1,

      test: function() {
        // test for gears
        return (window.google && window.google.gears) ? true : false;
      },

      methods: {
        transaction: function(fn) {
          var db = this.db;

          // begin transaction
          db.execute('BEGIN').close();

          // call callback fn
          fn.call(this, db);

          // commit changes
          db.execute('COMMIT').close();
        },

        init: function() {
          var db;

          // create database handle (TODO: add schema version?)
          db = this.db = google.gears.factory.create('beta.database');

          // open database
          // from gears ref:
          //
          // Currently the name, if supplied and of length greater than
          // zero, must consist only of visible ASCII characters
          // excluding the following characters:
          //
          //   / \ : * ? " < > | ; ,
          //
          // (this constraint is enforced in the Store constructor)
          db.open(esc(this.name));

          // create table
          db.execute(C.sql.create).close();
        },

        get: function(key, fn, scope) {
          var r, sql = C.sql.get;

          // if callback isn't defined, then return
          if (!fn)
            return;

          // begin transaction
          this.transaction(function (t) {
            var is_valid, val;
            // exec query
            r = t.execute(sql, [key]);

            // check result and get value
            is_valid = r.isValidRow();
            val = is_valid ? r.field(0) : null;

            // close result set
            r.close();

            // call callback
            fn.call(scope || this, is_valid, val);
          });
        },

        set: function(key, val, fn, scope) {
          var rm_sql = C.sql.remove,
              sql    = C.sql.set, r;

          // begin set transaction
          this.transaction(function(t) {
            // exec remove query
            t.execute(rm_sql, [key]).close();

            // exec set query
            t.execute(sql, [key, val]).close();
            
            // run callback (TODO: get old value)
            if (fn)
              fn.call(scope || this, true, val);
          });
        },

        remove: function(key, fn, scope) {
          var get_sql = C.sql.get;
              sql = C.sql.remove,
              r, val = null, is_valid = false;

          // begin remove transaction
          this.transaction(function(t) {
            // if a callback was defined, then get the old
            // value before removing it
            if (fn) {
              // exec get query
              r = t.execute(get_sql, [key]);

              // check validity and get value
              is_valid = r.isValidRow();
              val = is_valid ? r.field(0) : null;

              // close result set
              r.close();
            }

            // exec remove query if no callback was defined, or if a
            // callback was defined and there was an existing value
            if (!fn || is_valid) {
              // exec remove query
              t.execute(sql, [key]).close();
            }

            // exec callback
            if (fn)
              fn.call(scope || this, is_valid, val);
          });
        } 
      }
    }, 

    // whatwg db backend (webkit, Safari 3.1+)
    // (src: whatwg and http://webkit.org/misc/DatabaseExample.html)
    whatwg_db: {
      // size based on DatabaseExample from above (should I increase
      // this?)
      size:   200 * 1024,

      test: function() {
        var name = 'PersistJS Test', 
            desc = 'Persistent database test.';

        // test for openDatabase
        if (typeof openDatabase !== "function")
          return false;

        // make sure openDatabase works
        // XXX: will this leak a db handle and/or waste space?
        if (!openDatabase(name, C.sql.version, desc, B.whatwg_db.size))
          return false;

        // return true
        return true;
      },

      methods: {
        transaction: function(fn) {
          // lazy create database table;
          // this is done here because there is no way to
          // prevent a race condition if the table is created in init()
          if (!this.db_created) {
            this.db.transaction(function(t) {
              // create table
              t.executeSql(C.sql.create, [], function() {
                this.db_created = true;
              });
            }, empty); // trap exception
          } 

          // execute transaction
          this.db.transaction(fn);
        },

        init: function() {
          // create database handle
          this.db = openDatabase(
            this.name, 
            C.sql.version, 
            this.o.about || ("Persistent storage for " + this.name),
            this.o.size || B.whatwg_db.size 
          );
        },

        get: function(key, fn, scope) {
          var sql = C.sql.get;

          // if callback isn't defined, then return
          if (!fn)
            return;

          // get callback scope
          scope = scope || this;

          // begin transaction
          this.transaction(function (t) {
            t.executeSql(sql, [key], function(t, r) {
              if (r.rows.length > 0)
                fn.call(scope, true, r.rows.item(0)['v']);
              else
                fn.call(scope, false, null);
            });
          });
        },

        set: function(key, val, fn, scope) {
          var rm_sql = C.sql.remove,
              sql    = C.sql.set;

          // begin set transaction
          this.transaction(function(t) {
            // exec remove query
            t.executeSql(rm_sql, [key], function() {
              // exec set query
              t.executeSql(sql, [key, val], function(t, r) {
                // run callback
                if (fn)
                  fn.call(scope || this, true, val);
              });
            });
          });

          return val;
        },

        // begin remove transaction
        remove: function(key, fn, scope) {
          var get_sql = C.sql.get;
              sql = C.sql.remove;

          this.transaction(function(t) {
            // if a callback was defined, then get the old
            // value before removing it
            if (fn) {
              // exec get query
              t.executeSql(get_sql, [key], function(t, r) {
                if (r.rows.length > 0) {
                  // key exists, get value 
                  var val = r.rows.item(0)['v'];

                  // exec remove query
                  t.executeSql(sql, [key], function(t, r) {
                    // exec callback
                    fn.call(scope || this, true, val);
                  });
                } else {
                  // key does not exist, exec callback
                  fn.call(scope || this, false, null);
                }
              });
            } else {
              // no callback was defined, so just remove the
              // data without checking the old value

              // exec remove query
              t.executeSql(sql, [key]);
            }
          });
        } 
      }
    }, 
    
    // globalstorage backend (globalStorage, FF2+, IE8+)
    // (src: http://developer.mozilla.org/en/docs/DOM:Storage#globalStorage)
    // https://developer.mozilla.org/En/DOM/Storage
    //
    // TODO: test to see if IE8 uses object literal semantics or
    // getItem/setItem/removeItem semantics
    globalstorage: {
      // (5 meg limit, src: http://ejohn.org/blog/dom-storage-answers/)
      size: 5 * 1024 * 1024,

      test: function() {
        return typeof globalStorage !== "undefined";
      },

      methods: {
        key: function(key) {
          return esc(this.name) + esc(key);
        },

        init: function() {
          alert('domain = ' + this.o.domain);
          this.store = globalStorage[this.o.domain];
        },

        get: function(key, fn, scope) {
          // expand key
          key = this.key(key);

          if (fn)
            fn.call(scope || this, true, this.store.getItem(key));
        },

        set: function(key, val, fn, scope) {
          // expand key
          key = this.key(key);

          // set value
          this.store.setItem(key, val);

          if (fn)
            fn.call(scope || this, true, val);
        },

        remove: function(key, fn, scope) {
          var val;

          // expand key
          key = this.key(key);

          // get value
          val = this.store[key];

          // delete value
          this.store.removeItem(key);

          if (fn)
            fn.call(scope || this, (val !== null), val);
        } 
      }
    }, 
    
    // localstorage backend (globalStorage, FF2+, IE8+)
    // (src: http://www.whatwg.org/specs/web-apps/current-work/#the-localstorage)
    // also http://msdn.microsoft.com/en-us/library/cc197062(VS.85).aspx#_global
    localstorage: {
      // (unknown?)
      // ie has the remainingSpace property, see:
      // http://msdn.microsoft.com/en-us/library/cc197016(VS.85).aspx
      size: -1,

      test: function() {
        return typeof localStorage !== "undefined";
      },

      methods: {
        key: function(key) {
          return esc(this.name) + esc(key);
        },

        init: function() {
          //this.store = localStorage;
        },

        get: function(key, fn, scope) {
          // expand key
          key = this.key(key);

          if (fn)
            fn.call(scope || this, true, localStorage.getItem(key));
        },

        set: function(key, val, fn, scope) {
          // expand key
          key = this.key(key);

          // set value
          localStorage.setItem(key, val);

          if (fn)
            fn.call(scope || this, true, val);
        },

        remove: function(key, fn, scope) {
          var val;

          // expand key
          key = this.key(key);

          // get value
          val = this.getItem(key);

          // delete value
          localStorage.removeItem(key);

          if (fn)
            fn.call(scope || this, (val !== null), val);
        } 
      }
    }, 
    
    // IE backend
    ie: {
      prefix:   '_persist_data-',
      // style:    'display:none; behavior:url(#default#userdata);',

      // 64k limit
      size:     64 * 1024,

      test: function() {
        // make sure we're dealing with IE
        // (src: http://javariet.dk/shared/browser_dom.htm)
        return window.ActiveXObject ? true : false;
      },

      make_userdata: function(id) {
        var el = document.createElement('div');

        // set element properties
        // http://msdn.microsoft.com/en-us/library/ms531424(VS.85).aspx 
        // http://www.webreference.com/js/column24/userdata.html
        el.id = id;
        el.style.display = 'none';
        el.addBehavior('#default#userdata');

        // append element to body
        document.body.appendChild(el);

        // return element
        return el;
      },

      methods: {
        init: function() {
          var id = B.ie.prefix + esc(this.name);

          // save element
          this.el = B.ie.make_userdata(id);

          // load data
          if (this.o.defer)
            this.load();
        },

        get: function(key, fn, scope) {
          var val;

          // expand key
          key = esc(key);

          // load data
          if (!this.o.defer)
            this.load();

          // get value
          val = this.el.getAttribute(key);

          // call fn
          if (fn)
            fn.call(scope || this, val ? true : false, val);
        },

        set: function(key, val, fn, scope) {
          // expand key
          key = esc(key);
          
          // set attribute
          this.el.setAttribute(key, val);

          // save data
          if (!this.o.defer)
            this.save();

          // call fn
          if (fn)
            fn.call(scope || this, true, val);
        },

        remove: function(key, fn, scope) {
          var val;

          // expand key
          key = esc(key);

          // load data
          if (!this.o.defer)
            this.load();

          // get old value and remove attribute
          val = this.el.getAttribute(key);
          this.el.removeAttribute(key);

          // save data
          if (!this.o.defer)
            this.save();

          // call fn
          if (fn)
            fn.call(scope || this, val ? true : false, val);
        },

        load: function() {
          this.el.load(esc(this.name));
        },

        save: function() {
          this.el.save(esc(this.name));
        }
      }
    },

    // cookie backend
    // uses easycookie: http://pablotron.org/software/easy_cookie/
    cookie: {
      delim: ':',

      // 4k limit (low-ball this limit to handle browser weirdness, and 
      // so we don't hose session cookies)
      size: 4000,

      test: function() {
        // XXX: use easycookie to test if cookies are enabled
        return P.Cookie.enabled ? true : false;
      },

      methods: {
        key: function(key) {
          return this.name + B.cookie.delim + key;
        },

        get: function(key, fn, scope) {
          var val;

          // expand key 
          key = this.key(key);

          // get value
          val = ec.get(key);

          // call fn
          if (fn)
            fn.call(scope || this, val != null, val);
        },

        set: function(key, val, fn, scope) {
          // expand key 
          key = this.key(key);

          // save value
          ec.set(key, val, this.o);

          // call fn
          if (fn)
            fn.call(scope || this, true, val);
        },

        remove: function(key, val, fn, scope) {
          var val;

          // expand key 
          key = this.key(key);

          // remove cookie
          val = ec.remove(key)

          // call fn
          if (fn)
            fn.call(scope || this, val != null, val);
        } 
      }
    },

    // flash backend (requires flash 8 or newer)
    // http://kb.adobe.com/selfservice/viewContent.do?externalId=tn_16194&sliceId=1
    // http://livedocs.adobe.com/flash/8/main/wwhelp/wwhimpl/common/html/wwhelp.htm?context=LiveDocs_Parts&file=00002200.html
    flash: {
      test: function() {
        if (!navigator.plugins || (!navigator.plugins["Shockwave Flash 2.0"] || !navigator.plugins["Shockwave Flash"]))
          return false;

        // get the major version
        var major = deconcept.SWFObjectUtil.getPlayerVersion().major;

        // check flash version (require 8.0 or newer)
        return (major >= 8) ? true : false;
      },

      methods: {
        init: function() {
          if (!B.flash.el) {
            var o, key, el, cfg = C.flash;

            // create wrapper element
            el = document.createElement('div');
            el.id = cfg.div_id;

            // FIXME: hide flash element
            // el.style.display = 'none';

            // append element to body
            document.body.appendChild(el);

            // create new swf object
            o = new deconcept.SWFObject(this.o.swf_path || cfg.path, cfg.id, cfg.size.w, cfg.size.h, '8');

            // set parameters
            for (key in cfg.args)
              o.addVariable(key, cfg.args[key]);

            // write flash object
            o.write(el);

            // save flash element
            B.flash.el = document.getElementById(cfg.id);
          }

          // use singleton flash element
          this.el = B.flash.el;
        },

        get: function(key, fn, scope) {
          var val;

          // escape key
          key = esc(key);

          // get value
          val = this.el.get(this.name, key);

          // call handler
          if (fn)
            fn.call(scope || this, val !== null, val);
        },

        set: function(key, val, fn, scope) {
          var old_val;

          // escape key
          key = esc(key);

          // set value
          old_val = this.el.set(this.name, key, val);

          // call handler
          if (fn)
            fn.call(scope || this, true, val);
        },

        remove: function(key, fn, scope) {
          var val;

          // get key
          key = esc(key);

          // remove old value
          val = this.el.remove(this.name, key);

          // call handler
          if (fn)
            fn.call(scope || this, true, val);
        }
      }
    }
  };

  /**
   * Test for available backends and pick the best one.
   * @private
   */
  var init = function() {
    var i, l, b, key, fns = C.methods, keys = C.search_order;

    // set all functions to the empty function
    for (i = 0, l = fns.length; i < l; i++) 
      P.Store.prototype[fns[i]] = empty;

    // clear type and size
    P.type = null;
    P.size = -1;

    // loop over all backends and test for each one
    for (i = 0, l = keys.length; !P.type && i < l; i++) {
      b = B[keys[i]];

      // test for backend
      //(postMessage||console.log)("testing backend " + keys[i]);
      if (b.test()) {
        // found backend, save type and size
        P.type = keys[i];
        P.size = b.size;

        // extend store prototype with backend methods
        for (key in b.methods)
          P.Store.prototype[key] = b.methods[key];
      }
    }

    // mark library as initialized
    P._init = true;
  };

  // create top-level namespace
  P = {
    // version of persist library
    VERSION: VERSION,

    // backend type and size limit
    type: null,
    size: 0,

    // XXX: expose init function?
    // init: init,

    add: function(o) {
      // add to backend hash
      B[o.id] = o;

      // add backend to front of search order
      C.search_order = [o.id].concat(C.search_order);

      // re-initialize library
      init();
    },

    remove: function(id) {
      var ofs = index_of(C.search_order, id);
      if (ofs < 0)
        return;

      // remove from search order
      C.search_order.splice(ofs, 1);

      // delete from lut
      delete B[id];

      // re-initialize library
      init();
    },

    // expose easycookie API
    Cookie: ec,

    // store API
    Store: function(name, o) {
      // verify name
      if (!C.name_re.exec(name))
        throw new Error("Invalid name");

      // XXX: should we lazy-load type?
      // if (!P._init)
      //   init();

      if (!P.type)
        throw new Error("No suitable storage found");

      o = o || {};
      this.name = name;

      // get domain (XXX: does this localdomain fix work?)
      o.domain = o.domain || location.host || 'localhost';
      
      // strip port from domain (XXX: will this break ipv6?)
      o.domain = o.domain.replace(/:\d+$/, '')

      // append localdomain to domains w/o '."
      // (see https://bugzilla.mozilla.org/show_bug.cgi?id=357323)
      // (file://localhost/ works, see: 
      // https://bugzilla.mozilla.org/show_bug.cgi?id=469192)
/* 
 *       if (!o.domain.match(/\./))
 *         o.domain += '.localdomain';
 */ 

      this.o = o;

      // expires in 2 years
      o.expires = o.expires || 365 * 2;

      // set path to root
      o.path = o.path || '/';

      // call init function
      this.init();
    } 
  };

  // init persist
  init();

  // return top-level namespace
  return P;
})();

  da.vendor.Persist = Persist;
} else
  da.vendor.Persist = window.Persist;

})();

/**
 *  == Database ==
 *  
 *  Map/Reduce, storage and model APIs.
 **/

/** section: Database
 * da.db
 **/
if(typeof da.db === "undefined")
  da.db = {};


(function () {
var Persist = da.vendor.Persist;

/** section: Database
 *  class da.db.PersistStorage
 *  
 *  Interface between PersistJS and BrowserCouch.
 **/
/*
 *  new da.db.PersistStorage(database_name)
 *  - database_name (String): name of the database.
 **/
function PersistStorage (db_name) {
  var storage = new Persist.Store(db_name || "tahoemp");
  
  /**
   *  da.db.PersistStorage#get(key, callback) -> undefined
   *  - key (String): name of the property
   *  - callback (Function): will be called once data is fetched,
   *    which will be passed as first argument.
   **/
  this.get = function (key, cb) {
    storage.get(key, function (ok, value) {
      cb(value ? JSON.parse(value) : null, ok);
    });
  };
  
  /**
   *  da.db.PersistStorage#put(key, value[, callback]) -> undefined
   *  - key (String): name of the property.
   *  - value (Object): value of the property.
   *  - callback (Function): will be called once data is saved.
   **/
  this.put = function (key, value, cb) {
    storage.set(key, JSON.stringify(value));
    if(cb) cb();
  };
  
  return this;
}

da.db.PersistStorage = PersistStorage;
})();


/* ***** BEGIN LICENSE BLOCK *****
 * Version: MPL 1.1/GPL 2.0/LGPL 2.1
 *
 * The contents of this file are subject to the Mozilla Public License Version
 * 1.1 (the "License"); you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at
 * http://www.mozilla.org/MPL/
 *
 * Software distributed under the License is distributed on an "AS IS" basis,
 * WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License
 * for the specific language governing rights and limitations under the
 * License.
 *
 * The Original Code is Ubiquity.
 *
 * The Initial Developer of the Original Code is Mozilla.
 * Portions created by the Initial Developer are Copyright (C) 2007
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
 *   Atul Varma <atul@gmozilla.com>
 *
 * Alternatively, the contents of this file may be used under the terms of
 * either the GNU General Public License Version 2 or later (the "GPL"), or
 * the GNU Lesser General Public License Version 2.1 or later (the "LGPL"),
 * in which case the provisions of the GPL or the LGPL are applicable instead
 * of those above. If you wish to allow use of your version of this file only
 * under the terms of either the GPL or the LGPL, and not to allow others to
 * use your version of this file under the terms of the MPL, indicate your
 * decision by deleting the provisions above and replace them with the notice
 * and other provisions required by the GPL or the LGPL. If you do not delete
 * the provisions above, a recipient may use your version of this file under
 * the terms of any one of the MPL, the GPL or the LGPL.
 *
 * ***** END LICENSE BLOCK ***** */

/*
 *  TODO: Update license block - we've done some changes:
 *    - optimised loops - faster map proccess
 *    - removed LocalStorage and FakeStorage - using PersistStorage instead
 *    - removed ModuleLoader - it's safe to assume JSON is available - speed optimisation
 *    - fixed mapping proccess - if no documents were emitted finish function wouldn't be called
 *    - added live views - map/reduce is only performed on updated documents
 */



(function () {

/** section: Database
 *  class da.db.BrowserCouch
 *
 *  Map/Reduce framework for browser.
 *
 *  #### MapReducer Implementations
 *  MapReducer is a generic interface for any map-reduce
 *  implementation. Any object implementing this interface will need
 *  to be able to work asynchronously, passing back control to the
 *  client at a given interval, so that the client has the ability to
 *  pause/cancel or report progress on the calculation if needed.
 **/
var BrowserCouch = {
  /**
   *  da.db.BrowserCouch.get(name, callback[, storage]) -> DB
   *  - name (String): name of the database.
   *  - callback (Function): called when database is initialized.
   *  - storage (Function): instance of storage class.
   *    Defaults to [[da.db.PersistStorage]].
   **/
  get: function BC_get(name, cb, storage) {
    if (!storage)
      storage = new da.db.PersistStorage(name);

    new DB({
      name: name,
      storage: storage,
      dict: new Dictionary(),
      onReady: cb
    });
  }
};

/**
 *  class da.db.BrowserCouch.Dictionary
 *
 *  Internal representation of the database.
 **/
/**
 *  new da.db.BrowserCouch.Dictionary([object])
 *  - object (Object): initial values
 **/
function Dictionary (object) {
  /**
   *  da.db.BrowserCouch.Dictionary#dict -> Object
   *  The dictionary itself.
   **/
  this.dict = {};
  /**
   *  da.db.BrowserCouch.Dictionary#keys -> Array
   *
   *  Use this property to determine the number of items
   *  in the dictionary.
   *
   *      (new Dictionary({h: 1, e: 1, l: 2, o: 1})).keys.length
   *      // => 4
   *
   **/
  this.keys = [];

  if(object)
    this.unpickle(object);

  return this;
}

Dictionary.prototype = {
  /**
   *  da.db.BrowserCouch.Dictionary#has(key) -> true | false
   **/
  has: function (key) {
    return (key in this.dict);
  },

  /*
  getKeys: function () {
    return this.keys;
  },

  get: function (key) {
    return this.dict[key];
  },
  */

  /**
   *  da.db.BrowserCouch.Dictionary#set(key, value) -> undefined
   **/
  set: function (key, value) {
    if(!(key in this.dict))
      this.keys.push(key);

    this.dict[key] = value;
  },

  /**
   *  da.db.BrowserCouch.Dictionary#setDocs(docs) -> undefined
   *  - docs ([Object, ...]): array of objects whose `id` property
   *  will be used as key.
   *
   *  Use this method whenever you have to add more then one
   *  item to the dictionary as it provides better perofrmance over
   *  calling [[da.db.BrowserCouch.Dictionary#set]] over and over.
   **/
  setDocs: function (docs) {
    var n = docs.length,
        newKeys = [];

    while(n--) {
      var doc = docs[n], id = doc.id;
      if(!(id in this.dict) && newKeys.indexOf(id) === -1)
        newKeys.push(id);

      this.dict[id] = doc;
    }

    this.keys = this.keys.concat(newKeys);
  },

  /**
   *  da.db.BrowserCouch.Dictionary#remove(key) -> undefined
   **/
  remove: function (key) {
    delete this.dict[key];

    var keys = this.keys,
        index = keys.indexOf(key),
        keysLength = keys.length;

    if(index === 0)
      return this.keys.shift();
    if(index === length - 1)
      return this.keys = keys.slice(0, -1);

    this.keys = keys.slice(0, index).concat(keys.slice(index + 1, keysLength));
  },

  /**
   *  da.db.BrowserCouch.Dictionary#clear() -> undefined
   **/
  clear: function () {
    this.dict = {};
    this.keys = [];
  },

  /**
   *  da.db.BrowserCouch.Dictionary#unpickle(object) -> undefined
   *  - object (Object): `object`'s properties will be replaced with current ones.
   **/
  unpickle: function (obj) {
    if(!obj)
      return;

    this.dict = obj;
    this._regenerateKeys();
  },

  _regenerateKeys: function () {
    var keys = [],
        dict = this.dict;

    for(var key in dict)
      keys.push(key);

    this.keys = keys;
  }
};

/** section: Database
 *  class DB
 *
 *  da.db.BrowserCouch database instance.
 **/
var DB = new Class({
  Implements: [Events, Options],

  options: {},
  /**
   *  new DB(options)
   *  - options.name (String)
   *  - options.storage (Object)
   *  - options.dict (Dictionary)
   *  - options.onReady (Function)
   *  fires ready
   **/
  initialize: function (options) {
    this.setOptions(options);

    this.name = "BrowserCouch_DB_" + this.options.name;
    this.dict = this.options.dict;
    this.storage = this.options.storage;
    this.views = {};

    this.storage.get(this.name, function (obj) {
      this.dict.unpickle(obj);
      this.fireEvent("ready", [this]);
    }.bind(this));

    this.addEvent("store", function (docs) {
      var views = this.views,
          dict = new Dictionary();

      if($type(docs) === "array")
        dict.setDocs(docs);
      else
        dict.set(docs.id, docs);

      for(var view_name in views)
        this.view(views[view_name].options, dict);
    }.bind(this), true);
  },

  /**
   *  DB#commitToStorage(callback) -> undefined
   **/
  commitToStorage: function (callback) {
    if(!callback)
      callback = $empty;

    this.storage.put(this.name, this.dict.dict, callback);
  },

  /**
   *  DB#wipe(callback) -> undefined
   **/
  wipe: function wipe(cb) {
    this.dict.clear();
    this.commitToStorage(cb);
    this.views = {};
  },

  /**
   *  DB#get(id, callback) -> undefined
   *  - id (String): id of the document.
   **/
  get: function get(id, cb) {
    if(this.dict.has(id))
      cb(this.dict.dict[id]);
    else
      cb(null);
  },

  /**
   *  DB#getLength() -> Number
   *  Size of the database - number of documents.
   **/
  getLength: function () {
    return this.dict.keys.length;
  },

  /**
   *  DB#put(document, callback) -> undefined
   *  DB#put(documents, callback) -> undefined
   *  - document.id (String | Number): remember to set this property
   *  - documents (Array): array of documents.
   *  fires store
   **/
  put: function (doc, cb) {
    if ($type(doc) === "array") {
      this.dict.setDocs(doc);
    } else
      this.dict.set(doc.id, doc);

    this.commitToStorage(cb);
    this.fireEvent("store", [doc]);
  },

  /**
   *  DB#view(options[, _dict]) -> this
   *  - options.id (String): name of the view. Optional for temporary views.
   *  - options.map (Function): mapping function. First argument is the document,
   *    while second argument is `emit` function.
   *  - options.reduce (Function): reduce function.
   *  - options.finished (Function): called once map/reduce process finishes.
   *  - options.updated (Function): called on each update to the view.
   *     First argument is a view with only new/changed documents.
   *  - options.progress (Function): called between pauses.
   *  - options.chunkSize (Number): number of documents to be processed at once.
   *    Defaults to 50.
   *  - options.mapReducer (Object): MapReducer to be used.
   *    Defaults to [[da.db.SingleThreadedMapReducer]].
   *  - options.temporary (Boolean): if enabled, new updates won't be reported.
   *    (`options.updated` won't be called at all)
   *  - _dict (Dictionary): objects on which proccess will be performed.
   *    Defaults to current database.
   **/
  view: function DB_view(options, dict) {
    if(!options.temporary && !options.id)
      return false;
    if(!options.map)
      return false;
    if(!options.finished)
      return false;

    if(typeof options.temporary === "undefined")
      options.temporary = false;
    if(options.updated && !this.views[options.id])
      this.addEvent("updated." + options.id, options.updated);
    if(!options.mapReducer)
      options.mapReducer = SingleThreadedMapReducer;
    if(!options.progress)
      options.progress = defaultProgress;
    if(!options.chunkSize)
      options.chunkSize = DEFAULT_CHUNK_SIZE;

    var onReduce = function onReduce (rows) {
      this._updateView(options, new ReduceView(rows), rows);
    }.bind(this);

    var onMap = function (mapResult) {
      if(!options.reduce)
        this._updateView(options, new MapView(mapResult), mapResult);
      else
        options.mapReducer.reduce(
          options.reduce, mapResult, options.progress, options.chunkSize, onReduce
        );
    }.bind(this);

    options.mapReducer.map(
      options.map,
      dict || this.dict,
      options.progress,
      options.chunkSize,
      onMap
    );

    return this;
  },

  _updateView: function (options, view, rows) {
    if(options.temporary)
      return options.finished(view);

    var id = options.id;
    if(!this.views[id]) {
      this.views[id] = {
        options: options,
        view: view
      };
      options.finished(view);
    } else {
      if(!view.rows.length)
        return this;

      if(options.reduce) {
        var full_view = this.views[id].view.rows.concat(view.rows),
            rereduce = {},
            reduce = options.reduce,
            n = full_view.length,
            row, key;

        while(n--) {
          row = full_view[n];
          key = row.key;

          if(!rereduce[key])
            rereduce[key] = [row.value];
          else
            rereduce[key].push(row.value);
        }

        rows = [];
        for(var key in rereduce)
          rows.push({
            key: key,
            value: reduce(null, rereduce[key], true)
          });
      }

      this.views[id].view._include(rows);
      this.fireEvent("updated." + id, [view]);
    }

    return this;
  },

  /**
   *  DB#killView(id) -> this
   *  - id (String): name of the view.
   **/
  killView: function (id) {
    this.removeEvents("updated." + id);
    delete this.views[id];
    return this;
  }
});

// Maximum number of items to process before giving the UI a chance
// to breathe.
var DEFAULT_CHUNK_SIZE = 1000,
// If no progress callback is given, we'll automatically give the
// UI a chance to breathe for this many milliseconds before continuing
// processing.
  DEFAULT_UI_BREATHE_TIME = 50;

function defaultProgress(phase, percent, resume) {
  window.setTimeout(resume, DEFAULT_UI_BREATHE_TIME);
}

/**
 *  class ReduceView
 *  Represents the result of map/reduce process.
 **/
/**
 *  new ReduceView(rows) -> this
 *  - rows (Array): value returned by reducer.
 **/
function ReduceView(rows) {
  /**
   *  ReduceView#rows -> Array
   *  Result of the reduce process.
   **/
  this.rows = [];
  var keys = [];

  this._include = function (newRows) {
    var n = newRows.length;

    while(n--) {
      var row = newRows[n];
      if(keys.indexOf(row.key) === -1) {
        this.rows.push(row);
        keys.push(row.key);
      } else {
        this.rows[this.findRow(row.key)] = newRows[n];
      }
    }

    this.rows.sort(keySort);
  };

  /**
   *  ReduceView#findRow(key) -> Number
   *  - key (String): key of the row.
   *
   *  Returns position of the row in [[ReduceView#rows]].
   **/
  this.findRow = function (key) {
    return findRowInReducedView(key, rows);
  };

  /**
   *  ReduceView#getRow(key) -> row
   *  - key (String): key of the row.
   **/
  this.getRow = function (key) {
    var row = this.rows[findRowInReducedView(key, rows)];
    return row ? row.value : undefined;
  };

  this._include(rows);
  return this;
}

function keySort (a, b) {
  a = a.key;
  b = b.key
  if(a < b) return -1;
  if(a > b) return  1;
            return  0;
}

function findRowInReducedView (key, rows) {
  if(rows.length > 1) {
    var midpoint = Math.floor(rows.length / 2),
        row = rows[midpoint],
        row_key = row.key;

    if(key < row_key)
      return findRowInReducedView(key, rows.slice(0, midpoint));
    if(key > row_key) {
      var p = findRowInReducedView(key, rows.slice(midpoint))
      return p === -1 ? -1 : midpoint + p;
    }
    return midpoint;
  } else
    return rows[0] && rows[0].key === key ? 0 : -1;
}

/**
 *  class MapView
 *  Represents the result of map/reduce process.
 **/
/**
 *  new MapView(rows) -> this
 *  - rows (Array): value returned by mapper.
 **/
function MapView (mapResult) {
  /**
   *  MapView#rows -> Object
   *  Result of the mapping process.
   **/
  this.rows = [];
  var keyRows = [];

  this._include = function (mapResult) {
    var mapKeys = mapResult.keys,
        mapDict = mapResult.dict;

    for(var i = 0, ii = mapKeys.length; i < ii; i++) {
      var key = mapKeys[i],
          ki = this.findRow(key),
          has_key = ki !== -1,
          item = mapDict[key],
          j = item.keys.length,
          newRows = new Array(j);

      if(has_key && this.rows[ki]) {
        this.rows[ki].value = item.values.shift();
        item.keys.shift();
        j--;
      } //else
        //keyRows.push({key: key, pos: this.rows.length});

      while(j--)
        newRows[j] = {
          id: item.keys[j],
          key: key,
          value: item.values[j]
        };

      if(has_key && this.rows[ki])
        newRows.shift();
      this.rows = this.rows.concat(newRows);
    }

    this.rows.sort(keySort);

    var keys = [];
    keyRows = [];
    for(var n = 0, m = this.rows.length; n < m; n++) {
      var key = this.rows[n].key;
      if(keys.indexOf(key) === -1)
        keyRows.push({
          key: key,
          pos: keys.push(key) - 1
        });
    }
  };

  /**
   *  MapView#findRow(key) -> Number
   *  - key (String): key of the row.
   *
   *  Returns position of the row in [[MapView#rows]].
   **/
  this.findRow = function MV_findRow (key) {
    return findRowInMappedView(key, keyRows);
  };

  /**
   *  MapView#getRow(key) -> row
   *  - key (String): key of the row.
   *
   *  Returns row's value, ie. it's a shortcut for:
   *      this.rows[this.findRow(key)].value
   **/
  this.getRow = function MV_findRow (key) {
    var row = this.rows[findRowInMappedView(key, keyRows)];
    return row ? row.value : undefined;
  };

  this._include(mapResult);

  return this;
}

function findRowInMappedView (key, keyRows) {
  if(keyRows.length > 1) {
    var midpoint = Math.floor(keyRows.length / 2);
    var keyRow = keyRows[midpoint];
    if(key < keyRow.key)
      return findRowInMappedView(key, keyRows.slice(0, midpoint));
    if(key > keyRow.key)
      return findRowInMappedView(key, keyRows.slice(midpoint));
    return keyRow ? keyRow.pos : -1;
  } else
    return (keyRows[0] && keyRows[0].key === key) ? keyRows[0].pos : -1;
}

/** section: Database
 *  class WebWorkerMapReducer
 *
 *  A MapReducer that uses [Web Workers](https://developer.mozilla.org/En/Using_DOM_workers)
 *  for its implementation, allowing the client to take advantage of
 *  multiple processor cores and potentially decouple the map-reduce
 *  calculation from the user interface.
 *
 *  The script run by spawned Web Workers is [[MapReduceWorker]].
 **/

/**
 *  new WebWorkerMapReducer(numWorkers[, worker])
 *  - numWorkers (Number): number of workers.
 *  - worker (Object): reference to Web worker implementation. Defaults to `window.Worker`.
 **/
function WebWorkerMapReducer(numWorkers, Worker) {
  if(!Worker)
    Worker = window.Worker;

  var pool = [];

  function MapWorker(id) {
    var worker = new Worker('js/workers/map-reducer.js');
    var onDone;

    worker.onmessage = function(event) {
      onDone(event.data);
    };

    this.id = id;
    this.map = function MW_map(map, dict, cb) {
      onDone = cb;
      worker.postMessage({map: map.toString(), dict: dict});
    };
  }

  for(var i = 0; i < numWorkers; i++)
    pool.push(new MapWorker(i));

  this.map = function WWMR_map(map, dict, progress, chunkSize, finished) {
    var keys = dict.keys,
        size = keys.length,
        workersDone = 0,
        mapDict = {};

    function getNextChunk() {
      if(keys.length) {
        var chunkKeys = keys.slice(0, chunkSize),
            chunk = {},
            n = chunkKeys.length;

        keys = keys.slice(chunkSize);
        var key;
        while(n--) {
          key = chunkKeys[n];
          chunk[key] = dict.dict[key];
        }
        return chunk;
//        for (var i = 0, ii = chunkKeys.length; i < ii; i++)
//          chunk[chunkKeys[i]] = dict.dict[chunkKeys[i]];

      } else
        return null;
    }

    function nextJob(mapWorker) {
      var chunk = getNextChunk();
      if(chunk) {
        mapWorker.map(map, chunk, function jobDone(aMapDict) {
          for(var name in aMapDict)
            if(name in mapDict) {
              var item = mapDict[name];
              item.keys = item.keys.concat(aMapDict[name].keys);
              item.values = item.values.concat(aMapDict[name].values);
            } else
              mapDict[name] = aMapDict[name];

          if(keys.length)
            progress("map",
              (size - keys.length) / size,
              function() { nextJob(mapWorker); }
            );
          else
            workerDone();
        });
      } else
        workerDone();
    }

    function workerDone() {
      workersDone += 1;
      if (workersDone == numWorkers)
        allWorkersDone();
    }

    function allWorkersDone() {
      var mapKeys = [];
      for(var name in mapDict)
        mapKeys.push(name);
      mapKeys.sort();
      finished({dict: mapDict, keys: mapKeys});
    }

    for(var i = 0; i < numWorkers; i++)
      nextJob(pool[i]);
  };

  // TODO: Actually implement our own reduce() method here instead
  // of delegating to the single-threaded version.
  this.reduce = SingleThreadedMapReducer.reduce;
};

/** section: Database
 * da.db.SingleThreadedMapReducer
 *
 * A MapReducer that works on the current thread.
 **/
var SingleThreadedMapReducer = {
  /**
   *  da.db.SingleThreadedMapReducer.map(map, dict, progress, chunkSize, finished) -> undefined
   *  - map (Function): mapping function.
   *  - dict (Object): database documents.
   *  - progress (Function): progress reporting function. Called with `"map"` as first argument.
   *  - chunkSize (Number): number of documents to map at once.
   *  - finished (Function): called once map proccess finishes.
   **/
  map: function STMR_map(map, dict, progress,
                         chunkSize, finished) {
    var mapDict = {},
        keys = dict.keys,
        currDoc;

    function emit(key, value) {
      // TODO: This assumes that the key will always be
      // an indexable value. We may have to hash the value,
      // though, if it's e.g. an Object.
      var item = mapDict[key];
      if (!item)
        item = mapDict[key] = {keys: [], values: []};
      item.keys.push(currDoc.id);
      item.values.push(value);
    }

    var i = 0;

    function continueMap() {
      var iAtStart = i, keysLength = keys.length;

      if(keysLength > 0)
        do {
          currDoc = dict.dict[keys[i]];
          map(currDoc, emit);
          i++;
        } while (i - iAtStart < chunkSize && i < keysLength);

      if (i == keys.length) {
        var mapKeys = [];
        for (var name in mapDict)
          mapKeys.push(name);
        mapKeys.sort();
        finished({dict: mapDict, keys: mapKeys});
      } else
        progress("map", i / keysLength, continueMap);
    }

    continueMap();
  },

  /**
   *  da.db.SingleThreadedMapReducer.reduce(reduce, mapResult, progress, chunkSize, finished) -> undefined
   *  - reduce (Function): reduce function.
   *  - mapResult (Object): Object returned by [[da.db.SingleThreadedMapReducer.map]].
   *  - progress (Function): progress reportiong function. Called with `"reduce"` as first argument.
   *  - chunkSize (Number): number of documents to process at once.
   *  - finished (Function): called when reduce process finishes.
   *  - rereduce (Boolean | Object): object which will be passed to `reduce` during the rereduce process.
   *
   *  Please refer to [CouchDB's docs on map and reduce functions](http://wiki.apache.org/couchdb/Introduction_to_CouchDB_views#Basics)
   *  for more detailed usage details.
   **/
  reduce: function STMR_reduce(reduce, mapResult, progress,
                               chunkSize, finished, rereduce) {
    var rows = [],
        mapDict = mapResult.dict,
        mapKeys = mapResult.keys,
        i = 0;
    rereduce = rereduce || {};

    function continueReduce() {
      var iAtStart = i;

      do {
        var key   = mapKeys[i],
            item  = mapDict[key];

        rows.push({
          key: key,
          value: reduce(key, item.values, false)
        });

        i++;
      } while (i - iAtStart < chunkSize &&
               i < mapKeys.length)

      if (i == mapKeys.length) {
        finished(rows);
      } else
        progress("reduce", i / mapKeys.length, continueReduce);
    }

    continueReduce();
  }
};

da.db.BrowserCouch              = BrowserCouch;
da.db.BrowserCouch.Dictionary   = Dictionary;
da.db.SingleThreadedMapReducer  = SingleThreadedMapReducer;
da.db.WebWorkerMapReducer       = WebWorkerMapReducer;

})();

/*!
Math.uuid.js (v1.4)
http://www.broofa.com
mailto:robert@broofa.com

Copyright (c) 2010 Robert Kieffer
Dual licensed under the MIT and GPL licenses.
*/

/*
 * Generate a random uuid.
 *
 * USAGE: Math.uuid(length, radix)
 *   length - the desired number of characters
 *   radix  - the number of allowable values for each character.
 *
 * EXAMPLES:
 *   // No arguments  - returns RFC4122, version 4 ID
 *   >>> Math.uuid()
 *   "92329D39-6F5C-4520-ABFC-AAB64544E172"
 * 
 *   // One argument - returns ID of the specified length
 *   >>> Math.uuid(15)     // 15 character ID (default base=62)
 *   "VcydxgltxrVZSTV"
 *
 *   // Two arguments - returns ID of the specified length, and radix. (Radix must be <= 62)
 *   >>> Math.uuid(8, 2)  // 8 character ID (base=2)
 *   "01001010"
 *   >>> Math.uuid(8, 10) // 8 character ID (base=10)
 *   "47473046"
 *   >>> Math.uuid(8, 16) // 8 character ID (base=16)
 *   "098F4D35"
 */
(function() {
  // Private array of chars to use
  var CHARS = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'.split(''); 

  Math.uuid = function (len, radix) {
    var chars = CHARS, uuid = [];
    radix = radix || chars.length;

    if (len) {
      // Compact form
      for (var i = 0; i < len; i++) uuid[i] = chars[0 | Math.random()*radix];
    } else {
      // rfc4122, version 4 form
      var r;

      // rfc4122 requires these characters
      uuid[8] = uuid[13] = uuid[18] = uuid[23] = '-';
      uuid[14] = '4';

      // Fill in random data.  At i==19 set the high bits of clock sequence as
      // per rfc4122, sec. 4.1.5
      for (var i = 0; i < 36; i++) {
        if (!uuid[i]) {
          r = 0 | Math.random()*16;
          uuid[i] = chars[(i == 19) ? (r & 0x3) | 0x8 : r];
        }
      }
    }

    return uuid.join('');
  };

  // A more performant, but slightly bulkier, RFC4122v4 solution.  We boost performance
  // by minimizing calls to random()
  Math.uuidFast = function() {
    var chars = CHARS, uuid = new Array(36), rnd=0, r;
    for (var i = 0; i < 36; i++) {
      if (i==8 || i==13 ||  i==18 || i==23) {
        uuid[i] = '-';
      } else if (i==14) {
        uuid[i] = '4';
      } else {
        if (rnd <= 0x02) rnd = 0x2000000 + (Math.random()*0x1000000)|0;
        r = rnd & 0xf;
        rnd = rnd >> 4;
        uuid[i] = chars[(i == 19) ? (r & 0x3) | 0x8 : r];
      }
    }
    return uuid.join('');
  };

  // A more compact, but less performant, RFC4122v4 solution:
  Math.uuidCompact = function() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
      return v.toString(16);
    }).toUpperCase();
  };
})();

/**
 *  == Utilities ==
 *  Utility classes and extensions to Native objects.
 **/

/**
 * da.util
 **/
if(typeof da.util === "undefined")
  da.util = {};

(function () {

/** section: Utilities
 *  class String
 *  
 *  #### External resources
 *  * [MooTools String docs](http://mootools.net/docs/core/Native/String)
 **/
var NULL_BYTE = /\0/g,
    INTERPOL_VAR = /\{(\w+)\}/g;

String.implement({
  /** 
   *  String.strip(@string) -> String
   *  
   *  Removes \0's from string.
   **/
  strip: function () {
    return this.replace(NULL_BYTE, "");
  },
  
  /**
   *  String.interpolate(@string, data) -> String
   *  - data (Object | Array): object or an array with data.
   *  
   *  Interpolates string with data.
   *  
   *  #### Example
   *  
   *      "{0}/{1}%".interpolate([10, 100])
   *      // -> "10/100%"
   *      
   *      "Hi {name}! You've got {new_mail} new messages.".interpolate({name: "John", new_mail: 10})
   *      // -> "Hi John! You've got 10 new messages."
   *  
   **/
  interpolate: function (data) {
    if(!data)
      return this.toString(); // otherwise typeof result === "object".
    
    return this.replace(INTERPOL_VAR, function (match, property) {
      var value = data[property];
      return typeof value === "undefined" ? "{" + property + "}" : value;
    });
  }
});

/** section: Utilities
 *  class Array
 *  
  *  #### External resources
  *  * [MooTools Array docs](http://mootools.net/docs/core/Native/Array)
  *  * [MDC Array specification](https://developer.mozilla.org/en/Core_JavaScript_1.5_Reference/Global_Objects/Array)
 **/
Array.implement({
  /** 
   *  Array.zip(@array...) -> Array
   *  
   *  Returns an array whose n-th element contains n-th element from each argument.
   *  
   *  #### Example
   *      Array.zip([1,2,3], [1,2,3])
   *      // -> [[1, 1], [2, 2], [3, 3]]
   *  
   *  #### See also
   *  * [Python's `zip` function](http://docs.python.org/library/functions.html?highlight=zip#zip)
   **/
  zip: function () {
    var n = this.length,
        args = [this].concat($A(arguments));
        args_length = args.length,
        zipped = new Array(n);
    
    while(n--) {
      zipped[n] = new Array(args_length);
      var m = args_length;
      while(m--)
        zipped[n][m] = args[m][n];
    }
    
    return zipped;
  },
  
  /**
   *  Array.containsAll(@array, otherArray) -> Boolean
   *  - otherArray (Array): array which has to contain all of the defined items.
   *  
   *  Checks if this array contains all of those provided in otherArray.
   **/
   containsAll: function (other) {
     var n = other.length;
     
     while(n--)
      if(!this.contains(other[n]))
        return false;
    
    return true;
   }
});

/** section: Utilities
 *  class Hash
 *  
 *  #### External resources
 *  * [MooTools Hash docs](http://mootools.net/docs/core/Native/Hash)
 **/

Hash.implement({
  /**
   *  Hash.containsAll(@hash, otherHash) -> Boolean
   *  - otherHash (Hash | Object): hash which has to contain all of the defined properties.
   *  
   *  Checks if all properties from this hash are present in otherHash.
   **/
  containsAll: function (otherHash) {
    for(var key in otherHash)
      if(otherHash.hasOwnProperty(key) && otherHash[key] !== this[key])
        return false;
    
    return true;
  }
})

})();


(function () {
/** section: Database
 *  class da.db.DocumentTemplate
 *  implements Events
 *
 *  Abstract class for manufacturing document templates. (ie. Model from MVC)
 **/
var DocumentTemplate = new Class({
  Implements: Events,

  /**
   *  da.db.DocumentTemplate#belongsTo -> Object
   *
   *  Provides belongs-to-many relationsip found in may ORM libraries.
   *
   *  #### Example
   *      da.db.DocumentTemplate.registerType("Artist", new Class({
   *        Extends: da.db.DocumentTemplate
   *      }));
   *
   *      var queen = new da.db.DocumentTemplate.Artist({
   *        id: 0,
   *        title: "Queen"
   *      });
   *
   *      da.db.DocumentTemplate.registerType("Song", new Class({
   *        Extends: da.db.DocumentTemplate,
   *        belongsTo: {
   *          artist: "Artist" // -> artist_id property will be used to create a new Artist
   *        }
   *      }));
   *
   *      var yeah = new da.db.DocumentTemplate.Song({
   *        artist_id: queen.id,
   *        album_id: 5,
   *        title: "Yeah"
   *      });
   *
   *      yeah.get("artist", function (artist) {
   *        console.log("Yeah by " + artist.get("title"));
   *      });
   *
  **/
  belongsTo: {},

  /**
   *  da.db.DocumentTemplate#hasMany -> Object
   *
   *  Provides has-many relationship between database documents.
   *
   *  #### Example
   *  If we defined `da.db.DocumentTemplate.Artist` in [[da.db.DocumentTemplate#belongsTo]] like:
   *
   *      da.db.DocumentTemplate.registerType("Artist", new Class({
   *        Extends: da.db.DocumentTemplate,
   *        hasMany: {
   *          songs: ["Song", "artist_id"]
   *        }
   *      }));
   *
   *  And assumed that `"artist_id"` is the name of the property which holds id of an `Artist`,
   *  while `"Song"` represents the type of the document.
   *
   *  Then we can obtain all the songs by given a artist with:
   *
   *      queen.get("songs", function (songs) {
   *        console.log("Queen songs:")
   *        for(var n = 0, m = songs.length; n < m; n++)
   *          console.log(songs[n].get("title"));
   *      });
   **/
  hasMany: {},

  /**
   *  new da.db.DocumentTemplate(properties[, events])
   *  - properties (Object): document's properties.
   *  - events (Object): default events.
   **/
  initialize: function (properties, events) {
    this.doc = properties;
    if(!this.doc.id)
      this.doc.id = Math.uuid();

    this.id = this.doc.id;
    this.doc.type = this.constructor.type;
    if(!this.constructor.db)
      this.constructor.db = function () {
        return Application.db
      };

    // Time delay is set so class can finish initialization
    this.addEvents(events);
    this.fireEvent("create", [this], 1);
  },

  /**
   *  da.db.DocumentTemplate#id -> "id of the document"
   *
   *  Shortcut for [[da.db.DocumentTemplate#get]]`("id")`.
   **/
  id: null,

  /**
   *  da.db.DocumentTemplate#get(key[, callback]) -> Object | false | this
   *  - key (String): name of the property.
   *  - callback (Function): needed only if `key` points to an property defined by an relationship.
   **/
  get: function (key, callback) {
    if(!this.belongsTo[key] && !this.hasMany[key])
      return this.doc[key];

    if(!callback)
      return false;

    if(key in this.belongsTo) {
      var cache_key = "_belongs_to_" + key,
          cached = this[cache_key];

      if(cached && cached.id === this.doc[key + "_id"])
        return callback(cached);

      if(!this.doc[key + "_id"])
        return callback(null);

      var type = this.belongsTo[key],
          owner = DocumentTemplate[type].findById(this.doc[key + "_id"]);

      callback(owner ? this[cache_key] = owner : null);
    } else if(key in this.hasMany) {
      var relation = this.hasMany[key],
          props    = {type: relation[0]};

      props[relation[1]] = this.id;

      DocumentTemplate.find({
        properties: props,
        onSuccess:  callback,
        onFailure:  callback
      }, DocumentTemplate[relation[0]].db());
    } else
      return false;

    return this;
  },

  /**
   *  da.db.DocumentTemplate#set(properties) -> this
   *  da.db.DocumentTemplate#set(key, value) -> this
   *  - properties (Object): updated properties.
   *  fires propertyChange
   **/
  set: function (properties, value) {
    if(typeof value !== "undefined") {
      var key = properties;
      properties = {};
      properties[key] = value;
    }

    $extend(this.doc, properties);
    this.fireEvent("propertyChange", [properties, this]);

    return this;
  },

  /**
   *  da.db.DocumentTemplate#remove(property) -> this
   *  - property (String): property to be removed.
   *  fires propertyRemove
   **/
  remove: function (property) {
    if(property !== "id")
      delete this.doc[property];

    this.fireEvent("propertyRemove", [property, this]);
    return this;
  },

  /**
   *  da.db.DocumentTemplate#save([callback]) -> this
   *  - callback (Function): function called after `save` event.
   *  fires save
   **/
  save: function (callback) {
    this.constructor.db().put(this.doc, function () {
      this.fireEvent("save", [this]);
      if(callback)
        callback(this);
    }.bind(this));

    return this;
  },

  /**
   *  da.db.DocumentTemplate#update(properties[, cb]) -> this
   *  - properties (Object): new properties.
   *  - callback (Function): called after `save`.
   *
   *  Calls [[da.db.DocumentTemplate#set]] and [[da.db.DocumentTemplate#save]].
   **/
  update: function (properties, cb) {
    this.set(properties);
    this.save(cb);
    return this;
  },

  /**
   *  da.db.DocumentTemplate#destroy([callback]) -> this
   *  - callback (Function): function called after `destroy` event.
   *
   *  Destroys the document.
   *
   *  #### Notes
   *  The document won't be completely destroyed from the db, it will only get a
   *  `_deleted` property set to `true`.
   **/
  destroy: function (callback, strip) {
    if(strip === true)
      for(var prop in this.doc)
        delete this.doc[prop];

    this.doc.id = this.id;
    this.doc._deleted = true;

    this.constructor.db().put(this.doc, function () {
      this.fireEvent("destroy", [this]);
      if(callback)
        callback(this);
    }.bind(this));

    return this;
  }
});

DocumentTemplate.extend({
  /**
   *  da.db.DocumentTemplate.find(options[, db]) -> undefined
   *  - options.properties (String | Object | Function): properties document must have or an function which checks document's properties.
   *    If `String` is provided, it's assumed that it represents document's `id`.
   *  - options.onSuccess (Function): function called once document is found.
   *  - options.onFailure (Function): function called if no documents are found.
   *  - options.onlyFirst (Bool): gives back only first result.
   *  - db (BrowserCouch): if not provided, `Application.db` is used.
   **/
  find: function (options, db) {
    if(!options.onSuccess)
      return false;
    if(!options.onFailure)
      options.onFailure = $empty;
    if(typeof options.properties === "string")
      options.properties = {id: options.properties}

    var map_fn, props = options.properties;

    function map_with_fnFilter (doc, emit) {
      if(doc && !doc._deleted && props(doc))
        emit(doc.id, doc);
    };

    function map_with_objFilter (doc, emit) {
      if(doc && !doc._deleted && Hash.containsAll(doc, props))
        emit(doc.id, doc);
    };

    map_fn = typeof properties === "function" ? map_with_fnFilter : map_with_objFilter;

    (db || da.db.DEFAULT).view({
      temporary: true,
      map: map_fn,
      finished: function (result) {
        if(!result.rows.length)
          return options.onFailure();

        var n = result.rows.length, row, type;
        while(n--) {
          row = result.rows[n].value;
          type = DocumentTemplate[row.type];

          result.rows[n] = type ? new type(row) : row;
        }

        delete n;
        delete row;
        delete type;
        options.onSuccess(options.onlyFirst ? result.rows[0] : result.rows);
        options = null;
        result = null;
      }
    });
  },

  /**
   *  da.db.DocumentTemplate.findFirst(options[, db]) -> undefined
   *  - options (Object): same options as in [[da.db.DocumentTemplate.find]] apply here.
   *
   *  #### Notes
   *  This method is also available on all classes which inherit from [[da.db.DocumentTemplate]].
   **/
  findFirst: function (options, db) {
    options.onlyFirst = true;
    this.find(options, db);
  },

  /**
   *  da.db.DocumentTemplate.findOrCreate(options[, db]) -> undefined
   *  - options (Object): same options as in [[da.db.DocumentTemplate.find]] apply here.
   *  - options.properties.type (String): must be set to the desired [[da.db.DocumentTemplate]] type.
   *
   *  #### Notes
   *  This method is also available on all classes which inherit from [[da.db.DocumentTemplate]].
   **/
  findOrCreate: function (options, db) {
    options.onSuccess = options.onSuccess || $empty;
    options.onFailure = function () {
      options.onSuccess(new DocumentTemplate[options.properties.type](options.properties), true);
    };

    this.findFirst(options, db);
  },

  /**
   *  da.db.DocumentTemplate.registerType(typeName[, db = da.db.DEFAULT], template) -> da.db.DocumentTemplate
   *  - typeName (String): name of the type. ex.: `Car`, `Chocolate`, `Song`, etc.
   *  - db (BrowserCouch): database to be used.
   *  - template (da.db.DocumentTemplate): class which extends [[da.db.DocumentTemplate]].
   *
   *  New classes are accessible from `da.db.DocumentTemplate.<typeName>`.
   *
   *  #### Notes
   *  You _must_ use this method in order to
   **/
  registerType: function (type, db, template) {
    if(arguments.length === 2) {
      template = db;
      db = null;
    }

    template.type = type;
    // This is a function so we can
    // return a reference to the original instance
    // of DB, otherwise, due to MooTools' inheritance
    // we would get a new copy.
    if(db)
      template.db = function () { return db };
    else
      template.db = function () { return da.db.DEFAULT };

    template.find = function (options) {
      options.properties.type = type;
      if(options.properties.id)
        template.findById(options.id, function (doc) {
          if(doc)
            options.onSuccess([doc]);
          else
            options.onFailure();
        });
      else
        DocumentTemplate.find(options, db);
    };

    template.findFirst = function (options) {
      options.properties.type = type;
      DocumentTemplate.findFirst(options, db);
    };

    template.create = function (properties, callback) {
      return (new template(properties)).save(callback);
    };

    template.findOrCreate = function (options) {
      options.properties.type = type;
      DocumentTemplate.findOrCreate(options, db);
    };

    /**
     *  da.db.DocumentTemplate.findById(id) -> da.db.DocumentTemplate
     *  - id (String): id of the document
     *
     *  #### Notes
     *  This method is available *only* on classes which extend [[da.db.DocumentTemplate]]
     *  and are registered using [[da.db.DocumentTemplate.registerType]].
     **/
    template.findById = function (id) {
      var doc = template.view().getRow(id);
      return doc && !doc._deleted ? new template(doc) : null;
    };

    template.view = function () {
      return template.db().views[type].view;
    };

    template.db().view({
      id: type,
      map: function (doc, emit) {
        if(doc && !doc._deleted && doc.type === type)
          emit(doc.id, doc);
      },
      finished: $empty
    });

    DocumentTemplate[type] = template;
    return template;
  }
});

da.db.DocumentTemplate = DocumentTemplate;

})();

/** section: Utilities
 *  class da.util.Goal
 *  implements Events, Options
 *  
 *  A helper class which makes it easier to manage async nature of JS.
 *  An Goal consists of several checkpoints, which, in order to complete the goal have to be reached.
 *  
 *  #### Examples
 *    
 *      var travel_the_world = new da.util.Goal({
 *        checkpoints: ["Nicosia", "Vienna", "Berlin", "Paris", "London", "Reykjavik"],
 *        
 *        onCheckpoint: function (city) {
 *          console.log("Hello from " + name + "!");
 *        },
 *        
 *        onFinish: function () {
 *          console.log("Yay!");
 *        },
 *        
 *        afterCheckpoint: {
 *          Paris: function () {
 *            consle.log("Aww...");
 *          }
 *        }
 *      });
 *      
 *      travel_the_world.checkpoint("Nicosia");
 *      // -> "Hello from Nicosia!"
 *      travel_the_world.checkpoint("Berlin");
 *      // -> "Hello from Berlin!"
 *      travel_the_world.checkpoint("Paris");
 *      // -> "Hello from Paris!"
 *      // -> "Aww..."
 *      travel_the_world.checkpoint("London");
 *      // -> "Hello from London!"
 *      travel_the_world.checkpoint("Reykyavik");
 *      // -> "Hello from Paris!"
 *      travel_the_world.checkpoint("Vienna");
 *      // -> "Hello from Vienna!"
 *      // -> "Yay!"
 *    
 **/
da.util.Goal = new Class({
  Implements: [Events, Options],
  
  options: {
    checkpoints: [],
    afterCheckpoint: {}
  },
  /**
   *  da.util.Goal#finished -> Boolean
   *  
   *  Indicates if all checkpoints have been reached.
   **/
  finished: false,
  
  /**
   *  new da.util.Goal([options])
   *  - options.checkpoints (Array): list of checkpoints needed for goal to finish.
   *  - options.onFinish (Function): called once all checkpoints are reached.
   *  - options.onCheckpoint (Function): called after each checkpoint.
   *  - options.afterCheckpoint (Object): object keys represent checkpoints whose functions will be called after respective checkpoint.
   **/
  initialize: function (options) {
    this.setOptions(options);
    this.completedCheckpoints = [];
  },
  
  /**
   *  da.util.Goal#checkpoint(name) -> undefined | false
   *  - name (String): name of the checkpoint.
   *  fires checkpoint, finish
   *  
   *  Registers that checkpoint has been reached;
   **/
  checkpoint: function (name) {
    if(!this.options.checkpoints.contains(name))
      return false;
    if(this.completedCheckpoints.contains(name))
      return false;
    
    this.completedCheckpoints.push(name);
    this.fireEvent("checkpoint", [name, this.completedCheckpoints]);
    
    if(this.options.afterCheckpoint[name])
      this.options.afterCheckpoint[name](this.completedCheckpoints);
    
    if(this.completedCheckpoints.containsAll(this.options.checkpoints))
      this.finish();
  },
  
  finish: function () {
    this.finished = true;
    this.fireEvent("finish");
  }
});

/**
 *  == UserInterface ==
 *  
 *  Common UI classes like [[Column]] and [[Menu]].
 **/

/** section: UserInterface
 * da.ui
 **/
da.ui = {};


(function () {
/** section: UserInterface
 *  class da.ui.Menu
 *  implements Events, Options
 *  
 *  Lightweight menu class.
 *  
 *  #### Example
 *  
 *      var file_menu = new da.ui.Menu({
 *        items: {
 *          neu:      {html: "New", href: "#"},
 *          neu_tpl:  {html: "New from template", href: "#"},
 *          open:     {html: "Open", href: "#"},
 *          
 *          _sep1:     da.ui.Menu.separator,
 *          
 *          close:    {html: "Close", href: "#"},
 *          save:     {html: "Save", href: "#"},
 *          save_all: {html: "Save all", href: "#", "class": "disabled"},
 *          
 *          _sep2:    da.ui.Menu.separator,
 *          
 *          quit:     {html: "Quit", href: "#", onClick: function () {
 *            confirm("Are you sure?")
 *          }}
 *        },
 *        
 *        position: {
 *          position: "topLeft"
 *        },
 *        
 *        onClick: function (key, event, element) {
 *          console.log("knock knock", key);
 *        }
 *      });
 *      
 *      file_menu.show();
 *  
 *  Values of properties in `items` are actually second arguments for MooTools'
 *  `new Element()` and therefore provide great customization ability.
 *  
 *  `position` property will be passed to MooTools' `Element.position()` method,
 *  and defaults to `bottomRight`.
 *
 *  #### Events
 *  - `click` - arguments: key of the clicked item, clicked element
 *  - `show`
 *  - `hide`
 *  
 *  #### Notes
 *  `href` attribute is added to all items in order to enable
 *  keyboard navigation with tab key.
 *  
 *  #### See also
 *  * [MooTools Element class](http://mootools.net/docs/core/Element/Element#Element:constructor)
 **/

var VISIBLE_MENU, ID = 0;
da.ui.Menu = new Class({
  Implements: [Events, Options],
  
  options: {
    items: {},
    position: {
      position: "bottomLeft"
    }
  },
  
  /**
   *  da.ui.Menu#last_clicked -> Element
   *  
   *  Last clicked menu item.
   **/
  last_clicked: null,
  
  /**
   *  new da.ui.Menu([options = {}])
   *  - options.items (Object): menu items.
   *  - options.position (Object): menu positioning parameters.
   **/
  initialize: function (options) {
    this.setOptions(options);
    
    this._el = (new Element("ul")).addClass("menu").addClass("no_selection");
    this._el.style.display = "none";
    this._el.addEvent("click:relay(.menu_item a)", this.click.bind(this));
    this._el.addEvent("dragend:relay(.menu_item a)", this.click.bind(this));
    this._id = "_menu_" + (ID++) + "_";
    
    this.render();
  },
  
  /**
   *  da.ui.Menu#render() -> this
   *  
   *  Renders the menu items and adds them to the document.
   *  Menu element is an `ul` tag appeded to the bottom of `document.body` and has `menu` CSS class.
   **/
  render: function () {
    var items = this.options.items;
    this._el.dispose().empty();
    
    for(var id in items)
      this._el.grab(this.renderItem(id));
    
    document.body.grab(this._el);
    return this;
  },
  
  /**
   *  da.ui.Menu#renderItem(id) -> Element
   *  - id (String): id of the menu item.
   *  
   *  Renders item without attaching it to DOM.
   *  Item is a `li` tag with `menu_item` CSS class. `li` tag contains an `a` tag with the item's text.
   *  Each `li` tag also has a `menu_key` property set, which can be retrived with:
   *        
   *        menu.toElement().getItems('.menu_item').retrieve("menu_key")
   *  
   *  If the item was defined with function than those tag names might not be used,
   *  but CSS class names are guaranteed to be there in both cases.
   **/
  renderItem: function (id) {
    var options = this.options.items[id], el;
    
    if(typeof options === "function")
      el = options(id).addClass("menu_item");
    else
      el = new Element("li").grab(new Element("a", options));
    
    el.id = this._id + id;
    
    return el.addClass("menu_item").store("menu_key", id);
  },
  
  /**
   *  da.ui.Menu#addItems(items) -> this
   *  - items (Object): key-value pairs of items to be added to the menu.
   *  
   *  Adds items to the bottom of menu and renders them.
   **/
  addItems: function (items) {
    $extend(this.options.items, items);
    return this.render();
  },
  
  /**
   *  da.ui.Menu#addItem(id, value) -> this
   *  - id (String): id of the item.
   *  - value (Object | Function): options for [[Element]] class or function which will render the item.
   *  
   *  If `value` is an [[Object]] then it will be passed as second argument to MooTools's [[Element]] class.
   *  If `value` is an [[Function]] then it has return an [[Element]],
   *  first argument of the function is id of the item that needs to be rendered.
   *  
   *  #### Notes
   *  `id` attribute of the element will be overwritten in both cases.
   *   *Do not* depend on them in your code.
   **/
  addItem: function (id, value) {
    this.options.items[id] = value;
    this._el.grab(this.renderItem(id));
    return this;
  },
  
  /**
   *  da.ui.Menu#removeItem(id) -> this
   *  - id (String): id of the item.
   *  
   *  Removes an item from the menu.
   **/
  removeItem: function (id) {
    delete this.options.items[id];
    return this.render();
  },
  
  /**
   *  da.ui.Menu#getItem(id) -> Element
   *  - id (String): id of the item.
   *  
   *  Returns DOM representing the menu item.
   *  
   *  #### Notes
   *  Never overwrite `id` attribute of the element,
   *  as this very method relies on it.
   **/
  getItem: function (id) {
    return $(this._id + id);
  },
  
  /**
   *  da.ui.Menu#addSeparator() -> this
   *  
   *  Adds separator to the menu.
   **/
  addSeparator: function () {
    return this.addItem("separator_" + Math.uuid(3), da.ui.Menu.separator);
  },
  
  /**
   *  da.ui.Menu#click(event, element) -> this
   *  - event (Event): DOM event or `null`.
   *  - element (Element): list item which was clicked.
   *  fires: click
   **/
  click: function (event, element) {
    this.hide();
    
    if(!element.className.contains("menu_item"))
      element = element.getParent(".menu_item");
    if(!element)
      return this;
    
    this.fireEvent("click", [element.retrieve("menu_key"), event, element]);
    this.last_clicked = element;
    
    return this;
  },
  
  /**
   *  da.ui.Menu#show([event]) -> this
   *  - event (Event): click or some other DOM event with coordinates.
   *  fires show
   *  
   *  Shows the menu. If event is present than menus location will be adjusted according to
   *  event's coordinates and position option.
   *  In case the menu is already visible, it will be hidden.
   **/
  show: function (event) {
    if(VISIBLE_MENU) {
      if(VISIBLE_MENU == this)
        return this.hide();
      else
        VISIBLE_MENU.hide();
    }

    VISIBLE_MENU = this;
    
    if(event)
      event.stop();
    
    if(event && event.target) {
      this._el.position($extend({
        relativeTo: event.target
      }, this.options.position));
    }
    
    this._el.style.zIndex = 5;
    this._el.style.display = "block";
    this._el.focus();
    
    this.fireEvent("show");
    
    return this;
  },
  
  /**
   *  da.ui.Menu#hide() -> this
   *  fires hide
   *  
   *  Hides the menu.
   **/
  hide: function () {
    if(this._el.style.display === "none")
      return this;
    
    VISIBLE_MENU = null;
    this._el.style.display = "none";
    this.fireEvent("hide");
    
    return this;
  },
  
  /**
   *  da.ui.Menu#destroy() -> this
   *  
   *  Destroys the menu.
   **/
  destroy: function () {
    this._el.destroy();
    delete this._el;
    return this;
  },
  
  /**
   *  da.ui.Menu#toElement() -> Element
   *  
   *  Returns menu element.
   **/
  toElement: function () {
    return this._el;
  }
});

/**
 *  da.ui.Menu.separator -> Object
 *  
 *  Use this object as a separator.
 **/
da.ui.Menu.separator = {
  "class": "menu_separator",
  html: "<hr/>",
  onClick: function (event) {
    if(event)
      event.stop();
  }
};

// Hides the menu if click happened somewhere outside of the menu.
window.addEvent("click", function (e) {
  var target = e.target;
  if(VISIBLE_MENU && (!target || !$(target).getParents().contains(VISIBLE_MENU._el)))
    VISIBLE_MENU.hide();
});

})();



/** section: UserInterface
 *  class da.ui.Dialog
 *
 *  Class for working with interface dialogs.
 **/
da.ui.Dialog = new Class({
  Implements: [Events, Options],

  options: {
    title:              null,
    closeButton:        false,
    show:               false,
    draggable:          false,
    hideOnOutsideClick: true,
    destroyOnHide:      false
  },

  /**
   *  new da.ui.Dialog(options)
   *  - options.title (String | Element): title of the dialog. optional.
   *  - options.hideOnOutsideClick (Boolean): if `true`, the dialog will be
   *    hidden when the click outside the dialog element occurs (ie. on the dimmed
   *    portion of screen)
   *  - options.closeButton (Boolean): toggle the close button. If `true`, the button
   *    will be injected at the top of `options.html`, before the title (if any).
   *  - options.show (Boolean): if `true` the dialog will be shown immediately as it's created.
   *    Defaults to `false`.
   *  - options.draggable (Boolean): when set to `true`, the dialog will be draggable.
   *    There won't be a dialog wrapper, ie. the users will be able to interact with
   *    the content around the dialog. Defaults to `false`.
   *  - options.destroyOnHide (Boolean): destroy the dialog after the dialog has been hidden
   *    for the first time.
   *  - options.html (Element): contents of the.
   *
   *  To the `options.html` element `dialog` CSS class name will be added and
   *  the element will be wrapped into a `div` with `dialog_wrapper` (or `draggable_dialog_wrapper`) CSS class name.
   *
   *  If `options.title` is provided, the title element will be injected at the top of
   *  `options.html` and will be given `dialog_title` CSS class name.
   *
   *  #### Notes
   *  * All dialogs are hidden by default, use [[Dialog.show]] to show them immediately
   *    after they are created.
   *  * When the close button is clicked, before `hide` event is fired, a `dismiss`
   *    event will be fired. To cancel hiding of the dialog just throw an error from
   *    an listener.
   *  * If the dialog will be draggable, you're expected to privide a `options.title`,
   *    as that will be the handle.
   *
   *  #### Example
   *      var hai = new da.ui.Dialog({
   *        title: "Bonjur tout le monde!"
   *        html: new Element("div", {
   *          html: "Hai World!"
   *        }),
   *        show: true,
   *
   *        onHide: function () {
   *          hai.destroy();
   *          delete hai;
   *        }
   *      });
   *
   **/
  initialize: function (options) {
    this.setOptions(options);
    if(!this.options.html)
     throw "options.html must be provided when creating an Dialog";
    
    this._el = new Element("div", {
      "class": this.options.draggable ? "draggable_dialog_wrapper" : "dialog_wrapper"
    });
    if(!this.options.show)
      this._el.style.display = "none";
    
    if(this.options.title) {
      var title;
      
      if(typeof this.options.title === "string")
        title = new Element("h2", {
          html: this.options.title,
          href: "#",
          "class": "dialog_title no_selection"
        });
      else if($type(this.options.title) === "element")
        title = this.options.title;
      
      title.inject(this.options.html, "top");
      delete title;
    }
    
    if(this.options.closeButton)
      (new Element("a", {
        "class": "dialog_close no_selection",
        html: "Close",
        title: "Close",
        events: {
          click: function () {
            this.fireEvent("dismiss");
            this.hide();
          }.bind(this)
        }
      })).inject(this.options.html, "top");
    
    if(this.options.hideOnOutsideClick)
      this._el.addEvent("click", this.hide.bind(this));
    
    this._el.grab(options.html.addClass("dialog"));
    document.body.grab(this._el);
    
    if(this.options.draggable)
      this._el.makeDraggable({
        handle: this.options.html.getElement(".dialog_title")
      });
  },

  /**
   *  da.ui.Dialog#show() -> this
   *  fires show
   **/
  show: function () {
    if(this._el.style.display !== "none")
      return this;
    
    this._el.show();
    this.fireEvent("show", [this]);
    return this;
  },

  /**
   *  da.ui.Dialog#hide([event]) -> this
   *  fires hide
   **/
  hide: function (event) {
    if((event && event.target !== this._el)
      || this._el.style.display === "none")
      return this;
    
    this._el.hide();
    this.fireEvent("hide", [this]);
    
    if(this.options.destroyOnHide)
      this.destroy();
    
    return this;
  },

  /**
   *  da.ui.Dialog#toElement() -> Element
   **/
  toElement: function () {
    return this._el;
  },

  /**
   *  da.ui.Dialog#destroy() -> this
   **/
  destroy: function () {
    this._el.destroy();
    delete this._el;
    delete this.options;
    
    return this;
  }
});


(function () {
var BrowserCouch    = da.db.BrowserCouch,
    PersistStorage  = da.db.PersistStorage,
    Goal            = da.util.Goal,
    Menu            = da.ui.Menu,
    Dialog          = da.ui.Dialog;

/** section: Controllers
 * App
 *
 * Private interface of the [[da.app]].
 **/
var App = {
  initialize: function () {
    this.startup = new Goal({
      checkpoints: ["domready", "settings_db", "caps", "data_db"],
      onFinish: this.ready.bind(this)
    });
    
    BrowserCouch.get("settings", function (db) {
      da.db.SETTINGS = db;
      if(!db.getLength())
        App.loadInitialSettings();
      else {
        App.startup.checkpoint("settings_db");
        App.getCaps();
      }
    }, new PersistStorage("tahoemp_settings"));
    
    BrowserCouch.get("data", function (db) {
      da.db.DEFAULT = db;
      App.startup.checkpoint("data_db");
    }, new PersistStorage("tahoemp_data"));
    
    da.app.addEvent("ready.controller.CollectionScanner", function () {
      if(!da.db.DEFAULT.getLength())
        da.controller.CollectionScanner.scan();
    });
  },
  
  loadInitialSettings: function () {
    var req = new Request.JSON({
      url: "config.json",
      noCache: true,
      
      onSuccess: function (data) {
        da.db.SETTINGS.put([
          {id: "music_cap",     type: "Setting", group_id: "caps", value: data.music_cap},
          {id: "settings_cap",  type: "Setting", group_id: "caps", value: data.settings_cap}
        ], function () {
          App.startup.checkpoint("settings_db");
          
          da.app.caps.music = data.music_cap;
          da.app.caps.settings = data.settings_cap;
          
          App.startup.checkpoint("caps");
          
          if(!da.db.DEFAULT.getLength())
            App.callController("CollectionScanner", "scan");
        });
      },
      
      onFailure: function () {
        delete req;
        alert("You're missing a config.json file! See docs on how to set it up.");
        
        App.callController("Settings", "showGroup", ["caps"]);
      }
    });
    
    req.get();
  },
  
  getCaps: function () {
    // We can't use DocumentTemplate.Setting here as the class
    // is usually instantiated after the call to this function.
    da.db.SETTINGS.view({
      id: "caps",
      
      map: function (doc, emit) {
        if(doc && doc.type === "Setting" && doc.group_id === "caps")
          emit(doc.id, doc.value);
      },
      
      finished: function (result) {
        if(!result.rows.length)
          return App.loadInitialSettings();
        
        da.app.caps = {
          music:    result.getRow("music_cap"),
          settings: result.getRow("settings_cap")
        };
        
        if(!da.app.caps.settings.length || !da.app.caps.music.length)
          App.loadInitialSettings();
        else
          App.startup.checkpoint("caps");
      },
      
      updated: function (result) {
        var music    = result.getRow("music_cap"),
            settings = result.getRow("settings_cap");
        
        if(music)
          da.controller.CollectionScanner.scan(da.app.caps.music = music);
        
        if(settings)
          da.app.caps.settings = settings;
        
        App.startup.checkpoint("caps");
      }
    });
  },
  
  callController: function(controller, method, args) {
    function callControllerMethod() {
      var c = da.controller[controller];
      c[method].apply(c, args);
      c = null;
    }
    
    if(da.controller[controller])
      callControllerMethod();
    else
      da.app.addEvent("ready.controller." + controller, callControllerMethod);
  },
  
  /**
   *  da.app.ready() -> undefined
   *  fires ready
   *  
   *  Called when all necessary components are initialized.
   **/
  ready: function () {
    $("loader").destroy();
    $("panes").style.display = "block";
    
    this.setupMainMenu();
    
    da.app.fireEvent("ready");
    
    var about_iframe = new Element("iframe", {
      src: "about:blank",
      width: 400,
      height: 500
    });
    about_iframe.style.background = "#fff";
    this.about_dialog = new Dialog({
      html: about_iframe,
      onShow: function () {
        about_iframe.src = "about.html";
      },
      onHide: function () {
        about_iframe.src = "about:blank";
      }
    });
  },
  
  setupMainMenu: function () {
    var main_menu_button = new Element("a", {
      id:   "main_menu",
      // triangle
      html: "&#x25BC;",
      href: "#",
      events: {
        mousedown: function (event) {
          da.app.mainMenu.show(event);
        },
        click: function (event) {
          Event.stop(event);
        }
      }
    });
    
    da.app.mainMenu = new Menu({
      items: {
        toggleShuffle: {html: "Turn shuffle on", id: "player_toggle_shuffle_menu_item", href: "#"},
        mute:     {html: "Mute", id: "player_mute_menu_item", href: "#"},
        _sep0:    Menu.separator,
        
        addToPl:  {html: "Add to playlist&hellip;", href: "#"},
        share:    {html: "Share&hellip;",           href: "#"},
        
        _sep1:    Menu.separator,
        
        search:   {html: "Search&hellip;",    href: "#"},
        upload:   {html: "Import&hellip;",    href: "#"},
        rescan:   {html: "Rescan collection", href: "#"},
        settings: {html: "Settings&hellip;",  href: "#"},
        
        _sep2:    Menu.separator,
        
        help:     {html: "Help",  href: "#"},
        about:    {html: "About", href:"#"}
      },
      
      position: {
        position: "bottomRight",
        edge:     "topRight",
        offset:   { y: -3 }
      },
      
      onShow: function () {
        main_menu_button.addClass("active_menu");
      },
      onHide: function () {
        main_menu_button.removeClass("active_menu");
      },
      onClick: function (item) {
        var fn = da.app.mainMenuActions[item];
        if(fn)
          fn();
        fn = null;
      }
    });
    document.body.grab(main_menu_button);
  }
};

/**
 *  class da.app
 *
 *  The main controller.
 **/
da.app = {
  /**
   *  da.app.caps -> Object
   *  Object with `music` and `settings` properties, ie. the contents of `config.json` file.
   **/
  caps: {},
  
  /**
   *  da.app.mainMenu -> da.ui.Menu
   **/
  mainMenu: null,
  
  /**
   *  da.app.mainMenuActions -> Object
   *  Object's keys match [[da.app.mainMenu]] item keys.
   **/
  mainMenuActions: {
    toggleShuffle:  function () { da.controller.Player._toggleShuffle() },
    mute:           function () { da.controller.Player.toggleMute()     },
    addToPl:        function () { da.controller.Playlist.addSong()      },
    search:         function () { da.controller.Search.show()           },
    rescan:         function () { da.controller.CollectionScanner.scan(da.app.caps.music) },
    settings:       function () { da.controller.Settings.show()         },
    about:          function () { App.about_dialog.show()               }
  }
};
$extend(da.app, new Events());

App.initialize();

window.addEvent("domready", function () {
  App.startup.checkpoint("domready");
});

})();

/**
 *  == DocumentTemplates ==
 *  
 *  Database document templates.
 *
 **/

(function () {
var DocumentTemplate = da.db.DocumentTemplate,
    // We are separating the actual setting values from
    // information needed to display the UI controls.
    SETTINGS = {};

/**
 *  class da.db.DocumentTemplate.Setting < da.db.DocumentTemplate
 *  
 *  Class for represeting settings.
 *  
 *  #### Example
 *      da.db.DocumentTemplate.Setting.register({
 *        id:           "volume",
 *        group_id:     "general",
 *        representAs:  "Number",
 *        
 *        title:        "Volume",
 *        help:         "Configure the volume",
 *        value:        64
 *      });
 **/

var Setting = new Class({
  Extends: DocumentTemplate
});
DocumentTemplate.registerType("Setting", da.db.SETTINGS, Setting);

Setting.extend({
  /**
   *  da.db.DocumentTemplate.Setting.register(template) -> undefined
   *  - template.id (String): ID of the setting.
   *  - template.group_id (String | Number): ID of the group to which setting belongs to.
   *  - template.representAs (String): type of the data this setting represents. ex. `text`, `password`.
   *  - template.title (String): human-friendly name of the setting.
   *  - template.help (String): a semi-long description of what this setting is used for.
   *  - template.value (String | Number | Object): default value.
   *  - template.hidden (Boolean): if `true`, the setting will not be displayed in settings dialog.
   *    Defaults to `false`.
   *  - template.position (Number): position in the list.
   *   
   *  For list of possible `template.representAs` values see [[Settings.addRenderer]] for details.
   **/
  register: function (template) {
    SETTINGS[template.id] = {
      title: template.title,
      help: template.help,
      representAs: template.representAs || "text",
      position: typeof template.position === "number" ? template.position : -1
    };

    this.findOrCreate({
      properties: {id: template.id},
      onSuccess: function (doc, was_created) {
        if(was_created)
          doc.update({
            group_id: template.group_id,
            value:    template.value
          });
      }
    });
  },
  
  /**
   *  da.db.DocumentTemplate.Setting.findInGroup(group, callback) -> undefined
   *  - group (String | Number): ID of the group.
   *  - callback (Function): function called with all found settings.
   **/
  findInGroup: function (group, callback) {
    this.find({
      properties: {group_id: group},
      onSuccess: callback,
      onFailure: callback
    });
  },

  /**
   *  da.db.DocumentTemplate.Setting.getDetails(id) -> Object
   *  - id (String | Number): id of the setting.
   *
   *  Returns presentation-related details about the given setting.
   *  These details include `title`, `help` and `data` properties given to [[da.db.DocumentTemplate.Setting.register]].
   **/
  getDetails: function (id) {
    return SETTINGS[id];
  }
});

Setting.register({
  id:           "music_cap",
  group_id:     "caps",
  representAs:  "text",
  title:        "Music cap",
  help:         "Tahoe cap for the root dirnode in which all your music files are.",
  value:        ""
});

Setting.register({
  id:           "settings_cap",
  group_id:     "caps",
  representAs:  "text",
  title:        "Settings cap",
  help:         "Tahoe read-write cap to the dirnode in which settings will be kept.",
  value:        ""
});

/*
Setting.register({
  id:           "lastfm_enabled",
  group_id:     "lastfm",
  representAs:  "checkbox",
  title:        "Enable Last.fm scrobbler",
  help:         "Enable this if you whish to share music your are listening to with others.",
  value:        false,
  position:     0
});

Setting.register({
  id:           "lastfm_username",
  group_id:     "lastfm",
  representAs:  "text",
  title:        "Username",
  help:         "Type in your Last.fm username.",
  value:        "",
  position:     1
});

Setting.register({
  id:           "lastfm_password",
  group_id:     "lastfm",
  representAs:  "password",
  title:        "Password",
  help:         "Write down your Last.fm password.",
  value:        "",
  position:     2
});
*/

})();


/**
 *  class da.db.DocumentTemplate.Artist < da.db.DocumentTemplate
 *  hasMany: [[da.db.DocumentTemplate.Song]]
 *
 *  #### Standard properties
 *  - title (String): name of the artist
 *
 **/
 
(function () {
var DocumentTemplate = da.db.DocumentTemplate;

DocumentTemplate.registerType("Artist", new Class({
  Extends: DocumentTemplate,
  
  hasMany: {
    songs: "Song"
  }
}));

})();


/**
 *  class da.db.DocumentTemplate.Album < da.db.DocumentTemplate
 *  hasMany: [[da.db.DocumentTemplate.Song]]
 *  belongsTo: [[da.db.DocumentTemplate.Artist]]
 *  
 *  #### Standard properties
 *  * `title` - name of the album
 **/

(function () {
var DocumentTemplate = da.db.DocumentTemplate;

DocumentTemplate.registerType("Album", new Class({
  Extends: DocumentTemplate,
  
  hasMany: {
    songs: "Song"
  },
  
  belongsTo: {
    artist: "Artist"
  }
}));

})();




(function () {
/**
 *  da.util.GENRES -> [String, ...]
 *  List of genres defined by ID3 spec.
 *
 *  #### Links
 *  * [List of genres](http://www.id3.org/id3v2.3.0#head-129376727ebe5309c1de1888987d070288d7c7e7)
 **/
da.util.GENRES = [
  "Blues","Classic Rock","Country","Dance","Disco","Funk","Grunge","Hip-Hop","Jazz",
  "Metal","New Age","Oldies","Other","Pop","R&B","Rap","Reggae","Rock","Techno",
  "Industrial","Alternative","Ska","Death Metal","Pranks","Soundtrack","Euro-Techno",
  "Ambient","Trip-Hop","Vocal","Jazz+Funk","Fusion","Trance","Classical","Instrumental",
  "Acid","House","Game","Sound Clip","Gospel","Noise","AlternRock","Bass","Soul","Punk",
  "Space","Meditative","Instrumental Pop","Instrumental Rock","Ethnic","Gothic",
  "Darkwave","Techno-Industrial","Electronic","Pop-Folk","Eurodance","Dream",
  "Southern Rock","Comedy","Cult","Gangsta","Top 40","Christian Rap","Pop/Funk",
  "Jungle","Native American","Cabaret","New Wave","Psychadelic","Rave","Showtunes",
  "Trailer","Lo-Fi","Tribal","Acid Punk","Acid Jazz","Polka","Retro","Musical",
  "Rock & Roll","Hard Rock","Folk","Folk-Rock","National Folk","Swing","Fast Fusion",
  "Bebob","Latin","Revival","Celtic","Bluegrass","Avantgarde","Gothic Rock",
  "Progressive Rock","Psychedelic Rock","Symphonic Rock","Slow Rock","Big Band",
  "Chorus","Easy Listening","Acoustic","Humour","Speech","Chanson","Opera","Chamber Music",
  "Sonata","Symphony","Booty Bass","Primus","Porn Groove","Satire","Slow Jam","Club","Tango",
  "Samba","Folklore","Ballad","Power Ballad","Rhythmic Soul","Freestyle","Duet","Punk Rock",
  "Drum Solo","A capella","Euro-House","Dance Hall"
];
da.util.GENRES[-1] = "Unknown";

})();


(function () {
var DocumentTemplate = da.db.DocumentTemplate,
    GENRES = da.util.GENRES;
/**
 *  class da.db.DocumentTemplate.Song < da.db.DocumentTemplate
 *  belongsTo: [[da.db.DocumentTemplate.Artist]], [[da.db.DocumentTemplate.Album]]
 *  
 *  #### Standard properties
 *  - `id` ([[String]]): Read-only cap of the file.
 *  - `title` ([[String]]): name of the song.
 *  - `track` ([[Numner]]): track number.
 *  - `year` ([[Number]]): year in which the track was published, `0` if the year
 *    is unkown.
 *  - `duration` ([[Number]]): length of the song in milliseconds.
 *  - `artist_id` ([[String]]): id of an [[da.db.DocumentTemplate.Artist]]
 *  - `album_id` ([[String]]): id of an [[da.db.DocumentTemplate.Album]]
 *  - `plays` ([[Number]]): number of full plays
 *  - `genre` ([[String]] | [[Number]]): id of the genre or name of the genre
 *    itself. If it's a number, it's a index of an [[da.util.GENRES]].
 *    `-1` if the genre isn't specified.
 *  - `mbid` ([[String]]): Musicbrainz ID
 *  - `lastfm_id` ([[String]]): Last.fm ID
 *
 **/

DocumentTemplate.registerType("Song", new Class({
  Extends: DocumentTemplate,
  
  belongsTo: {
    artist: "Artist",
    album: "Album"
  },

  /**
   *  da.db.DocumentTemplate.Song#getGenre() -> String
   *  Returns human-friendly name of the genre.
   **/
  getGenre: function () {
    return GENRES[this.get("genere")];
  }
}));

})();



/**
 *  class da.db.DocumentTemplate.Playlist < da.db.DocumentTemplate
 *
 *  Class representing playlists
 *
 *  #### Standard properties
 *  - `title` (String): name of the playlist.
 *  - `description` (String): a few words about the playlist.
 *  - `song_ids` (Array): list of ID's of songs belonging to the playlist.
 **/

(function () {
var DocumentTemplate = da.db.DocumentTemplate;

DocumentTemplate.registerType("Playlist", new Class({
  Extends: DocumentTemplate
}));

/*
DocumentTemplate.Playlist.findOrCreate({
  properties: {id: "offline", },
  onSuccess: function (offline_playlist, was_created) {
    if(was_created)
      offline_playlist.update({
        title:        "Offline",
        description:  "Songs on this playlist will be available even after you go offline."
      });
  }
});
*/

})();


/**
 *  == Controllers ==
 *  
 *  Controller classes control "background" jobs and user interface.
 **/

/** section: Controllers
 * da.controller
 **/
if(typeof da.controller === "undefined")
  da.controller = {};




(function () {
/** section: UserInterface
 *  class da.ui.Column
 *  implements Events, Options
 *  
 *  Widget which can efficiently display large amounts of items in a list.
 **/

var IDS = 0;
da.ui.Column = new Class({
  Implements: [Events, Options],
  
  options: {
    id:            null,
    rowHeight:     30,
    totalCount:     0,
    renderTimeout: 120
  },
  
  /**
   *  new da.ui.Column(options)
   *  - options.id (String): desired ID of the column's DIV element, `_column` will be appended.
   *    if ommited, random one will be generated.
   *  - options.rowHeight (Number): height of an row. Defaults to 30.
   *  - options.totalCount (Number): number of items this column has to show in total.
   *  - options.renderTimeout (Number): milliseconds to wait during the scroll before rendering
   *    items. Defaults to 120.
   *  
   *  Creates a new Column.
   *  
   *  ##### Notes
   *  When resizing (height) of the column use [[Element#set]] function provided by MooTools
   *  which properly fires `resize` event.
   *      
   *      column._el.set("height", window.getHeight());
   *  
   **/
  initialize: function (options) {
    this.setOptions(options);
    if(!this.options.id || !this.options.id.length)
      this.options.id = "duC_" + (IDS++);
    
    this._populated = false;
    // #_rendered will contain keys of items which have been rendered.
    // What is a key is up to particular implementation.
    this._rendered = [];
    
    this._el = new Element("div", {
      id: this.options.id + "_column",
      "class": "column",
      styles: {
        overflowX: "hidden",
        overflowY: "auto",
        position: "relative"
      }
    });
    
    // weight is used to force the browser
    // to show scrollbar with right proportions.
    this._weight = new Element("div", {
      styles: {
        position: "absolute",
        top:    0,
        left:   0,
        width:  1,
        height: 1
      }
    });
    this._weight.injectBottom(this._el);

    // scroll event is fired for even smallest changes
    // of scrollbar's position, since rendering items can be
    // expensive a small timeout will be set in order to save 
    // some bandwidth - the downside is that flickering will be seen
    // while scrolling.
    var timeout     = this.options.renderTimeout,
        timeout_fn  = this.render.bind(this),
        scroll_timer;

    this._el.addEvent("scroll", function () {
      clearTimeout(scroll_timer);
      scroll_timer = setTimeout(timeout_fn, timeout);
    });
    
    // We're caching lists' height so we won't have to
    // ask for it in every #render() - which can be quite expensive.
    this._el.addEvent("resize", function () {
      this._el_height = this._el.getHeight();
      this.render();
    }.bind(this));
  },
  
  /**
   *  da.ui.Column#render() -> this | false
   *  
   *  Renders all of items which are in current viewport in a batch.
   *  
   *  Returns `false` if all of items have already been rendered.
   *  
   *  Items are rendered in groups of (`div` tags with `column_items_box` CSS class).
   *  The number of items is determined by number of items which can fit in viewport + five
   *  items before and 10 items after current viewport.
   *  Each item has CSS classes defined in `options.itemClassNames` and have a `column_index`
   *  property stored.
   **/
  render: function () {
    if(!this._populated)
      this.populate();
    if(this._rendered.length === this.options.totalCount)
      return false;
    
    // We're pre-fetching previous 5 and next 10 items 
    // which are outside of current viewport
    var total_count = this.options.totalCount,
        ids = this.getVisibleIndexes(),
        n = Math.max(0, ids[0] - 6),
        m = Math.min(ids[1] + 10, total_count),
        first_rendered = -1,
        box;

    for( ; n < m; n++) {
      if(!this._rendered.contains(n)) {
        // First item in viewport could be already rendered,
        // by detecting the first item we're 'gonna render
        // helps minimizing amount of DOM nodes that will be inserted
        // (and avoids duplicaton).
        if(first_rendered === -1) {
          first_rendered = n;
          box = new Element("div", {"class": "column_items_box"});
        }

        this.renderItem(n)
            .addClass("column_item")
            .store("column_index", n)
            .injectBottom(box);
        this._rendered.push(n);
      }
    }
    
    if(first_rendered !== -1) {
      var coords = this.getBoxCoords(first_rendered);
      console.log("rendering box at", this.options.id, [first_rendered, m], coords);
      box.setStyles({
        position: "absolute",        
        top:      coords[1],
        left:     coords[0]
      }).injectBottom(this._el);
    }
    
    return this;
  },
  
  /**
   *  da.ui.Column#populate() -> this
   *  fires resize
   *  
   *  Positiones weight element and fires `resize` event. This method should ignore `_populated` property.
   **/
  populate: function () {
    var o = this.options;
    this._populated = true;
    this._weight.setStyle("top", o.rowHeight * o.totalCount);
    this._el.fireEvent("resize");
    
    return this;
  },
  
  /**
   *  da.ui.Column#rerender() -> this | false
   **/
  rerender: function () {
    if(!this._el)
      return false;
    
    var weight = this._weight;
    this._el.empty();
    this._el.grab(weight);
    
    this._rendered = [];
    this._populated = false;
    return this.render();
  },
  
  /**
   *  da.ui.Column#updateTotalCount(totalCount) -> this | false
   *  - totalCount (Number): total number of items this column is going to display
   *
   *  Provides means to update `totalCount` option after column has already been rendered/initialized.
   **/
  updateTotalCount: function (total_count) {
    this.options.totalCount = total_count;
    return this.populate();
  },
  
  /**
   *  da.ui.Column#renderItem(index) -> Element
   *  - index (Object): could be a String or Number, internal representation of data.
   *  
   *  Constructs and returns new Element without adding it to the `document`.
   **/
  renderItem: function(index) {
    console.warn("Column.renderItem(index) should be overwritten", this);
    return new Element("div", {html: index});
  },
  
  /**
   *  da.ui.Column#getBoxCoords(index) -> [Number, Number]
   *  - index (Number): index of the first item in a box.
   *  
   *  Returns X and Y coordinates at which item with given `index` should be rendered at.
   **/
  getBoxCoords: function(index) {
    return [0, this.options.rowHeight * index];
  },

  /**
   *  da.ui.Column#getVisibleIndexes() -> [first_visible_index, last_visible_index]
   *  
   *  Returns an array with indexes of first and last item in visible portion of list.
   **/
  getVisibleIndexes: function () {
    // Math.round() and Math.ceil() are used in such combination
    // to include items which could be only partially in viewport
    var rh           = this.options.rowHeight,
        first         = Math.ceil(this._el.getScroll().y / rh),
        per_viewport  = Math.round(this._el_height / rh);
    if(first > 0) first--;
    
    return [first, first + per_viewport];
  },

  /**
   *  da.ui.Column#injectBottom(element) -> this
   *  - element (Element): element to which column should be appended.
   *  
   *  Injects column at the bottom of provided element.
  **/
  injectBottom: function(el) {
    this._el.injectBottom(el);
    return this;
  },
  
  /**
   *  da.ui.Column#destory() -> this
   *  
   *  Removes column from DOM.
   **/
  destroy: function () {
    this._el.destroy();
    delete this._el;
    
    this._weight.destroy();
    delete this._weight;
    
    return this;
  },
  
  /**
   *  da.ui.Column#toElement() -> Element
   **/
  toElement: function () {
    return this._el;
  }
});

})();




/** section: UserInterface
 *  class da.ui.NavigationColumn < da.ui.Column
 *
 *  Extends Column class to provide common implementation of a navigation column.
 **/
da.ui.NavigationColumn = new Class({
  Extends: da.ui.Column,

  /**
   *  da.ui.NavigationColumn#view -> {map: $empty, finished: $empty}
   *
   *  Use this object to pass arguments to `Application.db.view()`.
   *
   *  If `view.finished` is left empty, it will be replaced with function which will
   *  render the list as soon as map/reduce proccess finishes.
   **/
  view: {
    map: function (doc, emit) {
      if(!this._passesFilter(doc))
        return false;

      if(doc._deleted)
        emit("_deleted", doc.id);
      else
        emit(doc.title, {
          title: doc.title || doc.id
        });
    },

    finished: $empty
  },

  options: {
    filter: null,
    killView: true
  },

  /**
   *  new da.ui.NavigationColumn([options])
   *  - options.filter (Object | Function): filtering object or function.
   *  - options.db (BrowserCouch): [[BrowserCouch]] database to use for views.
   *    Defaults to `Application.db`.
   *
   *  If `filter` is provided than it will be applied during the map/reduce proccess.
   *  If it's an [[Object]] than only documents with same properties as those
   *  in `filter` will be considered, and if it's an [[Function]],
   *  than it *must* return `true` if document should be passed to
   *  any aditional filters, or `false` if the document should be discarded.
   *  First argument of the `filter` function will be the document itself.
   *
   *  If the column lacks map/reduce view but `total_count` is present, [[da.ui.NavigationColumn#render]] will be called.
   *
   *  All other options are the same as for [[da.ui.Column]].
   **/
  initialize: function (options) {
    this.parent(options);
    this._el.addClass("navigation_column");

    // Small speed-hack
    if(!this.options.filter)
      this._passesFilter = function () { return true };

    this._el.addEvent("click:relay(.column_item)", this.click.bind(this));

    if(this.view) {
      this.view.map = this.view.map.bind(this);
      if(!this.view.finished || this.view.finished === $empty)
        this.view.finished = this.mapReduceFinished.bind(this);
      else
        this.view.finished = this.view.finished.bind(this);

      if(this.view.reduce)
        this.view.reduce = this.view.reduce.bind(this);
      if(!this.view.updated && !this.view.temporary)
        this.view.updated = this.mapReduceUpdated;
      if(this.view.updated)
        this.view.updated = this.view.updated.bind(this);

      (options.db || da.db.DEFAULT).view(this.view);
    } else if(this.options.totalCount) {
      this.injectBottom(this.options.parentElement || document.body);
      if(!this.options.renderImmediately)
        this.render();
    }
  },

  /**
   *  da.ui.NavigationColumn#mapReduceFinished(values) -> this
   *  - values (Object): an object with result rows and `findRow` function.
   *
   *  Function called when map/reduce proccess finishes, if not specified otherwise in view.
   *  This function will provide [[da.ui.NavigationColumn#getItem]], update `total_count` option and render the column.
   **/
  mapReduceFinished: function (values) {
    // BrowserCouch's findRow() needs rows to be sorted by id.
    this._rows = $A(values.rows);
    this._rows.sort(this.compareFunction);

    this.updateTotalCount(values.rows.length);
    this.injectBottom(this.options.parentElement || document.body);
    if(this.options.renderImmediately !== false)
      this.render();

    return this;
  },

  /**
   *  da.ui.NavigationColumn#mapReduceUpdated(values[, forceRerender = false]) -> this
   *  - values (Object): rows returned by map/reduce process.
   *
   *  Note that this will have to re-render the whole column, as it's possible
   *  that one of the new documents should be rendered in the middle of already
   *  rendered ones (due to sorting).
   **/
  mapReduceUpdated: function (values, rerender) {
    var new_rows = $A(da.db.DEFAULT.views[this.view.id].view.rows),
        active = this.getActiveItem();
    new_rows.sort(this.compareFunction);

    // Noting new was added, so we can simply re-render those elements
    if(!rerender && this.options.totalCount === new_rows.length) {
      values = values.rows;
      var n = values.length,
          id_prefix = this.options.id + "_column_item_",
          item, el, index;

      while(n--) {
        item = values[n];
        el = $(id_prefix + item.id);
        if(el) {
          index = el.retrieve("column_index");
          console.log("Rerendering item", id_prefix, index);

          this.renderItem(index)
            .addClass("column_item")
            .store("column_index", index)
            .replaces(el);
        }
      }

      this._rows = new_rows;
    } else {
      console.log("total count was changed, rerendering whole column", this.options.id);
      this.options.totalCount = new_rows.length;
      this._rows = new_rows;
      this.rerender();
    }

    if(active) {
      this._active_el = $(this.options.id + "_column_item_" + active.id);
      this._active_el.addClass("active_column_item");
    }
  },

  /**
   *  da.ui.NavigationColumn#getItem(index) -> Object
   *  - index (Number): index number of the item in the list.
   **/
  getItem: function (index) {
    return this._rows[index];
  },

  /**
   *  da.ui.NavigationColumn#getActiveItem() -> Object | undefined
   **/
  getActiveItem: function () {
    if(!this._active_el)
      return;

    return this.getItem(this._active_el.retrieve("column_index"));
  },

  /**
   *  da.ui.NavigationColumn#renderItem(index) -> Element
   *  - index (Number): position of the item that needs to be rendered.
   *
   *  This function relies on `title`, `subtitle` and `icon` properties from emitted documents.
   *
   *  #### Note
   *  If you are overwriting this method, make sure that the returned element has the `id` attribute
   *  that follows this convention:
   *
   *      this.options.id + "_column_item_" + item.id
   *
   *  Where `item.id` represents unique identifier of the item that is being rendered (not to be mistaken
   *  with `index` argument).
   *
   *  This is necessary for updating views which are bound to [[da.db.BrowserCouch]] views.
   *
   **/
  renderItem: function (index) {
    var item = this.getItem(index),
        data = this.getItem(index).value,
        el = new Element("a", {
          id:       this.options.id + "_column_item_" + item.id,
          href:     "#",
          title:    data.title,
          "class":  index%2 ? "even" : "odd"
        });

    if(data.icon)
      el.grab(new Element("img",  {src:  data.icon}));
    if(data.title)
      el.grab(new Element("span", {html: data.title,    "class": "title"}));
    if(data.subtitle)
      el.grab(new Element("span", {html: data.subtitle, "class": "subtitle"}));

    delete item;
    delete data;
    return el;
  },

  /**
   *  da.ui.NavigationColumn#createFilter(item) -> Object | Function
   *  - item (Object): one of the rendered objects, usually clicked one.
   *
   *  Returns an object with properties which will be required from
   *  on columns "below" this one.
   *
   *  If function is returned, than returned function will be called
   *  by Map/Reduce proccess on column "below" and should return `true`/`false`
   *  depending if the document meets criteria.
   *
   *  #### Examples
   *
   *      function createFilter (item) {
   *        return {artist_id: item.id}
   *      }
   *
   *      function createFilter(item) {
   *        var id = item.id;
   *        return function (doc) {
   *          return doc.chocolates.contains(id)
   *        }
   *      }
   *
   **/
  createFilter: function (item) {
    return {};
  },

  click: function (event, el) {
    var item = this.getItem(el.retrieve("column_index"));
    if(this._active_el)
      this._active_el.removeClass("active_column_item");

    this._active_el = el.addClass("active_column_item");
    this.fireEvent("click", [item, event, el], 1);

    return item;
  },

  /**
   *  da.ui.NavigationColumn#compareFunction(a, b) -> Number
   *  - a (Object): first document.
   *  - b (Object): second document.
   *
   *  Function used for sorting items returned by map/reduce proccess. Compares documents by their `title` property.
   *
   *  [See meanings of return values](https://developer.mozilla.org/en/Core_JavaScript_1.5_Reference/Objects/Array/sort#Description).
   **/
  compareFunction: function (a, b) {
    a = a && a.value ? a.value.title : -1;
    b = b && b.value ? b.value.title : -1;

    if(a < b) return -1;
    if(a > b) return 1;
    return 0;
  },

  destroy: function () {
    this.parent();
    delete this._rows;
    delete this._active_el;

    if(this.view && !this.view.temporary)
      if(this.options.killView)
        (this.options.db || da.db.DEFAULT).killView(this.view.id);
      else
        (this.options.db || da.db.DEFAULT).removeEvent("update." + this.view.id, this.view.updated);
  },

  _passesFilter: function (doc) {
    var filter = this.options.filter;
    if(!filter)
      return false;

    return (typeof(filter) === "object") ? Hash.containsAll(doc, filter) : filter(doc);
  }
});




(function () {
/**
 * Roar - Notifications
 *
 * Inspired by Growl
 *
 * @version		1.0.1
 *
 * @license		MIT-style license
 * @author		Harald Kirschner <mail [at] digitarald.de>
 * @copyright	Author
 */

var Roar = new Class({

	Implements: [Options, Events, Chain],

	options: {
		duration: 3000,
		position: 'upperLeft',
		container: null,
		bodyFx: null,
		itemFx: null,
		margin: {x: 10, y: 10},
		offset: 10,
		className: 'roar',
		onShow: $empty,
		onHide: $empty,
		onRender: $empty
	},

	initialize: function(options) {
		this.setOptions(options);
		this.items = [];
		this.container = $(this.options.container) || document;
	},

	alert: function(title, message, options) {
		var params = Array.link(arguments, {title: String.type, message: String.type, options: Object.type});
		var items = [new Element('h3', {'html': $pick(params.title, '')})];
		if (params.message) items.push(new Element('p', {'html': params.message}));
		return this.inject(items, params.options);
	},

	inject: function(elements, options) {
		if (!this.body) this.render();
		options = options || {};

		var offset = [-this.options.offset, 0];
		var last = this.items.getLast();
		if (last) {
			offset[0] = last.retrieve('roar:offset');
			offset[1] = offset[0] + last.offsetHeight + this.options.offset;
		}
		var to = {'opacity': 1};
		to[this.align.y] = offset;

		var item = new Element('div', {
			'class': this.options.className,
			'opacity': 0
		}).adopt(
			new Element('div', {
				'class': 'roar-bg',
				'opacity': 0.7
			}),
			elements
		);

		item.setStyle(this.align.x, 0).store('roar:offset', offset[1]).set('morph', $merge({
			unit: 'px',
			link: 'cancel',
			onStart: Chain.prototype.clearChain,
			transition: Fx.Transitions.Back.easeOut
		}, this.options.itemFx));

		var remove = this.remove.create({
			bind: this,
			arguments: [item],
			delay: 10
		});
		this.items.push(item.addEvent('click', remove));

		if (this.options.duration) {
			var over = false;
			var trigger = (function() {
				trigger = null;
				if (!over) remove();
			}).delay(this.options.duration);
			item.addEvents({
				mouseover: function() {
					over = true;
				},
				mouseout: function() {
					over = false;
					if (!trigger) remove();
				}
			});
		}
		item.inject(this.body).morph(to);
		return this.fireEvent('onShow', [item, this.items.length]);
	},

	remove: function(item) {
		var index = this.items.indexOf(item);
		if (index == -1) return this;
		this.items.splice(index, 1);
		item.removeEvents();
		var to = {opacity: 0};
		to[this.align.y] = item.getStyle(this.align.y).toInt() - item.offsetHeight - this.options.offset;
		item.morph(to).get('morph').chain(item.destroy.bind(item));
		return this.fireEvent('onHide', [item, this.items.length]).callChain(item);
	},

	empty: function() {
		while (this.items.length) this.remove(this.items[0]);
		return this;
	},

	render: function() {
		this.position = this.options.position;
		if ($type(this.position) == 'string') {
			var position = {x: 'center', y: 'center'};
			this.align = {x: 'left', y: 'top'};
			if ((/left|west/i).test(this.position)) position.x = 'left';
			else if ((/right|east/i).test(this.position)) this.align.x = position.x = 'right';
			if ((/upper|top|north/i).test(this.position)) position.y = 'top';
			else if ((/bottom|lower|south/i).test(this.position)) this.align.y = position.y = 'bottom';
			this.position = position;
		}
		this.body = new Element('div', {'class': 'roar-body'}).inject(document.body);
		if (Browser.Engine.trident4) this.body.addClass('roar-body-ugly');
		this.moveTo = this.body.setStyles.bind(this.body);
		this.reposition();
		if (this.options.bodyFx) {
			var morph = new Fx.Morph(this.body, $merge({
				unit: 'px',
				chain: 'cancel',
				transition: Fx.Transitions.Circ.easeOut
			}, this.options.bodyFx));
			this.moveTo = morph.start.bind(morph);
		}
		var repos = this.reposition.bind(this);
		window.addEvents({
			scroll: repos,
			resize: repos
		});
		this.fireEvent('onRender', this.body);
	},

	reposition: function() {
		var max = document.getCoordinates(), scroll = document.getScroll(), margin = this.options.margin;
		max.left += scroll.x;
		max.right += scroll.x;
		max.top += scroll.y;
		max.bottom += scroll.y;
		var rel = ($type(this.container) == 'element') ? this.container.getCoordinates() : max;
		this.moveTo({
			left: (this.position.x == 'right')
				? (Math.min(rel.right, max.right) - margin.x)
				: (Math.max(rel.left, max.left) + margin.x),
			top: (this.position.y == 'bottom')
				? (Math.min(rel.bottom, max.bottom) - margin.y)
				: (Math.max(rel.top, max.top) + margin.y)
		});
	}

});

/**
 *  class da.vendor.Roar
 *
 *  Roar notifications library.
 *
 *  #### Links
 *  * [Roar project page](http://digitarald.de/project/roar/)
 *
 **/

da.vendor.Roar = Roar;

/**
 *  da.ui.ROAR = da.vendor.Roar
 *
 *  The default instance of [[da.vendor.Roar]].
 *
 **/
da.ui.ROAR = new Roar({
  position: "lowerLeft"
});

})();


(function () {
/** section: Controllers
 *  class Settings
 * 
 *  #### Notes
 *  This is private class.
 *  Public interface is accessible via [[da.controller.Settings]].
 **/

var Dialog            = da.ui.Dialog,
    NavigationColumn  = da.ui.NavigationColumn,
    Setting           = da.db.DocumentTemplate.Setting;

var GROUPS = [{
  id: "caps",
  title: "Caps",
  description: "Tahoe caps for your music and configuration files."
}];

// Renderers are used to render the interface elements for each setting (ie. the input boxes, checkboxes etc.)
// Settings and renderers are bound together via "representAs" property which
// defaults to "text" for each setting.
// All renderer has to do is to renturn a DIV element with "setting_box" CSS class
// which contains an element with "setting_<setting name>" element.
// That same element will be passed to the matching serializer.

var RENDERERS = {
  _label: function (setting, details) {
    var container = new Element("div", {
      "class": "setting_box"
    });
    return container.grab(new Element("label", {
      text: details.title + ":",
      "for": "setting_" + setting.id
    }));
  },
  
  text: function (setting, details) {
    return this._label(setting, details).grab(new Element("input", {
      type: "text",
      id: "setting_" + setting.id,
      value: setting.get("value")
   }));
  },
  
  password: function (setting, details) {
    var text = this.text(setting, details);
    text.getElement("input").type = "password";
    return text;
  },
  
  checkbox: function (setting, details) {
    var control = this._label(setting, details);
    control.getElement("label").empty().grab(new Element("input", {
      id: "setting_" + setting.id,
      type: "checkbox"
    }));
    control.getElement("input").checked = setting.get("value");
    control.grab(new Element("label", {
      text: details.title,
      "class": "no_indent",
      "for": "setting_" + setting.id
    }));
    return control;
  }
};
RENDERERS.numeric = RENDERERS.text;

// Serializers do the opposite job of the one that renderers do,
// they take an element and return its value which will be then stored to the DB.
var SERIALIZERS = {
  text: function (input) {
    return input.value;
  },
  
  password: function (input) {
    return input.value;
  },
  
  numeric: function (input) {
    return +input.value;
  },
  
  checkbox: function (input) {
    return input.checked;
  }
};

var Settings = {
  initialize: function () {
    this.dialog = new Dialog({
      title: "Settings",
      html:  new Element("div", {id: "settings"}),
      hideOnOutsideClick: false,
      closeButton: true
    });
    this._el = $("settings");
    this.column = new GroupsColumn({
      parentElement: this._el
    });
    
    var select_message = new Element("div", {
      html: "Click on a group on the left.",
      "class": "message"
    });
    this._controls = new Element("div", {id: "settings_controls"});
    this._controls.grab(select_message);
    this._el.grab(this._controls);

    this.initialized = true;
  },

  /**
   *  Settings.show() -> this 
   *  Shows the settings panel.
   **/
  show: function () {
    this.dialog.show();
    if(!this._adjusted_height) {
      this._title_height = this._el.getElement(".dialog_title").getHeight();
      this.column.toElement().setStyle("height", 300 - this._title_height);
      this._controls.style.height = (300 - this._title_height) + "px";
      this._adjusted_height = true;
    }
    
    return this;
  },

  /**
   *  Settings.hide() -> this
   *  Hides the settings panel.
   **/
  hide: function () {
    this.dialog.hide();
    return this;
  },

  /**
   *  Settings.renderGroup(groupName) -> this
   *  - groupName (String) name of the settings group whose panel
   *    is about to be rendered.
   **/
  renderGroup: function (group) {
    Setting.find({
      properties: {group_id: group.id},
      onSuccess: function (settings) {
        Settings.renderSettings(group.value, settings); 
      }
    });
  },

  /**
   *  Settings.renderSettings(settings) -> false | this
   *  - settings ([Settin]): settings for which controls need to be rendered.
   *
   *  Calls the rendering functions for each setting.
   *  
   **/
  renderSettings: function (group, settings) {
    if(!settings.length)
      return false;    
    if(this._controls)
      this._controls.empty();

    settings.sort(positionSort);
    var container = new Element("div"),
        header    = new Element("p", {
          html: group.description,
          "class": "settings_header"
        }),
        footer    = new Element("div", {"class": "settings_footer no_selection"}),
        apply_button = new Element("input", {
          type: "button",
          value: "Apply",
          id: "save_settings",
          events: {click: function () { Settings.save() }}
        }),
        revert_button = new Element("input", {
          type: "button",
          value: "Revert",
          id: "revert_settings",
          events: {click: function () { Settings.renderSettings(group, settings) }}
        }),
        settings_el = new Element("form");

    container.grab(header);

    var n = settings.length, setting, details;
    while(n--) {
      setting = settings[n];
      details = Setting.getDetails(setting.id);      
      RENDERERS[details.representAs](setting, details).inject(settings_el, "top");
    }
  
    footer.adopt(revert_button, apply_button);    
    container.adopt(settings_el, footer);
    this._controls.grab(container); 
    return this;
  },
  
  save: function () {
    var settings = this.serialize(), setting;

    for(var id in settings)
      Setting.findById(id).update({value: settings[id]});
    
    da.ui.ROAR.alert("Saved", "Your settings have been saved");
  },
  
  serialize: function () {
    var values = this._controls.getElement("form").getElements("input[id^=setting_]"),
        serialized = {},
        // fun fact: in combo with el.id.slice is approx. x10 faster
        // than el.id.split("setting_")[1]
        setting_l = "setting_".length,
        n = values.length;
  
    while(n--) {
      var el = values[n],
          setting_name = el.id.slice(setting_l),
          details = Setting.getDetails(setting_name);
      serialized[setting_name] = SERIALIZERS[details.representAs](el);
    }
    
    return serialized;
  },
  
  /**
   *  Settings#free() -> undefined
   *
   *  About a minute after last [[da.controller.Settings.hide]] call,
   *  all DOM nodes created by settings dialog will be destroyes - thus
   *  freeing memory.
   *  
   **/
  free: function () {
    Settings.initialized = false;
  
    Settings.column.destroy();
    Settings.dialog.destroy();
  
    delete Settings.column;
    delete Settings.dialog;
    delete Settings._el;
    delete Settings._controls;
  }
};
$extend(Settings, new Events());

function positionSort(a, b) {
  a = Setting.getDetails(a.id).position;
  b = Setting.getDetails(b.id).position;
  
  return (a < b) ? -1 : ((a > b) ? 1 : 0);
}

var GroupsColumn = new Class({
  Extends: NavigationColumn,

  view: null,

  initialize: function (options) {
    options.totalCount = GROUPS.length; 
    this.parent(options);
    
    this.addEvent("click", function (item) {
      Settings.renderGroup(item);
    });
  },

  getItem: function (n) {
    var group = GROUPS[n];
    return {id: group.id, value: group};
  }
});

var destroy_timeout;
/**
 * da.controller.Settings
 *
 * Public interface of the settings controller.
 **/
da.controller.Settings = {
  /**
   *  da.controller.Settings.registerGroup(config) -> this
   *  - config.id (String): name of group.
   *  - config.title (String): human-friendly name of the group.
   *  - config.description (String): brief explanation of what this group is for.
   *    The description will be displayed at the top of settings dialog.
   **/
  registerGroup: function (config) {
    GROUPS.push(config);
    
    return this;
  },

  /**
   *  da.controller.Settings.addRenderer(name, renderer) -> this
   *  - name (String): name of the renderer.
   *    [[da.db.DocumentTemplate.Setting]] uses this in `representAs` property.
   *  - renderer (Function): function which renderes specific setting.
   *
   *  As first argument `renderer` function takes [[Setting]] object,
   *  while the second one is the result of [[da.db.DocumentTemplate.Setting.getDetails]].
   *
   *  The function *must* return an [[Element]] with `setting_box` CSS class name.
   *  The very same element *must* contain another element whose `id` attribute
   *  must mach following pattern: `setting_<setting id>`. ie. it should
   *  return something like:
   *
   *      <div class="setting_box">
   *        <label for="setting_first_name">Your name:</label>
   *        <input type="text" id="setting_first_name"/>
   *      </div>
   *
   *  That element will be passed to the serializer function.
   *
   *  #### Default renderers
   *  * `text`
   *  * `numeric` (same as `text`, the only difference is in the serializer
   *    which will convert value into [[Number]])
   *  * `password`
   *  * `checkbox`
   *
   **/
  addRenderer: function (name, fn) {
    if(!(name in RENDERERS))
      RENDERERS[name] = fn;
    
    return this;
  },
  
  /**
   *  da.controller.Settings.addSerializer(name, serializer) -> this
   *  - name (String): name of the serializer. Usually the same name used by matching renderer.
   *  - serializer (Function): function which returns value stored by rendered UI controls.
   *    Function takes exactly one argument, the `setting_<setting id>` element.
   **/
  addSerializer: function (name, serializer) {
    if(!(name in SERIALIZERS))
      SERIALIZERS[name] = serializer;
    
    return this;
  },
  
  /**
   *  da.controller.Settings.show() -> undefined
   *
   *  Shows the settings dialog.
   **/
  show: function () {
    clearTimeout(destroy_timeout);
    if(!Settings.initialized)
      Settings.initialize();
    
    Settings.show();
  },
  
  /**
   *  da.controller.Settings.hide() -> undefined
   *
   *  Hides the settings dialog.
   *  Changes to the settings are not automatically saved when dialog
   *  is dismissed.
   **/
  hide: function () {
    Settings.hide();
    destroy_timeout = setTimeout(Settings.free, 60*60*1000);
  },
  
  /**
   *  da.controller.Settings.showGroup(group) -> undefined
   *  - group (String): group's id.
   **/
  showGroup: function (group) {
    this.show();
    
    var n = GROUPS.length;
    while(n--)
      if(GROUPS[n].id === group)
        break;
    
    Settings.renderGroup({id: group, value: GROUPS[n]});
  }
};

da.app.fireEvent("ready.controller.Settings", [], 1);
})();



(function () {
var Menu = da.ui.Menu;
    
/** section: Controllers
 *  class NavigationColumnContainer
 *  
 *  Class for managing column views.
 *
 *  #### Notes
 *  This class is private.
 *  Public interface is accessible via [[da.controller.Navigation]].
 **/

var NavigationColumnContainer = new Class({
  /**
   *  new NavigationColumnContainer(options)
   *  - options.columnName (String): name of the column.
   *  - options.container (Element): container element.
   *  - options.header (Element): header element.
   *  - options.menu (UI.Menu): [[UI.Menu]] instance.
   *  
   *  Renders column and adds self to the [[da.controller.Navigation.activeColumns]].
   **/
   
  /**
    *  NavigationColumnContainer#column_name -> String
    *  Name of the column.
    **/
  
  /**
   *  NavigationColumnContainer#column -> NavigationColumn
   *  `column` here represents the list itself.
   **/
  
  /**
   *  NavigationColumnContainer#parent_column -> NavigationColumnContainer
   *  Usually column which created _this_ one. Visually, its the one to the left of _this_ one.
   **/
   
  /**
    *  NavigationColumnContainer#header -> Element
    *  Header element. It's an `a` tag with an `span` element.
    *  `a` tag has `column_header`, while `span` tag has `column_title` CSS class.
    **/
  
  /**
   *  NavigationColumnContainer#menu -> UI.Menu
   *  Container's [[UI.Menu]]. It can be also accesed with:
   *  
   *        this.header.retrieve("menu")
   **/
   
  /**
   *  NavigationColumnContainer#_el -> Element
   *  [[Element]] of the actual container. Has `column_container` CSS class.
   **/
  initialize: function (options) {
    this.column_name = options.columnName;
    this.parent_column = Navigation.activeColumns[Navigation.activeColumns.push(this) - 2];
    
    if(!(this._el = options.container))
      this.createContainer();

    if(!(this.header = options.header))
      this.createHeader();
    
    this.column = new Navigation.columns[this.column_name]({
      id:             this.column_name,
      filter:         options.filter,
      parentElement:  this._el,
      parentColumn:   this.parent_column ? this.parent_column.column : null
    });
    Navigation.adjustColumnSize(this.column);

    if(!(this.menu = options.menu))
      this.createMenu();
    else
      this.header.store("menu", this.menu);
    
    if(this.column.constructor.filters.length)
      this.column.addEvent("click", this.createFilteredColumn.bind(this));
    
    this._el.focus();
  },
  
  /**
   *  NavigationColumnContainer#createContainer() -> this
   *  
   *  Creates container element in `navigation_pane` [[Element]].
   **/
  createContainer: function () {
    $("navigation_pane").grab(this._el = new Element("div", {
      id: this.column_name + "_column_container",
      "class": "column_container no_selection"
    }));
    
    return this;
  },
  
  /**
   *  NavigationColumnContainer#createHeader() -> this
   *  
   *  Creates header element and attaches click event. Element is added to [[NavigationColumnContainer#toElement]].
   **/
  createHeader: function () {
    this.header = new Element("a", {
      "class":  "column_header",
      href:     "#"
    });
    
    this.header.addEvent("click", function (event) {
      var menu = this.retrieve("menu");
      if(menu)
        menu.show(event);
    });
    
    this._el.grab(this.header.grab(new Element("span", {
      html:     Navigation.columns[this.column_name].title,
      "class":  "column_title"
    })));
    
    return this;
  },
  
  /**
   *  NavigationColumnContainer#createMenu() -> this | false
   *  
   *  Creates menu for current column (if it has filters).
   *  [[da.ui.Menu]] instance is stored to `header` element with `menu` key.
   **/
  createMenu: function () {
    var filters = this.column.constructor.filters,
        items = {},
        column;
    
    if(!filters || !filters.length)
      return false;
    
    items[this.column_name] = {html: this.column.constructor.title, "class": "checked", href: "#"};
    for(var n = 0, m = filters.length; n < m; n++) {
      column = Navigation.columns[filters[n]];
      if(!column.hidden)
        items[filters[n]] = {html: column.title, href: "#"};
    }
    
    this.menu = new Menu({
      items: items
    });
    this.menu._el.addClass("navigation_menu");
    this.header.store("menu", this.menu);
    
    this.menu.addEvent("show", function () {      
      var header = this.header;
      header.addClass("active_menu");
      // adjusting menu's width to the width of the header
      header.retrieve("menu").toElement().style.width = header.getWidth() + "px";
    }.bind(this));
    
    this.menu.addEvent("hide", function () {
      this.header.removeClass("active_menu");
    }.bind(this));
    
    if(filters && filters.length)
      this.menu.addEvent("click", this.replace.bind(this.parent_column || this));
    
    return this;
  },
  
  /**
   *  NavigationColumnContainer#replace(filterName[, event][, element]) -> undefined
   *  - filterName (String): id of the menu item.
   *  - event (Event): DOM event.
   *  - element (Element): clicked menu item.
   *  
   *  Function called on menu click. If `filterName` is name of an actual filter then
   *  list in current column is replaced with a new one (provided by that filter).
   **/
  replace: function (filter_name, event, element) {
    if(!Navigation.columns[filter_name])
      return;
    
    var parent  = this.filter_column._el,
        header  = this.filter_column.header,
        menu    = this.filter_column.menu,
        filter  = this.filter_column.column.options.filter;
    
    // we need to keep the menu and header, since
    // all we need to do is to replace the list.
    // null-ifying those properties will make sure that
    // filter_column's destroy won't destroy them
    this.filter_column.menu = null;
    this.filter_column._el = null;
    this.filter_column.destroy();
    
    this.filter_column = new NavigationColumnContainer({
      columnName: filter_name,
      filter:     filter,
      container:  parent,
      header:     header,
      menu:       menu
    });
    
    if(menu.last_clicked)
      menu.last_clicked.removeClass("checked");
    if(element)
      element.addClass("checked");
    
    header.getElement(".column_title").set("text", Navigation.columns[filter_name].title);
  },
  
  /**
   *  NavigationColumnContainer#createFilteredColumn(item) -> undefined
   *  - item (Object): clicked item.
   *  
   *  Creates a new column after (on the right) this one with applied filter which
   *  is generated using the data of the clicked item.
   **/
  createFilteredColumn: function (item) {
    if(this.filter_column)
      this.filter_column.destroy();
    
    this.filter_column = new NavigationColumnContainer({
      columnName: this.column.constructor.filters[0],
      filter: this.column.createFilter(item)
    });
  },
  
  /**
   *  NavigationColumnContainer#destroy() -> this
   *  
   *  Destroys this column (including menu and header).
   *  Removes itself from [[da.controller.Navigation.activeColumns]].
   **/
  destroy: function () {
    if(this.filter_column) {
      this.filter_column.destroy();
      delete this.filter_column;
    }
    if(this.menu) {
      this.menu.destroy();
      delete this.menu;
    }
    if(this.column) {
      this.column.destroy();
      delete this.column;
    }
    if(this._el) {
      this._el.destroy();
      delete this._el;
    }
    
    Navigation.activeColumns.erase(this);
    
    return this;
  },
  
  /**
   *  NavigationColumnContainer#toElement() -> Element
   **/
  toElement: function () {
    return this._el;
  }
});

/** section: Controllers
 * da.controller.Navigation
 **/
var Navigation = {
  /**
   * da.controller.Navigation.columns
   *  
   * Contains all known columns.
   * 
   * #### Notes
   * Use [[da.controller.Navigation.registerColumn]] to add new ones,
   * *do not* add them manually. 
   **/
  columns: {},
  
  /**
   *  da.controller.Navigation.activeColumns -> [NavigationColumnContainer, ...]
   *  
   *  Array of currently active (visible) columns.
   *  The first column is always [[da.controller.Navigation.columns.Root]].
   **/
  activeColumns: [],
  
  initialize: function () {
    var root_column = new NavigationColumnContainer({columnName: "Root"});
    root_column.menu.removeItem("Root");
    
    var artists_column = new NavigationColumnContainer({
      columnName: "Artists",
      menu: root_column.menu
    });
    artists_column.header.store("menu", root_column.menu);
    root_column.filter_column = artists_column;
    root_column.header = artists_column.header;
    
    this._header_height = artists_column.header.getHeight();
    this._player_pane_width = $("player_pane").getWidth();
    window.addEvent("resize", function () {
      var columns = Navigation.activeColumns,
          n = columns.length,
          height = window.getHeight() - this._header_height,
          width = (window.getWidth() - $("player_pane").getWidth())/3 - 1;
      
      while(n--)
        columns[n].column._el.setStyles({
          height: height,
          width:  width
        }).fireEvent("resize");
      
      $("navigation_pane").style.height = window.getHeight() + "px";
    }.bind(this));
    
    window.fireEvent("resize");
  },
  
  /**
   *  da.controller.Navigation.adjustColumnSize(column) -> undefined
   *  - column (da.ui.NavigationColumn): column which needs size adjustment.
   *  
   *  Adjusts column's height to window.
   **/
  adjustColumnSize: function (column) {
    var el = column.toElement();
    el.style.height = (window.getHeight() - this._header_height) + "px";
      // -1 for te right border
    el.style.width = ((window.getWidth() - this._player_pane_width)/3 - 1) + "px";
    el.fireEvent("resize");
    el = null;
  },
  
  /**
   *  da.controller.Navigation.registerColumn(id[, title], filters, column) -> undefined
   *  - id (String): id of the column.
   *  - title (String): name of the column. Defaults to the value `id`, if not provided.
   *  - filters (Array): names of the columns which can accept filter created
   *    (with [[da.ui.NavigationColumn#createFilter]]) by this one.
   *  - column (da.ui.NavigationColumn): column class.
   *  
   *  #### Notes
   *  `title` and `filters` will be added to `column` as class properties.
   *  If the `id` begins with an underscore, the column will be considered private
   *  and it won't be visible in the menus.
   **/
  registerColumn: function (id, title, filters, col) {
    if(arguments.length === 3) {
      col     = filters;
      filters = title;
      title   = id;
    }
    col.extend({
      title:   title,
      filters: filters || [],
      hidden:  id[0] === "_"
    });
    
    this.columns[id] = col;
    if(id !== "Root")
      this.columns.Root.filters.push(id);
    
    // TODO: If Navigation is initialized
    // then Root's menu has to be updated.
  }
};

da.controller.Navigation = Navigation;
da.app.addEvent("ready", function () {
  Navigation.initialize();
});



(function () {
/**
 *  class da.vendor.SoundManager
 *  SoundManager2 class
 *  
 *  #### Links
 *  * http://www.schillmania.com/projects/soundmanager2/
 *  
 **/
/**
 * da.vendor.soundManager
 *  
 * Default instance of [[da.vendor.SoundManager]].
 *
 **/

// SoundManager depends on too much of window.* functions,
// thus making it in-efficient to load it inside another closure
// with da.vendor as alias for window.
/** @license
 * SoundManager 2: Javascript Sound for the Web
 * --------------------------------------------
 * http://schillmania.com/projects/soundmanager2/
 *
 * Copyright (c) 2007, Scott Schiller. All rights reserved.
 * Code provided under the BSD License:
 * http://schillmania.com/projects/soundmanager2/license.txt
 *
 * V2.96a.20100624
 */

/*jslint white: false, onevar: true, undef: true, nomen: false, eqeqeq: true, plusplus: false, bitwise: true, regexp: true, newcap: true, immed: true, regexp: false */
/*global SM2_DEFER, sm2Debugger, alert, console, document, navigator, setTimeout, window, document, setInterval, clearInterval, Audio */

(function(window) {

var soundManager = null;

function SoundManager(smURL, smID) {

  this.flashVersion = 8;             // version of flash to require, either 8 or 9. Some API features require Flash 9.
  this.debugMode = true;             // enable debugging output (div#soundmanager-debug, OR console if available+configured)
  this.debugFlash = false;           // enable debugging output inside SWF, troubleshoot Flash/browser issues
  this.useConsole = true;            // use firebug/safari console.log()-type debug console if available
  this.consoleOnly = false;          // if console is being used, do not create/write to #soundmanager-debug
  this.waitForWindowLoad = false;    // force SM2 to wait for window.onload() before trying to call soundManager.onload()
  this.nullURL = 'about:blank';      // path to "null" (empty) MP3 file, used to unload sounds (Flash 8 only)
  this.allowPolling = true;          // allow flash to poll for status update (required for whileplaying() events, peak, sound spectrum functions to work.)
  this.useFastPolling = false;       // uses lower flash timer interval for higher callback frequency, best combined with useHighPerformance
  this.useMovieStar = true;          // enable support for Flash 9.0r115+ (codename "MovieStar") MPEG4 audio+video formats (AAC, M4V, FLV, MOV etc.)
  this.bgColor = '#ffffff';          // movie (.swf) background color, '#000000' useful if showing on-screen/full-screen video etc.
  this.useHighPerformance = false;   // position:fixed flash movie can help increase js/flash speed, minimize lag
  this.flashLoadTimeout = 1000;      // msec to wait for flash movie to load before failing (0 = infinity)
  this.wmode = null;                 // mode to render the flash movie in - null, transparent, opaque (last two allow layering of HTML on top)
  this.allowFullScreen = true;       // enter full-screen (via double-click on movie) for flash 9+ video
  this.allowScriptAccess = 'always'; // for scripting the SWF (object/embed property), either 'always' or 'sameDomain'
  this.useFlashBlock = false;        // *requires flashblock.css, see demos* - allow recovery from flash blockers. Wait indefinitely and apply timeout CSS to SWF, if applicable.
  this.useHTML5Audio = false;        // EXPERIMENTAL IN-PROGRESS feature: Use HTML 5 Audio() where API is supported (most Safari, Chrome versions), Firefox (no MP3/MP4.) Ideally, transparent vs. Flash API where possible.
  this.html5Test = /^probably$/i;    // HTML5 Audio() canPlayType() test. /^(probably|maybe)$/i if you want to be more liberal/risky.

  this.audioFormats = {
    // determines HTML5 support, flash requirements
    // eg. if MP3 or MP4 required, Flash fallback is used if HTML5 can't play it
    // shotgun approach to MIME testing due to browser variance
    'mp3': {
      type: ['audio/mpeg; codecs="mp3"','audio/mpeg','audio/mp3','audio/MPA','audio/mpa-robust'],
      required: true
    }, 
    'mp4': {
      related: ['aac','m4a'], // additional formats under the MP4 container.
      type: ['audio/mp4; codecs="mp4a.40.2"','audio/aac','audio/x-m4a','audio/MP4A-LATM','audio/mpeg4-generic'],
      required: true
    },
    'ogg': {
      type: ['audio/ogg; codecs=vorbis'],
      required: false
    },
    'wav': {
      type: ['audio/wav; codecs="1"','audio/wav','audio/wave','audio/x-wav'],
      required: false
    }
  };

  this.defaultOptions = {
    'autoLoad': false,             // enable automatic loading (otherwise .load() will be called on demand with .play(), the latter being nicer on bandwidth - if you want to .load yourself, you also can)
    'stream': true,                // allows playing before entire file has loaded (recommended)
    'autoPlay': false,             // enable playing of file as soon as possible (much faster if "stream" is true)
    'loops': 1,                    // how many times to repeat the sound (position will wrap around to 0, setPosition() will break out of loop when >0)
    'onid3': null,                 // callback function for "ID3 data is added/available"
    'onload': null,                // callback function for "load finished"
    'whileloading': null,          // callback function for "download progress update" (X of Y bytes received)
    'onplay': null,                // callback for "play" start
    'onpause': null,               // callback for "pause"
    'onresume': null,              // callback for "resume" (pause toggle)
    'whileplaying': null,          // callback during play (position update)
    'onstop': null,                // callback for "user stop"
    'onfinish': null,              // callback function for "sound finished playing"
    'onbeforefinish': null,        // callback for "before sound finished playing (at [time])"
    'onbeforefinishtime': 5000,    // offset (milliseconds) before end of sound to trigger beforefinish (eg. 1000 msec = 1 second)
    'onbeforefinishcomplete': null,// function to call when said sound finishes playing
    'onjustbeforefinish': null,    // callback for [n] msec before end of current sound
    'onjustbeforefinishtime': 200, // [n] - if not using, set to 0 (or null handler) and event will not fire.
    'multiShot': true,             // let sounds "restart" or layer on top of each other when played multiple times, rather than one-shot/one at a time
    'multiShotEvents': false,      // fire multiple sound events (currently onfinish() only) when multiShot is enabled
    'position': null,              // offset (milliseconds) to seek to within loaded sound data.
    'pan': 0,                      // "pan" settings, left-to-right, -100 to 100
    'type': null,                  // MIME-like hint for file pattern / canPlay() tests, eg. audio/mp3
    'volume': 100                  // self-explanatory. 0-100, the latter being the max.
  };

  this.flash9Options = {      // flash 9-only options, merged into defaultOptions if flash 9 is being used
    'isMovieStar': null,      // "MovieStar" MPEG4 audio/video mode. Null (default) = auto detect MP4, AAC etc. based on URL. true = force on, ignore URL
    'usePeakData': false,     // enable left/right channel peak (level) data
    'useWaveformData': false, // enable sound spectrum (raw waveform data) - WARNING: CPU-INTENSIVE: may set CPUs on fire.
    'useEQData': false,       // enable sound EQ (frequency spectrum data) - WARNING: Also CPU-intensive.
    'onbufferchange': null,   // callback for "isBuffering" property change
    'ondataerror': null       // callback for waveform/eq data access error (flash playing audio in other tabs/domains)
  };

  this.movieStarOptions = { // flash 9.0r115+ MPEG4 audio/video options, merged into defaultOptions if flash 9+movieStar mode is enabled
    'onmetadata': null,     // callback for when video width/height etc. are received
    'useVideo': false,      // if loading movieStar content, whether to show video
    'bufferTime': 3,        // seconds of data to buffer before playback begins (null = flash default of 0.1 seconds - if AAC playback is gappy, try increasing.)
    'serverURL': null,      // rtmp: FMS or FMIS server to connect to, required when requesting media via RTMP or one of its variants
    'onconnect': null       // rtmp: callback for connection to flash media server
/*
    'duration': null,       // rtmp: song duration (msec)
    'totalbytes': null      // rtmp: byte size of the song
*/
  };

  this.version = null;
  this.versionNumber = 'V2.96a.20100624';
  this.movieURL = null;
  this.url = (smURL || null);
  this.altURL = null;
  this.swfLoaded = false;
  this.enabled = false;
  this.o = null;
  this.movieID = 'sm2-container';
  this.id = (smID || 'sm2movie');
  this.swfCSS = {
    swfDefault: 'movieContainer',
    swfError: 'swf_error', // SWF loaded, but SM2 couldn't start (other error)
    swfTimedout: 'swf_timedout',
    swfUnblocked: 'swf_unblocked', // or loaded OK
    sm2Debug: 'sm2_debug',
    highPerf: 'high_performance',
    flashDebug: 'flash_debug'
  };
  this.oMC = null;
  this.sounds = {};
  this.soundIDs = [];
  this.muted = false;
  this.isFullScreen = false; // set later by flash 9+
  this.isIE = (navigator.userAgent.match(/MSIE/i));
  this.isSafari = (navigator.userAgent.match(/safari/i));
  this.debugID = 'soundmanager-debug';
  this.debugURLParam = /([#?&])debug=1/i;
  this.specialWmodeCase = false;
  this.didFlashBlock = false;

  this.filePattern = null;
  this.filePatterns = {
    flash8: /\.mp3(\?.*)?$/i,
    flash9: /\.mp3(\?.*)?$/i
  };

  this.baseMimeTypes = /^\s*audio\/(?:x-)?(?:mp(?:eg|3))\s*(?:$|;)/i; // mp3
  this.netStreamMimeTypes = /^\s*audio\/(?:x-)?(?:mp(?:eg|3))\s*(?:$|;)/i; // mp3, mp4, aac etc.
  this.netStreamTypes = ['aac', 'flv', 'mov', 'mp4', 'm4v', 'f4v', 'm4a', 'mp4v', '3gp', '3g2']; // Flash v9.0r115+ "moviestar" formats
  this.netStreamPattern = new RegExp('\\.(' + this.netStreamTypes.join('|') + ')(\\?.*)?$', 'i');
  this.mimePattern = this.baseMimeTypes;

  this.features = {
    buffering: false,
    peakData: false,
    waveformData: false,
    eqData: false,
    movieStar: false
  };

  this.sandbox = {
    'type': null,
    'types': {
      'remote': 'remote (domain-based) rules',
      'localWithFile': 'local with file access (no internet access)',
      'localWithNetwork': 'local with network (internet access only, no local access)',
      'localTrusted': 'local, trusted (local+internet access)'
    },
    'description': null,
    'noRemote': null,
    'noLocal': null
  };

  this.hasHTML5 = null; // switch for handling logic
  this.html5 = { // stores canPlayType() results, etc. read-only.
    // mp3: boolean
    // mp4: boolean
    usingFlash: null // set if/when flash fallback is needed
  }; 
  this.ignoreFlash = false; // used for special cases (eg. iPad/iPhone/palm OS?)

  // --- private SM2 internals ---

  var SMSound,
  _s = this, _sm = 'soundManager', _id, _ua = navigator.userAgent, _wl = window.location.href.toString(), _fV = this.flashVersion, _doNothing, _init, _onready = [], _debugOpen = true, _debugTS, _didAppend = false, _appendSuccess = false, _didInit = false, _disabled = false, _windowLoaded = false, _wDS, _wdCount, _initComplete, _mergeObjects, _addOnReady, _processOnReady, _initUserOnload, _go, _waitForEI, _setVersionInfo, _handleFocus, _beginInit, _strings, _initMovie, _dcLoaded, _didDCLoaded, _getDocument, _createMovie, _setPolling, _debugLevels = ['log', 'info', 'warn', 'error'], _defaultFlashVersion = 8, _disableObject, _failSafely, _normalizeMovieURL, _oRemoved = null, _oRemovedHTML = null, _str, _flashBlockHandler, _getSWFCSS, _toggleDebug, _loopFix, _complain, _idCheck, _waitingForEI = false, _initPending = false, _smTimer, _onTimer, _startTimer, _stopTimer, _needsFlash = null, _featureCheck, _html5OK, _html5Only = false, _html5CanPlay, _html5Ext,  _dcIE, _testHTML5,
  _is_pre = _ua.match(/pre\//i),
  _iPadOrPhone = _ua.match(/(ipad|iphone)/i),
  _isMobile = (_ua.match(/mobile/i) || _is_pre || _iPadOrPhone),
  _hasConsole = (typeof console !== 'undefined' && typeof console.log !== 'undefined'),
  _isFocused = (typeof document.hasFocus !== 'undefined'?document.hasFocus():null),
  _tryInitOnFocus = (typeof document.hasFocus === 'undefined' && this.isSafari),
  _okToDisable = !_tryInitOnFocus;

  this._use_maybe = (_wl.match(/sm2\-useHTML5Maybe\=1/i)); // temporary feature: #sm2-useHTML5Maybe=1 forces loose canPlay() check
  this._overHTTP = (document.location?document.location.protocol.match(/http/i):null);
  this.useAltURL = !this._overHTTP; // use altURL if not "online"

  if (_iPadOrPhone || _is_pre) {
    // might as well force it on Apple + Palm, flash support unlikely
    _s.useHTML5Audio = true;
    _s.ignoreFlash = true;
  }

  if (_is_pre || this._use_maybe) {
    // less-strict canPlayType() checking option
    _s.html5Test = /^(probably|maybe)$/i;
  }

  // Temporary feature: allow force of HTML5 via URL: #sm2-usehtml5audio=0 or 1
  // <d>
  (function(){
    var a = '#sm2-usehtml5audio=', l = _wl, b = null;
    if (l.indexOf(a) !== -1) {
      b = (l.substr(l.indexOf(a)+a.length) === '1');
      if (typeof console !== 'undefined' && typeof console.log !== 'undefined') {
        console.log((b?'Enabling ':'Disabling ')+'useHTML5Audio via URL parameter');
      }
      _s.useHTML5Audio = b;
    }
  }());
  // </d>

  // --- public API methods ---

  this.supported = function() {
    return (_needsFlash?(_didInit && !_disabled):(_s.useHTML5Audio && _s.hasHTML5));
  };

  this.getMovie = function(smID) {
    return _s.isIE?window[smID]:(_s.isSafari?_id(smID) || document[smID]:_id(smID));
  };

  this.loadFromXML = function(sXmlUrl) {
    try {
      _s.o._loadFromXML(sXmlUrl);
    } catch(e) {
      _failSafely();
      return true;
    }
  };

  this.createSound = function(oOptions) {
    var _cs = 'soundManager.createSound(): ',
    thisOptions = null, oSound = null, _tO = null;
    if (!_didInit) {
      throw _complain(_cs + _str('notReady'), arguments.callee.caller);
    }
    if (arguments.length === 2) {
      // function overloading in JS! :) ..assume simple createSound(id,url) use case
      oOptions = {
        'id': arguments[0],
        'url': arguments[1]
      };
    }
    thisOptions = _mergeObjects(oOptions); // inherit SM2 defaults
    _tO = thisOptions; // alias
    // <d>
    if (_tO.id.toString().charAt(0).match(/^[0-9]$/)) {
      _s._wD(_cs + _str('badID', _tO.id), 2);
    }
    _s._wD(_cs + _tO.id + ' (' + _tO.url + ')', 1);
    // </d>
    if (_idCheck(_tO.id, true)) {
      _s._wD(_cs + _tO.id + ' exists', 1);
      return _s.sounds[_tO.id];
    }

    function make() {
      thisOptions = _loopFix(thisOptions);
      _s.sounds[_tO.id] = new SMSound(_tO);
      _s.soundIDs.push(_tO.id);
      return _s.sounds[_tO.id];
    }

    if (_html5OK(_tO)) {
      oSound = make();
      _s._wD('Loading sound '+_tO.id+' from HTML5');
      oSound._setup_html5(_tO);
    } else {
      if (_fV > 8 && _s.useMovieStar) {
        if (_tO.isMovieStar === null) {
          _tO.isMovieStar = ((_tO.serverURL || (_tO.type?_tO.type.match(_s.netStreamPattern):false)||_tO.url.match(_s.netStreamPattern))?true:false);
        }
        if (_tO.isMovieStar) {
          _s._wD(_cs + 'using MovieStar handling');
        }
        if (_tO.isMovieStar) {
          if (_tO.usePeakData) {
            _wDS('noPeak');
            _tO.usePeakData = false;
          }
          if (_tO.loops > 1) {
            _wDS('noNSLoop');
          }
        }
      }
      oSound = make();
      // flash AS2
      if (_fV === 8) {
        _s.o._createSound(_tO.id, _tO.onjustbeforefinishtime, _tO.loops||1);
      } else {
        _s.o._createSound(_tO.id, _tO.url, _tO.onjustbeforefinishtime, _tO.usePeakData, _tO.useWaveformData, _tO.useEQData, _tO.isMovieStar, (_tO.isMovieStar?_tO.useVideo:false), (_tO.isMovieStar?_tO.bufferTime:false), _tO.loops||1, _tO.serverURL, _tO.duration||null, _tO.totalBytes||null, _tO.autoPlay, true);
        if (!_tO.serverURL) {
          // We are connected immediately
          oSound.connected = true;
          if (_tO.onconnect) {
            _tO.onconnect.apply(oSound);
          }
        }
      }
    } 

    if (_tO.autoLoad || _tO.autoPlay) {
      if (oSound) {
        if (_s.isHTML5) {
          oSound.autobuffer = 'auto'; // early HTML5 implementation (non-standard)
          oSound.preload = 'auto'; // standard
        } else {
          oSound.load(_tO);
        }
      }
    }
    if (_tO.autoPlay) {
      oSound.play();
    }
    return oSound;
  };

  this.createVideo = function(oOptions) {
    var fN = 'soundManager.createVideo(): ';
    if (arguments.length === 2) {
      oOptions = {
        'id': arguments[0],
        'url': arguments[1]
      };
    }
    if (_fV >= 9) {
      oOptions.isMovieStar = true;
      oOptions.useVideo = true;
    } else {
      _s._wD(fN + _str('f9Vid'), 2);
      return false;
    }
    if (!_s.useMovieStar) {
      _s._wD(fN + _str('noMS'), 2);
    }
    return _s.createSound(oOptions);
  };

  this.destroySound = function(sID, bFromSound) {
    // explicitly destroy a sound before normal page unload, etc.
    if (!_idCheck(sID)) {
      return false;
    }
    for (var i = 0; i < _s.soundIDs.length; i++) {
      if (_s.soundIDs[i] === sID) {
        _s.soundIDs.splice(i, 1);
        continue;
      }
    }
    _s.sounds[sID].unload();
    if (!bFromSound) {
      // ignore if being called from SMSound instance
      _s.sounds[sID].destruct();
    }
    delete _s.sounds[sID];
  };

  this.destroyVideo = this.destroySound;

  this.load = function(sID, oOptions) {
    if (!_idCheck(sID)) {
      return false;
    }
    return _s.sounds[sID].load(oOptions);
  };

  this.unload = function(sID) {
    if (!_idCheck(sID)) {
      return false;
    }
    return _s.sounds[sID].unload();
  };

  this.play = function(sID, oOptions) {
    var fN = 'soundManager.play(): ';
    if (!_didInit) {
      throw _complain(fN + _str('notReady'), arguments.callee.caller);
    }
    if (!_idCheck(sID)) {
      if (!(oOptions instanceof Object)) {
        oOptions = {
          url: oOptions
        }; // overloading use case: play('mySound','/path/to/some.mp3');
      }
      if (oOptions && oOptions.url) {
        // overloading use case, creation+playing of sound: .play('someID',{url:'/path/to.mp3'});
        _s._wD(fN + 'attempting to create "' + sID + '"', 1);
        oOptions.id = sID;
        return _s.createSound(oOptions).play();
      } else {
        return false;
      }
    }
    return _s.sounds[sID].play(oOptions);
  };

  this.start = this.play; // just for convenience

  this.setPosition = function(sID, nMsecOffset) {
    if (!_idCheck(sID)) {
      return false;
    }
    return _s.sounds[sID].setPosition(nMsecOffset);
  };

  this.stop = function(sID) {
    if (!_idCheck(sID)) {
      return false;
    }
    _s._wD('soundManager.stop(' + sID + ')', 1);
    return _s.sounds[sID].stop();
  };

  this.stopAll = function() {
    _s._wD('soundManager.stopAll()', 1);
    for (var oSound in _s.sounds) {
      if (_s.sounds[oSound] instanceof SMSound) {
        _s.sounds[oSound].stop(); // apply only to sound objects
      }
    }
  };

  this.pause = function(sID) {
    if (!_idCheck(sID)) {
      return false;
    }
    return _s.sounds[sID].pause();
  };

  this.pauseAll = function() {
    for (var i = _s.soundIDs.length; i--;) {
      _s.sounds[_s.soundIDs[i]].pause();
    }
  };

  this.resume = function(sID) {
    if (!_idCheck(sID)) {
      return false;
    }
    return _s.sounds[sID].resume();
  };

  this.resumeAll = function() {
    for (var i = _s.soundIDs.length; i--;) {
      _s.sounds[_s.soundIDs[i]].resume();
    }
  };

  this.togglePause = function(sID) {
    if (!_idCheck(sID)) {
      return false;
    }
    return _s.sounds[sID].togglePause();
  };

  this.setPan = function(sID, nPan) {
    if (!_idCheck(sID)) {
      return false;
    }
    return _s.sounds[sID].setPan(nPan);
  };

  this.setVolume = function(sID, nVol) {
    if (!_idCheck(sID)) {
      return false;
    }
    return _s.sounds[sID].setVolume(nVol);
  };

  this.mute = function(sID) {
    var fN = 'soundManager.mute(): ',
    i = 0;
    if (typeof sID !== 'string') {
      sID = null;
    }
    if (!sID) {
      _s._wD(fN + 'Muting all sounds');
      for (i = _s.soundIDs.length; i--;) {
        _s.sounds[_s.soundIDs[i]].mute();
      }
      _s.muted = true;
    } else {
      if (!_idCheck(sID)) {
        return false;
      }
      _s._wD(fN + 'Muting "' + sID + '"');
      return _s.sounds[sID].mute();
    }
  };

  this.muteAll = function() {
    _s.mute();
  };

  this.unmute = function(sID) {
    var fN = 'soundManager.unmute(): ', i;
    if (typeof sID !== 'string') {
      sID = null;
    }
    if (!sID) {
      _s._wD(fN + 'Unmuting all sounds');
      for (i = _s.soundIDs.length; i--;) {
        _s.sounds[_s.soundIDs[i]].unmute();
      }
      _s.muted = false;
    } else {
      if (!_idCheck(sID)) {
        return false;
      }
      _s._wD(fN + 'Unmuting "' + sID + '"');
      return _s.sounds[sID].unmute();
    }
  };

  this.unmuteAll = function() {
    _s.unmute();
  };

  this.toggleMute = function(sID) {
    if (!_idCheck(sID)) {
      return false;
    }
    return _s.sounds[sID].toggleMute();
  };

  this.getMemoryUse = function() {
    if (_fV === 8) {
      // not supported in Flash 8
      return 0;
    }
    if (_s.o) {
      return parseInt(_s.o._getMemoryUse(), 10);
    }
  };

  this.disable = function(bNoDisable) {
    // destroy all functions
    if (typeof bNoDisable === 'undefined') {
      bNoDisable = false;
    }
    if (_disabled) {
      return false;
    }
    _disabled = true;
    _wDS('shutdown', 1);
    for (var i = _s.soundIDs.length; i--;) {
      _disableObject(_s.sounds[_s.soundIDs[i]]);
    }
    _initComplete(bNoDisable); // fire "complete", despite fail
    if (window.removeEventListener) {
      window.removeEventListener('load', _initUserOnload, false);
    }
    // _disableObject(_s); // taken out to allow reboot()
  };

  this.canPlayMIME = function(sMIME) {
    var result;
    if (_s.hasHTML5) {
      result = _html5CanPlay({type:sMIME});
    }
    if (!_needsFlash || result) {
      // no flash, or OK
      return result;
    } else {
      return (sMIME?(sMIME.match(_s.mimePattern)?true:false):null);
    }
  };

  this.canPlayURL = function(sURL) {
    var result;
    if (_s.hasHTML5) {
      result = _html5CanPlay(sURL);
    }
    if (!_needsFlash || result) {
      // no flash, or OK
      return result;
    } else {
      return (sURL?(sURL.match(_s.filePattern)?true:false):null);
    }
  };

  this.canPlayLink = function(oLink) {
    if (typeof oLink.type !== 'undefined' && oLink.type) {
      if (_s.canPlayMIME(oLink.type)) {
        return true;
      }
    }
    return _s.canPlayURL(oLink.href);
  };

  this.getSoundById = function(sID, suppressDebug) {
    if (!sID) {
      throw new Error('SoundManager.getSoundById(): sID is null/undefined');
    }
    var result = _s.sounds[sID];
    if (!result && !suppressDebug) {
      _s._wD('"' + sID + '" is an invalid sound ID.', 2);
      // soundManager._wD('trace: '+arguments.callee.caller);
    }
    return result;
  };

  this.onready = function(oMethod, oScope) {
    /*
    soundManager.onready(function(oStatus) {
      console.log('SM2 init success: '+oStatus.success);
    });
    */
    if (oMethod && oMethod instanceof Function) {
      if (_didInit) {
        _wDS('queue');
      }
      if (!oScope) {
        oScope = window;
      }
      _addOnReady(oMethod, oScope);
      _processOnReady();
      return true;
    } else {
      throw _str('needFunction');
    }
  };

  this.oninitmovie = function() {
    // called after SWF has been appended to the DOM via JS (or retrieved from HTML)
    // this is a stub for your own scripts.
  };

  this.onload = function() {
    // window.onload() equivalent for SM2, ready to create sounds etc.
    // this is a stub for your own scripts.
    _s._wD('soundManager.onload()', 1);
  };

  this.onerror = function() {
    // stub for user handler, called when SM2 fails to load/init
  };

  this.getMoviePercent = function() {
    return (_s.o && typeof _s.o.PercentLoaded !== 'undefined'?_s.o.PercentLoaded():null);
  };

  this._writeDebug = function(sText, sType, bTimestamp) {
    // pseudo-private console.log()-style output
    // <d>
    var sDID = 'soundmanager-debug', o, oItem, sMethod;
    if (!_s.debugMode) {
      return false;
    }
    if (typeof bTimestamp !== 'undefined' && bTimestamp) {
      sText = sText + ' | ' + new Date().getTime();
    }
    if (_hasConsole && _s.useConsole) {
      sMethod = _debugLevels[sType];
      if (typeof console[sMethod] !== 'undefined') {
        console[sMethod](sText);
      } else {
        console.log(sText);
      }
      if (_s.useConsoleOnly) {
        return true;
      }
    }
    try {
      o = _id(sDID);
      if (!o) {
        return false;
      }
      oItem = document.createElement('div');
      if (++_wdCount % 2 === 0) {
        oItem.className = 'sm2-alt';
      }
      // sText = sText.replace(/\n/g,'<br />');
      if (typeof sType === 'undefined') {
        sType = 0;
      } else {
        sType = parseInt(sType, 10);
      }
      oItem.appendChild(document.createTextNode(sText));
      if (sType) {
        if (sType >= 2) {
          oItem.style.fontWeight = 'bold';
        }
        if (sType === 3) {
          oItem.style.color = '#ff3333';
        }
      }
      // o.appendChild(oItem); // top-to-bottom
      o.insertBefore(oItem, o.firstChild); // bottom-to-top
    } catch(e) {
      // oh well
    }
    o = null;
    // </d>
  };
  this._wD = this._writeDebug; // alias

  this._debug = function() {
    // <d>
    _wDS('currentObj', 1);
    for (var i = 0, j = _s.soundIDs.length; i < j; i++) {
      _s.sounds[_s.soundIDs[i]]._debug();
    }
    // </d>
  };

  this.reboot = function() {
    // attempt to reset and init SM2
    _s._wD('soundManager.reboot()');
    if (_s.soundIDs.length) {
      _s._wD('Destroying ' + _s.soundIDs.length + ' SMSound objects...');
    }
    for (var i = _s.soundIDs.length; i--;) {
      _s.sounds[_s.soundIDs[i]].destruct();
    }
    // trash ze flash
    try {
      if (_s.isIE) {
        _oRemovedHTML = _s.o.innerHTML;
      }
      _oRemoved = _s.o.parentNode.removeChild(_s.o);
      _s._wD('Flash movie removed.');
    } catch(e) {
      // uh-oh.
      _wDS('badRemove', 2);
    }
    // actually, force recreate of movie.
    _oRemovedHTML = null;
    _oRemoved = null;
    _s.enabled = false;
    _didInit = false;
    _waitingForEI = false;
    _initPending = false;
    _didAppend = false;
    _appendSuccess = false;
    _disabled = false;
    _s.swfLoaded = false;
    _s.soundIDs = {};
    _s.sounds = [];
    _s.o = null;
    for (i = _onready.length; i--;) {
      _onready[i].fired = false;
    }
    _s._wD(_sm + ': Rebooting...');
    window.setTimeout(function() {
      _s.beginDelayedInit();
    }, 20);
  };

  this.destruct = function() {
    _s._wD('soundManager.destruct()');
    _s.disable(true);
  };

  this.beginDelayedInit = function() {
    // _s._wD('soundManager.beginDelayedInit()');
    _windowLoaded = true;
   _dcLoaded();
    setTimeout(_waitForEI, 500);
    setTimeout(_beginInit, 20);
  };

  // --- private SM2 internals ---

  _html5OK = function(iO) {
    return ((iO.type?_html5CanPlay({type:iO.type}):false)||_html5CanPlay(iO.url));
  };

  _html5CanPlay = function(sURL) {
    // try to find MIME, test and return truthiness
    if (!_s.useHTML5Audio || !_s.hasHTML5) {
      return false;
    }
    var result, mime, fileExt, item, aF = _s.audioFormats;
    if (!_html5Ext) {
      _html5Ext = [];
      for (item in aF) {
        if (aF.hasOwnProperty(item)) {
          _html5Ext.push(item);
          if (aF[item].related) {
            _html5Ext = _html5Ext.concat(aF[item].related);
          }
        }
      }
      _html5Ext = new RegExp('\\.('+_html5Ext.join('|')+')','i');
    }
    mime = (typeof sURL.type !== 'undefined'?sURL.type:null);
    fileExt = (typeof sURL === 'string'?sURL.toLowerCase().match(_html5Ext):null); // TODO: Strip URL queries, etc.
    if (!fileExt || !fileExt.length) {
      if (!mime) {
        return false;
      }
    } else {
      fileExt = fileExt[0].substr(1); // "mp3", for example
    }
    if (fileExt && typeof _s.html5[fileExt] !== 'undefined') {
      // result known
      return _s.html5[fileExt];
    } else {
      if (!mime) {
        if (fileExt && _s.html5[fileExt]) {
          return _s.html5[fileExt];
        } else {
          // best-case guess, audio/whatever-dot-filename-format-you're-playing
          mime = 'audio/'+fileExt;
        }
      }
      result = _s.html5.canPlayType(mime);
      _s.html5[fileExt] = result;
      // _s._wD('canPlayType, found result: '+result);
      return result;
    }
  };

  _testHTML5 = function() {
    if (!_s.useHTML5Audio || typeof Audio === 'undefined') {
      return false;
    }
    var a = (typeof Audio !== 'undefined' ? new Audio():null), item, support = {}, aF, i;

    function _cp(m) {
      var canPlay, i, j, isOK = false;
      if (!a || typeof a.canPlayType !== 'function') {
        return false;
      }
      if (m instanceof Array) {
        // iterate through all mime types, return any successes
        for (i=0, j=m.length; i<j && !isOK; i++) {
          if (_s.html5[m[i]] || a.canPlayType(m[i]).match(_s.html5Test)) {
            isOK = true;
            _s.html5[m[i]] = true;
          }
        }
        return isOK;
      } else {
        canPlay = (a && typeof a.canPlayType === 'function' ? a.canPlayType(m) : false);
        return (canPlay && (canPlay.match(_s.html5Test)?true:false));
      }
    }

    // test all registered formats + codecs
    aF = _s.audioFormats;
    for (item in aF) {
      if (aF.hasOwnProperty(item)) {
        support[item] = _cp(aF[item].type);
        // assign result to related formats, too
        if (aF[item] && aF[item].related) {
          for (i=0; i<aF[item].related.length; i++) {
            _s.html5[aF[item].related[i]] = support[item];
          }
        }
      }
    }
    support.canPlayType = (a?_cp:null);

    _s.html5 = _mergeObjects(_s.html5, support);

  };

  _strings = {
    notReady: 'Not loaded yet - wait for soundManager.onload() before calling sound-related methods',
    appXHTML: _sm + '::createMovie(): appendChild/innerHTML set failed. May be app/xhtml+xml DOM-related.',
    spcWmode: _sm + '::createMovie(): Removing wmode, preventing win32 below-the-fold SWF loading issue',
    swf404: _sm + ': Verify that %s is a valid path.',
    tryDebug: 'Try ' + _sm + '.debugFlash = true for more security details (output goes to SWF.)',
    checkSWF: 'See SWF output for more debug info.',
    localFail: _sm + ': Non-HTTP page (' + document.location.protocol + ' URL?) Review Flash player security settings for this special case:\nhttp://www.macromedia.com/support/documentation/en/flashplayer/help/settings_manager04.html\nMay need to add/allow path, eg. c:/sm2/ or /users/me/sm2/',
    waitFocus: _sm + ': Special case: Waiting for focus-related event..',
    waitImpatient: _sm + ': Getting impatient, still waiting for Flash%s...',
    waitForever: _sm + ': Waiting indefinitely for Flash (will recover if unblocked)...',
    needFunction: _sm + '.onready(): Function object expected',
    badID: 'Warning: Sound ID "%s" should be a string, starting with a non-numeric character',
    fl9Vid: 'flash 9 required for video. Exiting.',
    noMS: 'MovieStar mode not enabled. Exiting.',
    currentObj: '--- ' + _sm + '._debug(): Current sound objects ---',
    waitEI: _sm + '::initMovie(): Waiting for ExternalInterface call from Flash..',
    waitOnload: _sm + ': Waiting for window.onload()',
    docLoaded: _sm + ': Document already loaded',
    onload: _sm + '::initComplete(): calling soundManager.onload()',
    onloadOK: _sm + '.onload() complete',
    init: '-- ' + _sm + '::init() --',
    didInit: _sm + '::init(): Already called?',
    flashJS: _sm + ': Attempting to call Flash from JS..',
    noPolling: _sm + ': Polling (whileloading()/whileplaying() support) is disabled.',
    secNote: 'Flash security note: Network/internet URLs will not load due to security restrictions. Access can be configured via Flash Player Global Security Settings Page: http://www.macromedia.com/support/documentation/en/flashplayer/help/settings_manager04.html',
    badRemove: 'Warning: Failed to remove flash movie.',
    noPeak: 'Warning: peakData features unsupported for movieStar formats',
    shutdown: _sm + '.disable(): Shutting down',
    queue: _sm + '.onready(): Queueing handler',
    smFail: _sm + ': Failed to initialise.',
    smError: 'SMSound.load(): Exception: JS-Flash communication failed, or JS error.',
    fbTimeout: 'No flash response, applying .'+_s.swfCSS.swfTimedout+' CSS..',
    fbLoaded: 'Flash loaded',
    manURL: 'SMSound.load(): Using manually-assigned URL',
    onURL: _sm + '.load(): current URL already assigned.',
    badFV: 'soundManager.flashVersion must be 8 or 9. "%s" is invalid. Reverting to %s.',
    as2loop: 'Note: Setting stream:false so looping can work (flash 8 limitation)',
    noNSLoop: 'Note: Looping not implemented for MovieStar formats',
    needfl9: 'Note: Switching to flash 9, required for MP4 formats.'
  };

  _id = function(sID) {
    return document.getElementById(sID);
  };

  _wdCount = 0;

  _str = function() { // o [,items to replace]
    var params = Array.prototype.slice.call(arguments), // real array, please
    o = params.shift(), // first arg
    str = (_strings && _strings[o]?_strings[o]:''), i, j;
    if (str && params && params.length) {
      for (i = 0, j = params.length; i < j; i++) {
        str = str.replace('%s', params[i]);
      }
    }
    return str;
  };

  _loopFix = function(sOpt) {
    // flash 8 requires stream = false for looping to work.
    if (_fV === 8 && sOpt.loops > 1 && sOpt.stream) {
      _wDS('as2loop');
      sOpt.stream = false;
    }
    return sOpt;
  };

  _complain = function(sMsg, oCaller) {
    // Try to create meaningful custom errors, w/stack trace to the "offending" line
    var sPre = 'Error: ', errorDesc;
    if (!oCaller) {
      return new Error(sPre + sMsg);
    }
    if (typeof console !== 'undefined' && typeof console.trace !== 'undefined') {
      console.trace();
    }
    errorDesc = sPre + sMsg + '. \nCaller: ' + oCaller.toString();
    // See JS error/debug/console output for real error source, stack trace / message detail where possible.
    return new Error(errorDesc);
  };

  _doNothing = function() {
    return false;
  };

  _disableObject = function(o) {
    for (var oProp in o) {
      if (o.hasOwnProperty(oProp) && typeof o[oProp] === 'function') {
        o[oProp] = _doNothing;
      }
    }
    oProp = null;
  };

  _failSafely = function(bNoDisable) {
    // general failure exception handler
    if (typeof bNoDisable === 'undefined') {
      bNoDisable = false;
    }
    if (_disabled || bNoDisable) {
      _wDS('smFail', 2);
      _s.disable(bNoDisable);
    }
  };

  _normalizeMovieURL = function(smURL) {
    var urlParams = null;
    if (smURL) {
      if (smURL.match(/\.swf(\?\.*)?$/i)) {
        urlParams = smURL.substr(smURL.toLowerCase().lastIndexOf('.swf?') + 4);
        if (urlParams) {
          return smURL; // assume user knows what they're doing
        }
      } else if (smURL.lastIndexOf('/') !== smURL.length - 1) {
        smURL = smURL + '/';
      }
    }
    return (smURL && smURL.lastIndexOf('/') !== - 1?smURL.substr(0, smURL.lastIndexOf('/') + 1):'./') + _s.movieURL;
  };

  _setVersionInfo = function() {
    if (_fV !== 8 && _fV !== 9) {
      _s._wD(_str('badFV', _fV, _defaultFlashVersion));
      _s.flashVersion = _defaultFlashVersion;
    }
    var isDebug = (_s.debugMode || _s.debugFlash?'_debug.swf':'.swf'); // debug flash movie, if applicable
    if (_s.flashVersion < 9 && _s.useHTML5Audio && _s.audioFormats.mp4.required) {
      _s._wD(_str('needfl9'));
      _s.flashVersion = 9;
    }
    _fV = _s.flashVersion; // short-hand for internal use
    _s.version = _s.versionNumber + (_html5Only?' (HTML5-only mode)':(_fV === 9?' (AS3/Flash 9)':' (AS2/Flash 8)'));
    // set up default options
    if (_fV > 8) {
      _s.defaultOptions = _mergeObjects(_s.defaultOptions, _s.flash9Options);
      _s.features.buffering = true;
    }
    if (_fV > 8 && _s.useMovieStar) {
      // flash 9+ support for movieStar formats as well as MP3
      _s.defaultOptions = _mergeObjects(_s.defaultOptions, _s.movieStarOptions);
      _s.filePatterns.flash9 = new RegExp('\\.(mp3|' + _s.netStreamTypes.join('|') + ')(\\?.*)?$', 'i');
      _s.mimePattern = _s.netStreamMimeTypes;
      _s.features.movieStar = true;
    } else {
      _s.features.movieStar = false;
    }
    _s.filePattern = _s.filePatterns[(_fV !== 8?'flash9':'flash8')];
    _s.movieURL = (_fV === 8?'soundmanager2.swf':'soundmanager2_flash9.swf').replace('.swf',isDebug);
    _s.features.peakData = _s.features.waveformData = _s.features.eqData = (_fV > 8);
  };

  _getDocument = function() {
    return (document.body?document.body:(document.documentElement?document.documentElement:document.getElementsByTagName('div')[0]));
  };

  _setPolling = function(bPolling, bHighPerformance) {
    if (!_s.o || !_s.allowPolling) {
      return false;
    }
    _s.o._setPolling(bPolling, bHighPerformance);
  };

  function _initDebug() {
    if (_s.debugURLParam.test(_wl)) {
      _s.debugMode = true; // allow force of debug mode via URL
    }
    // <d>
    var oD, oDebug, oTarget, oToggle, tmp;
    if (_s.debugMode) {

      oD = document.createElement('div');
      oD.id = _s.debugID + '-toggle';
      oToggle = {
        position: 'fixed',
        bottom: '0px',
        right: '0px',
        width: '1.2em',
        height: '1.2em',
        lineHeight: '1.2em',
        margin: '2px',
        textAlign: 'center',
        border: '1px solid #999',
        cursor: 'pointer',
        background: '#fff',
        color: '#333',
        zIndex: 10001
      };

      oD.appendChild(document.createTextNode('-'));
      oD.onclick = _toggleDebug;
      oD.title = 'Toggle SM2 debug console';

      if (_ua.match(/msie 6/i)) {
        oD.style.position = 'absolute';
        oD.style.cursor = 'hand';
      }

      for (tmp in oToggle) {
        if (oToggle.hasOwnProperty(tmp)) {
          oD.style[tmp] = oToggle[tmp];
        }
      }

    }
    if (_s.debugMode && !_id(_s.debugID) && ((!_hasConsole || !_s.useConsole) || (_s.useConsole && _hasConsole && !_s.consoleOnly))) {
      oDebug = document.createElement('div');
      oDebug.id = _s.debugID;
      oDebug.style.display = (_s.debugMode?'block':'none');
      if (_s.debugMode && !_id(oD.id)) {
        try {
          oTarget = _getDocument();
          oTarget.appendChild(oD);
        } catch(e2) {
          throw new Error(_str('appXHTML'));
        }
        oTarget.appendChild(oDebug);
      }
    }
    oTarget = null;
    _initDebug = function(){}; // one-time function
    // </d>
  }

  _createMovie = function(smID, smURL) {

    var specialCase = null,
    remoteURL = (smURL?smURL:_s.url),
    localURL = (_s.altURL?_s.altURL:remoteURL),
    oEmbed, oMovie, oTarget, tmp, movieHTML, oEl, extraClass, s, x, sClass, side = '100%';
    smID = (typeof smID === 'undefined'?_s.id:smID);
    if (_didAppend && _appendSuccess) {
      return false; // ignore if already succeeded
    }

    function _initMsg() {
      _s._wD('-- SoundManager 2 ' + _s.version + (!_html5Only && _s.useHTML5Audio?(_s.hasHTML5?' + HTML5 audio':', no HTML5 audio support'):'') + (_s.useMovieStar?', MovieStar mode':'') + (_s.useHighPerformance?', high performance mode, ':', ') + ((_s.useFastPolling?'fast':'normal') + ' polling') + (_s.wmode?', wmode: ' + _s.wmode:'') + (_s.debugFlash?', flash debug mode':'') + (_s.useFlashBlock?', flashBlock mode':'') + ' --', 1);
    }
    if (_html5Only) {
      _setVersionInfo();
      _initMsg();
      _s.oMC = _id(_s.movieID);
      _init();
      // prevent multiple init attempts
      _didAppend = true;
      _appendSuccess = true;
      return false;
    }

    _didAppend = true;

    // safety check for legacy (change to Flash 9 URL)
    _setVersionInfo();
    _s.url = _normalizeMovieURL(this._overHTTP?remoteURL:localURL);
    smURL = _s.url;

    if (_s.useHighPerformance && _s.useMovieStar && _s.defaultOptions.useVideo === true) {
      specialCase = 'soundManager note: disabling highPerformance, not applicable with movieStar mode+useVideo';
      _s.useHighPerformance = false;
    }

    _s.wmode = (!_s.wmode && _s.useHighPerformance && !_s.useMovieStar?'transparent':_s.wmode);

    // TODO: revisit
    // if (_s.wmode !== null && _s.flashLoadTimeout !== 0 && (!_s.useHighPerformance || _s.debugFlash) && !_s.isIE && navigator.platform.match(/win32/i)) {

    if (_s.wmode !== null && !_s.isIE && !_s.useHighPerformance && navigator.platform.match(/win32/i)) {
      _s.specialWmodeCase = true;
      // extra-special case: movie doesn't load until scrolled into view when using wmode = anything but 'window' here
      // does not apply when using high performance (position:fixed means on-screen), OR infinite flash load timeout
      _wDS('spcWmode');
      _s.wmode = null;
    }

    if (_fV === 8) {
      _s.allowFullScreen = false;
    }

    oEmbed = {
      name: smID,
      id: smID,
      src: smURL,
      width: side,
      height: side,
      quality: 'high',
      allowScriptAccess: _s.allowScriptAccess,
      bgcolor: _s.bgColor,
      pluginspage: 'http://www.macromedia.com/go/getflashplayer',
      type: 'application/x-shockwave-flash',
      wmode: _s.wmode,
      allowfullscreen: (_s.allowFullScreen?'true':'false')
    };

    if (_s.debugFlash) {
      oEmbed.FlashVars = 'debug=1';
    }

    if (!_s.wmode) {
      delete oEmbed.wmode; // don't write empty attribute
    }

    if (_s.isIE) {
      // IE is "special".
      oMovie = document.createElement('div');
      movieHTML = '<object id="' + smID + '" data="' + smURL + '" type="' + oEmbed.type + '" width="' + oEmbed.width + '" height="' + oEmbed.height + '"><param name="movie" value="' + smURL + '" /><param name="AllowScriptAccess" value="' + _s.allowScriptAccess + '" /><param name="quality" value="' + oEmbed.quality + '" />' + (_s.wmode?'<param name="wmode" value="' + _s.wmode + '" /> ':'') + '<param name="bgcolor" value="' + _s.bgColor + '" /><param name="allowFullScreen" value="' + oEmbed.allowFullScreen + '" />' + (_s.debugFlash?'<param name="FlashVars" value="' + oEmbed.FlashVars + '" />':'') + '<!-- --></object>';
    } else {
      oMovie = document.createElement('embed');
      for (tmp in oEmbed) {
        if (oEmbed.hasOwnProperty(tmp)) {
          oMovie.setAttribute(tmp, oEmbed[tmp]);
        }
      }
    }

    _initDebug();

    extraClass = _getSWFCSS();
    oTarget = _getDocument();

    if (oTarget) {
      _s.oMC = _id(_s.movieID)?_id(_s.movieID):document.createElement('div');
      if (!_s.oMC.id) {
        _s.oMC.id = _s.movieID;
        _s.oMC.className = _s.swfCSS.swfDefault + ' ' + extraClass;
        // "hide" flash movie
        s = null;
        oEl = null;
        if (!_s.useFlashBlock) {
          if (_s.useHighPerformance) {
            s = {
              position: 'fixed',
              width: '8px',
              height: '8px',
              // >= 6px for flash to run fast, >= 8px to start up under Firefox/win32 in some cases. odd? yes.
              bottom: '0px',
              left: '0px',
              overflow: 'hidden'
              // zIndex:-1 // sit behind everything else - potentially dangerous/buggy?
            };
          } else {
            s = {
              position: 'absolute',
              width: '6px',
              height: '6px',
              top: '-9999px',
              left: '-9999px'
            };
          }
        }
        x = null;
        if (!_s.debugFlash) {
          for (x in s) {
            if (s.hasOwnProperty(x)) {
              _s.oMC.style[x] = s[x];
            }
          }
        }
        try {
          if (!_s.isIE) {
            _s.oMC.appendChild(oMovie);
          }
          oTarget.appendChild(_s.oMC);
          if (_s.isIE) {
            oEl = _s.oMC.appendChild(document.createElement('div'));
            oEl.className = 'sm2-object-box';
            oEl.innerHTML = movieHTML;
          }
          _appendSuccess = true;
        } catch(e) {
          throw new Error(_str('appXHTML'));
        }
      } else {
        // it's already in the document.
        sClass = _s.oMC.className;
        _s.oMC.className = (sClass?sClass+' ':_s.swfCSS.swfDefault) + (extraClass?' '+extraClass:'');
        _s.oMC.appendChild(oMovie);
        if (_s.isIE) {
          oEl = _s.oMC.appendChild(document.createElement('div'));
          oEl.className = 'sm2-object-box';
          oEl.innerHTML = movieHTML;
        }
        _appendSuccess = true;
      }
    }

    if (specialCase) {
      _s._wD(specialCase);
    }

    _initMsg();
    _s._wD('soundManager::createMovie(): Trying to load ' + smURL + (!this._overHTTP && _s.altURL?' (alternate URL)':''), 1);

  };

  _idCheck = this.getSoundById;

  // <d>
  _wDS = function(o, errorLevel) {
    if (!o) {
      return '';
    } else {
      return _s._wD(_str(o), errorLevel);
    }
  };

  if (_wl.indexOf('debug=alert') + 1 && _s.debugMode) {
    _s._wD = function(sText) {alert(sText);};
  }

  _toggleDebug = function() {
    var o = _id(_s.debugID),
    oT = _id(_s.debugID + '-toggle');
    if (!o) {
      return false;
    }
    if (_debugOpen) {
      // minimize
      oT.innerHTML = '+';
      o.style.display = 'none';
    } else {
      oT.innerHTML = '-';
      o.style.display = 'block';
    }
    _debugOpen = !_debugOpen;
  };

  _debugTS = function(sEventType, bSuccess, sMessage) {
    // troubleshooter debug hooks
    if (typeof sm2Debugger !== 'undefined') {
      try {
        sm2Debugger.handleEvent(sEventType, bSuccess, sMessage);
      } catch(e) {
        // oh well  
      }
    }
  };
  // </d>

  _mergeObjects = function(oMain, oAdd) {
    // non-destructive merge
    var o1 = {}, // clone o1
    i, o2, o;
    for (i in oMain) {
      if (oMain.hasOwnProperty(i)) {
        o1[i] = oMain[i];
      }
    }
    o2 = (typeof oAdd === 'undefined'?_s.defaultOptions:oAdd);
    for (o in o2) {
      if (o2.hasOwnProperty(o) && typeof o1[o] === 'undefined') {
        o1[o] = o2[o];
      }
    }
    return o1;
  };

  _initMovie = function() {
    if (_html5Only) {
      _createMovie();
      return false;
    }
    // attempt to get, or create, movie
    if (_s.o) {
      return false; // may already exist
    }
    _s.o = _s.getMovie(_s.id); // (inline markup)
    if (!_s.o) {
      if (!_oRemoved) {
        // try to create
        _createMovie(_s.id, _s.url);
      } else {
        // try to re-append removed movie after reboot()
        if (!_s.isIE) {
          _s.oMC.appendChild(_oRemoved);
        } else {
          _s.oMC.innerHTML = _oRemovedHTML;
        }
        _oRemoved = null;
        _didAppend = true;
      }
      _s.o = _s.getMovie(_s.id);
    }
    if (_s.o) {
      _s._wD('soundManager::initMovie(): Got '+_s.o.nodeName+' element ('+(_didAppend?'created via JS':'static HTML')+')');
      _wDS('waitEI');
    }
    if (typeof _s.oninitmovie === 'function') {
      setTimeout(_s.oninitmovie, 1);
    }
  };

  _go = function(sURL) {
    // where it all begins.
    if (sURL) {
      _s.url = sURL;
    }
    _initMovie();
  };

  _waitForEI = function() {
    if (_waitingForEI) {
      return false;
    }
    _waitingForEI = true;
    if (_tryInitOnFocus && !_isFocused) {
      _wDS('waitFocus');
      return false;
    }
    var p;
    if (!_didInit) {
      p = _s.getMoviePercent();
      _s._wD(_str('waitImpatient', (p === 100?' (SWF loaded)':(p > 0?' (SWF ' + p + '% loaded)':''))));
    }
    setTimeout(function() {
      p = _s.getMoviePercent();
      if (!_didInit) {
        _s._wD(_sm + ': No Flash response within expected time.\nLikely causes: ' + (p === 0?'Loading ' + _s.movieURL + ' may have failed (and/or Flash ' + _fV + '+ not present?), ':'') + 'Flash blocked or JS-Flash security error.' + (_s.debugFlash?' ' + _str('checkSWF'):''), 2);
        if (!this._overHTTP && p) {
          _wDS('localFail', 2);
          if (!_s.debugFlash) {
            _wDS('tryDebug', 2);
          }
        }
        if (p === 0) {
          // if 0 (not null), probably a 404.
          _s._wD(_str('swf404', _s.url));
        }
        _debugTS('flashtojs', false, ': Timed out' + this._overHTTP?' (Check flash security or flash blockers)':' (No plugin/missing SWF?)');
      }
      // give up / time-out, depending
      if (!_didInit && _okToDisable) {
        if (p === null) {
          // SWF failed. Maybe blocked.
          if (_s.useFlashBlock || _s.flashLoadTimeout === 0) {
            if (_s.useFlashBlock) {
              _flashBlockHandler();
            }
            _wDS('waitForever');
          } else {
            // old SM2 behaviour, simply fail
            _failSafely(true);
          }
        } else {
          // flash loaded? Shouldn't be a blocking issue, then.
          if (_s.flashLoadTimeout === 0) {
             _wDS('waitForever');
          } else {
            _failSafely(true);
          }
        }
      }
    }, _s.flashLoadTimeout);
  };

  _getSWFCSS = function() {
    var css = [];
    if (_s.debugMode) {
      css.push(_s.swfCSS.sm2Debug);
    }
    if (_s.debugFlash) {
      css.push(_s.swfCSS.flashDebug);
    }
    if (_s.useHighPerformance) {
      css.push(_s.swfCSS.highPerf);
    }
    return css.join(' ');
  };

  _flashBlockHandler = function() {
    // *possible* flash block situation.
    var name = 'soundManager::flashBlockHandler()', p = _s.getMoviePercent();
    if (!_s.supported()) {
      if (_needsFlash) {
        // make the movie more visible, so user can fix
        _s.oMC.className = _getSWFCSS() + ' ' + _s.swfCSS.swfDefault + ' ' + (p === null?_s.swfCSS.swfTimedout:_s.swfCSS.swfError);
        _s._wD(name+': '+_str('fbTimeout')+(p?' ('+_str('fbLoaded')+')':''));
      }
      _s.didFlashBlock = true;
      _processOnReady(true); // fire onready(), complain lightly
      // onerror?
      if (_s.onerror instanceof Function) {
        _s.onerror.apply(window);
      }
    } else {
      // SM2 loaded OK (or recovered)
      if (_s.didFlashBlock) {
        _s._wD(name+': Unblocked');
      }
      if (_s.oMC) {
        _s.oMC.className = _getSWFCSS() + ' ' + _s.swfCSS.swfDefault + (' '+_s.swfCSS.swfUnblocked);
      }
    }
  };

  _handleFocus = function() {
    if (_isFocused || !_tryInitOnFocus) {
      return true;
    }
    _okToDisable = true;
    _isFocused = true;
    _s._wD('soundManager::handleFocus()');
    if (_tryInitOnFocus) {
      // giant Safari 3.1 hack - assume window in focus if mouse is moving, since document.hasFocus() not currently implemented.
      window.removeEventListener('mousemove', _handleFocus, false);
    }
    // allow init to restart
    _waitingForEI = false;
    setTimeout(_waitForEI, 500);
    // detach event
    if (window.removeEventListener) {
      window.removeEventListener('focus', _handleFocus, false);
    } else if (window.detachEvent) {
      window.detachEvent('onfocus', _handleFocus);
    }
  };

  _initComplete = function(bNoDisable) {
    if (_didInit) {
      return false;
    }
    if (_html5Only) {
      // all good.
      _s._wD('-- SoundManager 2: loaded --');
      _didInit = true;
      _processOnReady();
      _initUserOnload();
      return true;
    }
    var sClass = _s.oMC.className,
    wasTimeout = (_s.useFlashBlock && _s.flashLoadTimeout && !_s.getMoviePercent());
    if (!wasTimeout) {
      _didInit = true;
    }
    _s._wD('-- SoundManager 2 ' + (_disabled?'failed to load':'loaded') + ' (' + (_disabled?'security/load error':'OK') + ') --', 1);
    if (_disabled || bNoDisable) {
      if (_s.useFlashBlock) {
        _s.oMC.className = _getSWFCSS() + ' ' + (_s.getMoviePercent() === null?_s.swfCSS.swfTimedout:_s.swfCSS.swfError);
      }
      _processOnReady();
      _debugTS('onload', false);
      if (_s.onerror instanceof Function) {
        _s.onerror.apply(window);
      }
      return false;
    } else {
      _debugTS('onload', true);
    }
    if (_s.waitForWindowLoad && !_windowLoaded) {
      _wDS('waitOnload');
      if (window.addEventListener) {
        window.addEventListener('load', _initUserOnload, false);
      } else if (window.attachEvent) {
        window.attachEvent('onload', _initUserOnload);
      }
      return false;
    } else {
      if (_s.waitForWindowLoad && _windowLoaded) {
        _wDS('docLoaded');
      }
      _initUserOnload();
    }
  };

  _addOnReady = function(oMethod, oScope) {
    _onready.push({
      'method': oMethod,
      'scope': (oScope || null),
      'fired': false
    });
  };

  _processOnReady = function(ignoreInit) {
    if (!_didInit && !ignoreInit) {
      // not ready yet.
      return false;
    }
    var status = {
      success: (ignoreInit?_s.supported():!_disabled)
    },
    queue = [], i, j,
    canRetry = (!_s.useFlashBlock || (_s.useFlashBlock && !_s.supported()));
    for (i = 0, j = _onready.length; i < j; i++) {
      if (_onready[i].fired !== true) {
        queue.push(_onready[i]);
      }
    }
    if (queue.length) {
      _s._wD(_sm + ': Firing ' + queue.length + ' onready() item' + (queue.length > 1?'s':''));
      for (i = 0, j = queue.length; i < j; i++) {
        if (queue[i].scope) {
          queue[i].method.apply(queue[i].scope, [status]);
        } else {
          queue[i].method(status);
        }
        if (!canRetry) { // flashblock case doesn't count here
          queue[i].fired = true;
        }
      }
    }
  };

  _initUserOnload = function() {
    window.setTimeout(function() {
      if (_s.useFlashBlock) {
        _flashBlockHandler();
      }
      _processOnReady();
      _wDS('onload', 1);
      // call user-defined "onload", scoped to window
      _s.onload.apply(window);
      _wDS('onloadOK', 1);
    },1);
  };

  _featureCheck = function() {
    var needsFlash, item,
    isBadSafari = (!_wl.match(/usehtml5audio/i) && !_wl.match(/sm2\-ignorebadua/i) && _s.isSafari && _ua.match(/OS X 10_6_(3|4)/i) && _ua.match(/(531\.22\.7|533\.16)/i)), // Safari 4.0.5 (531.22.7) and 5.0 (533.16) have buggy/broken HTML5 audio on Snow Leopard. :/ https://bugs.webkit.org/show_bug.cgi?id=32159
    isSpecial = (_ua.match(/iphone os (1|2|3_0|3_1)/i)?true:false); // iPhone <= 3.1 has broken HTML5 audio(), but firmware 3.2 (iPad) + iOS4 works.
    if (isSpecial) {
      _s.hasHTML5 = false; // has Audio(), but is broken; let it load links directly.
      _html5Only = true; // ignore flash case, however
      if (_s.oMC) {
        _s.oMC.style.display = 'none';
      }
      return false;
    }
    if (_s.useHTML5Audio) {
      if (!_s.html5 || !_s.html5.canPlayType) {
        _s._wD('SoundManager: No HTML5 Audio() support detected.');
        _s.hasHTML5 = false;
        return true;
      } else {
        _s.hasHTML5 = true;
      }
      if (isBadSafari) {
        _s._wD('SoundManager::Note: Buggy HTML5 Audio in this specific browser + OS, see https://bugs.webkit.org/show_bug.cgi?id=32159 - disabling HTML5',1);
        _s.useHTML5Audio = false;
        _s.hasHTML5 = false;
        return true;
      }
    } else {
      // flash required.
      return true;
    }
    for (item in _s.audioFormats) {
      if (_s.audioFormats.hasOwnProperty(item)) {
        if (_s.audioFormats[item].required && !_s.html5.canPlayType(_s.audioFormats[item].type)) {
          // may need flash for this format?
          needsFlash = true;
        }
      }
    }
    // sanity check..
    if (_s.ignoreFlash) {
      needsFlash = false;
    }
    _html5Only = (_s.useHTML5Audio && _s.hasHTML5 && !needsFlash);
    return needsFlash;
  };

  _init = function() {
    var item, tests = [];
    _wDS('init');
    // called after onload()

    if (_didInit) {
      _wDS('didInit');
      return false;
    }

    function _cleanup() {
      if (window.removeEventListener) {
        window.removeEventListener('load', _s.beginDelayedInit, false);
      } else if (window.detachEvent) {
        window.detachEvent('onload', _s.beginDelayedInit);
      }
    }

    if (_s.hasHTML5) {
      for (item in _s.audioFormats) {
        if (_s.audioFormats.hasOwnProperty(item)) {
          tests.push(item+': '+_s.html5[item]);
        }
      }
      _s._wD('-- SoundManager 2: HTML5 support tests ('+_s.html5Test+'): '+tests.join(', ')+' --',1);
    }

    if (_html5Only) {
      if (!_didInit) {
        // we don't need no steenking flash!
        _cleanup();
        _s.enabled = true;
        _initComplete();
      }
      return true;
    } else {
}

    // flash path
    _initMovie();
    try {
      _wDS('flashJS');
      _s.o._externalInterfaceTest(false); // attempt to talk to Flash
      if (!_s.allowPolling) {
        _wDS('noPolling', 1);
      } else {
        _setPolling(true, _s.useFastPolling?true:false);
      }
      if (!_s.debugMode) {
        _s.o._disableDebug();
      }
      _s.enabled = true;
      _debugTS('jstoflash', true);
    } catch(e) {
      _s._wD('js/flash exception: ' + e.toString());
      _debugTS('jstoflash', false);
      _failSafely(true); // don't disable, for reboot()
      _initComplete();
      return false;
    }
    _initComplete();
    // event cleanup
    _cleanup();
  };

  _beginInit = function() {
    if (_initPending) {
      return false;
    }
    _createMovie();
    _initMovie();
    _initPending = true;
    return true;
  };

  _dcLoaded = function() {
    if (_didDCLoaded) {
      return false;
    }
    _didDCLoaded = true;
    _initDebug();
    _testHTML5();
    _s.html5.usingFlash = _featureCheck();
    _needsFlash = _s.html5.usingFlash;
    _didDCLoaded = true;
    _go();
  };

  _startTimer = function(oSound) {
    if (!oSound._hasTimer) {
      oSound._hasTimer = true;
    }
  };

  _stopTimer = function(oSound) {
    if (oSound._hasTimer) {
      oSound._hasTimer = false;
    }
  };

  // "private" methods called by Flash

  this._setSandboxType = function(sandboxType) {
    var sb = _s.sandbox;
    sb.type = sandboxType;
    sb.description = sb.types[(typeof sb.types[sandboxType] !== 'undefined'?sandboxType:'unknown')];
    _s._wD('Flash security sandbox type: ' + sb.type);
    if (sb.type === 'localWithFile') {
      sb.noRemote = true;
      sb.noLocal = false;
      _wDS('secNote', 2);
    } else if (sb.type === 'localWithNetwork') {
      sb.noRemote = false;
      sb.noLocal = true;
    } else if (sb.type === 'localTrusted') {
      sb.noRemote = false;
      sb.noLocal = false;
    }
  };

  this._externalInterfaceOK = function(flashDate) {
    // callback from flash for confirming that movie loaded, EI is working etc.
    // flashDate = approx. timing/delay info for JS/flash bridge
    if (_s.swfLoaded) {
      return false;
    }
    var eiTime = new Date().getTime();
    _s._wD('soundManager::externalInterfaceOK()' + (flashDate?' (~' + (eiTime - flashDate) + ' ms)':''));
    _debugTS('swf', true);
    _debugTS('flashtojs', true);
    _s.swfLoaded = true;
    _tryInitOnFocus = false;
    if (_s.isIE) {
      // IE needs a timeout OR delay until window.onload - may need TODO: investigating
      setTimeout(_init, 100);
    } else {
      _init();
    }
  };

  this._onfullscreenchange = function(bFullScreen) {
    _s._wD('onfullscreenchange(): ' + bFullScreen);
    _s.isFullScreen = (bFullScreen === 1?true:false);
    if (!_s.isFullScreen) {
      // attempt to restore window focus after leaving full-screen
      try {
        window.focus();
        _s._wD('window.focus()');
      } catch(e) {
        // oh well
      }
    }
  };

  // --- SMSound (sound object) instance ---

  SMSound = function(oOptions) {
    var _t = this, _resetProperties, _add_html5_events, _stop_html5_timer, _start_html5_timer, _get_html5_duration, _a;
    this.sID = oOptions.id;
    this.url = oOptions.url;
    this.options = _mergeObjects(oOptions);
    this.instanceOptions = this.options; // per-play-instance-specific options
    this._iO = this.instanceOptions; // short alias
    // assign property defaults (volume, pan etc.)
    this.pan = this.options.pan;
    this.volume = this.options.volume;
    // this.autoPlay = oOptions.autoPlay ? oOptions.autoPlay : false;
    this._lastURL = null;
    this.isHTML5 = false;

    // --- public methods ---

    this.id3 = {
      /* 
        Name/value pairs eg. this.id3.songname set via Flash when available - download docs for reference
        http://livedocs.macromedia.com/flash/8/
      */
    };

    this._debug = function() {
      // <d>
      // pseudo-private console.log()-style output
      if (_s.debugMode) {
        var stuff = null, msg = [], sF, sfBracket, maxLength = 64;
        for (stuff in _t.options) {
          if (_t.options[stuff] !== null) {
            if (_t.options[stuff] instanceof Function) {
              // handle functions specially
              sF = _t.options[stuff].toString();
              sF = sF.replace(/\s\s+/g, ' '); // normalize spaces
              sfBracket = sF.indexOf('{');
              msg.push(' ' + stuff + ': {' + sF.substr(sfBracket + 1, (Math.min(Math.max(sF.indexOf('\n') - 1, maxLength), maxLength))).replace(/\n/g, '') + '... }');
            } else {
              msg.push(' ' + stuff + ': ' + _t.options[stuff]);
            }
          }
        }
        _s._wD('SMSound() merged options: {\n' + msg.join(', \n') + '\n}');
      }
      // </d>
    };

    this._debug();

    this.load = function(oOptions) {
      var oS = null;
      if (typeof oOptions !== 'undefined') {
        _t._iO = _mergeObjects(oOptions);
        _t.instanceOptions = _t._iO;
      } else {
        oOptions = _t.options;
        _t._iO = oOptions;
        _t.instanceOptions = _t._iO;
        if (_t._lastURL && _t._lastURL !== _t.url) {
          _wDS('manURL');
          _t._iO.url = _t.url;
          _t.url = null;
        }
      }
      if (typeof _t._iO.url === 'undefined') {
        _t._iO.url = _t.url;
      }
      _s._wD('soundManager.load(): ' + _t._iO.url, 1);
      if (_t._iO.url === _t.url && _t.readyState !== 0 && _t.readyState !== 2) {
        _wDS('onURL', 1);
        return _t;
      }
      _t.url = _t._iO.url;
      _t._lastURL = _t._iO.url;
      _t.loaded = false;
      _t.readyState = 1;
      _t.playState = 0; // (oOptions.autoPlay?1:0); // if autoPlay, assume "playing" is true (no way to detect when it actually starts in Flash unless onPlay is watched?)
      if (_html5OK(_t._iO)) {
        _s._wD('HTML 5 load: '+_t._iO.url);
        oS = _t._setup_html5(_t._iO);
        // if autoplay..
        if (_t._iO.autoPlay) {
          // oS.load(); // required? Uncertain.
          _t.play();
        }
      } else {
        try {
          _t.isHTML5 = false;
          _t._iO = _loopFix(_t._iO);
          if (_fV === 8) {
            _s.o._load(_t.sID, _t._iO.url, _t._iO.stream, _t._iO.autoPlay, (_t._iO.whileloading?1:0), _t._iO.loops||1);
          } else {
            _s.o._load(_t.sID, _t._iO.url, _t._iO.stream?true:false, _t._iO.autoPlay?true:false, _t._iO.loops||1); // ,(_tO.whileloading?true:false)
            if (_t._iO.isMovieStar && _t._iO.autoLoad && !_t._iO.autoPlay) {
              // special case: MPEG4 content must start playing to load, then pause to prevent playing.
              _t.pause();
            }
          }
        } catch(e) {
          _wDS('smError', 2);
          _debugTS('onload', false);
          _s.onerror();
          _s.disable();
        }
      }
      return _t;
    };

    this.unload = function() {
      // Flash 8/AS2 can't "close" a stream - fake it by loading an empty MP3
      // Flash 9/AS3: Close stream, preventing further load
      if (_t.readyState !== 0) {
        _s._wD('SMSound.unload(): "' + _t.sID + '"');
        if (_t.readyState !== 2) { // reset if not error
          _t.setPosition(0, true); // reset current sound positioning
        }
        if (!_t.isHTML5) {
          if (_fV === 8) {
            _s.o._unload(_t.sID, _s.nullURL);
          } else {
            _t.setAutoPlay(false); // ?
            _s.o._unload(_t.sID);
          }
        } else {
          _stop_html5_timer();
          if (_a) {
            // abort()-style method here, stop loading? (doesn't exist?)
            _a.pause();
            _a.src = _s.nullURL; // needed? does nulling object work? any better way to cancel/unload/abort?
            _a.load();
            _t._audio = null;
            _a = null;
            // delete _t._audio;
          }
        } 
        // reset load/status flags
        _resetProperties();
      }
      return _t;
    };

    this.destruct = function() {
      _s._wD('SMSound.destruct(): "' + _t.sID + '"');
      if (!_t.isHTML5) {
        // kill sound within Flash
        // Disable the onfailure handler
        _t._iO.onfailure = null;
        _s.o._destroySound(_t.sID);
      } else {
        _stop_html5_timer();
        if (_a) {
          _a.pause();
          _a.src = 'about:blank';
          _a.load();
          _t._audio = null;
          _a = null;
          // delete _t._audio;
        }
      }
      _s.destroySound(_t.sID, true); // ensure deletion from controller
    };

    this.play = function(oOptions) {
      var fN = 'SMSound.play(): ', allowMulti;
      if (!oOptions) {
        oOptions = {};
      }
      _t._iO = _mergeObjects(oOptions, _t._iO);
      _t._iO = _mergeObjects(_t._iO, _t.options);
      _t.instanceOptions = _t._iO;
      if (_t._iO.serverURL) {
        if (!_t.connected) {
          _s._wD(fN+' Netstream not connected yet - setting autoPlay');
          _t.setAutoPlay(true);
          return _t;
        }
      }
      if (_html5OK(_t._iO)) {
        _t._setup_html5(_t._iO);
        _start_html5_timer();
      }
      if (_t.playState === 1) {
        allowMulti = _t._iO.multiShot;
        if (!allowMulti) {
          _s._wD(fN + '"' + _t.sID + '" already playing (one-shot)', 1);
          return _t;
        } else {
          _s._wD(fN + '"' + _t.sID + '" already playing (multi-shot)', 1);
          if (_t.isHTML5) {
            // TODO: BUG?
            _t.setPosition(_t._iO.position);
          }
        }
      }
      if (!_t.loaded) {
        if (_t.readyState === 0) {
          _s._wD(fN + 'Attempting to load "' + _t.sID + '"', 1);
          // try to get this sound playing ASAP
          //_t._iO.stream = true; // breaks stream=false case?
          if (!_t.isHTML5) {
            // HTML5 double-play bug otherwise.
            if (!_t._iO.serverURL) {
              _t._iO.autoPlay = true;
              _t.load(_t._iO); // try to get this sound playing ASAP
            }
          } else {
            _t.readyState = 1;
          }
          // if (typeof oOptions.autoPlay=='undefined') _tO.autoPlay = true; // only set autoPlay if unspecified here
          // _t.load(_t._iO); // moved into flash-only block
        } else if (_t.readyState === 2) {
          _s._wD(fN + 'Could not load "' + _t.sID + '" - exiting', 2);
          return _t;
        } else {
          _s._wD(fN + '"' + _t.sID + '" is loading - attempting to play..', 1);
        }
      } else {
        _s._wD(fN + '"' + _t.sID + '"');
      }
      if (_t.paused) {
        _s._wD(fN + '"' + _t.sID + '" is resuming from paused state',1);
        _t.resume();
      } else {
        _s._wD(fN+'"'+ _t.sID+'" is starting to play');
        _t.playState = 1;
        if (!_t.instanceCount || (_fV > 8 && !_t.isHTML5)) {
          _t.instanceCount++;
        }
        _t.position = (typeof _t._iO.position !== 'undefined' && !isNaN(_t._iO.position)?_t._iO.position:0);
        _t._iO = _loopFix(_t._iO);
        if (_t._iO.onplay) {
          _t._iO.onplay.apply(_t);
        }
        _t.setVolume(_t._iO.volume, true); // restrict volume to instance options only
        _t.setPan(_t._iO.pan, true);
        if (!_t.isHTML5) {
          if (_fV === 9 && _t._iO.serverURL) {
            // autoPlay for RTMP case
            _t.setAutoPlay(true);
          }
          _s.o._start(_t.sID, _t._iO.loops || 1, (_fV === 9?_t.position:_t.position / 1000));
        } else {
          _start_html5_timer();
          _t._setup_html5().play();
        }
      }
      return _t;
    };

    this.start = this.play; // just for convenience

    this.stop = function(bAll) {
      if (_t.playState === 1) {
        _t._onbufferchange(0);
        _t.resetOnPosition(0);
        if (!_t.isHTML5) {
          _t.playState = 0;
        }
        _t.paused = false;
        if (_t._iO.onstop) {
          _t._iO.onstop.apply(_t);
        }
        if (!_t.isHTML5) {
          _s.o._stop(_t.sID, bAll);
          // hack for netStream: just unload
          if (_t._iO.serverURL) {
            _t.unload();
          }
        } else {
          if (_a) {
            _t.setPosition(0); // act like Flash, though
            _a.pause(); // html5 has no stop()
            _t.playState = 0;
            _t._onTimer(); // and update UI
            _stop_html5_timer();
            _t.unload();
          }
        }
        _t.instanceCount = 0;
        _t._iO = {};
        // _t.instanceOptions = _t._iO;
      }
      return _t;
    };

    this.setAutoPlay = function(autoPlay) {
      // _s._wD('setAutoPlay('+autoPlay+')');
      _t._iO.autoPlay = autoPlay;
      _s.o._setAutoPlay(_t.sID, autoPlay);
      if (autoPlay) {
        // _t.playState = 1; // ?
        if (!_t.instanceCount) {
          _t.instanceCount++;
        }
      }
    };

    this.setPosition = function(nMsecOffset, bNoDebug) {
      if (typeof nMsecOffset === 'undefined') {
        nMsecOffset = 0;
      }
      var offset = (_t.isHTML5 ? Math.max(nMsecOffset,0) : Math.min(_t.duration, Math.max(nMsecOffset, 0))); // position >= 0 and <= current available (loaded) duration
      _t._iO.position = offset;
      _t.resetOnPosition(_t._iO.position);
      if (!_t.isHTML5) {
        _s.o._setPosition(_t.sID, (_fV === 9?_t._iO.position:_t._iO.position / 1000), (_t.paused || !_t.playState)); // if paused or not playing, will not resume (by playing)
      } else if (_a) {
        _s._wD('setPosition(): setting position to '+(_t._iO.position / 1000));
        if (_t.playState) {
          // DOM/JS errors/exceptions to watch out for:
          // if seek is beyond (loaded?) position, "DOM exception 11"
          // "INDEX_SIZE_ERR": DOM exception 1
          try {
            _a.currentTime = _t._iO.position / 1000;
          } catch(e) {
            _s._wD('setPosition('+_t._iO.position+'): WARN: Caught exception: '+e.message, 2);
          }
        } else {
          _s._wD('HTML 5 warning: cannot set position while playState == 0 (not playing)',2);
        }
        if (_t.paused) { // if paused, refresh UI right away
          _t._onTimer(true); // force update
          // TODO: resume for movieStar only?
          if (_t._iO.useMovieStar) {
            _t.resume();
          }
        }
      }
      return _t;
    };

    this.pause = function(bCallFlash) {
      // if (_t.paused || _t.playState === 0) {
      if (_t.paused || (_t.playState === 0 && _t.readyState !== 1)) { // TODO: Verify vs. old
        return _t;
      }
      _s._wD('SMSound.pause()');
      _t.paused = true;
      if (!_t.isHTML5) {
        if (bCallFlash || bCallFlash === undefined) {
          _s.o._pause(_t.sID);
        }
      } else {
        _t._setup_html5().pause();
        _stop_html5_timer();
      }
      if (_t._iO.onpause) {
        _t._iO.onpause.apply(_t);
      }
      return _t;
    };

    this.resume = function() {
      if (!_t.paused || _t.playState === 0) {
        return _t;
      }
      _s._wD('SMSound.resume()');
      _t.paused = false;
      _t.playState = 1; // TODO: verify that this is needed.
      if (!_t.isHTML5) {
        _s.o._pause(_t.sID); // flash method is toggle-based (pause/resume)
      } else {
        _t._setup_html5().play();
        _start_html5_timer();
      }
      if (_t._iO.onresume) {
        _t._iO.onresume.apply(_t);
      }
      return _t;
    };

    this.togglePause = function() {
      _s._wD('SMSound.togglePause()');
      if (_t.playState === 0) {
        _t.play({
          position: (_fV === 9 && !_t.isHTML5 ? _t.position:_t.position / 1000)
        });
        return _t;
      }
      if (_t.paused) {
        _t.resume();
      } else {
        _t.pause();
      }
      return _t;
    };

    this.setPan = function(nPan, bInstanceOnly) {
      if (typeof nPan === 'undefined') {
        nPan = 0;
      }
      if (typeof bInstanceOnly === 'undefined') {
        bInstanceOnly = false;
      }
      if (!_t.isHTML5) {
        _s.o._setPan(_t.sID, nPan);
      } else {
        // no HTML 5 pan?
      }
      _t._iO.pan = nPan;
      if (!bInstanceOnly) {
        _t.pan = nPan;
      }
      return _t;
    };

    this.setVolume = function(nVol, bInstanceOnly) {
      if (typeof nVol === 'undefined') {
        nVol = 100;
      }
      if (typeof bInstanceOnly === 'undefined') {
        bInstanceOnly = false;
      }
      if (!_t.isHTML5) {
        _s.o._setVolume(_t.sID, (_s.muted && !_t.muted) || _t.muted?0:nVol);
      } else if (_a) {
        _a.volume = nVol/100;
      } 
      _t._iO.volume = nVol;
      if (!bInstanceOnly) {
        _t.volume = nVol;
      }
      return _t;
    };

    this.mute = function() {
      _t.muted = true;
      if (!_t.isHTML5) {
        _s.o._setVolume(_t.sID, 0);
      } else if (_a) {
        _a.muted = true;
      }
      return _t;
    };

    this.unmute = function() {
      _t.muted = false;
      var hasIO = typeof _t._iO.volume !== 'undefined';
      if (!_t.isHTML5) {
        _s.o._setVolume(_t.sID, hasIO?_t._iO.volume:_t.options.volume);
      } else if (_a) {
        _a.muted = false;
      }
      return _t;
    };

    this.toggleMute = function() {
      return (_t.muted?_t.unmute():_t.mute());
    };

    this.onposition = function(nPosition, oMethod, oScope) {
      // todo: allow for ranges, too? eg. (nPosition instanceof Array)
      _t._onPositionItems.push({
        position: nPosition,
        method: oMethod,
        scope: (typeof oScope !== 'undefined'?oScope:_t),
        fired: false
      });
      return _t;
    };

    this.processOnPosition = function() {
      // sound currently playing?
      var i, item, j = _t._onPositionItems.length;
      if (!j || !_t.playState || _t._onPositionFired >= j) {
        return false;
      }
      for (i=j; i--;) {
        item = _t._onPositionItems[i];
        if (!item.fired && _t.position >= item.position) {
          item.method.apply(item.scope,[item.position]);
          item.fired = true;
          _s._onPositionFired++;
        }
      }
    };

    this.resetOnPosition = function(nPosition) {
      // reset "fired" for items interested in this position
      var i, item, j = _t._onPositionItems.length;
      if (!j) {
        return false;
      }
      for (i=j; i--;) {
        item = _t._onPositionItems[i];
        if (item.fired && nPosition <= item.position) {
          item.fired = false;
          _s._onPositionFired--;
        }
      }
    };

    // pseudo-private soundManager reference

    this._onTimer = function(bForce) {
      // HTML 5-only _whileplaying() etc.
      if (_t._hasTimer || bForce) {
        var time;
        if (_a && (bForce || ((_t.playState > 0 || _t.readyState === 1) && !_t.paused))) { // TODO: May not need to track readyState (1 = loading)
          _t.duration = _get_html5_duration();
          _t.durationEstimate = _t.duration;
          time = _a.currentTime?_a.currentTime*1000:0;
          _t._whileplaying(time,{},{},{},{});
          return true;
        } else {
         // beta testing
         _s._wD('_onTimer: Warn for "'+_t.sID+'": '+(!_a?'Could not find element. ':'')+(_t.playState === 0?'playState bad, 0?':'playState = '+_t.playState+', OK'));
          return false;
        }
      }
    };

    // --- private internals ---

    _get_html5_duration = function() {
      var d = (_a?_a.duration*1000:undefined);
      if (d) {
        return (!isNaN(d)?d:null);
      }
    };

    _start_html5_timer = function() {
      if (_t.isHTML5) {
        _startTimer(_t);
      }
    };

    _stop_html5_timer = function() {
      if (_t.isHTML5) {
        _stopTimer(_t);
      }
    };

    _resetProperties = function(bLoaded) {
      _t._onPositionItems = [];
      _t._onPositionFired = 0;
      _t._hasTimer = null;
      _t._added_events = null;
      _t._audio = null;
      _a = null;
      _t.bytesLoaded = null;
      _t.bytesTotal = null;
      _t.position = null;
      _t.duration = null;
      _t.durationEstimate = null;
      _t.failures = 0;
      _t.loaded = false;
      _t.playState = 0;
      _t.paused = false;
      _t.readyState = 0; // 0 = uninitialised, 1 = loading, 2 = failed/error, 3 = loaded/success
      _t.muted = false;
      _t.didBeforeFinish = false;
      _t.didJustBeforeFinish = false;
      _t.isBuffering = false;
      _t.instanceOptions = {};
      _t.instanceCount = 0;
      _t.peakData = {
        left: 0,
        right: 0
      };
      _t.waveformData = {
        left: [],
        right: []
      };
      _t.eqData = [];
      // dirty hack for now: also have left/right arrays off this, maintain compatibility
      _t.eqData.left = [];
      _t.eqData.right = [];
    };

    _resetProperties();

    // pseudo-private methods used by soundManager

    this._setup_html5 = function(oOptions) {
      var _iO = _mergeObjects(_t._iO, oOptions);
      if (_a) {
        if (_t.url !== _iO.url) {
          _s._wD('setting new URL on existing object: '+_iO.url);
          _a.src = _iO.url;
        }
      } else {
        _s._wD('creating HTML 5 audio element with URL: '+_iO.url);
        _t._audio = new Audio(_iO.url);
        _a = _t._audio;
        _t.isHTML5 = true;
        _add_html5_events();
      }
      _a.loop = (_iO.loops>1?'loop':'');
      return _t._audio;
    };

    // related private methods

    _add_html5_events = function() {
      if (_t._added_events) {
        return false;
      }
      _t._added_events = true;

      function _add(oEvt, oFn, bBubble) {
        return (_a ? _a.addEventListener(oEvt, oFn, bBubble||false) : null);
      }

      _add('load', function(e) {
        _s._wD('HTML5::load: '+_t.sID);
        if (_a) {
          _t._onbufferchange(0);
          _t._whileloading(_t.bytesTotal, _t.bytesTotal, _get_html5_duration());
          _t._onload(1);
        }
      }, false);

      _add('canplay', function(e) {
        _s._wD('HTML5::canplay: '+_t.sID);
        // enough has loaded to play
        _t._onbufferchange(0);
      },false);

      _add('waiting', function(e) {
        _s._wD('HTML5::waiting: '+_t.sID);
        // playback faster than download rate, etc.
        _t._onbufferchange(1);
      },false);

      _add('progress', function(e) { // not supported everywhere yet..
        _s._wD('HTML5::progress: '+_t.sID+': loaded/total: '+(e.loaded||0)+','+(e.total||1));
        if (!_t.loaded && _a) {
          _t._onbufferchange(0); // if progress, likely not buffering
          _t._whileloading(e.loaded||0, e.total||1, _get_html5_duration());
        }
      }, false);

      _add('end', function(e) {
        _s._wD('HTML5::end: '+_t.sID);
        _t._onfinish();
      }, false);

      _add('error', function(e) {
        if (_a) {
          _s._wD('HTML5::error: '+_a.error.code);
          // call load with error state?
          _t._onload(0);
        }
      }, false);

      _add('loadstart', function(e) {
        _s._wD('HTML5::loadstart: '+_t.sID);
        // assume buffering at first
        _t._onbufferchange(1);
      }, false);

      _add('play', function(e) {
        _s._wD('HTML5::play: '+_t.sID);
        // once play starts, no buffering
        _t._onbufferchange(0);
      }, false);

      // TODO: verify if this is actually implemented anywhere yet.
      _add('playing', function(e) {
        _s._wD('HTML5::playing: '+_t.sID);
        // once play starts, no buffering
        _t._onbufferchange(0);
      }, false);

      _add('timeupdate', function(e) {
        _t._onTimer();
      }, false);

      // avoid stupid premature event-firing bug in Safari(?)
      setTimeout(function(){
        if (_t && _a) {
          _add('ended',function(e) {
            _s._wD('HTML5::ended: '+_t.sID);
            _t._onfinish();
          }, false);
        }
      }, 250);

    };

    // --- "private" methods called by Flash ---

    this._whileloading = function(nBytesLoaded, nBytesTotal, nDuration, nBufferLength) {
      _t.bytesLoaded = nBytesLoaded;
      _t.bytesTotal = nBytesTotal;
      _t.duration = Math.floor(nDuration);
      if (!_t._iO.isMovieStar) {
        _t.durationEstimate = parseInt((_t.bytesTotal / _t.bytesLoaded) * _t.duration, 10);
        if (_t.durationEstimate === undefined) {
          // reported bug?
          _t.durationEstimate = _t.duration;
        }
        _t.bufferLength = nBufferLength;
        if ((_t._iO.isMovieStar || _t.readyState !== 3) && _t._iO.whileloading) {
          _t._iO.whileloading.apply(_t);
        }
      } else {
        _t.durationEstimate = _t.duration;
        if (_t.readyState !== 3 && _t._iO.whileloading) {
          _t._iO.whileloading.apply(_t);
        }
      }
    };

    this._onid3 = function(oID3PropNames, oID3Data) {
      // oID3PropNames: string array (names)
      // ID3Data: string array (data)
      _s._wD('SMSound._onid3(): "' + this.sID + '" ID3 data received.');
      var oData = [], i, j;
      for (i = 0, j = oID3PropNames.length; i < j; i++) {
        oData[oID3PropNames[i]] = oID3Data[i];
        // _s._wD(oID3PropNames[i]+': '+oID3Data[i]);
      }
      _t.id3 = _mergeObjects(_t.id3, oData);
      if (_t._iO.onid3) {
        _t._iO.onid3.apply(_t);
      }
    };

    this._whileplaying = function(nPosition, oPeakData, oWaveformDataLeft, oWaveformDataRight, oEQData) {

      if (isNaN(nPosition) || nPosition === null) {
        return false; // Flash may return NaN at times
      }
      if (_t.playState === 0 && nPosition > 0) {
        // can happen at the end of a video where nPosition === 33 for some reason, after finishing.???
        // can also happen with a normal stop operation. This resets the position to 0.
        // _s._writeDebug('Note: Not playing, but position = '+nPosition);
        nPosition = 0;
      }
      _t.position = nPosition;
      _t.processOnPosition();
      if (_fV > 8 && !_t.isHTML5) {
        if (_t._iO.usePeakData && typeof oPeakData !== 'undefined' && oPeakData) {
          _t.peakData = {
            left: oPeakData.leftPeak,
            right: oPeakData.rightPeak
          };
        }
        if (_t._iO.useWaveformData && typeof oWaveformDataLeft !== 'undefined' && oWaveformDataLeft) {
          _t.waveformData = {
            left: oWaveformDataLeft.split(','),
            right: oWaveformDataRight.split(',')
          };
        }
        if (_t._iO.useEQData) {
          if (typeof oEQData !== 'undefined' && oEQData && oEQData.leftEQ) {
            var eqLeft = oEQData.leftEQ.split(',');
            _t.eqData = eqLeft;
            _t.eqData.left = eqLeft;
            if (typeof oEQData.rightEQ !== 'undefined' && oEQData.rightEQ) {
              _t.eqData.right = oEQData.rightEQ.split(',');
            }
          }
        }
      }
      if (_t.playState === 1) {
        // special case/hack: ensure buffering is false (instant load from cache, thus buffering stuck at 1?)
        if (!_t.isHTML5 && _t.isBuffering) {
          _t._onbufferchange(0);
        }
        if (_t._iO.whileplaying) {
          _t._iO.whileplaying.apply(_t); // flash may call after actual finish
        }

        // if (_t.loaded && _t._iO.onbeforefinish && _t._iO.onbeforefinishtime && !_t.didBeforeFinish && _t.duration - _t.position <= _t._iO.onbeforefinishtime) {
        if ((_t.loaded || (!_t.loaded && _t._iO.isMovieStar)) && _t._iO.onbeforefinish && _t._iO.onbeforefinishtime && !_t.didBeforeFinish && _t.duration - _t.position <= _t._iO.onbeforefinishtime) {
          _s._wD('duration-position &lt;= onbeforefinishtime: ' + _t.duration + ' - ' + _t.position + ' &lt= ' + _t._iO.onbeforefinishtime + ' (' + (_t.duration - _t.position) + ')');
          _t._onbeforefinish();
        }
      }
    };

    this._onconnect = function(bSuccess) {
      var fN = 'SMSound._onconnect(): ';
      bSuccess = (bSuccess === 1);
      _s._wD(fN+'"'+_t.sID+'"'+(bSuccess?' connected.':' failed to connect? - '+_t.url), (bSuccess?1:2));
      _t.connected = bSuccess;
      if (bSuccess) {
        _t.failures = 0;
        if (_t._iO.autoLoad || _t._iO.autoPlay) {
          _t.load(_t._iO);
        }
        if (_t._iO.autoPlay) {
          _t.play();
        }
        if (_t._iO.onconnect) {
          _t._iO.onconnect.apply(_t,[bSuccess]);
        }
      }
    };

    this._onload = function(nSuccess) {
      var fN = 'SMSound._onload(): ';
      nSuccess = (nSuccess === 1?true:false);
      _s._wD(fN + '"' + _t.sID + '"' + (nSuccess?' loaded.':' failed to load? - ' + _t.url), (nSuccess?1:2));
      // <d>
      if (!nSuccess && !_t.isHTML5) {
        if (_s.sandbox.noRemote === true) {
          _s._wD(fN + _str('noNet'), 1);
        }
        if (_s.sandbox.noLocal === true) {
          _s._wD(fN + _str('noLocal'), 1);
        }
      }
      // </d>
      _t.loaded = nSuccess;
      _t.readyState = nSuccess?3:2;
      if (_t._iO.onload) {
        _t._iO.onload.apply(_t);
      }
    };

    // Only fire the onfailure callback once because after one failure we often get another.
    // At this point we just recreate failed sounds rather than trying to reconnect.
    this._onfailure = function(msg) {
      _t.failures++;
      _s._wD('SMSound._onfailure(): "'+_t.sID+'" count '+_t.failures);
      if (_t._iO.onfailure && _t.failures === 1) {
        _t._iO.onfailure(_t, msg);
      } else {
        _s._wD('SMSound._onfailure(): ignoring');
      }
    };

    this._onbeforefinish = function() {
      if (!_t.didBeforeFinish) {
        _t.didBeforeFinish = true;
        if (_t._iO.onbeforefinish) {
          _s._wD('SMSound._onbeforefinish(): "' + _t.sID + '"');
          _t._iO.onbeforefinish.apply(_t);
        }
      }
    };

    this._onjustbeforefinish = function(msOffset) {
      // msOffset: "end of sound" delay actual value (eg. 200 msec, value at event fire time was 187)
      if (!_t.didJustBeforeFinish) {
        _t.didJustBeforeFinish = true;
        if (_t._iO.onjustbeforefinish) {
          _s._wD('SMSound._onjustbeforefinish(): "' + _t.sID + '"');
          _t._iO.onjustbeforefinish.apply(_t);
        }
      }
    };

    this._onfinish = function() {
      // sound has finished playing
      // TODO: calling user-defined onfinish() should happen after setPosition(0)
      // OR: onfinish() and then setPosition(0) is bad.
      _t._onbufferchange(0); // ensure buffer has ended
      _t.resetOnPosition(0);
      if (_t._iO.onbeforefinishcomplete) {
        _t._iO.onbeforefinishcomplete.apply(_t);
      }
      // reset some state items
      _t.didBeforeFinish = false;
      _t.didJustBeforeFinish = false;
      if (_t.instanceCount) {
        _t.instanceCount--;
        if (!_t.instanceCount) {
          // reset instance options
          // _t.setPosition(0);
          _t.playState = 0;
          _t.paused = false;
          _t.instanceCount = 0;
          _t.instanceOptions = {};
          _stop_html5_timer();
        }
        // KJV May interfere with multi-shot events, but either way, instanceCount is sometimes 0 when it should not be.
        if (!_t.instanceCount || _t._iO.multiShotEvents) {
          // fire onfinish for last, or every instance
          if (_t._iO.onfinish) {
            _s._wD('SMSound._onfinish(): "' + _t.sID + '"');
            _t._iO.onfinish.apply(_t);
          }
        }
        if (_t.isHTML5) {
          _t.unload();
        }
      }
    };

    this._onmetadata = function(oMetaData) {
      // movieStar mode only
      var fN = 'SMSound.onmetadata()';
      _s._wD(fN);
      // Contains a subset of metadata. Note that files may have their own unique metadata.
      // http://livedocs.adobe.com/flash/9.0/main/wwhelp/wwhimpl/common/html/wwhelp.htm?context=LiveDocs_Parts&file=00000267.html
      if (!oMetaData.width && !oMetaData.height) {
        _wDS('noWH');
        oMetaData.width = 320;
        oMetaData.height = 240;
      }
      _t.metadata = oMetaData; // potentially-large object from flash
      _t.width = oMetaData.width;
      _t.height = oMetaData.height;
      if (_t._iO.onmetadata) {
        _s._wD(fN + ': "' + _t.sID + '"');
        _t._iO.onmetadata.apply(_t);
      }
      _s._wD(fN + ' complete');
    };

    this._onbufferchange = function(nIsBuffering) {
      var fN = 'SMSound._onbufferchange()';
      if (_t.playState === 0) {
        // ignore if not playing
        return false;
      }
      if ((nIsBuffering && _t.isBuffering) || (!nIsBuffering && !_t.isBuffering)) {
        // _s._wD(fN + ': Note: buffering already = '+nIsBuffering);
        return false;
      }
      _t.isBuffering = (nIsBuffering === 1?true:false);
      if (_t._iO.onbufferchange) {
        _s._wD(fN + ': ' + nIsBuffering);
        _t._iO.onbufferchange.apply(_t);
      }
    };

    this._ondataerror = function(sError) {
      // flash 9 wave/eq data handler
      if (_t.playState > 0) { // hack: called at start, and end from flash at/after onfinish().
        _s._wD('SMSound._ondataerror(): ' + sError);
        if (_t._iO.ondataerror) {
          _t._iO.ondataerror.apply(_t);
        }
      }
    };

  }; // SMSound()


  // register a few event handlers
  
  if (!_s.hasHTML5 || _needsFlash) {
    // only applies to Flash mode.
    if (window.addEventListener) {
      window.addEventListener('focus', _handleFocus, false);
      window.addEventListener('load', _s.beginDelayedInit, false);
      window.addEventListener('unload', _s.destruct, false);
      if (_tryInitOnFocus) {
        window.addEventListener('mousemove', _handleFocus, false); // massive Safari focus hack
      }
    } else if (window.attachEvent) {
      window.attachEvent('onfocus', _handleFocus);
      window.attachEvent('onload', _s.beginDelayedInit);
      window.attachEvent('unload', _s.destruct);
    } else {
      // no add/attachevent support - safe to assume no JS -> Flash either.
      _debugTS('onload', false);
      soundManager.onerror();
      soundManager.disable();
    }
  }

  _dcIE = function() {
    if (document.readyState === 'complete') {
      _dcLoaded();
      document.detachEvent('onreadystatechange', _dcIE);
    }
  };

  if (document.addEventListener) {
    document.addEventListener('DOMContentLoaded', _dcLoaded, false);
  } else if (document.attachEvent) {
    document.attachEvent('onreadystatechange', _dcIE);
  }

  if (document.readyState === 'complete') {
    setTimeout(_dcLoaded,100);
  }

} // SoundManager()

// var SM2_DEFER = true;
// un-comment here or define in your own script to prevent immediate SoundManager() constructor call+start-up.

// if deferring, construct later with window.soundManager = new SoundManager(); followed by soundManager.beginDelayedInit();

if (typeof SM2_DEFER === 'undefined' || !SM2_DEFER) {
  soundManager = new SoundManager();
}

// expose public interfaces
window.SoundManager = SoundManager; // SoundManager constructor
window.soundManager = soundManager; // public instance: API, Flash callbacks etc.

}(window)); // invocation closure


da.vendor.SoundManager = SoundManager;
da.vendor.soundManager = soundManager;
//SoundManager = null;
//soundManager = null;

var url = location.protocol + "//" + location.host + location.pathname.split("/").slice(0, -1).join("/"),
    path = location.pathname.contains("devel.html") ? "/libs/vendor/soundmanager/swf/" : "/resources/flash/";

$extend(da.vendor.soundManager, {
  useHTML5Audio:  false,
  url:            url + path,
  debugMode:      false,
  debugFlash:     false
});

})();





(function () {
/** section: UserInterface
 *  class da.ui.ProgressBar
 *
 *  Canvas-based progress bar.
 **/
var ProgressBar = new Class({
  Implements: Options,
  
  options: {
    width: 200,
    height: 20,
    foreground: "#33519d"
  },
  
  /**
   *  new da.ui.ProgressBar([canvas], options)
   *  - canvas (Element): already existing DOM node.
   *    Note that in this case, this istance of [[da.ui.ProgressBar]] won't
   *    monitor width/height changes.
   *  - options.width (Number): width of the progress bar.
   *  - options.height (Number): height of the progress bar.
   *  - options.foreground (String): colour of the progress bar.
   *  
   *  #### Notes
   *  To resize the progress bar after initialization use MooTools'
   *  `setStyle` method, since it properly fires `resize` event.
   *
   *      progress_bar.toElement().setStyle("width", 100);
   *
   *  If you want your progress bar as a lovely gradient, just put a `LinearGradient`
   *  object to `options.foreground`.
   *
   *      var pb = new da.ui.ProgressBar({width: 100, height: 5, foreground: "#ffa"});
   *      var gradient = pb.ctx.createLinearGradient(0, 0, 0, 5);
   *      gradient.addColorStop(0, "#ffa");
   *      gradient.addColorStop(1, "#ffe");
   *      pb.options.foregound = gradient;
   *      gradient = null;
   *
   **/
  initialize: function (canvas, options) {
    this.setOptions(options);
    
    if(canvas) {
      this._el = canvas;
    } else {
      this._el = new Element("canvas");
      this._el.width = this.options.width;
      this._el.height = this.options.height;
      this._el.addClass("progressbar");
      
      this._el.addEvent("resize", function () {
        this.options.width = this._el.getWidth();
        this.options.height = this._el.getHeight();
      
        this.progress -= 0.0001;
        this.setProgress(this.progress + 0.0001);
      }.bind(this));
    }
    
    this.ctx = this._el.getContext("2d");
    
    this.progress = 0;
  },
  
  /**
   *  da.ui.ProgressBar#setProgress(progress) -> this
   *  - progress (Number): in 0-1 range.
   *
   *  #### Notes
   *  Use animation with care, it should not be necessary for small changes
   *  especially if the progress bar is narrow.
   * 
   **/
  setProgress: function (p) {
    var current_progress  = this.progress,
        el_width          = this.options.width,
        diff              = p - current_progress,
        increment         = diff > 0,
        // Since most of the time we'll be incrementing
        // progress we can save one if/else condition
        // by "caching" the results immediately
        x                 = current_progress,
        width             = diff;
    
    if(!diff)
      return this;
    
    if(!increment) {
      x = current_progress - (-diff);
      width = current_progress - p;
    }
    
    // This allows SegmentedProgressBar to acutally
    // draw bars with different colours.
    this.ctx.fillStyle = this.options.foreground;
    // We're adding +-1px here because some browsers are unable
    // to render small changes precisely. (even different implementations of WebKit)
    this.ctx[increment ? "fillRect" : "clearRect"](
      (x * el_width) - 1,     0,
      (width * el_width) + 1, this.options.height
    );
    
    this.progress = p;
    
    return this;
  },
  
  /**
   *  da.ui.ProgressBar#rerender() -> this
   *  
   *  #### Notes
   *  Unlike [[da.ui.ProgressBar.setProgress]] this method will render the whole bar,
   *  and thus is not really efficient (but indeed, needed in some situations).
   **/
  rerender: function () {
    var opts = this.options;
    this.ctx.fillStyle = opts.foreground;
    this.ctx.fillRect(0, 0, this.progress * opts.width, opts.height);
    
    delete opts;
    return this;
  },
  
  /**
   *  da.ui.ProgressBar#toElement() -> Element
   **/
  toElement: function () {
    return this._el;
  },
  
  /**
   *  da.ui.ProgressBar#destroy() -> Element
   **/
  destroy: function () {
    this._el.destroy();
    
    delete this._el;
    delete this.ctx;
    delete this.progress;
    delete this.options;
  }
});
da.ui.ProgressBar = ProgressBar;

})();


(function () {
var ProgressBar = da.ui.ProgressBar; 
/** section: UserInterface
 *  class da.ui.SegmentedProgressBar
 *
 *  Display multiple progress bars inside one canvas tag.
 **/
var SegmentedProgressBar = new Class({
  
  /**
   *  new da.ui.SegmentedProgressBar(width, height, segments[, ticks = 0])
   *  - width (Number): width of the progressbar in pixels.
   *  - height (Number): height of the progressbar in pixels.
   *  - segments (Object): names of individual progress bars and their forground
   *    color, see example below.
   *  - ticks (Number): number of 1px marks along the progress bar.
   *
   *  #### Example
   *      var mb = new da.ui.SegmentedProgressBar(100, 15, {
   *        track: "#f00",
   *        load:  "#f3f3f3"
   *      });
   *      
   *      mb.setProgress("track", 0.2);
   *      mb.setProgress("load", 0.52);
   *
   *  The first define progress bar will be in foreground, while
   *  the last defined will be in background;
   *
   **/
  /**
   *  da.ui.SegmentedProgressBar.segments -> {segment1: da.ui.ProgressBar, ...}
   **/
  initialize: function (width, height, segments, ticks) {
    this._index = [];
    this.segments = {};
    this.ticks = ticks;
    
    this._el = new Element("canvas");
    this._el.width = width;
    this._el.height = height;
    this._el.className = "progressbar";
    this.ctx = this._el.getContext("2d");
    
    this._el.addEvent("resize", function () {
      var idx = this._index,
           n = idx.length;
      
      while(n--)
        this.segments[idx[n]].rerender();
    }.bind(this));
    
    for(var segment in segments)
      if(segments.hasOwnProperty(segment)) {
        this._index.push(segment);
        this.segments[segment] = new ProgressBar(this._el, {
          width:      width,
          height:     height,
          foreground: segments[segment]
        });
      }
  },
  
  /**
   *  da.ui.SegmentedProgressBar#setProgress(segment, progress) -> this | false
   *  - segment (String): name of the bar whose progress needs to be updated
   *  - progress (Number): number in 0-1 range.
   **/
  setProgress: function (segment, p) {
    segment = this.segments[segment];
    if(!segment)
      return false;
    
    var idx = this._index,
        n = idx.length;
    
    // Indeed, this is quite naive implementation
    segment.setProgress(p);
    while(n--)
      this.segments[idx[n]].rerender(); 
    
    if(this.ticks) {
      var inc = Math.round(this._el.width/this.ticks),
          h = this._el.height;
      
      this.ctx.fillStyle = "rgba(255, 255, 255, 0.3)";
      //this.ctx.fillStyle = "#ddd";
      for(var n = 0, m = this._el.width; n < m; n += inc) {
        if(n > 5)
          this.ctx.fillRect(n, 0, 1, h);
      }
      this.ctx.fillStyle = "rgba(0, 0, 0, 1)";
    }
    
    return this;
  },
  
  /**
   *  da.ui.SegmentedProgressBar#toElement() -> Element
   **/
  toElement: function () {
    return this._el;
  },
  
  /**
   *  da.ui.SegmentedProgressBar#destroy() -> undefined
   **/
  destroy: function () {
    this._el.destroy();
    delete this._el;
    delete this._index;
    delete this.segments;
    delete this.ctx;
  }
});
da.ui.SegmentedProgressBar = SegmentedProgressBar;
})();


(function () {
var soundManager          = da.vendor.soundManager,
    Song                  = da.db.DocumentTemplate.Song,
    SegmentedProgressBar  = da.ui.SegmentedProgressBar;

/** section: Controllers
 *  class Player
 *  
 *  Player interface and playlist managment class.
 *
 *  #### Notes
 *  This class is private.
 *  Public interface is provided through [[da.controller.Player]].
 *
 *  #### Links
 *  * [soundManager2 API](http://www.schillmania.com/projects/soundmanager2/doc/)
 *
 **/
var Player = {
  
  // We're using term sound for soundManager objects, while
  // song for DocumentTemplate.Song instances.
  /**
   *  Player#sounds -> Object
   *
   *  Cache of SoundManager's object. Keys are id's of [[da.db.DocumentTemplate.Song]].
   **/
  sounds: {},
  
  /**
   *  Player#playlist -> [String, ...]
   *  Contains id's of songs in the playlist.
   **/
  playlist: [],
  _playlist_pos: 0,
  
  /**
   *  Player#queue -> [da.db.DocumentTemplate.Song, ...]
   **/
  queue: [],
  
  /**
   *  Player#nowPlaying -> {song: <da.db.DocumentTemplate.Song>, sound: <SMSound>} 
   **/
  nowPlaying: {
    song: null,
    sound: null
  },
  _loading: [],
  
  play_mode: null,
  
  /**
   *  new Player()
   *  Sets up soundManager2 and initializes player's interface.
   **/
  initialize: function () {
    //soundManager.onready(function () {
    //  da.app.startup.checkpoint("soundmanager");
    //});
    
    da.app.addEvent("ready", this.initializeUI.bind(this));
    
    this.preloadImages()
  },
  
  initializeUI: function () {
    this._el = $("player_pane");
    window.addEvent("resize", function () {
       this._el.style.height = window.getHeight() + "px";
    }.bind(this));
    window.fireEvent("resize");
    
    this.progress_bar = new SegmentedProgressBar(150, 5, {
      track: "#339D4C",
      load:  "#C1C6D4"
    });
    var load_grad = this.progress_bar.ctx.createLinearGradient(0, 0, 0, 5);
    load_grad.addColorStop(0, "#6f7074");
    load_grad.addColorStop(1, "#cfccd7");
    this.progress_bar.segments.load.options.foreground = load_grad;
    load_grad = null;
    
    var track_grad = this.progress_bar.ctx.createLinearGradient(0, 0, 0, 5);
    track_grad.addColorStop(0, "#339D4C");
    track_grad.addColorStop(1, "#326732");
    this.progress_bar.segments.track.options.foreground = track_grad;
    track_grad = null;
    
    this.progress_bar.toElement().id = "track_progress";
    this.progress_bar.toElement().addEvents({
      mouseup: function (e) {
        var sound = Player.nowPlaying.sound;
        if(!sound)
          return;
        
        var p = e.event.offsetX / this.getWidth();
        sound.setPosition(sound.durationEstimate * p);
      },
      mouseover: function () {
        Player.elements.position.fade("in");
      }
    });
    
    var els = {
      info_block:     new Element("div",  {id: "song_info_block" }),
      wrapper:        new Element("div",  {id: "song_details"}),
      cover_wrapper:  new Element("div",  {id: "song_album_cover_wrapper"}),
      album_cover:    new Element("img",  {id: "song_album_cover"}),
      song_title:     new Element("h2",   {id: "song_title",        html: "Unknown"}),
      album_title:    new Element("span", {id: "song_album_title",  html: "Unknown"}),
      artist_name:    new Element("span", {id: "song_artist_name",  html: "Unknown"}),
      controls:       new Element("div",  {id: "player_controls",   "class": "no_selection"}),
      play:           new Element("a",    {id: "play_button",       href: "#"}),
      next:           new Element("a",    {id: "next_song",         href: "#"}),
      prev:           new Element("a",    {id: "prev_song",         href: "#"}),
      position:       new Element("span", {id: "song_position",     href: "#"})
    };
    
    var play_wrapper = new Element("div", {id: "play_button_wrapper"});
    play_wrapper.grab(els.play);
    els.controls.adopt(
      els.prev, play_wrapper, els.next,
      this.progress_bar.toElement(), els.position
    );
    
    els.wrapper.grab(els.song_title);
    els.wrapper.appendText("from ");
    els.wrapper.grab(els.album_title);
    els.wrapper.appendText(" by ");
    els.wrapper.adopt(els.artist_name, els.controls);
    
    els.cover_wrapper.grab(els.album_cover);
    
    els.info_block.adopt(els.cover_wrapper, els.wrapper, new Element("div", {"class": "clear"}));
   
    this._el.adopt(els.info_block);
    
    els.position.set("tween", {duration: "short", link: "cancel"});
    
    this._el.style.visibility = "hidden";
    this._visible = false;
    
    // We're using them in mouseover event, 
    // to avoid creating another closure.
    var next = els.next,
        prev = els.prev;
    els.play.addEvents({
      click: function () {
        Player.playPause();
      },
      
      mouseover: function () {
        if(!next.hasClass("inactive"))
          next.fade("show");
        if(!prev.hasClass("inactive"))
          prev.fade("show");
      }
    });
    
    next.addEvent("click", function () { Player.playNext() });
    next.set("tween", {duration: "short", link: "cancel"});
    
    prev.addEvent("click", function () { Player.playPrev() });
    prev.set("tween", {duration: "short", link: "cancel"});
    
    els.controls.addEvent("mouseleave", function () {
      next.fade("out");
      prev.fade("out");
      Player.elements.position.fade("out");
    });
    
    this.play_mode = "normal";
    
    this.elements = els;
    delete els;
    delete play_wrapper;
    delete play_modes;
  },
  
  /**
   *  Player#play(song) -> undefined
   *  - song (da.db.DocumentTemplate.Song): song to play.
   *
   *  If there is currently another song playing, it will be stopped.
   **/
  play: function (song) {
    var np = this.nowPlaying;
    if(song && np.song && np.song.id === song.id)
      return;
    
    this.elements.play.addClass("active");
    
    if(!song && np.sound.paused) {
      np.sound.resume();
      return;
    }
    
    if(this.sounds[song.id]) {
      np.sound.stop();
      this.sounds[song.id].play();
      this.progress_bar.setProgress("load", 1);
      return;
    }
    
    if(np.sound)
      np.sound.stop();
    
    this._loading.push(song.id);
    var _np_update_buffer = +new Date();
    this.sounds[song.id] = soundManager.createSound({
      id: song.id,
      url: "/uri/" + encodeURIComponent(song.id),
      autoLoad: false,
      autoPlay: false,
      stream: true,
      
      onload: function () {
        if(!song.get("duration"))
          song.update({duration: this.duration});
        
        if(!Player.progress_bar.ticks)
          Player.progress_bar.ticks = Math.round(this.duration / (60 * 1000));
        
        Player._loading.remove(song.id);
      },
      
      onplay: function () {
        Player.setNowPlaying(song);
      },
      
      whileloading: function () {
        // It will usually take less time to load the song than to complete the
        // playback so we're not buffering the updates here.
        if(Player.nowPlaying.sound === this)
          Player.progress_bar.setProgress("load", this.bytesLoaded/this.bytesTotal);
      },
      
      whileplaying: function () {
        var d = +new Date();
        if(d - _np_update_buffer > 1000 && Player.nowPlaying.sound === this) {
          var pb = Player.progress_bar;
          pb.setProgress("track", this.position / this.durationEstimate);
          Player.elements.position.set("text",
            (new Date(this.position)).format("%M:%S") + " of " + (new Date(this.durationEstimate)).format("%M:%S")
          );
          pb = null;
          _np_update_buffer = d;
        }
      },
      
      onfinish: function () {
        song.update({plays: song.get("plays") + 1});
        
        if(Player.nowPlaying.sound === this)
          Player.playbackFinished();
      }
    });
    
    this.sounds[song.id].play();
    np = null;
    
    if(!this._visible) {
      this._visible = true;
      this._el.style.visibility = "visible";
      this.elements.position.position({
        relativeTo: $("track_progress"),
        position:   "centerBottom",
        edge:       "centerTop",
        offset:     {y: 2}
      });
    }
  },
  
  /**
   *  Player#setNowPlaying(song) -> undefined
   *  fires play
   **/
  setNowPlaying: function (song) {
    if(this.nowPlaying.sound)
      this.nowPlaying.sound._last_played = +(new Date());
    
    var pp = this.playlist.indexOf(song.id);
    if(pp !== -1)
      this._playlist_pos = pp;
    delete pp;
    
    this.nowPlaying = {
      song:   song,
      sound:  this.sounds[song.id]
    };
    
    var song_title = song.get("title"),
        els = this.elements;
    
    els.song_title.set("text", song_title);
    els.song_title.title = song_title;
    
    song.get("album", function (album) {
      var title = album.get("title"),
          album_covers = album.get("album_cover_urls"),
          has_album_cover = album_covers && album_covers[2] && album_covers[2].length;
      
      els.album_title.set("text", title);
      els.album_title.title = title;
      els.album_cover.src = has_album_cover ? album_covers[2] : "resources/images/album_cover_2.png";
      
      delete album;
      delete title;
      delete album_covers;
      delete has_album_cover;
    });
    
    song.get("artist", function (artist) {
      var aname = artist.get("title");
      els.artist_name.set("text", aname);
      els.artist_name.title = aname;
      
      aname = null;
      delete els;
    });
    
    if(song.get("duration"))
      this.progress_bar.ticks = Math.round(song.get("duration") / (60*1000));
    
    da.controller.Player.fireEvent("play", [song]);
    song = null;
    
    this.updateNextPrev();
  },
  
  /**
   *  Player#playbackFinished() -> undefined
   *
   *  Called when song finishes playing.
   *  Deterimnes what to do next - load next song in playlist,
   *  repeat this song, etc.
   **/
  playbackFinished: function () {
    this.elements.play.removeClass("active");
    
    this.playNext();
  },
  
  /**
   *  Player#pause() -> undefined
   *  fires pause
   **/
  pause: function () {
    if(!this.nowPlaying.song)
      return;
    
    this.nowPlaying.sound.pause();
    this.elements.play.removeClass("active");
    da.controller.Player.fireEvent("pause", [this.nowPlaying.song]);
  },
  
  /**
   *  Player#playPause([song]) -> undefined
   *
   *  Checks if there is a paused song, if so, it'll be resumed.
   *  If there aren't any paused songs, the fallback `song`,
   *  if provided, will be played instead.
   *
   **/
  playPause: function (song) {
    if(!this.nowPlaying.song && song)
      this.play(song);
    
    if(this.nowPlaying.sound.paused) {
      this.play();
    } else
      this.pause();
  },
  
  /**
   *  Player#playPrev() -> undefined
   **/
  playPrev: function () {
    this.play(Song.findById(this.playlist[this._playlist_pos - 1]));
  },
  
  /**
   *  Player#getNext() -> String
   *  
   *  Returns the ID of the song that will be played next.
   **/
  getNext: function () {
    if(this.queue.length)
      return this.queue[0];
    
    if(this.playlist.length)
      return this.playlist[this._playlist_pos + 1];
  },
  
  /**
   *  Player#playNext() -> undefined
   **/
  playNext: function () {
    var next = this.getNext();
    if(!next)
      return;
    
    if(this.queue.length)
      this.queue.shift();
    if(this.playlist.length)
      this._playlist_pos++;
    
    this.play(Song.findById(next));
  },
  
  /**
   *  Player#positionNextPrev() -> undefined
   **/
  updateNextPrev: function () {
    var els  = this.elements,
        prev = this.playlist[this._playlist_pos - 1],
        next = this.getNext();
    
    prev = prev ? Song.findById(prev) : null;
    next = next ? Song.findById(next) : null;
    
    if(prev)
      els.prev
        .set("text", prev.get("title"))
        .show()
        .position({
          position: "centerLeft",
          edge:     "centerRight",
          relativeTo: els.play
        })
        .removeClass("inactive");
    else
      els.prev.hide().addClass("inactive");
    
    if(next)
      els.next
        .set("text", next.get("title"))
        .show()
        .position({
          position: "centerRight",
          edge:     "centerLeft",
          relativeTo: els.play
        })
        .removeClass("inactive");
    else
      els.next.hide().addClass("inactive");
    
    delete els;
    delete next;
    delete prev;
  },
  
  /**
   *  Player#preloadImages() -> undefined
   **/
  preloadImages: function () {
    var images = [
      "next", "next_active", "previous", "previous_active", "play",
        "album_cover_1", "album_cover_2", "album_cover_3"
      ],
      n = images.length,
      i = null;

    while(n--) {
      i = new Image();
      i.src = "resources/images/" + images[n] + ".png";
    }

    delete images;
    delete n;
  },
  
  /**
   *  Player.switchPlayMode(mode) -> undefined
   *  - mode (String): `normal` or `shuffle`.
   **/
  switchPlayMode: function (mode) {
    var old = this.play_mode;
    this.play_mode = mode;
    
    if(old === "shuffle" || mode === "shuffle") {
      var np = this.nowPlaying.song;
      if(old === "shuffle") {
        this.playlist = this._normalised_playlist || [];
        if(np)
          this._playlist_pos = this.playlist.indexOf(np.id);
        else
          this._playlist_pos = 0;

        delete this._normalised_playlist;
      } else if(mode === "shuffle") {
        this._normalised_playlist = this.playlist;
        // .shuffle() modifies the array itself
        this.playlist = $A(this.playlist).shuffle();
        
        // moving now playing song to the beginning of the playlist
        if(np)
          this.playlist.erase(np.id).unshift(np.id);
        
        this._playlist_pos = 0;
      }
      
      delete np;
    }
    
    
    $("player_toggle_shuffle_menu_item").set("text",
      mode === "shuffle" ? "Turn shuffle off" : "Turn shuffle on"
    );
    
    this.updateNextPrev();
  },
  
  /**
   *  Player#free() -> undefined
   *
   *  Frees memory taken by loaded songs. This method is ran about every 
   *  eight minutes and it destroys all SMSound objects which were played
   *  over eight minutes ago, ie. we're caching only about two songs in memory.
   *
   *  #### External resources
   *  * (The Universality of Song Length?)[http://a-candle-in-the-dark.blogspot.com/2010/02/song-length.html]
   *
   **/
  free: function () {
    var eight_mins_ago = (+ new Date()) - 8*60*1000;
    
    var sound;
    for(var id in this.sounds) {
      sound = this.sounds[id];
      if(this.sounds.hasOwnProperty(id)
      && (this.nowPlaying.song.id !== id)
      && (sound._last_played >= eight_mins_ago || !sound.loaded)) {
        console.log("Freed sound", id, sound._last_played);
        sound.destruct();
        delete this.sounds[id];
      }
    }
    
    sound = null;
  }
};

Player.initialize();

setInterval(function () {
  Player.free();
}, 8*60*1000);

/*
TODO: Should be moved to another controller, Statistics or something alike.
function findAverageDuration(callback) {
  da.db.DEFAULT.view({
    temporary: true,
    map: function (doc, emit) {
      if(doc._deleted || doc.type !== "Song" || !doc.duration)
        return;
    
      emit("duration", doc.duration);
    },
  
    reduce: function (key, values, rereduce) {
      var sum = 0, n = count = values.length;
      while(n--) sum += values[n];
      return {average: sum/count, sample: count};
    },
  
    finished: function (row) {
      var d = row.getRow("duration");
      if(d.average)
        Setting.create({
          id: "average_duration",
          value: d.average,
          sample: d.sample
        });
      
      console.log("average", d.average || 4*60*1000);
    }
  });
}
*/

/**
 * da.controller.Player
 **/
da.controller.Player = {
  /**
   *  da.controller.Player.play([song]) -> undefined
   *  - cap (da.db.DocumentTemplate.Song): the track to be played.
   *  fires play
   **/
  play: function (song) {
    Player.play(song);
  },
  
  /**
   *  da.controller.Player.pause() -> undefined
   *  fires pause
   *  
   *  Pauses the playback (if any).
   **/
  pause: function () {
    Player.pause();
  },
  
  /**
   *  da.controller.Player.queue(id) -> [String, ...]
   *  - id (String): location of the audio file.
   *  
   *  Adds file to the play queue and plays it as soon as currently playing
   *  file finishes playing (if any).
   *  
   *  Returned array contains queued songs.
   **/
  queue: function (id) {
    Player.queue.include(id);
    return Player.queue;
  },
  
  /**
   *  da.controller.Player.getNext() -> String
   *  Returns ID of the [[da.db.DocumentTemplate.Song]] which will be played next.
   **/
  getNext: function () {
    return Player.getNext();
  },
  
  /**
   *  da.controller.Player.getPrev() -> String
   *  Returns ID of the [[da.db.DocumentTemplate.Song]] which which was played before this one.
   **/
  getPrev: function () {
    return Player.playlist[Player._playlist_pos - 1];
  },
  
  /**
   *  da.controller.Player.setPlaylist(playlist) -> undefined
   *  - playlist ([String, ...]): array containing id's of [[da.db.DocumentTemplate.Song]] documents.
   **/
  setPlaylist: function (playlist) {
    if(!playlist || $type(playlist) !== "array")
      return false;
    
    if(Player.play_mode === "shuffle") {
      Player._normalised_playlist = $A(playlist);
      playlist.shuffle();
    }
    
    Player.playlist = playlist;
    if(Player.nowPlaying.song)
      Player._playlist_pos = playlist.indexOf(Player.nowPlaying.song.id)
    else
      Player._playlist_pos = 0;
    
    Player.updateNextPrev();
  },
  
  /**
   *  da.controller.Player.getPlaylist() -> [String, ...]
   *  Returns an array with ids of the songs belonging to the playlist.
   **/
  getPlaylist: function () {
    return Player.playlist;
  },
  
  /**
   *  da.controller.Player.nowPlaying() -> da.db.DocumentTemplate.Song
   **/
  nowPlaying: function () {
    return Player.nowPlaying.song;
  },
  
  /**
   *  da.controller.Player#setPlayMode(mode) -> undefined
   *  - mode (String): `normal`, `shuffle` or `repeat`. (all lowercase)
   **/
  setPlayMode: function (mode) {
    var old = Player.play_mode;
    if(!mode || mode === old)
      return false;
    
    Player.switchPlayMode(mode);
  },
  
  /**
   *  da.controller.Player#toggleMute() -> Boolean
   *  Returns `true` if the sound volume will be set to 0, `false` otherwise.
   **/
  toggleMute: function () {
    var muted = Player.nowPlaying.sound.muted;
    da.vendor.soundManager[muted ? "unmute" : "mute"]();
    $("player_mute_menu_item").set("text", muted ? "Mute" : "Unmute");
    
    return !muted;
  },
  
  _toggleShuffle: function () {
    if(Player.play_mode === "shuffle")
      this.setPlayMode("normal");
    else
      this.setPlayMode("shuffle");
  }
};
$extend(da.controller.Player, new Events());

da.app.fireEvent("ready.controller.Player", [], 1);

})();


/**
 * da.service
 * Access to 3rd party services - last.fm, MusicBrainz, etc.
 **/

if(!da.service)
  da.service = {};

(function () {

/*
 * A JavaScript implementation of the RSA Data Security, Inc. MD5 Message
 * Digest Algorithm, as defined in RFC 1321.
 * Version 2.1 Copyright (C) Paul Johnston 1999 - 2002.
 * Other contributors: Greg Holt, Andrew Kepert, Ydnar, Lostinet
 * Distributed under the BSD License
 * See http://pajhome.org.uk/crypt/md5 for more info.
 */

/*
 * Configurable variables. You may need to tweak these to be compatible with
 * the server-side, but the defaults work in most cases.
 */
var hexcase = 0;  /* hex output format. 0 - lowercase; 1 - uppercase        */
var b64pad  = ""; /* base-64 pad character. "=" for strict RFC compliance   */
var chrsz   = 8;  /* bits per input character. 8 - ASCII; 16 - Unicode      */

/*
 * These are the functions you'll usually want to call
 * They take string arguments and return either hex or base-64 encoded strings
 */
function md5(s){ return hex_md5(s); }
function hex_md5(s){ return binl2hex(core_md5(str2binl(s), s.length * chrsz));}
function b64_md5(s){ return binl2b64(core_md5(str2binl(s), s.length * chrsz));}
function str_md5(s){ return binl2str(core_md5(str2binl(s), s.length * chrsz));}
function hex_hmac_md5(key, data) { return binl2hex(core_hmac_md5(key, data)); }
function b64_hmac_md5(key, data) { return binl2b64(core_hmac_md5(key, data)); }
function str_hmac_md5(key, data) { return binl2str(core_hmac_md5(key, data)); }

/*
 * Perform a simple self-test to see if the VM is working
 */
function md5_vm_test()
{
  return hex_md5("abc") == "900150983cd24fb0d6963f7d28e17f72";
}

/*
 * Calculate the MD5 of an array of little-endian words, and a bit length
 */
function core_md5(x, len)
{
  /* append padding */
  x[len >> 5] |= 0x80 << ((len) % 32);
  x[(((len + 64) >>> 9) << 4) + 14] = len;

  var a =  1732584193;
  var b = -271733879;
  var c = -1732584194;
  var d =  271733878;

  for(var i = 0; i < x.length; i += 16)
  {
    var olda = a;
    var oldb = b;
    var oldc = c;
    var oldd = d;

    a = md5_ff(a, b, c, d, x[i+ 0], 7 , -680876936);
    d = md5_ff(d, a, b, c, x[i+ 1], 12, -389564586);
    c = md5_ff(c, d, a, b, x[i+ 2], 17,  606105819);
    b = md5_ff(b, c, d, a, x[i+ 3], 22, -1044525330);
    a = md5_ff(a, b, c, d, x[i+ 4], 7 , -176418897);
    d = md5_ff(d, a, b, c, x[i+ 5], 12,  1200080426);
    c = md5_ff(c, d, a, b, x[i+ 6], 17, -1473231341);
    b = md5_ff(b, c, d, a, x[i+ 7], 22, -45705983);
    a = md5_ff(a, b, c, d, x[i+ 8], 7 ,  1770035416);
    d = md5_ff(d, a, b, c, x[i+ 9], 12, -1958414417);
    c = md5_ff(c, d, a, b, x[i+10], 17, -42063);
    b = md5_ff(b, c, d, a, x[i+11], 22, -1990404162);
    a = md5_ff(a, b, c, d, x[i+12], 7 ,  1804603682);
    d = md5_ff(d, a, b, c, x[i+13], 12, -40341101);
    c = md5_ff(c, d, a, b, x[i+14], 17, -1502002290);
    b = md5_ff(b, c, d, a, x[i+15], 22,  1236535329);

    a = md5_gg(a, b, c, d, x[i+ 1], 5 , -165796510);
    d = md5_gg(d, a, b, c, x[i+ 6], 9 , -1069501632);
    c = md5_gg(c, d, a, b, x[i+11], 14,  643717713);
    b = md5_gg(b, c, d, a, x[i+ 0], 20, -373897302);
    a = md5_gg(a, b, c, d, x[i+ 5], 5 , -701558691);
    d = md5_gg(d, a, b, c, x[i+10], 9 ,  38016083);
    c = md5_gg(c, d, a, b, x[i+15], 14, -660478335);
    b = md5_gg(b, c, d, a, x[i+ 4], 20, -405537848);
    a = md5_gg(a, b, c, d, x[i+ 9], 5 ,  568446438);
    d = md5_gg(d, a, b, c, x[i+14], 9 , -1019803690);
    c = md5_gg(c, d, a, b, x[i+ 3], 14, -187363961);
    b = md5_gg(b, c, d, a, x[i+ 8], 20,  1163531501);
    a = md5_gg(a, b, c, d, x[i+13], 5 , -1444681467);
    d = md5_gg(d, a, b, c, x[i+ 2], 9 , -51403784);
    c = md5_gg(c, d, a, b, x[i+ 7], 14,  1735328473);
    b = md5_gg(b, c, d, a, x[i+12], 20, -1926607734);

    a = md5_hh(a, b, c, d, x[i+ 5], 4 , -378558);
    d = md5_hh(d, a, b, c, x[i+ 8], 11, -2022574463);
    c = md5_hh(c, d, a, b, x[i+11], 16,  1839030562);
    b = md5_hh(b, c, d, a, x[i+14], 23, -35309556);
    a = md5_hh(a, b, c, d, x[i+ 1], 4 , -1530992060);
    d = md5_hh(d, a, b, c, x[i+ 4], 11,  1272893353);
    c = md5_hh(c, d, a, b, x[i+ 7], 16, -155497632);
    b = md5_hh(b, c, d, a, x[i+10], 23, -1094730640);
    a = md5_hh(a, b, c, d, x[i+13], 4 ,  681279174);
    d = md5_hh(d, a, b, c, x[i+ 0], 11, -358537222);
    c = md5_hh(c, d, a, b, x[i+ 3], 16, -722521979);
    b = md5_hh(b, c, d, a, x[i+ 6], 23,  76029189);
    a = md5_hh(a, b, c, d, x[i+ 9], 4 , -640364487);
    d = md5_hh(d, a, b, c, x[i+12], 11, -421815835);
    c = md5_hh(c, d, a, b, x[i+15], 16,  530742520);
    b = md5_hh(b, c, d, a, x[i+ 2], 23, -995338651);

    a = md5_ii(a, b, c, d, x[i+ 0], 6 , -198630844);
    d = md5_ii(d, a, b, c, x[i+ 7], 10,  1126891415);
    c = md5_ii(c, d, a, b, x[i+14], 15, -1416354905);
    b = md5_ii(b, c, d, a, x[i+ 5], 21, -57434055);
    a = md5_ii(a, b, c, d, x[i+12], 6 ,  1700485571);
    d = md5_ii(d, a, b, c, x[i+ 3], 10, -1894986606);
    c = md5_ii(c, d, a, b, x[i+10], 15, -1051523);
    b = md5_ii(b, c, d, a, x[i+ 1], 21, -2054922799);
    a = md5_ii(a, b, c, d, x[i+ 8], 6 ,  1873313359);
    d = md5_ii(d, a, b, c, x[i+15], 10, -30611744);
    c = md5_ii(c, d, a, b, x[i+ 6], 15, -1560198380);
    b = md5_ii(b, c, d, a, x[i+13], 21,  1309151649);
    a = md5_ii(a, b, c, d, x[i+ 4], 6 , -145523070);
    d = md5_ii(d, a, b, c, x[i+11], 10, -1120210379);
    c = md5_ii(c, d, a, b, x[i+ 2], 15,  718787259);
    b = md5_ii(b, c, d, a, x[i+ 9], 21, -343485551);

    a = safe_add(a, olda);
    b = safe_add(b, oldb);
    c = safe_add(c, oldc);
    d = safe_add(d, oldd);
  }
  return Array(a, b, c, d);

}

/*
 * These functions implement the four basic operations the algorithm uses.
 */
function md5_cmn(q, a, b, x, s, t)
{
  return safe_add(bit_rol(safe_add(safe_add(a, q), safe_add(x, t)), s),b);
}
function md5_ff(a, b, c, d, x, s, t)
{
  return md5_cmn((b & c) | ((~b) & d), a, b, x, s, t);
}
function md5_gg(a, b, c, d, x, s, t)
{
  return md5_cmn((b & d) | (c & (~d)), a, b, x, s, t);
}
function md5_hh(a, b, c, d, x, s, t)
{
  return md5_cmn(b ^ c ^ d, a, b, x, s, t);
}
function md5_ii(a, b, c, d, x, s, t)
{
  return md5_cmn(c ^ (b | (~d)), a, b, x, s, t);
}

/*
 * Calculate the HMAC-MD5, of a key and some data
 */
function core_hmac_md5(key, data)
{
  var bkey = str2binl(key);
  if(bkey.length > 16) bkey = core_md5(bkey, key.length * chrsz);

  var ipad = Array(16), opad = Array(16);
  for(var i = 0; i < 16; i++)
  {
    ipad[i] = bkey[i] ^ 0x36363636;
    opad[i] = bkey[i] ^ 0x5C5C5C5C;
  }

  var hash = core_md5(ipad.concat(str2binl(data)), 512 + data.length * chrsz);
  return core_md5(opad.concat(hash), 512 + 128);
}

/*
 * Add integers, wrapping at 2^32. This uses 16-bit operations internally
 * to work around bugs in some JS interpreters.
 */
function safe_add(x, y)
{
  var lsw = (x & 0xFFFF) + (y & 0xFFFF);
  var msw = (x >> 16) + (y >> 16) + (lsw >> 16);
  return (msw << 16) | (lsw & 0xFFFF);
}

/*
 * Bitwise rotate a 32-bit number to the left.
 */
function bit_rol(num, cnt)
{
  return (num << cnt) | (num >>> (32 - cnt));
}

/*
 * Convert a string to an array of little-endian words
 * If chrsz is ASCII, characters >255 have their hi-byte silently ignored.
 */
function str2binl(str)
{
  var bin = Array();
  var mask = (1 << chrsz) - 1;
  for(var i = 0; i < str.length * chrsz; i += chrsz)
    bin[i>>5] |= (str.charCodeAt(i / chrsz) & mask) << (i%32);
  return bin;
}

/*
 * Convert an array of little-endian words to a string
 */
function binl2str(bin)
{
  var str = "";
  var mask = (1 << chrsz) - 1;
  for(var i = 0; i < bin.length * 32; i += chrsz)
    str += String.fromCharCode((bin[i>>5] >>> (i % 32)) & mask);
  return str;
}

/*
 * Convert an array of little-endian words to a hex string.
 */
function binl2hex(binarray)
{
  var hex_tab = hexcase ? "0123456789ABCDEF" : "0123456789abcdef";
  var str = "";
  for(var i = 0; i < binarray.length * 4; i++)
  {
    str += hex_tab.charAt((binarray[i>>2] >> ((i%4)*8+4)) & 0xF) +
           hex_tab.charAt((binarray[i>>2] >> ((i%4)*8  )) & 0xF);
  }
  return str;
}

/*
 * Convert an array of little-endian words to a base-64 string
 */
function binl2b64(binarray)
{
  var tab = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
  var str = "";
  for(var i = 0; i < binarray.length * 4; i += 3)
  {
    var triplet = (((binarray[i   >> 2] >> 8 * ( i   %4)) & 0xFF) << 16)
                | (((binarray[i+1 >> 2] >> 8 * ((i+1)%4)) & 0xFF) << 8 )
                |  ((binarray[i+2 >> 2] >> 8 * ((i+2)%4)) & 0xFF);
    for(var j = 0; j < 4; j++)
    {
      if(i * 8 + j * 6 > binarray.length * 32) str += b64pad;
      else str += tab.charAt((triplet >> 6*(3-j)) & 0x3F);
    }
  }
  return str;
}

/*
 *
 * Copyright (c) 2008-2010, Felix Bruns <felixbruns@web.de>
 *
 */

function LastFM(options){
	/* Set default values for required options. */
	var apiKey    = options.apiKey    || '';
	var apiSecret = options.apiSecret || '';
	var apiUrl    = options.apiUrl    || 'http://ws.audioscrobbler.com/2.0/';
	var cache     = options.cache     || undefined;

	/* Set API key. */
	this.setApiKey = function(_apiKey){
		apiKey = _apiKey;
	};

	/* Set API key. */
	this.setApiSecret = function(_apiSecret){
		apiSecret = _apiSecret;
	};

	/* Set API URL. */
	this.setApiUrl = function(_apiUrl){
		apiUrl = _apiUrl;
	};

	/* Set cache. */
	this.setCache = function(_cache){
		cache = _cache;
	};

	/* Internal call (POST, GET). */
	var internalCall = function(params, callbacks, requestMethod){
		/* Cross-domain POST request (doesn't return any data, always successful). */
		if(requestMethod == 'POST'){
			/* Create iframe element to post data. */
			var html   = document.getElementsByTagName('html')[0];
			var iframe = document.createElement('iframe');
			var doc;

			/* Set iframe attributes. */
			iframe.width        = 1;
			iframe.height       = 1;
			iframe.style.border = 'none';
			iframe.onload       = function(){
				/* Remove iframe element. */
				//html.removeChild(iframe);

				/* Call user callback. */
				if(typeof(callbacks.success) != 'undefined'){
					callbacks.success();
				}
			};

			/* Append iframe. */
			html.appendChild(iframe);

			/* Get iframe document. */
			if(typeof(iframe.contentWindow) != 'undefined'){
				doc = iframe.contentWindow.document;
			}
			else if(typeof(iframe.contentDocument.document) != 'undefined'){
				doc = iframe.contentDocument.document.document;
			}
			else{
				doc = iframe.contentDocument.document;
			}

			/* Open iframe document and write a form. */
			doc.open();
			doc.clear();
			doc.write('<form method="post" action="' + apiUrl + '" id="form">');

			/* Write POST parameters as input fields. */
			for(var param in params){
				doc.write('<input type="text" name="' + param + '" value="' + params[param] + '">');
			}

			/* Write automatic form submission code. */
			doc.write('</form>');
			doc.write('<script type="application/x-javascript">');
			doc.write('document.getElementById("form").submit();');
			doc.write('</script>');

			/* Close iframe document. */
			doc.close();
		}
		/* Cross-domain GET request (JSONP). */
		else{
			/* Get JSONP callback name. */
			var jsonp = 'jsonp' + new Date().getTime();

			/* Calculate cache hash. */
			var hash = auth.getApiSignature(params);

			/* Check cache. */
			if(typeof(cache) != 'undefined' && cache.contains(hash) && !cache.isExpired(hash)){
				if(typeof(callbacks.success) != 'undefined'){
					callbacks.success(cache.load(hash));
				}

				return;
			}

			/* Set callback name and response format. */
			params.callback = jsonp;
			params.format   = 'json';

			/* Create JSONP callback function. */
			window[jsonp] = function(data){
				/* Is a cache available?. */
				if(typeof(cache) != 'undefined'){
					var expiration = cache.getExpirationTime(params);

					if(expiration > 0){
						cache.store(hash, data, expiration);
					}
				}

				/* Call user callback. */
				if(typeof(data.error) != 'undefined'){
					if(typeof(callbacks.error) != 'undefined'){
						callbacks.error(data.error, data.message);
					}
				}
				else if(typeof(callbacks.success) != 'undefined'){
					callbacks.success(data);
				}

				/* Garbage collect. */
				window[jsonp] = undefined;

				try{
					delete window[jsonp];
				}
				catch(e){
					/* Nothing. */
				}

				/* Remove script element. */
				if(head){
					head.removeChild(script);
				}
			};

			/* Create script element to load JSON data. */
			var head   = document.getElementsByTagName("head")[0];
			var script = document.createElement("script");

			/* Build parameter string. */
			var array = [];

			for(var param in params){
				array.push(encodeURIComponent(param) + "=" + encodeURIComponent(params[param]));
			}

			/* Set script source. */
			script.src = apiUrl + '?' + array.join('&').replace(/%20/g, '+');

			/* Append script element. */
			head.appendChild(script);
		}
	};

	/* Normal method call. */
	var call = function(method, params, callbacks, requestMethod){
		/* Set default values. */
		params        = params        || {};
		callbacks     = callbacks     || {};
		requestMethod = requestMethod || 'GET';

		/* Add parameters. */
		params.method  = method;
		params.api_key = apiKey;

		/* Call method. */
		internalCall(params, callbacks, requestMethod);
	};

	/* Signed method call. */
	var signedCall = function(method, params, session, callbacks, requestMethod){
		/* Set default values. */
		params        = params        || {};
		callbacks     = callbacks     || {};
		requestMethod = requestMethod || 'GET';

		/* Add parameters. */
		params.method  = method;
		params.api_key = apiKey;

		/* Add session key. */
		if(session && typeof(session.key) != 'undefined'){
			params.sk = session.key;
		}

		/* Get API signature. */
		params.api_sig = auth.getApiSignature(params);

		/* Call method. */
		internalCall(params, callbacks, requestMethod);
	};

	/* Album methods. */
	this.album = {
		addTags : function(params, session, callbacks){
			/* Build comma separated tags string. */
			if(typeof(params.tags) == 'object'){
				params.tags = params.tags.join(',');
			}

			signedCall('album.addTags', params, session, callbacks, 'POST');
		},

		getBuylinks : function(params, callbacks){
			call('album.getBuylinks', params, callbacks);
		},

		getInfo : function(params, callbacks){
			call('album.getInfo', params, callbacks);
		},

		getTags : function(params, session, callbacks){
			signedCall('album.getTags', params, session, callbacks);
		},

		removeTag : function(params, session, callbacks){
			signedCall('album.removeTag', params, session, callbacks, 'POST');
		},

		search : function(params, callbacks){
			call('album.search', params, callbacks);
		},

		share : function(params, session, callbacks){
			/* Build comma separated recipients string. */
			if(typeof(params.recipient) == 'object'){
				params.recipient = params.recipient.join(',');
			}

			signedCall('album.share', params, callbacks);
		}
	};

	/* Artist methods. */
	this.artist = {
		addTags : function(params, session, callbacks){
			/* Build comma separated tags string. */
			if(typeof(params.tags) == 'object'){
				params.tags = params.tags.join(',');
			}

			signedCall('artist.addTags', params, session, callbacks, 'POST');
		},

		getEvents : function(params, callbacks){
			call('artist.getEvents', params, callbacks);
		},

		getImages : function(params, callbacks){
			call('artist.getImages', params, callbacks);
		},

		getInfo : function(params, callbacks){
			call('artist.getInfo', params, callbacks);
		},

		getPastEvents : function(params, callbacks){
			call('artist.getPastEvents', params, callbacks);
		},

		getPodcast : function(params, callbacks){
			call('artist.getPodcast', params, callbacks);
		},

		getShouts : function(params, callbacks){
			call('artist.getShouts', params, callbacks);
		},

		getSimilar : function(params, callbacks){
			call('artist.getSimilar', params, callbacks);
		},

		getTags : function(params, session, callbacks){
			signedCall('artist.getTags', params, session, callbacks);
		},

		getTopAlbums : function(params, callbacks){
			call('artist.getTopAlbums', params, callbacks);
		},

		getTopFans : function(params, callbacks){
			call('artist.getTopFans', params, callbacks);
		},

		getTopTags : function(params, callbacks){
			call('artist.getTopTags', params, callbacks);
		},

		getTopTracks : function(params, callbacks){
			call('artist.getTopTracks', params, callbacks);
		},

		removeTag : function(params, session, callbacks){
			signedCall('artist.removeTag', params, session, callbacks, 'POST');
		},

		search : function(params, callbacks){
			call('artist.search', params, callbacks);
		},

		share : function(params, session, callbacks){
			/* Build comma separated recipients string. */
			if(typeof(params.recipient) == 'object'){
				params.recipient = params.recipient.join(',');
			}

			signedCall('artist.share', params, session, callbacks, 'POST');
		},

		shout : function(params, session, callbacks){
			signedCall('artist.shout', params, session, callbacks, 'POST');
		}
	};

	/* Auth methods. */
	this.auth = {
		getMobileSession : function(params, callbacks){
			/* Set new params object with authToken. */
			params = {
				username  : params.username,
				authToken : md5(params.username + md5(params.password))
			};

			signedCall('auth.getMobileSession', params, null, callbacks);
		},

		getSession : function(params, callbacks){
			signedCall('auth.getSession', params, null, callbacks);
		},

		getToken : function(callbacks){
			signedCall('auth.getToken', null, null, callbacks);
		},

		/* Deprecated. Security hole was fixed. */
		getWebSession : function(callbacks){
			/* Save API URL and set new one (needs to be done due to a cookie!). */
			var previuousApiUrl = apiUrl;

			apiUrl = 'http://ext.last.fm/2.0/';

			signedCall('auth.getWebSession', null, null, callbacks);

			/* Restore API URL. */
			apiUrl = previuousApiUrl;
		}
	};

	/* Event methods. */
	this.event = {
		attend : function(params, session, callbacks){
			signedCall('event.attend', params, session, callbacks, 'POST');
		},

		getAttendees : function(params, session, callbacks){
			call('event.getAttendees', params, callbacks);
		},

		getInfo : function(params, callbacks){
			call('event.getInfo', params, callbacks);
		},

		getShouts : function(params, callbacks){
			call('event.getShouts', params, callbacks);
		},

		share : function(params, session, callbacks){
			/* Build comma separated recipients string. */
			if(typeof(params.recipient) == 'object'){
				params.recipient = params.recipient.join(',');
			}

			signedCall('event.share', params, session, callbacks, 'POST');
		},

		shout : function(params, session, callbacks){
			signedCall('event.shout', params, session, callbacks, 'POST');
		}
	};

	/* Geo methods. */
	this.geo = {
		getEvents : function(params, callbacks){
			call('geo.getEvents', params, callbacks);
		},

		getMetroArtistChart : function(params, callbacks){
			call('geo.getMetroArtistChart', params, callbacks);
		},

		getMetroHypeArtistChart : function(params, callbacks){
			call('geo.getMetroHypeArtistChart', params, callbacks);
		},

		getMetroHypeTrackChart : function(params, callbacks){
			call('geo.getMetroHypeTrackChart', params, callbacks);
		},

		getMetroTrackChart : function(params, callbacks){
			call('geo.getMetroTrackChart', params, callbacks);
		},

		getMetroUniqueArtistChart : function(params, callbacks){
			call('geo.getMetroUniqueArtistChart', params, callbacks);
		},

		getMetroUniqueTrackChart : function(params, callbacks){
			call('geo.getMetroUniqueTrackChart', params, callbacks);
		},

		getMetroWeeklyChartlist : function(params, callbacks){
			call('geo.getMetroWeeklyChartlist', params, callbacks);
		},

		getTopArtists : function(params, callbacks){
			call('geo.getTopArtists', params, callbacks);
		},

		getTopTracks : function(params, callbacks){
			call('geo.getTopTracks', params, callbacks);
		}
	};

	/* Group methods. */
	this.group = {
		getMembers : function(params, callbacks){
			call('group.getMembers', params, callbacks);
		},

		getWeeklyAlbumChart : function(params, callbacks){
			call('group.getWeeklyAlbumChart', params, callbacks);
		},

		getWeeklyArtistChart : function(params, callbacks){
			call('group.group.getWeeklyArtistChart', params, callbacks);
		},

		getWeeklyChartList : function(params, callbacks){
			call('group.getWeeklyChartList', params, callbacks);
		},

		getWeeklyTrackChart : function(params, callbacks){
			call('group.getWeeklyTrackChart', params, callbacks);
		}
	};

	/* Library methods. */
	this.library = {
		addAlbum : function(params, session, callbacks){
			signedCall('library.addAlbum', params, session, callbacks, 'POST');
		},

		addArtist : function(params, session, callbacks){
			signedCall('library.addArtist', params, session, callbacks, 'POST');
		},

		addTrack : function(params, session, callbacks){
			signedCall('library.addTrack', params, session, callbacks, 'POST');
		},

		getAlbums : function(params, callbacks){
			call('library.getAlbums', params, callbacks);
		},

		getArtists : function(params, callbacks){
			call('library.getArtists', params, callbacks);
		},

		getTracks : function(params, callbacks){
			call('library.getTracks', params, callbacks);
		}
	};

	/* Playlist methods. */
	this.playlist = {
		addTrack : function(params, session, callbacks){
			signedCall('playlist.addTrack', params, session, callbacks, 'POST');
		},

		create : function(params, session, callbacks){
			signedCall('playlist.create', params, session, callbacks, 'POST');
		},

		fetch : function(params, callbacks){
			call('playlist.fetch', params, callbacks);
		}
	};

	/* Radio methods. */
	this.radio = {
		getPlaylist : function(params, session, callbacks){
			signedCall('radio.getPlaylist', params, session, callbacks);
		},

		tune : function(params, session, callbacks){
			signedCall('radio.tune', params, session, callbacks);
		}
	};

	/* Tag methods. */
	this.tag = {
		getSimilar : function(params, callbacks){
			call('tag.getSimilar', params, callbacks);
		},

		getTopAlbums : function(params, callbacks){
			call('tag.getTopAlbums', params, callbacks);
		},

		getTopArtists : function(params, callbacks){
			call('tag.getTopArtists', params, callbacks);
		},

		getTopTags : function(callbacks){
			call('tag.getTopTags', null, callbacks);
		},

		getTopTracks : function(params, callbacks){
			call('tag.getTopTracks', params, callbacks);
		},

		getWeeklyArtistChart : function(params, callbacks){
			call('tag.getWeeklyArtistChart', params, callbacks);
		},

		getWeeklyChartList : function(params, callbacks){
			call('tag.getWeeklyChartList', params, callbacks);
		},

		search : function(params, callbacks){
			call('tag.search', params, callbacks);
		}
	};

	/* Tasteometer method. */
	this.tasteometer = {
		compare : function(params, callbacks){
			call('tasteometer.compare', params, callbacks);
		}
	};

	/* Track methods. */
	this.track = {
		addTags : function(params, session, callbacks){
			signedCall('track.addTags', params, session, callbacks, 'POST');
		},

		ban : function(params, session, callbacks){
			signedCall('track.ban', params, session, callbacks, 'POST');
		},

		getBuylinks : function(params, callbacks){
			call('track.getBuylinks', params, callbacks);
		},

		getInfo : function(params, callbacks){
			call('track.getInfo', params, callbacks);
		},

		getSimilar : function(params, callbacks){
			call('track.getSimilar', params, callbacks);
		},

		getTags : function(params, session, callbacks){
			signedCall('track.getTags', params, session, callbacks);
		},

		getTopFans : function(params, callbacks){
			call('track.getTopFans', params, callbacks);
		},

		getTopTags : function(params, callbacks){
			call('track.getTopTags', params, callbacks);
		},

		love : function(params, session, callbacks){
			signedCall('track.love', params, session, callbacks, 'POST');
		},

		removeTag : function(params, session, callbacks){
			signedCall('track.removeTag', params, session, callbacks, 'POST');
		},

		search : function(params, callbacks){
			call('track.search', params, callbacks);
		},

		share : function(params, session, callbacks){
			/* Build comma separated recipients string. */
			if(typeof(params.recipient) == 'object'){
				params.recipient = params.recipient.join(',');
			}

			signedCall('track.share', params, session, callbacks, 'POST');
		}
	};

	/* User methods. */
	this.user = {
		getArtistTracks : function(params, callbacks){
			call('user.getArtistTracks', params, callbacks);
		},

		getEvents : function(params, callbacks){
			call('user.getEvents', params, callbacks);
		},

		getFriends : function(params, callbacks){
			call('user.getFriends', params, callbacks);
		},

		getInfo : function(params, callbacks){
			call('user.getInfo', params, callbacks);
		},

		getLovedTracks : function(params, callbacks){
			call('user.getLovedTracks', params, callbacks);
		},

		getNeighbours : function(params, callbacks){
			call('user.getNeighbours', params, callbacks);
		},

		getPastEvents : function(params, callbacks){
			call('user.getPastEvents', params, callbacks);
		},

		getPlaylists : function(params, callbacks){
			call('user.getPlaylists', params, callbacks);
		},

		getRecentStations : function(params, session, callbacks){
			signedCall('user.getRecentStations', params, session, callbacks);
		},

		getRecentTracks : function(params, callbacks){
			call('user.getRecentTracks', params, callbacks);
		},

		getRecommendedArtists : function(params, session, callbacks){
			signedCall('user.getRecommendedArtists', params, session, callbacks);
		},

		getRecommendedEvents : function(params, session, callbacks){
			signedCall('user.getRecommendedEvents', params, session, callbacks);
		},

		getShouts : function(params, callbacks){
			call('user.getShouts', params, callbacks);
		},

		getTopAlbums : function(params, callbacks){
			call('user.getTopAlbums', params, callbacks);
		},

		getTopArtists : function(params, callbacks){
			call('user.getTopArtists', params, callbacks);
		},

		getTopTags : function(params, callbacks){
			call('user.getTopTags', params, callbacks);
		},

		getTopTracks : function(params, callbacks){
			call('user.getTopTracks', params, callbacks);
		},

		getWeeklyAlbumChart : function(params, callbacks){
			call('user.getWeeklyAlbumChart', params, callbacks);
		},

		getWeeklyArtistChart : function(params, callbacks){
			call('user.getWeeklyArtistChart', params, callbacks);
		},

		getWeeklyChartList : function(params, callbacks){
			call('user.getWeeklyChartList', params, callbacks);
		},

		getWeeklyTrackChart : function(params, callbacks){
			call('user.getWeeklyTrackChart', params, callbacks);
		},

		shout : function(params, session, callbacks){
			signedCall('user.shout', params, session, callbacks, 'POST');
		}
	};

	/* Venue methods. */
	this.venue = {
		getEvents : function(params, callbacks){
			call('venue.getEvents', params, callbacks);
		},

		getPastEvents : function(params, callbacks){
			call('venue.getPastEvents', params, callbacks);
		},

		search : function(params, callbacks){
			call('venue.search', params, callbacks);
		}
	};

	/* Private auth methods. */
	var auth = {
		getApiSignature : function(params){
			var keys   = [];
			var string = '';

			for(var key in params){
				keys.push(key);
			}

			keys.sort();

			for(var index in keys){
				var key = keys[index];

				string += key + params[key];
			}

			string += apiSecret;

			/* Needs lastfm.api.md5.js. */
			return md5(string);
		}
	};
}


// TODO: cache is broken, fix it (something with agumenting localStorage)
///require "libs/vendor/javascript-last.fm-api/lastfm.api.cache.js"

/**
 *  class da.vendor.LastFM
 *  
 *  Last.fm API wrapper.
 *
 *  #### Links
 *  * [Last.fm API](http://last.fm/api/intro)
 *  * [Last.fm API wrapper](http://github.com/fxb/javascript-last.fm-api)
 *
 **/
da.vendor.LastFM = LastFM;

})();


(function () {
//var cache = new LastFMCache();
/**
 *  da.service.lastFm -> da.vendor.LastFM
 *  
 *  Default instance of `LastFM` API wrapper.
 *  
 **/
da.service.lastFm = new da.vendor.LastFM({
  apiKey:     "d5219a762390c878548b338d67a28f67",
  // not so secret anymore :)
  apiSecret:  "9ff1e4083ec6e86ef4467262db5b1509",
  cache:      null
});

})();


(function () {
var lastfm = da.service.lastFm,
    Artists = da.db.DocumentTemplate.Artist.view();

function fetchAlbumCover(search_params, album, callback) {
  console.log("Fetching album covers", album.doc.title);
  lastfm.album.getInfo(search_params, {
    success: function (data) {
      var urls = data.album.image ? data.album.image : null,
          n = urls.length,
          url;
      
      while(n--) {
        url = urls[n]["#text"];
        if(!url || !url.length)
          url = "resources/images/album_cover_" + n + ".png";
        
        urls[n] = url;
      }
      
      album.update({
        album_cover_urls: urls,
        lastfm_id:        data.album.id,
        mbid:             data.album.mbid.length ? data.album.mbid : null
      });
      
      // fun fact: typeof /.?/ === "function"
      if(urls && callback)
        callback(urls);
      
      delete callback;
      delete urls;
      delete data;
      delete search_params;
    },
    failure: function () {
      if(!callback)
        return;
      
      var urls = [
        "resources/images/album_cover_0.png",
        "resources/images/album_cover_1.png",
        "resources/images/album_cover_2.png",
        "resources/images/album_cover_3.png"
      ];
      
      album.update({album_cover_urls: urls});
      if(callback)
        callback(urls);
      delete callback;
    }
  });
}

/**
 *  da.service.albumCover(album[, callback]) -> undefined
 *  - album (da.db.DocumentTemplate.Album): album whose album art needs to be fetched
 *  - callback (Function): called once album cover is fetched, with first
 *    argument being an array of four URLs.
 *  
 *  #### Notes
 *  Fetched URLs will be saved to the `song` under 'album_cover_urls' propety.
 **/
da.service.albumCover = function (album, callback) {
  var search_params = {};
  if(album.get("mbid"))
    search_params.mbid = album.get("mbid");
  
  if(!search_params.mbid)
    search_params = {
      album: album.get("title"),
      artist: Artists.getRow(album.get("artist_id")).title
    };
  
  fetchAlbumCover(search_params, album, callback);
  search_params = null;
};

})();


(function () {
var Navigation        = da.controller.Navigation,
    Player            = da.controller.Player,
    NavigationColumn  = da.ui.NavigationColumn,
    Album             = da.db.DocumentTemplate.Album,
    Song              = da.db.DocumentTemplate.Song,
    Playlist          = da.db.DocumentTemplate.Playlist,
    fetchAlbumCover   = da.service.albumCover;

/** section: Controller
 *  class da.controller.Navigation.columns.Root < da.ui.NavigationColumn
 *  filters: All filters provided by other columns.
 *
 *  The root column which provides root menu.
 *  To access the root menu use:
 *
 *        da.controller.Navigation.columns.Root.menu
 **/
Navigation.registerColumn("Root", [], new Class({
  Extends: NavigationColumn,

  title: "Root",
  view: null,

  initialize: function (options) {
    this._data = Navigation.columns.Root.filters;
    this.parent($extend(options, {
      totalCount: 0 // this._data.length
    }));
    this.render();
    this.options.parentElement.style.display = "none";
  },

  getItem: function (index) {
    return {id: index, key: index, value: {title: this._data[index]}};
  }
}));

/**
 *  class da.controller.Navigation.columns.Artists < da.ui.NavigationColumn
 *  filters: [[da.controller.Navigation.columns.Albums]], [[da.controller.Navigation.columns.Songs]]
 *
 *  Displays artists.
 **/
var THE_REGEX = /^the\s*/i;
Navigation.registerColumn("Artists", ["Albums", "Songs"], new Class({
  Extends: NavigationColumn,

  view: {
    id: "artists_column",
    map: function (doc, emit) {
      // If there are no documents in the DB this function
      // will be called with "undefined" as first argument
      if(!doc || doc.type !== "Artist") return;

      emit(doc.id, {
        title: doc.title
      });
    }
  },

  createFilter: function (item) {
    return {artist_id: item.id};
  },

  compareFunction: function (a, b) {
    a = a && a.value.title ? a.value.title.split(THE_REGEX).slice(-1) : a;
    b = b && b.value.title ? b.value.title.split(THE_REGEX).slice(-1) : b;

    if(a < b) return -1;
    if(a > b) return 1;
    return 0;
  }
}));

/**
 *  class da.controller.Navigation.columns.Albums < da.ui.NavigationColumn
 *  filters: [[da.controller.Navigation.columns.Songs]]
 *
 *  Displays albums.
 **/
Navigation.registerColumn("Albums", ["Songs"], new Class({
  Extends: NavigationColumn,

  options: {
    rowHeight: 50
  },

  view: {
    id: "albums_column",

    map: function (doc, emit) {
      if(!doc || doc.type !== "Album" || !this._passesFilter(doc)) return;

      emit(doc.id, {
        title: doc.title,
        icon: doc.album_cover_urls ? doc.album_cover_urls[1] : null
      });
    }
  },

  renderItem: function (index) {
    var item = this.getItem(index);
    if(!item.value.icon) {
      item.value.icon = "resources/images/album_cover_1.png";
      fetchAlbumCover(Album.findById(item.id), function (urls) {
        item.value.icon = urls[1];
      });
    }


    return this.parent(index);
  },

  createFilter: function (item) {
    return {album_id: item.id};
  }
}));

/**
 *  class da.controller.Navigation.columns.Genres < da.ui.NavigationColumn
 *  filters: [[da.controller.Navigation.columns.Songs]]
 *
 *  Displays song genres.
 **/
var GENRES = da.util.GENRES;
Navigation.registerColumn("Genres", ["Songs"], new Class({
  Extends: NavigationColumn,

  view: {
    id: "genres_column",
    map: function (doc, emit) {
      // If there are no documents in the DB this function
      // will be called with "undefined" as first argument
      if(!doc || doc.type !== "Song") return;

      emit(doc.genre || -1, 1);
    },
    reduce: function (key, values, rereduce) {
      //console.log("reduce", key, values);

      if(key !== null) {
        var key_n = isNaN(+key) ? key : + key;

        return {
          title:    typeof key_n === "number" ? GENRES[key_n] || "Unknown" : key_n,
          subtitle: values.length,
          genre:    key_n
        }
      } else {
        var n = values.length, count = 0;
        while(n--)
          count += values[n].subtitle;

        return {
          title:    values[0].title,
          subtitle: count,
          genre:    values[0].genre
        }
      }
    }
  },

  mapReduceFinished: function (view) {
    this._addIdsToReducedView(view);
    this.parent(view);
  },

  mapReduceUpdated: function (view) {
    this._addIdsToReducedView(view);
    this.parent(view);
  },

  _addIdsToReducedView: function (view) {
    var n = view.rows.length;
    while(n--)
      view.rows[n].id = view.rows[n].value.genre;
    return view;
  },

  createFilter: function (item) {
    return {genre: item.value.genre};
  },

  compareFunction: function (a, b) {
    a = a && a.value.title ? a.value.title.split(THE_REGEX).slice(-1) : a;
    b = b && b.value.title ? b.value.title.split(THE_REGEX).slice(-1) : b;

    if(a < b) return -1;
    if(a > b) return 1;
    return 0;
  }
}));


/**
 *  class da.controller.Navigation.columns.Playlists < da.ui.NavigationColumn
 *  filters: [[da.controller.Navigation.columns.Songs]]
 *
 *  Displays songs.
 **/
Navigation.registerColumn("Playlists", ["_PlaylistSongs"], new Class({
  Extends: NavigationColumn,

  view: {
    id: "playlists_column",
    map: function (doc, emit) {
      if(!doc || doc.type !== "Playlist" || !this._passesFilter(doc)) return;

      emit(doc.id, {
        title:    doc.title,
        song_ids: doc.song_ids
      });
    }
  },

  initialize: function (options) {
    this.parent(options);

    this._el.addEvent("click:relay(.action)", function (event, el) {
      var item = this.getItem(el.parentNode.retrieve("column_index"));
      da.controller.Playlist.edit(Playlist.findById(item.id));
    }.bind(this));
  },

  mapReduceUpdated: function (view) {
    this.parent(view);
    if(this._active_el)
      this._el.fireEvent("click:relay(.column_item)", [null, this._active_el], 1);
  },

  createFilter: function (item) {
    var   id = item.id,
          songs = item.value.song_ids;

    return function (song) {
      return song.type === "Song" ? songs.contains(song.id) : song.id === id;
    }
  },

  renderItem: function (index) {
    var item = this.getItem(index),
         data = item.value;

    return (new Element("a", {
      id:       this.options.id + "_column_item_" + item.id,
      href:     "#",
      "class":  index % 2 ? "even" : "odd"
    })).adopt([
      new Element("a", {
        href:     "#",
        html:     "Edit",
        title:    "Edit the playlist",
        "class":  "action"
      }),
      new Element("span", {
        html:     data.title,
        title:    data.title,
        "class":  "title"
      })
    ]);
  }
}));


/**
 *  class da.controller.Navigation.columns.Songs < da.ui.NavigationColumn
 *  filters: none
 *
 *  Displays songs.
 **/
Navigation.registerColumn("Songs", [], new Class({
  Extends: NavigationColumn,

  initialize: function (options) {
    this.parent(options);

    this.addEvent("click", function (item, event, el) {
      el.removeClass("active_column_item");
    }, true);

    this.addEvent("click", function (item, event, el) {
      Player.play(Song.findById(item.id));
      Player.setPlaylist(this._playlist);
    }.bind(this));

    this._onSongChange = this._updateSelectedItem.bind(this);
    da.controller.Player.addEvent("play", this._onSongChange);
  },

  view: {
    id: "songs_column",
    map: function (doc, emit) {
      if(!doc || doc.type !== "Song" || !this._passesFilter(doc))
        return;

      if(doc.title && doc.title.length)
        emit(doc.title, {
          title: doc.title,
          track: doc.track
        });
    }
  },

  mapReduceFinished: function (values) {
    this.parent(values);
    this.createPlaylist();
    this._updateSelectedItem(da.controller.Player.nowPlaying());
  },

  mapReduceUpdated: function (values, rerender) {
    this.parent(values, rerender);
    this.createPlaylist();
  },

  createPlaylist: function () {
    var n = this.options.totalCount,
        playlist = new Array(n);

    while(n--)
      playlist[n] = this._rows[n].id;

    this._playlist = playlist;
    playlist = null;
  },

  compareFunction: function (a, b) {
    a = a && a.value ? a.value.track : a;
    b = b && b.value ? b.value.track : b;

    if(a < b) return -1;
    if(a > b) return 1;
              return 0;
  },

  _updateSelectedItem: function (song) {
    if(!song)
      return false;

    var new_active_el = $(this.options.id + "_column_item_" + song.id);
    if(!new_active_el)
      return false;

    if(this._active_el)
      this._active_el.removeClass("active_column_item");

    this._active_el = new_active_el;
    this._active_el.addClass("active_column_item");
    new_active_el = null;
  },

  destroy: function () {
    da.controller.Player.removeEvent("play", this._onSongChange);
    this.parent()
  }
}));


/**
 *  class da.controller.Navigation.columns.PlaylistSongs < da.controller.Navigation.columns.Songs
 *  filters: none
 *
 *  Displays songs from a playlist - adds drag&drop functionality.
 **/
Navigation.registerColumn("_PlaylistSongs", "Songs", [], new Class({
  Extends: Navigation.columns.Songs,

  view: {
    id: "playlist_songs_column",
    map: function (doc, emit) {
      var type = doc.type;
      if(!doc || (type !== "Song" && type !== "Playlist") || !this._passesFilter(doc))
        return;

      if(type === "Song")
        if(doc._deleted)
          emit("_deleted", doc.id);
        else
          emit(doc.title, {
            title:  doc.title
          });
      else
        emit("_playlist", {
          id:       doc.id,
          title:    doc.title + " (playlist)",
          song_ids: doc.song_ids
        });
    }
  },

  mapReduceFinished: function (view) {
    var playlist_pos = view.findRow("_playlist");
    this.addPositions(view.rows[playlist_pos], view.rows);
    return this.parent(view);
  },

  mapReduceUpdated: function (view) {
    var full_view = da.db.DEFAULT.views[this.view.id].view,
        new_rows = $A(full_view.rows);

    // this is why we can't use this.parent(view, true),
    // we need to add positions to the all elements, before
    // the sorting occurs (remember that `view` contains only the playlist)
    this.addPositions(new_rows[full_view.findRow("_playlist")], new_rows);
    new_rows.sort(this.compareFunction);

    this.options.totalCount = new_rows.length;
    this._rows = new_rows;

    var active = this.getActiveItem();
    this.rerender();

    if(active) {
      console.log("has_active_item");
      this._active_el = $(this.options.id + "_column_item_" + active.id);
      this._active_el.addClass("active_column_item");
    }

    full_view = null;
    new_rows = null;
    active = null;
  },

  compareFunction: function (a, b) {
    a = a && a.value ? a.value.playlist_pos : 0;
    b = b && b.value ? b.value.playlist_pos : 0;

    if(a < b) return -1;
    if(a > b) return 1;
              return 0;
  },

  addPositions: function (playlist, rows) {
    if(playlist) {
      rows.erase(playlist);
      this._playlist = playlist.value.song_ids;
    }
    var n = rows.length,
        playlist = this._playlist;

    while(n--)
      rows[n].value.playlist_pos = playlist.indexOf(rows[n].id);
  },

  createPlaylist: function () {}

  /*
  mapReduceUpdated: function (view) {
    this._rows = $A(da.db.DEFAULT.views[this.view.id].view.rows);
    this._rows.sort(this.compareFunction);
    this.options.totalCount = this._rows.length;
    this.rerender();

    var active = this.getActiveItem();
    if(active) {
      this._active_el = $(this.options.id + "_column_item_" + active.id);
      this._active_el.addClass("active_column_item");
    }
  }
  */
}));


})();

da.app.fireEvent("ready.controller.Navigation", [], 1);
})();




(function () {
var Song = da.db.DocumentTemplate.Song,
    Player = da.controller.Player;

var CONTEXTS = {},
    TAB_SUFFIX = "_context_tab",
    _TS_L = -TAB_SUFFIX.length,
    TAB_CONTAINER_SUFFIX = "_context_tab_container";

/** section: Controllers
 * SongContext 
 **/
var SongContext = {
  /**
   *  SongContext.active -> Object
   **/
  active: null,
  
  initialize: function () {
    this.el = new Element("div", {
      id: "song_context"
    });
    this.tabs = new Element("div", {
      id: "context_tabs",
      "class": "button_group no_selection"
    });
    
    for(var id in CONTEXTS)
      this.tabs.grab(new Element("button", {
        id:   id + TAB_SUFFIX,
        html: CONTEXTS[id].title
      }));
    this.tabs.addEvent("click:relay(button)", function () {
      SongContext.show(this.id.slice(0, _TS_L));
    });
    
    this.loading_screen = new Element("div", {
      id:       "song_context_loading",
      html:     "Loading...",
      "class":  "no_selection",
      style:    "display: none"
    });
    
    $("player_pane").adopt(this.tabs, this.loading_screen, this.el);
    
    function adjustDimensions () {
      SongContext.el.style.height = (
        window.getHeight() - $("song_info_block").getHeight() - SongContext.tabs.getHeight()
      ) + "px";
    }
    
    Player.addEvent("play", function (song) {
      adjustDimensions();
      
      if(SongContext.active)
        SongContext.active.update(song);
    });
     
    window.addEvent("resize", adjustDimensions);
    window.fireEvent("resize");
    
    this.initialized = true;
  },
  
  /**
   *  SongContext#show(id) -> undefined
   *  - id (String): id of the context.
   **/
  show: function (id) {   
    this.hide();
    
    var context = CONTEXTS[id];
    if(!context.__initialized) {
      var container = new Element("div", {id: id + TAB_CONTAINER_SUFFIX});
      context.initialize(container);
      container.hide();
      this.el.grab(container);
      
      delete container;
      context.__initialized = true;
    }
    
    $(id + TAB_SUFFIX).addClass("active");
    this.active = context;
    
    da.controller.SongContext.showLoadingScreen();
    $(id + TAB_CONTAINER_SUFFIX).show();
    context.show();
    context.update(Player.nowPlaying());
  },
  
  /**
   *  SongContext#hide() -> undefined
   *
   *  Hides active tab.
   *
   **/
  hide: function () {
    if(!this.active)
      return;
    
    this.active.hide();
    $(this.active.id + TAB_CONTAINER_SUFFIX).hide();
    $(this.active.id + TAB_SUFFIX).removeClass("active");
  },
  
  /**
   *  SongContext#addTab(id) -> undefined
   *  - id (String): id of the context.
   *
   **/
  addTab: function (id) {
    this.tabs.grab(new Element("button", {
      id:   id + TAB_SUFFIX,
      html: CONTEXTS[id].title
    }));
  }
};

da.app.addEvent("ready", function () {
  SongContext.initialize();
});

/**
 * da.controller.SongContext
 **/
da.controller.SongContext = {
  /**
   *  da.controller.SongContext.register(context) -> undefined
   *  - context.id (String): id of the context. Note that the "root" element of
   *    the context also has to have the same id.
   *  - context.title (String): human-frendly name of the context.
   *  - context.initialize (Function): function called only once, with the container
   *    element as the first argument. All DOM nodes should be added to that element.
   *  - context.show (Function): called every time context's tab is activated.
   *  - context.hide (Function): called when context's tab gets hidden.
   *  - context.update (Function): called when another song starts playing.
   *    The first argument of the function is the new song ([[da.db.DocumentTemplate.Song]]).
   *
   *  #### Example
   *      da.controller.SongContext.register({
   *        id: "artist-info",
   *        initialize: function (container) {
   *          this.el = new Element("div", {id: "artist-info", html: "Hai world!"});
   *          this._shown = false;
   *          // Try to limit youself by putting all needed nodes into
   *          // container element.
   *          container.grab(this.el);
   *
   *        },
   *        show: function () {
   *          // Called everytime this tab is activated.
   *          if(!this._shown) {
   *            this.el.position({relativeTo: this.el.parent()});
   *            this._shown = true;
   *          }
   *        },
   *        hide: function () {
   *          // Called when tab is hidden, use this to stop updating document
   *          // nodes, etc.
   *        },
   *        update: function (song) {
   *          // Called when new song starts playing.
   *        }
   *      }));
   *
   *  #### Notes
   *  When the context is activated for the first time, functions all called in
   *  following order:
   *  * `initialize(container)`
   *  * `show`
   *  * `update(song)`
   *
   *  `show` and `hide` methods should not implement hiding of the "root" element,
   *  rather, adding/removing obsolete events and/or start/stop updating nodes.
   * 
   **/
  register: function (context) {
    if(CONTEXTS[context.id])
      return;
    
    CONTEXTS[context.id] = context;
    
    if(SongContext.initialized)
      SongContext.addTab(context.id);
  },
  
  /**
   *  da.controller.SongContext.show(id) -> undefined
   *  - id (String): id of the tab/context.
   **/
  show: function (id) {
    var active = SongContext.active;
    if((active && active.id === id) || !CONTEXTS[id])
        return;
    
    delete active;
    SongContext.show(id);
  },
  
  /**
   *  da.controller.SongContext.showLoadingScreen() -> undefined
   **/
  showLoadingScreen: function () {
    var screen = SongContext.loading_screen,
        el = SongContext.el;
    screen.style.width = el.getWidth() + "px";
    screen.style.height = el.getHeight() + "px";
    screen.show();
    
    delete screen;
    delete el;
  },
  
  /**
   *  da.controller.SongContext.hideLoadingScreen() -> undefined
   **/
  hideLoadingScreen: function () {
    SongContext.loading_screen.hide();
  }
};

da.app.fireEvent("ready.controller.SongContext", [], 1);

})();





(function () {
var lastfm = da.service.lastFm,
    Artist = da.db.DocumentTemplate.Artist,
    Goal = da.util.Goal;

var CACHE = {};

function fetchArtistInfo(search_params, artist, callback) {
  if(CACHE[artist.id]) {
    if(callback)
      callback(CACHE[artist.id]);
    
    return;
  }

  var info = {},
      fetch_data = new Goal({
        checkpoints: ["bio", "photos", "events", "toptracks", "topalbums"],
        onFinish: function () {
          CACHE[artist.id] = info;
          
          if(callback)
            callback(info);
          
          delete info;
          delete fetch_data;
        }
        /*,
        after: {
          mbid: function () {
            fetchArtistLinks(info.mbid, function (links) {
              if(links)
                info.links = links;
              
              fetch_data.checkpoint("links");
            });
          }
        } */
      });

  lastfm.artist.getInfo(search_params, {
    success: function (data) {
      data = data.artist;
      if(data.mbid && data.mbid.length) {
        info.mbid = data.mbid;
        search_params.mbid = data.mbid;
      }
      
      info.bio = data.bio;
      fetch_data.checkpoint("bio");
    },
    failure: function () {
      fetch_data.checkpoint("bio");
    }
  });
  
  lastfm.artist.getImages(search_params, {
    success: function (data) {
      data = data.images;
      if(!data.image)
        return fetch_data.checkpoint("photos");
      
      if($type(data.image) !== "array")
        data.image = [data.image];
      
      var images = data.image.slice(0, 10),
          n = images.length,
          sizes, m;
      
      while(n--) {
        sizes = images[n].sizes.size;
        m = sizes.length;
        images[n] = {};
        while(m--)
          images[n][sizes[m].name] = sizes[m]["#text"];
      }
      
      info.photos = images;
      info.more_photos_url = data.image[0].url;
      
      delete images;
      delete data;
      
      fetch_data.checkpoint("photos");
    },
    failure: function () {
      fetch_data.checkpoint("photos");
    }
  });
  
  lastfm.artist.getEvents(search_params, {
    success: function (data) {
      data = data.events;
      if(!data.event)
        return fetch_data.checkpoint("events");
      
      if($type(data.event) !== "array")
        data.event = [data.event];
      
      var events = data.event.slice(0, 10),
           n = events.length, event;
      
      while(n--) {
        event = events[n];
        if(+event.cancelled) {
          delete events[n];
          continue;
        }
        
        var loc = event.venue.location;
        events[n] = {
          id: event.id,
          title: [event.venue.name, loc.city, loc.country].join(", "),
          time: event.startDate,
          url: event.url 
        };
      }
      
      info.events = events.clean();
      delete events;
      delete event;
      delete data;
      
      fetch_data.checkpoint("events");
    },
    failure: function () {
      fetch_data.checkpoint("events");
    }
  });
  
  lastfm.artist.getTopTracks(search_params, {
    success: parseTop("track", info, fetch_data),
    failure: function () {
      fetch_data.checkpoint("toptracks");
    }
  });
  
  lastfm.artist.getTopAlbums(search_params, {
    success: parseTop("album", info, fetch_data),
    failure: function () {
      fetch_data.checkpoint("topalbums");
    }
  });
}

function parseTop(what, info, goal) {
  return function (data) {
    data = data["top" + what + "s"];
    if(!data[what])
      return goal.checkpoint("top" + what + "s");
    
    if($type(data[what]) !== "array")
      data[what] = [data[what]];
    
    var items = data[what].slice(0, 10),
         n = items.length,
         item;
    
    while(n--) {
      item = items[n];
      items[n] = {title: item.name};
      if(item.mbid && item.mbid.length)
        items[n].mbid = item.mbid;
    }
    
    info["top_" + what + "s"] = items;
    delete items;
    delete item;
    delete data;
      
    goal.checkpoint("top" + what + "s");
  }
}

/*
// Cross-domain XML: Fail (unless you use Flash)
function fetchArtistLinks(mbid, callback) {
  var req = new Request({
    url: "http://musicbrainz.org/ws/1/artist/" + mbid,
    onSuccess: function (_, data) {
      window.dx = data;
      console.log(data);
      
      //delete req;
    },
    onFailure: function () {
      if(callback)
        callback(false);
      
      //delete req;
    }
  });
  
  req.get({
    type: "xml",
    inc:  "url-rels"
  });
}
*/

/**
 *  da.service.artistInfo(artist, callback) -> undefined
 *  - artist (da.db.DocumentTemplate.Artist): artist whose info needs to be retireved.
 *  - callback (Function): function called when informations are fetched.
 **/
da.service.artistInfo = function artistInfo (artist, callback) {
  var search_params = {};
  if(artist.get("mbid"))
    search_params.mbid = artist.get("mbid");
  else
    search_params.artist = artist.get("title");
    
  fetchArtistInfo(search_params, artist, callback);
};

})();




(function () {
var DocumentTemplate  = da.db.DocumentTemplate,
    Artist            = DocumentTemplate.Artist,
    Album             = DocumentTemplate.Album,
    Song              = DocumentTemplate.Song,
    Goal              = da.util.Goal,
    lastfm            = da.service.lastFm,
    
    CACHE  = {};

function getSimilar (what, search_params, callback) {
  console.log("getSimilar", what);
  lastfm[what].getSimilar(search_params, {
    success: function (data) {
      data = data["similar" + what + "s"];
      var items = data[what];
      
      if(!items || typeof items === "string")
        return callback(false);
      
      if($type(items) !== "array")
        items = [items];
      else
        items = items.slice(0, 10);
      
      var n = items.length, item;
      while(n--) {
        item = items[n];
        items[n] = {
          title: item.name,
          image: item.image && item.image.length ? item.image[2]["#text"] : ""
        };
        
        if(item.mbid && item.mbid.length)
          items[n].mbid = item.mbid;
        
        if(what === "track") {
          items[n].artist = item.artist.name;
          if(item.artist.mbid && item.artist.mbid.length)
            items[n].artist_mbid = item.artist.mbid;
        }
      }
      
      callback(items);
      delete items;
      delete data;
    },
    failure: function () {
      callback(false);
    }
  });
}

/**
 *  da.service.recommendations(song, callback) -> undefined
 *  - song (da.db.DocumentTemplate.Song): songs for which recommendations are needed.
 *  - callback (Function): called once recommended songs and albums are fetched.
 **/
da.service.recommendations = function (song, callback) {
  var recommendations = {}, 
      fetch_data = new Goal({
        checkpoints: ["artists", "songs"],
        onFinish: function () {
          callback(recommendations);
          delete recommendations;
        }
      });
  
  song.get("artist", function (artist) {
    if(CACHE[artist.id]) {
      recommendations.artists = CACHE[artist.id];
      fetch_data.checkpoint("artists");
    } else
      getSimilar("artist", {artist: artist.get("title"), limit: 10}, function (data) {
        if(data)
          CACHE[artist.id] = recommendations.artists = data;
        fetch_data.checkpoint("artists");
      });
    
    if(CACHE[song.id]) {
      recommendations.songs = CACHE[song.id];
      fetch_data.checkpoint("songs");
    } else {  
      var song_search_params;
      if(song.get("mbid"))
        song_search_params = {mbid: song.get("mbid")};
      else
        song_search_params = {
          track:  song.get("title"),
          artist: artist.get("title")
        };
    
      getSimilar("track", song_search_params, function (data) {
        if(data)
          CACHE[song.id] = recommendations.songs = data;
    
        fetch_data.checkpoint("songs");
      });
    }
  });
  
};

})();



(function () {
var Song = da.db.DocumentTemplate.Song,
    CACHE = {};

/**
 *  da.service.musicVideo(song, callback) -> undefined
 *  - song (da.db.DocumentTemplate.Song): song who's music videos are needed.
 *  - callback (Function): function to which results will be passed.
 **/
da.service.musicVideo = function (song, callback) {
  if(CACHE[song.id])
    return !!callback(CACHE[song.id]);
  
  song.get("artist", function (artist) {
    var req = new Request.JSONP({
      url: "http://gdata.youtube.com/feeds/api/videos",
      data: {
        v:        2,
        alt:      "jsonc",
        category: "Music",
        format:   5,
        orderby:  "relevance",
        time:     "all_time",
        q:        artist.get("title") + " " + song.get("title")
      },
      onSuccess: function (results) {
        callback(results.data.items);
        delete req;
      },
      onFailure: function () {
        delete req;
        callback(false);
      }
    });
    req.send();
  });
};

})();





(function () {
var SongContext           = da.controller.SongContext,
    Song                  = da.db.DocumentTemplate.Song,
    Player                = da.controller.Player,
    Dialog                = da.ui.Dialog,
    fetchArtistInfo       = da.service.artistInfo,
    fetchRecommendations  = da.service.recommendations;

SongContext.register({
  id: "artist_info",
  title: "Artist",
  
  initialize: function (container) {
    this.el = container;
    var els = {
      photo_wrapper:  new Element("div", {id: "artist_photo_wrapper"}),
      photo:          new Element("img", {id: "artist_photo"}),
      photo_chooser:  new Element("div", {id: "artist_photo_chooser"}),
      zoomed_photo:   new Element("img", {id: "artist_photo_zoomed"}),
      bio:            new Element("div", {id: "artist_bio"}),
      stats:          new Element("div", {id: "artist_stats"}),
      top_songs:      new Element("ol",  {id: "artist_top_tracks", "class": "context_column"}),
      top_albums:     new Element("ol",  {id: "artist_top_albums", "class": "context_column middle_context_column"}),
      events:         new Element("ul",  {id: "artist_events",     "class": "context_column"})
    };
    
    var clear = new Element("div", {"class": "clear"});
    
    els.stats.adopt(els.top_songs, els.top_albums, els.events, clear);
    els.photo_wrapper.adopt(els.photo, els.photo_chooser);
    this.el.adopt(els.photo_wrapper, els.bio, clear.clone(), els.stats);
    
    els.photo_chooser.addEvent("click:relay(a)", function (event) {
      var index = event.target.retrieve("photo_index");
      if(typeof index === "number")
        this.switchPhoto(index);
    }.bind(this));
    
    this.photo_zoom = new Dialog({
      html: els.zoomed_photo
    });
    
    els.photo.addEvent("click", function (event) {
      this.elements.zoomed_photo.src = this.active_photo.original;
      this.photo_zoom.show();
    }.bind(this));
    
    els.top_songs.addEvent("click:relay(li)", function (event) {
      var index;
      if(event.target.nodeName.toLowerCase() === "a")
        index = event.target.parentNode.retrieve("list_position")
      else
        index = event.target.retrieve("list_position");
      
      if(typeof index !== "number")
        return;
      
      var song_data = this.artist_info.top_tracks[index];
      // TODO: Make an API for this type of things, it should also
      //        update the navigation columns to show the
      song_data.artist_id = this._current_artist.id;
      Song.findFirst({
        properties: song_data,
        onSuccess: function (song) {
          Player.play(song);
        }
      });
      
    }.bind(this));
    
    this.elements = els;
    this._current_artist = {id: null};
    delete els;
    delete clear;
  },
  
  show: $empty,
  hide: $empty,
  
  update: function (song) {
    song.get("artist", function (artist) {
      if(this._current_artist.id === artist.id)
        return !!SongContext.hideLoadingScreen();
      
      this._current_artist = artist;
      fetchArtistInfo(artist, function (info) {  
        this.artist_info = info;
        var els = this.elements;
        
        els.bio.innerHTML = info.bio.summary;
        els.photo.title = artist.get("title");
        this.switchPhoto(0);
        
        this.updatePhotoChooser();
        this.updateLists();
        
        SongContext.hideLoadingScreen();
    
        delete els;
      }.bind(this));
    }.bind(this));
  },
  
  updatePhotoChooser: function () {
    var pc      = this.elements.photo_chooser,
        info    = this.artist_info,
        photos  = info.photos,
        n       = photos.length,
        bullets = new Array(n);
    
    pc.dispose();
    pc.empty();
    
    while(n--)
      bullets[n] = (new Element("a", {
        html: "&bull;",
        href: "#"
      })).store("photo_index", n);
    
    bullets.push(new Element("a", {
      html: "+",
      href: info.more_photos_url,
      title: "More photos of " + this._current_artist.get("title"),
      target: "_blank"
    }));
    
    pc.adopt(bullets);
    this.elements.photo_wrapper.grab(pc);
    
    delete pc;
    delete bullets;
    delete photos;
    delete info;
  },
  
  updateLists: function () {
    var els         = this.elements,
        info        = this.artist_info,
        events      = info.events,
        n;
    
    this.renderList("Top Songs",  $A(info.top_tracks || []), els.top_songs);
    this.renderList("Top Albums", $A(info.top_albums || []), els.top_albums);
    this.renderList("Events",     $A(info.events || []),     els.events);
    
    var max_height = Math.max(
      els.top_songs.getHeight(),
      els.top_albums.getHeight(),
      els.events.getHeight()
    );
    els.top_albums.style.height = max_height + "px";
    
    delete els;
    delete info;
    delete events;
  },
  
  renderList: function (title, items, el) {
    var n = items.length;
    if(!n) {
      el.empty();
      return;
    }
    
    var item;
    while(n--) {
      item = items[n];
      items[n] = (new Element("li"))
        .store("list_position", n)
        .grab(new Element("a", {
          html:   item.title,
          title:  item.title,
          href:   item.url ? item.url : "#",
          target: item.url ? "_blank" : ""
        }));
    }

    el.empty().adopt(items);
    (new Element("li", {
      "class": "title",
      "html":  title
    })).inject(el, "top");
    
    delete el;
    delete items;
    delete item;
  },
  
  switchPhoto: function (n) {
    this.active_photo = this.artist_info.photos[n];
    this.elements.photo.src = this.active_photo.extralarge;
  }
});

SongContext.register({
  id: "recommendations",
  title: "Recommendations",
  
  initialize: function (container) {
    this.el = container;
    var els = {
      artists_title:  new Element("h4", {html: "Artist you might like"}),
      artists:        new Element("div", {id: "recommended_artists"}),
      songs_title:    new Element("h4", {html: "Songs you should check out"}),
      songs:          new Element("ul", {id: "recommended_songs", "class": "context_column"})
    };
      
    this.el.adopt(els.artists_title, els.artists, els.songs_title, els.songs);
    this.elements = els;
    delete els;
  },
  
  show: $empty,
  hide: $empty,
  
  update: function (song) {
    fetchRecommendations(song, function (rec) {
      this.updateArtists($A(rec.artists || []));
      this.updateSongs($A(rec.songs || []));
      delete rec;
      SongContext.hideLoadingScreen();
    }.bind(this));
  },
  
  updateArtists: function (recommendations) {
    this.elements.artists.empty();
    if(!recommendations.length)
      return !!this.elements.artists_title.hide();
    else
      this.elements.artists_title.show();
    
    recommendations = recommendations.slice(0, 5);
    var n = recommendations.length, rec;
    while(n--) {
      rec = recommendations[n];
      recommendations[n] = (new Element("a", {href: "#"}))
        .grab(new Element("img", {
          src:    rec.image,
          title:  rec.title
        }))
        .appendText(rec.title);
    }
    
    this.elements.artists.adopt(recommendations);
    delete recommendations;
    delete rec;
  },
  
  updateSongs: function (recommendations) {
    this.elements.songs.empty();
    if(!recommendations.length)
      return !!this.elements.songs_title.hide();
    else
      this.elements.songs_title.show();
    
    var n = recommendations.length, rec;
    while(n--) {
      rec = recommendations[n];
      recommendations[n] = (new Element("li"))
        .grab(new Element("a", {
          href: "#",
          html: "<strong>{title}</strong> by {artist}".interpolate(rec)
        }));
    }
    
    this.elements.songs.adopt(recommendations);
    delete recommendations;
    delete rec;
  }
});

SongContext.register({
  id: "videos",
  title: "Music Videos",
  
  initialize: function (container) {
    this.el = container;
    this.video = new Element("iframe", {
      id:           "youtube_music_video",
      type:         "text/html",
      width:        640,
      height:       385,
      frameborder:  0,
      "class":      "youtube-player"
    });
    this.search_results = new Element("ul", {
      id: "video_search_results",
      "class": "context_column no_selection"
    });
    
    this.search_results.addEvent("click:relay(li)", function (event, el) {
      var video_id = el.retrieve("video_id");
      
      if(typeof video_id === "undefined")
        return;
      
      this.video.src = "http://www.youtube.com/embed/" + video_id;
      this.video_dialog.show();
    }.bind(this));
    
    this.video_dialog = new Dialog({
      html: this.video,
      onShow: function () {
        Player.pause()
      },
      onHide: function () {
        this.video.src = "about:blank";
      }.bind(this)
    });
    
    this.el.grab(this.search_results);
  },
  
  show: $empty,
  hide: $empty,
  
  update: function (song) {
    SongContext.showLoadingScreen();
    da.service.musicVideo(song, this.updateSearchResults.bind(this));
  },
  
  updateSearchResults: function (results) {
    this.search_results.empty();
    
    if(!results)
      return;
    
    var n = results.length, video;
    
    while(n--) {
      video = results[n];
      results[n] = (new Element("li"))
        .store("video_id", video.id)
        .grab((new Element("a")).adopt(
          new Element("img", {
            src:   video.thumbnail.sqDefault,
            title: video.title
          }),
          new Element("strong", {
            html:     video.title
          }),
//          new Element("small", {
//            html:     (new Date(video.duration)).format("%M:%S")
//          }),
          new Element("p", {
            html: video.description.slice(0, 110) + "&hellip;"
          })
        ));
    }
    
    this.search_results.adopt(results);
    SongContext.hideLoadingScreen();
    delete results;
    delete video;
  }
});

})();





(function () {
var Dialog      = da.ui.Dialog,
    SongsColumn = da.controller.Navigation.columns.Songs,
    Playlist    = da.db.DocumentTemplate.Search,
    ACTIVE      = null;

/** section: Controllers
 *  class SearchResults < da.controller.Navigation.columns.Songs
 **/
var SearchResults = new Class({
  Extends: SongsColumn,
  
  options: {
    id:         "search_results",
    rowHeight:  50
  },
  
  view: {
    id:        null,
    temporary: true,
    
    map: function (doc, emit) {
      var type = doc.type,
          filters = this.options.filters,
          query = this.options.query;
      
      // we have to emit every document because the filters
      // represent OR operation, ie. if user selected ["Title", "Album"]
      // it means that only one of those filters have to be satisfied
      // in order fot the song to show up in the search results.
      
      emit(type, type === "Song" ? {
        id:         doc.id,
        title:      doc.title,
        artist_id:  doc.artist_id,
        album_id:   doc.album_id,
        track:      doc.track,
        match:      query.test(doc.title)
      } : {
        id:     doc.id,
        title:  doc.title,
        match:  query.test(doc.title)
      });
    },
    
    reduce: function (key, values, rereduce) {
      var query = this.options.query;
      
      if(key !== "Song") {
        var _values = {},
            n = values.length,
            val;
        
        while(n--) {
          val = values[n];
          _values[val.id] = val;
        }
        
        return _values;
      } else {
        var n = values.length,
            val;
        
        while(n--) {
          val = values[n];
          values[n] = {
            id:   val.id,
            key:  val.title,
            value: val
          };
        }
          
        return values;
      }
    }
  },
  
  mapReduceFinished: function (view) {
    var songs = view.getRow("Song");
    if(!songs)
      return this.parent({rows: []});
    
    var n = songs.length,
        filters = this.options.filters,
        query  = this.options.query,
        matches;
    
    this._albums = view.getRow("Album");
    this._artists = view.getRow("Artist");
    
    
    while(n--) {
      song = songs[n].value;
      matches = [];
      if(filters.contains("Song"))
        matches.push(song.match);
      if(filters.contains("Album"))
        matches.push(this._albums[song.album_id].match);
      if(filters.contains("Artist"))
        matches.push(this._artists[song.artist_id].match);
      
      var m = matches.length, false_count = 0;
      while(m--)
        if(!matches[m])
          false_count++;
            
      if(false_count === matches.length)
        delete songs[n];
    }
 
    songs = songs.clean();
    this.parent({
      rows: songs
    });
    
    this._finished = true;
    Search.search_field.disabled = false;
    
    this.fireEvent("complete", [songs, this], 1);
  },

  renderItem: function (index) {
    var item    = this.getItem(index),
        data    = item.value,
        query   = this.options.query,
        artist  = this._artists[data.artist_id].title,
        album   = this._albums[data.album_id].title;
    
    return (new Element("a", {
      id:       "search_results_column_item_" + item.id,
      href:     "#",
      title:    "{0} by {1}".interpolate([data.title, artist]),
      "class":  index % 2 ? "even" : "odd"
    }).adopt([
      new Element("span", {html: index + 1,   "class": "result_number"}),
      new Element("span", {
        html: data.title.replace(query, underline),
        "class": "title"
      }),
      new Element("span", {
        html: "{0}from <i>{1}</i> by <i>{2}</i>".interpolate([
          data.track ? "track no." + data.track + " " : "",
          album.replace(query, underline), artist.replace(query, underline)
        ]),
        "class": "subtitle"
      })
    ]));
  },
  
  compareFunction: function (a, b) {
    a = a.key + a.id;
    b = b.key + b.id;
    
    if(a < b) return -1;
    if(a > b) return 1;
    return 0;
  }
});

function underline (str) {
  return "<u>" + str + "</u>";
}


/** section: Controllers
 * class Search
 **/
var Search = ({
  /**
   *  Search.query -> String
   *  Current search query
   **/
  query: "",
  
  /**
   *  Search.active_filters -> [String, ]
   *  List of active filters, possible values are:
   *  * `Song`,
   *  * `Album` or
   *  * `Artist`
   *
   **/
  active_filters: ["Song"],
  
  /**
   *  Search.results_column -> SearchResults
   **/
  results_column: null,
  
  initialize: function () {
    this._el = new Element("div", {id: "search_dialog"});
    this.search_field = new Element("input", {
      type:         "text",
      id:           "search_field",
      placeholder:  "Search..."
    });
    var header = (new Element("form", {
      id:       "search_header",
      action:   "#",
      "class":  "dialog_title"
    })).adopt([
      this.search_field,
      (new Element("div", {
        id: "search_by_filters",
        "class": "button_group"
      })).adopt([
        new Element("button", {id: "search_filter_Song",       html: "Song title", "class": "active"}),
        new Element("button", {id: "search_filter_Album",      html: "Album"}),
        new Element("button", {id: "search_filter_Artist",     html: "Artist"})
      ])
    ]);

    function searchFromField (event) {
      if(event)
        Event.stop(event);
      
      Search.search(Search.search_field.value, Search.active_filters);
    }

    header.addEvent("submit", searchFromField);
    
    var _search_buffer;
    this.search_field.addEvent("keyup", function (event) {
      clearTimeout(_search_buffer);
      _search_buffer = setTimeout(searchFromField, 360);
    });
    this.search_field.addEvent("mousedown", function (event) {
      // since the title is draggable, the text field would never
      // get focus.
      event.stopPropagation();
    });
    
    this._el.grab(header);
    var _sf_l = "search_filter_".length;
    header.addEvent("click:relay(button)", function (event, button) {
      var filter = button.id.slice(_sf_l);
      if(Search.active_filters.contains(filter))
        Search.deactivateFilter(filter);
      else
        Search.activateFilter(filter);
      
      Search.query = null;
      Search.search_field.focus();
      Search.search(Search.search_field.value);
    });
    
    this.dialog = new Dialog({
      title:              header,
      html:               (new Element("div", {id: "search_dialog_wrapper"})).grab(this._el),
      closeButton:        true,
      draggable:          true,
      hideOnOutsideClick: false,
      
      onShow: function () {
        Search.search_field.focus();
      },
      
      onHide: function () {
        if(this.results_column)
          this.results_column.destroy();
        
        delete this.results_column;
      }
    });
    
    this.initialized = true;
    delete header;
  },
  
  /**
   *  Search.show() -> undefined
   **/
  show: function () {
    this.dialog.show();
  },
  
  /**
   *  Search.search(query[, filters, options]) -> undefined | false
   *  - query (String | RegExp): search query.
   *  - filter (String): one of the filters. See [[Search.active_filter]] for 
   *    possible values, this also the default value.
   *  - options (Function): passed to the [[SearchResults]] class.
   *
   *  `false` will be returned in cases when search won't be started:
   *  * if the last query was the same as the new one,
   *  * if the last search hasn't finished,
   *  * there are no active filters.
   *  
   *  #### Notes
   *  If the `query` is a [[String]], modifications to it will be applied
   *  in order to get semi-fuzzy search.
   *  
   *  #### See also
   *  * [Autocomplete fuzzy matching](http://www.dustindiaz.com/autocomplete-fuzzy-matching/)
   *
   **/
  search: function (query, filters, options) {
    if(this.query === query || query.length < 3)
      return false;
    if(!filters || !filters.length)
      filters = this.active_filters;
    if(!filters.length)
      return false;
    
    this.query = query;
    if(this.results_column) {
      if(!this.results_column._finished)
        return false;
      
      this.results_column.destroy();
      delete this.results_column;
    }
    
    if(!(query instanceof RegExp))
      if(query[0] === "/" && query.slice(-1) === "/")
        query = new RegExp(query.slice(1,-1), "ig")
      else if(query.contains(" "))
        query = new RegExp("(" + query.escapeRegExp() + ")", "ig");
      else
        query = new RegExp(query.replace(/\W/g, "").split("").join("\\w*"), "ig");
  
    console.log("searching for", query, filters);
    this.search_field.disabled = true;
    
    // This is a small hack which allows playlist editor 
    // add drag&drop controls, as the options persist between
    // calls.
    if(options)
      this.column_options = options;
    else
      options = this.column_options;
    
    if(!options.parentElement)
      options.parentElement = this._el;
    this.results_column = new SearchResults($extend(options, {
      query:          query,
      filters:        filters
    }));
  },
  
  /**
   *  Search.saveAsPlaylist() -> undefined
   *  Saves search results as a new playlist and opens [[PlaylistEditor#edit]] dialog.
   **/
  saveAsPlaylist: function () {
    if(!this.results_column || !this.results_column.finished)
      return;
    
    var songs   = this.results_column._rows,
        n       = songs.length,
        song_ids = new Array(n);
    
    while(n--)
      song_ids[n] = songs[n].id;
    
    Playlist.create({
      title: "Search results",
      song_ids: song_ids
    }, function (playlist) {
      da.controller.Playlist.edit(playlist);
    });
  },
  
  /**
   *  Search.activateFilter(filter) -> false | undefined
   *  - filter (String): filter to activate. See [[Search.active_filter]] for
   *    possible values.
   **/
  activateFilter: function (filter) {
    if(this.active_filters.contains(filter))
      return false;
    
    $("search_filter_" + filter).addClass("active");
    this.active_filters.push(filter);
  },
  
  /**
   *  Search.deactivateFilter(filter) -> false | undefined
   *  - filter (String): filter to deactivate.
   **/
  deactivateFilter: function (filter) {
    if(!this.active_filters.contains(filter))
      return false;
   
   $("search_filter_" + filter).removeClass("active");
   this.active_filters.erase(filter);
  },
  
  /**
   *  Search.destroy() -> undefined
   **/
  destroy: function () {
    this.dialog.destroy();
    delete this.dialog;
    
    if(this.results_column)
      this.results_column.destroy();
    delete this.results_column;
    delete this._el;
    delete this.search_field;
  }
});

/**
 * da.controller.Search
 **/
da.controller.Search = {
  /**
   *  da.controller.Search.show() -> undefined
   *  
   *  Shows search overlay.
   *
   **/
  show: function () {
    if(!Search.initialized)
      Search.initialize();
    
    Search.column_options = {};
    Search.show();
  },
  /**
   *  da.controller.Search.search(searchTerm[, filters][, options]) -> undefined
   *  - searchTerm (String): the query.
   *  - filters (Array): filters to use, [[Search.active_filters]].
   *  - options (Object): options passed to [[SearchResults]] class.
   *  - options.onComplete (Function): function called with search results as first
   *    argument and instance of the class as the second argument.
   **/
  search: function (term, filters, options) {
    this.show();
    Search.search_field.value = term;
    Search.search(term, filters, options || {});
  }
};

})();






(function () {
var Song              = da.db.DocumentTemplate.Song,
    SERVER            = location.protocol + "//" + location.host,
    XML_HEADER        = '<?xml version="1.0" encoding="UTF-8"?>\n',
    TRACKLIST_REGEXP  = /tracklist/gi,
    TRACKNUM_REGEXP   = /tracknum/gi;

/**
 *  da.util.playlistExporter.XSPF(playlist) -> String
 *  - playlist (da.util.Playlist
 *  
 *  #### External resources
 *  * [XSPF v1 specification](http://xspf.org/xspf-v1.html)
 *  * [XSPF Quickstart](http://xspf.org/quickstart/)
 *  * [XSPF Validator](http://validator.xspf.org/) - we're generating valid XSPF!
 *  
 **/
function XSPFExporter (playlist) {
  var ids = playlist.get("song_ids"),
      file = new Element("root"),
      track_list = new Array(ids.length),
      //track_list = new Element("trackList"),
      song, artist, album, track, duration;
  
  for(var n = 0, m = ids.length; n < m; n++) {
    song = Song.findById(ids[n]);
    // getting a 'belongs to' relationship is always synchronous
    song.get("artist",  function (_a) { artist = _a });
    song.get("album",   function (_a) { album = _a  });
    // XSPF specification requires positive intergers,
    // whereas we're using negative ones indicate that the value isn't present.
    track = song.get("track");
    duration = song.get("duration");
    
    track_list[n] = tag("track", [
      tag("location", makeURL(song)),
      tag("title",    song.get("title").stripTags()),
      tag("creator",  artist.get("title").stripTags()),
      tag("album",    album.get("title").stripTags()),
      track     < 1 ? "" : tag("trackNum", track),
      duration  < 1 ? "" : tag("duration", duration)
    ].join(""));
  }
  
  file.grab(new Element("playlist", {
    version: 1,
    xmlns: "http://xspf.org/ns/0/",
    
    html: [
      tag("title",      playlist.get("title").stripTags()),
      tag("annotation", playlist.get("description").stripTags()),
      tag("trackList",  track_list.join(""))
    ].join("")
  }));
  
  // As per some specification `document.createElement(tagName)`, lowercases
  // tagName if the `document` is an (X)HTML document.
  var output = file.innerHTML
    .replace(TRACKLIST_REGEXP, "trackList")
    .replace(TRACKNUM_REGEXP,  "trackNum");
  
  openDownloadWindow(makeDataURI("application/xspf+xml", XML_HEADER + output));
}

/**
 *  da.util.playlistExporter.M3U(playlist) -> undefined
 *  - playlist (da.db.DocumentTemplate.Playlist): playlist which will be exported
 *
 *  #### Resources
 *  * [Wikipedia article on M3U](http://en.wikipedia.org/wiki/M3U)
 *  * [M3U specification](http://schworak.com/programming/music/playlist_m3u.asp)
 *
 **/
function M3UExporter (playlist) {
  var ids    = playlist.get("song_ids"),
      file = ["#EXTM3U"],
      song;
  
  for(var n = 0, m = ids.length; n < m; n++) {
    song = Song.findById(ids[n]);
    song.get("artist", function (artist) {
      file.push(
        "#EXTINFO:-1,{0} - {1}".interpolate([artist.get("title"), song.get("title")]),
        makeURL(song)
      );
    });
  }
  
  openDownloadWindow(makeDataURI("audio/x-mpegurl", file.join("\n")));
}

/**
 *  da.util.playlistExporter.PLS(playlist) -> String
 *
 *  #### Resources
 *  * [PLS article on Wikipedia](http://en.wikipedia.org/wiki/PLS_(file_format))
 **/
function PLSExporter(playlist) {
  var ids = playlist.get("song_ids"),
      file = ["[playlist]", "NumberOfEntries=" + ids.length],
      song;
  
  for(var n = 0, m = ids.length; n < m; n++) {
    song = Song.findById(ids[n]);
    file.push(
      "File"   + (n + 1) + "=" + makeURL(song),
      "Title"  + (n + 1) + "=" + song.get("title"),
      "Length" + (n + 1) + "=" + song.get("duration")
    )
  }
  
  file.push("Version=2");
  openDownloadWindow(makeDataURI("audio/x-scpls", file.join("\n")));
}

function makeURL(song) {
  var named = "?@@named=" + encodeURIComponent(song.get("title")) + ".mp3";
  return [SERVER, "uri", encodeURIComponent(song.id)].join("/") + named;
}

function makeDataURI(mime_type, data) {
  var x = "data:" + mime_type + ";charset=utf-8," + encodeURIComponent(data);
  return x;
}

function openDownloadWindow(dataURI) {
  var download_window = window.open(dataURI, "_blank", "width=400,height=200");
  window.wdx = download_window;
  
  // This allows Firefox to open the download dialog,
  // while Chrome will show the blank page.
  setTimeout(function () {
    download_window.location = "playlist_download.html";
    download_window.onload = function () {
      var dl = download_window.document.getElementById("download_link");
      dl.href = dataURI;
    };
  }, 2*1000);
}

function tag(tagName, text) {
  return "<" + tagName + ">" + text + "</" + tagName + ">";
}


/**
 * da.util.playlistExporter
 * Methods for exporting playlists to other formats.
 *
 * #### External resources
 * * [A survey of playlist formats](http://gonze.com/playlists/playlist-format-survey.html)
 **/
da.util.playlistExporter = {
  XSPF:   XSPFExporter,
  M3U:    M3UExporter,
  PLS:    PLSExporter
};

})();




(function () {
var Playlist        = da.db.DocumentTemplate.Playlist,
    Song            = da.db.DocumentTemplate.Song,
    Dialog          = da.ui.Dialog,
    Menu            = da.ui.Menu,
    playlistExport  = da.util.playlistExporter,
    SONG_PREFIX     = "playlist_song_";

/** section: Controllers
 *  class PlaylistEditor
 **/
var PlaylistEditor = new Class({
  /**
   *  new PlaylistEditor(playlist)
   *  - playlist (da.db.DocumentTemplate.Playlist): playlist wich will be edited.
   **/
  initialize: function (playlist) {
    this.playlist = playlist;

    var playlist_details = (new Element("div", {
        id: "playlist_details"
      })).adopt(
        new Element("label", {html: "Name of the playlist:", "for": "playlist_title"}),
        new Element("input", {type: "text", value: playlist.get("title"), id: "playlist_title"}),

        new Element("label", {html: "Description:", "for": "playlist_description"}),
        (new Element("textarea", {id: "playlist_description", value: playlist.get("description")}))
      ),
      songs = (new Element("ol", {
        id: "playlist_songs",
        "class": "navigation_column"
      })),
      footer = (new Element("div", {
        "class": "footer"
      })).adopt(
        new Element("button", {
          id: "playlist_delete",
          html: "Delete this playlist",
          events: {
            click: this.destroyPlaylist.bind(this)
          }
        }),
        new Element("button", {
          id: "playlist_add_more_songs",
          html: "Add more songs",
          events: {
            click: this.showSearchDialog.bind(this)
          }
        }),
        new Element("button", {
          id: "playlist_export",
          html: "Export &#x25BC;",
          events: {
            mousedown: function (event) {
              this.export_menu.show(event);
            }.bind(this)
          }
        }),
        new Element("input", {
          type: "submit",
          id: "playlist_save",
          value: "Save",
          events: {
            click: this.save.bind(this)
          }
        })
      ),
      song_ids  = $A(playlist.get("song_ids")),
      n         = song_ids.length;

    while(n--)
      song_ids[n] = this.renderItem(Song.findById(song_ids[n]));

    songs.adopt(song_ids);
    songs.addEvent("click:relay(.action)", this.removeSong.bind(this));

    this._sortable = new Sortables(songs, {
      opacity:    0,
      revert:     false,
      clone:      true,
      constrain:  true
    });

    this._el = (new Element("div", {
      id: "playlist_editor_" + playlist.id,
      "class": "playlist_editor"
    })).adopt(playlist_details, songs, footer);

    this.dialog = new Dialog({
      title: "Edit playlist",
      html: (new Element("div", {
        "class": "playlist_editor_wrapper no_selection"
      })).grab(this._el),
      show:               true,
      closeButton:        true,
      hideOnOutsideClick: false,
      destroyOnHide:      true,
      onHide:             this.destroy.bind(this)
    });

    var export_formats = {};
    for(var format in playlistExport)
      export_formats[format] = {html: "." + format, href: "#"};

    this.export_menu = new Menu({
      items: export_formats,
      position: {
        position:   "center",
        edge:       "center",
        relativeTo: "playlist_export"
      },
      onClick: this.exportPlaylist.bind(this)
    });
  },

  /**
   *  PlaylistEditor#removeSong(event, element) -> undefined
   **/
  removeSong: function (event, element) {
    var el = element.parentNode;
    this._sortable.removeItems(el);
    el.set("slide", {duration: 360, mode: "horizontal"});
    el.slide("out").fade("out").get("slide").chain(function () {
      el.destroy();
      delete el;
    }.bind(this));
  },

  /**
   *  PlaylistEditor#destroyPlaylist(event, element) -> undefined
   **/
  destroyPlaylist: function (event, element) {
    if(!confirm("Are you sure?"))
      return;

    this.playlist.destroy();
    this.destroy();
  },

  /**
   *  PlaylistEditor#save() -> undefined
   **/
  save: function () {
    var ids = this._sortable.serialize(),
         _pref_l = SONG_PREFIX.length,
         n = ids.length;

    while(n--)
      if(ids[n])
        ids[n] = ids[n].slice(_pref_l);

    this.playlist.update({
      title:       $("playlist_title").value,
      description: $("playlist_description").value,
      song_ids:    ids.clean()
    });
  },

  exportPlaylist: function (format) {
    var exporter = playlistExport[format];
    if(!exporter)
      return false;

    exporter(this.playlist);
  },

  renderItem: function (song) {
    return new Element("li", {
      id:   SONG_PREFIX + song.id,
      "class": "column_item"
    }).adopt(
      new Element("a", {
        title:    "Remove this song from the playlist",
        href:     "#",
        "class":  "action"
      }),
      new Element("span", {html: song.get("title")})
    );
  },

  showSearchDialog: function () {
    var addSearchResult = this.addSearchResult.bind(this);

    da.controller.Search.search("/.*?/", ["Song"], {
      onComplete: function (results, column) {
        console.log("Hacking search results");

        column.removeEvents("click");
        column.addEvent("click", addSearchResult);

      }.bind(this)
    });
  },

  addSearchResult: function (item) {
    if($("playlist_song_" + item.id))
      return false;

    item = this.renderItem(Song.findById(item.id));
    $("playlist_songs").grab(item);
    this._sortable.addItems(item);
  },

  destroy: function () {
    this.export_menu.destroy();
    this.playlist = null;
    delete this.dialog;
    delete this.export_menu;
    delete this._el;
  }
});

/** section: Controllers
 *  class AddToPlaylistDialog
 **/
var AddToPlaylistDialog = new Class({
  /**
   *  new AddToPlaylistDialog(song)
   *  - song (da.db.DocumentTemplate.Song): song which will be added to selected playlist.
   **/
  /**
   *  AddToPlaylistDialog#song -> da.db.DocumentTemplate.Song
   **/
  initialize: function (song) {
    this.song = song;

    var playlist_selector = new Element("select", {id: "playlist_selector"}),
        playlists = Playlist.view().rows,
        n = playlists.length;

    while(n--)
      playlist_selector.grab(new Element("option", {
        value: playlists[n].id,
        html: playlists[n].value.title
      }));

    playlist_selector.grab(new Element("option", {
      value: "_new_playlist",
      html: "New playlist"
    }));

    playlist_selector.addEvent("change", this.selectionChange.bind(this));

    this._new_playlist_form = (new Element("div", {id: "add_to_new_pl"})).adopt(
      new Element("label",    {html: "Title:", "for": "add_to_new_pl_title"}),
      new Element("input",    {id:   "add_to_new_pl_title", type: "text"}),
      new Element("label",    {html: "Description:", "for": "add_to_new_pl_description"}),
      new Element("textarea", {id:   "add_to_new_pl_description"})
    );

    this._el = (new Element("form", {
      id: "add_to_pl_dialog"
    }).adopt(
      new Element("div",    {id: "add_to_pl_playlists"}).adopt(
        new Element("label",  {html: "Choose an playlist:", "for": "playlist_selector"}),
        playlist_selector,
        this._new_playlist_form
      ),
      (new Element("div", {"class": "footer"})).grab(
        new Element("input", {
          type: "submit",
          value: "Okay",
          events: {
            click: this.save.bind(this)
          }
        })
      )
    ));

    this._el.addEvent("submit", this.save.bind(this));

    var title = (new Element("div", {"class": "dialog_title no_selection"})).adopt(
      new Element("img",  {
        src: "resources/images/album_cover_1.png",
        id: "add_to_pl_album_cover"
      }),
      new Element("span", {html: song.get("title"), "class": "title"})
    );

    this.dialog = new Dialog({
      title: title,
      html: (new Element("div", {"class": "add_to_pl_wrapper"})).grab(this._el),
      closeButton:    true,
      show:           true,
      destroyOnHide:  true
    });

    this.song.get("album", function (album) {
      title.appendText("from ").grab(
        new Element("span", {html: album.get("title")})
      );

      var album_covers = album.get("album_cover_urls");
      if(album_covers && album_covers[1])
        $("add_to_pl_album_cover").src = album_covers[1];
    });

    this.song.get("artist", function (artist) {
      title.appendText(" by ").adopt(
        new Element("span", {html: artist.get("title")}),
        new Element("div", {"class": "clear"})
      );
    });

    this._playlist_selector = playlist_selector;
    playlist_selector = null;
    this.selectionChange();
  },

  /**
   *  AddToPlaylistDialog#save([event]) -> undefined
   **/
  save: function (event) {
    if(event)
      Event.stop(event);

    var playlist_id = this._playlist_selector.value;
    if(playlist_id === "_new_playlist") {
      var title = $("add_to_new_pl_title");
      if(!title.value.length)
        return title.focus();

      Playlist.create({
        title:        title.value,
        description:  $("add_to_new_pl_description").value,
        song_ids:     [this.song.id]
      });
    } else {
      var playlist = Playlist.findById(playlist_id);
      playlist.get("song_ids").include(this.song.id);
      playlist.save();
      playlist = null;
    }

    this.destroy();
  },

  /**
   *  AddToPlaylistDialog#selectionChange() -> undefined
   *  Called on `change` event by playlist selector.
   **/
  selectionChange: function () {
    if(this._playlist_selector.value === "_new_playlist")
      this._new_playlist_form.show();
    else
      this._new_playlist_form.hide();
  },

  /**
   *  AddToPlaylistDialog#destroy() -> undefined
   **/
  destroy: function () {
    this.song = null;
    this.dialog.destroy();
    delete this.dialog;
    delete this._el;
    delete this._playlist_selector;
    delete this._new_playlist_form;
  }
});

/**
 * da.controller.Playlist
 **/
da.controller.Playlist = {
  /**
   *  da.controller.Playlist.edit(playlist) -> undefined
   *  - playlist (da.db.DocumentTemplate.Playlist): playlist which will be edited.
   **/
  edit: function (playlist) {
    new PlaylistEditor(playlist);
  },

  /**
   *  da.controller.Playlist.addSong([song]) -> undefined
   *  - song (da.db.DocumentTemplate.Song): song which will be added to an playlist.
   *    If not provided, [[da.controller.Player.nowPlaying]] will be used.
   **/
  addSong: function (song) {
    if(!song)
      song = da.controller.Player.nowPlaying();
    if(!song)
      return false;

    new AddToPlaylistDialog(song);
  }
};

da.app.fireEvent("ready.controller.Playlist", [], 1);
})();







(function () {
var DocumentTemplate  = da.db.DocumentTemplate,
    Song              = DocumentTemplate.Song,
    Artist            = DocumentTemplate.Artist,
    Album             = DocumentTemplate.Album,
    Setting           = DocumentTemplate.Setting,
    Goal              = da.util.Goal,
    GENRES            = da.util.GENRES;

/** section: Controllers
 *  class CollectionScanner
 *  
 *  Controller which operates with [[Scanner]] and [[Indexer]] WebWorkers.
 *  
 *  #### Notes
 *  This is private class.
 *  Public interface is provided via [[da.controller.CollectionScanner]].
 **/
var CollectionScanner = new Class({
  /**
   *  new CollectionScanner()
   *  
   *  Starts a new scan using [[Application.caps.music]] as root directory.
   **/
  initialize: function (root) {
    root = root || da.app.caps.music;
    if(!root) {
      this.finished = true;
      return false;
    }
    
    console.log("collection scanner started");
    this.indexer = new Worker("js/workers/indexer.js");
    this.indexer.onmessage = this.onIndexerMessage.bind(this);
    
    this.scanner = new Worker("js/workers/scanner.js");
    this.scanner.onmessage = this.onScannerMessage.bind(this);
    
    this.scanner.postMessage(root);
    
    this.finished = false;
    
    this._found_files = 0;
    this._goal = new Goal({
      checkpoints: ["scanner", "indexer"],
      onFinish: function () {
        this.finished = true;
        this.destroy();
        
        da.ui.ROAR.alert(
          "Collection scanner finished",
          "{0} songs have been found. {1}".interpolate([
            this._found_files,
            this._found_files ? "Your patience has paid off." : "Make sure your files have proper ID3 tags." 
          ])
        );
        
        Setting.findById("last_scan").update({value: new Date()});
      }.bind(this)
    });
    
    da.ui.ROAR.alert(
      "Collection scanner started",
      "Your musical collection is being scanned. You should see new artists showing \
      up in the area above. Patience."
    );
  },
  
  /**
   *  CollectionScanner#finished -> true | false
   **/
  finished: false,
    
  onScannerMessage: function (event) {
    var cap = event.data;
    if(cap === "**FINISHED**") {
      this._goal.checkpoint("scanner");
      return;
    }
    
    if(cap.debug) {
      console.log("SCANNER", cap.msg, cap.obj);
      return;
    }
    
    if(da.db.DEFAULT.views.Song.view.findRow(cap) === -1)
      this.indexer.postMessage(cap);
  },
  
  onIndexerMessage: function (event) {
    if(event.data === "**FINISHED**") {
      this._goal.checkpoint("indexer");
      return;
    }
    
    if(event.data.debug) {
      console.log("INDEXER", event.data.msg, event.data.obj);
      return;
    }
    
    // Lots of async stuff is going on, a short summary would look something like:
    // 1. find or create artist with given name and save its id
    //    to artist_id.
    // 2. look for an album with given artist_id (afterCheckpoint.artist)
    // 3. save the album data.
    // 4. look for song with given id and save the new data.
    this._found_files++;
    
    var tags = event.data,
        album_id, artist_id,
        links = new Goal({
          checkpoints: ["artist", "album"],
          onFinish: function () {
            Song.findOrCreate({
              properties: {id: tags.id},
              onSuccess: function (song) {
                song.update({
                  title:      tags.title,
                  track:      tags.track,
                  year:       tags.year,
                  genre:      fixGenre(tags.genre),
                  artist_id:  artist_id,
                  album_id:   album_id,
                  plays:      0
                });
                
                delete links;
                delete artist_id;
                delete album_id;
              }
            });
          },
          
          afterCheckpoint: {
            artist: function () {
              Album.findOrCreate({
                properties: {artist_id: artist_id, title: tags.album},
                onSuccess: function (album, wasCreated) {
                  album_id = album.id;
                  if(wasCreated)
                    album.save(function () { links.checkpoint("album"); })
                  else
                    links.checkpoint("album");
                }
              });
            }
          }
        });
    
    Artist.findOrCreate({
      properties: {title: tags.artist},
      onSuccess: function (artist, was_created) {
        artist_id = artist.id;
        if(was_created)
          artist.save(function () { links.checkpoint("artist"); });
        else
          links.checkpoint("artist");
      }
    });
  },
  
  /**
   *  CollectionScanner#destroy() -> undefined
   *  
   *  Instantly kills both workers.
   **/
  destroy: function () {
    this.indexer.terminate();
    this.scanner.terminate();
    
    delete this.indexer;
    delete this.scanner;
    delete this.goal;
  }
});

function fixGenre (genre) {
  return typeof genre === "number" ? genre : (GENRES.contains(genre) ? GENRES.indexOf(genre) : genre);
}

Setting.register({
  id:           "last_scan",
  group_id:     "CollectionScanner",
  representAs:  "text",
  title:        "Last scan",
  help:         "The date your collection was scanned.",
  value:        new Date(0)
});

da.app.addEvent("ready", function () {
  var last_scan = Setting.findById("last_scan"),
       five_days_ago = (new Date()) - 5*24*60*60*1000;
  if((new Date(last_scan.get("value"))) < five_days_ago)
    da.controller.CollectionScanner.scan();
});

var CS;
/**
 * da.controller.CollectionScanner
 * Public interface of [[CollectionScanner]].
 **/
da.controller.CollectionScanner = {
  /**
   *  da.controller.CollectionScanner.scan() -> undefined
   *  Starts scanning music directory
   **/
  scan: function (cap) {
    if(!CS || (CS && CS.finished))
      CS = new CollectionScanner(cap);
    else if(cap && cap.length)
      CS.scanner.postMessage(cap);
  },
  
  /**
   *  da.controller.CollectionScanner.isScanning() -> true | false
   **/
  isScanning: function () {
    return CS ? !CS.finished : false;
  }
};

da.app.fireEvent("ready.controller.CollectionScanner", [], 1);

})();



