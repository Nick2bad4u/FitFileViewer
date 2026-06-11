/* eslint-disable unicorn/require-module-specifiers -- The preload API contract uses a repository-local type import. */
import type { ElectronAPIWithDevFlags } from "./electron-app/shared/preloadApi";

/*
 Global ambient type augmentation for values injected via the Electron preload script.
 This provides TypeScript awareness for `window.electronAPI` and related helpers so that
 renderer JavaScript (checked with `checkJs`) does not emit "Property 'electronAPI' does not exist" errors.

 The preload API uses explicit IPC contract types.
*/

declare global {
    interface Window {
        /* Core preload API (optionally extended with internal dev flags) */
        electronAPI: ElectronAPIWithDevFlags;
    }
}

export {};
/* eslint-enable unicorn/require-module-specifiers -- Re-enable ambient declaration lint rules. */
