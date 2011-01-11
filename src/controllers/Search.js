//#require "libs/ui/Dialog.js"
//#require "controllers/default_columns.js"

(function () {
var Dialog      = da.ui.Dialog,
    SongsColumn = da.controller.Navigation.columns.Songs,
    Playlist    = da.db.DocumentTemplate.Search,
    ACTIVE      = null;

/** section: Controllers
 *  class SearchResults < da.controller.Navigation.columns.Songs
 **/
var SearchResults = new Class({
  Extends: SongsColumn,
  
  options: {
    id:         "search_results",
    rowHeight:  50
  },
  
  view: {
    id:        null,
    temporary: true,
    
    map: function (doc, emit) {
      var type = doc.type,
          filters = this.options.filters,
          query = this.options.query;
      
      // we have to emit every document because the filters
      // represent OR operation, ie. if user selected ["Title", "Album"]
      // it means that only one of those filters have to be satisfied
      // in order fot the song to show up in the search results.
      
      emit(type, type === "Song" ? {
        id:         doc.id,
        title:      doc.title,
        artist_id:  doc.artist_id,
        album_id:   doc.album_id,
        track:      doc.track,
        match:      query.test(doc.title)
      } : {
        id:     doc.id,
        title:  doc.title,
        match:  query.test(doc.title)
      });
    },
    
    reduce: function (key, values, rereduce) {
      var query = this.options.query;
      
      if(key !== "Song") {
        var _values = {},
            n = values.length,
            val;
        
        while(n--) {
          val = values[n];
          _values[val.id] = val;
        }
        
        return _values;
      } else {
        var n = values.length,
            val;
        
        while(n--) {
          val = values[n];
          values[n] = {
            id:   val.id,
            key:  val.title,
            value: val
          };
        }
          
        return values;
      }
    }
  },
  
  mapReduceFinished: function (view) {
    var songs = view.getRow("Song");
    if(!songs)
      return this.parent({rows: []});
    
    var n = songs.length,
        filters = this.options.filters,
        query  = this.options.query,
        matches;
    
    this._albums = view.getRow("Album");
    this._artists = view.getRow("Artist");
    
    
    while(n--) {
      song = songs[n].value;
      matches = [];
      if(filters.contains("Song"))
        matches.push(song.match);
      if(filters.contains("Album"))
        matches.push(this._albums[song.album_id].match);
      if(filters.contains("Artist"))
        matches.push(this._artists[song.artist_id].match);
      
      var m = matches.length, false_count = 0;
      while(m--)
        if(!matches[m])
          false_count++;
            
      if(false_count === matches.length)
        delete songs[n];
    }
 
    songs = songs.clean();
    this.parent({
      rows: songs
    });
    
    this._finished = true;
    Search.search_field.disabled = false;
    
    this.fireEvent("complete", [songs, this], 1);
  },

  renderItem: function (index) {
    var item    = this.getItem(index),
        data    = item.value,
        query   = this.options.query,
        artist  = this._artists[data.artist_id].title,
        album   = this._albums[data.album_id].title;
    
    return (new Element("a", {
      id:       "search_results_column_item_" + item.id,
      href:     "#",
      title:    "{0} by {1}".interpolate([data.title, artist]),
      "class":  index % 2 ? "even" : "odd"
    }).adopt([
      new Element("span", {html: index + 1,   "class": "result_number"}),
      new Element("span", {
        html: data.title.replace(query, underline),
        "class": "title"
      }),
      new Element("span", {
        html: "{0}from <i>{1}</i> by <i>{2}</i>".interpolate([
          data.track ? "track no." + data.track + " " : "",
          album.replace(query, underline), artist.replace(query, underline)
        ]),
        "class": "subtitle"
      })
    ]));
  },
  
  compareFunction: function (a, b) {
    a = a.key + a.id;
    b = b.key + b.id;
    
    if(a < b) return -1;
    if(a > b) return 1;
    return 0;
  }
});

function underline (str) {
  return "<u>" + str + "</u>";
}


/** section: Controllers
 * class Search
 **/
var Search = ({
  /**
   *  Search.query -> String
   *  Current search query
   **/
  query: "",
  
  /**
   *  Search.active_filters -> [String, ]
   *  List of active filters, possible values are:
   *  * `Song`,
   *  * `Album` or
   *  * `Artist`
   *
   **/
  active_filters: ["Song"],
  
  /**
   *  Search.results_column -> SearchResults
   **/
  results_column: null,
  
  initialize: function () {
    this._el = new Element("div", {id: "search_dialog"});
    this.search_field = new Element("input", {
      type:         "text",
      id:           "search_field",
      placeholder:  "Search..."
    });
    var header = (new Element("form", {
      id:       "search_header",
      action:   "#",
      "class":  "dialog_title"
    })).adopt([
      this.search_field,
      (new Element("div", {
        id: "search_by_filters",
        "class": "button_group"
      })).adopt([
        new Element("button", {id: "search_filter_Song",       html: "Song title", "class": "active"}),
        new Element("button", {id: "search_filter_Album",      html: "Album"}),
        new Element("button", {id: "search_filter_Artist",     html: "Artist"})
      ])
    ]);

    function searchFromField (event) {
      if(event)
        Event.stop(event);
      
      Search.search(Search.search_field.value, Search.active_filters);
    }

    header.addEvent("submit", searchFromField);
    
    var _search_buffer;
    this.search_field.addEvent("keyup", function (event) {
      clearTimeout(_search_buffer);
      _search_buffer = setTimeout(searchFromField, 360);
    });
    this.search_field.addEvent("mousedown", function (event) {
      // since the title is draggable, the text field would never
      // get focus.
      event.stopPropagation();
    });
    
    this._el.grab(header);
    var _sf_l = "search_filter_".length;
    header.addEvent("click:relay(button)", function (event, button) {
      var filter = button.id.slice(_sf_l);
      if(Search.active_filters.contains(filter))
        Search.deactivateFilter(filter);
      else
        Search.activateFilter(filter);
      
      Search.query = null;
      Search.search_field.focus();
      Search.search(Search.search_field.value);
    });
    
    this.dialog = new Dialog({
      title:              header,
      html:               (new Element("div", {id: "search_dialog_wrapper"})).grab(this._el),
      closeButton:        true,
      draggable:          true,
      hideOnOutsideClick: false,
      
      onShow: function () {
        Search.search_field.focus();
      },
      
      onHide: function () {
        if(this.results_column)
          this.results_column.destroy();
        
        delete this.results_column;
      }
    });
    
    this.initialized = true;
    delete header;
  },
  
  /**
   *  Search.show() -> undefined
   **/
  show: function () {
    this.dialog.show();
  },
  
  /**
   *  Search.search(query[, filters, options]) -> undefined | false
   *  - query (String | RegExp): search query.
   *  - filter (String): one of the filters. See [[Search.active_filter]] for 
   *    possible values, this also the default value.
   *  - options (Function): passed to the [[SearchResults]] class.
   *
   *  `false` will be returned in cases when search won't be started:
   *  * if the last query was the same as the new one,
   *  * if the last search hasn't finished,
   *  * there are no active filters.
   *  
   *  #### Notes
   *  If the `query` is a [[String]], modifications to it will be applied
   *  in order to get semi-fuzzy search.
   *  
   *  #### See also
   *  * [Autocomplete fuzzy matching](http://www.dustindiaz.com/autocomplete-fuzzy-matching/)
   *
   **/
  search: function (query, filters, options) {
    if(this.query === query || query.length < 3)
      return false;
    if(!filters || !filters.length)
      filters = this.active_filters;
    if(!filters.length)
      return false;
    
    this.query = query;
    if(this.results_column) {
      if(!this.results_column._finished)
        return false;
      
      this.results_column.destroy();
      delete this.results_column;
    }
    
    if(!(query instanceof RegExp))
      if(query[0] === "/" && query.slice(-1) === "/")
        query = new RegExp(query.slice(1,-1), "ig")
      else if(query.contains(" "))
        query = new RegExp("(" + query.escapeRegExp() + ")", "ig");
      else
        query = new RegExp(query.replace(/\W/g, "").split("").join("\\w*"), "ig");
  
    console.log("searching for", query, filters);
    this.search_field.disabled = true;
    
    // This is a small hack which allows playlist editor 
    // add drag&drop controls, as the options persist between
    // calls.
    if(options)
      this.column_options = options;
    else
      options = this.column_options;
    
    if(!options.parentElement)
      options.parentElement = this._el;
    this.results_column = new SearchResults($extend(options, {
      query:          query,
      filters:        filters
    }));
  },
  
  /**
   *  Search.saveAsPlaylist() -> undefined
   *  Saves search results as a new playlist and opens [[PlaylistEditor#edit]] dialog.
   **/
  saveAsPlaylist: function () {
    if(!this.results_column || !this.results_column.finished)
      return;
    
    var songs   = this.results_column._rows,
        n       = songs.length,
        song_ids = new Array(n);
    
    while(n--)
      song_ids[n] = songs[n].id;
    
    Playlist.create({
      title: "Search results",
      song_ids: song_ids
    }, function (playlist) {
      da.controller.Playlist.edit(playlist);
    });
  },
  
  /**
   *  Search.activateFilter(filter) -> false | undefined
   *  - filter (String): filter to activate. See [[Search.active_filter]] for
   *    possible values.
   **/
  activateFilter: function (filter) {
    if(this.active_filters.contains(filter))
      return false;
    
    $("search_filter_" + filter).addClass("active");
    this.active_filters.push(filter);
  },
  
  /**
   *  Search.deactivateFilter(filter) -> false | undefined
   *  - filter (String): filter to deactivate.
   **/
  deactivateFilter: function (filter) {
    if(!this.active_filters.contains(filter))
      return false;
   
   $("search_filter_" + filter).removeClass("active");
   this.active_filters.erase(filter);
  },
  
  /**
   *  Search.destroy() -> undefined
   **/
  destroy: function () {
    this.dialog.destroy();
    delete this.dialog;
    
    if(this.results_column)
      this.results_column.destroy();
    delete this.results_column;
    delete this._el;
    delete this.search_field;
  }
});

/**
 * da.controller.Search
 **/
da.controller.Search = {
  /**
   *  da.controller.Search.show() -> undefined
   *  
   *  Shows search overlay.
   *
   **/
  show: function () {
    if(!Search.initialized)
      Search.initialize();
    
    Search.column_options = {};
    Search.show();
  },
  /**
   *  da.controller.Search.search(searchTerm[, filters][, options]) -> undefined
   *  - searchTerm (String): the query.
   *  - filters (Array): filters to use, [[Search.active_filters]].
   *  - options (Object): options passed to [[SearchResults]] class.
   *  - options.onComplete (Function): function called with search results as first
   *    argument and instance of the class as the second argument.
   **/
  search: function (term, filters, options) {
    this.show();
    Search.search_field.value = term;
    Search.search(term, filters, options || {});
  }
};

})();
