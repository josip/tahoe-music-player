windmill.jsTest.require("shared.js");
windmill.jsTest.require("data/songs.js");

var test_ID3v2 = new function () {
  var BinaryFile = da.util.BinaryFile,
      ID3v2Parser = da.util.ID3v2Parser;
  
  // Sometimes the code gets exectued before data/songs.js
  this.test_waitForData = {
    method: "waits.forJS",
    params: {
      js: function () { return !!SHARED && !!SHARED.songs }
    }
  };
  
  this.test_withPNGFile = function () {
    jum.assertFalse("should not parse PNG file",
      ID3v2Parser.test(BinaryFile.fromEncodedString(SHARED.songs.image.data))
    );
  };
  
  this.test_withID3v1File = function () {
    jum.assertFalse("should not parse ID3v1 file",
      ID3v2Parser.test(BinaryFile.fromEncodedString(SHARED.songs.v1.data))
    );
  };
  
  this.test_withID3v2Files = function () {
    jum.assertTrue("should detect v2.2",
      ID3v2Parser.test(BinaryFile.fromEncodedString(SHARED.songs.v22.data))
    );
    jum.assertTrue("should detect v2.3",
      ID3v2Parser.test(BinaryFile.fromEncodedString(SHARED.songs.v23.data))
    );
    jum.assertTrue(ID3v2Parser.test(BinaryFile.fromEncodedString(SHARED.songs.v24.data)));
  };
  
  return this;
};

var test_ID3v22 = util.create_id3v2_test(2.2, 25792);
var test_ID3v23 = util.create_id3v2_test(2.3, 10379);
var test_ID3v24 = util.create_id3v2_test(2.4, 266);
