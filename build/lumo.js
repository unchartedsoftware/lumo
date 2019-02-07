'use strict';

var EventType = require('./event/EventType');

module.exports = {
  // events
  CLICK: EventType.CLICK,
  DBL_CLICK: EventType.DBL_CLICK,
  MOUSE_DOWN: EventType.MOUSE_DOWN,
  MOUSE_UP: EventType.MOUSE_UP,
  MOUSE_MOVE: EventType.MOUSE_MOVE,
  MOUSE_OVER: EventType.MOUSE_OVER,
  MOUSE_OUT: EventType.MOUSE_OUT,
  PAN_START: EventType.PAN_START,
  PAN: EventType.PAN,
  PAN_END: EventType.PAN_END,
  ZOOM_START: EventType.ZOOM_START,
  ZOOM: EventType.ZOOM,
  ZOOM_END: EventType.ZOOM_END,
  RESIZE: EventType.RESIZE,
  FRAME: EventType.FRAME,
  REFRESH: EventType.REFRESH,
  TILE_REQUEST: EventType.TILE_REQUEST,
  TILE_FAILURE: EventType.TILE_FAILURE,
  TILE_ADD: EventType.TILE_ADD,
  TILE_DISCARD: EventType.TILE_DISCARD,
  TILE_REMOVE: EventType.TILE_REMOVE,
  CELL_UPDATE: EventType.CELL_UPDATE,
  // event
  Event: require('./event/Event'),
  MouseEvent: require('./event/MouseEvent'),
  ResizeEvent: require('./event/ResizeEvent'),
  TileEvent: require('./event/TileEvent'),
  // geometry
  Bounds: require('./geometry/Bounds'),
  RTree: require('./geometry/RTree'),
  RTreePyramid: require('./geometry/RTreePyramid'),
  CircleCollidable: require('./geometry/CircleCollidable'),
  RectangleCollidable: require('./geometry/RectangleCollidable'),
  RingCollidable: require('./geometry/RingCollidable'),
  // plot
  Plot: require('./plot/Plot'),
  // layer
  Layer: require('./layer/Layer'),
  // tile layer
  TileLayer: require('./layer/tile/TileLayer'),
  // overlay layer
  Overlay: require('./layer/overlay/Overlay'),
  PointOverlay: require('./layer/overlay/PointOverlay'),
  PolylineOverlay: require('./layer/overlay/PolylineOverlay'),
  PolygonOverlay: require('./layer/overlay/PolygonOverlay'),
  // renderer
  Renderer: require('./renderer/Renderer'),
  // tile renderer
  TileRenderer: require('./renderer/tile/TileRenderer'),
  // webgl tile renderer
  WebGLTileRenderer: require('./renderer/tile/WebGLTileRenderer'),
  ImageTileRenderer: require('./renderer/tile/sample/ImageTileRenderer'),
  InteractiveTileRenderer: require('./renderer/tile/sample/InteractiveTileRenderer'),
  PointTileRenderer: require('./renderer/tile/sample/PointTileRenderer'),
  InstancedTileRenderer: require('./renderer/tile/sample/InstancedTileRenderer'),
  // overlay renderer
  OverlayRenderer: require('./renderer/overlay/OverlayRenderer'),
  // webgl overlay renderer
  WebGLOverlayRenderer: require('./renderer/overlay/WebGLOverlayRenderer'),
  PointOverlayRenderer: require('./renderer/overlay/sample/PointOverlayRenderer'),
  PolylineOverlayRenderer: require('./renderer/overlay/sample/PolylineOverlayRenderer'),
  PolygonOverlayRenderer: require('./renderer/overlay/sample/PolygonOverlayRenderer'),
  // webgl shader
  Shader: require('./webgl/shader/Shader'),
  // webgl texture
  Texture: require('./webgl/texture/Texture'),
  TextureArray: require('./webgl/texture/TextureArray'),
  // webgl vertex
  VertexAtlas: require('./webgl/vertex/VertexAtlas'),
  VertexBuffer: require('./webgl/vertex/VertexBuffer'),
  IndexBuffer: require('./webgl/vertex/IndexBuffer'),
  // util
  loadBuffer: require('./util/loadBuffer'),
  loadImage: require('./util/loadImage')
};
'use strict';
/**
 * Class representing an event.
 */

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Event =
/**
 * Instantiates a new Event object.
 *
 * @param {Object} target - The object that fired the event.
 * @param {number} timestamp - The timestamp when the event was created. Optional.
 */
function Event(target) {
  var timestamp = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : Date.now();

  _classCallCheck(this, Event);

  this.target = target;
  this.timestamp = timestamp;
};

module.exports = Event;
'use strict';
/**
 * Class representing an event broadcaster.
 * @private
 */

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

var EventBroadcaster =
/*#__PURE__*/
function () {
  /**
   * Instantiates a new EventBroadcaster object.
   *
   * @param {Plot} plot - The plot to attach the broadcaster to.
   */
  function EventBroadcaster(plot) {
    _classCallCheck(this, EventBroadcaster);

    this.plot = plot;
  }
  /**
   * Broadcasts the provided event type to all children of the plot.
   *
   * @param {string} type - The event type to broadcast.
   */


  _createClass(EventBroadcaster, [{
    key: "broadcast",
    value: function broadcast(type) {
      var _this = this;

      this.plot.on(type, function (event) {
        var children = _this.plot.getSortedLayers();

        for (var i = children.length - 1; i >= 0; i--) {
          if (!children[i].isHidden()) {
            children[i].emit(type, event);
          }
        }
      });
    }
  }]);

  return EventBroadcaster;
}();

module.exports = EventBroadcaster;
'use strict';

var _DELEGATION_FUNCS;

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

var EventType = require('./EventType');

var MouseEvent = require('./MouseEvent');

var setCursor = function setCursor(plot) {
  plot.getContainer().style.cursor = 'pointer';
};

var resetCursor = function resetCursor(plot) {
  plot.getContainer().style.cursor = 'inherit';
};

var copyEvent = function copyEvent(target, data, event) {
  return new MouseEvent(target, event.originalEvent, {
    x: event.pos.x,
    y: event.pos.y
  }, {
    x: event.px.x,
    y: event.px.y
  }, data);
};

var delegateMouseMove = function delegateMouseMove(delegator, child, event, collision) {
  // create events to delegate
  var delegations = [];
  var prev = delegator.prevMouseover;

  if (!collision) {
    //  no collision
    // check for prev
    if (prev) {
      // clear cursor style
      resetCursor(delegator.plot); // un-highlight previous target

      prev.target.unhighlight(); // `mouseout` on previous target

      delegations.push({
        type: EventType.MOUSE_OUT,
        event: copyEvent(prev.target, prev.data, prev)
      }); // unflag as prev `mouseover` target

      delegator.prevMouseover = null;
    }
  } else {
    // collision
    // check for prev
    if (prev && prev.data !== collision) {
      // un-highlight previous target
      prev.target.unhighlight(); // `mouseout` on previous target

      delegations.push({
        type: EventType.MOUSE_OUT,
        event: copyEvent(prev.target, prev.data, prev)
      });
    } // `mousemove` on current target


    delegations.push({
      type: EventType.MOUSE_MOVE,
      event: copyEvent(child, collision, event)
    }); // set cursor for hover

    setCursor(delegator.plot); // highlight

    child.highlight(collision);

    if (!prev || prev.data !== collision) {
      // `mouseover` on current
      delegations.push({
        type: EventType.MOUSE_OVER,
        event: copyEvent(child, collision, event)
      });
    } // flag as prev `mouseover`


    delegator.prevMouseover = delegations[delegations.length - 1].event;
  }

  return delegations;
};

var delegateMouseUp = function delegateMouseUp(delegator, child, event, collision) {
  if (collision) {
    return [{
      type: EventType.MOUSE_UP,
      event: copyEvent(child, collision, event)
    }];
  }

  return [];
};

var delegateMouseDown = function delegateMouseDown(delegator, child, event, collision) {
  if (collision) {
    return [{
      type: EventType.MOUSE_DOWN,
      event: copyEvent(child, collision, event)
    }];
  }

  return [];
};

var delegateClick = function delegateClick(delegator, child, event, collision) {
  // check if multi-select is enabled
  var multiSelect = event.originalEvent.ctrlKey || event.originalEvent.metaKey;

  if (collision) {
    // select
    if (!child.isSelected(collision)) {
      if (!multiSelect) {
        // if not multi-select, unselect the data prev selected data
        delegator.prevClick.forEach(function (prev) {
          prev.target.unselectAll();
        });
        delegator.prevClick = [];
      } // if not already selected, add to selection


      child.select(collision, multiSelect);
    } else {
      if (multiSelect) {
        // remove if already selected
        child.unselect(collision);
      }
    } // `click` event


    var delegation = {
      type: EventType.CLICK,
      event: copyEvent(child, collision, event)
    }; // flag as prev `click` target

    delegator.prevClick.push(delegation.event); // return delegation

    return [delegation];
  } else {
    if (delegator.prevClick.length > 0) {
      if (multiSelect) {
        // if multi-select is held, don't clear selection, assume the
        // user may have misclicked
        return [];
      } // unselect the data


      delegator.prevClick.forEach(function (prev) {
        prev.target.unselectAll();
      }); // unflag as prev `click` target

      delegator.prevClick = [];
    }
  }

  return [];
};

var delegateDblClick = function delegateDblClick(delegator, child, event, collision) {
  if (collision) {
    return [{
      type: EventType.DBL_CLICK,
      event: copyEvent(child, collision, event)
    }];
  }

  return [];
};

var DELEGATION_FUNCS = (_DELEGATION_FUNCS = {}, _defineProperty(_DELEGATION_FUNCS, EventType.MOUSE_MOVE, delegateMouseMove), _defineProperty(_DELEGATION_FUNCS, EventType.MOUSE_UP, delegateMouseUp), _defineProperty(_DELEGATION_FUNCS, EventType.MOUSE_DOWN, delegateMouseDown), _defineProperty(_DELEGATION_FUNCS, EventType.CLICK, delegateClick), _defineProperty(_DELEGATION_FUNCS, EventType.DBL_CLICK, delegateDblClick), _DELEGATION_FUNCS);
/**
 * Class representing an event delegator.
 * @private
 */

var EventDelegator =
/*#__PURE__*/
function () {
  /**
   * Instantiates a new EventDelegator object.
   *
   * @param {Plot} plot - The plot to attach the handler to.
   */
  function EventDelegator(plot) {
    _classCallCheck(this, EventDelegator);

    this.plot = plot;
    this.prevClick = [];
    this.prevMouseover = null;
  }
  /**
   * Delegates the provided event type to all children of the plot.
   *
   * @param {string} type - The event type to delegate.
   */


  _createClass(EventDelegator, [{
    key: "delegate",
    value: function delegate(type) {
      var _this = this;

      // get appropriate delegation function
      var func = DELEGATION_FUNCS[type];

      if (!func) {
        throw "Delegation for event type ".concat(type, " is not supported");
      } // attach delegation handler


      this.plot.on(type, function (event) {
        // get children sorted by z-index
        var children = _this.plot.getSortedLayers(); // pick children, by priority


        var collision = null;
        var child = null;

        for (var i = children.length - 1; i >= 0; i--) {
          if (!children[i].isHidden()) {
            collision = children[i].pick(event.pos);

            if (collision) {
              child = children[i];
              break;
            }
          }
        } // delegate using provided func


        var delegations = func(_this, child, event, collision); // delegate the accumulated events

        for (var _i = 0; _i < delegations.length; _i++) {
          var delegation = delegations[_i];
          delegation.event.target.emit(delegation.type, delegation.event);
        }
      });
    }
  }]);

  return EventDelegator;
}();

module.exports = EventDelegator;
'use strict';
/**
 * Event type string constants.
 */

module.exports = {
  /**
   * Emitted when the plot is clicked.
   * @constant {string}
   */
  CLICK: 'click',

  /**
   * Emitted when the plot is double clicked.
   * @constant {string}
   */
  DBL_CLICK: 'dblclick',

  /**
   * Emitted when a mouse button is pressed.
   * @constant {string}
   */
  MOUSE_DOWN: 'mousedown',

  /**
   * Emitted when a mouse button is released.
   * @constant {string}
   */
  MOUSE_UP: 'mouseup',

  /**
   * Emitted when the mouse is moved on the target.
   * @constant {string}
   */
  MOUSE_MOVE: 'mousemove',

  /**
   * Emitted when the mouse is moved onto the target.
   * @constant {string}
   */
  MOUSE_OVER: 'mouseover',

  /**
   * Emitted when the mouse is moved out of the target.
   * @constant {string}
   */
  MOUSE_OUT: 'mouseout',

  /**
   * Emitted when a new pan event is handled.
   * @constant {string}
   */
  PAN_START: 'panstart',

  /**
   * Emitted during each frame of a pan animation.
   * @constant {string}
   */
  PAN: 'pan',

  /**
   * Emitted on the final frame of a pan animation.
   * @constant {string}
   */
  PAN_END: 'panend',

  /**
   * Emitted when a new zoom event is handled.
   * @constant {string}
   */
  ZOOM_START: 'zoomstart',

  /**
   * Emitted during each frame of a zoom animation.
   * @constant {string}
   */
  ZOOM: 'zoom',

  /**
   * Emitted on the final frame of a zoom animation.
   * @constant {string}
   */
  ZOOM_END: 'zoomend',

  /**
   * Emitted before processing a new frame.
   * @constant {string}
   */
  FRAME: 'frame',

  /**
   * Emitted when processing a resize event.
   * @constant {string}
   */
  RESIZE: 'resize',

  /**
   * Emitted when the viewing cell of the plot is updated.
   * @constant {string}
   */
  CELL_UPDATE: 'cellupdate',

  /**
   * Emitted when the layer is refreshed.
   * @constant {string}
   */
  REFRESH: 'refresh',

  /**
   * Emitted when an initial request for a tile is made, the tile is not
   * yet part of the layer and has not yet been requested.
   * @constant {string}
   */
  TILE_REQUEST: 'tilerequest',

  /**
   * Emitted when a tile request completes unsuccessfully. The tile is not
   * added to the layer.
   * @constant {string}
   */
  TILE_FAILURE: 'tilefailure',

  /**
   * Emitted when a tile request completes successfully. The tile is added
   * to the layer.
   * @constant {string}
   */
  TILE_ADD: 'tileadd',

  /**
   * Emitted when a tile request completes successfully but the tile is no
   * longer in view. The tile is not added to the layer.
   * @constant {string}
   */
  TILE_DISCARD: 'tilediscard',

  /**
   * Emitted when a tile is evicted from the internal LRU cache.
   * @constant {string}
   */
  TILE_REMOVE: 'tileremove',

  /**
   * Emitted when all visible tiles have been loaded for a layer.
   * @constant {string}
   */
  LOAD: 'load'
};
'use strict';

function _typeof(obj) { if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (call && (_typeof(call) === "object" || typeof call === "function")) { return call; } return _assertThisInitialized(self); }

function _assertThisInitialized(self) { if (self === void 0) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return self; }

function _getPrototypeOf(o) { _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf : function _getPrototypeOf(o) { return o.__proto__ || Object.getPrototypeOf(o); }; return _getPrototypeOf(o); }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function"); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, writable: true, configurable: true } }); if (superClass) _setPrototypeOf(subClass, superClass); }

function _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf || function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }

var Event = require('./Event');
/**
 * Class representing a mouse event.
 */


var MouseEvent =
/*#__PURE__*/
function (_Event) {
  _inherits(MouseEvent, _Event);

  /**
   * Instantiates a new MouseEvent object.
   *
   * @param {Object} target - The object that fired the event.
   * @param {string} event - The original DOM mouse event fired by the browser.
   * @param {Object} pos - The position of the mouse event in plot coordinates.
   * @param {Object} px - The position of the mouse event in viewport pixel coordinates.
   * @param {Object} data - The data associated with the event.
   */
  function MouseEvent(target, event, pos, px) {
    var _this;

    var data = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : null;

    _classCallCheck(this, MouseEvent);

    _this = _possibleConstructorReturn(this, _getPrototypeOf(MouseEvent).call(this, target));
    _this.originalEvent = event;
    _this.pos = pos;
    _this.px = px;
    _this.data = data;
    return _this;
  }

  return MouseEvent;
}(Event);

module.exports = MouseEvent;
'use strict';

function _typeof(obj) { if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (call && (_typeof(call) === "object" || typeof call === "function")) { return call; } return _assertThisInitialized(self); }

function _assertThisInitialized(self) { if (self === void 0) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return self; }

function _getPrototypeOf(o) { _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf : function _getPrototypeOf(o) { return o.__proto__ || Object.getPrototypeOf(o); }; return _getPrototypeOf(o); }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function"); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, writable: true, configurable: true } }); if (superClass) _setPrototypeOf(subClass, superClass); }

function _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf || function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }

var Event = require('./Event');
/**
 * Class representing a resize event.
 */


var ResizeEvent =
/*#__PURE__*/
function (_Event) {
  _inherits(ResizeEvent, _Event);

  /**
   * Instantiates a new ResizeEvent object.
   *
   * @param {Object} target - The object that fired the event.
   * @param {number} oldSize - The old size of the viewport.
   * @param {number} newSize - The new size of the viewport.
   */
  function ResizeEvent(target, oldSize, newSize) {
    var _this;

    _classCallCheck(this, ResizeEvent);

    _this = _possibleConstructorReturn(this, _getPrototypeOf(ResizeEvent).call(this, target));
    _this.oldSize = oldSize;
    _this.newSize = newSize;
    return _this;
  }

  return ResizeEvent;
}(Event);

module.exports = ResizeEvent;
'use strict';

function _typeof(obj) { if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (call && (_typeof(call) === "object" || typeof call === "function")) { return call; } return _assertThisInitialized(self); }

function _assertThisInitialized(self) { if (self === void 0) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return self; }

function _getPrototypeOf(o) { _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf : function _getPrototypeOf(o) { return o.__proto__ || Object.getPrototypeOf(o); }; return _getPrototypeOf(o); }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function"); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, writable: true, configurable: true } }); if (superClass) _setPrototypeOf(subClass, superClass); }

function _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf || function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }

var Event = require('./Event');
/**
 * Class representing a tile event.
 */


var TileEvent =
/*#__PURE__*/
function (_Event) {
  _inherits(TileEvent, _Event);

  /**
   * Instantiates a new TileEvent object.
   *
   * @param {Object} target - The object that fired the event.
   * @param {number} tile - The tile object.
   */
  function TileEvent(target, tile) {
    var _this;

    _classCallCheck(this, TileEvent);

    _this = _possibleConstructorReturn(this, _getPrototypeOf(TileEvent).call(this, target));
    _this.tile = tile;
    return _this;
  }

  return TileEvent;
}(Event);

module.exports = TileEvent;
'use strict'; // Constants

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

var INSIDE = 0x00; // 0000

var LEFT = 0x01; // 0001

var RIGHT = 0x02; // 0010

var BOTTOM = 0x04; // 0100

var TOP = 0x08; // 1000

var computeCode = function computeCode(bounds, x, y) {
  var code = INSIDE;

  if (x < bounds.left) {
    // to the left of clip window
    code |= LEFT;
  } else if (x > bounds.right) {
    // to the right of clip window
    code |= RIGHT;
  }

  if (y < bounds.bottom) {
    // below the clip window
    code |= BOTTOM;
  } else if (y > bounds.top) {
    // above the clip window
    code |= TOP;
  }

  return code;
};

var sutherlandHodgemanClip = function sutherlandHodgemanClip(bounds, points) {
  // Sutherland-Hodgeman clipping algorithm clips a polygon against a
  // rectangle.
  var result;

  for (var code = 1; code <= 8; code *= 2) {
    result = [];
    var prev = points[points.length - 1];
    var prevInside = !(computeCode(bounds, prev.x, prev.y) & code);

    for (var i = 0; i < points.length; i++) {
      var p = points[i];
      var inside = !(computeCode(bounds, p.x, p.y) & code); // if segment goes through the clip window, add an intersection

      if (inside !== prevInside) {
        var ax = prev.x;
        var ay = prev.y;
        var bx = p.x;
        var by = p.y;
        var x = void 0,
            y = 0;

        if (code & TOP) {
          // point is above the clip rectangle
          x = ax + (bx - ax) * (bounds.top - ay) / (by - ay);
          y = bounds.top;
        } else if (code & BOTTOM) {
          // point is below the clip rectangle
          x = ax + (bx - ax) * (bounds.bottom - ay) / (by - ay);
          y = bounds.bottom;
        } else if (code & RIGHT) {
          // point is to the right of clip rectangle
          y = ay + (by - ay) * (bounds.right - ax) / (bx - ax);
          x = bounds.right;
        } else {
          //if (code & LEFT) {
          // point is to the left of clip rectangle
          y = ay + (by - ay) * (bounds.left - ax) / (bx - ax);
          x = bounds.left;
        }

        result.push({
          x: x,
          y: y
        });
      }

      if (inside) {
        // add a point if it's inside
        result.push(p);
      }

      prev = p;
      prevInside = inside;
    }

    points = result;

    if (!points.length) {
      break;
    }
  }

  return result.length > 0 ? result : null;
};

var cohenSutherlandClip = function cohenSutherlandClip(bounds, a, b) {
  // Cohen–Sutherland clipping algorithm clips a line against a rectangle.
  // copy so we don't change in-place
  var ax = a.x;
  var ay = a.y;
  var bx = b.x;
  var by = b.y; // compute outcodes for P0, P1, and whatever point lies outside the clip rectangle

  var aCode = computeCode(bounds, ax, ay);
  var bCode = computeCode(bounds, bx, by);
  var accept = false; // normal alg has infiinite while loop, cap at 8 iterations just in case

  var MAX_ITERATIONS = 8;
  var iter = 0;

  while (iter < MAX_ITERATIONS) {
    if (!(aCode | bCode)) {
      // bitwise OR is 0. Trivially accept and get out of loop
      accept = true;
      break;
    } else if (aCode & bCode) {
      // bitwise AND is not 0. (implies both end points are in the same
      // region outside the window). Reject and get out of loop
      break;
    } else {
      // failed both tests, so calculate the line segment to clip
      // from an outside point to an intersection with clip edge
      var x = void 0,
          y = 0; // At least one endpoint is outside the clip rectangle; pick it.

      var code = aCode ? aCode : bCode; // Now find the intersection point;
      // use formulas
      // y = ay + slope * (x - ax), x = ax + (1 / slope) * (y - ay)

      if (code & TOP) {
        // point is above the clip rectangle
        x = ax + (bx - ax) * (bounds.top - ay) / (by - ay);
        y = bounds.top;
      } else if (code & BOTTOM) {
        // point is below the clip rectangle
        x = ax + (bx - ax) * (bounds.bottom - ay) / (by - ay);
        y = bounds.bottom;
      } else if (code & RIGHT) {
        // point is to the right of clip rectangle
        y = ay + (by - ay) * (bounds.right - ax) / (bx - ax);
        x = bounds.right;
      } else {
        //if (code & LEFT) {
        // point is to the left of clip rectangle
        y = ay + (by - ay) * (bounds.left - ax) / (bx - ax);
        x = bounds.left;
      } // now we move outside point to intersection point to clip
      // and get ready for next pass.


      if (code === aCode) {
        ax = x;
        ay = y;
        aCode = computeCode(bounds, ax, ay);
      } else {
        bx = x;
        by = y;
        bCode = computeCode(bounds, bx, by);
      }
    }

    iter++;
  }

  if (accept) {
    return [{
      x: ax,
      y: ay
    }, {
      x: bx,
      y: by
    }];
  }

  return null;
};
/**
 * Class representing a set of bounds.
 */


var Bounds =
/*#__PURE__*/
function () {
  /**
   * Instantiates a new Bounds object.
   *
   * @param {number} left - The left bound.
   * @param {number} right - The right bound.
   * @param {number} bottom - The bottom bound.
   * @param {number} top - The top bound.
   */
  function Bounds(left, right, bottom, top) {
    _classCallCheck(this, Bounds);

    this.left = left;
    this.right = right;
    this.bottom = bottom;
    this.top = top;
  }
  /**
   * Get the width of the bounds.
   *
   * @returns {number} The width of the bounds.
   */


  _createClass(Bounds, [{
    key: "getWidth",
    value: function getWidth() {
      return this.right - this.left;
    }
    /**
     * Get the height of the bounds.
     *
     * @returns {number} The height of the bounds.
     */

  }, {
    key: "getHeight",
    value: function getHeight() {
      return this.top - this.bottom;
    }
    /**
     * Extends the bounds by the provided point or bounds object.
     *
     * @param {Object|Bounds} arg - The point or bounds to extend the bounds by.
     *
     * @returns {Bounds} The bounds object, for chaining.
     */

  }, {
    key: "extend",
    value: function extend(arg) {
      if (arg.left !== undefined && arg.right !== undefined && arg.bottom !== undefined && arg.top !== undefined) {
        // bounds
        if (arg.left < this.left) {
          this.left = arg.left;
        }

        if (arg.right > this.right) {
          this.right = arg.right;
        }

        if (arg.bottom < this.bottom) {
          this.bottom = arg.bottom;
        }

        if (arg.top > this.top) {
          this.top = arg.top;
        }
      } else {
        // point
        if (arg.x < this.left) {
          this.left = arg.x;
        }

        if (arg.x > this.right) {
          this.right = arg.x;
        }

        if (arg.y < this.bottom) {
          this.bottom = arg.y;
        }

        if (arg.y > this.top) {
          this.top = arg.y;
        }
      }
    }
    /**
     * Get the center coordinate of the bounds.
     *
     * @returns {Object} The center coordinate of the bounds.
     */

  }, {
    key: "getCenter",
    value: function getCenter() {
      return {
        x: this.left + this.getWidth() / 2,
        y: this.bottom + this.getHeight() / 2
      };
    }
    /**
     * Test if the bounds equals another.
     *
     * @param {Bounds} bounds - The bounds object to test.
     *
     * @returns {boolean} Whether or not the bounds objects are equal.
     */

  }, {
    key: "equals",
    value: function equals(bounds) {
      return this.left === bounds.left && this.right === bounds.right && this.bottom === bounds.bottom && this.top === bounds.top;
    }
    /**
     * Test if the bounds overlaps another. Test is inclusive of edges.
     *
     * @param {Bounds} bounds - The bounds object to test.
     *
     * @returns {boolean} Whether or not the bounds overlap eachother.
     */

  }, {
    key: "overlaps",
    value: function overlaps(bounds) {
      // NOTE: inclusive of edges
      return !(this.left > bounds.right || this.right < bounds.left || this.top < bounds.bottom || this.bottom > bounds.top);
    }
    /**
     * Return the intersection of the bounds. Test is inclusive of edges. If
     * the bounds do not intersect, returns undefined.
     *
     * @param {Bounds} bounds - The bounds object to intersect.
     *
     * @returns {Bounds} The intersection of both bounds.
     */

  }, {
    key: "intersection",
    value: function intersection(bounds) {
      // NOTE: inclusive of edges
      if (!this.overlaps(bounds)) {
        return undefined;
      }

      return new Bounds(Math.max(this.left, bounds.left), Math.min(this.right, bounds.right), Math.max(this.bottom, bounds.bottom), Math.min(this.top, bounds.top));
    }
    /**
     * Clips the provided line segment to within the dimensions of the bounds.
     * Test is inclusive of edges.
     *
     * @param {Array} line - The line.
     *
     * @returns {Array} The clipped line, or null if it is outside the bounds.
     */

  }, {
    key: "clipLine",
    value: function clipLine(line) {
      if (!line || line.length !== 2) {
        return null;
      }

      return cohenSutherlandClip(this, line[0], line[1]);
    }
    /**
     * Clips the provided polyline to within the dimensions of the bounds. Will
     * return an array of clipped polylines as result.
     * Test is inclusive of edges.
     *
     * @param {Array} polyline - The polyline.
     *
     * @returns {Array} The resulting clipped polylines, or null if it is outside the bounds.
     */

  }, {
    key: "clipPolyline",
    value: function clipPolyline(polyline) {
      if (!polyline || polyline.length < 2) {
        return null;
      }

      var clipped = [];
      var current = [];

      for (var i = 1; i < polyline.length; i++) {
        var a = polyline[i - 1];
        var b = polyline[i]; // clip the line

        var line = cohenSutherlandClip(this, a, b); // no line in bounds

        if (!line) {
          continue;
        }

        var clippedA = line[0];
        var clippedB = line[1]; // add src point

        current.push(clippedA);

        if (clippedB.x !== b.x && clippedB.y !== b.y || i === polyline.length - 1) {
          // only add destination point if it was clipped, or is last
          // point
          current.push(clippedB); // then break the polyline

          clipped.push(current);
          current = [];
        }
      }

      return clipped.length > 0 ? clipped : null;
    }
    /**
     * Clips the provided points to those within the dimensions of the bounds.
     * Test is inclusive of edges.
     *
     * @param {Array} points - The points to clip.
     *
     * @returns {Array} The clipped points, or null if none are within the bounds.
     */

  }, {
    key: "clipPoints",
    value: function clipPoints(points) {
      if (!points) {
        return null;
      }

      var clipped = [];

      for (var i = 0; i < points.length; i++) {
        var point = points[i];

        if (point.x >= this.left && point.x <= this.right && point.y >= this.bottom && point.y <= this.top) {
          clipped.push(point);
        }
      }

      return clipped.length > 0 ? clipped : null;
    }
    /**
     * Clips the provided polygon to those within the dimensions of the bounds.
     * Test is inclusive of edges.
     *
     * @param {Array} polygon - The points of the polygon to clip.
     *
     * @returns {Array} The clipped points of the polygon, or null if it is not within the bounds.
     */

  }, {
    key: "clipPolygon",
    value: function clipPolygon(polygon) {
      if (!polygon || polygon.length < 3) {
        return null;
      }

      return sutherlandHodgemanClip(this, polygon);
    }
  }]);

  return Bounds;
}();

module.exports = Bounds;
'use strict';

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

var clamp = require('lodash/clamp');
/**
 * Class representing a circle collidable.
 */


var CircleCollidable =
/*#__PURE__*/
function () {
  /**
   * Instantiates a new CircleCollidable object.
   *
   * @param {number} x - The tile x pixel coordinate.
   * @param {number} y - The tile y pixel coordinate.
   * @param {number} radius - The radius in pixels.
   * @param {number} xOffset - The tile x offset in pixels.
   * @param {number} yOffset - The tile y offset in pixels.
   * @param {Tile} tile - The tile object.
   * @param {Object} data - Any arbitrary user data.
   */
  function CircleCollidable(x, y, radius, xOffset, yOffset, tile, data) {
    _classCallCheck(this, CircleCollidable);

    this.x = x;
    this.y = y;
    this.radius = radius;
    this.minX = x + xOffset - radius;
    this.maxX = x + xOffset + radius;
    this.minY = y + yOffset - radius;
    this.maxY = y + yOffset + radius;
    this.tile = tile;
    this.data = data;
  }
  /**
   * Test if the provided position is within the inner shape of the collidable.
   *
   * @param {number} x - The x position to test.
   * @param {number} y - The y position to test.
   *
   * @returns {bool} Whether or not there is an intersection.
   */


  _createClass(CircleCollidable, [{
    key: "testPoint",
    value: function testPoint(x, y) {
      // center pos
      var cx = (this.minX + this.maxX) * 0.5;
      var cy = (this.minY + this.maxY) * 0.5; // distance to point

      var dx = cx - x;
      var dy = cy - y;
      return dx * dx + dy * dy <= this.radius * this.radius;
    }
    /**
     * Test if the provided rectangle is within the inner shape of the
     * collidable.
     *
     * @param {number} minX - The minimum x component.
     * @param {number} maxX - The maximum x component.
     * @param {number} minY - The minimum y component.
     * @param {number} maxY - The maximum y component.
     *
     * @returns {bool} Whether or not there is an intersection.
     */

  }, {
    key: "testRectangle",
    value: function testRectangle(minX, maxX, minY, maxY) {
      // circle pos
      var cx = (this.minX + this.maxX) * 0.5;
      var cy = (this.minY + this.maxY) * 0.5; // find closest point in rectangle to circle

      var nearestX = clamp(cx, minX, maxX);
      var nearestY = clamp(cy, minY, maxY); // test distance

      var dx = cx - nearestX;
      var dy = cy - nearestY;
      return dx * dx + dy * dy < this.radius * this.radius;
    }
  }]);

  return CircleCollidable;
}();

module.exports = CircleCollidable;
'use strict';

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

var rbush = require('rbush');

var defaultTo = require('lodash/defaultTo');
/**
 * Class representing an r-tree.
 */


var RTree =
/*#__PURE__*/
function () {
  /**
   * Instantiates a new RTree object.
   *
   * @param {Object} options - The options object.
   * @param {boolean} options.nodeCapacity - The node capacity of the r-tree.
   */
  function RTree(options) {
    _classCallCheck(this, RTree);

    this.tree = rbush(defaultTo(options.nodeCapacity, 32));
  }
  /**
   * Inserts an array of collidables into the r-tree.
   *
   * @param {Array} collidables - The array of collidables to insert.
   */


  _createClass(RTree, [{
    key: "insert",
    value: function insert(collidables) {
      this.tree.load(collidables);
    }
    /**
     * Removes an array of collidables from the r-tree.
     *
     * @param {Array} collidables - The array of collidables to remove.
     */

  }, {
    key: "remove",
    value: function remove(collidables) {
      var tree = this.tree;

      for (var i = 0; i < collidables.length; i++) {
        tree.remove(collidables[i]);
      }
    }
    /**
     * Searchs the r-tree using a point.
     *
     * @param {number} x - The x component.
     * @param {number} y - The y component.
     *
     * @returns {Object} The collision object.
     */

  }, {
    key: "searchPoint",
    value: function searchPoint(x, y) {
      var collisions = this.tree.search({
        minX: x,
        maxX: x,
        minY: y,
        maxY: y
      });

      if (collisions.length === 0) {
        return null;
      } // inner shape test


      for (var i = 0; i < collisions.length; i++) {
        var collision = collisions[i];

        if (collision.testPoint(x, y)) {
          return collision;
        }
      }

      return null;
    }
    /**
     * Searchs the r-tree using a rectangle.
     *
     * @param {number} minX - The minimum x component.
     * @param {number} maxX - The maximum x component.
     * @param {number} minY - The minimum y component.
     * @param {number} maxY - The maximum y component.
     *
     * @returns {Object} The collision object.
     */

  }, {
    key: "searchRectangle",
    value: function searchRectangle(minX, maxX, minY, maxY) {
      var collisions = this.tree.search({
        minX: minX,
        maxX: maxX,
        minY: minY,
        maxY: maxY
      });

      if (collisions.length === 0) {
        return null;
      } // inner shape test


      for (var i = 0; i < collisions.length; i++) {
        var collision = collisions[i];

        if (collision.testRectangle(minX, maxX, minY, maxY)) {
          return collision;
        }
      }

      return null;
    }
  }]);

  return RTree;
}();

module.exports = RTree;
'use strict';

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

var defaultTo = require('lodash/defaultTo');

var RTree = require('./RTree');
/**
 * Class representing a pyramid of r-trees.
 */


var RTreePyramid =
/*#__PURE__*/
function () {
  /**
   * Instantiates a new RTreePyramid object.
   *
   * @param {Object} options - The options object.
   * @param {boolean} options.nodeCapacity - The node capacity of the r-tree.
   */
  function RTreePyramid(options) {
    _classCallCheck(this, RTreePyramid);

    this.trees = new Map();
    this.collidables = new Map();
    this.nodeCapacity = defaultTo(options.nodeCapacity, 32);
  }
  /**
   * Inserts an array of collidables into the r-tree for the provided coord.
   *
   * @param {TileCoord} coord - The coord of the tile.
   * @param {Array} collidables - The array of collidables to insert.
   *
   * @returns {RTreePyramid} The RTreePyramid object, for chaining.
   */


  _createClass(RTreePyramid, [{
    key: "insert",
    value: function insert(coord, collidables) {
      if (!this.trees.has(coord.z)) {
        this.trees.set(coord.z, new RTree({
          nodeCapacity: this.nodeCapacity
        }));
      }

      this.trees.get(coord.z).insert(collidables);
      this.collidables.set(coord.hash, collidables);
      return this;
    }
    /**
     * Removes an array of collidables from the r-tree for the provided coord.
     *
     * @param {TileCoord} coord - The coord of the tile.
     *
     * @returns {RTreePyramid} The RTreePyramid object, for chaining.
     */

  }, {
    key: "remove",
    value: function remove(coord) {
      var collidables = this.collidables.get(coord.hash);
      this.trees.get(coord.z).remove(collidables);
      this.collidables.delete(coord.hash);
      return this;
    }
    /**
     * Searchs the r-tree using a point.
     *
     * @param {number} x - The x component.
     * @param {number} y - The y component.
     * @param {number} zoom - The zoom level of the plot.
     * @param {number} extent - The pixel extent of the plot zoom.
     *
     * @returns {Object} The collision object.
     */

  }, {
    key: "searchPoint",
    value: function searchPoint(x, y, zoom, extent) {
      // points are stored in un-scaled coordinates, unscale the point
      var tileZoom = Math.round(zoom); // get the tree for the zoom

      var tree = this.trees.get(tileZoom);

      if (!tree) {
        // no data for tile
        return null;
      }

      var scale = Math.pow(2, tileZoom - zoom); // unscaled points

      var sx = x * extent * scale;
      var sy = y * extent * scale; // get collision

      return tree.searchPoint(sx, sy);
    }
    /**
     * Searchs the r-tree using a rectangle.
     *
     * @param {number} minX - The minimum x component.
     * @param {number} maxX - The maximum x component.
     * @param {number} minY - The minimum y component.
     * @param {number} maxY - The maximum y component.
     * @param {number} zoom - The zoom level of the plot.
     * @param {number} extent - The pixel extent of the plot zoom.
     *
     * @returns {Object} The collision object.
     */

  }, {
    key: "searchRectangle",
    value: function searchRectangle(minX, maxX, minY, maxY, zoom, extent) {
      // points are stored in un-scaled coordinates, unscale the point
      var tileZoom = Math.round(zoom); // get the tree for the zoom

      var tree = this.trees.get(tileZoom);

      if (!tree) {
        // no data for tile
        return null;
      }

      var scale = Math.pow(2, tileZoom - zoom); // unscaled points

      var sminX = minX * extent * scale;
      var smaxX = maxX * extent * scale;
      var sminY = minY * extent * scale;
      var smaxY = maxY * extent * scale; // get collision

      return tree.searchRectangle(sminX, smaxX, sminY, smaxY);
    }
  }]);

  return RTreePyramid;
}();

module.exports = RTreePyramid;
'use strict';
/**
 * Class representing a rectangle collidable.
 */

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

var RectangleCollidable =
/*#__PURE__*/
function () {
  /**
   * Instantiates a new RectangleCollidable object.
   *
   * @param {number} minX - The left bound in pixels.
   * @param {number} maxX - The right bound in pixels.
   * @param {number} minY - The bottom bound in pixels.
   * @param {number} maxY - The top bound in pixels.
   * @param {number} xOffset - The tile x offset in pixels.
   * @param {number} yOffset - The tile y offset in pixels.
   * @param {Tile} tile - The tile object.
   * @param {Object} data - Any arbitrary user data.
   */
  function RectangleCollidable(minX, maxX, minY, maxY, xOffset, yOffset, tile, data) {
    _classCallCheck(this, RectangleCollidable);

    this.minX = minX + xOffset;
    this.maxX = maxX + xOffset;
    this.minY = minY + yOffset;
    this.maxY = maxY + yOffset;
    this.tile = tile;
    this.data = data;
  }
  /**
   * Test if the provided position is within the inner shape of the collidable.
   *
   * @param {number} x - The x position to test.
   * @param {number} y - The y position to test.
   *
   * @returns {bool} Whether or not there is an intersection.
   */

  /* eslint-disable no-unused-vars */


  _createClass(RectangleCollidable, [{
    key: "testPoint",
    value: function testPoint(x, y) {
      return true;
    }
    /**
     * Test if the provided rectangle is within the inner shape of the
     * collidable.
     *
     * @param {number} minX - The minimum x component.
     * @param {number} maxX - The maximum x component.
     * @param {number} minY - The minimum y component.
     * @param {number} maxY - The maximum y component.
     *
     * @returns {bool} Whether or not there is an intersection.
     */

    /* eslint-disable no-unused-vars */

  }, {
    key: "testRectangle",
    value: function testRectangle(minX, maxX, minY, maxY) {
      return true;
    }
  }]);

  return RectangleCollidable;
}();

module.exports = RectangleCollidable;
'use strict';

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

var clamp = require('lodash/clamp');
/**
 * Class representing a circle collidable.
 */


var RingCollidable =
/*#__PURE__*/
function () {
  /**
   * Instantiates a new RingCollidable object.
   *
   * @param {number} x - The tile x pixel coordinate.
   * @param {number} y - The tile y pixel coordinate.
   * @param {number} radius - The radius in pixels.
   * @param {number} width - The radius buffer in pixels (additional hit-area beyond radius)
   * @param {number} xOffset - The tile x offset in pixels.
   * @param {number} yOffset - The tile y offset in pixels.
   * @param {Tile} tile - The tile object.
   * @param {Object} data - Any arbitrary user data.
   */
  function RingCollidable(x, y, radius, width, xOffset, yOffset, tile, data) {
    _classCallCheck(this, RingCollidable);

    this.x = x;
    this.y = y;
    this.radius = radius;
    this.width = width;
    var halfWidth = width * 0.5;
    this.minX = x + xOffset - radius - halfWidth;
    this.maxX = x + xOffset + radius + halfWidth;
    this.minY = y + yOffset - radius - halfWidth;
    this.maxY = y + yOffset + radius + halfWidth;
    this.tile = tile;
    this.data = data;
  }
  /**
   * Test if the provided position is within the inner shape of the collidable.
   *
   * @param {number} x - The x position to test.
   * @param {number} y - The y position to test.
   *
   * @returns {bool} Whether or not there is an intersection.
   */


  _createClass(RingCollidable, [{
    key: "testPoint",
    value: function testPoint(x, y) {
      // center pos
      var cx = (this.minX + this.maxX) * 0.5;
      var cy = (this.minY + this.maxY) * 0.5; // distance to point

      var dx = cx - x;
      var dy = cy - y;
      var distanceSqr = dx * dx + dy * dy;
      var halfWidth = this.width * 0.5;
      var innerRadius = this.radius - halfWidth;
      var outerRadius = this.radius + halfWidth;
      return distanceSqr <= outerRadius * outerRadius && distanceSqr >= innerRadius * innerRadius;
    }
    /**
     * Test if the provided rectangle is within the inner shape of the
     * collidable.
     *
     * @param {number} minX - The minimum x component.
     * @param {number} maxX - The maximum x component.
     * @param {number} minY - The minimum y component.
     * @param {number} maxY - The maximum y component.
     *
     * @returns {bool} Whether or not there is an intersection.
     */

  }, {
    key: "testRectangle",
    value: function testRectangle(minX, maxX, minY, maxY) {
      // circle pos
      var cx = (this.minX + this.maxX) * 0.5;
      var cy = (this.minY + this.maxY) * 0.5; // find the furthest points on rectangle from the circle

      var furthestX,
          furthestY = 0;

      if (Math.abs(cx - minX) < Math.abs(cx - maxX)) {
        furthestX = maxX;
      } else {
        furthestX = minX;
      }

      if (Math.abs(cy - minY) < Math.abs(cy - maxY)) {
        furthestY = maxY;
      } else {
        furthestY = minY;
      } // check if there is any intersection with the inner circle


      var fx = cx - furthestX;
      var fy = cy - furthestY;
      var halfWidth = this.width * 0.5;
      var innerRadius = this.radius - halfWidth;

      if (fx * fx + fy * fy < innerRadius * innerRadius) {
        // rectangle is completely inside the ring and cannot intersect
        return false;
      } // otherwise just do a circle - aabb test for outer circle
      // find closest point in rectangle to circle


      var nearestX = clamp(cx, minX, maxX);
      var nearestY = clamp(cy, minY, maxY); // test distance

      var dx = cx - nearestX;
      var dy = cy - nearestY;
      var outerRadius = this.radius + halfWidth;
      return dx * dx + dy * dy < outerRadius * outerRadius;
    }
  }]);

  return RingCollidable;
}();

module.exports = RingCollidable;
'use strict';

function _typeof(obj) { if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

function _possibleConstructorReturn(self, call) { if (call && (_typeof(call) === "object" || typeof call === "function")) { return call; } return _assertThisInitialized(self); }

function _assertThisInitialized(self) { if (self === void 0) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return self; }

function _getPrototypeOf(o) { _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf : function _getPrototypeOf(o) { return o.__proto__ || Object.getPrototypeOf(o); }; return _getPrototypeOf(o); }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function"); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, writable: true, configurable: true } }); if (superClass) _setPrototypeOf(subClass, superClass); }

function _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf || function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }

var clamp = require('lodash/clamp');

var defaultTo = require('lodash/defaultTo');

var EventEmitter = require('events');

var Event = require('../event/Event');

var EventType = require('../event/EventType');
/**
 * Class representing a layer component.
 */


var Layer =
/*#__PURE__*/
function (_EventEmitter) {
  _inherits(Layer, _EventEmitter);

  /**
   * Instantiates a new Layer object.
   *
   * @param {Object} options - The options.
   * @param {number} options.opacity - The layer opacity.
   * @param {number} options.zIndex - The layer z-index.
   * @param {boolean} options.hidden - Whether or not the layer is visible.
   */
  function Layer() {
    var _this;

    var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

    _classCallCheck(this, Layer);

    _this = _possibleConstructorReturn(this, _getPrototypeOf(Layer).call(this));
    _this.opacity = defaultTo(options.opacity, 1.0);
    _this.hidden = defaultTo(options.hidden, false);
    _this.zIndex = defaultTo(options.zIndex, 0);
    _this.renderer = defaultTo(options.renderer, null);
    _this.highlighted = null;
    _this.selected = [];
    _this.plot = null;
    return _this;
  }
  /**
   * Executed when the layer is attached to a plot.
   *
   * @param {Plot} plot - The plot to attach the layer to.
   *
   * @returns {Layer} The layer object, for chaining.
   */


  _createClass(Layer, [{
    key: "onAdd",
    value: function onAdd(plot) {
      if (!plot) {
        throw 'No plot argument provided';
      } // set plot


      this.plot = plot; // flag as dirty

      this.plot.setDirty(); // execute renderer hook

      if (this.renderer) {
        this.renderer.onAdd(this);
      }

      return this;
    }
    /**
     * Executed when the layer is removed from a plot.
     *
     * @param {Plot} plot - The plot to remove the layer from.
     *
     * @returns {Layer} The layer object, for chaining.
     */

  }, {
    key: "onRemove",
    value: function onRemove(plot) {
      if (!plot) {
        throw 'No plot argument provided';
      } // execute renderer hook


      if (this.renderer) {
        this.renderer.onRemove(this);
      } // clear state


      this.clear(); // flag as dirty

      this.plot.setDirty(); // remove plot

      this.plot = null;
      return this;
    }
    /**
     * Add a renderer to the layer.
     *
     * @param {Renderer} renderer - The renderer to add to the layer.
     *
     * @returns {Layer} The layer object, for chaining.
     */

  }, {
    key: "setRenderer",
    value: function setRenderer(renderer) {
      if (!renderer) {
        throw 'No renderer argument provided';
      }

      if (this.renderer && this.plot) {
        this.renderer.onRemove(this);
      }

      this.renderer = renderer;

      if (this.plot) {
        this.renderer.onAdd(this);
      }

      return this;
    }
    /**
     * Remove the renderer from the layer.
     *
     * @returns {Layer} The layer object, for chaining.
     */

  }, {
    key: "removeRenderer",
    value: function removeRenderer() {
      if (!this.renderer) {
        throw 'No renderer is currently attached to the layer';
      }

      if (this.plot) {
        this.renderer.onRemove(this);
      }

      this.renderer = null;
      return this;
    }
    /**
     * Returns the renderer of the layer.
     *
     * @returns {Renderer} The renderer object.
     */

  }, {
    key: "getRenderer",
    value: function getRenderer() {
      return this.renderer;
    }
    /**
     * Set the opacity of the layer.
     *
     * @param {number} opacity - The opacity to set.
     *
     * @returns {Layer} The layer object, for chaining.
     */

  }, {
    key: "setOpacity",
    value: function setOpacity(opacity) {
      opacity = clamp(opacity, 0, 1);

      if (this.opacity !== opacity) {
        this.opacity = opacity;

        if (this.plot) {
          this.plot.setDirty();
        }
      }

      return this;
    }
    /**
     * Get the opacity of the layer.
     *
     * @returns {number} The opacity of the layer object,.
     */

  }, {
    key: "getOpacity",
    value: function getOpacity() {
      return this.opacity;
    }
    /**
     * Set the z-index of the layer.
     *
     * @param {number} zIndex - The z-index to set.
     *
     * @returns {Layer} The layer object, for chaining.
     */

  }, {
    key: "setZIndex",
    value: function setZIndex(zIndex) {
      if (this.zIndex !== zIndex) {
        this.zIndex = zIndex;

        if (this.plot) {
          this.plot.setDirty();
        }
      }

      return this;
    }
    /**
     * Get the z-index of the layer.
     *
     * @returns {number} The zIndex of the layer object,.
     */

  }, {
    key: "getZIndex",
    value: function getZIndex() {
      return this.zIndex;
    }
    /**
     * Make the layer visible.
     *
     * @returns {Layer} The layer object, for chaining.
     */

  }, {
    key: "show",
    value: function show() {
      if (this.hidden) {
        this.hidden = false;

        if (this.plot) {
          this.plot.setDirty();
        }
      }

      return this;
    }
    /**
     * Make the layer invisible.
     *
     * @returns {Layer} The layer object, for chaining.
     */

  }, {
    key: "hide",
    value: function hide() {
      if (!this.hidden) {
        this.hidden = true;

        if (this.renderer) {
          this.renderer.clear();
        }

        if (this.plot) {
          this.plot.setDirty();
        }
      }

      return this;
    }
    /**
     * Returns true if the layer is hidden.
     *
     * @returns {boolean} Whether or not the layer is hidden.
     */

  }, {
    key: "isHidden",
    value: function isHidden() {
      return this.hidden;
    }
    /**
     * Pick a position of the layer for a collision with any rendered objects.
     *
     * @param {Object} pos - The plot position to pick at.
     *
     * @returns {Object} The collision, or null.
     */

  }, {
    key: "pick",
    value: function pick(pos) {
      if (this.renderer) {
        return this.renderer.pick(pos);
      }

      return null;
    }
    /**
     * Highlights the provided data.
     *
     * @param {Object} data - The data to highlight.
     *
     * @returns {Layer} The layer object, for chaining.
     */

  }, {
    key: "highlight",
    value: function highlight(data) {
      if (this.highlighted !== data) {
        this.highlighted = data;

        if (this.plot) {
          this.plot.setDirty();
        }
      }

      return this;
    }
    /**
     * Clears any current highlight.
     *
     * @returns {Layer} The layer object, for chaining.
     */

  }, {
    key: "unhighlight",
    value: function unhighlight() {
      if (this.highlighted !== null) {
        this.highlighted = null;

        if (this.plot) {
          this.plot.setDirty();
        }
      }

      return this;
    }
    /**
     * Returns any highlighted data.
     *
     * @returns {Object} The highlighted data.
     */

  }, {
    key: "getHighlighted",
    value: function getHighlighted() {
      return this.highlighted;
    }
    /**
     * Returns true if the provided argument is highlighted.
     *
     * @param {Object} data - The data to test.
     *
     * @returns {boolean} Whether or not there is highlighted data.
     */

  }, {
    key: "isHighlighted",
    value: function isHighlighted(data) {
      return this.highlighted === data;
    }
    /**
     * Selects the provided data.
     *
     * @param {Object} data - The data to select.
     * @param {Object} multiSelect - Whether mutli-select is enabled.
     *
     * @returns {Layer} The layer object, for chaining.
     */

  }, {
    key: "select",
    value: function select(data, multiSelect) {
      var changed = false;

      if (multiSelect) {
        // add to collection if multi-selection is enabled
        var index = this.selected.indexOf(data);

        if (index === -1) {
          // select point
          this.selected.push(data);
          changed = true;
        }
      } else {
        // clear selection, adding only the latest entry
        if (this.selected.length !== 1 || this.selected[0] !== data) {
          this.selected = [data];
          changed = true;
        }
      }

      if (this.plot && changed) {
        this.plot.setDirty();
      }

      return this;
    }
    /**
     * Remove the provided data from the current selection.
     *
     * @param {Object} data - The data to unselect.
     *
     * @returns {Layer} The layer object, for chaining.
     */

  }, {
    key: "unselect",
    value: function unselect(data) {
      var index = this.selected.indexOf(data);

      if (index !== -1) {
        // unselect point
        this.selected.splice(index, 1);

        if (this.plot) {
          this.plot.setDirty();
        }
      }

      return this;
    }
    /**
     * Clears the current selection.
     *
     * @returns {Layer} The layer object, for chaining.
     */

  }, {
    key: "unselectAll",
    value: function unselectAll() {
      if (this.selected.length > 0) {
        // unselect all
        this.selected = [];

        if (this.plot) {
          this.plot.setDirty();
        }
      }

      return this;
    }
    /**
     * Returns any selected data.
     *
     * @returns {Array} The selected data.
     */

  }, {
    key: "getSelected",
    value: function getSelected() {
      return this.selected;
    }
    /**
     * Returns true if the provided argument is selected.
     *
     * @param {Object} data - The data to test.
     *
     * @returns {boolean} Whether or not the data is selected.
     */

  }, {
    key: "isSelected",
    value: function isSelected(data) {
      return this.selected.indexOf(data) !== -1;
    }
    /**
     * Draw the layer for the frame.
     *
     * @param {number} timestamp - The frame timestamp.
     *
     * @returns {Layer} The layer object, for chaining.
     */

  }, {
    key: "draw",
    value: function draw(timestamp) {
      if (this.renderer) {
        this.renderer.draw(timestamp);
      }

      return this;
    }
    /**
     * Clears any persisted state in the layer.
     *
     * @returns {Layer} The layer object, for chaining.
     */

  }, {
    key: "clear",
    value: function clear() {
      // clear selected / highlighted
      if (this.highlighted || this.selected.length > 0) {
        this.highlighted = null;
        this.selected = [];
      } // clear renderer state


      if (this.renderer) {
        this.renderer.clear();
      } // flag as dirty


      if (this.plot) {
        this.plot.setDirty();
      }

      return this;
    }
    /**
     * Clears any persisted state in the layer and refreshes the underlying
     * data.
     *
     * @returns {Layer} The layer object, for chaining.
     */

  }, {
    key: "refresh",
    value: function refresh() {
      // clear the layer state
      this.clear(); // emit refresh event

      this.emit(EventType.REFRESH, new Event(this));
      return this;
    }
  }]);

  return Layer;
}(EventEmitter);

module.exports = Layer;
'use strict';

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

var Bounds = require('../geometry/Bounds');
/**
 * The size of the cell, in pixels.
 * @private
 * @constant {number}
 */


var CELL_SIZE = Math.pow(2, 16);
/**
 * The half size of the cell, in pixels.
 * @private
 * @constant {number}
 */

var CELL_HALF_SIZE = CELL_SIZE / 2;
/**
 * Class representing a cell for clipping a rendering space.
 * @private
 */

var Cell =
/*#__PURE__*/
function () {
  /**
   * Instantiates a new Cell object.
   *
   * @param {number} zoom - The zoom the the cells is generated for.
   * @param {Object} center - The plot position of the center of the cell.
   * @param {number} extent - The pixel extent of the plot at the time of generation.
   */
  function Cell(zoom, center, extent) {
    _classCallCheck(this, Cell);

    var halfSize = CELL_HALF_SIZE / extent;
    var offset = {
      x: center.x - halfSize,
      y: center.y - halfSize
    };
    this.zoom = zoom;
    this.halfSize = halfSize;
    this.center = center;
    this.offset = offset;
    this.extent = extent;
    this.bounds = new Bounds(center.x - halfSize, center.x + halfSize, center.y - halfSize, center.y + halfSize);
  }
  /**
   * Project a normalized plot coordinate to the pixel space of the cell.
   *
   * @param {Object} pos - The normalized plot coordinate.
   * @param {number} zoom - The zoom of the plot pixel space to project to. Optional.
   *
   * @returns {Object} The coordinate in cell pixel space.
   */


  _createClass(Cell, [{
    key: "project",
    value: function project(pos) {
      var zoom = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : this.zoom;
      var scale = Math.pow(2, zoom - this.zoom) * this.extent;
      return {
        x: (pos.x - this.offset.x) * scale,
        y: (pos.y - this.offset.y) * scale
      };
    }
    /**
     * Unproject a coordinate from the pixel space of the cell to a normalized
     * plot coordinate.
     *
     * @param {Object} px - The plot pixel coordinate.
     * @param {number} zoom - The zoom of the plot pixel space to unproject from. Optional.
     *
     * @returns {Object} The normalized plot coordinate.
     */

  }, {
    key: "unproject",
    value: function unproject(px) {
      var zoom = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : this.zoom;
      var scale = Math.pow(2, zoom - this.zoom) * this.extent;
      return {
        x: px.x / scale + this.offset.x,
        y: px.y / scale + this.offset.y
      };
    }
  }]);

  return Cell;
}();

module.exports = Cell;
'use strict';

function _typeof(obj) { if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

function _possibleConstructorReturn(self, call) { if (call && (_typeof(call) === "object" || typeof call === "function")) { return call; } return _assertThisInitialized(self); }

function _getPrototypeOf(o) { _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf : function _getPrototypeOf(o) { return o.__proto__ || Object.getPrototypeOf(o); }; return _getPrototypeOf(o); }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function"); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, writable: true, configurable: true } }); if (superClass) _setPrototypeOf(subClass, superClass); }

function _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf || function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }

function _assertThisInitialized(self) { if (self === void 0) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return self; }

var clamp = require('lodash/clamp');

var defaultTo = require('lodash/defaultTo');

var throttle = require('lodash/throttle');

var EventEmitter = require('events');

var EventType = require('../event/EventType');

var EventBroadcaster = require('../event/EventBroadcaster');

var EventDelegator = require('../event/EventDelegator');

var Event = require('../event/Event');

var ResizeEvent = require('../event/ResizeEvent');

var RenderBuffer = require('../webgl/RenderBuffer');

var ClickHandler = require('./handler/ClickHandler');

var MouseHandler = require('./handler/MouseHandler');

var PanHandler = require('./handler/PanHandler');

var ZoomHandler = require('./handler/ZoomHandler');

var Cell = require('./Cell');

var Viewport = require('./Viewport'); // Constants

/**
 * Pan request throttle in milliseconds.
 * @private
 * @constant {number}
 */


var PAN_THROTTLE_MS = 100;
/**
 * Resize request throttle in milliseconds.
 * @private
 * @constant {number}
 */

var RESIZE_THROTTLE_MS = 200;
/**
 * Zoom request throttle in milliseconds.
 * @private
 * @constant {number}
 */

var ZOOM_THROTTLE_MS = 400;
/**
 * The maximum zoom delta until a cell update event.
 * @private
 * @constant {number}
 */

var CELL_ZOOM_DELTA = 1.0;
/**
 * The maximum zoom level supported.
 * @private
 * @constant {number}
 */

var MAX_ZOOM = 24;
/**
 * Click handler symbol.
 * @private
 * @constant {Symbol}
 */

var CLICK = Symbol();
/**
 * Mouse handler symbol.
 * @private
 * @constant {Symbol}
 */

var MOUSE = Symbol();
/**
 * Pan handler symbol.
 * @private
 * @constant {Symbol}
 */

var PAN = Symbol();
/**
 * Zoom handler symbol.
 * @private
 * @constant {Symbol}
 */

var ZOOM = Symbol();
/**
 * Event handlers symbol.
 * @private
 * @constant {Symbol}
 */

var HANDLERS = Symbol();
/**
 * Event delegators symbol.
 * @private
 * @constant {Symbol}
 */

var DELEGATOR = Symbol();
/**
 * Event broadcasters symbol.
 * @private
 * @constant {Symbol}
 */

var BROADCASTER = Symbol();
/**
 * Dirty plot symbol.
 * @private
 * @constant {Symbol}
 */

var DIRTY = Symbol(); // Private Methods

var requestTiles = function requestTiles() {
  // get all visible coords in the target viewport
  var coords = this.getTargetVisibleCoords(); // for each layer

  this.layers.forEach(function (layer) {
    if (layer.requestTiles) {
      // request tiles
      layer.requestTiles(coords);
    }
  });
  return this;
};

var resize = function resize(plot) {
  var current = {
    width: plot.container.offsetWidth,
    height: plot.container.offsetHeight
  };
  var prev = plot.getViewportPixelSize();
  var center = plot.viewport.getCenter();

  if (prev.width !== current.width || prev.height !== current.height || plot.pixelRatio !== window.devicePixelRatio) {
    // store device pixel ratio
    plot.pixelRatio = window.devicePixelRatio; // resize canvas

    plot.canvas.style.width = current.width + 'px';
    plot.canvas.style.height = current.height + 'px';
    plot.canvas.width = current.width * plot.pixelRatio;
    plot.canvas.height = current.height * plot.pixelRatio; // resize renderbuffer

    if (plot.renderBuffer) {
      plot.renderBuffer.resize(current.width * plot.pixelRatio, current.height * plot.pixelRatio);
    } // update viewport


    var extent = plot.getPixelExtent();
    plot.viewport.width = current.width / extent;
    plot.viewport.height = current.height / extent; // re-center viewport

    plot.viewport.centerOn(center); // request tiles

    plot.resizeRequest(); // emit resize

    plot.setDirty();
    plot.emit(EventType.RESIZE, new ResizeEvent(plot, prev, current));
  }
};

var updateCell = function updateCell(plot) {
  var zoom = plot.getTargetZoom();
  var center = plot.getTargetViewportCenter();
  var extent = plot.getTargetPixelExtent();
  var size = plot.getViewportPixelSize();
  var cell = new Cell(zoom, center, extent);
  var refresh = false; // check if no cell exists

  if (!plot.cell) {
    refresh = true;
  } else {
    // check if we are outside of one zoom level from last
    var zoomDist = Math.abs(plot.cell.zoom - cell.zoom);

    if (zoomDist >= CELL_ZOOM_DELTA) {
      refresh = true;
    } else {
      // check if we are withing buffer distance of the cell bounds
      var xDist = plot.cell.halfSize - size.width / plot.cell.extent;
      var yDist = plot.cell.halfSize - size.height / plot.cell.extent;

      if (Math.abs(cell.center.x - plot.cell.center.x) > xDist || Math.abs(cell.center.y - plot.cell.center.y) > yDist) {
        refresh = true;
      }
    }
  }

  if (refresh) {
    // update cell
    plot.cell = cell; // emit cell refresh

    plot.emit(EventType.CELL_UPDATE, new Event(cell));
  }
};

var reset = function reset(plot) {
  if (!plot.wraparound) {
    // if there is no wraparound, do not reset
    return;
  } // resets the position of the viewport relative to the plot such that
  // the plot native coordinate range is within the viewports bounds.
  // get viewport width in plot coords


  var width = Math.ceil(plot.viewport.width / 1.0); // past the left bound of the viewport

  if (plot.viewport.x > 1.0) {
    plot.viewport.x -= width;

    if (plot.isPanning()) {
      plot.panAnimation.start.x -= width;
    }
  } // past the right bound of the viewport


  if (plot.viewport.x + plot.viewport.width < 0) {
    plot.viewport.x += width;

    if (plot.isPanning()) {
      plot.panAnimation.start.x += width;
    }
  }
};

var prepareFrame = function prepareFrame(plot) {
  // get context
  var gl = plot.getRenderingContext();

  if (!gl) {
    return;
  } // clear the backbuffer


  gl.clearColor(0, 0, 0, 0);
  gl.clear(gl.COLOR_BUFFER_BIT); // set the viewport

  var size = plot.getViewportPixelSize();
  gl.viewport(0, 0, size.width * plot.pixelRatio, size.height * plot.pixelRatio);
};

var frame = function frame(plot) {
  // get frame timestamp
  var timestamp = Date.now(); // emit frame event

  plot.emit(EventType.FRAME, new Event(plot, timestamp)); // update size

  resize(plot);

  if (!plot.dirtyChecking || plot.isDirty()) {
    // clear flag now, this way layers that may be animating can signal
    // that the animation is not complete by flagging as dirty during the
    // draw call.
    plot.clearDirty(); // apply the zoom animation

    if (plot.isZooming()) {
      if (plot.zoomAnimation.update(timestamp)) {
        plot.zoomAnimation = null;
      }
    } // apply the pan animation


    if (plot.isPanning()) {
      if (plot.panAnimation.update(timestamp)) {
        plot.panAnimation = null;
      }

      plot.panRequest();
    } // reset viewport / plot


    reset(plot); // update cell

    updateCell(plot); // prepare the frame for rendering

    prepareFrame(plot); // sort layers by z-index

    var layers = plot.getSortedLayers(); // render each layer

    layers.forEach(function (layer) {
      if (!layer.isHidden()) {
        layer.draw(timestamp);
      }
    });
  } // request next frame


  plot.frameRequest = requestAnimationFrame(function () {
    frame(plot);
  });
};
/**
 * Class representing a plot.
 */


var Plot =
/*#__PURE__*/
function (_EventEmitter) {
  _inherits(Plot, _EventEmitter);

  /**
   * Instantiates a new Plot object.
   *
   * @param {string} selector - The selector for the container element.
   * @param {Object} options - The plot options.
   * @param {number} options.tileSize - The dimension in pixels of a tile.
   * @param {number} options.zoom - The zoom of the plot.
   * @param {number} options.minZoom - The minimum zoom of the plot.
   * @param {number} options.maxZoom - The maximum zoom of the plot.
   * @param {Object} options.center - The center of the plot, in plot pixels.
   * @param {boolean} options.wraparound - Whether or not the plot wraps around.
   * @param {boolean} options.contextAttributes - The rendering context attribtues argument. Optional.
   * @param {boolean} options.dirtyChecking - Whether or not the plot uses dirty checking or renders every frame.
   *
   * @param {number} options.panThrottle - Pan request throttle timeout in ms.
   * @param {number} options.resizeThrottle - Resize request throttle timeout in ms.
   * @param {number} options.zoomThrottle - Zoom request throttle timeout in ms.
   *
   * @param {number} options.inertia - Whether or not pan inertia is enabled.
   * @param {number} options.inertiaEasing - The inertia easing factor.
   * @param {number} options.inertiaDeceleration - The inertia deceleration factor.
   *
   * @param {number} options.continuousZoom - Whether or not continuous zoom is enabled.
   * @param {number} options.zoomDuration - The duration of the zoom animation.
   * @param {number} options.maxConcurrentZooms - The maximum concurrent zooms in a single batch.
   * @param {number} options.deltaPerZoom - The scroll delta required per zoom level.
   * @param {number} options.zoomDebounce - The debounce duration of the zoom in ms.
   *
   * @param {boolean} options.noContext - Prevent the constructor from throwing exception if no WebGL context can be acquired.
   */
  function Plot(selector) {
    var _this;

    var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

    _classCallCheck(this, Plot);

    _this = _possibleConstructorReturn(this, _getPrototypeOf(Plot).call(this)); // get container

    _this.container = document.querySelector(selector);

    if (!_this.container) {
      throw "Element could not be found for selector ".concat(selector);
    } // set pixel ratio


    _this.pixelRatio = window.devicePixelRatio; // create canvas element

    _this.canvas = document.createElement('canvas');
    _this.canvas.style.width = "".concat(_this.container.offsetWidth, "px");
    _this.canvas.style.height = "".concat(_this.container.offsetHeight, "px");
    _this.canvas.width = _this.container.offsetWidth * _this.pixelRatio;
    _this.canvas.height = _this.container.offsetHeight * _this.pixelRatio;

    _this.container.appendChild(_this.canvas); // get rendering context


    _this.ctx = _this.canvas.getContext('webgl', options.contextAttributes) || _this.canvas.getContext('experimental-webgl', options.contextAttributes); // MS Edge

    if (!_this.ctx && !options.noContext) {
      throw 'Unable to create a WebGLRenderingContext, please ensure your browser supports WebGL';
    }

    if (_this.ctx) {
      // create renderbuffer
      _this.renderBuffer = new RenderBuffer(_this.ctx, _this.canvas.width, _this.canvas.height);
    } else {
      _this.renderBuffer = null;
    } // tile size in pixels


    _this.tileSize = defaultTo(options.tileSize, 256); // min and max zoom of the plot

    _this.minZoom = defaultTo(options.minZoom, 0);
    _this.maxZoom = defaultTo(options.maxZoom, MAX_ZOOM); // current zoom of the plot

    _this.zoom = defaultTo(options.zoom, 0);
    _this.zoom = clamp(_this.zoom, _this.minZoom, _this.maxZoom); // set viewport

    var span = Math.pow(2, _this.zoom);
    var width = _this.canvas.offsetWidth / span;
    var height = _this.canvas.offsetHeight / span;
    _this.viewport = new Viewport(0, 0, width, height); // center the plot

    var center = defaultTo(options.center, {
      x: 0.5,
      y: 0.5
    });

    _this.viewport.centerOn(center); // generate cell


    _this.cell = null;
    updateCell(_assertThisInitialized(_assertThisInitialized(_this))); // wraparound

    _this.wraparound = defaultTo(options.wraparound, false); // throttled request methods

    var panThrottle = defaultTo(options.panThrottle, PAN_THROTTLE_MS);
    var resizeThrottle = defaultTo(options.resizeThrottle, RESIZE_THROTTLE_MS);
    var zoomThrottle = defaultTo(options.zoomThrottle, ZOOM_THROTTLE_MS);
    _this.panRequest = throttle(requestTiles, panThrottle, {
      leading: false // invoke only on trailing edge

    });
    _this.resizeRequest = throttle(requestTiles, resizeThrottle, {
      leading: false // invoke only on trailing edge

    });
    _this.zoomRequest = throttle(requestTiles, zoomThrottle, {
      leading: false // invoke only on trailing edge

    }); // layers

    _this.layers = []; // frame request

    _this.frameRequest = null; // create and enable handlers

    _this[HANDLERS] = new Map();

    _this[HANDLERS].set(CLICK, new ClickHandler(_assertThisInitialized(_assertThisInitialized(_this)), options));

    _this[HANDLERS].set(MOUSE, new MouseHandler(_assertThisInitialized(_assertThisInitialized(_this)), options));

    _this[HANDLERS].set(PAN, new PanHandler(_assertThisInitialized(_assertThisInitialized(_this)), options));

    _this[HANDLERS].set(ZOOM, new ZoomHandler(_assertThisInitialized(_assertThisInitialized(_this)), options));

    _this[HANDLERS].forEach(function (handler) {
      handler.enable();
    }); // delegator


    _this[DELEGATOR] = new EventDelegator(_assertThisInitialized(_assertThisInitialized(_this))); // delegate mouse / click events to layers

    _this[DELEGATOR].delegate(EventType.CLICK);

    _this[DELEGATOR].delegate(EventType.DBL_CLICK);

    _this[DELEGATOR].delegate(EventType.MOUSE_MOVE);

    _this[DELEGATOR].delegate(EventType.MOUSE_UP);

    _this[DELEGATOR].delegate(EventType.MOUSE_DOWN); // broadcaster


    _this[BROADCASTER] = new EventBroadcaster(_assertThisInitialized(_assertThisInitialized(_this))); // broadcast zoom / pan events to layers

    _this[BROADCASTER].broadcast(EventType.ZOOM_START);

    _this[BROADCASTER].broadcast(EventType.ZOOM);

    _this[BROADCASTER].broadcast(EventType.ZOOM_END);

    _this[BROADCASTER].broadcast(EventType.PAN_START);

    _this[BROADCASTER].broadcast(EventType.PAN);

    _this[BROADCASTER].broadcast(EventType.PAN_END); // whether or not to use dirty checking


    _this.dirtyChecking = defaultTo(options.dirtyChecking, true); // flag as dirty

    _this[DIRTY] = true; // begin frame loop

    frame(_assertThisInitialized(_assertThisInitialized(_this)));
    return _this;
  }
  /**
   * Destroys the plots association with the underlying canvas element and
   * disables all event handlers.
   *
   * @returns {Plot} The plot object, for chaining.
   */


  _createClass(Plot, [{
    key: "destroy",
    value: function destroy() {
      var _this2 = this;

      // stop animation loop
      cancelAnimationFrame(this.frameRequest);
      this.frameRequest = null; // disable handlers

      this[HANDLERS].forEach(function (handler) {
        handler.disable();
      }); // remove layers

      this.layers.forEach(function (layer) {
        _this2.remove(layer);
      }); // destroy context

      this.ctx = null; // remove canvas

      this.container.removeChild(this.canvas);
      this.canvas = null;
      this.container = null;
      this.renderBuffer = null;
      return this;
    }
    /**
     * Flags the plot as dirty singalling that it should be redrawn in the next
     * frame.
     */

  }, {
    key: "setDirty",
    value: function setDirty() {
      this[DIRTY] = true;
    }
    /**
     * Check if the plot is dirty and requires a redraw.
     *
     * @returns {boolean} Whether or not the plot should be redrawn.
    	*/

  }, {
    key: "isDirty",
    value: function isDirty() {
      return this[DIRTY] || this.isPanning() || this.isZooming();
    }
    /**
     * Clears the dirty flag for the next frame.
     */

  }, {
    key: "clearDirty",
    value: function clearDirty() {
      this[DIRTY] = false;
    }
    /**
     * Adds a layer to the plot.
     *
     * @param {Layer} layer - The layer to add to the plot.
     *
     * @returns {Plot} The plot object, for chaining.
     */

  }, {
    key: "add",
    value: function add(layer) {
      if (!layer) {
        throw 'No argument provided';
      }

      if (this.layers.indexOf(layer) !== -1) {
        throw 'Provided layer is already attached to the plot';
      }

      this.layers.push(layer);
      layer.onAdd(this);
      this.setDirty();
      return this;
    }
    /**
     * Removes a layer from the plot.
     *
     * @param {Layer} layer - The layer to remove from the plot.
     *
     * @returns {Plot} The plot object, for chaining.
     */

  }, {
    key: "remove",
    value: function remove(layer) {
      if (!layer) {
        throw 'No argument provided';
      }

      var index = this.layers.indexOf(layer);

      if (index === -1) {
        throw 'Provided layer is not attached to the plot';
      }

      this.layers.splice(index, 1);
      layer.onRemove(this);
      this.setDirty();
      return this;
    }
    /**
     * Returns the rendering context of the plot.
     *
     * @returns {WebGLRenderingContext|CanvasRenderingContext2D} The context object.
     */

  }, {
    key: "getRenderingContext",
    value: function getRenderingContext() {
      return this.ctx;
    }
    /**
     * Returns all the layer objects attached to the plot, in descending
     * order of z-index.
     */

  }, {
    key: "getSortedLayers",
    value: function getSortedLayers() {
      // sort by z-index
      return this.layers.sort(function (a, b) {
        return a.getZIndex() - b.getZIndex();
      });
    }
  }, {
    key: "getZoom",

    /**
     * Returns the current zoom of the plot.
     *
     * @returns {number} The current zoom of the plot.
     */
    value: function getZoom() {
      return this.zoom;
    }
    /**
     * Returns the target zoom of the plot. If the plot is actively zooming, it
     * will return the destination zoom. If the plot is not actively zooming, it
     * will return the current zoom.
     *
     * @returns {number} The target zoom of the plot.
     */

  }, {
    key: "getTargetZoom",
    value: function getTargetZoom() {
      if (this.isZooming()) {
        // if zooming, use the target level
        return this.zoomAnimation.targetZoom;
      } // if not zooming, use the current level


      return this.zoom;
    }
    /**
     * Returns the current viewport of the plot.
     *
     * @returns {number} The current viewport of the plot.
     */

  }, {
    key: "getViewport",
    value: function getViewport() {
      return this.viewport;
    }
    /**
     * Returns the target viewport of the plot. If the plot is actively zooming,
     * it will return the target viewport. If the plot is not actively zooming,
     * it will return the current viewport.
     *
     * @returns {Viewport} The target viewport of the plot.
     */

  }, {
    key: "getTargetViewport",
    value: function getTargetViewport() {
      if (this.isZooming()) {
        // if zooming, use the target viewport
        return this.zoomAnimation.targetViewport;
      } // if not zooming, use the current viewport


      return this.viewport;
    }
    /**
     * Returns the current bottom-left corner of the viewport.
     *
     * @returns {Object} The current center in plot coordinates.
     */

  }, {
    key: "getViewportPosition",
    value: function getViewportPosition() {
      return this.viewport.getPosition();
    }
    /**
     * Returns the target bottom-left corner of the viewport. If the plot is actively zooming
     * or panning, it will return the destination center.
     *
     * @returns {Object} The target center in plot coordinates.
     */

  }, {
    key: "getTargetViewportPosition",
    value: function getTargetViewportPosition() {
      return this.getTargetViewport().getPosition();
    }
    /**
     * Returns the current center of the viewport.
     *
     * @returns {Object} The current center in plot coordinates.
     */

  }, {
    key: "getViewportCenter",
    value: function getViewportCenter() {
      return this.viewport.getCenter();
    }
    /**
     * Returns the target center of the plot in plot coordinates. If the plot is
     * actively zooming or panning, it will return the destination center.
     *
     * @returns {Object} The target center in plot coordinates.
     */

  }, {
    key: "getTargetViewportCenter",
    value: function getTargetViewportCenter() {
      return this.getTargetViewport().getCenter();
    }
    /**
     * Returns the tile coordinates visible in the target viewport.
     *
     * @returns {Array} The array of visible tile coords.
     */

  }, {
    key: "getTargetVisibleCoords",
    value: function getTargetVisibleCoords() {
      var tileZoom = Math.round(this.getTargetZoom()); // use target zoom

      var viewport = this.getTargetViewport(); // use target viewport

      return viewport.getVisibleCoords(tileZoom, this.wraparound);
    }
    /**
     * Returns the tile coordinates currently visible in the current viewport.
     *
     * @returns {Array} The array of visible tile coords.
     */

  }, {
    key: "getVisibleCoords",
    value: function getVisibleCoords() {
      var tileZoom = Math.round(this.zoom); // use current zoom

      var viewport = this.viewport; // use current viewport

      return viewport.getVisibleCoords(tileZoom, this.wraparound);
    }
    /**
     * Returns the plot size in pixels.
     *
     * @returns {Object} The plot size in pixels.
     */

  }, {
    key: "getPixelExtent",
    value: function getPixelExtent() {
      return Math.pow(2, this.zoom) * this.tileSize;
    }
    /**
     * Returns the target plot size in pixels.
     *
     * @returns {Object} The target plot size in pixels.
     */

  }, {
    key: "getTargetPixelExtent",
    value: function getTargetPixelExtent() {
      return Math.pow(2, this.getTargetZoom()) * this.tileSize;
    }
    /**
     * Returns the viewport size in pixels.
     *
     * @returns {Object} The viewport size in pixels.
     */

  }, {
    key: "getViewportPixelSize",
    value: function getViewportPixelSize() {
      return this.viewport.getPixelSize(this.zoom, this.tileSize);
    }
    /**
     * Returns the target viewport size in pixels.
     *
     * @returns {Object} The target viewport size in pixels.
     */

  }, {
    key: "getTargetViewportPixelSize",
    value: function getTargetViewportPixelSize() {
      return this.getTargetViewport().getPixelSize(this.zoom, this.tileSize);
    }
    /**
     * Returns the viewport offset in pixels.
     *
     * @returns {Object} The viewport offset in pixels.
     */

  }, {
    key: "getViewportPixelOffset",
    value: function getViewportPixelOffset() {
      return this.viewport.getPixelOffset(this.zoom, this.tileSize);
    }
    /**
     * Returns the target viewport offset in pixels.
     *
     * @returns {Object} The target viewport offset in pixels.
     */

  }, {
    key: "getTargetViewportPixelOffset",
    value: function getTargetViewportPixelOffset() {
      return this.getTargetViewport().getPixelOffset(this.zoom, this.tileSize);
    }
    /**
     * Takes a DOM event and returns the corresponding plot position.
     * Coordinate [0, 0] is bottom-left of the plot.
     *
     * @param {Event} event - The mouse event.
     *
     * @returns {Object} The plot position.
     */

  }, {
    key: "mouseToPlotCoord",
    value: function mouseToPlotCoord(event) {
      var extent = this.getPixelExtent();
      var size = this.getViewportPixelSize();
      var container = this.getContainer();
      var bounds = container.getBoundingClientRect();
      var x = event.pageX - bounds.left;
      var y = event.pageY - bounds.top;
      return {
        x: this.viewport.x + x / extent,
        y: this.viewport.y + (size.height - y) / extent
      };
    }
    /**
     * Takes a DOM event and returns the corresponding viewport pixel position.
     * Coordinate [0, 0] is bottom-left of the viewport.
     *
     * @param {Event} event - The mouse event.
     *
     * @returns {Object} The viewport pixel coordinate.
     */

  }, {
    key: "mouseToViewportPixel",
    value: function mouseToViewportPixel(event) {
      var size = this.getViewportPixelSize();
      var container = this.getContainer();
      var bounds = container.getBoundingClientRect();
      var x = event.pageX - bounds.left;
      var y = event.pageY - bounds.top;
      return {
        x: x,
        y: size.height - y
      };
    }
    /**
     * Converts a coordinate in viewport pixel space to a normalized plot
     * coordinate.
     * Coordinate [0, 0] is bottom-left of the plot.
     *
     * @param {Object} px - The viewport pixel coordinate.
     *
     * @returns {Object} The normalized plot coordinate.
     */

  }, {
    key: "viewportPixelToPlotCoord",
    value: function viewportPixelToPlotCoord(px) {
      var extent = this.getPixelExtent();
      return {
        x: px.x / extent,
        y: px.y / extent
      };
    }
    /**
     * Converts a coordinate in normalized plot space to viewport pixel space.
     * Coordinate [0, 0] is bottom-left of the plot.
     *
     * @param {Object} pos - The normalized plot coordinate
     *
     * @returns {Object} The viewport pixel coordinate.
     */

  }, {
    key: "plotCoordToViewportPixel",
    value: function plotCoordToViewportPixel(pos) {
      var extent = this.plot.getPixelExtent();
      return {
        x: pos.x * extent,
        y: pos.y * extent
      };
    }
    /**
     * Returns the orthographic projection matrix for the viewport.
     *
     * @returns {Float32Array} The orthographic projection matrix.
     */

  }, {
    key: "getOrthoMatrix",
    value: function getOrthoMatrix() {
      var size = this.getViewportPixelSize();
      var left = 0;
      var right = size.width;
      var bottom = 0;
      var top = size.height;
      var near = -1;
      var far = 1;
      var lr = 1 / (left - right);
      var bt = 1 / (bottom - top);
      var nf = 1 / (near - far);
      var out = new Float32Array(16);
      out[0] = -2 * lr;
      out[1] = 0;
      out[2] = 0;
      out[3] = 0;
      out[4] = 0;
      out[5] = -2 * bt;
      out[6] = 0;
      out[7] = 0;
      out[8] = 0;
      out[9] = 0;
      out[10] = 2 * nf;
      out[11] = 0;
      out[12] = (left + right) * lr;
      out[13] = (top + bottom) * bt;
      out[14] = (far + near) * nf;
      out[15] = 1;
      return out;
    }
    /**
     * Pans to the target plot coordinate. Cancels any current zoom or pan
     * animations.
     *
     * @param {number} pos - The target plot position.
     * @param {boolean} animate - Whether or not to animate the pan. Defaults to `true`.
     *
     * @returns {Plot} The plot object, for chaining.
     */

  }, {
    key: "panTo",
    value: function panTo(pos) {
      var animate = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : true;
      // cancel existing animations
      this.cancelPan();
      this.cancelZoom();
      this[HANDLERS].get(PAN).panTo(pos, animate);
      this.setDirty();
      return this;
    }
    /**
     * Zooms in to the target zoom level. This is bounded by the plot objects
     * minZoom and maxZoom attributes. Cancels any current zoom or pan
     * animations.
     *
     * @param {number} level - The target zoom level.
     * @param {boolean} animate - Whether or not to animate the zoom. Defaults to `true`.
     *
     * @returns {Plot} The plot object, for chaining.
     */

  }, {
    key: "zoomTo",
    value: function zoomTo(level) {
      var animate = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : true;
      // cancel existing animations
      this.cancelPan();
      this.cancelZoom();
      this[HANDLERS].get(ZOOM).zoomTo(level, animate);
      this.setDirty();
      return this;
    }
    /**
     * Zooms in to the target zoom level, centered on the target coordinates. The zoom is bounded by the plot objects
     * minZoom and maxZoom attributes. Cancels any current zoom or pan animations.
     *
     * @param {number} level - The target zoom level.
     * @param {Object} position - The target center position.
     * @param {boolean} animate - Whether or not to animate the zoom. Defaults to `true`.
     *
     * @returns {Plot} The plot object, for chaining.
     */

  }, {
    key: "zoomToPosition",
    value: function zoomToPosition(level, position) {
      var animate = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : true;
      // cancel existing animations
      this.cancelPan();
      this.cancelZoom();
      this[HANDLERS].get(ZOOM).zoomToPosition(level, position, animate);
      this.setDirty();
      return this;
    }
    /**
     * Fit the plot to a provided bounds in plot coordinates.
     *
     * @param {Bounds} bounds - The bounds object, in plot coordinates.
     *
     * @returns {Plot} The plot object, for chaining.
     */

  }, {
    key: "fitToBounds",
    value: function fitToBounds(bounds) {
      var targetZoom = this.getTargetZoom();
      var targetViewport = this.getTargetViewport();
      var scaleX = targetViewport.width / bounds.getWidth();
      var scaleY = targetViewport.height / bounds.getHeight();
      var scale = Math.min(scaleX, scaleY);
      var zoom = Math.log2(scale) + targetZoom;
      zoom = clamp(zoom, this.minZoom, this.maxZoom);

      if (!this.continuousZoom) {
        zoom = Math.floor(zoom);
      }

      var center = bounds.getCenter();
      this.zoomTo(zoom, false);
      this.panTo(center, false);
      this.setDirty();
      return this;
    }
    /**
     * Returns whether or not the plot is actively panning.
     *
     * @returns {bool} Whether or not the plot is panning.
     */

  }, {
    key: "isPanning",
    value: function isPanning() {
      return !!this.panAnimation;
    }
    /**
     * Returns whether or not the plot is actively zooming.
     *
     * @returns {bool} Whether or not the plot is zooming.
     */

  }, {
    key: "isZooming",
    value: function isZooming() {
      return !!this.zoomAnimation;
    }
    /**
     * Cancels any current pan animation.
     *
     * @returns {boolean} Whether or not the plot was panning.
     */

  }, {
    key: "cancelPan",
    value: function cancelPan() {
      if (this.isPanning()) {
        this.panAnimation.cancel();
        this.panAnimation = null;
        return true;
      }

      return false;
    }
    /**
     * Cancels any current zoom animation.
     *
     * @returns {boolean} Whether or not the plot was zooming.
     */

  }, {
    key: "cancelZoom",
    value: function cancelZoom() {
      if (this.isZooming()) {
        this.zoomAnimation.cancel();
        this.zoomAnimation = null;
        return true;
      }

      return false;
    }
    /**
     * Enables the pan event handler on the plot.
     */

  }, {
    key: "enablePanning",
    value: function enablePanning() {
      this[HANDLERS].get(PAN).enable();
    }
    /**
     * Disables the pan event handler on the plot.
     */

  }, {
    key: "disablePanning",
    value: function disablePanning() {
      this[HANDLERS].get(PAN).disable();
    }
    /**
     * Enables the zoom event handler on the plot.
     */

  }, {
    key: "enableZooming",
    value: function enableZooming() {
      this[HANDLERS].get(ZOOM).enable();
    }
    /**
     * Disables the zoom event handler on the plot.
     */

  }, {
    key: "disableZooming",
    value: function disableZooming() {
      this[HANDLERS].get(ZOOM).disable();
    }
    /**
     * Returns any highlighted data.
     *
     * @returns {Object} The highlighted data.
     */

  }, {
    key: "getHighlighted",
    value: function getHighlighted() {
      var layers = this.layers;

      for (var i = 0; i < layers.length; i++) {
        var highlight = layers[i].getHighlighted();

        if (highlight) {
          return highlight;
        }
      }

      return null;
    }
    /**
     * Returns true if the provided argument is highlighted.
     *
     * @param {Object} data - The data to test.
     *
     * @returns {boolean} Whether or not there is highlighted data.
     */

  }, {
    key: "isHighlighted",
    value: function isHighlighted(data) {
      var layers = this.layers;

      for (var i = 0; i < layers.length; i++) {
        if (layers[i].isHighlighted(data)) {
          return true;
        }
      }

      return false;
    }
    /**
     * Returns any selected data.
     *
     * @returns {Array} The selected data.
     */

  }, {
    key: "getSelected",
    value: function getSelected() {
      var selection = [];
      var layers = this.layers;

      for (var i = 0; i < layers.length; i++) {
        var selected = layers[i].getSelected();

        for (var j = 0; j < selected.length; j++) {
          selection.push(selected[j]);
        }
      }

      return selection;
    }
    /**
     * Returns true if the provided argument is selected.
     *
     * @param {Object} data - The data to test.
     *
     * @returns {boolean} Whether or not the data is selected.
     */

  }, {
    key: "isSelected",
    value: function isSelected(data) {
      var layers = this.layers;

      for (var i = 0; i < layers.length; i++) {
        if (layers[i].isSelected(data)) {
          return true;
        }
      }

      return false;
    }
    /**
     * Return the containing element of the plot.
     *
     * @returns {HTMLElement} The container of the plot.
     */

  }, {
    key: "getContainer",
    value: function getContainer() {
      return this.container;
    }
  }]);

  return Plot;
}(EventEmitter);

module.exports = Plot;
'use strict';

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

var Bounds = require('../geometry/Bounds');

var TileCoord = require('../layer/tile/TileCoord'); // Private Methods


var getVisibleTileBounds = function getVisibleTileBounds(viewport, tileZoom, wraparound) {
  var bounds = viewport.getTileBounds(tileZoom); // min / max tile coords

  var dim = Math.pow(2, tileZoom);
  var min = 0;
  var max = dim - 1; // get the bounds of the zoom level

  var layerBounds = new Bounds(wraparound ? -Infinity : min, wraparound ? Infinity : max, min, max); // check if the layer is within the viewport

  if (!bounds.overlaps(layerBounds)) {
    // there is no overlap
    return undefined;
  } // clamp horizontal bounds if there is no wraparound


  var left = wraparound ? bounds.left : Math.max(min, bounds.left);
  var right = wraparound ? bounds.right : Math.min(max, bounds.right); // clamp vertical bounds

  var bottom = Math.max(min, bounds.bottom);
  var top = Math.min(max, bounds.top);
  return new Bounds(left, right, bottom, top);
};

var isWithinRange = function isWithinRange(min, max, m, n) {
  // Given:
  //    1) An integer range r = [min : max].
  //    2) An power-of-two integer m.
  //    3) An integer n within the within the range of [0 : m).
  //    4) An integer constant k.
  // Check if n, or any values of m +/- kn, is within the range R.
  //
  // Ex:
  //     min: -3
  //     max: 6
  //     m: 8
  //     n: 7
  //
  // Return true because 7 - 8 = -1, which is within the range -3 to 6.
  // within range
  if (min <= n && n <= max) {
    return true;
  } // if the range is above n, find how many m's fit
  // in the distance between n and min


  if (min > n) {
    var _k = Math.ceil((min - n) / m);

    return n + _k * m <= max;
  } // if the range is below n, find how many m's fit
  // in the distance between max and n


  var k = Math.ceil((n - max) / m);
  return n - k * m >= min;
};
/**
 * Class representing a viewport.
 */


var Viewport =
/*#__PURE__*/
function () {
  /**
   * Instantiates a new Viewport object.
   *
   * @param {number} x - The x coordinate of the viewport.
   * @param {number} y - The y coordinate of the viewport.
   * @param {number} width - The width of the viewport.
   * @param {number} height - The height of the viewport.
   */
  function Viewport(x, y, width, height) {
    _classCallCheck(this, Viewport);

    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
  }
  /**
   * Returns the tile bounds of the viewport. Bounds edges are inclusive.
   * NOTE: this includes wraparound coordinates.
   *
   * @param {number} tileZoom - The zoom of the tiles within the viewport.
   *
   * @returns {Bounds} The tile bounds of the viewport.
   */


  _createClass(Viewport, [{
    key: "getTileBounds",
    value: function getTileBounds(tileZoom) {
      // calc how many fit are in the plot
      var tileSpan = 1 / Math.pow(2, tileZoom); // determine bounds

      return new Bounds(Math.floor(this.x / tileSpan), Math.ceil((this.x + this.width) / tileSpan) - 1, Math.floor(this.y / tileSpan), Math.ceil((this.y + this.height) / tileSpan) - 1);
    }
    /**
     * Returns the coordinates that are visible in the viewport.
     *
     * @param {number} tileZoom - The zoom of the tiles within the viewport. Optional.
     * @param {boolean} wraparound - The if the horizontal axis should wraparound. Optional.
     *
     * @returns {Array} The array of visible tile coords.
     */

  }, {
    key: "getVisibleCoords",
    value: function getVisibleCoords(tileZoom) {
      var wraparound = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;
      // get the bounds for what tiles are in view
      var bounds = getVisibleTileBounds(this, tileZoom, wraparound); // check if no coords are in view

      if (!bounds) {
        return [];
      } // return an array of the coords


      var coords = [];

      for (var x = bounds.left; x <= bounds.right; x++) {
        for (var y = bounds.bottom; y <= bounds.top; y++) {
          coords.push(new TileCoord(tileZoom, x, y));
        }
      }

      return coords;
    }
    /**
     * Returns whether or not the provided coord is within the viewport.
     *
     * @param {TileCoord} coord - The coord.
     * @param {boolean} wraparound - The if the horizontal axis should wraparound. Optional.
     *
     * @returns {boolean} Whether or not the coord is in view.
     */

  }, {
    key: "isInView",
    value: function isInView(coord) {
      var wraparound = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;
      // get the bounds for what tiles are in view
      var bounds = getVisibleTileBounds(this, coord.z, wraparound); // check if no coords are in view

      if (!bounds) {
        return false;
      }

      var dim = Math.pow(2, coord.z);
      return isWithinRange(bounds.left, bounds.right, dim, coord.x) && isWithinRange(bounds.bottom, bounds.top, dim, coord.y);
    }
    /**
     * Returns a viewport that has been zoomed around a provided position.
     *
     * @param {number} zoom - The current zoom of the viewport.
     * @param {number} targetZoom - The target zoom of the viewport.
     * @param {Object} targetPos - The target position to zoom around.
     * @param {boolean} relative - The target position is relative to the current position when true, and centered
     * when false.  This paramater defaults to true.
     *
     * @returns {Viewport} The new viewport object.
     */

  }, {
    key: "zoomToPos",
    value: function zoomToPos(zoom, targetZoom, targetPos) {
      var relative = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : true;
      var scale = Math.pow(2, targetZoom - zoom);
      var scaledWidth = this.width / scale;
      var scaledHeight = this.height / scale;
      var viewport = new Viewport(targetPos.x - (targetPos.x - this.x) / scale, targetPos.y - (targetPos.y - this.y) / scale, scaledWidth, scaledHeight);

      if (!relative) {
        viewport.centerOn(targetPos);
      }

      return viewport;
    }
    /**
     * Returns the lower-left corner position of the viewport in plot
     * coordinates.
     *
     * @returns {Object} The plot position.
     */

  }, {
    key: "getPosition",
    value: function getPosition() {
      return {
        x: this.x,
        y: this.y
      };
    }
    /**
     * Returns the center of the viewport in plot coordinates.
     *
     * @returns {Object} The plot center.
     */

  }, {
    key: "getCenter",
    value: function getCenter() {
      return {
        x: this.x + this.width / 2,
        y: this.y + this.height / 2
      };
    }
    /**
     * Returns the viewports size in pixels.
     *
     * @param {number} zoom - The zoom of the plot.
     * @param {number} tileSize - The size of a tile in pixels.
     *
     * @returns {Object} The view size in pixels.
     */

  }, {
    key: "getPixelSize",
    value: function getPixelSize(zoom, tileSize) {
      var extent = Math.pow(2, zoom) * tileSize;
      return {
        width: Math.round(this.width * extent),
        height: Math.round(this.height * extent)
      };
    }
    /**
     * Returns the viewports offset in pixels.
     *
     * @param {number} zoom - The zoom of the plot.
     * @param {number} tileSize - The size of a tile in pixels.
     *
     * @returns {Object} The view offset in pixels.
     */

  }, {
    key: "getPixelOffset",
    value: function getPixelOffset(zoom, tileSize) {
      var extent = Math.pow(2, zoom) * tileSize;
      return {
        x: this.x * extent,
        y: this.y * extent
      };
    }
    /**
     * Centers the viewport on a given plot coordinate.
     *
     * @param {Object} pos - The position to center the viewport on.
     *
     * @returns {Viewport} The viewport object, for chaining.
     */

  }, {
    key: "centerOn",
    value: function centerOn(pos) {
      this.x = pos.x - this.width / 2;
      this.y = pos.y - this.height / 2;
    }
  }]);

  return Viewport;
}();

module.exports = Viewport;
'use strict';

function _typeof(obj) { if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

function _possibleConstructorReturn(self, call) { if (call && (_typeof(call) === "object" || typeof call === "function")) { return call; } return _assertThisInitialized(self); }

function _assertThisInitialized(self) { if (self === void 0) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return self; }

function _getPrototypeOf(o) { _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf : function _getPrototypeOf(o) { return o.__proto__ || Object.getPrototypeOf(o); }; return _getPrototypeOf(o); }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function"); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, writable: true, configurable: true } }); if (superClass) _setPrototypeOf(subClass, superClass); }

function _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf || function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }

var EventEmitter = require('events');
/**
 * Class representing a renderer.
 */


var Renderer =
/*#__PURE__*/
function (_EventEmitter) {
  _inherits(Renderer, _EventEmitter);

  /**
   * Instantiates a new Renderer object.
   */
  function Renderer() {
    _classCallCheck(this, Renderer);

    return _possibleConstructorReturn(this, _getPrototypeOf(Renderer).call(this));
  }
  /**
   * Executed when the target is attached to a plot.
   *
   * @param {target} target - The target to attach the renderer to.
   *
   * @returns {Renderer} The renderer object, for chaining.
   */

  /* eslint-disable no-unused-vars */


  _createClass(Renderer, [{
    key: "onAdd",
    value: function onAdd(target) {
      return this;
    }
    /**
     * Executed when the target is removed from a plot.
     *
     * @param {Overlay} target - The target to remove the renderer from.
     *
     * @returns {Renderer} The renderer object, for chaining.
     */

    /* eslint-disable no-unused-vars */

  }, {
    key: "onRemove",
    value: function onRemove(target) {
      return this;
    }
    /**
     * Pick a position of the layer for a collision with any rendered objects.
     *
     * @param {Object} pos - The plot position to pick at.
     *
     * @returns {Object} The collision, or null.
     */

    /* eslint-disable no-unused-vars */

  }, {
    key: "pick",
    value: function pick(pos) {
      return null;
    }
    /**
     * Clears any persisted state in the renderer.
     *
     * @returns {Renderer} The renderer object, for chaining.
     */

  }, {
    key: "clear",
    value: function clear() {
      return this;
    }
    /**
     * The draw function that is executed per frame.
     *
     * @param {number} timestamp - The frame timestamp.
     *
     * @returns {Renderer} The renderer object, for chaining.
     */

    /* eslint-disable no-unused-vars */

  }, {
    key: "draw",
    value: function draw(timestamp) {
      return this;
    }
  }]);

  return Renderer;
}(EventEmitter);

module.exports = Renderer;
'use strict'; // https://github.com/arasatasaygin/is.js/blob/master/is.js

var userAgent = (navigator && navigator.userAgent || '').toLowerCase();
var vendor = (navigator && navigator.vendor || '').toLowerCase();
/**
 * Test if the browser is firefox.
 *
 * @private
 *
 * @returns {Array} Whether or not the browser is firefox.
 */

var isFirefox = function isFirefox() {
  return userAgent.match(/(?:firefox|fxios)\/(\d+)/);
};
/**
 * Test if the browser is chrome.
 *
 * @private
 *
 * @returns {Array} Whether or not the browser is chrome.
 */


var isChrome = function isChrome() {
  return /google inc/.test(vendor) ? userAgent.match(/(?:chrome|crios)\/(\d+)/) : null;
};
/**
 * Test if the browser is internet explorer.
 *
 * @private
 *
 * @returns {Array} Whether or not the browser is internet explorer.
 */


var isIE = function isIE() {
  return userAgent.match(/(?:msie |trident.+?; rv:)(\d+)/);
};
/**
 * Test if the browser is edge.
 *
 * @private
 *
 * @returns {Array} Whether or not the browser is edge.
 */


var isEdge = function isEdge() {
  return userAgent.match(/edge\/(\d+)/);
};
/**
 * Test if the browser is opera.
 *
 * @private
 *
 * @returns {Array} Whether or not the browser is opera.
 */


var isOpera = function isOpera() {
  return userAgent.match(/(?:^opera.+?version|opr)\/(\d+)/);
};
/**
 * Test if the browser is safari.
 *
 * @private
 *
 * @returns {Array} Whether or not the browser is safari.
 */


var isSafari = function isSafari() {
  return userAgent.match(/version\/(\d+).+?safari/);
};
/**
 * Browser detection.
 * @private
 */


module.exports = {
  /**
   * Whether or not the browser is firefox.
   * @constant {boolean}
   */
  firefox: !!isFirefox(),

  /**
   * Whether or not the browser is chrome.
   * @constant {boolean}
   */
  chrome: !!isChrome(),

  /**
   * Whether or not the browser is ie.
   * @constant {boolean}
   */
  ie: !!isIE(),

  /**
   * Whether or not the browser is edge.
   * @constant {boolean}
   */
  edge: !!isEdge(),

  /**
   * Whether or not the browser is opera.
   * @constant {boolean}
   */
  opera: !!isOpera(),

  /**
   * Whether or not the browser is safari.
   * @constant {boolean}
   */
  safari: !!isSafari()
};
'use strict';

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

var defaultTo = require('lodash/defaultTo');

var LinkedList = require('./LinkedList'); // Constants

/**
 * Max size symbol.
 * @private
 * @constant {Symbol}
 */


var CAPACITY = Symbol();
/**
 * Dispose function symbol.
 * @private
 * @constant {Symbol}
 */

var ON_REMOVE = Symbol();
/**
 * Cache symbol.
 * @private
 * @constant {Symbol}
 */

var CACHE = Symbol();
/**
 * LRU linked list symbol.
 * @private
 * @constant {Symbol}
 */

var LRU_LIST = Symbol();
/**
 * LRU length symbol.
 * @private
 * @constant {Symbol}
 */

var LENGTH = Symbol(); // Private Methods

var del = function del(self, node) {
  if (node) {
    var hit = node.value;

    if (self[ON_REMOVE]) {
      self[ON_REMOVE](hit.value, hit.key);
    }

    self[LENGTH]--;
    self[CACHE].delete(hit.key);
    self[LRU_LIST].removeNode(node);
  }
};
/**
 * Class representing an LRU cache.
 * @private
 */


var LRUCache =
/*#__PURE__*/
function () {
  /**
   * Instantiates a new LRUCache object.
   *
   * @param {Object} options - The options object.
   * @param {number} options.capacity - The capacity of the cache.
   * @param {Function} options.onRemove - A function to execute when a value is evicted.
   */
  function LRUCache() {
    var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

    _classCallCheck(this, LRUCache);

    this[CAPACITY] = defaultTo(Math.max(1, options.capacity), 256);
    this[ON_REMOVE] = defaultTo(options.onRemove, null);
    this.clear();
  }
  /**
   * Returns the capacity of the cache.
   *
   * @returns {number} - The capcity of the cache.
   */


  _createClass(LRUCache, [{
    key: "getCapacity",
    value: function getCapacity() {
      return this[CAPACITY];
    }
    /**
     * Returns the length of the cache.
     *
     * @returns {number} - The length of the cache.
     */

  }, {
    key: "getLength",
    value: function getLength() {
      return this[LENGTH];
    }
    /**
     * Iterates over and executes the provided function for all values.
     * NOTE: Does not update recentness of the entries.
     *
     * @param {Function} fn - The function to execute on each value and key.
     */

  }, {
    key: "forEach",
    value: function forEach(fn) {
      for (var node = this[LRU_LIST].head; node !== null;) {
        var next = node.next;
        fn(node.value.value, node.value.key);
        node = next;
      }
    }
    /**
     * Clears all entries in the cache.
     */

  }, {
    key: "clear",
    value: function clear() {
      var _this = this;

      if (this[ON_REMOVE] && this[LRU_LIST]) {
        this[LRU_LIST].forEach(function (hit) {
          _this[ON_REMOVE](hit.value, hit.key);
        });
      }

      this[CACHE] = new Map();
      this[LRU_LIST] = new LinkedList();
      this[LENGTH] = 0;
    }
    /**
     * Set a value under the provided key, removing the previous entry if one
     * exists.
     *
     * @param {string} key - The key string.
     * @param {*} value - The value.
     */

  }, {
    key: "set",
    value: function set(key, value) {
      if (this[CACHE].has(key)) {
        // if we already have an entry
        var node = this[CACHE].get(key);
        var item = node.value; // execute onRemove for old value before evicting

        if (this[ON_REMOVE]) {
          this[ON_REMOVE](item.value, key);
        } // set the new value


        item.value = value;
        this.get(key); // no need to trim, since the length remained constant

        return;
      } // add new entry


      var hit = new Entry(key, value);
      this[LENGTH]++;
      this[LRU_LIST].unshift(hit);
      this[CACHE].set(key, this[LRU_LIST].head); // trim any old entry

      if (this[LENGTH] > this[CAPACITY]) {
        // delete oldest entry
        del(this, this[LRU_LIST].tail);
      }
    }
    /**
     * Returns whether or not the entry is in the LRU cache under the provided
     * key.
     * NOTE: Does not update recentness of the entry.
     *
     * @param {string} key - The key string.
     *
     * @returns {boolean} Whether or not the key exists.
     */

  }, {
    key: "has",
    value: function has(key) {
      if (!this[CACHE].has(key)) {
        return false;
      }

      return true;
    }
    /**
     * Returns the entry in the LRU cache under the provided key.
     * NOTE: Updates the recentness of the entry.
     *
     * @param {string} key - The key string.
     *
     * @returns {*} The value in the cache.
     */

  }, {
    key: "get",
    value: function get(key) {
      var node = this[CACHE].get(key);

      if (node) {
        // update recentness
        this[LRU_LIST].unshiftNode(node);
        return node.value.value;
      }

      return undefined;
    }
    /**
     * Returns the entry in the LRU cache under the provided key.
     * NOTE: Does not update recentness of the entry.
     *
     * @param {string} key - The key string.
     *
     * @returns {*} The value in the cache.
     */

  }, {
    key: "peek",
    value: function peek(key) {
      var node = this[CACHE].get(key);

      if (node) {
        return node.value.value;
      }

      return undefined;
    }
    /**
     * Removes the entry in the LRU cache under the provided key.
     *
     * @param {string} key - The key string.
     */

  }, {
    key: "delete",
    value: function _delete(key) {
      del(this, this[CACHE].get(key));
    }
  }]);

  return LRUCache;
}();
/**
 * Class representing an LRU cache entry.
 * @private
 */


var Entry =
/**
 * Instantiates a new Entry object.
 *
 * @param {string} key - The entry key.
 * @param {*} value - The entry value.
 */
function Entry(key, value) {
  _classCallCheck(this, Entry);

  this.key = key;
  this.value = value;
};

module.exports = LRUCache;
'use strict';
/**
 * Class representing a linked list.
 * @private
 */

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

var LinkedList =
/*#__PURE__*/
function () {
  /**
   * Instantiates a new LinkedList object.
   */
  function LinkedList() {
    _classCallCheck(this, LinkedList);

    this.tail = null;
    this.head = null;
    this.length = 0;
  }
  /**
   * Push an item to the end of the linked list.
   *
   * @param {*} item - The item to add.
   *
   * @returns {number} The new length of the list.
   */


  _createClass(LinkedList, [{
    key: "push",
    value: function push(item) {
      this.tail = new Node(item, this.tail, null, this);

      if (!this.head) {
        this.head = this.tail;
      }

      this.length++;
      return this.length;
    }
    /**
     * Push an item to the front of the linked list.
     *
     * @param {*} item - The item to add.
     *
     * @returns {number} The new length of the list.
     */

  }, {
    key: "unshift",
    value: function unshift(item) {
      this.head = new Node(item, null, this.head, this);

      if (!this.tail) {
        this.tail = this.head;
      }

      this.length++;
      return this.length;
    }
    /**
     * Remove an item front the end of the linked list.
     *
     * @returns {*} The removed value.
     */

  }, {
    key: "pop",
    value: function pop() {
      if (!this.tail) {
        return undefined;
      }

      var res = this.tail.value;
      this.tail = this.tail.prev;

      if (this.tail) {
        this.tail.next = null;
      } else {
        this.head = null;
      }

      this.length--;
      return res;
    }
    /**
     * Remove an item from the front of the linked list.
     *
     * @returns {*} The removed value.
     */

  }, {
    key: "shift",
    value: function shift() {
      if (!this.head) {
        return undefined;
      }

      var res = this.head.value;
      this.head = this.head.next;

      if (this.head) {
        this.head.prev = null;
      } else {
        this.tail = null;
      }

      this.length--;
      return res;
    }
    /**
     * Get an item at a particular index in the list.
     *
     * @param {number} n - The index of the element.
     *
     * @returns {*} The value.
     */

  }, {
    key: "get",
    value: function get(n) {
      var i;
      var node;

      for (i = 0, node = this.head; node !== null && i < n; i++) {
        // abort out of the list early if we hit a cycle
        node = node.next;
      }

      if (i === n && node !== null) {
        return node.value;
      }
    }
    /**
     * Iterates over and executes the provided function for all values.
     *
     * @param {Function} fn - The function to execute on each value.
     */

  }, {
    key: "forEach",
    value: function forEach(fn) {
      for (var node = this.head, i = 0; node !== null; i++) {
        fn(node.value, i);
        node = node.next;
      }
    }
    /**
     * Iterates over and executes the provided function for all values returning
     * an array of all mapped values.
     *
     * @param {Function} fn - The function to execute on each tile.
     *
     * @returns {Array} The array of mapped values.
     */

  }, {
    key: "map",
    value: function map(fn) {
      var arr = new Array(this.length);

      for (var i = 0, node = this.head; node !== null; i++) {
        arr[i] = fn(node.value, i);
        node = node.next;
      }

      return arr;
    }
    /**
     * Push a node to the end of the linked list.
     *
     * @param {Node} node - The node to add.
     *
     * @returns {number} The new length of the list.
     */

  }, {
    key: "pushNode",
    value: function pushNode(node) {
      if (node === this.tail) {
        return;
      }

      if (node.list) {
        node.list.removeNode(node);
      }

      var tail = this.tail;
      node.list = this;
      node.prev = tail;

      if (tail) {
        tail.next = node;
      }

      this.tail = node;

      if (!this.head) {
        this.head = node;
      }

      this.length++;
      return this.length;
    }
    /**
     * Push a node to the front of the linked list.
     *
     * @param {Node} node - The node to add.
     *
     * @returns {number} The new length of the list.
     */

  }, {
    key: "unshiftNode",
    value: function unshiftNode(node) {
      if (node === this.head) {
        return;
      }

      if (node.list) {
        node.list.removeNode(node);
      }

      var head = this.head;
      node.list = this;
      node.next = head;

      if (head) {
        head.prev = node;
      }

      this.head = node;

      if (!this.tail) {
        this.tail = node;
      }

      this.length++;
      return this.length;
    }
    /**
     * Remove a node from the linked list.
     *
     * @param {Node} node - The node to remove.
     *
     * @returns {number} The new length of the list.
     */

  }, {
    key: "removeNode",
    value: function removeNode(node) {
      if (node.list !== this) {
        throw 'Removing node which does not belong to this list';
      }

      var next = node.next;
      var prev = node.prev;

      if (next) {
        next.prev = prev;
      }

      if (prev) {
        prev.next = next;
      }

      if (node === this.head) {
        this.head = next;
      }

      if (node === this.tail) {
        this.tail = prev;
      }

      node.list.length--;
      node.next = null;
      node.prev = null;
      node.list = null;
      return this.length;
    }
  }]);

  return LinkedList;
}();
/**
 * Class representing a linked list node.
 * @private
 */


var Node =
/**
 * Instantiates a new Node object.
 *
 * @param {*} value - The value of the node.
 * @param {Node} prev - The previous node.
 * @param {Node} next - The next node.
 * @param {LinkedList} list - The linked list.
 */
function Node(value, prev, next, list) {
  _classCallCheck(this, Node);

  this.list = list;
  this.value = value;

  if (prev) {
    prev.next = this;
    this.prev = prev;
  } else {
    this.prev = null;
  }

  if (next) {
    next.prev = this;
    this.next = next;
  } else {
    this.next = null;
  }
};

module.exports = LinkedList;
'use strict';
/**
 * Issues a XHR and loads an ArrayBuffer.
 *
 * @param {string} url - The url.
 * @param {Function} done - The callback.
 */

module.exports = function (url, done) {
  var req = new XMLHttpRequest();
  req.open('GET', url, true);
  req.responseType = 'arraybuffer';

  req.onload = function () {
    var arraybuffer = req.response;

    if (arraybuffer) {
      done(null, arraybuffer);
    } else {
      var err = "Unable to load ArrayBuffer from URL: `".concat(event.path[0].currentSrc, "`");
      done(err, null);
    }
  };

  req.onerror = function (event) {
    var err = "Unable to load ArrayBuffer from URL: `".concat(event.path[0].currentSrc, "`");
    done(err, null);
  };

  req.withCredentials = true;
  req.send(null);
};
'use strict';
/**
 * Issues a XHR and loads an Image.
 *
 * @param {string} url - The url.
 * @param {Function} done - The callback.
 */

module.exports = function (url, done) {
  var image = new Image();

  image.onload = function () {
    done(null, image);
  };

  image.onerror = function (event) {
    var err = "Unable to load image from URL: `".concat(event.path[0].currentSrc, "`");
    done(err, null);
  };

  image.crossOrigin = 'anonymous';
  image.src = url;
};
'use strict';

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

var Texture = require('./texture/Texture');

var Shader = require('./shader/Shader');

var VertexBuffer = require('./vertex/VertexBuffer'); // Constants

/**
 * Shader GLSL source.
 * @private
 * @constant {Object}
 */


var SHADER_GLSL = {
  vert: "\n\t\tprecision highp float;\n\t\tattribute vec3 aVertexPosition;\n\t\tattribute vec2 aTextureCoord;\n\t\tvarying vec2 vTextureCoord;\n\t\tvoid main(void) {\n\t\t\tvTextureCoord = aTextureCoord;\n\t\t\tgl_Position = vec4(aVertexPosition, 1.0);\n\t\t}\n\t\t",
  frag: "\n\t\tprecision highp float;\n\t\tuniform float uOpacity;\n\t\tuniform sampler2D uTextureSampler;\n\t\tvarying vec2 vTextureCoord;\n\t\tvoid main(void) {\n\t\t\tvec4 color = texture2D(uTextureSampler, vTextureCoord);\n\t\t\tgl_FragColor = vec4(color.rgb, color.a * uOpacity);\n\t\t}\n\t\t"
}; // Private Methods

var createQuad = function createQuad(gl, min, max) {
  var vertices = new Float32Array(24); // positions

  vertices[0] = min;
  vertices[1] = min;
  vertices[2] = max;
  vertices[3] = min;
  vertices[4] = max;
  vertices[5] = max;
  vertices[6] = min;
  vertices[7] = min;
  vertices[8] = max;
  vertices[9] = max;
  vertices[10] = min;
  vertices[11] = max; // uvs

  vertices[12] = 0;
  vertices[13] = 0;
  vertices[14] = 1;
  vertices[15] = 0;
  vertices[16] = 1;
  vertices[17] = 1;
  vertices[18] = 0;
  vertices[19] = 0;
  vertices[20] = 1;
  vertices[21] = 1;
  vertices[22] = 0;
  vertices[23] = 1; // create quad buffer

  return new VertexBuffer(gl, vertices, {
    0: {
      size: 2,
      type: 'FLOAT',
      byteOffset: 0
    },
    1: {
      size: 2,
      type: 'FLOAT',
      byteOffset: 2 * 6 * 4
    }
  }, {
    count: 6
  });
};

var setColorTarget = function setColorTarget(gl, framebuffer, attachment, index) {
  gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl["COLOR_ATTACHMENT".concat(index)], gl.TEXTURE_2D, attachment.texture, 0);
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);
};

var renderToScreen = function renderToScreen(gl, texture, shader, quad, opacity) {
  // bind shader
  shader.use(); // set blending func

  gl.enable(gl.BLEND);
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA); // set uniforms

  shader.setUniform('uOpacity', opacity); // set texture sampler unit

  shader.setUniform('uTextureSampler', 0); // bind texture

  texture.bind(0); // draw quad

  quad.bind();
  quad.draw();
  quad.unbind();
};
/**
 * Class representing a webgl renderbuffer.
 */


var RenderBuffer =
/*#__PURE__*/
function () {
  /**
   * Instantiates a RenderBuffer object.
   *
   * @param {WebGLRenderingContext} gl - The WebGL context.
   * @param {number} width - The width of the renderbuffer.
   * @param {number} height - The height of the renderbuffer.
   */
  function RenderBuffer(gl, width, height) {
    _classCallCheck(this, RenderBuffer);

    this.gl = gl;
    this.framebuffer = gl.createFramebuffer();
    this.shader = new Shader(gl, SHADER_GLSL);
    this.quad = createQuad(gl, -1, 1);
    this.texture = new Texture(gl, null, {
      width: width,
      height: height,
      filter: 'NEAREST',
      invertY: false,
      premultiplyAlpha: false
    });
    setColorTarget(this.gl, this.framebuffer, this.texture, 0);
  }
  /**
   * Binds the renderbuffer for writing.
   *
   * @returns {RenderBuffer} The renderbuffer object, for chaining.
   */


  _createClass(RenderBuffer, [{
    key: "bind",
    value: function bind() {
      var gl = this.gl;
      gl.bindFramebuffer(gl.FRAMEBUFFER, this.framebuffer);
      return this;
    }
    /**
     * Unbinds the renderbuffer for writing.
     *
     * @returns {RenderBuffer} The renderbuffer object, for chaining.
     */

  }, {
    key: "unbind",
    value: function unbind() {
      var gl = this.gl;
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      return this;
    }
    /**
     * Clears the renderbuffer buffer color bits.
     *
     * @returns {RenderBuffer} The renderbuffer object, for chaining.
     */

  }, {
    key: "clear",
    value: function clear() {
      this.gl.clearColor(0, 0, 0, 0);
      this.gl.clear(this.gl.COLOR_BUFFER_BIT);
      return this;
    }
    /**
     * Blits the renderbuffer texture to the screen.
     *
     * @param {number} opacity - The opacity to blit at.
     *
     * @returns {RenderBuffer} The renderbuffer object, for chaining.
     */

  }, {
    key: "blitToScreen",
    value: function blitToScreen(opacity) {
      renderToScreen(this.gl, this.texture, this.shader, this.quad, opacity);
      return this;
    }
    /**
     * Resizes the renderbuffer to the provided height and width.
     *
     * @param {number} width - The new width of the renderbuffer.
     * @param {number} height - The new height of the renderbuffer.
     *
     * @returns {RenderBuffer} The renderbuffer object, for chaining.
     */

  }, {
    key: "resize",
    value: function resize(width, height) {
      this.texture.resize(width, height);
      return this;
    }
  }]);

  return RenderBuffer;
}();

module.exports = RenderBuffer;
'use strict';

function _typeof(obj) { if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

function _possibleConstructorReturn(self, call) { if (call && (_typeof(call) === "object" || typeof call === "function")) { return call; } return _assertThisInitialized(self); }

function _assertThisInitialized(self) { if (self === void 0) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return self; }

function _get(target, property, receiver) { if (typeof Reflect !== "undefined" && Reflect.get) { _get = Reflect.get; } else { _get = function _get(target, property, receiver) { var base = _superPropBase(target, property); if (!base) return; var desc = Object.getOwnPropertyDescriptor(base, property); if (desc.get) { return desc.get.call(receiver); } return desc.value; }; } return _get(target, property, receiver || target); }

function _superPropBase(object, property) { while (!Object.prototype.hasOwnProperty.call(object, property)) { object = _getPrototypeOf(object); if (object === null) break; } return object; }

function _getPrototypeOf(o) { _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf : function _getPrototypeOf(o) { return o.__proto__ || Object.getPrototypeOf(o); }; return _getPrototypeOf(o); }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function"); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, writable: true, configurable: true } }); if (superClass) _setPrototypeOf(subClass, superClass); }

function _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf || function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }

var EventType = require('../../event/EventType');

var Layer = require('../Layer'); // Constants

/**
 * Cell update event handler symbol.
 * @private
 * @constant {Symbol}
 */


var CELL_UPDATE = Symbol();
/**
 * Clipped geometry symbol.
 * @private
 * @constant {Symbol}
 */

var CLIPPED = Symbol();
/**
 * Class representing an overlay layer.
 */

var Overlay =
/*#__PURE__*/
function (_Layer) {
  _inherits(Overlay, _Layer);

  /**
   * Instantiates a new Overlay object.
   *
   * @param {Object} options - The overlay options.
   * @param {number} options.opacity - The overlay opacity.
   * @param {number} options.zIndex - The overlay z-index.
   * @param {boolean} options.hidden - Whether or not the overlay is visible.
   */
  function Overlay() {
    var _this;

    var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

    _classCallCheck(this, Overlay);

    _this = _possibleConstructorReturn(this, _getPrototypeOf(Overlay).call(this, options));
    _this[CLIPPED] = null;
    _this[CELL_UPDATE] = null;
    return _this;
  }
  /**
   * Executed when the overlay is attached to a plot.
   *
   * @param {Plot} plot - The plot to attach the overlay to.
   *
   * @returns {Overlay} The overlay object, for chaining.
   */


  _createClass(Overlay, [{
    key: "onAdd",
    value: function onAdd(plot) {
      var _this2 = this;

      _get(_getPrototypeOf(Overlay.prototype), "onAdd", this).call(this, plot); // clip existing geometry


      this.refresh(); // create cell update handler

      this[CELL_UPDATE] = function () {
        _this2.refresh();
      }; // attach handler


      this.plot.on(EventType.CELL_UPDATE, this[CELL_UPDATE]);
      return this;
    }
    /**
     * Executed when the overlay is removed from a plot.
     *
     * @param {Plot} plot - The plot to remove the overlay from.
     *
     * @returns {Overlay} The overlay object, for chaining.
     */

  }, {
    key: "onRemove",
    value: function onRemove(plot) {
      // remove clipped geometry
      this[CLIPPED] = null; // remove handler

      this.plot.removeListener(EventType.CELL_UPDATE, this[CELL_UPDATE]); // create refresh handler

      this[CELL_UPDATE] = null;

      _get(_getPrototypeOf(Overlay.prototype), "onRemove", this).call(this, plot);

      return this;
    }
    /**
     * Unmutes and shows the overlay.
     *
     * @returns {Overlay} The overlay object, for chaining.
     */

  }, {
    key: "enable",
    value: function enable() {
      this.show();
      return this;
    }
    /**
     * Mutes and hides the overlay.
     *
     * @returns {Overlay} The overlay object, for chaining.
     */

  }, {
    key: "disable",
    value: function disable() {
      this.hide();
      return this;
    }
    /**
     * Returns true if the overlay is disabled.
     *
     * @returns {boolean} Whether or not the overlay is disabled.
     */

  }, {
    key: "isDisabled",
    value: function isDisabled() {
      return this.isHidden();
    }
    /**
     * Clears any persisted state in the overlay and refreshes the underlying
     * data. This involves refreshing the stored clipped geometry of the
     * overlay based the current rendering cell of the plot.
     *
     * @returns {Overlay} The overlay object, for chaining.
     */

  }, {
    key: "refresh",
    value: function refresh() {
      if (this.plot) {
        this[CLIPPED] = this.clipGeometry(this.plot.cell);
      }

      _get(_getPrototypeOf(Overlay.prototype), "refresh", this).call(this);

      return this;
    }
    /**
     * Given an array of point based geometry, return the clipped geometry.
     *
     * @param {Cell} cell - The rendering cell.
     *
     * @returns {Array} The array of clipped geometry.
     */

    /* eslint-disable no-unused-vars */

  }, {
    key: "clipGeometry",
    value: function clipGeometry(cell) {
      throw '`clipGeometry` must be overridden';
    }
    /**
     * Return the clipped geometry based on the current cell.
     *
     * @returns {Array} The array of clipped geometry.
     */

  }, {
    key: "getClippedGeometry",
    value: function getClippedGeometry() {
      return this[CLIPPED];
    }
  }]);

  return Overlay;
}(Layer);

module.exports = Overlay;
'use strict';

function _typeof(obj) { if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

function _possibleConstructorReturn(self, call) { if (call && (_typeof(call) === "object" || typeof call === "function")) { return call; } return _assertThisInitialized(self); }

function _assertThisInitialized(self) { if (self === void 0) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return self; }

function _getPrototypeOf(o) { _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf : function _getPrototypeOf(o) { return o.__proto__ || Object.getPrototypeOf(o); }; return _getPrototypeOf(o); }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function"); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, writable: true, configurable: true } }); if (superClass) _setPrototypeOf(subClass, superClass); }

function _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf || function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }

var Overlay = require('./Overlay'); // Private Methods


var clipPoints = function clipPoints(cell, points) {
  var clipped = [];
  points.forEach(function (pts) {
    var clippedPoints = cell.bounds.clipPoints(pts);

    if (!clippedPoints) {
      return;
    }

    for (var i = 0; i < clippedPoints.length; i++) {
      clipped.push(cell.project(clippedPoints[i]));
    }
  });
  return clipped;
};
/**
 * Class representing a point overlay.
 */


var PointOverlay =
/*#__PURE__*/
function (_Overlay) {
  _inherits(PointOverlay, _Overlay);

  /**
   * Instantiates a new PointOverlay object.
   *
   * @param {Object} options - The layer options.
   * @param {number} options.opacity - The layer opacity.
   * @param {number} options.zIndex - The layer z-index.
   */
  function PointOverlay() {
    var _this;

    var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

    _classCallCheck(this, PointOverlay);

    _this = _possibleConstructorReturn(this, _getPrototypeOf(PointOverlay).call(this, options));
    _this.points = new Map();
    return _this;
  }
  /**
   * Add a set of points to render.
   *
   * @param {string} id - The id to store the points under.
   * @param {Array} points - The points.
   *
   * @returns {PointOverlay} The overlay object, for chaining.
   */


  _createClass(PointOverlay, [{
    key: "addPoints",
    value: function addPoints(id, points) {
      this.points.set(id, points);

      if (this.plot) {
        this.refresh();
      }

      return this;
    }
    /**
     * Remove a set of points by id from the overlay.
     *
     * @param {string} id - The id to store the points under.
     *
     * @returns {PointOverlay} The overlay object, for chaining.
     */

  }, {
    key: "removePoints",
    value: function removePoints(id) {
      this.points.delete(id);

      if (this.plot) {
        this.refresh();
      }

      return this;
    }
    /**
     * Remove all points from the layer.
     *
     * @returns {PointOverlay} The overlay object, for chaining.
     */

  }, {
    key: "clearPoints",
    value: function clearPoints() {
      this.clear();
      this.points = new Map();

      if (this.plot) {
        this.refresh();
      }

      return this;
    }
    /**
     * Return the clipped geometry based on the current cell.
     *
     * @param {Cell} cell - The rendering cell.
     *
     * @returns {Array} The array of clipped geometry.
     */

  }, {
    key: "clipGeometry",
    value: function clipGeometry(cell) {
      return clipPoints(cell, this.points);
    }
  }]);

  return PointOverlay;
}(Overlay);

module.exports = PointOverlay;
'use strict';

function _typeof(obj) { if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

function _possibleConstructorReturn(self, call) { if (call && (_typeof(call) === "object" || typeof call === "function")) { return call; } return _assertThisInitialized(self); }

function _assertThisInitialized(self) { if (self === void 0) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return self; }

function _getPrototypeOf(o) { _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf : function _getPrototypeOf(o) { return o.__proto__ || Object.getPrototypeOf(o); }; return _getPrototypeOf(o); }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function"); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, writable: true, configurable: true } }); if (superClass) _setPrototypeOf(subClass, superClass); }

function _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf || function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }

var Overlay = require('./Overlay'); // Private Methods


var clipPolygons = function clipPolygons(cell, polygons) {
  var clipped = [];
  polygons.forEach(function (polygon) {
    var clippedPolygon = cell.bounds.clipPolygon(polygon);

    if (!clippedPolygon) {
      return;
    }

    var result = new Array(clippedPolygon.length);

    for (var i = 0; i < clippedPolygon.length; i++) {
      result[i] = cell.project(clippedPolygon[i]);
    }

    clipped.push(result);
  });
  return clipped;
};
/**
 * Class representing a polygon overlay.
 */


var PolygonOverlay =
/*#__PURE__*/
function (_Overlay) {
  _inherits(PolygonOverlay, _Overlay);

  /**
   * Instantiates a new PolygonOverlay object.
   *
   * @param {Object} options - The layer options.
   * @param {Renderer} options.renderer - The layer renderer.
   * @param {number} options.opacity - The layer opacity.
   * @param {number} options.zIndex - The layer z-index.
   */
  function PolygonOverlay() {
    var _this;

    var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

    _classCallCheck(this, PolygonOverlay);

    _this = _possibleConstructorReturn(this, _getPrototypeOf(PolygonOverlay).call(this, options));
    _this.polygons = new Map();
    return _this;
  }
  /**
   * Add a set of points to render as a single polygon.
   *
   * @param {string} id - The id to store the polygon under.
   * @param {Array} points - The polygon points.
   *
   * @returns {PolygonOverlay} The overlay object, for chaining.
   */


  _createClass(PolygonOverlay, [{
    key: "addPolygon",
    value: function addPolygon(id, points) {
      this.polygons.set(id, points);

      if (this.plot) {
        this.refresh();
      }

      return this;
    }
    /**
     * Remove a polygon by id from the overlay.
     *
     * @param {string} id - The id to store the polygon under.
     *
     * @returns {PolygonOverlay} The overlay object, for chaining.
     */

  }, {
    key: "removePolygon",
    value: function removePolygon(id) {
      this.polygons.delete(id);

      if (this.plot) {
        this.refresh();
      }

      return this;
    }
    /**
     * Remove all polygons from the layer.
     *
     * @returns {PolygonOverlay} The overlay object, for chaining.
     */

  }, {
    key: "clearPolygons",
    value: function clearPolygons() {
      this.clear();
      this.polygons = new Map();

      if (this.plot) {
        this.refresh();
      }

      return this;
    }
    /**
     * Return the clipped geometry based on the current cell.
     *
     * @param {Cell} cell - The rendering cell.
     *
     * @returns {Array} The array of clipped geometry.
     */

  }, {
    key: "clipGeometry",
    value: function clipGeometry(cell) {
      return clipPolygons(cell, this.polygons);
    }
  }]);

  return PolygonOverlay;
}(Overlay);

module.exports = PolygonOverlay;
'use strict';

function _typeof(obj) { if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

function _possibleConstructorReturn(self, call) { if (call && (_typeof(call) === "object" || typeof call === "function")) { return call; } return _assertThisInitialized(self); }

function _assertThisInitialized(self) { if (self === void 0) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return self; }

function _getPrototypeOf(o) { _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf : function _getPrototypeOf(o) { return o.__proto__ || Object.getPrototypeOf(o); }; return _getPrototypeOf(o); }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function"); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, writable: true, configurable: true } }); if (superClass) _setPrototypeOf(subClass, superClass); }

function _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf || function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }

var Overlay = require('./Overlay'); // Private Methods


var clipPolylines = function clipPolylines(cell, polylines) {
  var clipped = [];
  polylines.forEach(function (polyline) {
    // clip the polyline, resulting in multiple clipped polylines
    var clippedPolylines = cell.bounds.clipPolyline(polyline);

    if (!clippedPolylines) {
      return;
    }

    for (var i = 0; i < clippedPolylines.length; i++) {
      var clippedPolyline = clippedPolylines[i];

      for (var j = 0; j < clippedPolyline.length; j++) {
        // project in place
        clippedPolyline[j] = cell.project(clippedPolyline[j]);
      }

      clipped.push(clippedPolyline);
    }
  });
  return clipped;
};
/**
 * Class representing a polyline overlay.
 */


var PolylineOverlay =
/*#__PURE__*/
function (_Overlay) {
  _inherits(PolylineOverlay, _Overlay);

  /**
   * Instantiates a new PolylineOverlay object.
   *
   * @param {Object} options - The layer options.
   * @param {Renderer} options.renderer - The layer renderer.
   * @param {number} options.opacity - The layer opacity.
   * @param {number} options.zIndex - The layer z-index.
   */
  function PolylineOverlay() {
    var _this;

    var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

    _classCallCheck(this, PolylineOverlay);

    _this = _possibleConstructorReturn(this, _getPrototypeOf(PolylineOverlay).call(this, options));
    _this.polylines = new Map();
    return _this;
  }
  /**
   * Add a set of points to render as a single polyline.
   *
   * @param {string} id - The id to store the polyline under.
   * @param {Array} points - The polyline points.
   *
   * @returns {PolylineOverlay} The overlay object, for chaining.
   */


  _createClass(PolylineOverlay, [{
    key: "addPolyline",
    value: function addPolyline(id, points) {
      this.polylines.set(id, points);

      if (this.plot) {
        this.refresh();
      }

      return this;
    }
    /**
     * Remove a polyline by id from the overlay.
     *
     * @param {string} id - The id to store the polyline under.
     *
     * @returns {PolylineOverlay} The overlay object, for chaining.
     */

  }, {
    key: "removePolyline",
    value: function removePolyline(id) {
      this.polylines.delete(id);

      if (this.plot) {
        this.refresh();
      }

      return this;
    }
    /**
     * Remove all polylines from the layer.
     *
     * @returns {PolylineOverlay} The overlay object, for chaining.
     */

  }, {
    key: "clearPolylines",
    value: function clearPolylines() {
      this.clear();
      this.polylines = new Map();

      if (this.plot) {
        this.refresh();
      }

      return this;
    }
    /**
     * Return the clipped geometry based on the current cell.
     *
     * @param {Cell} cell - The rendering cell.
     *
     * @returns {Array} The array of clipped geometry.
     */

  }, {
    key: "clipGeometry",
    value: function clipGeometry(cell) {
      return clipPolylines(cell, this.polylines);
    }
  }]);

  return PolylineOverlay;
}(Overlay);

module.exports = PolylineOverlay;
'use strict'; // Constants

/**
 * Maximum safe integer.
 * @private
 * @constant {number}
 */

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var MAX_SAFE_INT = Math.pow(2, 53) - 1; // Private Methods

var uid = 1;

var getUID = function getUID() {
  uid = (uid + 1) % MAX_SAFE_INT;
  return uid;
};
/**
 * Class representing a tile.
 */


var Tile =
/**
 * Instantiates a new Tile object.
 *
 * @param {TileCoord} coord - The coord of the tile.
 */
function Tile(coord) {
  _classCallCheck(this, Tile);

  this.coord = coord;
  this.uid = getUID();
  this.data = null;
  this.err = null;
};

module.exports = Tile;
'use strict'; // Private Methods

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

var mod = function mod(n, m) {
  return (n % m + m) % m;
};
/**
 * Class representing a tile coordinate.
 */


var TileCoord =
/*#__PURE__*/
function () {
  /**
   * Instantiates a new TileCoord object.
   *
   * @param {number} z - The z component of the tile coordinate.
   * @param {number} x - The x component of the tile coordinate.
   * @param {number} y - The y component of the tile coordinate.
   */
  function TileCoord(z, x, y) {
    _classCallCheck(this, TileCoord);

    this.z = z;
    this.x = x;
    this.y = y;
    this.hash = "".concat(this.z, ":").concat(this.x, ":").concat(this.y);
  }
  /**
   * Returns the XYZ URL string.
   *
   * @returns {string} The XYZ URL string.
   */


  _createClass(TileCoord, [{
    key: "xyz",
    value: function xyz() {
      var dim = Math.pow(2, this.z);
      return "".concat(this.z, "/").concat(this.x, "/").concat(dim - 1 - this.y);
    }
    /**
     * Returns the TMS URL string.
     *
     * @returns {string} The TMS URL string.
     */

  }, {
    key: "tms",
    value: function tms() {
      return "".concat(this.z, "/").concat(this.x, "/").concat(this.y);
    }
    /**
     * Test if the bounds equals another.
     *
     * @param {TileCoord} coord - The coord object to test.
     *
     * @returns {boolean} Whether or not the coord objects are equal.
     */

  }, {
    key: "equals",
    value: function equals(coord) {
      return this.z === coord.z && this.x === coord.x && this.y === coord.y;
    }
    /**
     * Get the ancestor coord.
     *
     * @param {number} offset - The offset of the ancestor from the coord. Optional.
     *
     * @returns {TileCoord} The ancestor coord.
     */

  }, {
    key: "getAncestor",
    value: function getAncestor() {
      var offset = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 1;
      var scale = Math.pow(2, offset);
      return new TileCoord(this.z - offset, Math.floor(this.x / scale), Math.floor(this.y / scale));
    }
    /**
     * Get the descendants of the coord.
     *
     * @param {number} offset - The offset of the descendants from the coord. Optional.
     *
     * @returns {Array} The array of descendant coords.
     */

  }, {
    key: "getDescendants",
    value: function getDescendants() {
      var offset = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 1;
      var scale = Math.pow(2, offset);
      var coords = new Array(scale * scale);

      for (var x = 0; x < scale; x++) {
        var stride = x * scale;

        for (var y = 0; y < scale; y++) {
          coords[stride + y] = new TileCoord(this.z + offset, this.x * scale + x, this.y * scale + y);
        }
      }

      return coords;
    }
    /**
     * Test if the coord is an ancestor of the provided coord.
     *
     * @param {TileCoord} coord - The coord object to test.
     *
     * @returns {boolean} Whether or not the provided coord is an ancestor.
     */

  }, {
    key: "isAncestorOf",
    value: function isAncestorOf(coord) {
      if (this.z >= coord.z) {
        return false;
      }

      var diff = coord.z - this.z;
      var scale = Math.pow(2, diff);
      var x = Math.floor(coord.x / scale);

      if (this.x !== x) {
        return false;
      }

      var y = Math.floor(coord.y / scale);
      return this.y === y;
    }
    /**
     * Test if the coord is a descendant of the provided coord.
     *
     * @param {TileCoord} coord - The coord object to test.
     *
     * @returns {boolean} Whether or not the provided coord is a descendant.
     */

  }, {
    key: "isDescendantOf",
    value: function isDescendantOf(coord) {
      return coord.isAncestorOf(this);
    }
    /**
     * Returns the normalized coord.
     *
     * @returns {TileCoord} The normalized coord.
     */

  }, {
    key: "normalize",
    value: function normalize() {
      var dim = Math.pow(2, this.z);
      return new TileCoord(this.z, mod(this.x, dim), mod(this.y, dim));
    }
    /**
     * Returns the plot coordinate for the bottom-left corner of the coord.
     *
     * @returns {Object} The plot position of the coord.
     */

  }, {
    key: "getPosition",
    value: function getPosition() {
      var dim = Math.pow(2, this.z);
      return {
        x: this.x / dim,
        y: this.y / dim
      };
    }
    /**
     * Returns the plot coordinate for the center of the coord.
     *
     * @returns {Object} The plot position of the center.
     */

  }, {
    key: "getCenter",
    value: function getCenter() {
      var dim = Math.pow(2, this.z);
      return {
        x: (this.x + 0.5) / dim,
        y: (this.y + 0.5) / dim
      };
    }
  }]);

  return TileCoord;
}();

module.exports = TileCoord;
'use strict';

function _typeof(obj) { if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

function _possibleConstructorReturn(self, call) { if (call && (_typeof(call) === "object" || typeof call === "function")) { return call; } return _assertThisInitialized(self); }

function _get(target, property, receiver) { if (typeof Reflect !== "undefined" && Reflect.get) { _get = Reflect.get; } else { _get = function _get(target, property, receiver) { var base = _superPropBase(target, property); if (!base) return; var desc = Object.getOwnPropertyDescriptor(base, property); if (desc.get) { return desc.get.call(receiver); } return desc.value; }; } return _get(target, property, receiver || target); }

function _superPropBase(object, property) { while (!Object.prototype.hasOwnProperty.call(object, property)) { object = _getPrototypeOf(object); if (object === null) break; } return object; }

function _getPrototypeOf(o) { _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf : function _getPrototypeOf(o) { return o.__proto__ || Object.getPrototypeOf(o); }; return _getPrototypeOf(o); }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function"); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, writable: true, configurable: true } }); if (superClass) _setPrototypeOf(subClass, superClass); }

function _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf || function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }

function _assertThisInitialized(self) { if (self === void 0) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return self; }

var defaultTo = require('lodash/defaultTo');

var Layer = require('../Layer');

var TilePyramid = require('./TilePyramid'); // Private Methods


var requestVisibleTiles = function requestVisibleTiles(layer) {
  // get visible coords
  var coords = layer.plot.getTargetVisibleCoords(); // request tiles

  layer.requestTiles(coords);
};
/**
 * Class representing a tile-based layer.
 */


var TileLayer =
/*#__PURE__*/
function (_Layer) {
  _inherits(TileLayer, _Layer);

  /**
   * Instantiates a new TileLayer object.
   *
   * @param {Object} options - The layer options.
   * @param {number} options.opacity - The layer opacity.
   * @param {number} options.zIndex - The layer z-index.
   * @param {boolean} options.hidden - Whether or not the layer is visible.
   * @param {boolean} options.muted - Whether or not the layer is muted.
   * @param {number} options.cacheSize - The size of the temporary tile cache.
   * @param {number} options.numPersistentLevels - The number of persistent levels in the tile pyramid.
   */
  function TileLayer() {
    var _this;

    var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

    _classCallCheck(this, TileLayer);

    _this = _possibleConstructorReturn(this, _getPrototypeOf(TileLayer).call(this, options));
    _this.muted = defaultTo(options.muted, false);
    _this.pyramid = new TilePyramid(_assertThisInitialized(_assertThisInitialized(_this)), options);
    return _this;
  }
  /**
   * Executed when the layer is attached to a plot.
   *
   * @param {Plot} plot - The plot to attach the layer to.
   *
   * @returns {TileLayer} The layer object, for chaining.
   */


  _createClass(TileLayer, [{
    key: "onAdd",
    value: function onAdd(plot) {
      _get(_getPrototypeOf(TileLayer.prototype), "onAdd", this).call(this, plot); // request tiles if not muted


      if (!this.isMuted()) {
        requestVisibleTiles(this);
      }

      return this;
    }
    /**
     * Executed when the layer is removed from a plot.
     *
     * @param {Plot} plot - The plot to remove the layer from.
     *
     * @returns {TileLayer} The layer object, for chaining.
     */

  }, {
    key: "onRemove",
    value: function onRemove(plot) {
      // clear the underlying pyramid
      this.pyramid.clear();

      _get(_getPrototypeOf(TileLayer.prototype), "onRemove", this).call(this, plot);

      return this;
    }
    /**
     * Returns the tile pyramid of the layer.
     *
     * @returns {TilePyramid} The tile pyramid object.
     */

  }, {
    key: "getPyramid",
    value: function getPyramid() {
      return this.pyramid;
    }
    /**
     * Make the layer invisible.
     *
     * @returns {TileLayer} The layer object, for chaining.
     */

  }, {
    key: "hide",
    value: function hide() {
      _get(_getPrototypeOf(TileLayer.prototype), "hide", this).call(this);

      return this;
    }
    /**
     * Mutes the layer, it will no longer send any tile requests.
     *
     * @returns {TileLayer} The layer object, for chaining.
     */

  }, {
    key: "mute",
    value: function mute() {
      this.muted = true;
      return this;
    }
    /**
     * Unmutes the layer and immediately requests all visible tiles.
     *
     * @returns {TileLayer} The layer object, for chaining.
     */

  }, {
    key: "unmute",
    value: function unmute() {
      if (this.isMuted()) {
        this.muted = false;

        if (this.plot) {
          // request visible tiles
          requestVisibleTiles(this);
        }
      }

      return this;
    }
    /**
     * Returns true if the layer is muted.
     *
     * @returns {boolean} Whether or not the layer is muted.
     */

  }, {
    key: "isMuted",
    value: function isMuted() {
      return this.muted;
    }
    /**
     * Unmutes and shows the layer.
     *
     * @returns {TileLayer} The layer object, for chaining.
     */

  }, {
    key: "enable",
    value: function enable() {
      this.show();
      this.unmute();
      return this;
    }
    /**
     * Mutes and hides the layer.
     *
     * @returns {TileLayer} The layer object, for chaining.
     */

  }, {
    key: "disable",
    value: function disable() {
      this.hide();
      this.mute();
      return this;
    }
    /**
     * Returns true if the layer is disabled (muted and hidden).
     *
     * @returns {boolean} Whether or not the layer is disabled.
     */

  }, {
    key: "isDisabled",
    value: function isDisabled() {
      return this.isMuted() && this.isHidden();
    }
    /**
     * Clears any persisted state in the layer and refreshes the underlying
     * data. This involves emptying the tile pyramid and re-requesting all the
     * tiles.
     *
     * @returns {TileLayer} The layer object, for chaining.
     */

    /**
     * Clears any persisted state in the layer and refreshes the underlying
     * data.
     */

  }, {
    key: "refresh",
    value: function refresh() {
      // clear the underlying pyramid
      this.pyramid.clear(); // request if attached and not muted

      if (this.plot && !this.isMuted()) {
        // request visible tiles
        requestVisibleTiles(this);
      }

      _get(_getPrototypeOf(TileLayer.prototype), "refresh", this).call(this);

      return this;
    }
    /**
     * Request a specific tile.
     *
     * @param {TileCoord} coord - The coord of the tile to request.
     * @param {Function} done - The callback function to execute upon completion.
     */

  }, {
    key: "requestTile",
    value: function requestTile(coord, done) {
      done(null, null);
    }
    /**
     * Request an array of tiles.
     *
     * @param {Array} coords - The coords of the tiles to request.
     *
     * @returns {TileLayer} The layer object, for chaining.
     */

  }, {
    key: "requestTiles",
    value: function requestTiles(coords) {
      if (this.isMuted()) {
        return this;
      }

      this.pyramid.requestTiles(coords);
      return this;
    }
  }]);

  return TileLayer;
}(Layer);

module.exports = TileLayer;
'use strict';
/**
 * Class representing a partial tile.
 */

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

var TilePartial =
/*#__PURE__*/
function () {
  /**
   * Instantiates a new TilePartial object.
   *
   * A TilePartial is used to render at least a portion of a missing tile at
   * the closest available level-of-detail. There are three cases of
   * instantiation.
   *
   * A) Closest available level-of-detail is an ancestor tile.
   *    - The "target" tile is completely covered by a portion of the "found"
   *      tile.
   *    - There is no positional offset nor scaling of the "found" tile, it
   *      will cover the "target" tile in its entirely.
   *    - There is a uv offset to render the relevant portion of the "found"
   *      tile.
   *
   * B) Closest available level-of-detail is a descendant tile.
   *    - The "target" tile is partially covered by the "found" tile.
   *    - There is a positional offset and scale of the "found" tile relative
   *      to the "target" tile.
   *    - There is no uv offset, the "found" tile is rendered in its entirety.
   *
   * C) Closest available level-of-detail is an ancestor of the "target", but
   *    is used to cover a missing descendant. This occurs when one or more
   *    descendant tiles cover a portion of the "target" tile, but an ancestor
   *    is required to fill in a missing descendant.
   *    - The "target" tile is partially covered by the "found" tile.
   *    - There is a positional offset and scale of the "found" tile relative
   *      to the descendant the tile is covering.
   *    - There is a uv offset to render the relevant portion of the "found"
   *      tile which covers the descendant.
   *
   * @param {Coord} target - The coordinate of the tile that is being substituted.
   * @param {Tile} tile - The tile data of the partial found.
   * @param {Coord} relative - The coordinate of the tile to position the found tile relative to.
   */
  function TilePartial(target, tile, relative) {
    _classCallCheck(this, TilePartial);

    this.target = target;
    this.tile = tile;
    this.relative = relative;
  }
  /**
   * Instantiate a TilePartial object from the tile itself.
   *
   * @param {Tile} tile - The tile data of the partial.
   *
   * @returns {TilePartial} The TilePartial object.
   */


  _createClass(TilePartial, null, [{
    key: "fromTile",
    value: function fromTile(tile) {
      return new TilePartial(tile, tile, null);
    }
    /**
     * Instantiate a TilePartial object from an ancestor.
     *
     * @param {Coord} target - The coordinate of the tile that is being substituted.
     * @param {Tile} tile - The tile ancestor data of the partial.
     * @param {Coord} relative - The coordinate of the tile to position the found tile relative to.
     *
     * @returns {TilePartial} The TilePartial object.
     */

  }, {
    key: "fromAncestor",
    value: function fromAncestor(target, tile, relative) {
      return new TilePartial(target, tile, relative);
    }
    /**
     * Instantiate a TilePartial object from a descendant.
     *
     * @param {Coord} target - The coordinate of the tile that is being substituted.
     * @param {Tile} tile - The tile ancestor data of the partial.
     *
     * @returns {TilePartial} The TilePartial object.
     */

  }, {
    key: "fromDescendant",
    value: function fromDescendant(target, tile) {
      return new TilePartial(target, tile, null);
    }
  }]);

  return TilePartial;
}();

module.exports = TilePartial;
'use strict';

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

var defaultTo = require('lodash/defaultTo');

var throttle = require('lodash/throttle');

var EventType = require('../../event/EventType');

var TileEvent = require('../../event/TileEvent');

var LRUCache = require('../../util/LRUCache');

var Tile = require('./Tile');

var TilePartial = require('./TilePartial'); // Constants

/**
 * number of the tiles held in the pyramid.
 * @private
 * @constant {number}
 */


var CACHE_SIZE = 256;
/**
 * number of persistent zoom levels held in the pyramids.
 * @private
 * @constant {number}
 */

var PERSISTANT_LEVELS = 4;
/**
 * Loaded event throttle in milliseconds.
 * @private
 * @constant {number}
 */

var LOADED_THROTTLE_MS = 200;
/**
 * The maximum distance to traverse when checking for tile descendants.
 * @private
 * @constant {number}
 */

var MAX_DESCENDENT_DIST = 4; // Private Methods

var add = function add(pyramid, tile) {
  if (tile.coord.z < pyramid.numPersistentLevels) {
    // persistent tiles
    if (pyramid.persistents.has(tile.coord.hash)) {
      throw "Tile of coord ".concat(tile.coord.hash, " already exists in the pyramid");
    }

    pyramid.persistents.set(tile.coord.hash, tile);
  } else {
    // non-persistent tiles
    if (pyramid.tiles.has(tile.coord.hash)) {
      throw "Tile of coord ".concat(tile.coord.hash, " already exists in the pyramid");
    }

    pyramid.tiles.set(tile.coord.hash, tile);
  } // store in level arrays


  if (!pyramid.levels.has(tile.coord.z)) {
    pyramid.levels.set(tile.coord.z, []);
  }

  pyramid.levels.get(tile.coord.z).push(tile); // emit add

  pyramid.layer.emit(EventType.TILE_ADD, new TileEvent(pyramid.layer, tile));
};

var remove = function remove(pyramid, tile) {
  // only check for persistent since we it will already be removed from lru
  // cache
  if (tile.coord.z < pyramid.numPersistentLevels) {
    if (!pyramid.persistents.has(tile.coord.hash)) {
      throw "Tile of coord ".concat(tile.coord.hash, " does not exists in the pyramid");
    }

    pyramid.persistents.delete(tile.coord.hash);
  } // remove from levels


  var level = pyramid.levels.get(tile.coord.z);
  level.splice(level.indexOf(tile), 1);

  if (level.length === 0) {
    pyramid.levels.delete(tile.coord.z);
  } // emit remove


  pyramid.layer.emit(EventType.TILE_REMOVE, new TileEvent(pyramid.layer, tile));
};

var sumPowerOfFour = function sumPowerOfFour(n) {
  return 1 / 3 * (Math.pow(4, n) - 1);
};

var checkIfLoaded = function checkIfLoaded(pyramid) {
  // if no more pending tiles, emit load
  if (pyramid.pending.size === 0) {
    pyramid.emitLoad(new TileEvent(pyramid.layer, null));
  }
};

var sortAroundCenter = function sortAroundCenter(plot, pairs) {
  // get the plot center position
  var center = plot.getTargetViewportCenter(); // sort the requests by distance from center tile

  pairs.sort(function (a, b) {
    var aCenter = a.coord.getCenter();
    var bCenter = b.coord.getCenter();
    var dax = center.x - aCenter.x;
    var day = center.y - aCenter.y;
    var dbx = center.x - bCenter.x;
    var dby = center.y - bCenter.y;
    var da = dax * dax + day * day;
    var db = dbx * dbx + dby * dby;
    return da - db;
  });
  return pairs;
};

var removeDuplicates = function removeDuplicates(pairs) {
  var seen = new Map();
  return pairs.filter(function (pair) {
    var hash = pair.ncoord.hash;
    return seen.has(hash) ? false : seen.set(hash, true);
  });
};

var removePendingOrExisting = function removePendingOrExisting(pyramid, pairs) {
  return pairs.filter(function (pair) {
    // we already have the tile, or it's currently pending
    // NOTE: use `get` here to update the recentness of the tile in LRU
    return !pyramid.get(pair.ncoord) && !pyramid.isPending(pair.ncoord);
  });
};

var flagTileAsStale = function flagTileAsStale(pyramid, tile) {
  var hash = tile.coord.hash;
  var uids = pyramid.stale.get(hash);

  if (!uids) {
    uids = new Map();
    pyramid.stale.set(hash, uids);
  }

  uids.set(tile.uid, true);
};

var isTileStale = function isTileStale(pyramid, tile) {
  var hash = tile.coord.hash; // check if uid is flagged as stale

  var uids = pyramid.stale.get(hash);

  if (uids && uids.has(tile.uid)) {
    // tile is stale
    uids.delete(tile.uid);

    if (uids.size === 0) {
      pyramid.stale.delete(hash);
    }

    return true;
  }

  return false;
};

var shouldDiscard = function shouldDiscard(pyramid, tile) {
  var plot = pyramid.layer.plot;

  if (!plot) {
    // layer has been removed from plot, discard tile
    // NOTE: this should _NEVER_ happen, since when a layer is remove from
    // the plot, the pending tiles are all flagged as stale.
    return true;
  } // check if tile is in view, if not, discard


  var viewport = plot.getTargetViewport();
  return !viewport.isInView(tile.coord, plot.wraparound);
};
/**
 * Class representing a pyramid of tiles.
 */


var TilePyramid =
/*#__PURE__*/
function () {
  /**
   * Instantiates a new TilePyramid object.
   *
   * @param {Layer} layer - The layer object.
   * @param {Object} options - The pyramid options.
   * @param {number} options.cacheSize - The size of the tile cache.
   * @param {number} options.numPersistentLevels - The number of persistent levels in the pyramid.
   */
  function TilePyramid(layer) {
    var _this = this;

    var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

    _classCallCheck(this, TilePyramid);

    if (!layer) {
      throw 'No layer parameter provided';
    }

    this.cacheSize = defaultTo(options.cacheSize, CACHE_SIZE);
    this.numPersistentLevels = defaultTo(options.numPersistentLevels, PERSISTANT_LEVELS);
    this.layer = layer;
    this.levels = new Map();
    this.persistents = new Map();
    this.pending = new Map();
    this.stale = new Map();
    this.tiles = new LRUCache({
      capacity: this.cacheSize,
      onRemove: function onRemove(tile) {
        remove(_this, tile);
      }
    }); // create throttled emit load event for this layer

    this.emitLoad = throttle(function (event) {
      _this.layer.emit(EventType.LOAD, event);
    }, LOADED_THROTTLE_MS);
  }
  /**
   * Returns the total capacity of the tile pyramid.
   *
   * @returns {number} The total capacity of the pyramid.
   */


  _createClass(TilePyramid, [{
    key: "getCapacity",
    value: function getCapacity() {
      return this.cacheSize + sumPowerOfFour(this.numPersistentLevels);
    }
    /**
     * Empties the current pyramid of all tiles, flags any pending tiles as
     * stale.
     */

  }, {
    key: "clear",
    value: function clear() {
      var _this2 = this;

      // any pending tiles are now flagged as stale
      this.pending.forEach(function (tile) {
        // flag uid as stale
        flagTileAsStale(_this2, tile);
      });
      this.pending = new Map(); // fresh map
      // clear persistent tiles

      this.persistents.forEach(function (tile) {
        remove(_this2, tile);
      });
      this.persistents.clear(); // clear lru cache

      this.tiles.clear();
    }
    /**
     * Test whether or not a coord is held in cache in the pyramid.
     *
     * @param {TileCoord} ncoord - The normalized coord to test.
     *
     * @returns {boolean} Whether or not the coord exists in the pyramid.
     */

  }, {
    key: "has",
    value: function has(ncoord) {
      if (ncoord.z < this.numPersistentLevels) {
        return this.persistents.has(ncoord.hash);
      }

      return this.tiles.has(ncoord.hash);
    }
    /**
     * Iterates over and executes the provided function for all tiles.
     *
     * @param {Function} fn - The function to execute on each tile.
     */

  }, {
    key: "forEach",
    value: function forEach(fn) {
      this.persistents.forEach(fn);
      this.tiles.forEach(fn);
    }
    /**
     * Test whether or not a coord is currently pending.
     *
     * @param {TileCoord} ncoord - The normalized coord to test.
     *
     * @returns {boolean} Whether or not the coord is currently pending.
     */

  }, {
    key: "isPending",
    value: function isPending(ncoord) {
      return this.pending.has(ncoord.hash);
    }
    /**
     * Returns the tile matching the provided coord. If the tile does not
     * exist, returns undefined.
     *
     * @param {TileCoord} ncoord - The normalized coord of the tile to return.
     *
     * @returns {Tile} The tile object.
     */

  }, {
    key: "get",
    value: function get(ncoord) {
      if (ncoord.z < this.numPersistentLevels) {
        return this.persistents.get(ncoord.hash);
      }

      return this.tiles.get(ncoord.hash);
    }
    /**
     * Returns the ancestor tile of the coord at the provided offset. If no
     * tile exists in the pyramid, returns undefined.
     *
     * @param {TileCoord} ncoord - The normalized coord of the tile.
     * @param {number} dist - The offset from the tile.
     *
     * @returns {Tile} The ancestor tile of the provided coord.
     */

  }, {
    key: "getAncestor",
    value: function getAncestor(ncoord, dist) {
      var ancestor = ncoord.getAncestor(dist);
      return this.get(ancestor);
    }
    /**
     * Returns the descendant tiles of the coord at the provided offset. If at
     * least one tile exists in the pyramid, an array of size 4^dist will be
     * returned. Each element will either be a tile (in the case that it exists)
     * or a coord (in the case that it does not exist). If no descendant tiles
     * are found in the pyramid, returns undefined.
     *
     * @param {TileCoord} ncoord - The normalized coord of the tile.
     * @param {number} dist - The offset from the tile.
     *
     * @returns {Array} The descendant tiles and or coordinates of the provided coord.
     */

  }, {
    key: "getDescendants",
    value: function getDescendants(ncoord, dist) {
      // get coord descendants
      var descendants = ncoord.getDescendants(dist); // check if we have any

      var found = false;

      for (var i = 0; i < descendants.length; i++) {
        if (this.has(descendants[i])) {
          found = true;
          break;
        }
      } // if so return what we have


      if (found) {
        var res = new Array(descendants.length);

        for (var _i = 0; _i < descendants.length; _i++) {
          var descendant = descendants[_i]; // add tile if it exists, coord if it doesn't

          res[_i] = this.get(descendant) || descendant;
        }

        return res;
      }

      return undefined;
    }
    /**
     * Requests tiles for the provided coords. If the tiles already exist
     * in the pyramid or is currently pending no request is made.
     *
     * @param {Array} coords - The array of coords to request.
     */

  }, {
    key: "requestTiles",
    value: function requestTiles(coords) {
      var _this3 = this;

      // we need both the normalized an un-normalized coords.
      // normalized coords are used for requests while un-normalized are used
      // to sort them around the viewport center
      var pairs = coords.map(function (coord) {
        return {
          coord: coord,
          ncoord: coord.normalize()
        };
      }); // remove any duplicates

      pairs = removeDuplicates(pairs); // remove any tiles we already have or that are currently pending

      pairs = removePendingOrExisting(this, pairs); // sort coords by distance from viewport center

      pairs = sortAroundCenter(this.layer.plot, pairs); // generate tiles and flag as pending
      // NOTE: we flag them all now incase a `clear` is called inside the
      // `requestTile` call.

      var tiles = pairs.map(function (pair) {
        var tile = new Tile(pair.ncoord); // add tile to pending array

        _this3.pending.set(tile.coord.hash, tile);

        return tile;
      }); // request the tiles

      var _loop = function _loop(i) {
        var tile = tiles[i]; // emit request

        _this3.layer.emit(EventType.TILE_REQUEST, new TileEvent(_this3.layer, tile)); // request tile


        _this3.layer.requestTile(tile.coord, function (err, data) {
          // check if stale, clears stale status
          var isStale = isTileStale(_this3, tile); // if not stale remove tile from pending

          if (!isStale) {
            _this3.pending.delete(tile.coord.hash);
          } // check err


          if (err !== null) {
            // add err
            tile.err = err; // emit failure

            _this3.layer.emit(EventType.TILE_FAILURE, new TileEvent(_this3.layer, tile)); // if not stale, check if loaded


            if (!isStale) {
              checkIfLoaded(_this3);
            }

            return;
          } // add data to the tile


          tile.data = data; // check if tile should be discarded

          if (isStale || shouldDiscard(_this3, tile)) {
            // emit discard
            _this3.layer.emit(EventType.TILE_DISCARD, new TileEvent(_this3.layer, tile)); // if not stale, check if loaded


            if (!isStale) {
              checkIfLoaded(_this3);
            }

            return;
          } // add to tile pyramid


          add(_this3, tile); // check if loaded

          checkIfLoaded(_this3); // flag as dirty

          _this3.layer.plot.setDirty();
        });
      };

      for (var i = 0; i < tiles.length; i++) {
        _loop(i);
      }
    }
    /**
     * If the tile exists in the pyramid, return it. Otherwise return the
     * closest available level-of-detail for tile, this may be a single ancestor
     * or multiple descendants, or a combination of both.
     *
     * If no ancestor or descendants exist, return undefined.
     *
     * @param {TileCoord} ncoord - The normalized coord of the tile.
     *
     * @returns {Array} The array of tile partials that closest match the provided coord.
     */

  }, {
    key: "getAvailableLOD",
    value: function getAvailableLOD(ncoord) {
      // check if we have the tile
      var tile = this.get(ncoord);

      if (tile) {
        // if exists, return it
        return [TilePartial.fromTile(tile)];
      } // if not, find the closest available level-of-detail
      // first, get the available levels of detail, ascending in distance
      // from the original coord zoom


      var zoom = ncoord.z;
      var levels = [];
      this.levels.forEach(function (_, key) {
        if (key !== zoom) {
          levels.push(key);
        }
      });
      levels.sort(function (a, b) {
        // give priority to ancestor levels since they are cheaper
        var da = a > zoom ? a - zoom : zoom - a - 0.5;
        var db = b > zoom ? b - zoom : zoom - b - 0.5;
        return da - db;
      });
      var results = [];
      var queue = [];
      var current = ncoord;
      var level = levels.shift(); // second, iterate through available levels searching for the closest
      // level-of-detail for the current head of the queue

      while (current !== undefined && level !== undefined) {
        if (level < current.z) {
          // try to find ancestor
          var dist = current.z - level;
          var ancestor = this.getAncestor(current, dist);

          if (ancestor) {
            // tile found, create a tile partial from the ancestor
            results.push(TilePartial.fromAncestor(ncoord, // target
            ancestor, // tile
            current)); // relative
            // pop next coord to search off the queue

            current = queue.shift();
            continue;
          }
        } else {
          // descendant checks are much more expensive, so limit this
          // based on distance to the original coord zoom
          // NOTE: this distance calculation is safe because it is always
          // true that "current.z >= zoom" because only descendant coords
          // are appended to the queue.
          // therefore in the case that "level >= current.z", then
          // "level >= zoom" must be true as well.
          var ndist = level - zoom;

          if (ndist < MAX_DESCENDENT_DIST) {
            // try to find descendant
            var _dist = level - current.z;

            var descendants = this.getDescendants(current, _dist);

            if (descendants) {
              for (var j = 0; j < descendants.length; j++) {
                var descendant = descendants[j];

                if (descendant.coord) {
                  // tile found,  create a tile partial from the
                  // descendant
                  results.push(TilePartial.fromDescendant(ncoord, // target
                  descendant)); // tile
                } else {
                  // no tile found, descendant is a coord
                  queue.push(descendant);
                }

                continue;
              }

              current = queue.shift();
            }
          }
        } // nothing found in level, we can safely remove it from the search


        level = levels.shift();
      }

      return results.length > 0 ? results : undefined;
    }
  }]);

  return TilePyramid;
}();

module.exports = TilePyramid;
'use strict';
/**
 * Class representing an animation.
 */

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

var Animation =
/*#__PURE__*/
function () {
  /**
   * Instantiates a new Animation object.
   *
   * @param {Object} params - The parameters of the animation.
   * @param {number} params.plot - The plot target of the animation.
   * @param {number} params.duration - The duration of the animation.
   */
  function Animation(params) {
    _classCallCheck(this, Animation);

    this.timestamp = Date.now();
    this.duration = params.duration;
    this.plot = params.plot;
  }
  /**
   * Returns the t-value of the animation based on the provided timestamp.
   *
   * @param {number} timestamp - The frame timestamp.
   *
   * @returns {number} The t-value for the corresponding timestamp.
   */


  _createClass(Animation, [{
    key: "getT",
    value: function getT(timestamp) {
      if (this.duration > 0) {
        return Math.min(1.0, (timestamp - this.timestamp) / this.duration);
      }

      return 1.0;
    }
    /**
     * Updates the the plot based on the current state of the
     * animation.
     *
     * @param {number} timestamp - The frame timestamp.
     *
     * @returns {boolean} Whether or not the animation has finished.
     */

    /* eslint-disable no-unused-vars */

  }, {
    key: "update",
    value: function update(timestamp) {
      return true;
    }
    /**
     * Cancel the animation and remove it from the plot.
     */

  }, {
    key: "cancel",
    value: function cancel() {}
    /**
     * Complete the animation and remove it from the plot.
     */

  }, {
    key: "finish",
    value: function finish() {}
  }]);

  return Animation;
}();

module.exports = Animation;
'use strict';

function _typeof(obj) { if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

function _possibleConstructorReturn(self, call) { if (call && (_typeof(call) === "object" || typeof call === "function")) { return call; } return _assertThisInitialized(self); }

function _assertThisInitialized(self) { if (self === void 0) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return self; }

function _getPrototypeOf(o) { _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf : function _getPrototypeOf(o) { return o.__proto__ || Object.getPrototypeOf(o); }; return _getPrototypeOf(o); }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function"); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, writable: true, configurable: true } }); if (superClass) _setPrototypeOf(subClass, superClass); }

function _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf || function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }

var EventType = require('../../event/EventType');

var Event = require('../../event/Event');

var Animation = require('./Animation');
/**
 * Class representing a pan animation.
 */


var PanAnimation =
/*#__PURE__*/
function (_Animation) {
  _inherits(PanAnimation, _Animation);

  /**
   * Instantiates a new PanAnimation object.
   *
   * @param {Object} params - The parameters of the animation.
   * @param {number} params.plot - The plot target of the animation.
   * @param {number} params.duration - The duration of the animation.
   * @param {number} params.start - The start timestamp of the animation.
   * @param {number} params.delta - The positional delta of the animation.
   * @param {number} params.easing - The easing factor of the animation.
   */
  function PanAnimation() {
    var _this;

    var params = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

    _classCallCheck(this, PanAnimation);

    _this = _possibleConstructorReturn(this, _getPrototypeOf(PanAnimation).call(this, params));
    _this.start = params.start;
    _this.delta = params.delta;
    _this.end = {
      x: _this.start.x + _this.delta.x,
      y: _this.start.y + _this.delta.y
    };
    _this.easing = params.easing;
    return _this;
  }
  /**
   * Updates the position of the plot based on the current state of the
   * animation.
   *
   * @param {number} timestamp - The frame timestamp.
   *
   * @returns {boolean} Whether or not the animation has finished.
   */


  _createClass(PanAnimation, [{
    key: "update",
    value: function update(timestamp) {
      var t = this.getT(timestamp); // calculate the progress of the animation

      var progress = 1 - Math.pow(1 - t, 1 / this.easing); // caclulate the current position along the pan

      var plot = this.plot; // set the viewport positions

      plot.viewport.x = this.start.x + this.delta.x * progress;
      plot.viewport.y = this.start.y + this.delta.y * progress; // create pan event

      var event = new Event(plot); // check if animation is finished

      if (t < 1) {
        plot.emit(EventType.PAN, event);
        return false;
      }

      plot.emit(EventType.PAN_END, event);
      return true;
    }
    /**
     * Cancels the current animation and removes it from the plot.
     */

  }, {
    key: "cancel",
    value: function cancel() {
      var plot = this.plot; // emit pan end

      plot.emit(EventType.PAN_END, new Event(plot));
    }
    /**
     * Complete the current animation and remove it from the plot.
     */

  }, {
    key: "finish",
    value: function finish() {
      var plot = this.plot; // set the viewport positions

      plot.viewport.x = this.end.x;
      plot.viewport.y = this.end.y; // emit pan end

      plot.emit(EventType.PAN_END, new Event(plot));
    }
  }]);

  return PanAnimation;
}(Animation);

module.exports = PanAnimation;
'use strict';

function _typeof(obj) { if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

function _possibleConstructorReturn(self, call) { if (call && (_typeof(call) === "object" || typeof call === "function")) { return call; } return _assertThisInitialized(self); }

function _assertThisInitialized(self) { if (self === void 0) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return self; }

function _getPrototypeOf(o) { _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf : function _getPrototypeOf(o) { return o.__proto__ || Object.getPrototypeOf(o); }; return _getPrototypeOf(o); }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function"); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, writable: true, configurable: true } }); if (superClass) _setPrototypeOf(subClass, superClass); }

function _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf || function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }

var EventType = require('../../event/EventType');

var Event = require('../../event/Event');

var Animation = require('./Animation');
/**
 * Class representing a zoom animation.
 */


var ZoomAnimation =
/*#__PURE__*/
function (_Animation) {
  _inherits(ZoomAnimation, _Animation);

  /**
   * Instantiates a new ZoomAnimation object.
   *
   * @param {Object} params - The parameters of the animation.
   * @param {number} params.plot - The plot target of the animation.
   * @param {number} params.duration - The duration of the animation.
   * @param {number} params.prevZoom - The starting zoom of the animation.
   * @param {number} params.targetZoom - The target zoom of the animation.
   * @param {number} params.prevViewport - The starting viewport of the animation.
   * @param {number} params.targetViewport - The target viewport of the animation.
   * @param {number} params.targetPos - The target position of the animation, in plot coordinates.
   */
  function ZoomAnimation() {
    var _this;

    var params = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

    _classCallCheck(this, ZoomAnimation);

    _this = _possibleConstructorReturn(this, _getPrototypeOf(ZoomAnimation).call(this, params));
    _this.prevZoom = params.prevZoom;
    _this.targetZoom = params.targetZoom;
    _this.prevViewport = params.prevViewport;
    _this.targetViewport = params.targetViewport;
    _this.targetPos = params.targetPos;
    return _this;
  }
  /**
   * Updates the zoom of the plot based on the current state of the
   * animation.
   *
   * @param {number} timestamp - The frame timestamp.
   *
   * @returns {boolean} Whether or not the animation has finished.
   */


  _createClass(ZoomAnimation, [{
    key: "update",
    value: function update(timestamp) {
      var t = this.getT(timestamp); // calc new zoom

      var range = this.targetZoom - this.prevZoom;
      var zoom = this.prevZoom + range * t;
      var plot = this.plot; // set new zoom

      plot.zoom = zoom; // calc new viewport position from prev

      plot.viewport = this.prevViewport.zoomToPos(this.prevZoom, plot.zoom, this.targetPos); // create zoom event

      var event = new Event(plot); // check if animation is finished

      if (t < 1) {
        plot.emit(EventType.ZOOM, event);
        return false;
      }

      plot.emit(EventType.ZOOM_END, event);
      return true;
    }
    /**
     * Cancels the current animation and removes it from the plot.
     */

  }, {
    key: "cancel",
    value: function cancel() {
      var plot = this.plot;

      if (!plot.continuousZoom) {
        // round to the closest zoom
        plot.zoom = Math.round(plot.zoom); // calc viewport position from prev

        plot.viewport = this.prevViewport.zoomToPos(this.prevZoom, plot.zoom, this.targetPos);
      } // emit zoom end


      var event = new Event(plot);
      plot.emit(EventType.ZOOM_END, event);
    }
    /**
     * Complete the current animation and remove it from the plot.
     */

  }, {
    key: "finish",
    value: function finish() {
      var plot = this.plot;
      plot.zoom = this.targetZoom;
      plot.viewport = this.targetViewport; // emit zoom end

      var event = new Event(plot);
      plot.emit(EventType.ZOOM_END, event);
    }
  }]);

  return ZoomAnimation;
}(Animation);

module.exports = ZoomAnimation;
'use strict';

function _typeof(obj) { if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

function _possibleConstructorReturn(self, call) { if (call && (_typeof(call) === "object" || typeof call === "function")) { return call; } return _assertThisInitialized(self); }

function _assertThisInitialized(self) { if (self === void 0) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return self; }

function _get(target, property, receiver) { if (typeof Reflect !== "undefined" && Reflect.get) { _get = Reflect.get; } else { _get = function _get(target, property, receiver) { var base = _superPropBase(target, property); if (!base) return; var desc = Object.getOwnPropertyDescriptor(base, property); if (desc.get) { return desc.get.call(receiver); } return desc.value; }; } return _get(target, property, receiver || target); }

function _superPropBase(object, property) { while (!Object.prototype.hasOwnProperty.call(object, property)) { object = _getPrototypeOf(object); if (object === null) break; } return object; }

function _getPrototypeOf(o) { _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf : function _getPrototypeOf(o) { return o.__proto__ || Object.getPrototypeOf(o); }; return _getPrototypeOf(o); }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function"); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, writable: true, configurable: true } }); if (superClass) _setPrototypeOf(subClass, superClass); }

function _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf || function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }

var EventType = require('../../event/EventType');

var MouseEvent = require('../../event/MouseEvent');

var DOMHandler = require('./DOMHandler'); // Constants

/**
 * Distance in pixels the mouse can be moved before the click event is
 * cancelled.
 * @private
 * @constant {number}
 */


var MOVE_TOLERANCE = 15; // Private Methods

var createEvent = function createEvent(handler, plot, event) {
  return new MouseEvent(plot, // target
  event, // originalEvent
  handler.mouseToPlot(event), // pos
  handler.mouseToViewPx(event)); // px
};
/**
 * Class representing a click handler.
 * @private
 */


var ClickHandler =
/*#__PURE__*/
function (_DOMHandler) {
  _inherits(ClickHandler, _DOMHandler);

  /**
   * Instantiates a new ClickHandler object.
   *
   * @param {Plot} plot - The plot to attach the handler to.
   */
  function ClickHandler(plot) {
    _classCallCheck(this, ClickHandler);

    return _possibleConstructorReturn(this, _getPrototypeOf(ClickHandler).call(this, plot));
  }
  /**
   * Enables the handler.
   *
   * @returns {ClickHandler} The handler object, for chaining.
   */


  _createClass(ClickHandler, [{
    key: "enable",
    value: function enable() {
      var _this = this;

      if (this.enabled) {
        return this;
      }

      var plot = this.plot;
      var last = null;

      this.mousedown = function (event) {
        last = _this.mouseToViewPx(event);
      };

      this.mouseup = function (event) {
        if (!last) {
          return;
        }

        var pos = _this.mouseToViewPx(event);

        var diff = {
          x: last.x - pos.x,
          y: last.y - pos.y
        };
        var distSqrd = diff.x * diff.x + diff.y * diff.y;

        if (distSqrd < MOVE_TOLERANCE * MOVE_TOLERANCE) {
          // movement was within tolerance, emit click
          plot.setDirty();
          event.preventDefault();

          _this.plot.emit(EventType.CLICK, createEvent(_this, plot, event));
        }

        last = null;
      };

      this.dblclick = function (event) {
        plot.setDirty();
        event.preventDefault();

        _this.plot.emit(EventType.DBL_CLICK, createEvent(_this, plot, event));
      };

      var container = plot.getContainer();
      container.addEventListener('mousedown', this.mousedown);
      container.addEventListener('mouseup', this.mouseup);
      container.addEventListener('dblclick', this.dblclick);
      return _get(_getPrototypeOf(ClickHandler.prototype), "enable", this).call(this);
    }
    /**
     * Disables the handler.
     *
     * @returns {ClickHandler} The handler object, for chaining.
     */

  }, {
    key: "disable",
    value: function disable() {
      if (!this.enabled) {
        return this;
      }

      var container = this.plot.getContainer();
      container.removeEventListener('mousedown', this.mousedown);
      container.removeEventListener('mouseup', this.mouseup);
      container.removeEventListener('dblclick', this.dblclick);
      this.mousedown = null;
      this.mouseup = null;
      this.dblclick = null;
      return _get(_getPrototypeOf(ClickHandler.prototype), "disable", this).call(this);
    }
  }]);

  return ClickHandler;
}(DOMHandler);

module.exports = ClickHandler;
'use strict';
/**
 * Class representing a DOM handler.
 * @private
 */

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

var DOMHandler =
/*#__PURE__*/
function () {
  /**
   * Instantiates a new DOM object.
   *
   * @param {Plot} plot - The plot to attach the handler to.
   */
  function DOMHandler(plot) {
    _classCallCheck(this, DOMHandler);

    this.plot = plot;
    this.enabled = false;
  }
  /**
   * Enables the handler.
   *
   * @returns {DOMHandler} The handler object, for chaining.
   */


  _createClass(DOMHandler, [{
    key: "enable",
    value: function enable() {
      this.enabled = true;
      return this;
    }
    /**
     * Disables the handler.
     *
     * @returns {DOMHandler} The handler object, for chaining.
     */

  }, {
    key: "disable",
    value: function disable() {
      this.enabled = false;
      return this;
    }
    /**
     * Takes a DOM event and returns the corresponding plot position.
     * Coordinate [0, 0] is bottom-left of the plot.
     *
     * @param {Event} event - The mouse event.
     *
     * @returns {Object} The plot position.
     */

  }, {
    key: "mouseToPlot",
    value: function mouseToPlot(event) {
      return this.plot.mouseToPlotCoord(event);
    }
    /**
     * Takes a DOM event and returns the corresponding viewport pixel position.
     * Coordinate [0, 0] is bottom-left of the viewport.
     *
     * @param {Event} event - The mouse event.
     *
     * @returns {Object} The viewport pixel coordinate.
     */

  }, {
    key: "mouseToViewPx",
    value: function mouseToViewPx(event) {
      return this.plot.mouseToViewportPixel(event);
    }
    /**
     * Takes a viewport pixel coordinate and returns the corresponding plot
     * position.
     * Coordinate [0, 0] is bottom-left of the plot.
     *
     * @param {Object} px - The viewport pixel coordinate.
     *
     * @returns {Object} The plot position.
     */

  }, {
    key: "viewPxToPlot",
    value: function viewPxToPlot(px) {
      return this.plot.viewportPixelToPlotCoord(px);
    }
    /**
     * Takes a plot position and returns the corresponding viewport pixel
     * coordinate.
     * Coordinate [0, 0] is bottom-left of the plot.
     *
     * @param {Object} pos - The plot position.
     *
     * @returns {Object} The viewport pixel coordinate.
     */

  }, {
    key: "plotToViewPx",
    value: function plotToViewPx(pos) {
      return this.plot.plotCoordToViewportPixel(pos);
    }
    /**
     * Takes a DOM event and returns true if the left mouse button is down.
     *
     * @param {Event} event - The mouse event.
     *
     * @returns {boolean} Whether the left mouse button is down.
     */

  }, {
    key: "isLeftButton",
    value: function isLeftButton(event) {
      return event.which ? event.which === 1 : event.button === 0;
    }
    /**
     * Takes a DOM event and returns true if the middle mouse button is down.
     *
     * @param {Event} event - The mouse event.
     *
     * @returns {boolean} Whether the middle mouse button is down.
     */

  }, {
    key: "isMiddleButton",
    value: function isMiddleButton(event) {
      return event.which ? event.which === 2 : event.button === 1;
    }
    /**
     * Takes a DOM event and returns true if the right mouse button is down.
     *
     * @param {Event} event - The mouse event.
     *
     * @returns {boolean} Whether the right mouse button is down.
     */

  }, {
    key: "isRightButton",
    value: function isRightButton(event) {
      return event.which ? event.which === 3 : event.button === 2;
    }
  }]);

  return DOMHandler;
}();

module.exports = DOMHandler;
'use strict';

function _typeof(obj) { if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

function _possibleConstructorReturn(self, call) { if (call && (_typeof(call) === "object" || typeof call === "function")) { return call; } return _assertThisInitialized(self); }

function _assertThisInitialized(self) { if (self === void 0) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return self; }

function _get(target, property, receiver) { if (typeof Reflect !== "undefined" && Reflect.get) { _get = Reflect.get; } else { _get = function _get(target, property, receiver) { var base = _superPropBase(target, property); if (!base) return; var desc = Object.getOwnPropertyDescriptor(base, property); if (desc.get) { return desc.get.call(receiver); } return desc.value; }; } return _get(target, property, receiver || target); }

function _superPropBase(object, property) { while (!Object.prototype.hasOwnProperty.call(object, property)) { object = _getPrototypeOf(object); if (object === null) break; } return object; }

function _getPrototypeOf(o) { _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf : function _getPrototypeOf(o) { return o.__proto__ || Object.getPrototypeOf(o); }; return _getPrototypeOf(o); }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function"); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, writable: true, configurable: true } }); if (superClass) _setPrototypeOf(subClass, superClass); }

function _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf || function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }

var EventType = require('../../event/EventType');

var MouseEvent = require('../../event/MouseEvent');

var DOMHandler = require('./DOMHandler'); // Private Methods


var createEvent = function createEvent(handler, plot, event) {
  return new MouseEvent(plot, // target
  event, // originalEvent
  handler.mouseToPlot(event), // pos
  handler.mouseToViewPx(event)); // px
};
/**
 * Class representing a mouse handler.
 * @private
 */


var MouseHandler =
/*#__PURE__*/
function (_DOMHandler) {
  _inherits(MouseHandler, _DOMHandler);

  /**
   * Instantiates a new MouseHandler object.
   *
   * @param {Plot} plot - The plot to attach the handler to.
   */
  function MouseHandler(plot) {
    _classCallCheck(this, MouseHandler);

    return _possibleConstructorReturn(this, _getPrototypeOf(MouseHandler).call(this, plot));
  }
  /**
   * Enables the handler.
   *
   * @returns {MouseHandler} The handler object, for chaining.
   */


  _createClass(MouseHandler, [{
    key: "enable",
    value: function enable() {
      var _this = this;

      if (this.enabled) {
        return this;
      }

      var plot = this.plot;

      this.mousedown = function (event) {
        plot.setDirty();
        event.preventDefault();
        plot.emit(EventType.MOUSE_DOWN, createEvent(_this, plot, event));
      };

      this.mouseup = function (event) {
        plot.setDirty();
        event.preventDefault();
        plot.emit(EventType.MOUSE_UP, createEvent(_this, plot, event));
      };

      this.mousemove = function (event) {
        plot.setDirty();
        event.preventDefault();
        plot.emit(EventType.MOUSE_MOVE, createEvent(_this, plot, event));
      };

      this.mouseover = function (event) {
        plot.setDirty();
        event.preventDefault();
        plot.emit(EventType.MOUSE_OVER, createEvent(_this, plot, event));
      };

      this.mouseout = function (event) {
        plot.setDirty();
        event.preventDefault();
        plot.emit(EventType.MOUSE_OUT, createEvent(_this, plot, event));
      };

      this.wheel = function (event) {
        plot.setDirty();
        event.preventDefault();
      };

      var container = plot.getContainer();
      container.addEventListener('mousedown', this.mousedown);
      container.addEventListener('mouseup', this.mouseup);
      container.addEventListener('mousemove', this.mousemove);
      container.addEventListener('mouseover', this.mouseover);
      container.addEventListener('mouseout', this.mouseout);
      container.addEventListener('wheel', this.wheel);
      return _get(_getPrototypeOf(MouseHandler.prototype), "enable", this).call(this);
    }
    /**
     * Disables the handler.
     *
     * @returns {MouseHandler} The handler object, for chaining.
     */

  }, {
    key: "disable",
    value: function disable() {
      if (!this.enabled) {
        return this;
      }

      var container = this.plot.getContainer();
      container.removeEventListener('mousedown', this.mousedown);
      container.removeEventListener('mouseup', this.mouseup);
      container.removeEventListener('mousemove', this.mousemove);
      container.removeEventListener('mouseover', this.mouseover);
      container.removeEventListener('mouseout', this.mouseout);
      container.removeEventListener('wheel', this.wheel);
      this.mousedown = null;
      this.mouseup = null;
      this.mousemove = null;
      this.mouseover = null;
      this.mouseout = null;
      this.wheel = null;
      return _get(_getPrototypeOf(MouseHandler.prototype), "disable", this).call(this);
    }
  }]);

  return MouseHandler;
}(DOMHandler);

module.exports = MouseHandler;
'use strict';

function _typeof(obj) { if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

function _possibleConstructorReturn(self, call) { if (call && (_typeof(call) === "object" || typeof call === "function")) { return call; } return _assertThisInitialized(self); }

function _assertThisInitialized(self) { if (self === void 0) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return self; }

function _get(target, property, receiver) { if (typeof Reflect !== "undefined" && Reflect.get) { _get = Reflect.get; } else { _get = function _get(target, property, receiver) { var base = _superPropBase(target, property); if (!base) return; var desc = Object.getOwnPropertyDescriptor(base, property); if (desc.get) { return desc.get.call(receiver); } return desc.value; }; } return _get(target, property, receiver || target); }

function _superPropBase(object, property) { while (!Object.prototype.hasOwnProperty.call(object, property)) { object = _getPrototypeOf(object); if (object === null) break; } return object; }

function _getPrototypeOf(o) { _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf : function _getPrototypeOf(o) { return o.__proto__ || Object.getPrototypeOf(o); }; return _getPrototypeOf(o); }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function"); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, writable: true, configurable: true } }); if (superClass) _setPrototypeOf(subClass, superClass); }

function _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf || function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }

var defaultTo = require('lodash/defaultTo');

var PanAnimation = require('../animation/PanAnimation');

var EventType = require('../../event/EventType');

var Event = require('../../event/Event');

var DOMHandler = require('./DOMHandler'); // Constants

/**
 * Time in milliseconds before a pan point expires.
 * @private
 * @constant {number}
 */


var PAN_EXPIRY_MS = 50;
/**
 * Pan inertia enabled.
 * @private
 * @constant {boolean}
 */

var PAN_INTERTIA = true;
/**
 * Pan inertia easing.
 * @private
 * @constant {number}
 */

var PAN_INTERTIA_EASING = 0.2;
/**
 * Pan inertia deceleration.
 * @private
 * @constant {number}
 */

var PAN_INTERTIA_DECELERATION = 3400;
/**
 * Pan to animation duration
 * @private
 * @constant {number}
 */

var PAN_TO_DURATION = 800; // Private Methods

var pan = function pan(plot, delta) {
  if (plot.isZooming()) {
    // no panning while zooming
    return;
  } // update current viewport


  plot.viewport.x += delta.x;
  plot.viewport.y += delta.y; // request tiles

  plot.panRequest(); // emit pan

  plot.emit(EventType.PAN, new Event(plot));
};
/**
 * Class representing a pan handler.
 */


var PanHandler =
/*#__PURE__*/
function (_DOMHandler) {
  _inherits(PanHandler, _DOMHandler);

  /**
   * Instantiates a new PanHandler object.
   *
   * @param {Plot} plot - The plot to attach the handler to.
   * @param {Object} options - The parameters of the animation.
   * @param {number} options.inertia - Whether or not pan inertia is enabled.
   * @param {number} options.inertiaEasing - The inertia easing factor.
   * @param {number} options.inertiaDeceleration - The inertia deceleration factor.
   */
  function PanHandler(plot) {
    var _this;

    var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

    _classCallCheck(this, PanHandler);

    _this = _possibleConstructorReturn(this, _getPrototypeOf(PanHandler).call(this, plot));
    _this.inertia = defaultTo(options.inertia, PAN_INTERTIA);
    _this.inertiaEasing = defaultTo(options.inertiaEasing, PAN_INTERTIA_EASING);
    _this.inertiaDeceleration = defaultTo(options.inertiaDeceleration, PAN_INTERTIA_DECELERATION);
    return _this;
  }
  /**
   * Enables the handler.
   *
   * @returns {PanHandler} The handler object, for chaining.
   */


  _createClass(PanHandler, [{
    key: "enable",
    value: function enable() {
      var _this2 = this;

      if (this.enabled) {
        return this;
      }

      var plot = this.plot;
      var down = false;
      var lastPos = null;
      var lastTime = null;
      var positions = [];
      var times = [];

      this.mousedown = function (event) {
        // ignore if right-button
        if (!_this2.isLeftButton(event)) {
          return;
        } // flag as down


        down = true; // set position and timestamp

        lastPos = _this2.mouseToViewPx(event);
        lastTime = Date.now();

        if (_this2.inertia) {
          // clear existing pan animation
          plot.panAnimation = null; // reset position and time arrays

          positions = [];
          times = [];
        }
      };

      this.mousemove = function (event) {
        if (down) {
          // get latest position and timestamp
          var pos = _this2.mouseToViewPx(event);

          var time = Date.now();

          if (positions.length === 0) {
            // emit pan start
            plot.emit(EventType.PAN_START, new Event(plot));
          }

          if (_this2.inertia) {
            // add to position and time arrays
            positions.push(pos);
            times.push(time); // prevent array from getting too big

            if (time - times[0] > PAN_EXPIRY_MS) {
              positions.shift();
              times.shift();
            }
          } // calculate the positional delta


          var delta = {
            x: lastPos.x - pos.x,
            y: lastPos.y - pos.y
          }; // pan the plot

          pan(plot, _this2.viewPxToPlot(delta)); // update last position and time

          lastTime = time;
          lastPos = pos;
        }
      };

      this.mouseup = function (event) {
        // flag as up
        down = false;

        if (plot.isZooming()) {
          // no panning while zooming
          return;
        } // ignore if right-button


        if (!_this2.isLeftButton(event)) {
          return;
        } // ignore if no drag occurred


        if (positions.length === 0) {
          return;
        }

        if (!_this2.inertia) {
          // exit early if no inertia or no movement
          plot.emit(EventType.PAN_END, new Event(plot));
          return;
        } // get timestamp


        var time = Date.now(); // strip any positions that are too old

        while (time - times[0] > PAN_EXPIRY_MS) {
          positions.shift();
          times.shift();
        }

        if (times.length < 2) {
          // exit early if no remaining valid positions
          plot.emit(EventType.PAN_END, new Event(plot));
          return;
        } // shorthand


        var deceleration = _this2.inertiaDeceleration;
        var easing = _this2.inertiaEasing; // calculate direction from earliest to latest

        var direction = {
          x: lastPos.x - positions[0].x,
          y: lastPos.y - positions[0].y
        }; // calculate the time difference

        var diff = (lastTime - times[0] || 1) / 1000; // ms to s
        // calculate velocity

        var velocity = {
          x: direction.x * (easing / diff),
          y: direction.y * (easing / diff)
        }; // calculate speed

        var speed = Math.sqrt(velocity.x * velocity.x + velocity.y * velocity.y); // calculate panning duration

        var duration = speed / (deceleration * easing); // calculate inertia delta

        var delta = {
          x: Math.round(velocity.x * (-duration / 2)),
          y: Math.round(velocity.y * (-duration / 2))
        }; // set pan animation

        plot.panAnimation = new PanAnimation({
          plot: plot,
          start: plot.getViewportPosition(),
          delta: _this2.viewPxToPlot(delta),
          easing: easing,
          duration: duration * 1000 // s to ms

        });
      };

      var container = plot.getContainer();
      container.addEventListener('mousedown', this.mousedown);
      document.addEventListener('mousemove', this.mousemove);
      document.addEventListener('mouseup', this.mouseup);
      return _get(_getPrototypeOf(PanHandler.prototype), "enable", this).call(this);
    }
    /**
     * Disables the handler.
     *
     * @returns {PanHandler} The handler object, for chaining.
     */

  }, {
    key: "disable",
    value: function disable() {
      if (!this.enabled) {
        return this;
      }

      var container = this.plot.getContainer();
      container.removeEventListener('mousedown', this.mousedown);
      document.removeEventListener('mousemove', this.mousemove);
      document.removeEventListener('mouseup', this.mouseup);
      this.mousedown = null;
      this.mousemove = null;
      this.mouseup = null;
      return _get(_getPrototypeOf(PanHandler.prototype), "disable", this).call(this);
    }
    /**
     * Pans to the target plot coordinate.
     *
     * @param {number} pos - The target plot position.
     * @param {boolean} animate - Whether or not to animate the pan. Defaults to `true`.
     */

  }, {
    key: "panTo",
    value: function panTo(pos) {
      var animate = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : true;
      var plot = this.plot;
      var center = plot.getViewportCenter();
      var delta = {
        x: pos.x - center.x,
        y: pos.y - center.y
      };

      if (!animate) {
        // do not animate
        plot.emit(EventType.PAN_START, new Event(plot));
        pan(plot, delta);
        plot.emit(EventType.PAN_END, new Event(plot));
      } else {
        // animate pan
        plot.emit(EventType.PAN_START, new Event(plot));
        plot.panAnimation = new PanAnimation({
          plot: plot,
          start: plot.getViewportPosition(),
          delta: delta,
          easing: this.inertiaEasing,
          duration: PAN_TO_DURATION
        });
      }
    }
  }]);

  return PanHandler;
}(DOMHandler);

module.exports = PanHandler;
'use strict';

function _typeof(obj) { if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

function _possibleConstructorReturn(self, call) { if (call && (_typeof(call) === "object" || typeof call === "function")) { return call; } return _assertThisInitialized(self); }

function _assertThisInitialized(self) { if (self === void 0) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return self; }

function _get(target, property, receiver) { if (typeof Reflect !== "undefined" && Reflect.get) { _get = Reflect.get; } else { _get = function _get(target, property, receiver) { var base = _superPropBase(target, property); if (!base) return; var desc = Object.getOwnPropertyDescriptor(base, property); if (desc.get) { return desc.get.call(receiver); } return desc.value; }; } return _get(target, property, receiver || target); }

function _superPropBase(object, property) { while (!Object.prototype.hasOwnProperty.call(object, property)) { object = _getPrototypeOf(object); if (object === null) break; } return object; }

function _getPrototypeOf(o) { _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf : function _getPrototypeOf(o) { return o.__proto__ || Object.getPrototypeOf(o); }; return _getPrototypeOf(o); }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function"); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, writable: true, configurable: true } }); if (superClass) _setPrototypeOf(subClass, superClass); }

function _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf || function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }

var clamp = require('lodash/clamp');

var defaultTo = require('lodash/defaultTo');

var Browser = require('../../util/Browser');

var EventType = require('../../event/EventType');

var Event = require('../../event/Event');

var ZoomAnimation = require('../animation/ZoomAnimation');

var Viewport = require('../Viewport');

var DOMHandler = require('./DOMHandler'); // Constants

/**
 * Amount of scroll pixels per zoom level.
 * @private
 * @constant {number}
 */


var ZOOM_WHEEL_DELTA = 300;
/**
 * Length of zoom animation in milliseconds.
 * @private
 * @constant {number}
 */

var ZOOM_ANIMATION_MS = 250;
/**
 * Maximum concurrent discrete zooms in a single batch.
 * @private
 * @constant {number}
 */

var MAX_CONCURRENT_ZOOMS = 4;
/**
 * Zoom debounce delay in miliseconds.
 * @private
 * @constant {number}
 */

var ZOOM_DEBOUNCE_MS = 100;
/**
 * Continuous zoom enabled.
 * @private
 * @constant {boolean}
 */

var CONTINUOUS_ZOOM = false; // Private Methods

var last = Date.now();

var skipInterpolation = function skipInterpolation(animation, delta) {
  // NOTE: attempt to determine if the scroll device is a mouse or a
  // trackpad. Mouse scrolling creates large infrequent deltas while
  // trackpads create tons of very small deltas. We want to interpolate
  // between wheel events, but not between trackpad events.
  var now = Date.now();
  var tdelta = now - last;
  last = now;

  if (delta % 4.000244140625 === 0) {
    // definitely a wheel, interpolate
    return false;
  }

  if (Math.abs(delta) < 4) {
    // definitely track pad, do not interpolate
    return true;
  }

  if (animation && animation.duration !== 0) {
    // current animation has interpolation, should probably interpolate
    // the next animation too.
    // NOTE: without this, rapid wheel scrolling will trigger the skip
    // below
    return false;
  }

  if (tdelta < 40) {
    // events are close enough together that we should probably
    // not interpolate
    return true;
  }

  return false;
};

var computeZoomDelta = function computeZoomDelta(wheelDelta, continuousZoom, deltaPerZoom, maxZooms) {
  var zoomDelta = wheelDelta / deltaPerZoom;

  if (!continuousZoom) {
    // snap value if not continuous zoom
    if (wheelDelta > 0) {
      zoomDelta = Math.ceil(zoomDelta);
    } else {
      zoomDelta = Math.floor(zoomDelta);
    }
  } // clamp zoom delta to max concurrent zooms


  return clamp(zoomDelta, -maxZooms, maxZooms);
};

var computeTargetZoom = function computeTargetZoom(zoomDelta, currentZoom, currentAnimation, minZoom, maxZoom) {
  var targetZoom;

  if (currentAnimation) {
    // append to existing animation target
    targetZoom = currentAnimation.targetZoom + zoomDelta;
  } else {
    targetZoom = currentZoom + zoomDelta;
  } // clamp the target zoom to min and max zoom level of plot


  return clamp(targetZoom, minZoom, maxZoom);
};

var zoom = function zoom(plot, targetPos, zoomDelta, duration) {
  var relative = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : true;
  // calculate target zoom level
  var targetZoom = computeTargetZoom(zoomDelta, plot.zoom, plot.zoomAnimation, plot.minZoom, plot.maxZoom); // set target viewport

  var targetViewport = plot.viewport.zoomToPos(plot.zoom, targetZoom, targetPos, relative); // get previous targets

  var prevTargetZoom = plot.getTargetZoom();
  var prevTargetViewport = plot.getTargetViewport(); // only process zoom if it is required

  if (targetZoom !== prevTargetZoom || targetViewport.x !== prevTargetViewport.x || targetViewport.y !== prevTargetViewport.y) {
    // clear pan animation
    plot.panAnimation = null; // if there is a duration

    if (duration > 0) {
      // set zoom animation
      plot.zoomAnimation = new ZoomAnimation({
        plot: plot,
        duration: duration,
        prevZoom: plot.zoom,
        targetZoom: targetZoom,
        prevViewport: new Viewport(plot.viewport.x, plot.viewport.y, plot.viewport.width, plot.viewport.height),
        targetViewport: targetViewport,
        targetPos: targetPos
      });
    } // emit zoom start


    plot.emit(EventType.ZOOM_START, new Event(plot)); // if there isn't a duration

    if (duration === 0) {
      // immediately update plot
      plot.zoom = targetZoom;
      plot.viewport = targetViewport; // emit zoom end

      plot.emit(EventType.ZOOM_END, new Event(plot));
    } // request tiles


    plot.zoomRequest();
  }
};

var zoomFromWheel = function zoomFromWheel(handler, plot, targetPos, wheelDelta, continuousZoom) {
  // no wheel delta, exit early
  if (wheelDelta === 0) {
    return;
  } // calculate zoom delta from wheel delta


  var zoomDelta = computeZoomDelta(wheelDelta, continuousZoom, handler.deltaPerZoom, handler.maxConcurrentZooms); // get duration

  var duration = handler.zoomDuration;

  if (continuousZoom && skipInterpolation(plot.zoomAnimation, wheelDelta)) {
    // skip animation interpolation
    duration = 0;
  } // process the zoom


  zoom(plot, targetPos, zoomDelta, duration);
};

var getWheelDelta = function getWheelDelta(plot, event) {
  if (event.deltaMode === 0) {
    // pixels
    if (Browser.firefox) {
      return -event.deltaY / plot.pixelRatio;
    }

    return -event.deltaY;
  } else if (event.deltaMode === 1) {
    // lines
    return -event.deltaY * 20;
  } // pages


  return -event.deltaY * 60;
};
/**
 * Class representing a zoom handler.
 */


var ZoomHandler =
/*#__PURE__*/
function (_DOMHandler) {
  _inherits(ZoomHandler, _DOMHandler);

  /**
   * Instantiates a new ZoomHandler object.
   *
   * @param {Plot} plot - The plot to attach the handler to.
   * @param {Object} options - The parameters of the animation.
   * @param {number} options.continuousZoom - Whether or not continuous zoom is enabled.
   * @param {number} options.zoomDuration - The duration of the zoom animation.
   * @param {number} options.maxConcurrentZooms - The maximum concurrent zooms in a single batch.
   * @param {number} options.deltaPerZoom - The scroll delta required per zoom level.
   * @param {number} options.zoomDebounce - The debounce duration of the zoom in ms.
   */
  function ZoomHandler(plot) {
    var _this;

    var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

    _classCallCheck(this, ZoomHandler);

    _this = _possibleConstructorReturn(this, _getPrototypeOf(ZoomHandler).call(this, plot));
    _this.continuousZoom = defaultTo(options.continuousZoom, CONTINUOUS_ZOOM);
    _this.zoomDuration = defaultTo(options.zoomDuration, ZOOM_ANIMATION_MS);
    _this.maxConcurrentZooms = defaultTo(options.maxConcurrentZooms, MAX_CONCURRENT_ZOOMS);
    _this.deltaPerZoom = defaultTo(options.deltaPerZoom, ZOOM_WHEEL_DELTA);
    _this.zoomDebounce = defaultTo(options.zoomDebounce, ZOOM_DEBOUNCE_MS);
    return _this;
  }
  /**
   * Enables the handler.
   *
   * @returns {ZoomHandler} The handler object, for chaining.
   */


  _createClass(ZoomHandler, [{
    key: "enable",
    value: function enable() {
      var _this2 = this;

      if (this.enabled) {
        return this;
      }

      var plot = this.plot;
      var wheelDelta = 0;
      var timeout = null;
      var evt = null;

      this.dblclick = function (event) {
        // get mouse position
        var targetPos = _this2.mouseToPlot(event); // zoom the plot by one level


        zoom(plot, targetPos, 1, _this2.zoomDuration);
      };

      this.wheel = function (event) {
        // get normalized delta
        var delta = getWheelDelta(plot, event);

        if (!_this2.continuousZoom && Math.abs(delta) < 4) {
          // mitigate the hyper sensitivty of a trackpad
          return;
        } // increment wheel delta


        wheelDelta += delta; // check zoom type

        if (_this2.continuousZoom) {
          // get target from mouse position
          var targetPos = _this2.mouseToPlot(event); // process continuous zoom immediately


          zoomFromWheel(_this2, plot, targetPos, wheelDelta, true); // reset wheel delta

          wheelDelta = 0;
        } else {
          // set event
          evt = event; // debounce discrete zoom

          if (!timeout) {
            timeout = setTimeout(function () {
              // get target position from mouse position
              // NOTE: this is called inside the closure to ensure
              // that we use the current viewport of the plot to
              // convert from mouse to plot pixels
              var targetPos = _this2.mouseToPlot(evt); // process zoom event


              zoomFromWheel(_this2, plot, targetPos, wheelDelta, false); // reset wheel delta

              wheelDelta = 0; // clear timeout

              timeout = null; // clear event

              evt = null;
            }, _this2.zoomDebounce);
          }
        } // prevent default behavior and stop propagationa


        event.preventDefault();
        event.stopPropagation();
      };

      var container = plot.getContainer();
      container.addEventListener('dblclick', this.dblclick);
      container.addEventListener('wheel', this.wheel);
      return _get(_getPrototypeOf(ZoomHandler.prototype), "enable", this).call(this);
    }
    /**
     * Disables the handler.
     *
     * @returns {ZoomHandler} The handler object, for chaining.
     */

  }, {
    key: "disable",
    value: function disable() {
      if (!this.enabled) {
        return this;
      }

      var container = this.plot.getContainer();
      container.removeEventListener('dblclick', this.dblclick);
      container.removeEventListener('wheel', this.wheel);
      this.dblclick = null;
      this.wheel = null;
      return _get(_getPrototypeOf(ZoomHandler.prototype), "disable", this).call(this);
    }
    /**
     * Zooms in to the target zoom level. This is bounded by the plot objects
     * minZoom and maxZoom attributes.
     *
     * @param {number} level - The target zoom level.
     * @param {boolean} animate - Whether or not to animate the zoom. Defaults to `true`.
     */

  }, {
    key: "zoomTo",
    value: function zoomTo(level) {
      var animate = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : true;
      var plot = this.plot;
      var targetPos = this.plot.getViewportCenter();
      var zoomDelta = level - plot.zoom;

      if (!animate) {
        // do not animate
        zoom(plot, targetPos, zoomDelta, 0);
      } else {
        // animate
        zoom(plot, targetPos, zoomDelta, this.zoomDuration);
      }
    }
    /**
     * Zooms to the target zoom level, and centers on the target position.  The zoom is bounded by the plot objects
     * minZoom and maxZoom attributes.
     *
     * @param {number} level - The target zoom level.
     * @param {Object} targetPos - The target center position.
     * @param {boolean} animate - Whether or not to animate the zoom. Defaults to `true`.
     */

  }, {
    key: "zoomToPosition",
    value: function zoomToPosition(level, targetPos) {
      var animate = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : true;
      var plot = this.plot;
      var zoomDelta = level - plot.zoom;
      var duration = animate ? this.zoomDuration : 0;
      zoom(plot, targetPos, zoomDelta, duration, false
      /* centered on target position */
      );
    }
  }]);

  return ZoomHandler;
}(DOMHandler);

module.exports = ZoomHandler;
'use strict';

function _typeof(obj) { if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

function _possibleConstructorReturn(self, call) { if (call && (_typeof(call) === "object" || typeof call === "function")) { return call; } return _assertThisInitialized(self); }

function _assertThisInitialized(self) { if (self === void 0) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return self; }

function _getPrototypeOf(o) { _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf : function _getPrototypeOf(o) { return o.__proto__ || Object.getPrototypeOf(o); }; return _getPrototypeOf(o); }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function"); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, writable: true, configurable: true } }); if (superClass) _setPrototypeOf(subClass, superClass); }

function _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf || function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }

var Renderer = require('../Renderer');
/**
 * Class representing an overlay renderer.
 */


var OverlayRenderer =
/*#__PURE__*/
function (_Renderer) {
  _inherits(OverlayRenderer, _Renderer);

  /**
   * Instantiates a new OverlayRenderer object.
   */
  function OverlayRenderer() {
    var _this;

    _classCallCheck(this, OverlayRenderer);

    _this = _possibleConstructorReturn(this, _getPrototypeOf(OverlayRenderer).call(this));
    _this.overlay = null;
    return _this;
  }
  /**
   * Executed when the overlay is attached to a plot.
   *
   * @param {Overlay} overlay - The overlay to attach the renderer to.
   *
   * @returns {OverlayRenderer} The renderer object, for chaining.
   */


  _createClass(OverlayRenderer, [{
    key: "onAdd",
    value: function onAdd(overlay) {
      if (!overlay) {
        throw 'No overlay provided as argument';
      }

      this.overlay = overlay;
      return this;
    }
    /**
     * Executed when the overlay is removed from a plot.
     *
     * @param {Overlay} overlay - The overlay to remove the renderer from.
     *
     * @returns {OverlayRenderer} The renderer object, for chaining.
     */

  }, {
    key: "onRemove",
    value: function onRemove(overlay) {
      if (!overlay) {
        throw 'No overlay provided as argument';
      }

      this.overlay = null;
      return this;
    }
  }]);

  return OverlayRenderer;
}(Renderer);

module.exports = OverlayRenderer;
'use strict';

function _typeof(obj) { if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

function _possibleConstructorReturn(self, call) { if (call && (_typeof(call) === "object" || typeof call === "function")) { return call; } return _assertThisInitialized(self); }

function _assertThisInitialized(self) { if (self === void 0) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return self; }

function _get(target, property, receiver) { if (typeof Reflect !== "undefined" && Reflect.get) { _get = Reflect.get; } else { _get = function _get(target, property, receiver) { var base = _superPropBase(target, property); if (!base) return; var desc = Object.getOwnPropertyDescriptor(base, property); if (desc.get) { return desc.get.call(receiver); } return desc.value; }; } return _get(target, property, receiver || target); }

function _superPropBase(object, property) { while (!Object.prototype.hasOwnProperty.call(object, property)) { object = _getPrototypeOf(object); if (object === null) break; } return object; }

function _getPrototypeOf(o) { _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf : function _getPrototypeOf(o) { return o.__proto__ || Object.getPrototypeOf(o); }; return _getPrototypeOf(o); }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function"); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, writable: true, configurable: true } }); if (superClass) _setPrototypeOf(subClass, superClass); }

function _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf || function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }

var Shader = require('../../webgl/shader/Shader');

var EventType = require('../../event/EventType');

var OverlayRenderer = require('./OverlayRenderer'); // Constants

/**
 * Refresh event handler symbol.
 * @private
 * @constant {Symbol}
 */


var REFRESH = Symbol();
/**
 * Class representing a webgl overlay renderer.
 */

var WebGLOverlayRenderer =
/*#__PURE__*/
function (_OverlayRenderer) {
  _inherits(WebGLOverlayRenderer, _OverlayRenderer);

  /**
   * Instantiates a new WebGLOverlayRenderer object.
   *
   * @param {Object} options - The overlay options.
   */
  function WebGLOverlayRenderer() {
    var _this;

    var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

    _classCallCheck(this, WebGLOverlayRenderer);

    _this = _possibleConstructorReturn(this, _getPrototypeOf(WebGLOverlayRenderer).call(this, options));
    _this.gl = null;
    _this[REFRESH] = null;
    return _this;
  }
  /**
   * Executed when the overlay is attached to a plot.
   *
   * @param {Layer} overlay - The overlay to attach the renderer to.
   *
   * @returns {WebGLOverlayRenderer} The renderer object, for chaining.
   */


  _createClass(WebGLOverlayRenderer, [{
    key: "onAdd",
    value: function onAdd(overlay) {
      var _this2 = this;

      _get(_getPrototypeOf(WebGLOverlayRenderer.prototype), "onAdd", this).call(this, overlay);

      this.gl = this.overlay.plot.getRenderingContext(); // create buffers

      this.refreshBuffers(); // create refresh handler

      this[REFRESH] = function () {
        _this2.refreshBuffers();
      }; // attach refresh handler


      this.overlay.on(EventType.REFRESH, this[REFRESH]);
      return this;
    }
    /**
     * Executed when the overlay is removed from a plot.
     *
     * @param {Layer} overlay - The overlay to remove the renderer from.
     *
     * @returns {WebGLOverlayRenderer} The renderer object, for chaining.
     */

  }, {
    key: "onRemove",
    value: function onRemove(overlay) {
      // remove refresh handler
      this.overlay.removeListener(EventType.REFRESH, this[REFRESH]); // destroy refresh handler

      this[REFRESH] = null;
      this.gl = null;

      _get(_getPrototypeOf(WebGLOverlayRenderer.prototype), "onRemove", this).call(this, overlay);

      return this;
    }
    /**
     * Generate any underlying buffers.
     *
     * @returns {WebGLOverlayRenderer} The overlay object, for chaining.
     */

  }, {
    key: "refreshBuffers",
    value: function refreshBuffers() {
      throw '`refreshBuffers` must be overridden';
    }
    /**
     * Instantiate and return a new Shader object using the renderers internal
     * WebGLRenderingContext.
     *
     * @param {Object} source - The shader param object.
     * @param {string} source.common - Common glsl to be shared by both vertex and fragment shaders.
     * @param {string} source.vert - The vertex shader glsl.
     * @param {string} source.frag - The fragment shader glsl.
     *
     * @returns {Shader} The shader object.
     */

  }, {
    key: "createShader",
    value: function createShader(source) {
      return new Shader(this.gl, source);
    }
    /**
     * Returns the orthographic projection matrix for the viewport.
     *
     * @returns {Float32Array} The orthographic projection matrix.
     */

  }, {
    key: "getOrthoMatrix",
    value: function getOrthoMatrix() {
      return this.overlay.plot.getOrthoMatrix();
    }
  }]);

  return WebGLOverlayRenderer;
}(OverlayRenderer);

module.exports = WebGLOverlayRenderer;
'use strict'; // Private Methods

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

var getUVOffset = function getUVOffset(ancestor, descendant) {
  var scale = 1 / Math.pow(2, descendant.z - ancestor.z);
  return [descendant.x * scale - ancestor.x, descendant.y * scale - ancestor.y, scale, scale];
};
/**
 * Class representing a tile renderable.
 */


var TileRenderable =
/*#__PURE__*/
function () {
  /**
   * Instantiates a new TileRenderable object.
   *
   * @param {Tile} tile - The tile data to be rendered.
   * @param {number} scale - The scale to render the tile at.
   * @param {Object} tileOffset - The tile pixel offset relative to the viewport.
   * @param {Array} uvOffset - The texture coordinate offset describing the portion of the tile to render.
   */
  function TileRenderable(tile, scale, tileOffset, uvOffset) {
    _classCallCheck(this, TileRenderable);

    this.tile = tile;
    this.hash = tile.coord.hash;
    this.scale = scale;
    this.tileOffset = tileOffset;
    this.uvOffset = uvOffset;
  }
  /**
   * Instantiate a TileRenderable object from a specific tile.
   *
   * @param {Tile} tile - The tile data to be rendered.
   * @param {TileCoord} coord - The unnormalized tile coordinate of the tile.
   * @param {number} scale - The scale to render the tile at.
   * @param {number} tileSize - The size of the tile in pixels.
   * @param {number} viewportOffset - The offset of the viewport in pixels.
   *
   * @returns {TileRenderable} The renderable object.
   */


  _createClass(TileRenderable, [{
    key: "toCanvas",

    /**
     * Converts the `uvOffset` and `tileOffset` parameters to the canvas
     * coordinate system, with [0, 0] being the top-left corner. The conversion
     * is done in-place.
     *
     * @param {Object} viewport - The pixel dimensions of the viewport.
     * @param {number} tileSize - The size of each tile in pixels.
     *
     * @returns {TileRenderable} The renderable object.
     */
    value: function toCanvas(viewport, tileSize) {
      // flip y component of uv offset
      var uvOffset = this.uvOffset;
      uvOffset[1] = 1 - uvOffset[2] - uvOffset[1]; // flip y component of tile offset

      var tileOffset = this.tileOffset;
      tileOffset[1] = viewport.height - tileOffset[1] - tileSize * this.scale;
      return this;
    }
  }], [{
    key: "fromTile",
    value: function fromTile(tile, coord, scale, tileSize, viewportOffset) {
      var scaledTileSize = scale * tileSize;
      var tileOffset = [coord.x * scaledTileSize - viewportOffset.x, coord.y * scaledTileSize - viewportOffset.y];
      return new TileRenderable(tile, scale, tileOffset, [0, 0, 1, 1]);
    }
    /**
     * Instantiate a TileRenderable object from an ancestor of the tile.
     *
     * @param {Tile} tile - The tile data to be rendered.
     * @param {TileCoord} coord - The unnormalized tile coordinate of the tile.
     * @param {number} scale - The scale to render the tile at.
     * @param {number} tileSize - The size of the tile in pixels.
     * @param {number} viewportOffset - The offset of the viewport in pixels.
     * @param {TileCoord} wanted - The coordinate the tile will substitue for.
     * @param {TileCoord} descendant - The direct descendant of the substituted tile.
     *
     * @returns {TileRenderable} The renderable object.
     */

  }, {
    key: "fromAncestor",
    value: function fromAncestor(tile, coord, scale, tileSize, viewportOffset, wanted, descendant) {
      var scaledTileSize = scale * tileSize;
      var tileOffset = [0, 0];

      if (descendant === wanted) {
        // if the "wanted" tile is the same as the "descendant" of this
        // ancestor, then there is no positional offset
        tileOffset[0] = coord.x * scaledTileSize - viewportOffset.x;
        tileOffset[1] = coord.y * scaledTileSize - viewportOffset.y;
      } else {
        // if the "wanted" tile is not the same as the "descendant", we need
        // to position and scale this tile relative to the descendant
        var offsetScale = 1 / Math.pow(2, descendant.z - wanted.z);
        var offsetX = descendant.x * offsetScale - wanted.x;
        var offsetY = descendant.y * offsetScale - wanted.y;
        tileOffset[0] = (coord.x + offsetX) * scaledTileSize - viewportOffset.x;
        tileOffset[1] = (coord.y + offsetY) * scaledTileSize - viewportOffset.y;
        scale *= offsetScale;
      }

      return new TileRenderable(tile, scale, tileOffset, getUVOffset(tile.coord, descendant));
    }
    /**
     * Instantiate a TileRenderable object from a descendant of the tile.
     *
     * @param {Tile} tile - The tile data to be rendered.
     * @param {TileCoord} coord - The unnormalized tile coordinate of the tile.
     * @param {number} scale - The scale to render the tile at.
     * @param {number} tileSize - The size of the tile in pixels.
     * @param {number} viewportOffset - The offset of the viewport in pixels.
     * @param {TileCoord} wanted - The coordinate the tile will substitue for.
     *
     * @returns {TileRenderable} The renderable object.
     */

  }, {
    key: "fromDescendant",
    value: function fromDescendant(tile, coord, scale, tileSize, viewportOffset, wanted) {
      var scaledTileSize = scale * tileSize;
      var offsetScale = 1 / Math.pow(2, tile.coord.z - wanted.z);
      var offsetX = tile.coord.x * offsetScale - wanted.x;
      var offsetY = tile.coord.y * offsetScale - wanted.y;
      var tileOffset = [(coord.x + offsetX) * scaledTileSize - viewportOffset.x, (coord.y + offsetY) * scaledTileSize - viewportOffset.y];
      return new TileRenderable(tile, scale * offsetScale, tileOffset, [0, 0, 1, 1]);
    }
    /**
     * Instantiate a TileRenderable object from an ancestor of the tile.
     *
     * @param {TilePartial} partial - The tile partial to be rendered.
     * @param {TileCoord} coord - The unnormalized tile coordinate of the tile.
     * @param {number} scale - The scale to render the tile at.
     * @param {number} tileSize - The size of the tile in pixels.
     * @param {number} viewportOffset - The offset of the viewport in pixels.
     *
     * @returns {TileRenderable} The renderable object.
     */

  }, {
    key: "fromAncestorPartial",
    value: function fromAncestorPartial(partial, coord, scale, tileSize, viewportOffset) {
      var tile = partial.tile; // tile we have

      var target = partial.target; // tile we wanted

      var relative = partial.relative; // where to position the tile relative to

      var scaledTileSize = scale * tileSize;
      var tileOffset = [0, 0];

      if (relative === partial.target) {
        // if the "target" tile is the same as the "relative" of this
        // ancestor, then there is no positional offset
        tileOffset[0] = coord.x * scaledTileSize - viewportOffset.x;
        tileOffset[1] = coord.y * scaledTileSize - viewportOffset.y;
      } else {
        // if the "target" tile is not the same as the "relative", we need
        // to position and scale this tile relative to the relative
        var offsetScale = 1 / Math.pow(2, relative.z - target.z);
        var offsetX = relative.x * offsetScale - target.x;
        var offsetY = relative.y * offsetScale - target.y;
        tileOffset[0] = (coord.x + offsetX) * scaledTileSize - viewportOffset.x;
        tileOffset[1] = (coord.y + offsetY) * scaledTileSize - viewportOffset.y;
        scale *= offsetScale;
      }

      return new TileRenderable(tile, scale, tileOffset, getUVOffset(tile.coord, relative));
    }
    /**
     * Instantiate a TileRenderable object from a descendant of the tile.
     *
     * @param {TilePartial} partial - The tile partial to be rendered.
     * @param {TileCoord} coord - The unnormalized tile coordinate of the tile.
     * @param {number} scale - The scale to render the tile at.
     * @param {number} tileSize - The size of the tile in pixels.
     * @param {number} viewportOffset - The offset of the viewport in pixels.
     *
     * @returns {TileRenderable} The renderable object.
     */

  }, {
    key: "fromDescendantPartial",
    value: function fromDescendantPartial(partial, coord, scale, tileSize, viewportOffset) {
      var tile = partial.tile; // tile we have

      var target = partial.target; // tile we wanted

      var scaledTileSize = scale * tileSize;
      var offsetScale = 1 / Math.pow(2, tile.coord.z - target.z);
      var offsetX = tile.coord.x * offsetScale - target.x;
      var offsetY = tile.coord.y * offsetScale - target.y;
      var tileOffset = [(coord.x + offsetX) * scaledTileSize - viewportOffset.x, (coord.y + offsetY) * scaledTileSize - viewportOffset.y];
      return new TileRenderable(tile, scale * offsetScale, tileOffset, [0, 0, 1, 1]);
    }
  }]);

  return TileRenderable;
}();

module.exports = TileRenderable;
'use strict';

function _typeof(obj) { if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

function _possibleConstructorReturn(self, call) { if (call && (_typeof(call) === "object" || typeof call === "function")) { return call; } return _assertThisInitialized(self); }

function _assertThisInitialized(self) { if (self === void 0) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return self; }

function _getPrototypeOf(o) { _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf : function _getPrototypeOf(o) { return o.__proto__ || Object.getPrototypeOf(o); }; return _getPrototypeOf(o); }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function"); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, writable: true, configurable: true } }); if (superClass) _setPrototypeOf(subClass, superClass); }

function _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf || function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }

var EventType = require('../../event/EventType');

var RTreePyramid = require('../../geometry/RTreePyramid');

var Renderer = require('../Renderer');

var TileRenderable = require('./TileRenderable'); // Constants

/**
 * Tile index handler symbol.
 * @private
 * @constant {Symbol}
 */


var TILE_INDEX = Symbol();
/**
 * Tile unindex handler symbol.
 * @private
 * @constant {Symbol}
 */

var TILE_UNINDEX = Symbol();
/**
 * Class representing a tile renderer.
 */

var TileRenderer =
/*#__PURE__*/
function (_Renderer) {
  _inherits(TileRenderer, _Renderer);

  /**
   * Instantiates a new TileRenderer object.
   */
  function TileRenderer() {
    var _this;

    _classCallCheck(this, TileRenderer);

    _this = _possibleConstructorReturn(this, _getPrototypeOf(TileRenderer).call(this));
    _this[TILE_INDEX] = new Map();
    _this[TILE_UNINDEX] = new Map();
    _this.layer = null;
    return _this;
  }
  /**
   * Executed when the layer is attached to a plot.
   *
   * @param {Layer} layer - The layer to attach the renderer to.
   *
   * @returns {TileRenderer} The renderer object, for chaining.
   */


  _createClass(TileRenderer, [{
    key: "onAdd",
    value: function onAdd(layer) {
      if (!layer) {
        throw 'No layer provided as argument';
      }

      this.layer = layer;
      return this;
    }
    /**
     * Executed when the layer is removed from a plot.
     *
     * @param {Layer} layer - The layer to remove the renderer from.
     *
     * @returns {TileRenderer} The renderer object, for chaining.
     */

  }, {
    key: "onRemove",
    value: function onRemove(layer) {
      if (!layer) {
        throw 'No layer provided as argument';
      }

      this.layer = null;
      return this;
    }
    /**
     * Creates an rtree pyramid object. Creates and attaches the necessary
     * event handlers to add and remove data from the rtree accordingly.
     *
     * @param {Object} options - The options for the r-tree pyramid.
     * @param {number} options.nodeCapacity - The node capacity of the rtree.
     * @param {Function} options.createCollidables - The function to create collidables from a tile.
     *
     * @returns {RTreePyramid} The r-tree pyramid object.
     */

  }, {
    key: "createRTreePyramid",
    value: function createRTreePyramid() {
      var _this2 = this;

      var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
      var createCollidables = options.createCollidables;

      if (!createCollidables) {
        throw '`options.createCollidables` argument is missing';
      } // create rtree pyramid


      var pyramid = new RTreePyramid({
        nodeCapacity: options.nodeCapacity
      }); // create handlers

      var index = function index(event) {
        var tile = event.tile;
        var coord = tile.coord;
        var tileSize = _this2.layer.plot.tileSize;
        var xOffset = coord.x * tileSize;
        var yOffset = coord.y * tileSize;
        var collidables = createCollidables(tile, xOffset, yOffset);
        pyramid.insert(coord, collidables);
      };

      var unindex = function unindex(event) {
        pyramid.remove(event.tile.coord);
      }; // attach handlers


      this.layer.on(EventType.TILE_ADD, index);
      this.layer.on(EventType.TILE_REMOVE, unindex); // store the handlers under the atlas

      this[TILE_INDEX].set(pyramid, index);
      this[TILE_UNINDEX].set(pyramid, unindex);
      return pyramid;
    }
    /**
     * Destroys a vertex atlas object and removes all event handlers used to add
     * and remove data from the atlas.
     *
     * @param {RTreePyramid} pyramid - The r-tree pyramid object to destroy.
     */

  }, {
    key: "destroyRTreePyramid",
    value: function destroyRTreePyramid(pyramid) {
      // detach handlers
      this.layer.removeListener(EventType.TILE_ADD, this[TILE_INDEX].get(pyramid));
      this.layer.removeListener(EventType.TILE_REMOVE, this[TILE_UNINDEX].get(pyramid)); // remove handlers

      this[TILE_INDEX].delete(pyramid);
      this[TILE_UNINDEX].delete(pyramid);
    }
    /**
     * Returns the tile renderables for the underlying layer.
     *
     * @returns {Array} The array of tile renderables.
     */

  }, {
    key: "getRenderables",
    value: function getRenderables() {
      var plot = this.layer.plot;
      var pyramid = this.layer.pyramid;
      var tileSize = plot.tileSize;
      var zoom = plot.zoom;
      var viewport = plot.getViewportPixelOffset();
      var coords = plot.getVisibleCoords();
      var renderables = [];

      for (var i = 0; i < coords.length; i++) {
        var coord = coords[i];
        var ncoord = coord.normalize(); // check if we have the tile

        var tile = pyramid.get(ncoord);

        if (tile) {
          var scale = Math.pow(2, zoom - coord.z);
          var renderable = TileRenderable.fromTile(tile, coord, scale, tileSize, viewport);
          renderables.push(renderable);
        }
      }

      return renderables;
    }
    /**
     * Returns the tile renderables for the underlying layer at the closest
     * available level-of-detail.
     *
     * @returns {Array} The array of tile renderables.
     */

  }, {
    key: "getRenderablesLOD",
    value: function getRenderablesLOD() {
      var plot = this.layer.plot;
      var pyramid = this.layer.pyramid;
      var tileSize = plot.tileSize;
      var zoom = plot.zoom;
      var viewport = plot.getViewportPixelOffset();
      var coords = plot.getVisibleCoords();
      var renderables = [];

      for (var i = 0; i < coords.length; i++) {
        var coord = coords[i];
        var ncoord = coord.normalize();
        var scale = Math.pow(2, zoom - coord.z); // check if we have any tile LOD available

        var partials = pyramid.getAvailableLOD(ncoord);

        if (partials) {
          for (var j = 0; j < partials.length; j++) {
            var partial = partials[j];
            var tile = partial.tile;
            var renderable = void 0;

            if (tile.coord.z === coord.z) {
              // exact tile
              renderable = TileRenderable.fromTile(tile, coord, scale, tileSize, viewport);
            } else if (tile.coord.z < coord.z) {
              // ancestor of the tile
              renderable = TileRenderable.fromAncestorPartial(partial, coord, scale, tileSize, viewport);
            } else {
              // descendant of the tile
              renderable = TileRenderable.fromDescendantPartial(partial, coord, scale, tileSize, viewport);
            }

            renderables.push(renderable);
          }
        }
      }

      return renderables;
    }
  }]);

  return TileRenderer;
}(Renderer);

module.exports = TileRenderer;
'use strict';

function _typeof(obj) { if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

function _possibleConstructorReturn(self, call) { if (call && (_typeof(call) === "object" || typeof call === "function")) { return call; } return _assertThisInitialized(self); }

function _assertThisInitialized(self) { if (self === void 0) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return self; }

function _get(target, property, receiver) { if (typeof Reflect !== "undefined" && Reflect.get) { _get = Reflect.get; } else { _get = function _get(target, property, receiver) { var base = _superPropBase(target, property); if (!base) return; var desc = Object.getOwnPropertyDescriptor(base, property); if (desc.get) { return desc.get.call(receiver); } return desc.value; }; } return _get(target, property, receiver || target); }

function _superPropBase(object, property) { while (!Object.prototype.hasOwnProperty.call(object, property)) { object = _getPrototypeOf(object); if (object === null) break; } return object; }

function _getPrototypeOf(o) { _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf : function _getPrototypeOf(o) { return o.__proto__ || Object.getPrototypeOf(o); }; return _getPrototypeOf(o); }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function"); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, writable: true, configurable: true } }); if (superClass) _setPrototypeOf(subClass, superClass); }

function _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf || function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }

var defaultTo = require('lodash/defaultTo');

var EventType = require('../../event/EventType');

var Shader = require('../../webgl/shader/Shader');

var TextureArray = require('../../webgl/texture/TextureArray');

var VertexAtlas = require('../../webgl/vertex/VertexAtlas');

var TileRenderer = require('./TileRenderer'); // Constants

/**
 * Tile add handler symbol.
 * @private
 * @constant {Symbol}
 */


var TILE_ADD = Symbol();
/**
 * Tile remove handler symbol.
 * @private
 * @constant {Symbol}
 */

var TILE_REMOVE = Symbol(); // Private Methods

var addTileToTextureArray = function addTileToTextureArray(array, tile) {
  array.set(tile.coord.hash, tile.data);
};

var removeTileFromTextureArray = function removeTileFromTextureArray(array, tile) {
  array.delete(tile.coord.hash);
};

var addTileToVertexAtlas = function addTileToVertexAtlas(atlas, tile) {
  atlas.set(tile.coord.hash, tile.data, tile.data.length / atlas.stride);
};

var removeTileFromVertexAtlas = function removeTileFromVertexAtlas(atlas, tile) {
  atlas.delete(tile.coord.hash);
};
/**
 * Class representing a webgl tile renderer.
 */


var WebGLTileRenderer =
/*#__PURE__*/
function (_TileRenderer) {
  _inherits(WebGLTileRenderer, _TileRenderer);

  /**
   * Instantiates a new WebGLTileRenderer object.
   */
  function WebGLTileRenderer() {
    var _this;

    _classCallCheck(this, WebGLTileRenderer);

    _this = _possibleConstructorReturn(this, _getPrototypeOf(WebGLTileRenderer).call(this));
    _this.gl = null;
    _this[TILE_ADD] = new Map();
    _this[TILE_REMOVE] = new Map();
    return _this;
  }
  /**
   * Executed when the layer is attached to a plot.
   *
   * @param {Layer} layer - The layer to attach the renderer to.
   *
   * @returns {WebGLTileRenderer} The renderer object, for chaining.
   */


  _createClass(WebGLTileRenderer, [{
    key: "onAdd",
    value: function onAdd(layer) {
      _get(_getPrototypeOf(WebGLTileRenderer.prototype), "onAdd", this).call(this, layer);

      this.gl = this.layer.plot.getRenderingContext();
      return this;
    }
    /**
     * Executed when the layer is removed from a plot.
     *
     * @param {Layer} layer - The layer to remove the renderer from.
     *
     * @returns {WebGLRenderer} The renderer object, for chaining.
     */

  }, {
    key: "onRemove",
    value: function onRemove(layer) {
      this.gl = null;

      _get(_getPrototypeOf(WebGLTileRenderer.prototype), "onRemove", this).call(this, layer);

      return this;
    }
    /**
     * Returns the orthographic projection matrix for the viewport.
     *
     * @returns {Float32Array} The orthographic projection matrix.
     */

  }, {
    key: "getOrthoMatrix",
    value: function getOrthoMatrix() {
      return this.layer.plot.getOrthoMatrix();
    }
    /**
     * Instantiate and return a new Shader object using the renderers internal
     * WebGLRenderingContext.
     *
     * @param {Object} source - The shader param object.
     * @param {string} source.common - Common glsl to be shared by both vertex and fragment shaders.
     * @param {string} source.vert - The vertex shader glsl.
     * @param {string} source.frag - The fragment shader glsl.
     *
     * @returns {Shader} The shader object.
     */

  }, {
    key: "createShader",
    value: function createShader(source) {
      return new Shader(this.gl, source);
    }
    /**
     * Creates a texture array of appropriate size for the layer pyramid using
     * the provided texture size. Creates and attaches the necessary event
     * handlers to add and remove data from the array accordingly.
     *
     * @param {Object} options - The options for the texture array.
     * @param {number} options.chunkSize - The resolution of the tile texture.
     * @param {string} options.format - The texture pixel format.
     * @param {string} options.type - The texture pixel component type.
     * @param {string} options.filter - The min / mag filter used during scaling.
     * @param {string} options.wrap - The wrapping type over both S and T dimension.
     * @param {bool} options.invertY - Whether or not invert-y is enabled.
     * @param {bool} options.premultiplyAlpha - Whether or not alpha premultiplying is enabled.
     * @param {Function} options.onAdd - The function executed when a tile is added.
     * @param {Function} options.onRemove - The function executed when a tile is removed.
     *
     * @returns {TextureArray} The texture array object.
     */

  }, {
    key: "createTextureArray",
    value: function createTextureArray() {
      var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
      // create texture array
      var array = new TextureArray(this.gl, {
        // set texture params
        format: options.format,
        type: options.type,
        filter: options.filter,
        invertY: options.invertY,
        premultiplyAlpha: options.premultiplyAlpha
      }, {
        // set num chunks to be able to fit the capacity of the pyramid
        numChunks: this.layer.pyramid.getCapacity(),
        chunkSize: options.chunkSize
      }); // create handlers

      var onAdd = defaultTo(options.onAdd, addTileToTextureArray);
      var onRemove = defaultTo(options.onRemove, removeTileFromTextureArray);

      var add = function add(event) {
        onAdd(array, event.tile);
      };

      var remove = function remove(event) {
        onRemove(array, event.tile);
      }; // attach handlers


      this.layer.on(EventType.TILE_ADD, add);
      this.layer.on(EventType.TILE_REMOVE, remove); // store the handlers under the array

      this[TILE_ADD].set(array, add);
      this[TILE_REMOVE].set(array, remove);
      return array;
    }
    /**
     * Destroys a texture array object and removes all event handlers used to
     * add and remove data from the array.
     *
     * @param {TextureArray} array - The texture array to destroy.
     */

  }, {
    key: "destroyTextureArray",
    value: function destroyTextureArray(array) {
      // detach handlers
      this.layer.removeListener(EventType.TILE_ADD, this[TILE_ADD].get(array));
      this.layer.removeListener(EventType.TILE_REMOVE, this[TILE_REMOVE].get(array)); // remove handlers

      this[TILE_ADD].delete(array);
      this[TILE_REMOVE].delete(array);
    }
    /**
     * Creates a vertex atlas of appropriate size for the layer pyramid using
     * the provided attribute pointers. Creates and attaches the necessary
     * event handlers to add and remove data from the atlas accordingly.
     *
     * @param {Object} options - The options for the vertex atlas.
     * @param {Object} options.attributePointers - The vertex attribute pointers.
     * @param {number} options.chunkSize - The size of a single chunk, in vertices.
     * @param {Function} options.onAdd - The function executed when a tile is added.
     * @param {Function} options.onRemove - The function executed when a tile is removed.
     *
     * @returns {VertexAtlas} The vertex atlas object.
     */

  }, {
    key: "createVertexAtlas",
    value: function createVertexAtlas() {
      var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
      // create vertex atlas
      var atlas = new VertexAtlas(this.gl, options.attributePointers, {
        // set num chunks to be able to fit the capacity of the pyramid
        numChunks: this.layer.pyramid.getCapacity(),
        chunkSize: options.chunkSize
      }); // create handlers

      var onAdd = defaultTo(options.onAdd, addTileToVertexAtlas);
      var onRemove = defaultTo(options.onRemove, removeTileFromVertexAtlas);

      var add = function add(event) {
        onAdd(atlas, event.tile);
      };

      var remove = function remove(event) {
        onRemove(atlas, event.tile);
      }; // attach handlers


      this.layer.on(EventType.TILE_ADD, add);
      this.layer.on(EventType.TILE_REMOVE, remove); // store the handlers under the atlas

      this[TILE_ADD].set(atlas, add);
      this[TILE_REMOVE].set(atlas, remove);
      return atlas;
    }
    /**
     * Destroys a vertex atlas object and removes all event handlers used to add
     * and remove data from the atlas.
     *
     * @param {VertexAtlas} atlas - The vertex atlas to destroy.
     */

  }, {
    key: "destroyVertexAtlas",
    value: function destroyVertexAtlas(atlas) {
      // detach handlers
      this.layer.removeListener(EventType.TILE_ADD, this[TILE_ADD].get(atlas));
      this.layer.removeListener(EventType.TILE_REMOVE, this[TILE_REMOVE].get(atlas)); // remove handlers

      this[TILE_ADD].delete(atlas);
      this[TILE_REMOVE].delete(atlas);
    }
  }]);

  return WebGLTileRenderer;
}(TileRenderer);

module.exports = WebGLTileRenderer;
'use strict';

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

var map = require('lodash/map');

var parseShader = require('./parseShader'); // Constants


var UNIFORM_FUNCTIONS = {
  'bool': 'uniform1i',
  'bool[]': 'uniform1iv',
  'float': 'uniform1f',
  'float[]': 'uniform1fv',
  'int': 'uniform1i',
  'int[]': 'uniform1iv',
  'uint': 'uniform1i',
  'uint[]': 'uniform1iv',
  'vec2': 'uniform2fv',
  'vec2[]': 'uniform2fv',
  'ivec2': 'uniform2iv',
  'ivec2[]': 'uniform2iv',
  'vec3': 'uniform3fv',
  'vec3[]': 'uniform3fv',
  'ivec3': 'uniform3iv',
  'ivec3[]': 'uniform3iv',
  'vec4': 'uniform4fv',
  'vec4[]': 'uniform4fv',
  'ivec4': 'uniform4iv',
  'ivec4[]': 'uniform4iv',
  'mat2': 'uniformMatrix2fv',
  'mat2[]': 'uniformMatrix2fv',
  'mat3': 'uniformMatrix3fv',
  'mat3[]': 'uniformMatrix3fv',
  'mat4': 'uniformMatrix4fv',
  'mat4[]': 'uniformMatrix4fv',
  'sampler2D': 'uniform1i',
  'samplerCube': 'uniform1i'
}; // Private Methods

var setAttributesAndUniforms = function setAttributesAndUniforms(shader, vertSource, fragSource) {
  // parse shader delcarations
  var declarations = parseShader([vertSource, fragSource], ['uniform', 'attribute']); // for each declaration in the shader

  declarations.forEach(function (declaration) {
    // check if its an attribute or uniform
    if (declaration.qualifier === 'attribute') {
      // if attribute, store type and index
      shader.attributes.set(declaration.name, {
        type: declaration.type,
        index: shader.attributes.size
      });
    } else {
      // if (declaration.qualifier === 'uniform') {
      // if uniform, store type and buffer function name
      var type = declaration.type + (declaration.count > 1 ? '[]' : '');
      shader.uniforms.set(declaration.name, {
        type: declaration.type,
        func: UNIFORM_FUNCTIONS[type]
      });
    }
  });
};

var formatLine = function formatLine(str, num) {
  str = str.toString();
  var diff = num - str.length;
  str += ':';

  for (var i = 0; i < diff; i++) {
    str += ' ';
  }

  return str;
};

var compileShader = function compileShader(gl, shaderSource, type) {
  var shader = gl.createShader(gl[type]);
  gl.shaderSource(shader, shaderSource);
  gl.compileShader(shader);

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    var split = shaderSource.split('\n');
    var maxDigits = split.length.toString().length + 1;
    var srcByLines = split.map(function (line, index) {
      return "".concat(formatLine(index + 1, maxDigits), " ").concat(line);
    }).join('\n');
    var shaderLog = gl.getShaderInfoLog(shader);
    throw "An error occurred compiling the shader:\n\n".concat(shaderLog.slice(0, shaderLog.length - 1), "\n").concat(srcByLines);
  }

  return shader;
};

var bindAttributeLocations = function bindAttributeLocations(shader) {
  var gl = shader.gl;
  shader.attributes.forEach(function (attribute, name) {
    // bind the attribute location
    gl.bindAttribLocation(shader.program, attribute.index, name);
  });
};

var getUniformLocations = function getUniformLocations(shader) {
  var gl = shader.gl;
  var uniforms = shader.uniforms;
  uniforms.forEach(function (uniform, name) {
    // get the uniform location
    var location = gl.getUniformLocation(shader.program, name); // check if null, parse may detect uniform that is compiled out due to
    // not being used, or due to a preprocessor evaluation.

    if (location === null) {
      uniforms.delete(name);
    } else {
      uniform.location = location;
    }
  });
};

var createDefines = function createDefines(defines) {
  return map(defines, function (value, name) {
    return "#define ".concat(name, " ").concat(value);
  }).join('\n');
};

var createProgram = function createProgram(shader, sources) {
  // Creates the shader program object from source strings. This includes:
  //	1) Compiling and linking the shader program.
  //	2) Parsing shader source for attribute and uniform information.
  //	3) Binding attribute locations, by order of delcaration.
  //	4) Querying and storing uniform location.
  var gl = shader.gl;
  var defines = createDefines(sources.define);
  var common = defines + (sources.common || '');
  var vert = common + sources.vert;
  var frag = common + sources.frag; // compile shaders

  var vertexShader = compileShader(gl, vert, 'VERTEX_SHADER');
  var fragmentShader = compileShader(gl, frag, 'FRAGMENT_SHADER'); // parse source for attribute and uniforms

  setAttributesAndUniforms(shader, vert, frag); // create the shader program

  shader.program = gl.createProgram(); // attach vertex and fragment shaders

  gl.attachShader(shader.program, vertexShader);
  gl.attachShader(shader.program, fragmentShader); // bind vertex attribute locations BEFORE linking

  bindAttributeLocations(shader); // link shader

  gl.linkProgram(shader.program); // If creating the shader program failed, alert

  if (!gl.getProgramParameter(shader.program, gl.LINK_STATUS)) {
    throw "An error occured linking the shader:\n".concat(gl.getProgramInfoLog(shader.program));
  } // get shader uniform locations


  getUniformLocations(shader);
};
/**
 * Class representing a shader program.
 */


var Shader =
/*#__PURE__*/
function () {
  /**
   * Instantiates a Shader object.
   *
   * @param {WebGLRenderingContext} gl - The WebGL context.
   * @param {Object} params - The shader params object.
   * @param {string} params.common - Common glsl to be shared by both vertex and fragment shaders.
   * @param {string} params.vert - The vertex shader glsl.
   * @param {string} params.frag - The fragment shader glsl.
   * @param {Object} params.define - Any #define directives to include in the glsl.
   */
  function Shader(gl) {
    var params = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

    _classCallCheck(this, Shader);

    // check source arguments
    if (!params.vert) {
      throw 'Vertex shader argument `vert` has not been provided';
    }

    if (!params.frag) {
      throw 'Fragment shader argument `frag` has not been provided';
    }

    this.gl = gl;
    this.program = null;
    this.attributes = new Map();
    this.uniforms = new Map(); // create the shader program

    createProgram(this, params);
  }
  /**
   * Binds the shader program for use.
   *
   * @returns {Shader} The shader object, for chaining.
   */


  _createClass(Shader, [{
    key: "use",
    value: function use() {
      // use the shader
      this.gl.useProgram(this.program);
      return this;
    }
    /**
     * Buffer a uniform value by name.
     *
     * @param {string} name - The uniform name in the shader source.
     * @param {*} value - The uniform value to buffer.
     *
     * @returns {Shader} The shader object, for chaining.
     */

  }, {
    key: "setUniform",
    value: function setUniform(name, value) {
      var uniform = this.uniforms.get(name); // ensure that the uniform params exists for the name

      if (!uniform) {
        throw "No uniform found under name `".concat(name, "`");
      } // check value


      if (value === undefined || value === null) {
        // ensure that the uniform argument is defined
        throw "Value passed for uniform `".concat(name, "` is undefined or null");
      } // set the uniform
      // NOTE: checking type by string comparison is faster than wrapping
      // the functions.


      if (uniform.type === 'mat2' || uniform.type === 'mat3' || uniform.type === 'mat4') {
        this.gl[uniform.func](uniform.location, false, value);
      } else {
        this.gl[uniform.func](uniform.location, value);
      }

      return this;
    }
  }]);

  return Shader;
}();

module.exports = Shader;
'use strict';

var preprocess = require('./preprocess'); // Constants


var COMMENTS_REGEXP = /(\/\*([\s\S]*?)\*\/)|(\/\/(.*)$)/gm;
var ENDLINE_REGEXP = /(\r\n|\n|\r)/gm;
var WHITESPACE_REGEXP = /\s{2,}/g;
var BRACKET_WHITESPACE_REGEXP = /(\s*)(\[)(\s*)(\d+)(\s*)(\])(\s*)/g;
var NAME_COUNT_REGEXP = /([a-zA-Z_][a-zA-Z0-9_]*)(?:\[(\d+)\])?/;
var PRECISION_REGEX = /\bprecision\s+\w+\s+\w+;/g;
var INLINE_PRECISION_REGEX = /\b(highp|mediump|lowp)\s+/g; // Private Methods

var stripComments = function stripComments(str) {
  // regex source: https://github.com/moagrius/stripcomments
  return str.replace(COMMENTS_REGEXP, '');
};

var stripPrecision = function stripPrecision(str) {
  return str.replace(PRECISION_REGEX, '') // remove global precision declarations
  .replace(INLINE_PRECISION_REGEX, ''); // remove inline precision declarations
};

var normalizeWhitespace = function normalizeWhitespace(str) {
  return str.replace(ENDLINE_REGEXP, ' ') // normalize line endings
  .replace(WHITESPACE_REGEXP, ' ') // normalize whitespace to single ' '
  .replace(BRACKET_WHITESPACE_REGEXP, '$2$4$6'); // remove whitespace in brackets
};

var parseNameAndCount = function parseNameAndCount(qualifier, type, entry) {
  // determine name and size of variable
  var matches = entry.match(NAME_COUNT_REGEXP);
  var name = matches[1];
  var count = matches[2] === undefined ? 1 : parseInt(matches[2], 10);
  return {
    qualifier: qualifier,
    type: type,
    name: name,
    count: count
  };
};

var parseStatement = function parseStatement(statement) {
  // split statement on commas
  //
  // ['uniform mat4 A[10]', 'B', 'C[2]']
  //
  var split = statement.split(',').map(function (elem) {
    return elem.trim();
  }); // split declaration header from statement
  //
  // ['uniform', 'mat4', 'A[10]']
  //

  var header = split.shift().split(' '); // qualifier is always first element
  //
  // 'uniform'
  //

  var qualifier = header.shift(); // type will be the second element
  //
  // 'mat4'
  //

  var type = header.shift(); // last part of header will be the first, and possible only variable name
  //
  // ['A[10]', 'B', 'C[2]']
  //

  var names = header.concat(split); // if there are other names after a ',' add them as well

  return names.map(function (name) {
    return parseNameAndCount(qualifier, type, name);
  });
};

var parseSource = function parseSource(source, keywords) {
  // splits the source string by semi-colons and constructs an array of
  // declaration objects based on the provided qualifier keywords.
  // get individual statements (any sequence ending in ;)
  var statements = source.split(';'); // build regex for parsing statements with targetted keywords

  var keywordStr = keywords.join('|');
  var keywordRegex = new RegExp('\\b(' + keywordStr + ')\\b.*'); // parse and store global precision statements and any declarations

  var matched = []; // for each statement

  statements.forEach(function (statement) {
    // check for keywords
    //
    // ['uniform float uTime']
    //
    var kmatch = statement.match(keywordRegex);

    if (kmatch) {
      // parse statement and add to array
      matched = matched.concat(parseStatement(kmatch[0]));
    }
  });
  return matched;
};

var filterDuplicatesByName = function filterDuplicatesByName(declarations) {
  // in cases where the same declarations are present in multiple
  // sources, this function will remove duplicates from the results
  var seen = {};
  return declarations.filter(function (declaration) {
    if (seen[declaration.name]) {
      return false;
    }

    seen[declaration.name] = true;
    return true;
  });
};
/**
 * Parses the provided GLSL source, and returns all declaration statements that
 * contain the provided qualifier types. This can be used to extract the
 * attributes and uniform names / types from a shader.
 * NOTE: This is run only AFTER compilation succeed, so it assumes VALID syntax.
 *
 * Ex, when provided a 'uniform' qualifier, the declaration:
 *
 *    'uniform highp vec3 uSpecularColor;'
 *
 * Would be parsed to:
 *    {
 *        qualifier: 'uniform',
 *        type: 'vec3'
 *        name: 'uSpecularColor',
 *        count: 1
 *    }
 *
 * @private
 * @param {Array} sources - The shader glsl sources.
 * @param {Array} qualifiers - The qualifiers to extract.
 *
 * @returns {Array} The array of qualifier declaration statements.
 */


module.exports = function () {
  var sources = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : [];
  var qualifiers = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : [];

  // if no sources or qualifiers are provided, return empty array
  if (sources.length === 0 || qualifiers.length === 0) {
    return [];
  }

  sources = Array.isArray(sources) ? sources : [sources];
  qualifiers = Array.isArray(qualifiers) ? qualifiers : [qualifiers]; // parse out targetted declarations

  var declarations = [];
  sources.forEach(function (source) {
    // remove comments
    source = stripComments(source); // run preprocessor

    source = preprocess(source); // remove precision statements

    source = stripPrecision(source); // finally, normalize the whitespace

    source = normalizeWhitespace(source); // parse out declarations

    declarations = declarations.concat(parseSource(source, qualifiers));
  }); // remove duplicates and return

  return filterDuplicatesByName(declarations);
};
'use strict';

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

var DEFINED = '__DEFINED__';
var DEFINE_REGEX = /#define\b/i;
var UNDEF_REGEX = /#undef\b/i;
var IF_REGEX = /#if\b/i;
var IFDEF_REGEX = /#ifdef\b/i;
var IFNDEF_REGEX = /#ifndef\b/i;
var ELSE_REGEX = /#else\b/i;
var ELIF_REGEX = /#elif\b/i;
var ENDIF_REGEX = /#endif\b/i;
var PARSE_DEFINE_REGEX = /#define\s+(\w+)(\s(\w*)?)?/i;
var PARSE_UNDEF_REGEX = /#undef\s+(\w+)/i;
var PARSE_IF_REGEX = /#if\s+\(?\s*(!?\s*\w+)\s*(==|!=|>=|<=|<|>)?\s*(\w*)\s*\)?/i;
var PARSE_IFDEF_REGEX = /#ifdef\s+(\w+)/i;
var PARSE_IFNDEF_REGEX = /#ifndef\s+(\w+)/i;
var PARSE_ELIF_REGEX = /#elif\s+\(?\s*(!?\s*\w+)\s*(==|!=|>=|<=|<|>)?\s*(\w*)\s*\)?/i;
var REMAINING_REGEX = /#([\W\w\s\d])(?:.*\\r?\n)*.*$/gm;

var evalIf = function evalIf(a, logic, b) {
  if (logic === undefined) {
    if (a[0] === '!') {
      return !(a === 'true' || a >= 1);
    }

    return a === 'true' || a >= 1;
  }

  switch (logic) {
    case '==':
      return a === b;

    case '!=':
      return a !== b;

    case '>':
      return a > b;

    case '>=':
      return a >= b;

    case '<':
      return a < b;

    case '<=':
      return a <= b;
  }

  throw "Unrecognized logical operator `".concat(logic, "`");
};

var Conditional =
/*#__PURE__*/
function () {
  function Conditional(type, conditional) {
    _classCallCheck(this, Conditional);

    this.type = type;
    this.conditional = conditional.trim();
    this.body = [];
    this.children = [];
  }

  _createClass(Conditional, [{
    key: "eval",
    value: function _eval() {
      var parsed;

      switch (this.type) {
        case 'if':
          parsed = PARSE_IF_REGEX.exec(this.conditional);
          return evalIf(parsed[1], parsed[2], parsed[3]);

        case 'ifdef':
          parsed = PARSE_IFDEF_REGEX.exec(this.conditional);
          return parsed[1] === DEFINED;

        case 'ifndef':
          parsed = PARSE_IFNDEF_REGEX.exec(this.conditional);
          return parsed[1] !== DEFINED;

        case 'elif':
          parsed = PARSE_ELIF_REGEX.exec(this.conditional);
          return evalIf(parsed[1], parsed[2], parsed[3]);
      }

      throw "Unrecognized conditional type `".concat(this.type, "`");
    }
  }]);

  return Conditional;
}();

var Block =
/*#__PURE__*/
function () {
  function Block(type, conditional, lineNum) {
    _classCallCheck(this, Block);

    this.if = new Conditional(type, conditional);
    this.elif = [];
    this.else = null;
    this.parent = null;
    this.current = this.if;
    this.startLine = lineNum;
    this.endLine = null;
  }

  _createClass(Block, [{
    key: "addElse",
    value: function addElse(conditional) {
      this.current = new Conditional('else', conditional);
      this.else = this.current;
    }
  }, {
    key: "addElif",
    value: function addElif(conditional) {
      this.current = new Conditional('elif', conditional);
      this.elif.push(this.current);
    }
  }, {
    key: "addBody",
    value: function addBody(line, lineNum) {
      this.current.body.push({
        string: line.trim(),
        line: lineNum
      });
    }
  }, {
    key: "nest",
    value: function nest(block) {
      block.parent = this;
      this.current.children.push(block);
    }
  }, {
    key: "extract",
    value: function extract() {
      // #if
      var body = [];

      if (this.if.eval()) {
        body = body.concat(this.if.body);
        this.if.children.forEach(function (child) {
          body = body.concat(child.extract());
        });
        return body;
      } // #elif


      for (var i = 0; i < this.elif.length; i++) {
        var elif = this.elif[i];

        if (elif.eval()) {
          body = body.concat(elif.body);

          for (var j = 0; j < elif.children.length; j++) {
            var child = elif.children[j];
            body = body.concat(child.extract());
          }

          return body;
        }
      } // #else


      if (this.else) {
        body = body.concat(this.else.body);
        this.else.children.forEach(function (child) {
          body = body.concat(child.extract());
        });
        return body;
      }

      return [];
    }
  }, {
    key: "eval",
    value: function _eval() {
      // ensure extract text is ordered correctly
      return this.extract().sort(function (a, b) {
        return a.line - b.line;
      }).map(function (arg) {
        return arg.string;
      }).join('\n');
    }
  }]);

  return Block;
}();

var parseLines = function parseLines(lines) {
  var blocks = [];
  var current = null;
  lines.forEach(function (line, index) {
    if (line.match(IF_REGEX)) {
      // #if
      var block = new Block('if', line, index);

      if (!current) {
        blocks.push(block);
      } else {
        current.nest(block);
      }

      current = block;
    } else if (line.match(IFDEF_REGEX)) {
      // #ifdef
      var _block = new Block('ifdef', line, index);

      if (!current) {
        blocks.push(_block);
      } else {
        current.nest(_block);
      }

      current = _block;
    } else if (line.match(IFNDEF_REGEX)) {
      // #ifndef
      var _block2 = new Block('ifndef', line, index);

      if (!current) {
        blocks.push(_block2);
      } else {
        current.nest(_block2);
      }

      current = _block2;
    } else if (line.match(ELIF_REGEX)) {
      // #elif
      if (!current) {
        throw 'Invalid preprocessor syntax, unexpected `#elif`';
      }

      current.addElif(line);
    } else if (line.match(ELSE_REGEX)) {
      // #else
      if (!current) {
        throw 'Invalid preprocessor syntax, unexpected `#else`';
      }

      current.addElse(line);
    } else if (line.match(ENDIF_REGEX)) {
      // #endif
      if (!current) {
        throw 'Invalid preprocessor syntax, unexpected `#endif`';
      }

      current.endLine = index;
      current = current.parent;
    } else {
      // other
      if (current) {
        current.addBody(line, index);
      }
    }
  });

  if (current) {
    throw 'Invalid preprocessor syntax, missing expected `#endif`';
  }

  return blocks;
};

var replaceDefines = function replaceDefines(lines) {
  var defines = new Map();
  var replaced = [];
  lines.forEach(function (line) {
    if (line.match(DEFINE_REGEX)) {
      // #define
      var parsed = PARSE_DEFINE_REGEX.exec(line);
      defines.set(parsed[1], parsed[2] || DEFINED);
    } else if (line.match(UNDEF_REGEX)) {
      // #undef
      var _parsed = PARSE_UNDEF_REGEX.exec(line);

      defines.delete(_parsed[1]);
    } else if (line.match(IFDEF_REGEX)) {
      // #ifdef
      var _parsed2 = PARSE_IFDEF_REGEX.exec(line);

      if (defines.has(_parsed2[1])) {
        line = line.replace(_parsed2[1], DEFINED);
      }

      replaced.push(line);
    } else if (line.match(IFNDEF_REGEX)) {
      // #ifndef
      var _parsed3 = PARSE_IFNDEF_REGEX.exec(line);

      if (defines.has(_parsed3[1])) {
        line = line.replace(_parsed3[1], DEFINED);
      }

      replaced.push(line);
    } else {
      // swap defines
      defines.forEach(function (val, define) {
        line = line.replace(define, val);
      });
      replaced.push(line);
    }
  });
  return replaced;
};
/**
 * Evaluates GLSL preprocessor statements.
 * NOTE: assumes comments have been stripped, and preprocessors are valid.
 *
 *     Supported:
 *
 *         #define (substitutions only)
 *         #undef
 *         #if (== and != comparisons only)
 *         #ifdef
 *         #ifndef
 *         #elif
 *         #else
 *         #endif
 *
 *     Not Supported:
 *
 *         #define (macros)
 *         #if (&& and || operators, defined() predicate)
 *         #error
 *         #pragma
 *         #extension
 *         #version
 *         #line
 *
 * @private
 * @param {string} glsl - The glsl source code.
 *
 * @returns {string} The processed glsl source code.
 */


module.exports = function (glsl) {
  // split lines
  var lines = glsl.split('\n'); // replace any defines with their values

  lines = replaceDefines(lines); // parse them

  var blocks = parseLines(lines); // remove blocks in reverse order to preserve line numbers

  for (var i = blocks.length - 1; i >= 0; i--) {
    var block = blocks[i];
    var replacement = block.eval();

    if (replacement.length > 0) {
      lines.splice(block.startLine, block.endLine - block.startLine + 1, replacement);
    } else {
      lines.splice(block.startLine, block.endLine - block.startLine + 1);
    }
  } // strip remaining unsupported preprocessor statements


  return lines.join('\n').replace(REMAINING_REGEX, '');
};
'use strict';

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

var defaultTo = require('lodash/defaultTo');
/**
 * Class representing a texture.
 */


var Texture =
/*#__PURE__*/
function () {
  /**
   * Instantiates a Texture object.
   *
   * @param {WebGLRenderingContext} gl - The WebGL context.
   * @param {ArrayBuffer|CanvasElement} src - The data to buffer.
   * @param {Object} options - The texture options.
   * @param {number} options.width - The width of the texture.
   * @param {number} options.height - The height of the texture.
   * @param {string} options.format - The texture pixel format.
   * @param {string} options.type - The texture pixel component type.
   * @param {string} options.filter - The min / mag filter used during scaling.
   * @param {string} options.wrap - The wrapping type over both S and T dimension.
   * @param {bool} options.invertY - Whether or not invert-y is enabled.
   * @param {bool} options.premultiplyAlpha - Whether or not alpha premultiplying is enabled.
   */
  function Texture(gl) {
    var src = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : null;
    var options = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};

    _classCallCheck(this, Texture);

    this.gl = gl;
    this.texture = gl.createTexture(); // set texture properties

    this.format = defaultTo(options.format, 'RGBA');
    this.type = defaultTo(options.type, 'UNSIGNED_BYTE');
    this.filter = defaultTo(options.filter, 'LINEAR');
    this.wrap = defaultTo(options.wrap, 'CLAMP_TO_EDGE');
    this.invertY = defaultTo(options.invertY, false);
    this.premultiplyAlpha = defaultTo(options.premultiplyAlpha, false); // buffer the data

    this.bufferData(src, options.width, options.height); // set parameters

    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl[this.wrap]);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl[this.wrap]);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl[this.filter]);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl[this.filter]);
  }
  /**
   * Binds the texture object to the provided texture unit location.
   *
   * @param {number} location - The texture unit location index. Optional.
   *
   * @returns {Texture} The texture object, for chaining.
   */


  _createClass(Texture, [{
    key: "bind",
    value: function bind() {
      var location = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 0;
      var gl = this.gl;
      gl.activeTexture(gl["TEXTURE".concat(location)]);
      gl.bindTexture(gl.TEXTURE_2D, this.texture);
      return this;
    }
    /**
     * Unbinds the texture object.
     *
     * @returns {Texture} The texture object, for chaining.
     */

  }, {
    key: "unbind",
    value: function unbind() {
      var gl = this.gl;
      gl.bindTexture(gl.TEXTURE_2D, null);
      return this;
    }
    /**
     * Buffer data into the texture.
     *
     * @param {Array|ArrayBufferView|null} data - The data array to buffer.
     * @param {number} width - The width of the data.
     * @param {number} height - The height of the data.
     *
     * @returns {Texture} The texture object, for chaining.
     */

  }, {
    key: "bufferData",
    value: function bufferData(data, width, height) {
      var gl = this.gl; // bind texture

      gl.bindTexture(gl.TEXTURE_2D, this.texture);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, this.invertY);
      gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, this.premultiplyAlpha); // buffer the data

      if (data && data.width && data.height) {
        // store width and height
        this.width = data.width;
        this.height = data.height; // buffer the texture

        gl.texImage2D(gl.TEXTURE_2D, 0, // mip-map level
        gl[this.format], // webgl requires format === internalFormat
        gl[this.format], gl[this.type], data);
      } else {
        // store width and height
        this.width = width || this.width;
        this.height = height || this.height; // buffer the texture data

        gl.texImage2D(gl.TEXTURE_2D, 0, // mip-map level
        gl[this.format], // webgl requires format === internalFormat
        this.width, this.height, 0, // border, must be 0
        gl[this.format], gl[this.type], data);
      }

      return this;
    }
    /**
     * Buffer partial data into the texture.
     *
     * @param {Array|ArrayBufferView|null} data - The data array to buffer.
     * @param {number} xOffset - The x offset at which to buffer.
     * @param {number} yOffset - The y offset at which to buffer.
     * @param {number} width - The width of the data.
     * @param {number} height - The height of the data.
     *
     * @returns {Texture} The texture object, for chaining.
     */

  }, {
    key: "bufferSubData",
    value: function bufferSubData(data) {
      var xOffset = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 0;
      var yOffset = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 0;
      var width = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : undefined;
      var height = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : undefined;
      var gl = this.gl; // bind texture

      gl.bindTexture(gl.TEXTURE_2D, this.texture);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, this.invertY);
      gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, this.premultiplyAlpha); // buffer the data

      if (data.width && data.height) {
        // buffer the texture
        gl.texSubImage2D(gl.TEXTURE_2D, 0, // mip-map level
        xOffset, yOffset, gl[this.format], gl[this.type], data);
      } else {
        // buffer the texture data
        gl.texSubImage2D(gl.TEXTURE_2D, 0, // mip-map level
        xOffset, yOffset, width, height, gl[this.format], gl[this.type], data);
      }

      return this;
    }
    /**
     * Resize the underlying texture. This clears the texture data.
     *
     * @param {number} width - The new width of the texture.
     * @param {number} height - The new height of the texture.
     *
     * @returns {Texture} The texture object, for chaining.
     */

  }, {
    key: "resize",
    value: function resize(width, height) {
      this.bufferData(null, width, height);
      return this;
    }
  }]);

  return Texture;
}();

module.exports = Texture;
'use strict';

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

var defaultTo = require('lodash/defaultTo'); // Private Methods


var createTexture = function createTexture(gl, format, size, type, filter, wrap, invertY, premultiplyAlpha) {
  var texture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, invertY);
  gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, premultiplyAlpha); // buffer the data

  gl.texImage2D(gl.TEXTURE_2D, 0, // mip-map level
  gl[format], // webgl requires format === internalFormat
  size, size, 0, // border, must be 0
  gl[format], gl[type], null); // set parameters

  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl[wrap]);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl[wrap]);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl[filter]);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl[filter]);
  return texture;
};
/**
 * Class representing a texture array.
 */


var TextureArray =
/*#__PURE__*/
function () {
  /**
   * Instantiates a new TextureArray object.
   *
   * NOTE: we use a texture array rather than a texture atlas because of
   * the sub-pixel bleeding that occurs in the atlas when textures are
   * not padded. Due to the overhead of padding clientside, the
   * frequency of load load events, and the average number of tiles on
   * the screen at any one time, binding individual tile textures
   * provides a less volatile frame rate compared to padding textures and
   * using an atlas.
   *
   * @param {WebGLRenderingContext} gl - The WebGL context.
   * @param {Object} params - The texture parameters.
   * @param {string} params.format - The texture pixel format.
   * @param {string} params.type - The texture pixel component type.
   * @param {string} params.filter - The min / mag filter used during scaling.
   * @param {string} params.wrap - The wrapping type over both S and T dimension.
   * @param {bool} params.invertY - Whether or not invert-y is enabled.
   * @param {bool} params.premultiplyAlpha - Whether or not alpha premultiplying is enabled.
   * @param {Object} options - The texture array options.
   * @param {number} options.chunkSize - The dimension of each texture, in pixels.
   * @param {number} options.numChunks - The size of the array, in tiles.
   */
  function TextureArray(gl) {
    var params = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
    var options = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};

    _classCallCheck(this, TextureArray);

    this.gl = gl; // set array properties

    this.chunkSize = defaultTo(options.chunkSize, 256);
    this.numChunks = defaultTo(options.numChunks, 256); // set texture parameters

    this.format = defaultTo(params.format, 'RGBA');
    this.type = defaultTo(params.type, 'UNSIGNED_BYTE');
    this.filter = defaultTo(params.filter, 'LINEAR');
    this.wrap = defaultTo(params.wrap, 'CLAMP_TO_EDGE');
    this.invertY = defaultTo(params.invertY, false);
    this.premultiplyAlpha = defaultTo(params.premultiplyAlpha, false); // create textures

    this.available = new Array(this.numChunks);

    for (var i = 0; i < this.numChunks; i++) {
      this.available[i] = {
        texture: createTexture(this.gl, this.format, this.chunkSize, this.type, this.filter, this.wrap, this.invertY, this.premultiplyAlpha)
      };
    } // create used chunk map


    this.used = new Map();
  }
  /**
   * Test whether or not a key is held in the array.
   *
   * @param {string} key - The key to test.
   *
   * @returns {boolean} Whether or not the coord exists in the pyramid.
   */


  _createClass(TextureArray, [{
    key: "has",
    value: function has(key) {
      return this.used.has(key);
    }
    /**
     * Returns the chunk matching the provided key. If the chunk does not
     * exist, returns undefined.
     *
     * @param {string} key - The key of the chunk to return.
     *
     * @returns {Object} The chunk object.
     */

  }, {
    key: "get",
    value: function get(key) {
      return this.used.get(key);
    }
    /**
     * Set the texture data for the provided key.
     *
     * @param {string} key - The key of the texture data.
     * @param {ArrayBuffer|HTMLCanvasElement|HTMLImageElement} data - The texture data.
     */

  }, {
    key: "set",
    value: function set(key, data) {
      if (this.has(key)) {
        throw "Tile of coord ".concat(key, " already exists in the array");
      }

      if (this.available.length === 0) {
        throw 'No available texture chunks in array';
      } // get an available chunk


      var chunk = this.available.pop(); // buffer the data

      var gl = this.gl;
      gl.bindTexture(gl.TEXTURE_2D, chunk.texture);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, this.invertY);
      gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, this.premultiplyAlpha);

      if (data.width && data.height) {
        // canvas type
        gl.texImage2D(gl.TEXTURE_2D, 0, // mip-map level
        gl[this.format], // webgl requires format === internalFormat
        gl[this.format], gl[this.type], data);
      } else {
        // arraybuffer type
        gl.texImage2D(gl.TEXTURE_2D, 0, // mip-map level
        gl[this.format], // webgl requires format === internalFormat
        this.chunkSize, this.chunkSize, 0, // border, must be 0
        gl[this.format], gl[this.type], data);
      } // add to used


      this.used.set(key, chunk);
    }
    /**
     * Flags the chunk matching the provided key as unused in the array.
     *
     * @param {string} key - The key of the chunk to free.
     *
     * @returns {TextureArray} The TextureArray object, for chaining.
     */

  }, {
    key: "delete",
    value: function _delete(key) {
      if (!this.has(key)) {
        throw "Tile of coord ".concat(key, " does not exist in the array");
      } // get chunk


      var chunk = this.used.get(key); // remove from used

      this.used.delete(key); // add to available

      this.available.push(chunk);
      return this;
    }
    /**
     * Binds the texture array to the provided texture unit.
     *
     * @param {string} key - The key of the chunk to bind.
     * @param {string} location - The texture unit to activate. Optional.
     *
     * @returns {TextureArray} The TextureArray object, for chaining.
     */

  }, {
    key: "bind",
    value: function bind(key) {
      var location = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 0;

      if (!this.has(key)) {
        throw "Tile of coord ".concat(key, " does not exist in the array");
      }

      var gl = this.gl;
      var chunk = this.used.get(key);
      gl.activeTexture(gl["TEXTURE".concat(location)]);
      gl.bindTexture(gl.TEXTURE_2D, chunk.texture);
      return this;
    }
    /**
     * Unbinds the texture array.
     *
     * @returns {TextureArray} The TextureArray object, for chaining.
     */

  }, {
    key: "unbind",
    value: function unbind() {
      // no-op
      return this;
    }
  }]);

  return TextureArray;
}();

module.exports = TextureArray;
'use strict';

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

var defaultTo = require('lodash/defaultTo');
/**
 * Class representing an index buffer.
 */


var IndexBuffer =
/*#__PURE__*/
function () {
  /**
   * Instantiates an IndexBuffer object.
   *
   * @param {WebGLRenderingContext} gl - The WebGL context.
   * @param {WebGLBuffer|ArrayBuffer|number} arg - The index data to buffer.
   * @param {Object} options - The rendering options.
   * @param {string} options.type - The buffer component type.
   * @param {string} options.mode - The draw mode / primitive type.
   * @param {string} options.byteOffset - The byte offset into the drawn buffer.
   * @param {string} options.count - The number of vertices to draw.
   */
  function IndexBuffer(gl, arg) {
    var options = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};

    _classCallCheck(this, IndexBuffer);

    this.gl = gl;
    this.type = defaultTo(options.type, 'UNSIGNED_SHORT');
    this.mode = defaultTo(options.mode, 'TRIANGLES');
    this.count = defaultTo(options.count, 0);
    this.byteOffset = defaultTo(options.byteOffset, 0); // create buffer

    if (arg instanceof WebGLBuffer) {
      this.buffer = arg;
    } else {
      this.buffer = gl.createBuffer();

      if (arg) {
        // buffer the data
        this.bufferData(arg);
      }
    }
  }
  /**
   * Upload index data to the GPU.
   *
   * @param {ArrayBuffer|number} arg - The array of data to buffer.
   *
   * @returns {IndexBuffer} The index buffer object, for chaining.
   */


  _createClass(IndexBuffer, [{
    key: "bufferData",
    value: function bufferData(arg) {
      var gl = this.gl;
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.buffer);
      gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, arg, gl.STATIC_DRAW);
    }
    /**
     * Upload partial index data to the GPU.
     *
     * @param {ArrayBuffer} array - The array of data to buffer.
     * @param {number} byteOffset - The byte offset at which to buffer.
     *
     * @returns {IndexBuffer} The index buffer object, for chaining.
     */

  }, {
    key: "bufferSubData",
    value: function bufferSubData(array) {
      var byteOffset = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 0;
      var gl = this.gl;
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.buffer);
      gl.bufferSubData(gl.ELEMENT_ARRAY_BUFFER, byteOffset, array);
      return this;
    }
    /**
     * Execute the draw command for the bound buffer.
     *
     * @returns {IndexBuffer} The index buffer object, for chaining.
     */

  }, {
    key: "draw",
    value: function draw() {
      var gl = this.gl;
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.buffer);
      gl.drawElements(gl[this.mode], this.count, gl[this.type], this.byteOffset); // no need to unbind

      return this;
    }
  }]);

  return IndexBuffer;
}();

module.exports = IndexBuffer;
'use strict';

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

var defaultTo = require('lodash/defaultTo');

var forIn = require('lodash/forIn'); // Constants


var BYTES_PER_TYPE = {
  BYTE: 1,
  UNSIGNED_BYTE: 1,
  SHORT: 2,
  UNSIGNED_SHORT: 2,
  FIXED: 4,
  FLOAT: 4
}; // Private Methods

var calcChunkByteSize = function calcChunkByteSize(pointers, chunkSize) {
  var byteSize = 0;
  pointers.forEach(function (pointer) {
    byteSize += BYTES_PER_TYPE[pointer.type] * pointer.size * chunkSize;
  });
  return byteSize;
};

var calcByteOffsets = function calcByteOffsets(chunk, pointers, chunkByteOffset) {
  var byteOffset = 0;
  pointers.forEach(function (pointer, location) {
    chunk.byteOffsets[location] = chunkByteOffset + byteOffset;
    byteOffset += BYTES_PER_TYPE[pointer.type] * pointer.size;
  });
};

var calcStride = function calcStride(pointers) {
  var stride = 0;
  pointers.forEach(function (pointer) {
    stride += pointer.size;
  });
  return stride;
};

var parseAttributePointers = function parseAttributePointers(pointers) {
  var attributePointers = new Map();
  var byteOffset = 0; // convert to map

  forIn(pointers, function (pointer, index) {
    attributePointers.set(index, {
      type: pointer.type,
      size: pointer.size,
      byteOffset: byteOffset,
      byteStride: 0
    });
    byteOffset += BYTES_PER_TYPE[pointer.type] * pointer.size;
  }); // add byte stride

  attributePointers.forEach(function (pointer) {
    pointer.byteStride = byteOffset;
  });
  return attributePointers;
};
/**
 * Class representing a vertex atlas.
 */


var VertexAtlas =
/*#__PURE__*/
function () {
  /**
   * Instantiates a new VertexAtlas object.
   * NOTE: Assumes interleaved vertex format.
   *
   * @param {WebGLRenderingContext} gl - The WebGL context.
   * @param {Object} pointers - The vertex attribute pointers.
   * @param {Object} options - The vertex atlas options.
   * @param {number} options.chunkSize - The size of a single chunk, in vertices.
   * @param {number} options.numChunks - The size of the atlas, in tiles.
   */
  function VertexAtlas(gl, pointers) {
    var options = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};

    _classCallCheck(this, VertexAtlas);

    // get context
    this.gl = gl; // get the extension for hardware instancing

    this.ext = gl.getExtension('ANGLE_instanced_arrays');

    if (!this.ext) {
      throw 'ANGLE_instanced_arrays WebGL extension is not supported';
    } // set atlas properties


    this.chunkSize = defaultTo(options.chunkSize, 128 * 128);
    this.numChunks = defaultTo(options.numChunks, 256); // set the pointers of the atlas

    if (!pointers) {
      throw 'No attribute pointers provided';
    }

    this.pointers = parseAttributePointers(pointers); // calc stride of the atlas

    this.stride = calcStride(this.pointers); // create available chunks

    this.available = new Array(this.numChunks); // calc the chunk byte size

    var chunkByteSize = calcChunkByteSize(this.pointers, this.chunkSize); // for each chunk

    for (var i = 0; i < this.numChunks; i++) {
      var chunkOffset = i * this.chunkSize;
      var chunkByteOffset = i * chunkByteSize;
      var available = {
        count: 0,
        chunkOffset: chunkOffset,
        chunkByteOffset: chunkByteOffset,
        byteOffsets: {}
      }; // calculate interleaved offsets / stride, this only needs
      // to be done once

      calcByteOffsets(available, this.pointers, chunkByteOffset); // add chunk

      this.available[i] = available;
    } // create used chunk map


    this.used = new Map(); // create buffer

    this.buffer = gl.createBuffer(); // calc total size of the buffer

    var byteSize = chunkByteSize * this.numChunks; // buffer the data

    gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
    gl.bufferData(gl.ARRAY_BUFFER, byteSize, gl.DYNAMIC_DRAW);
  }
  /**
   * Test whether or not a key is held in the atlas.
   *
   * @param {string} key - The key to test.
   *
   * @returns {boolean} Whether or not the coord exists in the pyramid.
   */


  _createClass(VertexAtlas, [{
    key: "has",
    value: function has(key) {
      return this.used.has(key);
    }
    /**
     * Returns the chunk matching the provided key. If the chunk does not
     * exist, returns undefined.
     *
     * @param {string} key - The key of the chunk to return.
     *
     * @returns {Object} The chunk object.
     */

  }, {
    key: "get",
    value: function get(key) {
      return this.used.get(key);
    }
    /**
     * Set the vertex data for the provided key.
     *
     * @param {string} key - The key of the vertex data.
     * @param {ArrayBuffer} data - The vertex data.
     * @param {number} count - The count of vertices added.
     */

  }, {
    key: "set",
    value: function set(key, data, count) {
      if (this.has(key)) {
        throw "Tile of coord ".concat(key, " already exists in the atlas");
      }

      if (this.available.length === 0) {
        throw 'No available vertex chunks in atlas';
      }

      if (count > this.chunkSize) {
        throw "Data count of ".concat(count, " is greater that allocated size of ").concat(this.chunkSize);
      } // get an available chunk


      var chunk = this.available.pop(); // update chunk count

      chunk.count = count; // only actually buffer the data if there is  data

      if (count > 0) {
        // buffer the data
        var gl = this.gl;
        gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
        gl.bufferSubData(gl.ARRAY_BUFFER, chunk.chunkByteOffset, data);
      } // add to used


      this.used.set(key, chunk);
    }
    /**
     * Flags the chunk matching the provided key as unused in the atlas.
     *
     * @param {string} key - The key of the chunk to free.
     *
     * @returns {VertexAtlas} The VertexAtlas object, for chaining.
     */

  }, {
    key: "delete",
    value: function _delete(key) {
      if (!this.has(key)) {
        throw "Tile of coord ".concat(key, " does not exist in the atlas");
      } // get chunk


      var chunk = this.used.get(key); // remove from used

      this.used.delete(key); // add to available

      this.available.push(chunk);
      return this;
    }
    /**
     * Binds the vertex atlas and activates the attribute arrays.
     *
     * @returns {VertexAtlas} The VertexAtlas object, for chaining.
     */

  }, {
    key: "bind",
    value: function bind() {
      var gl = this.gl; // bind the buffer

      gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer); // for each attribute pointer

      this.pointers.forEach(function (pointer, index) {
        // enable attribute index
        gl.enableVertexAttribArray(index); // set attribute pointer

        gl.vertexAttribPointer(index, pointer.size, gl[pointer.type], false, pointer.byteStride, pointer.byteOffset);
      });
      return this;
    }
    /**
     * Binds the vertex atlas and activates the attribute arrays for
     * instancing.
     *
     * @returns {VertexAtlas} The VertexAtlas object, for chaining.
     */

  }, {
    key: "bindInstanced",
    value: function bindInstanced() {
      var gl = this.gl;
      var ext = this.ext; // bind the buffer

      gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer); // for each attribute pointer

      this.pointers.forEach(function (pointer, index) {
        // enable attribute index
        gl.enableVertexAttribArray(index); // enable instancing this attribute

        ext.vertexAttribDivisorANGLE(index, 1);
      });
      return this;
    }
    /**
     * Unbinds the vertex atlas and disables the vertex arrays.
     *
     * @returns {VertexAtlas} The VertexAtlas object, for chaining.
     */

  }, {
    key: "unbind",
    value: function unbind() {
      var gl = this.gl; // for each attribute pointer

      this.pointers.forEach(function (pointer, index) {
        // disable attribute index
        gl.disableVertexAttribArray(index);
      });
      return this;
    }
    /**
     * Unbinds the vertex atlas and disables the vertex arrays for
     * instancing.
     *
     * @returns {VertexAtlas} The VertexAtlas object, for chaining.
     */

  }, {
    key: "unbindInstanced",
    value: function unbindInstanced() {
      var gl = this.gl;
      var ext = this.ext; // for each attribute pointer

      this.pointers.forEach(function (pointer, index) {
        // disable attribute index
        gl.disableVertexAttribArray(index); // disable instancing this attribute

        ext.vertexAttribDivisorANGLE(index, 0);
      });
      return this;
    }
    /**
     * Execute the draw command at the correct offset and count within the
     * atlas.
     *
     * @param {string} key - The key of the chunk to draw.
     * @param {string} mode - The primitive drawing mode to use.
     * @param {number} offset - The offset into the chunk. Optional.
     * @param {number} count - The count of primitives to render. Optional.
     *
     * @returns {VertexBuffer} The vertex buffer object, for chaining.
     */

  }, {
    key: "draw",
    value: function draw(key, mode) {
      var offset = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 0;
      var count = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : 0;

      if (!this.has(key)) {
        throw "Tile of coord ".concat(key, " does not exist in the atlas");
      }

      var gl = this.gl;
      var chunk = this.used.get(key); // only actually draw if count > 0

      if (chunk.count > 0) {
        // draw the chunk
        gl.drawArrays(gl[mode], chunk.chunkOffset + offset, count ? count : chunk.count);
      }
    }
    /**
     * Execute the instanced draw command at the correct offset and count within
     * the atlas.
     *
     * @param {string} key - The key of the chunk to draw.
     * @param {string} mode - The primitive drawing mode to use.
     * @param {number} count - The count of primitives to render. Optional.
     *
     * @returns {VertexBuffer} The vertex buffer object, for chaining.
     */

  }, {
    key: "drawInstanced",
    value: function drawInstanced(key, mode, count) {
      if (!this.has(key)) {
        throw "Tile of coord ".concat(key, " does not exist in the atlas");
      }

      var gl = this.gl;
      var ext = this.ext;
      var chunk = this.used.get(key); // for each attribute pointer

      this.pointers.forEach(function (pointer, index) {
        // set attribute pointer
        gl.vertexAttribPointer(index, pointer.size, gl[pointer.type], false, pointer.byteStride, chunk.byteOffsets[index]);
      }); // only actually draw if count > 0

      if (chunk.count > 0) {
        // draw the bound vertex array
        ext.drawArraysInstancedANGLE(gl[mode], 0, count, chunk.count);
      }
    }
  }]);

  return VertexAtlas;
}();

module.exports = VertexAtlas;
'use strict';

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

var defaultTo = require('lodash/defaultTo');

var forIn = require('lodash/forIn'); // Constants


var BYTES_PER_TYPE = {
  BYTE: 1,
  UNSIGNED_BYTE: 1,
  SHORT: 2,
  UNSIGNED_SHORT: 2,
  FIXED: 4,
  FLOAT: 4
}; // Private Methods

var getStride = function getStride(pointers) {
  // if there is only one attribute pointer assigned to this buffer,
  // there is no need for stride, set to default of 0
  if (pointers.size === 1) {
    return 0;
  }

  var maxByteOffset = 0;
  var byteSizeSum = 0;
  var byteStride = 0;
  pointers.forEach(function (pointer) {
    var byteOffset = pointer.byteOffset;
    var size = pointer.size;
    var type = pointer.type; // track the sum of each attribute size

    byteSizeSum += size * BYTES_PER_TYPE[type]; // track the largest offset to determine the byte stride of the buffer

    if (byteOffset > maxByteOffset) {
      maxByteOffset = byteOffset;
      byteStride = byteOffset + size * BYTES_PER_TYPE[type];
    }
  }); // check if the max byte offset is greater than or equal to the the sum
  // of the sizes. If so this buffer is not interleaved and does not need
  // a stride.

  if (maxByteOffset >= byteSizeSum) {
    // TODO: test what stride === 0 does for an interleaved buffer of
    // length === 1.
    return 0;
  }

  return byteStride;
};

var getAttributePointers = function getAttributePointers(attributePointers) {
  // parse pointers to ensure they are valid
  var pointers = new Map();
  forIn(attributePointers, function (pointer, key) {
    // parse index from string to int
    var index = parseInt(key, 10); // ensure byte offset exists

    pointer.byteOffset = defaultTo(pointer.byteOffset, 0); // add to map

    pointers.set(index, pointer);
  });
  return pointers;
};
/**
 * Class representing a vertex buffer.
 */


var VertexBuffer =
/*#__PURE__*/
function () {
  /**
   * Instantiates an VertexBuffer object.
   *
   * @param {WebGLRenderingContext} gl - The WebGL context.
   * @param {WebGLBuffer|ArrayBuffer|number} arg - The buffer or length of the buffer.
   * @param {Object} pointers - The array pointer map.
   * @param {Object} options - The vertex buffer options.
   * @param {string} options.mode - The draw mode / primitive type.
   * @param {string} options.indexOffset - The index offset into the drawn buffer.
   * @param {string} options.count - The number of indices to draw.
   */
  function VertexBuffer(gl, arg) {
    var pointers = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
    var options = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : {};

    _classCallCheck(this, VertexBuffer);

    this.gl = gl;
    this.mode = defaultTo(options.mode, 'TRIANGLES');
    this.count = defaultTo(options.count, 0);
    this.indexOffset = defaultTo(options.indexOffset, 0); // first, set the attribute pointers

    this.pointers = getAttributePointers(pointers); // set the byte stride

    this.byteStride = getStride(this.pointers); // create buffer

    if (arg instanceof WebGLBuffer) {
      this.buffer = arg;
    } else {
      this.buffer = gl.createBuffer();

      if (arg) {
        // buffer the data
        this.bufferData(arg);
      }
    }
  }
  /**
   * Upload vertex data to the GPU.
   *
   * @param {ArrayBuffer|number} arg - The array of data to buffer, or size of the buffer in bytes.
   *
   * @returns {VertexBuffer} The vertex buffer object, for chaining.
   */


  _createClass(VertexBuffer, [{
    key: "bufferData",
    value: function bufferData(arg) {
      var gl = this.gl;
      gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
      gl.bufferData(gl.ARRAY_BUFFER, arg, gl.STATIC_DRAW);
      return this;
    }
    /**
     * Upload partial vertex data to the GPU.
     *
     * @param {ArrayBuffer} array - The array of data to buffer.
     * @param {number} byteOffset - The byte offset at which to buffer.
     *
     * @returns {VertexBuffer} The vertex buffer object, for chaining.
     */

  }, {
    key: "bufferSubData",
    value: function bufferSubData(array) {
      var byteOffset = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 0;
      var gl = this.gl;
      gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
      gl.bufferSubData(gl.ARRAY_BUFFER, byteOffset, array);
      return this;
    }
    /**
     * Binds the vertex buffer object.
     *
     * @returns {VertexBuffer} The vertex buffer object, for chaining.
     */

  }, {
    key: "bind",
    value: function bind() {
      var _this = this;

      var gl = this.gl; // bind buffer

      gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer); // for each attribute pointer

      this.pointers.forEach(function (pointer, index) {
        // set attribute pointer
        gl.vertexAttribPointer(index, pointer.size, gl[pointer.type], false, _this.byteStride, pointer.byteOffset); // enable attribute index

        gl.enableVertexAttribArray(index);
      });
      return this;
    }
    /**
     * Unbinds the vertex buffer object.
     *
     * @returns {VertexBuffer} The vertex buffer object, for chaining.
     */

  }, {
    key: "unbind",
    value: function unbind() {
      var gl = this.gl;
      this.pointers.forEach(function (pointer, index) {
        // disable attribute index
        gl.disableVertexAttribArray(index);
      });
      return this;
    }
    /**
     * Execute the draw command for the bound buffer.
     *
     * @returns {VertexBuffer} The vertex buffer object, for chaining.
     */

  }, {
    key: "draw",
    value: function draw() {
      var gl = this.gl;
      gl.drawArrays(gl[this.mode], this.indexOffset, this.count);
      return this;
    }
  }]);

  return VertexBuffer;
}();

module.exports = VertexBuffer;
'use strict';

function _typeof(obj) { if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

function _possibleConstructorReturn(self, call) { if (call && (_typeof(call) === "object" || typeof call === "function")) { return call; } return _assertThisInitialized(self); }

function _assertThisInitialized(self) { if (self === void 0) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return self; }

function _get(target, property, receiver) { if (typeof Reflect !== "undefined" && Reflect.get) { _get = Reflect.get; } else { _get = function _get(target, property, receiver) { var base = _superPropBase(target, property); if (!base) return; var desc = Object.getOwnPropertyDescriptor(base, property); if (desc.get) { return desc.get.call(receiver); } return desc.value; }; } return _get(target, property, receiver || target); }

function _superPropBase(object, property) { while (!Object.prototype.hasOwnProperty.call(object, property)) { object = _getPrototypeOf(object); if (object === null) break; } return object; }

function _getPrototypeOf(o) { _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf : function _getPrototypeOf(o) { return o.__proto__ || Object.getPrototypeOf(o); }; return _getPrototypeOf(o); }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function"); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, writable: true, configurable: true } }); if (superClass) _setPrototypeOf(subClass, superClass); }

function _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf || function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }

var defaultTo = require('lodash/defaultTo');

var VertexBuffer = require('../../../webgl/vertex/VertexBuffer');

var WebGLOverlayRenderer = require('../WebGLOverlayRenderer'); // Constants

/**
 * Shader GLSL source.
 * @private
 * @constant {Object}
 */


var SHADER_GLSL = {
  vert: "\n\t\tprecision highp float;\n\t\tattribute vec2 aPosition;\n\t\tattribute vec2 aNormal;\n\t\tuniform vec2 uViewOffset;\n\t\tuniform float uScale;\n\t\tuniform float uLineWidth;\n\t\tuniform float uPixelRatio;\n\t\tuniform float uPointRadius;\n\t\tuniform mat4 uProjectionMatrix;\n\t\tvoid main() {\n\t\t\tvec2 wPosition = (aPosition * uScale) - uViewOffset;\n\t\t\tgl_Position = uProjectionMatrix * vec4(wPosition, 0.0, 1.0);\n\t\t\tgl_PointSize = uPointRadius * 2.0 * uPixelRatio;\n\t\t}\n\t\t",
  frag: "\n\t\t#ifdef GL_OES_standard_derivatives\n\t\t\t#extension GL_OES_standard_derivatives : enable\n\t\t#endif\n\t\tprecision highp float;\n\t\tuniform vec4 uPointColor;\n\t\tuniform float uOpacity;\n\t\tvoid main() {\n\t\t\tvec2 cxy = 2.0 * gl_PointCoord - 1.0;\n\t\t\tfloat radius = dot(cxy, cxy);\n\t\t\tfloat alpha = 1.0;\n\t\t\t#ifdef GL_OES_standard_derivatives\n\t\t\t\tfloat delta = fwidth(radius);\n\t\t\t\talpha = 1.0 - smoothstep(1.0 - delta, 1.0 + delta, radius);\n\t\t\t#else\n\t\t\t\tif (radius > 1.0) {\n\t\t\t\t\tdiscard;\n\t\t\t\t}\n\t\t\t#endif\n\t\t\tgl_FragColor = vec4(uPointColor.rgb, uPointColor.a * alpha * uOpacity);\n\t\t}\n\t\t"
}; // Private Methods

var bufferPoints = function bufferPoints(points) {
  var buffer = new Float32Array(points.length * 2);

  for (var i = 0; i < points.length; i++) {
    var point = points[i];
    buffer[i * 2] = point.x;
    buffer[i * 2 + 1] = point.y;
  }

  return buffer;
};

var createVertexBuffer = function createVertexBuffer(gl, points) {
  var data = bufferPoints(points);
  return new VertexBuffer(gl, data, {
    0: {
      size: 2,
      type: 'FLOAT'
    }
  }, {
    mode: 'POINTS',
    count: points.length
  });
};
/**
 * Class representing a webgl point overlay renderer.
 */


var PointOverlayRenderer =
/*#__PURE__*/
function (_WebGLOverlayRenderer) {
  _inherits(PointOverlayRenderer, _WebGLOverlayRenderer);

  /**
   * Instantiates a new PointOverlayRenderer object.
   *
   * @param {Object} options - The overlay options.
   * @param {Array} options.pointColor - The color of the points.
   * @param {number} options.pointRadius - The pixel radius of the points.
   */
  function PointOverlayRenderer() {
    var _this;

    var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

    _classCallCheck(this, PointOverlayRenderer);

    _this = _possibleConstructorReturn(this, _getPrototypeOf(PointOverlayRenderer).call(this, options));
    _this.pointColor = defaultTo(options.pointColor, [1.0, 0.0, 1.0, 1.0]);
    _this.pointRadius = defaultTo(options.pointRadius, 4);
    _this.shader = null;
    _this.ext = null;
    _this.points = null;
    return _this;
  }
  /**
   * Executed when the overlay is attached to a plot.
   *
   * @param {Layer} overlay - The overlay to attach the renderer to.
   *
   * @returns {PointOverlayRenderer} The renderer object, for chaining.
   */


  _createClass(PointOverlayRenderer, [{
    key: "onAdd",
    value: function onAdd(overlay) {
      _get(_getPrototypeOf(PointOverlayRenderer.prototype), "onAdd", this).call(this, overlay);

      this.ext = this.gl.getExtension('OES_standard_derivatives');
      this.shader = this.createShader(SHADER_GLSL);
      return this;
    }
    /**
     * Executed when the overlay is removed from a plot.
     *
     * @param {Layer} overlay - The overlay to remove the renderer from.
     *
     * @returns {PointOverlayRenderer} The renderer object, for chaining.
     */

  }, {
    key: "onRemove",
    value: function onRemove(overlay) {
      this.shader = null;
      this.ext = null;
      this.points = null;

      _get(_getPrototypeOf(PointOverlayRenderer.prototype), "onRemove", this).call(this, overlay);

      return this;
    }
    /**
     * Generate any underlying buffers.
     *
     * @returns {PointOverlayRenderer} The overlay object, for chaining.
     */

  }, {
    key: "refreshBuffers",
    value: function refreshBuffers() {
      // clip points to only those that are inside the cell
      var clipped = this.overlay.getClippedGeometry(); // generate the buffer

      if (clipped && clipped.length > 0) {
        this.points = createVertexBuffer(this.gl, clipped);
      } else {
        this.points = null;
      }
    }
    /**
     * The draw function that is executed per frame.
     *
     * @returns {PointOverlayRenderer} The overlay object, for chaining.
     */

  }, {
    key: "draw",
    value: function draw() {
      if (!this.points) {
        return this;
      }

      var gl = this.gl;
      var shader = this.shader;
      var points = this.points;
      var plot = this.overlay.plot;
      var cell = plot.cell;
      var proj = this.getOrthoMatrix();
      var scale = Math.pow(2, plot.zoom - cell.zoom);
      var opacity = this.overlay.opacity; // get view offset in cell space

      var offset = cell.project(plot.viewport, plot.zoom); // set blending func

      gl.enable(gl.BLEND);
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA); // bind shader

      shader.use(); // set global uniforms

      shader.setUniform('uProjectionMatrix', proj);
      shader.setUniform('uViewOffset', [offset.x, offset.y]);
      shader.setUniform('uScale', scale);
      shader.setUniform('uPointColor', this.pointColor);
      shader.setUniform('uPointRadius', this.pointRadius);
      shader.setUniform('uPixelRatio', plot.pixelRatio);
      shader.setUniform('uOpacity', opacity); // draw the points

      points.bind();
      points.draw();
      return this;
    }
  }]);

  return PointOverlayRenderer;
}(WebGLOverlayRenderer);

module.exports = PointOverlayRenderer;
'use strict';

function _typeof(obj) { if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

function _possibleConstructorReturn(self, call) { if (call && (_typeof(call) === "object" || typeof call === "function")) { return call; } return _assertThisInitialized(self); }

function _assertThisInitialized(self) { if (self === void 0) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return self; }

function _get(target, property, receiver) { if (typeof Reflect !== "undefined" && Reflect.get) { _get = Reflect.get; } else { _get = function _get(target, property, receiver) { var base = _superPropBase(target, property); if (!base) return; var desc = Object.getOwnPropertyDescriptor(base, property); if (desc.get) { return desc.get.call(receiver); } return desc.value; }; } return _get(target, property, receiver || target); }

function _superPropBase(object, property) { while (!Object.prototype.hasOwnProperty.call(object, property)) { object = _getPrototypeOf(object); if (object === null) break; } return object; }

function _getPrototypeOf(o) { _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf : function _getPrototypeOf(o) { return o.__proto__ || Object.getPrototypeOf(o); }; return _getPrototypeOf(o); }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function"); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, writable: true, configurable: true } }); if (superClass) _setPrototypeOf(subClass, superClass); }

function _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf || function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }

var earcut = require('earcut');

var defaultTo = require('lodash/defaultTo');

var VertexBuffer = require('../../../webgl/vertex/VertexBuffer');

var IndexBuffer = require('../../../webgl/vertex/IndexBuffer');

var WebGLOverlayRenderer = require('../WebGLOverlayRenderer'); // Constants

/**
 * Shader GLSL source.
 * @private
 * @constant {Object}
 */


var SHADER_GLSL = {
  vert: "\n\t\tprecision highp float;\n\t\tattribute vec2 aPosition;\n\t\tuniform vec2 uViewOffset;\n\t\tuniform float uScale;\n\t\tuniform mat4 uProjectionMatrix;\n\t\tvoid main() {\n\t\t\tvec2 wPosition = (aPosition * uScale) - uViewOffset;\n\t\t\tgl_Position = uProjectionMatrix * vec4(wPosition, 0.0, 1.0);\n\t\t}\n\t\t",
  frag: "\n\t\tprecision highp float;\n\t\tuniform vec4 uPolygonColor;\n\t\tuniform float uOpacity;\n\t\tvoid main() {\n\t\t\tgl_FragColor = vec4(uPolygonColor.rgb, uPolygonColor.a * uOpacity);\n\t\t}\n\t\t"
}; // Private Methods

var getVertexArray = function getVertexArray(points) {
  var vertices = new Float32Array(points.length * 2);

  for (var i = 0; i < points.length; i++) {
    vertices[i * 2] = points[i].x;
    vertices[i * 2 + 1] = points[i].y;
  }

  return vertices;
};

var createBuffers = function createBuffers(overlay, points) {
  var vertices = getVertexArray(points);
  var indices = earcut(vertices);
  var vertexBuffer = new VertexBuffer(overlay.gl, vertices, {
    0: {
      size: 2,
      type: 'FLOAT'
    }
  });
  var is16Bit = vertices.length < Math.pow(2, 16);
  var indexBuffer = new IndexBuffer(overlay.gl, is16Bit ? new Uint16Array(indices) : new Uint32Array(indices), {
    mode: 'TRIANGLES',
    type: is16Bit ? 'UNSIGNED_SHORT' : 'UNSIGNED_INT',
    count: indices.length
  });
  return {
    vertex: vertexBuffer,
    index: indexBuffer
  };
};
/**
 * Class representing a webgl polyline overlay renderer.
 */


var PolygonOverlayRenderer =
/*#__PURE__*/
function (_WebGLOverlayRenderer) {
  _inherits(PolygonOverlayRenderer, _WebGLOverlayRenderer);

  /**
   * Instantiates a new PolygonOverlayRenderer object.
   *
   * @param {Object} options - The overlay options.
   * @param {Array} options.polygonColor - The color of the line.
   */
  function PolygonOverlayRenderer() {
    var _this;

    var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

    _classCallCheck(this, PolygonOverlayRenderer);

    _this = _possibleConstructorReturn(this, _getPrototypeOf(PolygonOverlayRenderer).call(this, options));
    _this.polygonColor = defaultTo(options.polygonColor, [1.0, 0.4, 0.1, 0.8]);
    _this.shader = null;
    _this.polygons = null;
    return _this;
  }
  /**
   * Executed when the overlay is attached to a plot.
   *
   * @param {Plot} plot - The plot to attach the overlay to.
   *
   * @returns {PolygonOverlayRenderer} The overlay object, for chaining.
   */


  _createClass(PolygonOverlayRenderer, [{
    key: "onAdd",
    value: function onAdd(plot) {
      _get(_getPrototypeOf(PolygonOverlayRenderer.prototype), "onAdd", this).call(this, plot);

      this.shader = this.createShader(SHADER_GLSL);
      return this;
    }
    /**
     * Executed when the overlay is removed from a plot.
     *
     * @param {Plot} plot - The plot to remove the overlay from.
     *
     * @returns {PolygonOverlayRenderer} The overlay object, for chaining.
     */

  }, {
    key: "onRemove",
    value: function onRemove(plot) {
      _get(_getPrototypeOf(PolygonOverlayRenderer.prototype), "onRemove", this).call(this, plot);

      this.shader = null;
      return this;
    }
    /**
     * Generate any underlying buffers.
     *
     * @returns {PolygonOverlayRenderer} The overlay object, for chaining.
     */

  }, {
    key: "refreshBuffers",
    value: function refreshBuffers() {
      var _this2 = this;

      var clipped = this.overlay.getClippedGeometry();

      if (clipped) {
        this.polygons = clipped.map(function (points) {
          // generate the buffer
          return createBuffers(_this2, points);
        });
      } else {
        this.polygons = null;
      }
    }
    /**
     * The draw function that is executed per frame.
     *
     * @returns {PolygonOverlayRenderer} The overlay object, for chaining.
     */

  }, {
    key: "draw",
    value: function draw() {
      if (!this.polygons) {
        return this;
      }

      var gl = this.gl;
      var shader = this.shader;
      var polygons = this.polygons;
      var plot = this.overlay.plot;
      var cell = plot.cell;
      var proj = this.getOrthoMatrix();
      var scale = Math.pow(2, plot.zoom - cell.zoom);
      var opacity = this.overlay.opacity; // get view offset in cell space

      var offset = cell.project(plot.viewport, plot.zoom); // set blending func

      gl.enable(gl.BLEND);
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA); // bind shader

      shader.use(); // set global uniforms

      shader.setUniform('uProjectionMatrix', proj);
      shader.setUniform('uViewOffset', [offset.x, offset.y]);
      shader.setUniform('uScale', scale);
      shader.setUniform('uPolygonColor', this.polygonColor);
      shader.setUniform('uOpacity', opacity); // for each polyline buffer

      polygons.forEach(function (buffer) {
        // draw the points
        buffer.vertex.bind();
        buffer.index.draw();
      });
      return this;
    }
  }]);

  return PolygonOverlayRenderer;
}(WebGLOverlayRenderer);

module.exports = PolygonOverlayRenderer;
'use strict';

function _typeof(obj) { if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

function _possibleConstructorReturn(self, call) { if (call && (_typeof(call) === "object" || typeof call === "function")) { return call; } return _assertThisInitialized(self); }

function _assertThisInitialized(self) { if (self === void 0) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return self; }

function _get(target, property, receiver) { if (typeof Reflect !== "undefined" && Reflect.get) { _get = Reflect.get; } else { _get = function _get(target, property, receiver) { var base = _superPropBase(target, property); if (!base) return; var desc = Object.getOwnPropertyDescriptor(base, property); if (desc.get) { return desc.get.call(receiver); } return desc.value; }; } return _get(target, property, receiver || target); }

function _superPropBase(object, property) { while (!Object.prototype.hasOwnProperty.call(object, property)) { object = _getPrototypeOf(object); if (object === null) break; } return object; }

function _getPrototypeOf(o) { _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf : function _getPrototypeOf(o) { return o.__proto__ || Object.getPrototypeOf(o); }; return _getPrototypeOf(o); }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function"); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, writable: true, configurable: true } }); if (superClass) _setPrototypeOf(subClass, superClass); }

function _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf || function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }

var defaultTo = require('lodash/defaultTo');

var VertexBuffer = require('../../../webgl/vertex/VertexBuffer');

var WebGLOverlayRenderer = require('../WebGLOverlayRenderer'); // Constants

/**
 * Shader GLSL source.
 * @private
 * @constant {Object}
 */


var SHADER_GLSL = {
  vert: "\n\t\tprecision highp float;\n\t\tattribute vec2 aPosition;\n\t\tattribute vec2 aNormal;\n\t\tuniform vec2 uViewOffset;\n\t\tuniform float uScale;\n\t\tuniform float uLineWidth;\n\t\tuniform mat4 uProjectionMatrix;\n\t\tvoid main() {\n\t\t\tvec2 wPosition = (aPosition * uScale) - uViewOffset + aNormal * uLineWidth;\n\t\t\tgl_Position = uProjectionMatrix * vec4(wPosition, 0.0, 1.0);\n\t\t}\n\t\t",
  frag: "\n\t\tprecision highp float;\n\t\tuniform vec4 uLineColor;\n\t\tuniform float uOpacity;\n\t\tvoid main() {\n\t\t\tgl_FragColor = vec4(uLineColor.rgb, uLineColor.a * uOpacity);\n\t\t}\n\t\t"
}; // Private Methods
// NOTE: smooth / round lines implemented using code modified from:
// http://labs.hyperandroid.com/efficient-webgl-stroking . Instead of baking in
// the positions of the lines, this implementation instead generates the
// positions along the line and stores the tangents, allowing the thickness to
// be arbitrarily scaled outwards independant of scale. In order to prevent
// degeneration of normals due to self-intersections, the triangles are
// generated upon zoom.

var EPSILON = 0.000001;

var scalarMult = function scalarMult(a, s) {
  return {
    x: a.x * s,
    y: a.y * s
  };
};

var perpendicular = function perpendicular(a) {
  return {
    x: -a.y,
    y: a.x
  };
};

var invert = function invert(a) {
  return {
    x: -a.x,
    y: -a.y
  };
};

var length = function length(a) {
  return Math.sqrt(a.x * a.x + a.y * a.y);
};

var normalize = function normalize(a) {
  var mod = Math.sqrt(a.x * a.x + a.y * a.y);
  return {
    x: a.x / mod,
    y: a.y / mod
  };
};

var add = function add(p0, p1) {
  return {
    x: p0.x + p1.x,
    y: p0.y + p1.y
  };
};

var sub = function sub(p0, p1) {
  return {
    x: p0.x - p1.x,
    y: p0.y - p1.y
  };
};

var middle = function middle(p0, p1) {
  return scalarMult(add(p0, p1), 0.5);
};

var equal = function equal(p0, p1) {
  return p0.x === p1.x && p0.y === p1.y;
};

var signedArea = function signedArea(p0, p1, p2) {
  return (p1.x - p0.x) * (p2.y - p0.y) - (p2.x - p0.x) * (p1.y - p0.y);
};

var getStrokeGeometry = function getStrokeGeometry(points, strokeWidth) {
  if (points.length < 2) {
    throw 'A valid polyline must consist of at least 2 points';
  }

  var lineWidth = strokeWidth / 2;
  var positions = [];
  var normals = [];
  var middlePoints = []; // middle points per each line segment

  var closed = false;

  if (points.length === 2) {
    createTriangles(points[0], middle(points[0], points[1]), points[1], positions, normals, lineWidth);
  } else {
    if (equal(points[0], points[points.length - 1])) {
      var p0 = middle(points.shift(), points[0]);
      points.unshift(p0);
      points.push(p0);
      closed = true;
    }

    for (var i = 0; i < points.length - 1; i++) {
      if (i === 0) {
        middlePoints.push(points[0]);
      } else if (i === points.length - 2) {
        middlePoints.push(points[points.length - 1]);
      } else {
        middlePoints.push(middle(points[i], points[i + 1]));
      }
    }

    for (var _i = 1; _i < middlePoints.length; _i++) {
      createTriangles(middlePoints[_i - 1], points[_i], middlePoints[_i], positions, normals, lineWidth);
    }
  }

  if (!closed) {
    // start cap
    var _p = points[0];
    var p1 = points[1];
    var t = perpendicular(sub(p1, _p));
    createRoundCap(_p, add(_p, t), sub(_p, t), p1, positions, normals); // end cap

    _p = points[points.length - 1];
    p1 = points[points.length - 2];
    t = perpendicular(sub(p1, _p));
    createRoundCap(_p, add(_p, t), sub(_p, t), p1, positions, normals);
  }

  return {
    positions: positions,
    normals: normals
  };
};

var createRoundCap = function createRoundCap(center, p0, p1, nextPointInLine, positions, normals) {
  var angle0 = Math.atan2(p1.y - center.y, p1.x - center.x);
  var angle1 = Math.atan2(p0.y - center.y, p0.x - center.x);
  var orgAngle0 = angle0;

  if (angle1 > angle0) {
    if (angle1 - angle0 >= Math.PI - EPSILON) {
      angle1 = angle1 - 2 * Math.PI;
    }
  } else {
    if (angle0 - angle1 >= Math.PI - EPSILON) {
      angle0 = angle0 - 2 * Math.PI;
    }
  }

  var angleDiff = angle1 - angle0;

  if (Math.abs(angleDiff) >= Math.PI - EPSILON && Math.abs(angleDiff) <= Math.PI + EPSILON) {
    var r1 = sub(center, nextPointInLine);

    if (r1.x === 0) {
      if (r1.y > 0) {
        angleDiff = -angleDiff;
      }
    } else if (r1.x >= -EPSILON) {
      angleDiff = -angleDiff;
    }
  }

  var segmentsPerSemi = 16;
  var nsegments = Math.ceil(Math.abs(angleDiff / Math.PI) * segmentsPerSemi);
  var angleInc = angleDiff / nsegments;
  var n0 = {
    x: 0,
    y: 0
  };

  for (var i = 0; i < nsegments; i++) {
    var n1 = {
      x: Math.cos(orgAngle0 + angleInc * i),
      y: Math.sin(orgAngle0 + angleInc * i)
    };
    var n2 = {
      x: Math.cos(orgAngle0 + angleInc * (1 + i)),
      y: Math.sin(orgAngle0 + angleInc * (1 + i))
    };
    positions.push(center);
    positions.push(center);
    positions.push(center);
    normals.push(n0);
    normals.push(n1);
    normals.push(n2);
  }
};

function lineIntersection(p0, p1, p2, p3) {
  var a0 = p1.y - p0.y;
  var b0 = p0.x - p1.x;
  var a1 = p3.y - p2.y;
  var b1 = p2.x - p3.x;
  var det = a0 * b1 - a1 * b0;

  if (det > -EPSILON && det < EPSILON) {
    return null;
  }

  var c0 = a0 * p0.x + b0 * p0.y;
  var c1 = a1 * p2.x + b1 * p2.y;
  var x = (b1 * c0 - b0 * c1) / det;
  var y = (a0 * c1 - a1 * c0) / det;
  return {
    x: x,
    y: y
  };
}

function createTriangles(p0, p1, p2, positions, normals, lineWidth) {
  var t0 = sub(p1, p0);
  var t2 = sub(p2, p1);
  t0 = perpendicular(t0);
  t2 = perpendicular(t2); // triangle composed by the 3 points if clockwise or counter-clockwise.
  // if counter-clockwise, we must invert the line threshold points, otherwise
  // the intersection point could be erroneous and lead to odd results.

  if (signedArea(p0, p1, p2) > 0) {
    t0 = invert(t0);
    t2 = invert(t2);
  }

  t0 = normalize(t0);
  t2 = normalize(t2);
  t0 = scalarMult(t0, lineWidth);
  t2 = scalarMult(t2, lineWidth);
  var pintersect = lineIntersection(add(t0, p0), add(t0, p1), add(t2, p2), add(t2, p1));
  var anchor = null;
  var anchorLength = Number.MAX_VALUE;
  var ian = null;

  if (pintersect) {
    anchor = sub(pintersect, p1);
    anchorLength = length(anchor);
    ian = invert(scalarMult(anchor, 1.0 / lineWidth));
  }

  var p0p1 = sub(p0, p1);
  var p0p1Length = length(p0p1);
  var p1p2 = sub(p1, p2);
  var p1p2Length = length(p1p2);
  var n0 = normalize(t0);
  var in0 = invert(n0);
  var n2 = normalize(t2);
  var in2 = invert(n2); // the cross point exceeds any of the segments dimension.
  // do not use cross point as reference.

  if (anchorLength > p0p1Length || anchorLength > p1p2Length) {
    positions.push(p0);
    positions.push(p0);
    positions.push(p1);
    normals.push(n0);
    normals.push(in0);
    normals.push(n0);
    positions.push(p0);
    positions.push(p1);
    positions.push(p1);
    normals.push(in0);
    normals.push(n0);
    normals.push(in0);
    createRoundCap(p1, add(p1, t0), add(p1, t2), p2, positions, normals);
    positions.push(p2);
    positions.push(p1);
    positions.push(p1);
    normals.push(n2);
    normals.push(in2);
    normals.push(n2);
    positions.push(p2);
    positions.push(p1);
    positions.push(p2);
    normals.push(n2);
    normals.push(in2);
    normals.push(in2);
  } else {
    positions.push(p0);
    positions.push(p0);
    positions.push(p1);
    normals.push(n0);
    normals.push(in0);
    normals.push(ian);
    positions.push(p0);
    positions.push(p1);
    positions.push(p1);
    normals.push(n0);
    normals.push(ian);
    normals.push(n0);
    positions.push(p1);
    positions.push(p1);
    positions.push(p1);
    normals.push(n0);
    normals.push({
      x: 0,
      y: 0
    });
    normals.push(ian);
    createRoundCap(p1, add(p1, t0), add(p1, t2), sub(p1, anchor), positions, normals);
    positions.push(p1);
    positions.push(p1);
    positions.push(p1);
    normals.push({
      x: 0,
      y: 0
    });
    normals.push(n2);
    normals.push(ian);
    positions.push(p2);
    positions.push(p1);
    positions.push(p1);
    normals.push(n2);
    normals.push(ian);
    normals.push(n2);
    positions.push(p2);
    positions.push(p1);
    positions.push(p2);
    normals.push(n2);
    normals.push(ian);
    normals.push(in2);
  }
}

var bufferPolyline = function bufferPolyline(points, normals) {
  var buffer = new Float32Array(points.length * 4);

  for (var i = 0; i < points.length; i++) {
    var point = points[i];
    var normal = normals[i];
    buffer[i * 4] = point.x;
    buffer[i * 4 + 1] = point.y;
    buffer[i * 4 + 2] = normal.x;
    buffer[i * 4 + 3] = normal.y;
  }

  return buffer;
};

var createVertexBuffer = function createVertexBuffer(overlay, points) {
  var lineWidth = overlay.lineWidth;
  var geometry = getStrokeGeometry(points, lineWidth);
  var data = bufferPolyline(geometry.positions, geometry.normals);
  return new VertexBuffer(overlay.gl, data, {
    0: {
      size: 2,
      type: 'FLOAT',
      byteOffset: 0
    },
    1: {
      size: 2,
      type: 'FLOAT',
      byteOffset: 2 * 4
    }
  }, {
    mode: 'TRIANGLES',
    count: geometry.positions.length
  });
};
/**
 * Class representing a webgl polyline overlay renderer.
 */


var PolylineOverlayRenderer =
/*#__PURE__*/
function (_WebGLOverlayRenderer) {
  _inherits(PolylineOverlayRenderer, _WebGLOverlayRenderer);

  /**
   * Instantiates a new PolylineOverlayRenderer object.
   *
   * @param {Object} options - The overlay options.
   * @param {Array} options.lineColor - The color of the line.
   * @param {number} options.lineWidth - The pixel width of the line.
   */
  function PolylineOverlayRenderer() {
    var _this;

    var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

    _classCallCheck(this, PolylineOverlayRenderer);

    _this = _possibleConstructorReturn(this, _getPrototypeOf(PolylineOverlayRenderer).call(this, options));
    _this.lineColor = defaultTo(options.lineColor, [1.0, 0.4, 0.1, 0.8]);
    _this.lineWidth = defaultTo(options.lineWidth, 2);
    _this.shader = null;
    _this.lines = null;
    return _this;
  }
  /**
   * Executed when the overlay is attached to a plot.
   *
   * @param {Plot} plot - The plot to attach the overlay to.
   *
   * @returns {PolylineOverlayRenderer} The overlay object, for chaining.
   */


  _createClass(PolylineOverlayRenderer, [{
    key: "onAdd",
    value: function onAdd(plot) {
      _get(_getPrototypeOf(PolylineOverlayRenderer.prototype), "onAdd", this).call(this, plot);

      this.shader = this.createShader(SHADER_GLSL);
      return this;
    }
    /**
     * Executed when the overlay is removed from a plot.
     *
     * @param {Plot} plot - The plot to remove the overlay from.
     *
     * @returns {PolylineOverlayRenderer} The overlay object, for chaining.
     */

  }, {
    key: "onRemove",
    value: function onRemove(plot) {
      _get(_getPrototypeOf(PolylineOverlayRenderer.prototype), "onRemove", this).call(this, plot);

      this.shader = null;
      return this;
    }
    /**
     * Generate any underlying buffers.
     *
     * @returns {PolylineOverlayRenderer} The overlay object, for chaining.
     */

  }, {
    key: "refreshBuffers",
    value: function refreshBuffers() {
      var _this2 = this;

      var clipped = this.overlay.getClippedGeometry();

      if (clipped) {
        this.lines = clipped.map(function (points) {
          // generate the buffer
          return createVertexBuffer(_this2, points);
        });
      } else {
        this.lines = null;
      }
    }
    /**
     * The draw function that is executed per frame.
     *
     * @returns {PolylineOverlayRenderer} The overlay object, for chaining.
     */

  }, {
    key: "draw",
    value: function draw() {
      if (!this.lines) {
        return this;
      }

      var gl = this.gl;
      var shader = this.shader;
      var lines = this.lines;
      var plot = this.overlay.plot;
      var cell = plot.cell;
      var proj = this.getOrthoMatrix();
      var scale = Math.pow(2, plot.zoom - cell.zoom);
      var opacity = this.overlay.opacity; // get view offset in cell space

      var offset = cell.project(plot.viewport, plot.zoom); // set blending func

      gl.enable(gl.BLEND);
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA); // bind shader

      shader.use(); // set global uniforms

      shader.setUniform('uProjectionMatrix', proj);
      shader.setUniform('uViewOffset', [offset.x, offset.y]);
      shader.setUniform('uScale', scale);
      shader.setUniform('uLineWidth', this.lineWidth / 2);
      shader.setUniform('uLineColor', this.lineColor);
      shader.setUniform('uOpacity', opacity); // for each polyline buffer

      lines.forEach(function (buffer) {
        // draw the points
        buffer.bind();
        buffer.draw();
      });
      return this;
    }
  }]);

  return PolylineOverlayRenderer;
}(WebGLOverlayRenderer);

module.exports = PolylineOverlayRenderer;
'use strict';

function _typeof(obj) { if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

function _possibleConstructorReturn(self, call) { if (call && (_typeof(call) === "object" || typeof call === "function")) { return call; } return _assertThisInitialized(self); }

function _assertThisInitialized(self) { if (self === void 0) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return self; }

function _get(target, property, receiver) { if (typeof Reflect !== "undefined" && Reflect.get) { _get = Reflect.get; } else { _get = function _get(target, property, receiver) { var base = _superPropBase(target, property); if (!base) return; var desc = Object.getOwnPropertyDescriptor(base, property); if (desc.get) { return desc.get.call(receiver); } return desc.value; }; } return _get(target, property, receiver || target); }

function _superPropBase(object, property) { while (!Object.prototype.hasOwnProperty.call(object, property)) { object = _getPrototypeOf(object); if (object === null) break; } return object; }

function _getPrototypeOf(o) { _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf : function _getPrototypeOf(o) { return o.__proto__ || Object.getPrototypeOf(o); }; return _getPrototypeOf(o); }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function"); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, writable: true, configurable: true } }); if (superClass) _setPrototypeOf(subClass, superClass); }

function _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf || function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }

var VertexBuffer = require('../../../webgl/vertex/VertexBuffer');

var WebGLTileRenderer = require('../WebGLTileRenderer'); // Constants

/**
 * Shader GLSL source.
 * @private
 * @constant {Object}
 */


var SHADER_GLSL = {
  vert: "\n\t\tprecision highp float;\n\t\tattribute vec2 aPosition;\n\t\tattribute vec2 aTextureCoord;\n\t\tuniform vec4 uTextureCoordOffset;\n\t\tuniform vec2 uTileOffset;\n\t\tuniform float uScale;\n\t\tuniform mat4 uProjectionMatrix;\n\t\tvarying vec2 vTextureCoord;\n\t\tvoid main() {\n\t\t\tvTextureCoord = vec2(\n\t\t\t\tuTextureCoordOffset.x + (aTextureCoord.x * uTextureCoordOffset.z),\n\t\t\t\tuTextureCoordOffset.y + (aTextureCoord.y * uTextureCoordOffset.w));\n\t\t\tvec2 wPosition = (aPosition * uScale) + uTileOffset;\n\t\t\tgl_Position = uProjectionMatrix * vec4(wPosition, 0.0, 1.0);\n\t\t}\n\t\t",
  frag: "\n\t\tprecision highp float;\n\t\tuniform sampler2D uTextureSampler;\n\t\tuniform float uOpacity;\n\t\tvarying vec2 vTextureCoord;\n\t\tvoid main() {\n\t\t\tvec4 color = texture2D(uTextureSampler, vec2(vTextureCoord.x, 1.0 - vTextureCoord.y));\n\t\t\tgl_FragColor = vec4(color.rgb, color.a * uOpacity);\n\t\t}\n\t\t"
};

var createQuad = function createQuad(gl, min, max) {
  var vertices = new Float32Array(24); // positions

  vertices[0] = min;
  vertices[1] = min;
  vertices[2] = max;
  vertices[3] = min;
  vertices[4] = max;
  vertices[5] = max;
  vertices[6] = min;
  vertices[7] = min;
  vertices[8] = max;
  vertices[9] = max;
  vertices[10] = min;
  vertices[11] = max; // uvs

  vertices[12] = 0;
  vertices[13] = 0;
  vertices[14] = 1;
  vertices[15] = 0;
  vertices[16] = 1;
  vertices[17] = 1;
  vertices[18] = 0;
  vertices[19] = 0;
  vertices[20] = 1;
  vertices[21] = 1;
  vertices[22] = 0;
  vertices[23] = 1; // create quad buffer

  return new VertexBuffer(gl, vertices, {
    0: {
      size: 2,
      type: 'FLOAT',
      byteOffset: 0
    },
    1: {
      size: 2,
      type: 'FLOAT',
      byteOffset: 2 * 6 * 4
    }
  }, {
    count: 6
  });
};
/**
 * Class representing a webgl image tile renderer.
 */


var ImageTileRenderer =
/*#__PURE__*/
function (_WebGLTileRenderer) {
  _inherits(ImageTileRenderer, _WebGLTileRenderer);

  /**
   * Instantiates a new ImageTileRenderer object.
   */
  function ImageTileRenderer() {
    var _this;

    _classCallCheck(this, ImageTileRenderer);

    _this = _possibleConstructorReturn(this, _getPrototypeOf(ImageTileRenderer).call(this));
    _this.quad = null;
    _this.shader = null;
    _this.array = null;
    return _this;
  }
  /**
   * Executed when the layer is attached to a plot.
   *
   * @param {Layer} layer - The layer to attach the renderer to.
   *
   * @returns {ImageTileRenderer} The renderer object, for chaining.
   */


  _createClass(ImageTileRenderer, [{
    key: "onAdd",
    value: function onAdd(layer) {
      _get(_getPrototypeOf(ImageTileRenderer.prototype), "onAdd", this).call(this, layer);

      this.quad = createQuad(this.gl, 0, layer.plot.tileSize);
      this.shader = this.createShader(SHADER_GLSL);
      this.array = this.createTextureArray({
        chunkSize: layer.plot.tileSize
      });
      return this;
    }
    /**
     * Executed when the layer is removed from a plot.
     *
     * @param {Layer} layer - The layer to remove the renderer from.
     *
     * @returns {ImageTileRenderer} The renderer object, for chaining.
     */

  }, {
    key: "onRemove",
    value: function onRemove(layer) {
      this.destroyTextureArray(this.array);
      this.array = null;
      this.quad = null;
      this.shader = null;

      _get(_getPrototypeOf(ImageTileRenderer.prototype), "onRemove", this).call(this, layer);

      return this;
    }
    /**
     * The draw function that is executed per frame.
     *
     * @returns {ImageTileRenderer} The renderer object, for chaining.
     */

  }, {
    key: "draw",
    value: function draw() {
      var gl = this.gl;
      var shader = this.shader;
      var array = this.array;
      var quad = this.quad;
      var renderables = this.getRenderablesLOD();
      var proj = this.getOrthoMatrix(); // bind shader

      shader.use(); // set global uniforms

      shader.setUniform('uProjectionMatrix', proj);
      shader.setUniform('uTextureSampler', 0);
      shader.setUniform('uOpacity', this.layer.opacity); // set blending func

      gl.enable(gl.BLEND);
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA); // bind quad

      quad.bind(); // for each renderable

      for (var i = 0; i < renderables.length; i++) {
        var renderable = renderables[i];
        array.bind(renderable.hash, 0); // set tile uniforms

        shader.setUniform('uTextureCoordOffset', renderable.uvOffset);
        shader.setUniform('uScale', renderable.scale);
        shader.setUniform('uTileOffset', renderable.tileOffset); // draw

        quad.draw(); // no need to unbind texture
      } // unbind quad


      quad.unbind();
      return this;
    }
  }]);

  return ImageTileRenderer;
}(WebGLTileRenderer);

module.exports = ImageTileRenderer;
'use strict';

function _typeof(obj) { if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

function _possibleConstructorReturn(self, call) { if (call && (_typeof(call) === "object" || typeof call === "function")) { return call; } return _assertThisInitialized(self); }

function _assertThisInitialized(self) { if (self === void 0) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return self; }

function _get(target, property, receiver) { if (typeof Reflect !== "undefined" && Reflect.get) { _get = Reflect.get; } else { _get = function _get(target, property, receiver) { var base = _superPropBase(target, property); if (!base) return; var desc = Object.getOwnPropertyDescriptor(base, property); if (desc.get) { return desc.get.call(receiver); } return desc.value; }; } return _get(target, property, receiver || target); }

function _superPropBase(object, property) { while (!Object.prototype.hasOwnProperty.call(object, property)) { object = _getPrototypeOf(object); if (object === null) break; } return object; }

function _getPrototypeOf(o) { _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf : function _getPrototypeOf(o) { return o.__proto__ || Object.getPrototypeOf(o); }; return _getPrototypeOf(o); }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function"); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, writable: true, configurable: true } }); if (superClass) _setPrototypeOf(subClass, superClass); }

function _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf || function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }

var defaultTo = require('lodash/defaultTo');

var VertexBuffer = require('../../../webgl/vertex/VertexBuffer');

var WebGLTileRenderer = require('../WebGLTileRenderer'); // Constants

/**
 * Numver of vertices supported per chunk.
 * @private
 * @constant {number}
 */


var CHUNK_SIZE = 128 * 128;
/**
 * Inner radius of star.
 * @private
 * @constant {number}
 */

var STAR_INNER_RADIUS = 0.4;
/**
 * Outer radius of star.
 * @private
 * @constant {number}
 */

var STAR_OUTER_RADIUS = 1.0;
/**
 * number of points on the star.
 * @private
 * @constant {number}
 */

var STAR_NUM_POINTS = 5;
/**
 * Shader GLSL source.
 * @private
 * @constant {Object}
 */

var SHADER_GLSL = {
  vert: "\n\t\tprecision highp float;\n\t\tattribute vec2 aPosition;\n\t\tattribute vec2 aOffset;\n\t\tattribute float aRadius;\n\t\tuniform vec2 uTileOffset;\n\t\tuniform float uScale;\n\t\tuniform mat4 uProjectionMatrix;\n\t\tvoid main() {\n\t\t\tvec2 wPosition = (aPosition * aRadius) + (aOffset * uScale) + uTileOffset;\n\t\t\tgl_Position = uProjectionMatrix * vec4(wPosition, 0.0, 1.0);\n\t\t}\n\t\t",
  frag: "\n\t\tprecision highp float;\n\t\tuniform vec4 uColor;\n\t\tvoid main() {\n\t\t\tgl_FragColor = uColor;\n\t\t}\n\t\t"
}; // Private Methods

var createStar = function createStar(gl) {
  var theta = 2 * Math.PI / STAR_NUM_POINTS;
  var htheta = theta / 2.0;
  var qtheta = theta / 4.0;
  var positions = new Float32Array(STAR_NUM_POINTS * 2 * 2 + 4);
  positions[0] = 0;
  positions[1] = 0;

  for (var i = 0; i < STAR_NUM_POINTS; i++) {
    var angle = i * theta;
    var sx = Math.cos(angle - qtheta) * STAR_INNER_RADIUS;
    var sy = Math.sin(angle - qtheta) * STAR_INNER_RADIUS;
    positions[i * 4 + 2] = sx;
    positions[i * 4 + 1 + 2] = sy;
    sx = Math.cos(angle + htheta - qtheta) * STAR_OUTER_RADIUS;
    sy = Math.sin(angle + htheta - qtheta) * STAR_OUTER_RADIUS;
    positions[i * 4 + 2 + 2] = sx;
    positions[i * 4 + 3 + 2] = sy;
  }

  positions[positions.length - 2] = positions[2];
  positions[positions.length - 1] = positions[3];
  return new VertexBuffer(gl, positions, {
    0: {
      size: 2,
      type: 'FLOAT'
    }
  }, {
    mode: 'TRIANGLE_FAN',
    count: positions.length / 2
  });
};
/**
 * Class representing a webgl instanced shape tile renderer.
 */


var InstancedTileRenderer =
/*#__PURE__*/
function (_WebGLTileRenderer) {
  _inherits(InstancedTileRenderer, _WebGLTileRenderer);

  /**
   * Instantiates a new InstancedTileRenderer object.
   *
   * @param {Object} options - The options object.
   * @param {Array} options.color - The color of the points.
   */
  function InstancedTileRenderer() {
    var _this;

    var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

    _classCallCheck(this, InstancedTileRenderer);

    _this = _possibleConstructorReturn(this, _getPrototypeOf(InstancedTileRenderer).call(this));
    _this.color = defaultTo(options.color, [1.0, 0.4, 0.1, 0.8]);
    _this.shape = null;
    _this.shader = null;
    _this.atlas = null;
    return _this;
  }
  /**
   * Executed when the layer is attached to a plot.
   *
   * @param {Layer} layer - The layer to attach the renderer to.
   *
   * @returns {Renderer} The renderer object, for chaining.
   */


  _createClass(InstancedTileRenderer, [{
    key: "onAdd",
    value: function onAdd(layer) {
      _get(_getPrototypeOf(InstancedTileRenderer.prototype), "onAdd", this).call(this, layer);

      this.shape = createStar(this.gl);
      this.shader = this.createShader(SHADER_GLSL);
      this.atlas = this.createVertexAtlas({
        chunkSize: CHUNK_SIZE,
        attributePointers: {
          // offset
          1: {
            size: 2,
            type: 'FLOAT'
          },
          // radius
          2: {
            size: 1,
            type: 'FLOAT'
          }
        }
      });
      return this;
    }
    /**
     * Executed when the layer is removed from a plot.
     *
     * @param {Layer} layer - The layer to remove the renderer from.
     *
     * @returns {Renderer} The renderer object, for chaining.
     */

  }, {
    key: "onRemove",
    value: function onRemove(layer) {
      this.destroyVertexAtlas(this.atlas);
      this.atlas = null;
      this.shape = null;
      this.shader = null;

      _get(_getPrototypeOf(InstancedTileRenderer.prototype), "onRemove", this).call(this, layer);

      return this;
    }
    /**
     * The draw function that is executed per frame.
     *
     * @returns {Renderer} The renderer object, for chaining.
     */

  }, {
    key: "draw",
    value: function draw() {
      var gl = this.gl;
      var shader = this.shader;
      var atlas = this.atlas;
      var shape = this.shape;
      var renderables = this.getRenderables();
      var proj = this.getOrthoMatrix(); // set blending func

      gl.enable(gl.BLEND);
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA); // bind shader

      shader.use(); // set global uniforms

      shader.setUniform('uProjectionMatrix', proj);
      shader.setUniform('uColor', this.color); // bind shape

      shape.bind(); // binds the buffer to instance

      atlas.bindInstanced(); // for each renderable

      for (var i = 0; i < renderables.length; i++) {
        var renderable = renderables[i]; // set tile uniforms

        shader.setUniform('uScale', renderable.scale);
        shader.setUniform('uTileOffset', renderable.tileOffset); // draw the instances

        atlas.drawInstanced(renderable.hash, shape.mode, shape.count);
      } // unbind


      atlas.unbindInstanced(); // unbind quad

      shape.unbind();
      return this;
    }
  }]);

  return InstancedTileRenderer;
}(WebGLTileRenderer);

module.exports = InstancedTileRenderer;
'use strict';

function _typeof(obj) { if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

function _possibleConstructorReturn(self, call) { if (call && (_typeof(call) === "object" || typeof call === "function")) { return call; } return _assertThisInitialized(self); }

function _assertThisInitialized(self) { if (self === void 0) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return self; }

function _get(target, property, receiver) { if (typeof Reflect !== "undefined" && Reflect.get) { _get = Reflect.get; } else { _get = function _get(target, property, receiver) { var base = _superPropBase(target, property); if (!base) return; var desc = Object.getOwnPropertyDescriptor(base, property); if (desc.get) { return desc.get.call(receiver); } return desc.value; }; } return _get(target, property, receiver || target); }

function _superPropBase(object, property) { while (!Object.prototype.hasOwnProperty.call(object, property)) { object = _getPrototypeOf(object); if (object === null) break; } return object; }

function _getPrototypeOf(o) { _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf : function _getPrototypeOf(o) { return o.__proto__ || Object.getPrototypeOf(o); }; return _getPrototypeOf(o); }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function"); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, writable: true, configurable: true } }); if (superClass) _setPrototypeOf(subClass, superClass); }

function _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf || function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }

var defaultTo = require('lodash/defaultTo');

var CircleCollidable = require('../../../geometry/CircleCollidable');

var VertexBuffer = require('../../../webgl/vertex/VertexBuffer');

var WebGLTileRenderer = require('../WebGLTileRenderer'); // Constants

/**
 * Numver of vertices supported per chunk.
 * @private
 * @constant {number}
 */


var CHUNK_SIZE = 128 * 128;
/**
 * Highlighted point radius increase.
 * @private
 * @constant {number}
 */

var HIGHLIGHTED_RADIUS_OFFSET = 2;
/**
 * Selected point radius increase.
 * @private
 * @constant {number}
 */

var SELECTED_RADIUS_OFFSET = 4;
/**
 * R-Tree node capacity.
 * @private
 * @constant {number}
 */

var NODE_CAPACITY = 32;
/**
 * Shader GLSL source.
 * @private
 * @constant {Object}
 */

var SHADER_GLSL = {
  vert: "\n\t\tprecision highp float;\n\t\tattribute vec2 aPosition;\n\t\tattribute float aRadius;\n\t\tuniform float uRadiusOffset;\n\t\tuniform vec2 uTileOffset;\n\t\tuniform float uScale;\n\t\tuniform float uPixelRatio;\n\t\tuniform mat4 uProjectionMatrix;\n\t\tvoid main() {\n\t\t\tvec2 wPosition = (aPosition * uScale) + uTileOffset;\n\t\t\tgl_PointSize = (aRadius + uRadiusOffset) * uScale * 2.0 * uPixelRatio;\n\t\t\tgl_Position = uProjectionMatrix * vec4(wPosition, 0.0, 1.0);\n\t\t}\n\t\t",
  frag: "\n\t\t#ifdef GL_OES_standard_derivatives\n\t\t\t#extension GL_OES_standard_derivatives : enable\n\t\t#endif\n\t\tprecision highp float;\n\t\tuniform vec4 uColor;\n\t\tvoid main() {\n\t\t\tvec2 cxy = 2.0 * gl_PointCoord - 1.0;\n\t\t\tfloat radius = dot(cxy, cxy);\n\t\t\tfloat alpha = 1.0;\n\t\t\t#ifdef GL_OES_standard_derivatives\n\t\t\t\tfloat delta = fwidth(radius);\n\t\t\t\talpha = 1.0 - smoothstep(1.0 - delta, 1.0 + delta, radius);\n\t\t\t#else\n\t\t\t\tif (radius > 1.0) {\n\t\t\t\t\tdiscard;\n\t\t\t\t}\n\t\t\t#endif\n\t\t\tgl_FragColor = vec4(uColor.rgb, uColor.a * alpha);\n\t\t}\n\t\t"
}; // Private Methods

var createPoint = function createPoint(gl) {
  var vertices = new Float32Array(2);
  vertices[0] = 0.0;
  vertices[1] = 0.0; // create quad buffer

  return new VertexBuffer(gl, vertices, {
    0: {
      size: 2,
      type: 'FLOAT'
    }
  }, {
    mode: 'POINTS',
    count: 1
  });
};

var createCollidables = function createCollidables(tile, xOffset, yOffset) {
  var data = tile.data;
  var collidables = new Array(data.length / 3);

  for (var i = 0; i < data.length; i += 3) {
    // add collidable
    collidables[i / 3] = new CircleCollidable(data[i], // x
    data[i + 1], // y
    data[i + 2], // radius
    xOffset, yOffset, tile);
  }

  return collidables;
};

var renderTiles = function renderTiles(atlas, shader, renderables, color) {
  // set global uniforms
  shader.setUniform('uColor', color);
  shader.setUniform('uRadiusOffset', 0); // binds the buffer to instance

  atlas.bind(); // for each renderable

  for (var i = 0; i < renderables.length; i++) {
    var renderable = renderables[i]; // set tile uniforms

    shader.setUniform('uScale', renderable.scale);
    shader.setUniform('uTileOffset', renderable.tileOffset); // draw points

    atlas.draw(renderable.hash, 'POINTS');
  } // unbind


  atlas.unbind();
};

var renderPoint = function renderPoint(point, shader, plot, target, color, radius) {
  // get tile offset
  var coord = target.tile.coord;
  var scale = Math.pow(2, plot.zoom - coord.z);
  var viewport = plot.getViewportPixelOffset();
  var tileOffset = [(coord.x * plot.tileSize + target.x) * scale - viewport.x, (coord.y * plot.tileSize + target.y) * scale - viewport.y]; // set uniforms

  shader.setUniform('uTileOffset', tileOffset);
  shader.setUniform('uScale', scale);
  shader.setUniform('uColor', color);
  shader.setUniform('uRadiusOffset', radius + target.radius); // binds the buffer to instance

  point.bind(); // draw the points

  point.draw(); // unbind

  point.unbind();
};
/**
 * Class representing a webgl interactive point tile renderer.
 */


var InteractiveTileRenderer =
/*#__PURE__*/
function (_WebGLTileRenderer) {
  _inherits(InteractiveTileRenderer, _WebGLTileRenderer);

  /**
   * Instantiates a new InteractiveTileRenderer object.
   *
   * @param {Object} options - The options object.
   * @param {Array} options.color - The color of the points.
   */
  function InteractiveTileRenderer() {
    var _this;

    var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

    _classCallCheck(this, InteractiveTileRenderer);

    _this = _possibleConstructorReturn(this, _getPrototypeOf(InteractiveTileRenderer).call(this));
    _this.color = defaultTo(options.color, [1.0, 0.4, 0.1, 0.8]);
    _this.shader = null;
    _this.point = null;
    _this.tree = null;
    _this.atlas = null;
    _this.ext = null;
    return _this;
  }
  /**
   * Executed when the layer is attached to a plot.
   *
   * @param {Layer} layer - The layer to attach the renderer to.
   *
   * @returns {Renderer} The renderer object, for chaining.
   */


  _createClass(InteractiveTileRenderer, [{
    key: "onAdd",
    value: function onAdd(layer) {
      _get(_getPrototypeOf(InteractiveTileRenderer.prototype), "onAdd", this).call(this, layer); // get the extension for standard derivatives


      this.ext = this.gl.getExtension('OES_standard_derivatives');
      this.point = createPoint(this.gl);
      this.shader = this.createShader(SHADER_GLSL);
      this.tree = this.createRTreePyramid({
        nodeCapacity: NODE_CAPACITY,
        createCollidables: createCollidables
      });
      this.atlas = this.createVertexAtlas({
        chunkSize: CHUNK_SIZE,
        attributePointers: {
          // position
          0: {
            size: 2,
            type: 'FLOAT'
          },
          // radius
          1: {
            size: 1,
            type: 'FLOAT'
          }
        }
      });
      return this;
    }
    /**
     * Executed when the layer is removed from a plot.
     *
     * @param {Layer} layer - The layer to remove the renderer from.
     *
     * @returns {Renderer} The renderer object, for chaining.
     */

  }, {
    key: "onRemove",
    value: function onRemove(layer) {
      this.destroyVertexAtlas(this.atlas);
      this.destroyRTreePyramid(this.tree);
      this.atlas = null;
      this.shader = null;
      this.point = null;
      this.tree = null;
      this.ext = null;

      _get(_getPrototypeOf(InteractiveTileRenderer.prototype), "onRemove", this).call(this, layer);

      return this;
    }
    /**
     * Pick a position of the renderer for a collision with any rendered objects.
     *
     * @param {Object} pos - The plot position to pick at.
     *
     * @returns {Object} The collision, if any.
     */

  }, {
    key: "pick",
    value: function pick(pos) {
      if (this.layer.plot.isZooming()) {
        return null;
      }

      return this.tree.searchPoint(pos.x, pos.y, this.layer.plot.zoom, this.layer.plot.getPixelExtent());
    }
    /**
     * The draw function that is executed per frame.
     *
     * @returns {Renderer} The renderer object, for chaining.
     */

  }, {
    key: "draw",
    value: function draw() {
      var _this2 = this;

      var gl = this.gl;
      var layer = this.layer;
      var plot = layer.plot;
      var projection = this.getOrthoMatrix();
      var shader = this.shader; // bind render target

      plot.renderBuffer.bind(); // clear render target

      plot.renderBuffer.clear(); // set blending func

      gl.enable(gl.BLEND);
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE); // use shader

      shader.use(); // set uniforms

      shader.setUniform('uProjectionMatrix', projection);
      shader.setUniform('uPixelRatio', plot.pixelRatio); // render the tiles

      renderTiles(this.atlas, shader, this.getRenderables(), this.color); // render selected

      layer.getSelected().forEach(function (selected) {
        renderPoint(_this2.point, shader, plot, selected, _this2.color, SELECTED_RADIUS_OFFSET);
      }); // render highlighted

      var highlighted = layer.getHighlighted();

      if (highlighted && !layer.isSelected(highlighted)) {
        renderPoint(this.point, shader, plot, highlighted, this.color, HIGHLIGHTED_RADIUS_OFFSET);
      } // unbind render target


      plot.renderBuffer.unbind(); // render framebuffer to the backbuffer

      plot.renderBuffer.blitToScreen(this.layer.opacity);
      return this;
    }
  }]);

  return InteractiveTileRenderer;
}(WebGLTileRenderer);

module.exports = InteractiveTileRenderer;
'use strict';

function _typeof(obj) { if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

function _possibleConstructorReturn(self, call) { if (call && (_typeof(call) === "object" || typeof call === "function")) { return call; } return _assertThisInitialized(self); }

function _assertThisInitialized(self) { if (self === void 0) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return self; }

function _get(target, property, receiver) { if (typeof Reflect !== "undefined" && Reflect.get) { _get = Reflect.get; } else { _get = function _get(target, property, receiver) { var base = _superPropBase(target, property); if (!base) return; var desc = Object.getOwnPropertyDescriptor(base, property); if (desc.get) { return desc.get.call(receiver); } return desc.value; }; } return _get(target, property, receiver || target); }

function _superPropBase(object, property) { while (!Object.prototype.hasOwnProperty.call(object, property)) { object = _getPrototypeOf(object); if (object === null) break; } return object; }

function _getPrototypeOf(o) { _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf : function _getPrototypeOf(o) { return o.__proto__ || Object.getPrototypeOf(o); }; return _getPrototypeOf(o); }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function"); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, writable: true, configurable: true } }); if (superClass) _setPrototypeOf(subClass, superClass); }

function _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf || function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }

var defaultTo = require('lodash/defaultTo');

var WebGLTileRenderer = require('../WebGLTileRenderer'); // Constants

/**
 * Numver of vertices supported per chunk.
 * @private
 * @constant {number}
 */


var CHUNK_SIZE = 128 * 128;
/**
 * Shader GLSL source.
 * @private
 * @constant {Object}
 */

var SHADER_GLSL = {
  vert: "\n\t\tprecision highp float;\n\t\tattribute vec2 aPosition;\n\t\tattribute float aRadius;\n\t\tuniform vec2 uTileOffset;\n\t\tuniform float uScale;\n\t\tuniform float uPixelRatio;\n\t\tuniform mat4 uProjectionMatrix;\n\t\tvoid main() {\n\t\t\tvec2 wPosition = (aPosition * uScale) + uTileOffset;\n\t\t\tgl_PointSize = aRadius * 2.0 * uPixelRatio;\n\t\t\tgl_Position = uProjectionMatrix * vec4(wPosition, 0.0, 1.0);\n\t\t}\n\t\t",
  frag: "\n\t\t#ifdef GL_OES_standard_derivatives\n\t\t\t#extension GL_OES_standard_derivatives : enable\n\t\t#endif\n\t\tprecision highp float;\n\t\tuniform vec4 uColor;\n\t\tvoid main() {\n\t\t\tvec2 cxy = 2.0 * gl_PointCoord - 1.0;\n\t\t\tfloat radius = dot(cxy, cxy);\n\t\t\tfloat alpha = 1.0;\n\t\t\t#ifdef GL_OES_standard_derivatives\n\t\t\t\tfloat delta = fwidth(radius);\n\t\t\t\talpha = 1.0 - smoothstep(1.0 - delta, 1.0 + delta, radius);\n\t\t\t#else\n\t\t\t\tif (radius > 1.0) {\n\t\t\t\t\tdiscard;\n\t\t\t\t}\n\t\t\t#endif\n\t\t\tgl_FragColor = vec4(uColor.rgb, uColor.a * alpha);\n\t\t}\n\t\t"
};
/**
 * Class representing a webgl point tile renderer.
 */

var PointTileRenderer =
/*#__PURE__*/
function (_WebGLTileRenderer) {
  _inherits(PointTileRenderer, _WebGLTileRenderer);

  /**
   * Instantiates a new PointTileRenderer object.
   *
   * @param {Object} options - The options object.
   * @param {Array} options.color - The color of the points.
   */
  function PointTileRenderer() {
    var _this;

    var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

    _classCallCheck(this, PointTileRenderer);

    _this = _possibleConstructorReturn(this, _getPrototypeOf(PointTileRenderer).call(this));
    _this.color = defaultTo(options.color, [1.0, 0.4, 0.1, 0.8]);
    _this.shader = null;
    _this.atlas = null;
    _this.ext = null;
    return _this;
  }
  /**
   * Executed when the layer is attached to a plot.
   *
   * @param {Layer} layer - The layer to attach the renderer to.
   *
   * @returns {Renderer} The renderer object, for chaining.
   */


  _createClass(PointTileRenderer, [{
    key: "onAdd",
    value: function onAdd(layer) {
      _get(_getPrototypeOf(PointTileRenderer.prototype), "onAdd", this).call(this, layer); // get the extension for standard derivatives


      this.ext = this.gl.getExtension('OES_standard_derivatives');
      this.shader = this.createShader(SHADER_GLSL);
      this.atlas = this.createVertexAtlas({
        chunkSize: CHUNK_SIZE,
        attributePointers: {
          // position
          0: {
            size: 2,
            type: 'FLOAT'
          },
          // radius
          1: {
            size: 1,
            type: 'FLOAT'
          }
        }
      });
      return this;
    }
    /**
     * Executed when the layer is removed from a plot.
     *
     * @param {Layer} layer - The layer to remove the renderer from.
     *
     * @returns {Renderer} The renderer object, for chaining.
     */

  }, {
    key: "onRemove",
    value: function onRemove(layer) {
      this.destroyVertexAtlas(this.atlas);
      this.atlas = null;
      this.shader = null;
      this.ext = null;

      _get(_getPrototypeOf(PointTileRenderer.prototype), "onRemove", this).call(this, layer);

      return this;
    }
    /**
     * The draw function that is executed per frame.
     *
     * @returns {Renderer} The renderer object, for chaining.
     */

  }, {
    key: "draw",
    value: function draw() {
      var gl = this.gl;
      var shader = this.shader;
      var atlas = this.atlas;
      var plot = this.layer.plot;
      var renderables = this.getRenderables();
      var proj = this.getOrthoMatrix(); // bind render target

      plot.renderBuffer.bind(); // clear render target

      plot.renderBuffer.clear(); // set blending func

      gl.enable(gl.BLEND);
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE); // bind shader

      shader.use(); // set global uniforms

      shader.setUniform('uProjectionMatrix', proj);
      shader.setUniform('uColor', this.color);
      shader.setUniform('uPixelRatio', plot.pixelRatio); // binds the vertex atlas

      atlas.bind(); // for each renderable

      for (var i = 0; i < renderables.length; i++) {
        var renderable = renderables[i]; // set tile uniforms

        shader.setUniform('uScale', renderable.scale);
        shader.setUniform('uTileOffset', renderable.tileOffset); // draw the points

        atlas.draw(renderable.hash, 'POINTS');
      } // unbind


      atlas.unbind(); // unbind render target

      plot.renderBuffer.unbind(); // render framebuffer to the backbuffer

      plot.renderBuffer.blitToScreen(this.layer.opacity);
      return this;
    }
  }]);

  return PointTileRenderer;
}(WebGLTileRenderer);

module.exports = PointTileRenderer;