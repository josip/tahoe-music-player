var test_Dialog = new function () {
  var Dialog = da.ui.Dialog,
      self = this;
  
  this.setup = function () {
    self.dialog = new Dialog({
      title: "dialog_title",
      html: new Element("div", {id: "_t_dialog", html: "dialog_content"})
    });
  };
  
  this.test_domNodes = function () {
    var el = self.dialog.toElement();
    jum.assertTrue("dialog should have been inserted into document's body", 
      !!$("_t_dialog")
    );
    jum.assertTrue("dialog should be hidden",
      el.style.display !== "block"
    );
    jum.assertEquals("dialog should have title bar",
      "dialog_title",
      el.getElement(".dialog_title").get("text")
    );
    jum.assertTrue("dialog should have its contents",
      el.getElement(".dialog").get("text").indexOf("dialog_content") > 0
    );
  };
  
  this.test_events = function () {
    var show = hide = 0;
    self.dialog.addEvent("show", function () {
      show++;
    });
    self.dialog.addEvent("hide", function () {
      hide++;
    });
    
    var el = self.dialog.toElement();
    self.dialog.show();
    jum.assertEquals("dialog should be visible",
      "block", el.style.display
    );
    jum.assertEquals("show event should be fired",
      1, show
    );
    
    self.dialog.show();
    jum.assertEquals("show event should be fired only first time",
      1, show
    );
    
    self.dialog.hide();
    jum.assertEquals("dialog should be hidden",
      "none", el.style.display
    );
    jum.assertEquals("hide event should be fired",
      1, hide
    );
    
    self.dialog.hide();
    jum.assertEquals("hide event should be fired only first time",
      1, hide
    );
  };
  
  this.test_destroy = function () {
    var el = self.dialog.toElement();
    self.dialog.destroy();
    
    jum.assertEquals("nodes should be removed from document",
      null, el.getParent()
    );
  };
  
  return this;
};
