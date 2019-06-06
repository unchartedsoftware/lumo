'use strict';

const clamp = require('lodash/clamp');
const defaultTo = require('lodash/defaultTo');
const EventEmitter = require('events');
const Event = require('../event/Event');
const EventType = require('../event/EventType');

/**
 * Class representing a layer component.
 */
class Layer extends EventEmitter {

	/**
	 * Instantiates a new Layer object.
	 *
	 * @param {object} options - The options.
	 * @param {number} options.opacity - The layer opacity.
	 * @param {number} options.zIndex - The layer z-index.
	 * @param {boolean} options.hidden - Whether or not the layer is visible.
	 */
	constructor(options = {}) {
		super();
		this.opacity = defaultTo(options.opacity, 1.0);
		this.hidden = defaultTo(options.hidden, false);
		this.zIndex = defaultTo(options.zIndex, 0);
		this.renderer = defaultTo(options.renderer, null);
		this.highlighted = null;
		this.selected = [];
		this.plot = null;
	}

	/**
	 * Executed when the layer is attached to a plot.
	 *
	 * @param {Plot} plot - The plot to attach the layer to.
	 *
	 * @returns {Layer} The layer object, for chaining.
	 */
	onAdd(plot) {
		if (!plot) {
			throw 'No plot argument provided';
		}
		// set plot
		this.plot = plot;
		// flag as dirty
		this.plot.setDirty();
		// execute renderer hook
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
	onRemove(plot) {
		if (!plot) {
			throw 'No plot argument provided';
		}
		// execute renderer hook
		if (this.renderer) {
			this.renderer.onRemove(this);
		}
		// clear state
		this.clear();
		// flag as dirty
		this.plot.setDirty();
		// remove plot
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
	setRenderer(renderer) {
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
	removeRenderer() {
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
	getRenderer() {
		return this.renderer;
	}

	/**
	 * Set the opacity of the layer.
	 *
	 * @param {number} opacity - The opacity to set.
	 *
	 * @returns {Layer} The layer object, for chaining.
	 */
	setOpacity(opacity) {
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
	getOpacity() {
		return this.opacity;
	}

	/**
	 * Set the z-index of the layer.
	 *
	 * @param {number} zIndex - The z-index to set.
	 *
	 * @returns {Layer} The layer object, for chaining.
	 */
	setZIndex(zIndex) {
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
	getZIndex() {
		return this.zIndex;
	}

	/**
	 * Make the layer visible.
	 *
	 * @returns {Layer} The layer object, for chaining.
	 */
	show() {
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
	hide() {
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
	isHidden() {
		return this.hidden;
	}

	/**
	 * Pick a position of the layer for a collision with any rendered objects.
	 *
	 * @param {object} pos - The plot position to pick at.
	 *
	 * @returns {object} The collision, or null.
	 */
	pick(pos) {
		if (this.renderer) {
			return this.renderer.pick(pos);
		}
		return null;
	}

	/**
	 * Highlights the provided data.
	 *
	 * @param {object} data - The data to highlight.
	 *
	 * @returns {Layer} The layer object, for chaining.
	 */
	highlight(data) {
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
	unhighlight() {
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
	 * @returns {object} The highlighted data.
	 */
	getHighlighted() {
		return this.highlighted;
	}

	/**
	 * Returns true if the provided argument is highlighted.
	 *
	 * @param {object} data - The data to test.
	 *
	 * @returns {boolean} Whether or not there is highlighted data.
	 */
	isHighlighted(data) {
		return this.highlighted === data;
	}

	/**
	 * Selects the provided data.
	 *
	 * @param {object} data - The data to select.
	 * @param {object} multiSelect - Whether mutli-select is enabled.
	 *
	 * @returns {Layer} The layer object, for chaining.
	 */
	select(data, multiSelect) {
		let changed = false;
		if (multiSelect) {
			// add to collection if multi-selection is enabled
			const index = this.selected.indexOf(data);
			if (index === -1) {
				// select point
				this.selected.push(data);
				changed = true;
			}
		} else {
			// clear selection, adding only the latest entry
			if (this.selected.length !== 1 || this.selected[0] !== data) {
				this.selected = [ data ];
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
	 * @param {object} data - The data to unselect.
	 *
	 * @returns {Layer} The layer object, for chaining.
	 */
	unselect(data) {
		const index = this.selected.indexOf(data);
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
	unselectAll() {
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
	getSelected() {
		return this.selected;
	}

	/**
	 * Returns true if the provided argument is selected.
	 *
	 * @param {object} data - The data to test.
	 *
	 * @returns {boolean} Whether or not the data is selected.
	 */
	isSelected(data) {
		return this.selected.indexOf(data) !== -1;
	}

	/**
	 * Draw the layer for the frame.
	 *
	 * @param {number} timestamp - The frame timestamp.
	 *
	 * @returns {Layer} The layer object, for chaining.
	 */
	draw(timestamp) {
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
	clear() {
		// clear selected / highlighted
		if (this.highlighted || this.selected.length > 0) {
			this.highlighted = null;
			this.selected = [];
		}
		// clear renderer state
		if (this.renderer) {
			this.renderer.clear();
		}
		// flag as dirty
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
	refresh() {
		// clear the layer state
		this.clear();
		// emit refresh event
		this.emit(EventType.REFRESH, new Event(this));
		return this;
	}
}

module.exports = Layer;
