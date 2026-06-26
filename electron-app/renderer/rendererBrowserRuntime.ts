import {
    getBrowserAddEventListener,
    getBrowserBoundClearInterval,
    getBrowserBoundSetInterval,
    getBrowserBoundSetTimeout,
    getBrowserConsole,
    getBrowserDocument,
    getBrowserElectronApiCandidate,
    getBrowserEventTarget,
    getBrowserRemoveEventListener,
} from "../utils/runtime/browserRuntime.js";
import type { RendererRuntimeEnvironmentScope } from "./runtimeEnvironment.js";

export function getBrowserRendererRuntimeEnvironmentScope(): RendererRuntimeEnvironmentScope {
    return {
        getAddEventListener: getBrowserAddEventListener,
        getClearInterval: getBrowserBoundClearInterval,
        getConsole: getBrowserConsole,
        getDocument: getBrowserDocument,
        getElectronApiCandidate: getBrowserElectronApiCandidate,
        getRemoveEventListener: getBrowserRemoveEventListener,
        getRendererEventTarget: getBrowserEventTarget,
        getSetInterval: getBrowserBoundSetInterval,
        getSetTimeout: getBrowserBoundSetTimeout,
    };
}
