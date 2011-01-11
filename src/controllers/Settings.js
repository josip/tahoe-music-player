//#require "doctemplates/Setting.js"
//#require "libs/ui/NavigationColumn.js"
//#require "libs/ui/Dialog.js"
//#require "libs/vendor/Roar.js"

(function () {
/** section: Controllers
 *  class Settings
 * 
 *  #### Notes
 *  This is private class.
 *  Public interface is accessible via [[da.controller.Settings]].
 **/

var Dialog            = da.ui.Dialog,
    NavigationColumn  = da.ui.NavigationColumn,
    Setting           = da.db.DocumentTemplate.Setting;

var GROUPS = [{
  id: "caps",
  title: "Caps",
  description: "Tahoe caps for your music and configuration files."
}];

// Renderers are used to render the interface elements for each setting (ie. the input boxes, checkboxes etc.)
// Settings and renderers are bound together via "representAs" property which
// defaults to "text" for each setting.
// All renderer has to do is to renturn a DIV element with "setting_box" CSS class
// which contains an element with "setting_<setting name>" element.
// That same element will be passed to the matching serializer.

var RENDERERS = {
  _label: function (setting, details) {
    var container = new Element("div", {
      "class": "setting_box"
    });
    return container.grab(new Element("label", {
      text: details.title + ":",
      "for": "setting_" + setting.id
    }));
  },
  
  text: function (setting, details) {
    return this._label(setting, details).grab(new Element("input", {
      type: "text",
      id: "setting_" + setting.id,
      value: setting.get("value")
   }));
  },
  
  password: function (setting, details) {
    var text = this.text(setting, details);
    text.getElement("input").type = "password";
    return text;
  },
  
  checkbox: function (setting, details) {
    var control = this._label(setting, details);
    control.getElement("label").empty().grab(new Element("input", {
      id: "setting_" + setting.id,
      type: "checkbox"
    }));
    control.getElement("input").checked = setting.get("value");
    control.grab(new Element("label", {
      text: details.title,
      "class": "no_indent",
      "for": "setting_" + setting.id
    }));
    return control;
  }
};
RENDERERS.numeric = RENDERERS.text;

// Serializers do the opposite job of the one that renderers do,
// they take an element and return its value which will be then stored to the DB.
var SERIALIZERS = {
  text: function (input) {
    return input.value;
  },
  
  password: function (input) {
    return input.value;
  },
  
  numeric: function (input) {
    return +input.value;
  },
  
  checkbox: function (input) {
    return input.checked;
  }
};

var Settings = {
  initialize: function () {
    this.dialog = new Dialog({
      title: "Settings",
      html:  new Element("div", {id: "settings"}),
      hideOnOutsideClick: false,
      closeButton: true
    });
    this._el = $("settings");
    this.column = new GroupsColumn({
      parentElement: this._el
    });
    
    var select_message = new Element("div", {
      html: "Click on a group on the left.",
      "class": "message"
    });
    this._controls = new Element("div", {id: "settings_controls"});
    this._controls.grab(select_message);
    this._el.grab(this._controls);

    this.initialized = true;
  },

  /**
   *  Settings.show() -> this 
   *  Shows the settings panel.
   **/
  show: function () {
    this.dialog.show();
    if(!this._adjusted_height) {
      this._title_height = this._el.getElement(".dialog_title").getHeight();
      this.column.toElement().setStyle("height", 300 - this._title_height);
      this._controls.style.height = (300 - this._title_height) + "px";
      this._adjusted_height = true;
    }
    
    return this;
  },

  /**
   *  Settings.hide() -> this
   *  Hides the settings panel.
   **/
  hide: function () {
    this.dialog.hide();
    return this;
  },

  /**
   *  Settings.renderGroup(groupName) -> this
   *  - groupName (String) name of the settings group whose panel
   *    is about to be rendered.
   **/
  renderGroup: function (group) {
    Setting.find({
      properties: {group_id: group.id},
      onSuccess: function (settings) {
        Settings.renderSettings(group.value, settings); 
      }
    });
  },

  /**
   *  Settings.renderSettings(settings) -> false | this
   *  - settings ([Settin]): settings for which controls need to be rendered.
   *
   *  Calls the rendering functions for each setting.
   *  
   **/
  renderSettings: function (group, settings) {
    if(!settings.length)
      return false;    
    if(this._controls)
      this._controls.empty();

    settings.sort(positionSort);
    var container = new Element("div"),
        header    = new Element("p", {
          html: group.description,
          "class": "settings_header"
        }),
        footer    = new Element("div", {"class": "settings_footer no_selection"}),
        apply_button = new Element("input", {
          type: "button",
          value: "Apply",
          id: "save_settings",
          events: {click: function () { Settings.save() }}
        }),
        revert_button = new Element("input", {
          type: "button",
          value: "Revert",
          id: "revert_settings",
          events: {click: function () { Settings.renderSettings(group, settings) }}
        }),
        settings_el = new Element("form");

    container.grab(header);

    var n = settings.length, setting, details;
    while(n--) {
      setting = settings[n];
      details = Setting.getDetails(setting.id);      
      RENDERERS[details.representAs](setting, details).inject(settings_el, "top");
    }
  
    footer.adopt(revert_button, apply_button);    
    container.adopt(settings_el, footer);
    this._controls.grab(container); 
    return this;
  },
  
  save: function () {
    var settings = this.serialize(), setting;

    for(var id in settings)
      Setting.findById(id).update({value: settings[id]});
    
    da.ui.ROAR.alert("Saved", "Your settings have been saved");
  },
  
  serialize: function () {
    var values = this._controls.getElement("form").getElements("input[id^=setting_]"),
        serialized = {},
        // fun fact: in combo with el.id.slice is approx. x10 faster
        // than el.id.split("setting_")[1]
        setting_l = "setting_".length,
        n = values.length;
  
    while(n--) {
      var el = values[n],
          setting_name = el.id.slice(setting_l),
          details = Setting.getDetails(setting_name);
      serialized[setting_name] = SERIALIZERS[details.representAs](el);
    }
    
    return serialized;
  },
  
  /**
   *  Settings#free() -> undefined
   *
   *  About a minute after last [[da.controller.Settings.hide]] call,
   *  all DOM nodes created by settings dialog will be destroyes - thus
   *  freeing memory.
   *  
   **/
  free: function () {
    Settings.initialized = false;
  
    Settings.column.destroy();
    Settings.dialog.destroy();
  
    delete Settings.column;
    delete Settings.dialog;
    delete Settings._el;
    delete Settings._controls;
  }
};
$extend(Settings, new Events());

function positionSort(a, b) {
  a = Setting.getDetails(a.id).position;
  b = Setting.getDetails(b.id).position;
  
  return (a < b) ? -1 : ((a > b) ? 1 : 0);
}

var GroupsColumn = new Class({
  Extends: NavigationColumn,

  view: null,

  initialize: function (options) {
    options.totalCount = GROUPS.length; 
    this.parent(options);
    
    this.addEvent("click", function (item) {
      Settings.renderGroup(item);
    });
  },

  getItem: function (n) {
    var group = GROUPS[n];
    return {id: group.id, value: group};
  }
});

var destroy_timeout;
/**
 * da.controller.Settings
 *
 * Public interface of the settings controller.
 **/
da.controller.Settings = {
  /**
   *  da.controller.Settings.registerGroup(config) -> this
   *  - config.id (String): name of group.
   *  - config.title (String): human-friendly name of the group.
   *  - config.description (String): brief explanation of what this group is for.
   *    The description will be displayed at the top of settings dialog.
   **/
  registerGroup: function (config) {
    GROUPS.push(config);
    
    return this;
  },

  /**
   *  da.controller.Settings.addRenderer(name, renderer) -> this
   *  - name (String): name of the renderer.
   *    [[da.db.DocumentTemplate.Setting]] uses this in `representAs` property.
   *  - renderer (Function): function which renderes specific setting.
   *
   *  As first argument `renderer` function takes [[Setting]] object,
   *  while the second one is the result of [[da.db.DocumentTemplate.Setting.getDetails]].
   *
   *  The function *must* return an [[Element]] with `setting_box` CSS class name.
   *  The very same element *must* contain another element whose `id` attribute
   *  must mach following pattern: `setting_<setting id>`. ie. it should
   *  return something like:
   *
   *      <div class="setting_box">
   *        <label for="setting_first_name">Your name:</label>
   *        <input type="text" id="setting_first_name"/>
   *      </div>
   *
   *  That element will be passed to the serializer function.
   *
   *  #### Default renderers
   *  * `text`
   *  * `numeric` (same as `text`, the only difference is in the serializer
   *    which will convert value into [[Number]])
   *  * `password`
   *  * `checkbox`
   *
   **/
  addRenderer: function (name, fn) {
    if(!(name in RENDERERS))
      RENDERERS[name] = fn;
    
    return this;
  },
  
  /**
   *  da.controller.Settings.addSerializer(name, serializer) -> this
   *  - name (String): name of the serializer. Usually the same name used by matching renderer.
   *  - serializer (Function): function which returns value stored by rendered UI controls.
   *    Function takes exactly one argument, the `setting_<setting id>` element.
   **/
  addSerializer: function (name, serializer) {
    if(!(name in SERIALIZERS))
      SERIALIZERS[name] = serializer;
    
    return this;
  },
  
  /**
   *  da.controller.Settings.show() -> undefined
   *
   *  Shows the settings dialog.
   **/
  show: function () {
    clearTimeout(destroy_timeout);
    if(!Settings.initialized)
      Settings.initialize();
    
    Settings.show();
  },
  
  /**
   *  da.controller.Settings.hide() -> undefined
   *
   *  Hides the settings dialog.
   *  Changes to the settings are not automatically saved when dialog
   *  is dismissed.
   **/
  hide: function () {
    Settings.hide();
    destroy_timeout = setTimeout(Settings.free, 60*60*1000);
  },
  
  /**
   *  da.controller.Settings.showGroup(group) -> undefined
   *  - group (String): group's id.
   **/
  showGroup: function (group) {
    this.show();
    
    var n = GROUPS.length;
    while(n--)
      if(GROUPS[n].id === group)
        break;
    
    Settings.renderGroup({id: group, value: GROUPS[n]});
  }
};

da.app.fireEvent("ready.controller.Settings", [], 1);
})();

