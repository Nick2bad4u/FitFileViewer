export interface RendererVendorMapRuntimeScope {
    readonly getDocument?:
        | (() => Pick<Document, "documentElement"> | undefined)
        | undefined;
    readonly getGlobalScope?: (() => object | undefined) | undefined;
}

export interface RendererVendorMapRuntime {
    deleteCompatibilityGlobal: (property: "L" | "Leaflet") => void;
    hasDocumentElement: () => boolean;
    setDocumentElementStyleProperty: (property: string, value: string) => void;
}

const defaultRendererVendorMapRuntimeScope: RendererVendorMapRuntimeScope = {
    getDocument: () => globalThis.document,
    getGlobalScope: () => globalThis,
};

function getDocument(
    scope: RendererVendorMapRuntimeScope
): Pick<Document, "documentElement"> | undefined {
    return scope.getDocument?.();
}

function getGlobalScope(scope: RendererVendorMapRuntimeScope): object | null {
    return scope.getGlobalScope?.() ?? null;
}

export function getRendererVendorMapRuntime(
    scope: RendererVendorMapRuntimeScope = defaultRendererVendorMapRuntimeScope
): RendererVendorMapRuntime {
    return {
        deleteCompatibilityGlobal(property: "L" | "Leaflet"): void {
            const globalScope = getGlobalScope(scope);
            if (globalScope !== null) {
                Reflect.deleteProperty(globalScope, property);
            }
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
