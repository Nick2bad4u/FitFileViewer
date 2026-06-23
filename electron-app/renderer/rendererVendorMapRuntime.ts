export interface RendererVendorMapRuntimeScope {
    readonly deleteGlobalProperty?:
        | ((property: "L" | "Leaflet") => boolean)
        | undefined;
    readonly getDocument?:
        | (() => Pick<Document, "documentElement"> | undefined)
        | undefined;
}

export interface RendererVendorMapRuntime {
    deleteCompatibilityGlobal: (property: "L" | "Leaflet") => void;
    hasDocumentElement: () => boolean;
    setDocumentElementStyleProperty: (property: string, value: string) => void;
}

const defaultRendererVendorMapRuntimeScope: RendererVendorMapRuntimeScope = {
    deleteGlobalProperty: (property) =>
        Reflect.deleteProperty(globalThis, property),
    getDocument: () => globalThis.document,
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
        deleteCompatibilityGlobal(property: "L" | "Leaflet"): void {
            scope.deleteGlobalProperty?.(property);
        },

        hasDocumentElement(): boolean {
            return getDocument(scope)?.documentElement !== undefined;
        },

        setDocumentElementStyleProperty(property: string, value: string): void {
            getDocument(scope)?.documentElement.style.setProperty(
                property,
                value
            );
        },
    };
}
