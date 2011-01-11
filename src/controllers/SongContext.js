//#require "controllers/Player.js"

(function () {
var Song = da.db.DocumentTemplate.Song,
    Player = da.controller.Player;

var CONTEXTS = {},
    TAB_SUFFIX = "_context_tab",
    _TS_L = -TAB_SUFFIX.length,
    TAB_CONTAINER_SUFFIX = "_context_tab_container";

/** section: Controllers
 * SongContext 
 **/
var SongContext = {
  /**
   *  SongContext.active -> Object
   **/
  active: null,
  
  initialize: function () {
    this.el = new Element("div", {
      id: "song_context"
    });
    this.tabs = new Element("div", {
      id: "context_tabs",
      "class": "button_group no_selection"
    });
    
    for(var id in CONTEXTS)
      this.tabs.grab(new Element("button", {
        id:   id + TAB_SUFFIX,
        html: CONTEXTS[id].title
      }));
    this.tabs.addEvent("click:relay(button)", function () {
      SongContext.show(this.id.slice(0, _TS_L));
    });
    
    this.loading_screen = new Element("div", {
      id:       "song_context_loading",
      html:     "Loading...",
      "class":  "no_selection",
      style:    "display: none"
    });
    
    $("player_pane").adopt(this.tabs, this.loading_screen, this.el);
    
    function adjustDimensions () {
      SongContext.el.style.height = (
        window.getHeight() - $("song_info_block").getHeight() - SongContext.tabs.getHeight()
      ) + "px";
    }
    
    Player.addEvent("play", function (song) {
      adjustDimensions();
      
      if(SongContext.active)
        SongContext.active.update(song);
    });
     
    window.addEvent("resize", adjustDimensions);
    window.fireEvent("resize");
    
    this.initialized = true;
  },
  
  /**
   *  SongContext#show(id) -> undefined
   *  - id (String): id of the context.
   **/
  show: function (id) {   
    this.hide();
    
    var context = CONTEXTS[id];
    if(!context.__initialized) {
      var container = new Element("div", {id: id + TAB_CONTAINER_SUFFIX});
      context.initialize(container);
      container.hide();
      this.el.grab(container);
      
      delete container;
      context.__initialized = true;
    }
    
    $(id + TAB_SUFFIX).addClass("active");
    this.active = context;
    
    da.controller.SongContext.showLoadingScreen();
    $(id + TAB_CONTAINER_SUFFIX).show();
    context.show();
    context.update(Player.nowPlaying());
  },
  
  /**
   *  SongContext#hide() -> undefined
   *
   *  Hides active tab.
   *
   **/
  hide: function () {
    if(!this.active)
      return;
    
    this.active.hide();
    $(this.active.id + TAB_CONTAINER_SUFFIX).hide();
    $(this.active.id + TAB_SUFFIX).removeClass("active");
  },
  
  /**
   *  SongContext#addTab(id) -> undefined
   *  - id (String): id of the context.
   *
   **/
  addTab: function (id) {
    this.tabs.grab(new Element("button", {
      id:   id + TAB_SUFFIX,
      html: CONTEXTS[id].title
    }));
  }
};

da.app.addEvent("ready", function () {
  SongContext.initialize();
});

/**
 * da.controller.SongContext
 **/
da.controller.SongContext = {
  /**
   *  da.controller.SongContext.register(context) -> undefined
   *  - context.id (String): id of the context. Note that the "root" element of
   *    the context also has to have the same id.
   *  - context.title (String): human-frendly name of the context.
   *  - context.initialize (Function): function called only once, with the container
   *    element as the first argument. All DOM nodes should be added to that element.
   *  - context.show (Function): called every time context's tab is activated.
   *  - context.hide (Function): called when context's tab gets hidden.
   *  - context.update (Function): called when another song starts playing.
   *    The first argument of the function is the new song ([[da.db.DocumentTemplate.Song]]).
   *
   *  #### Example
   *      da.controller.SongContext.register({
   *        id: "artist-info",
   *        initialize: function (container) {
   *          this.el = new Element("div", {id: "artist-info", html: "Hai world!"});
   *          this._shown = false;
   *          // Try to limit youself by putting all needed nodes into
   *          // container element.
   *          container.grab(this.el);
   *
   *        },
   *        show: function () {
   *          // Called everytime this tab is activated.
   *          if(!this._shown) {
   *            this.el.position({relativeTo: this.el.parent()});
   *            this._shown = true;
   *          }
   *        },
   *        hide: function () {
   *          // Called when tab is hidden, use this to stop updating document
   *          // nodes, etc.
   *        },
   *        update: function (song) {
   *          // Called when new song starts playing.
   *        }
   *      }));
   *
   *  #### Notes
   *  When the context is activated for the first time, functions all called in
   *  following order:
   *  * `initialize(container)`
   *  * `show`
   *  * `update(song)`
   *
   *  `show` and `hide` methods should not implement hiding of the "root" element,
   *  rather, adding/removing obsolete events and/or start/stop updating nodes.
   * 
   **/
  register: function (context) {
    if(CONTEXTS[context.id])
      return;
    
    CONTEXTS[context.id] = context;
    
    if(SongContext.initialized)
      SongContext.addTab(context.id);
  },
  
  /**
   *  da.controller.SongContext.show(id) -> undefined
   *  - id (String): id of the tab/context.
   **/
  show: function (id) {
    var active = SongContext.active;
    if((active && active.id === id) || !CONTEXTS[id])
        return;
    
    delete active;
    SongContext.show(id);
  },
  
  /**
   *  da.controller.SongContext.showLoadingScreen() -> undefined
   **/
  showLoadingScreen: function () {
    var screen = SongContext.loading_screen,
        el = SongContext.el;
    screen.style.width = el.getWidth() + "px";
    screen.style.height = el.getHeight() + "px";
    screen.show();
    
    delete screen;
    delete el;
  },
  
  /**
   *  da.controller.SongContext.hideLoadingScreen() -> undefined
   **/
  hideLoadingScreen: function () {
    SongContext.loading_screen.hide();
  }
};

da.app.fireEvent("ready.controller.SongContext", [], 1);

})();

//#require "controllers/default_contexts.js"
