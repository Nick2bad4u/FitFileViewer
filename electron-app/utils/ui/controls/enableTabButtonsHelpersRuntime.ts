import {
    type BrowserHTMLElementConstructor,
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
type EnableTabButtonsHelpersRuntimeProvider<T> =
    | (() => T | undefined)
    | undefined;

export interface EnableTabButtonsHelpersRuntimeScope {
    readonly getDocument: EnableTabButtonsHelpersRuntimeProvider<EnableTabButtonsHelpersRuntimeDocument>;
    readonly getComputedStyleFunction: EnableTabButtonsHelpersRuntimeProvider<EnableTabButtonsHelpersGetComputedStyle>;
    readonly getHTMLElement: EnableTabButtonsHelpersRuntimeProvider<BrowserHTMLElementConstructor>;
    readonly isRendererScope: EnableTabButtonsHelpersRuntimeProvider<boolean>;
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

function getRequiredProvider<T>(
    provider: EnableTabButtonsHelpersRuntimeProvider<T>,
    providerName: string
): () => T | undefined {
    if (typeof provider !== "function") {
        const article = /^[AEIOUHaeiou]/u.test(providerName) ? "an" : "a";

        throw new TypeError(
            `enableTabButtonsHelpers requires ${article} ${providerName} provider`
        );
    }

    return provider;
}

function getComputedStyleFunction(
    scope: EnableTabButtonsHelpersRuntimeScope
): EnableTabButtonsHelpersGetComputedStyle | undefined {
    return getRequiredProvider(
        scope.getComputedStyleFunction,
        "getComputedStyle"
    )();
}

function getDocument(
    scope: EnableTabButtonsHelpersRuntimeScope
): EnableTabButtonsHelpersRuntimeDocument | undefined {
    return getRequiredProvider(scope.getDocument, "document")();
}

function getHTMLElementConstructor(
    scope: EnableTabButtonsHelpersRuntimeScope
): BrowserHTMLElementConstructor {
    const HTMLElementConstructor = getRequiredProvider(
        scope.getHTMLElement,
        "HTMLElement"
    )();
    if (typeof HTMLElementConstructor !== "function") {
        throw new TypeError(
            "enableTabButtonsHelpers requires an HTMLElement runtime"
        );
    }

    return HTMLElementConstructor;
}

function isRendererScope(scope: EnableTabButtonsHelpersRuntimeScope): boolean {
    return (
        getRequiredProvider(scope.isRendererScope, "isRendererScope")() === true
    );
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
