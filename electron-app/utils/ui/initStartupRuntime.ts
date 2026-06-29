import { getBrowserDocument } from "../runtime/browserRuntime.js";

export interface InitStartupRuntimeScope {
    readonly getDocumentTarget: InitStartupRuntimeProvider<EventTarget>;
}

export interface InitStartupRuntime {
    getDocumentTarget: () => EventTarget | undefined;
}

type InitStartupRuntimeProvider<T> = (() => T | undefined) | undefined;

const defaultInitStartupRuntimeScope: InitStartupRuntimeScope = {
    getDocumentTarget: getBrowserDocument,
};

export function getInitStartupRuntime(
    scope: InitStartupRuntimeScope = defaultInitStartupRuntimeScope
): InitStartupRuntime {
    const getDocumentTarget = getRequiredProvider(
        scope.getDocumentTarget,
        "document target"
    );

    return {
        getDocumentTarget(): EventTarget | undefined {
            return getDocumentTarget();
        },
    };
}

function getRequiredProvider<T>(
    provider: InitStartupRuntimeProvider<T>,
    providerName: string
): () => T | undefined {
    if (typeof provider !== "function") {
        throw new TypeError(`initStartup requires a ${providerName} provider`);
    }

    return provider;
}
