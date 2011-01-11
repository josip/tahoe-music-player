var test_ProgressBar = new function () {
  var ProgressBar = da.ui.ProgressBar,
      BLACK       = [0,   0, 0, 255],
      RED         = [255, 0, 0, 255],
      TRANSPARENT = [0,   0, 0, 0],
      self        = this;
      
  this.setup = function () {
    self.pb = new ProgressBar(null, {
      width: 100,
      height: 1,
      foreground: "rgba(0, 0, 0, 255)"
    });
  };
  
  function getPixel(x) {
    // px is an ImageData object which mimics Array.
    var px = self.pb.ctx.getImageData(x, 0, 1, 1).data;
    return [px[0], px[1], px[2], px[3]];
  }
  
  // Precise pixels are not being used due to the fact
  // that each percent is widend for apporx. two pixels,
  // in order to fix browser inconsistencies.
  this.test_incrementation = function () {
    self.pb.setProgress(0.5);

    jum.assertEqualArrays(BLACK,        getPixel(  1));
    jum.assertEqualArrays(BLACK,        getPixel( 49));
    jum.assertEqualArrays(TRANSPARENT,  getPixel(100));
    
    self.pb.options.foreground = "rgba(255, 0, 0, 255)";
    self.pb.setProgress(0.7);
    
    jum.assertEqualArrays(BLACK,        getPixel(  1));
    jum.assertEqualArrays(RED,          getPixel( 52));
    jum.assertEqualArrays(RED,          getPixel( 69));
    jum.assertEqualArrays(TRANSPARENT,  getPixel(100));
  };
  
  this.test_decrementation = function () {
    self.pb.options.foreground = "rgba(0, 255, 0, 255)";
    self.pb.setProgress(0.6);
    
    jum.assertEqualArrays(RED,          getPixel(52));
    jum.assertEqualArrays(RED,          getPixel(55));
    jum.assertEqualArrays(TRANSPARENT,  getPixel(60));
    jum.assertEqualArrays(TRANSPARENT,  getPixel(70));
  };
  
  this.teardown = function () {
    this.pb.destroy();
  };
  
  return this;
};