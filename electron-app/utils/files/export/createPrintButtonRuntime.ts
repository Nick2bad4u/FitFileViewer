import {
    type BrowserAbortControllerConstructor,
    getBrowserAbortController,
    getBrowserDocument,
    getBrowserPrint,
} from "../../runtime/browserRuntime.js";

import { getIconFactoryRuntime } from "../../ui/icons/iconFactoryRuntime.js";

export interface CreatePrintButtonRuntimeScope {
    readonly getAbortController: CreatePrintButtonRuntimeProvider<BrowserAbortControllerConstructor>;
    readonly getDocument: CreatePrintButtonRuntimeProvider<Document>;
    readonly getPrint: CreatePrintButtonRuntimeProvider<CreatePrintButtonPrint>;
}

export interface CreatePrintButtonRuntime {
    createAbortController: () => AbortController;
    createButton: () => HTMLButtonElement;
    createElement: <K extends keyof HTMLElementTagNameMap>(
        tagName: K
    ) => HTMLElementTagNameMap[K];
    createSvgElement: <K extends keyof SVGElementTagNameMap>(
        tagName: K
    ) => SVGElementTagNameMap[K];
    print: () => void;
}

type CreatePrintButtonPrint = () => void;

type CreatePrintButtonRuntimeProvider<T> = (() => T | undefined) | undefined;

function getRequiredProvider<T>(
    provider: CreatePrintButtonRuntimeProvider<T>,
    providerName: string
): () => T | undefined {
    if (typeof provider !== "function") {
        const article = /^[AEIOUHaeiou]/u.test(providerName) ? "an" : "a";

        throw new TypeError(
            `createPrintButton requires ${article} ${providerName} provider`
        );
    }

    return provider;
}

function getAbortControllerConstructor(
    scope: CreatePrintButtonRuntimeScope
): BrowserAbortControllerConstructor {
    const AbortControllerConstructor = getRequiredProvider(
        scope.getAbortController,
        "AbortController"
    )();
    if (typeof AbortControllerConstructor !== "function") {
        throw new TypeError(
            "createPrintButton requires an AbortController runtime"
        );
    }

    return AbortControllerConstructor;
}

function getDocument(scope: CreatePrintButtonRuntimeScope): Document {
    const runtimeDocument = getRequiredProvider(
        scope.getDocument,
        "document"
    )();
    if (!runtimeDocument) {
        throw new TypeError("createPrintButton requires a document runtime");
    }

    return runtimeDocument;
}

function createSvgElement<K extends keyof SVGElementTagNameMap>(
    scope: CreatePrintButtonRuntimeScope,
    tagName: K
): SVGElementTagNameMap[K] {
    const runtimeDocument = getDocument(scope);
    return getIconFactoryRuntime({
        getDocument: () => runtimeDocument,
    }).createSvgElement(tagName);
}

const defaultCreatePrintButtonRuntimeScope: CreatePrintButtonRuntimeScope = {
    getAbortController: getBrowserAbortController,
    getDocument: getBrowserDocument,
    getPrint: getBrowserPrint,
};

export function getCreatePrintButtonRuntime(
    scope: CreatePrintButtonRuntimeScope = defaultCreatePrintButtonRuntimeScope
): CreatePrintButtonRuntime {
    return {
        createAbortController(): AbortController {
            return new (getAbortControllerConstructor(scope))();
        },
        createButton(): HTMLButtonElement {
            return getDocument(scope).createElement("button");
        },
        createElement<K extends keyof HTMLElementTagNameMap>(
            tagName: K
        ): HTMLElementTagNameMap[K] {
            return getDocument(scope).createElement(tagName);
        },
        createSvgElement<K extends keyof SVGElementTagNameMap>(
            tagName: K
        ): SVGElementTagNameMap[K] {
            return createSvgElement(scope, tagName);
        },
        print(): void {
            getRequiredProvider(scope.getPrint, "print")()?.();
        },
    };
}
