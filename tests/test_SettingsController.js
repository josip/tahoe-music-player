var test_SettingsController = new function () {
  var Settings = da.controller.Settings,
      Setting = da.db.DocumentTemplate.Setting,
      self = this;
  
  this.setup = function () {
    Setting.register({
      id:           "_is_this_working",
      group_id:     "_test",
      representAs:  "_test_question",
      title:        "Is this working?",
      help:         "Check this box if you think that it's going to work.",
      value:        false
    });
    
    Settings.registerGroup({
      id:           "_test",
      title:        "Test",
      description:  "Help can be usually reached by calling 112."
    });
    
    self.renderer_called = 0;
    Settings.addRenderer("_test_question", function (setting, details) {
      self.renderer_called++;
      
      jum.assertEquals("'_is_this_working' setting should be passed", 
        "_is_this_working",
        setting.id
      );
      
      return this.checkbox(setting, details);
    });
    
    self.serializer_called = 0;
    Settings.addSerializer("_test_question", function (input) {
      self.serializer_called++;
      jum.assertEquals("right input element should be passed to serializer",
        "setting__is_this_working",
        input.id
      );
      return input.checked;
    });
  };
  
  this.test_getDetails = function () {
    jum.assertSameObjects({
      representAs: "_test_question",
      title: "Is this working?",
      help: "Check this box if you think that it's going to work."
    }, Setting.getDetails("_is_this_working"));
  };
  
  this.test_waitForSetting = {
    method: "waits.forJS",
    params: {
      js: function () {
        return da.db.SETTINGS.views.Setting.view.findRow("_is_this_working") !== -1
      }
    }
  };
  
  this.test_render = function () {
    Settings.showGroup("_test");
    jum.assertEquals("renderer should have been called once",
      1, self.renderer_called
    );
    jum.assertEquals("serializer shouldn't have been called yet",
      0, self.serializer_called
    );
  };
  
  this.test_revert = function () {
    $("setting__is_this_working").checked = true;
    $("revert_settings").click();
    
    jum.assertFalse("checkbox should be unchecked", 
      $("setting__is_this_working").checked
    );
    
    jum.assertEquals("renderer should be called during revert",
      2, self.renderer_called
    );
  };
  
  this.test_serialize = function () {
    $("setting__is_this_working").checked = true;
    $("save_settings").click();
    
    jum.assertEquals("serializer called once",
      1, self.serializer_called
    );
    
    self.saved_doc = null;
    Setting.findFirst({
      properties: {id: "_is_this_working"},
      onSuccess: function (doc) {
        self.saved_doc = doc;
      }
    });
  };
  
  this.test_waitForDoc = {
    method: "waits.forJS",
    params: {
      js: function () { return !!self.saved_doc }
    }
  };
  
  this.test_verifySave = function () {
    jum.assertTrue("setting's value should be saved to the db",
      self.saved_doc.get("value")
    );
  };
  
  this.teardown = function () {
    Settings.hide();
  };
  
  return this;
};