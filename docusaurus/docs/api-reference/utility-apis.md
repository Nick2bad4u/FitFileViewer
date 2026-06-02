---
id: utility-apis
title: Utility APIs
sidebar_label: 🛠️ Utility APIs
sidebar_position: 2
description: Utility module API reference.
---

# Utility APIs

FitFileViewer utility source lives under `electron-app/utils/` and is compiled
by root-owned build scripts into `dist/`. Source files are TypeScript-first.
Runtime import specifiers still use `.js` extensions so compiled ESM resolves
correctly.

## Formatting Utilities

Formatting source is grouped under `electron-app/utils/formatting/`.

### formatDistance

Source: `electron-app/utils/formatting/formatters/formatDistance.ts`

```typescript
import { formatDistance } from "./utils/formatting/formatters/formatDistance.js";

formatDistance(5000); // "5.00 km / 3.11 mi"
formatDistance(0); // ""
formatDistance(Number.NaN); // ""
```

**Parameters:**

- `meters` (`unknown`) - Distance in meters.

**Returns:** A combined kilometer/mile string, or an empty string for invalid,
zero, or negative input.

### formatDuration

Source: `electron-app/utils/formatting/formatters/formatDuration.ts`

```typescript
import { formatDuration } from "./utils/formatting/formatters/formatDuration.js";

formatDuration(45); // "45 sec"
formatDuration(125); // "2 min 5 sec"
formatDuration(3661); // "1 hr 1 min"
```

**Parameters:**

- `seconds` (`number | string | null | undefined`) - Duration in seconds.

**Returns:** A human-readable duration string.

**Throws:** `Error` for non-finite, empty-string, or negative values.

### formatTime

Source: `electron-app/utils/formatting/formatters/formatTime.ts`

```typescript
import { formatTime } from "./utils/formatting/formatters/formatTime.js";

formatTime(45); // "0:45"
formatTime(3661); // "1:01:01"
formatTime(undefined); // "0:00"
```

**Parameters:**

- `seconds` (`unknown`) - Duration in seconds.
- `useUserUnits` (`boolean`) - Whether to format using the current time-unit
  setting.

**Returns:** A time string, or `"0:00"` for invalid input.

## Map Utilities

### renderMap

Source: `electron-app/utils/maps/core/renderMap.ts`

```typescript
import { renderMap } from "./utils/maps/core/renderMap.js";

renderMap();
```

`renderMap` reads the current FIT data and map/UI state, creates or refreshes
the Leaflet map, installs controls, applies theming, and draws the active route
and overlays.

### mapDrawLaps

Source: `electron-app/utils/maps/layers/mapDrawLaps.ts`

```typescript
import { mapDrawLaps } from "./utils/maps/layers/mapDrawLaps.js";

mapDrawLaps(fitData, map, leaflet, targetLayer);
```

`mapDrawLaps` draws route segments from FIT record and lap messages. Overlay
support is handled by `drawOverlayForFitFile` in the same module.

## Chart Utilities

### renderChartJS

Source: `electron-app/utils/charts/core/renderChartJS.ts`

```typescript
import { renderChartJS } from "./utils/charts/core/renderChartJS.js";

const rendered = await renderChartJS("#charts-tab", {
    allowInactiveTab: true,
    renderMode: "foreground",
});
```

**Parameters:**

- `targetContainer` (`Element | string | null | undefined`) - Optional chart
  container target.
- `options` - Render-mode and inactive-tab controls.

**Returns:** `Promise<boolean>` indicating whether rendering completed.

### Chart Spec Factory

Source: `electron-app/utils/charts/core/chartSpecFactory.ts`

```typescript
import {
    buildChartConfigFromSpec,
    buildChartSpecFromDefinition,
} from "./utils/charts/core/chartSpecFactory.js";

const spec = buildChartSpecFromDefinition(definition, records);
const config = buildChartConfigFromSpec(spec, themeConfig);
```

The chart spec factory converts declarative chart definitions into Chart.js
configuration objects.

## State Management

### Core State Manager

Source: `electron-app/utils/state/core/stateManager.ts`

```typescript
import {
    getState,
    setState,
    subscribe,
    updateState,
} from "./utils/state/core/stateManager.js";

setState("ui.activeTab", "chart");
const activeTab = getState<string>("ui.activeTab");

const unsubscribe = subscribe("ui.activeTab", (newValue, oldValue, path) => {
    console.log("State changed:", { newValue, oldValue, path });
});

updateState("charts", { controlsVisible: true }, { merge: true });
unsubscribe();
```

**Common exports:**

- `getState(path?)` - Read the full state tree or one path.
- `setState(path, value, options?)` - Replace or merge state at a path.
- `updateState(path, updates, options?)` - Convenience update helper.
- `subscribe(path, listener)` - Listen for state changes and receive an
  unsubscribe function.
- `resetState(path?)` - Reset all state or a specific path.

### Settings State

Source: `electron-app/utils/state/domain/settingsStateManager.ts`

```typescript
import {
    getChartSetting,
    setChartSetting,
    subscribeToChartSettings,
} from "./utils/state/domain/settingsStateManager.js";

setChartSetting("maxpoints", 5000);
const maxPoints = getChartSetting("maxpoints");

const unsubscribe = subscribeToChartSettings((settings) => {
    console.log("Chart settings changed:", settings);
});
```

Settings state owns chart, theme, map-theme, and power-estimation settings.

---

**Next:** [IPC Communication →](/docs/api-reference/ipc-communication)
