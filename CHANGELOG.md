# Changelog

## master

An in-progress version being developed on the `master` branch.

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
