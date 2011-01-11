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
