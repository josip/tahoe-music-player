windmill.jsTest.require("data/");

var test_BinaryFile = new function () {
  var BinaryFile = da.util.BinaryFile,
      self = this;
  
  this.setup = function () {
    self.file_le = new BinaryFile("\0\0\1\0");
    self.file_be = new BinaryFile("\0\1\0\0", {bigEndian: true});    
    self.bond    = new BinaryFile("A\0\0\7James Bond\0");
  };
  
  this.test_options = function () {
    jum.assertEquals(4, self.file_le.length);
    jum.assertFalse(self.file_le.bigEndian);
    
    jum.assertEquals(4, self.file_be.length);
    jum.assertTrue(self.file_be.bigEndian);
  };
  
  this.test_getByte = function () {
    jum.assertEquals(0, self.file_le.getByteAt(0));
    jum.assertEquals(1, self.file_le.getByteAt(2));
    
    jum.assertEquals(0, self.file_be.getByteAt(0));
    jum.assertEquals(1, self.file_be.getByteAt(1));
  };
  
  this.test_getShort = function () {
    jum.assertEquals(0,   self.file_le.getShortAt(0)); // 00
    jum.assertEquals(256, self.file_le.getShortAt(1)); // 01
    jum.assertEquals(1,   self.file_le.getShortAt(2)); // 10
    
    jum.assertEquals(1,   self.file_be.getShortAt(0)); // 01
    jum.assertEquals(256, self.file_be.getShortAt(1)); // 10
    jum.assertEquals(0,   self.file_be.getShortAt(2)); // 00
  };
  
  this.test_getLong = function () {
    jum.assertEquals(65536, self.file_le.getLongAt(0));
    jum.assertEquals(65536, self.file_be.getLongAt(0));
  };
  
  this.test_getBits = function () {
    jum.assertSameObjects([0, 1], self.file_le.getBitsAt(2, 2));
    jum.assertSameObjects([0, 0, 0, 1], self.file_be.getBitsAt(1, 4));
  };
  
  this.test_unpack = function () {
    jum.assertSameObjects(["A", 0, 0, 7], self.bond.unpack("c3i"));
    jum.assertSameObjects(["James Bond"], self.bond.unpack("4x10S"));
  };
  
  this.test_toEncodedString = function () {
    jum.assertEquals("%00%00%01%00", self.file_le.toEncodedString());
    jum.assertEquals("%00%01%00%00", self.file_be.toEncodedString());
  };
  
  this.teardown = function () {
    self.file_le.destroy();
    self.file_be.destroy();
    self.bond.destroy();
    
    delete self.file_le;
    delete self.file_be;
    delete self.bond;
  };
  
  return this;
};
