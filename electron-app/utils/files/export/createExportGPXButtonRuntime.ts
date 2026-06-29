import {
    type BrowserAbortControllerConstructor,
    type BrowserSetTimeout,
    type BrowserTimerHandle,
    type BrowserURLConstructor,
    getBrowserAbortController,
    getBrowserDocument,
    getBrowserSetTimeout,
    getBrowserURL,
} from "../../runtime/browserRuntime.js";

import { getIconFactoryRuntime } from "../../ui/icons/iconFactoryRuntime.js";

export type CreateExportGPXButtonTimer = BrowserTimerHandle;
type CreateExportGPXButtonURLRuntime = Pick<
    BrowserURLConstructor,
    "createObjectURL" | "revokeObjectURL"
>;
type CreateExportGPXButtonRuntimeProvider<T> =
    | (() => T | undefined)
    | undefined;

export interface CreateExportGPXButtonRuntimeScope {
    readonly getAbortController: CreateExportGPXButtonRuntimeProvider<BrowserAbortControllerConstructor>;
    readonly getDocument: CreateExportGPXButtonRuntimeProvider<Document>;
    readonly getSetTimeout: CreateExportGPXButtonRuntimeProvider<BrowserSetTimeout>;
    readonly getURL: CreateExportGPXButtonRuntimeProvider<CreateExportGPXButtonURLRuntime>;
}

export interface CreateExportGPXButtonRuntime {
    appendToBody: (element: Readonly<HTMLElement>) => void;
    createAbortController: () => AbortController;
    createButton: () => HTMLButtonElement;
    createElement: <K extends keyof HTMLElementTagNameMap>(
        tagName: K
    ) => HTMLElementTagNameMap[K];
    createObjectURL: (blob: Blob) => string;
    createSvgElement: <K extends keyof SVGElementTagNameMap>(
        tagName: K
    ) => SVGElementTagNameMap[K];
    revokeObjectURL: (url: string) => void;
    setTimeout: (
        callback: () => void,
        timeout: number
    ) => CreateExportGPXButtonTimer;
}

function getRequiredProvider<T>(
    provider: CreateExportGPXButtonRuntimeProvider<T>,
    providerName: string
): () => T | undefined {
    if (typeof provider !== "function") {
        const article = /^[AEIOUHaeiou]/u.test(providerName) ? "an" : "a";

        throw new TypeError(
            `createExportGPXButton requires ${article} ${providerName} provider`
        );
    }

    return provider;
}

function getAbortControllerConstructor(
    scope: CreateExportGPXButtonRuntimeScope
): BrowserAbortControllerConstructor {
    const AbortControllerConstructor = getRequiredProvider(
        scope.getAbortController,
        "AbortController"
    )();
    if (typeof AbortControllerConstructor !== "function") {
        throw new TypeError(
            "createExportGPXButton requires an AbortController runtime"
        );
    }

    return AbortControllerConstructor;
}

function getDocument(scope: CreateExportGPXButtonRuntimeScope): Document {
    const runtimeDocument = getRequiredProvider(
        scope.getDocument,
        "document"
    )();
    if (!runtimeDocument) {
        throw new TypeError(
            "createExportGPXButton requires a document runtime"
        );
    }

    return runtimeDocument;
}

function getURLRuntime(
    scope: CreateExportGPXButtonRuntimeScope
): CreateExportGPXButtonURLRuntime {
    const urlRuntime = getRequiredProvider(scope.getURL, "object URL")();
    if (
        !urlRuntime ||
        typeof urlRuntime.createObjectURL !== "function" ||
        typeof urlRuntime.revokeObjectURL !== "function"
    ) {
        throw new TypeError("createExportGPXButton requires a URL runtime");
    }

    return urlRuntime;
}

function getSetTimeout(
    scope: CreateExportGPXButtonRuntimeScope
): BrowserSetTimeout {
    const setTimeoutRef = getRequiredProvider(
        scope.getSetTimeout,
        "setTimeout"
    )();
    if (typeof setTimeoutRef !== "function") {
        throw new TypeError(
            "createExportGPXButton requires a setTimeout runtime"
        );
    }

    return setTimeoutRef;
}

function createSvgElement<K extends keyof SVGElementTagNameMap>(
    scope: CreateExportGPXButtonRuntimeScope,
    tagName: K
): SVGElementTagNameMap[K] {
    const runtimeDocument = getDocument(scope);
    return getIconFactoryRuntime({
        getDocument: () => runtimeDocument,
    }).createSvgElement(tagName);
}

const defaultCreateExportGPXButtonRuntimeScope: CreateExportGPXButtonRuntimeScope =
    {
        getAbortController: getBrowserAbortController,
        getDocument: getBrowserDocument,
        getSetTimeout: getBrowserSetTimeout,
        getURL: getBrowserURL,
    };

export function getCreateExportGPXButtonRuntime(
    scope: CreateExportGPXButtonRuntimeScope = defaultCreateExportGPXButtonRuntimeScope
): CreateExportGPXButtonRuntime {
    return {
        appendToBody(element): void {
            getDocument(scope).body.append(element);
        },
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
        createObjectURL(blob): string {
            return getURLRuntime(scope).createObjectURL(blob);
        },
        createSvgElement<K extends keyof SVGElementTagNameMap>(
            tagName: K
        ): SVGElementTagNameMap[K] {
            return createSvgElement(scope, tagName);
        },
        revokeObjectURL(url): void {
            getURLRuntime(scope).revokeObjectURL(url);
        },
        setTimeout(callback, timeout): CreateExportGPXButtonTimer {
            return getSetTimeout(scope)(callback, timeout);
        },
    };
}
