import {
    type BrowserClearInterval,
    type BrowserIntervalHandle,
    type BrowserSetInterval,
    getBrowserClearInterval,
    getBrowserDateNow,
    getBrowserDocument,
    getBrowserLocation,
    getBrowserPerformance,
    getBrowserSetInterval,
} from "../runtime/browserRuntime.js";

export type StateDevToolsIntervalHandle = BrowserIntervalHandle;

export type StateDevToolsPerformanceRuntime = {
    readonly memory?: unknown;
    readonly now?: (() => number) | undefined;
};

type StateDevToolsLocationRuntime = {
    readonly hostname?: string;
    readonly protocol?: string;
};

export interface StateDevToolsRuntimeScope {
    readonly getClearInterval: StateDevToolsRuntimeProvider<BrowserClearInterval>;
    readonly getDateNow: StateDevToolsRuntimeProvider<() => number>;
    readonly getLocation: StateDevToolsRuntimeProvider<StateDevToolsLocationRuntime>;
    readonly getPerformance: StateDevToolsRuntimeProvider<StateDevToolsPerformanceRuntime>;
    readonly getSetInterval: StateDevToolsRuntimeProvider<BrowserSetInterval>;
    readonly getIsRendererScope: StateDevToolsRuntimeProvider<boolean>;
}

export interface StateDevToolsRuntime {
    clearInterval: (handle: StateDevToolsIntervalHandle) => void;
    dateNow: () => number;
    getPerformanceMemory: () => unknown;
    isDevelopmentScope: () => boolean;
    performanceNow: () => number;
    setInterval: (
        callback: () => void,
        delay: number
    ) => StateDevToolsIntervalHandle;
}

const defaultStateDevToolsRuntimeScope: StateDevToolsRuntimeScope = {
    getClearInterval: getBrowserClearInterval,
    getDateNow: getBrowserDateNow,
    getIsRendererScope: () => getBrowserDocument() !== undefined,
    getLocation: getBrowserLocation,
    getPerformance: getBrowserPerformance,
    getSetInterval: getBrowserSetInterval,
};

type StateDevToolsRuntimeProvider<T> = (() => T | undefined) | undefined;

function getRequiredProvider<T>(
    provider: StateDevToolsRuntimeProvider<T>,
    providerName: string
): () => T | undefined {
    if (typeof provider !== "function") {
        throw new TypeError(
            `stateDevToolsRuntime requires ${providerName} provider`
        );
    }

    return provider;
}

function getRequiredDateNow(
    getDateNow: () => (() => number) | undefined
): () => number {
    const dateNow = getDateNow();
    if (typeof dateNow !== "function") {
        throw new TypeError("stateDevToolsRuntime requires dateNow");
    }

    return dateNow;
}

function getRequiredPerformanceNow(
    getPerformance: () => StateDevToolsPerformanceRuntime | undefined
): () => number {
    const performance = getPerformance();
    const performanceNow = performance?.now;
    if (typeof performanceNow !== "function") {
        throw new TypeError("stateDevToolsRuntime requires performance.now");
    }

    return performanceNow.bind(performance);
}

function getScopeClearInterval(
    getClearInterval: () => BrowserClearInterval | undefined
): BrowserClearInterval | undefined {
    return getClearInterval();
}

function getScopeLocation(
    getLocation: () => StateDevToolsLocationRuntime | undefined
): StateDevToolsLocationRuntime | undefined {
    return getLocation();
}

function getScopeSetInterval(
    getSetInterval: () => BrowserSetInterval | undefined
): BrowserSetInterval | undefined {
    return getSetInterval();
}

function getIsRendererScope(
    getIsRendererScopeProvider: () => boolean | undefined
): boolean {
    return getIsRendererScopeProvider() ?? false;
}

function isLocalHost(hostname: unknown): boolean {
    return hostname === "localhost" || hostname === "127.0.0.1";
}

function isFileProtocol(protocol: unknown): boolean {
    return protocol === "file:";
}

export function getStateDevToolsRuntime(
    scope: StateDevToolsRuntimeScope = defaultStateDevToolsRuntimeScope
): StateDevToolsRuntime {
    const getClearIntervalRef = getRequiredProvider(
        scope.getClearInterval,
        "clearInterval"
    );
    const getDateNow = getRequiredProvider(scope.getDateNow, "dateNow");
    const getIsRendererScopeProvider = getRequiredProvider(
        scope.getIsRendererScope,
        "isRendererScope"
    );
    const getLocation = getRequiredProvider(scope.getLocation, "location");
    const getPerformance = getRequiredProvider(
        scope.getPerformance,
        "performance"
    );
    const getSetIntervalRef = getRequiredProvider(
        scope.getSetInterval,
        "setInterval"
    );

    return {
        clearInterval(handle): void {
            const clearIntervalImplementation =
                getScopeClearInterval(getClearIntervalRef);
            if (typeof clearIntervalImplementation !== "function") {
                throw new TypeError(
                    "stateDevToolsRuntime requires clearInterval"
                );
            }

            clearIntervalImplementation(handle);
        },
        dateNow(): number {
            return getRequiredDateNow(getDateNow)();
        },
        getPerformanceMemory(): unknown {
            return getPerformance()?.memory;
        },
        isDevelopmentScope(): boolean {
            const location = getScopeLocation(getLocation);
            return (
                getIsRendererScope(getIsRendererScopeProvider) &&
                (isLocalHost(location?.hostname) ||
                    isFileProtocol(location?.protocol))
            );
        },
        performanceNow(): number {
            return getRequiredPerformanceNow(getPerformance)();
        },
        setInterval(callback, delay): StateDevToolsIntervalHandle {
            const setIntervalImplementation =
                getScopeSetInterval(getSetIntervalRef);
            if (typeof setIntervalImplementation !== "function") {
                throw new TypeError(
                    "stateDevToolsRuntime requires setInterval"
                );
            }

            return setIntervalImplementation(callback, delay);
        },
    };
}
