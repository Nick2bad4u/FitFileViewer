import type { MainUiRuntimeEnvironmentScope } from "./mainUiRuntimeEnvironment.js";
import {
    getBrowserConsole,
    getBrowserCurrentTimestamp,
    getBrowserDocument,
    getBrowserElectronApiCandidate,
} from "../utils/runtime/browserRuntime.js";

export function getBrowserMainUiRuntimeEnvironmentScope(): MainUiRuntimeEnvironmentScope {
    return {
        dateNow: getBrowserCurrentTimestamp,
        getConsole: getBrowserConsole,
        getDocument: getBrowserDocument,
        getElectronAPI: getBrowserElectronApiCandidate,
    };
}
