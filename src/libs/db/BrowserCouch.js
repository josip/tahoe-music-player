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

//#require <libs/db/db.js>

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
