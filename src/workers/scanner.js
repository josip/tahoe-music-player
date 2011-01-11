/** section: Workers
 * Scanner
 *  
 *  Scanner worker recursively scans the given root direcory for any type of files.
 *  Messages sent to this worker should contain a directory cap (without `/uri/` part).
 *  Messages sent from this worker are strings with read-only caps for each found file.
 **/
 
var window = this,
    document = {},
    queue = [];

var console = {
  log: function (msg, obj) {
    postMessage({debug: true, msg: msg, obj: obj});
  }
};

this.da = {};

//#require "libs/vendor/mootools-1.2.4-core-server.js"
//#require "libs/vendor/mootools-1.2.4-request.js"
//#require "libs/TahoeObject.js"

var TahoeObject = da.util.TahoeObject;

/**
 *  Scanner.scan(object) -> undefined
 *  - object (TahoeObject): an Tahoe object.
 *  
 *  Traverses the `object` until it finds a file.
 *  File's cap is then reported to the main thread via `postMessage`.
 *  
 **/
function scan (obj) {
  console.log("Inspecting cap", obj.uri);
  
  obj.get(function () {  
    if(obj.type === "filenode") {
      postMessage(obj.uri);
      queue.erase(obj.uri);
      checkQueue();
      return;
    }
    
    var n = obj.children.length,
        child;
    while(n--) {
      child = obj.children[n];
      
      if(child.type === "filenode")
        postMessage(child.ro_uri);
      else
        queue.push(child.ro_uri);
    }
    
    queue.erase(obj.uri);
    checkQueue();
  });
}

function checkQueue() {
  if(queue.length)
    setTimeout(function() {
      scan(new TahoeObject(queue.shift()))
    }, 444);
  else
    postMessage("**FINISHED**");
}

/**
 *  Scanner.onmessage(event) -> undefined
 *  - event.data (String): Tahoe cap pointing to root directory from which scanning should begin.
 **/
onmessage = function (event) {
  queue.push(event.data);
  
  if(queue.length === 1)
    scan(new TahoeObject(event.data));
};
