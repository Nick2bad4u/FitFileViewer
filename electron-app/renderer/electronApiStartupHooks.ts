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

export interface ElectronApiStartupHooksScope extends RendererElectronApiScope {
    readonly getElectronApiScope?:
        | (() => RendererElectronApiScope | undefined)
        | undefined;
}

function toModuleRecord(value: unknown): Record<string, unknown> {
    return typeof value === "object" && value !== null
        ? (value as Record<string, unknown>)
        : {};
}

export function getElectronApiHooksFromValue(
    apiValue: unknown
): ElectronApiStartupHooks | null {
    const api = toModuleRecord(apiValue);
    if (Object.keys(api).length === 0) {
        return null;
    }

    const isDevelopment = api["isDevelopment"];
    const onMenuAction = api["onMenuAction"];
    const onThemeChanged = api["onThemeChanged"];
    const recentFiles = api["recentFiles"];
    const checkForUpdates = api["checkForUpdates"];

    return {
        checkForUpdates:
            typeof checkForUpdates === "function"
                ? (checkForUpdates as () => unknown)
                : undefined,
        isDevelopment:
            typeof isDevelopment === "function"
                ? (isDevelopment as () => Promise<unknown>)
                : undefined,
        onMenuAction:
            typeof onMenuAction === "function"
                ? (onMenuAction as (
                      callback: (action: unknown) => void
                  ) => unknown)
                : undefined,
        onThemeChanged:
            typeof onThemeChanged === "function"
                ? (onThemeChanged as (
                      callback: (theme: string) => void
                  ) => unknown)
                : undefined,
        recentFiles:
            typeof recentFiles === "function"
                ? (recentFiles as () => Promise<unknown>)
                : undefined,
    };
}

export function getElectronApiStartupHooks(
    scope?: ElectronApiStartupHooksScope
): ElectronApiStartupHooks | null {
    const electronApiScope = scope?.getElectronApiScope?.() ?? scope;
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
): value is Record<string, unknown> {
    return getElectronApiHooksFromValue(value) !== null;
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
