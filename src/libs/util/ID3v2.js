//#require "libs/util/BinaryFile.js"
/** section: ID3
 *  class da.util.ID3v2Parser
 *  
 *  ID3 v2 parser implementation based on [Mutagen](http://code.google.com/p/mutagen) and
 *  [ruby-mp3info](http://ruby-mp3info.rubyforge.org) libraries.
 *  
 *  #### Known frames
 *  This is the list of frames that this implementation by default can parse - only those that are needed to get
 *  the basic information about song. Others can be added via da.util.ID3v2Parser.addFrameParser.
 *  
 *  * TRCK
 *  * TIT1
 *  * TIT2
 *  * TIT3
 *  * TPE1
 *  * TPE2
 *  * TALB
 *  * TYER
 *  * TIME
 *  * TCON
 *  * WOAR
 *  * WXXX
 *  * USLT - not parsed by default but frame decoder is present
 *  
 *  As well as their equivalents in ID3 v2.2 specification.
 *  
 *  #### Notes
 *  All methods except for `addFrameParser` are private.
 *  
 *  #### External resources
 *  * [ID3v2.4 specification](http://www.id3.org/id3v2.4.0-structure)
 *  * [ID3v2.4 native frames](http://www.id3.org/id3v2.4.0-frames)
 *  * [ID3v2.3 specification](http://www.id3.org/id3v2.3.0)
 *  * [ID3v2.2 specification](http://www.id3.org/id3v2-00) -- obsolete
 **/
 
(function () {
/** section: ID3
 * da.util.ID3v2Parser.frameTypes
 * 
 *  Contains know ID3v2 frame types.
 **/
var BinaryFile    = da.util.BinaryFile,
    CACHE         = [],
    GENRE_REGEXP  = /^\(?(\d+)\)?|(.+)/,
    //BE_BOM        = "\xFE\xFF",
    //LE_BOM        = "\xFF\xFE",
    UNSYNC_PAIR   = /(\uF7FF\0)/g,
    FFLAGS = {
      ALTER_TAG_23:   0x8000,
      ALTER_FILE_23:  0x4000,
      READONLY_23:    0x2000,
      COMPRESS_23:    0x0080,
      ENCRYPT_23:     0x0040,
      GROUP_23:       0x0020,

      ALTER_TAG_24:   0x4000,
      ALTER_FILE_24:  0x2000,
      READONLY_24:    0x1000,
      GROUPID_24:     0x0040,
      COMPRESS_24:    0x0008,
      ENCRYPT_24:     0x0004,
      UNSYNC_24:      0x0002,
      DATALEN_24:     0x0001
    },

FrameType = {
  /**
   *  da.util.ID3v2Parser.frameTypes.text(offset, size) -> String
   **/
  text: function (offset, size) {
    var d = this.data;
    
    if(d.getByteAt(offset) === 1) {
      // Unicode is being used, and we're trying to detect Unicode BOM.
      // (we don't actually care if it's little or big endian)
      //var test_string = d.getStringAt(offset, 5),
      //    bom_pos = test_string.indexOf(LE_BOM);
      //if(bom_pos === -1)
      //  bom_pos = test_string.indexOf(BE_BOM);
        
      //offset += bom_pos + 1;
      //size -= bom_pos + 1;
      
      if(d.getByteAt(offset + 1) + d.getByteAt(offset + 2) === 255 + 254) {
        console.log("Unicode BOM detected");
        offset += 2;
        size -= 2;
      }
    }
    
    return d.getStringAt(offset + 1, size - 1).strip();
  },
  
  /**
   *  da.util.ID3v2Parser.frameTypes.textNumeric(offset, size) -> String
   **/
  textNumeric: function(offset, size) {
    return +FrameType.text.call(this, offset, size);
  },
  
  /**
   *  da.util.ID3v2Parser.frameTypes.link(offset, size) -> String
   **/
  link: function (offset, size) {
    return this.data.getStringAt(offset, size).strip();
  },
  
  /**
   *  da.util.ID3v2Parser.frameTypes.userLink(offset, size) -> String
   **/
  userLink: function (offset, size) {
    var str = this.data.getStringAt(offset, size);
    return str.slice(str.lastIndexOf("\0") + 1);
  },
  
  /**
   *  da.util.ID3v2Parser.frameTypes.unsyncedLyrics(offset, size) -> String
   **/
  unsyncedLyrics: function (offset, size) {
    var is_utf8 = this.data.getByteAt(offset) === 1,
        lang    = this.data.getStringAt(offset += 1, 3);
    
    return this.data.getStringAt(offset += 3, size - 4).strip();
  },
  
  ignore: $empty
},

FRAMES = {
  // ID3v2.4 tags
  //SEEK: $empty,
  
  // ID3v2.3 tags
  TRCK: function (offset, size) {
    var data = FrameType.text.call(this, offset, size);
    return +data.split("/")[0];
  },
  TIT1: FrameType.text,
  TIT2: FrameType.text,
  TIT3: FrameType.text,
  TPE1: FrameType.text,
  TPE2: FrameType.text,
  TALB: FrameType.text,
  TYER: FrameType.textNumeric,
  //TIME: $empty,
  TCON: function (offset, size) {
    // Genre, can be either "(123)Genre", "(123)" or "Genre".
    var data = FrameType.text.call(this, offset, size),
        match = data.match(GENRE_REGEXP);
   
    if(!match)
      return -1;
    if(match[1])
      return +match[1];
    if(match[2])
      return match[2].strip();
    return -1;
  },
  //USLT: FrameType.unsyncedLyrics,
  WOAR: FrameType.link,
  WXXX: FrameType.userLink
};

// ID3v2.2 tags (the structure is the same as in later versions, but they use different names)
$extend(FRAMES, {
  UFI: FRAMES.UFID,
  TT1: FRAMES.TIT1,
  TT2: FRAMES.TIT2,
  TT3: FRAMES.TIT3,
  TP1: FRAMES.TPE1,
  TP2: FRAMES.TPE2,
  TP3: FRAMES.TPE3,
  TP4: FRAMES.TPE4,
  TAL: FRAMES.TALB,
  TRK: FRAMES.TRCK,
  TYE: FRAMES.TYER,
  TPB: FRAMES.TPUB,
  ULT: FRAMES.USLT,
  WAR: FRAMES.WOAR,
  WXX: FRAMES.WXXX
});

var ID3v2Parser = new Class({
  /**
   *  new da.util.ID3v2Parser(data, options, request)
   *  - data (BinaryFile): tag.
   *  - options.onSuccess (Function): function which will be called once tag is parsed.
   *  - request (Request.Binary): original HTTP request object.
   **/
  initialize: function (data, options, request) {
    this.options = options;
    
    this.data = data;
    this.data.bigEndian = true;
    
    this.header = {};
    this.frames = {};
    
    this._request = request;
    
    if(CACHE[options.url])
      options.onSuccess(CACHE[options.url]);
    else
      this.parse();
  },
  
  /**
   *  da.util.ID3v2Parser#parse() -> undefined
   *  Parses the tag. If size of tag exceeds current data (and it usually does)
   *  another HTTP GET request is issued to get the rest of the file.
   **/
  /**
   *  da.util.ID3v2Parser#header -> {majorVersion: 0, minorVersion: 0, flags: 0, size: 0}
   *  Parsed ID3 header.
   **/
  /**
   *  da.util.ID3v2Parser#version -> 2.2 | 2.3 | 2.4
   **/
  parse: function () {
    this.header = this.data.unpack("xxx2ii4s").associate([
      'majorVersion', 'minorVersion', "flags", "size"
    ]);
    this.version = 2 + (this.header.majorVersion/10) + this.header.minorVersion;
    this.header.size = this.unpad(this.header.size, 7) + 10;
    
    this.parseFlags();
    
    if(this.data.length >= this.header.size)
      return this.parseFrames();
    
    this._request.options.range = [0, this.header.size];
    // Removing event listeners which were added by ID3
    this._request.removeEvents('success');
    this._request.addEvent('success', function (data) {
      this.data = data;
      this.parseFrames();
    }.bind(this));
    this._request.send();
  },
  
  /**
   *  da.util.ID3v2Parser#parseFlags() -> undefined
   *  Parses header flags.
   **/
   /**
    *  da.util.ID3v2Parser#flags -> {unsync_all: false, extended: false, experimental: false, footer: false}
    *  Header flags.
   **/
  parseFlags: function () {
    var flags = this.header.flags;
    this.flags = {
      unsync_all:   !!(flags & 0x80),
      extended:     !!(flags & 0x40),
      experimental: !!(flags & 0x20),
      footer:       !!(flags & 0x10)
    };
  },
  
  /**
   *  da.util.ID3v2Parser#parseFrames() -> undefined
   *  Calls proper function for parsing frames depending on tag's version.
   **/
  parseFrames: function () {
    console.log("parsing ID3v" + this.version + " tag", this.options.url);
    
    if(this.version >= 2.3)
      this.parseFrames_23();
    else
      this.parseFrames_22();
    
    CACHE[this.options.url] = this.frames;
    this.options.onSuccess(this.simplify(), this.frames);
  },

  /**
   *  da.util.ID3v2Parser#parseFrames_23() -> undefined
   *  Parses ID3 frames from ID3 v2.3 and newer.
   **/
  parseFrames_23: function () {
    if(this.version >= 2.4 && this.flags.unsync_all)
      this.unsync();
    
    var offset = 10,
        ext_header_size = this.data.getStringAt(offset, 4),
        tag_size = this.header.size;
    
    // Some tagging software is apparently know for setting
    // "extended header present" flag but then ommiting it from the file,
    // which means that ext_header_size will be equal to name of a frame.
    if(this.flags.extended && !FRAMES[ext_header_size]) {
      if(this.version >= 2.4)
        ext_header_size = this.unpad(ext_header_size) - 4;
      else
        ext_header_size = this.data.getLongAt(10);
      
      offset += ext_header_size;
    }
    
    var foffset, frame_name, frame_size, frame_size_ajd, frame_flags;
    while(offset < tag_size) {
      foffset     = offset;
      frame_name  = this.data.getStringAt(foffset, 4);
      frame_size  = frame_size_adj = this.unpad(foffset += 4, 4);
      frame_flags = this.data.getShortAt(foffset += 5); 
      foffset += 1;
      
      if(!frame_size) {
        break;
      }
      
      if(this.version >= 2.4) {
        if(frame_flags & (FFLAGS.COMPRESS_24 | FFLAGS.DATALEN_24)) {
          foffset         += 4;
          frame_size      -= 1;
          frame_size_adj  -= 5;
        }
        //if(!this.flags.unsync_all && (frame_flags & FFLAGS.UNSYNC_24))
        //  this.unsync(offset, frame_size_);
      } else {
        if(frame_flags & FFLAGS.COMPRESS_23) {
          console.log("Compressed frame. Sorry.", self.options.url);
          foffset += 4;
        }
      }
      
      if(FRAMES[frame_name])
        this.frames[frame_name] = FRAMES[frame_name].call(this, foffset, frame_size_adj);
      
      //console.log("parsed frame", [frame_name, this.frames[frame_name]]);
      offset += frame_size + 10;
    }
  },
  
  /**
   *  da.util.ID3v2Parser#parseFrames_22() -> undefined
   *  Parses ID3 frames from ID3 v2.2 tags.
   **/
  parseFrames_22: function () {
    var offset = 10,
        tag_size = this.header.size,
        foffset, frame_name, frame_size;
    
    while(offset < tag_size) {
      foffset = offset;
      frame_name = this.data.getStringAt(foffset, 3);
      frame_size = (new BinaryFile(
        "\0" + this.data.getStringAt(foffset += 3, 3),
        {bigEndian:true}
      )).getLongAt(0);
      foffset += 3;
      
      if(!frame_size)
        break;
      
      if(FRAMES[frame_name] && frame_size)
        this.frames[frame_name] = FRAMES[frame_name].call(this, foffset, frame_size);
      
      //console.log(frame_name, this.frames[frame_name], [foffset, frame_size]);
      offset += frame_size + 6;
    }
  },

  /**
   *  da.util.ID3v2Parser#unpad(offset, length[, bits = 8]) -> Number
   *  da.util.ID3v2Parser#unpad(string, bits) -> Number
   *  - offset (Number): offset from which so start unpadding.
   *  - length (Number): length string to unpad.
   *  - bits (Number): number of bits used.
   *  - string (String): String to unpad.
   **/
  unpad: function (offset, size, bits) {
    bits = bits || 8;
    var mask = (1 << bits) - 1,
        bytes = [],
        numeric_value = 0,
        data = this.data;
    
    if(typeof offset === "string") {
      data = new BinaryFile(offset, {bigEndian: true});
      if(size)
        bits = size;
      size = offset.length;
      offset = 0;
    }
    
    if(size) {
      for(var n = offset, m = n + size; n < m; n++)
        bytes.push(data.getByteAt(n) & mask);
      
      bytes.reverse();
    } else {
      var value = data.getByteAt(offset);
      while(value) {
        bytes.push(value & mask);
        value >>= 8;
      }
    }
    
    for(var n = 0, i = 0, m = bytes.length * bits; n < m; n+=bits, i++)
      numeric_value += bytes[i] << n;
    
    return numeric_value;
  },
  
  /**
   *  da.util.ID3v2Parser#unsync() -> undefined
   *  da.util.ID3v2Parser#unsync(offset, length) -> undefined
   *
   *  Unsyncs the data as per ID3 specification.
   *
   **/
  unsync: function (n, m) {
    if(arguments.length) {
      var data = this.data.data,
          part = data
            .slice(n, m)
            .replace(UNSYNC_PAIR, String.fromCharCode(0xF7FF));
      
      this.data.data = data.slice(0, n).concat(part, data.slice(n + m));
    } else
      this.data.data = this.data.data.replace(UNSYNC_PAIR, String.fromCharCode(0xF7FF));
    
    this.data.length = this.data.data.length;
  },
  
  /**
   *  da.util.ID3v2Parser#simplify() -> Object
   *  
   *  Returns humanised version of data parsed from frames.
   *  Returned object contains these values (in brackets are used frames or default values):
   *  
   *  * title (`TIT2`, `TT2`, `"Unknown"`)
   *  * album (`TALB`, `TAL`, `"Unknown"`)
   *  * artist (`TPE2`, `TPE1`, `TP2`, `TP1`, `"Unknown"`)
   *  * track (`TRCK`, `TRK`, `0`)
   *  * year (`TYER`, `TYE`, `0`)
   *  * genre (`TCON`, `TCO`, `0`)
   *  * lyrics (`USLT`, `ULT`, _empty string_)
   *  * links: official (`WOAR`, `WXXX`, `WAR`, `WXXX`, _empty string_)
   **/
  simplify: function () {
    var f = this.frames;
    return !f || !$H(f).getKeys().length ? {} : {
      title:  f.TIT2 || f.TT2 || "Unknown",
      album:  f.TALB || f.TAL || "Unknown",
      artist: f.TPE2 || f.TPE1 || f.TP2 || f.TP1 || "Unknown",
      track:  f.TRCK || f.TRK || 0,
      year:   f.TYER || f.TYE || 0,
      genre:  f.TCON || f.TCO || -1,
      links: {
        official: f.WOAR || f.WXXX || f.WAR || f.WXX || ""
      }
    };
  },
  
  /**
   *  da.util.ID3v2Parser#destroy() -> undefined
   **/
  destroy: function () {
    this.data.destroy();
    delete this.data;
    delete this.options;
    delete this._request;
  }
});

ID3v2Parser.extend({
  /**
   *  da.util.ID3v2Parser.range -> [0, 14]
   *  
   *  Default position of ID3v2 header, including extended header.
   **/
  range: [0, 10 + 4],
  
  /**
   *  da.util.ID3v2Parser.test(data) -> Boolean
   *  - data (BinaryFile): the tag.
   *  
   *  Checks if data begins with `ID3` and major version is less than 5.
  **/
  test: function (data) {
    return data.getStringAt(0, 3) === "ID3" && data.getByteAt(3) <= 4;
  },
  
  /**
   *  da.util.ID3v2Parser.addFrameParser(frameName, fn) -> da.util.ID3v2Parser
   *  - frameName (String): name of the frame.
   *  - fn (Function): function which will parse the data.
   *  
   *  Use this method to add your own ID3v2 frame parsers. You can access this as `da.util.ID3v2Parser.addFrameParser`.
   *  
   *  `fn` will be called with following arguments:
   *  * offset: position at frame appears in data
   *  * size: size of the frame, including header
   *  
   *  `this` keyword inside `fn` will refer to an instance of [[da.util.ID3v2Parser]].
   **/
  addFrameParser: function (name, fn) {
    FRAMES[name] = fn;
    return this;
  }
});

ID3v2Parser.frameTypes = FrameType;
da.util.ID3v2Parser = ID3v2Parser;
da.util.ID3.parsers.push(ID3v2Parser);

})();
