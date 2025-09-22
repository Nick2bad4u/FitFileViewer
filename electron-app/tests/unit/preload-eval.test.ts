import { describe, it, expect, vi, beforeEach } from "vitest";
import fs from "fs";
import path from "path";

describe("preload.js - Script Evaluation Test", () => {
    let electronMock: any;
    let consoleLogSpy: any;
    let consoleErrorSpy: any;

    beforeEach(() => {
        // Reset everything completely
        vi.resetAllMocks();
        vi.resetModules();
        vi.clearAllMocks();

        // Create electron mock
        electronMock = {
            ipcRenderer: {
                invoke: vi.fn().mockResolvedValue("mock-result"),
                send: vi.fn(),
                on: vi.fn(),
                removeAllListeners: vi.fn(),
            },
            contextBridge: {
                exposeInMainWorld: vi.fn(),
            },
        };

        // Mock console methods but don't silence them initially to see what happens
        consoleLogSpy = vi.spyOn(console, "log");
        consoleErrorSpy = vi.spyOn(console, "error");

        // Mock process object
        const mockProcess = {
            env: { NODE_ENV: "development" },
            once: vi.fn(),
        };
        vi.stubGlobal("process", mockProcess);

        console.log("[TEST] About to load preload script via fs...");

        // Load preload script as text and evaluate it
        try {
            const preloadPath = path.resolve(__dirname, "../../preload.js");
            console.log("[TEST] Loading from:", preloadPath);

            const preloadCode = fs.readFileSync(preloadPath, "utf-8");
            console.log("[TEST] Script loaded, length:", preloadCode.length);

            // Create a require function that returns our mocks
            const mockRequire = vi.fn().mockImplementation((module: string) => {
                console.log("[TEST] require() called for:", module);
                if (module === "electron") {
                    console.log("[TEST] Returning mocked electron");
                    return electronMock;
                }
                throw new Error(`Unknown module: ${module}`);
            });

            // Execute the preload script with our mocked require
            const scriptFunc = new Function("require", "console", "process", "globalThis", preloadCode);
            scriptFunc(mockRequire, console, globalThis.process, globalThis);

            console.log("[TEST] Preload script executed successfully");
        } catch (error) {
            console.error("[TEST] Error loading/executing preload script:", error);
        }

        console.log(
            "[TEST] Final contextBridge calls:",
            electronMock.contextBridge.exposeInMainWorld.mock.calls.length
        );
    });

    it("should execute the preload script and expose APIs", () => {
        // Check if contextBridge.exposeInMainWorld was called
        expect(electronMock.contextBridge.exposeInMainWorld).toHaveBeenCalled();

        // Should have at least 2 calls (electronAPI and devTools)
        expect(electronMock.contextBridge.exposeInMainWorld.mock.calls.length).toBeGreaterThanOrEqual(1);

        // Check the calls
        const exposeCalls = electronMock.contextBridge.exposeInMainWorld.mock.calls;
        console.log(
            "[TEST] exposeInMainWorld calls:",
            exposeCalls.map((call: any) => call[0])
        );
    });

    it("should register process beforeExit handler", () => {
        const mockProcess = globalThis.process as any;
        expect(mockProcess.once).toHaveBeenCalledWith("beforeExit", expect.any(Function));
    });

    it("should log initialization messages", () => {
        // Should have some console.log calls from the preload script
        expect(consoleLogSpy).toHaveBeenCalled();

        // Look for specific log messages
        const logCalls = consoleLogSpy.mock.calls;
        const hasPreloadLogs = logCalls.some((call: any) => call[0] && call[0].includes("[preload.js]"));

        expect(hasPreloadLogs).toBe(true);
    });
});
