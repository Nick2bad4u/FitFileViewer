import { getBrowserDocument } from "../../runtime/browserRuntime.js";

type CreateTablesDocument = Pick<Document, "querySelector">;

export interface CreateTablesRuntimeScope {
    readonly getDocument: CreateTablesRuntimeProvider<CreateTablesDocument>;
}

export interface CreateTablesRuntime {
    getDefaultContainer: () => HTMLElement | null;
}

type CreateTablesRuntimeProvider<T> = (() => T | undefined) | undefined;

const defaultCreateTablesRuntimeScope: CreateTablesRuntimeScope = {
    getDocument: getBrowserDocument,
};

function getScopeDocument(
    getDocument: () => CreateTablesDocument | undefined
): CreateTablesDocument | undefined {
    return getDocument();
}

export function getCreateTablesRuntime(
    scope: CreateTablesRuntimeScope = defaultCreateTablesRuntimeScope
): CreateTablesRuntime {
    const getDocument = getRequiredProvider(scope.getDocument, "document");

    return {
        getDefaultContainer(): HTMLElement | null {
            return (
                getScopeDocument(getDocument)?.querySelector<HTMLElement>(
                    "#content_data"
                ) ?? null
            );
        },
    };
}

function getRequiredProvider<T>(
    provider: CreateTablesRuntimeProvider<T>,
    providerName: string
): () => T | undefined {
    if (typeof provider !== "function") {
        throw new TypeError(
            `createTablesRuntime requires a ${providerName} provider`
        );
    }

    return provider;
}
