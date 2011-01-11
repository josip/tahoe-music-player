//#require "libs/db/DocumentTemplate.js"
//#require "libs/util/genres.js"

(function () {
var DocumentTemplate = da.db.DocumentTemplate,
    GENRES = da.util.GENRES;
/**
 *  class da.db.DocumentTemplate.Song < da.db.DocumentTemplate
 *  belongsTo: [[da.db.DocumentTemplate.Artist]], [[da.db.DocumentTemplate.Album]]
 *  
 *  #### Standard properties
 *  - `id` ([[String]]): Read-only cap of the file.
 *  - `title` ([[String]]): name of the song.
 *  - `track` ([[Numner]]): track number.
 *  - `year` ([[Number]]): year in which the track was published, `0` if the year
 *    is unkown.
 *  - `duration` ([[Number]]): length of the song in milliseconds.
 *  - `artist_id` ([[String]]): id of an [[da.db.DocumentTemplate.Artist]]
 *  - `album_id` ([[String]]): id of an [[da.db.DocumentTemplate.Album]]
 *  - `plays` ([[Number]]): number of full plays
 *  - `genre` ([[String]] | [[Number]]): id of the genre or name of the genre
 *    itself. If it's a number, it's a index of an [[da.util.GENRES]].
 *    `-1` if the genre isn't specified.
 *  - `mbid` ([[String]]): Musicbrainz ID
 *  - `lastfm_id` ([[String]]): Last.fm ID
 *
 **/

DocumentTemplate.registerType("Song", new Class({
  Extends: DocumentTemplate,
  
  belongsTo: {
    artist: "Artist",
    album: "Album"
  },

  /**
   *  da.db.DocumentTemplate.Song#getGenre() -> String
   *  Returns human-friendly name of the genre.
   **/
  getGenre: function () {
    return GENRES[this.get("genere")];
  }
}));

})();
