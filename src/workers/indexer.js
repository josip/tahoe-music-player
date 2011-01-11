/**
 *  == Workers ==
 *  
 *  Web Workers used to dispach computation-heavy work into background.
 **/

/** section: Workers, related to: CollectionScanner
 * Indexer
 * 
 *  This Worker is responsible for fetching MP3 files and then
 *  extracting ID3 metadata, which could grately slowup the interface.
 *
 *  Messages sent to this worker have to contain only a read-cap to
 *  an MP3 file stored in Tahoe (without /uri/ prefix).
 *
 *  Messages sent from this worker are objects returned by ID3 parser. 
 *
 *  #### Notes
 *  It has been detected that Tahoe (to be correct, it's web server) can't
 *  handle well large number of simoultanious requests, therefore we're limiting
 *  the number of files that can be fetched at the same time to one.
 *  
 *  Since it's also possible that it will take more time for the [[Scanner]]
 *  to find all the files than it will take the [[Indexer]] we're allowing
 *  about 30-second delay before finally sending the "I'm done" message to the
 *  [[da.controller.CollectionScanner]].
 *
 **/

var window = this,
    document = {},
    queue = [];

this.da = {};

var console = {
  log: function (msg, obj) {
    postMessage({debug: true, msg: msg, obj: obj});
  }
};

//#require "libs/vendor/mootools-1.2.4-core-server.js"
//#require "libs/vendor/mootools-1.2.4-request.js"
//#require <libs/util/util.js>
//#require "libs/util/BinaryFile.js"
//#require "libs/util/ID3.js"

var ID3 = da.util.ID3;
/**
 *  Indexer.onMessage(event) -> undefined
 *  - event (Event): DOM event.
 *  - event.data (String): Tahoe URI cap for an file.
 *  
 *  When tags are parsed, `postMessage` is called.
 **/
onmessage = function (event) {  
  queue.push(event.data);
  
  if(queue.length === 1)
    getTags(event.data);
};

function getTags(cap) {
  if(!cap)
    return false;
  
  var parser = new ID3({
    url: "/uri/" + encodeURIComponent(cap),
    
    onSuccess: function (tags) {
      if(tags && typeof tags.title !== "undefined" && typeof tags.artist !== "undefined") {
        tags.id = cap;
        postMessage(tags);
      }
      
      parser.destroy();
      delete parser;
      
      queue.erase(cap);
      checkQueue();
    },
    
    onFailure: function (calledBy) {
      console.log("Failed to parse ID3 tags for", [cap, calledBy]);
      parser.destroy();
      delete parser;
      
      queue.erase(cap);
      checkQueue();
    }
  });
}

var finish_timeout;
function checkQueue() {
  if(!queue.length)
    finish_timeout = setTimeout(finish, 3*60*1000);
  else {
    clearTimeout(finish_timeout);
    setTimeout(function () {
      getTags(queue[0]);
    }, 444);
  }
}

function finish () {
  if(!queue.length)
    postMessage("**FINISHED**");
  else
    checkQueue();
}
