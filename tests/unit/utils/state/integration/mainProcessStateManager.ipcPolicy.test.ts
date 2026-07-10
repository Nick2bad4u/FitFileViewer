import path from "node:path";
import { pathToFileURL } from "node:url";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

type IpcHandler = (event: unknown, ...args: unknown[]) => unknown;

interface IpcMainMock {
    handle: ReturnType<
        typeof vi.fn<(channel: string, handler: IpcHandler) => void>
    >;
    removeHandler: ReturnType<typeof vi.fn<(channel: string) => void>>;
}

interface IpcRegistryModule {
    resetIpcRegistries: () => void;
}

interface MainProcessStateModule {
    MainProcessState: new () => unknown;
}

const APP_ROOT = process.cwd();
const APP_INDEX_URL = pathToFileURL(
    path.join(APP_ROOT, "static", "app", "index.html")
).toString();
const OUTSIDE_FILE_URL = pathToFileURL(
    path.join(path.dirname(APP_ROOT), "outside", "index.html")
).toString();

function createAllowedIpcEvent(): unknown {
    return {
        sender: {
            getURL: () => APP_INDEX_URL,
            isDestroyed: () => false,
            send: vi.fn(),
        },
        senderFrame: { url: APP_INDEX_URL },
    };
}

function createHttpsIpcEvent(): unknown {
    return {
        sender: {
            getURL: () => "https://example.com/",
            isDestroyed: () => false,
            send: vi.fn(),
        },
        senderFrame: { url: "https://example.com/" },
    };
}

function createIpcMainMock(): IpcMainMock {
    return {
        handle: vi.fn<(channel: string, handler: IpcHandler) => void>(),
        removeHandler: vi.fn<(channel: string) => void>(),
    };
}

function createMissingUrlIpcEvent(): unknown {
    return {
        sender: {
            isDestroyed: () => false,
            send: vi.fn(),
        },
    };
}

function createOutsideFileIpcEvent(): unknown {
    return {
        sender: {
            getURL: () => OUTSIDE_FILE_URL,
            isDestroyed: () => false,
            send: vi.fn(),
        },
        senderFrame: { url: OUTSIDE_FILE_URL },
    };
}

function getRegisteredIpcHandler(
    ipcMain: IpcMainMock,
    channel: string
): IpcHandler {
    const handler = ipcMain.handle.mock.calls.find(
        ([registeredChannel]) => registeredChannel === channel
    )?.[1];

    if (typeof handler !== "function") {
        throw new TypeError(`Expected ${channel} handler to be registered`);
    }

    return handler;
}

async function loadStateManager(
    ipcMain: IpcMainMock
): Promise<MainProcessStateModule> {
    const electronOverride = {
        app: {
            getAppPath: () => APP_ROOT,
        },
        BrowserWindow: {
            getAllWindows: () => [],
        },
        ipcMain,
    };

    const { setElectronOverride } =
        await import("../../../../../electron-app/main/runtime/electronAccess.js");
    setElectronOverride(electronOverride);

    return (await import("../../../../../electron-app/utils/state/integration/mainProcessStateManager.js")) as unknown as MainProcessStateModule;
}

async function resetIpcRegistry(): Promise<void> {
    try {
        const registry =
            (await import("../../../../../electron-app/main/ipc/ipcRegistry.js")) as unknown as IpcRegistryModule;
        registry.resetIpcRegistries();
    } catch {
        /* Ignore cleanup failures */
    }
}

describe("mainProcessStateManager IPC sender policy", () => {
    beforeEach(async () => {
        vi.resetModules();
        vi.stubEnv("NODE_ENV", "production");
        await resetIpcRegistry();
    });

    afterEach(async () => {
        await resetIpcRegistry();
        const { setElectronOverride } =
            await import("../../../../../electron-app/main/runtime/electronAccess.js");
        setElectronOverride(null);
        vi.unstubAllEnvs();
        vi.restoreAllMocks();
    });

    it("wraps every main-state IPC handler with app-file sender validation", async () => {
        const ipcMain = createIpcMainMock();
        const { MainProcessState } = await loadStateManager(ipcMain);
        const handlerCalls: Array<{
            args: unknown[];
            channel: string;
        }> = [
            { args: ["loadedFitFilePath"], channel: "main-state:get" },
            {
                args: ["loadedFitFilePath", "ride.fit"],
                channel: "main-state:set",
            },
            { args: ["loadedFitFilePath"], channel: "main-state:listen" },
            { args: ["loadedFitFilePath"], channel: "main-state:unlisten" },
            { args: ["test-op"], channel: "main-state:operation" },
            { args: [], channel: "main-state:operations" },
            { args: [10], channel: "main-state:errors" },
            { args: [], channel: "main-state:metrics" },
        ];

        ipcMain.handle.mockClear();
        new MainProcessState();

        for (const { args, channel } of handlerCalls) {
            const handler = getRegisteredIpcHandler(ipcMain, channel);

            expect(() =>
                handler(createAllowedIpcEvent(), ...args)
            ).not.toThrow();
            expect(() => handler(createMissingUrlIpcEvent(), ...args)).toThrow(
                /IPC sender URL unavailable/v
            );
            expect(() => handler(createHttpsIpcEvent(), ...args)).toThrow(
                /IPC sender is not allowed/v
            );
            expect(() => handler(createOutsideFileIpcEvent(), ...args)).toThrow(
                /IPC sender is not allowed/v
            );
        }
    });
});
