var test_SongContextController = new function () {
  var SongContext = da.controller.SongContext,
      self = this;
      
  this.setup = function () {
    self.called = {
      a_init:   0,
      a_show:   0,
      a_hide:   0,
      a_update: 0,
      
      b_init:   0,
      b_show:   0,
      b_hide:   0,
      b_update: 0
    };
    
    SongContext.register({
      id: "__a__",
      title: "Click meh!",
      
      initialize: function (container) {
        self.called.a_init++;
        self.passed_container = $type(container) === "element";
        self.a_container  = container;
        container.grab(new Element("div", {
          id: "__a__test_el",
          html: "Hai!"
        }));
      },
      
      show: function () {
        self.called.a_show++;
      },
      
      hide: function () {
        self.called.a_hide++;
      },
      
      update: function (song) {
        self.called.a_update++;
        self.passed_song = song;
      }
    });
    
    SongContext.register({
      id: "__b__",
      title: "Click meh too!",
      initialize: function () { self.called.b_init++; },
      show:       function () { self.called.b_show++; },
      hide:       function () { self.called.b_hide++; },
      update:     function () { self.called.b_update++; }
    });
  },
  
  this.test_show = function () {
    SongContext.show("__a__");
    jum.assertEquals("initialize function should have been called once",
      1, self.called.a_init
    );
    jum.assertTrue("dom nodes should have been inserted into the document",
      !!$("__a__test_el")
    );
    jum.assertEquals("show function should have been called once",
      1, self.called.a_show
    );
    jum.assertEquals("context should be visible",
      "block", $("__a__test_el").getParent().style.display
    );
    jum.assertEquals("update function should have been called once",
      1, self.called.a_update
    );
    jum.assertEquals("loading screen should be visible",
      "block", $("song_context_loading").style.display
    );
  };
  
  this.test_updateArguments = function () {
    jum.assertTrue("song should be passed to the update function",
      self.passed_song instanceof da.db.DocumentTemplate.Song
    );
  };
  
  this.test_contextSwitch = function () {
    SongContext.show("__b__");
    jum.assertEquals("A's hide function should have been called",
      1, self.called.a_hide
    );
    jum.assertEquals("B's hide function shouldn't have been called",
      0, self.called.b_hide
    );
    jum.assertEquals("B's show function should have been called",
      1, self.called.b_show
    );
  };
}
