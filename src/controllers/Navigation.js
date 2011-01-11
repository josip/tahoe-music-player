//#require "libs/ui/Menu.js"
(function () {
var Menu = da.ui.Menu;
    
/** section: Controllers
 *  class NavigationColumnContainer
 *  
 *  Class for managing column views.
 *
 *  #### Notes
 *  This class is private.
 *  Public interface is accessible via [[da.controller.Navigation]].
 **/

var NavigationColumnContainer = new Class({
  /**
   *  new NavigationColumnContainer(options)
   *  - options.columnName (String): name of the column.
   *  - options.container (Element): container element.
   *  - options.header (Element): header element.
   *  - options.menu (UI.Menu): [[UI.Menu]] instance.
   *  
   *  Renders column and adds self to the [[da.controller.Navigation.activeColumns]].
   **/
   
  /**
    *  NavigationColumnContainer#column_name -> String
    *  Name of the column.
    **/
  
  /**
   *  NavigationColumnContainer#column -> NavigationColumn
   *  `column` here represents the list itself.
   **/
  
  /**
   *  NavigationColumnContainer#parent_column -> NavigationColumnContainer
   *  Usually column which created _this_ one. Visually, its the one to the left of _this_ one.
   **/
   
  /**
    *  NavigationColumnContainer#header -> Element
    *  Header element. It's an `a` tag with an `span` element.
    *  `a` tag has `column_header`, while `span` tag has `column_title` CSS class.
    **/
  
  /**
   *  NavigationColumnContainer#menu -> UI.Menu
   *  Container's [[UI.Menu]]. It can be also accesed with:
   *  
   *        this.header.retrieve("menu")
   **/
   
  /**
   *  NavigationColumnContainer#_el -> Element
   *  [[Element]] of the actual container. Has `column_container` CSS class.
   **/
  initialize: function (options) {
    this.column_name = options.columnName;
    this.parent_column = Navigation.activeColumns[Navigation.activeColumns.push(this) - 2];
    
    if(!(this._el = options.container))
      this.createContainer();

    if(!(this.header = options.header))
      this.createHeader();
    
    this.column = new Navigation.columns[this.column_name]({
      id:             this.column_name,
      filter:         options.filter,
      parentElement:  this._el,
      parentColumn:   this.parent_column ? this.parent_column.column : null
    });
    Navigation.adjustColumnSize(this.column);

    if(!(this.menu = options.menu))
      this.createMenu();
    else
      this.header.store("menu", this.menu);
    
    if(this.column.constructor.filters.length)
      this.column.addEvent("click", this.createFilteredColumn.bind(this));
    
    this._el.focus();
  },
  
  /**
   *  NavigationColumnContainer#createContainer() -> this
   *  
   *  Creates container element in `navigation_pane` [[Element]].
   **/
  createContainer: function () {
    $("navigation_pane").grab(this._el = new Element("div", {
      id: this.column_name + "_column_container",
      "class": "column_container no_selection"
    }));
    
    return this;
  },
  
  /**
   *  NavigationColumnContainer#createHeader() -> this
   *  
   *  Creates header element and attaches click event. Element is added to [[NavigationColumnContainer#toElement]].
   **/
  createHeader: function () {
    this.header = new Element("a", {
      "class":  "column_header",
      href:     "#"
    });
    
    this.header.addEvent("click", function (event) {
      var menu = this.retrieve("menu");
      if(menu)
        menu.show(event);
    });
    
    this._el.grab(this.header.grab(new Element("span", {
      html:     Navigation.columns[this.column_name].title,
      "class":  "column_title"
    })));
    
    return this;
  },
  
  /**
   *  NavigationColumnContainer#createMenu() -> this | false
   *  
   *  Creates menu for current column (if it has filters).
   *  [[da.ui.Menu]] instance is stored to `header` element with `menu` key.
   **/
  createMenu: function () {
    var filters = this.column.constructor.filters,
        items = {},
        column;
    
    if(!filters || !filters.length)
      return false;
    
    items[this.column_name] = {html: this.column.constructor.title, "class": "checked", href: "#"};
    for(var n = 0, m = filters.length; n < m; n++) {
      column = Navigation.columns[filters[n]];
      if(!column.hidden)
        items[filters[n]] = {html: column.title, href: "#"};
    }
    
    this.menu = new Menu({
      items: items
    });
    this.menu._el.addClass("navigation_menu");
    this.header.store("menu", this.menu);
    
    this.menu.addEvent("show", function () {      
      var header = this.header;
      header.addClass("active_menu");
      // adjusting menu's width to the width of the header
      header.retrieve("menu").toElement().style.width = header.getWidth() + "px";
    }.bind(this));
    
    this.menu.addEvent("hide", function () {
      this.header.removeClass("active_menu");
    }.bind(this));
    
    if(filters && filters.length)
      this.menu.addEvent("click", this.replace.bind(this.parent_column || this));
    
    return this;
  },
  
  /**
   *  NavigationColumnContainer#replace(filterName[, event][, element]) -> undefined
   *  - filterName (String): id of the menu item.
   *  - event (Event): DOM event.
   *  - element (Element): clicked menu item.
   *  
   *  Function called on menu click. If `filterName` is name of an actual filter then
   *  list in current column is replaced with a new one (provided by that filter).
   **/
  replace: function (filter_name, event, element) {
    if(!Navigation.columns[filter_name])
      return;
    
    var parent  = this.filter_column._el,
        header  = this.filter_column.header,
        menu    = this.filter_column.menu,
        filter  = this.filter_column.column.options.filter;
    
    // we need to keep the menu and header, since
    // all we need to do is to replace the list.
    // null-ifying those properties will make sure that
    // filter_column's destroy won't destroy them
    this.filter_column.menu = null;
    this.filter_column._el = null;
    this.filter_column.destroy();
    
    this.filter_column = new NavigationColumnContainer({
      columnName: filter_name,
      filter:     filter,
      container:  parent,
      header:     header,
      menu:       menu
    });
    
    if(menu.last_clicked)
      menu.last_clicked.removeClass("checked");
    if(element)
      element.addClass("checked");
    
    header.getElement(".column_title").set("text", Navigation.columns[filter_name].title);
  },
  
  /**
   *  NavigationColumnContainer#createFilteredColumn(item) -> undefined
   *  - item (Object): clicked item.
   *  
   *  Creates a new column after (on the right) this one with applied filter which
   *  is generated using the data of the clicked item.
   **/
  createFilteredColumn: function (item) {
    if(this.filter_column)
      this.filter_column.destroy();
    
    this.filter_column = new NavigationColumnContainer({
      columnName: this.column.constructor.filters[0],
      filter: this.column.createFilter(item)
    });
  },
  
  /**
   *  NavigationColumnContainer#destroy() -> this
   *  
   *  Destroys this column (including menu and header).
   *  Removes itself from [[da.controller.Navigation.activeColumns]].
   **/
  destroy: function () {
    if(this.filter_column) {
      this.filter_column.destroy();
      delete this.filter_column;
    }
    if(this.menu) {
      this.menu.destroy();
      delete this.menu;
    }
    if(this.column) {
      this.column.destroy();
      delete this.column;
    }
    if(this._el) {
      this._el.destroy();
      delete this._el;
    }
    
    Navigation.activeColumns.erase(this);
    
    return this;
  },
  
  /**
   *  NavigationColumnContainer#toElement() -> Element
   **/
  toElement: function () {
    return this._el;
  }
});

/** section: Controllers
 * da.controller.Navigation
 **/
var Navigation = {
  /**
   * da.controller.Navigation.columns
   *  
   * Contains all known columns.
   * 
   * #### Notes
   * Use [[da.controller.Navigation.registerColumn]] to add new ones,
   * *do not* add them manually. 
   **/
  columns: {},
  
  /**
   *  da.controller.Navigation.activeColumns -> [NavigationColumnContainer, ...]
   *  
   *  Array of currently active (visible) columns.
   *  The first column is always [[da.controller.Navigation.columns.Root]].
   **/
  activeColumns: [],
  
  initialize: function () {
    var root_column = new NavigationColumnContainer({columnName: "Root"});
    root_column.menu.removeItem("Root");
    
    var artists_column = new NavigationColumnContainer({
      columnName: "Artists",
      menu: root_column.menu
    });
    artists_column.header.store("menu", root_column.menu);
    root_column.filter_column = artists_column;
    root_column.header = artists_column.header;
    
    this._header_height = artists_column.header.getHeight();
    this._player_pane_width = $("player_pane").getWidth();
    window.addEvent("resize", function () {
      var columns = Navigation.activeColumns,
          n = columns.length,
          height = window.getHeight() - this._header_height,
          width = (window.getWidth() - $("player_pane").getWidth())/3 - 1;
      
      while(n--)
        columns[n].column._el.setStyles({
          height: height,
          width:  width
        }).fireEvent("resize");
      
      $("navigation_pane").style.height = window.getHeight() + "px";
    }.bind(this));
    
    window.fireEvent("resize");
  },
  
  /**
   *  da.controller.Navigation.adjustColumnSize(column) -> undefined
   *  - column (da.ui.NavigationColumn): column which needs size adjustment.
   *  
   *  Adjusts column's height to window.
   **/
  adjustColumnSize: function (column) {
    var el = column.toElement();
    el.style.height = (window.getHeight() - this._header_height) + "px";
      // -1 for te right border
    el.style.width = ((window.getWidth() - this._player_pane_width)/3 - 1) + "px";
    el.fireEvent("resize");
    el = null;
  },
  
  /**
   *  da.controller.Navigation.registerColumn(id[, title], filters, column) -> undefined
   *  - id (String): id of the column.
   *  - title (String): name of the column. Defaults to the value `id`, if not provided.
   *  - filters (Array): names of the columns which can accept filter created
   *    (with [[da.ui.NavigationColumn#createFilter]]) by this one.
   *  - column (da.ui.NavigationColumn): column class.
   *  
   *  #### Notes
   *  `title` and `filters` will be added to `column` as class properties.
   *  If the `id` begins with an underscore, the column will be considered private
   *  and it won't be visible in the menus.
   **/
  registerColumn: function (id, title, filters, col) {
    if(arguments.length === 3) {
      col     = filters;
      filters = title;
      title   = id;
    }
    col.extend({
      title:   title,
      filters: filters || [],
      hidden:  id[0] === "_"
    });
    
    this.columns[id] = col;
    if(id !== "Root")
      this.columns.Root.filters.push(id);
    
    // TODO: If Navigation is initialized
    // then Root's menu has to be updated.
  }
};

da.controller.Navigation = Navigation;
da.app.addEvent("ready", function () {
  Navigation.initialize();
});

//#require "controllers/default_columns.js"

da.app.fireEvent("ready.controller.Navigation", [], 1);
})();
