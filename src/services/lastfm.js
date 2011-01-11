//#require <services/services.js>
//#require "libs/vendor/LastFM.js"

(function () {
//var cache = new LastFMCache();
/**
 *  da.service.lastFm -> da.vendor.LastFM
 *  
 *  Default instance of `LastFM` API wrapper.
 *  
 **/
da.service.lastFm = new da.vendor.LastFM({
  apiKey:     "d5219a762390c878548b338d67a28f67",
  // not so secret anymore :)
  apiSecret:  "9ff1e4083ec6e86ef4467262db5b1509",
  cache:      null
});

})();
