var test_Menu = new function () {
  var Menu = da.ui.Menu,
      self = this;
  
  this.setup = function () {
    self.menu = new Menu({
      items: {
        a: {html: "a"},
        b: {html: "b"},
        _sep: Menu.separator,
        c: function () {
          return (new Element("li")).grab(new Element("span", {html: "c"}))
        }
      }
    });
  };
  
  this.test_domNodes = function () {
    var el = self.menu.toElement();
    
    jum.assertEquals("menu's element should be inserted into body of the page",
      el.getParent(), document.body
    );
    
    jum.assertEquals("should have four child nodes",
      4, el.getChildren().length
    );
    
    jum.assertEquals("item added as Object should be element",
     "element",
      $type(self.menu.getItem("b"))
    );
    jum.assertEquals("item added as Function should be element",
      "element",
      $type(self.menu.getItem("c"))
    );
    jum.assertEquals("separator should be also an element",
      "element",
      $type(self.menu.getItem("_sep"))
    );
  };
  
  this.test_events = function () {
    var el = self.menu.toElement();
    
    self.menu.addEvent("click", function (key, element) {
      jum.assertEquals("clicked items' key should be 'b'", "b", key);
    });
    // events are synchronous
    self.menu.click(null, self.menu.getItem("b"));
    
    var showed = 0,
        hidden = 0;
    self.menu.addEvent("show", function () {
      showed++;
    });
    self.menu.addEvent("hide", function () {
      hidden++;
    });
    
    self.menu.show();
    jum.assertEquals("shown menu should be visible to the user",
      "block", el.style.display
    );
    
    self.menu.show();
    jum.assertEquals("showing visible menu should not fire 'show' event ",
      1, showed
    );
    jum.assertEquals("calling `show` on visible menu should hide it",
      "none", el.style.display
    );
    
    self.menu.hide();
    jum.assertEquals("hiding hidden menu should not fire 'hide' event",
      1, hidden
    );
  };
  
  
  this.teardown = function () {
    self.menu.destroy();
  };
  
  return this;
};