export interface UIStateWindowStateSnapshot extends Record<string, unknown> {
    readonly height: number;
    readonly maximized: boolean;
    readonly width: number;
    readonly x: number;
    readonly y: number;
}

type UIStateManagerEventTarget = Pick<Window, "addEventListener">;

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

export interface UIStateManagerRuntimeScope {
    readonly getAbortController?:
        | (() => typeof globalThis.AbortController | undefined)
        | undefined;
    readonly getDocumentTitle?: (() => string | undefined) | undefined;
    readonly getEventTarget?:
        | (() => UIStateManagerEventTarget | undefined)
        | undefined;
    readonly getMatchMedia?:
        | (() => typeof globalThis.matchMedia | undefined)
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
    getSystemThemeMediaQuery: () => MediaQueryList | null;
    getWindowState: () => UIStateWindowStateSnapshot | null;
    hasWindow: () => boolean;
    setDocumentTitle: (title: string) => void;
}

const defaultUIStateManagerRuntimeScope: UIStateManagerRuntimeScope = {
    getAbortController: () => globalThis.AbortController,
    getDocumentTitle: () => globalThis.document.title,
    getEventTarget: () =>
        typeof globalThis.addEventListener === "function"
            ? globalThis
            : undefined,
    getMatchMedia: () => globalThis.matchMedia,
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
        getSystemThemeMediaQuery(): MediaQueryList | null {
            const matchMedia = getMatchMedia(scope);

            return typeof matchMedia === "function"
                ? matchMedia("(prefers-color-scheme: dark)")
                : null;
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
        hasWindow(): boolean {
            return getEventTarget(scope) !== undefined;
        },
        setDocumentTitle(title): void {
            getSetDocumentTitle(scope)?.(title);
        },
    };
}
