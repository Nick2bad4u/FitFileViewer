type LocationLike = Partial<
    Pick<Location, "hash" | "hostname" | "href" | "protocol" | "search">
>;

type MasterStateGlobalEventMap = WindowEventMap & {
    unhandledrejection: PromiseRejectionEvent;
};

type WindowEventTarget = Pick<Window, "addEventListener">;

export interface MasterStateRuntimeScope {
    readonly __DEVELOPMENT__?: boolean;
    readonly AbortController?: typeof globalThis.AbortController | undefined;
    readonly addEventListener?: typeof globalThis.addEventListener | undefined;
    readonly dispatchEvent?: typeof globalThis.dispatchEvent | undefined;
    readonly getAbortController?:
        | (() => typeof globalThis.AbortController | undefined)
        | undefined;
    readonly getAddEventListener?:
        | (() => typeof globalThis.addEventListener | undefined)
        | undefined;
    readonly getDevelopmentFlag?: (() => boolean | undefined) | undefined;
    readonly getDispatchEvent?:
        | (() => typeof globalThis.dispatchEvent | undefined)
        | undefined;
    readonly getLocation?: (() => LocationLike | undefined) | undefined;
    readonly getWindow?: (() => WindowEventTarget | undefined) | undefined;
    readonly location?: LocationLike | undefined;
    readonly window?: WindowEventTarget | undefined;
}

export interface MasterStateDevelopmentOptions {
    readonly electronDevMode?: boolean | undefined;
    readonly hasDevelopmentModeAttribute?: boolean | undefined;
}

export interface MasterStateRuntime {
    addGlobalEventListener: <K extends keyof MasterStateGlobalEventMap>(
        type: K,
        listener: (event: MasterStateGlobalEventMap[K]) => void,
        options?: AddEventListenerOptions
    ) => void;
    addWindowEventListener: <K extends keyof WindowEventMap>(
        type: K,
        listener: (event: WindowEventMap[K]) => void,
        options?: AddEventListenerOptions
    ) => void;
    createAbortController: () => AbortController;
    dispatchGlobalEvent: (event: Event) => boolean;
    isDevelopmentScope: (options?: MasterStateDevelopmentOptions) => boolean;
    readonly location: LocationLike;
}

function getLocationText(
    location: LocationLike,
    key: keyof LocationLike
): string {
    const value = location[key];
    return typeof value === "string" ? value : "";
}

const defaultMasterStateRuntimeScope: MasterStateRuntimeScope = {
    getAbortController: () => globalThis.AbortController,
    getAddEventListener: () => globalThis.addEventListener,
    getDevelopmentFlag: () =>
        Reflect.get(globalThis, "__DEVELOPMENT__") === true,
    getDispatchEvent: () => globalThis.dispatchEvent,
    getLocation: () => globalThis.location,
    getWindow: () => globalThis.window,
};

function getScopeAbortController(
    scope: MasterStateRuntimeScope
): typeof globalThis.AbortController | undefined {
    return scope.getAbortController?.() ?? scope.AbortController;
}

function getScopeAddEventListener(
    scope: MasterStateRuntimeScope
): typeof globalThis.addEventListener | undefined {
    return scope.getAddEventListener?.() ?? scope.addEventListener;
}

function getScopeDevelopmentFlag(
    scope: MasterStateRuntimeScope
): boolean | undefined {
    return scope.getDevelopmentFlag?.() ?? scope.__DEVELOPMENT__;
}

function getScopeDispatchEvent(
    scope: MasterStateRuntimeScope
): typeof globalThis.dispatchEvent | undefined {
    return scope.getDispatchEvent?.() ?? scope.dispatchEvent;
}

function getScopeLocation(
    scope: MasterStateRuntimeScope
): LocationLike | undefined {
    return scope.getLocation?.() ?? scope.location;
}

function getScopeWindow(
    scope: MasterStateRuntimeScope
): WindowEventTarget | undefined {
    return scope.getWindow?.() ?? scope.window;
}

export function getMasterStateRuntime(
    scope: MasterStateRuntimeScope = defaultMasterStateRuntimeScope
): MasterStateRuntime {
    const getLocation = (): LocationLike =>
        getScopeWindow(scope) === undefined ? {} : (getScopeLocation(scope) ?? {});

    return {
        addGlobalEventListener(type, listener, options): void {
            const addEventListenerRef = getScopeAddEventListener(scope);
            // eslint-disable-next-line runtime-cleanup/no-unmanaged-event-listeners -- This scoped runtime forwards caller-owned listener options, including AbortSignal cleanup.
            addEventListenerRef?.call(
                scope,
                type,
                listener as EventListener,
                options
            );
        },
        addWindowEventListener(type, listener, options): void {
            const windowTarget = getScopeWindow(scope);
            // eslint-disable-next-line runtime-cleanup/no-unmanaged-event-listeners -- This scoped runtime forwards caller-owned listener options, including AbortSignal cleanup.
            windowTarget?.addEventListener(
                type,
                listener as EventListener,
                options
            );
        },
        createAbortController(): AbortController {
            const AbortControllerConstructor = getScopeAbortController(scope);
            if (typeof AbortControllerConstructor !== "function") {
                throw new TypeError(
                    "master state manager requires an AbortController runtime"
                );
            }

            return new AbortControllerConstructor();
        },
        dispatchGlobalEvent(event): boolean {
            return getScopeDispatchEvent(scope)?.call(scope, event) ?? false;
        },
        isDevelopmentScope(options = {}): boolean {
            const location = getLocation();
            const windowTarget = getScopeWindow(scope);
            const hostname = getLocationText(location, "hostname");
            const search = getLocationText(location, "search");
            const hash = getLocationText(location, "hash");
            const protocol = getLocationText(location, "protocol");
            const href = getLocationText(location, "href");

            return (
                hostname === "localhost" ||
                hostname === "127.0.0.1" ||
                hostname.includes("dev") ||
                getScopeDevelopmentFlag(scope) === true ||
                search.includes("debug=true") ||
                hash.includes("debug") ||
                options.hasDevelopmentModeAttribute === true ||
                protocol === "file:" ||
                (windowTarget !== undefined &&
                    options.electronDevMode !== undefined) ||
                href.includes("electron")
            );
        },
        get location(): LocationLike {
            return getLocation();
        },
    };
}
