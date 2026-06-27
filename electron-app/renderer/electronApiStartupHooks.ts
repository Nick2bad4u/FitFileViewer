import {
    getRendererElectronApi,
    type RendererElectronApiScope,
} from "../utils/runtime/electronApiRuntime.js";
import type {
    ElectronFileApi,
    ElectronMenuEventApi,
} from "../shared/preloadApiDomains.js";

export type RendererApplyTheme = (
    theme: string,
    withTransition?: boolean
) => void;
export type RendererElectronMenuAction = "about" | "open-file";
export type RendererElectronHookUnsubscribe = () => void;
export type RendererElectronHookRegistrationResult =
    | RendererElectronHookUnsubscribe
    | void;
type RendererCheckForUpdates = ElectronMenuEventApi["checkForUpdates"];
type RendererDevelopmentModeProbe = () => Promise<boolean>;
type RendererMenuActionRegistration = (
    callback: (action: RendererElectronMenuAction) => void
) => RendererElectronHookRegistrationResult;
type RendererThemeChangeRegistration = (
    callback: (theme: string) => void
) => RendererElectronHookRegistrationResult;
type RendererRecentFilesLoader = ElectronFileApi["recentFiles"];

export interface ElectronApiStartupHooks {
    checkForUpdates: RendererCheckForUpdates | undefined;
    isDevelopment: RendererDevelopmentModeProbe | undefined;
    onMenuAction: RendererMenuActionRegistration | undefined;
    onThemeChanged: RendererThemeChangeRegistration | undefined;
    recentFiles: RendererRecentFilesLoader | undefined;
}

type ElectronApiStartupHookSource = {
    readonly checkForUpdates?: RendererCheckForUpdates | undefined;
    readonly isDevelopment?: RendererDevelopmentModeProbe | undefined;
    readonly onMenuAction?: RendererMenuActionRegistration | undefined;
    readonly onThemeChanged?: RendererThemeChangeRegistration | undefined;
    readonly recentFiles?: RendererRecentFilesLoader | undefined;
};

export interface ElectronApiStartupHooksScope {
    readonly getElectronApiScope?:
        | (() => RendererElectronApiScope | undefined)
        | undefined;
}

export function getElectronApiHooksFromValue(
    apiValue: unknown
): ElectronApiStartupHooks | null {
    if (!isElectronApiStartupHookRecord(apiValue)) {
        return null;
    }

    if (Object.keys(apiValue).length === 0) {
        return null;
    }

    return {
        checkForUpdates:
            typeof apiValue.checkForUpdates === "function"
                ? apiValue.checkForUpdates
                : undefined,
        isDevelopment:
            typeof apiValue.isDevelopment === "function"
                ? apiValue.isDevelopment
                : undefined,
        onMenuAction:
            typeof apiValue.onMenuAction === "function"
                ? apiValue.onMenuAction
                : undefined,
        onThemeChanged:
            typeof apiValue.onThemeChanged === "function"
                ? apiValue.onThemeChanged
                : undefined,
        recentFiles:
            typeof apiValue.recentFiles === "function"
                ? apiValue.recentFiles
                : undefined,
    };
}

export function getElectronApiStartupHooks(
    scope?: ElectronApiStartupHooksScope
): ElectronApiStartupHooks | null {
    const electronApiScope = scope?.getElectronApiScope?.();
    if (electronApiScope === undefined) {
        return null;
    }

    const electronApi = getRendererElectronApi(
        isElectronApiStartupHookSource,
        electronApiScope
    );

    return getElectronApiHooksFromValue(electronApi);
}

function isElectronApiStartupHookSource(
    value: unknown
): value is ElectronApiStartupHookSource {
    return getElectronApiHooksFromValue(value) !== null;
}

function isElectronApiStartupHookRecord(
    value: unknown
): value is ElectronApiStartupHookSource {
    return typeof value === "object" && value !== null;
}

export function probeDevelopmentMode(apiHooks: ElectronApiStartupHooks): void {
    if (apiHooks.isDevelopment === undefined) {
        return;
    }

    void (async () => {
        try {
            await apiHooks.isDevelopment?.();
        } catch {
            /* Ignore optional startup probe errors */
        }
    })();
}

export function registerStartupElectronHooks(
    apiHooks: ElectronApiStartupHooks,
    openFileBtn: HTMLElement | null,
    showAboutModal: ((html?: string) => void) | undefined,
    applyTheme: RendererApplyTheme | undefined
): void {
    try {
        apiHooks.onMenuAction?.((action) => {
            if (action === "open-file" && openFileBtn !== null) {
                openFileBtn.click();
            } else if (action === "about") {
                try {
                    showAboutModal?.();
                } catch {
                    /* Ignore errors */
                }
            }
        });

        apiHooks.onThemeChanged?.((theme) => {
            try {
                applyTheme?.(theme);
            } catch {
                /* Ignore errors */
            }
        });

        probeDevelopmentMode(apiHooks);
    } catch {
        /* Ignore errors */
    }
}
