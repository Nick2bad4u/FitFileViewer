import {
    getBrowserAbortController,
    getBrowserDocument,
} from "../../runtime/browserRuntime.js";

import { getIconFactoryRuntime } from "../icons/iconFactoryRuntime.js";

type ElevationProfilePopupWindow = Window | null;

type CreateElevationProfileOpen =
    | ((
          url?: string,
          target?: string,
          features?: string
      ) => ElevationProfilePopupWindow)
    | undefined;

interface CreateElevationProfileButtonGlobalScope {
    readonly chartOverlayColorPalette?: unknown;
}

export interface CreateElevationProfileButtonRuntimeScope {
    readonly getAbortController?:
        | (() => typeof AbortController | undefined)
        | undefined;
    readonly getChartOverlayColorPalette?: (() => unknown) | undefined;
    readonly getDocument?: (() => Document | undefined) | undefined;
    readonly getOpen?: (() => CreateElevationProfileOpen) | undefined;
}

export interface CreateElevationProfileButtonRuntime {
    createAbortController: () => AbortController;
    createButton: () => HTMLButtonElement;
    createElement: <K extends keyof HTMLElementTagNameMap>(
        tagName: K
    ) => HTMLElementTagNameMap[K];
    createSvgElement: <K extends keyof SVGElementTagNameMap>(
        tagName: K
    ) => SVGElementTagNameMap[K];
    getChartOverlayColorPalette: () => unknown;
    isDarkTheme: () => boolean;
    openPopupWindow: (
        url: string,
        target: string,
        features: string
    ) => ElevationProfilePopupWindow;
}

const defaultCreateElevationProfileButtonRuntimeScope: CreateElevationProfileButtonRuntimeScope =
    {
        getAbortController: getBrowserAbortController,
        getChartOverlayColorPalette: getGlobalChartOverlayColorPalette,
        getDocument: getBrowserDocument,
        getOpen: getGlobalOpen,
    };

function getGlobalChartOverlayColorPalette(): unknown {
    const elevationProfileGlobal =
        globalThis as CreateElevationProfileButtonGlobalScope;
    return elevationProfileGlobal.chartOverlayColorPalette;
}

function getGlobalOpen(): CreateElevationProfileOpen {
    const openRef = globalThis.open;
    return typeof openRef === "function"
        ? (openRef as NonNullable<CreateElevationProfileOpen>).bind(globalThis)
        : undefined;
}

function getAbortControllerConstructor(
    scope: CreateElevationProfileButtonRuntimeScope
): typeof AbortController {
    const AbortControllerConstructor =
        scope.getAbortController?.() ??
        getScopeDocument(scope)?.defaultView?.AbortController;
    if (typeof AbortControllerConstructor !== "function") {
        throw new TypeError(
            "createElevationProfileButton requires an AbortController runtime"
        );
    }

    return AbortControllerConstructor;
}

function getDocument(
    scope: CreateElevationProfileButtonRuntimeScope
): Document {
    const runtimeDocument = getScopeDocument(scope);
    if (!runtimeDocument) {
        throw new TypeError(
            "createElevationProfileButton requires a document runtime"
        );
    }

    return runtimeDocument;
}

function getScopeDocument(
    scope: CreateElevationProfileButtonRuntimeScope
): Document | undefined {
    return scope.getDocument?.();
}

function getScopeOpen(
    scope: CreateElevationProfileButtonRuntimeScope
): CreateElevationProfileOpen {
    return scope.getOpen?.();
}

function createSvgElement<K extends keyof SVGElementTagNameMap>(
    scope: CreateElevationProfileButtonRuntimeScope,
    tagName: K
): SVGElementTagNameMap[K] {
    const runtimeDocument = getDocument(scope);
    return getIconFactoryRuntime({
        getDocument: () => runtimeDocument,
    }).createSvgElement(tagName);
}

export function getCreateElevationProfileButtonRuntime(
    scope: CreateElevationProfileButtonRuntimeScope = defaultCreateElevationProfileButtonRuntimeScope
): CreateElevationProfileButtonRuntime {
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
        getChartOverlayColorPalette(): unknown {
            return scope.getChartOverlayColorPalette?.();
        },
        isDarkTheme(): boolean {
            return getDocument(scope).body.classList.contains("theme-dark");
        },
        openPopupWindow(url, target, features): ElevationProfilePopupWindow {
            const open = getScopeOpen(scope);
            if (typeof open !== "function") {
                return null;
            }

            return open(url, target, features);
        },
    };
}
