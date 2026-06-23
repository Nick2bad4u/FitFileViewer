export interface OpenFitFileFromPathRuntimeScope {
    readonly getHTMLElement?:
        | (() => typeof globalThis.HTMLElement | undefined)
        | undefined;
}

export interface OpenFitFileFromPathRuntime {
    isHTMLElement: (value: unknown) => value is HTMLElement;
}

const defaultOpenFitFileFromPathRuntimeScope: OpenFitFileFromPathRuntimeScope =
    {
        getHTMLElement: () => globalThis.HTMLElement,
    };

function getHTMLElementConstructor(
    scope: OpenFitFileFromPathRuntimeScope
): typeof globalThis.HTMLElement {
    const HTMLElementConstructor = scope.getHTMLElement?.();
    if (typeof HTMLElementConstructor !== "function") {
        throw new TypeError(
            "openFitFileFromPath requires an HTMLElement runtime"
        );
    }

    return HTMLElementConstructor;
}

export function getOpenFitFileFromPathRuntime(
    scope: OpenFitFileFromPathRuntimeScope = defaultOpenFitFileFromPathRuntimeScope
): OpenFitFileFromPathRuntime {
    return {
        isHTMLElement(value: unknown): value is HTMLElement {
            return value instanceof getHTMLElementConstructor(scope);
        },
    };
}
