let legacyLeafletPluginRuntime: unknown;

export function setLegacyLeafletPluginRuntime(runtime: unknown): void {
    legacyLeafletPluginRuntime = runtime;
}

export function getLegacyLeafletPluginRuntime(): unknown {
    return legacyLeafletPluginRuntime;
}

export function clearLegacyLeafletPluginRuntimeForTests(): void {
    legacyLeafletPluginRuntime = undefined;
}
