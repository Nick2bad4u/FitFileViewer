---
id: performance
title: Performance Optimization
sidebar_label: ⚡ Performance
sidebar_position: 1
description: Performance optimization strategies in FitFileViewer.
---

# Performance Optimization

Strategies and patterns for optimal FitFileViewer performance.

## Loading Performance

### Lazy Loading

Modules are loaded on-demand:

```javascript
// Only load map when needed
async function showMap() {
    const { renderMap } = await import('./utils/maps/renderMap.js');
    renderMap(container, data);
}
```

### Code Splitting

Heavy libraries are split:

```javascript
// Chart.js loaded only when charts tab is active
const Chart = await import('chart.js');
```

## Rendering Performance

### Virtual Scrolling

For large data tables:

```javascript
// DataTables handles pagination
$('#dataTable').DataTable({
    serverSide: false,
    deferRender: true,  // Render visible rows only
    pageLength: 50
});
```

### Debouncing

User inputs are debounced:

```javascript
// Debounce search input
const debouncedSearch = debounce((term) => {
    filterTable(term);
}, 300);

searchInput.addEventListener('input', (e) => {
    debouncedSearch(e.target.value);
});
```

### RequestAnimationFrame

Smooth animations:

```javascript
function animateChart() {
    requestAnimationFrame(() => {
        chart.update('none'); // No animation
    });
}
```

## Memory Management

### Cleanup

Components clean up resources:

```javascript
class ChartManager {
    constructor() {
        this.charts = [];
    }

    createChart(config) {
        const chart = new Chart(config);
        this.charts.push(chart);
        return chart;
    }

    cleanup() {
        this.charts.forEach(chart => chart.destroy());
        this.charts = [];
    }
}
```

### Event Listener Management

```javascript
// Track listeners for cleanup
const listeners = new Map();

function addListener(element, event, handler) {
    element.addEventListener(event, handler);

    if (!listeners.has(element)) {
        listeners.set(element, []);
    }
    listeners.get(element).push({ event, handler });
}

function cleanup() {
    listeners.forEach((handlers, element) => {
        handlers.forEach(({ event, handler }) => {
            element.removeEventListener(event, handler);
        });
    });
    listeners.clear();
}
```

## Large File Handling

### Streaming Parse

For large FIT files:

```javascript
// Process in chunks
async function parseInChunks(buffer, chunkSize = 1000) {
    const records = [];
    let offset = 0;

    while (offset < buffer.byteLength) {
        const chunk = await parseChunk(buffer, offset, chunkSize);
        records.push(...chunk);
        offset += chunkSize;

        // Yield to UI
        await new Promise(resolve => setTimeout(resolve, 0));
    }

    return records;
}
```

### Progressive Rendering

Show data as it's available:

```javascript
async function loadAndRender(buffer) {
    // Show loading state
    showLoadingIndicator();

    // Parse metadata first (fast)
    const metadata = parseMetadata(buffer);
    renderSummary(metadata);

    // Then parse full data
    const fullData = await parseFullData(buffer);
    renderAllViews(fullData);

    hideLoadingIndicator();
}
```

## Map Performance

### Tile Caching

Map tiles are cached:

```javascript
// Leaflet handles caching automatically
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    // Tiles cached in browser
});
```

### Route Simplification

Simplify routes for display:

```javascript
// Reduce points for overview
function simplifyRoute(points, tolerance = 0.0001) {
    // Douglas-Peucker algorithm
    return simplify(points, tolerance);
}
```

## Metrics

### Performance Monitoring

```javascript
// Measure operation time
function measurePerformance(name, fn) {
    const start = performance.now();
    const result = fn();
    const end = performance.now();

    console.log(`${name}: ${(end - start).toFixed(2)}ms`);
    return result;
}

// Usage
const data = measurePerformance('Parse FIT file', () => {
    return parseFitFile(buffer);
});
```

## Best Practices

### Do

- ✅ Lazy load heavy modules
- ✅ Debounce user input
- ✅ Clean up resources
- ✅ Use pagination
- ✅ Show loading states

### Don't

- ❌ Load everything upfront
- ❌ Process on main thread
- ❌ Keep unused references
- ❌ Render thousands of DOM nodes
- ❌ Block UI during processing

---

**Related:** [Architecture Overview](/docs/architecture/overview)
