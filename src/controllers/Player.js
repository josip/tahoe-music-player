//#require "libs/vendor/SoundManager.js"
//#require "doctemplates/Song.js"
//#require "libs/ui/SegmentedProgressBar.js"

(function () {
var soundManager          = da.vendor.soundManager,
    Song                  = da.db.DocumentTemplate.Song,
    SegmentedProgressBar  = da.ui.SegmentedProgressBar;

/** section: Controllers
 *  class Player
 *  
 *  Player interface and playlist managment class.
 *
 *  #### Notes
 *  This class is private.
 *  Public interface is provided through [[da.controller.Player]].
 *
 *  #### Links
 *  * [soundManager2 API](http://www.schillmania.com/projects/soundmanager2/doc/)
 *
 **/
var Player = {
  
  // We're using term sound for soundManager objects, while
  // song for DocumentTemplate.Song instances.
  /**
   *  Player#sounds -> Object
   *
   *  Cache of SoundManager's object. Keys are id's of [[da.db.DocumentTemplate.Song]].
   **/
  sounds: {},
  
  /**
   *  Player#playlist -> [String, ...]
   *  Contains id's of songs in the playlist.
   **/
  playlist: [],
  _playlist_pos: 0,
  
  /**
   *  Player#queue -> [da.db.DocumentTemplate.Song, ...]
   **/
  queue: [],
  
  /**
   *  Player#nowPlaying -> {song: <da.db.DocumentTemplate.Song>, sound: <SMSound>} 
   **/
  nowPlaying: {
    song: null,
    sound: null
  },
  _loading: [],
  
  play_mode: null,
  
  /**
   *  new Player()
   *  Sets up soundManager2 and initializes player's interface.
   **/
  initialize: function () {
    //soundManager.onready(function () {
    //  da.app.startup.checkpoint("soundmanager");
    //});
    
    da.app.addEvent("ready", this.initializeUI.bind(this));
    
    this.preloadImages()
  },
  
  initializeUI: function () {
    this._el = $("player_pane");
    window.addEvent("resize", function () {
       this._el.style.height = window.getHeight() + "px";
    }.bind(this));
    window.fireEvent("resize");
    
    this.progress_bar = new SegmentedProgressBar(150, 5, {
      track: "#339D4C",
      load:  "#C1C6D4"
    });
    var load_grad = this.progress_bar.ctx.createLinearGradient(0, 0, 0, 5);
    load_grad.addColorStop(0, "#6f7074");
    load_grad.addColorStop(1, "#cfccd7");
    this.progress_bar.segments.load.options.foreground = load_grad;
    load_grad = null;
    
    var track_grad = this.progress_bar.ctx.createLinearGradient(0, 0, 0, 5);
    track_grad.addColorStop(0, "#339D4C");
    track_grad.addColorStop(1, "#326732");
    this.progress_bar.segments.track.options.foreground = track_grad;
    track_grad = null;
    
    this.progress_bar.toElement().id = "track_progress";
    this.progress_bar.toElement().addEvents({
      mouseup: function (e) {
        var sound = Player.nowPlaying.sound;
        if(!sound)
          return;
        
        var p = e.event.offsetX / this.getWidth();
        sound.setPosition(sound.durationEstimate * p);
      },
      mouseover: function () {
        Player.elements.position.fade("in");
      }
    });
    
    var els = {
      info_block:     new Element("div",  {id: "song_info_block" }),
      wrapper:        new Element("div",  {id: "song_details"}),
      cover_wrapper:  new Element("div",  {id: "song_album_cover_wrapper"}),
      album_cover:    new Element("img",  {id: "song_album_cover"}),
      song_title:     new Element("h2",   {id: "song_title",        html: "Unknown"}),
      album_title:    new Element("span", {id: "song_album_title",  html: "Unknown"}),
      artist_name:    new Element("span", {id: "song_artist_name",  html: "Unknown"}),
      controls:       new Element("div",  {id: "player_controls",   "class": "no_selection"}),
      play:           new Element("a",    {id: "play_button",       href: "#"}),
      next:           new Element("a",    {id: "next_song",         href: "#"}),
      prev:           new Element("a",    {id: "prev_song",         href: "#"}),
      position:       new Element("span", {id: "song_position",     href: "#"})
    };
    
    var play_wrapper = new Element("div", {id: "play_button_wrapper"});
    play_wrapper.grab(els.play);
    els.controls.adopt(
      els.prev, play_wrapper, els.next,
      this.progress_bar.toElement(), els.position
    );
    
    els.wrapper.grab(els.song_title);
    els.wrapper.appendText("from ");
    els.wrapper.grab(els.album_title);
    els.wrapper.appendText(" by ");
    els.wrapper.adopt(els.artist_name, els.controls);
    
    els.cover_wrapper.grab(els.album_cover);
    
    els.info_block.adopt(els.cover_wrapper, els.wrapper, new Element("div", {"class": "clear"}));
   
    this._el.adopt(els.info_block);
    
    els.position.set("tween", {duration: "short", link: "cancel"});
    
    this._el.style.visibility = "hidden";
    this._visible = false;
    
    // We're using them in mouseover event, 
    // to avoid creating another closure.
    var next = els.next,
        prev = els.prev;
    els.play.addEvents({
      click: function () {
        Player.playPause();
      },
      
      mouseover: function () {
        if(!next.hasClass("inactive"))
          next.fade("show");
        if(!prev.hasClass("inactive"))
          prev.fade("show");
      }
    });
    
    next.addEvent("click", function () { Player.playNext() });
    next.set("tween", {duration: "short", link: "cancel"});
    
    prev.addEvent("click", function () { Player.playPrev() });
    prev.set("tween", {duration: "short", link: "cancel"});
    
    els.controls.addEvent("mouseleave", function () {
      next.fade("out");
      prev.fade("out");
      Player.elements.position.fade("out");
    });
    
    this.play_mode = "normal";
    
    this.elements = els;
    delete els;
    delete play_wrapper;
    delete play_modes;
  },
  
  /**
   *  Player#play(song) -> undefined
   *  - song (da.db.DocumentTemplate.Song): song to play.
   *
   *  If there is currently another song playing, it will be stopped.
   **/
  play: function (song) {
    var np = this.nowPlaying;
    if(song && np.song && np.song.id === song.id)
      return;
    
    this.elements.play.addClass("active");
    
    if(!song && np.sound.paused) {
      np.sound.resume();
      return;
    }
    
    if(this.sounds[song.id]) {
      np.sound.stop();
      this.sounds[song.id].play();
      this.progress_bar.setProgress("load", 1);
      return;
    }
    
    if(np.sound)
      np.sound.stop();
    
    this._loading.push(song.id);
    var _np_update_buffer = +new Date();
    this.sounds[song.id] = soundManager.createSound({
      id: song.id,
      url: "/uri/" + encodeURIComponent(song.id),
      autoLoad: false,
      autoPlay: false,
      stream: true,
      
      onload: function () {
        if(!song.get("duration"))
          song.update({duration: this.duration});
        
        if(!Player.progress_bar.ticks)
          Player.progress_bar.ticks = Math.round(this.duration / (60 * 1000));
        
        Player._loading.remove(song.id);
      },
      
      onplay: function () {
        Player.setNowPlaying(song);
      },
      
      whileloading: function () {
        // It will usually take less time to load the song than to complete the
        // playback so we're not buffering the updates here.
        if(Player.nowPlaying.sound === this)
          Player.progress_bar.setProgress("load", this.bytesLoaded/this.bytesTotal);
      },
      
      whileplaying: function () {
        var d = +new Date();
        if(d - _np_update_buffer > 1000 && Player.nowPlaying.sound === this) {
          var pb = Player.progress_bar;
          pb.setProgress("track", this.position / this.durationEstimate);
          Player.elements.position.set("text",
            (new Date(this.position)).format("%M:%S") + " of " + (new Date(this.durationEstimate)).format("%M:%S")
          );
          pb = null;
          _np_update_buffer = d;
        }
      },
      
      onfinish: function () {
        song.update({plays: song.get("plays") + 1});
        
        if(Player.nowPlaying.sound === this)
          Player.playbackFinished();
      }
    });
    
    this.sounds[song.id].play();
    np = null;
    
    if(!this._visible) {
      this._visible = true;
      this._el.style.visibility = "visible";
      this.elements.position.position({
        relativeTo: $("track_progress"),
        position:   "centerBottom",
        edge:       "centerTop",
        offset:     {y: 2}
      });
    }
  },
  
  /**
   *  Player#setNowPlaying(song) -> undefined
   *  fires play
   **/
  setNowPlaying: function (song) {
    if(this.nowPlaying.sound)
      this.nowPlaying.sound._last_played = +(new Date());
    
    var pp = this.playlist.indexOf(song.id);
    if(pp !== -1)
      this._playlist_pos = pp;
    delete pp;
    
    this.nowPlaying = {
      song:   song,
      sound:  this.sounds[song.id]
    };
    
    var song_title = song.get("title"),
        els = this.elements;
    
    els.song_title.set("text", song_title);
    els.song_title.title = song_title;
    
    song.get("album", function (album) {
      var title = album.get("title"),
          album_covers = album.get("album_cover_urls"),
          has_album_cover = album_covers && album_covers[2] && album_covers[2].length;
      
      els.album_title.set("text", title);
      els.album_title.title = title;
      els.album_cover.src = has_album_cover ? album_covers[2] : "resources/images/album_cover_2.png";
      
      delete album;
      delete title;
      delete album_covers;
      delete has_album_cover;
    });
    
    song.get("artist", function (artist) {
      var aname = artist.get("title");
      els.artist_name.set("text", aname);
      els.artist_name.title = aname;
      
      aname = null;
      delete els;
    });
    
    if(song.get("duration"))
      this.progress_bar.ticks = Math.round(song.get("duration") / (60*1000));
    
    da.controller.Player.fireEvent("play", [song]);
    song = null;
    
    this.updateNextPrev();
  },
  
  /**
   *  Player#playbackFinished() -> undefined
   *
   *  Called when song finishes playing.
   *  Deterimnes what to do next - load next song in playlist,
   *  repeat this song, etc.
   **/
  playbackFinished: function () {
    this.elements.play.removeClass("active");
    
    this.playNext();
  },
  
  /**
   *  Player#pause() -> undefined
   *  fires pause
   **/
  pause: function () {
    if(!this.nowPlaying.song)
      return;
    
    this.nowPlaying.sound.pause();
    this.elements.play.removeClass("active");
    da.controller.Player.fireEvent("pause", [this.nowPlaying.song]);
  },
  
  /**
   *  Player#playPause([song]) -> undefined
   *
   *  Checks if there is a paused song, if so, it'll be resumed.
   *  If there aren't any paused songs, the fallback `song`,
   *  if provided, will be played instead.
   *
   **/
  playPause: function (song) {
    if(!this.nowPlaying.song && song)
      this.play(song);
    
    if(this.nowPlaying.sound.paused) {
      this.play();
    } else
      this.pause();
  },
  
  /**
   *  Player#playPrev() -> undefined
   **/
  playPrev: function () {
    this.play(Song.findById(this.playlist[this._playlist_pos - 1]));
  },
  
  /**
   *  Player#getNext() -> String
   *  
   *  Returns the ID of the song that will be played next.
   **/
  getNext: function () {
    if(this.queue.length)
      return this.queue[0];
    
    if(this.playlist.length)
      return this.playlist[this._playlist_pos + 1];
  },
  
  /**
   *  Player#playNext() -> undefined
   **/
  playNext: function () {
    var next = this.getNext();
    if(!next)
      return;
    
    if(this.queue.length)
      this.queue.shift();
    if(this.playlist.length)
      this._playlist_pos++;
    
    this.play(Song.findById(next));
  },
  
  /**
   *  Player#positionNextPrev() -> undefined
   **/
  updateNextPrev: function () {
    var els  = this.elements,
        prev = this.playlist[this._playlist_pos - 1],
        next = this.getNext();
    
    prev = prev ? Song.findById(prev) : null;
    next = next ? Song.findById(next) : null;
    
    if(prev)
      els.prev
        .set("text", prev.get("title"))
        .show()
        .position({
          position: "centerLeft",
          edge:     "centerRight",
          relativeTo: els.play
        })
        .removeClass("inactive");
    else
      els.prev.hide().addClass("inactive");
    
    if(next)
      els.next
        .set("text", next.get("title"))
        .show()
        .position({
          position: "centerRight",
          edge:     "centerLeft",
          relativeTo: els.play
        })
        .removeClass("inactive");
    else
      els.next.hide().addClass("inactive");
    
    delete els;
    delete next;
    delete prev;
  },
  
  /**
   *  Player#preloadImages() -> undefined
   **/
  preloadImages: function () {
    var images = [
      "next", "next_active", "previous", "previous_active", "play",
        "album_cover_1", "album_cover_2", "album_cover_3"
      ],
      n = images.length,
      i = null;

    while(n--) {
      i = new Image();
      i.src = "resources/images/" + images[n] + ".png";
    }

    delete images;
    delete n;
  },
  
  /**
   *  Player.switchPlayMode(mode) -> undefined
   *  - mode (String): `normal` or `shuffle`.
   **/
  switchPlayMode: function (mode) {
    var old = this.play_mode;
    this.play_mode = mode;
    
    if(old === "shuffle" || mode === "shuffle") {
      var np = this.nowPlaying.song;
      if(old === "shuffle") {
        this.playlist = this._normalised_playlist || [];
        if(np)
          this._playlist_pos = this.playlist.indexOf(np.id);
        else
          this._playlist_pos = 0;

        delete this._normalised_playlist;
      } else if(mode === "shuffle") {
        this._normalised_playlist = this.playlist;
        // .shuffle() modifies the array itself
        this.playlist = $A(this.playlist).shuffle();
        
        // moving now playing song to the beginning of the playlist
        if(np)
          this.playlist.erase(np.id).unshift(np.id);
        
        this._playlist_pos = 0;
      }
      
      delete np;
    }
    
    
    $("player_toggle_shuffle_menu_item").set("text",
      mode === "shuffle" ? "Turn shuffle off" : "Turn shuffle on"
    );
    
    this.updateNextPrev();
  },
  
  /**
   *  Player#free() -> undefined
   *
   *  Frees memory taken by loaded songs. This method is ran about every 
   *  eight minutes and it destroys all SMSound objects which were played
   *  over eight minutes ago, ie. we're caching only about two songs in memory.
   *
   *  #### External resources
   *  * (The Universality of Song Length?)[http://a-candle-in-the-dark.blogspot.com/2010/02/song-length.html]
   *
   **/
  free: function () {
    var eight_mins_ago = (+ new Date()) - 8*60*1000;
    
    var sound;
    for(var id in this.sounds) {
      sound = this.sounds[id];
      if(this.sounds.hasOwnProperty(id)
      && (this.nowPlaying.song.id !== id)
      && (sound._last_played >= eight_mins_ago || !sound.loaded)) {
        console.log("Freed sound", id, sound._last_played);
        sound.destruct();
        delete this.sounds[id];
      }
    }
    
    sound = null;
  }
};

Player.initialize();

setInterval(function () {
  Player.free();
}, 8*60*1000);

/*
TODO: Should be moved to another controller, Statistics or something alike.
function findAverageDuration(callback) {
  da.db.DEFAULT.view({
    temporary: true,
    map: function (doc, emit) {
      if(doc._deleted || doc.type !== "Song" || !doc.duration)
        return;
    
      emit("duration", doc.duration);
    },
  
    reduce: function (key, values, rereduce) {
      var sum = 0, n = count = values.length;
      while(n--) sum += values[n];
      return {average: sum/count, sample: count};
    },
  
    finished: function (row) {
      var d = row.getRow("duration");
      if(d.average)
        Setting.create({
          id: "average_duration",
          value: d.average,
          sample: d.sample
        });
      
      console.log("average", d.average || 4*60*1000);
    }
  });
}
*/

/**
 * da.controller.Player
 **/
da.controller.Player = {
  /**
   *  da.controller.Player.play([song]) -> undefined
   *  - cap (da.db.DocumentTemplate.Song): the track to be played.
   *  fires play
   **/
  play: function (song) {
    Player.play(song);
  },
  
  /**
   *  da.controller.Player.pause() -> undefined
   *  fires pause
   *  
   *  Pauses the playback (if any).
   **/
  pause: function () {
    Player.pause();
  },
  
  /**
   *  da.controller.Player.queue(id) -> [String, ...]
   *  - id (String): location of the audio file.
   *  
   *  Adds file to the play queue and plays it as soon as currently playing
   *  file finishes playing (if any).
   *  
   *  Returned array contains queued songs.
   **/
  queue: function (id) {
    Player.queue.include(id);
    return Player.queue;
  },
  
  /**
   *  da.controller.Player.getNext() -> String
   *  Returns ID of the [[da.db.DocumentTemplate.Song]] which will be played next.
   **/
  getNext: function () {
    return Player.getNext();
  },
  
  /**
   *  da.controller.Player.getPrev() -> String
   *  Returns ID of the [[da.db.DocumentTemplate.Song]] which which was played before this one.
   **/
  getPrev: function () {
    return Player.playlist[Player._playlist_pos - 1];
  },
  
  /**
   *  da.controller.Player.setPlaylist(playlist) -> undefined
   *  - playlist ([String, ...]): array containing id's of [[da.db.DocumentTemplate.Song]] documents.
   **/
  setPlaylist: function (playlist) {
    if(!playlist || $type(playlist) !== "array")
      return false;
    
    if(Player.play_mode === "shuffle") {
      Player._normalised_playlist = $A(playlist);
      playlist.shuffle();
    }
    
    Player.playlist = playlist;
    if(Player.nowPlaying.song)
      Player._playlist_pos = playlist.indexOf(Player.nowPlaying.song.id)
    else
      Player._playlist_pos = 0;
    
    Player.updateNextPrev();
  },
  
  /**
   *  da.controller.Player.getPlaylist() -> [String, ...]
   *  Returns an array with ids of the songs belonging to the playlist.
   **/
  getPlaylist: function () {
    return Player.playlist;
  },
  
  /**
   *  da.controller.Player.nowPlaying() -> da.db.DocumentTemplate.Song
   **/
  nowPlaying: function () {
    return Player.nowPlaying.song;
  },
  
  /**
   *  da.controller.Player#setPlayMode(mode) -> undefined
   *  - mode (String): `normal`, `shuffle` or `repeat`. (all lowercase)
   **/
  setPlayMode: function (mode) {
    var old = Player.play_mode;
    if(!mode || mode === old)
      return false;
    
    Player.switchPlayMode(mode);
  },
  
  /**
   *  da.controller.Player#toggleMute() -> Boolean
   *  Returns `true` if the sound volume will be set to 0, `false` otherwise.
   **/
  toggleMute: function () {
    var muted = Player.nowPlaying.sound.muted;
    da.vendor.soundManager[muted ? "unmute" : "mute"]();
    $("player_mute_menu_item").set("text", muted ? "Mute" : "Unmute");
    
    return !muted;
  },
  
  _toggleShuffle: function () {
    if(Player.play_mode === "shuffle")
      this.setPlayMode("normal");
    else
      this.setPlayMode("shuffle");
  }
};
$extend(da.controller.Player, new Events());

da.app.fireEvent("ready.controller.Player", [], 1);

})();
