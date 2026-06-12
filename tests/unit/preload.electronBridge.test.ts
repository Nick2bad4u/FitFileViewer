import { beforeEach, describe, expect, it, vi } from "vitest";

interface PreloadContextBridge {
    exposeInMainWorld?: (key: string, api: unknown) => void;
}

interface PreloadIpcRenderer {
    invoke?: (channel: string, ...args: unknown[]) => Promise<unknown>;
    on?: (channel: string) => void;
    send?: (channel: string, ...args: unknown[]) => void;
}

interface PreloadElectronBridge {
    contextBridge?: null | PreloadContextBridge;
    default?: null | PreloadElectronBridge;
    ipcRenderer?: null | PreloadIpcRenderer;
}

const electronModuleMock = vi.hoisted(() => ({
    bridge: {
        contextBridge: undefined,
        default: undefined,
        ipcRenderer: undefined,
    } as PreloadElectronBridge,
}));

vi.mock(import("electron"), () => electronModuleMock.bridge);

import { resolvePreloadElectronBridge } from "../../electron-app/preload/electronBridge.js";

function resetElectronModuleMock(): void {
    Object.assign(electronModuleMock.bridge, {
        contextBridge: undefined,
        default: undefined,
        ipcRenderer: undefined,
    });
}

describe("preload electron bridge resolver", () => {
    beforeEach(() => {
        resetElectronModuleMock();
    });

    it("resolves direct native Electron bridge exports", () => {
        expect.assertions(1);

        const contextBridge = {
            exposeInMainWorld: vi.fn<(key: string, api: unknown) => void>(),
        };
        const ipcRenderer = {
            invoke: vi.fn<(channel: string) => Promise<unknown>>(),
            on: vi.fn<(channel: string) => void>(),
            send: vi.fn<(channel: string) => void>(),
        };
        Object.assign(electronModuleMock.bridge, {
            contextBridge,
            ipcRenderer,
        });

        expect(resolvePreloadElectronBridge({})).toStrictEqual({
            contextBridge,
            ipcRenderer,
        });
    });

    it("unwraps default Electron bridge exports", () => {
        expect.assertions(1);

        const contextBridge = {
            exposeInMainWorld: vi.fn<(key: string, api: unknown) => void>(),
        };
        const ipcRenderer = {
            invoke: vi.fn<(channel: string) => Promise<unknown>>(),
            on: vi.fn<(channel: string) => void>(),
            send: vi.fn<(channel: string) => void>(),
        };
        electronModuleMock.bridge.default = { contextBridge, ipcRenderer };

        expect(resolvePreloadElectronBridge({})).toStrictEqual({
            contextBridge,
            ipcRenderer,
        });
    });

    it("uses complete explicit overrides before native Electron exports", () => {
        expect.assertions(1);

        const contextBridge = {
            exposeInMainWorld: vi.fn<(key: string, api: unknown) => void>(),
        };
        const ipcRenderer = {
            invoke: vi.fn<(channel: string) => Promise<unknown>>(),
            on: vi.fn<(channel: string) => void>(),
            send: vi.fn<(channel: string) => void>(),
        };
        Object.assign(electronModuleMock.bridge, {
            contextBridge: null,
            ipcRenderer: null,
        });

        expect(
            resolvePreloadElectronBridge({
                electronBridgeOverride: { contextBridge, ipcRenderer },
            })
        ).toStrictEqual({
            contextBridge,
            ipcRenderer,
        });
    });

    it("falls back to native Electron exports for missing override parts", () => {
        expect.assertions(1);

        const contextBridge = {
            exposeInMainWorld: vi.fn<(key: string, api: unknown) => void>(),
        };
        const ipcRenderer = {
            invoke: vi.fn<(channel: string) => Promise<unknown>>(),
            on: vi.fn<(channel: string) => void>(),
            send: vi.fn<(channel: string) => void>(),
        };
        Object.assign(electronModuleMock.bridge, {
            contextBridge,
            ipcRenderer,
        });

        expect(
            resolvePreloadElectronBridge({
                electronBridgeOverride: {},
            })
        ).toStrictEqual({
            contextBridge,
            ipcRenderer,
        });
    });

    it("uses explicit null overrides for unavailable bridge parts", () => {
        expect.assertions(1);

        expect(
            resolvePreloadElectronBridge({
                electronBridgeOverride: {
                    contextBridge: null,
                    ipcRenderer: null,
                },
            })
        ).toStrictEqual({
            contextBridge: null,
            ipcRenderer: null,
        });
    });
});
