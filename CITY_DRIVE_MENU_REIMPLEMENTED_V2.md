# CITY DRIVE MENU REIMPLEMENTATION V2

- Reimplemented the first-page hero car using a new cache-busted asset: assets/city-drive-menu-supercar-v2.svg?v=20260904.
- Removed the previous first-page car asset entirely.
- Removed all CSS drop-shadows around the menu car; no extra car/shadow element sits behind it.
- First page now has one dominant transparent supercar image with restrained transform-only motion.
- Page 2 selected-vehicle image uses the exact same single car asset.
- Page 2 right-side image panel uses the exact same single car asset; no lineup/multiple-car image.
- Removed duplicate PRESENTS heading from the selection page.
- New unique CSS class names/animations prevent the old implementation from being reused by stale selectors.
- JS syntax audit: all JS files pass node --check.
- SVG XML audit: passed.
