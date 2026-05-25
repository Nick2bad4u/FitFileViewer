/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

/**
 * Simplified interface for ElectronAPI with only the methods we test
 */
interface TestElectronAPI {
    [key: string]: unknown;
    getOperation?: (operationId: string) => Promise<unknown>;
    invoke: (channel: string, ...args: unknown[]) => Promise<unknown>;
    openFile: () => Promise<string[]>;
    parseFitFile: (buffer: ArrayBuffer) => Promise<unknown>;
    readFile: (filePath: string) => Promise<ArrayBuffer>;
    setMainState?: (
        path: string,
        value: unknown,
        options?: unknown
    ) => Promise<boolean>;
    validateAPI: () => boolean;
}

type ContextBridgeMock = {
    exposeInMainWorld: ReturnType<typeof vi.fn>;
};

type IpcRendererMock = {
    invoke: ReturnType<typeof vi.fn>;
    on: ReturnType<typeof vi.fn>;
    once: ReturnType<typeof vi.fn>;
    removeAllListeners: ReturnType<typeof vi.fn>;
    removeListener: ReturnType<typeof vi.fn>;
    send: ReturnType<typeof vi.fn>;
};

describe("Simple Electron Mock Test", () => {
    // Setup mocks
    let mockIpcRenderer: IpcRendererMock;
    let mockContextBridge: ContextBridgeMock;
    let exposedElectronAPI: TestElectronAPI | undefined;
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

        vi.spyOn(console, "log").mockImplementation(() => {});
        vi.spyOn(console, "error").mockImplementation(() => {});
    });

    afterEach(() => {
        vi.restoreAllMocks();
        vi.resetModules();
        Reflect.deleteProperty(globalThis, "__electronHoistedMock");
        process.env.NODE_ENV = originalNodeEnv;
    });

    async function createPreloadEnvironment(
        options: Partial<NodeJS.ProcessEnv> = {}
    ) {
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

        const calls = mockContextBridge.exposeInMainWorld.mock.calls as [
            string,
            TestElectronAPI,
        ][];
        exposedElectronAPI = calls[0]?.[1];

        return {
            exposedAPI: exposedElectronAPI,
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
        await expect(exposedAPI.invoke(null as unknown as string)).rejects.toThrow(
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

        const ok = await exposedAPI.setMainState!(
            null as unknown as string,
            "value"
        );
        expect(ok).toBe(false);
        expect(mockIpcRenderer.invoke).not.toHaveBeenCalled();
    });

    it("should reject invalid operationId locally (no IPC)", async () => {
        const { exposedAPI } = await createPreloadEnvironment();

        expect(typeof exposedAPI.getOperation).toBe("function");
        mockIpcRenderer.invoke.mockClear();

        const op = await exposedAPI.getOperation!(null as unknown as string);
        expect(op).toBeNull();
        expect(mockIpcRenderer.invoke).not.toHaveBeenCalled();
    });
});
