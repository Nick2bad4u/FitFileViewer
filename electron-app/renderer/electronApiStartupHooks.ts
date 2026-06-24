import {
    getRendererElectronApi,
    type RendererElectronApiScope,
} from "../utils/runtime/electronApiRuntime.js";

export type RendererApplyTheme = (
    theme: string,
    withTransition?: boolean
) => void;

export interface ElectronApiStartupHooks {
    checkForUpdates: (() => unknown) | undefined;
    isDevelopment: (() => Promise<unknown>) | undefined;
    onMenuAction:
        | ((callback: (action: unknown) => void) => unknown)
        | undefined;
    onThemeChanged:
        | ((callback: (theme: string) => void) => unknown)
        | undefined;
    recentFiles: (() => Promise<unknown>) | undefined;
}

type ElectronApiStartupHookSource = {
    readonly checkForUpdates?: unknown;
    readonly isDevelopment?: unknown;
    readonly onMenuAction?: unknown;
    readonly onThemeChanged?: unknown;
    readonly recentFiles?: unknown;
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
                ? (apiValue.checkForUpdates as () => unknown)
                : undefined,
        isDevelopment:
            typeof apiValue.isDevelopment === "function"
                ? (apiValue.isDevelopment as () => Promise<unknown>)
                : undefined,
        onMenuAction:
            typeof apiValue.onMenuAction === "function"
                ? (apiValue.onMenuAction as (
                      callback: (action: unknown) => void
                  ) => unknown)
                : undefined,
        onThemeChanged:
            typeof apiValue.onThemeChanged === "function"
                ? (apiValue.onThemeChanged as (
                      callback: (theme: string) => void
                  ) => unknown)
                : undefined,
        recentFiles:
            typeof apiValue.recentFiles === "function"
                ? (apiValue.recentFiles as () => Promise<unknown>)
                : undefined,
    };
}

export function getElectronApiStartupHooks(
    scope?: ElectronApiStartupHooksScope
): ElectronApiStartupHooks | null {
    const electronApiScope = scope?.getElectronApiScope?.();
    const electronApi =
        electronApiScope === undefined
            ? getRendererElectronApi(isElectronApiStartupHookSource)
            : getRendererElectronApi(
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
