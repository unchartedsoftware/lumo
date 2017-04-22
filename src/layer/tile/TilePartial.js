'use strict';

/**
 * Class representing a partial tile.
 */
class TilePartial {

	/**
	 * Instantiates a new TilePartial object.
	 *
	 * A TilePartial is used to render at least a portion of a missing tile at
	 * the closest available level-of-detail. There are three cases of
	 * instantiation:
	 *
	 * A) Closest available level of detail is an ancestor tile.
	 *    - The "target" tile is completely covered by a portion of the "found"
	 *      tile.
	 *    - There is no positional offset nor scaling of the "found" tile, it
	 *      will cover the "target" tile in its entirely.
	 *    - There is a uv offset to render the relevant portion of the "found"
	 *      tile.
	 *
	 * B) Closest available level of detail is a descendant tile.
	 *    - The "target" tile is partially covered by the "found" tile.
	 *    - There is a positional offset and scale of the "found" tile relative
	 *      to the "target" tile.
	 *    - There is no uv offset, the "found" tile is rendered in its entirety.
	 *
	 * C) Closest available level of detail is an ancestor of the "target", but
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
	constructor(target, tile, relative) {
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
	static fromTile(tile) {
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
	static fromAncestor(target, tile, relative) {
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
 	static fromDescendant(target, tile) {
 		return new TilePartial(target, tile, null);
 	}
}

module.exports = TilePartial;
