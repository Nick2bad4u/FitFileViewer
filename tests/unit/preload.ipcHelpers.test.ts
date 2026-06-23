import { describe, expect, it, vi } from "vitest";
import { createPreloadIpcHelpers } from "../../electron-app/preload/ipcHelpers.js";
import { validateDevtoolsInjectMenuPayload } from "../../electron-app/shared/devtoolsMenuPolicy.js";
import { validateExternalUrl } from "../../electron-app/shared/externalUrlPolicy.js";
import {
    validateFitBrowserRelativePath,
    validateFitBrowserRootFolderPath,
} from "../../electron-app/shared/fitBrowserPathPolicy.js";
import { validateFitFilePathInput } from "../../electron-app/shared/fitFilePathPolicy.js";
import {
    validateMainStateOperationIdInput,
    validateMainStatePathInput,
} from "../../electron-app/shared/mainStatePathPolicy.js";

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

function createHelpers(
    ipcRenderer: IpcRendererMock | null = createIpcRendererMock()
) {
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
            validateDevtoolsInjectMenuPayload,
            validateExternalUrl,
            validateFitBrowserRelativePath,
            validateFitBrowserRootFolderPath,
            validateFitFilePathInput,
            validateMainStateOperationIdInput,
            validateMainStatePathInput,
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
            )("C:/rides/missing.fit")
        ).rejects.toThrow("ENOENT");
        await expect(
            helpers.createSafeInvokeHandler(
                "file:read",
                "readFile"
            )("C:/rides/coded-missing.fit")
        ).rejects.toThrow("File not found");

        expect(ipcRenderer.invoke.mock.calls).toStrictEqual([
            ["file:read", "C:/rides/missing.fit"],
            ["file:read", "C:/rides/coded-missing.fit"],
        ]);
        expect(preloadLog).not.toHaveBeenCalled();
    });

    it("logs unavailable IPC renderer operations through safe wrappers", async () => {
        expect.assertions(4);

        const { helpers, preloadLog } = createHelpers(null);

        await expect(
            helpers.createSafeInvokeHandler("theme:get", "getTheme")()
        ).rejects.toThrow("ipcRenderer.invoke unavailable");
        helpers.createSafeSendHandler("menu-export", "requestExport")();
        const unsubscribe = helpers.createSafeEventHandler(
            "menu-open-file",
            "onMenuOpenFile"
        )(vi.fn());

        expect(unsubscribe()).toBeUndefined();
        expect(preloadLog).toHaveBeenCalledTimes(3);
        expect(
            preloadLog.mock.calls.map(
                ([
                    level,
                    message,
                    error,
                ]) => ({
                    errorMessage:
                        error instanceof Error ? error.message : undefined,
                    level,
                    message,
                })
            )
        ).toStrictEqual([
            {
                errorMessage: "ipcRenderer.invoke unavailable",
                level: "error",
                message: "[preload.js] Error in getTheme:",
            },
            {
                errorMessage: "ipcRenderer.send unavailable",
                level: "error",
                message: "[preload.js] Error in requestExport:",
            },
            {
                errorMessage: "ipcRenderer.on unavailable",
                level: "error",
                message:
                    "[preload.js] Error setting up onMenuOpenFile event handler:",
            },
        ]);
    });

    it("allows browser root folder listings with an empty relative path", async () => {
        expect.assertions(3);

        const { helpers, ipcRenderer, preloadLog } = createHelpers();
        ipcRenderer.invoke.mockResolvedValueOnce({
            entries: [],
            root: "C:\\fit-files",
        });

        await expect(
            helpers.createSafeInvokeHandler(
                "browser:listFolder",
                "listFitBrowserFolder"
            )("")
        ).resolves.toStrictEqual({
            entries: [],
            root: "C:\\fit-files",
        });

        expect(ipcRenderer.invoke).toHaveBeenCalledWith(
            "browser:listFolder",
            ""
        );
        expect(preloadLog).not.toHaveBeenCalled();
    });

    it("validates Browser folder paths before reaching IPC", async () => {
        expect.assertions(9);

        const { helpers, ipcRenderer, preloadLog } = createHelpers();
        const listFolder = helpers.createSafeInvokeHandler(
            "browser:listFolder",
            "listFitBrowserFolder"
        );
        const setFolder = helpers.createSafeInvokeHandler(
            "browser:setFolder",
            "setFitBrowserFolder"
        );

        ipcRenderer.invoke
            .mockResolvedValueOnce({ entries: [], root: "C:\\rides" })
            .mockResolvedValueOnce(true);

        await expect(listFolder("2026/June")).resolves.toStrictEqual({
            entries: [],
            root: "C:\\rides",
        });
        await expect(setFolder("C:/rides")).resolves.toBe(true);
        await expect(listFolder("../hidden")).rejects.toThrow(
            "Browser relative path traversal is not allowed"
        );
        await expect(listFolder("C:/rides")).rejects.toThrow(
            "Browser relative path must stay within root"
        );
        await expect(listFolder("rides/\u0000bad")).rejects.toThrow(
            "Invalid Browser relative path provided"
        );
        await expect(setFolder("rides")).rejects.toThrow(
            "Browser root folder must be an absolute path"
        );
        await expect(setFolder("C:/rides/\u0000bad")).rejects.toThrow(
            "Invalid Browser root folder provided"
        );

        expect(ipcRenderer.invoke.mock.calls).toStrictEqual([
            ["browser:listFolder", "2026/June"],
            ["browser:setFolder", "C:/rides"],
        ]);
        expect(preloadLog).toHaveBeenCalledTimes(5);
    });

    it("validates FIT file paths before reaching file IPC channels", async () => {
        expect.assertions(10);

        const { helpers, ipcRenderer, preloadLog } = createHelpers();
        const readFile = helpers.createSafeInvokeHandler(
            "file:read",
            "readFile"
        );
        const addRecentFile = helpers.createSafeInvokeHandler(
            "recentFiles:add",
            "addRecentFile"
        );
        const approveRecentFile = helpers.createSafeInvokeHandler(
            "recentFiles:approve",
            "approveRecentFile"
        );

        ipcRenderer.invoke
            .mockResolvedValueOnce(new ArrayBuffer(4))
            .mockResolvedValueOnce(["C:/rides/activity.fit"])
            .mockResolvedValueOnce(false);

        await expect(readFile("C:/rides/activity.fit")).resolves.toBeInstanceOf(
            ArrayBuffer
        );
        await expect(
            addRecentFile("C:/rides/activity.fit")
        ).resolves.toStrictEqual(["C:/rides/activity.fit"]);
        await expect(approveRecentFile("C:/rides/activity.fit")).resolves.toBe(
            false
        );
        await expect(readFile("activity.fit")).rejects.toThrow(
            "Only absolute file paths are allowed"
        );
        await expect(readFile("file:///tmp/activity.fit")).rejects.toThrow(
            "Invalid file path provided"
        );
        await expect(readFile("C:/rides/\u0000bad.fit")).rejects.toThrow(
            "Invalid file path provided"
        );
        await expect(addRecentFile("recent.fit")).rejects.toThrow(
            "Only absolute file paths are allowed"
        );

        expect(ipcRenderer.invoke.mock.calls).toStrictEqual([
            ["file:read", "C:/rides/activity.fit"],
            ["recentFiles:add", "C:/rides/activity.fit"],
            ["recentFiles:approve", "C:/rides/activity.fit"],
        ]);
        expect(preloadLog).toHaveBeenCalledTimes(4);
        expect(
            preloadLog.mock.calls.map(
                ([
                    ,
                    ,
                    error,
                ]) => String(error)
            )
        ).toStrictEqual([
            "Error: Only absolute file paths are allowed",
            "Error: Invalid file path provided",
            "Error: Invalid file path provided",
            "Error: Only absolute file paths are allowed",
        ]);
    });

    it("validates main-state paths before reaching IPC", async () => {
        expect.assertions(11);

        const { helpers, ipcRenderer, preloadLog } = createHelpers();
        const getMainState = helpers.createSafeInvokeHandler(
            "main-state:get",
            "getMainState"
        );
        const listenToMainState = helpers.createSafeInvokeHandler(
            "main-state:listen",
            "listenToMainState"
        );
        const getOperation = helpers.createSafeInvokeHandler(
            "main-state:operation",
            "getOperation"
        );
        const setMainState = helpers.createSafeInvokeHandler(
            "main-state:set",
            "setMainState"
        );

        ipcRenderer.invoke
            .mockResolvedValueOnce(null)
            .mockResolvedValueOnce(true)
            .mockResolvedValueOnce({ id: "test-op" })
            .mockResolvedValueOnce(true);

        await expect(getMainState(" loadedFitFilePath ")).resolves.toBeNull();
        await expect(listenToMainState("loadedFitFilePath")).resolves.toBe(
            true
        );
        await expect(getOperation("test-op")).resolves.toStrictEqual({
            id: "test-op",
        });
        await expect(
            setMainState("operations.fitFile:decode", { progress: 1 })
        ).resolves.toBe(true);
        await expect(
            getMainState("operations.__proto__.polluted")
        ).rejects.toThrow("Unsafe main-state path provided");
        await expect(setMainState("ui..theme", "dark")).rejects.toThrow(
            "Invalid main-state path provided"
        );
        await expect(
            listenToMainState("constructor.prototype.polluted")
        ).rejects.toThrow("Unsafe main-state path provided");
        await expect(getOperation("operation.with.dot")).rejects.toThrow(
            "Invalid main-state operation id provided"
        );

        expect(ipcRenderer.invoke.mock.calls).toStrictEqual([
            ["main-state:get", " loadedFitFilePath "],
            ["main-state:listen", "loadedFitFilePath"],
            ["main-state:operation", "test-op"],
            [
                "main-state:set",
                "operations.fitFile:decode",
                { progress: 1 },
            ],
        ]);
        expect(preloadLog).toHaveBeenCalledTimes(4);
        expect(
            preloadLog.mock.calls.map(
                ([
                    ,
                    ,
                    error,
                ]) => String(error)
            )
        ).toStrictEqual([
            "Error: Unsafe main-state path provided",
            "TypeError: Invalid main-state path provided",
            "Error: Unsafe main-state path provided",
            "TypeError: Invalid main-state operation id provided",
        ]);
    });

    it("validates external URLs before reaching IPC", async () => {
        expect.assertions(10);

        const { helpers, ipcRenderer, preloadLog } = createHelpers();
        const openExternal = helpers.createSafeInvokeHandler(
            "shell:openExternal",
            "openExternal"
        );

        ipcRenderer.invoke
            .mockResolvedValueOnce(true)
            .mockResolvedValueOnce(true);

        const insecureHttpUrl = ["http", "://127.0.0.1"].join("");

        await expect(openExternal("https://example.com")).resolves.toBe(true);
        await expect(openExternal("mailto:test@example.com")).resolves.toBe(
            true
        );
        await expect(openExternal(insecureHttpUrl)).rejects.toThrow(
            "Only HTTPS and mailto URLs are allowed"
        );
        await expect(
            openExternal("file:///C:/Windows/System32/calc.exe")
        ).rejects.toThrow("Only HTTPS and mailto URLs are allowed");
        await expect(openExternal("javascript:alert(1)")).rejects.toThrow(
            "Only HTTPS and mailto URLs are allowed"
        );
        await expect(
            openExternal("https://user:pass@example.com")
        ).rejects.toThrow("Credentials in URLs are not allowed");
        await expect(openExternal("invalid-url")).rejects.toThrow(
            "Invalid URL provided"
        );

        expect(ipcRenderer.invoke.mock.calls).toStrictEqual([
            ["shell:openExternal", "https://example.com"],
            ["shell:openExternal", "mailto:test@example.com"],
        ]);
        expect(preloadLog).toHaveBeenCalledTimes(5);
        expect(
            preloadLog.mock.calls.map(
                ([
                    ,
                    ,
                    error,
                ]) => String(error)
            )
        ).toStrictEqual([
            "Error: Only HTTPS and mailto URLs are allowed",
            "Error: Only HTTPS and mailto URLs are allowed",
            "Error: Only HTTPS and mailto URLs are allowed",
            "Error: Credentials in URLs are not allowed",
            "TypeError: Invalid URL provided",
        ]);
    });

    it("validates devtools menu payloads before reaching IPC", async () => {
        expect.assertions(8);

        const { helpers, ipcRenderer, preloadLog } = createHelpers();
        const injectMenu = helpers.createSafeInvokeHandler(
            "devtools-inject-menu",
            "injectMenu"
        );

        ipcRenderer.invoke
            .mockResolvedValueOnce(true)
            .mockResolvedValueOnce(true);

        await expect(injectMenu("dark", "C:/rides/activity.fit")).resolves.toBe(
            true
        );
        await expect(injectMenu("system", null)).resolves.toBe(true);
        await expect(injectMenu("solarized", null)).rejects.toThrow(
            "Invalid devtools menu theme provided"
        );
        await expect(injectMenu("dark", "activity.fit")).rejects.toThrow(
            "Invalid devtools menu FIT file path provided"
        );
        await expect(
            injectMenu("dark", "C:/rides/\u0000bad.fit")
        ).rejects.toThrow("Invalid devtools menu FIT file path provided");

        expect(ipcRenderer.invoke.mock.calls).toStrictEqual([
            [
                "devtools-inject-menu",
                "dark",
                "C:/rides/activity.fit",
            ],
            [
                "devtools-inject-menu",
                "system",
                null,
            ],
        ]);
        expect(preloadLog).toHaveBeenCalledTimes(3);
        expect(
            preloadLog.mock.calls.map(
                ([
                    ,
                    ,
                    error,
                ]) => String(error)
            )
        ).toStrictEqual([
            "TypeError: Invalid devtools menu theme provided",
            "TypeError: Invalid devtools menu FIT file path provided",
            "TypeError: Invalid devtools menu FIT file path provided",
        ]);
    });

    it("rejects invalid invoke payloads before reaching IPC", async () => {
        expect.assertions(10);

        const { helpers, ipcRenderer, preloadLog } = createHelpers();

        await expect(
            helpers.createSafeInvokeHandler("file:read", "readFile")(null)
        ).rejects.toThrow("Invalid file path provided");
        await expect(
            helpers.createSafeInvokeHandler(
                "browser:setEnabled",
                "setFitBrowserEnabled"
            )("true")
        ).rejects.toThrow("browser:setEnabled: expected one boolean argument");
        await expect(
            helpers.createSafeInvokeHandler(
                "browser:listFolder",
                "listFitBrowserFolder"
            )(null)
        ).rejects.toThrow("Invalid Browser relative path provided");
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
        expect(preloadLog).toHaveBeenCalledTimes(8);
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
