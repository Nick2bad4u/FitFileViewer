import {
    getChartControlsToggle,
    getChartSettingsWrapper,
} from "../../charts/dom/chartDomUtils.js";
import { getBrowserAbortController } from "../../runtime/browserRuntime.js";
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
    readonly createSpanElement?: (() => HTMLSpanElement) | undefined;
    readonly getDateNow?: (() => (() => number) | undefined) | undefined;
    readonly getDocument?: (() => Document | undefined) | undefined;
    readonly getFileStateBody?:
        | (() => UIStateManagerFileStateBody | undefined)
        | undefined;
    readonly getActiveFileNameContainerElement?:
        | UIStateManagerElementProvider
        | undefined;
    readonly getActiveFileNameElement?:
        | UIStateManagerElementProvider
        | undefined;
    readonly getDocumentTitle?: (() => string | undefined) | undefined;
    readonly getEventTarget?:
        | (() => UIStateManagerEventTarget | undefined)
        | undefined;
    readonly getHTMLElement?:
        | (() => typeof globalThis.HTMLElement | undefined)
        | undefined;
    readonly getAltFitIframeElement?: UIStateManagerElementProvider | undefined;
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
    readonly getLoadingIndicatorElement?:
        | UIStateManagerElementProvider
        | undefined;
    readonly getMainContentElement?: UIStateManagerElementProvider | undefined;
    readonly getMapContainerElement?: UIStateManagerElementProvider | undefined;
    readonly getMeasurementModeToggleElement?:
        | UIStateManagerElementProvider
        | undefined;
    readonly getSidebarElement?: UIStateManagerElementProvider | undefined;
    readonly getTabButtonElements?:
        | UIStateManagerElementListProvider
        | undefined;
    readonly getTabContentElements?:
        | UIStateManagerElementListProvider
        | undefined;
    readonly getThemeRootElement?: UIStateManagerElementProvider | undefined;
    readonly getThemeStateElements?:
        | UIStateManagerElementListProvider
        | undefined;
    readonly getThemeToggleElements?:
        | UIStateManagerElementListProvider
        | undefined;
    readonly getUnloadFileButtonElement?:
        | UIStateManagerElementProvider
        | undefined;
    readonly getZwiftIframeElement?: UIStateManagerElementProvider | undefined;
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
    getDateNow: () => Date.now,
    getAbortController: getBrowserAbortController,
    getDocument: () => globalThis.document,
    getEventTarget: () =>
        typeof globalThis.addEventListener === "function"
            ? globalThis
            : undefined,
    getHTMLElement: () => globalThis.HTMLElement,
    getMatchMedia: () => globalThis.matchMedia,
    getViewportState: () => globalThis,
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

function createSpanElement(scope: UIStateManagerRuntimeScope): HTMLSpanElement {
    const createSpan = scope.createSpanElement;
    if (typeof createSpan !== "function") {
        const documentRef = getRequiredDocument(scope);
        return documentRef.createElement("span");
    }

    return createSpan();
}

function getDateNow(scope: UIStateManagerRuntimeScope): () => number {
    const dateNow = scope.getDateNow?.();
    if (typeof dateNow !== "function") {
        throw new TypeError("UI state manager requires dateNow");
    }

    return dateNow;
}

function getEventTarget(
    scope: UIStateManagerRuntimeScope
): UIStateManagerEventTarget | undefined {
    return scope.getEventTarget?.();
}

function getHTMLElementConstructor(
    scope: UIStateManagerRuntimeScope
): typeof HTMLElement | undefined {
    const HTMLElementConstructor = scope.getHTMLElement?.();

    return typeof HTMLElementConstructor === "function"
        ? HTMLElementConstructor
        : undefined;
}

function getScopeDocument(
    scope: UIStateManagerRuntimeScope
): Document | undefined {
    return scope.getDocument?.();
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
    const scopedElement = scope.getActiveFileNameContainerElement?.();
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
    const scopedElement = scope.getActiveFileNameElement?.();
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
    const scopedElement = scope.getAltFitIframeElement?.();
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
    const scopedElement = scope.getChartControlsToggleElement?.();
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
    const scopedElement = scope.getChartSettingsWrapperElement?.();
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
    const scopedElement = scope.getDropOverlayElement?.();
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
    const scopedBody = scope.getFileStateBody?.();
    if (scopedBody !== undefined) {
        return scopedBody;
    }

    return getScopeDocument(scope)?.body;
}

function getFileLoadingProgressElement(
    scope: UIStateManagerRuntimeScope
): HTMLElement | null {
    const scopedElement = scope.getFileLoadingProgressElement?.();
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
    const scopedElement = scope.getLoadingIndicatorElement?.();
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
    const scopedElement = scope.getMainContentElement?.();
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
    const scopedElement = scope.getMapContainerElement?.();
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
    const scopedElement = scope.getMeasurementModeToggleElement?.();
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
    const scopedElement = scope.getSidebarElement?.();
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
        const scopedElements = scope.getTabButtonElements?.();
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
        const scopedElements = scope.getTabContentElements?.();
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
    const scopedElement = scope.getThemeRootElement?.();
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
        const scopedElements = scope.getThemeStateElements?.();
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
        const scopedElements = scope.getThemeToggleElements?.();
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
    const scopedElement = scope.getUnloadFileButtonElement?.();
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
    const scopedElement = scope.getZwiftIframeElement?.();
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
): typeof matchMedia | undefined {
    const candidate = scope.getMatchMedia?.();

    return typeof candidate === "function" ? candidate : undefined;
}

function getDocumentTitle(
    scope: UIStateManagerRuntimeScope
): string | undefined {
    const title = scope.getDocumentTitle?.() ?? getScopeDocument(scope)?.title;

    return typeof title === "string" && title.length > 0 ? title : undefined;
}

function getSetBodyCursor(
    scope: UIStateManagerRuntimeScope
): ((cursor: string) => void) | undefined {
    const scopedSetter = scope.getSetBodyCursor?.();
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
    const scopedSetter = scope.getSetDocumentTitle?.();
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
