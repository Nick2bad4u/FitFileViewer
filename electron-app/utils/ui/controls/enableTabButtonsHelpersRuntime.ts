import {
    getBrowserComputedStyle,
    getBrowserDocument,
    getBrowserHTMLElement,
} from "../../runtime/browserRuntime.js";

export interface EnableTabButtonsHelpersRuntimeDocument {
    readonly getElementsByClassName?:
        | ((classNames: string) => HTMLCollectionOf<Element>)
        | undefined;
    readonly querySelectorAll?:
        | ((selectors: string) => NodeListOf<Element>)
        | undefined;
}

type EnableTabButtonsHelpersGetComputedStyle = (
    element: Readonly<Element>,
    pseudoElement?: null | string
) => CSSStyleDeclaration;

export interface EnableTabButtonsHelpersRuntimeScope {
    readonly getDocument?:
        | (() => EnableTabButtonsHelpersRuntimeDocument | undefined)
        | undefined;
    readonly getComputedStyleFunction?:
        | (() => EnableTabButtonsHelpersGetComputedStyle | undefined)
        | undefined;
    readonly getHTMLElement?:
        | (() => typeof globalThis.HTMLElement | undefined)
        | undefined;
    readonly isRendererScope?: (() => boolean) | undefined;
}

export interface EnableTabButtonsHelpersRuntime {
    readonly getComputedStyle: (
        element: Readonly<Element>
    ) => CSSStyleDeclaration | undefined;
    readonly queryTabButtons: () => HTMLElement[];
}

const defaultEnableTabButtonsHelpersRuntimeScope: EnableTabButtonsHelpersRuntimeScope =
    {
        getComputedStyleFunction: getBrowserComputedStyle,
        getDocument: getBrowserDocument,
        getHTMLElement: getBrowserHTMLElement,
        isRendererScope: () => getBrowserDocument() !== undefined,
    };

function getComputedStyleFunction(
    scope: EnableTabButtonsHelpersRuntimeScope
): EnableTabButtonsHelpersGetComputedStyle | undefined {
    return scope.getComputedStyleFunction?.();
}

function getDocument(
    scope: EnableTabButtonsHelpersRuntimeScope
): EnableTabButtonsHelpersRuntimeDocument | undefined {
    return scope.getDocument?.();
}

function getHTMLElementConstructor(
    scope: EnableTabButtonsHelpersRuntimeScope
): typeof globalThis.HTMLElement {
    const HTMLElementConstructor = scope.getHTMLElement?.();
    if (typeof HTMLElementConstructor !== "function") {
        throw new TypeError(
            "enableTabButtonsHelpers requires an HTMLElement runtime"
        );
    }

    return HTMLElementConstructor;
}

function isRendererScope(scope: EnableTabButtonsHelpersRuntimeScope): boolean {
    return scope.isRendererScope?.() === true;
}

function toHTMLElementArray(
    scope: EnableTabButtonsHelpersRuntimeScope,
    elements: Readonly<ArrayLike<Element>>
): HTMLElement[] {
    const HTMLElementConstructor = getHTMLElementConstructor(scope);

    return Array.from(
        { length: elements.length },
        (_, index) => elements[index]
    ).filter(
        (element): element is HTMLElement =>
            element instanceof HTMLElementConstructor
    );
}

export function getEnableTabButtonsHelpersRuntime(
    scope: EnableTabButtonsHelpersRuntimeScope = defaultEnableTabButtonsHelpersRuntimeScope
): EnableTabButtonsHelpersRuntime {
    return {
        getComputedStyle(
            element: Readonly<Element>
        ): CSSStyleDeclaration | undefined {
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
                return toHTMLElementArray(
                    scope,
                    runtimeDocument.querySelectorAll(".tab-button")
                );
            }

            if (typeof runtimeDocument.getElementsByClassName === "function") {
                return toHTMLElementArray(
                    scope,
                    runtimeDocument.getElementsByClassName("tab-button")
                );
            }

            return [];
        },
    };
}
