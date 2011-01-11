/*

  SoundManager 2 Demo: "Page as playlist"
  ----------------------------------------------
  http://schillmania.com/projects/soundmanager2/

  An example of a Muxtape.com-style UI, where an
  unordered list of MP3 links becomes a playlist

  Flash 9 "MovieStar" edition supports MPEG4
  audio and video as well.

  Requires SoundManager 2 Javascript API.

*/

function PagePlayer(oConfigOverride) {
  var self = this;
  var pl = this;
  var sm = soundManager; // soundManager instance
  // sniffing for favicon stuff/IE workarounds
  var isIE = navigator.userAgent.match(/msie/i);
  var isOpera = navigator.userAgent.match(/opera/i);
  var isFirefox = navigator.userAgent.match(/firefox/i);

  this.config = {
    flashVersion: 8,        // version of Flash to tell SoundManager to use - either 8 or 9. Flash 9 required for peak / spectrum data.
    usePeakData: false,     // [Flash 9 only]: show peak data
    useWaveformData: false, // [Flash 9 only]: enable sound spectrum (raw waveform data) - WARNING: CPU-INTENSIVE: may set CPUs on fire.
    useEQData: false,       // [Flash 9 only]: enable sound EQ (frequency spectrum data) - WARNING: Also CPU-intensive.
    fillGraph: false,       // [Flash 9 only]: draw full lines instead of only top (peak) spectrum points
    allowRightClick:true,   // let users right-click MP3 links ("save as...", etc.) or discourage (can't prevent.)
    useThrottling: true,   // try to rate-limit potentially-expensive calls (eg. dragging position around)
    autoStart: false,       // begin playing first sound when page loads
    playNext: true,         // stop after one sound, or play through list until end
    updatePageTitle: true,  // change the page title while playing sounds
    emptyTime: '-:--',      // null/undefined timer values (before data is available)
    useFavIcon: false       // try to show peakData in address bar (Firefox + Opera) - may be too CPU heavy
  }

  sm.debugMode = (window.location.href.toString().match(/debug=1/i)?true:false); // enable with #debug=1 for example

  this._mergeObjects = function(oMain,oAdd) {
    // non-destructive merge
    var o1 = {}; // clone o1
    for (var i in oMain) {
      o1[i] = oMain[i];
    }
    var o2 = (typeof oAdd == 'undefined'?{}:oAdd);
    for (var o in o2) {
      if (typeof o1[o] == 'undefined') o1[o] = o2[o];
    }
    return o1;
  }

  if (typeof oConfigOverride != 'undefined' && oConfigOverride) {
    // allow overriding via arguments object
    this.config = this._mergeObjects(oConfigOverride,this.config);
  }

  this.css = {             // CSS class names appended to link during various states
    sDefault: 'sm2_link',  // default state
    sLoading: 'sm2_loading',
    sPlaying: 'sm2_playing',
    sPaused: 'sm2_paused'
  }

  // apply externally-defined override, if applicable
  this.cssBase = []; // optional features added to ul.playlist
  if (this.config.usePeakData) this.cssBase.push('use-peak');
  if (this.config.useWaveformData || this.config.useEQData) this.cssBase.push('use-spectrum');
  this.cssBase = this.cssBase.join(' ');

  // apply some items to SM2
  sm.useFlashBlock = true;
  sm.flashVersion = this.config.flashVersion;
  if (sm.flashVersion >= 9) {
    sm.useMovieStar = this.config.useMovieStar; // enable playing FLV, MP4 etc.
    sm.movieStarOptions.useVideo = this.config.useVideo;
    sm.defaultOptions.usePeakData = this.config.usePeakData;
    sm.defaultOptions.useWaveformData = this.config.useWaveformData;
    sm.defaultOptions.useEQData = this.config.useEQData;
  }

  this.links = [];
  this.sounds = [];
  this.soundsByObject = [];
  this.lastSound = null;
  this.soundCount = 0;
  this.strings = [];
  this.dragActive = false;
  this.dragExec = new Date();
  this.dragTimer = null;
  this.pageTitle = document.title;
  this.lastWPExec = new Date();
  this.lastWLExec = new Date();
  this.vuMeterData = [];
  this.oControls = null;

  this.addEventHandler = function(o,evtName,evtHandler) {
    typeof(attachEvent)=='undefined'?o.addEventListener(evtName,evtHandler,false):o.attachEvent('on'+evtName,evtHandler);
  }

  this.removeEventHandler = function(o,evtName,evtHandler) {
    typeof(attachEvent)=='undefined'?o.removeEventListener(evtName,evtHandler,false):o.detachEvent('on'+evtName,evtHandler);
  }

var count = 0;

  this.hasClass = function(o,cStr) {
    return (typeof(o.className)!='undefined'?new RegExp('(^|\\s)'+cStr+'(\\s|$)').test(o.className):false);
  }

  this.addClass = function(o,cStr) {
    if (!o || !cStr) return false; // safety net
    if (self.hasClass(o,cStr)) return false;
    o.className = (o.className?o.className+' ':'')+cStr;
  }

  this.removeClass = function(o,cStr) {
    if (!o || !cStr) return false; // safety net
    if (!self.hasClass(o,cStr)) return false;
    o.className = o.className.replace(new RegExp('( '+cStr+')|('+cStr+')','g'),'');
  }

  this.getElementsByClassName = function(className,tagNames,oParent) {
    var doc = (oParent?oParent:document);
    var matches = [];
    var i,j;
    var nodes = [];
    if (typeof(tagNames)!='undefined' && typeof(tagNames)!='string') {
      for (i=tagNames.length; i--;) {
        if (!nodes || !nodes[tagNames[i]]) {
          nodes[tagNames[i]] = doc.getElementsByTagName(tagNames[i]);
        }
      }
    } else if (tagNames) {
      nodes = doc.getElementsByTagName(tagNames);
    } else {
      nodes = doc.all||doc.getElementsByTagName('*');
    }
    if (typeof(tagNames)!='string') {
      for (i=tagNames.length; i--;) {
        for (j=nodes[tagNames[i]].length; j--;) {
          if (self.hasClass(nodes[tagNames[i]][j],className)) {
            matches[matches.length] = nodes[tagNames[i]][j];
          }
        }
      }
    } else {
      for (i=0; i<nodes.length; i++) {
        if (self.hasClass(nodes[i],className)) {
          matches[matches.length] = nodes[i];
        }
      }
    }
    return matches;
  }
  
  this.getOffX = function(o) {
    // http://www.xs4all.nl/~ppk/js/findpos.html
    var curleft = 0;
    if (o.offsetParent) {
      while (o.offsetParent) {
        curleft += o.offsetLeft;
        o = o.offsetParent;
      }
    }
    else if (o.x) curleft += o.x;
    return curleft;
  }

  this.isChildOfClass = function(oChild,oClass) {
    if (!oChild || !oClass) return false;
    while (oChild.parentNode && !self.hasClass(oChild,oClass)) {
      oChild = oChild.parentNode;
    }
    return (self.hasClass(oChild,oClass));
  }

  this.getParentByNodeName = function(oChild,sParentNodeName) {
    if (!oChild || !sParentNodeName) return false;
    sParentNodeName = sParentNodeName.toLowerCase();
    while (oChild.parentNode && sParentNodeName != oChild.parentNode.nodeName.toLowerCase()) {
      oChild = oChild.parentNode;
    }
    return (oChild.parentNode && sParentNodeName == oChild.parentNode.nodeName.toLowerCase()?oChild.parentNode:null);
  }
  
  this.getTime = function(nMSec,bAsString) {
    // convert milliseconds to mm:ss, return as object literal or string
    var nSec = Math.floor(nMSec/1000);
    var min = Math.floor(nSec/60);
    var sec = nSec-(min*60);
    // if (min == 0 && sec == 0) return null; // return 0:00 as null
    return (bAsString?(min+':'+(sec<10?'0'+sec:sec)):{'min':min,'sec':sec});
  }

  this.getSoundByObject = function(o) {
    return (typeof self.soundsByObject[o.rel] != 'undefined'?self.soundsByObject[o.rel]:null);
  }

  this.getSoundIndex = function(o) {
    for (var i=self.links.length; i--;) {
      if (self.links[i].rel == o.rel) return i;
    }
    return -1;
  }

  this.setPageTitle = function(sTitle) {
    if (!self.config.updatePageTitle) return false;
    try {
      document.title = (sTitle?sTitle+' - ':'')+self.pageTitle;
    } catch(e) {
      // oh well
      self.setPageTitle = function() {return false;}
    }
  }

  this.events = {

    // handlers for sound events as they're started/stopped/played

    play: function() {
      pl.removeClass(this._data.oLI,this._data.className);
      this._data.className = pl.css.sPlaying;
      pl.addClass(this._data.oLI,this._data.className);
      self.setPageTitle(this._data.originalTitle);
    },

    stop: function() {
      pl.removeClass(this._data.oLI,this._data.className);
      this._data.className = '';
      this._data.oPosition.style.width = '0px';
      self.setPageTitle();
      self.resetPageIcon();
    },

    pause: function() {
      if (pl.dragActive) return false;
      pl.removeClass(this._data.oLI,this._data.className);
      this._data.className = pl.css.sPaused;
      pl.addClass(this._data.oLI,this._data.className);
      self.setPageTitle();
      self.resetPageIcon();
    },

    resume: function() {
      if (pl.dragActive) return false;
      pl.removeClass(this._data.oLI,this._data.className);
      this._data.className = pl.css.sPlaying;
      pl.addClass(this._data.oLI,this._data.className);
    },

    finish: function() {
      pl.removeClass(this._data.oLI,this._data.className);
      this._data.className = '';
      this._data.oPosition.style.width = '0px';
      // play next if applicable
      if (self.config.playNext && this._data.nIndex<pl.links.length-1) {
        pl.handleClick({target:pl.links[this._data.nIndex+1]}); // fake a click event - aren't we sneaky. ;)
      } else {
        self.setPageTitle();
        self.resetPageIcon();
      }
    },

    whileloading: function() {
      function doWork() {
        this._data.oLoading.style.width = (((this.bytesLoaded/this.bytesTotal)*100)+'%'); // theoretically, this should work.
        if (!this._data.didRefresh && this._data.metadata) {
          this._data.didRefresh = true;
          this._data.metadata.refresh();
        }
      }
      if (!pl.config.useThrottling) {
        doWork.apply(this);
      } else {
        d = new Date();
        if (d && d-self.lastWLExec>30 || this.bytesLoaded === this.bytesTotal) {
          doWork.apply(this);
          self.lastWLExec = d;
        }
      }

    },

    onload: function() {
      if (!this.loaded) {
		var oTemp = this._data.oLI.getElementsByTagName('a')[0];
		var oString = oTemp.innerHTML;
		var oThis = this;
		oTemp.innerHTML = oString+' <span style="font-size:0.5em"> | Load failed, d\'oh! '+(sm.sandbox.noRemote?' Possible cause: Flash sandbox is denying remote URL access.':(sm.sandbox.noLocal?'Flash denying local filesystem access':'404?'))+'</span>';
		setTimeout(function(){
		  oTemp.innerHTML = oString;
		  // pl.events.finish.apply(oThis); // load next
		},5000);
	  } else {
        if (this._data.metadata) {
          this._data.metadata.refresh();
        }
      }
    },

	metadata: function() {
	  // video-only stuff
	  sm._wD('video metadata: '+this.width+'x'+this.height);
      // set the SWF dimensions to match
	  sm.oMC.style.width = this.width+'px';	
	  sm.oMC.style.height = this.height+'px';
	},

    whileplaying: function() {
      var d = null;
      if (pl.dragActive || !pl.config.useThrottling) {
        self.updateTime.apply(this);
  	    if (sm.flashVersion >= 9) {
          if (pl.config.usePeakData && this.instanceOptions.usePeakData) self.updatePeaks.apply(this);
	      if (pl.config.useWaveformData && this.instanceOptions.useWaveformData || pl.config.useEQData && this.instanceOptions.useEQData) {
	        self.updateGraph.apply(this);
	      }
	    }
        if (this._data.metadata) {
          d = new Date();
          if (d && d-self.lastWPExec>500) {
            self.refreshMetadata(this);
            self.lastWPExec = d;
          }
        }
        this._data.oPosition.style.width = (((this.position/self.getDurationEstimate(this))*100)+'%');
      } else {
        d = new Date();
        if (d-self.lastWPExec>30) {
          self.updateTime.apply(this);
	      if (sm.flashVersion >= 9) {
            if (pl.config.usePeakData && this.instanceOptions.usePeakData) {
	          self.updatePeaks.apply(this);
	        }
	        if (pl.config.useWaveformData && this.instanceOptions.useWaveformData || pl.config.useEQData && this.instanceOptions.useEQData) {
		      self.updateGraph.apply(this);
		}
          }
          if (this._data.metadata) self.refreshMetadata(this);
          this._data.oPosition.style.width = (((this.position/self.getDurationEstimate(this))*100)+'%');
          self.lastWPExec = d;
        }
      }
    }
	
  } // events{}

  var _head = document.getElementsByTagName('head')[0];

  this.setPageIcon = function(sDataURL) {
	if (!self.config.useFavIcon || !self.config.usePeakData || !sDataURL) {
		return false;
	}
    var link = document.getElementById('sm2-favicon');
    if (link) {
	  _head.removeChild(link);
	  link = null;
    }
    if (!link) {
	  link = document.createElement('link');
	  link.id = 'sm2-favicon';
	  link.rel = 'shortcut icon';
	  link.type = 'image/png';
	  link.href = sDataURL;
      document.getElementsByTagName('head')[0].appendChild(link);
    }
  }

  this.resetPageIcon = function() {
	if (!self.config.useFavIcon) {
		return false;
	}
    var link = document.getElementById('favicon');
    if (link) {
	  link.href = '/favicon.ico';
    }
  }

  this.updatePeaks = function() {
    var o = this._data.oPeak;
    var oSpan = o.getElementsByTagName('span');
    oSpan[0].style.marginTop = (13-(Math.floor(15*this.peakData.left))+'px');
    oSpan[1].style.marginTop = (13-(Math.floor(15*this.peakData.right))+'px');
	// highly experimental
    if (self.config.flashVersion > 8 && self.config.useFavIcon && self.config.usePeakData) {
      self.setPageIcon(self.vuMeterData[parseInt(16*this.peakData.left)][parseInt(16*this.peakData.right)]);
	}
  }
  
  this.updateGraph = function() {
    if ((!pl.config.useWaveformData && !pl.config.useEQData) || pl.config.flashVersion<9) return false;
    var sbC = this._data.oGraph.getElementsByTagName('div');
    if (pl.config.useWaveformData) {
      // raw waveform
      var scale = 8; // Y axis (+/- this distance from 0)
      for (var i=255; i--;) {
        sbC[255-i].style.marginTop = (1+scale+Math.ceil(this.waveformData.left[i]*-scale))+'px';
      }
    } else {
	  // eq spectrum
      var offset = 9;
      for (var i=255; i--;) {
        sbC[255-i].style.marginTop = ((offset*2)-1+Math.ceil(this.eqData[i]*-offset))+'px';
      }
    }
  }
  
  this.resetGraph = function() {
    if (!pl.config.useEQData || pl.config.flashVersion<9) return false;
    var sbC = this._data.oGraph.getElementsByTagName('div');
    var scale = (!pl.config.useEQData?'9px':'17px');
    var nHeight = (!pl.config.fillGraph?'1px':'32px');
    for (var i=255; i--;) {
      sbC[255-i].style.marginTop = scale; // EQ scale
      sbC[255-i].style.height = nHeight;
    }
  }

  this.refreshMetadata = function(oSound) {
    // Display info as appropriate
    var index = null;
    var now = oSound.position;
    var metadata = oSound._data.metadata.data;
    for (var i=0, j=metadata.length; i<j; i++) {
      if (now >= metadata[i].startTimeMS && now <= metadata[i].endTimeMS) {
        index = i;
        break;
      }
    }
    if (index != metadata.currentItem) {
      // update
      oSound._data.oLink.innerHTML = metadata.mainTitle+' <span class="metadata"><span class="sm2_divider"> | </span><span class="sm2_metadata">'+metadata[index].title+'</span></span>';
      self.setPageTitle(metadata[index].title+' | '+metadata.mainTitle);
      metadata.currentItem = index;
    }
  }
  
  this.updateTime = function() {
    var str = self.strings['timing'].replace('%s1',self.getTime(this.position,true));
    str = str.replace('%s2',self.getTime(self.getDurationEstimate(this),true));
    this._data.oTiming.innerHTML = str;
  }

  this.getTheDamnTarget = function(e) {
    return (e.target||(window.event?window.event.srcElement:null));
  }
  
  this.withinStatusBar = function(o) {
    return (self.isChildOfClass(o,'controls'));
  }

  this.handleClick = function(e) {
    // a sound (or something) was clicked - determine what and handle appropriately
    if (e.button == 2) {
      if (!pl.config.allowRightClick) pl.stopEvent(e);
      return (pl.config.allowRightClick); // ignore right-clicks
    }
    var o = self.getTheDamnTarget(e);
    if (!o) {
      return true;
    }
    if (self.dragActive) self.stopDrag(); // to be safe
    if (self.withinStatusBar(o)) {
      // self.handleStatusClick(e);
      return false;
    }
    if (o.nodeName.toLowerCase() != 'a') {
      o = self.getParentByNodeName(o,'a');
    }
    if (!o) {
      // not a link
      return true;
    }
    var sURL = o.getAttribute('href');
    if (!o.href || (!sm.canPlayURL(o.href) && !self.hasClass(o,'playable')) || self.hasClass(o,'exclude')) {
      // do nothing, don't return anything.
    } else {
	  // we have something we're interested in.
	    var soundURL = o.href;
	    var thisSound = self.getSoundByObject(o);
	    if (thisSound) {
	      // sound already exists
	      self.setPageTitle(thisSound._data.originalTitle);
	      if (thisSound == self.lastSound) {
	        // ..and was playing (or paused) and isn't in an error state
			if (thisSound.readyState != 2) {
			  if (thisSound.playState != 1) {
				// not yet playing
				thisSound.play();
			  } else {
	            thisSound.togglePause();
	          }
			} else {
			  sm._writeDebug('Warning: sound failed to load (security restrictions, 404 or bad format)',2);
			}
	      } else {
	        // ..different sound
	        if (self.lastSound) self.stopSound(self.lastSound);
	        thisSound._data.oTimingBox.appendChild(document.getElementById('spectrum-container'));
	        thisSound.togglePause(); // start playing current
	      }
	    } else {
	      // create sound
	      thisSound = sm.createSound({
	        id:'pagePlayerMP3Sound'+(self.soundCount++),
	        url:decodeURI(soundURL),
	        onplay:self.events.play,
	        onstop:self.events.stop,
	        onpause:self.events.pause,
	        onresume:self.events.resume,
	        onfinish:self.events.finish,
	        whileloading:self.events.whileloading,
	        whileplaying:self.events.whileplaying,
	        onmetadata:self.events.metadata,
	        onload:self.events.onload
	      });
	      // append control template
	      var oControls = self.oControls.cloneNode(true);
	      o.parentNode.appendChild(oControls);
	      o.parentNode.appendChild(document.getElementById('spectrum-container'));
	      self.soundsByObject[o.rel] = thisSound;
	      // tack on some custom data
	      thisSound._data = {
	        oLink: o, // DOM reference within SM2 object event handlers
	        oLI: o.parentNode,
	        oControls: self.getElementsByClassName('controls','div',o.parentNode)[0],
	        oStatus: self.getElementsByClassName('statusbar','div',o.parentNode)[0],
	        oLoading: self.getElementsByClassName('loading','div',o.parentNode)[0],
	        oPosition: self.getElementsByClassName('position','div',o.parentNode)[0],
	        oTimingBox: self.getElementsByClassName('timing','div',o.parentNode)[0],
	        oTiming: self.getElementsByClassName('timing','div',o.parentNode)[0].getElementsByTagName('div')[0],
	        oPeak: self.getElementsByClassName('peak','div',o.parentNode)[0],
	        oGraph: self.getElementsByClassName('spectrum-box','div',o.parentNode)[0],
	        nIndex: self.getSoundIndex(o),
	        className: self.css.sPlaying,
	        originalTitle: o.innerHTML,
	        metadata: null
	      };
	      thisSound._data.oTimingBox.appendChild(document.getElementById('spectrum-container'));
	      // "Metadata"
	      if (thisSound._data.oLI.getElementsByTagName('ul').length) {
	        thisSound._data.metadata = new Metadata(thisSound);
	      }
	      // set initial timer stuff (before loading)
	      var str = self.strings['timing'].replace('%s1',self.config.emptyTime);
	      str = str.replace('%s2',self.config.emptyTime);
	      thisSound._data.oTiming.innerHTML = str;
	      self.sounds.push(thisSound);
	      if (self.lastSound) self.stopSound(self.lastSound);
	      self.resetGraph.apply(thisSound);
	      thisSound.play();
	    }
	    self.lastSound = thisSound; // reference for next call
	    return self.stopEvent(e);
	 }
  }
  
  this.handleMouseDown = function(e) {
    // a sound link was clicked
    if (e.button == 2) {
      if (!pl.config.allowRightClick) pl.stopEvent(e);
      return (pl.config.allowRightClick); // ignore right-clicks
    }
    var o = self.getTheDamnTarget(e);
    if (!o) {
      return true;
    }
    if (!self.withinStatusBar(o)) return true;
    self.dragActive = true;
    self.lastSound.pause();
    self.setPosition(e);
    self.addEventHandler(document,'mousemove',self.handleMouseMove);
    self.addClass(self.lastSound._data.oControls,'dragging');
    self.stopEvent(e);
    return false;
  }
  
  this.handleMouseMove = function(e) {
    // set position accordingly
    if (self.dragActive) {
      if (self.config.useThrottling) {
        // be nice to CPU/externalInterface
        var d = new Date();
        if (d-self.dragExec>20) {
          self.setPosition(e);
        } else {
          window.clearTimeout(self.dragTimer);
          self.dragTimer = window.setTimeout(function(){self.setPosition(e)},20);
        }
        self.dragExec = d;
      } else {
        // oh the hell with it
        self.setPosition(e);
      }
    } else {
      self.stopDrag();
    }
	return false;
  }
  
  this.stopDrag = function(e) {
    if (self.dragActive) {
      self.removeClass(self.lastSound._data.oControls,'dragging');
      self.removeEventHandler(document,'mousemove',self.handleMouseMove);
      // self.removeEventHandler(document,'mouseup',self.stopDrag);
      if (!pl.hasClass(self.lastSound._data.oLI,self.css.sPaused)) {
        self.lastSound.resume();
      }
      self.dragActive = false;
      self.stopEvent(e);
      return false;
    }
  }
  
  this.handleStatusClick = function(e) {
    self.setPosition(e);
    if (!pl.hasClass(self.lastSound._data.oLI,self.css.sPaused)) self.resume();
    return self.stopEvent(e);
  }
  
  this.stopEvent = function(e) {
   if (typeof e != 'undefined') {
      if (typeof e.preventDefault != 'undefined') {
        e.preventDefault();
      } else if (typeof e.returnValue != 'undefined' || typeof event != 'undefined') {
        (e||event).cancelBubble = true;
        (e||event).returnValue = false;
      }
    }
    return false;
  }
 
  this.setPosition = function(e) {
    // called from slider control
    var oThis = self.getTheDamnTarget(e);
    if (!oThis) {
      return true;
    }
    var oControl = oThis;
    while (!self.hasClass(oControl,'controls') && oControl.parentNode) {
      oControl = oControl.parentNode;
    }
    var oSound = self.lastSound;
    var x = parseInt(e.clientX);
    // play sound at this position
    var nMsecOffset = Math.floor((x-self.getOffX(oControl)-4)/(oControl.offsetWidth)*self.getDurationEstimate(oSound));
    if (!isNaN(nMsecOffset)) nMsecOffset = Math.min(nMsecOffset,oSound.duration);
    if (!isNaN(nMsecOffset)) oSound.setPosition(nMsecOffset);
  }

  this.stopSound = function(oSound) {
    sm._writeDebug('stopping sound: '+oSound.sID);
    sm.stop(oSound.sID);
    sm.unload(oSound.sID);
  }

  this.getDurationEstimate = function(oSound) {
    if (oSound.instanceOptions.isMovieStar) {
	  return (oSound.duration);
    } else {
      return (!oSound._data.metadata || !oSound._data.metadata.data.givenDuration?(oSound.durationEstimate||0):oSound._data.metadata.data.givenDuration);
    }
  }

  this.createVUData = function() {
    var i=0;
    var j=0;
	var canvas = vuDataCanvas.getContext('2d');
	var vuGrad = canvas.createLinearGradient(0, 16, 0, 0);
	vuGrad.addColorStop(0,'rgb(0,192,0)');
	vuGrad.addColorStop(0.30,'rgb(0,255,0)');
	vuGrad.addColorStop(0.625,'rgb(255,255,0)');
	vuGrad.addColorStop(0.85,'rgb(255,0,0)');
	var bgGrad = canvas.createLinearGradient(0, 16, 0, 0);
	var outline = 'rgba(0,0,0,0.2)';
	bgGrad.addColorStop(0,outline);
	bgGrad.addColorStop(1,'rgba(0,0,0,0.5)');
    for (i=0; i<16; i++) {
      self.vuMeterData[i] = [];
    }
    for (var i=0; i<16; i++) {
      for (j=0; j<16; j++) {
	    // reset/erase canvas
		vuDataCanvas.setAttribute('width',16);
		vuDataCanvas.setAttribute('height',16);
		// draw new stuffs
	    canvas.fillStyle = bgGrad;
 		canvas.fillRect(0,0,7,15);
 		canvas.fillRect(8,0,7,15);
		/*
		// shadow
		canvas.fillStyle = 'rgba(0,0,0,0.1)';
	    canvas.fillRect(1,15-i,7,17-(17-i));
	    canvas.fillRect(9,15-j,7,17-(17-j));
		*/
        canvas.fillStyle = vuGrad;
        canvas.fillRect(0,15-i,7,16-(16-i));
        canvas.fillRect(8,15-j,7,16-(16-j));
		// and now, clear out some bits.
		canvas.clearRect(0,3,16,1);
		canvas.clearRect(0,7,16,1);
		canvas.clearRect(0,11,16,1);
        self.vuMeterData[i][j] = vuDataCanvas.toDataURL('image/png');
		// for debugging VU images
		/*
		var o = document.createElement('img');
		o.style.marginRight = '5px'; 
		o.src = self.vuMeterData[i][j];
		document.documentElement.appendChild(o);
		*/
      }
    }
  };

  var vuDataCanvas = null;

  this.testCanvas = function() {
	// canvas + toDataURL();
    var c = document.createElement('canvas');
	var ctx = null;
    if (!c || typeof c.getContext == 'undefined') {
	  return null;
    }
    ctx = c.getContext('2d');
	if (!ctx || typeof c.toDataURL != 'function') {
		return null;
	}
	// just in case..
	try {
		var ok = c.toDataURL('image/png');
	} catch(e) {
	  // no canvas or no toDataURL()
	  return null;	
	}
	// assume we're all good.
	return c;
  }

  if (this.config.useFavIcon) {
	vuDataCanvas = self.testCanvas();
	if (vuDataCanvas && (isFirefox || isOpera)) {
      // these browsers support dynamically-updating the favicon
	  self.createVUData();
	} else {
	  // browser doesn't support doing this
	  this.config.useFavIcon = false;
	}
  }

  this.init = function() {
    sm._writeDebug('pagePlayer.init()');
    var oLinks = document.getElementsByTagName('a');
    // grab all links, look for .mp3
    var foundItems = 0;
    for (var i=0; i<oLinks.length; i++) {
      if ((sm.canPlayURL(oLinks[i].href) || self.hasClass(oLinks[i],'playable')) && !self.hasClass(oLinks[i],'exclude')) {
        oLinks[i].rel = 'pagePlayerMP3Sound'+i;
        self.links[self.links.length] = oLinks[i];
        self.addClass(oLinks[i],self.css.sDefault); // add default CSS decoration
        foundItems++;
      }
    }
    if (foundItems>0) {
      var oTiming = document.getElementById('sm2_timing');
      self.strings['timing'] = oTiming.innerHTML;
      oTiming.innerHTML = '';
      oTiming.id = '';
      self.addEventHandler(document,'click',self.handleClick);
      self.addEventHandler(document,'mousedown',self.handleMouseDown);
      self.addEventHandler(document,'mouseup',self.stopDrag);
      self.addEventHandler(window,'unload',function(){}); // force page reload when returning here via back button (Opera tries to remember old state, etc.)
    }
    sm._writeDebug('pagePlayer.init(): Found '+foundItems+' relevant items.');
    if (self.config.autoStart) {
      pl.handleClick({target:pl.links[0]});
    }
  }

var Metadata = function(oSound) {
  var self = this;
  var oLI = oSound._data.oLI;
  var o = oLI.getElementsByTagName('ul')[0];
  var oItems = o.getElementsByTagName('li');
  var oTemplate = document.createElement('div');
  oTemplate.innerHTML = '<span>&nbsp;</span>';
  oTemplate.className = 'annotation';
  var oTemplate2 = document.createElement('div');
  oTemplate2.innerHTML = '<span>&nbsp;</span>';
  oTemplate2.className = 'annotation alt';

  var oTemplate3 = document.createElement('div');
  oTemplate3.className = 'note';

  this.totalTime = 0;
  this.strToTime = function(sTime) {
    var segments = sTime.split(':');
    var seconds = 0;
    for (var i=segments.length; i--;) {
      seconds += parseInt(segments[i])*Math.pow(60,segments.length-1-i,10); // hours, minutes
    }
    return seconds;
  }
  this.data = [];
  this.data.givenDuration = null;
  this.data.currentItem = null;
  this.data.mainTitle = oSound._data.oLink.innerHTML;
  for (var i=0; i<oItems.length; i++) {
    this.data[i] = {
      o: null,
      title: oItems[i].getElementsByTagName('p')[0].innerHTML,
      startTime: oItems[i].getElementsByTagName('span')[0].innerHTML,
      startSeconds: self.strToTime(oItems[i].getElementsByTagName('span')[0].innerHTML.replace(/[()]/g,'')),
      duration: 0,
      durationMS: null,
      startTimeMS: null,
      endTimeMS: null,
      oNote: null
    }
  }
  var oDuration = pl.getElementsByClassName('duration','div',oLI);
  this.data.givenDuration = (oDuration.length?self.strToTime(oDuration[0].innerHTML)*1000:0);
  for (i=0; i<this.data.length; i++) {
    this.data[i].duration = parseInt(this.data[i+1]?this.data[i+1].startSeconds:(self.data.givenDuration?self.data.givenDuration:oSound.durationEstimate)/1000)-this.data[i].startSeconds;
    this.data[i].startTimeMS = this.data[i].startSeconds*1000;
    this.data[i].durationMS = this.data[i].duration*1000;
    this.data[i].endTimeMS = this.data[i].startTimeMS+this.data[i].durationMS;
    this.totalTime += this.data[i].duration;
  }
  // make stuff
  this.createElements = function() {
    var oFrag = document.createDocumentFragment();
    var oNode = null;
    var oNodeSpan = null;
    var oNode2 = null;
    for (var i=0; i<self.data.length; i++) {
      oNode = (i%2==0?oTemplate:oTemplate2).cloneNode(true);
      oNodeSpan = oNode.getElementsByTagName('span')[0];
      oNode.rel = i;
      self.data[i].o = oNode;
      oNode2 = oTemplate3.cloneNode(true);
      if (i%2==0) oNode2.className = 'note alt';
      oNode2.innerHTML = this.data[i].title;
      // evil old-skool event handlers, css:hover-only ideally would be nice excluding IE 6
      oNode.onmouseover = self.mouseover;
      oNode.onmouseout = self.mouseout;
      this.data[i].oNote = oNode2;
      oSound._data.oControls.appendChild(oNode2);
      oFrag.appendChild(oNode);
    }
    self.refresh();
    oSound._data.oStatus.appendChild(oFrag);
  }

  this.refresh = function() {
    var offset = 0;
    var relWidth = null;
    var duration = (self.data.givenDuration?self.data.givenDuration:oSound.durationEstimate);
    for (var i=0; i<self.data.length; i++) {
      if (duration) {
        relWidth = (((self.data[i].duration*1000)/duration)*100);
        self.data[i].o.style.left = (offset?offset+'%':'-2px');
        self.data[i].oNote.style.left = (offset?offset+'%':'0px');
        offset += relWidth;
      }
    }
  }

  this.mouseover = function(e) {
    self.data[this.rel].oNote.style.visibility = 'hidden';
    self.data[this.rel].oNote.style.display = 'inline-block';
    self.data[this.rel].oNote.style.marginLeft = -parseInt(self.data[this.rel].oNote.offsetWidth/2)+'px';
    self.data[this.rel].oNote.style.visibility = 'visible';
  }

  this.mouseout = function() { 
    self.data[this.rel].oNote.style.display = 'none';
  }

  // ----

  this.createElements();
  this.refresh();
  
} // MetaData();

  this.initDOM = function() {
    // set up graph box stuffs
    var sb = self.getElementsByClassName('spectrum-box','div',document.documentElement)[0];
    if (sm.flashVersion >= 9) {
      self.addClass(self.getElementsByClassName('playlist','ul',document.documentElement)[0],self.cssBase);
      var sbC = sb.getElementsByTagName('div')[0];
      var oF = document.createDocumentFragment();
      var oClone = null;
      for (var i=256; i--;) {
        oClone = sbC.cloneNode(false);
        oClone.style.left = (i)+'px';
        oF.appendChild(oClone);
      }
      sb.removeChild(sbC);
      sb.appendChild(oF);
    }
    this.oControls = document.getElementById('control-template').cloneNode(true);
    this.oControls.id = '';
    this.init();
  }

}

var pagePlayer = new PagePlayer(typeof PP_CONFIG != 'undefined'?PP_CONFIG:null);

soundManager.onready(function() {
  if (soundManager.supported()) {
    // soundManager.createSound() etc. may now be called
    pagePlayer.initDOM();
  }
});