'use strict';

// Private Methods

const getUVOffset = function(ancestor, descendant) {
	const scale = 1 / Math.pow(2, descendant.z - ancestor.z);
	return [
		(descendant.x * scale) - ancestor.x,
		(descendant.y * scale) - ancestor.y,
		scale,
		scale
	];
};

/**
 * Class representing a tile renderable.
 */
class Renderable {

	/**
	 * Instantiates a new Renderable object.
	 *
	 * @param {Tile} tile - The tile data to be rendered.
	 * @param {Number} scale - The scale to render the tile at.
	 * @param {Object} tileOffset - The tile pixel offset relative to the viewport.
	 * @param {Array} uvOffset - The texture coordinate offset describing the portion of the tile to render.
	 */
	constructor(tile, scale, tileOffset, uvOffset) {
		this.tile = tile;
		this.hash = tile.coord.hash;
		this.scale = scale;
		this.tileOffset = tileOffset;
		this.uvOffset = uvOffset;
	}

	/**
	 * Instantiate a Renderable object from a specific tile.
	 *
	 * @param {Tile} tile - The tile data to be rendered.
	 * @param {TileCoord} coord - The unnormalized tile coordinate of the tile.
	 * @param {Number} scale - The scale to render the tile at.
	 * @param {Number} tileSize - The size of the tile in pixels.
	 * @param {Number} viewportOffset - The offset of the viewport in pixels.
	 */
	static fromTile(tile, coord, scale, tileSize, viewportOffset) {
		const scaledTileSize = scale * tileSize;
		const tileOffset = [
			(coord.x * scaledTileSize) - viewportOffset.x,
			(coord.y * scaledTileSize) - viewportOffset.y
		];
		return new Renderable(
			tile,
			scale,
			tileOffset,
			[ 0, 0, 1, 1 ]);
	}

	/**
	 * Instantiate a Renderable object from an ancestor of the tile.
	 *
	 * @param {Tile} tile - The tile data to be rendered.
	 * @param {TileCoord} coord - The unnormalized tile coordinate of the tile.
	 * @param {Number} scale - The scale to render the tile at.
	 * @param {Number} tileSize - The size of the tile in pixels.
	 * @param {Number} viewportOffset - The offset of the viewport in pixels.
	 * @param {TileCoord} wanted - The coordinate the tile will substitue for.
	 * @param {TileCoord} descendant - The direct descendant of the substituted tile.
	 */
	static fromAncestor(tile, coord, scale, tileSize, viewportOffset, wanted, descendant) {
		const scaledTileSize = scale * tileSize;
		const tileOffset = [ 0, 0 ];
		if (descendant === wanted) {
			// if the "wanted" tile is the same as the "descendant" of this
			// ancestor, then there is no positional offset
			tileOffset[0] = (coord.x * scaledTileSize) - viewportOffset.x;
			tileOffset[1] = (coord.y * scaledTileSize) - viewportOffset.y;
		} else {
			// if the "wanted" tile is not the same as the "descendant", we need
			// to position and scale this tile relative to the descendant
			const offsetScale = 1 / Math.pow(2, descendant.z - wanted.z);
			const offsetX = (descendant.x * offsetScale) - wanted.x;
			const offsetY = (descendant.y * offsetScale) - wanted.y;
			tileOffset[0] = ((coord.x + offsetX) * scaledTileSize) - viewportOffset.x;
			tileOffset[1] = ((coord.y + offsetY) * scaledTileSize) - viewportOffset.y;
			scale *= offsetScale;
		}
		return new Renderable(
			tile,
			scale,
			tileOffset,
			getUVOffset(tile.coord, descendant));
	}

	/**
	 * Instantiate a Renderable object from a descendant of the tile.
	 *
	 * @param {Tile} tile - The tile data to be rendered.
	 * @param {TileCoord} coord - The unnormalized tile coordinate of the tile.
	 * @param {Number} scale - The scale to render the tile at.
	 * @param {Number} tileSize - The size of the tile in pixels.
	 * @param {Number} viewportOffset - The offset of the viewport in pixels.
	 * @param {TileCoord} wanted - The coordinate the tile will substitue for.
	 */
	static fromDescendant(tile, coord, scale, tileSize, viewportOffset, wanted) {
		const scaledTileSize = scale * tileSize;
		const offsetScale = 1 / Math.pow(2, tile.coord.z - wanted.z);
		const offsetX = (tile.coord.x * offsetScale) - wanted.x;
		const offsetY = (tile.coord.y * offsetScale) - wanted.y;
		const tileOffset = [
			((coord.x + offsetX) * scaledTileSize) - viewportOffset.x,
			((coord.y + offsetY) * scaledTileSize) - viewportOffset.y
		];
		return new Renderable(
			tile,
			scale * offsetScale,
			tileOffset,
			[ 0, 0, 1, 1 ]);
	}

	/**
	 * Instantiate a Renderable object from an ancestor of the tile.
	 *
	 * @param {TilePartial} partial - The tile partial to be rendered.
	 * @param {TileCoord} coord - The unnormalized tile coordinate of the tile.
	 * @param {Number} scale - The scale to render the tile at.
	 * @param {Number} tileSize - The size of the tile in pixels.
	 * @param {Number} viewportOffset - The offset of the viewport in pixels.
	 */
	static fromAncestorPartial(partial, coord, scale, tileSize, viewportOffset) {
		const tile = partial.tile; // tile we have
		const target = partial.target; // tile we wanted
		const relative = partial.relative; // where to position the tile relative to
		const scaledTileSize = scale * tileSize;
		const tileOffset = [ 0, 0 ];
		if (relative === partial.target) {
			// if the "target" tile is the same as the "relative" of this
			// ancestor, then there is no positional offset
			tileOffset[0] = (coord.x * scaledTileSize) - viewportOffset.x;
			tileOffset[1] = (coord.y * scaledTileSize) - viewportOffset.y;
		} else {
			// if the "target" tile is not the same as the "relative", we need
			// to position and scale this tile relative to the relative
			const offsetScale = 1 / Math.pow(2, relative.z - target.z);
			const offsetX = (relative.x * offsetScale) - target.x;
			const offsetY = (relative.y * offsetScale) - target.y;
			tileOffset[0] = ((coord.x + offsetX) * scaledTileSize) - viewportOffset.x;
			tileOffset[1] = ((coord.y + offsetY) * scaledTileSize) - viewportOffset.y;
			scale *= offsetScale;
		}
		return new Renderable(
			tile,
			scale,
			tileOffset,
			getUVOffset(tile.coord, relative));
	}

	/**
	 * Instantiate a Renderable object from a descendant of the tile.
	 *
	 * @param {TilePartial} partial - The tile partial to be rendered.
	 * @param {TileCoord} coord - The unnormalized tile coordinate of the tile.
	 * @param {Number} scale - The scale to render the tile at.
	 * @param {Number} tileSize - The size of the tile in pixels.
	 * @param {Number} viewportOffset - The offset of the viewport in pixels.
	 */
	static fromDescendantPartial(partial, coord, scale, tileSize, viewportOffset) {
		const tile = partial.tile; // tile we have
		const target = partial.target; // tile we wanted
		const scaledTileSize = scale * tileSize;
		const offsetScale = 1 / Math.pow(2, tile.coord.z - target.z);
		const offsetX = (tile.coord.x * offsetScale) - target.x;
		const offsetY = (tile.coord.y * offsetScale) - target.y;
		const tileOffset = [
			((coord.x + offsetX) * scaledTileSize) - viewportOffset.x,
			((coord.y + offsetY) * scaledTileSize) - viewportOffset.y
		];
		return new Renderable(
			tile,
			scale * offsetScale,
			tileOffset,
			[ 0, 0, 1, 1 ]);
	}
}

module.exports = Renderable;
