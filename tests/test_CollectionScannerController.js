var test_CollectionScannerController = new function () {
  var CS = da.controller.CollectionScanner,
      self = this;
  
  this.test_waitForScannerToFinish = {
    method: "waits.forJS",
    params: {
      js: function () {
        return da.db.DEFAULT.views.Song.view.rows.length === 3
      }
    }
  };
  
  this.test_foundSongs = function () {
    var songs = $A(da.db.DEFAULT.views.Song.view.rows);
    for(var n = 0, m = songs.length; n < m; n++)
      songs[n] = songs[n].value.title;
    
    jum.assertEquals("there should be three songs",
      3, songs.length
    );
    
    jum.assertSameArrays(["Maps", "Persona", "Hey Big Bang"], songs);
  };
  
  this.test_foundArtists = function () {
    var artists = $A(da.db.DEFAULT.views.Artist.view.rows);
    for(var n = 0, m = artists.length; n < m; n++)
      artists[n] = artists[n].value.title;
    
    jum.assertEquals("there should be two artists",
      2, artists.length
    );
    jum.assertSameArrays(["Keane", "Superhumanoids"], artists);
  };
  
  this.test_foundAlbums = function () {
    var albums = $A(da.db.DEFAULT.views.Album.view.rows);
    for(var n = 0, m = albums.length; n < m; n++)
      albums[n] = albums[n].value.title;
    
    jum.assertEquals("there should be two albums",
      2, albums.length
    );
    jum.assertSameArrays(["Sunshine Retrospective Collect", "Urgency"], albums);
  };
};
