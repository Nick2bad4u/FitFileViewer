type RenderChartDomHelpersDocument = Pick<Document, "createElement">;

export interface RenderChartDomHelpersRuntimeScope {
    readonly getDocument?:
        | (() => RenderChartDomHelpersDocument | undefined)
        | undefined;
    readonly getHTMLElement?:
        | (() => typeof globalThis.HTMLElement | undefined)
        | undefined;
}

export interface RenderChartDomHelpersRuntime {
    readonly createElement: <K extends keyof HTMLElementTagNameMap>(
        tagName: K
    ) => HTMLElementTagNameMap[K];
    readonly isHTMLElement: (value: unknown) => value is HTMLElement;
}

const defaultRenderChartDomHelpersRuntimeScope: RenderChartDomHelpersRuntimeScope =
    {
        getDocument: () => globalThis.document,
        getHTMLElement: () => globalThis.HTMLElement,
    };

function getRequiredDocument(
    scope: RenderChartDomHelpersRuntimeScope
): RenderChartDomHelpersDocument {
    const runtimeDocument = scope.getDocument?.();
    if (!runtimeDocument) {
        throw new TypeError(
            "renderChartDomHelpers requires a document runtime"
        );
    }

    return runtimeDocument;
}

export function getRenderChartDomHelpersRuntime(
    scope: RenderChartDomHelpersRuntimeScope = defaultRenderChartDomHelpersRuntimeScope
): RenderChartDomHelpersRuntime {
    return {
        createElement(tagName) {
            return getRequiredDocument(scope).createElement(tagName);
        },
        isHTMLElement(value) {
            return value instanceof getHTMLElementConstructor(scope);
        },
    };
}

function getHTMLElementConstructor(
    scope: RenderChartDomHelpersRuntimeScope
): typeof globalThis.HTMLElement {
    const HTMLElementConstructor = scope.getHTMLElement?.();
    if (typeof HTMLElementConstructor !== "function") {
        throw new TypeError(
            "renderChartDomHelpers requires an HTMLElement runtime"
        );
    }

    return HTMLElementConstructor;
}
