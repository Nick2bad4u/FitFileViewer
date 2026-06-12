// @vitest-environment node

import { pathToFileURL } from "node:url";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

type IpcCallback = (event: unknown, ...args: unknown[]) => unknown;
type IpcMainMock = {
    handle: ReturnType<
        typeof vi.fn<(channel: string, handler: IpcCallback) => void>
    >;
    on: ReturnType<
        typeof vi.fn<(channel: string, listener: IpcCallback) => void>
    >;
    removeHandler: ReturnType<typeof vi.fn<(channel: string) => void>>;
    removeListener: ReturnType<
        typeof vi.fn<(channel: string, listener: IpcCallback) => void>
    >;
};
type ElectronAccessModule = {
    setElectronOverride: (override: unknown) => void;
};
type IpcRegistryModule = {
    registerIpcHandle: (channel: string, handler: IpcCallback) => void;
    registerIpcListener: (channel: string, listener: IpcCallback) => void;
    resetIpcRegistries: () => void;
};

function createIpcMainMock(): IpcMainMock {
    return {
        handle: vi.fn<(channel: string, handler: IpcCallback) => void>(),
        on: vi.fn<(channel: string, listener: IpcCallback) => void>(),
        removeHandler: vi.fn<(channel: string) => void>(),
        removeListener:
            vi.fn<(channel: string, listener: IpcCallback) => void>(),
    };
}

async function loadRegistry(ipcMain: IpcMainMock): Promise<IpcRegistryModule> {
    const electronAccess =
        (await import(
            "../../../../electron-app/main/runtime/electronAccess.js"
        )) as ElectronAccessModule;
    electronAccess.setElectronOverride({
        app: {
            getAppPath: () => "C:\\mock\\app",
        },
        ipcMain,
    });

    return (await import("../../../../electron-app/main/ipc/ipcRegistry.js")) as unknown as IpcRegistryModule;
}

describe("ipcRegistry sender policy", () => {
    beforeEach(() => {
        vi.resetModules();
        process.env.NODE_ENV = "production";
    });

    afterEach(async () => {
        try {
            const registry =
                (await import("../../../../electron-app/main/ipc/ipcRegistry.js")) as unknown as IpcRegistryModule;
            registry.resetIpcRegistries();
        } catch {
            /* ignore */
        }

        try {
            const electronAccess =
                (await import(
                    "../../../../electron-app/main/runtime/electronAccess.js"
                )) as ElectronAccessModule;
            electronAccess.setElectronOverride(null);
        } catch {
            /* ignore */
        }

        vi.restoreAllMocks();
    });

    it("wraps invoke handlers with app-file sender validation", async () => {
        expect.assertions(5);

        const ipcMain = createIpcMainMock();
        const registry = await loadRegistry(ipcMain);
        const handler = vi.fn<IpcCallback>(() => "ok");
        const allowedUrl = pathToFileURL(
            "C:\\mock\\app\\index.html"
        ).toString();
        const blockedUrl = "https://example.com/";

        registry.registerIpcHandle("getAppVersion", handler);

        const registeredHandler = ipcMain.handle.mock.calls[0]?.[1];
        if (typeof registeredHandler !== "function") {
            throw new TypeError("IPC handler was not registered");
        }

        expect(registeredHandler({ senderFrame: { url: allowedUrl } })).toBe(
            "ok"
        );
        expect(handler).toHaveBeenCalledOnce();
        expect(() =>
            registeredHandler({ senderFrame: { url: blockedUrl } })
        ).toThrow(/IPC sender is not allowed/u);
        expect(() => registeredHandler({})).toThrow(
            /IPC sender URL unavailable/u
        );
        expect(handler).toHaveBeenCalledOnce();
    });

    it("wraps event listeners with app-file sender validation", async () => {
        expect.assertions(4);

        const ipcMain = createIpcMainMock();
        const registry = await loadRegistry(ipcMain);
        const listener = vi.fn<IpcCallback>(() => undefined);
        const allowedUrl = pathToFileURL(
            "C:\\mock\\app\\index.html"
        ).toString();

        registry.registerIpcListener("fit-file-loaded", listener);

        const registeredListener = ipcMain.on.mock.calls[0]?.[1];
        if (typeof registeredListener !== "function") {
            throw new TypeError("IPC listener was not registered");
        }

        registeredListener({ senderFrame: { url: allowedUrl } }, "ride.fit");
        expect(listener).toHaveBeenCalledWith(
            { senderFrame: { url: allowedUrl } },
            "ride.fit"
        );
        expect(() =>
            registeredListener({ senderFrame: { url: "https://example.com/" } })
        ).toThrow(/IPC sender is not allowed/u);

        registry.resetIpcRegistries();

        expect(ipcMain.removeListener).toHaveBeenCalledWith(
            "fit-file-loaded",
            registeredListener
        );
        expect(listener).toHaveBeenCalledOnce();
    });
});
