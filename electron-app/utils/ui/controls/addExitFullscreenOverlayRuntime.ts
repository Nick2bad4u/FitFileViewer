import {
    type BrowserAbortControllerConstructor,
    type BrowserHTMLElementConstructor,
    getBrowserAbortController,
    getBrowserDocument,
    getBrowserHTMLElement,
} from "../../runtime/browserRuntime.js";

import { getIconFactoryRuntime } from "../icons/iconFactoryRuntime.js";

export interface AddExitFullscreenOverlayRuntimeScope {
    readonly getAbortController?:
        | (() => BrowserAbortControllerConstructor | undefined)
        | undefined;
    readonly getDocument?: (() => Document | undefined) | undefined;
    readonly getHTMLElement?:
        | (() => BrowserHTMLElementConstructor | undefined)
        | undefined;
}

export interface AddExitFullscreenOverlayRuntime {
    createAbortController: () => AbortController;
    createButton: () => HTMLButtonElement;
    createElement: <K extends keyof HTMLElementTagNameMap>(
        tagName: K
    ) => HTMLElementTagNameMap[K];
    createSvgElement: <K extends keyof SVGElementTagNameMap>(
        tagName: K
    ) => SVGElementTagNameMap[K];
    exitFullscreen: () => Promise<void>;
    getFullscreenElement: () => Element | null;
    isHTMLElement: (value: unknown) => value is HTMLElement;
}

const defaultAddExitFullscreenOverlayRuntimeScope: AddExitFullscreenOverlayRuntimeScope =
    {
        getAbortController: getBrowserAbortController,
        getDocument: getBrowserDocument,
        getHTMLElement: getBrowserHTMLElement,
    };

function getScopeDocument(
    scope: AddExitFullscreenOverlayRuntimeScope
): Document | undefined {
    return scope.getDocument?.();
}

function getAbortControllerConstructor(
    scope: AddExitFullscreenOverlayRuntimeScope
): BrowserAbortControllerConstructor {
    const AbortControllerConstructor = scope.getAbortController?.();
    if (typeof AbortControllerConstructor !== "function") {
        throw new TypeError(
            "addExitFullscreenOverlay requires an AbortController runtime"
        );
    }

    return AbortControllerConstructor;
}

function getDocument(scope: AddExitFullscreenOverlayRuntimeScope): Document {
    const runtimeDocument = getScopeDocument(scope);
    if (!runtimeDocument) {
        throw new TypeError(
            "addExitFullscreenOverlay requires a document runtime"
        );
    }

    return runtimeDocument;
}

function getHTMLElementConstructor(
    scope: AddExitFullscreenOverlayRuntimeScope
): BrowserHTMLElementConstructor | undefined {
    return scope.getHTMLElement?.();
}

function createSvgElement<K extends keyof SVGElementTagNameMap>(
    scope: AddExitFullscreenOverlayRuntimeScope,
    tagName: K
): SVGElementTagNameMap[K] {
    const runtimeDocument = getDocument(scope);
    return getIconFactoryRuntime({
        getDocument: () => runtimeDocument,
    }).createSvgElement(tagName);
}

export function getAddExitFullscreenOverlayRuntime(
    scope: AddExitFullscreenOverlayRuntimeScope = defaultAddExitFullscreenOverlayRuntimeScope
): AddExitFullscreenOverlayRuntime {
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
        async exitFullscreen(): Promise<void> {
            await getDocument(scope).exitFullscreen();
        },
        getFullscreenElement(): Element | null {
            return getDocument(scope).fullscreenElement;
        },
        isHTMLElement(value: unknown): value is HTMLElement {
            getDocument(scope);
            const HTMLElementConstructor = getHTMLElementConstructor(scope);

            return (
                typeof HTMLElementConstructor === "function" &&
                value instanceof HTMLElementConstructor
            );
        },
    };
}
