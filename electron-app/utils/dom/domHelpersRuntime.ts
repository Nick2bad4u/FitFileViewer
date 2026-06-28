import {
    type BrowserAbortControllerConstructor,
    getBrowserAbortController,
    getBrowserDocument,
} from "../runtime/browserRuntime.js";

export interface DomHelpersRuntimeScope {
    readonly getAbortController: () =>
        | BrowserAbortControllerConstructor
        | undefined;
    readonly getDocument: () => Document | undefined;
}

export interface DomHelpersRuntime {
    createAbortController: () => AbortController;
    getDocument: () => Document;
}

const defaultDomHelpersRuntimeScope: DomHelpersRuntimeScope = {
    getAbortController: getBrowserAbortController,
    getDocument: getBrowserDocument,
};

function getScopeAbortController(
    scope: DomHelpersRuntimeScope
): BrowserAbortControllerConstructor | undefined {
    if (typeof scope.getAbortController !== "function") {
        throw new TypeError("dom helpers require an AbortController provider");
    }

    return scope.getAbortController();
}

function getScopeDocument(scope: DomHelpersRuntimeScope): Document | undefined {
    if (typeof scope.getDocument !== "function") {
        throw new TypeError("dom helpers require a document provider");
    }

    return scope.getDocument();
}

export function getDomHelpersRuntime(
    scope: DomHelpersRuntimeScope = defaultDomHelpersRuntimeScope
): DomHelpersRuntime {
    return {
        createAbortController(): AbortController {
            const AbortControllerConstructor = getScopeAbortController(scope);
            if (typeof AbortControllerConstructor !== "function") {
                throw new TypeError(
                    "dom helpers require an AbortController runtime"
                );
            }

            return new AbortControllerConstructor();
        },
        getDocument(): Document {
            const runtimeDocument = getScopeDocument(scope);
            if (!runtimeDocument) {
                throw new TypeError("dom helpers require a document runtime");
            }

            return runtimeDocument;
        },
    };
}
