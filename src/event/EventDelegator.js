'use strict';

const EventType = require('./EventType');
const MouseEvent = require('./MouseEvent');
const Keyboard = require('../core/Keyboard');

const setCursor = function(plot) {
	plot.getContainer().style.cursor = 'pointer';
};

const resetCursor = function(plot) {
	plot.getContainer().style.cursor = 'inherit';
};

const copyEvent = function(target, data, event) {
	return new MouseEvent(
		target,
		event.originalEvent,
		{ x: event.pos.x, y: event.pos.y },
		{ x: event.px.x, y: event.px.y },
		data);
};

const delegateMouseMove = function(delegator, child, event, collision) {
	// create events to delegate
	const delegations = [];
	const prev = delegator.prevMouseover;

	if (!collision) {
		//  no collision

		// check for prev
		if (prev) {

			// clear cursor style
			resetCursor(delegator.plot);

			// un-highlight previous target
			prev.target.unhighlight();

			// `mouseout` on previous target
			delegations.push({
				type: EventType.MOUSE_OUT,
				event: copyEvent(prev.target, prev.data, prev)
			});
			// unflag as prev `mouseover` target
			delegator.prevMouseover = null;
		}

	} else {
		// collision

		// check for prev
		if (prev && prev.data !== collision) {
			// un-highlight previous target
			prev.target.unhighlight();
			// `mouseout` on previous target
			delegations.push({
				type: EventType.MOUSE_OUT,
				event: copyEvent(prev.target, prev.data, prev)
			});
		}

		// `mousemove` on current target
		delegations.push({
			type: EventType.MOUSE_MOVE,
			event: copyEvent(child, collision, event)
		});

		// set cursor for hover
		setCursor(delegator.plot);

		// highlight
		child.highlight(collision);

		if (!prev || prev.data !== collision) {
			// `mouseover` on current
			delegations.push({
				type: EventType.MOUSE_OVER,
				event: copyEvent(child, collision, event)
			});
		}

		// flag as prev `mouseover` target
		delegator.prevMouseover = delegations[delegations.length-1].event;
	}

	return delegations;
};

const delegateMouseUp = function(delegator, child, event, collision) {
	if (collision) {
		return [{
			type: EventType.MOUSE_UP,
			event: copyEvent(child, collision, event)
		}];
	}
	return [];
};

const delegateMouseDown = function(delegator, child, event, collision) {
	if (collision) {
		return [{
			type: EventType.MOUSE_DOWN,
			event: copyEvent(child, collision, event)
		}];
	}
	return [];
};

const delegateClick = function(delegator, child, event, collision) {
	// check if multi-select is enabled
	const multiSelect = Keyboard.poll('ctrl') || Keyboard.poll('meta');
	if (collision) {
		// select
		child.select(collision, multiSelect);
		// `click` event
		const delegation = {
			type: EventType.CLICK,
			event: copyEvent(child, collision, event)
		};
		// flag as prev `click` target
		delegator.prevClick = delegation.event;
		// return delegation
		return [ delegation ];
	} else {
		if (delegator.prevClick) {
			if (multiSelect) {
				// if multi-select is held, don't clear selection, assume the
				// user may have misclicked
				return [];
			}
			// unselect
			delegator.prevClick.target.unselect();
			// unflag as prev `click` target
			delegator.prevClick = null;
		}
	}
	return [];
};

const delegateDblClick = function(delegator, child, event, collision) {
	if (collision) {
		return [{
			type: EventType.DBL_CLICK,
			event: copyEvent(child, collision, event)
		}];
	}
	return [];
};

const DELEGATION_FUNCS = {
	[EventType.MOUSE_MOVE]: delegateMouseMove,
	[EventType.MOUSE_UP]: delegateMouseUp,
	[EventType.MOUSE_DOWN]: delegateMouseDown,
	[EventType.CLICK]: delegateClick,
	[EventType.DBL_CLICK]: delegateDblClick,
};

/**
 * Class representing an event delegator.
 */
class EventDelegator {

	/**
	 * Instantiates a new EventDelegator object.
	 *
	 * @param {Plot} plot - The plot to attach the handler to.
	 */
	constructor(plot) {
		this.plot = plot;
		this.prevClick = null;
		this.prevMouseover = null;
	}

	/**
	 * Delegates the provided event type to all children of the plot.
	 *
	 * @param {String} type - The event type to delegate.
	 */
	delegate(type) {
		// get appropriate delegation function
		const func = DELEGATION_FUNCS[type];
		if (!func) {
			throw `Delegation for event type ${type} is not supported`;
		}
		// attach delegation handler
		this.plot.on(type, event => {
			// get children sorted by z-index
			const children = this.plot.getSortedLayers();
			// pick children, by priority
			let collision = null;
			let child = null;
			for (let i=children.length-1; i>=0; i--) {
				if (!children[i].isHidden()) {
					collision = children[i].pick(event.pos);
					if (collision) {
						child = children[i];
						break;
					}
				}
			}
			// delegate using provided func
			const delegations = func(this, child, event, collision);
			// delegate the accumulated events
			for (let i=0; i<delegations.length; i++) {
				const delegation = delegations[i];
				delegation.event.target.emit(delegation.type, delegation.event);
			}
		});
	}
}

module.exports = EventDelegator;
