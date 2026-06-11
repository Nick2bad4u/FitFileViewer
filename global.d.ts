/* eslint-disable no-underscore-dangle, unicorn/require-module-specifiers, vars-on-top -- Ambient declarations mirror external global names and grouped API docs. */
import type { ElectronAPIWithDevFlags } from "./electron-app/shared/preloadApi";

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
    }
}

export {};
/* eslint-enable no-underscore-dangle, unicorn/require-module-specifiers, vars-on-top -- Re-enable ambient declaration lint rules. */
