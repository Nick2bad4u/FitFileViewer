type ElevationProfilePopupWindow = Window | null;

interface ElevationProfileButtonGlobalScope {
    readonly chartOverlayColorPalette?: unknown;
    readonly open?: CreateElevationProfileOpen | undefined;
}

type CreateElevationProfileOpen =
    | ((
          url?: string,
          target?: string,
          features?: string
      ) => ElevationProfilePopupWindow)
    | undefined;

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

const SVG_NAMESPACE = "http://www.w3.org/2000/svg";

const defaultCreateElevationProfileButtonRuntimeScope: CreateElevationProfileButtonRuntimeScope =
    {
        getAbortController: () => globalThis.AbortController,
        getChartOverlayColorPalette: () =>
            (globalThis as ElevationProfileButtonGlobalScope)
                .chartOverlayColorPalette,
        getDocument: () => globalThis.document,
        getOpen: () => {
            const openRef = (globalThis as ElevationProfileButtonGlobalScope)
                .open;
            return typeof openRef === "function"
                ? openRef.bind(globalThis)
                : undefined;
        },
    };

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
            return getDocument(scope).createElementNS(SVG_NAMESPACE, tagName);
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
