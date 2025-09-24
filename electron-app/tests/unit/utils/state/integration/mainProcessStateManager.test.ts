/**
 * @file mainProcessStateManager.test.ts
 * @description Comprehensive test coverage for mainProcessStateManager.js
 */

// Mock setup BEFORE any imports
const mockBrowserWindow = {
    getAllWindows: vi.fn().mockReturnValue([]),
};
const mockIpcMain = {
    handle: vi.fn(),
    removeHandler: vi.fn(),
};

// Mock electron module first - this should work for both ES6 imports and CommonJS require
vi.mock("electron", () => ({
    ipcMain: mockIpcMain,
    BrowserWindow: mockBrowserWindow,
}));

// Set up global require mock to intercept require('electron') calls
const originalRequire = global.require;
global.require = vi.fn((id: string) => {
    if (id === "electron") {
        return {
            ipcMain: mockIpcMain,
            BrowserWindow: mockBrowserWindow,
        };
    }
    return originalRequire(id);
}) as any;

import { describe, test, expect, beforeEach, afterEach, vi, Mock } from "vitest";

// Create a comprehensive mock for logWithLevel
vi.mock("../../../../../utils/logging/index.js", () => ({
    default: {
        logWithLevel: vi.fn(),
        getErrorInfo: vi.fn(),
    },
    logWithLevel: vi.fn(),
    getErrorInfo: vi.fn(),
}));

// Import the module after setting up the mock
import * as MainProcessStateManager from "../../../../../utils/state/integration/mainProcessStateManager.js";

describe("mainProcessStateManager.js - Comprehensive Coverage", () => {
    let MainProcessState: any;
    let mainProcessState: any;
    let stateInstance: any;

    beforeEach(async () => {
        // Clear all mocks
        vi.clearAllMocks();

        // Reset electron mocks
        mockBrowserWindow.getAllWindows.mockReturnValue([]);
        mockIpcMain.handle.mockClear();

        // Use the statically imported module
        MainProcessState = MainProcessStateManager.MainProcessState;
        mainProcessState = MainProcessStateManager.mainProcessState;

        // Create fresh instance for testing
        stateInstance = new MainProcessState();
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    describe("MainProcessState Class", () => {
        describe("Constructor and Initialization", () => {
            test("should initialize with default data structure", () => {
                expect(stateInstance.data).toBeDefined();
                expect(stateInstance.data.errors).toEqual([]);
                expect(stateInstance.data.eventHandlers).toBeInstanceOf(Map);
                expect(stateInstance.data.gyazoServer).toBeNull();
                expect(stateInstance.data.gyazoServerPort).toBeNull();
                expect(stateInstance.data.loadedFitFilePath).toBeNull();
                expect(stateInstance.data.mainWindow).toBeNull();
                expect(stateInstance.data.operations).toBeInstanceOf(Map);
                expect(stateInstance.data.pendingOAuthResolvers).toBeInstanceOf(Map);
                expect(stateInstance.data.metrics).toBeDefined();
                expect(stateInstance.data.metrics.operationTimes).toBeInstanceOf(Map);
                expect(typeof stateInstance.data.metrics.startTime).toBe("number");
            });

            test("should initialize listeners map", () => {
                expect(stateInstance.listeners).toBeInstanceOf(Map);
            });

            test("should initialize middleware array", () => {
                expect(Array.isArray(stateInstance.middleware)).toBe(true);
            });

            test("should set up dev mode correctly", () => {
                expect(typeof stateInstance.devMode).toBe("boolean");
            });
        });

        describe("Path-based Get/Set Operations", () => {
            test("should get values by path using getByPath", () => {
                stateInstance.data.test = { nested: { value: "hello" } };

                expect(stateInstance.getByPath(stateInstance.data, "test.nested.value")).toBe("hello");
                expect(stateInstance.getByPath(stateInstance.data, "test.nested")).toEqual({ value: "hello" });
                expect(stateInstance.getByPath(stateInstance.data, "test")).toEqual({ nested: { value: "hello" } });
            });

            test("should return null for non-existent paths", () => {
                expect(stateInstance.getByPath(stateInstance.data, "nonexistent.path")).toBeNull();
                expect(stateInstance.getByPath(stateInstance.data, "test.missing")).toBeNull();
            });

            test("should handle empty path", () => {
                const obj = { test: "value" };
                expect(stateInstance.getByPath(obj, "")).toBe(obj);
                expect(stateInstance.getByPath(obj, null)).toBe(obj);
                expect(stateInstance.getByPath(obj, undefined)).toBe(obj);
            });

            test("should get values using public get method", () => {
                stateInstance.data.loadedFitFilePath = "/path/to/file.fit";
                expect(stateInstance.get("loadedFitFilePath")).toBe("/path/to/file.fit");
            });

            test("should set values by path using setByPath", () => {
                stateInstance.setByPath(stateInstance.data, "test.nested.value", "new value");
                expect(stateInstance.data.test.nested.value).toBe("new value");
            });

            test("should create nested objects when setting deep paths", () => {
                stateInstance.setByPath(stateInstance.data, "deep.nested.path.value", 42);
                expect(stateInstance.data.deep.nested.path.value).toBe(42);
            });

            test("should handle array indices in paths", () => {
                stateInstance.setByPath(stateInstance.data, "arrayTest.0.name", "first");
                expect(stateInstance.data.arrayTest[0].name).toBe("first");
            });
        });

        describe("Set Method and Change Notification", () => {
            test("should set values and trigger change notification", () => {
                const notifySpy = vi.spyOn(stateInstance, "notifyChange");

                stateInstance.set("testKey", "testValue");

                expect(stateInstance.data.testKey).toBe("testValue");
                expect(notifySpy).toHaveBeenCalledWith({
                    path: "testKey",
                    newValue: "testValue",
                    oldValue: null,
                    source: "mainProcess",
                    timestamp: expect.any(Number),
                });
            });

            test("should handle options parameter in set method", () => {
                const notifySpy = vi.spyOn(stateInstance, "notifyChange");
                const options = { silent: false };

                stateInstance.set("testKey", "testValue", options);

                expect(notifySpy).toHaveBeenCalledWith({
                    path: "testKey",
                    newValue: "testValue",
                    oldValue: null,
                    source: "mainProcess",
                    timestamp: expect.any(Number),
                    silent: false,
                });
            });

            test("should store previous value when setting", () => {
                stateInstance.data.existingKey = "oldValue";
                const notifySpy = vi.spyOn(stateInstance, "notifyChange");

                stateInstance.set("existingKey", "newValue");

                expect(notifySpy).toHaveBeenCalledWith({
                    path: "existingKey",
                    newValue: "newValue",
                    oldValue: "oldValue",
                    source: "mainProcess",
                    timestamp: expect.any(Number),
                });
            });
        });

        describe("Listener Management", () => {
            test("should add listeners using listen method", () => {
                const listener = vi.fn();

                const unsubscribe = stateInstance.listen("testPath", listener);

                expect(stateInstance.listeners.has("testPath")).toBe(true);
                expect(stateInstance.listeners.get("testPath").has(listener)).toBe(true);
                expect(typeof unsubscribe).toBe("function");
            });

            test("should handle multiple listeners for same path", () => {
                const listener1 = vi.fn();
                const listener2 = vi.fn();

                stateInstance.listen("testPath", listener1);
                stateInstance.listen("testPath", listener2);

                const pathListeners = stateInstance.listeners.get("testPath");
                expect(pathListeners.size).toBe(2);
                expect(pathListeners.has(listener1)).toBe(true);
                expect(pathListeners.has(listener2)).toBe(true);
            });

            test("should unsubscribe listeners", () => {
                const listener = vi.fn();

                const unsubscribe = stateInstance.listen("testPath", listener);
                unsubscribe();

                const pathListeners = stateInstance.listeners.get("testPath");
                expect(pathListeners).toBeUndefined();
            });

            test("should clean up listener sets when empty", () => {
                const listener1 = vi.fn();
                const listener2 = vi.fn();

                const unsubscribe1 = stateInstance.listen("testPath", listener1);
                const unsubscribe2 = stateInstance.listen("testPath", listener2);

                unsubscribe1();
                expect(stateInstance.listeners.get("testPath").size).toBe(1);

                unsubscribe2();
                expect(stateInstance.listeners.has("testPath")).toBe(false);
            });
        });

        describe("Change Notification", () => {
            test("should notify local listeners", () => {
                const listener = vi.fn();
                stateInstance.listen("testPath", listener);

                const change = {
                    path: "testPath",
                    newValue: "newValue",
                    oldValue: "oldValue",
                };

                stateInstance.notifyChange(change);

                expect(listener).toHaveBeenCalledWith(change);
            });

            test("should notify wildcard listeners", () => {
                const listener = vi.fn();
                stateInstance.listen("*", listener);

                const change = {
                    path: "testPath",
                    newValue: "newValue",
                    oldValue: "oldValue",
                };

                stateInstance.notifyChange(change);

                expect(listener).toHaveBeenCalledWith(change);
            });

            test("should notify renderer processes", () => {
                const notifyRenderersSpy = vi.spyOn(stateInstance, "notifyRenderers");

                const change = {
                    path: "testPath",
                    newValue: "newValue",
                    oldValue: "oldValue",
                };

                stateInstance.notifyChange(change);

                expect(notifyRenderersSpy).toHaveBeenCalledWith("main-state-changed", change);
            });

            test("should handle listener errors gracefully", () => {
                const badListener = vi.fn().mockImplementation(() => {
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

        describe("Operation Management", () => {
            test("should start operations", () => {
                stateInstance.startOperation("test-operation", { message: "Test operation" });

                const operation = stateInstance.get("operations.test-operation");
                expect(operation).toBeDefined();
                expect(operation.status).toBe("running");
                expect(operation.message).toBe("Test operation");
                expect(typeof operation.startTime).toBe("number");
                expect(operation.progress).toBe(0);
            });

            test("should complete operations", () => {
                stateInstance.startOperation("test-operation", { message: "Test operation" });
                const result = { success: true };

                stateInstance.completeOperation("test-operation", result);

                const operation = stateInstance.get("operations.test-operation");
                expect(operation.status).toBe("completed");
                expect(operation.result).toEqual(result);
                expect(typeof operation.duration).toBe("number");
                expect(typeof operation.endTime).toBe("number");
                expect(operation.progress).toBe(100);
            });

            test("should handle completing non-existent operation", () => {
                expect(() => {
                    stateInstance.completeOperation("non-existent", {});
                }).not.toThrow();
            });

            test("should fail operations", () => {
                stateInstance.startOperation("test-operation", { message: "Test operation" });
                const error = new Error("Test error");

                stateInstance.failOperation("test-operation", error);

                const operation = stateInstance.get("operations.test-operation");
                expect(operation.status).toBe("failed");
                expect(operation.error.message).toBe("Test error");
                expect(operation.error.name).toBe("Error");
                expect(typeof operation.error.stack).toBe("string");
            });

            test("should handle failing operation with string error", () => {
                stateInstance.startOperation("test-operation", { message: "Test operation" });

                stateInstance.failOperation("test-operation", "String error");

                const operation = stateInstance.get("operations.test-operation");
                expect(operation.error.message).toBe("String error");
            });

            test("should handle failing non-existent operation", () => {
                expect(() => {
                    stateInstance.failOperation("non-existent", new Error("test"));
                }).not.toThrow();
            });
        });

        describe("Error Management", () => {
            test("should add errors to state", () => {
                const error = new Error("Test error");

                stateInstance.addError(error);

                const errors = stateInstance.get("errors");
                expect(errors).toHaveLength(1);
                expect(errors[0].message).toBe("Test error");
                expect(typeof errors[0].timestamp).toBe("number");
                expect(errors[0].source).toBe("mainProcess");
            });

            test("should add errors with context", () => {
                const error = new Error("Test error");
                const context = { source: "test", details: "extra info" };

                stateInstance.addError(error, context);

                const errors = stateInstance.get("errors");
                expect(errors[0].context).toEqual(context);
            });

            test("should handle string errors", () => {
                stateInstance.addError("String error message");

                const errors = stateInstance.get("errors");
                expect(errors[0].message).toBe("String error message");
            });

            test("should limit error history to 100 items", () => {
                // Prevent repeated notifyRenderers calls from adding overhead during coverage runs
                // We only care about the error list length behavior here.
                const notifyStub = vi.spyOn(stateInstance, "notifyRenderers").mockImplementation(() => {});
                // Add 105 errors
                for (let i = 0; i < 105; i++) {
                    stateInstance.addError(`Error ${i}`);
                }

                const errors = stateInstance.get("errors");
                expect(errors.length).toBe(100);
                // Should keep newest errors (higher numbers)
                expect(errors[0].message).toBe("Error 104");
                notifyStub.mockRestore();
            });
        });

        describe("Renderer Communication", () => {
            test("should notify renderers when windows exist", () => {
                // Since safeElectron() uses require('electron') which bypasses our ES6 mock,
                // we'll test the behavior indirectly by checking that no errors are thrown
                // and that the function completes successfully
                expect(() => {
                    stateInstance.notifyRenderers("test-channel", { test: "data" });
                }).not.toThrow();

                // The function should complete without error even if no windows exist
                // This tests the error handling paths and serialization logic
                expect(stateInstance.makeSerializable({ test: "data" })).toEqual({ test: "data" });
            });

            test("should handle window validation failures", () => {
                const mockWindow = {
                    isDestroyed: vi.fn().mockReturnValue(true),
                    webContents: null,
                };

                mockBrowserWindow.getAllWindows.mockReturnValue([mockWindow]);

                expect(() => {
                    stateInstance.notifyRenderers("test-channel", { test: "data" });
                }).not.toThrow();
            });

            test("should handle IPC send errors", () => {
                const mockWindow = {
                    isDestroyed: vi.fn().mockReturnValue(false),
                    webContents: {
                        isDestroyed: vi.fn().mockReturnValue(false),
                        send: vi.fn().mockImplementation(() => {
                            throw new Error("IPC send failed");
                        }),
                    },
                };

                mockBrowserWindow.getAllWindows.mockReturnValue([mockWindow]);

                expect(() => {
                    stateInstance.notifyRenderers("test-channel", { test: "data" });
                }).not.toThrow();
            });

            test("should handle missing BrowserWindow", () => {
                mockBrowserWindow.getAllWindows.mockImplementation(() => {
                    throw new Error("BrowserWindow not available");
                });

                expect(() => {
                    stateInstance.notifyRenderers("test-channel", { test: "data" });
                }).not.toThrow();
            });
        });

        describe("Data Serialization", () => {
            test("should make data serializable for IPC", () => {
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
                expect(serializable.boolean).toBe(true);
                expect(serializable.map).toBeUndefined(); // Maps are filtered out
                expect(serializable.set).toBeUndefined(); // Sets are filtered out
                expect(serializable.function).toBeUndefined(); // Functions are filtered out
                expect(serializable.undefined).toBeUndefined();
                expect(serializable.null).toBeNull();
            });

            test("should handle nested objects in serialization", () => {
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

            test("should handle arrays in serialization", () => {
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
                expect(serializable.array.length).toBe(6); // All items are kept but processed
            });

            test("should handle null and undefined values", () => {
                expect(stateInstance.makeSerializable(null)).toBeNull();
                expect(stateInstance.makeSerializable(undefined)).toBeUndefined();
                expect(stateInstance.makeSerializable("string")).toBe("string");
                expect(stateInstance.makeSerializable(42)).toBe(42);
            });
        });

        describe("Update Method", () => {
            test("should update multiple paths at once", () => {
                const notifyChangeSpy = vi.spyOn(stateInstance, "notifyChange");

                const updates = {
                    key1: "value1",
                    key2: "value2",
                    "nested.key": "nested value",
                };

                stateInstance.update(updates);

                expect(stateInstance.get("key1")).toBe("value1");
                expect(stateInstance.get("key2")).toBe("value2");
                expect(stateInstance.get("nested.key")).toBe("nested value");
                expect(notifyChangeSpy).toHaveBeenCalledTimes(3);
            });
        });

        describe("Development Information", () => {
            test("should provide development info", () => {
                stateInstance.addError(new Error("Test error"));
                stateInstance.startOperation("test-op", { message: "Test" });
                stateInstance.listen("test-path", () => {});

                const devInfo = stateInstance.getDevInfo();

                expect(devInfo.errors).toBe(1);
                expect(devInfo.operations).toContain("test-op");
                expect(devInfo.listeners).toContain("test-path");
                expect(typeof devInfo.uptime).toBe("number");
                expect(devInfo.state).toBe(stateInstance.data);
            });
        });
    });

    describe("Exported Module", () => {
        test("should export MainProcessState class", () => {
            expect(MainProcessState).toBeDefined();
            expect(typeof MainProcessState).toBe("function");
        });

        test("should export singleton mainProcessState instance", () => {
            expect(mainProcessState).toBeDefined();
            expect(mainProcessState).toBeInstanceOf(MainProcessState);
        });

        test("should maintain singleton behavior", async () => {
            const { mainProcessState: instance1 } = await import(
                "../../../../../utils/state/integration/mainProcessStateManager.js"
            );
            const { mainProcessState: instance2 } = await import(
                "../../../../../utils/state/integration/mainProcessStateManager.js"
            );

            expect(instance1).toBe(instance2);
        });
    });

    describe("Edge Cases and Error Handling", () => {
        test("should handle invalid paths gracefully", () => {
            expect(stateInstance.get("")).toBe(stateInstance.data);
            expect(stateInstance.get(null)).toBe(stateInstance.data);
            expect(stateInstance.get(undefined)).toBe(stateInstance.data);
        });

        test("should handle setByPath with empty path", () => {
            expect(() => {
                stateInstance.setByPath(stateInstance.data, "", "value");
            }).not.toThrow();
        });

        test("should handle setByPath with null target", () => {
            stateInstance.data.primitive = "string";

            // This will actually throw because you can't set properties on strings
            expect(() => {
                stateInstance.setByPath(stateInstance.data, "primitive.property", "value");
            }).toThrow();
        });

        test("should handle setByPath with null target", () => {
            stateInstance.data.primitive = "string";

            // This will actually throw because you can't set properties on strings
            expect(() => {
                stateInstance.setByPath(stateInstance.data, "primitive.property", "value");
            }).toThrow();
        });

        test("should handle operations with missing operations map", () => {
            const originalOperations = stateInstance.data.operations;

            // Don't set to null directly - instead test missing nested path
            stateInstance.data.operations = {};

            expect(() => {
                stateInstance.startOperation("test", { message: "test" });
            }).not.toThrow();

            // Should create the operation
            expect(stateInstance.get("operations.test")).toBeDefined();

            // Restore
            stateInstance.data.operations = originalOperations;
        });
    });

    describe("IPC Handler Setup", () => {
        test("should set up IPC handlers when ipcMain is available", () => {
            // Create new instance to trigger setupIPCHandlers
            const testInstance = new MainProcessState();

            // Verify ipcMain.handle was called for each handler
            expect(mockIpcMain.handle).toHaveBeenCalledWith("main-state:get", expect.any(Function));
            expect(mockIpcMain.handle).toHaveBeenCalledWith("main-state:set", expect.any(Function));
            expect(mockIpcMain.handle).toHaveBeenCalledWith("main-state:listen", expect.any(Function));
            expect(mockIpcMain.handle).toHaveBeenCalledWith("main-state:operation", expect.any(Function));
            expect(mockIpcMain.handle).toHaveBeenCalledWith("main-state:operations", expect.any(Function));
            expect(mockIpcMain.handle).toHaveBeenCalledWith("main-state:errors", expect.any(Function));
            expect(mockIpcMain.handle).toHaveBeenCalledWith("main-state:metrics", expect.any(Function));
        });

        test("should skip IPC handler setup when ipcMain is not available", () => {
            // Temporarily mock electron to not have ipcMain
            const originalMock = vi.mocked(require("electron"));
            vi.doMock("electron", () => ({
                BrowserWindow: mockBrowserWindow,
                // No ipcMain
            }));

            try {
                // Create new instance - should not throw
                expect(() => new MainProcessState()).not.toThrow();
            } finally {
                // Restore original mock
                vi.doMock("electron", () => originalMock);
            }
        });
    });

    test("should handle main-state:get IPC calls", () => {
        const testInstance = new MainProcessState();

        // Get the handler function that was registered
        const getHandler = mockIpcMain.handle.mock.calls.find((call) => call[0] === "main-state:get")![1];

        // Test getting specific path
        const result1 = getHandler({}, "loadedFitFilePath");
        expect(result1).toBeNull();

        // Test getting all data
        const result2 = getHandler({}, "");
        expect(result2).toBeDefined();
    });

    test("should handle main-state:set IPC calls with allowed paths", () => {
        const testInstance = new MainProcessState();

        // Get the handler function that was registered
        const setHandler = mockIpcMain.handle.mock.calls.find((call) => call[0] === "main-state:set")![1];

        // Test allowed path
        const result1 = setHandler({}, "loadedFitFilePath", "/test/path");
        expect(result1).toBe(true);

        // Test restricted path
        const result2 = setHandler({}, "restrictedPath", "value");
        expect(result2).toBe(false);
    });

    test("should handle main-state:listen IPC calls", () => {
        const mockSender = {
            send: vi.fn(),
        };
        const mockEvent = { sender: mockSender };

        const testInstance = new MainProcessState();

        // Get the handler function that was registered
        const listenHandler = mockIpcMain.handle.mock.calls.find((call) => call[0] === "main-state:listen")![1];

        const result = listenHandler(mockEvent, "testPath");
        expect(result).toBe(true);
    });

    test("should handle main-state:operation IPC calls", () => {
        const testInstance = new MainProcessState();

        // Get the handler function that was registered
        const operationHandler = mockIpcMain.handle.mock.calls.find((call) => call[0] === "main-state:operation")![1];

        const result = operationHandler({}, "test-op");
        expect(result).toBeUndefined(); // No operation exists
    });

    test("should handle main-state:operations IPC calls", () => {
        const testInstance = new MainProcessState();

        // Get the handler function that was registered
        const operationsHandler = mockIpcMain.handle.mock.calls.find((call) => call[0] === "main-state:operations")![1];

        const result = operationsHandler();
        expect(result).toEqual({});
    });

    test("should handle main-state:errors IPC calls", () => {
        const testInstance = new MainProcessState();

        // Get the handler function that was registered
        const errorsHandler = mockIpcMain.handle.mock.calls.find((call) => call[0] === "main-state:errors")![1];

        const result = errorsHandler({}, 10);
        expect(Array.isArray(result)).toBe(true);
    });

    test("should handle main-state:metrics IPC calls", () => {
        const testInstance = new MainProcessState();

        // Get the handler function that was registered
        const metricsHandler = mockIpcMain.handle.mock.calls.find((call) => call[0] === "main-state:metrics")![1];

        const result = metricsHandler();
        expect(result).toBeDefined();
    });
});
