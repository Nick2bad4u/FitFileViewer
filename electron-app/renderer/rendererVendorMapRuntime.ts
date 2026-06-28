import {
    deleteBrowserLeafletGlobals,
    getBrowserDocument,
} from "../utils/runtime/browserRuntime.js";

export interface RendererVendorMapRuntimeScope {
    readonly deleteTemporaryLeafletGlobals?: (() => void) | undefined;
    readonly getDocument: () => Pick<Document, "documentElement"> | undefined;
}

export interface RendererVendorMapRuntime {
    hasDocumentElement: () => boolean;
    removeTemporaryLeafletGlobals: () => void;
    setDocumentElementStyleProperty: (property: string, value: string) => void;
}

const defaultRendererVendorMapRuntimeScope: RendererVendorMapRuntimeScope = {
    deleteTemporaryLeafletGlobals: deleteBrowserLeafletGlobals,
    getDocument: getBrowserDocument,
};

function getDocument(
    scope: RendererVendorMapRuntimeScope
): Pick<Document, "documentElement"> | undefined {
    return scope.getDocument();
}

export function getRendererVendorMapRuntime(
    scope: RendererVendorMapRuntimeScope = defaultRendererVendorMapRuntimeScope
): RendererVendorMapRuntime {
    if (typeof scope.getDocument !== "function") {
        throw new TypeError(
            "rendererVendorMapRuntime requires a document provider"
        );
    }

    return {
        hasDocumentElement(): boolean {
            return getDocument(scope)?.documentElement !== undefined;
        },

        removeTemporaryLeafletGlobals(): void {
            scope.deleteTemporaryLeafletGlobals?.();
        },

        setDocumentElementStyleProperty(property: string, value: string): void {
            getDocument(scope)?.documentElement.style.setProperty(
                property,
                value
            );
        },
    };
}
