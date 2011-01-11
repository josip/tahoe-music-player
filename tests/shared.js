var SHARED = {};
var util = {
  wait_for_data: function (key) {
    return {
      method: 'waits.forJS',
      params: {
        js: function () { return !!SHARED[key]; }
      }
    }
  },
  
  create_id3v2_test: function (version, size) {
    var ID3v2Parser = da.util.ID3v2Parser,
        vkey = "v" + (version * 10);
    
    return new function () {
      var self = this;
      
      this.setup = function () {
        self.simplified = null;
        self.frames     = null;

        var data = da.util.BinaryFile.fromEncodedString(SHARED.songs[vkey].data);
        self.parser = new ID3v2Parser(data, {
          url: "/fake/" + Math.uuid(),
          onSuccess: function (simplified, frames) {
            self.simplified = simplified;
            self.frames = frames;
          }
        }, {});
        data = null;
      };

      this.test_waitForData = {
        method: 'waits.forJS',
        params: {
          js: function () { return !!self.simplified && !!self.frames; }
        }
      };
      
      this.test_header = function () {
        jum.assertEquals("version should be " + version,  self.parser.version, version);
        jum.assertEquals("no flags should be set",        self.parser.header.flags, 0);
        jum.assertEquals("tag size shoudl be " + size,    self.parser.header.size,  size);
      };

      this.test_verifySimplifiedResult = function () {
        jum.assertSameObjects(SHARED.songs[vkey].simplified, self.simplified);
      };

      this.test_verifyDetectedFrames = function () {
        jum.assertSameObjects(SHARED.songs[vkey].frames,self.frames);
      };
      
      this.teardown = function () {
        self.parser.destroy();
        delete self.parser;
      };
      
      return this;
    };
  }
};

// verifies that elements from `a` are in `b`, as well as on same positions
// jum.assertEqualArrays([1, 2, 3], [1, 2, 3]): pass
// jum.assertEqualArrays([1, 2, 3], [3, 1, 2]): fail
jum.assertEqualArrays = function (a, b) {
  jum.assertEquals("arrays should have same length", a.length, b.length);
  
  var aa = ["array", "arguments"];
  for(var n = 0, m = a.length; n < m; n++)
    if(aa.contains($type(a[n])))
      jum.assertEqualArrays(a[n], b[n]);
    else if($type(a[n]) === "object")
      jum.assertSameObjects(a[n], b[n]);
    else
      jum.assertEquals(
        "was '" + JSON.stringify(b) + "', expected '" + JSON.stringify(a) + "'",
        a[n], b[n]
      );
  
  return true;
};

// verifies that elements from `a` are in `b`, without comparing their positions
// or number of occurance.
// jum.assertEqualArrays([1, 2, 3], [1, 2, 3]): pass
// jum.assertEqualArrays([1, 2, 3], [3, 1, 2]): pass
jum.assertSameArrays = function (a, b) {
  jum.assertEquals("arrays should have same length", a.length, b.length);
  
  var aa = ["array", "arguments"];
  for(var n = 0, m = a.length; n < m; n++)
    if(aa.contains($type(a[n])))
      jum.assertEqualArrays(a[n], b[n]);
    else if($type(a[n]) === "object")
      jum.assertSameObjects(a[n], b[n]);
    else
      jum.assertTrue("should contain '" + a[n] + "'", b.indexOf(a[n]) !== -1);
  
  return true;
};

jum.assertSameObjects = function (a, b, useSameArrays) {
  if(a === b)
    return true;
  if(!a || !b)
    jum.assertEquals(a, b);
   
  for(var prop in a)
    if(a.hasOwnProperty(prop))
      if(prop in a && prop in b)
        if($type(a[prop]) === "object")
          jum.assertSameObjects(a[prop], b[prop]);
        else if($type(a[prop]) === "array")
          jum[useSameArrays ? "assertSameArrays" : "assertEqualArrays"](a[prop], b[prop]);
        else
          jum.assertEquals("propety '" + prop + "' differs", a[prop], b[prop]);
    else
      jum.assertTrue("missing '" + prop +"' property", false); 
  
  return true;
};
