type LoadVersionInfoDocument = Pick<Document, "querySelector">;

export interface LoadVersionInfoRuntimeScope {
    readonly getDocument?:
        | (() => LoadVersionInfoDocument | undefined)
        | undefined;
}

export interface LoadVersionInfoRuntime {
    readonly queryVersionNumber: (selector: string) => Element | null;
}

const defaultLoadVersionInfoRuntimeScope: LoadVersionInfoRuntimeScope = {
    getDocument: () => globalThis.document,
};

function getRequiredDocument(
    scope: LoadVersionInfoRuntimeScope
): LoadVersionInfoDocument {
    const runtimeDocument = scope.getDocument?.();
    if (!runtimeDocument) {
        throw new TypeError("loadVersionInfo requires a document runtime");
    }

    return runtimeDocument;
}

export function getLoadVersionInfoRuntime(
    scope: LoadVersionInfoRuntimeScope = defaultLoadVersionInfoRuntimeScope
): LoadVersionInfoRuntime {
    return {
        queryVersionNumber(selector): Element | null {
            return getRequiredDocument(scope).querySelector(selector);
        },
    };
}
