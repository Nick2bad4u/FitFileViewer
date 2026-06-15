export interface StateManagerDefaultsRuntimeScope {
    readonly dateNow?: (() => number) | undefined;
    readonly document?:
        | {
              readonly title?: string | undefined;
          }
        | undefined;
    readonly performance?:
        | {
              readonly now?: (() => number) | undefined;
          }
        | undefined;
}

export interface StateManagerDefaultsRuntime {
    getDefaultDocumentTitle: () => string;
    getStartTime: () => number;
}

const defaultStateManagerDefaultsRuntimeScope: StateManagerDefaultsRuntimeScope =
    {
        dateNow: Date.now,
        get document() {
            return globalThis.document;
        },
        get performance() {
            return globalThis.performance;
        },
    };

function getRequiredStartClock(
    scope: StateManagerDefaultsRuntimeScope
): () => number {
    const performanceNow = scope.performance?.now;
    if (typeof performanceNow === "function") {
        return performanceNow.bind(scope.performance);
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
            return scope.document?.title || "Fit File Viewer";
        },
        getStartTime(): number {
            return getRequiredStartClock(scope)();
        },
    };
}
