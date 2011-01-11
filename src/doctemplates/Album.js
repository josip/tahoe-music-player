//#require "libs/db/DocumentTemplate.js"
/**
 *  class da.db.DocumentTemplate.Album < da.db.DocumentTemplate
 *  hasMany: [[da.db.DocumentTemplate.Song]]
 *  belongsTo: [[da.db.DocumentTemplate.Artist]]
 *  
 *  #### Standard properties
 *  * `title` - name of the album
 **/

(function () {
var DocumentTemplate = da.db.DocumentTemplate;

DocumentTemplate.registerType("Album", new Class({
  Extends: DocumentTemplate,
  
  hasMany: {
    songs: "Song"
  },
  
  belongsTo: {
    artist: "Artist"
  }
}));

})();
