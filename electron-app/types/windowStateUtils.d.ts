declare namespace _exports {
    export { WindowState, DevHelpers };
}
declare namespace _exports {
    export let version: string;
    export { devHelpers };
    export { CONSTANTS };
    export { createWindow };
    export { getWindowState };
    export { sanitizeWindowState };
    export { saveWindowState };
    export { settingsPath };
    export { validateWindow };
    export { validateWindowState };
}
export = _exports;
/**
 * Window state shape
 */
type WindowState = {
    width: number;
    height: number;
    x?: number;
    y?: number;
};
type DevHelpers = {
    getConfig: () => {
        constants: typeof CONSTANTS;
        settingsPath: string;
        currentState: WindowState;
    };
    resetState: () => boolean;
    validateSettings: () => {
        isValid: boolean;
        state?: WindowState;
        path: string;
        exists: boolean;
        error?: string;
    };
};
declare namespace devHelpers {
    function getConfig(): {
        constants: {
            DEFAULTS: {
                WINDOW: {
                    height: number;
                    minHeight: number;
                    minWidth: number;
                    width: number;
                };
            };
            FILES: {
                WINDOW_STATE: string;
            };
            PATHS: {
                HTML: {
                    INDEX: string;
                };
                ICONS: {
                    FAVICON: string;
                };
                PRELOAD: string;
            };
            WEB_PREFERENCES: {
                contextIsolation: boolean;
                nodeIntegration: boolean;
                sandbox: boolean;
            };
        };
        currentState: WindowState;
        settingsPath: string;
    };
    function resetState(): boolean;
    function validateSettings():
        | {
              exists: boolean;
              isValid: boolean;
              path: string;
              state: WindowState;
              error?: never;
          }
        | {
              error: string;
              exists: boolean;
              isValid: boolean;
              path: string;
              state?: never;
          };
}
declare namespace CONSTANTS {
    namespace DEFAULTS {
        namespace WINDOW {
            let height: number;
            let minHeight: number;
            let minWidth: number;
            let width: number;
        }
    }
    namespace FILES {
        let WINDOW_STATE: string;
    }
    namespace PATHS {
        namespace HTML {
            let INDEX: string;
        }
        namespace ICONS {
            let FAVICON: string;
        }
        let PRELOAD: string;
    }
    namespace WEB_PREFERENCES {
        let contextIsolation: boolean;
        let nodeIntegration: boolean;
        let sandbox: boolean;
    }
}
/**
 * Creates a new BrowserWindow with enhanced configuration and error handling
 * @returns {BrowserWindow} The created BrowserWindow instance
 */
/**
 * @returns {BrowserWindow}
 */
declare function createWindow(): BrowserWindow;
/**
 * Retrieves the saved window state from disk with enhanced error handling
 * @returns {Object} Window state object with width, height, and optional x, y coordinates
 */
/**
 * @returns {WindowState}
 */
declare function getWindowState(): WindowState;
/**
 * Sanitize and normalize persisted window state.
 * @param {Partial<WindowState>} state
 * @returns {WindowState}
 */
declare function sanitizeWindowState(state: Partial<WindowState>): WindowState;
/**
 * Saves the current window state to disk with enhanced validation and error handling
 * @param {BrowserWindow} win - The Electron BrowserWindow instance
 */
/**
 * @param {BrowserWindow} win
 * @returns {void}
 */
declare function saveWindowState(win: BrowserWindow): void;
declare const settingsPath: string;
/**
 * @param {unknown} win
 * @returns {win is BrowserWindow}
 */
declare function validateWindow(win: unknown): win is BrowserWindow;
/**
 * Type guard validating a window state object.
 * @param {unknown} state
 * @returns {state is WindowState}
 */
declare function validateWindowState(state: unknown): state is WindowState;
import { BrowserWindow } from "electron";
