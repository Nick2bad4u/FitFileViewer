type ElevationProfilePopupWindow = Window | null;

export interface CreateElevationProfileButtonRuntimeScope {
    readonly chartOverlayColorPalette?: unknown;
    readonly document?: Document | undefined;
    readonly open?:
        | ((
              url?: string | URL,
              target?: string,
              features?: string
          ) => ElevationProfilePopupWindow)
        | undefined;
}

export interface CreateElevationProfileButtonRuntime {
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

function getDocument(
    scope: CreateElevationProfileButtonRuntimeScope
): Document {
    const runtimeDocument = scope.document;
    if (!runtimeDocument) {
        throw new TypeError(
            "createElevationProfileButton requires a document runtime"
        );
    }

    return runtimeDocument;
}

export function getCreateElevationProfileButtonRuntime(
    scope: CreateElevationProfileButtonRuntimeScope = globalThis
): CreateElevationProfileButtonRuntime {
    return {
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
            return scope.chartOverlayColorPalette;
        },
        isDarkTheme(): boolean {
            return getDocument(scope).body.classList.contains("theme-dark");
        },
        openPopupWindow(url, target, features): ElevationProfilePopupWindow {
            if (typeof scope.open !== "function") {
                return null;
            }

            return scope.open(url, target, features);
        },
    };
}
