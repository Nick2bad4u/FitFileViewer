import {
    createRendererElectronApiScope,
    type RendererElectronApiScope,
} from "../utils/runtime/electronApiRuntime.js";

export interface MainUiRuntimeEnvironment {
    readonly consoleRef: Console;
    readonly dateNow: () => number;
    readonly documentRef: Document;
    readonly electronApiScope: RendererElectronApiScope;
}

export interface MainUiRuntimeEnvironmentScope {
    readonly dateNow: () => number;
    readonly getConsole: () => Console | undefined;
    readonly getDocument: () => Document | undefined;
    readonly getElectronAPI: () => unknown;
}

function getScopeConsole(scope: MainUiRuntimeEnvironmentScope): Console {
    if (typeof scope.getConsole !== "function") {
        throw new TypeError(
            "main UI runtime environment requires a console reference"
        );
    }

    const consoleRef = scope.getConsole();
    if (consoleRef === undefined) {
        throw new TypeError(
            "main UI runtime environment requires a console reference"
        );
    }

    return consoleRef;
}

function getScopeDateNow(scope: MainUiRuntimeEnvironmentScope): () => number {
    if (typeof scope.dateNow !== "function") {
        throw new TypeError("main UI runtime environment requires a clock");
    }

    return scope.dateNow;
}

function getScopeDocument(scope: MainUiRuntimeEnvironmentScope): Document {
    if (typeof scope.getDocument !== "function") {
        throw new TypeError(
            "main UI runtime environment requires a document reference"
        );
    }

    const documentRef = scope.getDocument();
    if (documentRef === undefined) {
        throw new TypeError(
            "main UI runtime environment requires a document reference"
        );
    }

    return documentRef;
}

function getScopeElectronApiProvider(
    scope: MainUiRuntimeEnvironmentScope
): () => unknown {
    if (typeof scope.getElectronAPI !== "function") {
        throw new TypeError(
            "main UI runtime environment requires an electron API provider"
        );
    }

    return scope.getElectronAPI;
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
        electronApiScope: createRendererElectronApiScope(
            getScopeElectronApiProvider(scope)
        ),
    };
}
