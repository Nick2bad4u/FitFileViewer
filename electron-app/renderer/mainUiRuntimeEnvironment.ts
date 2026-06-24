export interface MainUiRuntimeEnvironment {
    readonly consoleRef: Console;
    readonly dateNow: () => number;
    readonly documentRef: Document;
    readonly electronApiCandidate: unknown;
}

export interface MainUiRuntimeEnvironmentScope {
    readonly dateNow?: (() => number) | undefined;
    readonly getConsole?: (() => Console | undefined) | undefined;
    readonly getDocument?: (() => Document | undefined) | undefined;
    readonly getElectronApiCandidate?: (() => unknown) | undefined;
}

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

function getScopeDocument(scope: MainUiRuntimeEnvironmentScope): Document {
    const documentRef = scope.getDocument?.();
    if (documentRef === undefined) {
        throw new TypeError(
            "main UI runtime environment requires a document reference"
        );
    }

    return documentRef;
}

export function getMainUiRuntimeEnvironment(
    scope: MainUiRuntimeEnvironmentScope
): MainUiRuntimeEnvironment {
    const dateNow = getScopeDateNow(scope);

    return {
        consoleRef: getScopeConsole(scope),
        dateNow(): number {
            return dateNow();
        },
        documentRef: getScopeDocument(scope),
        electronApiCandidate: scope.getElectronApiCandidate?.(),
    };
}
