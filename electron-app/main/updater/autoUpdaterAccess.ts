import { isTestEnvironment } from "../../utils/runtime/processEnvironment.js";
import {
    getAutoUpdaterAccessRuntime,
    type AutoUpdaterAccessRuntime,
} from "./autoUpdaterAccessRuntime.js";

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

type UpdaterModulePropertyCandidate = {
    readonly [property: string]: unknown;
};

let cachedMockedAutoUpdater: AutoUpdaterLike | null | undefined;

export async function resolveAutoUpdaterAsync(
    runtime: AutoUpdaterAccessRuntime = getAutoUpdaterAccessRuntime()
): Promise<AutoUpdaterLike | null> {
    const vitestMock = await tryResolveVitestMock(runtime);
    if (vitestMock) {
        return vitestMock;
    }

    try {
        return resolveAutoUpdaterFromModule(await import("electron-updater"));
    } catch {
        return null;
    }
}

async function tryResolveVitestMock(
    runtime: AutoUpdaterAccessRuntime
): Promise<AutoUpdaterLike | null> {
    if (cachedMockedAutoUpdater) {
        return cachedMockedAutoUpdater;
    }
    if (!isTestEnvironment()) {
        return null;
    }

    try {
        const vitestCandidate = asVitestImportMock(
            runtime.getVitestImportMockCandidate()
        );
        const { vi } = await import("vitest");
        const mockApi = vitestCandidate ?? asVitestImportMock(vi);
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

function asVitestImportMock(value: unknown): VitestImportMockLike | null {
    return value &&
        (typeof value === "object" || typeof value === "function") &&
        typeof asObjectProperty(value, "importMock") === "function"
        ? value
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
        const candidate = value as UpdaterModulePropertyCandidate;
        return candidate[property];
    } catch {
        return undefined;
    }
}
