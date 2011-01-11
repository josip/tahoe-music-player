//#require <libs/util/util.js>
//#require "libs/util/BinaryFile.js"

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

//#require "libs/util/ID3v2.js"
//#require "libs/util/ID3v1.js"
