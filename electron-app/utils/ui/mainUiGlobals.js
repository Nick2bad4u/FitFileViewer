/**
 * Legacy global bindings and compatibility helpers for the renderer UI.
 */

import { convertArrayBufferToBase64 } from "../formatting/converters/convertArrayBufferToBase64.js";
import { getState, setState } from "../state/core/stateManager.js";

/**
 * @typedef {(fitData: unknown, filePath: string) => void} ShowFitData
 * @typedef {(data: unknown, filePath: string, options?: unknown) => void} RenderChartJS
 * @typedef {typeof globalThis & {
 *     cleanupEventListeners?: () => void;
 *     renderChartJS?: RenderChartJS;
 *     sendFitFileToAltFitReader?: (arrayBuffer: ArrayBuffer) => Promise<void>;
 *     showFitData?: ShowFitData;
 * }} LegacyRendererGlobal
 */

/**
 * @returns {LegacyRendererGlobal}
 */
function getLegacyRendererGlobal() {
    return /** @type {LegacyRendererGlobal} */ (globalThis);
}

/**
 * Define window.globalData to bridge legacy code to state-managed data.
 */
export function defineGlobalDataProperty() {
    try {
        const existing = Object.getOwnPropertyDescriptor(
            globalThis,
            "globalData"
        );
        if (!existing || existing.configurable) {
            Object.defineProperty(globalThis, "globalData", {
                configurable: true,
                enumerable: true,
                get() {
                    return getState("globalData");
                },
                set(value) {
                    setState("globalData", value, {
                        silent: false,
                        source: "main-ui.js",
                    });
                },
            });
        }
    } catch {
        /* Ignore redefinition issues */
    }
}

/**
 * Register legacy globals expected by older renderers/scripts.
 *
 * @param {{
 *     showFitData: ShowFitData;
 *     renderChartJS: RenderChartJS;
 *     cleanupEventListeners: () => void;
 *     validateElement: (id: string) => HTMLElement | null;
 *     constants: {
 *         DOM_IDS: { ALT_FIT_IFRAME: string };
 *         IFRAME_PATHS: { ALT_FIT: string };
 *     };
 * }} deps
 */
export function registerLegacyGlobals({
    showFitData,
    renderChartJS,
    cleanupEventListeners,
    validateElement,
    constants,
}) {
    const legacyGlobal = getLegacyRendererGlobal();

    // Expose essential functions to window for backward compatibility
    legacyGlobal.showFitData = showFitData;
    legacyGlobal.renderChartJS = renderChartJS;
    legacyGlobal.cleanupEventListeners = cleanupEventListeners;

    // Enhanced iframe communication with better error handling
    legacyGlobal.sendFitFileToAltFitReader = async (arrayBuffer) => {
        const iframe = validateElement(constants.DOM_IDS.ALT_FIT_IFRAME);
        if (!iframe) {
            console.warn("Alt FIT iframe not found");
            return;
        }

        // If iframe is not loaded yet, wait for it to load before posting message
        const frame = /** @type {HTMLIFrameElement} */ (iframe),
            postToIframe = () => {
                try {
                    if (frame.contentWindow) {
                        const base64 = convertArrayBufferToBase64(arrayBuffer);
                        const targetOrigin = globalThis.location.origin;
                        frame.contentWindow.postMessage(
                            { base64, type: "fit-file" },
                            // eslint-disable-next-line sdl/no-postmessage-without-origin-allowlist -- Electron loads the Alt FIT iframe from the same app origin; location.origin is the strict same-origin target for the current runtime.
                            targetOrigin
                        );
                    }
                } catch (error) {
                    console.error("Error posting message to iframe:", error);
                }
            };
        if (!frame.src || !frame.src.includes(constants.IFRAME_PATHS.ALT_FIT)) {
            frame.src = constants.IFRAME_PATHS.ALT_FIT;
            frame.addEventListener("load", postToIframe);
        } else if (frame.contentWindow && frame.src) {
            postToIframe();
        } else {
            frame.addEventListener("load", postToIframe);
        }
    };
}
