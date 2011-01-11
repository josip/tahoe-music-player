//#require <libs/ui/ui.js>
//#require "libs/ui/ProgressBar.js"

(function () {
var ProgressBar = da.ui.ProgressBar; 
/** section: UserInterface
 *  class da.ui.SegmentedProgressBar
 *
 *  Display multiple progress bars inside one canvas tag.
 **/
var SegmentedProgressBar = new Class({
  
  /**
   *  new da.ui.SegmentedProgressBar(width, height, segments[, ticks = 0])
   *  - width (Number): width of the progressbar in pixels.
   *  - height (Number): height of the progressbar in pixels.
   *  - segments (Object): names of individual progress bars and their forground
   *    color, see example below.
   *  - ticks (Number): number of 1px marks along the progress bar.
   *
   *  #### Example
   *      var mb = new da.ui.SegmentedProgressBar(100, 15, {
   *        track: "#f00",
   *        load:  "#f3f3f3"
   *      });
   *      
   *      mb.setProgress("track", 0.2);
   *      mb.setProgress("load", 0.52);
   *
   *  The first define progress bar will be in foreground, while
   *  the last defined will be in background;
   *
   **/
  /**
   *  da.ui.SegmentedProgressBar.segments -> {segment1: da.ui.ProgressBar, ...}
   **/
  initialize: function (width, height, segments, ticks) {
    this._index = [];
    this.segments = {};
    this.ticks = ticks;
    
    this._el = new Element("canvas");
    this._el.width = width;
    this._el.height = height;
    this._el.className = "progressbar";
    this.ctx = this._el.getContext("2d");
    
    this._el.addEvent("resize", function () {
      var idx = this._index,
           n = idx.length;
      
      while(n--)
        this.segments[idx[n]].rerender();
    }.bind(this));
    
    for(var segment in segments)
      if(segments.hasOwnProperty(segment)) {
        this._index.push(segment);
        this.segments[segment] = new ProgressBar(this._el, {
          width:      width,
          height:     height,
          foreground: segments[segment]
        });
      }
  },
  
  /**
   *  da.ui.SegmentedProgressBar#setProgress(segment, progress) -> this | false
   *  - segment (String): name of the bar whose progress needs to be updated
   *  - progress (Number): number in 0-1 range.
   **/
  setProgress: function (segment, p) {
    segment = this.segments[segment];
    if(!segment)
      return false;
    
    var idx = this._index,
        n = idx.length;
    
    // Indeed, this is quite naive implementation
    segment.setProgress(p);
    while(n--)
      this.segments[idx[n]].rerender(); 
    
    if(this.ticks) {
      var inc = Math.round(this._el.width/this.ticks),
          h = this._el.height;
      
      this.ctx.fillStyle = "rgba(255, 255, 255, 0.3)";
      //this.ctx.fillStyle = "#ddd";
      for(var n = 0, m = this._el.width; n < m; n += inc) {
        if(n > 5)
          this.ctx.fillRect(n, 0, 1, h);
      }
      this.ctx.fillStyle = "rgba(0, 0, 0, 1)";
    }
    
    return this;
  },
  
  /**
   *  da.ui.SegmentedProgressBar#toElement() -> Element
   **/
  toElement: function () {
    return this._el;
  },
  
  /**
   *  da.ui.SegmentedProgressBar#destroy() -> undefined
   **/
  destroy: function () {
    this._el.destroy();
    delete this._el;
    delete this._index;
    delete this.segments;
    delete this.ctx;
  }
});
da.ui.SegmentedProgressBar = SegmentedProgressBar;
})();
