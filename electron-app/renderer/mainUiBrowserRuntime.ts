import type { MainUiRuntimeEnvironmentScope } from "./mainUiRuntimeEnvironment.js";

type MainUiRuntimeGlobalScope = typeof globalThis & {
    readonly electronAPI?: unknown;
};

function getDefaultElectronApiCandidate(): unknown {
    const mainUiScope = globalThis as MainUiRuntimeGlobalScope;

    return mainUiScope.electronAPI;
}

export function getBrowserMainUiRuntimeEnvironmentScope(): MainUiRuntimeEnvironmentScope {
    return {
        dateNow: () => Date.now(),
        getConsole: () => globalThis.console,
        getDocument: () => globalThis.document,
        getElectronApiCandidate: getDefaultElectronApiCandidate,
    };
}
