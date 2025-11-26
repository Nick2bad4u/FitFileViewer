---
id: charts
title: Performance Charts
sidebar_label: 📊 Charts
sidebar_position: 2
description: Understanding and using the chart features in FitFileViewer.
---

# Performance Charts

Analyze your fitness data with interactive charts powered by Chart.js and Vega-Lite.

## Available Charts

### Speed/Pace

Shows your velocity throughout the activity:
- **Speed**: km/h or mph
- **Pace**: min/km or min/mile
- Identify fast/slow sections
- Spot consistent pacing

### Heart Rate

Monitor your effort levels:
- Heart rate over time
- Zone indicators
- Average and max HR
- Identify effort spikes

### Elevation

View terrain profile:
- Altitude changes
- Climbing sections
- Descent analysis
- Total gain/loss

### Power (Cycling)

For activities with power meter:
- Watts over time
- Average power
- Normalized power (if available)
- Power zones

### Cadence

Step or pedal frequency:
- Running: steps per minute
- Cycling: RPM
- Optimal cadence analysis

## Chart Interactions

### Zoom

| Method | Action |
|--------|--------|
| Mouse wheel | Zoom in/out |
| Click + drag | Select area to zoom |
| Double-click | Reset zoom |

### Pan

- Click and drag (when zoomed)
- Use scroll bar at bottom

### Hover

Mouse over any point to see:
- Exact value
- Timestamp
- Additional metrics

### Select Range

Click and drag to select a time range:
- Shows detailed stats for selection
- Compare different segments

## Chart Features

### Multiple Data Series

Some charts show multiple metrics:
- Toggle series in legend
- Click legend item to show/hide
- Compare trends

### Smoothing

For noisy data:
- Apply smoothing filters
- See underlying trends
- Original data preserved

### Time vs Distance

Choose X-axis:
- **Time**: See duration-based view
- **Distance**: See distance-based view

## Reading Charts

### Identifying Patterns

**Consistent pace:**
```
Speed ────────────────────
```

**Variable pace:**
```
Speed ∿∿∿∿∿∿∿∿∿∿∿∿∿∿∿∿∿∿
```

**Intervals:**
```
Speed ▄▂▄▂▄▂▄▂▄▂▄▂▄▂▄▂▄▂
```

### Correlating Data

Compare multiple charts:
- Speed drops as elevation rises
- HR increases with effort
- Cadence affects speed

## Export

### Save as Image

1. Right-click on chart
2. Select "Save as Image"
3. Choose PNG or JPEG
4. Select save location

### Copy Data

1. View chart data point
2. Copy values manually
3. Or export from Tables tab

## Customization

### Chart Colors

Charts automatically adapt to:
- Light/dark theme
- Data type (HR = red, speed = blue)
- User preferences

### Axis Labels

Units match your preferences:
- Metric: km/h, km, meters
- Imperial: mph, miles, feet

## Performance Tips

### Large Activities

For long activities:
- Initial render may take time
- Zoom in for detail
- Use time range selection

### Multiple Charts

When viewing multiple charts:
- Synchronized X-axis
- Hover shows all values
- Compare at same time point

## Common Issues

### No Data Displayed

**Cause:** Data type not recorded
**Solution:** Check if your device recorded that metric

### Flat Line

**Cause:** Constant value or no variation
**Example:** Indoor trainer with no speed sensor

### Spiky Data

**Cause:** GPS/sensor dropouts
**Solution:** Use smoothing option

---

**Related:** [Maps](/docs/visualization/maps) | [Tables](/docs/visualization/tables)
