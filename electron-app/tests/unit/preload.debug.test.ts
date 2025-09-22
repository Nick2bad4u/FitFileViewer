/**
 * @file preload.debug.test.ts
 * @description Simple test to debug preload.js execution using Module cache injection
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { Module } from "module";

// Create inline mocks
const mockContextBridge = {
    exposeInMainWorld: vi.fn(),
};

const mockIpcRenderer = {
    invoke: vi.fn().mockResolvedValue("mock-result"),
    send: vi.fn(),
    on: vi.fn(),
    once: vi.fn(),
    removeListener: vi.fn(),
    removeAllListeners: vi.fn(),
};

const mockApp = {
    getPath: vi.fn((name) => `/mock/path/${name}`),
    isPackaged: false,
    getVersion: vi.fn(() => "1.0.0"),
    getName: vi.fn(() => "FitFileViewer"),
    on: vi.fn(),
    whenReady: vi.fn(() => Promise.resolve()),
    quit: vi.fn(),
};

describe("preload.js - Module Cache Injection Test", () => {
    beforeEach(() => {
        // Clear all mocks
        vi.clearAllMocks();

        // Set up process.env for different test scenarios
        process.env.NODE_ENV = "development";
    });

    it("should execute preload.js with module cache injection", () => {
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
        require.cache["electron"] = mockModule as any;

        // Also try the full path approach
        const electronPath = require.resolve("electron");
        require.cache[electronPath] = mockModule as any;

        // Clear preload.js from cache to ensure fresh require
        delete require.cache[require.resolve("../../preload.js")];

        process.stdout.write(`About to require preload.js with module cache injection\n`);
        process.stdout.write(`Electron mock in cache: ${!!require.cache["electron"]}\n`);
        process.stdout.write(`mockContextBridge exists: ${!!mockContextBridge}\n`);

        // Check mock calls before require
        const callsBefore = mockContextBridge.exposeInMainWorld.mock.calls.length;

        // Require the preload.js file to execute it
        const preloadModule = require("../../preload.js");

        // Check mock calls after require
        const callsAfter = mockContextBridge.exposeInMainWorld.mock.calls.length;

        // Log results
        process.stdout.write(`Mock calls before require: ${callsBefore}\n`);
        process.stdout.write(`Mock calls after require: ${callsAfter}\n`);
        process.stdout.write(`All calls: ${JSON.stringify(mockContextBridge.exposeInMainWorld.mock.calls, null, 2)}\n`);

        // Clean up the cache
        delete require.cache["electron"];
        delete require.cache[electronPath];

        // Basic assertion - expect calls to have been made
        expect(callsAfter).toBeGreaterThan(callsBefore);
    });
});
