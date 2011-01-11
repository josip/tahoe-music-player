(function () {
var DocumentTemplate = da.db.DocumentTemplate,
    // We are separating the actual setting values from
    // information needed to display the UI controls.
    SETTINGS = {};

/**
 *  class da.db.DocumentTemplate.Setting < da.db.DocumentTemplate
 *  
 *  Class for represeting settings.
 *  
 *  #### Example
 *      da.db.DocumentTemplate.Setting.register({
 *        id:           "volume",
 *        group_id:     "general",
 *        representAs:  "Number",
 *        
 *        title:        "Volume",
 *        help:         "Configure the volume",
 *        value:        64
 *      });
 **/

var Setting = new Class({
  Extends: DocumentTemplate
});
DocumentTemplate.registerType("Setting", da.db.SETTINGS, Setting);

Setting.extend({
  /**
   *  da.db.DocumentTemplate.Setting.register(template) -> undefined
   *  - template.id (String): ID of the setting.
   *  - template.group_id (String | Number): ID of the group to which setting belongs to.
   *  - template.representAs (String): type of the data this setting represents. ex. `text`, `password`.
   *  - template.title (String): human-friendly name of the setting.
   *  - template.help (String): a semi-long description of what this setting is used for.
   *  - template.value (String | Number | Object): default value.
   *  - template.hidden (Boolean): if `true`, the setting will not be displayed in settings dialog.
   *    Defaults to `false`.
   *  - template.position (Number): position in the list.
   *   
   *  For list of possible `template.representAs` values see [[Settings.addRenderer]] for details.
   **/
  register: function (template) {
    SETTINGS[template.id] = {
      title: template.title,
      help: template.help,
      representAs: template.representAs || "text",
      position: typeof template.position === "number" ? template.position : -1
    };

    this.findOrCreate({
      properties: {id: template.id},
      onSuccess: function (doc, was_created) {
        if(was_created)
          doc.update({
            group_id: template.group_id,
            value:    template.value
          });
      }
    });
  },
  
  /**
   *  da.db.DocumentTemplate.Setting.findInGroup(group, callback) -> undefined
   *  - group (String | Number): ID of the group.
   *  - callback (Function): function called with all found settings.
   **/
  findInGroup: function (group, callback) {
    this.find({
      properties: {group_id: group},
      onSuccess: callback,
      onFailure: callback
    });
  },

  /**
   *  da.db.DocumentTemplate.Setting.getDetails(id) -> Object
   *  - id (String | Number): id of the setting.
   *
   *  Returns presentation-related details about the given setting.
   *  These details include `title`, `help` and `data` properties given to [[da.db.DocumentTemplate.Setting.register]].
   **/
  getDetails: function (id) {
    return SETTINGS[id];
  }
});

Setting.register({
  id:           "music_cap",
  group_id:     "caps",
  representAs:  "text",
  title:        "Music cap",
  help:         "Tahoe cap for the root dirnode in which all your music files are.",
  value:        ""
});

Setting.register({
  id:           "settings_cap",
  group_id:     "caps",
  representAs:  "text",
  title:        "Settings cap",
  help:         "Tahoe read-write cap to the dirnode in which settings will be kept.",
  value:        ""
});

/*
Setting.register({
  id:           "lastfm_enabled",
  group_id:     "lastfm",
  representAs:  "checkbox",
  title:        "Enable Last.fm scrobbler",
  help:         "Enable this if you whish to share music your are listening to with others.",
  value:        false,
  position:     0
});

Setting.register({
  id:           "lastfm_username",
  group_id:     "lastfm",
  representAs:  "text",
  title:        "Username",
  help:         "Type in your Last.fm username.",
  value:        "",
  position:     1
});

Setting.register({
  id:           "lastfm_password",
  group_id:     "lastfm",
  representAs:  "password",
  title:        "Password",
  help:         "Write down your Last.fm password.",
  value:        "",
  position:     2
});
*/

})();
