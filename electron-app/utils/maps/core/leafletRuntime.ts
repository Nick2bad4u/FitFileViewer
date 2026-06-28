import {
    type BrowserTimerHandle,
    getBrowserClearTimeout,
    getBrowserDateNow,
    getBrowserSetTimeout,
} from "../../runtime/browserRuntime.js";

type LeafletRuntimeRegistry = {
    runtime?: unknown;
};

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
    readonly getClearTimeout?:
        | (() => LeafletRuntimeClearTimeout | undefined)
        | undefined;
    readonly getDateNow?: (() => (() => number) | undefined) | undefined;
    readonly getSetTimeout?:
        | (() => LeafletRuntimeSetTimeout | undefined)
        | undefined;
}

const leafletRuntimeRegistry: LeafletRuntimeRegistry = {};

const defaultLeafletRuntimeEnvironmentScope: LeafletRuntimeEnvironmentScope = {
    getClearTimeout: getBrowserClearTimeout,
    getDateNow: getBrowserDateNow,
    getSetTimeout: getBrowserSetTimeout,
};

export function setLeafletRuntime(runtime: unknown): void {
    leafletRuntimeRegistry.runtime = runtime;
}

export function isRegisteredLeafletRuntime(
    value: unknown
): value is Record<string, unknown> {
    if (typeof value !== "object" || value === null || Array.isArray(value)) {
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
    leafletRuntimeRegistry.runtime = undefined;
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
    return {
        dateNow(): number {
            return getRequiredDateNow(scope)();
        },
        waitForNextPoll(): Promise<void> {
            const clearTimeout = getRequiredClearTimeout(scope),
                setTimeout = getRequiredSetTimeout(scope);
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
    return [leafletRuntimeRegistry.runtime];
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

function getRequiredClearTimeout(
    scope: LeafletRuntimeEnvironmentScope
): LeafletRuntimeClearTimeout {
    const clearTimeout = scope.getClearTimeout?.();
    if (typeof clearTimeout === "function") {
        return clearTimeout;
    }

    throw new TypeError("leafletRuntime requires clearTimeout");
}

function getRequiredDateNow(
    scope: LeafletRuntimeEnvironmentScope
): () => number {
    const dateNow = scope.getDateNow?.();
    if (typeof dateNow === "function") {
        return dateNow;
    }

    throw new TypeError("leafletRuntime requires a date clock");
}

function getRequiredSetTimeout(
    scope: LeafletRuntimeEnvironmentScope
): LeafletRuntimeSetTimeout {
    const setTimeout = scope.getSetTimeout?.();
    if (typeof setTimeout === "function") {
        return setTimeout;
    }

    throw new TypeError("leafletRuntime requires setTimeout");
}
