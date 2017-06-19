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
