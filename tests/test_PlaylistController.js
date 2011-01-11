var test_PlaylistController = new function () {
  var PlaylistController  = da.controller.Playlist,
      Playlist            = da.db.DocumentTemplate.Playlist,
      Song                = da.db.DocumentTemplate.Song,
      self                = this;
      
  this.setup = function () {
    this.songs = $A(Song.view().rows).map(function (x) { return x.id });
    
    Playlist.create({
      id:           "PLA",
      title:        "Playlist A",
      description:  "DA",
      song_ids:     [this.songs[0], this.songs[1], this.songs[2]]
    }, function (pl) { self.A = pl });
    
    Playlist.create({
      id:           "PLB",
      title:        "Playlist B",
      description:  "DB",
      song_ids:     [this.songs[2], this.songs[0]]
    }, function (pl) { self.B = pl });
    
    Playlist.create({
      id:           "PLC",
      title:        "Playlist C",
      description:  "DC",
      song_ids:     [this.songs[1]]
    }, function (pl) { self.pl_a = pl });
  };
  
  this.test_addToExistingPlaylist = function () {
    PlaylistController.addSong(Song.findById(this.songs[2]));
    
    jum.assertTrue("playlist chooser dialog should be visible",
      $("add_to_pl_dialog").style.display !== "none"
    );
    
    var playlist_ids = $("playlist_selector").getElements("option").map(function (x) {
      return x.value;
    });
    jum.assertSameArrays(["PLA", "PLB", "PLC", "_new_playlist"], playlist_ids);
    
    $("playlist_selector").value = "PLC";
    
    $("add_to_pl_dialog").fireEvent("submit");
    jum.assertFalse("dialog shouldn't be visible anymore",
      !!$("add_to_pl_dialog")
    );
    
    var plc = Playlist.findById("PLC");
    jum.assertEqualArrays(plc.get("song_ids"), [this.songs[1], this.songs[2]]);
  };
  
  this.test_addToNewPlaylist = function () {
    PlaylistController.addSong(Song.findById(this.songs[1]));
    
    jum.assertTrue("playlist chooser dialog should be visible",
      $("add_to_pl_dialog").style.display !== "none"
    );
    
    $("playlist_selector").value = "_new_playlist";
    
    jum.assertTrue("form for creating new playlists should be visible",
      $("add_to_new_pl").style.display !== "none"
    );
    
    $("add_to_new_pl_title").value = "Playlist D";
    $("add_to_new_pl_description").value = "DD";
    
    $("add_to_pl_dialog").fireEvent("submit");
    
    jum.assertFalse("dialog shouldn't be visible anymore",
      !!$("add_to_pl_dialog")
    );
    
    Playlist.find({
      properties: {
        title:       "Playlist D"
      },
      onSuccess: function (docs) {
        self.D = docs[0];
      }
    });
  };
  
  this.test_waitForNewPlaylist = {
    method: "waits.forJS",
    params: {js: function () { return Playlist.view().rows.length === 4 }}
  };
  
  this.test_verfiyNewPlaylist = function () {
    jum.assertEqualArrays(self.D.get("song_ids"), [self.songs[1]]);
  };
  
  this.test_playlistEditor = function () {
    PlaylistController.edit(self.B);
    
    jum.assertEquals("playlist editor should be visible",
      1, $$(".playlist_editor").length
    );
    
    var rendered_ids = $$("#playlist_songs li").map(function (x) {
      return x.id.split("playlist_song_")[1]
    });
    
    jum.assertEqualArrays(self.B.get("song_ids"), rendered_ids);
    jum.assertEquals("playlist's title should be correct",
      self.B.get("title"), $("playlist_title").value
    );
    jum.assertEquals("playlist's description should be correct",
      self.B.get("description"), $("playlist_description").value
    );
  };
  
  this.test_playlistEditorSearchDialog = function () {
    $("playlist_add_more_songs").fireEvent("click");
    $("search_field").value = Song.findById(self.songs[1]).get("title");
    $("search_field").fireEvent("keyup");
  };
  
  this.test_waitForSearchResults = {
    method: "waits.forJS",
    params: {
      js: function () { return !!$$("#search_results_column .column_item") }
    }
  };
  
  this.test_clickResultItem = function () {
    // clicking the first (and only) search result
    $("search_results_column").fireEvent("click:relay(.column_item)", [
      {id: self.songs[1]},
      $$("#search_results_column .column_item")[0]
    ]);
  };
  
  this.test_waitForSongToBeAddedToThePlaylist = {
    method: "waits.forJS",
    params: {
      js: function () { return $$("#playlist_songs li").length === 3 }
    }
  };
  
  this.test_verifySearchDialogClick = function () {
    var rendered_ids = $$("#playlist_songs li").map(function (x) {
      return x.id.split("playlist_song_")[1]
    });
    
    jum.assertEqualArrays([self.songs[2], self.songs[0], self.songs[1]], rendered_ids);
  };
  
  this.test_removingAnSongFromPlaylist = function () {
    var delete_icon = $("playlist_song_" + self.songs[0]).getElement(".action");
    $("playlist_songs").fireEvent("click:relay(.action)", [null, delete_icon]);
  };
  
  this.test_verifyRemovingAnSongFromPlaylist = {
    method: "waits.forJS",
    params: {
      js: function () { return !$("playlist_song_" + self.songs[0]) }
    }
  };
  
  this.test_playlistEditorSave = function () {
    $("playlist_save").fireEvent("click");
  };
  
  this.test_waitForPlaylistToBeSaved = {
    method: "waits.forJS",
    params: {
      js: function () { return Playlist.findById(self.B.id).get("song_ids").contains(self.songs[1]) }
    }
  };

  this.test_verifySave = function () {  
    jum.assertEqualArrays([self.songs[2], self.songs[1]], Playlist.findById(self.B.id).get("song_ids"));
  };
};
