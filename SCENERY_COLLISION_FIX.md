# CITY DRIVE — Scenery Collision Fix

Fixed solid-object collision for player vehicles.

## Objects now treated as solid
- Street-light poles
- Traffic-light poles
- Trees and palm trees
- Benches
- Banner posts
- Digital-sign posts
- Scenic arch supports
- Fountain basins
- Roadside planters/shrubs
- Existing/future building collision remains supported

## Technical fix
The world now maintains `staticColliders` separately from buildings. Player vehicle physics checks these lightweight 2D collider footprints every frame and pushes the vehicle safely outside the object on impact, reduces speed, and applies normal impact damage at meaningful speeds.

This fixes the previous behavior where scenery was visual-only and cars could pass through it.
