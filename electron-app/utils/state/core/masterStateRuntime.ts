type LocationLike = Partial<
    Pick<Location, "hash" | "hostname" | "href" | "protocol" | "search">
>;

type MasterStateGlobalEventMap = WindowEventMap & {
    unhandledrejection: PromiseRejectionEvent;
};

type MasterStateBodyClassList = Pick<DOMTokenList, "add" | "remove">;
type MasterStateDocumentBody = {
    readonly classList: MasterStateBodyClassList;
};
type MasterStateDocumentElement = {
    readonly dataset: DOMStringMap;
    readonly hasAttribute?: Element["hasAttribute"] | undefined;
};
type MasterStateEventTarget = Pick<EventTarget, "addEventListener">;
export type MasterStateIntervalHandle = ReturnType<
    typeof globalThis.setInterval
>;
type MasterStatePerformanceMemory = {
    readonly totalJSHeapSize: number;
    readonly usedJSHeapSize: number;
};
type MasterStatePerformance = Performance & {
    readonly memory?: MasterStatePerformanceMemory | undefined;
};
type MasterStateQueryScope = Pick<Document, "querySelectorAll">;

export interface MasterStateRuntimeScope {
    readonly getAbortController?:
        | (() => typeof globalThis.AbortController | undefined)
        | undefined;
    readonly getAddEventListener?:
        | (() => typeof globalThis.addEventListener | undefined)
        | undefined;
    readonly getClearInterval?:
        | (() => typeof globalThis.clearInterval | undefined)
        | undefined;
    readonly getDateNow?: (() => (() => number) | undefined) | undefined;
    readonly getDevelopmentFlag?: (() => boolean | undefined) | undefined;
    readonly getDocumentEventTarget?:
        | (() => MasterStateEventTarget | undefined)
        | undefined;
    readonly getDocumentBody?:
        | (() => MasterStateDocumentBody | undefined)
        | undefined;
    readonly getDocumentElement?:
        | (() => MasterStateDocumentElement | undefined)
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
    readonly getPerformanceMemory?:
        | (() => MasterStatePerformanceMemory | undefined)
        | undefined;
    readonly getSetInterval?:
        | (() => typeof globalThis.setInterval | undefined)
        | undefined;
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
    addBodyClass: (className: string) => void;
    clearInterval: (handle: MasterStateIntervalHandle) => void;
    createAbortController: () => AbortController;
    dateNow: () => number;
    dispatchGlobalEvent: (event: Readonly<Event>) => boolean;
    getLoadingSensitiveElements: () => Iterable<HTMLElement>;
    getPerformanceMemory: () => MasterStatePerformanceMemory | undefined;
    isDevelopmentScope: (
        options?: Readonly<MasterStateDevelopmentOptions>
    ) => boolean;
    readonly location: LocationLike;
    hasDevelopmentModeAttribute: () => boolean;
    removeBodyClass: (className: string) => void;
    setInterval: (
        callback: () => void,
        delayMs: number
    ) => MasterStateIntervalHandle;
}

function getLocationText(
    location: Readonly<LocationLike>,
    key: keyof LocationLike
): string {
    const value = location[key];
    return typeof value === "string" ? value : "";
}

function getGlobalDocument(): Document {
    return globalThis.document;
}

const defaultMasterStateRuntimeScope: MasterStateRuntimeScope = {
    getAbortController: () => globalThis.AbortController,
    getAddEventListener: () => globalThis.addEventListener,
    getClearInterval: () => globalThis.clearInterval,
    getDateNow: () => Date.now,
    getDocumentBody: () => getGlobalDocument().body,
    getDocumentElement: () => getGlobalDocument().documentElement,
    getDocumentEventTarget: () => getGlobalDocument(),
    getDocumentQueryScope: () => getGlobalDocument(),
    getDispatchEvent: () => globalThis.dispatchEvent,
    getEventTarget: () => globalThis,
    getLocation: () => globalThis.location,
    getPerformanceMemory: () =>
        (globalThis.performance as MasterStatePerformance | undefined)?.memory,
    getSetInterval: () => globalThis.setInterval,
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

function getRequiredClearInterval(
    scope: MasterStateRuntimeScope
): typeof globalThis.clearInterval {
    const clearIntervalRef = scope.getClearInterval?.();
    if (typeof clearIntervalRef !== "function") {
        throw new TypeError(
            "master state manager requires clearInterval runtime"
        );
    }

    return clearIntervalRef;
}

function getScopeDevelopmentFlag(
    scope: MasterStateRuntimeScope
): boolean | undefined {
    return scope.getDevelopmentFlag?.();
}

function getRequiredDateNow(scope: MasterStateRuntimeScope): () => number {
    const dateNow = scope.getDateNow?.();
    if (typeof dateNow !== "function") {
        throw new TypeError("master state manager requires dateNow");
    }

    return dateNow;
}

function getScopeDocumentEventTarget(
    scope: MasterStateRuntimeScope
): MasterStateEventTarget | undefined {
    return scope.getDocumentEventTarget?.();
}

function getScopeDocumentBody(
    scope: MasterStateRuntimeScope
): MasterStateDocumentBody | undefined {
    return scope.getDocumentBody?.();
}

function getScopeDocumentElement(
    scope: MasterStateRuntimeScope
): MasterStateDocumentElement | undefined {
    return scope.getDocumentElement?.();
}

function getScopeDocumentQueryScope(
    scope: MasterStateRuntimeScope
): MasterStateQueryScope | undefined {
    return scope.getDocumentQueryScope?.();
}

function getRequiredDocumentBody(
    scope: MasterStateRuntimeScope
): MasterStateDocumentBody {
    const documentBody = getScopeDocumentBody(scope);
    if (documentBody === undefined) {
        throw new TypeError(
            "master state manager requires a document body runtime"
        );
    }

    return documentBody;
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

function getRequiredSetInterval(
    scope: MasterStateRuntimeScope
): typeof globalThis.setInterval {
    const setIntervalRef = scope.getSetInterval?.();
    if (typeof setIntervalRef !== "function") {
        throw new TypeError(
            "master state manager requires setInterval runtime"
        );
    }

    return setIntervalRef;
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
        addBodyClass(className): void {
            getRequiredDocumentBody(scope).classList.add(className);
        },
        clearInterval(handle): void {
            getRequiredClearInterval(scope)(handle);
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
        dateNow(): number {
            return getRequiredDateNow(scope)();
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
        getPerformanceMemory(): MasterStatePerformanceMemory | undefined {
            return scope.getPerformanceMemory?.();
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
        hasDevelopmentModeAttribute(): boolean {
            const documentElement = getScopeDocumentElement(scope);
            return (
                typeof documentElement?.hasAttribute === "function" &&
                Object.hasOwn(documentElement.dataset, "devMode")
            );
        },
        removeBodyClass(className): void {
            getRequiredDocumentBody(scope).classList.remove(className);
        },
        setInterval(callback, delayMs): MasterStateIntervalHandle {
            return getRequiredSetInterval(scope)(callback, delayMs);
        },
    };
}
