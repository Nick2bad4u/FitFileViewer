import {
    getBrowserAbortController,
    getBrowserDocument,
    getBrowserPrint,
} from "../../runtime/browserRuntime.js";

import { getIconFactoryRuntime } from "../../ui/icons/iconFactoryRuntime.js";

export interface CreatePrintButtonRuntimeScope {
    readonly getAbortController?:
        | (() => typeof AbortController | undefined)
        | undefined;
    readonly getDocument?: (() => Document | undefined) | undefined;
    readonly getPrint?: (() => (() => void) | undefined) | undefined;
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

function getDocument(scope: CreatePrintButtonRuntimeScope): Document {
    const runtimeDocument = scope.getDocument?.();
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
            const AbortControllerConstructor = scope.getAbortController?.();
            if (typeof AbortControllerConstructor !== "function") {
                throw new TypeError(
                    "createPrintButton requires an AbortController runtime"
                );
            }

            return new AbortControllerConstructor();
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
            scope.getPrint?.()?.();
        },
    };
}
