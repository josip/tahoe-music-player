//#require "libs/util/BinaryFile.js"

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
