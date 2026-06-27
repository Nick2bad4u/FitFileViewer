import {
    type ElectronApiStartupHooks,
    type RendererElectronMenuAction,
} from "./electronApiStartupHooks.js";

interface RendererElectronApiRegistrationOptions {
    electronApiHooks: ElectronApiStartupHooks | null | undefined;
    onMenuAction: (action: RendererElectronMenuAction) => void;
    onThemeChanged: (theme: string) => void;
    scheduleStateInitialization: () => void;
}

export function installRendererElectronApiRegistration(
    options: RendererElectronApiRegistrationOptions
): void {
    try {
        if (
            options.electronApiHooks !== null &&
            options.electronApiHooks !== undefined
        ) {
            registerRendererElectronAPI(options.electronApiHooks, options);
        }
    } catch {
        /* Ignore errors */
    }
}

export function registerRendererElectronAPI(
    hooks: ElectronApiStartupHooks,
    options: RendererElectronApiRegistrationOptions
): void {
    try {
        if (hooks.onMenuAction !== undefined) {
            hooks.onMenuAction(options.onMenuAction);
        }
        if (hooks.onThemeChanged !== undefined) {
            hooks.onThemeChanged(options.onThemeChanged);
        }
        if (hooks.isDevelopment !== undefined) {
            void queryElectronDevelopmentMode(hooks.isDevelopment);
        }
        options.scheduleStateInitialization();
    } catch {
        /* Ignore errors */
    }
}

async function queryElectronDevelopmentMode(
    isDevelopment: () => Promise<boolean>
): Promise<void> {
    try {
        await isDevelopment();
    } catch {
        /* Ignore errors */
    }
}
