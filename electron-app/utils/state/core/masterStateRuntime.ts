import {
    type BrowserAbortControllerConstructor,
    type BrowserAddEventListener,
    type BrowserClearInterval,
    type BrowserCustomEventConstructor,
    type BrowserDispatchEvent,
    type BrowserIntervalHandle,
    type BrowserSetInterval,
    getBrowserAbortController,
    getBrowserAddEventListener,
    getBrowserClearInterval,
    getBrowserCustomEvent,
    getBrowserDateNow,
    getBrowserDocument,
    getBrowserDispatchEvent,
    getBrowserEventTarget,
    getBrowserLocation,
    getBrowserPerformance,
    getBrowserSetInterval,
} from "../../runtime/browserRuntime.js";

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
export type MasterStateIntervalHandle = BrowserIntervalHandle;
type MasterStatePerformanceMemory = {
    readonly totalJSHeapSize: number;
    readonly usedJSHeapSize: number;
};
type MasterStatePerformance = Performance & {
    readonly memory?: MasterStatePerformanceMemory | undefined;
};
type MasterStateQueryScope = Pick<Document, "querySelectorAll">;
type MasterStateRuntimeProvider<T> = (() => T | undefined) | undefined;

export interface MasterStateRuntimeScope {
    readonly getAbortController: MasterStateRuntimeProvider<BrowserAbortControllerConstructor>;
    readonly getAddEventListener: MasterStateRuntimeProvider<BrowserAddEventListener>;
    readonly getClearInterval: MasterStateRuntimeProvider<BrowserClearInterval>;
    readonly getCustomEvent: MasterStateRuntimeProvider<BrowserCustomEventConstructor>;
    readonly getDateNow: MasterStateRuntimeProvider<() => number>;
    readonly getDevelopmentFlag: MasterStateRuntimeProvider<boolean>;
    readonly getDocument: MasterStateRuntimeProvider<Document>;
    readonly getDocumentEventTarget: MasterStateRuntimeProvider<MasterStateEventTarget>;
    readonly getDocumentBody: MasterStateRuntimeProvider<MasterStateDocumentBody>;
    readonly getDocumentElement: MasterStateRuntimeProvider<MasterStateDocumentElement>;
    readonly getDocumentQueryScope: MasterStateRuntimeProvider<MasterStateQueryScope>;
    readonly getDispatchEvent: MasterStateRuntimeProvider<BrowserDispatchEvent>;
    readonly getEventTarget: MasterStateRuntimeProvider<MasterStateEventTarget>;
    readonly getLocation: MasterStateRuntimeProvider<LocationLike>;
    readonly getPerformanceMemory: MasterStateRuntimeProvider<MasterStatePerformanceMemory>;
    readonly getSetInterval: MasterStateRuntimeProvider<BrowserSetInterval>;
}

export interface MasterStateDevelopmentOptions {
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
    createThemeChangedEvent: (
        theme: unknown
    ) => CustomEvent<{ theme: unknown }>;
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

const defaultMasterStateRuntimeScope: MasterStateRuntimeScope = {
    getAbortController: getBrowserAbortController,
    getAddEventListener: getBrowserAddEventListener,
    getClearInterval: getBrowserClearInterval,
    getCustomEvent: getBrowserCustomEvent,
    getDateNow: getBrowserDateNow,
    getDevelopmentFlag: () => undefined,
    getDocument: getBrowserDocument,
    getDocumentBody: () => undefined,
    getDocumentElement: () => undefined,
    getDocumentEventTarget: () => undefined,
    getDocumentQueryScope: () => undefined,
    getDispatchEvent: getBrowserDispatchEvent,
    getEventTarget: getBrowserEventTarget,
    getLocation: getBrowserLocation,
    getPerformanceMemory: getBrowserMasterStatePerformanceMemory,
    getSetInterval: getBrowserSetInterval,
};

function getBrowserMasterStatePerformanceMemory():
    | MasterStatePerformanceMemory
    | undefined {
    return (getBrowserPerformance() as MasterStatePerformance | undefined)
        ?.memory;
}

function getRequiredProvider<T>(
    provider: MasterStateRuntimeProvider<T>,
    providerName: string
): () => T | undefined {
    if (typeof provider !== "function") {
        throw new TypeError(
            `master state manager requires ${providerName} provider`
        );
    }

    return provider;
}

function getScopeAbortController(
    scope: MasterStateRuntimeScope
): BrowserAbortControllerConstructor | undefined {
    return getRequiredProvider(scope.getAbortController, "AbortController")();
}

function getScopeAddEventListener(
    scope: MasterStateRuntimeScope
): BrowserAddEventListener | undefined {
    return getRequiredProvider(scope.getAddEventListener, "addEventListener")();
}

function getRequiredClearInterval(
    scope: MasterStateRuntimeScope
): BrowserClearInterval {
    const clearIntervalRef = getRequiredProvider(
        scope.getClearInterval,
        "clearInterval"
    )();
    if (typeof clearIntervalRef !== "function") {
        throw new TypeError(
            "master state manager requires clearInterval runtime"
        );
    }

    return clearIntervalRef;
}

function getRequiredCustomEvent(
    scope: MasterStateRuntimeScope
): BrowserCustomEventConstructor {
    const CustomEventConstructor = getRequiredProvider(
        scope.getCustomEvent,
        "CustomEvent"
    )();
    if (typeof CustomEventConstructor !== "function") {
        throw new TypeError(
            "master state manager requires a CustomEvent runtime"
        );
    }

    return CustomEventConstructor;
}

function getScopeDevelopmentFlag(
    scope: MasterStateRuntimeScope
): boolean | undefined {
    return getRequiredProvider(scope.getDevelopmentFlag, "developmentFlag")();
}

function getRequiredDateNow(scope: MasterStateRuntimeScope): () => number {
    const dateNow = getRequiredProvider(scope.getDateNow, "dateNow")();
    if (typeof dateNow !== "function") {
        throw new TypeError("master state manager requires dateNow");
    }

    return dateNow;
}

function getScopeDocumentEventTarget(
    scope: MasterStateRuntimeScope
): MasterStateEventTarget | undefined {
    return (
        getRequiredProvider(
            scope.getDocumentEventTarget,
            "documentEventTarget"
        )() ?? getScopeDocument(scope)
    );
}

function getScopeDocumentBody(
    scope: MasterStateRuntimeScope
): MasterStateDocumentBody | undefined {
    return (
        getRequiredProvider(scope.getDocumentBody, "documentBody")() ??
        getScopeDocument(scope)?.body
    );
}

function getScopeDocumentElement(
    scope: MasterStateRuntimeScope
): MasterStateDocumentElement | undefined {
    return (
        getRequiredProvider(scope.getDocumentElement, "documentElement")() ??
        getScopeDocument(scope)?.documentElement
    );
}

function getScopeDocumentQueryScope(
    scope: MasterStateRuntimeScope
): MasterStateQueryScope | undefined {
    return (
        getRequiredProvider(
            scope.getDocumentQueryScope,
            "documentQueryScope"
        )() ?? getScopeDocument(scope)
    );
}

function getScopeDocument(
    scope: MasterStateRuntimeScope
): Document | undefined {
    return getRequiredProvider(scope.getDocument, "document")();
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
): BrowserDispatchEvent | undefined {
    return getRequiredProvider(scope.getDispatchEvent, "dispatchEvent")();
}

function getScopeEventTarget(
    scope: MasterStateRuntimeScope
): MasterStateEventTarget | undefined {
    return getRequiredProvider(scope.getEventTarget, "eventTarget")();
}

function getScopeLocation(
    scope: MasterStateRuntimeScope
): LocationLike | undefined {
    return getRequiredProvider(scope.getLocation, "location")();
}

function getRequiredSetInterval(
    scope: MasterStateRuntimeScope
): BrowserSetInterval {
    const setIntervalRef = getRequiredProvider(
        scope.getSetInterval,
        "setInterval"
    )();
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
        createThemeChangedEvent(theme): CustomEvent<{ theme: unknown }> {
            return new (getRequiredCustomEvent(scope))("themeChanged", {
                detail: { theme },
            });
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
            return getRequiredProvider(
                scope.getPerformanceMemory,
                "performanceMemory"
            )();
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
                getScopeDevelopmentFlag(scope) === true ||
                search.includes("debug=true") ||
                hash.includes("debug") ||
                options.hasDevelopmentModeAttribute === true ||
                protocol === "file:" ||
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
