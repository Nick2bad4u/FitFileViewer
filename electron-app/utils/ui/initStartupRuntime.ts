import { getBrowserDocument } from "../runtime/browserRuntime.js";

export interface InitStartupRuntimeScope {
    readonly getDocumentTarget: (() => EventTarget | undefined) | undefined;
}

export interface InitStartupRuntime {
    getDocumentTarget: () => EventTarget | undefined;
}

const defaultInitStartupRuntimeScope: InitStartupRuntimeScope = {
    getDocumentTarget: getBrowserDocument,
};

function getDocumentTarget(
    scope: InitStartupRuntimeScope
): EventTarget | undefined {
    if (typeof scope.getDocumentTarget !== "function") {
        throw new TypeError("initStartup requires a document target provider");
    }

    return scope.getDocumentTarget();
}

export function getInitStartupRuntime(
    scope: InitStartupRuntimeScope = defaultInitStartupRuntimeScope
): InitStartupRuntime {
    return {
        getDocumentTarget(): EventTarget | undefined {
            return getDocumentTarget(scope);
        },
    };
}
