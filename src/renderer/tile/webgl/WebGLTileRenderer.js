'use strict';

const defaultTo = require('lodash/defaultTo');
const EventType = require('../../../event/EventType');
const Shader = require('../../../webgl/shader/Shader');
const TextureArray = require('../../../webgl/texture/TextureArray');
const VertexAtlas = require('../../../webgl/vertex/VertexAtlas');
const TileRenderer = require('../TileRenderer');

// Constants

/**
 * Tile add handler symbol.
 * @private
 * @constant {Symbol}
 */
const TILE_ADD = Symbol();

/**
 * Tile remove handler symbol.
 * @private
 * @constant {Symbol}
 */
const TILE_REMOVE = Symbol();

// Private Methods

const addTileToTextureArray = function(array, tile) {
	array.set(tile.coord.hash, tile.data);
};

const removeTileFromTextureArray = function(array, tile) {
	array.delete(tile.coord.hash);
};

const addTileToVertexAtlas = function(atlas, tile) {
	atlas.set(
		tile.coord.hash,
		tile.data,
		tile.data.length / atlas.stride);
};

const removeTileFromVertexAtlas = function(atlas, tile) {
	atlas.delete(tile.coord.hash);
};

/**
 * Class representing a webgl tile renderer.
 */
class WebGLTileRenderer extends TileRenderer {

	/**
	 * Instantiates a new WebGLTileRenderer object.
	 */
	constructor() {
		super();
		this.gl = null;
		this[TILE_ADD] = new Map();
		this[TILE_REMOVE] = new Map();
	}

	/**
	 * Executed when the layer is attached to a plot.
	 *
	 * @param {Layer} layer - The layer to attach the renderer to.
	 *
	 * @returns {WebGLTileRenderer} The renderer object, for chaining.
	 */
	onAdd(layer) {
		super.onAdd(layer);
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
	onRemove(layer) {
		this.gl = null;
		super.onRemove(layer);
		return this;
	}
	
	/**
	 * Returns the orthographic projection matrix for the viewport.
	 *
	 * @returns {Float32Array} The orthographic projection matrix.
	 */
	getOrthoMatrix() {
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
	createShader(source) {
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
	createTextureArray(options = {}) {
		// create texture array
		const array = new TextureArray(
			this.gl,
			{
				// set texture params
				format: options.format,
				type: options.type,
				filter: options.filter,
				invertY: options.invertY,
				premultiplyAlpha: options.premultiplyAlpha
			},
			{
				// set num chunks to be able to fit the capacity of the pyramid
				numChunks: this.layer.pyramid.getCapacity(),
				chunkSize: options.chunkSize
			});
		// create handlers
		const onAdd = defaultTo(options.onAdd, addTileToTextureArray);
		const onRemove = defaultTo(options.onRemove, removeTileFromTextureArray);
		const add = event => {
			onAdd(array, event.tile);
		};
		const remove = event => {
			onRemove(array, event.tile);
		};
		// attach handlers
		this.layer.on(EventType.TILE_ADD, add);
		this.layer.on(EventType.TILE_REMOVE, remove);
		// store the handlers under the array
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
	destroyTextureArray(array) {
		// detach handlers
		this.layer.removeListener(EventType.TILE_ADD, this[TILE_ADD].get(array));
		this.layer.removeListener(EventType.TILE_REMOVE, this[TILE_REMOVE].get(array));
		// remove handlers
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
	createVertexAtlas(options = {}) {
		// create vertex atlas
		const atlas = new VertexAtlas(
			this.gl,
			options.attributePointers,
			{
				// set num chunks to be able to fit the capacity of the pyramid
				numChunks: this.layer.pyramid.getCapacity(),
				chunkSize: options.chunkSize
			});
		// create handlers
		const onAdd = defaultTo(options.onAdd, addTileToVertexAtlas);
		const onRemove = defaultTo(options.onRemove, removeTileFromVertexAtlas);
		const add = event => {
			onAdd(atlas, event.tile);
		};
		const remove = event => {
			onRemove(atlas, event.tile);
		};
		// attach handlers
		this.layer.on(EventType.TILE_ADD, add);
		this.layer.on(EventType.TILE_REMOVE, remove);
		// store the handlers under the atlas
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
	destroyVertexAtlas(atlas) {
		// detach handlers
		this.layer.removeListener(EventType.TILE_ADD, this[TILE_ADD].get(atlas));
		this.layer.removeListener(EventType.TILE_REMOVE, this[TILE_REMOVE].get(atlas));
		// remove handlers
		this[TILE_ADD].delete(atlas);
		this[TILE_REMOVE].delete(atlas);
	}
}

module.exports = WebGLTileRenderer;
