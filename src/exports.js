'use strict';

const EventType = require('./event/EventType');
const CollisionType = require('./geometry/CollisionType');

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
	// collision types
	CIRCLE: CollisionType.CIRCLE,
	RECTANGLE: CollisionType.RECTANGLE,
	// plot
	Plot: require('./plot/Plot'),
	// layer
	Layer: require('./layer/Layer'),
	// tile layer
	Tile: require('./layer/tile/Tile'),
	TileCoord: require('./layer/tile/TileCoord'),
	TileLayer: require('./layer/tile/TileLayer'),
	// overlay
	Overlay: require('./layer/overlay/Overlay'),
	WebGLOverlay: require('./layer/overlay/webgl/WebGLOverlay'),
	WebGLLineOverlay: require('./layer/overlay/webgl/WebGLLineOverlay'),
	WebGLPointOverlay: require('./layer/overlay/webgl/WebGLPointOverlay'),
	// render
	Renderer: require('./renderer/Renderer'),
	WebGLRenderer: require('./renderer/webgl/WebGLRenderer'),
	WebGLTextureRenderer: require('./renderer/webgl/WebGLTextureRenderer'),
	WebGLVertexRenderer: require('./renderer/webgl/WebGLVertexRenderer'),
	WebGLInteractiveRenderer: require('./renderer/webgl/WebGLInteractiveRenderer'),
	PointRenderer: require('./renderer/webgl/PointRenderer'),
	ShapeRenderer: require('./renderer/webgl/ShapeRenderer'),
	TextureRenderer: require('./renderer/webgl/TextureRenderer'),
	InteractiveRenderer: require('./renderer/webgl/InteractiveRenderer'),
	// webgl shader
	Shader: require('./webgl/shader/Shader'),
	// webgl texture
	Texture: require('./webgl/texture/Texture'),
	TextureArray: require('./webgl/texture/TextureArray'),
	// webgl vertex
	VertexAtlas: require('./webgl/vertex/VertexAtlas'),
	VertexBuffer: require('./webgl/vertex/VertexBuffer'),
	// util
	Browser: require('./util/Browser'),
	Keyboard: require('./util/Keyboard'),
	loadBuffer: require('./util/loadBuffer'),
	loadImage: require('./util/loadImage')
};
