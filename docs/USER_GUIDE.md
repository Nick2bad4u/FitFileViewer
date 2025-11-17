# FitFileViewer - User Guide

## 📋 Table of Contents

- [Getting Started](#getting-started)
- [Opening FIT Files](#opening-fit-files)
- [Application Interface](#application-interface)
- [Data Visualization](#data-visualization)
- [Features & Tools](#features--tools)
- [Customization & Settings](#customization--settings)
- [Export & Sharing](#export--sharing)
- [Troubleshooting](#troubleshooting)
- [Keyboard Shortcuts](#keyboard-shortcuts)

## Getting Started

### Installation

1. **Download FitFileViewer**
   - Visit the [GitHub Releases page](https://github.com/Nick2bad4u/FitFileViewer/releases/latest)
   - Choose the appropriate installer for your operating system:
     - **Windows**: `.exe` installer or portable version
     - **macOS**: `.dmg` installer or `.pkg` package
     - **Linux**: `.AppImage`, `.deb`, `.rpm`, or other package formats

2. **Install the Application**
   - **Windows**: Run the downloaded `.exe` file and follow the installation wizard
   - **macOS**: Open the `.dmg` file and drag the app to Applications folder
   - **Linux**: Run the `.AppImage` file or install using your package manager

3. **First Launch**
   - Open FitFileViewer from your applications menu or desktop shortcut
   - The application will initialize with the default interface
   - You're ready to open your first FIT file!

### System Requirements

- **Operating System**: Windows 10+, macOS 10.14+, or Linux (most distributions)
- **Memory**: 4GB RAM minimum, 8GB recommended
- **Storage**: 200MB free disk space
- **Display**: 1024x768 minimum resolution, 1920x1080 recommended

## Opening FIT Files

### Method 1: Drag & Drop

1. Open FitFileViewer
2. Drag your `.fit` file from your file manager
3. Drop it anywhere in the application window
4. The file will automatically load and display

### Method 2: File Menu

1. Click **File** in the menu bar
2. Select **Open FIT File** (or press `Ctrl+O` / `Cmd+O`)
3. Browse to your FIT file location
4. Select the file and click **Open**

### Method 3: Recent Files

1. Click **File** in the menu bar
2. Select from the **Recent Files** list
3. The file will load immediately

### Supported File Types

- **.fit files**: Primary support for Garmin FIT format
- **File size**: Up to 100MB files supported
- **Activities**: Running, cycling, swimming, hiking, and other GPS activities

## Application Interface

### Main Window Layout

```
┌─────────────────────────────────────────────────────────────┐
│ File  Edit  View  Tools  Window  Help          [ _ □ × ]    │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  [Map] [Charts] [Tables] [Summary]              [⚙️ Theme] │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│                    CONTENT AREA                             │
│               (Selected tab content)                        │
│                                                             │
│                                                             │
│                                                             │
│                                                             │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│ Status: File loaded successfully    📄 activity.fit         │
└─────────────────────────────────────────────────────────────┘
```

### Tab Navigation

The application uses a tabbed interface with four main sections:

1. **Map Tab** 🗺️ - Interactive GPS route visualization
2. **Charts Tab** 📊 - Data charts and graphs
3. **Tables Tab** 📋 - Detailed data tables
4. **Summary Tab** 📄 - Activity summary and statistics

### Theme Toggle

- Click the **Theme** button (⚙️) in the top-right to switch between light and dark modes
- Theme preference is automatically saved for future sessions

## Data Visualization

### Map View (🗺️ Tab)

#### Interactive Map Features

- **GPS Track Display**: Your activity route shown as a colored line
- **Start/End Markers**: Green marker for start, red marker for end
- **Lap Markers**: Blue markers indicating lap splits
- **Elevation Profile**: Mouse over the route to see elevation data

#### Map Controls

| Control          | Function                          |
| ---------------- | --------------------------------- |
| **Zoom In/Out**  | `+` / `-` buttons or mouse wheel  |
| **Pan**          | Click and drag the map            |
| **Fullscreen**   | 📱 button for fullscreen map view |
| **Layers**       | 🗂️ button to change map style     |
| **Measure Tool** | 📏 button to measure distances    |

#### Available Map Styles

- **OpenStreetMap**: Default detailed street map
- **Satellite**: Satellite imagery view
- **Terrain**: Topographical map with elevation
- **Dark Mode**: Dark-themed map (automatically matches app theme)

### Charts View (📊 Tab)

#### Available Chart Types

1. **Speed vs Time**: Shows speed variations throughout your activity
2. **Heart Rate vs Time**: Heart rate data over time (if available)
3. **Elevation vs Distance**: Elevation profile along your route
4. **Power vs Time**: Power output data (for cycling activities)
5. **Cadence vs Time**: Step or pedal cadence data

#### Chart Interactions

- **Zoom**: Use mouse wheel to zoom in/out
- **Pan**: Click and drag to pan across the chart
- **Hover**: Mouse over data points for detailed values
- **Reset**: Double-click to reset zoom/pan

#### Chart Customization

- **Time Range**: Select specific time ranges using the range selector
- **Data Smoothing**: Toggle data smoothing for cleaner visualization
- **Units**: Charts automatically use your preferred units

### Tables View (📋 Tab)

#### Data Tables

The tables show detailed record-by-record data from your FIT file:

- **Records Table**: Every data point with timestamp, GPS, speed, etc.
- **Laps Table**: Lap summary information
- **Sessions Table**: Overall session statistics

#### Table Features

- **Sorting**: Click column headers to sort data
- **Filtering**: Use search box to filter records
- **Export**: Copy data as CSV or export to file
- **Pagination**: Navigate through large datasets

#### Column Descriptions

| Column                 | Description                      |
| ---------------------- | -------------------------------- |
| **Timestamp**          | Date and time of the data record |
| **Latitude/Longitude** | GPS coordinates                  |
| **Distance**           | Cumulative distance traveled     |
| **Speed**              | Current speed                    |
| **Heart Rate**         | Heart rate (if sensor connected) |
| **Elevation**          | Current elevation/altitude       |
| **Cadence**            | Steps per minute or pedal RPM    |

### Summary View (📄 Tab)

#### Activity Overview

The summary tab provides key statistics about your activity:

**Basic Information**

- Activity type and date
- Total duration and distance
- Average and maximum speed
- Calories burned (if available)

**Performance Metrics**

- Heart rate zones (if heart rate data available)
- Elevation gain and loss
- Average pace or speed
- Training effect (if supported by device)

**GPS Information**

- Start and end coordinates
- Total GPS points recorded
- Data recording interval
- GPS accuracy information

## Features & Tools

### File Management

#### Recent Files

- Access recently opened files from the File menu
- Files are automatically added to recent list when opened
- Clear recent files list from preferences

#### File Information

- View file metadata and creation date
- See file size and number of data records
- Check GPS data quality and completeness

### Data Export

#### Export Options

1. **CSV Export**: Export table data to CSV format
2. **GPX Export**: Convert FIT data to GPX format
3. **Chart Export**: Save charts as PNG images
4. **Print**: Print maps, charts, or summaries

#### How to Export

1. Navigate to the data you want to export (table, chart, etc.)
2. Right-click or use the File menu
3. Select the appropriate export option
4. Choose save location and filename
5. Click Save

### Measurement Tools

#### Distance Measurement

1. Open the Map tab
2. Click the Measure tool (📏)
3. Click points on the map to measure distances
4. Double-click to finish measurement
5. Measurements show in both metric and imperial units

#### Elevation Analysis

- View elevation changes along your route
- See climbing and descending statistics
- Identify steepest sections

### Data Analysis

#### Performance Analysis

- Compare different segments of your activity
- Identify best and worst performing sections
- Analyze pacing strategies

#### Route Analysis

- See detailed route information
- Identify turns, hills, and flat sections
- Compare different routes (if multiple activities loaded)

## Customization & Settings

### Preferences

Access preferences through: **Edit** > **Preferences** (Windows/Linux) or **FitFileViewer** > **Preferences** (macOS)

#### General Settings

- **Default Theme**: Choose light or dark mode
- **Units**: Select metric or imperial measurements
- **Language**: Choose interface language (if available)
- **Auto-save**: Enable/disable automatic preference saving

#### Display Settings

- **Chart Colors**: Customize chart color schemes
- **Map Style**: Set default map tile provider
- **Font Size**: Adjust interface font size
- **Animation**: Enable/disable UI animations

#### Data Settings

- **Time Format**: 12-hour or 24-hour time display
- **Date Format**: Choose date display format
- **Precision**: Set decimal places for measurements
- **Data Smoothing**: Default smoothing for noisy data

### Keyboard Shortcuts

#### File Operations

- `Ctrl+O` / `Cmd+O`: Open FIT file
- `Ctrl+R` / `Cmd+R`: Reload current file
- `Ctrl+Q` / `Cmd+Q`: Quit application

#### Navigation

- `Ctrl+1-4`: Switch between tabs (Map, Charts, Tables, Summary)
- `F11`: Toggle fullscreen
- `Ctrl+=` / `Cmd+=`: Zoom in
- `Ctrl+-` / `Cmd+-`: Zoom out

#### View Options

- `Ctrl+T` / `Cmd+T`: Toggle theme (light/dark)
- `F5`: Refresh current view
- `Ctrl+F` / `Cmd+F`: Find/search in tables

#### Tools

- `Ctrl+M` / `Cmd+M`: Activate measure tool
- `Ctrl+E` / `Cmd+E`: Export current view
- `Ctrl+P` / `Cmd+P`: Print current view

## Export & Sharing

### Supported Export Formats

#### Data Export

- **CSV**: Spreadsheet-compatible comma-separated values
- **GPX**: GPS Exchange Format for other mapping software
- **TCX**: Training Center XML format
- **JSON**: Raw data in JSON format

#### Image Export

- **PNG**: High-quality images for charts and maps
- **JPEG**: Compressed images for sharing
- **SVG**: Vector graphics for charts
- **PDF**: Print-ready documents

### Export Process

1. **Select Content**: Navigate to the tab with content you want to export
2. **Choose Export**: Right-click or use File menu > Export
3. **Select Format**: Choose appropriate file format
4. **Configure Options**: Set quality, resolution, or other format-specific options
5. **Save**: Choose filename and location, then click Save

### Sharing Tips

- **Social Media**: Export map images or charts as PNG for sharing
- **Training Analysis**: Use CSV export to analyze data in Excel or other tools
- **Backup**: Export to GPX format to preserve data in universal format
- **Printing**: Use PDF export for high-quality printed reports

## Troubleshooting

### Common Issues

#### File Won't Open

**Problem**: FIT file doesn't load or shows error message

**Solutions**:

1. Verify the file is a valid FIT file (not corrupted)
2. Check file size (very large files may take time to load)
3. Try closing other applications to free memory
4. Restart FitFileViewer and try again

#### Missing GPS Data

**Problem**: Map tab shows "No GPS data available"

**Solutions**:

1. Check if your device had GPS enabled during recording
2. Verify the activity was recorded outdoors with GPS signal
3. Some indoor activities (treadmill, trainer) don't have GPS data

#### Poor Performance

**Problem**: Application runs slowly or freezes

**Solutions**:

1. Close other applications to free system resources
2. Try loading a smaller FIT file to test
3. Check available system memory
4. Restart the application
5. Update to the latest version

#### Display Issues

**Problem**: Interface looks incorrect or text is unreadable

**Solutions**:

1. Try switching themes (light/dark)
2. Adjust system display scaling
3. Update graphics drivers
4. Restart the application

### Getting Help

#### Built-in Help

- **Help Menu**: Access help topics from the Help menu
- **Tooltips**: Hover over interface elements for quick help
- **Status Bar**: Check the bottom status bar for information

#### Online Resources

- **GitHub Issues**: Report bugs or request features
- **Documentation**: Read additional guides and tutorials
- **Community**: Join discussions with other users

#### Reporting Issues

When reporting issues, please include:

1. Your operating system and version
2. FitFileViewer version number
3. Steps to reproduce the problem
4. Any error messages displayed
5. Sample FIT file (if possible and not sensitive data)

### Frequently Asked Questions

**Q: Can I open multiple FIT files at once?**
A: Currently, FitFileViewer supports one file at a time. Close the current file before opening a new one.

**Q: Why don't I see heart rate data?**
A: Heart rate data is only available if your device recorded it. Check that your heart rate sensor was connected during the activity.

**Q: Can I edit FIT file data?**
A: FitFileViewer is a viewer application and doesn't support editing FIT data. It's designed for viewing and analyzing existing data.

**Q: What's the largest file size supported?**
A: Files up to 100MB are generally supported, but performance may vary depending on your system's available memory.

**Q: Can I use FitFileViewer offline?**
A: Yes! FitFileViewer works completely offline. Internet connection is only needed for map tiles if you haven't visited those areas before.

This user guide provides comprehensive coverage of all FitFileViewer features and functionality, helping users get the most out of their fitness data analysis experience.
