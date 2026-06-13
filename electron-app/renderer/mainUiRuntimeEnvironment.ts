export interface MainUiRuntimeEnvironment {
    readonly consoleRef: Console;
    dateNow(): number;
}

export function getMainUiRuntimeEnvironment(): MainUiRuntimeEnvironment {
    return {
        consoleRef: globalThis.console,
        dateNow(): number {
            return Date.now();
        },
    };
}
