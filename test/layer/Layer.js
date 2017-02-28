'use strict';

const assert = require('assert');
const sinon = require('sinon');
const Layer = require('../../src/layer/Layer');
const Renderer = require('../../src/render/Renderer');

const noop = function() {};

describe('Layer', () => {

	let plot;
	let renderer;

	beforeEach(() => {
		plot = {
			getVisibleCoords: () => {
				return [];
			}
		};
		renderer = new Renderer();
	});

	describe('#constructor()', () => {
		it('should accept no argument', () => {
			const layer = new Layer();
			assert(layer.opacity === 1.0);
			assert(layer.hidden === false);
			assert(layer.muted === false);
			assert(layer.renderer === null);
		});
		it('should accept an optional `options` argument', () => {
			const layer = new Layer({
				opacity: 0.123,
				hidden: true,
				muted: true,
				renderer: null
			});
			assert(layer.opacity === 0.123);
			assert(layer.hidden === true);
			assert(layer.muted === true);
			assert(layer.renderer === null);
		});
	});

	describe('#setRenderer()', () => {
		it('should set the renderer property of the layer', () => {
			const layer = new Layer();
			layer.setRenderer(renderer);
			assert(layer.renderer === renderer);
		});
		it('should replace a previously existing renderer', () => {
			const layer = new Layer();
			const rendererA = {};
			const rendererB = {};
			layer.setRenderer(rendererA);
			layer.setRenderer(rendererB);
			assert(layer.renderer === rendererB);
		});
		it('should call `onAdd` on the renderer if the layer is attached to a plot', () => {
			const layer = new Layer();
			sinon.stub(layer, 'refresh', noop);
			layer.onAdd(plot);
			const onAdd = sinon.stub(renderer, 'onAdd', noop);
			layer.setRenderer(renderer);
			assert(onAdd.calledOnce);
		});
		it('should call `onRemove` on the previous renderer if the layer is attached to a plot', () => {
			const layer = new Layer();
			sinon.stub(layer, 'refresh', noop);
			layer.onAdd(plot);
			const onRemove = sinon.stub(renderer, 'onRemove', noop);
			layer.setRenderer(renderer);
			layer.setRenderer(new Renderer());
			assert(onRemove.calledOnce);
		});
		it('should throw an exception if no renderer is provided', () => {
			let threw = false;
			try {
				const layer = new Layer();
				layer.setRenderer();
			} catch (e) {
				threw = true;
			}
			assert(threw);
		});
	});

	describe('#removeRenderer()', () => {
		it('should remove the attached renderer', () => {
			const layer = new Layer();
			layer.setRenderer(renderer);
			layer.removeRenderer();
			assert(layer.renderer === null);
		});
		it('should call `onRemove` on the attached renderer if the layer is attached to a plot', () => {
			const layer = new Layer();
			sinon.stub(layer, 'refresh', noop);
			layer.onAdd(plot);
			const onRemove = sinon.stub(renderer, 'onRemove', noop);
			layer.setRenderer(renderer);
			layer.removeRenderer();
			assert(onRemove.calledOnce);
		});
		it('should throw an exception if there is no renderer attached', () => {
			let threw = false;
			try {
				const layer = new Layer();
				layer.removeRenderer();
			} catch (e) {
				threw = true;
			}
			assert(threw);
		});
	});

	describe('#draw()', () => {
		it('should do nothing if there is no attached renderer', () => {
			const layer = new Layer();
			layer.draw();
			layer.hide();
			layer.draw();
		});
		it('should call `draw` on the attached renderer if the layer is not hidden', () => {
			const layer = new Layer();
			layer.setRenderer(renderer);
			const draw = sinon.stub(renderer, 'draw', noop);
			layer.draw();
			assert(draw.calledOnce);
		});
		it('should call `clear` on the attached renderer if the layer is hidden', () => {
			const layer = new Layer();
			layer.hide();
			layer.setRenderer(renderer);
			const clear = sinon.stub(renderer, 'clear', noop);
			layer.draw();
			assert(clear.calledOnce);
		});
	});

	describe('#refresh()', () => {
		it('should call `clear` on the layer\'s tile pyramid', () => {
			const layer = new Layer();
			const clear = sinon.stub(layer.pyramid, 'clear', noop);
			layer.refresh();
			assert(clear.calledOnce);
		});
		it('should call `requestTiles` if the layer is attached to a plot', () => {
			const layer = new Layer();
			const requestTiles = sinon.stub(layer, 'requestTiles', noop);
			sinon.stub(layer.pyramid, 'requestTiles', noop);
			layer.onAdd(plot);
			layer.refresh();
			assert(requestTiles.called);
		});
		it('should call `clear` on the renderer if the layer is attached to a plot', () => {
			const layer = new Layer();
			layer.setRenderer(renderer);
			sinon.stub(layer, 'requestTiles', noop);
			sinon.stub(layer.pyramid, 'requestTiles', noop);
			const clear = sinon.stub(layer.renderer, 'clear', noop);
			layer.onAdd(plot);
			layer.refresh();
			assert(clear.called);
		});
	});

	describe('#onAdd()', () => {
		it('should set the plot property of the layer', () => {
			const layer = new Layer();
			sinon.stub(layer, 'refresh', noop);
			layer.onAdd(plot);
			assert(layer.plot === plot);
		});
		it('should call `refresh` to refresh the layer', () => {
			const layer = new Layer();
			const refresh = sinon.stub(layer, 'refresh', noop);
			layer.onAdd(plot);
			assert(refresh.calledOnce);
		});
		it('should call `onAdd` of the attached renderer', () => {
			const layer = new Layer({
				renderer: renderer
			});
			sinon.stub(layer, 'refresh', noop);
			const onAdd = sinon.stub(renderer, 'onAdd', noop);
			layer.onAdd(plot);
			assert(onAdd.calledOnce);
		});
		it('should throw an exception if there is no plot provided', () => {
			let threw = false;
			try {
				const layer = new Layer();
				layer.onAdd();
			} catch (e) {
				threw = true;
			}
			assert(threw);
		});
	});

	describe('#onRemove()', () => {
		it('should remove the plot property from the layer', () => {
			const layer = new Layer();

			sinon.stub(layer, 'refresh', noop);
			layer.onAdd(plot);

			const clear = sinon.stub(layer.pyramid, 'clear', noop);

			layer.onRemove(plot);
			assert(layer.plot === null);
			assert(clear.calledOnce);
		});
		it('should call `clear` on the layer\'s tile pyramid', () => {
			const layer = new Layer({
				renderer: renderer
			});
			sinon.stub(layer, 'refresh', noop);
			const clear = sinon.stub(layer.pyramid, 'clear', noop);
			layer.onAdd(plot);
			layer.onRemove(plot);
			assert(clear.calledOnce);
		});
		it('should call `onRemove` of the attached renderer', () => {
			const layer = new Layer({
				renderer: renderer
			});
			sinon.stub(layer, 'refresh', noop);
			const onRemove = sinon.stub(renderer, 'onRemove', noop);
			layer.onAdd(plot);
			layer.onRemove(plot);
			assert(onRemove.calledOnce);
		});
		it('should throw an exception if there is no plot provided', () => {
			let threw = false;
			try {
				const layer = new Layer();
				layer.onRemove();
			} catch (e) {
				threw = true;
			}
			assert(threw);
		});
	});

	describe('#show()', () => {
		it('should set the `hidden` property to false', () => {
			const layer = new Layer();
			layer.show();
			assert(layer.hidden === false);
		});
	});

	describe('#hide()', () => {
		it('should set the `hidden` property to true', () => {
			const layer = new Layer();
			layer.hide();
			assert(layer.hidden === true);
		});
	});

	describe('#isHidden()', () => {
		it('should return true if the layer is hidden', () => {
			const layer = new Layer();
			layer.hide();
			assert(layer.isHidden() === true);
		});
		it('should return false if the layer is not hidden', () => {
			const layer = new Layer();
			layer.show();
			assert(layer.isHidden() === false);
		});
	});

	describe('#mute()', () => {
		it('should set the `muted` property to true', () => {
			const layer = new Layer();
			layer.mute();
			assert(layer.muted === true);
		});
	});

	describe('#unmute()', () => {
		it('should set the `muted` property to false', () => {
			const layer = new Layer();
			layer.unmute();
			assert(layer.muted === false);
		});
		it('should called `requestTiles` if the layer is attached to a plot and the layer was previously muted', () => {
			const layer = new Layer();
			const requestTiles = sinon.stub(layer, 'requestTiles', noop);
			layer.onAdd(plot);
			layer.mute();
			layer.unmute();
			assert(layer.muted === false);
			assert(requestTiles.called);
		});
	});

	describe('#isMuted()', () => {
		it('should return true if the layer is muted', () => {
			const layer = new Layer();
			layer.mute();
			assert(layer.isMuted() === true);
		});
		it('should return false if the layer is not muted', () => {
			const layer = new Layer();
			layer.unmute();
			assert(layer.isMuted() === false);
		});
	});

	describe('#disable()', () => {
		it('should set the `hidden` and `muted` properties to true', () => {
			const layer = new Layer();
			layer.disable();
			assert(layer.hidden === true);
			assert(layer.muted === true);
		});
	});

	describe('#enable()', () => {
		it('should set the `hidden` and `muted` properties to false', () => {
			const layer = new Layer();
			layer.enable();
			assert(layer.hidden === false);
			assert(layer.muted === false);
		});
	});

	describe('#isDisabled()', () => {
		it('should return true if the layer is hidden and muted', () => {
			const layer = new Layer();
			layer.disable();
			assert(layer.isDisabled() === true);
		});
		it('should return false if the layer is not hidden', () => {
			const layer = new Layer();
			layer.show();
			layer.mute();
			assert(layer.isDisabled() === false);
			layer.hide();
			layer.unmute();
			assert(layer.isDisabled() === false);
		});
	});

	describe('#requestTiles()', () => {
		it('should execute the provided callback with two null arguments', () => {
			const layer = new Layer();
			layer.mute();
			layer.requestTile(null, (a, b) => {
				assert(a === null);
				assert(b === null);
			});
		});
	});

	describe('#requestTiles()', () => {
		it('should do nothing if the layer is muted', () => {
			const layer = new Layer();
			layer.mute();
			layer.requestTiles([]);
		});
		it('should call `requestTiles` on the layer\'s tile pyramid if the layer is not muted', () => {
			const layer = new Layer();
			const requestTiles = sinon.stub(layer.pyramid, 'requestTiles', noop);
			layer.requestTiles([]);
			assert(requestTiles.calledOnce);
		});
	});

});
