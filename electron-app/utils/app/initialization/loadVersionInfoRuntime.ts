import { getBrowserDocument } from "../../runtime/browserRuntime.js";

type LoadVersionInfoDocument = Pick<Document, "querySelector">;

export interface LoadVersionInfoRuntimeScope {
    readonly getDocument:
        | (() => LoadVersionInfoDocument | undefined)
        | undefined;
}

export interface LoadVersionInfoRuntime {
    readonly queryVersionNumber: (selector: string) => Element | null;
}

const defaultLoadVersionInfoRuntimeScope: LoadVersionInfoRuntimeScope = {
    getDocument: getBrowserDocument,
};

function getRequiredDocument(
    scope: LoadVersionInfoRuntimeScope
): LoadVersionInfoDocument {
    const getDocument = scope.getDocument;
    if (typeof getDocument !== "function") {
        throw new TypeError("loadVersionInfo requires a document provider");
    }

    const runtimeDocument = getDocument();
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
