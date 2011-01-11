//#require "libs/vendor/Persist.js"
//#require "libs/db/db.js"

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
