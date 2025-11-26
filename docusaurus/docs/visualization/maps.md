---
id: maps
title: Interactive Maps
sidebar_label: 🗺️ Maps
sidebar_position: 1
description: Using the interactive map features in FitFileViewer.
---

# Interactive Maps

FitFileViewer provides powerful map visualization using Leaflet.js.

## Overview

The Map tab displays your GPS route with:
- Interactive route visualization
- Multiple map layer options
- Lap and waypoint markers
- Measurement tools
- Elevation profile

## Map Controls

### Zoom

| Method | Action |
|--------|--------|
| Mouse wheel | Scroll up/down |
| Buttons | Click +/- |
| Keyboard | `+` or `-` keys |
| Double-click | Zoom to point |

### Pan

- Click and drag the map
- Use arrow keys
- Click mini-map to jump

### Reset View

- Double-click to zoom to point
- Use "Fit to route" button
- Press `Home` key

## Map Layers

Click the layers button (🗂️) to choose:

| Layer | Description | Best For |
|-------|-------------|----------|
| OpenStreetMap | Detailed street map | Urban routes |
| Satellite | Aerial imagery | Trail visualization |
| Terrain | Elevation shading | Mountain activities |
| Dark | Dark-themed map | Night viewing |

## Route Display

### Route Line

Your GPS track is shown as a colored line:
- **Green section**: Start of route
- **Blue section**: Middle of route
- **Red section**: End of route

### Markers

| Marker | Color | Meaning |
|--------|-------|---------|
| Start | 🟢 Green | Activity start point |
| End | 🔴 Red | Activity end point |
| Laps | 🔵 Blue | Lap split points |

### Hover Information

Mouse over the route to see:
- Distance from start
- Elapsed time
- Current speed
- Elevation

## Tools

### Measurement Tool

Measure distances on the map:

1. Click the measure button (📏)
2. Click points on the map
3. See distance between points
4. Double-click to finish

### Fullscreen

Expand map to full window:
- Click fullscreen button (⛶)
- Press `F11`
- Click again to exit

### Mini Map

A small overview map in the corner:
- Shows your location on larger area
- Click to navigate
- Can be collapsed

## Customization

### Route Colors

The route automatically uses colors based on:
- Speed (faster = warmer colors)
- Heart rate zones
- Elevation changes

### Map Style

Match your theme:
- Light theme → Standard map
- Dark theme → Dark map style

## Performance Tips

### Large Routes

For activities with many GPS points:
- Zoom in for detail
- Use route simplification
- Give time for initial render

### Offline Maps

Previously viewed areas are cached:
- Works offline for cached areas
- Blank tiles for new areas offline

## Common Issues

### No Route Displayed

**Causes:**
- Indoor activity (no GPS)
- GPS data not recorded
- File parsing error

**Solutions:**
- Check if activity has GPS data
- Try reloading file
- Verify FIT file isn't corrupted

### Slow Map Loading

**Causes:**
- Large activity file
- Slow internet for tiles
- Many map layers

**Solutions:**
- Wait for initial load
- Zoom to specific area
- Use cached tiles

### Inaccurate Route

**Causes:**
- Poor GPS signal during activity
- Indoor/tunnel sections
- Device GPS issues

**Note:** FitFileViewer displays the data as recorded. GPS accuracy depends on your device.

---

**Related:** [Charts](/docs/visualization/charts) | [Tables](/docs/visualization/tables)
