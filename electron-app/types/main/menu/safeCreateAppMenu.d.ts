import type { MainWindowLike } from "../window/bootstrapMainWindow";

/**
 * Lazily creates the application menu. The helper is intentionally defensive so
 * unit tests that run without a real Electron runtime do not crash when the
 * menu builder is required.
 */
export function safeCreateAppMenu(
    mainWindow: MainWindowLike,
    theme: string,
    loadedFitFilePath: string | undefined | null
): void;
