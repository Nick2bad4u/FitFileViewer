import type { MainUiRuntimeEnvironmentScope } from "./mainUiRuntimeEnvironment.js";

type MainUiRuntimeGlobalScope = typeof globalThis & {
    readonly electronAPI?: unknown;
};

export function getBrowserMainUiConsole(): Console | undefined {
    return globalThis.console;
}

export function getBrowserMainUiDateNow(): number {
    return Date.now();
}

export function getBrowserMainUiDocument(): Document | undefined {
    return globalThis.document;
}

export function getBrowserMainUiElectronApiCandidate(): unknown {
    return (globalThis as MainUiRuntimeGlobalScope).electronAPI;
}

export function getBrowserMainUiRuntimeEnvironmentScope(): MainUiRuntimeEnvironmentScope {
    return {
        dateNow: getBrowserMainUiDateNow,
        getConsole: getBrowserMainUiConsole,
        getDocument: getBrowserMainUiDocument,
        getElectronApiCandidate: getBrowserMainUiElectronApiCandidate,
    };
}
