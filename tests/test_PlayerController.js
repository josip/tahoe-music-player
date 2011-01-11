var test_PlayerController = new function () {
  var Song   = da.db.DocumentTemplate.Song,
      // Songs column was set as only one in test_NavigationController
      Songs  = null,
      Player = da.controller.Player,
      self   = this;
  
  this.setup = function () {
    Songs = da.controller.Navigation.activeColumns[1].column;
    
    self.songs = [
      Song.findById(Songs.getItem(0).id),
      Song.findById(Songs.getItem(1).id),
      Song.findById(Songs.getItem(2).id)
    ];
  };
  
  this.test_play = function () {
    jum.assertTrue("Should return 'undefined if nothing is playing",
      !Player.nowPlaying()
    );
    
    self.play_event_fired = false;
    Player.addEvent("play", function () {
      self.play_event_fired = true;
      self.play_event_args = arguments;
    });
    
    Player.play(self.songs[0]);
  };
  
  this.test_playEvent = {
    method: "waits.forJS",
    params: {
      js: function () { return !!self.play_event_fired }
    }
  };
  
  this.test_verifyPlayEventArgs = function () {
    jum.assertEquals("first argument to callback function should be playing song",
      self.songs[0].id,
      self.play_event_args[0].id
    );
  };
  
  this.test_verifySongInfo = [
    {method: "asserts.assertText", params: {id: "song_title", validator: "Persona"}},
    {method: "asserts.assertText", params: {id: "song_album_title", validator: "Urgency"}},
    {method: "asserts.assertText", params: {id: "song_artist_name", validator: "Superhumanoids"}}
  ];
  
  this.test_getNext = function () {
    jum.assertTrue("there shouldn't be a next song, since there is no playlist",
      !Player.getNext()
    );
    
    var playlist = self.songs.map(function (s) { return s.id });
    Player.setPlaylist(playlist);
    Player.play(self.songs[1]);
    
    jum.assertEquals("next song in playlist should be returned",
      playlist[2],
      Player.getNext()
    );
  };
  
  this.test_prevNextButtons = [
    {method: "asserts.assertText", params: {id: "prev_song", validator: "Persona"}},
    {method: "asserts.assertText", params: {id: "next_song", validator: "Maps"}}
  ];
  
  this.test_getPrev = function () {
    jum.assertEquals("previous song in playlist should have been returned",
      self.songs[0].id,
      Player.getPrev()
    );
    
    Player.play(self.songs[2]);
    jum.assertEquals("previous song in playlist should have been returned",
      self.songs[1].id,
      Player.getPrev()
    );
  };
  
  this.test_turnShuffleOn = function () {
    this.tbs_playlist = [self.songs[0].id, 2, 3, 4, 5];
    Player.play(self.songs[0]);
    Player.setPlaylist(this.tbs_playlist);
    Player.setPlayMode("shuffle");
    
    jum.assertNotEquals("Playlist should be shuffled",
      Player.getPlaylist(), this.tbs_playlist
    );
    
    jum.assertTrue("Next item is being chosen from the right playlist",
      this.tbs_playlist.slice(1).contains(Player.getNext())
    );
  };
  
  this.test_turnShuffleOff = function () {
    Player.setPlayMode("normal");
    
    jum.assertEquals("Non-shuffled playlist should be restored",
      this.tbs_playlist, Player.getPlaylist()
    );
  };
  
  this.test_queue = function () {
    Player.queue(self.songs[0].id);
    
    jum.assertEquals("next song should be from queue",
      self.songs[0].id,
      Player.getNext()
    );
    
    Player.setPlaylist([]);
    jum.assertEquals("next song should be from queue, ignoring the fact that playlist is empty",
      self.songs[0].id,
      Player.getNext()
    );
  };
  
  return this;
};
