---
id: opening-files
title: Opening FIT Files
sidebar_label: 📂 Opening Files
sidebar_position: 1
description: How to open and manage FIT files in FitFileViewer.
---

# Opening FIT Files

Learn how to open FIT files and manage your activities in FitFileViewer.

## Opening Methods

### 🖱️ Drag and Drop

The easiest way to open a file:

1. Open FitFileViewer
2. Drag your `.fit` file from your file explorer
3. Drop it anywhere in the application window
4. The file loads automatically

### 📁 File Menu

Use the traditional file menu:

1. Click **File** in the menu bar
2. Select **Open FIT File**
3. Navigate to your file location
4. Select the file and click **Open**

### ⌨️ Keyboard Shortcut

Quick keyboard access:

- **Windows/Linux**: `Ctrl + O`
- **macOS**: `Cmd + O`

### 📋 Recent Files

Access recently opened files:

1. Click **File** in the menu bar
2. View the **Recent Files** list
3. Click any file to reopen it

## Where to Find FIT Files

### Garmin Devices

When connected via USB:
```
/Garmin/Activities/
```

Common locations after sync:
- **Garmin Express**: `~/Garmin/<Device>/Activities/`
- **Garmin Connect**: Export from the web app

### Export from Services

Most fitness platforms allow FIT exports:

| Platform | Export Method |
|----------|--------------|
| Garmin Connect | Activity → Gear icon → Export Original |
| Strava | Activity → ⋮ → Export GPX/FIT |
| TrainingPeaks | File → Export |

## Supported File Types

| Extension | Format | Support |
|-----------|--------|---------|
| `.fit` | Garmin FIT | ✅ Full |
| `.FIT` | Garmin FIT (uppercase) | ✅ Full |

:::note
FitFileViewer currently only supports FIT files. GPX, TCX, and other formats are not supported.
:::

## File Validation

When opening a file, FitFileViewer:

1. **Validates the format** - Ensures it's a valid FIT file
2. **Parses the data** - Extracts records, laps, and sessions
3. **Processes GPS data** - Prepares map visualization
4. **Calculates statistics** - Generates summary metrics

### Error Messages

| Error | Cause | Solution |
|-------|-------|----------|
| "Invalid FIT file" | Corrupted or wrong format | Re-export or get new file |
| "No GPS data" | Indoor activity | Map tab won't show route |
| "File too large" | Very long activity | Wait for processing |

## File Size Guidelines

| File Size | Typical Content | Load Time |
|-----------|----------------|-----------|
| < 5 MB | 1-2 hour activity | Instant |
| 5-20 MB | Long ride/run | 1-3 seconds |
| 20-50 MB | Ultra event | 3-10 seconds |
| 50+ MB | Multi-day event | 10+ seconds |

## Best Practices

1. **Keep original files** - Don't modify your FIT files
2. **Organize by date** - Create folders by year/month
3. **Back up regularly** - FIT files are your fitness history
4. **Use descriptive names** - Rename for easy identification

---

**Next:** [Understanding the Interface →](/docs/user-guide/interface)
