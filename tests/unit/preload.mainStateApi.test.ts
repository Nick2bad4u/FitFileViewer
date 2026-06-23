import { describe, expect, it, vi } from "vitest";

import type {
    GenericInvokeChannel,
    InvokeRequestArgs,
    InvokeResponsePayloadForChannel,
    MainStateChange,
    MainStateListener,
    MainStateSetOptions,
    MainStateSetValue,
} from "../../electron-app/shared/ipc";
import { createMainStateApi } from "../../electron-app/preload/mainStateApi.js";

function createApi() {
    const invoke =
        vi.fn<(channel: string, ...args: unknown[]) => Promise<unknown>>();
    const createSafeInvokeHandler = vi.fn(
        <Channel extends GenericInvokeChannel>(
            channel: Channel,
            _methodName: string
        ) =>
            (
                ...args: InvokeRequestArgs<Channel>
            ): Promise<InvokeResponsePayloadForChannel<Channel>> =>
                invoke(channel, ...args) as Promise<
                    InvokeResponsePayloadForChannel<Channel>
                >
    );
    const preloadLog =
        vi.fn<
            (
                level: "error" | "info" | "warn",
                message: string,
                ...details: unknown[]
            ) => void
        >();
    const listenToMainState =
        vi.fn<
            (path: string, callback: MainStateListener) => Promise<boolean>
        >();
    const unlistenFromMainState =
        vi.fn<
            (path: string, callback: MainStateListener) => Promise<boolean>
        >();

    return {
        api: createMainStateApi({
            createSafeInvokeHandler,
            mainStateBridge: {
                listenToMainState,
                unlistenFromMainState,
            },
            preloadLog,
            validateCallback: (
                callback: unknown
            ): callback is (...args: unknown[]) => unknown =>
                typeof callback === "function",
            validateRequiredNonEmptyString: (value: unknown): value is string =>
                typeof value === "string" && value.trim().length > 0,
        }),
        createSafeInvokeHandler,
        invoke,
        listenToMainState,
        preloadLog,
        unlistenFromMainState,
    };
}

describe("preload main-state API", () => {
    it("invokes read-only main-state channels with their expected payloads", async () => {
        expect.assertions(6);

        const { api, invoke } = createApi();
        invoke
            .mockResolvedValueOnce(["error"])
            .mockResolvedValueOnce("state-value")
            .mockResolvedValueOnce({ pending: 1 })
            .mockResolvedValueOnce({ id: "op-1" })
            .mockResolvedValueOnce({ all: true });

        await expect(api.getErrors()).resolves.toStrictEqual(["error"]);
        await expect(api.getMainState("loadedFitFilePath")).resolves.toBe(
            "state-value"
        );
        await expect(api.getMetrics()).resolves.toStrictEqual({ pending: 1 });
        await expect(api.getOperation("op-1")).resolves.toStrictEqual({
            id: "op-1",
        });
        await expect(api.getOperations()).resolves.toStrictEqual({ all: true });

        expect(invoke.mock.calls).toStrictEqual([
            ["main-state:errors", 50],
            ["main-state:get", "loadedFitFilePath"],
            ["main-state:metrics"],
            ["main-state:operation", "op-1"],
            ["main-state:operations"],
        ]);
    });

    it("validates operation and state mutation inputs before invoking IPC", async () => {
        expect.assertions(4);

        const { api, invoke } = createApi();

        await expect(api.getOperation("")).resolves.toBeNull();

        const invalidSetResult = await api.setMainState("", "value");

        expect({
            invalidSetResult,
            invokeCalls: invoke.mock.calls,
        }).toStrictEqual({
            invalidSetResult: false,
            invokeCalls: [],
        });
        expect(invoke).not.toHaveBeenCalled();

        invoke.mockResolvedValueOnce(true);
        const validSetResult = await api.setMainState(
            "loadedFitFilePath",
            "activity.fit",
            {
                source: "test",
            }
        );

        expect({
            invokeCalls: invoke.mock.calls,
            validSetResult,
        }).toStrictEqual({
            invokeCalls: [
                [
                    "main-state:set",
                    "loadedFitFilePath",
                    "activity.fit",
                    {
                        source: "test",
                    },
                ],
            ],
            validSetResult: true,
        });
    });

    it("delegates main-state listener lifecycle through the bridge", async () => {
        expect.assertions(5);

        const { api, listenToMainState, unlistenFromMainState } = createApi();
        const callback = vi.fn<(change: MainStateChange) => void>();
        listenToMainState.mockResolvedValueOnce(true);
        unlistenFromMainState.mockResolvedValueOnce(true);

        const unsubscribe = await api.subscribeToMainState(
            "loadedFitFilePath",
            callback
        );
        const unsubscribeResult = await unsubscribe();

        expect(unsubscribe).toBeTypeOf("function");
        expect({
            unsubscribeResult,
        }).toStrictEqual({
            unsubscribeResult: true,
        });
        expect(listenToMainState).toHaveBeenCalledWith(
            "loadedFitFilePath",
            callback
        );
        expect(unlistenFromMainState).toHaveBeenCalledWith(
            "loadedFitFilePath",
            callback
        );
        expect(callback).not.toHaveBeenCalled();
    });

    it("returns a false unsubscribe when listener registration is rejected", async () => {
        expect.assertions(3);

        const { api, listenToMainState, unlistenFromMainState } = createApi();
        listenToMainState.mockResolvedValueOnce(false);

        const unsubscribe = await api.subscribeToMainState(
            "loadedFitFilePath",
            vi.fn<(change: MainStateChange) => void>()
        );
        const unsubscribeResult = await unsubscribe();

        expect({
            unsubscribeResult,
        }).toStrictEqual({
            unsubscribeResult: false,
        });
        expect(listenToMainState).toHaveBeenCalledOnce();
        expect(unlistenFromMainState).not.toHaveBeenCalled();
    });

    it("logs and rethrows main-state IPC failures", async () => {
        expect.assertions(3);

        const { api, invoke, preloadLog } = createApi();
        const metricsError = new Error("metrics failed");
        invoke.mockRejectedValueOnce(metricsError);

        await expect(api.getMetrics()).rejects.toThrow("metrics failed");

        expect(preloadLog).toHaveBeenCalledWith(
            "error",
            "[preload.js] Error in getMetrics:",
            metricsError
        );
        expect(invoke).toHaveBeenCalledWith("main-state:metrics");
    });
});
