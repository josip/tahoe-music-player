//#require "controllers/Player.js"
//#require "libs/ui/NavigationColumn.js"
//#require "services/albumCover.js"

(function () {
var Navigation        = da.controller.Navigation,
    Player            = da.controller.Player,
    NavigationColumn  = da.ui.NavigationColumn,
    Album             = da.db.DocumentTemplate.Album,
    Song              = da.db.DocumentTemplate.Song,
    Playlist          = da.db.DocumentTemplate.Playlist,
    fetchAlbumCover   = da.service.albumCover;

/** section: Controller
 *  class da.controller.Navigation.columns.Root < da.ui.NavigationColumn
 *  filters: All filters provided by other columns.
 *
 *  The root column which provides root menu.
 *  To access the root menu use:
 *
 *        da.controller.Navigation.columns.Root.menu
 **/
Navigation.registerColumn("Root", [], new Class({
  Extends: NavigationColumn,

  title: "Root",
  view: null,

  initialize: function (options) {
    this._data = Navigation.columns.Root.filters;
    this.parent($extend(options, {
      totalCount: 0 // this._data.length
    }));
    this.render();
    this.options.parentElement.style.display = "none";
  },

  getItem: function (index) {
    return {id: index, key: index, value: {title: this._data[index]}};
  }
}));

/**
 *  class da.controller.Navigation.columns.Artists < da.ui.NavigationColumn
 *  filters: [[da.controller.Navigation.columns.Albums]], [[da.controller.Navigation.columns.Songs]]
 *
 *  Displays artists.
 **/
var THE_REGEX = /^the\s*/i;
Navigation.registerColumn("Artists", ["Albums", "Songs"], new Class({
  Extends: NavigationColumn,

  view: {
    id: "artists_column",
    map: function (doc, emit) {
      // If there are no documents in the DB this function
      // will be called with "undefined" as first argument
      if(!doc || doc.type !== "Artist") return;

      emit(doc.id, {
        title: doc.title
      });
    }
  },

  createFilter: function (item) {
    return {artist_id: item.id};
  },

  compareFunction: function (a, b) {
    a = a && a.value.title ? a.value.title.split(THE_REGEX).slice(-1) : a;
    b = b && b.value.title ? b.value.title.split(THE_REGEX).slice(-1) : b;

    if(a < b) return -1;
    if(a > b) return 1;
    return 0;
  }
}));

/**
 *  class da.controller.Navigation.columns.Albums < da.ui.NavigationColumn
 *  filters: [[da.controller.Navigation.columns.Songs]]
 *
 *  Displays albums.
 **/
Navigation.registerColumn("Albums", ["Songs"], new Class({
  Extends: NavigationColumn,

  options: {
    rowHeight: 50
  },

  view: {
    id: "albums_column",

    map: function (doc, emit) {
      if(!doc || doc.type !== "Album" || !this._passesFilter(doc)) return;

      emit(doc.id, {
        title: doc.title,
        icon: doc.album_cover_urls ? doc.album_cover_urls[1] : null
      });
    }
  },

  renderItem: function (index) {
    var item = this.getItem(index);
    if(!item.value.icon) {
      item.value.icon = "resources/images/album_cover_1.png";
      fetchAlbumCover(Album.findById(item.id), function (urls) {
        item.value.icon = urls[1];
      });
    }


    return this.parent(index);
  },

  createFilter: function (item) {
    return {album_id: item.id};
  }
}));

/**
 *  class da.controller.Navigation.columns.Genres < da.ui.NavigationColumn
 *  filters: [[da.controller.Navigation.columns.Songs]]
 *
 *  Displays song genres.
 **/
var GENRES = da.util.GENRES;
Navigation.registerColumn("Genres", ["Songs"], new Class({
  Extends: NavigationColumn,

  view: {
    id: "genres_column",
    map: function (doc, emit) {
      // If there are no documents in the DB this function
      // will be called with "undefined" as first argument
      if(!doc || doc.type !== "Song") return;

      emit(doc.genre || -1, 1);
    },
    reduce: function (key, values, rereduce) {
      //console.log("reduce", key, values);

      if(key !== null) {
        var key_n = isNaN(+key) ? key : + key;

        return {
          title:    typeof key_n === "number" ? GENRES[key_n] || "Unknown" : key_n,
          subtitle: values.length,
          genre:    key_n
        }
      } else {
        var n = values.length, count = 0;
        while(n--)
          count += values[n].subtitle;

        return {
          title:    values[0].title,
          subtitle: count,
          genre:    values[0].genre
        }
      }
    }
  },

  mapReduceFinished: function (view) {
    this._addIdsToReducedView(view);
    this.parent(view);
  },

  mapReduceUpdated: function (view) {
    this._addIdsToReducedView(view);
    this.parent(view);
  },

  _addIdsToReducedView: function (view) {
    var n = view.rows.length;
    while(n--)
      view.rows[n].id = view.rows[n].value.genre;
    return view;
  },

  createFilter: function (item) {
    return {genre: item.value.genre};
  },

  compareFunction: function (a, b) {
    a = a && a.value.title ? a.value.title.split(THE_REGEX).slice(-1) : a;
    b = b && b.value.title ? b.value.title.split(THE_REGEX).slice(-1) : b;

    if(a < b) return -1;
    if(a > b) return 1;
    return 0;
  }
}));


/**
 *  class da.controller.Navigation.columns.Playlists < da.ui.NavigationColumn
 *  filters: [[da.controller.Navigation.columns.Songs]]
 *
 *  Displays songs.
 **/
Navigation.registerColumn("Playlists", ["_PlaylistSongs"], new Class({
  Extends: NavigationColumn,

  view: {
    id: "playlists_column",
    map: function (doc, emit) {
      if(!doc || doc.type !== "Playlist" || !this._passesFilter(doc)) return;

      emit(doc.id, {
        title:    doc.title,
        song_ids: doc.song_ids
      });
    }
  },

  initialize: function (options) {
    this.parent(options);

    this._el.addEvent("click:relay(.action)", function (event, el) {
      var item = this.getItem(el.parentNode.retrieve("column_index"));
      da.controller.Playlist.edit(Playlist.findById(item.id));
    }.bind(this));
  },

  mapReduceUpdated: function (view) {
    this.parent(view);
    if(this._active_el)
      this._el.fireEvent("click:relay(.column_item)", [null, this._active_el], 1);
  },

  createFilter: function (item) {
    var   id = item.id,
          songs = item.value.song_ids;

    return function (song) {
      return song.type === "Song" ? songs.contains(song.id) : song.id === id;
    }
  },

  renderItem: function (index) {
    var item = this.getItem(index),
         data = item.value;

    return (new Element("a", {
      id:       this.options.id + "_column_item_" + item.id,
      href:     "#",
      "class":  index % 2 ? "even" : "odd"
    })).adopt([
      new Element("a", {
        href:     "#",
        html:     "Edit",
        title:    "Edit the playlist",
        "class":  "action"
      }),
      new Element("span", {
        html:     data.title,
        title:    data.title,
        "class":  "title"
      })
    ]);
  }
}));


/**
 *  class da.controller.Navigation.columns.Songs < da.ui.NavigationColumn
 *  filters: none
 *
 *  Displays songs.
 **/
Navigation.registerColumn("Songs", [], new Class({
  Extends: NavigationColumn,

  initialize: function (options) {
    this.parent(options);

    this.addEvent("click", function (item, event, el) {
      el.removeClass("active_column_item");
    }, true);

    this.addEvent("click", function (item, event, el) {
      Player.play(Song.findById(item.id));
      Player.setPlaylist(this._playlist);
    }.bind(this));

    this._onSongChange = this._updateSelectedItem.bind(this);
    da.controller.Player.addEvent("play", this._onSongChange);
  },

  view: {
    id: "songs_column",
    map: function (doc, emit) {
      if(!doc || doc.type !== "Song" || !this._passesFilter(doc))
        return;

      if(doc.title && doc.title.length)
        emit(doc.title, {
          title: doc.title,
          track: doc.track
        });
    }
  },

  mapReduceFinished: function (values) {
    this.parent(values);
    this.createPlaylist();
    this._updateSelectedItem(da.controller.Player.nowPlaying());
  },

  mapReduceUpdated: function (values, rerender) {
    this.parent(values, rerender);
    this.createPlaylist();
  },

  createPlaylist: function () {
    var n = this.options.totalCount,
        playlist = new Array(n);

    while(n--)
      playlist[n] = this._rows[n].id;

    this._playlist = playlist;
    playlist = null;
  },

  compareFunction: function (a, b) {
    a = a && a.value ? a.value.track : a;
    b = b && b.value ? b.value.track : b;

    if(a < b) return -1;
    if(a > b) return 1;
              return 0;
  },

  _updateSelectedItem: function (song) {
    if(!song)
      return false;

    var new_active_el = $(this.options.id + "_column_item_" + song.id);
    if(!new_active_el)
      return false;

    if(this._active_el)
      this._active_el.removeClass("active_column_item");

    this._active_el = new_active_el;
    this._active_el.addClass("active_column_item");
    new_active_el = null;
  },

  destroy: function () {
    da.controller.Player.removeEvent("play", this._onSongChange);
    this.parent()
  }
}));


/**
 *  class da.controller.Navigation.columns.PlaylistSongs < da.controller.Navigation.columns.Songs
 *  filters: none
 *
 *  Displays songs from a playlist - adds drag&drop functionality.
 **/
Navigation.registerColumn("_PlaylistSongs", "Songs", [], new Class({
  Extends: Navigation.columns.Songs,

  view: {
    id: "playlist_songs_column",
    map: function (doc, emit) {
      var type = doc.type;
      if(!doc || (type !== "Song" && type !== "Playlist") || !this._passesFilter(doc))
        return;

      if(type === "Song")
        if(doc._deleted)
          emit("_deleted", doc.id);
        else
          emit(doc.title, {
            title:  doc.title
          });
      else
        emit("_playlist", {
          id:       doc.id,
          title:    doc.title + " (playlist)",
          song_ids: doc.song_ids
        });
    }
  },

  mapReduceFinished: function (view) {
    var playlist_pos = view.findRow("_playlist");
    this.addPositions(view.rows[playlist_pos], view.rows);
    return this.parent(view);
  },

  mapReduceUpdated: function (view) {
    var full_view = da.db.DEFAULT.views[this.view.id].view,
        new_rows = $A(full_view.rows);

    // this is why we can't use this.parent(view, true),
    // we need to add positions to the all elements, before
    // the sorting occurs (remember that `view` contains only the playlist)
    this.addPositions(new_rows[full_view.findRow("_playlist")], new_rows);
    new_rows.sort(this.compareFunction);

    this.options.totalCount = new_rows.length;
    this._rows = new_rows;

    var active = this.getActiveItem();
    this.rerender();

    if(active) {
      console.log("has_active_item");
      this._active_el = $(this.options.id + "_column_item_" + active.id);
      this._active_el.addClass("active_column_item");
    }

    full_view = null;
    new_rows = null;
    active = null;
  },

  compareFunction: function (a, b) {
    a = a && a.value ? a.value.playlist_pos : 0;
    b = b && b.value ? b.value.playlist_pos : 0;

    if(a < b) return -1;
    if(a > b) return 1;
              return 0;
  },

  addPositions: function (playlist, rows) {
    if(playlist) {
      rows.erase(playlist);
      this._playlist = playlist.value.song_ids;
    }
    var n = rows.length,
        playlist = this._playlist;

    while(n--)
      rows[n].value.playlist_pos = playlist.indexOf(rows[n].id);
  },

  createPlaylist: function () {}

  /*
  mapReduceUpdated: function (view) {
    this._rows = $A(da.db.DEFAULT.views[this.view.id].view.rows);
    this._rows.sort(this.compareFunction);
    this.options.totalCount = this._rows.length;
    this.rerender();

    var active = this.getActiveItem();
    if(active) {
      this._active_el = $(this.options.id + "_column_item_" + active.id);
      this._active_el.addClass("active_column_item");
    }
  }
  */
}));


})();