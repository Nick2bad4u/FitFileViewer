export interface EnableTabButtonsHelpersRuntimeDocument {
    readonly getElementsByClassName?:
        | ((classNames: string) => HTMLCollectionOf<Element>)
        | undefined;
    readonly querySelectorAll?:
        | ((selectors: string) => NodeListOf<Element>)
        | undefined;
}

export interface EnableTabButtonsHelpersRuntimeScope {
    readonly document?: EnableTabButtonsHelpersRuntimeDocument | undefined;
    readonly getComputedStyle?:
        | ((element: Element, pseudoElement?: null | string) => CSSStyleDeclaration)
        | undefined;
    readonly window?: unknown;
}

export interface EnableTabButtonsHelpersRuntime {
    getComputedStyle(element: Element): CSSStyleDeclaration | undefined;
    queryTabButtons(): HTMLElement[];
}

const defaultEnableTabButtonsHelpersRuntimeScope: EnableTabButtonsHelpersRuntimeScope =
    globalThis;

export function getEnableTabButtonsHelpersRuntime(
    scope: EnableTabButtonsHelpersRuntimeScope = defaultEnableTabButtonsHelpersRuntimeScope
): EnableTabButtonsHelpersRuntime {
    return {
        getComputedStyle(element: Element): CSSStyleDeclaration | undefined {
            if (
                scope.window === undefined ||
                typeof scope.getComputedStyle !== "function"
            ) {
                return undefined;
            }

            return scope.getComputedStyle(element);
        },
        queryTabButtons(): HTMLElement[] {
            const runtimeDocument = scope.document;
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
