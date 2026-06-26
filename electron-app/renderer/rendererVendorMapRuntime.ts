import {
    deleteBrowserGlobalProperty,
    getBrowserDocument,
} from "../utils/runtime/browserRuntime.js";

export interface RendererVendorMapRuntimeScope {
    readonly deleteGlobalProperty?:
        | ((property: "L" | "Leaflet") => boolean)
        | undefined;
    readonly getDocument?:
        | (() => Pick<Document, "documentElement"> | undefined)
        | undefined;
}

export interface RendererVendorMapRuntime {
    hasDocumentElement: () => boolean;
    removeTemporaryLeafletGlobals: () => void;
    setDocumentElementStyleProperty: (property: string, value: string) => void;
}

const defaultRendererVendorMapRuntimeScope: RendererVendorMapRuntimeScope = {
    deleteGlobalProperty: deleteBrowserGlobalProperty,
    getDocument: getBrowserDocument,
};

function getDocument(
    scope: RendererVendorMapRuntimeScope
): Pick<Document, "documentElement"> | undefined {
    return scope.getDocument?.();
}

export function getRendererVendorMapRuntime(
    scope: RendererVendorMapRuntimeScope = defaultRendererVendorMapRuntimeScope
): RendererVendorMapRuntime {
    return {
        hasDocumentElement(): boolean {
            return getDocument(scope)?.documentElement !== undefined;
        },

        removeTemporaryLeafletGlobals(): void {
            scope.deleteGlobalProperty?.("L");
            scope.deleteGlobalProperty?.("Leaflet");
        },

        setDocumentElementStyleProperty(property: string, value: string): void {
            getDocument(scope)?.documentElement.style.setProperty(
                property,
                value
            );
        },
    };
}
