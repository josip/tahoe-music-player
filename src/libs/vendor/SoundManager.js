//#require <libs/vendor/vendor.js>

(function () {
/**
 *  class da.vendor.SoundManager
 *  SoundManager2 class
 *  
 *  #### Links
 *  * http://www.schillmania.com/projects/soundmanager2/
 *  
 **/
/**
 * da.vendor.soundManager
 *  
 * Default instance of [[da.vendor.SoundManager]].
 *
 **/

// SoundManager depends on too much of window.* functions,
// thus making it in-efficient to load it inside another closure
// with da.vendor as alias for window.
//#require "libs/vendor/soundmanager/script/soundmanager2.js"

da.vendor.SoundManager = SoundManager;
da.vendor.soundManager = soundManager;
//SoundManager = null;
//soundManager = null;

var url = location.protocol + "//" + location.host + location.pathname.split("/").slice(0, -1).join("/"),
    path = location.pathname.contains("devel.html") ? "/libs/vendor/soundmanager/swf/" : "/resources/flash/";

$extend(da.vendor.soundManager, {
  useHTML5Audio:  false,
  url:            url + path,
  debugMode:      false,
  debugFlash:     false
});

})();
