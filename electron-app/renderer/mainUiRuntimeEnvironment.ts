export interface MainUiRuntimeEnvironment {
    readonly consoleRef: Console;
}

export function getMainUiRuntimeEnvironment(): MainUiRuntimeEnvironment {
    return {
        consoleRef: globalThis.console,
    };
}
