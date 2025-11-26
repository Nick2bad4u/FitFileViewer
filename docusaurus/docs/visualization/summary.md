---
id: summary
title: Activity Summary
sidebar_label: 📄 Summary
sidebar_position: 4
description: Understanding the activity summary view in FitFileViewer.
---

# Activity Summary

The Summary tab provides a quick overview of your activity's key metrics.

## Overview

Get instant insights without navigating through detailed data.

## Summary Sections

### Basic Information

| Field | Description |
|-------|-------------|
| Activity Type | Running, Cycling, etc. |
| Date | When activity was recorded |
| Device | Recording device name |
| File Name | Original FIT filename |

### Duration & Distance

| Metric | Description |
|--------|-------------|
| Total Time | Wall clock duration |
| Moving Time | Time in motion |
| Distance | Total distance covered |
| Elapsed Time | Timer duration |

### Speed/Pace

| Metric | Description |
|--------|-------------|
| Average Speed | Mean velocity |
| Max Speed | Peak velocity |
| Average Pace | Time per distance |
| Best Pace | Fastest pace |

### Heart Rate

| Metric | Description |
|--------|-------------|
| Average HR | Mean heart rate |
| Max HR | Peak heart rate |
| Min HR | Lowest heart rate |
| HR Zones | Time in each zone |

### Elevation

| Metric | Description |
|--------|-------------|
| Elevation Gain | Total ascent |
| Elevation Loss | Total descent |
| Max Elevation | Highest point |
| Min Elevation | Lowest point |

### Calories & Energy

| Metric | Description |
|--------|-------------|
| Calories | Estimated burn |
| Avg Power | Mean watts (cycling) |
| Max Power | Peak watts |

### GPS Information

| Metric | Description |
|--------|-------------|
| Start Position | Beginning coordinates |
| End Position | Ending coordinates |
| GPS Points | Number of records |
| Recording Rate | Data frequency |

## Understanding Metrics

### Moving vs Elapsed Time

- **Moving Time**: When you were actually moving
- **Elapsed Time**: Total time from start to stop
- **Difference**: Rest stops, traffic lights, etc.

### Speed vs Pace

- **Speed**: Distance per time (km/h, mph)
- **Pace**: Time per distance (min/km, min/mi)
- Use speed for cycling, pace for running

### Heart Rate Zones

| Zone | % of Max HR | Description |
|------|-------------|-------------|
| Zone 1 | 50-60% | Recovery |
| Zone 2 | 60-70% | Aerobic base |
| Zone 3 | 70-80% | Tempo |
| Zone 4 | 80-90% | Threshold |
| Zone 5 | 90-100% | Max effort |

### Elevation Accuracy

GPS elevation can vary:
- Weather affects accuracy
- Tree cover impacts signal
- Barometric altitude more accurate

## Calculation Notes

### Average Speed

```
Average Speed = Total Distance / Moving Time
```

### Elevation Gain

Only counts uphill segments:
```
Gain = Sum of all positive elevation changes
```

### Calories

Estimated based on:
- Duration
- Heart rate (if available)
- Power (if available)
- Body weight (if configured)

## Tips

### Quick Analysis

Use summary for:
- Post-activity overview
- Comparing to previous activities
- Sharing key stats

### Detailed Analysis

For deeper insights:
- Use Charts for trends
- Use Tables for specific data
- Use Maps for route analysis

## Missing Data

Some fields may be empty if:
- Sensor not connected
- Device doesn't record that metric
- Data corruption

## Export Summary

Print or save summary:
1. Navigate to Summary tab
2. File → Print
3. Choose "Save as PDF"

---

**Related:** [Maps](/docs/visualization/maps) | [Charts](/docs/visualization/charts) | [Tables](/docs/visualization/tables)
