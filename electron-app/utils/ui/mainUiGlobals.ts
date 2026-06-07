/**
 * Legacy global bindings and compatibility helpers for the renderer UI.
 */

import { convertArrayBufferToBase64 } from "../formatting/converters/convertArrayBufferToBase64.js";
import { defineLegacyGlobalDataBridge } from "../state/core/globalDataStore.js";

type ShowFitData = (fitData: unknown, filePath: string) => void;
type RenderChartJS = (
    targetContainer?: Element | null | string,
    options?: unknown
) => void;

type LegacyRendererGlobal = typeof globalThis & {
    cleanupEventListeners?: () => void;
    globalData?: unknown;
    renderChartJS?: RenderChartJS;
    sendFitFileToAltFitReader?: (arrayBuffer: ArrayBuffer) => void;
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
    return globalThis;
}

function getAltFitTargetOrigin(): string {
    return globalThis.location.protocol === "file:"
        ? "*"
        : globalThis.location.origin;
}

/**
 * Define window.globalData to bridge legacy code to state-managed data.
 */
export function defineGlobalDataProperty(): void {
    defineLegacyGlobalDataBridge({ silent: false, source: "main-ui.js" });
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
    legacyGlobal.sendFitFileToAltFitReader = (arrayBuffer) => {
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
                    const targetOrigin = getAltFitTargetOrigin();
                    /* eslint-disable sdl/no-postmessage-without-origin-allowlist -- Electron file:// iframes can have an opaque origin. The child bridge still validates event.source and local file origins before accepting FIT payloads. */
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
