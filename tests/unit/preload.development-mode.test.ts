import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { ElectronAPI } from "../../electron-app/shared/preloadApi";

type ConsoleCall = unknown[];
type ExposedElectronAPI = Pick<
    ElectronAPI,
    "getAppVersion" | "injectMenu" | "invoke" | "validateAPI"
>;

interface ExposedDevTools {
    getPreloadInfo: () => {
        apiMethods: string[];
        constants: Record<string, unknown>;
        timestamp: string;
        version: string;
    };
    logAPIState: () => void;
    testIPC: () => Promise<boolean>;
}

interface ElectronHoistedMock {
    contextBridge: {
        exposeInMainWorld: (name: string, api: unknown) => void;
    };
    ipcRenderer: {
        invoke: (...args: unknown[]) => Promise<unknown>;
        on: (...args: unknown[]) => unknown;
        send: (...args: unknown[]) => unknown;
    };
}

type ProcessOnceListener = (...args: unknown[]) => void;

const developmentToolsGlobalName = ["dev", "Tools"].join("");

function getGlobalValue(name: string): unknown {
    return Reflect.get(globalThis, name);
}

function setGlobalValue(name: string, value: unknown): void {
    Reflect.set(globalThis, name, value);
}

function getExposedElectronAPI(): ExposedElectronAPI {
    return getGlobalValue("electronAPI") as ExposedElectronAPI;
}

function getExposedDevTools(): ExposedDevTools {
    return getGlobalValue(developmentToolsGlobalName) as ExposedDevTools;
}

describe("preload.js - Development mode coverage", () => {
    let originalElectronAPI: unknown;
    let originalDevTools: unknown;
    const originalNodeEnv = process.env.NODE_ENV;

    beforeEach(() => {
        vi.clearAllMocks();
        vi.resetModules();
        originalElectronAPI = getGlobalValue("electronAPI");
        originalDevTools = getGlobalValue(developmentToolsGlobalName);
        Reflect.deleteProperty(globalThis, "electronAPI");
        Reflect.deleteProperty(globalThis, developmentToolsGlobalName);
    });

    afterEach(() => {
        vi.restoreAllMocks();
        vi.resetModules();
        Reflect.deleteProperty(globalThis, "__electronHoistedMock");
        process.env.NODE_ENV = originalNodeEnv;
        // restore globals if they existed
        if (originalElectronAPI)
            setGlobalValue("electronAPI", originalElectronAPI);
        if (originalDevTools)
            setGlobalValue(developmentToolsGlobalName, originalDevTools);
    });

    it("exposes api and dev tools, logs dev messages, and handles beforeExit in development", async () => {
        expect.assertions(18);

        const ipcRenderer = {
            invoke: vi
                .fn<(...args: unknown[]) => Promise<string>>()
                .mockResolvedValue("2.3.4"),
            on: vi.fn<(...args: unknown[]) => void>(),
            send: vi.fn<(...args: unknown[]) => void>(),
        } satisfies ElectronHoistedMock["ipcRenderer"];

        const contextBridge = {
            exposeInMainWorld: vi
                .fn<(name: string, api: unknown) => void>()
                .mockImplementation((name, api) => {
                    setGlobalValue(name, api);
                }),
        } satisfies ElectronHoistedMock["contextBridge"];

        const logs: ConsoleCall[] = [];
        const errors: ConsoleCall[] = [];
        const consoleLogSpy = vi
            .spyOn(console, "log")
            .mockImplementation((...args: unknown[]) => {
                logs.push(args);
            });
        const consoleErrorSpy = vi
            .spyOn(console, "error")
            .mockImplementation((...args: unknown[]) => {
                errors.push(args);
            });

        const onceCalls: Array<{
            cb: ProcessOnceListener;
            event: string | symbol;
        }> = [];
        const processOnceSpy = vi
            .spyOn(process, "once")
            .mockImplementation((event, cb) => {
                onceCalls.push({ event, cb: cb as ProcessOnceListener });
                return process;
            });

        process.env.NODE_ENV = "development";
        const electronMock: ElectronHoistedMock = {
            contextBridge,
            ipcRenderer,
        };
        Reflect.set(globalThis, "__electronHoistedMock", electronMock);
        await import("../../electron-app/preload.js");

        // electronAPI should be exposed
        const api = getExposedElectronAPI();
        expect(
            Object.fromEntries(
                [
                    "getAppVersion",
                    "injectMenu",
                    "invoke",
                    "validateAPI",
                ].map((methodName) => [
                    methodName,
                    Object.hasOwn(api, methodName),
                ])
            )
        ).toEqual({
            getAppVersion: true,
            injectMenu: true,
            invoke: true,
            validateAPI: true,
        });
        expect(api.validateAPI()).toBe(true);

        // Development tools should be exposed in development
        const devTools = getExposedDevTools();
        expect(
            Object.fromEntries(
                [
                    "getPreloadInfo",
                    "logAPIState",
                    "testIPC",
                ].map((methodName) => [
                    methodName,
                    Object.hasOwn(devTools, methodName),
                ])
            )
        ).toEqual({
            getPreloadInfo: true,
            logAPIState: true,
            testIPC: true,
        });

        // getPreloadInfo returns structure with constants and exposed API methods
        const info = devTools.getPreloadInfo();
        expect(info.apiMethods).toStrictEqual(Object.keys(api));
        expect(info.constants).toHaveProperty("CHANNELS");
        expect(info.constants).toHaveProperty("EVENTS");
        expect(new Date(info.timestamp).toISOString()).toBe(info.timestamp);

        // testIPC should call through to ipcRenderer.invoke via electronAPI.getAppVersion and return true
        const ok = await devTools.testIPC();
        expect(ok).toStrictEqual(true);
        expect(ipcRenderer.invoke).toHaveBeenCalledWith("getAppVersion");

        // logAPIState should log current state
        devTools.logAPIState();
        expect(logs.map((args) => String(args[0]))).toContainEqual(
            expect.stringContaining("Current API State")
        );

        // Should have logged successful exposure and API structure messages
        expect(logs.map((args) => String(args[0]))).toContainEqual(
            expect.stringContaining(
                "Successfully exposed electronAPI to main world"
            )
        );
        expect(logs.map((args) => String(args[0]))).toContainEqual(
            expect.stringContaining("API Structure:")
        );
        // Development tools exposed and final init log
        expect(logs.map((args) => String(args[0]))).toContainEqual(
            expect.stringContaining("Development tools exposed")
        );
        expect(logs.map((args) => String(args[0]))).toContainEqual(
            expect.stringContaining("Preload script initialized successfully")
        );

        // Simulate beforeExit to hit cleanup log
        const beforeExit = onceCalls.find((c) => c.event === "beforeExit");
        expect(processOnceSpy.mock.calls).toContainEqual([
            "beforeExit",
            beforeExit?.cb,
        ]);
        expect(beforeExit).toEqual({
            cb: beforeExit?.cb,
            event: "beforeExit",
        });
        beforeExit!.cb();
        expect(logs.map((args) => String(args[0]))).toContainEqual(
            expect.stringContaining("Process exiting, performing cleanup")
        );

        // Ensure no unexpected errors were logged
        expect(errors).toStrictEqual([]);

        consoleLogSpy.mockRestore();
        consoleErrorSpy.mockRestore();
    });
});
