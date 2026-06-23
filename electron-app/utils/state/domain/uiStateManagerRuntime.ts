import {
    getChartControlsToggle,
    getChartSettingsWrapper,
} from "../../charts/dom/chartDomUtils.js";
import { getElementByIdFlexible } from "../../ui/dom/elementIdUtils.js";

export interface UIStateWindowStateSnapshot extends Record<string, unknown> {
    readonly height: number;
    readonly maximized: boolean;
    readonly width: number;
    readonly x: number;
    readonly y: number;
}

type UIStateManagerEventTarget = Pick<Window, "addEventListener">;
type UIStateManagerElementProvider = () => HTMLElement | null | undefined;

type UIStateManagerViewportState = Partial<
    Pick<
        Window,
        | "innerHeight"
        | "innerWidth"
        | "outerHeight"
        | "outerWidth"
        | "screenX"
        | "screenY"
    >
> & {
    readonly screen?: Pick<Screen, "availHeight" | "availWidth">;
};

type UIStateManagerBodyClassList = Partial<Pick<DOMTokenList, "toggle">>;
type UIStateManagerFileStateBody = {
    classList?: UIStateManagerBodyClassList | undefined;
    className?: string | undefined;
    dataset?: Record<string, string | undefined> | undefined;
};

export interface UIStateManagerRuntimeScope {
    readonly getAbortController?:
        | (() => typeof globalThis.AbortController | undefined)
        | undefined;
    readonly getFileStateBody?:
        | (() => UIStateManagerFileStateBody | undefined)
        | undefined;
    readonly getDocumentTitle?: (() => string | undefined) | undefined;
    readonly getEventTarget?:
        | (() => UIStateManagerEventTarget | undefined)
        | undefined;
    readonly getAltFitIframeElement?:
        | UIStateManagerElementProvider
        | undefined;
    readonly getChartControlsToggleElement?:
        | UIStateManagerElementProvider
        | undefined;
    readonly getChartSettingsWrapperElement?:
        | UIStateManagerElementProvider
        | undefined;
    readonly getDropOverlayElement?: UIStateManagerElementProvider | undefined;
    readonly getFileLoadingProgressElement?:
        | UIStateManagerElementProvider
        | undefined;
    readonly getLoadingIndicatorElement?: UIStateManagerElementProvider | undefined;
    readonly getMainContentElement?: UIStateManagerElementProvider | undefined;
    readonly getMapContainerElement?: UIStateManagerElementProvider | undefined;
    readonly getMeasurementModeToggleElement?:
        | UIStateManagerElementProvider
        | undefined;
    readonly getSidebarElement?: UIStateManagerElementProvider | undefined;
    readonly getUnloadFileButtonElement?:
        | UIStateManagerElementProvider
        | undefined;
    readonly getZwiftIframeElement?:
        | UIStateManagerElementProvider
        | undefined;
    readonly getMatchMedia?:
        | (() => typeof globalThis.matchMedia | undefined)
        | undefined;
    readonly getSetBodyCursor?:
        | (() => ((cursor: string) => void) | undefined)
        | undefined;
    readonly getSetDocumentTitle?:
        | (() => ((title: string) => void) | undefined)
        | undefined;
    readonly getViewportState?:
        | (() => UIStateManagerViewportState | undefined)
        | undefined;
}

export interface UIStateManagerRuntime {
    addWindowEventListener: <K extends keyof WindowEventMap>(
        type: K,
        listener: (event: WindowEventMap[K]) => void,
        options?: AddEventListenerOptions
    ) => void;
    createAbortController: () => AbortController;
    getDefaultDocumentTitle: (fallbackTitle: string) => string;
    getAltFitIframeElement: () => HTMLElement | null;
    getChartControlsToggleElement: () => HTMLElement | null;
    getChartSettingsWrapperElement: () => HTMLElement | null;
    getDropOverlayElement: () => HTMLElement | null;
    getFileLoadingProgressElement: () => HTMLElement | null;
    getLoadingIndicatorElement: () => HTMLElement | null;
    getMainContentElement: () => HTMLElement | null;
    getMapContainerElement: () => HTMLElement | null;
    getMeasurementModeToggleElement: () => HTMLElement | null;
    getSidebarElement: () => HTMLElement | null;
    getSystemThemeMediaQuery: () => MediaQueryList | null;
    getUnloadFileButtonElement: () => HTMLElement | null;
    getWindowState: () => UIStateWindowStateSnapshot | null;
    getZwiftIframeElement: () => HTMLElement | null;
    hasWindow: () => boolean;
    setAppHasFileState: (hasFile: boolean) => void;
    setBodyCursor: (cursor: string) => void;
    setDocumentTitle: (title: string) => void;
}

const defaultUIStateManagerRuntimeScope: UIStateManagerRuntimeScope = {
    getAbortController: () => globalThis.AbortController,
    getFileStateBody: () => globalThis.document.body,
    getDocumentTitle: () => globalThis.document.title,
    getEventTarget: () =>
        typeof globalThis.addEventListener === "function"
            ? globalThis
            : undefined,
    getAltFitIframeElement: () =>
        getElementByIdFlexible(globalThis.document, "altfit_iframe"),
    getChartControlsToggleElement: () =>
        getChartControlsToggle(globalThis.document),
    getChartSettingsWrapperElement: () =>
        getChartSettingsWrapper(globalThis.document),
    getDropOverlayElement: () =>
        getElementByIdFlexible(globalThis.document, "drop_overlay"),
    getFileLoadingProgressElement: () =>
        globalThis.document.querySelector<HTMLElement>(
            "#file-loading-progress"
        ),
    getLoadingIndicatorElement: () =>
        globalThis.document.querySelector<HTMLElement>("#loading-indicator"),
    getMainContentElement: () =>
        globalThis.document.querySelector<HTMLElement>("#main-content"),
    getMapContainerElement: () =>
        globalThis.document.querySelector<HTMLElement>("#map-container"),
    getMeasurementModeToggleElement: () =>
        globalThis.document.querySelector<HTMLElement>(
            "#measurement-mode-toggle"
        ),
    getSidebarElement: () =>
        globalThis.document.querySelector<HTMLElement>("#sidebar"),
    getUnloadFileButtonElement: () =>
        getElementByIdFlexible(globalThis.document, "unload_file_btn"),
    getZwiftIframeElement: () =>
        getElementByIdFlexible(globalThis.document, "zwift_iframe"),
    getMatchMedia: () => globalThis.matchMedia,
    getSetBodyCursor: () => (cursor) => {
        globalThis.document.body.style.cursor = cursor;
    },
    getViewportState: () => globalThis,
    getSetDocumentTitle: () => (title) => {
        globalThis.document.title = title;
    },
};

function getAbortControllerConstructor(
    scope: UIStateManagerRuntimeScope
): typeof AbortController {
    const AbortControllerConstructor = scope.getAbortController?.();
    if (typeof AbortControllerConstructor !== "function") {
        throw new TypeError(
            "UI state manager requires an AbortController runtime"
        );
    }

    return AbortControllerConstructor;
}

function getEventTarget(
    scope: UIStateManagerRuntimeScope
): UIStateManagerEventTarget | undefined {
    return scope.getEventTarget?.();
}

function getAltFitIframeElement(
    scope: UIStateManagerRuntimeScope
): HTMLElement | null {
    return scope.getAltFitIframeElement?.() ?? null;
}

function getChartControlsToggleElement(
    scope: UIStateManagerRuntimeScope
): HTMLElement | null {
    return scope.getChartControlsToggleElement?.() ?? null;
}

function getChartSettingsWrapperElement(
    scope: UIStateManagerRuntimeScope
): HTMLElement | null {
    return scope.getChartSettingsWrapperElement?.() ?? null;
}

function getDropOverlayElement(
    scope: UIStateManagerRuntimeScope
): HTMLElement | null {
    return scope.getDropOverlayElement?.() ?? null;
}

function getFileStateBody(
    scope: UIStateManagerRuntimeScope
): UIStateManagerFileStateBody | undefined {
    return scope.getFileStateBody?.();
}

function getFileLoadingProgressElement(
    scope: UIStateManagerRuntimeScope
): HTMLElement | null {
    return scope.getFileLoadingProgressElement?.() ?? null;
}

function getLoadingIndicatorElement(
    scope: UIStateManagerRuntimeScope
): HTMLElement | null {
    return scope.getLoadingIndicatorElement?.() ?? null;
}

function getMainContentElement(
    scope: UIStateManagerRuntimeScope
): HTMLElement | null {
    return scope.getMainContentElement?.() ?? null;
}

function getMapContainerElement(
    scope: UIStateManagerRuntimeScope
): HTMLElement | null {
    return scope.getMapContainerElement?.() ?? null;
}

function getMeasurementModeToggleElement(
    scope: UIStateManagerRuntimeScope
): HTMLElement | null {
    return scope.getMeasurementModeToggleElement?.() ?? null;
}

function getSidebarElement(
    scope: UIStateManagerRuntimeScope
): HTMLElement | null {
    return scope.getSidebarElement?.() ?? null;
}

function getUnloadFileButtonElement(
    scope: UIStateManagerRuntimeScope
): HTMLElement | null {
    return scope.getUnloadFileButtonElement?.() ?? null;
}

function getZwiftIframeElement(
    scope: UIStateManagerRuntimeScope
): HTMLElement | null {
    return scope.getZwiftIframeElement?.() ?? null;
}

function getMatchMedia(
    scope: UIStateManagerRuntimeScope
): typeof matchMedia | undefined {
    const candidate = scope.getMatchMedia?.();

    return typeof candidate === "function" ? candidate : undefined;
}

function getDocumentTitle(
    scope: UIStateManagerRuntimeScope
): string | undefined {
    const title = scope.getDocumentTitle?.();

    return typeof title === "string" && title.length > 0 ? title : undefined;
}

function getSetBodyCursor(
    scope: UIStateManagerRuntimeScope
): ((cursor: string) => void) | undefined {
    return scope.getSetBodyCursor?.();
}

function getSetDocumentTitle(
    scope: UIStateManagerRuntimeScope
): ((title: string) => void) | undefined {
    return scope.getSetDocumentTitle?.();
}

function getViewportState(
    scope: UIStateManagerRuntimeScope
): UIStateManagerViewportState | undefined {
    return scope.getViewportState?.();
}

function setAppHasFileClass(
    body: UIStateManagerFileStateBody,
    hasFile: boolean
): void {
    const toggle = body.classList?.toggle;
    if (typeof toggle === "function") {
        toggle.call(body.classList, "app-has-file", hasFile);
        return;
    }

    const classes =
        typeof body.className === "string" ? body.className.split(/\s+/) : [];
    const filtered = classes.filter((cls) => cls && cls !== "app-has-file");
    if (hasFile) {
        filtered.push("app-has-file");
    }
    body.className = filtered.join(" ").trim();
}

export function getUIStateManagerRuntime(
    scope: UIStateManagerRuntimeScope = defaultUIStateManagerRuntimeScope
): UIStateManagerRuntime {
    return {
        addWindowEventListener(type, listener, options): void {
            const eventTarget = getEventTarget(scope);

            // eslint-disable-next-line runtime-cleanup/no-unmanaged-event-listeners -- This scoped runtime forwards caller-owned listener options, including AbortSignal cleanup.
            eventTarget?.addEventListener(
                type,
                listener as EventListener,
                options
            );
        },
        createAbortController(): AbortController {
            return new (getAbortControllerConstructor(scope))();
        },
        getDefaultDocumentTitle(fallbackTitle): string {
            return getDocumentTitle(scope) ?? fallbackTitle;
        },
        getAltFitIframeElement(): HTMLElement | null {
            return getAltFitIframeElement(scope);
        },
        getChartControlsToggleElement(): HTMLElement | null {
            return getChartControlsToggleElement(scope);
        },
        getChartSettingsWrapperElement(): HTMLElement | null {
            return getChartSettingsWrapperElement(scope);
        },
        getDropOverlayElement(): HTMLElement | null {
            return getDropOverlayElement(scope);
        },
        getFileLoadingProgressElement(): HTMLElement | null {
            return getFileLoadingProgressElement(scope);
        },
        getLoadingIndicatorElement(): HTMLElement | null {
            return getLoadingIndicatorElement(scope);
        },
        getMainContentElement(): HTMLElement | null {
            return getMainContentElement(scope);
        },
        getMapContainerElement(): HTMLElement | null {
            return getMapContainerElement(scope);
        },
        getMeasurementModeToggleElement(): HTMLElement | null {
            return getMeasurementModeToggleElement(scope);
        },
        getSidebarElement(): HTMLElement | null {
            return getSidebarElement(scope);
        },
        getSystemThemeMediaQuery(): MediaQueryList | null {
            const matchMedia = getMatchMedia(scope);

            return typeof matchMedia === "function"
                ? matchMedia("(prefers-color-scheme: dark)")
                : null;
        },
        getUnloadFileButtonElement(): HTMLElement | null {
            return getUnloadFileButtonElement(scope);
        },
        getWindowState(): UIStateWindowStateSnapshot | null {
            const viewportState = getViewportState(scope);
            const availableScreen = viewportState?.screen;
            if (viewportState === undefined || availableScreen === undefined) {
                return null;
            }

            const {
                innerHeight = 0,
                innerWidth = 0,
                outerHeight = 0,
                outerWidth = 0,
                screenX = 0,
                screenY = 0,
            } = viewportState;

            return {
                height: innerHeight,
                maximized:
                    outerWidth === availableScreen.availWidth &&
                    outerHeight === availableScreen.availHeight,
                width: innerWidth,
                x: screenX,
                y: screenY,
            };
        },
        getZwiftIframeElement(): HTMLElement | null {
            return getZwiftIframeElement(scope);
        },
        hasWindow(): boolean {
            return getEventTarget(scope) !== undefined;
        },
        setAppHasFileState(hasFile): void {
            const body = getFileStateBody(scope);
            if (body === undefined) {
                return;
            }

            setAppHasFileClass(body, hasFile);
            if (body.dataset && typeof body.dataset === "object") {
                body.dataset["hasFitFile"] = hasFile ? "true" : "false";
            }
        },
        setBodyCursor(cursor): void {
            getSetBodyCursor(scope)?.(cursor);
        },
        setDocumentTitle(title): void {
            getSetDocumentTitle(scope)?.(title);
        },
    };
}
