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

export function getRuntimeProcess(): unknown {
    return getRuntimeProperty(globalThis, "process");
}

export function setRuntimeProcess(processValue: unknown): void {
    setRuntimeProperty(globalThis, "process", processValue);
}

function getRuntimeProperty(target: object, propertyKey: string): unknown {
    try {
        return Reflect.get(target, propertyKey);
    } catch {
        return undefined;
    }
}

function setRuntimeProperty(
    target: object,
    propertyKey: string,
    value: unknown
): void {
    try {
        if (Reflect.set(target, propertyKey, value)) {
            const currentValue = Reflect.get(target, propertyKey);
            if (Object.is(currentValue, value)) {
                return;
            }
        }
        Object.defineProperty(target, propertyKey, {
            configurable: true,
            value,
            writable: true,
        });
    } catch {
        // Browser-like sandboxes may expose read-only runtime globals.
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
