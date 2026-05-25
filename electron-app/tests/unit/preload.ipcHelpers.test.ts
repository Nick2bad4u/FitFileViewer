import { createRequire } from "node:module";

import { describe, expect, it, vi } from "vitest";

interface IpcRendererMock {
    invoke: ReturnType<typeof vi.fn<(channel: string, ...args: unknown[]) => Promise<unknown>>>;
    off?: ReturnType<typeof vi.fn<(channel: string, listener: (...args: unknown[]) => void) => void>>;
    on: ReturnType<typeof vi.fn<(channel: string, listener: (...args: unknown[]) => void) => void>>;
    removeAllListeners?: ReturnType<typeof vi.fn<(channel: string) => void>>;
    removeListener?: ReturnType<typeof vi.fn<(channel: string, listener: (...args: unknown[]) => void) => void>>;
    send: ReturnType<typeof vi.fn<(channel: string, ...args: unknown[]) => void>>;
}

interface PreloadIpcHelpersModule {
    createPreloadIpcHelpers: (options: {
        ipcRenderer: IpcRendererMock;
        preloadLog: (
            level: "error" | "info" | "warn",
            message: string,
            ...details: unknown[]
        ) => void;
        validateCallback: (
            callback: unknown,
            methodName: string
        ) => callback is (...args: unknown[]) => unknown;
    }) => {
        createSafeEventHandler: (
            channel: string,
            methodName: string,
            transform?: (...args: unknown[]) => null | unknown
        ) => (callback: (...args: unknown[]) => unknown) => () => void;
        createSafeInvokeHandler: (
            channel: string,
            methodName: string
        ) => (...args: unknown[]) => Promise<unknown>;
        createSafeSendHandler: (
            channel: string,
            methodName: string
        ) => (...args: unknown[]) => void;
        removeIpcListener: (
            channel: string,
            handler: (...args: unknown[]) => void
        ) => void;
    };
}

const requireFromTest = createRequire(import.meta.url);
const { createPreloadIpcHelpers } = requireFromTest(
    "../../preload/ipcHelpers.js"
) as PreloadIpcHelpersModule;

function createIpcRendererMock(): IpcRendererMock {
    return {
        invoke: vi.fn<(channel: string, ...args: unknown[]) => Promise<unknown>>(),
        on: vi.fn<(channel: string, listener: (...args: unknown[]) => void) => void>(),
        removeListener:
            vi.fn<(channel: string, listener: (...args: unknown[]) => void) => void>(),
        send: vi.fn<(channel: string, ...args: unknown[]) => void>(),
    };
}

function createHelpers(ipcRenderer = createIpcRendererMock()) {
    const preloadLog =
        vi.fn<
            (
                level: "error" | "info" | "warn",
                message: string,
                ...details: unknown[]
            ) => void
        >();
    const validateCallback = vi.fn<
        (
            callback: unknown,
            methodName: string
        ) => callback is (...args: unknown[]) => unknown
    >((callback): callback is (...args: unknown[]) => unknown => {
        return typeof callback === "function";
    });

    return {
        helpers: createPreloadIpcHelpers({
            ipcRenderer,
            preloadLog,
            validateCallback,
        }),
        ipcRenderer,
        preloadLog,
        validateCallback,
    };
}

describe("preload IPC helpers", () => {
    it("invokes IPC and logs before rethrowing invoke failures", async () => {
        expect.assertions(4);

        const { helpers, ipcRenderer, preloadLog } = createHelpers();
        ipcRenderer.invoke.mockRejectedValueOnce(new Error("invoke failed"));

        await expect(
            helpers.createSafeInvokeHandler("app:test", "testInvoke")("payload")
        ).rejects.toThrow("invoke failed");

        expect(ipcRenderer.invoke).toHaveBeenCalledWith("app:test", "payload");
        expect(preloadLog).toHaveBeenCalledWith(
            "error",
            "[preload.js] Error in testInvoke:",
            expect.any(Error)
        );
        expect(preloadLog).not.toHaveBeenCalledWith("warn", expect.anything());
    });

    it("rethrows readFile ENOENT failures without logging preload noise", async () => {
        expect.assertions(3);

        const { helpers, ipcRenderer, preloadLog } = createHelpers();
        ipcRenderer.invoke.mockRejectedValueOnce(
            new Error("ENOENT: no such file or directory, open 'missing.fit'")
        );

        await expect(
            helpers.createSafeInvokeHandler("file:read", "readFile")(
                "missing.fit"
            )
        ).rejects.toThrow("ENOENT");

        expect(ipcRenderer.invoke).toHaveBeenCalledWith(
            "file:read",
            "missing.fit"
        );
        expect(preloadLog).not.toHaveBeenCalled();
    });

    it("sends IPC and logs send failures without throwing", () => {
        expect.assertions(2);

        const { helpers, ipcRenderer, preloadLog } = createHelpers();
        ipcRenderer.send.mockImplementationOnce(() => {
            throw new Error("send failed");
        });

        expect(() =>
            helpers.createSafeSendHandler("app:test", "testSend")("payload")
        ).not.toThrow();

        expect(preloadLog).toHaveBeenCalledWith(
            "error",
            "[preload.js] Error in testSend:",
            expect.any(Error)
        );
    });

    it("subscribes to events, transforms payloads, and removes listeners", () => {
        expect.assertions(5);

        const { helpers, ipcRenderer } = createHelpers();
        const callback = vi.fn<(value: unknown) => void>();
        const unsubscribe = helpers.createSafeEventHandler(
            "app:event",
            "onEvent",
            (value) => ({ value })
        )(callback);
        const listener = ipcRenderer.on.mock.calls[0]?.[1];

        expect(ipcRenderer.on).toHaveBeenCalledWith(
            "app:event",
            expect.any(Function)
        );

        listener?.({}, "payload");

        expect(callback).toHaveBeenCalledWith({ value: "payload" });

        unsubscribe();

        expect(ipcRenderer.removeListener).toHaveBeenCalledWith(
            "app:event",
            listener
        );
        expect(ipcRenderer.off).toBeUndefined();
        expect(ipcRenderer.removeAllListeners).toBeUndefined();
    });

    it("returns a no-op unsubscribe when callback validation fails", () => {
        expect.assertions(3);

        const { helpers, ipcRenderer, validateCallback } = createHelpers();
        validateCallback.mockReturnValueOnce(false);

        const unsubscribe = helpers.createSafeEventHandler(
            "app:event",
            "onEvent"
        )(() => undefined);

        expect(unsubscribe()).toBeUndefined();
        expect(ipcRenderer.on).not.toHaveBeenCalled();
        expect(validateCallback).toHaveBeenCalledWith(
            expect.any(Function),
            "onEvent"
        );
    });
});
