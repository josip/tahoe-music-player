//#require "libs/ui/ui.js"

/** section: UserInterface
 *  class da.ui.Dialog
 *
 *  Class for working with interface dialogs.
 **/
da.ui.Dialog = new Class({
  Implements: [Events, Options],

  options: {
    title:              null,
    closeButton:        false,
    show:               false,
    draggable:          false,
    hideOnOutsideClick: true,
    destroyOnHide:      false
  },

  /**
   *  new da.ui.Dialog(options)
   *  - options.title (String | Element): title of the dialog. optional.
   *  - options.hideOnOutsideClick (Boolean): if `true`, the dialog will be
   *    hidden when the click outside the dialog element occurs (ie. on the dimmed
   *    portion of screen)
   *  - options.closeButton (Boolean): toggle the close button. If `true`, the button
   *    will be injected at the top of `options.html`, before the title (if any).
   *  - options.show (Boolean): if `true` the dialog will be shown immediately as it's created.
   *    Defaults to `false`.
   *  - options.draggable (Boolean): when set to `true`, the dialog will be draggable.
   *    There won't be a dialog wrapper, ie. the users will be able to interact with
   *    the content around the dialog. Defaults to `false`.
   *  - options.destroyOnHide (Boolean): destroy the dialog after the dialog has been hidden
   *    for the first time.
   *  - options.html (Element): contents of the.
   *
   *  To the `options.html` element `dialog` CSS class name will be added and
   *  the element will be wrapped into a `div` with `dialog_wrapper` (or `draggable_dialog_wrapper`) CSS class name.
   *
   *  If `options.title` is provided, the title element will be injected at the top of
   *  `options.html` and will be given `dialog_title` CSS class name.
   *
   *  #### Notes
   *  * All dialogs are hidden by default, use [[Dialog.show]] to show them immediately
   *    after they are created.
   *  * When the close button is clicked, before `hide` event is fired, a `dismiss`
   *    event will be fired. To cancel hiding of the dialog just throw an error from
   *    an listener.
   *  * If the dialog will be draggable, you're expected to privide a `options.title`,
   *    as that will be the handle.
   *
   *  #### Example
   *      var hai = new da.ui.Dialog({
   *        title: "Bonjur tout le monde!"
   *        html: new Element("div", {
   *          html: "Hai World!"
   *        }),
   *        show: true,
   *
   *        onHide: function () {
   *          hai.destroy();
   *          delete hai;
   *        }
   *      });
   *
   **/
  initialize: function (options) {
    this.setOptions(options);
    if(!this.options.html)
     throw "options.html must be provided when creating an Dialog";
    
    this._el = new Element("div", {
      "class": this.options.draggable ? "draggable_dialog_wrapper" : "dialog_wrapper"
    });
    if(!this.options.show)
      this._el.style.display = "none";
    
    if(this.options.title) {
      var title;
      
      if(typeof this.options.title === "string")
        title = new Element("h2", {
          html: this.options.title,
          href: "#",
          "class": "dialog_title no_selection"
        });
      else if($type(this.options.title) === "element")
        title = this.options.title;
      
      title.inject(this.options.html, "top");
      delete title;
    }
    
    if(this.options.closeButton)
      (new Element("a", {
        "class": "dialog_close no_selection",
        html: "Close",
        title: "Close",
        events: {
          click: function () {
            this.fireEvent("dismiss");
            this.hide();
          }.bind(this)
        }
      })).inject(this.options.html, "top");
    
    if(this.options.hideOnOutsideClick)
      this._el.addEvent("click", this.hide.bind(this));
    
    this._el.grab(options.html.addClass("dialog"));
    document.body.grab(this._el);
    
    if(this.options.draggable)
      this._el.makeDraggable({
        handle: this.options.html.getElement(".dialog_title")
      });
  },

  /**
   *  da.ui.Dialog#show() -> this
   *  fires show
   **/
  show: function () {
    if(this._el.style.display !== "none")
      return this;
    
    this._el.show();
    this.fireEvent("show", [this]);
    return this;
  },

  /**
   *  da.ui.Dialog#hide([event]) -> this
   *  fires hide
   **/
  hide: function (event) {
    if((event && event.target !== this._el)
      || this._el.style.display === "none")
      return this;
    
    this._el.hide();
    this.fireEvent("hide", [this]);
    
    if(this.options.destroyOnHide)
      this.destroy();
    
    return this;
  },

  /**
   *  da.ui.Dialog#toElement() -> Element
   **/
  toElement: function () {
    return this._el;
  },

  /**
   *  da.ui.Dialog#destroy() -> this
   **/
  destroy: function () {
    this._el.destroy();
    delete this._el;
    delete this.options;
    
    return this;
  }
});
