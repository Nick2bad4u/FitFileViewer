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

export function getLastAnimLogRuntime(
    scope: LastAnimLogRuntimeScope = globalThis
): LastAnimLogRuntime {
    return {
        dateNow(): number {
            return scope.dateNow?.() ?? Date.now();
        },
        performanceNow(): number {
            return scope.performance?.now?.() ?? globalThis.performance.now();
        },
    };
}
