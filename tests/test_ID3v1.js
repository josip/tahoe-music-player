windmill.jsTest.require("shared.js");
windmill.jsTest.require("data/songs.js");

var test_ID3v1 = new function () {
  var BinaryFile  = da.util.BinaryFile,
      ID3v1Parser = da.util.ID3v1Parser,
      self        = this;
  
  this.setup = function () {
    self.tags = {};
    
    SHARED.parser = new ID3v1Parser(BinaryFile.fromEncodedString(SHARED.songs.v1.data), {
      url: "/fake/" + Math.uuid(),
      onSuccess: function (tags) {
        self.tags = tags;
      }
    }, {});
  };
  
  this.test_waitForData = {
    method: 'waits.forJS',
    params: {
      js: function () { return !!self.tags; }
    }
  };
  
  this.test_verifyResult = function () {
    jum.assertSameObjects(SHARED.songs.v1.simplified, self.tags);
  };
  
  this.test_withID3v2 = function () {
    jum.assertFalse("ID3v1 parser should not parse ID3v2 tags",
      ID3v1Parser.test(BinaryFile.fromEncodedString(SHARED.songs.v24.data))
    );
  };
  
  this.test_withPNGFile = function () {
    jum.assertFalse("ID3v1 parser should not parse PNG file",
      ID3v1Parser.test(BinaryFile.fromEncodedString(SHARED.songs.image.data))
    );
  };
};
