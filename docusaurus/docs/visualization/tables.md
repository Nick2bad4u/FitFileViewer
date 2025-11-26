---
id: tables
title: Data Tables
sidebar_label: 📋 Tables
sidebar_position: 3
description: Working with data tables in FitFileViewer.
---

# Data Tables

Explore your detailed activity data with powerful DataTables functionality.

## Overview

The Tables tab shows your raw activity data in sortable, searchable tables.

## Available Tables

### Records Table

Every data point from your activity:
- Timestamp
- GPS coordinates
- Speed/pace
- Heart rate
- Elevation
- Cadence
- Power
- And more...

### Laps Table

Summary of each lap:
- Lap number
- Start time
- Duration
- Distance
- Average speed
- Average HR
- Calories

### Sessions Table

Overall session information:
- Activity type
- Total duration
- Total distance
- Average metrics
- Device info

## Table Features

### Sorting

Click any column header to sort:
- First click: Ascending ↑
- Second click: Descending ↓
- Third click: Default order

### Searching

Use the search box to filter:
- Type to search all columns
- Instant filtering
- Clear to show all

### Pagination

Navigate large datasets:
- Choose rows per page (10, 25, 50, 100)
- Page navigation buttons
- Jump to specific page

### Column Visibility

Show/hide columns:
- Click column selector
- Toggle columns on/off
- Customize your view

## Data Export

### Copy as CSV

1. Select rows (or all)
2. Click Copy button
3. Paste into spreadsheet

### Copy Selection

1. Select specific cells
2. `Ctrl/Cmd + C`
3. Paste elsewhere

### Export to File

1. Right-click table
2. Select Export
3. Choose format (CSV)
4. Save file

## Understanding the Data

### Common Columns

| Column | Description | Unit |
|--------|-------------|------|
| timestamp | Record time | datetime |
| position_lat | Latitude | semicircles/degrees |
| position_long | Longitude | semicircles/degrees |
| distance | Cumulative distance | meters |
| speed | Current speed | m/s |
| heart_rate | Heart rate | bpm |
| altitude | Elevation | meters |
| cadence | Steps/pedals per min | rpm |
| power | Power output | watts |
| temperature | Ambient temp | celsius |

### Data Quality

Missing values shown as:
- Empty cell
- `--` or `-`
- `null`

Indicates sensor wasn't recording.

## Tips

### Finding Specific Data

1. Use search for time: "12:30"
2. Sort by column to find max/min
3. Filter to narrow results

### Analyzing Segments

1. Sort by time
2. Find segment start
3. Note values for that period

### Comparing Laps

1. Go to Laps table
2. Sort by any metric
3. Identify best/worst laps

## Performance

### Large Datasets

For activities with 10,000+ records:
- Use pagination (don't show all)
- Search to filter
- Sort loads visible page first

### Best Practices

- Start with smaller page size
- Use search to find specific data
- Export filtered data for analysis

## Common Issues

### Missing Columns

**Cause:** Data not recorded by device
**Example:** No power column without power meter

### Unusual Values

**Cause:** Sensor malfunction or GPS error
**Example:** 999 bpm heart rate = sensor error

### Slow Performance

**Cause:** Showing too many rows
**Solution:** Use pagination, filter results

---

**Related:** [Maps](/docs/visualization/maps) | [Charts](/docs/visualization/charts)
