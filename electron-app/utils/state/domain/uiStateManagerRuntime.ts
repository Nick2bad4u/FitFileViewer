import {
    getChartControlsToggle,
    getChartSettingsWrapper,
} from "../../charts/dom/chartDomUtils.js";
import {
    type BrowserAbortControllerConstructor,
    type BrowserHTMLElementConstructor,
    type BrowserMatchMedia,
    getBrowserAbortController,
    getBrowserDateNow,
    getBrowserDocument,
    getBrowserHTMLElement,
    getBrowserMatchMedia,
    getBrowserViewportEventTarget,
    getBrowserViewportState,
} from "../../runtime/browserRuntime.js";
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
type UIStateManagerElementListProvider = () => readonly Element[] | undefined;
type UIStateManagerRuntimeProvider<T> = () => T | undefined;

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
    readonly getAbortController: UIStateManagerRuntimeProvider<BrowserAbortControllerConstructor>;
    readonly createSpanElement: UIStateManagerRuntimeProvider<HTMLSpanElement>;
    readonly getDateNow: UIStateManagerRuntimeProvider<() => number>;
    readonly getDocument: UIStateManagerRuntimeProvider<Document>;
    readonly getFileStateBody: UIStateManagerRuntimeProvider<UIStateManagerFileStateBody>;
    readonly getActiveFileNameContainerElement: UIStateManagerElementProvider;
    readonly getActiveFileNameElement: UIStateManagerElementProvider;
    readonly getDocumentTitle: UIStateManagerRuntimeProvider<string>;
    readonly getEventTarget: UIStateManagerRuntimeProvider<UIStateManagerEventTarget>;
    readonly getHTMLElement: UIStateManagerRuntimeProvider<BrowserHTMLElementConstructor>;
    readonly getAltFitIframeElement: UIStateManagerElementProvider;
    readonly getChartControlsToggleElement: UIStateManagerElementProvider;
    readonly getChartSettingsWrapperElement: UIStateManagerElementProvider;
    readonly getDropOverlayElement: UIStateManagerElementProvider;
    readonly getFileLoadingProgressElement: UIStateManagerElementProvider;
    readonly getLoadingIndicatorElement: UIStateManagerElementProvider;
    readonly getMainContentElement: UIStateManagerElementProvider;
    readonly getMapContainerElement: UIStateManagerElementProvider;
    readonly getMeasurementModeToggleElement: UIStateManagerElementProvider;
    readonly getSidebarElement: UIStateManagerElementProvider;
    readonly getTabButtonElements: UIStateManagerElementListProvider;
    readonly getTabContentElements: UIStateManagerElementListProvider;
    readonly getThemeRootElement: UIStateManagerElementProvider;
    readonly getThemeStateElements: UIStateManagerElementListProvider;
    readonly getThemeToggleElements: UIStateManagerElementListProvider;
    readonly getUnloadFileButtonElement: UIStateManagerElementProvider;
    readonly getZwiftIframeElement: UIStateManagerElementProvider;
    readonly getMatchMedia: UIStateManagerRuntimeProvider<BrowserMatchMedia>;
    readonly getSetBodyCursor: UIStateManagerRuntimeProvider<
        (cursor: string) => void
    >;
    readonly getSetDocumentTitle: UIStateManagerRuntimeProvider<
        (title: string) => void
    >;
    readonly getViewportState: UIStateManagerRuntimeProvider<UIStateManagerViewportState>;
}

export interface UIStateManagerRuntime {
    addWindowEventListener: <K extends keyof WindowEventMap>(
        type: K,
        listener: (event: WindowEventMap[K]) => void,
        options?: AddEventListenerOptions
    ) => void;
    createAbortController: () => AbortController;
    createSpanElement: () => HTMLSpanElement;
    dateNow: () => number;
    getDefaultDocumentTitle: (fallbackTitle: string) => string;
    getActiveFileNameContainerElement: () => HTMLElement | null;
    getActiveFileNameElement: () => HTMLElement | null;
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
    getTabButtonElements: () => readonly Element[];
    getTabContentElements: () => readonly Element[];
    getThemeRootElement: () => HTMLElement | null;
    getThemeStateElements: () => readonly Element[];
    getThemeToggleElements: () => readonly Element[];
    getUnloadFileButtonElement: () => HTMLElement | null;
    getWindowState: () => UIStateWindowStateSnapshot | null;
    getZwiftIframeElement: () => HTMLElement | null;
    hasWindow: () => boolean;
    isHTMLElement: (value: unknown) => value is HTMLElement;
    setAppHasFileState: (hasFile: boolean) => void;
    setBodyCursor: (cursor: string) => void;
    setDocumentTitle: (title: string) => void;
}

const defaultUIStateManagerRuntimeScope: UIStateManagerRuntimeScope = {
    getDateNow: getBrowserDateNow,
    getAbortController: getBrowserAbortController,
    createSpanElement: () => undefined,
    getDocument: getBrowserDocument,
    getFileStateBody: () => undefined,
    getActiveFileNameContainerElement: () => undefined,
    getActiveFileNameElement: () => undefined,
    getDocumentTitle: () => undefined,
    getEventTarget: getBrowserViewportEventTarget,
    getHTMLElement: getBrowserHTMLElement,
    getAltFitIframeElement: () => undefined,
    getChartControlsToggleElement: () => undefined,
    getChartSettingsWrapperElement: () => undefined,
    getDropOverlayElement: () => undefined,
    getFileLoadingProgressElement: () => undefined,
    getLoadingIndicatorElement: () => undefined,
    getMainContentElement: () => undefined,
    getMapContainerElement: () => undefined,
    getMeasurementModeToggleElement: () => undefined,
    getSidebarElement: () => undefined,
    getTabButtonElements: () => undefined,
    getTabContentElements: () => undefined,
    getThemeRootElement: () => undefined,
    getThemeStateElements: () => undefined,
    getThemeToggleElements: () => undefined,
    getUnloadFileButtonElement: () => undefined,
    getZwiftIframeElement: () => undefined,
    getMatchMedia: getBrowserMatchMedia,
    getSetBodyCursor: () => undefined,
    getSetDocumentTitle: () => undefined,
    getViewportState: getBrowserViewportState,
};

function getRequiredProvider<T>(
    provider: UIStateManagerRuntimeProvider<T> | undefined,
    providerName: string
): UIStateManagerRuntimeProvider<T> {
    if (typeof provider !== "function") {
        throw new TypeError(
            `UI state manager requires ${providerName} provider`
        );
    }

    return provider;
}

function getAbortControllerConstructor(
    scope: UIStateManagerRuntimeScope
): BrowserAbortControllerConstructor {
    const AbortControllerConstructor = getRequiredProvider(
        scope.getAbortController,
        "getAbortController"
    )();
    if (typeof AbortControllerConstructor !== "function") {
        throw new TypeError(
            "UI state manager requires an AbortController runtime"
        );
    }

    return AbortControllerConstructor;
}

function createSpanElement(scope: UIStateManagerRuntimeScope): HTMLSpanElement {
    const spanElement = getRequiredProvider(
        scope.createSpanElement,
        "createSpanElement"
    )();
    if (spanElement === undefined) {
        const documentRef = getRequiredDocument(scope);
        return documentRef.createElement("span");
    }

    return spanElement;
}

function getDateNow(scope: UIStateManagerRuntimeScope): () => number {
    const dateNow = getRequiredProvider(scope.getDateNow, "getDateNow")();
    if (typeof dateNow !== "function") {
        throw new TypeError("UI state manager requires dateNow");
    }

    return dateNow;
}

function getEventTarget(
    scope: UIStateManagerRuntimeScope
): UIStateManagerEventTarget | undefined {
    return getRequiredProvider(scope.getEventTarget, "getEventTarget")();
}

function getHTMLElementConstructor(
    scope: UIStateManagerRuntimeScope
): BrowserHTMLElementConstructor | undefined {
    const HTMLElementConstructor = getRequiredProvider(
        scope.getHTMLElement,
        "getHTMLElement"
    )();

    return typeof HTMLElementConstructor === "function"
        ? HTMLElementConstructor
        : undefined;
}

function getScopeDocument(
    scope: UIStateManagerRuntimeScope
): Document | undefined {
    return getRequiredProvider(scope.getDocument, "getDocument")();
}

function getRequiredDocument(scope: UIStateManagerRuntimeScope): Document {
    const documentRef = getScopeDocument(scope);
    if (documentRef === undefined) {
        throw new TypeError("UI state manager requires a document runtime");
    }

    return documentRef;
}

function isHTMLElement(
    scope: UIStateManagerRuntimeScope,
    value: unknown
): value is HTMLElement {
    const HTMLElementConstructor = getHTMLElementConstructor(scope);

    return (
        HTMLElementConstructor !== undefined &&
        value instanceof HTMLElementConstructor
    );
}

function getActiveFileNameContainerElement(
    scope: UIStateManagerRuntimeScope
): HTMLElement | null {
    const scopedElement = getRequiredProvider(
        scope.getActiveFileNameContainerElement,
        "getActiveFileNameContainerElement"
    )();
    if (scopedElement !== undefined) {
        return scopedElement;
    }

    const documentRef = getScopeDocument(scope);
    return documentRef === undefined
        ? null
        : getElementByIdFlexible(documentRef, "active_file_name_container");
}

function getActiveFileNameElement(
    scope: UIStateManagerRuntimeScope
): HTMLElement | null {
    const scopedElement = getRequiredProvider(
        scope.getActiveFileNameElement,
        "getActiveFileNameElement"
    )();
    if (scopedElement !== undefined) {
        return scopedElement;
    }

    const documentRef = getScopeDocument(scope);
    return documentRef === undefined
        ? null
        : getElementByIdFlexible(documentRef, "active_file_name");
}

function getAltFitIframeElement(
    scope: UIStateManagerRuntimeScope
): HTMLElement | null {
    const scopedElement = getRequiredProvider(
        scope.getAltFitIframeElement,
        "getAltFitIframeElement"
    )();
    if (scopedElement !== undefined) {
        return scopedElement;
    }

    const documentRef = getScopeDocument(scope);
    return documentRef === undefined
        ? null
        : getElementByIdFlexible(documentRef, "altfit_iframe");
}

function getChartControlsToggleElement(
    scope: UIStateManagerRuntimeScope
): HTMLElement | null {
    const scopedElement = getRequiredProvider(
        scope.getChartControlsToggleElement,
        "getChartControlsToggleElement"
    )();
    if (scopedElement !== undefined) {
        return scopedElement;
    }

    const documentRef = getScopeDocument(scope);
    return documentRef === undefined
        ? null
        : getChartControlsToggle(documentRef);
}

function getChartSettingsWrapperElement(
    scope: UIStateManagerRuntimeScope
): HTMLElement | null {
    const scopedElement = getRequiredProvider(
        scope.getChartSettingsWrapperElement,
        "getChartSettingsWrapperElement"
    )();
    if (scopedElement !== undefined) {
        return scopedElement;
    }

    const documentRef = getScopeDocument(scope);
    return documentRef === undefined
        ? null
        : getChartSettingsWrapper(documentRef);
}

function getDropOverlayElement(
    scope: UIStateManagerRuntimeScope
): HTMLElement | null {
    const scopedElement = getRequiredProvider(
        scope.getDropOverlayElement,
        "getDropOverlayElement"
    )();
    if (scopedElement !== undefined) {
        return scopedElement;
    }

    const documentRef = getScopeDocument(scope);
    return documentRef === undefined
        ? null
        : getElementByIdFlexible(documentRef, "drop_overlay");
}

function getFileStateBody(
    scope: UIStateManagerRuntimeScope
): UIStateManagerFileStateBody | undefined {
    const scopedBody = getRequiredProvider(
        scope.getFileStateBody,
        "getFileStateBody"
    )();
    if (scopedBody !== undefined) {
        return scopedBody;
    }

    return getScopeDocument(scope)?.body;
}

function getFileLoadingProgressElement(
    scope: UIStateManagerRuntimeScope
): HTMLElement | null {
    const scopedElement = getRequiredProvider(
        scope.getFileLoadingProgressElement,
        "getFileLoadingProgressElement"
    )();
    if (scopedElement !== undefined) {
        return scopedElement;
    }

    return (
        getScopeDocument(scope)?.querySelector<HTMLElement>(
            "#file-loading-progress"
        ) ?? null
    );
}

function getLoadingIndicatorElement(
    scope: UIStateManagerRuntimeScope
): HTMLElement | null {
    const scopedElement = getRequiredProvider(
        scope.getLoadingIndicatorElement,
        "getLoadingIndicatorElement"
    )();
    if (scopedElement !== undefined) {
        return scopedElement;
    }

    return (
        getScopeDocument(scope)?.querySelector<HTMLElement>(
            "#loading-indicator"
        ) ?? null
    );
}

function getMainContentElement(
    scope: UIStateManagerRuntimeScope
): HTMLElement | null {
    const scopedElement = getRequiredProvider(
        scope.getMainContentElement,
        "getMainContentElement"
    )();
    if (scopedElement !== undefined) {
        return scopedElement;
    }

    return (
        getScopeDocument(scope)?.querySelector<HTMLElement>("#main-content") ??
        null
    );
}

function getMapContainerElement(
    scope: UIStateManagerRuntimeScope
): HTMLElement | null {
    const scopedElement = getRequiredProvider(
        scope.getMapContainerElement,
        "getMapContainerElement"
    )();
    if (scopedElement !== undefined) {
        return scopedElement;
    }

    return (
        getScopeDocument(scope)?.querySelector<HTMLElement>("#map-container") ??
        null
    );
}

function getMeasurementModeToggleElement(
    scope: UIStateManagerRuntimeScope
): HTMLElement | null {
    const scopedElement = getRequiredProvider(
        scope.getMeasurementModeToggleElement,
        "getMeasurementModeToggleElement"
    )();
    if (scopedElement !== undefined) {
        return scopedElement;
    }

    return (
        getScopeDocument(scope)?.querySelector<HTMLElement>(
            "#measurement-mode-toggle"
        ) ?? null
    );
}

function getSidebarElement(
    scope: UIStateManagerRuntimeScope
): HTMLElement | null {
    const scopedElement = getRequiredProvider(
        scope.getSidebarElement,
        "getSidebarElement"
    )();
    if (scopedElement !== undefined) {
        return scopedElement;
    }

    return (
        getScopeDocument(scope)?.querySelector<HTMLElement>("#sidebar") ?? null
    );
}

function getTabButtonElements(
    scope: UIStateManagerRuntimeScope
): readonly Element[] {
    try {
        const scopedElements = getRequiredProvider(
            scope.getTabButtonElements,
            "getTabButtonElements"
        )();
        if (scopedElements !== undefined) {
            return scopedElements;
        }

        return [
            ...(getScopeDocument(scope)?.querySelectorAll("[data-tab]") ?? []),
        ];
    } catch {
        return [];
    }
}

function getTabContentElements(
    scope: UIStateManagerRuntimeScope
): readonly Element[] {
    try {
        const scopedElements = getRequiredProvider(
            scope.getTabContentElements,
            "getTabContentElements"
        )();
        if (scopedElements !== undefined) {
            return scopedElements;
        }

        return [
            ...(getScopeDocument(scope)?.querySelectorAll(".tab-content") ??
                []),
        ];
    } catch {
        return [];
    }
}

function getThemeRootElement(
    scope: UIStateManagerRuntimeScope
): HTMLElement | null {
    const scopedElement = getRequiredProvider(
        scope.getThemeRootElement,
        "getThemeRootElement"
    )();
    if (scopedElement !== undefined) {
        return scopedElement;
    }

    const documentRef = getScopeDocument(scope);
    return documentRef?.documentElement ?? documentRef?.body ?? null;
}

function getThemeStateElements(
    scope: UIStateManagerRuntimeScope
): readonly Element[] {
    try {
        const scopedElements = getRequiredProvider(
            scope.getThemeStateElements,
            "getThemeStateElements"
        )();
        if (scopedElements !== undefined) {
            return scopedElements;
        }

        return [
            ...(getScopeDocument(scope)?.querySelectorAll("[data-theme]") ??
                []),
        ];
    } catch {
        return [];
    }
}

function getThemeToggleElements(
    scope: UIStateManagerRuntimeScope
): readonly Element[] {
    try {
        const scopedElements = getRequiredProvider(
            scope.getThemeToggleElements,
            "getThemeToggleElements"
        )();
        if (scopedElements !== undefined) {
            return scopedElements;
        }

        return [
            ...(getScopeDocument(scope)?.querySelectorAll(
                'button[data-theme], [role="button"][data-theme]'
            ) ?? []),
        ];
    } catch {
        return [];
    }
}

function getUnloadFileButtonElement(
    scope: UIStateManagerRuntimeScope
): HTMLElement | null {
    const scopedElement = getRequiredProvider(
        scope.getUnloadFileButtonElement,
        "getUnloadFileButtonElement"
    )();
    if (scopedElement !== undefined) {
        return scopedElement;
    }

    const documentRef = getScopeDocument(scope);
    return documentRef === undefined
        ? null
        : getElementByIdFlexible(documentRef, "unload_file_btn");
}

function getZwiftIframeElement(
    scope: UIStateManagerRuntimeScope
): HTMLElement | null {
    const scopedElement = getRequiredProvider(
        scope.getZwiftIframeElement,
        "getZwiftIframeElement"
    )();
    if (scopedElement !== undefined) {
        return scopedElement;
    }

    const documentRef = getScopeDocument(scope);
    return documentRef === undefined
        ? null
        : getElementByIdFlexible(documentRef, "zwift_iframe");
}

function getMatchMedia(
    scope: UIStateManagerRuntimeScope
): BrowserMatchMedia | undefined {
    const candidate = getRequiredProvider(
        scope.getMatchMedia,
        "getMatchMedia"
    )();

    return typeof candidate === "function" ? candidate : undefined;
}

function getDocumentTitle(
    scope: UIStateManagerRuntimeScope
): string | undefined {
    const title =
        getRequiredProvider(scope.getDocumentTitle, "getDocumentTitle")() ??
        getScopeDocument(scope)?.title;

    return typeof title === "string" && title.length > 0 ? title : undefined;
}

function getSetBodyCursor(
    scope: UIStateManagerRuntimeScope
): ((cursor: string) => void) | undefined {
    const scopedSetter = getRequiredProvider(
        scope.getSetBodyCursor,
        "getSetBodyCursor"
    )();
    if (typeof scopedSetter === "function") {
        return scopedSetter;
    }

    const documentRef = getScopeDocument(scope);
    return documentRef?.body === undefined
        ? undefined
        : (cursor) => {
              documentRef.body.style.cursor = cursor;
          };
}

function getSetDocumentTitle(
    scope: UIStateManagerRuntimeScope
): ((title: string) => void) | undefined {
    const scopedSetter = getRequiredProvider(
        scope.getSetDocumentTitle,
        "getSetDocumentTitle"
    )();
    if (typeof scopedSetter === "function") {
        return scopedSetter;
    }

    const documentRef = getScopeDocument(scope);
    return documentRef === undefined
        ? undefined
        : (title) => {
              documentRef.title = title;
          };
}

function getViewportState(
    scope: UIStateManagerRuntimeScope
): UIStateManagerViewportState | undefined {
    return getRequiredProvider(scope.getViewportState, "getViewportState")();
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
        createSpanElement(): HTMLSpanElement {
            return createSpanElement(scope);
        },
        dateNow(): number {
            return getDateNow(scope)();
        },
        getDefaultDocumentTitle(fallbackTitle): string {
            return getDocumentTitle(scope) ?? fallbackTitle;
        },
        getActiveFileNameContainerElement(): HTMLElement | null {
            return getActiveFileNameContainerElement(scope);
        },
        getActiveFileNameElement(): HTMLElement | null {
            return getActiveFileNameElement(scope);
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
        getTabButtonElements(): readonly Element[] {
            return getTabButtonElements(scope);
        },
        getTabContentElements(): readonly Element[] {
            return getTabContentElements(scope);
        },
        getThemeRootElement(): HTMLElement | null {
            return getThemeRootElement(scope);
        },
        getThemeStateElements(): readonly Element[] {
            return getThemeStateElements(scope);
        },
        getThemeToggleElements(): readonly Element[] {
            return getThemeToggleElements(scope);
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
        isHTMLElement(value): value is HTMLElement {
            return isHTMLElement(scope, value);
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
