//#require <libs/util/util.js>

(function () {
/**
 *  == Tahoe ==
 *  
 *  Classes and utility methods for working with Tahoe's [web API](http://tahoe-lafs.org/source/tahoe/trunk/docs/frontends/webapi.txt).
 **/
var CACHE = {};

/** section: Tahoe
 *  class TahoeObject
 *  
 *  Abstract class representing any Tahoe object - either file or directory.
 **/
var TahoeObject = new Class({
  /**
   *  new TahoeObject(cap[, meta])
   *  - cap (String): cap of the object.
   *  - meta (Object): metadata about the object.
   **/
  initialize: function (uri, meta) {
    this.uri = uri;
    CACHE[uri] = this;
    this._fetched = false;
    
    if(meta)
      this.applyMeta(meta);
  },
  
  /**
   *  TahoeObject#applyMeta(meta) -> this
   *  - meta (Object): metadata about the object.
   *  
   *  Applies the metadata to current object. If `meta` contains information
   *  of child items, new [[TahoeObject]] instances will be created for those
   *  as well.
   **/
  applyMeta: function (meta) {
    this.type = meta[0];
    var old_children = meta[1].children || {},
        children = [];

    for(var child_name in old_children) {
      var child = old_children[child_name];
      child[1].objectName = child_name;
      //child[1].type = child[0];
      
      if(CACHE[child[1].ro_uri])
        children.push(CACHE[child[1].ro_uri])
      else
        children.push(new TahoeObject(child[1].ro_uri, child));
    }

    meta[1].children = children;
    $extend(this, meta[1]);
    
    return this;
  },
  
  /**
   *  TahoeObject#get([onSuccess][, onFailure]) -> this
   *  - onSuccess (Funcion): called if request succeeds. First argument is `this`.
   *  - onFailure (Function): called if request fails.
   *  
   *  Requests metadata about `this` object.
   **/
  get: function (success, failure) {
    if(this._fetched) {
      (success||$empty)(this);
      return this;
    }
    this._fetched = true;

    var req = new Request.JSON({
      url: "/uri/" + encodeURIComponent(this.uri),
      
      onSuccess: function (data) {
        this.applyMeta(data);
        (success||$empty)(this);
        
        delete req;
      }.bind(this),
      
      onFailure: failure || $empty
    });
    req.get({t: "json"});
    
    return this;
  },
  
  /**
   *  TahoeObject#directories() -> [TahoeObject...]
   *  Returns an [[Array]] of all child directories.
   **/
  directories: function () {
    var children = this.children,
        n = children.length,
        result = [];
    
    while(n--)
      if(children[n].type === "dirnode")
        result.push(children[n]);
    
    return result;
  },
  
  /**
   *  TahoeObject#files() -> [TahoeObject...]
   *  Returns an [[Array]] of all child files.
   **/
  files: function () {
    var children = this.children,
        n = children.length,
        result = [];
    
    while(n--)
      if(children[n].type === "filenode")
        result.push(children[n]);
    
    return result;
  }
});

da.util.TahoeObject = TahoeObject;

})();
