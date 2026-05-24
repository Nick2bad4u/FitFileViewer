/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

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
    let consoleSpy: any;
    const originalNodeEnv = process.env.NODE_ENV;

    beforeEach(() => {
        vi.clearAllMocks();
        vi.resetModules();

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
    });

    afterEach(() => {
        vi.restoreAllMocks();
        vi.resetModules();
        Reflect.deleteProperty(globalThis, "__electronHoistedMock");
        process.env.NODE_ENV = originalNodeEnv;
    });

    async function createPreloadEnvironment(options = {}) {
        const env = {
            NODE_ENV: "test",
            ...options,
        };

        process.env.NODE_ENV = env.NODE_ENV;
        Reflect.set(globalThis, "__electronHoistedMock", {
            ipcRenderer: mockIpcRenderer,
            contextBridge: mockContextBridge,
        });
        await import("../../preload.js");

        return {
            exposedAPI: mockContextBridge.exposeInMainWorld.mock
                .calls[0]?.[1] as TestElectronAPI,
        };
    }

    it("should load preload.js and expose electronAPI", async () => {
        const { exposedAPI } = await createPreloadEnvironment();

        // Check that electronAPI was exposed
        expect(mockContextBridge.exposeInMainWorld).toHaveBeenCalledWith(
            "electronAPI",
            expect.any(Object)
        );

        expect(exposedAPI).toEqual(
            expect.objectContaining({
                openFile: expect.any(Function),
                readFile: expect.any(Function),
                parseFitFile: expect.any(Function),
                validateAPI: expect.any(Function),
            })
        );
    });

    it("should provide core API methods", async () => {
        const { exposedAPI } = await createPreloadEnvironment();

        // Verify core API methods are available
        expect(exposedAPI).toEqual(
            expect.objectContaining({
                openFile: expect.any(Function),
                readFile: expect.any(Function),
                parseFitFile: expect.any(Function),
                invoke: expect.any(Function),
            })
        );
    });

    it("should validate input parameters", async () => {
        const { exposedAPI } = await createPreloadEnvironment();

        expect(typeof exposedAPI.invoke).toBe("function");
        mockIpcRenderer.invoke.mockClear();

        // Using an invalid channel should reject (validation occurs before ipcRenderer.invoke)
        await expect(exposedAPI.invoke(null as any)).rejects.toThrow(
            "Invalid channel for invoke"
        );
        expect(mockIpcRenderer.invoke).not.toHaveBeenCalled();

        // Invoke with valid parameters should work
        mockIpcRenderer.invoke.mockResolvedValueOnce("test-response");
        const result = await exposedAPI.invoke("valid-channel");
        expect(result).toBe("test-response");
        expect(mockIpcRenderer.invoke).toHaveBeenCalledWith("valid-channel");
    });

    it("should reject invalid main-state path locally (no IPC)", async () => {
        const { exposedAPI } = await createPreloadEnvironment();

        expect(typeof exposedAPI.setMainState).toBe("function");
        mockIpcRenderer.invoke.mockClear();

        const ok = await exposedAPI.setMainState!(null as any, "value");
        expect(ok).toBe(false);
        expect(mockIpcRenderer.invoke).not.toHaveBeenCalled();
    });

    it("should reject invalid operationId locally (no IPC)", async () => {
        const { exposedAPI } = await createPreloadEnvironment();

        expect(typeof exposedAPI.getOperation).toBe("function");
        mockIpcRenderer.invoke.mockClear();

        const op = await exposedAPI.getOperation!(null as any);
        expect(op).toBeNull();
        expect(mockIpcRenderer.invoke).not.toHaveBeenCalled();
    });
});
