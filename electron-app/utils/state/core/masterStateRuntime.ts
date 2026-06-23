type LocationLike = Partial<
    Pick<Location, "hash" | "hostname" | "href" | "protocol" | "search">
>;

type MasterStateGlobalEventMap = WindowEventMap & {
    unhandledrejection: PromiseRejectionEvent;
};

type MasterStateEventTarget = Pick<EventTarget, "addEventListener">;
type MasterStateQueryScope = Pick<Document, "querySelectorAll">;

export interface MasterStateRuntimeScope {
    readonly getAbortController?:
        | (() => typeof globalThis.AbortController | undefined)
        | undefined;
    readonly getAddEventListener?:
        | (() => typeof globalThis.addEventListener | undefined)
        | undefined;
    readonly getDevelopmentFlag?: (() => boolean | undefined) | undefined;
    readonly getDocumentEventTarget?:
        | (() => MasterStateEventTarget | undefined)
        | undefined;
    readonly getDocumentQueryScope?:
        | (() => MasterStateQueryScope | undefined)
        | undefined;
    readonly getDispatchEvent?:
        | (() => typeof globalThis.dispatchEvent | undefined)
        | undefined;
    readonly getEventTarget?:
        | (() => MasterStateEventTarget | undefined)
        | undefined;
    readonly getLocation?: (() => LocationLike | undefined) | undefined;
}

export interface MasterStateDevelopmentOptions {
    readonly electronDevMode?: boolean | undefined;
    readonly hasDevelopmentModeAttribute?: boolean | undefined;
}

export interface MasterStateRuntime {
    addDocumentEventListener: <K extends keyof DocumentEventMap>(
        type: K,
        listener: (event: Readonly<DocumentEventMap[K]>) => void,
        options?: Readonly<AddEventListenerOptions>
    ) => void;
    addGlobalEventListener: <K extends keyof MasterStateGlobalEventMap>(
        type: K,
        listener: (event: Readonly<MasterStateGlobalEventMap[K]>) => void,
        options?: Readonly<AddEventListenerOptions>
    ) => void;
    addWindowEventListener: <K extends keyof WindowEventMap>(
        type: K,
        listener: (event: Readonly<WindowEventMap[K]>) => void,
        options?: Readonly<AddEventListenerOptions>
    ) => void;
    createAbortController: () => AbortController;
    dispatchGlobalEvent: (event: Readonly<Event>) => boolean;
    getLoadingSensitiveElements: () => Iterable<HTMLElement>;
    isDevelopmentScope: (
        options?: Readonly<MasterStateDevelopmentOptions>
    ) => boolean;
    readonly location: LocationLike;
}

function getLocationText(
    location: Readonly<LocationLike>,
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
    getDocumentEventTarget: () => globalThis.document,
    getDocumentQueryScope: () => globalThis.document,
    getDispatchEvent: () => globalThis.dispatchEvent,
    getEventTarget: () => globalThis,
    getLocation: () => globalThis.location,
};

function getScopeAbortController(
    scope: MasterStateRuntimeScope
): typeof globalThis.AbortController | undefined {
    return scope.getAbortController?.();
}

function getScopeAddEventListener(
    scope: MasterStateRuntimeScope
): typeof globalThis.addEventListener | undefined {
    return scope.getAddEventListener?.();
}

function getScopeDevelopmentFlag(
    scope: MasterStateRuntimeScope
): boolean | undefined {
    return scope.getDevelopmentFlag?.();
}

function getScopeDocumentEventTarget(
    scope: MasterStateRuntimeScope
): MasterStateEventTarget | undefined {
    return scope.getDocumentEventTarget?.();
}

function getScopeDocumentQueryScope(
    scope: MasterStateRuntimeScope
): MasterStateQueryScope | undefined {
    return scope.getDocumentQueryScope?.();
}

function getRequiredDocumentEventTarget(
    scope: MasterStateRuntimeScope
): MasterStateEventTarget {
    const documentEventTarget = getScopeDocumentEventTarget(scope);
    if (documentEventTarget === undefined) {
        throw new TypeError(
            "master state manager requires a document event-target runtime"
        );
    }

    return documentEventTarget;
}

function getScopeDispatchEvent(
    scope: MasterStateRuntimeScope
): typeof globalThis.dispatchEvent | undefined {
    return scope.getDispatchEvent?.();
}

function getScopeEventTarget(
    scope: MasterStateRuntimeScope
): MasterStateEventTarget | undefined {
    return scope.getEventTarget?.();
}

function getScopeLocation(
    scope: MasterStateRuntimeScope
): LocationLike | undefined {
    return scope.getLocation?.();
}

export function getMasterStateRuntime(
    scope: MasterStateRuntimeScope = defaultMasterStateRuntimeScope
): MasterStateRuntime {
    const getLocation = (): LocationLike =>
        getScopeEventTarget(scope) === undefined
            ? {}
            : (getScopeLocation(scope) ?? {});

    return {
        addDocumentEventListener(type, listener, options): void {
            const eventTarget = getRequiredDocumentEventTarget(scope);
            // eslint-disable-next-line runtime-cleanup/no-unmanaged-event-listeners -- This scoped runtime forwards caller-owned cleanup options.
            eventTarget.addEventListener(
                type,
                // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- DOM EventTarget cannot preserve typed event-map listener generics at this adapter boundary.
                listener as EventListener,
                options
            );
        },
        addGlobalEventListener(type, listener, options): void {
            const addEventListenerRef = getScopeAddEventListener(scope);
            addEventListenerRef?.call(
                scope,
                type,
                // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- DOM EventTarget cannot preserve typed event-map listener generics at this adapter boundary.
                listener as EventListener,
                options
            );
        },
        addWindowEventListener(type, listener, options): void {
            const eventTarget = getScopeEventTarget(scope);
            // eslint-disable-next-line runtime-cleanup/no-unmanaged-event-listeners -- This scoped runtime forwards caller-owned cleanup options.
            eventTarget?.addEventListener(
                type,
                // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- DOM EventTarget cannot preserve typed event-map listener generics at this adapter boundary.
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
        getLoadingSensitiveElements(): Iterable<HTMLElement> {
            return (
                getScopeDocumentQueryScope(
                    scope
                )?.querySelectorAll<HTMLElement>(".loading-sensitive") ?? []
            );
        },
        isDevelopmentScope(options = {}): boolean {
            const location = getLocation();
            const eventTarget = getScopeEventTarget(scope);
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
                (eventTarget !== undefined &&
                    options.electronDevMode !== undefined) ||
                href.includes("electron")
            );
        },
        get location(): LocationLike {
            return getLocation();
        },
    };
}
