//#require "libs/db/db.js"
//#require "libs/db/BrowserCouch.js"
//#require "libs/vendor/Math.uuid.js"
//#require "libs/util/util.js"

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
