export interface DomHelpersRuntimeScope {
    readonly getAbortController?:
        | (() => typeof AbortController | undefined)
        | undefined;
    readonly getDocument?: (() => Document | undefined) | undefined;
}

export interface DomHelpersRuntime {
    createAbortController: () => AbortController;
    getDocument: () => Document;
}

const defaultDomHelpersRuntimeScope: DomHelpersRuntimeScope = {
    getAbortController: () => globalThis.AbortController,
    getDocument: () => globalThis.document,
};

function getScopeAbortController(
    scope: DomHelpersRuntimeScope
): typeof AbortController | undefined {
    return scope.getAbortController?.();
}

function getScopeDocument(scope: DomHelpersRuntimeScope): Document | undefined {
    return scope.getDocument?.();
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
