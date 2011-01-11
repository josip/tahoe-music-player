var test_SegmentedProgressBar = new function () {
  var SegmentedProgressBar = da.ui.SegmentedProgressBar,
      RED   = [255,   0,   0, 255],
      GREEN = [  0, 255,   0, 255],
      BLUE  = [  0,   0, 255, 255],
      TRANS = [  0,   0,   0,   0],
      self  = this;
  
  this.setup = function () {
    self.pb = new SegmentedProgressBar(100, 1, {
      r: "#f00",
      g: "#0f0",
      b: "#00f"
    });
  };
  
  function getPixel(x) {
    // px is an ImageData object which mimics Array.
    var px = self.pb.ctx.getImageData(x, 0, 1, 1).data;
    return [px[0], px[1], px[2], px[3]];
  }
  
  this.test_incrementation = function () {
    self.pb.setProgress("g", 0.6);
    self.pb.setProgress("r", 0.3);
    self.pb.setProgress("b",   1);
    
    jum.assertEqualArrays(RED,    getPixel( 2));
    jum.assertEqualArrays(RED,    getPixel(20));
    jum.assertEqualArrays(RED,    getPixel(29));
    
    jum.assertEqualArrays(GREEN,  getPixel(31));
    jum.assertEqualArrays(GREEN,  getPixel(50));
    jum.assertEqualArrays(GREEN,  getPixel(59));
    
    jum.assertEqualArrays(BLUE,   getPixel(61));
    jum.assertEqualArrays(BLUE,   getPixel(85));
    jum.assertEqualArrays(BLUE,   getPixel(99));
  };
  
  this.test_incrementingMiddleSegment = function () {
    self.pb.setProgress("g", 0.8);
    
    jum.assertEqualArrays(RED,    getPixel( 2));
    jum.assertEqualArrays(RED,    getPixel(29));
    
    jum.assertEqualArrays(GREEN,  getPixel(31));
    jum.assertEqualArrays(GREEN,  getPixel(66));
    jum.assertEqualArrays(GREEN,  getPixel(79));
    
    jum.assertEqualArrays(BLUE,   getPixel(81));
  };
  
  this.test_incrementingFirstSegment = function () {
    self.pb.setProgress("r", 0.9);
    
    jum.assertEqualArrays(RED,    getPixel( 2));
    jum.assertEqualArrays(RED,    getPixel(66));
    jum.assertEqualArrays(RED,    getPixel(79));
    
    jum.assertEqualArrays(BLUE,   getPixel(91));
  };
  
  this.test_decrementingFirstSegment = function () {
    self.pb.setProgress("r", 0.7);
    
    jum.assertEqualArrays(RED,    getPixel(69));
    jum.assertEqualArrays(GREEN,  getPixel(71));
    jum.assertEqualArrays(GREEN,  getPixel(79));
    jum.assertEqualArrays(BLUE,   getPixel(81));
    jum.assertEqualArrays(BLUE,   getPixel(91));
  };
  
  this.test_decrementingLastSegment = function () {
    self.pb.setProgress("b", 0.2);
    
    jum.assertEqualArrays(GREEN,   getPixel(79));
    jum.assertEqualArrays(TRANS,   getPixel(81));
  };
  
  this.teardown = function () {
    //this.pb.destroy();
  };
  
  return this;
};