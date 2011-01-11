//#require "services/lastfm.js"
//#require "doctemplates/Artist.js"
//#require "libs/util/Goal.js"

(function () {
var lastfm = da.service.lastFm,
    Artist = da.db.DocumentTemplate.Artist,
    Goal = da.util.Goal;

var CACHE = {};

function fetchArtistInfo(search_params, artist, callback) {
  if(CACHE[artist.id]) {
    if(callback)
      callback(CACHE[artist.id]);
    
    return;
  }

  var info = {},
      fetch_data = new Goal({
        checkpoints: ["bio", "photos", "events", "toptracks", "topalbums"],
        onFinish: function () {
          CACHE[artist.id] = info;
          
          if(callback)
            callback(info);
          
          delete info;
          delete fetch_data;
        }
        /*,
        after: {
          mbid: function () {
            fetchArtistLinks(info.mbid, function (links) {
              if(links)
                info.links = links;
              
              fetch_data.checkpoint("links");
            });
          }
        } */
      });

  lastfm.artist.getInfo(search_params, {
    success: function (data) {
      data = data.artist;
      if(data.mbid && data.mbid.length) {
        info.mbid = data.mbid;
        search_params.mbid = data.mbid;
      }
      
      info.bio = data.bio;
      fetch_data.checkpoint("bio");
    },
    failure: function () {
      fetch_data.checkpoint("bio");
    }
  });
  
  lastfm.artist.getImages(search_params, {
    success: function (data) {
      data = data.images;
      if(!data.image)
        return fetch_data.checkpoint("photos");
      
      if($type(data.image) !== "array")
        data.image = [data.image];
      
      var images = data.image.slice(0, 10),
          n = images.length,
          sizes, m;
      
      while(n--) {
        sizes = images[n].sizes.size;
        m = sizes.length;
        images[n] = {};
        while(m--)
          images[n][sizes[m].name] = sizes[m]["#text"];
      }
      
      info.photos = images;
      info.more_photos_url = data.image[0].url;
      
      delete images;
      delete data;
      
      fetch_data.checkpoint("photos");
    },
    failure: function () {
      fetch_data.checkpoint("photos");
    }
  });
  
  lastfm.artist.getEvents(search_params, {
    success: function (data) {
      data = data.events;
      if(!data.event)
        return fetch_data.checkpoint("events");
      
      if($type(data.event) !== "array")
        data.event = [data.event];
      
      var events = data.event.slice(0, 10),
           n = events.length, event;
      
      while(n--) {
        event = events[n];
        if(+event.cancelled) {
          delete events[n];
          continue;
        }
        
        var loc = event.venue.location;
        events[n] = {
          id: event.id,
          title: [event.venue.name, loc.city, loc.country].join(", "),
          time: event.startDate,
          url: event.url 
        };
      }
      
      info.events = events.clean();
      delete events;
      delete event;
      delete data;
      
      fetch_data.checkpoint("events");
    },
    failure: function () {
      fetch_data.checkpoint("events");
    }
  });
  
  lastfm.artist.getTopTracks(search_params, {
    success: parseTop("track", info, fetch_data),
    failure: function () {
      fetch_data.checkpoint("toptracks");
    }
  });
  
  lastfm.artist.getTopAlbums(search_params, {
    success: parseTop("album", info, fetch_data),
    failure: function () {
      fetch_data.checkpoint("topalbums");
    }
  });
}

function parseTop(what, info, goal) {
  return function (data) {
    data = data["top" + what + "s"];
    if(!data[what])
      return goal.checkpoint("top" + what + "s");
    
    if($type(data[what]) !== "array")
      data[what] = [data[what]];
    
    var items = data[what].slice(0, 10),
         n = items.length,
         item;
    
    while(n--) {
      item = items[n];
      items[n] = {title: item.name};
      if(item.mbid && item.mbid.length)
        items[n].mbid = item.mbid;
    }
    
    info["top_" + what + "s"] = items;
    delete items;
    delete item;
    delete data;
      
    goal.checkpoint("top" + what + "s");
  }
}

/*
// Cross-domain XML: Fail (unless you use Flash)
function fetchArtistLinks(mbid, callback) {
  var req = new Request({
    url: "http://musicbrainz.org/ws/1/artist/" + mbid,
    onSuccess: function (_, data) {
      window.dx = data;
      console.log(data);
      
      //delete req;
    },
    onFailure: function () {
      if(callback)
        callback(false);
      
      //delete req;
    }
  });
  
  req.get({
    type: "xml",
    inc:  "url-rels"
  });
}
*/

/**
 *  da.service.artistInfo(artist, callback) -> undefined
 *  - artist (da.db.DocumentTemplate.Artist): artist whose info needs to be retireved.
 *  - callback (Function): function called when informations are fetched.
 **/
da.service.artistInfo = function artistInfo (artist, callback) {
  var search_params = {};
  if(artist.get("mbid"))
    search_params.mbid = artist.get("mbid");
  else
    search_params.artist = artist.get("title");
    
  fetchArtistInfo(search_params, artist, callback);
};

})();
