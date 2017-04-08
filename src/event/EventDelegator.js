'use strict';

const EventType = require('./EventType');
const ClickEvent = require('./ClickEvent');
const MouseEvent = require('./MouseEvent');
const Keyboard = require('../core/Keyboard');

const setCursor = function(plot) {
	plot.getContainer().style.cursor = 'pointer';
};

const resetCursor = function(plot) {
	plot.getContainer().style.cursor = 'inherit';
};

const select = function(child, collision) {
	const multiSelect = Keyboard.poll('ctrl') || Keyboard.poll('meta');
	// add to collection if multi-selection is enabled
	if (multiSelect) {
		// add to collection if multi-selection is enabled
		const index = child.selected.indexOf(collision);
		if (index === -1) {
			// select point
			child.selected.push(collision);
		} else {
			// remove point if already selected
			child.selected.splice(index, 1);
		}
	} else {
		// clear selection, adding only the latest entry
		child.selected = [ collision ];
	}
};

const unselect = function(child) {
	const multiSelect = Keyboard.poll('ctrl') || Keyboard.poll('meta');
	if (multiSelect) {
		// if multi-select is held, don't clear selection, it implies user
		// may have misclicked
		return;
	}
	// flag as unselected
	child.selected = [];
};

const highlight = function(child, collision) {
	child.highlighted = collision;
};

const unhighlight = function(child) {
	child.highlighted = null;
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

			// un-highlight
			unhighlight(prev.target);

			// `mouseout` on previous target
			delegations.push({
				type: EventType.MOUSE_OUT,
				event: new MouseEvent(
					prev.target,
					prev.pos,
					null,
					prev.data)
			});
			// unflag as prev `mouseover` target
			delegator.prevMouseover = null;
		}

	} else {
		// collision

		// check for prev
		if (prev && prev.data !== collision) {
			// un-highlight
			unhighlight(prev.target);
			// `mouseout` on previous target
			delegations.push({
				type: EventType.MOUSE_OUT,
				event: new MouseEvent(
					prev.target,
					prev.pos,
					null,
					prev.data)
			});
		}

		// `mousemove` on current target
		delegations.push({
			type: EventType.MOUSE_MOVE,
			event: new MouseEvent(
				child,
				event.pos,
				null,
				collision)
		});

		// set cursor for hover
		setCursor(delegator.plot);

		// highlight
		highlight(child, collision);

		if (!prev || prev.data !== collision) {
			// `mouseover` on current
			delegations.push({
				type: EventType.MOUSE_OVER,
				event: new MouseEvent(
					child,
					event.pos,
					null,
					collision)
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
			event: new MouseEvent(
				child,
				event.pos,
				event.button,
				collision)
		}];
	}
	return [];
};

const delegateMouseDown = function(delegator, child, event, collision) {
	if (collision) {
		return [{
			type: EventType.MOUSE_DOWN,
			event: new MouseEvent(
				child,
				event.pos,
				event.button,
				collision)
		}];
	}
	return [];
};

const delegateClick = function(delegator, child, event, collision) {
	if (collision) {
		// select
		select(child, collision);
		// `click` event
		const delegation = {
			type: EventType.CLICK,
			event: new ClickEvent(
				child,
				event.pos,
				event.button,
				collision)
		};
		// flag as prev `click` target
		delegator.prevClick = delegation.event;
		// return delegation
		return [ delegation ];
	} else {
		if (delegator.prevClick) {
			// unselect
			unselect(delegator.prevClick.target);
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
			event: new ClickEvent(
				child,
				event.pos,
				event.button,
				collision)
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
			const children = this.plot.getSortedRenderables();
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
