//#require "libs/ui/ui.js"

(function () {
/** section: UserInterface
 *  class da.ui.Column
 *  implements Events, Options
 *  
 *  Widget which can efficiently display large amounts of items in a list.
 **/

var IDS = 0;
da.ui.Column = new Class({
  Implements: [Events, Options],
  
  options: {
    id:            null,
    rowHeight:     30,
    totalCount:     0,
    renderTimeout: 120
  },
  
  /**
   *  new da.ui.Column(options)
   *  - options.id (String): desired ID of the column's DIV element, `_column` will be appended.
   *    if ommited, random one will be generated.
   *  - options.rowHeight (Number): height of an row. Defaults to 30.
   *  - options.totalCount (Number): number of items this column has to show in total.
   *  - options.renderTimeout (Number): milliseconds to wait during the scroll before rendering
   *    items. Defaults to 120.
   *  
   *  Creates a new Column.
   *  
   *  ##### Notes
   *  When resizing (height) of the column use [[Element#set]] function provided by MooTools
   *  which properly fires `resize` event.
   *      
   *      column._el.set("height", window.getHeight());
   *  
   **/
  initialize: function (options) {
    this.setOptions(options);
    if(!this.options.id || !this.options.id.length)
      this.options.id = "duC_" + (IDS++);
    
    this._populated = false;
    // #_rendered will contain keys of items which have been rendered.
    // What is a key is up to particular implementation.
    this._rendered = [];
    
    this._el = new Element("div", {
      id: this.options.id + "_column",
      "class": "column",
      styles: {
        overflowX: "hidden",
        overflowY: "auto",
        position: "relative"
      }
    });
    
    // weight is used to force the browser
    // to show scrollbar with right proportions.
    this._weight = new Element("div", {
      styles: {
        position: "absolute",
        top:    0,
        left:   0,
        width:  1,
        height: 1
      }
    });
    this._weight.injectBottom(this._el);

    // scroll event is fired for even smallest changes
    // of scrollbar's position, since rendering items can be
    // expensive a small timeout will be set in order to save 
    // some bandwidth - the downside is that flickering will be seen
    // while scrolling.
    var timeout     = this.options.renderTimeout,
        timeout_fn  = this.render.bind(this),
        scroll_timer;

    this._el.addEvent("scroll", function () {
      clearTimeout(scroll_timer);
      scroll_timer = setTimeout(timeout_fn, timeout);
    });
    
    // We're caching lists' height so we won't have to
    // ask for it in every #render() - which can be quite expensive.
    this._el.addEvent("resize", function () {
      this._el_height = this._el.getHeight();
      this.render();
    }.bind(this));
  },
  
  /**
   *  da.ui.Column#render() -> this | false
   *  
   *  Renders all of items which are in current viewport in a batch.
   *  
   *  Returns `false` if all of items have already been rendered.
   *  
   *  Items are rendered in groups of (`div` tags with `column_items_box` CSS class).
   *  The number of items is determined by number of items which can fit in viewport + five
   *  items before and 10 items after current viewport.
   *  Each item has CSS classes defined in `options.itemClassNames` and have a `column_index`
   *  property stored.
   **/
  render: function () {
    if(!this._populated)
      this.populate();
    if(this._rendered.length === this.options.totalCount)
      return false;
    
    // We're pre-fetching previous 5 and next 10 items 
    // which are outside of current viewport
    var total_count = this.options.totalCount,
        ids = this.getVisibleIndexes(),
        n = Math.max(0, ids[0] - 6),
        m = Math.min(ids[1] + 10, total_count),
        first_rendered = -1,
        box;

    for( ; n < m; n++) {
      if(!this._rendered.contains(n)) {
        // First item in viewport could be already rendered,
        // by detecting the first item we're 'gonna render
        // helps minimizing amount of DOM nodes that will be inserted
        // (and avoids duplicaton).
        if(first_rendered === -1) {
          first_rendered = n;
          box = new Element("div", {"class": "column_items_box"});
        }

        this.renderItem(n)
            .addClass("column_item")
            .store("column_index", n)
            .injectBottom(box);
        this._rendered.push(n);
      }
    }
    
    if(first_rendered !== -1) {
      var coords = this.getBoxCoords(first_rendered);
      console.log("rendering box at", this.options.id, [first_rendered, m], coords);
      box.setStyles({
        position: "absolute",        
        top:      coords[1],
        left:     coords[0]
      }).injectBottom(this._el);
    }
    
    return this;
  },
  
  /**
   *  da.ui.Column#populate() -> this
   *  fires resize
   *  
   *  Positiones weight element and fires `resize` event. This method should ignore `_populated` property.
   **/
  populate: function () {
    var o = this.options;
    this._populated = true;
    this._weight.setStyle("top", o.rowHeight * o.totalCount);
    this._el.fireEvent("resize");
    
    return this;
  },
  
  /**
   *  da.ui.Column#rerender() -> this | false
   **/
  rerender: function () {
    if(!this._el)
      return false;
    
    var weight = this._weight;
    this._el.empty();
    this._el.grab(weight);
    
    this._rendered = [];
    this._populated = false;
    return this.render();
  },
  
  /**
   *  da.ui.Column#updateTotalCount(totalCount) -> this | false
   *  - totalCount (Number): total number of items this column is going to display
   *
   *  Provides means to update `totalCount` option after column has already been rendered/initialized.
   **/
  updateTotalCount: function (total_count) {
    this.options.totalCount = total_count;
    return this.populate();
  },
  
  /**
   *  da.ui.Column#renderItem(index) -> Element
   *  - index (Object): could be a String or Number, internal representation of data.
   *  
   *  Constructs and returns new Element without adding it to the `document`.
   **/
  renderItem: function(index) {
    console.warn("Column.renderItem(index) should be overwritten", this);
    return new Element("div", {html: index});
  },
  
  /**
   *  da.ui.Column#getBoxCoords(index) -> [Number, Number]
   *  - index (Number): index of the first item in a box.
   *  
   *  Returns X and Y coordinates at which item with given `index` should be rendered at.
   **/
  getBoxCoords: function(index) {
    return [0, this.options.rowHeight * index];
  },

  /**
   *  da.ui.Column#getVisibleIndexes() -> [first_visible_index, last_visible_index]
   *  
   *  Returns an array with indexes of first and last item in visible portion of list.
   **/
  getVisibleIndexes: function () {
    // Math.round() and Math.ceil() are used in such combination
    // to include items which could be only partially in viewport
    var rh           = this.options.rowHeight,
        first         = Math.ceil(this._el.getScroll().y / rh),
        per_viewport  = Math.round(this._el_height / rh);
    if(first > 0) first--;
    
    return [first, first + per_viewport];
  },

  /**
   *  da.ui.Column#injectBottom(element) -> this
   *  - element (Element): element to which column should be appended.
   *  
   *  Injects column at the bottom of provided element.
  **/
  injectBottom: function(el) {
    this._el.injectBottom(el);
    return this;
  },
  
  /**
   *  da.ui.Column#destory() -> this
   *  
   *  Removes column from DOM.
   **/
  destroy: function () {
    this._el.destroy();
    delete this._el;
    
    this._weight.destroy();
    delete this._weight;
    
    return this;
  },
  
  /**
   *  da.ui.Column#toElement() -> Element
   **/
  toElement: function () {
    return this._el;
  }
});

})();

