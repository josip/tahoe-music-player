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
