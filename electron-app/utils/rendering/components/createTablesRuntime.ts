import { getBrowserDocument } from "../../runtime/browserRuntime.js";

type CreateTablesDocument = Pick<Document, "querySelector">;

export interface CreateTablesRuntimeScope {
    readonly getDocument?: (() => CreateTablesDocument | undefined) | undefined;
}

export interface CreateTablesRuntime {
    getDefaultContainer: () => HTMLElement | null;
}

const defaultCreateTablesRuntimeScope: CreateTablesRuntimeScope = {
    getDocument: getBrowserDocument,
};

function getScopeDocument(
    scope: CreateTablesRuntimeScope
): CreateTablesDocument | undefined {
    return scope.getDocument?.();
}

export function getCreateTablesRuntime(
    scope: CreateTablesRuntimeScope = defaultCreateTablesRuntimeScope
): CreateTablesRuntime {
    return {
        getDefaultContainer(): HTMLElement | null {
            return (
                getScopeDocument(scope)?.querySelector<HTMLElement>(
                    "#content_data"
                ) ?? null
            );
        },
    };
}
