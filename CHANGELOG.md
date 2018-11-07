# Changelog

## master

An in-progress version being developed on the `master` branch.

## 0.20.14 - Nov 7th, 2018
### Changed
- Bump dependency versions.

## 0.20.13 - June 8th, 2018
### Changed
- Bump dependency versions.
- Use `mocha` and `nyc` test / coverage CLIs directly instead of gulp wrappers.

## 0.20.12 - Apr 5th, 2018
### Fixed
- Instantiate `pixelRatio` before setting initial canvas dimensions.
### Changed
- Bump dependency versions.

## 0.20.11 - Feb 7th, 2018
### Changed
- `lumo.Plot` accepts an option `noContext` to prevent throwing an exception if no `WebGLRenderingContext` can be acquired.
- Bump dependency versions.

## 0.20.10 - Jan 26th, 2018
### Changed
- No longer throw an exception when enabling an enabled handler, or disabling disabled handler.
- Add package-lock.jon file to repo.

## 0.20.9 - Jan 16th, 2018
### Changed
- Bump dependency versions.

## 0.20.8 - Nov 27th, 2017
### Changed
- Add support for MS Edge browser for WebGL context.
- Fix incorrectly named method on `lumo.PolygonOverlay` from `clearPolylines` to `clearPolygons`.

## 0.20.7 - Nov 20th, 2017
### Changed
- Add `zoomToPosition` functionality to provide a method for zooming to a specific position.

## 0.20.6 - Oct 13th, 2017
### Changed
- Add `enablePanning`, `disablePanning`, `enableZooming`, and `disableZooming` methods to `lumo.Plot` class.

## 0.20.5 - Oct 13th, 2017
### Changed
- Expose `mouseToPlotCoord`, `mouseToViewportPixel`, `viewportPixelToPlotCoord`, and `plotCoordToViewportPixel` methods on `lumo.Plot` class.

### Fixed
- Fix `DOMHandler` enable overwrite bug.

## 0.20.4 - Oct 4th, 2017
### Fixed
- `DOMHandler` mouse position calculation updated to take into account a nested container.

## 0.20.3 - Oct 3rd, 2017
### Fixed
- Updated build files missed in previous release.

## 0.20.2 - Oct 3rd, 2017
### Fixed
- `DOMHandler` now calculates mouse position relative to container rather than relative to the page.

## 0.20.1 - June 19th, 2017
### Changed
- Fix bug `lumo.RingCollidable` class where r-tree rectangle was not expanded by halfwidth.

## 0.20.0 - June 19th, 2017
### Added
- `lumo.RingCollidable` class.

## 0.19.0 - June 9th, 2017
### Changed
- Drop `lru-cache` dependency in favor of faster implementation more suited to the TilePyramid requirements.

### Removed
- No longer export the `Browser` utility namespace.

## 0.18.0 - June 8th, 2017
### Added
- `CHANGELOG.md` to help track changes and ease version migration.
- `lumo.PolygonOverlay` and `lumo.PolygonOverlayRenderer` classes.
- `lumo.Bounds.clipPolyline` method for clipping polygons.
- `lumo.IndexBuffer` class for drawing `lumo.VertexBuffer` objects using indices.

### Changed
- `lumo.Bounds.clipLine` now accepts a two component array of points rather than two separate arguments.
- `lumo.Bounds` clip methods return `null` if arguments are outside of the bounds.
- `lumo.LineOverlay` and `lumo.LineOverlayRenderer` renamed to  `lumo.PolylineOverlay` and `lumo.PolylineOverlayRenderer`.
