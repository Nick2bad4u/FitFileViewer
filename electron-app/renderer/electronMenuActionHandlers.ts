import type {
    RendererApplyTheme,
    RendererElectronMenuAction,
} from "./electronApiStartupHooks.js";

type RendererElectronMenuLogLevel = "warn";

type RendererElectronMenuLogger = (
    level: RendererElectronMenuLogLevel,
    ...args: unknown[]
) => void;

export type RendererElectronMenuCoreModules = Readonly<{
    readonly applyTheme?: RendererApplyTheme | undefined;
    readonly showAboutModal?: ((html?: string) => void) | undefined;
}>;

type RendererElectronMenuActionHandlersOptions = {
    readonly ensureCoreModules: () => Promise<RendererElectronMenuCoreModules>;
    readonly getFileInput: () => HTMLInputElement | null;
    readonly logRenderer: RendererElectronMenuLogger;
};

type RendererElectronMenuActionHandlers = {
    readonly onMenuAction: (action: RendererElectronMenuAction) => void;
    readonly onThemeChanged: (theme: string) => void;
};

/** Creates Electron menu callbacks for renderer runtime registration. */
export function createRendererElectronMenuActionHandlers(
    options: RendererElectronMenuActionHandlersOptions
): RendererElectronMenuActionHandlers {
    return {
        onMenuAction: (action) => {
            handleElectronMenuAction(action, options);
        },
        onThemeChanged: (theme) => {
            void applyElectronThemeChange(theme, options);
        },
    };
}

async function applyElectronThemeChange(
    theme: string,
    options: RendererElectronMenuActionHandlersOptions
): Promise<void> {
    try {
        const { applyTheme } = await options.ensureCoreModules();
        applyTheme?.(theme);
    } catch (error) {
        options.logRenderer("warn", "[Renderer] Failed to apply theme:", error);
    }
}

function handleElectronMenuAction(
    action: RendererElectronMenuAction,
    options: RendererElectronMenuActionHandlersOptions
): void {
    try {
        if (action === "open-file") {
            options.getFileInput()?.click();
        } else if (action === "about") {
            void showElectronAboutModal(options);
        }
    } catch {
        /* Ignore errors */
    }
}

async function showElectronAboutModal(
    options: RendererElectronMenuActionHandlersOptions
): Promise<void> {
    try {
        const { showAboutModal } = await options.ensureCoreModules();
        showAboutModal?.();
    } catch (error) {
        options.logRenderer(
            "warn",
            "[Renderer] Failed to show about modal:",
            error
        );
    }
}
