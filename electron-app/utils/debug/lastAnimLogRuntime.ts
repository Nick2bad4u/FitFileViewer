export interface LastAnimLogRuntimeScope {
    readonly dateNow?: (() => number) | undefined;
    readonly performance?:
        | {
              readonly now?: (() => number) | undefined;
          }
        | undefined;
}

export interface LastAnimLogRuntime {
    dateNow(): number;
    performanceNow(): number;
}

const defaultLastAnimLogRuntimeScope: LastAnimLogRuntimeScope = {
    dateNow: Date.now,
    get performance() {
        return globalThis.performance;
    },
};

function getRequiredDateNow(scope: LastAnimLogRuntimeScope): () => number {
    const dateNow = scope.dateNow;
    if (typeof dateNow !== "function") {
        throw new TypeError("lastAnimLogRuntime requires dateNow");
    }

    return dateNow;
}

function getRequiredPerformanceNow(
    scope: LastAnimLogRuntimeScope
): () => number {
    const performanceNow = scope.performance?.now;
    if (typeof performanceNow !== "function") {
        throw new TypeError("lastAnimLogRuntime requires performance.now");
    }

    return performanceNow.bind(scope.performance);
}

export function getLastAnimLogRuntime(
    scope: LastAnimLogRuntimeScope = defaultLastAnimLogRuntimeScope
): LastAnimLogRuntime {
    return {
        dateNow(): number {
            return getRequiredDateNow(scope)();
        },
        performanceNow(): number {
            return getRequiredPerformanceNow(scope)();
        },
    };
}
