---
id: interface
title: User Interface
sidebar_label: 🖥️ Interface
sidebar_position: 2
description: Understanding the FitFileViewer user interface and navigation.
---

# User Interface

A complete guide to the FitFileViewer interface and navigation.

## Main Window Layout

```
┌─────────────────────────────────────────────────────────────┐
│ File  Edit  View  Tools  Window  Help          [ _ □ × ]    │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  [Map] [Charts] [Tables] [Summary]              [🌙 Theme]  │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│                    CONTENT AREA                             │
│               (Selected tab content)                        │
│                                                             │
│                                                             │
│                                                             │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│ Status: Ready                           📄 filename.fit     │
└─────────────────────────────────────────────────────────────┘
```

## Menu Bar

### File Menu

| Item | Shortcut | Description |
|------|----------|-------------|
| Open FIT File | `Ctrl/Cmd + O` | Open file dialog |
| Recent Files | - | List of recent files |
| Reload | `Ctrl/Cmd + R` | Reload current file |
| Exit | `Alt + F4` | Close application |

### Edit Menu

| Item | Shortcut | Description |
|------|----------|-------------|
| Copy | `Ctrl/Cmd + C` | Copy selected data |
| Select All | `Ctrl/Cmd + A` | Select all items |
| Preferences | `Ctrl/Cmd + ,` | Open settings |

### View Menu

| Item | Shortcut | Description |
|------|----------|-------------|
| Toggle Theme | `Ctrl/Cmd + T` | Light/Dark mode |
| Zoom In | `Ctrl/Cmd + =` | Increase zoom |
| Zoom Out | `Ctrl/Cmd + -` | Decrease zoom |
| Fullscreen | `F11` | Toggle fullscreen |

### Tools Menu

| Item | Description |
|------|-------------|
| Measure Distance | Activate measurement tool |
| Export Data | Export current view |
| Print | Print current view |

### Help Menu

| Item | Description |
|------|-------------|
| Documentation | Open docs website |
| About | App version info |
| Report Issue | Open GitHub issues |

## Tab Navigation

### Tab Bar

The tab bar sits below the menu:

```
[🗺️ Map] [📊 Charts] [📋 Tables] [📄 Summary]
```

Click any tab to switch views, or use keyboard shortcuts:

| Tab | Shortcut |
|-----|----------|
| Map | `Ctrl/Cmd + 1` |
| Charts | `Ctrl/Cmd + 2` |
| Tables | `Ctrl/Cmd + 3` |
| Summary | `Ctrl/Cmd + 4` |

### Map Tab 🗺️

Interactive GPS route visualization:

- **Route display** - Your activity path
- **Markers** - Start, end, and lap points
- **Layer control** - Map style options
- **Zoom controls** - +/- buttons
- **Fullscreen** - Expand map view

### Charts Tab 📊

Performance data visualization:

- **Multiple charts** - Speed, HR, elevation, etc.
- **Interactive** - Zoom, pan, hover for details
- **Time selector** - Focus on specific segments

### Tables Tab 📋

Detailed data records:

- **Sortable columns** - Click headers to sort
- **Search** - Filter by text
- **Pagination** - Navigate large datasets
- **Export** - Copy as CSV

### Summary Tab 📄

Activity overview and statistics:

- **Basic info** - Date, duration, distance
- **Performance** - Speed, pace, HR zones
- **GPS info** - Coordinates, accuracy

## Theme Toggle

Located in the top-right corner:

- **☀️ Light mode** - Bright, high contrast
- **🌙 Dark mode** - Easy on the eyes

Theme preference is saved automatically.

## Status Bar

At the bottom of the window:

```
Status: File loaded successfully    📄 activity.fit    12,345 records
```

Shows:
- Current status
- Loaded filename
- Record count

## Context Menus

Right-click for context-specific options:

### On Map

- Copy coordinates
- Save map image
- Reset view

### On Charts

- Save as image
- Reset zoom
- Toggle data series

### On Tables

- Copy selection
- Copy as CSV
- Export table

## Window Controls

### Resize

Drag window edges or corners to resize.

### Fullscreen

- `F11` - Toggle fullscreen mode
- Double-click title bar - Maximize/restore

### Multi-Monitor

Drag to any monitor. Window position is remembered.

## Accessibility

### Keyboard Navigation

All features are keyboard accessible:

- `Tab` - Move between controls
- `Enter` - Activate buttons
- `Arrow keys` - Navigate within controls

### High Contrast

Works with system high contrast modes.

### Screen Readers

Basic screen reader support for navigation.

---

**Next:** [Data Visualization →](/docs/user-guide/data-visualization)
