/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { readFileSync } from "fs";
import { join } from "path";

/**
 * Simplified interface for ElectronAPI with only the methods we test
 */
interface TestElectronAPI {
    openFile: () => Promise<string[]>;
    readFile: (filePath: string) => Promise<ArrayBuffer>;
    parseFitFile: (buffer: ArrayBuffer) => Promise<any>;
    invoke: (channel: string, ...args: any[]) => Promise<any>;
    setMainState?: (
        path: string,
        value: any,
        options?: any
    ) => Promise<boolean>;
    getOperation?: (operationId: string) => Promise<any>;
    validateAPI: () => boolean;
    [key: string]: any;
}

describe("Simple Electron Mock Test", () => {
    // Setup mocks
    let mockIpcRenderer: any;
    let mockContextBridge: any;
    let exposedElectronAPI: TestElectronAPI | undefined;
    let preloadCode: string;
    let consoleSpy: any;

    beforeEach(() => {
        vi.clearAllMocks();

        // Reset mocks
        mockIpcRenderer = {
            invoke: vi.fn().mockResolvedValue("mock-result"),
            send: vi.fn(),
            on: vi.fn(),
            once: vi.fn(),
            removeListener: vi.fn(),
            removeAllListeners: vi.fn(),
        };

        mockContextBridge = {
            exposeInMainWorld: vi.fn(),
        };

        consoleSpy = {
            log: vi.spyOn(console, "log").mockImplementation(() => {}),
            error: vi.spyOn(console, "error").mockImplementation(() => {}),
        };

        // Load preload script source
        preloadCode = readFileSync(
            join(__dirname, "../../preload.js"),
            "utf-8"
        );
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    function createPreloadEnvironment(options = {}) {
        const env = {
            NODE_ENV: "test",
            ...options,
        };

        // Create a virtual environment with our mocks
        const mockRequire = vi.fn((moduleName: string) => {
            if (moduleName === "electron") {
                return {
                    ipcRenderer: mockIpcRenderer,
                    contextBridge: mockContextBridge,
                };
            }
            throw new Error(`Module not mocked: ${moduleName}`);
        });

        const mockProcess = {
            env,
            once: vi.fn(),
        };

        const mockConsole = {
            log: consoleSpy.log,
            error: consoleSpy.error,
        };

        // Execute preload script in controlled environment
        const func = new Function("require", "process", "console", preloadCode);

        try {
            func(mockRequire, mockProcess, mockConsole);
        } catch (error) {
            // Some errors are expected in test environment
        }

        return {
            mockRequire,
            mockProcess,
            mockConsole,
            exposedAPI: mockContextBridge.exposeInMainWorld.mock
                .calls[0]?.[1] as TestElectronAPI,
        };
    }

    it("should load preload.js and expose electronAPI", () => {
        const { exposedAPI } = createPreloadEnvironment();

        // Check that electronAPI was exposed
        expect(mockContextBridge.exposeInMainWorld).toHaveBeenCalledWith(
            "electronAPI",
            expect.any(Object)
        );

        expect(exposedAPI).toBeDefined();
    });

    it("should provide core API methods", () => {
        const { exposedAPI } = createPreloadEnvironment();

        // Verify core API methods are available
        expect(exposedAPI).toBeDefined();
        expect(typeof exposedAPI.openFile).toBe("function");
        expect(typeof exposedAPI.readFile).toBe("function");
        expect(typeof exposedAPI.parseFitFile).toBe("function");
    });

    it("should validate input parameters", async () => {
        const { exposedAPI } = createPreloadEnvironment();

        expect(exposedAPI).toBeDefined();

        // Using an invalid channel should reject (validation occurs before ipcRenderer.invoke)
        await expect(exposedAPI.invoke(null as any)).rejects.toThrow(
            "Invalid channel for invoke"
        );

        // Invoke with valid parameters should work
        mockIpcRenderer.invoke.mockResolvedValueOnce("test-response");
        const result = await exposedAPI.invoke("valid-channel");
        expect(result).toBe("test-response");
    });

    it("should reject invalid main-state path locally (no IPC)", async () => {
        const { exposedAPI } = createPreloadEnvironment();

        expect(typeof exposedAPI.setMainState).toBe("function");
        mockIpcRenderer.invoke.mockClear();

        const ok = await exposedAPI.setMainState!(null as any, "value");
        expect(ok).toBe(false);
        expect(mockIpcRenderer.invoke).not.toHaveBeenCalled();
    });

    it("should reject invalid operationId locally (no IPC)", async () => {
        const { exposedAPI } = createPreloadEnvironment();

        expect(typeof exposedAPI.getOperation).toBe("function");
        mockIpcRenderer.invoke.mockClear();

        const op = await exposedAPI.getOperation!(null as any);
        expect(op).toBeNull();
        expect(mockIpcRenderer.invoke).not.toHaveBeenCalled();
    });
});
