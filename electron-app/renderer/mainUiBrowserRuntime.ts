import type { MainUiRuntimeEnvironmentScope } from "./mainUiRuntimeEnvironment.js";
import {
    getBrowserConsole,
    getBrowserCurrentTimestamp,
    getBrowserDocument,
} from "../utils/runtime/browserRuntime.js";
import { getBrowserElectronApiCandidate } from "../utils/runtime/electronApiRuntime.js";

export function getBrowserMainUiRuntimeEnvironmentScope(): MainUiRuntimeEnvironmentScope {
    return {
        dateNow: getBrowserCurrentTimestamp,
        getConsole: getBrowserConsole,
        getDocument: getBrowserDocument,
        getElectronApiCandidate: getBrowserElectronApiCandidate,
    };
}
