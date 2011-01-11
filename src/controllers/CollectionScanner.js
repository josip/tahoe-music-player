//#require "libs/util/Goal.js"
//#require "doctemplates/Song.js"
//#require "doctemplates/Artist.js"
//#require "doctemplates/Album.js"
//#require "doctemplates/Setting.js"

(function () {
var DocumentTemplate  = da.db.DocumentTemplate,
    Song              = DocumentTemplate.Song,
    Artist            = DocumentTemplate.Artist,
    Album             = DocumentTemplate.Album,
    Setting           = DocumentTemplate.Setting,
    Goal              = da.util.Goal,
    GENRES            = da.util.GENRES;

/** section: Controllers
 *  class CollectionScanner
 *  
 *  Controller which operates with [[Scanner]] and [[Indexer]] WebWorkers.
 *  
 *  #### Notes
 *  This is private class.
 *  Public interface is provided via [[da.controller.CollectionScanner]].
 **/
var CollectionScanner = new Class({
  /**
   *  new CollectionScanner()
   *  
   *  Starts a new scan using [[Application.caps.music]] as root directory.
   **/
  initialize: function (root) {
    root = root || da.app.caps.music;
    if(!root) {
      this.finished = true;
      return false;
    }
    
    console.log("collection scanner started");
    this.indexer = new Worker("js/workers/indexer.js");
    this.indexer.onmessage = this.onIndexerMessage.bind(this);
    
    this.scanner = new Worker("js/workers/scanner.js");
    this.scanner.onmessage = this.onScannerMessage.bind(this);
    
    this.scanner.postMessage(root);
    
    this.finished = false;
    
    this._found_files = 0;
    this._goal = new Goal({
      checkpoints: ["scanner", "indexer"],
      onFinish: function () {
        this.finished = true;
        this.destroy();
        
        da.ui.ROAR.alert(
          "Collection scanner finished",
          "{0} songs have been found. {1}".interpolate([
            this._found_files,
            this._found_files ? "Your patience has paid off." : "Make sure your files have proper ID3 tags." 
          ])
        );
        
        Setting.findById("last_scan").update({value: new Date()});
      }.bind(this)
    });
    
    da.ui.ROAR.alert(
      "Collection scanner started",
      "Your musical collection is being scanned. You should see new artists showing \
      up in the area above. Patience."
    );
  },
  
  /**
   *  CollectionScanner#finished -> true | false
   **/
  finished: false,
    
  onScannerMessage: function (event) {
    var cap = event.data;
    if(cap === "**FINISHED**") {
      this._goal.checkpoint("scanner");
      return;
    }
    
    if(cap.debug) {
      console.log("SCANNER", cap.msg, cap.obj);
      return;
    }
    
    if(da.db.DEFAULT.views.Song.view.findRow(cap) === -1)
      this.indexer.postMessage(cap);
  },
  
  onIndexerMessage: function (event) {
    if(event.data === "**FINISHED**") {
      this._goal.checkpoint("indexer");
      return;
    }
    
    if(event.data.debug) {
      console.log("INDEXER", event.data.msg, event.data.obj);
      return;
    }
    
    // Lots of async stuff is going on, a short summary would look something like:
    // 1. find or create artist with given name and save its id
    //    to artist_id.
    // 2. look for an album with given artist_id (afterCheckpoint.artist)
    // 3. save the album data.
    // 4. look for song with given id and save the new data.
    this._found_files++;
    
    var tags = event.data,
        album_id, artist_id,
        links = new Goal({
          checkpoints: ["artist", "album"],
          onFinish: function () {
            Song.findOrCreate({
              properties: {id: tags.id},
              onSuccess: function (song) {
                song.update({
                  title:      tags.title,
                  track:      tags.track,
                  year:       tags.year,
                  genre:      fixGenre(tags.genre),
                  artist_id:  artist_id,
                  album_id:   album_id,
                  plays:      0
                });
                
                delete links;
                delete artist_id;
                delete album_id;
              }
            });
          },
          
          afterCheckpoint: {
            artist: function () {
              Album.findOrCreate({
                properties: {artist_id: artist_id, title: tags.album},
                onSuccess: function (album, wasCreated) {
                  album_id = album.id;
                  if(wasCreated)
                    album.save(function () { links.checkpoint("album"); })
                  else
                    links.checkpoint("album");
                }
              });
            }
          }
        });
    
    Artist.findOrCreate({
      properties: {title: tags.artist},
      onSuccess: function (artist, was_created) {
        artist_id = artist.id;
        if(was_created)
          artist.save(function () { links.checkpoint("artist"); });
        else
          links.checkpoint("artist");
      }
    });
  },
  
  /**
   *  CollectionScanner#destroy() -> undefined
   *  
   *  Instantly kills both workers.
   **/
  destroy: function () {
    this.indexer.terminate();
    this.scanner.terminate();
    
    delete this.indexer;
    delete this.scanner;
    delete this.goal;
  }
});

function fixGenre (genre) {
  return typeof genre === "number" ? genre : (GENRES.contains(genre) ? GENRES.indexOf(genre) : genre);
}

Setting.register({
  id:           "last_scan",
  group_id:     "CollectionScanner",
  representAs:  "text",
  title:        "Last scan",
  help:         "The date your collection was scanned.",
  value:        new Date(0)
});

da.app.addEvent("ready", function () {
  var last_scan = Setting.findById("last_scan"),
       five_days_ago = (new Date()) - 5*24*60*60*1000;
  if((new Date(last_scan.get("value"))) < five_days_ago)
    da.controller.CollectionScanner.scan();
});

var CS;
/**
 * da.controller.CollectionScanner
 * Public interface of [[CollectionScanner]].
 **/
da.controller.CollectionScanner = {
  /**
   *  da.controller.CollectionScanner.scan() -> undefined
   *  Starts scanning music directory
   **/
  scan: function (cap) {
    if(!CS || (CS && CS.finished))
      CS = new CollectionScanner(cap);
    else if(cap && cap.length)
      CS.scanner.postMessage(cap);
  },
  
  /**
   *  da.controller.CollectionScanner.isScanning() -> true | false
   **/
  isScanning: function () {
    return CS ? !CS.finished : false;
  }
};

da.app.fireEvent("ready.controller.CollectionScanner", [], 1);

})();
