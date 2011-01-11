windmill.jsTest.require("shared.js");

var test_BrowserCouchDict = new function () {
  var self = this;
  
  this.setup = function () {
    self.dict = new da.db.BrowserCouch.Dictionary();
    
    self.dict.set("a", 1);
    self.dict.set("b", 2);
    
    self.dict.setDocs([
      {id: "c", value: 3},
      {id: "d", value: 4},
      {id: "a", value: 5}
    ]);
  };
  
  this.test_set = function () {
    jum.assertTrue(self.dict.has("a"));
    jum.assertTrue(self.dict.has("b"));
    jum.assertFalse(self.dict.has("x"));
    
    jum.assertSameObjects({id:"a", value: 5}, this.dict.dict.a);
    jum.assertEquals(2, self.dict.dict.b);
  };
  
  this.test_setDocs = function () {
    jum.assertTrue(self.dict.has("c"));
    jum.assertTrue(self.dict.has("d"));
    
    jum.assertEquals(3, self.dict.dict.c.value);
    jum.assertEquals(4, self.dict.dict.d.value);
  };
  
  this.test_remove = function () {
    self.dict.remove("a");
    jum.assertEquals(3, self.dict.keys.length);
    jum.assertFalse(self.dict.has("a"));    
  };
  
  this.test_unpickle = function () {
    self.dict.unpickle({
      x: 2.2,
      y: 2.3
    });
    
    jum.assertEquals(2, self.dict.keys.length);
    jum.assertTrue(self.dict.has("x"));
    jum.assertTrue(self.dict.has("y"));
    jum.assertFalse(self.dict.has("a"));
  };
  
  this.test_clear = function () {
    self.dict.clear();
    
    jum.assertEquals(0, self.dict.keys.length);
    jum.assertFalse(self.dict.has("x"));
    jum.assertFalse(self.dict.has("b"));
  };
};

var test_BrowserCouch = new function () {
  var BrowserCouch = da.db.BrowserCouch,
      self = this;
  
  this.setup = function () {
    self.db = false;
    self.stored = {};
    
    BrowserCouch.get("test1", function (db) {
      self.db = db;
      db.addEvent("store", function (doc) {
        self.stored[doc.id] = new Date();
      });
    });
  };
  
  this.test_waitForDb = {
    method: 'waits.forJS',
    params: {
      js: function () { return !!self.db; }
    }
  };
  
  this.test_verifyDb = function () {
    jum.assertEquals(0, this.db.getLength());
  };
  
  this.test_put = function () {
    var cb = {doc1: 0, doc2: 0, doc3: 0};
    self.db.put({id: "doc1", test: 1}, function () { cb.doc1++ });
    self.db.put({id: "doc2", test: 2}, function () { cb.doc2++ });
    self.db.put({id: "doc3", test: 3}, function () { cb.doc3++ });
    self.db.put({id: "doc1", test: 4}, function () { cb.doc1++ });
    
    jum.assertEquals(2, cb.doc1);
    jum.assertEquals(1, cb.doc2);
    jum.assertEquals(1, cb.doc3);
  };
  
  this.test_storeEvent = function () {
    jum.assertTrue(self.stored.doc1 >= self.stored.doc3);
    jum.assertTrue(self.stored.doc3 >= self.stored.doc2);
  };
  
  this.test_wipe = function () {
    jum.assertEquals(3, self.db.getLength());
    self.db.wipe();
    
    BrowserCouch.get("test1", function (db) {
      jum.assertEquals(0, db.getLength());
    });
  };
  
  this.teardown = function () {
    self.db.wipe();    
  };
  
  return this;
};

var test_BrowserCouch_tempView = new function () {
  var BrowserCouch = da.db.BrowserCouch,
      self = this;
  
  this.setup = function () {
    BrowserCouch.get("test2", function (db) {
      self.db = db;
      self.map_called = 0;
      self.map_updated_called = false;
      self.reduce_updated_called = false;
      
      db.put([
        {id: "doc1", nr: 1},
        {id: "doc2", nr: 2},
        {id: "doc3", nr: 3}
      ], function () {
        self.docs_saved = true;
      });
    });
  };
  
  this.test_waitForDb = {
    method: 'waits.forJS',
    params: {
      js: function () { return !!self.db && self.docs_saved; }
    }
  };
  
  this.test_map = function () {
    self.mapped_docs = [];
    this.db.view({
      temporary: true,
      
      map: function (doc, emit) {
        self.mapped_docs.push(doc.id);
        if(doc.nr !== 2)
          emit(doc.id, doc.nr);
      },
      
      finished: function (result) {
        self.map_result = result;
        
        self.db.put({id: "doc4", nr: 4});
      },
      
      updated: function () {
        self.map_updated_called = true;
      }
    })
  };
  
  this.test_waitForMapResult = {
    method: 'waits.forJS',
    params: {
      js: function () { return !!self.map_result }
    }
  };
  
  this.test_verifyMapArguments = function () {
    jum.assertEquals("map() should have been called three times",
      3, self.mapped_docs.length
    );
    jum.assertSameArrays(["doc1", "doc2", "doc3"], self.mapped_docs);
  };
  
  this.test_verifyMapResult = function () {
    var mr = self.map_result;
    
    jum.assertTrue("rows" in mr);
    jum.assertEquals(2, mr.rows.length);
    jum.assertEquals("function", typeof mr.findRow);
    jum.assertEquals("function", typeof mr.getRow);
    jum.assertFalse(self.map_updated_called);
  };
  
  this.test_mapFindRow = function () {
    var mr = self.map_result;
    jum.assertEquals(-1, mr.findRow("doc2"));
    jum.assertEquals(-1, mr.findRow("doc4"));
    jum.assertEquals(-1, mr.findRow("doc7"));
    jum.assertEquals(0,  mr.findRow("doc1"));
  };
  
  this.test_reduce = function () {
    self.reduce_called = 0;
    self.db.view({
      temporary: true,
      
      map: function (doc, emit) {
        emit(doc.nr%2 ? "odd" : "even", doc.nr);
      },
      
      reduce: function (keys, values) {
        var sum = 0, n = values.length;
        self.reduce_called++;
        
        while(n--)
          sum += values[n];
        
        return sum;
      },
      
      finished: function (result) {
        self.reduce_result = result;
        self.db.put({id: "doc5", nr: 5});
      },
      
      updated: function () {
        self.reduce_updated_called = true;
      }
    });
  };
  
  this.test_waitForReduceResult = {
    method: 'waits.forJS',
    params: {
      js: function () { return !!self.reduce_result }
    }
  };
  
  this.test_verifyReduceResult = function () {
    var rr = self.reduce_result;
    jum.assertFalse(self.reduce_updated_called);
    
    jum.assertEquals("function", typeof rr.findRow);
    jum.assertEquals("function", typeof rr.getRow);
    
    jum.assertEquals(2, self.reduce_called);
    jum.assertEquals(2, rr.rows.length);
  };
  
  this.test_verifyReduceFindRow = function () {
    var rr = self.reduce_result;
    
    jum.assertTrue(rr.findRow("even") !== -1);
    jum.assertTrue(rr.findRow("odd")  !== -1);
    jum.assertEquals(-1, rr.findRow("even/odd"));
    
    jum.assertEquals(6, rr.getRow("even")); // 2 + 4
    jum.assertEquals(4, rr.getRow("odd"));  // 1 + 3
  };
  
  this.teardown = function () {
    self.db.wipe();
  };
  
  return this;
};

var test_BrowserCouch_liveView = new function () {
  var BrowserCouch = da.db.BrowserCouch,
      self = this;
  
  this.setup = function () {
    this.docs_saved = false;
    
    this.map_result = null;
    this.map_updated = null;
    this.map_finished_called = 0;
    this.map_updated_called = 0;
    
    this.reduce_result = null;
    this.reduce_updated = null;
    this.reduce_finished_called = 0;
    this.reduce_updated_called = 0;
    
    BrowserCouch.get("test3", function (db) {
      self.db = db;
      
      db.put([
        {id: "Keane",           albums: 3, formed: 1997},
        {id: "Delphic",         albums: 1, formed: 2010},
        {id: "The Blue Nile",   albums: 4, formed: 1981}
      ], function () {
        self.docs_saved = true;
        
        db.view({
          id: "test1",
          
          map: function (doc, emit) {
            if(doc.id.toLowerCase().indexOf("the") === -1)
              emit(doc.id, doc.formed);
          },
          
          finished: function (view) {
            self.map_finished_called++;
            self.map_result = view;
          },
          
          updated: function (view) {
            self.map_updated_called++;
            self.map_updates = view;
          }
        });
      });
    });
  };
  
  this.test_waitForDb = {
    method: 'waits.forJS',
    params: {
      js: function () { return !!self.db && self.docs_saved && !!self.map_result }
    }
  };
  
  this.test_verifyMap = function () {
    var mr = self.map_result;
    
    jum.assertEquals(1, self.map_finished_called);
    jum.assertEquals(2, mr.rows.length);
    jum.assertEquals("function", typeof mr.findRow);
    
    jum.assertEquals(-1, mr.findRow("The Drums"));
    jum.assertEquals(-1, mr.findRow("The Blue Nile"));
    jum.assertEquals(0,  mr.findRow("Delphic"));
    
    self.db.put([
      {id: "Marina and The Diamonds", albums: 1, formed: 2007},
      {id: "Coldplay",                albums: 4, formed: 1997},
      {id: "Delphic",                 albums: 1, formed: 2009}
    ], function () {
      self.map_updates_saved = true;
    });
  };
  
  this.test_waitForUpdate = {
    method: 'waits.forJS',
    params: {
      js: function () { return self.map_updates_saved && !!self.map_updates }
    }
  };
  
  this.test_verifyMapUpdates = function () {
    var mr = self.map_result,
        mu = self.map_updates;
    
    jum.assertEquals(1, self.map_updated_called);
    jum.assertEquals(1, self.map_finished_called);
    jum.assertEquals(2, mu.rows.length);
    jum.assertEquals(3, mr.rows.length);
    
    jum.assertEquals(-1, mu.findRow("Marina and The Diamonds"));
    jum.assertEquals(-1, mu.findRow("Keane"));
    jum.assertEquals(0,  mu.findRow("Coldplay"));
    
    jum.assertEquals(-1, mr.findRow("Marina and The Diamonds"));
    jum.assertEquals(0,  mr.findRow("Coldplay"));
    
    jum.assertEquals(2009, mr.getRow("Delphic"));
  };
  
  this.test_killView = function () {
    self.db.killView("test1");
    self.db.put({id: "Noisettes", formed: 2003, albums: 2}, $empty);
  };
  
  this.test_waitForViewToDie = {
    method: 'waits.forJS',
    params: {
      js: function () { return !!!self.db.views.test1 }
    }
  };
  
  this.test_viewIsDead = function () {
    jum.assertEquals(1, self.map_updated_called);
  };
  
  this.test_reduce = function () {
    self.rereduce_args = null;
    self.rereduce_called = 0;
    self.reduce_called = 0;
    
    self.db.view({
      id: "test2",
      
      map: function (doc, emit) {
        if(doc.albums)
          emit("albums", doc.albums);
      },
      
      reduce: function (key, values, rereduce) {
        if(rereduce) {
          self.rereduce_args = arguments;
          self.rereduce_called++;
        } else {
          self.reduce_called++;
        }
        
        var n = values.length, sum = 0;
        while(n--) sum += values[n];
        return sum;
      },
      
      finished: function (view) {
        self.reduce_finished_called++;
        self.reduce_result = view;
      },
      
      updated: function (view) {
        self.reduce_updated_called++;
        self.reduce_updates = view;
      }
    })
  };
  
  this.test_waitForReduce = {
    method: 'waits.forJS',
    params: {
      js: function () { return !!self.reduce_result }
    }
  };
  
  this.test_verifyReduceResult = function () {
    var rr = self.reduce_result;
    
    jum.assertEquals(1, self.reduce_finished_called);
    jum.assertEquals(0, self.reduce_updated_called);
    
    jum.assertEquals("function", typeof rr.findRow);
    
    jum.assertEquals(1,   rr.rows.length);
    jum.assertEquals(0,   rr.findRow("albums"));
    jum.assertEquals(15,  rr.getRow("albums"));
    
    self.db.put([
      {id: "Imaginary", albums: 0, formed: 2020},
      {id: "Grizzly Bear", albums: 2, formed: 2000}
    ], function() {
      self.reduce_updates_saved = true;
    });
  };
    
  this.test_waitForUpdates = {
    method: 'waits.forJS',
    params: {
      js: function () {  return self.reduce_updates_saved }
    }
  };
  
  this.test_reduceUpdates = function () {
    var rr = self.reduce_result,
        ru = self.reduce_updates;
    
    jum.assertEquals(1, self.reduce_updated_called);
    jum.assertEquals(1, self.reduce_finished_called);
    
    jum.assertEquals(1,   ru.rows.length);
    jum.assertEquals(-1,  ru.findRow("Grizzly Bear"));
    jum.assertEquals(0,   ru.findRow("albums"));
    
    jum.assertEquals(2,   ru.getRow("albums"));
    jum.assertEquals(17,  rr.getRow("albums"));
  };
  
  this.test_rereduce = function () {
    jum.assertEquals(1, self.rereduce_called);
    jum.assertEqualArrays([null, [2, 15], true], self.rereduce_args);
  };
  
  this.teardown = function () {
    self.db.killView("test2");
  };
  
  return this;
};
