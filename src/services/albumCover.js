//#require "services/lastfm.js"

(function () {
var lastfm = da.service.lastFm,
    Artists = da.db.DocumentTemplate.Artist.view();

function fetchAlbumCover(search_params, album, callback) {
  console.log("Fetching album covers", album.doc.title);
  lastfm.album.getInfo(search_params, {
    success: function (data) {
      var urls = data.album.image ? data.album.image : null,
          n = urls.length,
          url;
      
      while(n--) {
        url = urls[n]["#text"];
        if(!url || !url.length)
          url = "resources/images/album_cover_" + n + ".png";
        
        urls[n] = url;
      }
      
      album.update({
        album_cover_urls: urls,
        lastfm_id:        data.album.id,
        mbid:             data.album.mbid.length ? data.album.mbid : null
      });
      
      // fun fact: typeof /.?/ === "function"
      if(urls && callback)
        callback(urls);
      
      delete callback;
      delete urls;
      delete data;
      delete search_params;
    },
    failure: function () {
      if(!callback)
        return;
      
      var urls = [
        "resources/images/album_cover_0.png",
        "resources/images/album_cover_1.png",
        "resources/images/album_cover_2.png",
        "resources/images/album_cover_3.png"
      ];
      
      album.update({album_cover_urls: urls});
      if(callback)
        callback(urls);
      delete callback;
    }
  });
}

/**
 *  da.service.albumCover(album[, callback]) -> undefined
 *  - album (da.db.DocumentTemplate.Album): album whose album art needs to be fetched
 *  - callback (Function): called once album cover is fetched, with first
 *    argument being an array of four URLs.
 *  
 *  #### Notes
 *  Fetched URLs will be saved to the `song` under 'album_cover_urls' propety.
 **/
da.service.albumCover = function (album, callback) {
  var search_params = {};
  if(album.get("mbid"))
    search_params.mbid = album.get("mbid");
  
  if(!search_params.mbid)
    search_params = {
      album: album.get("title"),
      artist: Artists.getRow(album.get("artist_id")).title
    };
  
  fetchAlbumCover(search_params, album, callback);
  search_params = null;
};

})();
