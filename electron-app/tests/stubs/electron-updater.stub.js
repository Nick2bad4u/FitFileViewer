import { vi } from "vitest";

// Lightweight stub for electron-updater to avoid accessing real Electron app version at require time
// Matches the named export "autoUpdater" used by main.js
const autoUpdater = {
    logger: { info: vi.fn(), error: vi.fn(), warn: vi.fn(), transports: { file: { level: "info" } } },
    on: vi.fn(),
    checkForUpdatesAndNotify: vi.fn().mockResolvedValue(undefined),
};

export { autoUpdater };
