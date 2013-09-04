/*
 FRITZ BACKEND SERVICE
*/

var fritzend = {
  key:'xxx',
  data:{}, //main table
  subdata:{}, //sub objects
  lastID:0,
  isDemo:false,
  und:function(x){
    return (typeof x == "undefined") ? 'main' : 'sub:'+x
  },
  save: function(subkey){
    var key = (typeof subkey != "undefined") ? this.key + '+' + subkey : this.key
    var data = (typeof subkey != "undefined") ? this.subdata[subkey] : this.data 
    if(!this.isDemo) {
      localStorage.setItem(key,JSON.stringify(data))
    }
    console.log('fritzend.save /'+this.und(subkey))
  },
  restore: function(subkey){
    var key = (typeof subkey != "undefined") ? this.key + '+' + subkey : this.key
    if (localStorage.getItem(key) != null){
      var data = JSON.parse(localStorage.getItem(key))
      if (typeof subkey != "undefined"){
        this.subdata[subkey] = data 
      } else {
        this.data = data 
      }
    }
    console.log('fritzend.restore/'+this.und(subkey))

  },
  demo: function(data){
    if ($.isEmptyObject(this.data)){
      this.data = data
      this.demo = true
    }
    return data
  },
  getAll: function(subkey){
    var data = (typeof subkey != "undefined") ? this.subdata[subkey] : this.data 

    var rd = []
    for (x in data){
      rd.push(data [x])
      if (data [x]._id > this.lastID){
        this.lastID = data[x]._id
      }
    }
    console.log('fritzend.getAll ('+rd.length+')/'+this.und(subkey))
    return rd

  },
  add: function(rec,subkey){
    this.lastID +=1
    rec._id = this.lastID
    if (typeof subkey != "undefined"){
      if (typeof this.subdata[subkey] == "undefined") this.subdata[subkey] = {}
      this.subdata[subkey][rec._id] = rec
      this.save(subkey)
    } else {
      this.data[rec._id] = rec
      this.save()
    }    
    console.log('fritzend.add'+rec._id+'/'+this.und(subkey))
    return rec
  },
  get: function(id,subkey){
    console.log('fritzend.get '+id+'/'+this.und(subkey))
    if (typeof subkey != "undefined"){
      return  this.subdata[subkey][id]
    } else {
      return this.data[id]
    }

  },
  update: function(rec,subkey){
    if (typeof subkey != "undefined"){
      this.subdata[subkey][rec._id] = rec
      this.save(subkey)
    } else {
      this.data[rec._id] = rec
      this.save()
    }
    console.log('fritzend.update '+rec._id+'/'+this.und(subkey))

  },
  del: function(id,subkey){
    if (typeof subkey != "undefined"){
      delete this.subdata[subkey][id]
      this.save(subkey)      
    } else {
      delete this.data[id]
      this.save()
    }
    console.log('fritzend.delete '+id+'/'+this.und(subkey))
  }
}


/*
  FRITZ APP
*/
var fritzapp = {
  appname:'demo',
  android:false,
  user:{},
  translations:{},
  transoverride:false,
  location:{'status':'Unknown','available':false,'latitude':0,'longitude':0,'approx':false},
  baseurl:'http://tiny-tools.appspot.com/',
  signin:function(){
    var url = this.baseurl+'fritzend/user/signin?url='+location.href
    location.href = url
  },
  signout:function(){
    var url = this.baseurl+'fritzend/user/signout?url='+location.href
    location.href = url
  },
  restore:function(){
    jQuery.ajax({
      type: "GET",
      url: '/user?salt='+new Date(),
      dataType: 'json',
      success: this.restored   
    })
  },
  restored:function(data){
    this.user=data
  },
  save:function(){
    if (this.id !== ''){
      jQuery.ajax({
        type: "POST",
        url: this.baseurl+'fritzend/user/'+this.appname,
        data: {freeload:JSON.stringify(this.data)},
        success: function(data){
          console.log('fritzapp.save: saved')
          oUser.updateGUI() 
        }    
      })
    }
  },
  //TRANSLATION
  translate:function(lng,a){
    if (typeof this.translations[lng] == "undefined") this.translations[lng]={}
    for (var i=0,ii=a.length;i<ii;i+=1){
      if (a[i].length == 2){
        this.translations[lng][a[i][0]] = a[i][1]
      }
    }
  },
  getTranslations:function(lng){
    if (this.transoverride) lng = this.transoverride
    return (typeof this.translations[lng] != "undefined") ? this.translations[lng] : this.translations['en']
  },
  overrideTranslation:function(lng){
    this.transoverride=lng
  },
  // ANDROID API
  setAndroid:function(){
    this.android=true
    console.log('fritzapp.setAndroid()')
  },
  isAndroid:function(){
    return this.android
  },
  //sends a message to the android phone via alert
  sendMessage:function(action,params){
    var obj = { type:'message', action:action, data:params }
    if (this.android){
      location.href = "myapp://" + JSON.stringify(obj)
    } else {
      console.log('sendMessage: ',obj)
    }
    return true
  },
  callPhone:function(num){
    if (this.android){
      this.sendMessage('callPhone',[num]) 
    }else{
      alert('Calling: '+num)
    }
  },
  openBrowser:function(uri){
    if (this.android){
      this.sendMessage('openBrowser',[uri]) 
    }else{
      window.open(uri,'_blank');
    }
  },
  openMap:function(location){
    if (this.android){
      this.sendMessage("openMap",[ encodeURIComponent(location)])
    }else{
      alert('Open map: '+location)
    }
  },
  openNavigation:function(start, destination){
    if (this.android){
      this.sendMessage("openNavigation",[ encodeURIComponent(start), encodeURIComponent(destination)])
    }else{
      alert('Open navigation: '+destination)
    }
  },
  sendEmail:function(email,subject,body){
    if (this.android){
      this.sendMessage("sendEmail",[encodeURIComponent(email),encodeURIComponent(subject),encodeURIComponent(body)])

    }else{
       uri='mailto:'+email+'?subject='+subject+'&body='+body
       window.open(uri,'_blank');  
    }
  },
  pushLocation:function(status,lat,long,gps,gpsfixed,internet){
     console.log('pushLocation',status,lat,long)
     $('#debug_console').append('pushLocation'+status+' '+lat+' '+long+' <br>')

     this.location['status']= status
     this.location['gps']= gps
     this.location['internet']= internet
     this.location['latitude'] = lat
     this.location['longitude']= long
     this.location['available'] = false
     this.location['fixed'] = gpsfixed
     this.location['android'] = true

     if (this.location['latitude'] > 0){
       this.location['available'] = true
     }
  },
  getLocation:function(){
    if (this.android){
      return this.location
    }else{
      return false
    }
  }
  
}


var fritzify = function(key){
  fritzend.key=key
  fritzapp.appname=key
}


if (typeof angular != "undefined"){
//
// FRITZ MODULE
//
angular.module('fritzmod', [], function($provide) {
  $provide.factory('_app', ['$window', function($window) {
    var code = $window.navigator.userLanguage || $window.navigator.language
    code = code.toLowerCase().substr(0,2)
    return {
      _t: fritzapp.getTranslations(code),
      lng: code 
    }
  }])

}).directive('onEnter', function() {
        return function(scope, element, attrs) {
            element.bind("keydown keypress", function(event) {
                if(event.which === 13) {
                    scope.$apply(function(){
                        scope.$eval(attrs.onEnter);
                    });

                    event.preventDefault();
                }
            });
        };
    })

.filter('truncate', function () {
        return function (text, length, end) {
            if (isNaN(length))
                length = 10;

            if (end === undefined)
                end = "...";

            if (text.length <= length || text.length - end.length <= length) {
                return text;
            }
            else {
                return String(text).substring(0, length-end.length) + end;
            }

        }
    });

} //end check if angular available



/*
  DEFAULT TRANSLATIONS
*/

fritzapp.translate('en',[
 ['nearby','Nearby'],
 ['favs','Favorites'],
 ['all','All'],
 ['categories','Categories'],
 ['hint','Hint'],
 ['location','Location'],
 ['search','Search'],
 ['notfound','Nothing found'],
 ['open','Open'],
 ['favorite','Favorite'],
 ['contact','Contact'],
 ['address','Address'],
 ['startnavigation','Navigate'],
 ['showonmap','Display on map'],
 ['reallydelete','Wirklich löschen: '],
 ['edit','Edit'],
 ['save','Save'],
 ['delete','Delete'],
 ['cancel','Cancel'],
 ['add','Add']
])

fritzapp.translate('de',[
 ['nearby','In der Nähe'],
 ['favs','Favoriten'],
 ['all','Alle'],
 ['categories','Kategorien'],
 ['location','Standort'],
 ['search','Suche'],
 ['notfound','Nichts gefunden'],
 ['open','Geöffnet'],
 ['favorite','Favorit'],
 ['contact','Kontakt'],
 ['address','Adresse'],
 ['startnavigation','Navigation starten'],
 ['showonmap','Auf Karte anzeigen'],
 ['reallydelete','Wirklich löschen: '],
 ['edit','Editieren'],
 ['save','Speichern'],
 ['delete','Löschen'],
 ['cancel','Abbrechen'],
 ['add','Hinzu.']
])




/*
  ACTION BAR
*/
var actionbar = {
   //METHODS
  init:function(){

    //detect ie
    if (/*@cc_on!@*/false){
      $('body').html('Browser not supported for Live demo.')
      this.cbNotAvailable()
    }
  
    this.$back= $('#actionbar .back')
    this.$icon= $('#actionbar .icon')
    this.$title= $('#actionbar .title')
    this.$menu= $('#actionbar .menu')
    this.goHome()
    this.$back.click(function(){
      actionbar.goBack()
    })
    this.$icon.click(function(){
      actionbar.goBack()
    })
  },
  setTitle: function(title){
    this.$title.attr('xtitle',title)
  },
  goHome: function(){
    this.$title.html(this.$title.attr('xtitle'))
    this.$back.hide()
    this.cbGoHome()
  },
  goPage: function(id,title){
    this.$title.html(title)
    this.$back.show()
    this.cbGoPage()
  },
  goBack: function(){
    if (self.location.hash != '#/' && self.history.length>0){
      self.history.back()
    }
    if (self.location.hash == '#/'){
      this.goHome()
      console.log('this.goHome()')
    }
    this.cbGoBack()
  },
  cbGoBack:function(){},
  cbGoHome:function(){},
  cbGoPage:function(){},
  cbNotAvailable:function(){}
}

/**
 * @preserve FastClick: polyfill to remove click delays on browsers with touch UIs.
 *
 * @version 0.5.7
 * @codingstandard ftlabs-jsv2
 * @copyright The Financial Times Limited [All Rights Reserved]
 * @license MIT License (see LICENSE.txt)
 */

/*jslint browser:true, node:true*/
/*global define, Event, Node*/


/**
 * Instantiate fast-clicking listeners on the specificed layer.
 *
 * @constructor
 * @param {Element} layer The layer to listen on
 */
function FastClick(layer) {
	'use strict';
	var oldOnClick, self = this;


	/**
	 * Whether a click is currently being tracked.
	 *
	 * @type boolean
	 */
	this.trackingClick = false;


	/**
	 * Timestamp for when when click tracking started.
	 *
	 * @type number
	 */
	this.trackingClickStart = 0;


	/**
	 * The element being tracked for a click.
	 *
	 * @type EventTarget
	 */
	this.targetElement = null;


	/**
	 * X-coordinate of touch start event.
	 *
	 * @type number
	 */
	this.touchStartX = 0;


	/**
	 * Y-coordinate of touch start event.
	 *
	 * @type number
	 */
	this.touchStartY = 0;


	/**
	 * ID of the last touch, retrieved from Touch.identifier.
	 *
	 * @type number
	 */
	this.lastTouchIdentifier = 0;


	/**
	 * The FastClick layer.
	 *
	 * @type Element
	 */
	this.layer = layer;

	if (!layer || !layer.nodeType) {
		throw new TypeError('Layer must be a document node');
	}

	/** @type function() */
	this.onClick = function() { return FastClick.prototype.onClick.apply(self, arguments); };

	/** @type function() */
	this.onMouse = function() { return FastClick.prototype.onMouse.apply(self, arguments); };

	/** @type function() */
	this.onTouchStart = function() { return FastClick.prototype.onTouchStart.apply(self, arguments); };

	/** @type function() */
	this.onTouchEnd = function() { return FastClick.prototype.onTouchEnd.apply(self, arguments); };

	/** @type function() */
	this.onTouchCancel = function() { return FastClick.prototype.onTouchCancel.apply(self, arguments); };

	// Devices that don't support touch don't need FastClick
	if (typeof window.ontouchstart === 'undefined') {
		return;
	}

	// Set up event handlers as required
	if (this.deviceIsAndroid) {
		layer.addEventListener('mouseover', this.onMouse, true);
		layer.addEventListener('mousedown', this.onMouse, true);
		layer.addEventListener('mouseup', this.onMouse, true);
	}

	layer.addEventListener('click', this.onClick, true);
	layer.addEventListener('touchstart', this.onTouchStart, false);
	layer.addEventListener('touchend', this.onTouchEnd, false);
	layer.addEventListener('touchcancel', this.onTouchCancel, false);

	// Hack is required for browsers that don't support Event#stopImmediatePropagation (e.g. Android 2)
	// which is how FastClick normally stops click events bubbling to callbacks registered on the FastClick
	// layer when they are cancelled.
	if (!Event.prototype.stopImmediatePropagation) {
		layer.removeEventListener = function(type, callback, capture) {
			var rmv = Node.prototype.removeEventListener;
			if (type === 'click') {
				rmv.call(layer, type, callback.hijacked || callback, capture);
			} else {
				rmv.call(layer, type, callback, capture);
			}
		};

		layer.addEventListener = function(type, callback, capture) {
			var adv = Node.prototype.addEventListener;
			if (type === 'click') {
				adv.call(layer, type, callback.hijacked || (callback.hijacked = function(event) {
					if (!event.propagationStopped) {
						callback(event);
					}
				}), capture);
			} else {
				adv.call(layer, type, callback, capture);
			}
		};
	}

	// If a handler is already declared in the element's onclick attribute, it will be fired before
	// FastClick's onClick handler. Fix this by pulling out the user-defined handler function and
	// adding it as listener.
	if (typeof layer.onclick === 'function') {

		// Android browser on at least 3.2 requires a new reference to the function in layer.onclick
		// - the old one won't work if passed to addEventListener directly.
		oldOnClick = layer.onclick;
		layer.addEventListener('click', function(event) {
			oldOnClick(event);
		}, false);
		layer.onclick = null;
	}
}


/**
 * Android requires an exception for labels.
 *
 * @type boolean
 */
FastClick.prototype.deviceIsAndroid = navigator.userAgent.indexOf('Android') > 0;


/**
 * iOS requires an exception for alert confirm dialogs.
 *
 * @type boolean
 */
FastClick.prototype.deviceIsIOS = /iP(ad|hone|od)/.test(navigator.userAgent);


/**
 * iOS 4 requires an exception for select elements.
 *
 * @type boolean
 */
FastClick.prototype.deviceIsIOS4 = FastClick.prototype.deviceIsIOS && (/OS 4_\d(_\d)?/).test(navigator.userAgent);


/**
 * iOS 6.0(+?) requires the target element to be manually derived
 *
 * @type boolean
 */
FastClick.prototype.deviceIsIOSWithBadTarget = FastClick.prototype.deviceIsIOS && (/OS ([6-9]|\d{2})_\d/).test(navigator.userAgent);


/**
 * Determine whether a given element requires a native click.
 *
 * @param {EventTarget|Element} target Target DOM element
 * @returns {boolean} Returns true if the element needs a native click
 */
FastClick.prototype.needsClick = function(target) {
	'use strict';
	switch (target.nodeName.toLowerCase()) {
	case 'button':
	case 'input':

		// File inputs need real clicks on iOS 6 due to a browser bug (issue #68)
		if (this.deviceIsIOS && target.type === 'file') {
			return true;
		}

		// Don't send a synthetic click to disabled inputs (issue #62)
		return target.disabled;
	case 'label':
	case 'video':
		return true;
	default:
		return (/\bneedsclick\b/).test(target.className);
	}
};


/**
 * Determine whether a given element requires a call to focus to simulate click into element.
 *
 * @param {EventTarget|Element} target Target DOM element
 * @returns {boolean} Returns true if the element requires a call to focus to simulate native click.
 */
FastClick.prototype.needsFocus = function(target) {
	'use strict';
	switch (target.nodeName.toLowerCase()) {
	case 'textarea':
	case 'select':
		return true;
	case 'input':
		switch (target.type) {
		case 'button':
		case 'checkbox':
		case 'file':
		case 'image':
		case 'radio':
		case 'submit':
			return false;
		}

		// No point in attempting to focus disabled inputs
		return !target.disabled;
	default:
		return (/\bneedsfocus\b/).test(target.className);
	}
};


/**
 * Send a click event to the specified element.
 *
 * @param {EventTarget|Element} targetElement
 * @param {Event} event
 */
FastClick.prototype.sendClick = function(targetElement, event) {
	'use strict';
	var clickEvent, touch;

	// On some Android devices activeElement needs to be blurred otherwise the synthetic click will have no effect (#24)
	if (document.activeElement && document.activeElement !== targetElement) {
		document.activeElement.blur();
	}

	touch = event.changedTouches[0];

	// Synthesise a click event, with an extra attribute so it can be tracked
	clickEvent = document.createEvent('MouseEvents');
	clickEvent.initMouseEvent('click', true, true, window, 1, touch.screenX, touch.screenY, touch.clientX, touch.clientY, false, false, false, false, 0, null);
	clickEvent.forwardedTouchEvent = true;
	targetElement.dispatchEvent(clickEvent);
};


/**
 * @param {EventTarget|Element} targetElement
 */
FastClick.prototype.focus = function(targetElement) {
	'use strict';
	var length;

	if (this.deviceIsIOS && targetElement.setSelectionRange) {
		length = targetElement.value.length;
		targetElement.setSelectionRange(length, length);
	} else {
		targetElement.focus();
	}
};


/**
 * Check whether the given target element is a child of a scrollable layer and if so, set a flag on it.
 *
 * @param {EventTarget|Element} targetElement
 */
FastClick.prototype.updateScrollParent = function(targetElement) {
	'use strict';
	var scrollParent, parentElement;

	scrollParent = targetElement.fastClickScrollParent;

	// Attempt to discover whether the target element is contained within a scrollable layer. Re-check if the
	// target element was moved to another parent.
	if (!scrollParent || !scrollParent.contains(targetElement)) {
		parentElement = targetElement;
		do {
			if (parentElement.scrollHeight > parentElement.offsetHeight) {
				scrollParent = parentElement;
				targetElement.fastClickScrollParent = parentElement;
				break;
			}

			parentElement = parentElement.parentElement;
		} while (parentElement);
	}

	// Always update the scroll top tracker if possible.
	if (scrollParent) {
		scrollParent.fastClickLastScrollTop = scrollParent.scrollTop;
	}
};


/**
 * @param {EventTarget} targetElement
 * @returns {Element|EventTarget}
 */
FastClick.prototype.getTargetElementFromEventTarget = function(eventTarget) {
	'use strict';

	// On some older browsers (notably Safari on iOS 4.1 - see issue #56) the event target may be a text node.
	if (eventTarget.nodeType === Node.TEXT_NODE) {
		return eventTarget.parentNode;
	}

	return eventTarget;
};


/**
 * On touch start, record the position and scroll offset.
 *
 * @param {Event} event
 * @returns {boolean}
 */
FastClick.prototype.onTouchStart = function(event) {
	'use strict';
	var targetElement, touch, selection;

	targetElement = this.getTargetElementFromEventTarget(event.target);
	touch = event.targetTouches[0];

	if (this.deviceIsIOS) {

		// Only trusted events will deselect text on iOS (issue #49)
		selection = window.getSelection();
		if (selection.rangeCount && !selection.isCollapsed) {
			return true;
		}

		if (!this.deviceIsIOS4) {

			// Weird things happen on iOS when an alert or confirm dialog is opened from a click event callback (issue #23):
			// when the user next taps anywhere else on the page, new touchstart and touchend events are dispatched
			// with the same identifier as the touch event that previously triggered the click that triggered the alert.
			// Sadly, there is an issue on iOS 4 that causes some normal touch events to have the same identifier as an
			// immediately preceeding touch event (issue #52), so this fix is unavailable on that platform.
			if (touch.identifier === this.lastTouchIdentifier) {
				event.preventDefault();
				return false;
			}
		
			this.lastTouchIdentifier = touch.identifier;

			// If the target element is a child of a scrollable layer (using -webkit-overflow-scrolling: touch) and:
			// 1) the user does a fling scroll on the scrollable layer
			// 2) the user stops the fling scroll with another tap
			// then the event.target of the last 'touchend' event will be the element that was under the user's finger
			// when the fling scroll was started, causing FastClick to send a click event to that layer - unless a check
			// is made to ensure that a parent layer was not scrolled before sending a synthetic click (issue #42).
			this.updateScrollParent(targetElement);
		}
	}

	this.trackingClick = true;
	this.trackingClickStart = event.timeStamp;
	this.targetElement = targetElement;

	this.touchStartX = touch.pageX;
	this.touchStartY = touch.pageY;

	// Prevent phantom clicks on fast double-tap (issue #36)
	if ((event.timeStamp - this.lastClickTime) < 200) {
		event.preventDefault();
	}

	return true;
};


/**
 * Based on a touchmove event object, check whether the touch has moved past a boundary since it started.
 *
 * @param {Event} event
 * @returns {boolean}
 */
FastClick.prototype.touchHasMoved = function(event) {
	'use strict';
	var touch = event.changedTouches[0];

	if (Math.abs(touch.pageX - this.touchStartX) > 10 || Math.abs(touch.pageY - this.touchStartY) > 10) {
		return true;
	}

	return false;
};


/**
 * Attempt to find the labelled control for the given label element.
 *
 * @param {EventTarget|HTMLLabelElement} labelElement
 * @returns {Element|null}
 */
FastClick.prototype.findControl = function(labelElement) {
	'use strict';

	// Fast path for newer browsers supporting the HTML5 control attribute
	if (labelElement.control !== undefined) {
		return labelElement.control;
	}

	// All browsers under test that support touch events also support the HTML5 htmlFor attribute
	if (labelElement.htmlFor) {
		return document.getElementById(labelElement.htmlFor);
	}

	// If no for attribute exists, attempt to retrieve the first labellable descendant element
	// the list of which is defined here: http://www.w3.org/TR/html5/forms.html#category-label
	return labelElement.querySelector('button, input:not([type=hidden]), keygen, meter, output, progress, select, textarea');
};


/**
 * On touch end, determine whether to send a click event at once.
 *
 * @param {Event} event
 * @returns {boolean}
 */
FastClick.prototype.onTouchEnd = function(event) {
	'use strict';
	var forElement, trackingClickStart, targetTagName, scrollParent, touch, targetElement = this.targetElement;

	// If the touch has moved, cancel the click tracking
	if (this.touchHasMoved(event)) {
		this.trackingClick = false;
		this.targetElement = null;
	}

	if (!this.trackingClick) {
		return true;
	}

	// Prevent phantom clicks on fast double-tap (issue #36)
	if ((event.timeStamp - this.lastClickTime) < 200) {
		this.cancelNextClick = true;
		return true;
	}

	this.lastClickTime = event.timeStamp;

	trackingClickStart = this.trackingClickStart;
	this.trackingClick = false;
	this.trackingClickStart = 0;

	// On some iOS devices, the targetElement supplied with the event is invalid if the layer
	// is performing a transition or scroll, and has to be re-detected manually. Note that
	// for this to function correctly, it must be called *after* the event target is checked!
	// See issue #57; also filed as rdar://13048589 .
	if (this.deviceIsIOSWithBadTarget) {
		touch = event.changedTouches[0];
		targetElement = document.elementFromPoint(touch.pageX - window.pageXOffset, touch.pageY - window.pageYOffset);
	}

	targetTagName = targetElement.tagName.toLowerCase();
	if (targetTagName === 'label') {
		forElement = this.findControl(targetElement);
		if (forElement) {
			this.focus(targetElement);
			if (this.deviceIsAndroid) {
				return false;
			}

			targetElement = forElement;
		}
	} else if (this.needsFocus(targetElement)) {

		// Case 1: If the touch started a while ago (best guess is 100ms based on tests for issue #36) then focus will be triggered anyway. Return early and unset the target element reference so that the subsequent click will be allowed through.
		// Case 2: Without this exception for input elements tapped when the document is contained in an iframe, then any inputted text won't be visible even though the value attribute is updated as the user types (issue #37).
		if ((event.timeStamp - trackingClickStart) > 100 || (this.deviceIsIOS && window.top !== window && targetTagName === 'input')) {
			this.targetElement = null;
			return false;
		}

		this.focus(targetElement);

		// Select elements need the event to go through on iOS 4, otherwise the selector menu won't open.
		if (!this.deviceIsIOS4 || targetTagName !== 'select') {
			this.targetElement = null;
			event.preventDefault();
		}

		return false;
	}

	if (this.deviceIsIOS && !this.deviceIsIOS4) {

		// Don't send a synthetic click event if the target element is contained within a parent layer that was scrolled
		// and this tap is being used to stop the scrolling (usually initiated by a fling - issue #42).
		scrollParent = targetElement.fastClickScrollParent;
		if (scrollParent && scrollParent.fastClickLastScrollTop !== scrollParent.scrollTop) {
			return true;
		}
	}

	// Prevent the actual click from going though - unless the target node is marked as requiring
	// real clicks or if it is in the whitelist in which case only non-programmatic clicks are permitted.
	if (!this.needsClick(targetElement)) {
		event.preventDefault();
		var self = this;
		setTimeout(function(){
			self.sendClick(targetElement, event);
		}, 0);
	}

	return false;
};


/**
 * On touch cancel, stop tracking the click.
 *
 * @returns {void}
 */
FastClick.prototype.onTouchCancel = function() {
	'use strict';
	this.trackingClick = false;
	this.targetElement = null;
};


/**
 * Determine mouse events which should be permitted.
 *
 * @param {Event} event
 * @returns {boolean}
 */
FastClick.prototype.onMouse = function(event) {
	'use strict';

	// If a target element was never set (because a touch event was never fired) allow the event
	if (!this.targetElement) {
		return true;
	}

	if (event.forwardedTouchEvent) {
		return true;
	}

	// Programmatically generated events targeting a specific element should be permitted
	if (!event.cancelable) {
		return true;
	}

	// Derive and check the target element to see whether the mouse event needs to be permitted;
	// unless explicitly enabled, prevent non-touch click events from triggering actions,
	// to prevent ghost/doubleclicks.
	if (!this.needsClick(this.targetElement) || this.cancelNextClick) {

		// Prevent any user-added listeners declared on FastClick element from being fired.
		if (event.stopImmediatePropagation) {
			event.stopImmediatePropagation();
		} else {

			// Part of the hack for browsers that don't support Event#stopImmediatePropagation (e.g. Android 2)
			event.propagationStopped = true;
		}

		// Cancel the event
		event.stopPropagation();
		event.preventDefault();

		return false;
	}

	// If the mouse event is permitted, return true for the action to go through.
	return true;
};


/**
 * On actual clicks, determine whether this is a touch-generated click, a click action occurring
 * naturally after a delay after a touch (which needs to be cancelled to avoid duplication), or
 * an actual click which should be permitted.
 *
 * @param {Event} event
 * @returns {boolean}
 */
FastClick.prototype.onClick = function(event) {
	'use strict';
	var permitted;

	// It's possible for another FastClick-like library delivered with third-party code to fire a click event before FastClick does (issue #44). In that case, set the click-tracking flag back to false and return early. This will cause onTouchEnd to return early.
	if (this.trackingClick) {
		this.targetElement = null;
		this.trackingClick = false;
		return true;
	}

	// Very odd behaviour on iOS (issue #18): if a submit element is present inside a form and the user hits enter in the iOS simulator or clicks the Go button on the pop-up OS keyboard the a kind of 'fake' click event will be triggered with the submit-type input element as the target.
	if (event.target.type === 'submit' && event.detail === 0) {
		return true;
	}

	permitted = this.onMouse(event);

	// Only unset targetElement if the click is not permitted. This will ensure that the check for !targetElement in onMouse fails and the browser's click doesn't go through.
	if (!permitted) {
		this.targetElement = null;
	}

	// If clicks are permitted, return true for the action to go through.
	return permitted;
};


/**
 * Remove all FastClick's event listeners.
 *
 * @returns {void}
 */
FastClick.prototype.destroy = function() {
	'use strict';
	var layer = this.layer;

	if (this.deviceIsAndroid) {
		layer.removeEventListener('mouseover', this.onMouse, true);
		layer.removeEventListener('mousedown', this.onMouse, true);
		layer.removeEventListener('mouseup', this.onMouse, true);
	}

	layer.removeEventListener('click', this.onClick, true);
	layer.removeEventListener('touchstart', this.onTouchStart, false);
	layer.removeEventListener('touchend', this.onTouchEnd, false);
	layer.removeEventListener('touchcancel', this.onTouchCancel, false);
};


if (typeof define !== 'undefined' && define.amd) {

	// AMD. Register as an anonymous module.
	define(function() {
		'use strict';
		return FastClick;
	});
}

if (typeof module !== 'undefined' && module.exports) {
	module.exports = function(layer) {
		'use strict';
		return new FastClick(layer);
	};

	module.exports.FastClick = FastClick;
}


// --------------------- //
// FAST CLICK ACTIVATION //
// --------------------- //
if (typeof window.addEventListener != "undefined"){
  window.addEventListener('load', function() {
    new FastClick(document.body);
  }, false);
}