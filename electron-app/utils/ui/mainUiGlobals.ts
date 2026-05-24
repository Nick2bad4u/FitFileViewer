/**
 * Legacy global bindings and compatibility helpers for the renderer UI.
 */

import { convertArrayBufferToBase64 } from "../formatting/converters/convertArrayBufferToBase64.js";
import { getState, setState } from "../state/core/stateManager.js";

type ShowFitData = (fitData: unknown, filePath: string) => void;
type RenderChartJS = (
    targetContainer?: Element | null | string,
    options?: unknown
) => void;

type LegacyRendererGlobal = typeof globalThis & {
    cleanupEventListeners?: () => void;
    renderChartJS?: RenderChartJS;
    sendFitFileToAltFitReader?: (arrayBuffer: ArrayBuffer) => Promise<void>;
    showFitData?: ShowFitData;
};

type RegisterLegacyGlobalsDependencies = {
    cleanupEventListeners: () => void;
    constants: {
        DOM_IDS: { ALT_FIT_IFRAME: string };
        IFRAME_PATHS: { ALT_FIT: string };
    };
    renderChartJS: RenderChartJS;
    showFitData: ShowFitData;
    validateElement: (id: string) => HTMLElement | null;
};

function getLegacyRendererGlobal(): LegacyRendererGlobal {
    return globalThis as LegacyRendererGlobal;
}

/**
 * Define window.globalData to bridge legacy code to state-managed data.
 */
export function defineGlobalDataProperty(): void {
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
                set(value: unknown) {
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
 */
export function registerLegacyGlobals({
    showFitData,
    renderChartJS,
    cleanupEventListeners,
    validateElement,
    constants,
}: RegisterLegacyGlobalsDependencies): void {
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

        if (!(iframe instanceof HTMLIFrameElement)) {
            console.warn("Alt FIT iframe target is not an iframe");
            return;
        }

        // If iframe is not loaded yet, wait for it to load before posting message
        const postToIframe = () => {
            try {
                if (iframe.contentWindow) {
                    const base64 = convertArrayBufferToBase64(arrayBuffer);
                    const targetOrigin = globalThis.location.origin;
                    /* eslint-disable sdl/no-postmessage-without-origin-allowlist -- Electron loads the Alt FIT iframe from the same app origin; location.origin is the strict same-origin target for the current runtime. */
                    iframe.contentWindow.postMessage(
                        { base64, type: "fit-file" },
                        targetOrigin
                    );
                    /* eslint-enable sdl/no-postmessage-without-origin-allowlist */
                }
            } catch (error) {
                console.error("Error posting message to iframe:", error);
            }
        };
        if (
            !iframe.src ||
            !iframe.src.includes(constants.IFRAME_PATHS.ALT_FIT)
        ) {
            const abortController = new AbortController();
            iframe.src = constants.IFRAME_PATHS.ALT_FIT;
            iframe.addEventListener("load", postToIframe, {
                once: true,
                signal: abortController.signal,
            });
        } else if (iframe.contentWindow && iframe.src) {
            postToIframe();
        } else {
            const abortController = new AbortController();
            iframe.addEventListener("load", postToIframe, {
                once: true,
                signal: abortController.signal,
            });
        }
    };
}
