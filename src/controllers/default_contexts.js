//#require "services/artistInfo.js"
//#require "services/recommendations.js"
//#require "services/musicVideo.js"
//#require "libs/ui/Dialog.js"
//#require "doctemplates/Song.js"
//#require "controllers/Player.js"

(function () {
var SongContext           = da.controller.SongContext,
    Song                  = da.db.DocumentTemplate.Song,
    Player                = da.controller.Player,
    Dialog                = da.ui.Dialog,
    fetchArtistInfo       = da.service.artistInfo,
    fetchRecommendations  = da.service.recommendations;

SongContext.register({
  id: "artist_info",
  title: "Artist",
  
  initialize: function (container) {
    this.el = container;
    var els = {
      photo_wrapper:  new Element("div", {id: "artist_photo_wrapper"}),
      photo:          new Element("img", {id: "artist_photo"}),
      photo_chooser:  new Element("div", {id: "artist_photo_chooser"}),
      zoomed_photo:   new Element("img", {id: "artist_photo_zoomed"}),
      bio:            new Element("div", {id: "artist_bio"}),
      stats:          new Element("div", {id: "artist_stats"}),
      top_songs:      new Element("ol",  {id: "artist_top_tracks", "class": "context_column"}),
      top_albums:     new Element("ol",  {id: "artist_top_albums", "class": "context_column middle_context_column"}),
      events:         new Element("ul",  {id: "artist_events",     "class": "context_column"})
    };
    
    var clear = new Element("div", {"class": "clear"});
    
    els.stats.adopt(els.top_songs, els.top_albums, els.events, clear);
    els.photo_wrapper.adopt(els.photo, els.photo_chooser);
    this.el.adopt(els.photo_wrapper, els.bio, clear.clone(), els.stats);
    
    els.photo_chooser.addEvent("click:relay(a)", function (event) {
      var index = event.target.retrieve("photo_index");
      if(typeof index === "number")
        this.switchPhoto(index);
    }.bind(this));
    
    this.photo_zoom = new Dialog({
      html: els.zoomed_photo
    });
    
    els.photo.addEvent("click", function (event) {
      this.elements.zoomed_photo.src = this.active_photo.original;
      this.photo_zoom.show();
    }.bind(this));
    
    els.top_songs.addEvent("click:relay(li)", function (event) {
      var index;
      if(event.target.nodeName.toLowerCase() === "a")
        index = event.target.parentNode.retrieve("list_position")
      else
        index = event.target.retrieve("list_position");
      
      if(typeof index !== "number")
        return;
      
      var song_data = this.artist_info.top_tracks[index];
      // TODO: Make an API for this type of things, it should also
      //        update the navigation columns to show the
      song_data.artist_id = this._current_artist.id;
      Song.findFirst({
        properties: song_data,
        onSuccess: function (song) {
          Player.play(song);
        }
      });
      
    }.bind(this));
    
    this.elements = els;
    this._current_artist = {id: null};
    delete els;
    delete clear;
  },
  
  show: $empty,
  hide: $empty,
  
  update: function (song) {
    song.get("artist", function (artist) {
      if(this._current_artist.id === artist.id)
        return !!SongContext.hideLoadingScreen();
      
      this._current_artist = artist;
      fetchArtistInfo(artist, function (info) {  
        this.artist_info = info;
        var els = this.elements;
        
        els.bio.innerHTML = info.bio.summary;
        els.photo.title = artist.get("title");
        this.switchPhoto(0);
        
        this.updatePhotoChooser();
        this.updateLists();
        
        SongContext.hideLoadingScreen();
    
        delete els;
      }.bind(this));
    }.bind(this));
  },
  
  updatePhotoChooser: function () {
    var pc      = this.elements.photo_chooser,
        info    = this.artist_info,
        photos  = info.photos,
        n       = photos.length,
        bullets = new Array(n);
    
    pc.dispose();
    pc.empty();
    
    while(n--)
      bullets[n] = (new Element("a", {
        html: "&bull;",
        href: "#"
      })).store("photo_index", n);
    
    bullets.push(new Element("a", {
      html: "+",
      href: info.more_photos_url,
      title: "More photos of " + this._current_artist.get("title"),
      target: "_blank"
    }));
    
    pc.adopt(bullets);
    this.elements.photo_wrapper.grab(pc);
    
    delete pc;
    delete bullets;
    delete photos;
    delete info;
  },
  
  updateLists: function () {
    var els         = this.elements,
        info        = this.artist_info,
        events      = info.events,
        n;
    
    this.renderList("Top Songs",  $A(info.top_tracks || []), els.top_songs);
    this.renderList("Top Albums", $A(info.top_albums || []), els.top_albums);
    this.renderList("Events",     $A(info.events || []),     els.events);
    
    var max_height = Math.max(
      els.top_songs.getHeight(),
      els.top_albums.getHeight(),
      els.events.getHeight()
    );
    els.top_albums.style.height = max_height + "px";
    
    delete els;
    delete info;
    delete events;
  },
  
  renderList: function (title, items, el) {
    var n = items.length;
    if(!n) {
      el.empty();
      return;
    }
    
    var item;
    while(n--) {
      item = items[n];
      items[n] = (new Element("li"))
        .store("list_position", n)
        .grab(new Element("a", {
          html:   item.title,
          title:  item.title,
          href:   item.url ? item.url : "#",
          target: item.url ? "_blank" : ""
        }));
    }

    el.empty().adopt(items);
    (new Element("li", {
      "class": "title",
      "html":  title
    })).inject(el, "top");
    
    delete el;
    delete items;
    delete item;
  },
  
  switchPhoto: function (n) {
    this.active_photo = this.artist_info.photos[n];
    this.elements.photo.src = this.active_photo.extralarge;
  }
});

SongContext.register({
  id: "recommendations",
  title: "Recommendations",
  
  initialize: function (container) {
    this.el = container;
    var els = {
      artists_title:  new Element("h4", {html: "Artist you might like"}),
      artists:        new Element("div", {id: "recommended_artists"}),
      songs_title:    new Element("h4", {html: "Songs you should check out"}),
      songs:          new Element("ul", {id: "recommended_songs", "class": "context_column"})
    };
      
    this.el.adopt(els.artists_title, els.artists, els.songs_title, els.songs);
    this.elements = els;
    delete els;
  },
  
  show: $empty,
  hide: $empty,
  
  update: function (song) {
    fetchRecommendations(song, function (rec) {
      this.updateArtists($A(rec.artists || []));
      this.updateSongs($A(rec.songs || []));
      delete rec;
      SongContext.hideLoadingScreen();
    }.bind(this));
  },
  
  updateArtists: function (recommendations) {
    this.elements.artists.empty();
    if(!recommendations.length)
      return !!this.elements.artists_title.hide();
    else
      this.elements.artists_title.show();
    
    recommendations = recommendations.slice(0, 5);
    var n = recommendations.length, rec;
    while(n--) {
      rec = recommendations[n];
      recommendations[n] = (new Element("a", {href: "#"}))
        .grab(new Element("img", {
          src:    rec.image,
          title:  rec.title
        }))
        .appendText(rec.title);
    }
    
    this.elements.artists.adopt(recommendations);
    delete recommendations;
    delete rec;
  },
  
  updateSongs: function (recommendations) {
    this.elements.songs.empty();
    if(!recommendations.length)
      return !!this.elements.songs_title.hide();
    else
      this.elements.songs_title.show();
    
    var n = recommendations.length, rec;
    while(n--) {
      rec = recommendations[n];
      recommendations[n] = (new Element("li"))
        .grab(new Element("a", {
          href: "#",
          html: "<strong>{title}</strong> by {artist}".interpolate(rec)
        }));
    }
    
    this.elements.songs.adopt(recommendations);
    delete recommendations;
    delete rec;
  }
});

SongContext.register({
  id: "videos",
  title: "Music Videos",
  
  initialize: function (container) {
    this.el = container;
    this.video = new Element("iframe", {
      id:           "youtube_music_video",
      type:         "text/html",
      width:        640,
      height:       385,
      frameborder:  0,
      "class":      "youtube-player"
    });
    this.search_results = new Element("ul", {
      id: "video_search_results",
      "class": "context_column no_selection"
    });
    
    this.search_results.addEvent("click:relay(li)", function (event, el) {
      var video_id = el.retrieve("video_id");
      
      if(typeof video_id === "undefined")
        return;
      
      this.video.src = "http://www.youtube.com/embed/" + video_id;
      this.video_dialog.show();
    }.bind(this));
    
    this.video_dialog = new Dialog({
      html: this.video,
      onShow: function () {
        Player.pause()
      },
      onHide: function () {
        this.video.src = "about:blank";
      }.bind(this)
    });
    
    this.el.grab(this.search_results);
  },
  
  show: $empty,
  hide: $empty,
  
  update: function (song) {
    SongContext.showLoadingScreen();
    da.service.musicVideo(song, this.updateSearchResults.bind(this));
  },
  
  updateSearchResults: function (results) {
    this.search_results.empty();
    
    if(!results)
      return;
    
    var n = results.length, video;
    
    while(n--) {
      video = results[n];
      results[n] = (new Element("li"))
        .store("video_id", video.id)
        .grab((new Element("a")).adopt(
          new Element("img", {
            src:   video.thumbnail.sqDefault,
            title: video.title
          }),
          new Element("strong", {
            html:     video.title
          }),
//          new Element("small", {
//            html:     (new Date(video.duration)).format("%M:%S")
//          }),
          new Element("p", {
            html: video.description.slice(0, 110) + "&hellip;"
          })
        ));
    }
    
    this.search_results.adopt(results);
    SongContext.hideLoadingScreen();
    delete results;
    delete video;
  }
});

})();
