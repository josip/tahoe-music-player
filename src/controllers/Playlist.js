//#require "libs/ui/Dialog.js"
//#require "libs/ui/Menu.js"
//#require "libs/util/PlaylistExporters.js"
//#require "doctemplates/Playlist.js"
//#require "doctemplates/Song.js"

(function () {
var Playlist        = da.db.DocumentTemplate.Playlist,
    Song            = da.db.DocumentTemplate.Song,
    Dialog          = da.ui.Dialog,
    Menu            = da.ui.Menu,
    playlistExport  = da.util.playlistExporter,
    SONG_PREFIX     = "playlist_song_";

/** section: Controllers
 *  class PlaylistEditor
 **/
var PlaylistEditor = new Class({
  /**
   *  new PlaylistEditor(playlist)
   *  - playlist (da.db.DocumentTemplate.Playlist): playlist wich will be edited.
   **/
  initialize: function (playlist) {
    this.playlist = playlist;

    var playlist_details = (new Element("div", {
        id: "playlist_details"
      })).adopt(
        new Element("label", {html: "Name of the playlist:", "for": "playlist_title"}),
        new Element("input", {type: "text", value: playlist.get("title"), id: "playlist_title"}),

        new Element("label", {html: "Description:", "for": "playlist_description"}),
        (new Element("textarea", {id: "playlist_description", value: playlist.get("description")}))
      ),
      songs = (new Element("ol", {
        id: "playlist_songs",
        "class": "navigation_column"
      })),
      footer = (new Element("div", {
        "class": "footer"
      })).adopt(
        new Element("button", {
          id: "playlist_delete",
          html: "Delete this playlist",
          events: {
            click: this.destroyPlaylist.bind(this)
          }
        }),
        new Element("button", {
          id: "playlist_add_more_songs",
          html: "Add more songs",
          events: {
            click: this.showSearchDialog.bind(this)
          }
        }),
        new Element("button", {
          id: "playlist_export",
          html: "Export &#x25BC;",
          events: {
            mousedown: function (event) {
              this.export_menu.show(event);
            }.bind(this)
          }
        }),
        new Element("input", {
          type: "submit",
          id: "playlist_save",
          value: "Save",
          events: {
            click: this.save.bind(this)
          }
        })
      ),
      song_ids  = $A(playlist.get("song_ids")),
      n         = song_ids.length;

    while(n--)
      song_ids[n] = this.renderItem(Song.findById(song_ids[n]));

    songs.adopt(song_ids);
    songs.addEvent("click:relay(.action)", this.removeSong.bind(this));

    this._sortable = new Sortables(songs, {
      opacity:    0,
      revert:     false,
      clone:      true,
      constrain:  true
    });

    this._el = (new Element("div", {
      id: "playlist_editor_" + playlist.id,
      "class": "playlist_editor"
    })).adopt(playlist_details, songs, footer);

    this.dialog = new Dialog({
      title: "Edit playlist",
      html: (new Element("div", {
        "class": "playlist_editor_wrapper no_selection"
      })).grab(this._el),
      show:               true,
      closeButton:        true,
      hideOnOutsideClick: false,
      destroyOnHide:      true,
      onHide:             this.destroy.bind(this)
    });

    var export_formats = {};
    for(var format in playlistExport)
      export_formats[format] = {html: "." + format, href: "#"};

    this.export_menu = new Menu({
      items: export_formats,
      position: {
        position:   "center",
        edge:       "center",
        relativeTo: "playlist_export"
      },
      onClick: this.exportPlaylist.bind(this)
    });
  },

  /**
   *  PlaylistEditor#removeSong(event, element) -> undefined
   **/
  removeSong: function (event, element) {
    var el = element.parentNode;
    this._sortable.removeItems(el);
    el.set("slide", {duration: 360, mode: "horizontal"});
    el.slide("out").fade("out").get("slide").chain(function () {
      el.destroy();
      delete el;
    }.bind(this));
  },

  /**
   *  PlaylistEditor#destroyPlaylist(event, element) -> undefined
   **/
  destroyPlaylist: function (event, element) {
    if(!confirm("Are you sure?"))
      return;

    this.playlist.destroy();
    this.destroy();
  },

  /**
   *  PlaylistEditor#save() -> undefined
   **/
  save: function () {
    var ids = this._sortable.serialize(),
         _pref_l = SONG_PREFIX.length,
         n = ids.length;

    while(n--)
      if(ids[n])
        ids[n] = ids[n].slice(_pref_l);

    this.playlist.update({
      title:       $("playlist_title").value,
      description: $("playlist_description").value,
      song_ids:    ids.clean()
    });
  },

  exportPlaylist: function (format) {
    var exporter = playlistExport[format];
    if(!exporter)
      return false;

    exporter(this.playlist);
  },

  renderItem: function (song) {
    return new Element("li", {
      id:   SONG_PREFIX + song.id,
      "class": "column_item"
    }).adopt(
      new Element("a", {
        title:    "Remove this song from the playlist",
        href:     "#",
        "class":  "action"
      }),
      new Element("span", {html: song.get("title")})
    );
  },

  showSearchDialog: function () {
    var addSearchResult = this.addSearchResult.bind(this);

    da.controller.Search.search("/.*?/", ["Song"], {
      onComplete: function (results, column) {
        console.log("Hacking search results");

        column.removeEvents("click");
        column.addEvent("click", addSearchResult);

      }.bind(this)
    });
  },

  addSearchResult: function (item) {
    if($("playlist_song_" + item.id))
      return false;

    item = this.renderItem(Song.findById(item.id));
    $("playlist_songs").grab(item);
    this._sortable.addItems(item);
  },

  destroy: function () {
    this.export_menu.destroy();
    this.playlist = null;
    delete this.dialog;
    delete this.export_menu;
    delete this._el;
  }
});

/** section: Controllers
 *  class AddToPlaylistDialog
 **/
var AddToPlaylistDialog = new Class({
  /**
   *  new AddToPlaylistDialog(song)
   *  - song (da.db.DocumentTemplate.Song): song which will be added to selected playlist.
   **/
  /**
   *  AddToPlaylistDialog#song -> da.db.DocumentTemplate.Song
   **/
  initialize: function (song) {
    this.song = song;

    var playlist_selector = new Element("select", {id: "playlist_selector"}),
        playlists = Playlist.view().rows,
        n = playlists.length;

    while(n--)
      playlist_selector.grab(new Element("option", {
        value: playlists[n].id,
        html: playlists[n].value.title
      }));

    playlist_selector.grab(new Element("option", {
      value: "_new_playlist",
      html: "New playlist"
    }));

    playlist_selector.addEvent("change", this.selectionChange.bind(this));

    this._new_playlist_form = (new Element("div", {id: "add_to_new_pl"})).adopt(
      new Element("label",    {html: "Title:", "for": "add_to_new_pl_title"}),
      new Element("input",    {id:   "add_to_new_pl_title", type: "text"}),
      new Element("label",    {html: "Description:", "for": "add_to_new_pl_description"}),
      new Element("textarea", {id:   "add_to_new_pl_description"})
    );

    this._el = (new Element("form", {
      id: "add_to_pl_dialog"
    }).adopt(
      new Element("div",    {id: "add_to_pl_playlists"}).adopt(
        new Element("label",  {html: "Choose an playlist:", "for": "playlist_selector"}),
        playlist_selector,
        this._new_playlist_form
      ),
      (new Element("div", {"class": "footer"})).grab(
        new Element("input", {
          type: "submit",
          value: "Okay",
          events: {
            click: this.save.bind(this)
          }
        })
      )
    ));

    this._el.addEvent("submit", this.save.bind(this));

    var title = (new Element("div", {"class": "dialog_title no_selection"})).adopt(
      new Element("img",  {
        src: "resources/images/album_cover_1.png",
        id: "add_to_pl_album_cover"
      }),
      new Element("span", {html: song.get("title"), "class": "title"})
    );

    this.dialog = new Dialog({
      title: title,
      html: (new Element("div", {"class": "add_to_pl_wrapper"})).grab(this._el),
      closeButton:    true,
      show:           true,
      destroyOnHide:  true
    });

    this.song.get("album", function (album) {
      title.appendText("from ").grab(
        new Element("span", {html: album.get("title")})
      );

      var album_covers = album.get("album_cover_urls");
      if(album_covers && album_covers[1])
        $("add_to_pl_album_cover").src = album_covers[1];
    });

    this.song.get("artist", function (artist) {
      title.appendText(" by ").adopt(
        new Element("span", {html: artist.get("title")}),
        new Element("div", {"class": "clear"})
      );
    });

    this._playlist_selector = playlist_selector;
    playlist_selector = null;
    this.selectionChange();
  },

  /**
   *  AddToPlaylistDialog#save([event]) -> undefined
   **/
  save: function (event) {
    if(event)
      Event.stop(event);

    var playlist_id = this._playlist_selector.value;
    if(playlist_id === "_new_playlist") {
      var title = $("add_to_new_pl_title");
      if(!title.value.length)
        return title.focus();

      Playlist.create({
        title:        title.value,
        description:  $("add_to_new_pl_description").value,
        song_ids:     [this.song.id]
      });
    } else {
      var playlist = Playlist.findById(playlist_id);
      playlist.get("song_ids").include(this.song.id);
      playlist.save();
      playlist = null;
    }

    this.destroy();
  },

  /**
   *  AddToPlaylistDialog#selectionChange() -> undefined
   *  Called on `change` event by playlist selector.
   **/
  selectionChange: function () {
    if(this._playlist_selector.value === "_new_playlist")
      this._new_playlist_form.show();
    else
      this._new_playlist_form.hide();
  },

  /**
   *  AddToPlaylistDialog#destroy() -> undefined
   **/
  destroy: function () {
    this.song = null;
    this.dialog.destroy();
    delete this.dialog;
    delete this._el;
    delete this._playlist_selector;
    delete this._new_playlist_form;
  }
});

/**
 * da.controller.Playlist
 **/
da.controller.Playlist = {
  /**
   *  da.controller.Playlist.edit(playlist) -> undefined
   *  - playlist (da.db.DocumentTemplate.Playlist): playlist which will be edited.
   **/
  edit: function (playlist) {
    new PlaylistEditor(playlist);
  },

  /**
   *  da.controller.Playlist.addSong([song]) -> undefined
   *  - song (da.db.DocumentTemplate.Song): song which will be added to an playlist.
   *    If not provided, [[da.controller.Player.nowPlaying]] will be used.
   **/
  addSong: function (song) {
    if(!song)
      song = da.controller.Player.nowPlaying();
    if(!song)
      return false;

    new AddToPlaylistDialog(song);
  }
};

da.app.fireEvent("ready.controller.Playlist", [], 1);
})();
