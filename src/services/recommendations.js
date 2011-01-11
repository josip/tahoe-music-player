//#require "services/lastfm.js"
//#require "libs/util/Goal.js"

(function () {
var DocumentTemplate  = da.db.DocumentTemplate,
    Artist            = DocumentTemplate.Artist,
    Album             = DocumentTemplate.Album,
    Song              = DocumentTemplate.Song,
    Goal              = da.util.Goal,
    lastfm            = da.service.lastFm,
    
    CACHE  = {};

function getSimilar (what, search_params, callback) {
  console.log("getSimilar", what);
  lastfm[what].getSimilar(search_params, {
    success: function (data) {
      data = data["similar" + what + "s"];
      var items = data[what];
      
      if(!items || typeof items === "string")
        return callback(false);
      
      if($type(items) !== "array")
        items = [items];
      else
        items = items.slice(0, 10);
      
      var n = items.length, item;
      while(n--) {
        item = items[n];
        items[n] = {
          title: item.name,
          image: item.image && item.image.length ? item.image[2]["#text"] : ""
        };
        
        if(item.mbid && item.mbid.length)
          items[n].mbid = item.mbid;
        
        if(what === "track") {
          items[n].artist = item.artist.name;
          if(item.artist.mbid && item.artist.mbid.length)
            items[n].artist_mbid = item.artist.mbid;
        }
      }
      
      callback(items);
      delete items;
      delete data;
    },
    failure: function () {
      callback(false);
    }
  });
}

/**
 *  da.service.recommendations(song, callback) -> undefined
 *  - song (da.db.DocumentTemplate.Song): songs for which recommendations are needed.
 *  - callback (Function): called once recommended songs and albums are fetched.
 **/
da.service.recommendations = function (song, callback) {
  var recommendations = {}, 
      fetch_data = new Goal({
        checkpoints: ["artists", "songs"],
        onFinish: function () {
          callback(recommendations);
          delete recommendations;
        }
      });
  
  song.get("artist", function (artist) {
    if(CACHE[artist.id]) {
      recommendations.artists = CACHE[artist.id];
      fetch_data.checkpoint("artists");
    } else
      getSimilar("artist", {artist: artist.get("title"), limit: 10}, function (data) {
        if(data)
          CACHE[artist.id] = recommendations.artists = data;
        fetch_data.checkpoint("artists");
      });
    
    if(CACHE[song.id]) {
      recommendations.songs = CACHE[song.id];
      fetch_data.checkpoint("songs");
    } else {  
      var song_search_params;
      if(song.get("mbid"))
        song_search_params = {mbid: song.get("mbid")};
      else
        song_search_params = {
          track:  song.get("title"),
          artist: artist.get("title")
        };
    
      getSimilar("track", song_search_params, function (data) {
        if(data)
          CACHE[song.id] = recommendations.songs = data;
    
        fetch_data.checkpoint("songs");
      });
    }
  });
  
};

})();