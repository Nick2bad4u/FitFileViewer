type RenderChartDomHelpersDocument = Pick<Document, "createElement">;

export interface RenderChartDomHelpersRuntimeScope {
    readonly getDocument?:
        | (() => RenderChartDomHelpersDocument | undefined)
        | undefined;
}

export interface RenderChartDomHelpersRuntime {
    readonly createElement: <K extends keyof HTMLElementTagNameMap>(
        tagName: K
    ) => HTMLElementTagNameMap[K];
}

const defaultRenderChartDomHelpersRuntimeScope: RenderChartDomHelpersRuntimeScope =
    {
        getDocument: () => globalThis.document,
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
    };
}
