//#require <libs/util/util.js>
//#require <doctemplates/Song.js>

(function () {
var Song              = da.db.DocumentTemplate.Song,
    SERVER            = location.protocol + "//" + location.host,
    XML_HEADER        = '<?xml version="1.0" encoding="UTF-8"?>\n',
    TRACKLIST_REGEXP  = /tracklist/gi,
    TRACKNUM_REGEXP   = /tracknum/gi;

/**
 *  da.util.playlistExporter.XSPF(playlist) -> String
 *  - playlist (da.util.Playlist
 *  
 *  #### External resources
 *  * [XSPF v1 specification](http://xspf.org/xspf-v1.html)
 *  * [XSPF Quickstart](http://xspf.org/quickstart/)
 *  * [XSPF Validator](http://validator.xspf.org/) - we're generating valid XSPF!
 *  
 **/
function XSPFExporter (playlist) {
  var ids = playlist.get("song_ids"),
      file = new Element("root"),
      track_list = new Array(ids.length),
      //track_list = new Element("trackList"),
      song, artist, album, track, duration;
  
  for(var n = 0, m = ids.length; n < m; n++) {
    song = Song.findById(ids[n]);
    // getting a 'belongs to' relationship is always synchronous
    song.get("artist",  function (_a) { artist = _a });
    song.get("album",   function (_a) { album = _a  });
    // XSPF specification requires positive intergers,
    // whereas we're using negative ones indicate that the value isn't present.
    track = song.get("track");
    duration = song.get("duration");
    
    track_list[n] = tag("track", [
      tag("location", makeURL(song)),
      tag("title",    song.get("title").stripTags()),
      tag("creator",  artist.get("title").stripTags()),
      tag("album",    album.get("title").stripTags()),
      track     < 1 ? "" : tag("trackNum", track),
      duration  < 1 ? "" : tag("duration", duration)
    ].join(""));
  }
  
  file.grab(new Element("playlist", {
    version: 1,
    xmlns: "http://xspf.org/ns/0/",
    
    html: [
      tag("title",      playlist.get("title").stripTags()),
      tag("annotation", playlist.get("description").stripTags()),
      tag("trackList",  track_list.join(""))
    ].join("")
  }));
  
  // As per some specification `document.createElement(tagName)`, lowercases
  // tagName if the `document` is an (X)HTML document.
  var output = file.innerHTML
    .replace(TRACKLIST_REGEXP, "trackList")
    .replace(TRACKNUM_REGEXP,  "trackNum");
  
  openDownloadWindow(makeDataURI("application/xspf+xml", XML_HEADER + output));
}

/**
 *  da.util.playlistExporter.M3U(playlist) -> undefined
 *  - playlist (da.db.DocumentTemplate.Playlist): playlist which will be exported
 *
 *  #### Resources
 *  * [Wikipedia article on M3U](http://en.wikipedia.org/wiki/M3U)
 *  * [M3U specification](http://schworak.com/programming/music/playlist_m3u.asp)
 *
 **/
function M3UExporter (playlist) {
  var ids    = playlist.get("song_ids"),
      file = ["#EXTM3U"],
      song;
  
  for(var n = 0, m = ids.length; n < m; n++) {
    song = Song.findById(ids[n]);
    song.get("artist", function (artist) {
      file.push(
        "#EXTINFO:-1,{0} - {1}".interpolate([artist.get("title"), song.get("title")]),
        makeURL(song)
      );
    });
  }
  
  openDownloadWindow(makeDataURI("audio/x-mpegurl", file.join("\n")));
}

/**
 *  da.util.playlistExporter.PLS(playlist) -> String
 *
 *  #### Resources
 *  * [PLS article on Wikipedia](http://en.wikipedia.org/wiki/PLS_(file_format))
 **/
function PLSExporter(playlist) {
  var ids = playlist.get("song_ids"),
      file = ["[playlist]", "NumberOfEntries=" + ids.length],
      song;
  
  for(var n = 0, m = ids.length; n < m; n++) {
    song = Song.findById(ids[n]);
    file.push(
      "File"   + (n + 1) + "=" + makeURL(song),
      "Title"  + (n + 1) + "=" + song.get("title"),
      "Length" + (n + 1) + "=" + song.get("duration")
    )
  }
  
  file.push("Version=2");
  openDownloadWindow(makeDataURI("audio/x-scpls", file.join("\n")));
}

function makeURL(song) {
  var named = "?@@named=" + encodeURIComponent(song.get("title")) + ".mp3";
  return [SERVER, "uri", encodeURIComponent(song.id)].join("/") + named;
}

function makeDataURI(mime_type, data) {
  var x = "data:" + mime_type + ";charset=utf-8," + encodeURIComponent(data);
  return x;
}

function openDownloadWindow(dataURI) {
  var download_window = window.open(dataURI, "_blank", "width=400,height=200");
  window.wdx = download_window;
  
  // This allows Firefox to open the download dialog,
  // while Chrome will show the blank page.
  setTimeout(function () {
    download_window.location = "playlist_download.html";
    download_window.onload = function () {
      var dl = download_window.document.getElementById("download_link");
      dl.href = dataURI;
    };
  }, 2*1000);
}

function tag(tagName, text) {
  return "<" + tagName + ">" + text + "</" + tagName + ">";
}


/**
 * da.util.playlistExporter
 * Methods for exporting playlists to other formats.
 *
 * #### External resources
 * * [A survey of playlist formats](http://gonze.com/playlists/playlist-format-survey.html)
 **/
da.util.playlistExporter = {
  XSPF:   XSPFExporter,
  M3U:    M3UExporter,
  PLS:    PLSExporter
};

})();
