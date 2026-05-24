{
    type RendererIpcEventChannel =
        import("../../shared/ipc").RendererIpcEventChannel;

    const { logWithContext } = require("../logging/logWithContext") as {
        logWithContext: (
            level: string,
            message: string,
            context?: Record<string, unknown>
        ) => void;
    };

    interface MainWindowLike {
        isDestroyed?: () => boolean;
        webContents: {
            executeJavaScript?: (script: string) => Promise<unknown>;
            isDestroyed?: () => boolean;
            send?: (
                channel: RendererIpcEventChannel,
                ...args: readonly unknown[]
            ) => void;
        };
    }

    type CreateAppMenu = (
        mainWindow: MainWindowLike,
        theme: string,
        loadedFitFilePath?: null | string
    ) => void;

    const getErrorMessage = (error: unknown): string =>
        error instanceof Error ? error.message : String(error);

    const getNodeEnvironment = (): string | undefined =>
        globalThis.process?.env?.["NODE_ENV"];

    const isCreateAppMenu = (value: unknown): value is CreateAppMenu =>
        typeof value === "function";

    /**
     * Lazily creates the application menu. The helper is intentionally
     * defensive so unit tests that run without a real Electron runtime do not
     * crash when the menu builder is required.
     */
    function safeCreateAppMenu(
        mainWindow: MainWindowLike,
        theme: string,
        loadedFitFilePath?: null | string
    ): void {
        try {
            if (getNodeEnvironment() === "test") {
                return;
            }

            const mod = require("../../utils/app/menu/createAppMenu") as {
                createAppMenu?: unknown;
            };
            const createAppMenu = mod.createAppMenu;

            if (isCreateAppMenu(createAppMenu)) {
                createAppMenu(mainWindow, theme, loadedFitFilePath);
            }
        } catch (error) {
            logWithContext(
                "warn",
                "Skipping menu creation (unavailable in this environment)",
                {
                    error: getErrorMessage(error),
                }
            );
        }
    }

    module.exports = { safeCreateAppMenu };
}
