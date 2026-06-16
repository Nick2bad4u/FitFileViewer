export interface MainUiRuntimeEnvironment {
    readonly consoleRef: Console;
    readonly dateNow: () => number;
}

export interface MainUiRuntimeEnvironmentScope {
    readonly dateNow?: (() => number) | undefined;
    readonly getConsole?: (() => Console | undefined) | undefined;
}

const defaultMainUiRuntimeEnvironmentScope: MainUiRuntimeEnvironmentScope = {
    dateNow: () => Date.now(),
    getConsole: () => globalThis.console,
};

function getScopeConsole(scope: MainUiRuntimeEnvironmentScope): Console {
    const consoleRef = scope.getConsole?.();
    if (consoleRef === undefined) {
        throw new TypeError(
            "main UI runtime environment requires a console reference"
        );
    }

    return consoleRef;
}

function getScopeDateNow(scope: MainUiRuntimeEnvironmentScope): () => number {
    if (scope.dateNow === undefined) {
        throw new TypeError("main UI runtime environment requires a clock");
    }

    return scope.dateNow;
}

export function getMainUiRuntimeEnvironment(
    scope: MainUiRuntimeEnvironmentScope = defaultMainUiRuntimeEnvironmentScope
): MainUiRuntimeEnvironment {
    const dateNow = getScopeDateNow(scope);

    return {
        consoleRef: getScopeConsole(scope),
        dateNow(): number {
            return dateNow();
        },
    };
}
