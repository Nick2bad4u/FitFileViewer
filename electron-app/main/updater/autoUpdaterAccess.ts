interface AutoUpdaterLike {
    autoDownload?: boolean;
    checkForUpdatesAndNotify?: () => unknown;
    feedURL?: unknown;
    logger?: unknown;
    on?: (event: string, listener: (...args: unknown[]) => void) => unknown;
}

interface AutoUpdaterModuleLike {
    autoUpdater?: unknown;
    default?: unknown;
}

interface VitestImportMockLike {
    importMock?: (id: string) => Promise<unknown>;
}

let cachedMockedAutoUpdater: AutoUpdaterLike | null | undefined;

export async function resolveAutoUpdaterAsync(): Promise<AutoUpdaterLike | null> {
    const vitestMock = await tryResolveVitestMock();
    if (vitestMock) {
        return vitestMock;
    }

    try {
        return resolveAutoUpdaterFromModule(await import("electron-updater"));
    } catch {
        return null;
    }
}

async function tryResolveVitestMock(): Promise<AutoUpdaterLike | null> {
    if (cachedMockedAutoUpdater) {
        return cachedMockedAutoUpdater;
    }
    if (
        typeof process === "undefined" ||
        process.env["NODE_ENV"] !== "test"
    ) {
        return null;
    }

    try {
        const vitestGlobal = asObjectProperty(
            globalThis,
            "vi"
        ) as VitestImportMockLike | null;
        const { vi } = await import("vitest");
        const mockApi =
            vitestGlobal && typeof vitestGlobal.importMock === "function"
                ? vitestGlobal
                : vi;
        if (mockApi && typeof mockApi.importMock === "function") {
            const resolved = resolveAutoUpdaterFromModule(
                await mockApi.importMock("electron-updater")
            );
            if (resolved) {
                cachedMockedAutoUpdater ??= resolved;
                return resolved;
            }
        }
    } catch {
        /* Ignore: vitest is not available outside test runs. */
    }

    return null;
}

function asAutoUpdater(value: unknown): AutoUpdaterLike | null {
    if (!value || (typeof value !== "object" && typeof value !== "function")) {
        return null;
    }

    const candidate = value as AutoUpdaterLike;
    return typeof candidate.on === "function" ||
        typeof candidate.checkForUpdatesAndNotify === "function" ||
        "autoDownload" in value
        ? candidate
        : null;
}

function resolveAutoUpdaterFromModule(
    moduleValue: unknown
): AutoUpdaterLike | null {
    const mod = asModuleLike(moduleValue);
    const defaultExport = asModuleLike(asObjectProperty(mod, "default"));

    return (
        asAutoUpdater(asObjectProperty(mod, "autoUpdater")) ||
        asAutoUpdater(asObjectProperty(defaultExport, "autoUpdater")) ||
        asAutoUpdater(defaultExport) ||
        asAutoUpdater(moduleValue)
    );
}

function asModuleLike(value: unknown): AutoUpdaterModuleLike | null {
    return value && (typeof value === "object" || typeof value === "function")
        ? value
        : null;
}

/**
 * Safely reads module namespace properties. Vitest mock namespaces can throw
 * when probing missing exports, and electron-updater's lazy getters can throw
 * before Electron's app object exists.
 */
function asObjectProperty(value: unknown, property: string): unknown {
    if (!value || (typeof value !== "object" && typeof value !== "function")) {
        return undefined;
    }

    try {
        return Reflect.get(value, property);
    } catch {
        return undefined;
    }
}
