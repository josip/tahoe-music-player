//#require "libs/db/DocumentTemplate.js"

/**
 *  class da.db.DocumentTemplate.Playlist < da.db.DocumentTemplate
 *
 *  Class representing playlists
 *
 *  #### Standard properties
 *  - `title` (String): name of the playlist.
 *  - `description` (String): a few words about the playlist.
 *  - `song_ids` (Array): list of ID's of songs belonging to the playlist.
 **/

(function () {
var DocumentTemplate = da.db.DocumentTemplate;

DocumentTemplate.registerType("Playlist", new Class({
  Extends: DocumentTemplate
}));

/*
DocumentTemplate.Playlist.findOrCreate({
  properties: {id: "offline", },
  onSuccess: function (offline_playlist, was_created) {
    if(was_created)
      offline_playlist.update({
        title:        "Offline",
        description:  "Songs on this playlist will be available even after you go offline."
      });
  }
});
*/

})();
