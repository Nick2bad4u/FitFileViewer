/**
 * Legacy global bindings and compatibility helpers for the renderer UI.
 */

import { convertArrayBufferToBase64 } from "../formatting/converters/convertArrayBufferToBase64.js";
import { getState, setState } from "../state/core/stateManager.js";

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
 *     showFitData: (fitData: any, filePath: string) => void;
 *     renderChartJS: (data: any, filePath: string, options?: any) => void;
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
    // Expose essential functions to window for backward compatibility
    // @ts-ignore augmenting window for legacy globals
    globalThis.showFitData = showFitData;
    // @ts-ignore legacy compatibility
    globalThis.renderChartJS = renderChartJS;
    // @ts-ignore
    globalThis.cleanupEventListeners = cleanupEventListeners;

    // Enhanced iframe communication with better error handling
    // @ts-ignore legacy global
    globalThis.sendFitFileToAltFitReader = async function (
        arrayBuffer
    ) /** @type {ArrayBuffer} */ {
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
                        frame.contentWindow.postMessage(
                            { base64, type: "fit-file" },
                            "*"
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
