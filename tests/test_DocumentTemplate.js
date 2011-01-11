windmill.jsTest.require("shared.js");

var test_DocumentTemplate = new function () {
  var BrowserCouch = da.db.BrowserCouch,
      DocumentTemplate = da.db.DocumentTemplate,
      self = this;

  this.setup = function () {
    self.db = null;
    BrowserCouch.get("dt_test1", function (db) {
      self.db = db;
    });
  };
  
  this.waitForDb = {
    method: "waits.forJS",
    params: {
      js: function () { return !!self.db }
    }
  };
  
  this.test_registerType = function () {
    DocumentTemplate.registerType("test_Person", self.db, new Class({
      Extends: DocumentTemplate,
      
      hasMany: {
        cars: ["test_Car", "owner_id"]
      },
      
      sayHi: function () {
        return "Hello! My name is %0 %1.".interpolate([
          this.get("name"),
          this.get("surname")
        ])
      }
    }));
    self.Person = DocumentTemplate.test_Person;
    
    DocumentTemplate.registerType("test_Car", self.db, new Class({
      Extends: DocumentTemplate,
      
      belongsTo: {
        owner: "test_Person"
      },
      
      start: function () {
        this.update({state: "inMotion"})
      },
      
      stop: function () {
        this.update({state: "stopped"});
      },
      
      isRunning: function () {
        return this.get("state") === "inMotion"
      }
    }));
    this.Car = DocumentTemplate.test_Car;
    
    jum.assertTrue("test_Person" in DocumentTemplate);
    jum.assertTrue("test_Person" in self.db.views);
    jum.assertEquals(self.db.name, self.Person.db().name);
  };
  
  this.test_instanceFindNoResult = function () {
    this.instanceFind_success_called = 0;
    this.instanceFind_failure_called = 0;
    
    this.Car.find({
      properties: {manufacturer: "Volkswagen"},
      onSuccess: function () {
        self.instanceFind_success_called++;
      },
      onFailure: function () {
        self.instanceFind_failure_called++;
      }
    })
  };
  
  this.test_waitForInstanceFind = {
    method: "waits.forJS",
    params: {
      js: function () { return self.instanceFind_failure_called }
    }
  };
  
  this.test_verifyInstaceFind = function () {
    jum.assertEquals(1, self.instanceFind_failure_called);
    jum.assertEquals(0, self.instanceFind_success_called);
  };
  
  this.test_createDoc = function () {
    self.herbie_saved = 0;
    self.Person.create({
      id:     "jim",
      first:  "Jim",
      last:   "Douglas"
    }, function (jim) {
      self.jim = jim;
      
      self.herbie = new self.Car({
        id:       "herbie",
        owner_id: "jim",
        state:    "sleeping",
        diamods:  0
      });
      
      self.herbie.save(function () {
        self.herbie_saved++;
      });
    });
  };
  
  this.test_waitForDocs = {
    method: "waits.forJS",
    params: {
      js: function () { return !!self.jim && !!self.herbie && self.herbie_saved }
    }
  };
  
  this.test_verifyCreate = function () {
    jum.assertEquals("jim",     self.jim.id);
    jum.assertEquals("herbie",  self.herbie.id);
    jum.assertEquals(1,         self.db.views.test_Person.view.rows.length);
    jum.assertEquals(1,         self.db.views.test_Car.view.rows.length);
  };
  
  this.test_get = function () {
    jum.assertEquals("Jim", self.jim.get("first"));
    jum.assertEquals("jim", self.herbie.get("owner_id"));    
  };
  
  this.test_belongsTo = function () {
    self.herbie.get("owner", function (owner) {
      jum.assertEquals(self.jim.id, owner.id);
      self.got_jim = true;
    });
  };
  
  this.test_waitForJim = {
    method: "waits.forJS",
    params: {
      js: function () { return self.got_jim }
    }
  };
  
  this.test_hasMany = function () {
    self.jim.get("cars", function (cars) {
      jum.assertEquals(1, cars.length);
      jum.assertEquals(self.herbie.id, cars[0].id);
      self.got_herbie = true;
    });
  };
  
  this.test_waitForHerbie = {
    method: "waits.forJS",
    params: {
      js: function () { return self.got_herbie }
    }
  };
  
  this.test_propertyChangeEvent = function () {
    self.herbie.addEvent("propertyChange", function (changes, herbie) {
      jum.assertEquals(self.herbie, herbie);
      jum.assertTrue("state" in changes);
      jum.assertFalse("id" in changes);
      jum.assertEquals("inMotion", herbie.get("state"));
    });
    
    self.herbie.start();
  };
  
  this.test_findOrCreate = function () {
    self.foc_finished = 0;
    self.Person.findOrCreate({
      properties: {id: "jim"},
      onSuccess: function (jim, created) {
        self.foc_finished++;
        self.foc_jim = {jim: jim, created: created};
      }
    });
    
    self.john_props = {id: "john", first: "John", last: "Doe"};
    self.Person.findOrCreate({
      properties: self.john_props,
      onSuccess: function (john, created) {
        self.foc_finished++;
        self.foc_john = {john: john, created: created};
      }
    });
  };
  
  this.test_waitForFindOrCreate = {
    method: "waits.forJS",
    params: {
      js: function () { return self.foc_finished === 2 }
    }
  };
  
  this.test_verifyFindOrCreate = function () {
    jum.assertEquals("jim", self.foc_jim.jim.id);
    jum.assertTrue(self.foc_jim.created !== true);
    
    jum.assertEquals("john", self.foc_john.john.id);
    jum.assertSameObjects(self.john_props, self.foc_john.john.doc);
    jum.assertTrue(self.foc_john.created);
  };
  
  this.test_findById = function () {
    var jim = self.Person.findById("jim");
    jum.assertEquals("jim", jim.id);
    jum.assertEquals("Jim", jim.get("first"));
    
    jum.assertTrue(self.Car.findById("KITT") === null);
  };
  
  this.test_destroy = function () {
    self.success_on_destroy = self.failure_on_destroy = false;
    self.jim.destroy(function () {
      self.destroyed = true;
      self.found_destroyed_doc = !!self.Person.findById("jim");
    });
  };
  
  this.wait_forDestroy = {
    method: "waits.forJS",
    params: {
      js: function () { return self.destroyed }
    }
  };
  
  this.test_verifyDestroy = function () {
    jum.assertFalse(self.found_destroyed_doc);
  };
  
  this.teardown = function () {
    self.db.wipe();
  };
  
  return this;
};
