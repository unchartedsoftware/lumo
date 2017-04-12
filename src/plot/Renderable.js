'use strict';

const clamp = require('lodash/clamp');
const defaultTo = require('lodash/defaultTo');
const EventEmitter = require('events');

/**
 * Class representing an renderable component.
 */
class Renderable extends EventEmitter {

	/**
	 * Instantiates a new Renderable object.*
	 *
	 * @param {Object} options - The options.
	 * @param {Number} options.opacity - The opacity.
	 * @param {Number} options.zIndex - The z-index.
	 */
	constructor(options = {}) {
		super();
		this.opacity = defaultTo(options.opacity, 1.0);
		this.hidden = defaultTo(options.hidden, false);
		this.zIndex = defaultTo(options.zIndex, 0);
		this.highlighted = null;
		this.selected = [];
		this.plot = null;
	}

	/**
	 * Executed when the renderable is attached to a plot.
	 *
	 * @param {Plot} plot - The plot to attach the renderable to.
	 *
	 * @returns {Renderable} The renderable object, for chaining.
	 */
	onAdd(plot) {
		if (!plot) {
			throw 'No plot argument provided';
		}
		// set plot
		this.plot = plot;
		return this;
	}

	/**
	 * Executed when the renderable is removed from a plot.
	 *
	 * @param {Plot} plot - The plot to remove the renderable from.
	 *
	 * @returns {Renderable} The renderable object, for chaining.
	 */
	onRemove(plot) {
		if (!plot) {
			throw 'No plot argument provided';
		}
		// remove plot
		this.plot = null;
		// clear state
		this.clear();
		return this;
	}
	/**
	 * Set the opacity of the renderable.
	 *
	 * @param {Number} opacity - The opacity to set.
	 *
	 * @returns {Renderable} The renderable object, for chaining.
	 */
	setOpacity(opacity) {
		this.opacity = clamp(opacity, 0, 1);
		return this;
	}

	/**
	 * Get the opacity of the renderable.
	 *
	 * @returns {Number} The opacity of the renderable object,.
	 */
	getOpacity() {
		return this.opacity;
	}

	/**
	 * Set the z-index of the renderable.
	 *
	 * @param {Number} zIndex - The z-index to set.
	 *
	 * @returns {Renderable} The renderable object, for chaining.
	 */
	setZIndex(zIndex) {
		this.zIndex = zIndex;
		return this;
	}

	/**
	 * Get the z-index of the renderable.
	 *
	 * @returns {Number} The zIndex of the renderable object,.
	 */
	getZIndex() {
		return this.zIndex;
	}

	/**
	 * Make the renderable visible.
	 *
	 * @returns {Renderable} The renderable object, for chaining.
	 */
	show() {
		this.hidden = false;
		return this;
	}

	/**
	 * Make the renderable invisible.
	 *
	 * @returns {Renderable} The renderable object, for chaining.
	 */
	hide() {
		this.hidden = true;
		this.clear();
		return this;
	}

	/**
	 * Returns true if the renderable is hidden.
	 *
	 * @returns {boolean} Whether or not the renderable is hidden.
	 */
	isHidden() {
		return this.hidden;
	}

	/**
	 * The draw function that is executed per frame.
	 *
	 * @param {Number} timestamp - The frame timestamp.
	 *
	 * @returns {Renderable} The renderable object, for chaining.
	 */
	draw() {
		return this;
	}

	/**
	 * Pick a position of the renderable for a collision with any rendered
	 * objects.
	 *
	 * @param {Object} pos - The plot position to pick at.
	 *
	 * @returns {Object} The collision, or null.
	 */
	pick() {
		return null;
	}

	/**
	 * Highlights the provided data.
	 *
	 * @param {Object} data - The data to highlight.
	 *
	 * @returns {Renderable} The renderable object, for chaining.
	 */
	highlight(data) {
		this.highlighted = data;
		return this;
	}

	/**
	 * Clears any current highlight.
	 *
	 * @returns {Renderable} The renderable object, for chaining.
	 */
	unhighlight() {
		this.highlighted = null;
		return this;
	}

	/**
	 * Returns any highlighted data.
	 *
	 * @returns {Object} The highlighted data.
	 */
	getHighlight() {
		return this.highlighted;
	}

	/**
	 * Returns true if the provided argument is highlighted.
	 *
	 * @returns {Object} The data to test.
	 *
	 * @returns {boolean} Whether or not there is highlighted data.
	 */
	isHighlighted(data) {
		return this.highlighted === data;
	}

	/**
	 * Selects the provided data.
	 *
	 * @param {Object} data - The data to select.
	 * @param {Object} multiSelect - Whether mutli-select is enabled.
	 *
	 * @returns {Renderable} The renderable object, for chaining.
	 */
	select(data, multiSelect) {
		if (multiSelect) {
			// add to collection if multi-selection is enabled
			const index = this.selected.indexOf(data);
			if (index === -1) {
				// select point
				this.selected.push(data);
			} else {
				// remove point if already selected
				this.selected.splice(index, 1);
			}
		} else {
			// clear selection, adding only the latest entry
			this.selected = [ data ];
		}
		return this;
	}

	/**
	 * Clears any current selection.
	 *
	 * @returns {Renderable} The renderable object, for chaining.
	 */
	unselect() {
		this.selected = [];
		return this;
	}

	/**
	 * Returns any selected data.
	 *
	 * @returns {Object} The selected data.
	 */
	getSelected() {
		return this.selected;
	}

	/**
	 * Returns true if the provided argument is selected.
	 *
	 * @returns {Object} The data to test.
	 *
	 * @returns {boolean} Whether or not there is highlighted data.
	 */
	isSelected(data) {
		return this.selected.indexOf(data) !== -1;
	}

	/**
	 * Clears any persisted state in the renderable.
	 *
	 * @returns {Renderable} The renderable object, for chaining.
	 */
	clear() {
		// clear selected / highlighted
		this.highlighted = null;
		this.selected = [];
		return this;
	}
}

module.exports = Renderable;
