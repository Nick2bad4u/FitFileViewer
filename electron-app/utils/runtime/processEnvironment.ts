import {
    getBrowserProcessCandidate,
    setBrowserProcessCandidate,
} from "./browserRuntime.js";

type RuntimePropertyCandidate = {
    readonly [propertyKey: string]: unknown;
};

/**
 * Reads process environment values through a defensive runtime boundary.
 *
 * Renderer contexts, tests, and browser-like sandboxes may not expose
 * `globalThis.process` or `process.env`. Direct `process.env?.FOO` access still
 * throws when `process` itself is missing, so renderer-safe code should use
 * this helper instead.
 */
export function getProcessEnvironmentValue(name: string): string | undefined {
    const processValue = getRuntimeProcess();
    if (typeof processValue !== "object" || processValue === null) {
        return undefined;
    }

    const env = getRuntimeProperty(processValue, "env");
    if (typeof env !== "object" || env === null) {
        return undefined;
    }

    const value = getRuntimeProperty(env, name);
    return typeof value === "string" ? value : undefined;
}

export function getProcessArgumentValues(): readonly string[] {
    const processValue = getRuntimeProcess();
    if (typeof processValue !== "object" || processValue === null) {
        return [];
    }

    const argv = getRuntimeProperty(processValue, "argv");
    if (!Array.isArray(argv)) {
        return [];
    }

    return argv.filter((value): value is string => typeof value === "string");
}

export function getProcessStringValue(name: string): string | undefined {
    const processValue = getRuntimeProcess();
    if (typeof processValue !== "object" || processValue === null) {
        return undefined;
    }

    const value = getRuntimeProperty(processValue, name);
    return typeof value === "string" ? value : undefined;
}

export function getProcessVersionValue(name: string): string | undefined {
    const processValue = getRuntimeProcess();
    if (typeof processValue !== "object" || processValue === null) {
        return undefined;
    }

    const versions = getRuntimeProperty(processValue, "versions");
    if (typeof versions !== "object" || versions === null) {
        return undefined;
    }

    const value = getRuntimeProperty(versions, name);
    return typeof value === "string" ? value : undefined;
}

export function getProcessCurrentWorkingDirectory(): string | undefined {
    const processValue = getRuntimeProcess();
    if (typeof processValue !== "object" || processValue === null) {
        return undefined;
    }

    const cwd = getRuntimeProperty(processValue, "cwd");
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

function getRuntimeProperty(target: object, propertyKey: string): unknown {
    try {
        const record = target as RuntimePropertyCandidate;
        return record[propertyKey];
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
