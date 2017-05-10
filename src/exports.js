'use strict';

const EventType = require('./event/EventType');

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
	// plot
	Plot: require('./plot/Plot'),
	// layer
	Layer: require('./layer/Layer'),
	// tile layer
	TileLayer: require('./layer/tile/TileLayer'),
	// overlay layer
	Overlay: require('./layer/overlay/Overlay'),
	PointOverlay: require('./layer/overlay/PointOverlay'),
	LineOverlay: require('./layer/overlay/LineOverlay'),
	// renderer
	Renderer: require('./renderer/Renderer'),
	// tile renderer
	TileRenderer: require('./renderer/tile/TileRenderer'),
	WebGLTileRenderer: require('./renderer/tile/webgl/WebGLTileRenderer'),
	WebGLTextureTileRenderer: require('./renderer/tile/webgl/WebGLTextureTileRenderer'),
	WebGLVertexTileRenderer: require('./renderer/tile/webgl/WebGLVertexTileRenderer'),
	WebGLImageTileRenderer: require('./renderer/tile/webgl/WebGLImageTileRenderer'),
	// sample renderers
	InteractiveRenderer: require('./renderer/tile/webgl/InteractiveRenderer'),
	PointRenderer: require('./renderer/tile/webgl/PointRenderer'),
	ShapeRenderer: require('./renderer/tile/webgl/ShapeRenderer'),
	// overlay renderer
	OverlayRenderer: require('./renderer/overlay/OverlayRenderer'),
	WebGLOverlayRenderer: require('./renderer/overlay/webgl/WebGLOverlayRenderer'),
	WebGLPointOverlayRenderer: require('./renderer/overlay/webgl/WebGLPointOverlayRenderer'),
	WebGLLineOverlayRenderer: require('./renderer/overlay/webgl/WebGLLineOverlayRenderer'),
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
