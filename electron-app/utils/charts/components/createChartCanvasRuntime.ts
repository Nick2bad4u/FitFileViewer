import { getBrowserDocument } from "../../runtime/browserRuntime.js";

type ChartCanvasDocument = Pick<Document, "createElement">;

export interface CreateChartCanvasRuntimeScope {
    readonly getDocument: CreateChartCanvasRuntimeProvider<ChartCanvasDocument>;
}

export interface CreateChartCanvasRuntime {
    readonly createCanvas: () => HTMLCanvasElement;
}

type CreateChartCanvasRuntimeProvider<T> = (() => T | undefined) | undefined;

const defaultCreateChartCanvasRuntimeScope: CreateChartCanvasRuntimeScope = {
    getDocument: getBrowserDocument,
};

function getRequiredDocument(
    getDocument: () => ChartCanvasDocument | undefined
): ChartCanvasDocument {
    const runtimeDocument = getDocument();
    if (!runtimeDocument) {
        throw new TypeError("createChartCanvas requires a document runtime");
    }

    return runtimeDocument;
}

export function getCreateChartCanvasRuntime(
    scope: CreateChartCanvasRuntimeScope = defaultCreateChartCanvasRuntimeScope
): CreateChartCanvasRuntime {
    const getDocument = getRequiredProvider(scope.getDocument, "document");

    return {
        createCanvas(): HTMLCanvasElement {
            return getRequiredDocument(getDocument).createElement("canvas");
        },
    };
}

function getRequiredProvider<T>(
    provider: CreateChartCanvasRuntimeProvider<T>,
    providerName: string
): () => T | undefined {
    if (typeof provider !== "function") {
        throw new TypeError(
            `createChartCanvas requires a ${providerName} provider`
        );
    }

    return provider;
}
