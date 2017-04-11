'use strict';

const EventType = require('./event/EventType');
const CollisionType = require('./collision/CollisionType');

module.exports = {
	// core
	Bounds: require('./core/Bounds'),
	Browser: require('./core/Browser'),
	Coord: require('./core/Coord'),
	Tile: require('./core/Tile'),
	// event types
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
	FRAME: EventType.FRAME,
	RESIZE: EventType.RESIZE,
	TILE_REQUEST: EventType.TILE_REQUEST,
	TILE_FAILURE: EventType.TILE_FAILURE,
	TILE_ADD: EventType.TILE_ADD,
	TILE_DISCARD: EventType.TILE_DISCARD,
	TILE_REMOVE: EventType.TILE_REMOVE,
	POST_DRAW: EventType.POST_DRAW,
	// event
	EventType: require('./event/EventType'),
	Event: require('./event/Event'),
	DrawEvent: require('./event/DrawEvent'),
	MouseEvent: require('./event/MouseEvent'),
	ResizeEvent: require('./event/ResizeEvent'),
	TileEvent: require('./event/TileEvent'),
	// collision
	RTree: require('./collision/RTree.js'),
	// collision types
	CIRCLE: CollisionType.CIRCLE,
	RECTANGLE: CollisionType.RECTANGLE,
	// layer
	Layer: require('./layer/Layer'),
	// plot
	Plot: require('./plot/Plot'),
	// overlay
	Overlay: require('./overlay/Overlay'),
	WebGLOverlay: require('./overlay/webgl/WebGLOverlay'),
	WebGLLineOverlay: require('./overlay/webgl/WebGLLineOverlay'),
	WebGLPointOverlay: require('./overlay/webgl/WebGLPointOverlay'),
	// render
	Renderer: require('./renderer/Renderer'),
	// dom
	DOMRenderer: require('./renderer/dom/DOMRenderer'),
	HTMLRenderer: require('./renderer/dom/HTMLRenderer'),
	SVGRenderer: require('./renderer/dom/SVGRenderer'),
	// webgl
	WebGLRenderer: require('./renderer/webgl/WebGLRenderer'),
	WebGLTextureRenderer: require('./renderer/webgl/WebGLTextureRenderer'),
	WebGLVertexRenderer: require('./renderer/webgl/WebGLVertexRenderer'),
	WebGLInteractiveRenderer: require('./renderer/webgl/WebGLInteractiveRenderer'),
	PointRenderer: require('./renderer/webgl/PointRenderer'),
	ShapeRenderer: require('./renderer/webgl/ShapeRenderer'),
	TextureRenderer: require('./renderer/webgl/TextureRenderer'),
	InteractiveRenderer: require('./renderer/webgl/InteractiveRenderer'),
	// shader
	Shader: require('./webgl/shader/Shader'),
	// texture
	Texture: require('./webgl/texture/Texture'),
	TextureArray: require('./webgl/texture/TextureArray'),
	// vertex
	VertexAtlas: require('./webgl/vertex/VertexAtlas'),
	VertexBuffer: require('./webgl/vertex/VertexBuffer'),
	// util
	loadBuffer: require('./util/loadBuffer'),
	loadImage: require('./util/loadImage')
};
