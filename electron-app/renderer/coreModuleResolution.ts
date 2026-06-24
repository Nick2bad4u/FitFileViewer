import type { RendererApplyTheme as ApplyTheme } from "./electronApiStartupHooks.js";
import type { SetupListenersOptions } from "../utils/app/lifecycle/listeners.js";
import type {
    AppDomainStateGetter,
    AppDomainStatePathSubscriber,
    AppDomainStateSubscriber,
} from "../utils/state/domain/appDomainState.js";

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

export type RendererHandleOpenFile = (payload: unknown) => unknown;
export type RendererSetupListeners = (
    options: SetupListenersOptions
) => unknown;
export type RendererSetupTheme = (
    applyTheme: ApplyTheme | undefined,
    listenForThemeChange: ListenForThemeChange | undefined
) => unknown;

export interface RendererCoreModules {
    AppActions: Record<string, unknown> | undefined;
    applyTheme: ApplyTheme | undefined;
    getAppDomainState: AppDomainStateGetter | undefined;
    handleOpenFile: RendererHandleOpenFile | undefined;
    listenForThemeChange: ListenForThemeChange | undefined;
    masterStateManager: unknown;
    setupListeners: RendererSetupListeners | undefined;
    setupTheme: RendererSetupTheme | undefined;
    showAboutModal: ((html?: string) => void) | undefined;
    showNotification: ShowNotification | undefined;
    showUpdateNotification: ShowUpdateNotification | undefined;
    subscribeAppDomain: AppDomainStateSubscriber | undefined;
    subscribeAppDomainPath: AppDomainStatePathSubscriber | undefined;
    uiStateManager: unknown;
}

let rendererCoreModuleTestOverrides: Map<string, unknown> | null = null;

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
        "../../utils/state/domain/appDomainState.js",
        "../utils/state/domain/appDomainState.js"
    );
    const uiStateMod = await resolveCoreModule(
        "../../utils/state/domain/uiStateManager.js",
        "../utils/state/domain/uiStateManager.js"
    );

    return {
        // Be robust to different mock shapes: named export, default.AppActions, default object, or module as object
        AppActions: resolveAppActionsModule(appActionsMod),
        applyTheme: toApplyTheme(themeMod["applyTheme"]),
        getAppDomainState: toAppDomainStateGetter(
            resolveDefaultableExport(appDomainMod, "getAppDomainState")
        ),
        handleOpenFile: toRendererHandleOpenFile(openFileMod["handleOpenFile"]),
        listenForThemeChange: toListenForThemeChange(
            themeMod["listenForThemeChange"]
        ),
        masterStateManager:
            resolveDefaultableExport(msmMod, "masterStateManager") ?? msmMod,
        setupListeners: toRendererSetupListeners(
            listenersMod["setupListeners"]
        ),
        setupTheme: toRendererSetupTheme(setupThemeMod["setupTheme"]),
        showAboutModal: toShowAboutModal(aboutMod["showAboutModal"]),
        showNotification: toShowNotification(notifMod["showNotification"]),
        showUpdateNotification: toShowUpdateNotification(
            updateNotifMod["showUpdateNotification"]
        ),
        subscribeAppDomain: toAppDomainStateSubscriber(
            resolveDefaultableExport(appDomainMod, "subscribeAppDomain")
        ),
        subscribeAppDomainPath: toAppDomainStatePathSubscriber(
            resolveDefaultableExport(appDomainMod, "subscribeAppDomainPath")
        ),
        uiStateManager:
            resolveDefaultableExport(uiStateMod, "uiStateManager") ??
            uiStateMod,
    };
}

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
        case "../utils/state/domain/appDomainState.js": {
            return /** @type {Promise<unknown>} */ import("../utils/state/domain/appDomainState.js");
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
        resolveExactRendererCoreTestOverride(testPath) ??
        resolveRendererCoreTestOverride(toTestOverridePathSuffix(realPath)) ??
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

function toAppDomainStateGetter(
    value: unknown
): AppDomainStateGetter | undefined {
    return typeof value === "function"
        ? (value as AppDomainStateGetter)
        : undefined;
}

function toAppDomainStatePathSubscriber(
    value: unknown
): AppDomainStatePathSubscriber | undefined {
    return typeof value === "function"
        ? (value as AppDomainStatePathSubscriber)
        : undefined;
}

function toAppDomainStateSubscriber(
    value: unknown
): AppDomainStateSubscriber | undefined {
    return typeof value === "function"
        ? (value as AppDomainStateSubscriber)
        : undefined;
}

function toListenForThemeChange(
    value: unknown
): ListenForThemeChange | undefined {
    return typeof value === "function"
        ? (value as ListenForThemeChange)
        : undefined;
}

function toRendererHandleOpenFile(
    value: unknown
): RendererHandleOpenFile | undefined {
    return typeof value === "function"
        ? (value as RendererHandleOpenFile)
        : undefined;
}

function toRendererSetupListeners(
    value: unknown
): RendererSetupListeners | undefined {
    return typeof value === "function"
        ? (value as RendererSetupListeners)
        : undefined;
}

function toRendererSetupTheme(value: unknown): RendererSetupTheme | undefined {
    return typeof value === "function"
        ? (value as RendererSetupTheme)
        : undefined;
}

function toTestOverridePathSuffix(realPath: string): string {
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
