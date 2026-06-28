import type { RendererElectronApiScope } from "../utils/runtime/electronApiRuntime.js";

export type ListenForThemeChange = (
    onThemeChange: (theme: string) => void,
    options?: { electronApiScope?: RendererElectronApiScope | undefined }
) => void;

export type ShowNotification = (
    message: string,
    type?: string,
    timeout?: number
) => unknown;

export type ShowUpdateNotification = (
    message: string,
    type?: string,
    duration?: number,
    withAction?: boolean | string
) => void;

let rendererCoreModuleTestOverrides: Map<string, unknown> | null = null;

/**
 * Prefer an exact match in the module-local test override registry by test ID.
 *
 * @param testId - Exact id used by the focused renderer startup tests, such as
 *   `../../utils/...`.
 *
 * @returns Override module or null.
 */
export function resolveExactRendererCoreTestOverride(
    testId: string
): null | unknown {
    try {
        const registry = getRendererCoreModuleTestOverrides();
        if (registry?.has(testId) === true) {
            const module = registry.get(testId);
            const moduleRecord = toModuleRecord(module);
            return "default" in moduleRecord ? moduleRecord["default"] : module;
        }
    } catch {
        /* Ignore errors */
    }
    return null;
}

/**
 * Try to resolve a test module override by matching the end of the module path.
 * This lets focused renderer startup tests supply modules by their historic
 * relative specifiers while production code imports from typed local paths.
 *
 * @param pathSuffix - Suffix such as `/utils/theming/core/setupTheme.js`.
 *
 * @returns Override module or null.
 */
export function resolveRendererCoreTestOverride(
    pathSuffix: string
): null | unknown {
    try {
        const registry = getRendererCoreModuleTestOverrides();
        if (registry !== null) {
            for (const [id, module] of registry.entries()) {
                if (id.endsWith(pathSuffix)) {
                    const moduleRecord = toModuleRecord(module);
                    return "default" in moduleRecord
                        ? moduleRecord["default"]
                        : module;
                }
            }
        }
    } catch {
        /* Ignore errors */
    }
    return null;
}

function toModuleRecord(value: unknown): Record<string, unknown> {
    return isRecord(value) ? value : {};
}

export function resetRendererCoreModuleTestOverrides(): void {
    rendererCoreModuleTestOverrides = null;
}

export function setRendererCoreModuleTestOverrides(
    overrides: ReadonlyMap<string, unknown>
): void {
    rendererCoreModuleTestOverrides = new Map(overrides);
}

function getRendererCoreModuleTestOverrides(): Map<string, unknown> | null {
    return rendererCoreModuleTestOverrides;
}

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null;
}
