//#require <libs/vendor/vendor.js>

(function () {
/**
 *  class da.vendor.Persist
 *  
 *  Persist.JS
 *
 *  #### Links
 *  * [PersistJS project page](http://google.com)
 **/
 
// tiny hack which allows us to use
// index_devel.html
if(typeof Persist === "undefined") {
  var Persist;
//#require "libs/vendor/persist-js/src/persist.js"
  da.vendor.Persist = Persist;
} else
  da.vendor.Persist = window.Persist;

})();
