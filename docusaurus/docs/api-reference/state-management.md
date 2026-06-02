---
id: state-management
title: State Management
sidebar_label: 📊 State Management
sidebar_position: 4
description: State management API reference.
---

# State Management

FitFileViewer uses a root-built TypeScript state system under
`electron-app/utils/state/`. Runtime imports use `.js` specifiers after the
TypeScript build, but this page names the maintained source files.

## Core State Manager

Source: `electron-app/utils/state/core/stateManager.ts`

```javascript
import {
 getState,
 setState,
 subscribe,
 updateState,
} from "./utils/state/core/stateManager.js";

setState("ui.activeTab", "map", { source: "tabStateManager" });

const activeTab = getState("ui.activeTab");

const unsubscribe = subscribe("ui.activeTab", (newValue, oldValue, path) => {
 console.log("State changed:", { newValue, oldValue, path });
});

updateState("charts", { isRendered: false }, { source: "chartReset" });

unsubscribe();
```

The core manager exposes these public operations:

| API | Purpose |
| --- | --- |
| `getState(path?)` | Read a dot-notation state path or the root state. |
| `setState(path, value, options?)` | Set a state value and notify subscribers. |
| `updateState(path, updates, options?)` | Merge object updates into an existing state branch. |
| `subscribe(path, callback)` | Subscribe to exact and parent-path state changes. |
| `subscribeSingleton(path, id, callback)` | Replace an existing subscription with the same id. |
| `initializeStateManager()` | Register compatibility globals and load persisted branches. |
| `persistState(paths?)` | Persist selected state branches to local storage. |
| `loadPersistedState(paths?)` | Load selected persisted branches from local storage. |
| `resetState(path?)` | Reset all state or a specific branch. |
| `getStateHistory()` | Read the bounded state mutation history. |
| `clearStateHistory()` | Clear recorded state mutation history. |
| `getSubscriptions()` | Inspect active state subscriptions. |

## Settings State Manager

Source: `electron-app/utils/state/domain/settingsStateManager.ts`

```javascript
import {
 getChartSetting,
 getMapThemeSetting,
 getThemeSetting,
 setChartSetting,
 setMapThemeSetting,
 setThemeSetting,
 subscribeToChartSettings,
} from "./utils/state/domain/settingsStateManager.js";

setThemeSetting("dark");
setMapThemeSetting(true);
setChartSetting("distanceUnits", "kilometers");

const theme = getThemeSetting();
const mapTilesInverted = getMapThemeSetting();
const distanceUnits = getChartSetting("distanceUnits");

const unsubscribe = subscribeToChartSettings((nextSettings) => {
 console.log("Chart settings changed:", nextSettings);
});

unsubscribe();
```

Settings helpers preserve the legacy settings boundary while storing values in
the centralized state system. Use this domain API for chart, theme, map-theme,
and power-estimation preferences.

## FIT File State

Source: `electron-app/utils/state/domain/fitFileState.ts`

```javascript
import {
 FitFileSelectors,
 fitFileStateManager,
} from "./utils/state/domain/fitFileState.js";

fitFileStateManager.startFileLoading(filePath);
fitFileStateManager.handleFileLoaded(fitData, { filePath });

const currentFile = FitFileSelectors.getCurrentFile();
const metrics = FitFileSelectors.getMetrics();
const hasGps = FitFileSelectors.hasGPS();
```

The FIT file state manager handles file loading lifecycle, raw FIT data,
processed activity metadata, validation, quality metrics, and loading errors.

## Persisted Branches

The core state manager persists selected UI preferences by default:

| Branch | Purpose |
| --- | --- |
| `ui` | General UI preferences. |
| `charts.controlsVisible` | Chart control visibility state. |
| `map.baseLayer` | Selected map base layer. |
| `browser.view` | FIT browser view preference. |

Large activity payloads such as `globalData` and `fitFile.rawData` should stay
in memory and should not be persisted.

## Related Pages

- [Utility APIs](./utility-apis.md)
- [Core APIs](./core-apis.md)
- [Architecture Overview](/docs/architecture/overview)
