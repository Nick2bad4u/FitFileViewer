import { getBrowserDocument } from "../../runtime/browserRuntime.js";

type ChartCanvasDocument = Pick<Document, "createElement">;

export interface CreateChartCanvasRuntimeScope {
    readonly getDocument?: (() => ChartCanvasDocument | undefined) | undefined;
}

export interface CreateChartCanvasRuntime {
    readonly createCanvas: () => HTMLCanvasElement;
}

const defaultCreateChartCanvasRuntimeScope: CreateChartCanvasRuntimeScope = {
    getDocument: getBrowserDocument,
};

function getRequiredDocument(
    scope: CreateChartCanvasRuntimeScope
): ChartCanvasDocument {
    const runtimeDocument = scope.getDocument?.();
    if (!runtimeDocument) {
        throw new TypeError("createChartCanvas requires a document runtime");
    }

    return runtimeDocument;
}

export function getCreateChartCanvasRuntime(
    scope: CreateChartCanvasRuntimeScope = defaultCreateChartCanvasRuntimeScope
): CreateChartCanvasRuntime {
    return {
        createCanvas(): HTMLCanvasElement {
            return getRequiredDocument(scope).createElement("canvas");
        },
    };
}
