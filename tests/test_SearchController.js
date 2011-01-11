var test_SearchController = new function () {
  var Search = da.controller.Search,
      self = this;
  
  this.setup = function () {
    self._searches = 0;
    self.results = {};
    
    Search.search("bang", ["Song"], {onComplete: function (results) {
      self._searches++;
      self.results.bang_song = results;
    }});
    Search.search("sunshine", ["Album"], {onComplete: function (results) {
      self._searches++;
      self.results.sunshine_album = results;
    }});
    Search.search("super", ["Artist"], {onComplete: function (results) {
      self._searches++;
      self.results.super_artist = results;
    }});
    Search.search("marina", ["Artist"], {onComplete: function (results) {
      self._searches++;
      self.results.marina_artist = results;
    }});
    
    Search.search("super", ["Song", "Artist"], {onComplete: function (results) {
      self._searches++;
      self.results.super_song_artist = results;
    }});
    Search.search("sunshine", ["Artist", "Album"], {onComplete: function (results) {
      self._searches++;
      self.results.sunshine_artist_album = results;
    }});
    Search.search("bang", ["Album", "Artist"], {onComplete: function (results) {
      self._searches++;
      self.results.bang_album_artist = results;
    }});
    Search.search("super", ["Artist", "Song"], {onComplete: function (results) {
      self._searches++;
      self.results.super_artist_song = results;
    }});
    
    Search.search("maps", ["Song", "Album", "Artist"], {onComplete: function (results) {
      self._searches++;
      self.results.maps_song_album_artist = results;
    }});
    Search.search("keane", ["Album", "Artist", "Song"], {onComplete: function (results) {
      self._searches++;
      self.results.keane_album_artist_song = results;
    }});
    Search.search("symmetry", ["Artist", "Song", "Album"], {onComplete: function (results) {
      self._searches++;
      self.results.symmetry_artist_song_album = results;
    }});
  };
  
  this.test_waitForResuls = {
    method: "waits.forJS",
    params: {js: function () { return self._searches === 11 }}
  };

  this.test_oneFilter = function () {
    var r = self.results.bang_song;
    jum.assertEquals("Search for 'bang' should result with only one song",
      1, r.length
    );
    jum.assertEquals("Found song should have been 'Hey Big Bang'", 
      "Hey Big Bang", r[0].key
    );
    
    r = self.results.sunshine_album;
    jum.assertEquals("Search for 'sunshine' should result with only one song",
      1, r.length
    );
    jum.assertEquals("Found song should have been 'Maps'",
      "Maps", r[0].key
    );
    
    r = self.results.super_artist;
    jum.assertEquals("Search for 'super' should result with two songs",
      2, r.length
    );
    // search results are sorted by song's title
    jum.assertEquals("First song should be 'Persona'",
      "Persona", r[0].key
    );
    jum.assertEquals("Second song shuold be 'Hey Big Bang'",
      "Hey Big Bang", r[1].key
    );
    
    r = self.results.marina_artist;
    jum.assertEquals("There should be no results for non-existing artist",
      0, r.length
    );
  };
  
  this.test_twoFilters = function () {
    var r = self.results.sunshine_artist_album;
    jum.assertEquals("Search for 'sunshine' with 'Artist' and 'Album' filters should give one result",
      1, r.length
    );
    jum.assertEquals("The result should be 'Maps'",
      "Maps", r[0].key
    );
    
    r = self.results.bang_album_artist;
    jum.assertEquals("Search for 'bang' with 'Artist' and 'Album' filters should give no results",
      0, r.length
    );
  };
  
  this.test_reversedFilterNames = function () {
    var r = self.results.super_song_artist;
    jum.assertEquals("Search for 'super' with 'Song' and 'Artist' filters should give two songs",
      2, r.length
    );
    jum.assertEquals("The first song should be 'Persona'",
      "Persona", r[0].key
    );
    jum.assertEquals("The scond song should be 'Hey Big Bang'",
      "Hey Big Bang", r[1].key
    );
    
    r = self.results.super_artist_song;
    jum.assertEquals("Search for 'super' with 'Song' and 'Artist' filters should give two songs",
      2, r.length
    );
    jum.assertEquals("The first song should be 'Persona'",
      "Persona", r[0].key
    );
    jum.assertEquals("The scond song should be 'Hey Big Bang'",
      "Hey Big Bang", r[1].key
    );
  };
  
  this.test_threeFilters = function () {
    var r = self.results.maps_song_album_artist;
    jum.assertEquals("Search for 'maps' with 'Song', 'Album' and 'Artist' filters should give one result",
      1, r.length
    );
    jum.assertEquals("The first song should be 'Maps'",
      "Maps", r[0].key
    );
    
    r = self.results.keane_album_artist_song;
    jum.assertEquals("Search for 'keane' with 'Album', 'Artist' and 'Song' filters should give one result",
      1, r.length
    );
    jum.assertEquals("The first song should be 'Maps'",
      "Maps", r[0].key
    );
    
    r = self.results.symmetry_artist_song_album;
    jum.assertEquals("Search for 'symmetry' with 'Artist', 'Song' and 'Album' filters shoudl give no results",
      0, r.length
    );
  };
  
  this.teardown = function () {
    $("search_dialog").parentNode.parentNode.hide();
  }
};
