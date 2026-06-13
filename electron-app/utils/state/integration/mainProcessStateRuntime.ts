export interface MainProcessStateRuntimeScope {
    readonly dateNow?: (() => number) | undefined;
    readonly performance?:
        | {
              readonly now?: (() => number) | undefined;
          }
        | undefined;
}

export interface MainProcessStateRuntime {
    monotonicNowMs: () => number;
}

export function getMainProcessStateRuntime(
    scope: MainProcessStateRuntimeScope = globalThis
): MainProcessStateRuntime {
    return {
        monotonicNowMs(): number {
            return scope.performance?.now?.() ?? scope.dateNow?.() ?? Date.now();
        },
    };
}
