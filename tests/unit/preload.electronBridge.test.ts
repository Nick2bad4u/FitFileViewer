import { createRequire } from "node:module";

import { describe, expect, it, vi } from "vitest";

interface PreloadElectronBridgeModule {
    resolvePreloadElectronBridge: (options: {
        globalScope?: object;
        requireModule: (moduleId: string) => unknown;
    }) => {
        contextBridge: null | object | undefined;
        ipcRenderer: null | object | undefined;
    };
}

const requireFromTest = createRequire(import.meta.url);
const { resolvePreloadElectronBridge } = requireFromTest(
    "../../electron-app/preload/electronBridge.js"
) as PreloadElectronBridgeModule;

describe("preload electron bridge resolver", () => {
    it("resolves direct CommonJS Electron bridge exports", () => {
        expect.assertions(3);

        const contextBridge = {
            exposeInMainWorld: vi.fn<(key: string, api: unknown) => void>(),
        };
        const ipcRenderer = {
            invoke: vi.fn<(channel: string) => Promise<unknown>>(),
            on: vi.fn<(channel: string) => void>(),
            send: vi.fn<(channel: string) => void>(),
        };
        const requireModule = vi.fn<(moduleId: string) => unknown>(() => ({
            contextBridge,
            ipcRenderer,
        }));

        expect(resolvePreloadElectronBridge({ requireModule })).toStrictEqual({
            contextBridge,
            ipcRenderer,
        });

        expect(requireModule).toHaveBeenCalledWith("electron");
        expect(requireModule).toHaveBeenCalledTimes(2);
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

        expect(
            resolvePreloadElectronBridge({
                requireModule: () => ({
                    default: { contextBridge, ipcRenderer },
                }),
            })
        ).toStrictEqual({
            contextBridge,
            ipcRenderer,
        });
    });

    it("uses hoisted overrides before requiring Electron", () => {
        expect.assertions(2);

        const contextBridge = {
            exposeInMainWorld: vi.fn<(key: string, api: unknown) => void>(),
        };
        const ipcRenderer = {
            invoke: vi.fn<(channel: string) => Promise<unknown>>(),
            on: vi.fn<(channel: string) => void>(),
            send: vi.fn<(channel: string) => void>(),
        };
        const requireModule = vi.fn<(moduleId: string) => unknown>(() => {
            throw new Error("electron unavailable");
        });

        expect(
            resolvePreloadElectronBridge({
                globalScope: {
                    __electronHoistedMock: { contextBridge, ipcRenderer },
                },
                requireModule,
            })
        ).toStrictEqual({
            contextBridge,
            ipcRenderer,
        });

        expect(requireModule).not.toHaveBeenCalled();
    });

    it("returns null for missing override parts when Electron loading fails", () => {
        expect.assertions(1);

        expect(
            resolvePreloadElectronBridge({
                globalScope: {
                    __electronHoistedMock: {},
                },
                requireModule: () => {
                    throw new Error("electron unavailable");
                },
            })
        ).toStrictEqual({
            contextBridge: null,
            ipcRenderer: null,
        });
    });

    it("throws module loading failures when no override object exists", () => {
        expect.assertions(1);

        expect(() =>
            resolvePreloadElectronBridge({
                requireModule: () => {
                    throw new Error("electron unavailable");
                },
            })
        ).toThrow("electron unavailable");
    });
});
