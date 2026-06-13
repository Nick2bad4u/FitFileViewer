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

export function getStateManagerDefaultsRuntime(
    scope: StateManagerDefaultsRuntimeScope = globalThis
): StateManagerDefaultsRuntime {
    return {
        getDefaultDocumentTitle(): string {
            return scope.document?.title || "Fit File Viewer";
        },
        getStartTime(): number {
            return scope.performance?.now?.() ?? scope.dateNow?.() ?? Date.now();
        },
    };
}
