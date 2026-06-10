interface LeafletRuntimeRegistry {
    runtime?: unknown;
}

const leafletRuntimeRegistryKey = Symbol.for("fitfileviewer.leafletRuntime");

export function setLeafletRuntime(runtime: unknown): void {
    getLeafletRuntimeRegistry().runtime = runtime;
}

export function clearLeafletRuntimeForTests(): void {
    getLeafletRuntimeRegistry().runtime = undefined;
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
    timeoutMs = 15_000
): Promise<T | null> {
    const existingRuntime = resolveLeafletRuntime(isRuntime);
    if (existingRuntime) {
        return existingRuntime;
    }

    const startedAt = Date.now();
    while (Date.now() - startedAt < timeoutMs) {
        await new Promise<void>((resolve) => {
            const timeout = setTimeout(() => {
                clearTimeout(timeout);
                resolve();
            }, 20);
        });
        const runtime = resolveLeafletRuntime(isRuntime);
        if (runtime) {
            return runtime;
        }
    }

    return null;
}

function getLeafletRuntimeCandidates(): unknown[] {
    const registry = getLeafletRuntimeRegistry();
    return [registry.runtime];
}

function getLeafletRuntimeRegistry(): LeafletRuntimeRegistry {
    const leafletGlobal = globalThis as typeof globalThis &
        Record<symbol, LeafletRuntimeRegistry | undefined>;
    leafletGlobal[leafletRuntimeRegistryKey] ??= {};
    return leafletGlobal[leafletRuntimeRegistryKey];
}
