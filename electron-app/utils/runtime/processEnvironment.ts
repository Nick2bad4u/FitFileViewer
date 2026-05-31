/**
 * Reads process environment values through a defensive runtime boundary.
 *
 * Renderer contexts, tests, and browser-like sandboxes may not expose
 * `globalThis.process` or `process.env`. Direct `process.env?.FOO` access still
 * throws when `process` itself is missing, so renderer-safe code should use
 * this helper instead.
 */
export function getProcessEnvironmentValue(name: string): string | undefined {
    const processValue = getRuntimeProperty(globalThis, "process");
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

function getRuntimeProperty(target: object, propertyKey: string): unknown {
    try {
        return Reflect.get(target, propertyKey);
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
