/**
 *  == Workers ==
 *  
 *  Web Workers used to dispach computation-heavy work into background.
 **/

/** section: Workers, related to: CollectionScanner
 * Indexer
 * 
 *  This Worker is responsible for fetching MP3 files and then
 *  extracting ID3 metadata, which could grately slowup the interface.
 *
 *  Messages sent to this worker have to contain only a read-cap to
 *  an MP3 file stored in Tahoe (without /uri/ prefix).
 *
 *  Messages sent from this worker are objects returned by ID3 parser. 
 *
 *  #### Notes
 *  It has been detected that Tahoe (to be correct, it's web server) can't
 *  handle well large number of simoultanious requests, therefore we're limiting
 *  the number of files that can be fetched at the same time to one.
 *  
 *  Since it's also possible that it will take more time for the [[Scanner]]
 *  to find all the files than it will take the [[Indexer]] we're allowing
 *  about 30-second delay before finally sending the "I'm done" message to the
 *  [[da.controller.CollectionScanner]].
 *
 **/

var window = this,
    document = {},
    queue = [];

this.da = {};

var console = {
  log: function (msg, obj) {
    postMessage({debug: true, msg: msg, obj: obj});
  }
};

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

var Browser = {};
Browser.Request = function(){
	return $try(function(){
		return new XMLHttpRequest();
	}, function(){
		return new ActiveXObject('MSXML2.XMLHTTP');
	}, function(){
		return new ActiveXObject('Microsoft.XMLHTTP');
	});
};


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
		this.response.json = JSON.parse(text, this.options.secure);
		this.onSuccess(this.response.json, text);
	}

});

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

//#require <libs/util/util.js>

/*
 *  Binary Ajax 0.2
 *  
 *  Copyright (c) 2008 Jacob Seidelin, cupboy@gmail.com, http://blog.nihilogic.dk/
 *  Copyright (c) 2010 Josip Lisec <josiplisec@gmail.com>
 *  MIT License [http://www.opensource.org/licenses/mit-license.php]
 *  
 *  Adoption for MooTools, da.util.BinaryFile#unpack(), da.util.BinaryFile#getBitsAt() and Request.Binary 
 *  were added by Josip Lisec.
 */

(function () {
/** section: Utilities
 *  class da.util.BinaryFile
 *  
 *  Class containing methods for working with files as binary data.
 **/

var UNPACK_FORMAT = /(\d+\w|\w)/g,
    WHITESPACE    = /\s./g;

var BinaryFile = new Class({
  /**
   *  new da.util.BinaryFile(data[, options])
   *  - data (String): the binary data.
   *  - options.offset (Number): initial offset.
   *  - options.length (Number): length of the data.
   *  - options.bigEndian (Boolean): defaults to `false`.
   **/
  initialize: function (data, options) {
    options = options || {};
    this.data = data;
    this.offset = options.offset || 0;
    this.length = options.length || data.length || 0;
    this.bigEndian = options.bigEndian || false;
    
    //if(typeof data === "string") {
    //  this.length = this.length || data.length;
    //} else {
      // In this case we're probably dealing with IE,
      // and in order for this to work, VisualBasic-script magic is needed,
      // for which we don't have enough of mana.
    //  throw Exception("We're lacking some mana. Please use different browser."); 
    //}
  },
  
  /**
   *  da.util.BinaryFile#getByteAt(offset) -> Number
   **/
  getByteAt: function (offset) {
    return this.data.charCodeAt(offset + this.offset) & 0xFF;
  },
  
  /**
   *  da.util.BinaryFile#getSByteAt(offset) -> Number
   **/
  getSByteAt: function(iOffset) {
    var iByte = this.getByteAt(iOffset);
    return iByte > 127 ? iByte - 256 : iByte;
  },

  /**
   *  da.util.BinaryFile#getShortAt(offset) -> Number
   **/
  getShortAt: function(iOffset) {
    var iShort = this.bigEndian ? 
      (this.getByteAt(iOffset) << 8) + this.getByteAt(iOffset + 1)
      : (this.getByteAt(iOffset + 1) << 8) + this.getByteAt(iOffset)
    
    return iShort < 0 ? iShort + 65536 : iShort;
  },
  
  /**
   *  da.util.BinaryFile#getSShortAt(offset) -> Number
   **/
  getSShortAt: function(iOffset) {
    var iUShort = this.getShortAt(iOffset);
    return iUShort > 32767 ? iUShort - 65536 : iUShort;
  },
  
  /**
   *  da.util.BinaryFile#getLongAt(offset) -> Number
   **/
  getLongAt: function(iOffset) {
    var iByte1 = this.getByteAt(iOffset),
        iByte2 = this.getByteAt(iOffset + 1),
        iByte3 = this.getByteAt(iOffset + 2),
        iByte4 = this.getByteAt(iOffset + 3);

    var iLong = this.bigEndian ? 
      (((((iByte1 << 8) + iByte2) << 8) + iByte3) << 8) + iByte4
      : (((((iByte4 << 8) + iByte3) << 8) + iByte2) << 8) + iByte1;
    if (iLong < 0) iLong += 4294967296;
    return iLong;
  },
  
  /**
   *  da.util.BinaryFile#getSLongAt(offset) -> Number
   **/
  getSLongAt: function(iOffset) {
    var iULong = this.getLongAt(iOffset);
    return iULong > 2147483647 ? iULong - 4294967296 : iULong;
  },
  
  /**
   *  da.util.BinaryFile#getStringAt(offset, length) -> String
   **/
  getStringAt: function(offset, length) {
    var str = new Array(length);
    length += offset;
    
    for(var i = 0; offset < length; offset++, i++)
      str[i] = String.fromCharCode(this.getByteAt(offset));

    return str.join("");
  },

  /**
   *  da.util.BinaryFile#getCharAt(offset) -> String
   *  - offset (Number): position of the character.
   **/
  getCharAt: function(iOffset) {
    return String.fromCharCode(this.getByteAt(iOffset));
  },
  
  /**
   *  da.util.BinaryFile#getBitsAt(offset[, length]) -> Array
   *  - offset (Number): position of character.
   *  - length (Number): number of bits, if result has less, zeors will be appended at the begging.
   *  
   *  Returns an array with bit values.
   *  
   *  #### Example
   *      (new da.util.BinaryFile("2")).getBitsAt(0, 8)
   *      // -> [0, 0, 1, 1, 0, 0, 1, 0]
   *  
   **/
  getBitsAt: function (offset, padding) {
    var bits = this.getByteAt(offset).toString(2);
    padding = padding || 8;
    if(padding && bits.length < padding) {
      var delta = padding - bits.length;
      padding = [];
      while(delta--) padding.push(0);
      bits = padding.concat(bits).join("");
    }
    
    var n = bits.length,
        result = new Array(n);
    
    while(n--)
      result[n] = +bits[n];
    
    return result;
  },
  
  /**
   *  da.util.BinaryFile#getBitsFromStringAt(offset, length) -> Array
   *  - offset (Number): position of the first character.
   *  - length (Number): length of the string.
   *  
   *  Returns an array with return values of [[da.util.BinaryFile#getBitsAt]].
   **/
  getBitsFromStringAt: function (offset, length) {
    var bits = new Array(length);
    length += offset;
    
    for(var i = 0; offset < length; offset++, i++)
      bits[i] = this.getBitsAt(offset);
    
    return bits;
  },
  
  /**
   *  da.util.BinaryFile#toEncodedString() -> String
   *  Returns URI encoded value of data.
   *  
   *  We're not using from/toBase64 because `btoa()`/`atob()` functions can't convert everything to/from Base64 encoding,
   *  `encodeUriComponent()` method seems to be more reliable.
   **/
  toEncodedString: function() {
    return encodeURIComponent(this.data);
  },
  
  /**
   *  da.util.BinaryFile#unpack(format) -> Array
   *  - format (String): String according to which data will be unpacked.
   *  
   *  This method is using format similar to the one used in Python, and does exactly the same job,
   *  mapping C types to JavaScript ones.
   *  
   *  
   *  #### Code mapping
   *  <table cellspacing="3px">
   *    <thead style="border-bottom:3px double #ddd">
   *      <tr><td>Code</td><td>C type</td><td>Returns</td><td>Function</td></tr>
   *    </thead>
   *    <tbody>
   *      <tr>
   *        <td>b</td>
   *        <td><code>_Bool</code></td>
   *        <td>[[Boolean]]</td>
   *        <td></td>
   *      </tr>
   *      <tr>
   *        <td>c</td>
   *        <td><code>char</code></td>
   *        <td>[[String]]</td>
   *        <td>String with one character</td>
   *      </tr>
   *      <tr>
   *        <td>h</td>
   *        <td><code>short</code></td>
   *        <td>[[Number]]</td>
   *        <td></td>
   *      </tr>
   *      <tr>
   *        <td>i</td>
   *        <td><code>int</code></td>
   *        <td>[[Number]]</td>
   *        <td></td>
   *      </tr>
   *      <tr>
   *        <td>l</td>
   *        <td><code>long</code></td>
   *        <td>[[Number]]</td>
   *        <td></td>
   *      </tr>
   *      <tr>
   *        <td>s</td>
   *        <td><code>char[]</code></td>
   *        <td>[[String]]</td>
   *        <td></td>
   *      </tr>
   *      <tr>
   *        <td>S</td>
   *        <td><code>char[]</code></td>
   *        <td>[[String]]</td>
   *        <td>String with removed whitespace (including <code>\0</code> chars)</td>
   *      </tr>
   *      <tr>
   *        <td>t</td>
   *        <td><code>int</code></td>
   *        <td>[[Array]]</td>
   *        <td>Returns an array with bit values</td>
   *      </tr>
   *      <tr>
   *        <td>T</td>
   *        <td><code>char</code></td>
   *        <td>[[Array]]</td>
   *        <td>Returns an array of arrays with bit values.</td>
   *      </tr>
   *      <tr>
   *        <td>x</td>
   *        <td><code>/</code></td>
   *        <td>[[String]]</td>
   *        <td>Padding byte</td>
   *      </tr>
   *    </tbody>
   *  </table>
   *  
   *  
   *  #### External resources
   *  * [Python implementation of `unpack`](http://docs.python.org/library/struct.html#format-strings)
   **/
  unpack: function (format) {
    format = format.replace(WHITESPACE, "");
    var pairs = format.match(UNPACK_FORMAT),
        n = pairs.length,
        result = [];
    
    if(!pairs.length)
      return pairs;
    
    var offset = 0;
    for(var n = 0, m = pairs.length; n < m; n++) {
      var pair    = pairs[n],
          code    = pair.slice(-1),
          repeat  = +pair.slice(0, pair.length - 1) || 1;
      
      switch(code) {
        case 'b':
          while(repeat--)
            result.push(this.getByteAt(offset++) === 1);
          break;
        case 'c':
          while(repeat--)
            result.push(this.getCharAt(offset++));
          break;
        case 'h':
          while(repeat--) {
            result.push(this.getShortAt(offset));
            offset += 2;
          }
          break;
        case 'i':
          while(repeat--)
            result.push(this.getByteAt(offset++));
          break;
        case 'l':
          while(repeat--) {
            result.push(this.getLongAt(offset));
            offset += 4;
          }
          break;
        case 's':
          result.push(this.getStringAt(offset, repeat));
          offset += repeat;
          break;
        case 'S':
          result.push(this.getStringAt(offset, repeat).strip());
          offset += repeat;
          break;
        case 't':
          while(repeat--)
            result.push(this.getBitsAt(offset++, 2));
          break;
        case 'T':
          result.push(this.getBitsFromStringAt(offset, repeat));
          offset += repeat;
          break;
        case 'x':
          offset += repeat;
          break;
        default:
          throw new Exception("Unknow code is being used (" + code + ").");
      }
    }
    
    return result;
  },
  
  destroy: function () {
    delete this.data;
  }
});

BinaryFile.extend({
  /**
   *  da.util.BinaryFile.fromEncodedString(data) -> da.util.BinaryFile
   *  - data (String): URI encoded string.
   **/
  fromEncodedString: function(encoded_str) {
    return new BinaryFile(decodeURIComponent(encoded_str));
  }
});

da.util.BinaryFile = BinaryFile;

/** section: Utilities
 *  class Request
 *
 *  MooTools Request class
 **/

/** section: Utilities
 *  class Request.Binary < Request
 *  
 *  Class for receiving binary data over XMLHTTPRequest.
 *  If server supports setting Range header, then only minimal data will be downloaded. 
 *  
 *  This works in two phases, if a range option is set then a HEAD request is performed to get the
 *  total length of the file and to see if server supports `Range` HTTP header.
 *  If server supports `Range` header than only requested range is asked from server in another HTTP GET request,
 *  otherwise the whole file is downloaded and sliced to desired range.
 *  
 **/
Request.Binary = new Class({
  Extends: Request,
  
  /**
   *  Request.Binary#acceptsRange -> String
   *  Indicates if server supports HTTP requests with `Range` header.
   **/
  acceptsRange: false,
  options: {
    range: null
  },
  
  /**
   *  new Request.Binary(options)
   *  - options (Object): all of the [Request](http://mootools.net/docs/core/Request/Request) options can be used.
   *  - options.range (Object): array with starting position and length. `[0, 100]`.
   *    If first element is negative, starting position will be calculated from end of the file.
   *  - options.bigEndian (Boolean)
   *  fires request, complete, success, failure, cancel
   *  
   *  Functions attached to `success` event will receive response in form of [[da.util.BinaryFile]] as their first argument.
   **/
  initialize: function (options) {
    this.parent($extend(options, {
      method: "GET"
    }));

    this.headRequest = new Request({
      url:          options.url,
      method:       "HEAD",
      emulation:    false,
      evalResponse: false,
      onSuccess:    this.onHeadSuccess.bind(this)
    });
  },
  
  onHeadSuccess: function () {
    this.acceptsRange = this.headRequest.getHeader("Accept-Ranges") === "bytes";
    
    var range = this.options.range;
    if(range[0] < 0)
      range[0] += +this.headRequest.getHeader("Content-Length");
    range[1] = range[0] + range[1] - 1;
    this.options.range = range;
    
    if(this.headRequest.isSuccess())
      this.send(this._send_options || {});
  },
  
  success: function (text) {
    var range = this.options.range;
    this.response.binary = new BinaryFile(text, {
      offset: range && !this.acceptsRange ? range[0] : 0,
      length: range ? range[1] - range[0] + 1 : 0,
      bigEndian: this.options.bigEndian
    });
    this.onSuccess(this.response.binary);
  },
  
  send: function (options) {
    if(this.headRequest.running || this.running)
      return this;

    if(!this.headRequest.isSuccess()) {
      this._send_options = options;
      this.headRequest.send();
      return this;
    }
    
    if(typeof this.xhr.overrideMimeType === "function")
      this.xhr.overrideMimeType("text/plain; charset=x-user-defined");

    this.setHeader("If-Modified-Since", "Sat, 1 Jan 1970 00:00:00 GMT");
    var range = this.options.range;
    if(range && this.acceptsRange)
      this.setHeader("Range", "bytes=" + range[0] + "-" + range[1]);
    
    return this.parent(options);
  }
});

})();




/**
 *  == ID3 ==
 *  
 *  ID3 parsers and common interface.
 **/

/** section: ID3
 *  class da.util.ID3
 *  
 *  Class for extracting ID3 metadata from music files. Provides an interface to ID3v1 and ID3v2 parsers.
 *  The reason why ID3 v1 and v2 parsers are implemented separately is due to idea that parsers for other
 *  formats (OGG Comments, especially) can be later implemented with ease.
**/
da.util.ID3 = new Class({
  Implements: Options,
  
  options: {
    url: null,
    onSuccess: $empty,
    onFailure: $empty
  },
  
  /**
   *  da.util.ID3#parsers -> Array
   *  List of parsers with which the file will be tested. Defaults to ID3v2 and ID3v1 parsers.
   **/
  parsers: [],
  
  /**
   *  da.util.ID3#parser -> Object
   *  
   *  Instance of the parser in use.
  **/  
  parser: null,
  
  /**
   *  new da.util.ID3(options)
   *  - options.url (String): URL of the MP3 file.
   *  - options.onSuccess (Function): called with found tags once they are parsed.
   *  - options.onFailure (Function): called if none of available parsers know how to extract tags.
   *  
   **/
  initialize: function (options) {
    this.setOptions(options);
    this.parsers = $A(da.util.ID3.parsers);
    this._getFile(this.parsers[0]);
  },
  
  _getFile: function (parser) {
    if(!parser)
      return this.options.onFailure("noParserFound");
    
    this.request = new Request.Binary({
      url:        this.options.url,
      range:      parser.range,
      noCache:    true,
      onSuccess:  this._onFileFetched.bind(this),
      onFailure: function () {
        this.options.onFailure("failedRequest");
      }.bind(this)
    });
    
    this.request.send();
  },
  
  _onFileFetched: function (data) {
    var parser = this.parsers[0];
    if(parser && parser.test(data)) {
      try {
        this.parser = (new parser(data, this.options, this.request));
      } catch(e) {
        this.options.onFailure("parserFailure", e);
        delete e;
      } finally {
        delete this.parsers;
      }
    } else
      this._getFile(this.parsers.shift());
  },
  
  /**
   *  da.util.ID3#destory() -> undefined
   **/
  destroy: function () {
    if(this.parser)
      this.parser.destroy();
    delete this.parser;
    delete this.request;
    delete this.options;
  }
});

/**
 *  da.util.ID3.parsers -> Array
 *  Array with all known parsers.
 **/

da.util.ID3.parsers = [];


/** section: ID3
 *  class da.util.ID3v2Parser
 *  
 *  ID3 v2 parser implementation based on [Mutagen](http://code.google.com/p/mutagen) and
 *  [ruby-mp3info](http://ruby-mp3info.rubyforge.org) libraries.
 *  
 *  #### Known frames
 *  This is the list of frames that this implementation by default can parse - only those that are needed to get
 *  the basic information about song. Others can be added via da.util.ID3v2Parser.addFrameParser.
 *  
 *  * TRCK
 *  * TIT1
 *  * TIT2
 *  * TIT3
 *  * TPE1
 *  * TPE2
 *  * TALB
 *  * TYER
 *  * TIME
 *  * TCON
 *  * WOAR
 *  * WXXX
 *  * USLT - not parsed by default but frame decoder is present
 *  
 *  As well as their equivalents in ID3 v2.2 specification.
 *  
 *  #### Notes
 *  All methods except for `addFrameParser` are private.
 *  
 *  #### External resources
 *  * [ID3v2.4 specification](http://www.id3.org/id3v2.4.0-structure)
 *  * [ID3v2.4 native frames](http://www.id3.org/id3v2.4.0-frames)
 *  * [ID3v2.3 specification](http://www.id3.org/id3v2.3.0)
 *  * [ID3v2.2 specification](http://www.id3.org/id3v2-00) -- obsolete
 **/
 
(function () {
/** section: ID3
 * da.util.ID3v2Parser.frameTypes
 * 
 *  Contains know ID3v2 frame types.
 **/
var BinaryFile    = da.util.BinaryFile,
    CACHE         = [],
    GENRE_REGEXP  = /^\(?(\d+)\)?|(.+)/,
    //BE_BOM        = "\xFE\xFF",
    //LE_BOM        = "\xFF\xFE",
    UNSYNC_PAIR   = /(\uF7FF\0)/g,
    FFLAGS = {
      ALTER_TAG_23:   0x8000,
      ALTER_FILE_23:  0x4000,
      READONLY_23:    0x2000,
      COMPRESS_23:    0x0080,
      ENCRYPT_23:     0x0040,
      GROUP_23:       0x0020,

      ALTER_TAG_24:   0x4000,
      ALTER_FILE_24:  0x2000,
      READONLY_24:    0x1000,
      GROUPID_24:     0x0040,
      COMPRESS_24:    0x0008,
      ENCRYPT_24:     0x0004,
      UNSYNC_24:      0x0002,
      DATALEN_24:     0x0001
    },

FrameType = {
  /**
   *  da.util.ID3v2Parser.frameTypes.text(offset, size) -> String
   **/
  text: function (offset, size) {
    var d = this.data;
    
    if(d.getByteAt(offset) === 1) {
      // Unicode is being used, and we're trying to detect Unicode BOM.
      // (we don't actually care if it's little or big endian)
      //var test_string = d.getStringAt(offset, 5),
      //    bom_pos = test_string.indexOf(LE_BOM);
      //if(bom_pos === -1)
      //  bom_pos = test_string.indexOf(BE_BOM);
        
      //offset += bom_pos + 1;
      //size -= bom_pos + 1;
      
      if(d.getByteAt(offset + 1) + d.getByteAt(offset + 2) === 255 + 254) {
        console.log("Unicode BOM detected");
        offset += 2;
        size -= 2;
      }
    }
    
    return d.getStringAt(offset + 1, size - 1).strip();
  },
  
  /**
   *  da.util.ID3v2Parser.frameTypes.textNumeric(offset, size) -> String
   **/
  textNumeric: function(offset, size) {
    return +FrameType.text.call(this, offset, size);
  },
  
  /**
   *  da.util.ID3v2Parser.frameTypes.link(offset, size) -> String
   **/
  link: function (offset, size) {
    return this.data.getStringAt(offset, size).strip();
  },
  
  /**
   *  da.util.ID3v2Parser.frameTypes.userLink(offset, size) -> String
   **/
  userLink: function (offset, size) {
    var str = this.data.getStringAt(offset, size);
    return str.slice(str.lastIndexOf("\0") + 1);
  },
  
  /**
   *  da.util.ID3v2Parser.frameTypes.unsyncedLyrics(offset, size) -> String
   **/
  unsyncedLyrics: function (offset, size) {
    var is_utf8 = this.data.getByteAt(offset) === 1,
        lang    = this.data.getStringAt(offset += 1, 3);
    
    return this.data.getStringAt(offset += 3, size - 4).strip();
  },
  
  ignore: $empty
},

FRAMES = {
  // ID3v2.4 tags
  //SEEK: $empty,
  
  // ID3v2.3 tags
  TRCK: function (offset, size) {
    var data = FrameType.text.call(this, offset, size);
    return +data.split("/")[0];
  },
  TIT1: FrameType.text,
  TIT2: FrameType.text,
  TIT3: FrameType.text,
  TPE1: FrameType.text,
  TPE2: FrameType.text,
  TALB: FrameType.text,
  TYER: FrameType.textNumeric,
  //TIME: $empty,
  TCON: function (offset, size) {
    // Genre, can be either "(123)Genre", "(123)" or "Genre".
    var data = FrameType.text.call(this, offset, size),
        match = data.match(GENRE_REGEXP);
   
    if(!match)
      return -1;
    if(match[1])
      return +match[1];
    if(match[2])
      return match[2].strip();
    return -1;
  },
  //USLT: FrameType.unsyncedLyrics,
  WOAR: FrameType.link,
  WXXX: FrameType.userLink
};

// ID3v2.2 tags (the structure is the same as in later versions, but they use different names)
$extend(FRAMES, {
  UFI: FRAMES.UFID,
  TT1: FRAMES.TIT1,
  TT2: FRAMES.TIT2,
  TT3: FRAMES.TIT3,
  TP1: FRAMES.TPE1,
  TP2: FRAMES.TPE2,
  TP3: FRAMES.TPE3,
  TP4: FRAMES.TPE4,
  TAL: FRAMES.TALB,
  TRK: FRAMES.TRCK,
  TYE: FRAMES.TYER,
  TPB: FRAMES.TPUB,
  ULT: FRAMES.USLT,
  WAR: FRAMES.WOAR,
  WXX: FRAMES.WXXX
});

var ID3v2Parser = new Class({
  /**
   *  new da.util.ID3v2Parser(data, options, request)
   *  - data (BinaryFile): tag.
   *  - options.onSuccess (Function): function which will be called once tag is parsed.
   *  - request (Request.Binary): original HTTP request object.
   **/
  initialize: function (data, options, request) {
    this.options = options;
    
    this.data = data;
    this.data.bigEndian = true;
    
    this.header = {};
    this.frames = {};
    
    this._request = request;
    
    if(CACHE[options.url])
      options.onSuccess(CACHE[options.url]);
    else
      this.parse();
  },
  
  /**
   *  da.util.ID3v2Parser#parse() -> undefined
   *  Parses the tag. If size of tag exceeds current data (and it usually does)
   *  another HTTP GET request is issued to get the rest of the file.
   **/
  /**
   *  da.util.ID3v2Parser#header -> {majorVersion: 0, minorVersion: 0, flags: 0, size: 0}
   *  Parsed ID3 header.
   **/
  /**
   *  da.util.ID3v2Parser#version -> 2.2 | 2.3 | 2.4
   **/
  parse: function () {
    this.header = this.data.unpack("xxx2ii4s").associate([
      'majorVersion', 'minorVersion', "flags", "size"
    ]);
    this.version = 2 + (this.header.majorVersion/10) + this.header.minorVersion;
    this.header.size = this.unpad(this.header.size, 7) + 10;
    
    this.parseFlags();
    
    if(this.data.length >= this.header.size)
      return this.parseFrames();
    
    this._request.options.range = [0, this.header.size];
    // Removing event listeners which were added by ID3
    this._request.removeEvents('success');
    this._request.addEvent('success', function (data) {
      this.data = data;
      this.parseFrames();
    }.bind(this));
    this._request.send();
  },
  
  /**
   *  da.util.ID3v2Parser#parseFlags() -> undefined
   *  Parses header flags.
   **/
   /**
    *  da.util.ID3v2Parser#flags -> {unsync_all: false, extended: false, experimental: false, footer: false}
    *  Header flags.
   **/
  parseFlags: function () {
    var flags = this.header.flags;
    this.flags = {
      unsync_all:   !!(flags & 0x80),
      extended:     !!(flags & 0x40),
      experimental: !!(flags & 0x20),
      footer:       !!(flags & 0x10)
    };
  },
  
  /**
   *  da.util.ID3v2Parser#parseFrames() -> undefined
   *  Calls proper function for parsing frames depending on tag's version.
   **/
  parseFrames: function () {
    console.log("parsing ID3v" + this.version + " tag", this.options.url);
    
    if(this.version >= 2.3)
      this.parseFrames_23();
    else
      this.parseFrames_22();
    
    CACHE[this.options.url] = this.frames;
    this.options.onSuccess(this.simplify(), this.frames);
  },

  /**
   *  da.util.ID3v2Parser#parseFrames_23() -> undefined
   *  Parses ID3 frames from ID3 v2.3 and newer.
   **/
  parseFrames_23: function () {
    if(this.version >= 2.4 && this.flags.unsync_all)
      this.unsync();
    
    var offset = 10,
        ext_header_size = this.data.getStringAt(offset, 4),
        tag_size = this.header.size;
    
    // Some tagging software is apparently know for setting
    // "extended header present" flag but then ommiting it from the file,
    // which means that ext_header_size will be equal to name of a frame.
    if(this.flags.extended && !FRAMES[ext_header_size]) {
      if(this.version >= 2.4)
        ext_header_size = this.unpad(ext_header_size) - 4;
      else
        ext_header_size = this.data.getLongAt(10);
      
      offset += ext_header_size;
    }
    
    var foffset, frame_name, frame_size, frame_size_ajd, frame_flags;
    while(offset < tag_size) {
      foffset     = offset;
      frame_name  = this.data.getStringAt(foffset, 4);
      frame_size  = frame_size_adj = this.unpad(foffset += 4, 4);
      frame_flags = this.data.getShortAt(foffset += 5); 
      foffset += 1;
      
      if(!frame_size) {
        break;
      }
      
      if(this.version >= 2.4) {
        if(frame_flags & (FFLAGS.COMPRESS_24 | FFLAGS.DATALEN_24)) {
          foffset         += 4;
          frame_size      -= 1;
          frame_size_adj  -= 5;
        }
        //if(!this.flags.unsync_all && (frame_flags & FFLAGS.UNSYNC_24))
        //  this.unsync(offset, frame_size_);
      } else {
        if(frame_flags & FFLAGS.COMPRESS_23) {
          console.log("Compressed frame. Sorry.", self.options.url);
          foffset += 4;
        }
      }
      
      if(FRAMES[frame_name])
        this.frames[frame_name] = FRAMES[frame_name].call(this, foffset, frame_size_adj);
      
      //console.log("parsed frame", [frame_name, this.frames[frame_name]]);
      offset += frame_size + 10;
    }
  },
  
  /**
   *  da.util.ID3v2Parser#parseFrames_22() -> undefined
   *  Parses ID3 frames from ID3 v2.2 tags.
   **/
  parseFrames_22: function () {
    var offset = 10,
        tag_size = this.header.size,
        foffset, frame_name, frame_size;
    
    while(offset < tag_size) {
      foffset = offset;
      frame_name = this.data.getStringAt(foffset, 3);
      frame_size = (new BinaryFile(
        "\0" + this.data.getStringAt(foffset += 3, 3),
        {bigEndian:true}
      )).getLongAt(0);
      foffset += 3;
      
      if(!frame_size)
        break;
      
      if(FRAMES[frame_name] && frame_size)
        this.frames[frame_name] = FRAMES[frame_name].call(this, foffset, frame_size);
      
      //console.log(frame_name, this.frames[frame_name], [foffset, frame_size]);
      offset += frame_size + 6;
    }
  },

  /**
   *  da.util.ID3v2Parser#unpad(offset, length[, bits = 8]) -> Number
   *  da.util.ID3v2Parser#unpad(string, bits) -> Number
   *  - offset (Number): offset from which so start unpadding.
   *  - length (Number): length string to unpad.
   *  - bits (Number): number of bits used.
   *  - string (String): String to unpad.
   **/
  unpad: function (offset, size, bits) {
    bits = bits || 8;
    var mask = (1 << bits) - 1,
        bytes = [],
        numeric_value = 0,
        data = this.data;
    
    if(typeof offset === "string") {
      data = new BinaryFile(offset, {bigEndian: true});
      if(size)
        bits = size;
      size = offset.length;
      offset = 0;
    }
    
    if(size) {
      for(var n = offset, m = n + size; n < m; n++)
        bytes.push(data.getByteAt(n) & mask);
      
      bytes.reverse();
    } else {
      var value = data.getByteAt(offset);
      while(value) {
        bytes.push(value & mask);
        value >>= 8;
      }
    }
    
    for(var n = 0, i = 0, m = bytes.length * bits; n < m; n+=bits, i++)
      numeric_value += bytes[i] << n;
    
    return numeric_value;
  },
  
  /**
   *  da.util.ID3v2Parser#unsync() -> undefined
   *  da.util.ID3v2Parser#unsync(offset, length) -> undefined
   *
   *  Unsyncs the data as per ID3 specification.
   *
   **/
  unsync: function (n, m) {
    if(arguments.length) {
      var data = this.data.data,
          part = data
            .slice(n, m)
            .replace(UNSYNC_PAIR, String.fromCharCode(0xF7FF));
      
      this.data.data = data.slice(0, n).concat(part, data.slice(n + m));
    } else
      this.data.data = this.data.data.replace(UNSYNC_PAIR, String.fromCharCode(0xF7FF));
    
    this.data.length = this.data.data.length;
  },
  
  /**
   *  da.util.ID3v2Parser#simplify() -> Object
   *  
   *  Returns humanised version of data parsed from frames.
   *  Returned object contains these values (in brackets are used frames or default values):
   *  
   *  * title (`TIT2`, `TT2`, `"Unknown"`)
   *  * album (`TALB`, `TAL`, `"Unknown"`)
   *  * artist (`TPE2`, `TPE1`, `TP2`, `TP1`, `"Unknown"`)
   *  * track (`TRCK`, `TRK`, `0`)
   *  * year (`TYER`, `TYE`, `0`)
   *  * genre (`TCON`, `TCO`, `0`)
   *  * lyrics (`USLT`, `ULT`, _empty string_)
   *  * links: official (`WOAR`, `WXXX`, `WAR`, `WXXX`, _empty string_)
   **/
  simplify: function () {
    var f = this.frames;
    return !f || !$H(f).getKeys().length ? {} : {
      title:  f.TIT2 || f.TT2 || "Unknown",
      album:  f.TALB || f.TAL || "Unknown",
      artist: f.TPE2 || f.TPE1 || f.TP2 || f.TP1 || "Unknown",
      track:  f.TRCK || f.TRK || 0,
      year:   f.TYER || f.TYE || 0,
      genre:  f.TCON || f.TCO || -1,
      links: {
        official: f.WOAR || f.WXXX || f.WAR || f.WXX || ""
      }
    };
  },
  
  /**
   *  da.util.ID3v2Parser#destroy() -> undefined
   **/
  destroy: function () {
    this.data.destroy();
    delete this.data;
    delete this.options;
    delete this._request;
  }
});

ID3v2Parser.extend({
  /**
   *  da.util.ID3v2Parser.range -> [0, 14]
   *  
   *  Default position of ID3v2 header, including extended header.
   **/
  range: [0, 10 + 4],
  
  /**
   *  da.util.ID3v2Parser.test(data) -> Boolean
   *  - data (BinaryFile): the tag.
   *  
   *  Checks if data begins with `ID3` and major version is less than 5.
  **/
  test: function (data) {
    return data.getStringAt(0, 3) === "ID3" && data.getByteAt(3) <= 4;
  },
  
  /**
   *  da.util.ID3v2Parser.addFrameParser(frameName, fn) -> da.util.ID3v2Parser
   *  - frameName (String): name of the frame.
   *  - fn (Function): function which will parse the data.
   *  
   *  Use this method to add your own ID3v2 frame parsers. You can access this as `da.util.ID3v2Parser.addFrameParser`.
   *  
   *  `fn` will be called with following arguments:
   *  * offset: position at frame appears in data
   *  * size: size of the frame, including header
   *  
   *  `this` keyword inside `fn` will refer to an instance of [[da.util.ID3v2Parser]].
   **/
  addFrameParser: function (name, fn) {
    FRAMES[name] = fn;
    return this;
  }
});

ID3v2Parser.frameTypes = FrameType;
da.util.ID3v2Parser = ID3v2Parser;
da.util.ID3.parsers.push(ID3v2Parser);

})();



/** section: ID3
 *  class da.util.ID3v1Parser
 *  
 *  ID3 v1 parser based on [ID3 v1 specification](http://mpgedit.org/mpgedit/mpeg_format/mpeghdr.htm#MPEGTAG).
 *  
 *  #### Notes
 *  All of these methods are private.
 **/

(function () {
var CACHE = {};

var ID3v1Parser = new Class({
  /**
   *  new da.util.ID3v1Parser(data, options)
   *  - data (da.util.BinaryFile): ID3 tag.
   *  - options.url (String): URL of the file.
   *  - options.onSuccess (Function): function called once tags are parsed. 
   **/
  initialize: function (data, options) {
    this.data = data;
    this.options = options;
    if(!this.options.url)
      this.options.url = Math.uuid();
    
    if(CACHE[options.url])
      options.onSuccess(CACHE[options.url]);
    else
      this.parse();
  },
  
  /**
   *  da.util.ID3v1Parser#parse() -> undefined
   *  Extracts the tags from file.
   **/
  parse: function () {
    // 29x - comment
    this.tags = this.data.unpack("xxx30S30S30S4S29x2i").associate([
      "title", "artist", "album", "year", "track", "genre"
    ]);
    this.tags.year = +this.tags.year;
    if(isNaN(this.tags.year))
      this.tags.year = 0;
    
    this.options.onSuccess(CACHE[this.options.url] = this.tags);
  },
  
  destroy: function () {
    delete this.data;
    delete this.options;
  }
});

ID3v1Parser.extend({
  /**
   *  da.util.ID3v1Parser.range -> [-128, 128]
   *  Range in which ID3 tag is positioned. -128 indicates that it's last 128 bytes.
   **/
  range: [-128, 128],
  
  /**
   *  da.util.ID3v1Parser.test(data) -> Boolean
   *  - data (da.util.BinaryFile): data that needs to be tested.
   *  
   *  Checks if first three characters equal to `TAG`, as per ID3 v1 specification.
   **/
  test: function (data) {
    return data.getStringAt(0, 3) === "TAG";
  }
});

da.util.ID3v1Parser = ID3v1Parser;
da.util.ID3.parsers.push(ID3v1Parser);
})();



var ID3 = da.util.ID3;
/**
 *  Indexer.onMessage(event) -> undefined
 *  - event (Event): DOM event.
 *  - event.data (String): Tahoe URI cap for an file.
 *  
 *  When tags are parsed, `postMessage` is called.
 **/
onmessage = function (event) {  
  queue.push(event.data);
  
  if(queue.length === 1)
    getTags(event.data);
};

function getTags(cap) {
  if(!cap)
    return false;
  
  var parser = new ID3({
    url: "/uri/" + encodeURIComponent(cap),
    
    onSuccess: function (tags) {
      if(tags && typeof tags.title !== "undefined" && typeof tags.artist !== "undefined") {
        tags.id = cap;
        postMessage(tags);
      }
      
      parser.destroy();
      delete parser;
      
      queue.erase(cap);
      checkQueue();
    },
    
    onFailure: function (calledBy) {
      console.log("Failed to parse ID3 tags for", [cap, calledBy]);
      parser.destroy();
      delete parser;
      
      queue.erase(cap);
      checkQueue();
    }
  });
}

var finish_timeout;
function checkQueue() {
  if(!queue.length)
    finish_timeout = setTimeout(finish, 3*60*1000);
  else {
    clearTimeout(finish_timeout);
    setTimeout(function () {
      getTags(queue[0]);
    }, 444);
  }
}

function finish () {
  if(!queue.length)
    postMessage("**FINISHED**");
  else
    checkQueue();
}

