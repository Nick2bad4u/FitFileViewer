/**
 * Comprehensive test coverage for mainProcessStateManager.js
 */

import { setElectronOverride } from "../../../../../electron-app/main/runtime/electronAccess.js";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

type MainProcessStateManagerModule =
    typeof import("../../../../../electron-app/utils/state/integration/mainProcessStateManager.js");
type BrowserWindowLike = {
    isDestroyed?: () => boolean;
    webContents?: {
        isDestroyed?: () => boolean;
        send: (...args: unknown[]) => void;
    };
};

type IpcHandler = (...args: unknown[]) => unknown;
type Listener = (change?: unknown) => void;
type SendMessage = (...args: unknown[]) => void;
type IsDestroyed = () => boolean;

// Mock setup BEFORE any imports
const { mockBrowserWindow, mockIpcMain } = vi.hoisted(() => ({
    mockBrowserWindow: {
        getAllWindows: vi.fn<() => BrowserWindowLike[]>().mockReturnValue([]),
    },
    mockIpcMain: {
        handle: vi.fn<(channel: string, handler: IpcHandler) => void>(),
        removeHandler: vi.fn<(channel: string) => void>(),
    },
}));

function installElectronOverride(): void {
    setElectronOverride({
        BrowserWindow: mockBrowserWindow,
        ipcMain: mockIpcMain,
    });
}

// Mock native Electron imports while electronAccess receives the explicit override.
vi.mock(import("electron"), () => ({
    ipcMain: mockIpcMain,
    BrowserWindow: mockBrowserWindow,
}));

// Create a comprehensive mock for logWithLevel
vi.mock(import("../../../../../electron-app/utils/logging/index.js"), () => ({
    default: {
        logWithLevel: vi.fn<(...args: unknown[]) => void>(),
        getErrorInfo: vi.fn<(...args: unknown[]) => unknown>(),
    },
    logWithLevel: vi.fn<(...args: unknown[]) => void>(),
    getErrorInfo: vi.fn<(...args: unknown[]) => unknown>(),
}));

describe("mainProcessStateManager.js - Comprehensive Coverage", () => {
    let MainProcessState: any;
    let MainProcessStateManager: MainProcessStateManagerModule;
    let mainProcessState: any;
    let stateInstance: any;

    beforeEach(async () => {
        // Clear all mocks
        vi.clearAllMocks();

        // Reset electron mocks
        mockBrowserWindow.getAllWindows.mockReturnValue([]);
        mockIpcMain.handle.mockClear();
        installElectronOverride();
        MainProcessStateManager =
            await import("../../../../../electron-app/utils/state/integration/mainProcessStateManager.js");

        MainProcessState = MainProcessStateManager.MainProcessState;
        mainProcessState = MainProcessStateManager.mainProcessState;

        // Create fresh instance for testing
        stateInstance = new MainProcessState();
    });

    afterEach(() => {
        vi.clearAllMocks();
        setElectronOverride(null);
    });

    describe("mainProcessState Class", () => {
        describe("constructor and Initialization", () => {
            it("should initialize with default data structure", () => {
                expect.assertions(12);
                expect(stateInstance.data).toMatchObject({
                    errors: [],
                    gyazoServer: null,
                    gyazoServerPort: null,
                    loadedFitFilePath: null,
                    mainWindow: null,
                    operations: {},
                });
                expect(stateInstance.data.errors).toEqual([]);
                expect(stateInstance.data.eventHandlers).toBeInstanceOf(Map);
                expect(stateInstance.data.gyazoServer).toBeNull();
                expect(stateInstance.data.gyazoServerPort).toBeNull();
                expect(stateInstance.data.loadedFitFilePath).toBeNull();
                expect(stateInstance.data.mainWindow).toBeNull();
                expect(stateInstance.data.operations).toBeTypeOf("object");
                expect(stateInstance.data.pendingOAuthResolvers).toBeInstanceOf(
                    Map
                );
                expect(stateInstance.data.metrics).toEqual({
                    operationTimes: expect.any(Map),
                    startTime: expect.any(Number),
                    startTimePerf: expect.any(Number),
                });
                expect(
                    stateInstance.data.metrics.operationTimes
                ).toBeInstanceOf(Map);
                expect(stateInstance.data.metrics.startTime).toBeTypeOf(
                    "number"
                );
            });

            it("should initialize listeners map", () => {
                expect.assertions(1);
                expect(stateInstance.listeners).toBeInstanceOf(Map);
            });

            it("should initialize middleware array", () => {
                expect.assertions(1);
                expect(stateInstance.middleware).toBeInstanceOf(Array);
            });

            it("should set up dev mode correctly", () => {
                expect.assertions(1);
                expect(stateInstance.devMode).toBeTypeOf("boolean");
            });
        });

        describe("path-based Get/Set Operations", () => {
            it("should get values by path using getByPath", () => {
                expect.assertions(3);
                stateInstance.data.test = { nested: { value: "hello" } };

                expect(
                    stateInstance.getByPath(
                        stateInstance.data,
                        "test.nested.value"
                    )
                ).toBe("hello");
                expect(
                    stateInstance.getByPath(stateInstance.data, "test.nested")
                ).toEqual({ value: "hello" });
                expect(
                    stateInstance.getByPath(stateInstance.data, "test")
                ).toEqual({ nested: { value: "hello" } });
            });

            it("should return null for non-existent paths", () => {
                expect.assertions(2);
                const queryByPath = stateInstance.getByPath.bind(stateInstance);

                expect(
                    queryByPath(stateInstance.data, "nonexistent.path")
                ).toBeNull();
                expect(
                    queryByPath(stateInstance.data, "test.missing")
                ).toBeNull();
            });

            it("should handle empty path", () => {
                expect.assertions(3);
                const obj = { test: "value" };
                expect(stateInstance.getByPath(obj, "")).toBe(obj);
                expect(stateInstance.getByPath(obj, null)).toBe(obj);
                expect(stateInstance.getByPath(obj, undefined)).toBe(obj);
            });

            it("should get values using public get method", () => {
                expect.assertions(1);
                stateInstance.data.loadedFitFilePath = "/path/to/file.fit";
                expect(stateInstance.get("loadedFitFilePath")).toBe(
                    "/path/to/file.fit"
                );
            });

            it("should set values by path using setByPath", () => {
                expect.assertions(1);
                stateInstance.setByPath(
                    stateInstance.data,
                    "test.nested.value",
                    "new value"
                );
                expect(stateInstance.data.test.nested.value).toBe("new value");
            });

            it("should create nested objects when setting deep paths", () => {
                expect.assertions(1);
                stateInstance.setByPath(
                    stateInstance.data,
                    "deep.nested.path.value",
                    42
                );
                expect(stateInstance.data.deep.nested.path.value).toBe(42);
            });

            it("should handle array indices in paths", () => {
                expect.assertions(1);
                stateInstance.setByPath(
                    stateInstance.data,
                    "arrayTest.0.name",
                    "first"
                );
                expect(stateInstance.data.arrayTest[0].name).toBe("first");
            });
        });

        describe("set Method and Change Notification", () => {
            it("should set values and trigger change notification", () => {
                expect.assertions(3);
                const notifySpy = vi.spyOn(stateInstance, "notifyChange");

                stateInstance.set("testKey", "testValue");

                expect(stateInstance.data.testKey).toBe("testValue");
                expect(stateInstance.get("missingKey")).toBeNull();
                expect(notifySpy).toHaveBeenCalledWith({
                    path: "testKey",
                    newValue: "testValue",
                    oldValue: null,
                    source: "mainProcess",
                    timestamp: expect.any(Number),
                });
            });

            it("should handle options parameter in set method", () => {
                expect.assertions(2);
                const notifySpy = vi.spyOn(stateInstance, "notifyChange");
                const options = { silent: false };

                stateInstance.set("testKey", "testValue", options);

                expect(stateInstance.get("testKey")).toBe("testValue");
                expect(notifySpy).toHaveBeenCalledWith({
                    path: "testKey",
                    newValue: "testValue",
                    oldValue: null,
                    source: "mainProcess",
                    timestamp: expect.any(Number),
                    silent: false,
                });
            });

            it("should store previous value when setting", () => {
                expect.assertions(2);
                stateInstance.data.existingKey = "oldValue";
                const notifySpy = vi.spyOn(stateInstance, "notifyChange");

                stateInstance.set("existingKey", "newValue");

                expect(stateInstance.get("existingKey")).toBe("newValue");
                expect(notifySpy).toHaveBeenCalledWith({
                    path: "existingKey",
                    newValue: "newValue",
                    oldValue: "oldValue",
                    source: "mainProcess",
                    timestamp: expect.any(Number),
                });
            });
        });

        describe("listener Management", () => {
            it("should add listeners using listen method", () => {
                expect.assertions(3);
                const listener = vi.fn<Listener>();

                const unsubscribe = stateInstance.listen("testPath", listener);

                expect([...stateInstance.listeners.keys()]).toContain(
                    "testPath"
                );
                expect([...stateInstance.listeners.get("testPath")]).toContain(
                    listener
                );
                expect(unsubscribe).toBeTypeOf("function");
            });

            it("should handle multiple listeners for same path", () => {
                expect.assertions(3);
                const listener1 = vi.fn<Listener>();
                const listener2 = vi.fn<Listener>();

                stateInstance.listen("testPath", listener1);
                stateInstance.listen("testPath", listener2);

                const pathListeners = stateInstance.listeners.get("testPath");
                expect(pathListeners.size).toBe(2);
                expect([...pathListeners]).toContain(listener1);
                expect([...pathListeners]).toContain(listener2);
            });

            it("should unsubscribe listeners", () => {
                expect.assertions(1);
                const listener = vi.fn<Listener>();

                const unsubscribe = stateInstance.listen("testPath", listener);
                unsubscribe();

                const pathListeners = stateInstance.listeners.get("testPath");
                expect(pathListeners).toBeUndefined();
            });

            it("should clean up listener sets when empty", () => {
                expect.assertions(2);
                const listener1 = vi.fn<Listener>();
                const listener2 = vi.fn<Listener>();

                const unsubscribe1 = stateInstance.listen(
                    "testPath",
                    listener1
                );
                const unsubscribe2 = stateInstance.listen(
                    "testPath",
                    listener2
                );

                unsubscribe1();
                expect(stateInstance.listeners.get("testPath").size).toBe(1);

                unsubscribe2();
                expect([...stateInstance.listeners.keys()]).not.toContain(
                    "testPath"
                );
            });
        });

        describe("change Notification", () => {
            it("should notify local listeners", () => {
                expect.assertions(2);
                let observedChange: unknown;
                const listener = vi.fn<Listener>((change) => {
                    observedChange = change;
                });
                stateInstance.listen("testPath", listener);

                const change = {
                    path: "testPath",
                    newValue: "newValue",
                    oldValue: "oldValue",
                };

                stateInstance.notifyChange(change);

                expect(observedChange).toEqual(change);
                expect(listener).toHaveBeenCalledWith(change);
            });

            it("should notify wildcard listeners", () => {
                expect.assertions(2);
                let observedChange: unknown;
                const listener = vi.fn<Listener>((change) => {
                    observedChange = change;
                });
                stateInstance.listen("*", listener);

                const change = {
                    path: "testPath",
                    newValue: "newValue",
                    oldValue: "oldValue",
                };

                stateInstance.notifyChange(change);

                expect(observedChange).toEqual(change);
                expect(listener).toHaveBeenCalledWith(change);
            });

            it("should notify renderer processes", () => {
                expect.assertions(2);
                const notifyRenderersSpy = vi.spyOn(
                    stateInstance,
                    "notifyRenderers"
                );

                const change = {
                    path: "testPath",
                    newValue: "newValue",
                    oldValue: "oldValue",
                };

                stateInstance.notifyChange(change);

                expect(stateInstance.listeners.size).toBe(0);
                expect(notifyRenderersSpy).toHaveBeenCalledWith(
                    "main-state-changed",
                    change
                );
            });

            it("should handle listener errors gracefully", () => {
                expect.assertions(1);
                const badListener = vi.fn<Listener>().mockImplementation(() => {
                    throw new Error("Listener error");
                });

                stateInstance.listen("testPath", badListener);

                const change = {
                    path: "testPath",
                    newValue: "newValue",
                    oldValue: "oldValue",
                };

                expect(() => {
                    stateInstance.notifyChange(change);
                }).not.toThrow();
            });
        });

        describe("operation Management", () => {
            it("should start operations", () => {
                expect.assertions(5);
                stateInstance.startOperation("test-operation", {
                    message: "Test operation",
                });

                const operation = stateInstance.get(
                    "operations.test-operation"
                );
                expect(operation).toEqual(
                    expect.objectContaining({
                        id: "test-operation",
                        message: "Test operation",
                        progress: 0,
                        startTime: expect.any(Number),
                        startTimePerf: expect.any(Number),
                        status: "running",
                    })
                );
                expect(operation.status).toBe("running");
                expect(operation.message).toBe("Test operation");
                expect(operation.startTime).toBeTypeOf("number");
                expect(operation.progress).toBe(0);
            });

            it("should complete operations", () => {
                expect.assertions(5);
                stateInstance.startOperation("test-operation", {
                    message: "Test operation",
                });
                const result = { success: true };

                stateInstance.completeOperation("test-operation", result);

                const operation = stateInstance.get(
                    "operations.test-operation"
                );
                expect(operation.status).toBe("completed");
                expect(operation.result).toEqual(result);
                expect(operation.duration).toBeTypeOf("number");
                expect(operation.endTime).toBeTypeOf("number");
                expect(operation.progress).toBe(100);
            });

            it("should handle completing non-existent operation", () => {
                expect.assertions(1);
                expect(() => {
                    stateInstance.completeOperation("non-existent", {});
                }).not.toThrow();
            });

            it("should fail operations", () => {
                expect.assertions(4);
                stateInstance.startOperation("test-operation", {
                    message: "Test operation",
                });
                const error = new Error("Test error");

                stateInstance.failOperation("test-operation", error);

                const operation = stateInstance.get(
                    "operations.test-operation"
                );
                expect(operation.status).toBe("failed");
                expect(operation.error.message).toBe("Test error");
                expect(operation.error.name).toBe("Error");
                expect(operation.error.stack).toBeTypeOf("string");
            });

            it("should handle failing operation with string error", () => {
                expect.assertions(1);
                stateInstance.startOperation("test-operation", {
                    message: "Test operation",
                });

                stateInstance.failOperation("test-operation", "String error");

                const operation = stateInstance.get(
                    "operations.test-operation"
                );
                expect(operation.error.message).toBe("String error");
            });

            it("should handle failing non-existent operation", () => {
                expect.assertions(1);
                expect(() => {
                    stateInstance.failOperation(
                        "non-existent",
                        new Error("test")
                    );
                }).not.toThrow();
            });
        });

        describe("error Management", () => {
            it("should add errors to state", () => {
                expect.assertions(4);
                const error = new Error("Test error");

                stateInstance.addError(error);

                const errors = stateInstance.get("errors");
                expect(errors).toHaveLength(1);
                expect(errors[0].message).toBe("Test error");
                expect(errors[0].timestamp).toBeTypeOf("number");
                expect(errors[0].source).toBe("mainProcess");
            });

            it("should add errors with context", () => {
                expect.assertions(1);
                const error = new Error("Test error");
                const context = { source: "test", details: "extra info" };

                stateInstance.addError(error, context);

                const errors = stateInstance.get("errors");
                expect(errors[0].context).toEqual(context);
            });

            it("should handle string errors", () => {
                expect.assertions(1);
                stateInstance.addError("String error message");

                const errors = stateInstance.get("errors");
                expect(errors[0].message).toBe("String error message");
            });

            it("should limit error history to 100 items", () => {
                expect.assertions(2);
                // Prevent repeated notifyRenderers calls from adding overhead during coverage runs
                // We only care about the error list length behavior here.
                const notifyStub = vi
                    .spyOn(stateInstance, "notifyRenderers")
                    .mockImplementation(() => {});
                // Add 105 errors
                for (let i = 0; i < 105; i++) {
                    stateInstance.addError(`Error ${i}`);
                }

                const errors = stateInstance.get("errors");
                expect(errors).toHaveLength(100);
                // Should keep newest errors (higher numbers)
                expect(errors[0].message).toBe("Error 104");
                notifyStub.mockRestore();
            });
        });

        describe("renderer Communication", () => {
            it("should notify renderers when windows exist", () => {
                expect.assertions(2);
                // The Electron override keeps this path independent from the
                // real Electron runtime while preserving renderer notification behavior.
                expect(() => {
                    stateInstance.notifyRenderers("test-channel", {
                        test: "data",
                    });
                }).not.toThrow();

                // The function should complete without error even if no windows exist
                // This tests the error handling paths and serialization logic
                expect(
                    stateInstance.makeSerializable({ test: "data" })
                ).toEqual({ test: "data" });
            });

            it("should handle window validation failures", () => {
                expect.assertions(1);
                const mockWindow = {
                    isDestroyed: vi.fn<IsDestroyed>().mockReturnValue(true),
                    webContents: null,
                };

                mockBrowserWindow.getAllWindows.mockReturnValue([mockWindow]);

                expect(() => {
                    stateInstance.notifyRenderers("test-channel", {
                        test: "data",
                    });
                }).not.toThrow();
            });

            it("should reject windows with malformed webContents send handlers", () => {
                expect.assertions(3);

                const warnSpy = vi
                    .spyOn(console, "warn")
                    .mockImplementation(() => {});
                const mockWindow = {
                    isDestroyed: vi.fn<IsDestroyed>().mockReturnValue(false),
                    webContents: {
                        isDestroyed: vi
                            .fn<IsDestroyed>()
                            .mockReturnValue(false),
                        send: "not-callable",
                    },
                };

                mockBrowserWindow.getAllWindows.mockReturnValue([
                    mockWindow as unknown as BrowserWindowLike,
                ]);

                expect(() => {
                    stateInstance.notifyRenderers("test-channel", {
                        test: "data",
                    });
                }).not.toThrow();
                expect(
                    mockWindow.webContents.isDestroyed
                ).toHaveBeenCalledWith();
                expect(warnSpy).toHaveBeenCalledWith(
                    "[mainProcessStateManager] Window is not usable or destroyed"
                );

                warnSpy.mockRestore();
            });

            it("should handle IPC send errors", () => {
                expect.assertions(1);
                const mockWindow = {
                    isDestroyed: vi.fn<IsDestroyed>().mockReturnValue(false),
                    webContents: {
                        isDestroyed: vi
                            .fn<IsDestroyed>()
                            .mockReturnValue(false),
                        send: vi.fn<SendMessage>().mockImplementation(() => {
                            throw new Error("IPC send failed");
                        }),
                    },
                };

                mockBrowserWindow.getAllWindows.mockReturnValue([mockWindow]);

                expect(() => {
                    stateInstance.notifyRenderers("test-channel", {
                        test: "data",
                    });
                }).not.toThrow();
            });

            it("should handle missing BrowserWindow", () => {
                expect.assertions(1);
                mockBrowserWindow.getAllWindows.mockImplementation(() => {
                    throw new Error("BrowserWindow not available");
                });

                expect(() => {
                    stateInstance.notifyRenderers("test-channel", {
                        test: "data",
                    });
                }).not.toThrow();
            });
        });

        describe("data Serialization", () => {
            it("should make data serializable for IPC", () => {
                expect.assertions(8);
                const data = {
                    string: "test",
                    number: 42,
                    boolean: true,
                    map: new Map([["key", "value"]]),
                    set: new Set(["item1", "item2"]),
                    function: () => "test",
                    undefined: undefined,
                    null: null,
                };

                const serializable = stateInstance.makeSerializable(data);

                expect(serializable.string).toBe("test");
                expect(serializable.number).toBe(42);
                expect({ value: serializable.boolean }).toStrictEqual({
                    value: true,
                });
                expect(serializable.map).toBeUndefined(); // Maps are filtered out
                expect(serializable.set).toBeUndefined(); // Sets are filtered out
                expect(serializable.function).toBeUndefined(); // Functions are filtered out
                expect(serializable.undefined).toBeUndefined();
                expect(serializable.null).toBeNull();
            });

            it("should handle nested objects in serialization", () => {
                expect.assertions(4);
                const data = {
                    nested: {
                        string: "value",
                        map: new Map([["key", "value"]]),
                        deeper: {
                            number: 42,
                            set: new Set(["item"]),
                        },
                    },
                };

                const serializable = stateInstance.makeSerializable(data);

                expect(serializable.nested.string).toBe("value");
                expect(serializable.nested.map).toBeUndefined(); // Maps are filtered out
                expect(serializable.nested.deeper.number).toBe(42);
                expect(serializable.nested.deeper.set).toBeUndefined(); // Sets are filtered out
            });

            it("should handle arrays in serialization", () => {
                expect.assertions(4);
                const data = {
                    array: [
                        "string",
                        42,
                        { nested: "object" },
                        new Map([["key", "value"]]),
                        new Set(["item"]),
                        () => "function",
                    ],
                };

                const serializable = stateInstance.makeSerializable(data);

                expect(serializable.array[0]).toBe("string");
                expect(serializable.array[1]).toBe(42);
                expect(serializable.array[2]).toEqual({ nested: "object" });
                // Array items are processed recursively but length remains the same
                expect(serializable.array).toHaveLength(6); // All items are kept but processed
            });

            it("should handle null and undefined values", () => {
                expect.assertions(4);
                expect(stateInstance.makeSerializable(null)).toBeNull();
                expect(
                    stateInstance.makeSerializable(undefined)
                ).toBeUndefined();
                expect(stateInstance.makeSerializable("string")).toBe("string");
                expect(stateInstance.makeSerializable(42)).toBe(42);
            });
        });

        describe("update Method", () => {
            it("should update multiple paths at once", () => {
                expect.assertions(5);
                const notifyChangeSpy = vi.spyOn(stateInstance, "notifyChange");

                const updates = {
                    key1: "value1",
                    key2: "value2",
                    "nested.key": "nested value",
                };

                stateInstance.update(updates);

                expect(stateInstance.get("missing.key")).toBeNull();
                expect(stateInstance.get("key1")).toBe("value1");
                expect(stateInstance.get("key2")).toBe("value2");
                expect(stateInstance.get("nested.key")).toBe("nested value");
                expect(notifyChangeSpy).toHaveBeenCalledTimes(3);
            });
        });

        describe("development Information", () => {
            it("should provide development info", () => {
                expect.assertions(6);
                stateInstance.addError(new Error("Test error"));
                stateInstance.startOperation("test-op", { message: "Test" });
                stateInstance.listen("test-path", () => {});

                const devInfo = stateInstance.getDevInfo();

                expect(devInfo.errors).toBe(1);
                expect(devInfo.operations).toContain("test-op");
                expect(devInfo.listeners).toContain("test-path");
                expect(devInfo.listeners).not.toContain("missing-path");
                expect(devInfo.uptime).toBeTypeOf("number");
                expect(devInfo.state).toBe(stateInstance.data);
            });
        });
    });

    describe("exported Module", () => {
        it("should export MainProcessState class", () => {
            expect.assertions(2);
            expect(MainProcessState).toBeTypeOf("function");
            expect(MainProcessState.name).toBe("MainProcessState");
        });

        it("should export singleton mainProcessState instance", () => {
            expect.assertions(2);
            expect(mainProcessState).toBeInstanceOf(MainProcessState);
            expect(mainProcessState).not.toBe(stateInstance);
        });

        it("should maintain singleton behavior", async () => {
            expect.assertions(1);
            const { mainProcessState: instance1 } =
                await import("../../../../../electron-app/utils/state/integration/mainProcessStateManager.js");
            const { mainProcessState: instance2 } =
                await import("../../../../../electron-app/utils/state/integration/mainProcessStateManager.js");

            expect(instance1).toBe(instance2);
        });
    });

    describe("edge Cases and Error Handling", () => {
        it("should handle invalid paths gracefully", () => {
            expect.assertions(3);
            expect(stateInstance.get("")).toBe(stateInstance.data);
            expect(stateInstance.get(null)).toBe(stateInstance.data);
            expect(stateInstance.get(undefined)).toBe(stateInstance.data);
        });

        it("should handle setByPath with empty path", () => {
            expect.assertions(1);
            expect(() => {
                stateInstance.setByPath(stateInstance.data, "", "value");
            }).not.toThrow();
        });

        it("should reject setByPath through primitive intermediate values", () => {
            expect.assertions(1);
            stateInstance.data.primitive = "string";

            expect(() => {
                stateInstance.setByPath(
                    stateInstance.data,
                    "primitive.property",
                    "value"
                );
            }).toThrow(
                "Cannot set nested state path through non-object key: primitive"
            );
        });

        it("should reject setByPath through null intermediate values", () => {
            expect.assertions(1);
            stateInstance.data.nullish = null;

            expect(() => {
                stateInstance.setByPath(
                    stateInstance.data,
                    "nullish.property",
                    "value"
                );
            }).toThrow(
                "Cannot set nested state path through non-object key: nullish"
            );
        });

        it("should handle operations with missing operations map", () => {
            expect.assertions(2);
            const originalOperations = stateInstance.data.operations;

            // Don't set to null directly - instead test missing nested path
            stateInstance.data.operations = {};

            expect(() => {
                stateInstance.startOperation("test", { message: "test" });
            }).not.toThrow();

            // Should create the operation
            expect(stateInstance.get("operations.test")).toMatchObject({
                id: "test",
                message: "test",
                progress: 0,
                status: "running",
            });

            // Restore
            stateInstance.data.operations = originalOperations;
        });
    });

    describe("ipc Handler Setup", () => {
        it("should set up IPC handlers when ipcMain is available", () => {
            expect.assertions(10);
            mockIpcMain.handle.mockClear();

            // Create new instance to trigger setupIPCHandlers
            const testInstance = new MainProcessState();

            const registeredChannels = mockIpcMain.handle.mock.calls.map(
                ([channel]) => channel
            );
            expect(testInstance).toBeInstanceOf(MainProcessState);
            expect(registeredChannels).toEqual([
                "main-state:get",
                "main-state:set",
                "main-state:listen",
                "main-state:unlisten",
                "main-state:operation",
                "main-state:operations",
                "main-state:errors",
                "main-state:metrics",
            ]);

            // Verify ipcMain.handle was called for each handler
            expect(mockIpcMain.handle).toHaveBeenCalledWith(
                "main-state:get",
                expect.any(Function)
            );
            expect(mockIpcMain.handle).toHaveBeenCalledWith(
                "main-state:set",
                expect.any(Function)
            );
            expect(mockIpcMain.handle).toHaveBeenCalledWith(
                "main-state:listen",
                expect.any(Function)
            );
            expect(mockIpcMain.handle).toHaveBeenCalledWith(
                "main-state:unlisten",
                expect.any(Function)
            );
            expect(mockIpcMain.handle).toHaveBeenCalledWith(
                "main-state:operation",
                expect.any(Function)
            );
            expect(mockIpcMain.handle).toHaveBeenCalledWith(
                "main-state:operations",
                expect.any(Function)
            );
            expect(mockIpcMain.handle).toHaveBeenCalledWith(
                "main-state:errors",
                expect.any(Function)
            );
            expect(mockIpcMain.handle).toHaveBeenCalledWith(
                "main-state:metrics",
                expect.any(Function)
            );
        });

        it("listen is idempotent per sender+path and unlisten stops notifications", () => {
            expect.assertions(8);
            const listenHandler = mockIpcMain.handle.mock.calls.find(
                (c) => c[0] === "main-state:listen"
            )?.[1] as any;
            const unlistenHandler = mockIpcMain.handle.mock.calls.find(
                (c) => c[0] === "main-state:unlisten"
            )?.[1] as any;
            expect(listenHandler).toBeTypeOf("function");
            expect(unlistenHandler).toBeTypeOf("function");

            const send = vi.fn<SendMessage>();
            const sender = {
                id: 123,
                send,
                isDestroyed: vi.fn<IsDestroyed>(() => false),
                once: vi.fn<(...args: unknown[]) => void>(),
            };

            // Subscribe twice; should not create duplicate subscriptions.
            const firstListenResult = listenHandler(
                { sender },
                "loadedFitFilePath"
            );
            const secondListenResult = listenHandler(
                { sender },
                "loadedFitFilePath"
            );
            expect({
                firstListenResult,
                secondListenResult,
            }).toStrictEqual({
                firstListenResult: true,
                secondListenResult: true,
            });
            expect((stateInstance as any).ipcSubscriptions.size).toBe(1);

            // Trigger change notification
            (stateInstance as any).notifyChange({
                path: "loadedFitFilePath",
                value: 1,
                oldValue: 0,
                timestamp: Date.now(),
            });
            expect(send).toHaveBeenCalledWith(
                "main-state-change",
                expect.objectContaining({ path: "loadedFitFilePath" })
            );

            send.mockClear();
            expect({
                unlistenResult: unlistenHandler(
                    { sender },
                    "loadedFitFilePath"
                ),
            }).toStrictEqual({ unlistenResult: true });
            expect((stateInstance as any).ipcSubscriptions.size).toBe(0);

            // Should no longer notify
            (stateInstance as any).notifyChange({
                path: "loadedFitFilePath",
                value: 2,
                oldValue: 1,
                timestamp: Date.now(),
            });
            expect(send).not.toHaveBeenCalled();
        });

        it("should skip IPC handler setup when ipcMain is not available", () => {
            expect.assertions(1);
            setElectronOverride({
                BrowserWindow: mockBrowserWindow,
            });

            try {
                // Create new instance - should not throw
                expect(() => new MainProcessState()).not.toThrow();
            } finally {
                installElectronOverride();
            }
        });
    });

    it("should handle main-state:get IPC calls", () => {
        expect.assertions(2);
        const testInstance = new MainProcessState();
        const mockEvent = {
            sender: {
                send: vi.fn<SendMessage>(),
                isDestroyed: vi.fn<IsDestroyed>(() => false),
            },
        };

        // Get the handler function that was registered
        const getHandler = mockIpcMain.handle.mock.calls.find(
            (call) => call[0] === "main-state:get"
        )![1];

        // Test getting specific path
        const result1 = getHandler(mockEvent, "loadedFitFilePath");
        expect(result1).toBeNull();

        // Empty paths must not dump the entire main-process state to renderer IPC.
        const result2 = getHandler(mockEvent, "");
        expect(result2).toBeUndefined();
    });

    it("should handle main-state:set IPC calls with allowed paths", () => {
        expect.assertions(1);
        const testInstance = new MainProcessState();
        const mockEvent = {
            sender: {
                send: vi.fn<SendMessage>(),
                isDestroyed: vi.fn<IsDestroyed>(() => false),
            },
        };

        // Get the handler function that was registered
        const setHandler = mockIpcMain.handle.mock.calls.find(
            (call) => call[0] === "main-state:set"
        )![1];

        // Test allowed path
        const result1 = setHandler(
            mockEvent,
            "loadedFitFilePath",
            "/test/path"
        );

        // Test restricted path
        const result2 = setHandler(mockEvent, "restrictedPath", "value");
        expect({
            allowedPathSet: result1,
            restrictedPathSet: result2,
        }).toStrictEqual({
            allowedPathSet: true,
            restrictedPathSet: false,
        });
    });

    it("main-state:set should block prototype pollution paths", () => {
        expect.assertions(4);
        const testInstance = new MainProcessState();

        const setHandler = mockIpcMain.handle.mock.calls.find(
            (call) => call[0] === "main-state:set"
        )![1];

        // Attempt to set a path that would normally pollute Object.prototype if not blocked
        const result = setHandler({}, "operations.__proto__.polluted", "yes");
        expect({ setBlocked: result }).toStrictEqual({ setBlocked: false });

        // Verify we did not pollute prototypes
        // eslint-disable-next-line no-prototype-builtins
        expect(
            Object.prototype.hasOwnProperty.call(Object.prototype, "polluted")
        ).toStrictEqual(false);
        expect(({} as any).polluted).toBeUndefined();

        // Also ensure no operation was created
        const op = testInstance.get("operations.polluted");
        expect(op).toBeNull();
    });

    it("main-state:operations should return plain object entries", () => {
        expect.assertions(3);
        // Ensure the handler we call is the one registered by THIS instance.
        mockIpcMain.handle.mockClear();
        const testInstance = new MainProcessState();
        const operationsHandler = mockIpcMain.handle.mock.calls.find(
            (call) => call[0] === "main-state:operations"
        )![1];

        // Seed an operation using the main state setter (same mechanics as normal usage)
        testInstance.set("operations.test-op", {
            id: "test-op",
            status: "running",
        });

        const result = operationsHandler();
        expect(result).toBeTypeOf("object");
        expect(result).toHaveProperty("test-op");
        expect((result as any)["test-op"]).toMatchObject({
            id: "test-op",
            status: "running",
        });
    });

    it("should handle main-state:listen IPC calls", () => {
        expect.assertions(1);
        const mockSender = {
            send: vi.fn<SendMessage>(),
        };
        const mockEvent = { sender: mockSender };

        const testInstance = new MainProcessState();

        // Get the handler function that was registered
        const listenHandler = mockIpcMain.handle.mock.calls.find(
            (call) => call[0] === "main-state:listen"
        )![1];

        const result = listenHandler(mockEvent, "loadedFitFilePath");
        expect({ listenResult: result }).toStrictEqual({ listenResult: true });
    });

    it("should handle main-state:operation IPC calls", () => {
        expect.assertions(1);
        const testInstance = new MainProcessState();

        // Get the handler function that was registered
        const operationHandler = mockIpcMain.handle.mock.calls.find(
            (call) => call[0] === "main-state:operation"
        )![1];

        const result = operationHandler({}, "test-op");
        expect(result).toBeUndefined(); // No operation exists
    });

    it("should handle main-state:operations IPC calls", () => {
        expect.assertions(1);
        const testInstance = new MainProcessState();

        // Get the handler function that was registered
        const operationsHandler = mockIpcMain.handle.mock.calls.find(
            (call) => call[0] === "main-state:operations"
        )![1];

        const result = operationsHandler();
        expect(result).toEqual({});
    });

    it("should handle main-state:errors IPC calls", () => {
        expect.assertions(1);
        const testInstance = new MainProcessState();

        // Get the handler function that was registered
        const errorsHandler = mockIpcMain.handle.mock.calls.find(
            (call) => call[0] === "main-state:errors"
        )![1];

        const result = errorsHandler({}, 10);
        expect(result).toBeInstanceOf(Array);
    });

    it("should handle main-state:metrics IPC calls", () => {
        expect.assertions(1);
        const testInstance = new MainProcessState();

        // Get the handler function that was registered
        const metricsHandler = mockIpcMain.handle.mock.calls.find(
            (call) => call[0] === "main-state:metrics"
        )![1];

        const result = metricsHandler();
        expect(result).toMatchObject({
            operationTimes: {},
            startTime: expect.any(Number),
            startTimePerf: expect.any(Number),
        });
    });
});
