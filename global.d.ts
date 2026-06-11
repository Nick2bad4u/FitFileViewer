/* eslint-disable capitalized-comments, no-underscore-dangle, perfectionist/sort-imports, perfectionist/sort-interfaces, unicorn/require-module-specifiers, vars-on-top -- Legacy ambient declarations mirror external global names and grouped API docs during migration. */
import type {
    FitDecodeResult,
} from "./electron-app/shared/fit";
import type { ElectronAPIWithDevFlags } from "./electron-app/shared/preloadApi";
import type * as Leaflet from "leaflet";

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

        // --- Chart related data ---
        _chartjsInstances?: unknown[];
        Chart?: unknown;

        // --- Tab button / UI state debugging helpers ---
        setTabButtonsEnabled?: (enabled: boolean) => void;
        areTabButtonsEnabled?: () => boolean;
        debugTabButtons?: (...args: unknown[]) => void;
        forceEnableTabButtons?: () => void;
        testTabButtonClicks?: () => void;
        debugTabState?: (...args: unknown[]) => void;
        forceFixTabButtons?: () => void;

        // --- Internal flags / timeouts ---
        __DEVELOPMENT__?: boolean;
        __state_debug?: boolean;
        __persistenceTimeout?: ReturnType<typeof setTimeout>;

        // --- Map / markers ---
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

export {};
/* eslint-enable capitalized-comments, no-underscore-dangle, perfectionist/sort-imports, perfectionist/sort-interfaces, unicorn/require-module-specifiers, vars-on-top -- Re-enable legacy ambient declaration lint rules. */
