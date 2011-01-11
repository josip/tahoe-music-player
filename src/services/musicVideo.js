//#require <services/services.js>
//#require <doctemplates/Song.js>

(function () {
var Song = da.db.DocumentTemplate.Song,
    CACHE = {};

/**
 *  da.service.musicVideo(song, callback) -> undefined
 *  - song (da.db.DocumentTemplate.Song): song who's music videos are needed.
 *  - callback (Function): function to which results will be passed.
 **/
da.service.musicVideo = function (song, callback) {
  if(CACHE[song.id])
    return !!callback(CACHE[song.id]);
  
  song.get("artist", function (artist) {
    var req = new Request.JSONP({
      url: "http://gdata.youtube.com/feeds/api/videos",
      data: {
        v:        2,
        alt:      "jsonc",
        category: "Music",
        format:   5,
        orderby:  "relevance",
        time:     "all_time",
        q:        artist.get("title") + " " + song.get("title")
      },
      onSuccess: function (results) {
        callback(results.data.items);
        delete req;
      },
      onFailure: function () {
        delete req;
        callback(false);
      }
    });
    req.send();
  });
};

})();
