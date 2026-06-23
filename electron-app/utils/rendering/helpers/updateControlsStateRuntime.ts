export interface UpdateControlsStateRuntimeScope {
    readonly getComputedStyle?:
        | ((
              element: Element,
              pseudoElement?: null | string
          ) => CSSStyleDeclaration)
        | undefined;
    readonly getDocument?: (() => Document | undefined) | undefined;
}

export interface UpdateControlsStateRuntime {
    getComputedDisplay(element: Element): string;
    getDocument(): Document;
}

const defaultUpdateControlsStateRuntimeScope: UpdateControlsStateRuntimeScope =
    {
        getComputedStyle: (element) => globalThis.getComputedStyle(element),
        getDocument: () => globalThis.document,
    };

export function getUpdateControlsStateRuntime(
    scope: UpdateControlsStateRuntimeScope = defaultUpdateControlsStateRuntimeScope
): UpdateControlsStateRuntime {
    return {
        getComputedDisplay(element: Element): string {
            return scope.getComputedStyle?.(element).display ?? "";
        },
        getDocument(): Document {
            const runtimeDocument = scope.getDocument?.();
            if (!runtimeDocument) {
                throw new TypeError(
                    "updateControlsState requires a document runtime"
                );
            }

            return runtimeDocument;
        },
    };
}
