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

const defaultMasterStateRuntimeScope: MasterStateRuntimeScope = globalThis;

export function getMasterStateRuntime(
    scope: MasterStateRuntimeScope = defaultMasterStateRuntimeScope
): MasterStateRuntime {
    const getLocation = (): LocationLike =>
        scope.window === undefined ? {} : (scope.location ?? {});

    return {
        addGlobalEventListener(type, listener, options): void {
            // eslint-disable-next-line runtime-cleanup/no-unmanaged-event-listeners -- This scoped runtime forwards caller-owned listener options, including AbortSignal cleanup.
            scope.addEventListener?.(type, listener as EventListener, options);
        },
        addWindowEventListener(type, listener, options): void {
            // eslint-disable-next-line runtime-cleanup/no-unmanaged-event-listeners -- This scoped runtime forwards caller-owned listener options, including AbortSignal cleanup.
            scope.window?.addEventListener(
                type,
                listener as EventListener,
                options
            );
        },
        createAbortController(): AbortController {
            const AbortControllerConstructor = scope.AbortController;
            if (typeof AbortControllerConstructor !== "function") {
                throw new TypeError(
                    "master state manager requires an AbortController runtime"
                );
            }

            return new AbortControllerConstructor();
        },
        dispatchGlobalEvent(event): boolean {
            return scope.dispatchEvent?.(event) ?? false;
        },
        isDevelopmentScope(options = {}): boolean {
            const location = getLocation();
            const hostname = getLocationText(location, "hostname");
            const search = getLocationText(location, "search");
            const hash = getLocationText(location, "hash");
            const protocol = getLocationText(location, "protocol");
            const href = getLocationText(location, "href");

            return (
                hostname === "localhost" ||
                hostname === "127.0.0.1" ||
                hostname.includes("dev") ||
                scope.__DEVELOPMENT__ === true ||
                search.includes("debug=true") ||
                hash.includes("debug") ||
                options.hasDevelopmentModeAttribute === true ||
                protocol === "file:" ||
                (scope.window !== undefined &&
                    options.electronDevMode !== undefined) ||
                href.includes("electron")
            );
        },
        get location(): LocationLike {
            return getLocation();
        },
    };
}
