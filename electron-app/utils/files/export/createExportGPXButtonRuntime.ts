import {
    getBrowserAbortController,
    getBrowserDocument,
    getBrowserSetTimeout,
    getBrowserURL,
} from "../../runtime/browserRuntime.js";

import { getIconFactoryRuntime } from "../../ui/icons/iconFactoryRuntime.js";

export type CreateExportGPXButtonTimer = ReturnType<
    typeof globalThis.setTimeout
>;
type CreateExportGPXButtonURLRuntime = Pick<
    typeof URL,
    "createObjectURL" | "revokeObjectURL"
>;

export interface CreateExportGPXButtonRuntimeScope {
    readonly getAbortController?:
        | (() => typeof globalThis.AbortController | undefined)
        | undefined;
    readonly getDocument?: (() => Document | undefined) | undefined;
    readonly getSetTimeout?:
        | (() => typeof globalThis.setTimeout | undefined)
        | undefined;
    readonly getURL?:
        | (() => CreateExportGPXButtonURLRuntime | undefined)
        | undefined;
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

function getDocument(scope: CreateExportGPXButtonRuntimeScope): Document {
    const runtimeDocument = scope.getDocument?.();
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
    const urlRuntime = scope.getURL?.();
    if (
        !urlRuntime ||
        typeof urlRuntime.createObjectURL !== "function" ||
        typeof urlRuntime.revokeObjectURL !== "function"
    ) {
        throw new TypeError("createExportGPXButton requires a URL runtime");
    }

    return urlRuntime;
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
            const AbortControllerConstructor = scope.getAbortController?.();
            if (typeof AbortControllerConstructor !== "function") {
                throw new TypeError(
                    "createExportGPXButton requires an AbortController runtime"
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
            const setTimeoutRef = scope.getSetTimeout?.();
            if (typeof setTimeoutRef !== "function") {
                throw new TypeError(
                    "createExportGPXButton requires a setTimeout runtime"
                );
            }

            return setTimeoutRef(callback, timeout);
        },
    };
}
