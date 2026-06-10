/* eslint-disable capitalized-comments, no-underscore-dangle, perfectionist/sort-imports, perfectionist/sort-interfaces, perfectionist/sort-union-types, unicorn/require-module-specifiers, vars-on-top -- Legacy ambient declarations mirror external global names and grouped API docs during migration. */
import type {
    FitDecodeResult,
} from "./electron-app/shared/fit";
import type { ElectronAPIWithDevFlags } from "./electron-app/shared/preloadApi";
import type * as Leaflet from "leaflet";
import type screenfull from "screenfull";

/*
 Global ambient type augmentation for values injected via the Electron preload script.
 This provides TypeScript awareness for `window.electronAPI` and related helpers so that
 renderer JavaScript (checked with `checkJs`) does not emit "Property 'electronAPI' does not exist" errors.

 Legacy globals remain isolated below while the preload API uses explicit IPC contract types.
*/

declare global {
    /** Canonical document reference provided by the Vitest setup harness */
    var __vitest_effective_document__: Document | undefined;

    interface Window {
        /* Core preload API (optionally extended with internal dev flags) */
        electronAPI: ElectronAPIWithDevFlags;

        // --- Data / state objects ---
        globalData?: FitDecodeResult | null;
        AppState?: unknown;
        __appState?: unknown;
        chartStateManager?: unknown;
        tabStateManager?: unknown;
        chartControlsState?: unknown;
        rendererUtils?: Record<string, unknown>;
        loadedFitFiles?: FitDecodeResult[];

        // --- Zone / chart related data ---
        heartRateZones?: ZoneInfo[];
        powerZones?: ZoneInfo[];
        _chartjsInstances?: unknown[];
        ChartUpdater?: unknown;
        chartUpdater?: unknown;
        Chart?: unknown;

        // --- UI helpers & rendering functions (legacy; slated for removal) ---
        showFitData?: (data: FitDecodeResult, fileName?: string) => void;
        renderChartJS?: (...args: unknown[]) => void;
        renderMap?: (...args: unknown[]) => void;
        renderSummary?: (...args: unknown[]) => void;
        createTables?: (...args: unknown[]) => void;

        // --- Notification & modals ---
        showNotification?: (
            message: string,
            type?: string,
            duration?: number,
            options?: unknown
        ) => Promise<void>;
        showKeyboardShortcutsModal?: () => void;
        closeKeyboardShortcutsModal?: () => void;
        aboutModalDevHelpers?: unknown;

        // --- Zone color / controls utilities ---
        updateInlineZoneColorSelectors?: (root?: HTMLElement) => void;
        clearZoneColorData?: (field: string, zoneCount: number) => void;
        resetAllSettings?: () => void;
        updateMapTheme?: () => void;
        _mapThemeListener?: EventListener;

        // --- Tab button / UI state debugging helpers ---
        setTabButtonsEnabled?: (enabled: boolean) => void;
        areTabButtonsEnabled?: () => boolean;
        debugTabButtons?: (...args: unknown[]) => void;
        forceEnableTabButtons?: () => void;
        testTabButtonClicks?: () => void;
        debugTabState?: (...args: unknown[]) => void;
        forceFixTabButtons?: () => void;

        // --- Drag & drop / misc ---
        dragDropHandler?: unknown;
        injectMenu?: (
            theme?: string | null,
            fitFilePath?: string | null
        ) => void;
        devCleanup?: () => void;

        // --- Internal flags / timeouts ---
        __DEVELOPMENT__?: boolean;
        __state_debug?: boolean;
        __persistenceTimeout?: ReturnType<typeof setTimeout>;

        // --- External libs exposed globally ---
        screenfull?: typeof screenfull;

        // --- Map / markers ---
        mapMarkerCount?: number;
        /** Leaflet global (present when Leaflet library loaded) */
        L?: typeof Leaflet;
    }

    /**
     * Minimal ambient declaration for Leaflet global until modules are
     * migrated. Provide both a global variable (for direct `L`) and properties
     * on Window/Node globals so assignments like `global.L = ...` in Vitest
     * setup and `window.L` in the renderer type-check without TS2339 errors.
     */
    var L: typeof Leaflet; // direct global variable access
    namespace NodeJS {
        interface Global {
            // for test / Node environments
            L?: typeof Leaflet;
        }
    }
}

/** Basic shape for a zone (heart rate or power) after processing */
export interface ZoneInfo {
    zone?: number;
    /** Label for display, e.g. "Zone 1" */
    label?: string;
    /** Total seconds in zone */
    time?: number;
    /** Percentage (0-100) */
    percent?: number;
    /** Optional count/value metrics */
    value?: number;
    /** Color string applied to the zone */
    color?: string;
}

export {};
/* eslint-enable capitalized-comments, no-underscore-dangle, perfectionist/sort-imports, perfectionist/sort-interfaces, perfectionist/sort-union-types, unicorn/require-module-specifiers, vars-on-top -- Re-enable legacy ambient declaration lint rules. */
