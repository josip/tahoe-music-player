//#require <libs/vendor/vendor.js>

(function () {
//#require "libs/vendor/roar/Roar.js"

/**
 *  class da.vendor.Roar
 *
 *  Roar notifications library.
 *
 *  #### Links
 *  * [Roar project page](http://digitarald.de/project/roar/)
 *
 **/

da.vendor.Roar = Roar;

/**
 *  da.ui.ROAR = da.vendor.Roar
 *
 *  The default instance of [[da.vendor.Roar]].
 *
 **/
da.ui.ROAR = new Roar({
  position: "lowerLeft"
});

})();
