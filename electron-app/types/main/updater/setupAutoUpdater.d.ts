import type { AutoUpdaterLike } from "./autoUpdaterAccess";
import type { MainWindowLike } from "../window/bootstrapMainWindow";

export function setupAutoUpdater(
    mainWindow?: MainWindowLike | null,
    providedAutoUpdater?: AutoUpdaterLike | null
): void;
