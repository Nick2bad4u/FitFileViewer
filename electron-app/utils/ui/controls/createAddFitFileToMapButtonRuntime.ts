import {
    getBrowserAbortController,
    getBrowserDocument,
} from "../../runtime/browserRuntime.js";

import { getIconFactoryRuntime } from "../icons/iconFactoryRuntime.js";

export interface CreateAddFitFileToMapButtonRuntimeScope {
    readonly getAbortController?:
        | (() => typeof AbortController | undefined)
        | undefined;
    readonly getDocument?: (() => Document | undefined) | undefined;
}

export interface CreateAddFitFileToMapButtonRuntime {
    createAbortController: () => AbortController;
    createButton: () => HTMLButtonElement;
    createElement: <K extends keyof HTMLElementTagNameMap>(
        tagName: K
    ) => HTMLElementTagNameMap[K];
    createSvgElement: <K extends keyof SVGElementTagNameMap>(
        tagName: K
    ) => SVGElementTagNameMap[K];
}

const defaultCreateAddFitFileToMapButtonRuntimeScope: CreateAddFitFileToMapButtonRuntimeScope =
    {
        getAbortController: getBrowserAbortController,
        getDocument: getBrowserDocument,
    };

function getScopeDocument(
    scope: CreateAddFitFileToMapButtonRuntimeScope
): Document | undefined {
    return scope.getDocument?.();
}

function getAbortControllerConstructor(
    scope: CreateAddFitFileToMapButtonRuntimeScope
): typeof AbortController {
    const AbortControllerConstructor =
        scope.getAbortController?.() ??
        getScopeDocument(scope)?.defaultView?.AbortController;
    if (typeof AbortControllerConstructor !== "function") {
        throw new TypeError(
            "createAddFitFileToMapButton requires an AbortController runtime"
        );
    }

    return AbortControllerConstructor;
}

function getDocument(scope: CreateAddFitFileToMapButtonRuntimeScope): Document {
    const runtimeDocument = getScopeDocument(scope);
    if (!runtimeDocument) {
        throw new TypeError(
            "createAddFitFileToMapButton requires a document runtime"
        );
    }

    return runtimeDocument;
}

function createSvgElement<K extends keyof SVGElementTagNameMap>(
    scope: CreateAddFitFileToMapButtonRuntimeScope,
    tagName: K
): SVGElementTagNameMap[K] {
    const runtimeDocument = getDocument(scope);
    return getIconFactoryRuntime({
        getDocument: () => runtimeDocument,
    }).createSvgElement(tagName);
}

export function getCreateAddFitFileToMapButtonRuntime(
    scope: CreateAddFitFileToMapButtonRuntimeScope = defaultCreateAddFitFileToMapButtonRuntimeScope
): CreateAddFitFileToMapButtonRuntime {
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
    };
}
