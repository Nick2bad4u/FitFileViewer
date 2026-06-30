import type {
    RendererApplyTheme,
    RendererElectronMenuAction,
} from "./electronApiStartupHooks.js";
import type { ShowAboutModal } from "./startupCallbackTypes.js";

type RendererElectronMenuLogLevel = "warn";

type RendererElectronMenuLogger = (
    level: RendererElectronMenuLogLevel,
    ...args: unknown[]
) => void;

type RendererElectronMenuActionHandlersOptions = {
    readonly applyTheme: RendererApplyTheme;
    readonly getFileInput: () => HTMLInputElement | null;
    readonly logRenderer: RendererElectronMenuLogger;
    readonly showAboutModal: ShowAboutModal;
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
        options.applyTheme(theme);
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
        options.showAboutModal();
    } catch (error) {
        options.logRenderer(
            "warn",
            "[Renderer] Failed to show about modal:",
            error
        );
    }
}
