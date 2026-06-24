import { getElectronApiHooksFromValue } from "./electronApiStartupHooks.js";

interface RendererElectronApiRegistrationOptions {
    electronApiCandidate: unknown;
    onMenuAction: (action: unknown) => void;
    onThemeChanged: (theme: string) => void;
    scheduleStateInitialization: () => void;
}

export function installRendererElectronApiRegistration(
    options: RendererElectronApiRegistrationOptions
): void {
    try {
        if (options.electronApiCandidate !== undefined) {
            registerRendererElectronAPI(options.electronApiCandidate, options);
        }
    } catch {
        /* Ignore errors */
    }
}

export function registerRendererElectronAPI(
    api: unknown,
    options: RendererElectronApiRegistrationOptions
): void {
    try {
        const hooks = getElectronApiHooksFromValue(api);
        if (hooks === null) {
            return;
        }

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
    isDevelopment: () => Promise<unknown>
): Promise<void> {
    try {
        await isDevelopment();
    } catch {
        /* Ignore errors */
    }
}
