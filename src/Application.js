//#require "libs/vendor/mootools-1.2.4-core-ui.js"
//#require "libs/vendor/mootools-1.2.4.4-more.js"
//#require "libs/util/console.js"

/**
 * da
 *
 * The root namespace. Shorthand for '[Daaw](http://en.wikipedia.org/wiki/Lake_Tahoe#Native_people)'.
 *
 **/
if(typeof da === "undefined")
  this.da = {};

//#require "libs/db/PersistStorage.js"
//#require "libs/db/DocumentTemplate.js"
//#require "libs/util/Goal.js"
//#require "libs/ui/Menu.js"
//#require "libs/ui/Dialog.js"

(function () {
var BrowserCouch    = da.db.BrowserCouch,
    PersistStorage  = da.db.PersistStorage,
    Goal            = da.util.Goal,
    Menu            = da.ui.Menu,
    Dialog          = da.ui.Dialog;

/** section: Controllers
 * App
 *
 * Private interface of the [[da.app]].
 **/
var App = {
  initialize: function () {
    this.startup = new Goal({
      checkpoints: ["domready", "settings_db", "caps", "data_db"],
      onFinish: this.ready.bind(this)
    });
    
    BrowserCouch.get("settings", function (db) {
      da.db.SETTINGS = db;
      if(!db.getLength())
        App.loadInitialSettings();
      else {
        App.startup.checkpoint("settings_db");
        App.getCaps();
      }
    }, new PersistStorage("tahoemp_settings"));
    
    BrowserCouch.get("data", function (db) {
      da.db.DEFAULT = db;
      App.startup.checkpoint("data_db");
    }, new PersistStorage("tahoemp_data"));
    
    da.app.addEvent("ready.controller.CollectionScanner", function () {
      if(!da.db.DEFAULT.getLength())
        da.controller.CollectionScanner.scan();
    });
  },
  
  loadInitialSettings: function () {
    var req = new Request.JSON({
      url: "config.json",
      noCache: true,
      
      onSuccess: function (data) {
        da.db.SETTINGS.put([
          {id: "music_cap",     type: "Setting", group_id: "caps", value: data.music_cap},
          {id: "settings_cap",  type: "Setting", group_id: "caps", value: data.settings_cap}
        ], function () {
          App.startup.checkpoint("settings_db");
          
          da.app.caps.music = data.music_cap;
          da.app.caps.settings = data.settings_cap;
          
          App.startup.checkpoint("caps");
          
          if(!da.db.DEFAULT.getLength())
            App.callController("CollectionScanner", "scan");
        });
      },
      
      onFailure: function () {
        delete req;
        alert("You're missing a config.json file! See docs on how to set it up.");
        
        App.callController("Settings", "showGroup", ["caps"]);
      }
    });
    
    req.get();
  },
  
  getCaps: function () {
    // We can't use DocumentTemplate.Setting here as the class
    // is usually instantiated after the call to this function.
    da.db.SETTINGS.view({
      id: "caps",
      
      map: function (doc, emit) {
        if(doc && doc.type === "Setting" && doc.group_id === "caps")
          emit(doc.id, doc.value);
      },
      
      finished: function (result) {
        if(!result.rows.length)
          return App.loadInitialSettings();
        
        da.app.caps = {
          music:    result.getRow("music_cap"),
          settings: result.getRow("settings_cap")
        };
        
        if(!da.app.caps.settings.length || !da.app.caps.music.length)
          App.loadInitialSettings();
        else
          App.startup.checkpoint("caps");
      },
      
      updated: function (result) {
        var music    = result.getRow("music_cap"),
            settings = result.getRow("settings_cap");
        
        if(music)
          da.controller.CollectionScanner.scan(da.app.caps.music = music);
        
        if(settings)
          da.app.caps.settings = settings;
        
        App.startup.checkpoint("caps");
      }
    });
  },
  
  callController: function(controller, method, args) {
    function callControllerMethod() {
      var c = da.controller[controller];
      c[method].apply(c, args);
      c = null;
    }
    
    if(da.controller[controller])
      callControllerMethod();
    else
      da.app.addEvent("ready.controller." + controller, callControllerMethod);
  },
  
  /**
   *  da.app.ready() -> undefined
   *  fires ready
   *  
   *  Called when all necessary components are initialized.
   **/
  ready: function () {
    $("loader").destroy();
    $("panes").style.display = "block";
    
    this.setupMainMenu();
    
    da.app.fireEvent("ready");
    
    var about_iframe = new Element("iframe", {
      src: "about:blank",
      width: 400,
      height: 500
    });
    about_iframe.style.background = "#fff";
    this.about_dialog = new Dialog({
      html: about_iframe,
      onShow: function () {
        about_iframe.src = "about.html";
      },
      onHide: function () {
        about_iframe.src = "about:blank";
      }
    });
  },
  
  setupMainMenu: function () {
    var main_menu_button = new Element("a", {
      id:   "main_menu",
      // triangle
      html: "&#x25BC;",
      href: "#",
      events: {
        mousedown: function (event) {
          da.app.mainMenu.show(event);
        },
        click: function (event) {
          Event.stop(event);
        }
      }
    });
    
    da.app.mainMenu = new Menu({
      items: {
        toggleShuffle: {html: "Turn shuffle on", id: "player_toggle_shuffle_menu_item", href: "#"},
        mute:     {html: "Mute", id: "player_mute_menu_item", href: "#"},
        _sep0:    Menu.separator,
        
        addToPl:  {html: "Add to playlist&hellip;", href: "#"},
        share:    {html: "Share&hellip;",           href: "#"},
        
        _sep1:    Menu.separator,
        
        search:   {html: "Search&hellip;",    href: "#"},
        upload:   {html: "Import&hellip;",    href: "#"},
        rescan:   {html: "Rescan collection", href: "#"},
        settings: {html: "Settings&hellip;",  href: "#"},
        
        _sep2:    Menu.separator,
        
        help:     {html: "Help",  href: "#"},
        about:    {html: "About", href:"#"}
      },
      
      position: {
        position: "bottomRight",
        edge:     "topRight",
        offset:   { y: -3 }
      },
      
      onShow: function () {
        main_menu_button.addClass("active_menu");
      },
      onHide: function () {
        main_menu_button.removeClass("active_menu");
      },
      onClick: function (item) {
        var fn = da.app.mainMenuActions[item];
        if(fn)
          fn();
        fn = null;
      }
    });
    document.body.grab(main_menu_button);
  }
};

/**
 *  class da.app
 *
 *  The main controller.
 **/
da.app = {
  /**
   *  da.app.caps -> Object
   *  Object with `music` and `settings` properties, ie. the contents of `config.json` file.
   **/
  caps: {},
  
  /**
   *  da.app.mainMenu -> da.ui.Menu
   **/
  mainMenu: null,
  
  /**
   *  da.app.mainMenuActions -> Object
   *  Object's keys match [[da.app.mainMenu]] item keys.
   **/
  mainMenuActions: {
    toggleShuffle:  function () { da.controller.Player._toggleShuffle() },
    mute:           function () { da.controller.Player.toggleMute()     },
    addToPl:        function () { da.controller.Playlist.addSong()      },
    search:         function () { da.controller.Search.show()           },
    rescan:         function () { da.controller.CollectionScanner.scan(da.app.caps.music) },
    settings:       function () { da.controller.Settings.show()         },
    about:          function () { App.about_dialog.show()               }
  }
};
$extend(da.app, new Events());

App.initialize();

window.addEvent("domready", function () {
  App.startup.checkpoint("domready");
});

})();

//#require <doctemplates/doctemplates.js>
//#require <controllers/controllers.js>
