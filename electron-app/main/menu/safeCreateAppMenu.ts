import { logWithContext } from "../logging/logWithContext.js";
import { createAppMenu } from "../../utils/app/menu/createAppMenu.js";

type RendererIpcEventChannel =
    import("../../shared/ipc").RendererIpcEventChannel;

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

const getErrorMessage = (error: unknown): string =>
    error instanceof Error ? error.message : String(error);

const getNodeEnvironment = (): string | undefined =>
    globalThis.process?.env?.["NODE_ENV"];

/**
 * Lazily creates the application menu. The helper is intentionally defensive so
 * unit tests that run without a real Electron runtime do not crash when the
 * menu builder is required.
 */
export function safeCreateAppMenu(
    mainWindow: MainWindowLike,
    theme: string,
    loadedFitFilePath?: null | string
): void {
    try {
        if (getNodeEnvironment() === "test") {
            return;
        }

        createAppMenu(mainWindow, theme, loadedFitFilePath);
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

export default { safeCreateAppMenu };
