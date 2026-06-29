import {
    getBrowserComputedStyle,
    getBrowserDocument,
} from "../../runtime/browserRuntime.js";

export interface UpdateControlsStateRuntimeScope {
    readonly getComputedStyle:
        | ((
              element: Element,
              pseudoElement?: null | string
          ) => CSSStyleDeclaration | undefined)
        | undefined;
    readonly getDocument: (() => Document | undefined) | undefined;
}

export interface UpdateControlsStateRuntime {
    getComputedDisplay(element: Element): string;
    getDocument(): Document;
}

const defaultUpdateControlsStateRuntimeScope: UpdateControlsStateRuntimeScope =
    {
        getComputedStyle: (element, pseudoElement) => {
            const getComputedStyle = getBrowserComputedStyle();
            return pseudoElement === undefined
                ? getComputedStyle?.(element)
                : getComputedStyle?.(element, pseudoElement);
        },
        getDocument: getBrowserDocument,
    };

export function getUpdateControlsStateRuntime(
    scope: UpdateControlsStateRuntimeScope = defaultUpdateControlsStateRuntimeScope
): UpdateControlsStateRuntime {
    return {
        getComputedDisplay(element: Element): string {
            if (typeof scope.getComputedStyle !== "function") {
                throw new TypeError(
                    "updateControlsState requires a computed style provider"
                );
            }

            return scope.getComputedStyle(element)?.display ?? "";
        },
        getDocument(): Document {
            if (typeof scope.getDocument !== "function") {
                throw new TypeError(
                    "updateControlsState requires a document provider"
                );
            }

            const runtimeDocument = scope.getDocument();
            if (!runtimeDocument) {
                throw new TypeError(
                    "updateControlsState requires a document runtime"
                );
            }

            return runtimeDocument;
        },
    };
}
