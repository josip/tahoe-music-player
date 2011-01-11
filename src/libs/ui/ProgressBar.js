//#require <libs/ui/ui.js>

(function () {
/** section: UserInterface
 *  class da.ui.ProgressBar
 *
 *  Canvas-based progress bar.
 **/
var ProgressBar = new Class({
  Implements: Options,
  
  options: {
    width: 200,
    height: 20,
    foreground: "#33519d"
  },
  
  /**
   *  new da.ui.ProgressBar([canvas], options)
   *  - canvas (Element): already existing DOM node.
   *    Note that in this case, this istance of [[da.ui.ProgressBar]] won't
   *    monitor width/height changes.
   *  - options.width (Number): width of the progress bar.
   *  - options.height (Number): height of the progress bar.
   *  - options.foreground (String): colour of the progress bar.
   *  
   *  #### Notes
   *  To resize the progress bar after initialization use MooTools'
   *  `setStyle` method, since it properly fires `resize` event.
   *
   *      progress_bar.toElement().setStyle("width", 100);
   *
   *  If you want your progress bar as a lovely gradient, just put a `LinearGradient`
   *  object to `options.foreground`.
   *
   *      var pb = new da.ui.ProgressBar({width: 100, height: 5, foreground: "#ffa"});
   *      var gradient = pb.ctx.createLinearGradient(0, 0, 0, 5);
   *      gradient.addColorStop(0, "#ffa");
   *      gradient.addColorStop(1, "#ffe");
   *      pb.options.foregound = gradient;
   *      gradient = null;
   *
   **/
  initialize: function (canvas, options) {
    this.setOptions(options);
    
    if(canvas) {
      this._el = canvas;
    } else {
      this._el = new Element("canvas");
      this._el.width = this.options.width;
      this._el.height = this.options.height;
      this._el.addClass("progressbar");
      
      this._el.addEvent("resize", function () {
        this.options.width = this._el.getWidth();
        this.options.height = this._el.getHeight();
      
        this.progress -= 0.0001;
        this.setProgress(this.progress + 0.0001);
      }.bind(this));
    }
    
    this.ctx = this._el.getContext("2d");
    
    this.progress = 0;
  },
  
  /**
   *  da.ui.ProgressBar#setProgress(progress) -> this
   *  - progress (Number): in 0-1 range.
   *
   *  #### Notes
   *  Use animation with care, it should not be necessary for small changes
   *  especially if the progress bar is narrow.
   * 
   **/
  setProgress: function (p) {
    var current_progress  = this.progress,
        el_width          = this.options.width,
        diff              = p - current_progress,
        increment         = diff > 0,
        // Since most of the time we'll be incrementing
        // progress we can save one if/else condition
        // by "caching" the results immediately
        x                 = current_progress,
        width             = diff;
    
    if(!diff)
      return this;
    
    if(!increment) {
      x = current_progress - (-diff);
      width = current_progress - p;
    }
    
    // This allows SegmentedProgressBar to acutally
    // draw bars with different colours.
    this.ctx.fillStyle = this.options.foreground;
    // We're adding +-1px here because some browsers are unable
    // to render small changes precisely. (even different implementations of WebKit)
    this.ctx[increment ? "fillRect" : "clearRect"](
      (x * el_width) - 1,     0,
      (width * el_width) + 1, this.options.height
    );
    
    this.progress = p;
    
    return this;
  },
  
  /**
   *  da.ui.ProgressBar#rerender() -> this
   *  
   *  #### Notes
   *  Unlike [[da.ui.ProgressBar.setProgress]] this method will render the whole bar,
   *  and thus is not really efficient (but indeed, needed in some situations).
   **/
  rerender: function () {
    var opts = this.options;
    this.ctx.fillStyle = opts.foreground;
    this.ctx.fillRect(0, 0, this.progress * opts.width, opts.height);
    
    delete opts;
    return this;
  },
  
  /**
   *  da.ui.ProgressBar#toElement() -> Element
   **/
  toElement: function () {
    return this._el;
  },
  
  /**
   *  da.ui.ProgressBar#destroy() -> Element
   **/
  destroy: function () {
    this._el.destroy();
    
    delete this._el;
    delete this.ctx;
    delete this.progress;
    delete this.options;
  }
});
da.ui.ProgressBar = ProgressBar;

})();
