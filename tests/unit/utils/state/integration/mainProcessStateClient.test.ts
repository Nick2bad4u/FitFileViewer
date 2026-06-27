import { describe, expect, it, vi } from "vitest";

import {
    MainProcessStateClient,
    type StateChangeEvent,
} from "../../../../../electron-app/utils/state/integration/mainProcessStateClient.js";
import type { RendererElectronApiScope } from "../../../../../electron-app/utils/runtime/electronApiRuntime.js";

type MainStateClientApi = {
    getErrors: ReturnType<typeof vi.fn<(limit: number) => Promise<unknown[]>>>;
    getMainState: ReturnType<typeof vi.fn<(path?: string) => Promise<unknown>>>;
    getMetrics: ReturnType<typeof vi.fn<() => Promise<unknown>>>;
    getOperation: ReturnType<
        typeof vi.fn<(operationId: string) => Promise<unknown>>
    >;
    getOperations: ReturnType<typeof vi.fn<() => Promise<unknown>>>;
    listenToMainState: ReturnType<
        typeof vi.fn<
            (
                path: string,
                callback: (change: StateChangeEvent) => void
            ) => Promise<boolean>
        >
    >;
    setMainState: ReturnType<
        typeof vi.fn<
            (path: string, value: unknown, options: unknown) => Promise<boolean>
        >
    >;
};

function createElectronApiScope(api: unknown): RendererElectronApiScope {
    return {
        getElectronAPI: () => api,
    };
}

function createClientApi(): MainStateClientApi {
    return {
        getErrors: vi.fn<(limit: number) => Promise<unknown[]>>(),
        getMainState: vi.fn<(path?: string) => Promise<unknown>>(),
        getMetrics: vi.fn<() => Promise<unknown>>(),
        getOperation: vi.fn<(operationId: string) => Promise<unknown>>(),
        getOperations: vi.fn<() => Promise<unknown>>(),
        listenToMainState:
            vi.fn<
                (
                    path: string,
                    callback: (change: StateChangeEvent) => void
                ) => Promise<boolean>
            >(),
        setMainState:
            vi.fn<
                (
                    path: string,
                    value: unknown,
                    options: unknown
                ) => Promise<boolean>
            >(),
    };
}

describe(MainProcessStateClient, () => {
    it("uses an explicit renderer Electron API scope for main-state operations", async () => {
        expect.assertions(20);

        const api = createClientApi();
        api.getMainState.mockImplementation(async (path?: string) => {
            if (path === "loadedFitFilePath") {
                return "C:/rides/demo.fit";
            }
            if (path === "gyazoServerPort") {
                return 44817;
            }
            if (path === "gyazoServer") {
                return { running: true };
            }
            return { ok: true };
        });
        api.getErrors.mockResolvedValue([{ message: "boom" }]);
        api.getMetrics.mockResolvedValue({ durationMs: 12 });
        api.getOperation.mockResolvedValue({ id: "decode" });
        api.getOperations.mockResolvedValue({ decode: { progress: 1 } });
        api.listenToMainState.mockResolvedValue(true);
        api.setMainState.mockResolvedValue(true);

        const electronApiScope = createElectronApiScope(api);
        const client = new MainProcessStateClient({ electronApiScope });

        expect(client.isAvailable()).toBe(true);
        await expect(client.get()).resolves.toStrictEqual({ ok: true });
        await expect(client.getLoadedFilePath()).resolves.toBe(
            "C:/rides/demo.fit"
        );
        await expect(client.getGyazoServerState()).resolves.toStrictEqual({
            port: 44817,
            server: { running: true },
        });
        await expect(client.getDiagnostics()).resolves.toStrictEqual({
            errors: [{ message: "boom" }],
            metrics: { durationMs: 12 },
            operations: { decode: { progress: 1 } },
        });
        await expect(client.getOperation("decode")).resolves.toStrictEqual({
            id: "decode",
        });
        await expect(
            client.setLoadedFilePath("C:/rides/demo.fit")
        ).resolves.toBe(true);

        const callback = vi.fn<(change: StateChangeEvent) => void>();
        const unsubscribe = await client.listen("loadedFitFilePath", callback);
        unsubscribe();

        expect(api.getMainState).toHaveBeenCalledWith(undefined);
        expect(api.getMainState).toHaveBeenCalledWith("loadedFitFilePath");
        expect(api.getErrors).toHaveBeenCalledWith(50);
        expect(api.getOperation).toHaveBeenCalledWith("decode");
        expect(api.setMainState).toHaveBeenCalledWith(
            "loadedFitFilePath",
            "C:/rides/demo.fit",
            { source: "renderer" }
        );
        expect(api.listenToMainState).toHaveBeenCalledWith(
            "loadedFitFilePath",
            callback
        );
        await expect(
            client.listen("loadedFitFilePath", "bad" as never)
        ).rejects.toThrow("Callback must be a function");
        await expect(client.getMainWindow()).resolves.toStrictEqual({
            ok: true,
        });
        await expect(client.get("restrictedPath" as never)).rejects.toThrow(
            "Unknown readable main process state path: restrictedPath"
        );
        await expect(
            client.listen("restrictedPath" as never, callback)
        ).rejects.toThrow(
            "Unknown listenable main process state path: restrictedPath"
        );
        await expect(
            client.listen("operations.__proto__.polluted" as never, callback)
        ).rejects.toThrow(
            "Unknown listenable main process state path: operations.__proto__.polluted"
        );
        await expect(
            client.set("restrictedPath" as never, "value")
        ).resolves.toBe(false);
        expect(api.setMainState).toHaveBeenCalledTimes(1);
    });

    it("stays unavailable when the scoped API is missing", async () => {
        expect.assertions(3);

        const consoleWarn = vi
            .spyOn(console, "warn")
            .mockImplementation(() => {});
        const client = new MainProcessStateClient({
            electronApiScope: createElectronApiScope(null),
        });

        expect(client.isAvailable()).toBe(false);
        await expect(client.get()).rejects.toThrow(
            "MainProcessStateClient is not available"
        );
        expect(consoleWarn).toHaveBeenCalledWith(
            "[MainProcessStateClient] electronAPI not available - client will be in degraded mode"
        );

        consoleWarn.mockRestore();
    });

    it("stays unavailable when the scoped API is malformed", async () => {
        expect.assertions(4);

        const consoleWarn = vi
            .spyOn(console, "warn")
            .mockImplementation(() => {});
        const untouchedGetMetrics = vi.fn<() => Promise<unknown>>();
        const client = new MainProcessStateClient({
            electronApiScope: createElectronApiScope({
                ...createClientApi(),
                getMainState: "not-callable",
                getMetrics: untouchedGetMetrics,
            }),
        });

        expect(client.isAvailable()).toBe(false);
        await expect(client.get()).rejects.toThrow(
            "MainProcessStateClient is not available"
        );
        expect(untouchedGetMetrics).not.toHaveBeenCalled();
        expect(consoleWarn).toHaveBeenCalledWith(
            "[MainProcessStateClient] electronAPI not available - client will be in degraded mode"
        );

        consoleWarn.mockRestore();
    });
});
