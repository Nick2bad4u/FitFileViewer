import {
    type BrowserTimerHandle,
    getBrowserClearTimeout,
    getBrowserDateNow,
    getBrowserSetTimeout,
} from "../../runtime/browserRuntime.js";

type LeafletRuntimeRegistry = {
    registeredRuntime?: RegisteredLeafletRuntime;
};

type LeafletControlFactory =
    | ((...args: never[]) => unknown)
    | Readonly<Record<string, unknown>>;
type LeafletLayerConstructor = new (...args: never[]) => unknown;

export type RegisteredLeafletRuntime = Readonly<{
    control: LeafletControlFactory;
    Layer: LeafletLayerConstructor;
    map: (...args: never[]) => unknown;
    tileLayer: (...args: never[]) => unknown;
}> &
    Readonly<Record<string, unknown>>;

type LeafletRuntimeCandidate = Readonly<{
    control?: unknown;
    Layer?: unknown;
    map?: unknown;
    tileLayer?: unknown;
}>;

export type LeafletRuntimeTimeoutHandle = BrowserTimerHandle;
type LeafletRuntimeClearTimeout = (handle: LeafletRuntimeTimeoutHandle) => void;
type LeafletRuntimeSetTimeout = (
    callback: () => void,
    delay: number
) => LeafletRuntimeTimeoutHandle;

export interface LeafletRuntimeEnvironment {
    dateNow: () => number;
    waitForNextPoll: () => Promise<void>;
}

export interface LeafletRuntimeEnvironmentScope {
    readonly getClearTimeout: LeafletRuntimeEnvironmentProvider<
        LeafletRuntimeClearTimeout
    >;
    readonly getDateNow: LeafletRuntimeEnvironmentProvider<() => number>;
    readonly getSetTimeout: LeafletRuntimeEnvironmentProvider<
        LeafletRuntimeSetTimeout
    >;
}

const leafletRuntimeRegistry: LeafletRuntimeRegistry = {};

type LeafletRuntimeEnvironmentProvider<T> =
    | (() => T | undefined)
    | undefined;

const defaultLeafletRuntimeEnvironmentScope: LeafletRuntimeEnvironmentScope = {
    getClearTimeout: getBrowserClearTimeout,
    getDateNow: getBrowserDateNow,
    getSetTimeout: getBrowserSetTimeout,
};

export function registerLeafletRuntime(runtime: RegisteredLeafletRuntime): void {
    leafletRuntimeRegistry.registeredRuntime = runtime;
}

export function isRegisteredLeafletRuntime(
    value: unknown
): value is RegisteredLeafletRuntime {
    if (!isLeafletRuntimeCandidate(value)) {
        return false;
    }

    return (
        hasFunctionProperty(value, "Layer") &&
        hasFunctionProperty(value, "map") &&
        hasFunctionProperty(value, "tileLayer") &&
        hasControlProperty(value)
    );
}

export function clearLeafletRuntimeForTests(): void {
    delete leafletRuntimeRegistry.registeredRuntime;
}

export function resolveLeafletRuntime<T>(
    isRuntime: (value: unknown) => value is T
): T | null {
    for (const candidate of getLeafletRuntimeCandidates()) {
        if (isRuntime(candidate)) {
            return candidate;
        }
    }

    return null;
}

export async function waitForLeafletRuntime<T>(
    isRuntime: (value: unknown) => value is T,
    timeoutMs = 15_000,
    environment = getLeafletRuntimeEnvironment()
): Promise<T | null> {
    const existingRuntime = resolveLeafletRuntime(isRuntime);
    if (existingRuntime) {
        return existingRuntime;
    }

    const startedAt = environment.dateNow();
    while (environment.dateNow() - startedAt < timeoutMs) {
        await environment.waitForNextPoll();
        const runtime = resolveLeafletRuntime(isRuntime);
        if (runtime) {
            return runtime;
        }
    }

    return null;
}

export function getLeafletRuntimeEnvironment(
    scope: LeafletRuntimeEnvironmentScope = defaultLeafletRuntimeEnvironmentScope
): LeafletRuntimeEnvironment {
    const getClearTimeout = getRequiredProvider(
        scope.getClearTimeout,
        "clearTimeout"
    );
    const getDateNow = getRequiredProvider(scope.getDateNow, "date clock");
    const getSetTimeout = getRequiredProvider(
        scope.getSetTimeout,
        "setTimeout"
    );

    return {
        dateNow(): number {
            return getRequiredDateNow(getDateNow)();
        },
        waitForNextPoll(): Promise<void> {
            const clearTimeout = getRequiredClearTimeout(getClearTimeout),
                setTimeout = getRequiredSetTimeout(getSetTimeout);
            return new Promise<void>((resolve) => {
                const timeout = setTimeout(() => {
                    clearTimeout(timeout);
                    resolve();
                }, 20);
            });
        },
    };
}

function getLeafletRuntimeCandidates(): unknown[] {
    return [leafletRuntimeRegistry.registeredRuntime].filter(
        (runtime) => runtime !== undefined
    );
}

function hasControlProperty(value: object): boolean {
    if (!("control" in value)) {
        return false;
    }

    const control = value.control;
    return (
        (typeof control === "function" || typeof control === "object") &&
        control !== null
    );
}

function hasFunctionProperty(
    value: object,
    key: "Layer" | "map" | "tileLayer"
): boolean {
    if (!(key in value)) {
        return false;
    }

    return typeof value[key as keyof typeof value] === "function";
}

function isLeafletRuntimeCandidate(
    value: unknown
): value is LeafletRuntimeCandidate {
    return typeof value === "object" && value !== null && !Array.isArray(value);
}

function getRequiredClearTimeout(
    getClearTimeout: () => LeafletRuntimeClearTimeout | undefined
): LeafletRuntimeClearTimeout {
    const clearTimeout = getClearTimeout();
    if (typeof clearTimeout === "function") {
        return clearTimeout;
    }

    throw new TypeError("leafletRuntime requires clearTimeout");
}

function getRequiredDateNow(
    getDateNow: () => (() => number) | undefined
): () => number {
    const dateNow = getDateNow();
    if (typeof dateNow === "function") {
        return dateNow;
    }

    throw new TypeError("leafletRuntime requires a date clock");
}

function getRequiredSetTimeout(
    getSetTimeout: () => LeafletRuntimeSetTimeout | undefined
): LeafletRuntimeSetTimeout {
    const setTimeout = getSetTimeout();
    if (typeof setTimeout === "function") {
        return setTimeout;
    }

    throw new TypeError("leafletRuntime requires setTimeout");
}

function getRequiredProvider<T>(
    provider: LeafletRuntimeEnvironmentProvider<T>,
    providerLabel: string
): () => T | undefined {
    if (typeof provider !== "function") {
        throw new TypeError(`leafletRuntime requires ${providerLabel} provider`);
    }

    return provider;
}
