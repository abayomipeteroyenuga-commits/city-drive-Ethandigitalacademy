# CITY DRIVE — First-Page Car + Page-2 Image Audit

## Implemented
- First page uses one transparent, glossy exotic sports car SVG only.
- Removed the extra CSS-built vehicle body, roof, wheels, lights and external contact shadow that could appear behind/under the image.
- Removed the contact-shadow ellipse from the SVG itself so the asset is car-only on transparency.
- Added restrained motion using transform-only CSS animation: subtle suspension/bob and tiny scale movement. No animated filters or layout properties.
- Page 2 selected-vehicle image now reuses the same single-car asset.
- Page 2 featured image/lineup area now shows exactly one car instead of the multi-car lineup artwork.
- Removed unused multi-car and previous hero SVG assets.
- Removed duplicate paint-swatch creation that was adding every color twice and creating unnecessary DOM/UI work.

## Audit checks
- All JavaScript files pass `node --check`.
- First-page and page-2 image references were audited; only `assets/first-page-supercar.svg` is used for these car-image areas.
- SVG parses successfully as XML.
- No references remain to removed `titan-x4-hero.svg`, `fictional-rides-lineup.svg`, `.showcase-car`, or `.car-shadow`.
- ZIP rebuilt from the audited working tree.
