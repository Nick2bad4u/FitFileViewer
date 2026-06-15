export interface RendererVendorMapRuntimeScope {
    readonly document?: Pick<Document, "documentElement"> | undefined;
}

export interface RendererVendorMapRuntime {
    hasDocumentElement: () => boolean;
    setDocumentElementStyleProperty: (property: string, value: string) => void;
}

const defaultRendererVendorMapRuntimeScope: RendererVendorMapRuntimeScope =
    globalThis;

export function getRendererVendorMapRuntime(
    scope: RendererVendorMapRuntimeScope = defaultRendererVendorMapRuntimeScope
): RendererVendorMapRuntime {
    return {
        hasDocumentElement(): boolean {
            return scope.document?.documentElement !== undefined;
        },

        setDocumentElementStyleProperty(property: string, value: string): void {
            scope.document?.documentElement.style.setProperty(property, value);
        },
    };
}
