import type { MainUiRuntimeEnvironmentScope } from "./mainUiRuntimeEnvironment.js";

type MainUiRuntimeGlobalScope = typeof globalThis & {
    readonly electronAPI?: unknown;
};

export function getBrowserMainUiRuntimeEnvironmentScope(): MainUiRuntimeEnvironmentScope {
    return {
        dateNow: () => Date.now(),
        getConsole: () => globalThis.console,
        getDocument: () => globalThis.document,
        getElectronApiCandidate: () =>
            (globalThis as MainUiRuntimeGlobalScope).electronAPI,
    };
}
