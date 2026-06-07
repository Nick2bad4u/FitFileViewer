import { createRequire } from "node:module";

import { describe, expect, it, vi } from "vitest";

interface IpcRendererMock {
    invoke: ReturnType<
        typeof vi.fn<(channel: string, ...args: unknown[]) => Promise<unknown>>
    >;
    off?: ReturnType<
        typeof vi.fn<
            (channel: string, listener: (...args: unknown[]) => void) => void
        >
    >;
    on: ReturnType<
        typeof vi.fn<
            (channel: string, listener: (...args: unknown[]) => void) => void
        >
    >;
    removeAllListeners?: ReturnType<typeof vi.fn<(channel: string) => void>>;
    removeListener?: ReturnType<
        typeof vi.fn<
            (channel: string, listener: (...args: unknown[]) => void) => void
        >
    >;
    send: ReturnType<
        typeof vi.fn<(channel: string, ...args: unknown[]) => void>
    >;
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
    "../../electron-app/preload/ipcHelpers.js"
) as PreloadIpcHelpersModule;

function createIpcRendererMock(): IpcRendererMock {
    return {
        invoke: vi.fn<
            (channel: string, ...args: unknown[]) => Promise<unknown>
        >(),
        on: vi.fn<
            (channel: string, listener: (...args: unknown[]) => void) => void
        >(),
        removeListener:
            vi.fn<
                (
                    channel: string,
                    listener: (...args: unknown[]) => void
                ) => void
            >(),
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
        const invokeError = new Error("invoke failed");
        ipcRenderer.invoke.mockRejectedValueOnce(invokeError);

        await expect(
            helpers.createSafeInvokeHandler(
                "clipboard:writeText",
                "testInvoke"
            )("payload")
        ).rejects.toThrow("invoke failed");

        expect(ipcRenderer.invoke).toHaveBeenCalledWith(
            "clipboard:writeText",
            "payload"
        );
        expect(preloadLog).toHaveBeenCalledWith(
            "error",
            "[preload.js] Error in testInvoke:",
            invokeError
        );
        expect(
            preloadLog.mock.calls.filter(([level]) => level === "warn")
        ).toStrictEqual([]);
    });

    it("rethrows readFile ENOENT failures without logging preload noise", async () => {
        expect.assertions(4);

        const { helpers, ipcRenderer, preloadLog } = createHelpers();
        const missingFileError = new Error(
            "ENOENT: no such file or directory, open 'missing.fit'"
        );
        const codedMissingFileError = new Error("File not found");
        Object.defineProperty(codedMissingFileError, "code", {
            configurable: true,
            value: "ENOENT",
        });
        ipcRenderer.invoke
            .mockRejectedValueOnce(missingFileError)
            .mockRejectedValueOnce(codedMissingFileError);

        await expect(
            helpers.createSafeInvokeHandler(
                "file:read",
                "readFile"
            )("missing.fit")
        ).rejects.toThrow("ENOENT");
        await expect(
            helpers.createSafeInvokeHandler(
                "file:read",
                "readFile"
            )("coded-missing.fit")
        ).rejects.toThrow("File not found");

        expect(ipcRenderer.invoke.mock.calls).toStrictEqual([
            ["file:read", "missing.fit"],
            ["file:read", "coded-missing.fit"],
        ]);
        expect(preloadLog).not.toHaveBeenCalled();
    });

    it("rejects invalid invoke payloads before reaching IPC", async () => {
        expect.assertions(9);

        const { helpers, ipcRenderer, preloadLog } = createHelpers();

        await expect(
            helpers.createSafeInvokeHandler("file:read", "readFile")(null)
        ).rejects.toThrow("file:read: expected one non-empty string argument");
        await expect(
            helpers.createSafeInvokeHandler(
                "browser:setEnabled",
                "setFitBrowserEnabled"
            )("true")
        ).rejects.toThrow("browser:setEnabled: expected one boolean argument");
        await expect(
            helpers.createSafeInvokeHandler(
                "fit:parse",
                "parseFitFile"
            )("bytes")
        ).rejects.toThrow("fit:parse: expected one ArrayBuffer argument");
        await expect(
            helpers.createSafeInvokeHandler(
                "gyazo:server:start",
                "startGyazoServer"
            )(70_000)
        ).rejects.toThrow("gyazo:server:start: expected one TCP port number");
        await expect(
            helpers.createSafeInvokeHandler("main-state:set", "setMainState")(
                "ui.theme",
                () => "dark"
            )
        ).rejects.toThrow(
            "main-state:set: expected a state path, serializable value, and optional serializable options"
        );
        await expect(
            helpers.createSafeInvokeHandler("main-state:set", "setMainState")(
                "fit.bytes",
                new ArrayBuffer(8)
            )
        ).rejects.toThrow(
            "main-state:set: expected a state path, serializable value, and optional serializable options"
        );
        await expect(
            helpers.createSafeInvokeHandler("unknown:invoke", "unknownInvoke")()
        ).rejects.toThrow("unknown:invoke: is not an allowed invoke channel");

        expect(ipcRenderer.invoke).not.toHaveBeenCalled();
        expect(preloadLog).toHaveBeenCalledTimes(7);
    });

    it("sends IPC and logs send failures without throwing", () => {
        expect.assertions(3);

        const { helpers, ipcRenderer, preloadLog } = createHelpers();
        const sendError = new Error("send failed");
        ipcRenderer.send.mockImplementationOnce(() => {
            throw sendError;
        });

        const returnValue = helpers.createSafeSendHandler(
            "app:test",
            "testSend"
        )("payload");

        expect(returnValue).toBeUndefined();
        expect(ipcRenderer.send).toHaveBeenCalledWith("app:test", "payload");
        expect(preloadLog).toHaveBeenCalledWith(
            "error",
            "[preload.js] Error in testSend:",
            sendError
        );
    });

    it("subscribes to events, transforms payloads, and removes listeners", () => {
        expect.assertions(6);

        const { helpers, ipcRenderer, validateCallback } = createHelpers();
        const receivedPayloads: unknown[] = [];
        const callback = vi.fn<(value: unknown) => void>((value) => {
            receivedPayloads.push(value);
        });
        const unsubscribe = helpers.createSafeEventHandler(
            "app:event",
            "onEvent",
            (value) => ({ value })
        )(callback);
        const [registeredChannel, listener] =
            ipcRenderer.on.mock.calls[0] ?? [];

        expect(validateCallback).toHaveBeenCalledWith(callback, "onEvent");
        expect(ipcRenderer.on).toHaveBeenCalledOnce();
        expect(registeredChannel).toBe("app:event");

        listener({}, "payload");

        expect(callback).toHaveBeenCalledWith({ value: "payload" });
        expect(receivedPayloads).toStrictEqual([{ value: "payload" }]);

        unsubscribe();

        expect(ipcRenderer.removeListener).toHaveBeenCalledWith(
            "app:event",
            listener
        );
    });

    it("returns a no-op unsubscribe when callback validation fails", () => {
        expect.assertions(4);

        const { helpers, ipcRenderer, preloadLog, validateCallback } =
            createHelpers();
        validateCallback.mockReturnValueOnce(false);

        const invalidCallback = () => undefined;
        const unsubscribe = helpers.createSafeEventHandler(
            "app:event",
            "onEvent"
        )(invalidCallback);

        expect(unsubscribe()).toBeUndefined();
        expect(ipcRenderer.on).not.toHaveBeenCalled();
        expect(preloadLog).not.toHaveBeenCalled();
        expect(validateCallback).toHaveBeenCalledWith(
            invalidCallback,
            "onEvent"
        );
    });
});
