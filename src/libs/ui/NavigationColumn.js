//#require "libs/ui/Column.js"
//#require "libs/util/util.js"

/** section: UserInterface
 *  class da.ui.NavigationColumn < da.ui.Column
 *
 *  Extends Column class to provide common implementation of a navigation column.
 **/
da.ui.NavigationColumn = new Class({
  Extends: da.ui.Column,

  /**
   *  da.ui.NavigationColumn#view -> {map: $empty, finished: $empty}
   *
   *  Use this object to pass arguments to `Application.db.view()`.
   *
   *  If `view.finished` is left empty, it will be replaced with function which will
   *  render the list as soon as map/reduce proccess finishes.
   **/
  view: {
    map: function (doc, emit) {
      if(!this._passesFilter(doc))
        return false;

      if(doc._deleted)
        emit("_deleted", doc.id);
      else
        emit(doc.title, {
          title: doc.title || doc.id
        });
    },

    finished: $empty
  },

  options: {
    filter: null,
    killView: true
  },

  /**
   *  new da.ui.NavigationColumn([options])
   *  - options.filter (Object | Function): filtering object or function.
   *  - options.db (BrowserCouch): [[BrowserCouch]] database to use for views.
   *    Defaults to `Application.db`.
   *
   *  If `filter` is provided than it will be applied during the map/reduce proccess.
   *  If it's an [[Object]] than only documents with same properties as those
   *  in `filter` will be considered, and if it's an [[Function]],
   *  than it *must* return `true` if document should be passed to
   *  any aditional filters, or `false` if the document should be discarded.
   *  First argument of the `filter` function will be the document itself.
   *
   *  If the column lacks map/reduce view but `total_count` is present, [[da.ui.NavigationColumn#render]] will be called.
   *
   *  All other options are the same as for [[da.ui.Column]].
   **/
  initialize: function (options) {
    this.parent(options);
    this._el.addClass("navigation_column");

    // Small speed-hack
    if(!this.options.filter)
      this._passesFilter = function () { return true };

    this._el.addEvent("click:relay(.column_item)", this.click.bind(this));

    if(this.view) {
      this.view.map = this.view.map.bind(this);
      if(!this.view.finished || this.view.finished === $empty)
        this.view.finished = this.mapReduceFinished.bind(this);
      else
        this.view.finished = this.view.finished.bind(this);

      if(this.view.reduce)
        this.view.reduce = this.view.reduce.bind(this);
      if(!this.view.updated && !this.view.temporary)
        this.view.updated = this.mapReduceUpdated;
      if(this.view.updated)
        this.view.updated = this.view.updated.bind(this);

      (options.db || da.db.DEFAULT).view(this.view);
    } else if(this.options.totalCount) {
      this.injectBottom(this.options.parentElement || document.body);
      if(!this.options.renderImmediately)
        this.render();
    }
  },

  /**
   *  da.ui.NavigationColumn#mapReduceFinished(values) -> this
   *  - values (Object): an object with result rows and `findRow` function.
   *
   *  Function called when map/reduce proccess finishes, if not specified otherwise in view.
   *  This function will provide [[da.ui.NavigationColumn#getItem]], update `total_count` option and render the column.
   **/
  mapReduceFinished: function (values) {
    // BrowserCouch's findRow() needs rows to be sorted by id.
    this._rows = $A(values.rows);
    this._rows.sort(this.compareFunction);

    this.updateTotalCount(values.rows.length);
    this.injectBottom(this.options.parentElement || document.body);
    if(this.options.renderImmediately !== false)
      this.render();

    return this;
  },

  /**
   *  da.ui.NavigationColumn#mapReduceUpdated(values[, forceRerender = false]) -> this
   *  - values (Object): rows returned by map/reduce process.
   *
   *  Note that this will have to re-render the whole column, as it's possible
   *  that one of the new documents should be rendered in the middle of already
   *  rendered ones (due to sorting).
   **/
  mapReduceUpdated: function (values, rerender) {
    var new_rows = $A(da.db.DEFAULT.views[this.view.id].view.rows),
        active = this.getActiveItem();
    new_rows.sort(this.compareFunction);

    // Noting new was added, so we can simply re-render those elements
    if(!rerender && this.options.totalCount === new_rows.length) {
      values = values.rows;
      var n = values.length,
          id_prefix = this.options.id + "_column_item_",
          item, el, index;

      while(n--) {
        item = values[n];
        el = $(id_prefix + item.id);
        if(el) {
          index = el.retrieve("column_index");
          console.log("Rerendering item", id_prefix, index);

          this.renderItem(index)
            .addClass("column_item")
            .store("column_index", index)
            .replaces(el);
        }
      }

      this._rows = new_rows;
    } else {
      console.log("total count was changed, rerendering whole column", this.options.id);
      this.options.totalCount = new_rows.length;
      this._rows = new_rows;
      this.rerender();
    }

    if(active) {
      this._active_el = $(this.options.id + "_column_item_" + active.id);
      this._active_el.addClass("active_column_item");
    }
  },

  /**
   *  da.ui.NavigationColumn#getItem(index) -> Object
   *  - index (Number): index number of the item in the list.
   **/
  getItem: function (index) {
    return this._rows[index];
  },

  /**
   *  da.ui.NavigationColumn#getActiveItem() -> Object | undefined
   **/
  getActiveItem: function () {
    if(!this._active_el)
      return;

    return this.getItem(this._active_el.retrieve("column_index"));
  },

  /**
   *  da.ui.NavigationColumn#renderItem(index) -> Element
   *  - index (Number): position of the item that needs to be rendered.
   *
   *  This function relies on `title`, `subtitle` and `icon` properties from emitted documents.
   *
   *  #### Note
   *  If you are overwriting this method, make sure that the returned element has the `id` attribute
   *  that follows this convention:
   *
   *      this.options.id + "_column_item_" + item.id
   *
   *  Where `item.id` represents unique identifier of the item that is being rendered (not to be mistaken
   *  with `index` argument).
   *
   *  This is necessary for updating views which are bound to [[da.db.BrowserCouch]] views.
   *
   **/
  renderItem: function (index) {
    var item = this.getItem(index),
        data = this.getItem(index).value,
        el = new Element("a", {
          id:       this.options.id + "_column_item_" + item.id,
          href:     "#",
          title:    data.title,
          "class":  index%2 ? "even" : "odd"
        });

    if(data.icon)
      el.grab(new Element("img",  {src:  data.icon}));
    if(data.title)
      el.grab(new Element("span", {html: data.title,    "class": "title"}));
    if(data.subtitle)
      el.grab(new Element("span", {html: data.subtitle, "class": "subtitle"}));

    delete item;
    delete data;
    return el;
  },

  /**
   *  da.ui.NavigationColumn#createFilter(item) -> Object | Function
   *  - item (Object): one of the rendered objects, usually clicked one.
   *
   *  Returns an object with properties which will be required from
   *  on columns "below" this one.
   *
   *  If function is returned, than returned function will be called
   *  by Map/Reduce proccess on column "below" and should return `true`/`false`
   *  depending if the document meets criteria.
   *
   *  #### Examples
   *
   *      function createFilter (item) {
   *        return {artist_id: item.id}
   *      }
   *
   *      function createFilter(item) {
   *        var id = item.id;
   *        return function (doc) {
   *          return doc.chocolates.contains(id)
   *        }
   *      }
   *
   **/
  createFilter: function (item) {
    return {};
  },

  click: function (event, el) {
    var item = this.getItem(el.retrieve("column_index"));
    if(this._active_el)
      this._active_el.removeClass("active_column_item");

    this._active_el = el.addClass("active_column_item");
    this.fireEvent("click", [item, event, el], 1);

    return item;
  },

  /**
   *  da.ui.NavigationColumn#compareFunction(a, b) -> Number
   *  - a (Object): first document.
   *  - b (Object): second document.
   *
   *  Function used for sorting items returned by map/reduce proccess. Compares documents by their `title` property.
   *
   *  [See meanings of return values](https://developer.mozilla.org/en/Core_JavaScript_1.5_Reference/Objects/Array/sort#Description).
   **/
  compareFunction: function (a, b) {
    a = a && a.value ? a.value.title : -1;
    b = b && b.value ? b.value.title : -1;

    if(a < b) return -1;
    if(a > b) return 1;
    return 0;
  },

  destroy: function () {
    this.parent();
    delete this._rows;
    delete this._active_el;

    if(this.view && !this.view.temporary)
      if(this.options.killView)
        (this.options.db || da.db.DEFAULT).killView(this.view.id);
      else
        (this.options.db || da.db.DEFAULT).removeEvent("update." + this.view.id, this.view.updated);
  },

  _passesFilter: function (doc) {
    var filter = this.options.filter;
    if(!filter)
      return false;

    return (typeof(filter) === "object") ? Hash.containsAll(doc, filter) : filter(doc);
  }
});
