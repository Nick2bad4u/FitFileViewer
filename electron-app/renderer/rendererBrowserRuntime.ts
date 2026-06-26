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
import { getBrowserElectronApiCandidate } from "../utils/runtime/electronApiRuntime.js";
import type { RendererRuntimeEnvironmentScope } from "./runtimeEnvironment.js";

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
