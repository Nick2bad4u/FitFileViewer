import { beforeEach, afterEach, describe, it, expect, vi } from "vitest";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const MODULE_PATH = path.resolve(__dirname, "../../../../../utils/files/import/fitParserIntegration.js");
const MODULE_URL = pathToFileURL(MODULE_PATH).href;

describe("fitParserIntegration IPC wiring", () => {
    beforeEach(() => {
        vi.resetModules();
        vi.clearAllMocks();
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it("registers IPC handlers and delegates to helper functions", async () => {
        const module = await import(MODULE_URL);
        const ipcMain = { handle: vi.fn() };

        module.setupFitParserIPC(ipcMain as any);

        expect(ipcMain.handle).toHaveBeenCalledTimes(4);
        const handlers = Object.fromEntries(ipcMain.handle.mock.calls.map(([channel, handler]) => [channel, handler]));

        const arrayBuffer = new ArrayBuffer(8);
        await expect(handlers["fit:decode"]({}, arrayBuffer, { flag: true })).resolves.toBeDefined();

        const updateResult = await handlers["update-decoder-options"]({}, { foo: 1 });
        expect(updateResult).toMatchObject({ success: expect.any(Boolean) });

        const optionsResult = await handlers["get-decoder-options"]({});
        expect(optionsResult).not.toBeNull();

        const resetResult = await handlers["reset-decoder-options"]({});
        expect(resetResult).toMatchObject({ success: expect.any(Boolean) });
    });

    it("exposes preload APIs with proper normalization", async () => {
        const module = await import(MODULE_URL);
        const exposeSpy = vi.fn();
        const invokeSpy = vi.fn();
        vi.spyOn(console, "log").mockImplementation(() => {});

        module.setupFitParserPreload({ exposeInMainWorld: exposeSpy } as any, { invoke: invokeSpy } as any);

        expect(exposeSpy).toHaveBeenCalledTimes(1);
        const [key, api] = exposeSpy.mock.calls[0];
        expect(key).toBe("fitParser");

        const arrayBuffer = new ArrayBuffer(4);
        await api.decodeFitFile(arrayBuffer, { test: true });
        expect(invokeSpy).toHaveBeenNthCalledWith(1, "fit:decode", expect.any(Uint8Array), { test: true });

        await api.getDecoderOptions();
        expect(invokeSpy).toHaveBeenNthCalledWith(2, "get-decoder-options");

        await api.resetDecoderOptions();
        expect(invokeSpy).toHaveBeenNthCalledWith(3, "reset-decoder-options");

        await api.updateDecoderOptions({ max: 5 });
        expect(invokeSpy).toHaveBeenNthCalledWith(4, "update-decoder-options", { max: 5 });
    });
});
