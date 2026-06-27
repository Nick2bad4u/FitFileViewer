import type { RendererApplyTheme as ApplyTheme } from "./electronApiStartupHooks.js";
import type { SetupListenersOptions } from "../utils/app/lifecycle/listeners.js";
import type { AppActions } from "../utils/app/lifecycle/appActions.js";
import type { RendererElectronApiScope } from "../utils/runtime/electronApiRuntime.js";
import type {
    AppOpeningFileSubscriber,
    AppStartTimeGetter,
    AppStartTimeSubscriber,
} from "../utils/state/domain/appDomainState.js";

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

export type RendererHandleOpenFile = (payload: unknown) => unknown;
export type RendererSetupListeners = (
    options: SetupListenersOptions
) => unknown;
export type RendererSetupTheme = (
    applyTheme: ApplyTheme | undefined,
    listenForThemeChange: ListenForThemeChange | undefined,
    options?: { electronApiScope?: RendererElectronApiScope | undefined }
) => unknown;
export type RendererAppInitializationActions = Pick<
    typeof AppActions,
    "setInitialized"
>;

type ResolvedRendererCoreModules = Readonly<{
    readonly AppActions: RendererAppInitializationActions | undefined;
    readonly applyTheme: ApplyTheme | undefined;
    readonly getAppStartTime: AppStartTimeGetter | undefined;
    readonly handleOpenFile: RendererHandleOpenFile | undefined;
    readonly listenForThemeChange: ListenForThemeChange | undefined;
    readonly masterStateManager: unknown;
    readonly setupListeners: RendererSetupListeners | undefined;
    readonly setupTheme: RendererSetupTheme | undefined;
    readonly showAboutModal: ((html?: string) => void) | undefined;
    readonly showNotification: ShowNotification | undefined;
    readonly showUpdateNotification: ShowUpdateNotification | undefined;
    readonly subscribeToAppOpeningFile: AppOpeningFileSubscriber | undefined;
    readonly subscribeToAppStartTime: AppStartTimeSubscriber | undefined;
    readonly uiStateManager: unknown;
}>;

let rendererCoreModuleTestOverrides: Map<string, unknown> | null = null;

/**
 * Dynamically resolves core modules so Vitest doMock hooks (using ../../ paths)
 * are respected.
 *
 * @returns Resolved module functions/objects
 */
export async function ensureCoreModules(): Promise<ResolvedRendererCoreModules> {
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
        getAppStartTime: toAppStartTimeGetter(
            resolveDefaultableExport(appDomainMod, "getAppStartTime")
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
        subscribeToAppOpeningFile: toAppOpeningFileSubscriber(
            resolveDefaultableExport(appDomainMod, "subscribeToAppOpeningFile")
        ),
        subscribeToAppStartTime: toAppStartTimeSubscriber(
            resolveDefaultableExport(appDomainMod, "subscribeToAppStartTime")
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
): RendererAppInitializationActions | undefined {
    const namedActions = appActionsMod["AppActions"];
    const namedInitializationActions =
        toRendererAppInitializationActions(namedActions);
    if (namedInitializationActions !== undefined) {
        return namedInitializationActions;
    }

    const defaultRecord = toModuleRecord(appActionsMod["default"]);
    const defaultActions = defaultRecord["AppActions"];
    const defaultInitializationActions =
        toRendererAppInitializationActions(defaultActions);
    if (defaultInitializationActions !== undefined) {
        return defaultInitializationActions;
    }

    const moduleInitializationActions =
        toRendererAppInitializationActions(appActionsMod);
    if (moduleInitializationActions !== undefined) {
        return moduleInitializationActions;
    }

    return toRendererAppInitializationActions(defaultRecord);
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

function toAppOpeningFileSubscriber(
    value: unknown
): AppOpeningFileSubscriber | undefined {
    return typeof value === "function"
        ? (value as AppOpeningFileSubscriber)
        : undefined;
}

function toAppStartTimeGetter(value: unknown): AppStartTimeGetter | undefined {
    return typeof value === "function"
        ? (value as AppStartTimeGetter)
        : undefined;
}

function toAppStartTimeSubscriber(
    value: unknown
): AppStartTimeSubscriber | undefined {
    return typeof value === "function"
        ? (value as AppStartTimeSubscriber)
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

function toRendererAppInitializationActions(
    value: unknown
): RendererAppInitializationActions | undefined {
    if (!isRecord(value)) {
        return undefined;
    }

    return typeof value["setInitialized"] === "function"
        ? (value as RendererAppInitializationActions)
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
