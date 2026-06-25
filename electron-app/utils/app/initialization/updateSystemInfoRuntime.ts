import { getBrowserDocument } from "../../runtime/browserRuntime.js";

type UpdateSystemInfoDocument = Pick<Document, "querySelectorAll">;

export interface UpdateSystemInfoRuntimeScope {
    readonly getDocument?:
        | (() => UpdateSystemInfoDocument | undefined)
        | undefined;
}

export interface UpdateSystemInfoRuntime {
    readonly querySystemInfoItems: (selector: string) => NodeListOf<Element>;
}

const defaultUpdateSystemInfoRuntimeScope: UpdateSystemInfoRuntimeScope = {
    getDocument: getBrowserDocument,
};

function getRequiredDocument(
    scope: UpdateSystemInfoRuntimeScope
): UpdateSystemInfoDocument {
    const runtimeDocument = scope.getDocument?.();
    if (!runtimeDocument) {
        throw new TypeError("updateSystemInfo requires a document runtime");
    }

    return runtimeDocument;
}

export function getUpdateSystemInfoRuntime(
    scope: UpdateSystemInfoRuntimeScope = defaultUpdateSystemInfoRuntimeScope
): UpdateSystemInfoRuntime {
    return {
        querySystemInfoItems(selector): NodeListOf<Element> {
            return getRequiredDocument(scope).querySelectorAll(selector);
        },
    };
}
