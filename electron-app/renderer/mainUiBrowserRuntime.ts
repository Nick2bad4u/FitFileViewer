import type { MainUiRuntimeEnvironmentScope } from "./mainUiRuntimeEnvironment.js";
import {
    getBrowserConsole,
    getBrowserDocument,
} from "../utils/runtime/browserRuntime.js";
import { getBrowserElectronApiCandidate } from "../utils/runtime/electronApiRuntime.js";

export {
    getBrowserConsole as getBrowserMainUiConsole,
    getBrowserDocument as getBrowserMainUiDocument,
} from "../utils/runtime/browserRuntime.js";

export function getBrowserMainUiDateNow(): number {
    return Date.now();
}

export function getBrowserMainUiElectronApiCandidate(): unknown {
    return getBrowserElectronApiCandidate();
}

export function getBrowserMainUiRuntimeEnvironmentScope(): MainUiRuntimeEnvironmentScope {
    return {
        dateNow: getBrowserMainUiDateNow,
        getConsole: getBrowserConsole,
        getDocument: getBrowserDocument,
        getElectronApiCandidate: getBrowserMainUiElectronApiCandidate,
    };
}
