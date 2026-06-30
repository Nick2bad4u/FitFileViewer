import {
    type BrowserAbortControllerConstructor,
    getBrowserAbortController,
    getBrowserDocument,
    getBrowserOpen,
} from "../../runtime/browserRuntime.js";
import {
    chartOverlayColorPalette,
    type ChartOverlayColorPalette,
} from "../../charts/theming/chartOverlayColorPalette.js";

import { getIconFactoryRuntime } from "../icons/iconFactoryRuntime.js";

type ElevationProfilePopupWindow = Window | null;

type CreateElevationProfileOpen =
    | ((
          url?: string,
          target?: string,
          features?: string
      ) => ElevationProfilePopupWindow)
    | undefined;
type CreateElevationProfileButtonRuntimeProvider<T> =
    | (() => T | undefined)
    | undefined;

export interface CreateElevationProfileButtonRuntimeScope {
    readonly getAbortController: CreateElevationProfileButtonRuntimeProvider<BrowserAbortControllerConstructor>;
    readonly getChartOverlayColorPalette: CreateElevationProfileButtonRuntimeProvider<ChartOverlayColorPalette>;
    readonly getDocument: CreateElevationProfileButtonRuntimeProvider<Document>;
    readonly getOpen: CreateElevationProfileButtonRuntimeProvider<CreateElevationProfileOpen>;
}

export interface CreateElevationProfileButtonRuntime {
    createAbortController: () => AbortController;
    createButton: () => HTMLButtonElement;
    createDocumentElement: <K extends keyof HTMLElementTagNameMap>(
        targetDocument: Document,
        tagName: K
    ) => HTMLElementTagNameMap[K];
    createElement: <K extends keyof HTMLElementTagNameMap>(
        tagName: K
    ) => HTMLElementTagNameMap[K];
    createSvgElement: <K extends keyof SVGElementTagNameMap>(
        tagName: K
    ) => SVGElementTagNameMap[K];
    getChartOverlayColorPalette: () => ChartOverlayColorPalette | undefined;
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
        getChartOverlayColorPalette: () => chartOverlayColorPalette,
        getDocument: getBrowserDocument,
        getOpen: getBrowserOpen,
    };

function getRequiredProvider<T>(
    provider: CreateElevationProfileButtonRuntimeProvider<T>,
    providerName: string
): () => T | undefined {
    if (typeof provider !== "function") {
        const article = /^[AEIOUHaeiou]/u.test(providerName) ? "an" : "a";

        throw new TypeError(
            `createElevationProfileButton requires ${article} ${providerName} provider`
        );
    }

    return provider;
}

function getAbortControllerConstructor(
    scope: CreateElevationProfileButtonRuntimeScope
): BrowserAbortControllerConstructor {
    const AbortControllerConstructor = getRequiredProvider(
        scope.getAbortController,
        "AbortController"
    )();
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
    return getRequiredProvider(scope.getDocument, "document")();
}

function getScopeOpen(
    scope: CreateElevationProfileButtonRuntimeScope
): CreateElevationProfileOpen {
    return getRequiredProvider(scope.getOpen, "open")();
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
        createDocumentElement<K extends keyof HTMLElementTagNameMap>(
            targetDocument: Document,
            tagName: K
        ): HTMLElementTagNameMap[K] {
            return targetDocument.createElement(tagName);
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
        getChartOverlayColorPalette(): ChartOverlayColorPalette | undefined {
            return getRequiredProvider(
                scope.getChartOverlayColorPalette,
                "chartOverlayColorPalette"
            )();
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
