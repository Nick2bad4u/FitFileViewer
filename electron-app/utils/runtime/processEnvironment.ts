import {
    getBrowserProcessCandidate,
    setBrowserProcessCandidate,
} from "./browserRuntime.js";

export type RuntimeProcessStringPropertyName =
    | "arch"
    | "platform"
    | "resourcesPath";

type RuntimeProcessCandidate = Readonly<{
    readonly arch?: unknown;
    readonly argv?: unknown;
    readonly cwd?: unknown;
    readonly env?: unknown;
    readonly platform?: unknown;
    readonly resourcesPath?: unknown;
    readonly versions?: unknown;
}>;

/**
 * Reads process environment values through a defensive runtime boundary.
 *
 * Renderer contexts, tests, and browser-like sandboxes may not expose a runtime
 * process object or process environment. Direct `process.env?.FOO` access still
 * throws when `process` itself is missing, so renderer-safe code should use
 * this helper instead.
 */
export function getProcessEnvironmentValue(name: string): string | undefined {
    const processValue = toProcessCandidate(getRuntimeProcess());
    if (processValue === undefined) {
        return undefined;
    }

    const env = toObjectCandidate(getDataProperty(processValue, "env"));
    if (env === undefined) {
        return undefined;
    }

    const value = getDataProperty(env, name);
    return typeof value === "string" ? value : undefined;
}

export function getProcessArgumentValues(): readonly string[] {
    const processValue = toProcessCandidate(getRuntimeProcess());
    if (processValue === undefined) {
        return [];
    }

    const argv = getDataProperty(processValue, "argv");
    if (!Array.isArray(argv)) {
        return [];
    }

    return argv.filter((value): value is string => typeof value === "string");
}

export function getProcessStringValue(
    name: RuntimeProcessStringPropertyName
): string | undefined {
    const processValue = toProcessCandidate(getRuntimeProcess());
    if (processValue === undefined) {
        return undefined;
    }

    const value = getDataProperty(processValue, name);
    return typeof value === "string" ? value : undefined;
}

export function getProcessVersionValue(name: string): string | undefined {
    const processValue = toProcessCandidate(getRuntimeProcess());
    if (processValue === undefined) {
        return undefined;
    }

    const versions = toObjectCandidate(
        getDataProperty(processValue, "versions")
    );
    if (versions === undefined) {
        return undefined;
    }

    const value = getDataProperty(versions, name);
    return typeof value === "string" ? value : undefined;
}

export function getProcessCurrentWorkingDirectory(): string | undefined {
    const processValue = toProcessCandidate(getRuntimeProcess());
    if (processValue === undefined) {
        return undefined;
    }

    const cwd = getDataProperty(processValue, "cwd");
    if (typeof cwd !== "function") {
        return undefined;
    }

    try {
        const value = cwd.call(processValue);
        return typeof value === "string" ? value : undefined;
    } catch {
        return undefined;
    }
}

export function getRuntimeProcess(): unknown {
    return getBrowserProcessCandidate();
}

export function setRuntimeProcess(processValue: unknown): void {
    setBrowserProcessCandidate(processValue);
}

function isObjectCandidate(value: unknown): value is object {
    return typeof value === "object" && value !== null && !Array.isArray(value);
}

function toObjectCandidate(value: unknown): object | undefined {
    return isObjectCandidate(value) ? value : undefined;
}

function toProcessCandidate(
    value: unknown
): RuntimeProcessCandidate | undefined {
    return isObjectCandidate(value) ? value : undefined;
}

function getDataProperty(target: object, propertyKey: string): unknown {
    try {
        let candidate: object | null = target;
        while (candidate !== null) {
            const descriptor = Object.getOwnPropertyDescriptor(
                candidate,
                propertyKey
            );
            if (descriptor !== undefined) {
                return "value" in descriptor ? descriptor.value : undefined;
            }
            candidate = Object.getPrototypeOf(candidate);
        }
        return undefined;
    } catch {
        return undefined;
    }
}

/**
 * Checks NODE_ENV without assuming a Node process global exists.
 */
export function isNodeEnvironment(expected: string): boolean {
    return getProcessEnvironmentValue("NODE_ENV") === expected;
}

/**
 * Checks whether runtime diagnostics should use development-only behavior.
 */
export function isDevelopmentEnvironment(): boolean {
    return isNodeEnvironment("development");
}

/**
 * Checks whether the current runtime is a test harness.
 */
export function isTestEnvironment(): boolean {
    return isNodeEnvironment("test");
}
