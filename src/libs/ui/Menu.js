//#require "libs/ui/ui.js"

(function () {
/** section: UserInterface
 *  class da.ui.Menu
 *  implements Events, Options
 *  
 *  Lightweight menu class.
 *  
 *  #### Example
 *  
 *      var file_menu = new da.ui.Menu({
 *        items: {
 *          neu:      {html: "New", href: "#"},
 *          neu_tpl:  {html: "New from template", href: "#"},
 *          open:     {html: "Open", href: "#"},
 *          
 *          _sep1:     da.ui.Menu.separator,
 *          
 *          close:    {html: "Close", href: "#"},
 *          save:     {html: "Save", href: "#"},
 *          save_all: {html: "Save all", href: "#", "class": "disabled"},
 *          
 *          _sep2:    da.ui.Menu.separator,
 *          
 *          quit:     {html: "Quit", href: "#", onClick: function () {
 *            confirm("Are you sure?")
 *          }}
 *        },
 *        
 *        position: {
 *          position: "topLeft"
 *        },
 *        
 *        onClick: function (key, event, element) {
 *          console.log("knock knock", key);
 *        }
 *      });
 *      
 *      file_menu.show();
 *  
 *  Values of properties in `items` are actually second arguments for MooTools'
 *  `new Element()` and therefore provide great customization ability.
 *  
 *  `position` property will be passed to MooTools' `Element.position()` method,
 *  and defaults to `bottomRight`.
 *
 *  #### Events
 *  - `click` - arguments: key of the clicked item, clicked element
 *  - `show`
 *  - `hide`
 *  
 *  #### Notes
 *  `href` attribute is added to all items in order to enable
 *  keyboard navigation with tab key.
 *  
 *  #### See also
 *  * [MooTools Element class](http://mootools.net/docs/core/Element/Element#Element:constructor)
 **/

var VISIBLE_MENU, ID = 0;
da.ui.Menu = new Class({
  Implements: [Events, Options],
  
  options: {
    items: {},
    position: {
      position: "bottomLeft"
    }
  },
  
  /**
   *  da.ui.Menu#last_clicked -> Element
   *  
   *  Last clicked menu item.
   **/
  last_clicked: null,
  
  /**
   *  new da.ui.Menu([options = {}])
   *  - options.items (Object): menu items.
   *  - options.position (Object): menu positioning parameters.
   **/
  initialize: function (options) {
    this.setOptions(options);
    
    this._el = (new Element("ul")).addClass("menu").addClass("no_selection");
    this._el.style.display = "none";
    this._el.addEvent("click:relay(.menu_item a)", this.click.bind(this));
    this._el.addEvent("dragend:relay(.menu_item a)", this.click.bind(this));
    this._id = "_menu_" + (ID++) + "_";
    
    this.render();
  },
  
  /**
   *  da.ui.Menu#render() -> this
   *  
   *  Renders the menu items and adds them to the document.
   *  Menu element is an `ul` tag appeded to the bottom of `document.body` and has `menu` CSS class.
   **/
  render: function () {
    var items = this.options.items;
    this._el.dispose().empty();
    
    for(var id in items)
      this._el.grab(this.renderItem(id));
    
    document.body.grab(this._el);
    return this;
  },
  
  /**
   *  da.ui.Menu#renderItem(id) -> Element
   *  - id (String): id of the menu item.
   *  
   *  Renders item without attaching it to DOM.
   *  Item is a `li` tag with `menu_item` CSS class. `li` tag contains an `a` tag with the item's text.
   *  Each `li` tag also has a `menu_key` property set, which can be retrived with:
   *        
   *        menu.toElement().getItems('.menu_item').retrieve("menu_key")
   *  
   *  If the item was defined with function than those tag names might not be used,
   *  but CSS class names are guaranteed to be there in both cases.
   **/
  renderItem: function (id) {
    var options = this.options.items[id], el;
    
    if(typeof options === "function")
      el = options(id).addClass("menu_item");
    else
      el = new Element("li").grab(new Element("a", options));
    
    el.id = this._id + id;
    
    return el.addClass("menu_item").store("menu_key", id);
  },
  
  /**
   *  da.ui.Menu#addItems(items) -> this
   *  - items (Object): key-value pairs of items to be added to the menu.
   *  
   *  Adds items to the bottom of menu and renders them.
   **/
  addItems: function (items) {
    $extend(this.options.items, items);
    return this.render();
  },
  
  /**
   *  da.ui.Menu#addItem(id, value) -> this
   *  - id (String): id of the item.
   *  - value (Object | Function): options for [[Element]] class or function which will render the item.
   *  
   *  If `value` is an [[Object]] then it will be passed as second argument to MooTools's [[Element]] class.
   *  If `value` is an [[Function]] then it has return an [[Element]],
   *  first argument of the function is id of the item that needs to be rendered.
   *  
   *  #### Notes
   *  `id` attribute of the element will be overwritten in both cases.
   *   *Do not* depend on them in your code.
   **/
  addItem: function (id, value) {
    this.options.items[id] = value;
    this._el.grab(this.renderItem(id));
    return this;
  },
  
  /**
   *  da.ui.Menu#removeItem(id) -> this
   *  - id (String): id of the item.
   *  
   *  Removes an item from the menu.
   **/
  removeItem: function (id) {
    delete this.options.items[id];
    return this.render();
  },
  
  /**
   *  da.ui.Menu#getItem(id) -> Element
   *  - id (String): id of the item.
   *  
   *  Returns DOM representing the menu item.
   *  
   *  #### Notes
   *  Never overwrite `id` attribute of the element,
   *  as this very method relies on it.
   **/
  getItem: function (id) {
    return $(this._id + id);
  },
  
  /**
   *  da.ui.Menu#addSeparator() -> this
   *  
   *  Adds separator to the menu.
   **/
  addSeparator: function () {
    return this.addItem("separator_" + Math.uuid(3), da.ui.Menu.separator);
  },
  
  /**
   *  da.ui.Menu#click(event, element) -> this
   *  - event (Event): DOM event or `null`.
   *  - element (Element): list item which was clicked.
   *  fires: click
   **/
  click: function (event, element) {
    this.hide();
    
    if(!element.className.contains("menu_item"))
      element = element.getParent(".menu_item");
    if(!element)
      return this;
    
    this.fireEvent("click", [element.retrieve("menu_key"), event, element]);
    this.last_clicked = element;
    
    return this;
  },
  
  /**
   *  da.ui.Menu#show([event]) -> this
   *  - event (Event): click or some other DOM event with coordinates.
   *  fires show
   *  
   *  Shows the menu. If event is present than menus location will be adjusted according to
   *  event's coordinates and position option.
   *  In case the menu is already visible, it will be hidden.
   **/
  show: function (event) {
    if(VISIBLE_MENU) {
      if(VISIBLE_MENU == this)
        return this.hide();
      else
        VISIBLE_MENU.hide();
    }

    VISIBLE_MENU = this;
    
    if(event)
      event.stop();
    
    if(event && event.target) {
      this._el.position($extend({
        relativeTo: event.target
      }, this.options.position));
    }
    
    this._el.style.zIndex = 5;
    this._el.style.display = "block";
    this._el.focus();
    
    this.fireEvent("show");
    
    return this;
  },
  
  /**
   *  da.ui.Menu#hide() -> this
   *  fires hide
   *  
   *  Hides the menu.
   **/
  hide: function () {
    if(this._el.style.display === "none")
      return this;
    
    VISIBLE_MENU = null;
    this._el.style.display = "none";
    this.fireEvent("hide");
    
    return this;
  },
  
  /**
   *  da.ui.Menu#destroy() -> this
   *  
   *  Destroys the menu.
   **/
  destroy: function () {
    this._el.destroy();
    delete this._el;
    return this;
  },
  
  /**
   *  da.ui.Menu#toElement() -> Element
   *  
   *  Returns menu element.
   **/
  toElement: function () {
    return this._el;
  }
});

/**
 *  da.ui.Menu.separator -> Object
 *  
 *  Use this object as a separator.
 **/
da.ui.Menu.separator = {
  "class": "menu_separator",
  html: "<hr/>",
  onClick: function (event) {
    if(event)
      event.stop();
  }
};

// Hides the menu if click happened somewhere outside of the menu.
window.addEvent("click", function (e) {
  var target = e.target;
  if(VISIBLE_MENU && (!target || !$(target).getParents().contains(VISIBLE_MENU._el)))
    VISIBLE_MENU.hide();
});

})();
