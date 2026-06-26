import { getBrowserElectronApiCandidate } from "../utils/runtime/electronApiRuntime.js";
import type { RendererRuntimeEnvironmentScope } from "./runtimeEnvironment.js";

export {
    getBrowserAbortController as getBrowserRendererAbortController,
    getBrowserAddEventListener as getBrowserRendererAddEventListener,
    getBrowserBoundClearInterval as getBrowserRendererBoundClearInterval,
    getBrowserBoundClearTimeout as getBrowserRendererBoundClearTimeout,
    getBrowserBoundSetInterval as getBrowserRendererBoundSetInterval,
    getBrowserBoundSetTimeout as getBrowserRendererBoundSetTimeout,
    getBrowserClearTimeout as getBrowserRendererClearTimeout,
    getBrowserConsole as getBrowserRendererConsole,
    getBrowserCustomEvent as getBrowserRendererCustomEvent,
    getBrowserDateNow as getBrowserRendererDateNow,
    getBrowserDocument as getBrowserRendererDocument,
    getBrowserEventTarget as getBrowserRendererEventTarget,
    getBrowserHTMLElement as getBrowserRendererHTMLElement,
    getBrowserHTMLScriptElement as getBrowserRendererHTMLScriptElement,
    getBrowserLocation as getBrowserRendererLocation,
    getBrowserNavigator as getBrowserRendererNavigator,
    getBrowserPerformance as getBrowserRendererPerformance,
    getBrowserRemoveEventListener as getBrowserRendererRemoveEventListener,
    getBrowserSetTimeout as getBrowserRendererSetTimeout,
} from "../utils/runtime/browserRuntime.js";

import {
    getBrowserAddEventListener,
    getBrowserBoundClearInterval,
    getBrowserBoundSetInterval,
    getBrowserBoundSetTimeout,
    getBrowserConsole,
    getBrowserDocument,
    getBrowserEventTarget,
    getBrowserRemoveEventListener,
} from "../utils/runtime/browserRuntime.js";

export function getBrowserRendererElectronApiCandidate(): unknown {
    return getBrowserElectronApiCandidate();
}

export function getBrowserRendererRuntimeEnvironmentScope(): RendererRuntimeEnvironmentScope {
    return {
        getAddEventListener: getBrowserAddEventListener,
        getClearInterval: getBrowserBoundClearInterval,
        getConsole: getBrowserConsole,
        getDocument: getBrowserDocument,
        getElectronApiCandidate: getBrowserRendererElectronApiCandidate,
        getRemoveEventListener: getBrowserRemoveEventListener,
        getRendererEventTarget: getBrowserEventTarget,
        getSetInterval: getBrowserBoundSetInterval,
        getSetTimeout: getBrowserBoundSetTimeout,
    };
}
