import type { RendererApplyTheme as ApplyTheme } from "./electronApiStartupHooks.js";

export type ListenForThemeChange = (
    onThemeChange: (theme: string) => void
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

export type UnknownRendererFunction = (...args: unknown[]) => unknown;

export interface RendererCoreModules {
    [exportName: string]: unknown;
    AppActions: Record<string, unknown> | undefined;
    applyTheme: ApplyTheme | undefined;
    getAppDomainState: undefined | UnknownRendererFunction;
    handleOpenFile: undefined | UnknownRendererFunction;
    listenForThemeChange: ListenForThemeChange | undefined;
    masterStateManager: unknown;
    setupListeners: undefined | UnknownRendererFunction;
    setupTheme: undefined | UnknownRendererFunction;
    showAboutModal: ((html?: string) => void) | undefined;
    showNotification: ShowNotification | undefined;
    showUpdateNotification: ShowUpdateNotification | undefined;
    subscribeAppDomain: undefined | UnknownRendererFunction;
    uiStateManager: unknown;
}

export function callUnknownFunction(
    candidate: unknown,
    args: unknown[] = []
): unknown {
    if (typeof candidate !== "function") {
        return undefined;
    }

    const callable = /** @type {(...args: unknown[]) => unknown} */ candidate;
    return callable(...args);
}

/**
 * Dynamically resolves core modules so Vitest doMock hooks (using ../../ paths)
 * are respected.
 *
 * @returns Resolved module functions/objects
 */
export async function ensureCoreModules(): Promise<RendererCoreModules> {
    const notifMod = await resolveCoreModule(
        "../../utils/ui/notifications/showNotification.js",
        "../utils/ui/notifications/showNotification.js"
    );
    const openFileMod = await resolveCoreModule(
        "../../utils/files/import/handleOpenFile.js",
        "../utils/files/import/handleOpenFile.js"
    );
    const setupThemeMod = await resolveCoreModule(
        "../../utils/theming/core/setupTheme.js",
        "../utils/theming/core/setupTheme.js"
    );
    const updateNotifMod = await resolveCoreModule(
        "../../utils/ui/notifications/showUpdateNotification.js",
        "../utils/ui/notifications/showUpdateNotification.js"
    );
    const listenersMod = await resolveCoreModule(
        "../../utils/app/lifecycle/listeners.js",
        "../utils/app/lifecycle/listeners.js"
    );
    const aboutMod = await resolveCoreModule(
        "../../utils/ui/modals/aboutModal.js",
        "../utils/ui/modals/aboutModal.js"
    );
    const themeMod = await resolveCoreModule(
        "../../utils/theming/core/theme.js",
        "../utils/theming/core/theme.js"
    );
    const msmMod = await resolveCoreModule(
        "../../utils/state/core/masterStateManager.js",
        "../utils/state/core/masterStateManager.js"
    );
    const appActionsMod = await resolveCoreModule(
        "../../utils/app/lifecycle/appActions.js",
        "../utils/app/lifecycle/appActions.js"
    );
    const appDomainMod = await resolveCoreModule(
        "../../utils/state/domain/appState.js",
        "../utils/state/domain/appState.js"
    );
    const uiStateMod = await resolveCoreModule(
        "../../utils/state/domain/uiStateManager.js",
        "../utils/state/domain/uiStateManager.js"
    );

    return {
        // Be robust to different mock shapes: named export, default.AppActions, default object, or module as object
        AppActions: resolveAppActionsModule(appActionsMod),
        applyTheme: toApplyTheme(themeMod["applyTheme"]),
        getAppDomainState: toUnknownRendererFunction(
            resolveDefaultableExport(appDomainMod, "getState")
        ),
        handleOpenFile: toUnknownRendererFunction(
            openFileMod["handleOpenFile"]
        ),
        listenForThemeChange: toListenForThemeChange(
            themeMod["listenForThemeChange"]
        ),
        masterStateManager:
            resolveDefaultableExport(msmMod, "masterStateManager") ?? msmMod,
        setupListeners: toUnknownRendererFunction(
            listenersMod["setupListeners"]
        ),
        setupTheme: toUnknownRendererFunction(setupThemeMod["setupTheme"]),
        showAboutModal: toShowAboutModal(aboutMod["showAboutModal"]),
        showNotification: toShowNotification(notifMod["showNotification"]),
        showUpdateNotification: toShowUpdateNotification(
            updateNotifMod["showUpdateNotification"]
        ),
        subscribeAppDomain: toUnknownRendererFunction(
            resolveDefaultableExport(appDomainMod, "subscribe")
        ),
        uiStateManager:
            resolveDefaultableExport(uiStateMod, "uiStateManager") ??
            uiStateMod,
    };
}

/**
 * Prefer an exact match in Vitest manual mock registry by test ID.
 *
 * @param testId - Exact id used in vi.doMock, such as `../../utils/...`.
 *
 * @returns Mocked module or null.
 */
export function resolveExactManualMock(testId: string): null | unknown {
    try {
        const registry = getVitestManualMockRegistry();
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
 * Try to resolve a Vitest manual mock by matching the end of the module path.
 * This lets us honor vi.doMock specifiers used in tests even when the renderer
 * imports from a different relative path.
 *
 * @param pathSuffix - Suffix such as `/utils/theming/core/setupTheme.js`.
 *
 * @returns Mocked module or null.
 */
export function resolveManualMock(pathSuffix: string): null | unknown {
    try {
        const registry = getVitestManualMockRegistry();
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

export function toModuleRecord(value: unknown): Record<string, unknown> {
    return isRecord(value) ? value : {};
}

function getVitestManualMockRegistry(): Map<string, unknown> | null {
    const registry = /** @type {unknown} */ Reflect.get(
        globalThis,
        "__vitest_manual_mocks__"
    );

    return registry instanceof Map ? registry : null;
}

async function importRendererModule(realPath: string): Promise<unknown> {
    switch (realPath) {
        case "../utils/app/lifecycle/appActions.js": {
            return /** @type {Promise<unknown>} */ import("../utils/app/lifecycle/appActions.js");
        }
        case "../utils/app/lifecycle/listeners.js": {
            return /** @type {Promise<unknown>} */ import("../utils/app/lifecycle/listeners.js");
        }
        case "../utils/files/import/handleOpenFile.js": {
            return /** @type {Promise<unknown>} */ import("../utils/files/import/handleOpenFile.js");
        }
        case "../utils/state/core/masterStateManager.js": {
            return /** @type {Promise<unknown>} */ import("../utils/state/core/masterStateManager.js");
        }
        case "../utils/state/domain/appState.js": {
            return /** @type {Promise<unknown>} */ import("../utils/state/domain/appState.js");
        }
        case "../utils/state/domain/uiStateManager.js": {
            return /** @type {Promise<unknown>} */ import("../utils/state/domain/uiStateManager.js");
        }
        case "../utils/theming/core/setupTheme.js": {
            return /** @type {Promise<unknown>} */ import("../utils/theming/core/setupTheme.js");
        }
        case "../utils/theming/core/theme.js": {
            return /** @type {Promise<unknown>} */ import("../utils/theming/core/theme.js");
        }
        case "../utils/ui/modals/aboutModal.js": {
            return /** @type {Promise<unknown>} */ import("../utils/ui/modals/aboutModal.js");
        }
        case "../utils/ui/notifications/showNotification.js": {
            return /** @type {Promise<unknown>} */ import("../utils/ui/notifications/showNotification.js");
        }
        case "../utils/ui/notifications/showUpdateNotification.js": {
            return /** @type {Promise<unknown>} */ import("../utils/ui/notifications/showUpdateNotification.js");
        }
        default: {
            throw new Error(`Unsupported renderer module import: ${realPath}`);
        }
    }
}

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null;
}

function resolveAppActionsModule(
    appActionsMod: Record<string, unknown>
): Record<string, unknown> | undefined {
    const namedActions = appActionsMod["AppActions"];
    if (isRecord(namedActions)) {
        return namedActions;
    }

    const defaultRecord = toModuleRecord(appActionsMod["default"]);
    const defaultActions = defaultRecord["AppActions"];
    if (isRecord(defaultActions)) {
        return defaultActions;
    }

    if (typeof appActionsMod["setInitialized"] === "function") {
        return appActionsMod;
    }

    return typeof defaultRecord["setInitialized"] === "function"
        ? defaultRecord
        : undefined;
}

async function resolveCoreModule(
    testPath: string,
    realPath: string
): Promise<Record<string, unknown>> {
    const resolved =
        resolveExactManualMock(testPath) ??
        resolveManualMock(toManualMockPathSuffix(realPath)) ??
        (await importRendererModule(realPath));

    return toModuleRecord(resolved);
}

function resolveDefaultableExport(
    moduleRecord: Record<string, unknown>,
    exportName: string
): unknown {
    const namedExport = moduleRecord[exportName];
    if (namedExport !== undefined) {
        return namedExport;
    }

    return toModuleRecord(moduleRecord["default"])[exportName];
}

function toApplyTheme(value: unknown): ApplyTheme | undefined {
    return typeof value === "function" ? (value as ApplyTheme) : undefined;
}

function toListenForThemeChange(
    value: unknown
): ListenForThemeChange | undefined {
    return typeof value === "function"
        ? (value as ListenForThemeChange)
        : undefined;
}

function toManualMockPathSuffix(realPath: string): string {
    return realPath.replace(/^(?:\.\.\/|\.\/)+/u, "/");
}

function toShowAboutModal(
    value: unknown
): ((html?: string) => void) | undefined {
    return typeof value === "function"
        ? (value as (html?: string) => void)
        : undefined;
}

function toShowNotification(value: unknown): ShowNotification | undefined {
    return typeof value === "function"
        ? (value as ShowNotification)
        : undefined;
}

function toShowUpdateNotification(
    value: unknown
): ShowUpdateNotification | undefined {
    return typeof value === "function"
        ? (value as ShowUpdateNotification)
        : undefined;
}

function toUnknownRendererFunction(
    value: unknown
): undefined | UnknownRendererFunction {
    return typeof value === "function"
        ? (value as UnknownRendererFunction)
        : undefined;
}
