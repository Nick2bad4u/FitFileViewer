type StateManagerDefaultsDocumentRuntime = {
    readonly title?: string | undefined;
};

type StateManagerDefaultsPerformanceRuntime = {
    readonly now?: (() => number) | undefined;
};

export interface StateManagerDefaultsRuntimeScope {
    readonly dateNow?: (() => number) | undefined;
    readonly document?: StateManagerDefaultsDocumentRuntime | undefined;
    readonly getDocument?:
        | (() => StateManagerDefaultsDocumentRuntime | undefined)
        | undefined;
    readonly getPerformance?:
        | (() => StateManagerDefaultsPerformanceRuntime | undefined)
        | undefined;
    readonly performance?: StateManagerDefaultsPerformanceRuntime | undefined;
}

export interface StateManagerDefaultsRuntime {
    getDefaultDocumentTitle: () => string;
    getStartTime: () => number;
}

const defaultStateManagerDefaultsRuntimeScope: StateManagerDefaultsRuntimeScope =
    {
        dateNow: Date.now,
        getDocument: () => globalThis.document,
        getPerformance: () => globalThis.performance,
    };

function getRequiredStartClock(
    scope: StateManagerDefaultsRuntimeScope
): () => number {
    const performance = scope.getPerformance?.() ?? scope.performance;
    const performanceNow = performance?.now;
    if (typeof performanceNow === "function") {
        return performanceNow.bind(performance);
    }

    const dateNow = scope.dateNow;
    if (typeof dateNow === "function") {
        return dateNow;
    }

    throw new TypeError("stateManagerDefaultsRuntime requires a clock");
}

export function getStateManagerDefaultsRuntime(
    scope: StateManagerDefaultsRuntimeScope = defaultStateManagerDefaultsRuntimeScope
): StateManagerDefaultsRuntime {
    return {
        getDefaultDocumentTitle(): string {
            const document = scope.getDocument?.() ?? scope.document;
            return document?.title || "Fit File Viewer";
        },
        getStartTime(): number {
            return getRequiredStartClock(scope)();
        },
    };
}
