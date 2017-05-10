'use strict';

const assert = require('assert');
const sinon = require('sinon');
const TileLayer = require('../../../src/layer/tile/TileLayer');
const Renderer = require('../../../src/renderer/Renderer');

const noop = function() {};

describe('TileLayer', () => {

	let plot;
	let renderer;

	beforeEach(() => {
		plot = {
			getTargetVisibleCoords: () => {
				return [];
			},
			getTargetViewportCenter: function() {
				return {
					x: 0.5,
					y: 0.5
				};
			},
			setDirty: function() {

			}
		};
		renderer = new Renderer();
	});

	describe('#constructor()', () => {
		it('should accept no argument', () => {
			const layer = new TileLayer();
			assert(layer.getOpacity() === 1.0);
			assert(layer.isHidden() === false);
			assert(layer.getZIndex() === 0);
			assert(layer.isMuted() === false);
			assert(layer.getRenderer() === null);
		});
		it('should accept an optional `options` argument', () => {
			const layer = new TileLayer({
				opacity: 0.123,
				hidden: true,
				zIndex: 4,
				muted: true,
				renderer: null
			});
			assert(layer.getOpacity() === 0.123);
			assert(layer.isHidden() === true);
			assert(layer.getZIndex() === 4);
			assert(layer.isMuted() === true);
			assert(layer.getRenderer() === null);
		});
	});

	describe('#refresh()', () => {
		it('should call `clear` on the layer\'s tile pyramid', () => {
			const layer = new TileLayer();
			const clear = sinon.stub(layer.pyramid, 'clear').callsFake(noop);
			layer.refresh();
			assert(clear.calledOnce);
		});
		it('should call `requestTiles` if the layer is attached to a plot', () => {
			const layer = new TileLayer();
			const requestTiles = sinon.stub(layer, 'requestTiles').callsFake(noop);
			sinon.stub(layer.pyramid, 'requestTiles').callsFake(noop);
			layer.onAdd(plot);
			layer.refresh();
			assert(requestTiles.called);
		});
		it('should call `clear` on the renderer if the layer is attached to a plot', () => {
			const layer = new TileLayer();
			layer.setRenderer(renderer);
			sinon.stub(layer, 'requestTiles').callsFake(noop);
			sinon.stub(layer.pyramid, 'requestTiles').callsFake(noop);
			const clear = sinon.stub(layer.renderer, 'clear').callsFake(noop);
			layer.onAdd(plot);
			layer.refresh();
			assert(clear.called);
		});
	});

	describe('#onAdd()', () => {
		it('should call `onAdd` of the attached renderer', () => {
			const layer = new TileLayer({
				renderer: renderer
			});
			sinon.stub(layer, 'refresh').callsFake(noop);
			const onAdd = sinon.stub(renderer, 'onAdd').callsFake(noop);
			layer.onAdd(plot);
			assert(onAdd.calledOnce);
		});
	});

	describe('#onRemove()', () => {
		it('should call `clear` on the layer\'s tile pyramid', () => {
			const layer = new TileLayer({
				renderer: renderer
			});
			sinon.stub(layer, 'refresh').callsFake(noop);
			const clear = sinon.stub(layer.pyramid, 'clear').callsFake(noop);
			layer.onAdd(plot);
			layer.onRemove(plot);
			assert(clear.calledOnce);
		});
		it('should call `onRemove` of the attached renderer', () => {
			const layer = new TileLayer({
				renderer: renderer
			});
			sinon.stub(layer, 'refresh').callsFake(noop);
			const onRemove = sinon.stub(renderer, 'onRemove').callsFake(noop);
			layer.onAdd(plot);
			layer.onRemove(plot);
			assert(onRemove.calledOnce);
		});
	});

	describe('#mute()', () => {
		it('should set the `muted` property to true', () => {
			const layer = new TileLayer();
			layer.mute();
			assert(layer.muted === true);
		});
	});

	describe('#unmute()', () => {
		it('should set the `muted` property to false', () => {
			const layer = new TileLayer();
			layer.unmute();
			assert(layer.muted === false);
		});
		it('should called `requestTiles` if the layer is attached to a plot and the layer was previously muted', () => {
			const layer = new TileLayer();
			const requestTiles = sinon.stub(layer, 'requestTiles').callsFake(noop);
			layer.onAdd(plot);
			layer.mute();
			layer.unmute();
			assert(layer.muted === false);
			assert(requestTiles.called);
		});
	});

	describe('#isMuted()', () => {
		it('should return true if the layer is muted', () => {
			const layer = new TileLayer();
			layer.mute();
			assert(layer.isMuted() === true);
		});
		it('should return false if the layer is not muted', () => {
			const layer = new TileLayer();
			layer.unmute();
			assert(layer.isMuted() === false);
		});
	});

	describe('#disable()', () => {
		it('should set the `hidden` and `muted` properties to true', () => {
			const layer = new TileLayer();
			layer.disable();
			assert(layer.isHidden() === true);
			assert(layer.muted === true);
		});
	});

	describe('#enable()', () => {
		it('should set the `hidden` and `muted` properties to false', () => {
			const layer = new TileLayer();
			layer.enable();
			assert(layer.isHidden() === false);
			assert(layer.muted === false);
		});
	});

	describe('#isDisabled()', () => {
		it('should return true if the layer is hidden and muted', () => {
			const layer = new TileLayer();
			layer.disable();
			assert(layer.isDisabled() === true);
		});
		it('should return false if the layer is not hidden', () => {
			const layer = new TileLayer();
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
			const layer = new TileLayer();
			layer.mute();
			layer.requestTile(null, (a, b) => {
				assert(a === null);
				assert(b === null);
			});
		});
	});

	describe('#requestTiles()', () => {
		it('should do nothing if the layer is muted', () => {
			const layer = new TileLayer();
			layer.mute();
			layer.requestTiles([]);
		});
		it('should call `requestTiles` on the layer\'s tile pyramid if the layer is not muted', () => {
			const layer = new TileLayer();
			const requestTiles = sinon.stub(layer.pyramid, 'requestTiles').callsFake(noop);
			layer.requestTiles([]);
			assert(requestTiles.calledOnce);
		});
	});

});
