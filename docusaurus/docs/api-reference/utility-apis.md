---
id: utility-apis
title: Utility APIs
sidebar_label: 🛠️ Utility APIs
sidebar_position: 2
description: Utility module API reference.
---

# Utility APIs

Reference for utility modules.

## Formatting Utilities

### formatDistance

```javascript
import { formatDistance } from './utils/formatting/formatDistance.js';

formatDistance(5000);           // "5.00 km"
formatDistance(5000, 'mi');     // "3.11 mi"
formatDistance(5000, 'km', 1);  // "5.0 km"
```

**Parameters:**
- `meters` (number) - Distance in meters
- `unit` (string) - 'km' or 'mi' (default: 'km')
- `decimals` (number) - Decimal places (default: 2)

**Returns:** Formatted string

### formatDuration

```javascript
import { formatDuration } from './utils/formatting/formatDuration.js';

formatDuration(3661);    // "1:01:01"
formatDuration(125);     // "2:05"
formatDuration(45);      // "0:45"
```

**Parameters:**
- `seconds` (number) - Duration in seconds

**Returns:** Formatted string (HH:MM:SS or MM:SS)

### formatSpeed

```javascript
import { formatSpeed } from './utils/formatting/formatSpeed.js';

formatSpeed(4.17);              // "15.0 km/h"
formatSpeed(4.17, 'mph');       // "9.3 mph"
formatSpeed(4.17, 'pace');      // "4:00 /km"
```

**Parameters:**
- `metersPerSecond` (number) - Speed in m/s
- `format` (string) - 'kmh', 'mph', or 'pace'

**Returns:** Formatted string

## Map Utilities

### renderMap

```javascript
import { renderMap } from './utils/maps/renderMap.js';

const map = renderMap('map-container', {
    center: [51.505, -0.09],
    zoom: 13
});
```

**Parameters:**
- `containerId` (string) - DOM element ID
- `options` (object) - Leaflet map options

**Returns:** Leaflet map instance

### drawRoute

```javascript
import { drawRoute } from './utils/maps/mapDrawLaps.js';

drawRoute(map, gpsPoints, {
    color: 'blue',
    weight: 3
});
```

**Parameters:**
- `map` (L.Map) - Leaflet map instance
- `points` (array) - Array of [lat, lng] points
- `options` (object) - Polyline options

## Chart Utilities

### renderChart

```javascript
import { renderChart } from './utils/charts/renderChartJS.js';

const chart = renderChart('chart-container', {
    type: 'line',
    data: chartData,
    options: chartOptions
});
```

**Parameters:**
- `containerId` (string) - Canvas element ID
- `config` (object) - Chart.js configuration

**Returns:** Chart.js instance

### createChartSpec

```javascript
import { createChartSpec } from './utils/charts/chartSpec.js';

const spec = createChartSpec('speed', data);
```

**Parameters:**
- `type` (string) - Chart type ('speed', 'heartRate', 'elevation')
- `data` (array) - Record data

**Returns:** Chart configuration object

## State Management

### StateManager

```javascript
import { stateManager } from './utils/state/stateManager.js';

// Set value
stateManager.set('currentFile', fileData);

// Get value
const file = stateManager.get('currentFile');

// Subscribe to changes
stateManager.subscribe('currentFile', (newValue) => {
    console.log('File changed:', newValue);
});
```

**Methods:**
- `set(key, value)` - Store a value
- `get(key)` - Retrieve a value
- `subscribe(key, callback)` - Listen for changes
- `unsubscribe(key, callback)` - Remove listener

---

**Next:** [IPC Communication →](/docs/api-reference/ipc-communication)
