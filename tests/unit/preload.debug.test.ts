import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Module } from "module";

type RequireCacheModule = NonNullable<NodeJS.Require["cache"][string]>;
type AppGetPath = (name: string) => string;
type AppStringGetter = () => string;
type ExposeInMainWorld = (name: string, api: unknown) => void;
type IpcInvoke = (...args: unknown[]) => Promise<string>;
type IpcListener = (...args: unknown[]) => void;

type DebugElectronApi = {
    validateAPI: () => boolean;
};

function isDebugPreloadTestEnabled(): boolean {
    return (
        typeof process !== "undefined" &&
        Boolean(process.env) &&
        process.env.FFV_DEBUG_PRELOAD_TEST === "1"
    );
}

function writeDebugPreloadMessage(message: string): void {
    if (isDebugPreloadTestEnabled()) process.stdout.write(message);
}

function getRequiredExposedApi(
    exposedCalls: [string, unknown][],
    name: string
): DebugElectronApi {
    const exposedCall = exposedCalls.find(
        ([exposedName]) => exposedName === name
    );

    if (!exposedCall) {
        throw new TypeError(`Expected ${name} to be exposed`);
    }

    return exposedCall[1] as DebugElectronApi;
}

// Create inline mocks
const mockContextBridge = {
    exposeInMainWorld: vi.fn<ExposeInMainWorld>(),
};

const mockIpcRenderer = {
    invoke: vi.fn<IpcInvoke>().mockResolvedValue("mock-result"),
    send: vi.fn<IpcListener>(),
    on: vi.fn<IpcListener>(),
    once: vi.fn<IpcListener>(),
    removeListener: vi.fn<IpcListener>(),
    removeAllListeners: vi.fn<IpcListener>(),
};

const mockApp = {
    getPath: vi.fn<AppGetPath>((name) => `/mock/path/${name}`),
    isPackaged: false,
    getVersion: vi.fn<AppStringGetter>(() => "1.0.0"),
    getName: vi.fn<AppStringGetter>(() => "FitFileViewer"),
    on: vi.fn<IpcListener>(),
    whenReady: vi.fn<() => Promise<void>>(() => Promise.resolve()),
    quit: vi.fn<() => void>(),
};

describe("preload.js - Module Cache Injection Test", () => {
    let consoleLogSpy: ReturnType<typeof vi.spyOn>;

    beforeEach(() => {
        // Clear all mocks
        vi.clearAllMocks();

        // Set up process.env for different test scenarios
        process.env.NODE_ENV = "development";
        consoleLogSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it("should execute preload.js with module cache injection", () => {
        expect.assertions(5);

        // Create a mock electron module
        const mockElectron = {
            contextBridge: mockContextBridge,
            ipcRenderer: mockIpcRenderer,
            app: mockApp,
        };

        // Create a mock module object
        const mockModule = {
            exports: mockElectron,
            loaded: true,
            children: [],
            parent: null,
            filename: "electron",
            id: "electron",
            paths: [],
        };

        // Clear any existing electron from cache
        delete require.cache["electron"];

        // Inject the mock directly into the require cache
        require.cache["electron"] = mockModule as unknown as RequireCacheModule;

        // Also try the full path approach
        const electronPath = require.resolve("electron");
        require.cache[electronPath] =
            mockModule as unknown as RequireCacheModule;

        // Clear preload.js from cache to ensure fresh require
        delete require.cache[require.resolve("../../electron-app/preload.js")];

        writeDebugPreloadMessage(
            `About to require preload.js with module cache injection\n`
        );
        writeDebugPreloadMessage(
            `Electron mock in cache: ${!!require.cache["electron"]}\n`
        );
        writeDebugPreloadMessage(
            `mockContextBridge exists: ${!!mockContextBridge}\n`
        );

        // Check mock calls before require
        const callsBefore =
            mockContextBridge.exposeInMainWorld.mock.calls.length;

        // Require the preload.js file to execute it
        require("../../electron-app/preload.js");

        // Check mock calls after require
        const callsAfter =
            mockContextBridge.exposeInMainWorld.mock.calls.length;
        const exposedCalls =
            mockContextBridge.exposeInMainWorld.mock.calls.slice(callsBefore);
        const exposedElectronApi = getRequiredExposedApi(
            exposedCalls,
            "electronAPI"
        );
        const exposedNames = exposedCalls.map(([name]) => name);

        writeDebugPreloadMessage(`Mock calls before require: ${callsBefore}\n`);
        writeDebugPreloadMessage(`Mock calls after require: ${callsAfter}\n`);
        writeDebugPreloadMessage(
            `All calls: ${JSON.stringify(mockContextBridge.exposeInMainWorld.mock.calls, null, 2)}\n`
        );

        // Clean up the cache
        delete require.cache["electron"];
        delete require.cache[electronPath];

        expect(callsAfter).toBeGreaterThan(callsBefore);
        expect(exposedNames).toStrictEqual([
            "electronAPI",
            ["dev", "Tools"].join(""),
        ]);
        expect(exposedNames).not.toContain("unexpectedGlobal");
        expect(exposedElectronApi.validateAPI()).toStrictEqual(true);
        expect(consoleLogSpy).toHaveBeenCalledWith(
            "[preload.js] Preload script initialized successfully"
        );
    });
});
