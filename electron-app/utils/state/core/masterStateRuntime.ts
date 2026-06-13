type LocationLike = Partial<
    Pick<Location, "hash" | "hostname" | "href" | "protocol" | "search">
>;

type MasterStateGlobalEventMap = WindowEventMap & {
    unhandledrejection: PromiseRejectionEvent;
};

type WindowEventTarget = Pick<Window, "addEventListener">;

export interface MasterStateRuntimeScope {
    readonly __DEVELOPMENT__?: boolean;
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

export function getMasterStateRuntime(
    scope: MasterStateRuntimeScope = globalThis
): MasterStateRuntime {
    const getLocation = (): LocationLike =>
        scope.window === undefined ? {} : (scope.location ?? {});

    return {
        addGlobalEventListener(type, listener, options): void {
            scope.addEventListener?.call(
                scope,
                type,
                listener as EventListener,
                options
            );
        },
        addWindowEventListener(type, listener, options): void {
            scope.window?.addEventListener(
                type,
                listener as EventListener,
                options
            );
        },
        dispatchGlobalEvent(event): boolean {
            return scope.dispatchEvent?.call(scope, event) ?? false;
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
