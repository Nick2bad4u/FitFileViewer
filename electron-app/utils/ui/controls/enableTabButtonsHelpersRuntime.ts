export interface EnableTabButtonsHelpersRuntimeDocument {
    readonly getElementsByClassName?:
        | ((classNames: string) => HTMLCollectionOf<Element>)
        | undefined;
    readonly querySelectorAll?:
        | ((selectors: string) => NodeListOf<Element>)
        | undefined;
}

type EnableTabButtonsHelpersGetComputedStyle = (
    element: Element,
    pseudoElement?: null | string
) => CSSStyleDeclaration;

export interface EnableTabButtonsHelpersRuntimeScope {
    readonly document?: EnableTabButtonsHelpersRuntimeDocument | undefined;
    readonly getDocument?:
        | (() => EnableTabButtonsHelpersRuntimeDocument | undefined)
        | undefined;
    readonly getComputedStyle?:
        | EnableTabButtonsHelpersGetComputedStyle
        | undefined;
    readonly getComputedStyleFunction?:
        | (() => EnableTabButtonsHelpersGetComputedStyle | undefined)
        | undefined;
    readonly isRendererScope?: (() => boolean) | undefined;
}

export interface EnableTabButtonsHelpersRuntime {
    getComputedStyle(element: Element): CSSStyleDeclaration | undefined;
    queryTabButtons(): HTMLElement[];
}

const defaultEnableTabButtonsHelpersRuntimeScope: EnableTabButtonsHelpersRuntimeScope =
    {
        getComputedStyleFunction: () => globalThis.getComputedStyle,
        getDocument: () => globalThis.document,
        isRendererScope: () => globalThis.document !== undefined,
    };

function getComputedStyleFunction(
    scope: EnableTabButtonsHelpersRuntimeScope
): EnableTabButtonsHelpersGetComputedStyle | undefined {
    return scope.getComputedStyleFunction?.() ?? scope.getComputedStyle;
}

function getDocument(
    scope: EnableTabButtonsHelpersRuntimeScope
): EnableTabButtonsHelpersRuntimeDocument | undefined {
    return scope.getDocument?.() ?? scope.document;
}

function isRendererScope(scope: EnableTabButtonsHelpersRuntimeScope): boolean {
    return scope.isRendererScope?.() === true;
}

export function getEnableTabButtonsHelpersRuntime(
    scope: EnableTabButtonsHelpersRuntimeScope = defaultEnableTabButtonsHelpersRuntimeScope
): EnableTabButtonsHelpersRuntime {
    return {
        getComputedStyle(element: Element): CSSStyleDeclaration | undefined {
            const getComputedStyleRef = getComputedStyleFunction(scope);
            if (
                !isRendererScope(scope) ||
                typeof getComputedStyleRef !== "function"
            ) {
                return undefined;
            }

            return getComputedStyleRef(element);
        },
        queryTabButtons(): HTMLElement[] {
            const runtimeDocument = getDocument(scope);
            if (!runtimeDocument) {
                return [];
            }

            if (typeof runtimeDocument.querySelectorAll === "function") {
                return [
                    ...(runtimeDocument.querySelectorAll(
                        ".tab-button"
                    ) as NodeListOf<HTMLElement>),
                ];
            }

            if (typeof runtimeDocument.getElementsByClassName === "function") {
                return [
                    ...(runtimeDocument.getElementsByClassName(
                        "tab-button"
                    ) as HTMLCollectionOf<HTMLElement>),
                ];
            }

            return [];
        },
    };
}
