//#require "libs/db/DocumentTemplate.js"
/**
 *  class da.db.DocumentTemplate.Artist < da.db.DocumentTemplate
 *  hasMany: [[da.db.DocumentTemplate.Song]]
 *
 *  #### Standard properties
 *  - title (String): name of the artist
 *
 **/
 
(function () {
var DocumentTemplate = da.db.DocumentTemplate;

DocumentTemplate.registerType("Artist", new Class({
  Extends: DocumentTemplate,
  
  hasMany: {
    songs: "Song"
  }
}));

})();
