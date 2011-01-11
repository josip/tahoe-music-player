windmill.jsTest.require("shared.js");
windmill.jsTest.require("data/songs.js");

var test_ID3 = new function () {
  var BinaryFile = da.util.BinaryFile,
      ID3 = da.util.ID3;
  
  var ID3_patched = new Class({
    Extends: ID3,
    
    _data: BinaryFile.fromEncodedString(SHARED.songs.image.data),
    _getFile: function (parser) {
      if(!parser)
        this.options.onFailure();
      else
        this._onFileFetched(this._data);
    }
  });
  ID3_patched.parsers = $A(ID3.parsers);
  
  var self = this;
  this.setup = function () {
    self.called_onSuccess = false;
    self.called_onFailure = false;
    
    new ID3_patched({
      url: "/fake/" + Math.uuid(),
      onSuccess: function () {
        self.called_onSuccess = true;
      },
      onFailure: function () {
        self.called_onFailure = true;
      }
    });
  };
  
  this.test_callbacks = function () {
    jum.assertTrue(self.called_onFailure);
    jum.assertFalse(self.called_onSuccess);
  };
  
  this.teardown = function () {
    delete self.called_onSuccess;
    delete self.called_onFailure;
  };
};
