import {
    getBrowserComputedStyle,
    getBrowserDocument,
} from "../../runtime/browserRuntime.js";

type UpdateControlsStateGetComputedStyle = (
    element: Element,
    pseudoElement?: null | string
) => CSSStyleDeclaration | undefined;

type UpdateControlsStateRuntimeProvider<T> = T | undefined;

export interface UpdateControlsStateRuntimeScope {
    readonly getComputedStyle: UpdateControlsStateRuntimeProvider<UpdateControlsStateGetComputedStyle>;
    readonly getDocument: UpdateControlsStateRuntimeProvider<
        () => Document | undefined
    >;
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
    const getComputedStyle = getRequiredProvider(
        scope.getComputedStyle,
        "computed style"
    );
    const getDocument = getRequiredProvider(scope.getDocument, "document");

    return {
        getComputedDisplay(element: Element): string {
            return getComputedStyle(element)?.display ?? "";
        },
        getDocument(): Document {
            const runtimeDocument = getDocument();
            if (!runtimeDocument) {
                throw new TypeError(
                    "updateControlsState requires a document runtime"
                );
            }

            return runtimeDocument;
        },
    };
}

function getRequiredProvider<T>(
    provider: UpdateControlsStateRuntimeProvider<T>,
    providerName: string
): T {
    if (typeof provider !== "function") {
        throw new TypeError(
            `updateControlsState requires a ${providerName} provider`
        );
    }

    return provider;
}
