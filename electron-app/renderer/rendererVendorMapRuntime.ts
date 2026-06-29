import {
    deleteBrowserLeafletGlobals,
    getBrowserDocument,
} from "../utils/runtime/browserRuntime.js";

export interface RendererVendorMapRuntimeScope {
    readonly deleteTemporaryLeafletGlobals?: (() => void) | undefined;
    readonly getDocument: RendererVendorMapRuntimeProvider<
        Pick<Document, "documentElement">
    >;
}

type RendererVendorMapRuntimeProvider<T> = (() => T | undefined) | undefined;

export interface RendererVendorMapRuntime {
    hasDocumentElement: () => boolean;
    removeTemporaryLeafletGlobals: () => void;
    setDocumentElementStyleProperty: (property: string, value: string) => void;
}

const defaultRendererVendorMapRuntimeScope: RendererVendorMapRuntimeScope = {
    deleteTemporaryLeafletGlobals: deleteBrowserLeafletGlobals,
    getDocument: getBrowserDocument,
};

export function getRendererVendorMapRuntime(
    scope: RendererVendorMapRuntimeScope = defaultRendererVendorMapRuntimeScope
): RendererVendorMapRuntime {
    const getDocument = getRequiredProvider(scope.getDocument, "document");

    return {
        hasDocumentElement(): boolean {
            return getDocument()?.documentElement !== undefined;
        },

        removeTemporaryLeafletGlobals(): void {
            scope.deleteTemporaryLeafletGlobals?.();
        },

        setDocumentElementStyleProperty(property: string, value: string): void {
            getDocument()?.documentElement.style.setProperty(property, value);
        },
    };
}

function getRequiredProvider<T>(
    provider: RendererVendorMapRuntimeProvider<T>,
    providerName: string
): () => T | undefined {
    if (typeof provider !== "function") {
        const article = /^[AEIOUHaeiou]/u.test(providerName) ? "an" : "a";

        throw new TypeError(
            `rendererVendorMapRuntime requires ${article} ${providerName} provider`
        );
    }

    return provider;
}
