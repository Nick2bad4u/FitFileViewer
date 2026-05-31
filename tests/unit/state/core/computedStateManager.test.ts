// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

describe("computedStateManager.js - comprehensive coverage", () => {
    let computedStateManager: any;
    let mockStateManager: any;
    let addComputed: any;
    let getComputed: any;
    let removeComputed: any;
    let initializeCommonComputedValues: any;
    let cleanupCommonComputedValues: any;
    let createReactiveComputed: any;

    beforeEach(async () => {
        vi.resetModules();

        // Mock performance.now for timing tests
        vi.stubGlobal("performance", {
            now: vi.fn().mockReturnValue(1000),
        });

        // Mock console methods
        vi.spyOn(console, "log").mockImplementation(() => {});
        vi.spyOn(console, "warn").mockImplementation(() => {});
        vi.spyOn(console, "error").mockImplementation(() => {});

        // Mock matchMedia for theme tests
        Object.defineProperty(globalThis, "matchMedia", {
            writable: true,
            value: vi.fn().mockImplementation((query) => ({
                matches: query.includes("dark"),
                media: query,
                onchange: null,
                addEventListener: vi.fn(),
                removeEventListener: vi.fn(),
                dispatchEvent: vi.fn(),
            })),
        });

        // Mock state manager with proper subscription handling
        let stateData = {
            globalData: {},
            app: {
                initialized: false,
                isOpeningFile: false,
                startTime: Date.now(),
            },
            ui: {
                activeTab: "summary",
                loading: false,
                notifications: [],
                controlsEnabled: false,
                tabsVisible: false,
            },
            settings: { theme: "dark", mapTheme: true },
            system: { lastActivity: Date.now() },
        };

        const subscriptions = new Map();

        mockStateManager = {
            getState: vi.fn((path: string) => {
                if (path === "") return stateData;
                const keys = path.split(".");
                let current = stateData;
                for (const key of keys) {
                    current = current?.[key];
                    if (current === undefined) break;
                }
                return current;
            }),
            setState: vi.fn((path: string, value: any) => {
                const keys = path.split(".");
                let current = stateData;
                for (let i = 0; i < keys.length - 1; i++) {
                    if (!current[keys[i]]) current[keys[i]] = {};
                    current = current[keys[i]];
                }
                current[keys[keys.length - 1]] = value;
            }),
            subscribe: vi.fn((path: string, callback: Function) => {
                if (!subscriptions.has(path)) {
                    subscriptions.set(path, new Set());
                }
                subscriptions.get(path).add(callback);

                // Return unsubscribe function
                return () => {
                    const pathSubs = subscriptions.get(path);
                    if (pathSubs) {
                        pathSubs.delete(callback);
                        if (pathSubs.size === 0) {
                            subscriptions.delete(path);
                        }
                    }
                };
            }),
            // Helper to trigger subscriptions
            triggerSubscriptions: (path: string) => {
                const pathSubs = subscriptions.get(path);
                if (pathSubs) {
                    pathSubs.forEach((callback) => callback());
                }
            },
        };

        vi.doMock(
            import("../../../../electron-app/utils/state/core/stateManager.js"),
            () => mockStateManager
        );

        // Import after mocking
        const module =
            await import("../../../../electron-app/utils/state/core/computedStateManager.js");
        computedStateManager = module.computedStateManager;
        addComputed = module.addComputed;
        getComputed = module.getComputed;
        removeComputed = module.removeComputed;
        initializeCommonComputedValues = module.initializeCommonComputedValues;
        cleanupCommonComputedValues = module.cleanupCommonComputedValues;
        createReactiveComputed = module.createReactiveComputed;
    });

    afterEach(() => {
        computedStateManager.cleanup();
        vi.clearAllMocks();
        vi.unstubAllGlobals();
    });

    describe("computedStateManager class", () => {
        describe("constructor", () => {
            it("should initialize with empty state", () => {
                expect.hasAssertions();
                expect(computedStateManager.computedValues).toBeInstanceOf(Map);
                expect(computedStateManager.dependencies).toBeInstanceOf(Map);
                expect(computedStateManager.subscriptions).toBeInstanceOf(Map);
                expect(computedStateManager.isComputing).toBeInstanceOf(Set);
                expect(computedStateManager.computedValues).not.toBe(
                    computedStateManager.dependencies
                );
                expect({
                    computedCount: computedStateManager.computedValues.size,
                    hasMissingComputed:
                        computedStateManager.computedValues.has(
                            "missingComputed"
                        ),
                }).toStrictEqual({
                    computedCount: 0,
                    hasMissingComputed: false,
                });
            });
        });

        describe("addComputed", () => {
            it("should register a new computed value with dependencies", () => {
                expect.hasAssertions();
                const computeFn = vi.fn((state) =>
                    state.globalData ? "loaded" : "empty"
                );
                const cleanup = computedStateManager.addComputed(
                    "testComputed",
                    computeFn,
                    ["globalData"]
                );

                expect(
                    computedStateManager.computedValues.has("testComputed")
                ).toStrictEqual(true);
                expect(
                    computedStateManager.dependencies.get("testComputed")
                ).toEqual(["globalData"]);
                expect(
                    computedStateManager.subscriptions.get("testComputed")
                ).toHaveLength(1);
                expect(
                    computedStateManager.dependencies.get("missingComputed")
                ).not.toEqual(["globalData"]);
                expect(cleanup).toBeTypeOf("function");
            });

            it("should replace existing computed value with warning", () => {
                expect.hasAssertions();
                const firstFn = vi.fn(() => "first");
                const secondFn = vi.fn(() => "second");

                computedStateManager.addComputed("duplicate", firstFn, []);
                computedStateManager.addComputed("duplicate", secondFn, []);

                expect(console.warn).toHaveBeenCalledWith(
                    expect.stringContaining(
                        'Computed value "duplicate" already exists, replacing...'
                    )
                );
                expect(
                    computedStateManager.computedValues.get("duplicate")
                        .computeFn
                ).toBe(secondFn);
            });

            it("should compute initial value on registration", () => {
                expect.hasAssertions();
                const computeFn = vi.fn(() => "computed-value");
                computedStateManager.addComputed("initialTest", computeFn, []);

                expect(computeFn).toHaveBeenCalled();
                expect(
                    computedStateManager.computedValues.get("initialTest").value
                ).toBe("computed-value");
            });

            it("should handle empty dependencies array", () => {
                expect.hasAssertions();
                const computeFn = vi.fn(() => "no-deps");
                computedStateManager.addComputed("noDeps", computeFn);

                expect(computedStateManager.dependencies.get("noDeps")).toEqual(
                    []
                );
                expect(
                    computedStateManager.computedValues.get("noDeps").value
                ).toBe("no-deps");
            });
        });

        describe("computeValue", () => {
            it("should compute and store value successfully", () => {
                expect.hasAssertions();
                const computeFn = vi.fn((state) =>
                    state.app?.initialized ? "ready" : "not-ready"
                );
                computedStateManager.addComputed("status", computeFn, [
                    "app.initialized",
                ]);

                const computed =
                    computedStateManager.computedValues.get("status");
                expect(computed.value).toBe("not-ready");
                expect({
                    error: computed.error,
                    isValid: computed.isValid,
                }).toStrictEqual({
                    error: null,
                    isValid: true,
                });
            });

            it("should handle computation errors gracefully", () => {
                expect.hasAssertions();
                const errorFn = vi.fn(() => {
                    throw new Error("Computation failed");
                });
                computedStateManager.addComputed("errorTest", errorFn, []);

                const computed =
                    computedStateManager.computedValues.get("errorTest");
                expect(computed.error).toBeInstanceOf(Error);
                expect(computed.isValid).toStrictEqual(false);
                expect(console.error).toHaveBeenCalledWith(
                    expect.stringContaining(
                        'Error computing value for "errorTest"'
                    ),
                    expect.any(Error)
                );
            });

            it("should prevent circular dependencies", () => {
                expect.hasAssertions();
                const circularFn = vi.fn(() => "circular");
                computedStateManager.computedValues.set("circular", {
                    computeFn: circularFn,
                    deps: [],
                    error: null,
                    isValid: false,
                    lastComputed: null,
                    value: undefined,
                });
                computedStateManager.isComputing.add("circular");

                computedStateManager.computeValue("circular");

                expect(console.error).toHaveBeenCalledWith(
                    expect.stringContaining(
                        'Circular dependency detected for computed value "circular"'
                    )
                );
                expect(circularFn).not.toHaveBeenCalled();
                expect(
                    computedStateManager.computedValues.get("circular")
                ).toMatchObject({
                    isValid: false,
                    value: undefined,
                });
            });

            it("should log slow computations", () => {
                expect.hasAssertions();
                vi.mocked(performance.now)
                    .mockReturnValueOnce(1000) // Start time
                    .mockReturnValueOnce(1015); // End time (15ms duration)

                const slowFn = vi.fn(() => "slow-result");
                computedStateManager.addComputed("slowTest", slowFn, []);

                expect(console.warn).toHaveBeenCalledWith(
                    expect.stringContaining(
                        'Slow computation for "slowTest": 15.00ms'
                    )
                );
                expect(
                    computedStateManager.computedValues.get("slowTest")
                ).toMatchObject({
                    error: null,
                    isValid: true,
                    value: "slow-result",
                });
            });

            it("should skip computation for non-existent keys", () => {
                expect.hasAssertions();
                const computedCount = computedStateManager.computedValues.size;

                expect(() =>
                    computedStateManager.computeValue("nonExistent")
                ).not.toThrow();

                expect(computedStateManager.computedValues.size).toBe(
                    computedCount
                );
                expect(console.error).not.toHaveBeenCalled();
            });
        });

        describe("getComputed", () => {
            it("should return computed value when valid", () => {
                expect.hasAssertions();
                const computeFn = vi.fn(() => "test-value");
                computedStateManager.addComputed("validTest", computeFn, []);

                const result = computedStateManager.getComputed("validTest");
                expect(result).toBe("test-value");
            });

            it("should recompute when value is invalid", () => {
                expect.hasAssertions();
                const computeFn = vi.fn(() => "recomputed-value");
                computedStateManager.addComputed("invalidTest", computeFn, []);

                // Manually invalidate
                const computed =
                    computedStateManager.computedValues.get("invalidTest");
                computed.isValid = false;
                computeFn.mockClear();

                const result = computedStateManager.getComputed("invalidTest");
                expect(computeFn).toHaveBeenCalled();
                expect(result).toBe("recomputed-value");
            });

            it("should recompute when there is an error", () => {
                expect.hasAssertions();
                const computeFn = vi.fn(() => "fixed-value");
                computedStateManager.addComputed("errorTest", computeFn, []);

                // Manually set error
                const computed =
                    computedStateManager.computedValues.get("errorTest");
                computed.error = new Error("Previous error");
                computeFn.mockClear();

                const result = computedStateManager.getComputed("errorTest");
                expect(computeFn).toHaveBeenCalled();
                expect(result).toBe("fixed-value");
            });

            it("should warn and return undefined for non-existent keys", () => {
                expect.hasAssertions();
                const result = computedStateManager.getComputed("nonExistent");
                expect({
                    result,
                    warning: vi.mocked(console.warn).mock.calls.at(-1)?.[0],
                }).toStrictEqual({
                    result: undefined,
                    warning:
                        '[ComputedState] Computed value "nonExistent" does not exist',
                });
            });
        });

        describe("invalidateComputed", () => {
            it("should mark computed value as invalid", () => {
                expect.hasAssertions();
                computedStateManager.addComputed(
                    "invalidateTest",
                    () => "value",
                    []
                );
                computedStateManager.invalidateComputed("invalidateTest");

                const computed =
                    computedStateManager.computedValues.get("invalidateTest");
                expect({
                    error: computed.error,
                    isValid: computed.isValid,
                }).toStrictEqual({
                    error: null,
                    isValid: false,
                });
            });

            it("should handle invalidation of non-existent keys gracefully", () => {
                expect.hasAssertions();
                const computedCount = computedStateManager.computedValues.size;

                expect(() =>
                    computedStateManager.invalidateComputed("nonExistent")
                ).not.toThrow();

                expect(computedStateManager.computedValues.size).toBe(
                    computedCount
                );
                expect(console.warn).not.toHaveBeenCalled();
            });
        });

        describe("removeComputed", () => {
            it("should remove computed value and clean up subscriptions", () => {
                expect.hasAssertions();
                const unsubscribe = vi.fn();
                computedStateManager.addComputed("removeTest", () => "value", [
                    "globalData",
                ]);
                // Manually set up the subscription for testing cleanup
                computedStateManager.subscriptions.set("removeTest", [
                    unsubscribe,
                ]);

                computedStateManager.removeComputed("removeTest");

                expect({
                    hasComputed:
                        computedStateManager.computedValues.has("removeTest"),
                    hasDependency:
                        computedStateManager.dependencies.has("removeTest"),
                    hasSubscription:
                        computedStateManager.subscriptions.has("removeTest"),
                }).toStrictEqual({
                    hasComputed: false,
                    hasDependency: false,
                    hasSubscription: false,
                });
                expect(unsubscribe).toHaveBeenCalled();
            });

            it("should warn when removing non-existent computed value", () => {
                expect.hasAssertions();
                const computedCount = computedStateManager.computedValues.size;

                computedStateManager.removeComputed("nonExistent");

                expect(computedStateManager.computedValues.size).toBe(
                    computedCount
                );
                expect(console.warn).toHaveBeenCalledWith(
                    expect.stringContaining(
                        'Computed value "nonExistent" does not exist'
                    )
                );
            });

            it("should handle subscriptions cleanup safely", () => {
                expect.hasAssertions();
                computedStateManager.subscriptions.set("cleanupTest", [
                    null,
                    undefined,
                    vi.fn(),
                ]);
                computedStateManager.addComputed(
                    "cleanupTest",
                    () => "value",
                    []
                );

                // Should not throw error even with invalid unsubscribe functions
                expect(() =>
                    computedStateManager.removeComputed("cleanupTest")
                ).not.toThrow();
            });
        });

        describe("recomputeAll", () => {
            it("should invalidate and recompute all computed values", () => {
                expect.hasAssertions();
                let firstVersion = 0;
                let secondVersion = 0;
                const fn1 = vi.fn(() => `value1-${++firstVersion}`);
                const fn2 = vi.fn(() => `value2-${++secondVersion}`);

                computedStateManager.addComputed("test1", fn1, []);
                computedStateManager.addComputed("test2", fn2, []);

                fn1.mockClear();
                fn2.mockClear();

                computedStateManager.recomputeAll();

                expect(fn1).toHaveBeenCalled();
                expect(fn2).toHaveBeenCalled();
                expect(
                    computedStateManager.computedValues.get("test1")
                ).toMatchObject({
                    error: null,
                    isValid: true,
                    value: "value1-2",
                });
                expect(
                    computedStateManager.computedValues.get("test2")
                ).toMatchObject({
                    error: null,
                    isValid: true,
                    value: "value2-2",
                });
                expect(
                    computedStateManager.computedValues.has("missing")
                ).not.toStrictEqual(true);
            });
        });

        describe("getAllComputed", () => {
            it("should return all computed values with metadata", () => {
                expect.hasAssertions();
                computedStateManager.addComputed("meta1", () => "value1", [
                    "dep1",
                ]);
                computedStateManager.addComputed("meta2", () => "value2", [
                    "dep2",
                ]);

                const result = computedStateManager.getAllComputed();

                expect(result).toHaveProperty("meta1");
                expect(result).toHaveProperty("meta2");
                expect(result.meta1).toMatchObject({
                    dependencies: ["dep1"],
                    value: "value1",
                    isValid: true,
                    error: null,
                });
            });
        });

        describe("getDependencyGraph", () => {
            it("should return dependency relationships", () => {
                expect.hasAssertions();
                computedStateManager.addComputed("graph1", () => "value1", [
                    "dep1",
                    "dep2",
                ]);
                computedStateManager.addComputed("graph2", () => "value2", [
                    "dep3",
                ]);

                const graph = computedStateManager.getDependencyGraph();

                expect(graph).toEqual({
                    graph1: ["dep1", "dep2"],
                    graph2: ["dep3"],
                });
                expect(graph).not.toHaveProperty("missing");
            });
        });

        describe("cleanup", () => {
            it("should clean up all state and subscriptions", () => {
                expect.hasAssertions();
                computedStateManager.addComputed("cleanup1", () => "value1", [
                    "globalData",
                ]);
                computedStateManager.addComputed("cleanup2", () => "value2", [
                    "ui",
                ]);

                computedStateManager.cleanup();

                expect({
                    computedCount: computedStateManager.computedValues.size,
                    dependencyCount: computedStateManager.dependencies.size,
                    hasCleanupComputed:
                        computedStateManager.computedValues.has("cleanup1"),
                    isComputingCount: computedStateManager.isComputing.size,
                    subscriptionCount: computedStateManager.subscriptions.size,
                }).toStrictEqual({
                    computedCount: 0,
                    dependencyCount: 0,
                    hasCleanupComputed: false,
                    isComputingCount: 0,
                    subscriptionCount: 0,
                });
                expect(
                    computedStateManager.computedValues.has("cleanup2")
                ).not.toStrictEqual(true);
            });
        });
    });

    describe("convenience functions", () => {
        describe("addComputed", () => {
            it("should delegate to computedStateManager.addComputed", () => {
                expect.assertions(4);
                const computeFn = () => "convenience-test";
                const cleanup = addComputed("convenience", computeFn, ["dep"]);

                expect(
                    computedStateManager.computedValues.has("convenience")
                ).toStrictEqual(true);
                vi.mocked(console.warn).mockClear();
                let result: unknown;
                expect(() => {
                    result = getComputed("missingConvenience");
                }).not.toThrow();
                expect({
                    result,
                    warning: vi.mocked(console.warn).mock.calls.at(-1)?.[0],
                }).toStrictEqual({
                    result: undefined,
                    warning:
                        '[ComputedState] Computed value "missingConvenience" does not exist',
                });
                expect(typeof cleanup).toBe("function");
            });
        });

        describe("getComputed", () => {
            it("should delegate to computedStateManager.getComputed", () => {
                expect.assertions(3);
                computedStateManager.addComputed(
                    "getTest",
                    () => "get-value",
                    []
                );
                const result = getComputed("getTest");
                expect(result).toBe("get-value");
                vi.mocked(console.warn).mockClear();
                let missingResult: unknown;
                expect(() => {
                    missingResult = getComputed("missingGetTest");
                }).not.toThrow();
                expect({
                    result: missingResult,
                    warning: vi.mocked(console.warn).mock.calls.at(-1)?.[0],
                }).toStrictEqual({
                    result: undefined,
                    warning:
                        '[ComputedState] Computed value "missingGetTest" does not exist',
                });
            });
        });

        describe("removeComputed", () => {
            it("should delegate to computedStateManager.removeComputed", () => {
                expect.hasAssertions();
                computedStateManager.addComputed(
                    "removeTest",
                    () => "remove-value",
                    []
                );
                removeComputed("removeTest");
                expect(
                    computedStateManager.computedValues.has("removeTest")
                ).not.toStrictEqual(true);

                removeComputed("removeTest");
                expect(console.warn).toHaveBeenCalledWith(
                    expect.stringContaining(
                        'Computed value "removeTest" does not exist'
                    )
                );
            });
        });
    });

    describe("createReactiveComputed", () => {
        it("should create property descriptor with getter", () => {
            expect.hasAssertions();
            const descriptor = createReactiveComputed(
                "reactive",
                () => "reactive-value",
                ["dep"]
            );

            expect(descriptor).toMatchObject({
                configurable: true,
                enumerable: true,
                get: expect.any(Function),
            });

            expect(descriptor.get()).toBe("reactive-value");
        });
    });

    describe("common computed values", () => {
        describe("initializeCommonComputedValues", () => {
            it("should initialize all predefined computed values", () => {
                expect.hasAssertions();
                initializeCommonComputedValues();

                const expectedKeys = [
                    "isFileLoaded",
                    "isAppReady",
                    "hasChartData",
                    "hasMapData",
                    "summaryData",
                    "performanceMetrics",
                    "themeInfo",
                    "uiStateSummary",
                ];

                for (const key of expectedKeys) {
                    expect(
                        computedStateManager.computedValues.has(key)
                    ).toStrictEqual(true);
                }
            });

            it("should compute isFileLoaded correctly", () => {
                expect.hasAssertions();
                initializeCommonComputedValues();

                // Test with empty globalData
                let result = getComputed("isFileLoaded");
                expect(result).toStrictEqual(false);

                // Test with data
                mockStateManager.setState("globalData", { records: ["data"] });
                computedStateManager.invalidateComputed("isFileLoaded");
                result = getComputed("isFileLoaded");
                expect(result).toStrictEqual(true);
            });

            it("should compute isAppReady correctly", () => {
                expect.hasAssertions();
                initializeCommonComputedValues();

                mockStateManager.setState("app", {
                    initialized: true,
                    isOpeningFile: false,
                });
                computedStateManager.invalidateComputed("isAppReady");
                const result = getComputed("isAppReady");
                expect(result).toStrictEqual(true);
            });

            it("should compute hasChartData correctly", () => {
                expect.hasAssertions();
                initializeCommonComputedValues();

                mockStateManager.setState("globalData", {
                    recordMesgs: [{ data: "test" }],
                });
                computedStateManager.invalidateComputed("hasChartData");
                const result = getComputed("hasChartData");
                expect(result).toStrictEqual(true);
            });

            it("should compute hasMapData correctly", () => {
                expect.hasAssertions();
                initializeCommonComputedValues();

                mockStateManager.setState("globalData", {
                    recordMesgs: [{ positionLat: 123, positionLong: 456 }],
                });
                computedStateManager.invalidateComputed("hasMapData");
                const result = getComputed("hasMapData");
                expect(result).toStrictEqual(true);
            });

            it("should compute summaryData correctly", () => {
                expect.hasAssertions();
                initializeCommonComputedValues();

                const sessionData = {
                    avgHeartRate: 140,
                    avgPower: 250,
                    maxSpeed: 45,
                    totalDistance: 10000,
                };
                mockStateManager.setState("globalData", {
                    sessionMesgs: [sessionData],
                });
                computedStateManager.invalidateComputed("summaryData");
                const result = getComputed("summaryData");

                expect(result).toMatchObject({
                    avgHeartRate: 140,
                    avgPower: 250,
                    maxSpeed: 45,
                    totalDistance: 10000,
                });
            });

            it("should compute themeInfo correctly", () => {
                expect.hasAssertions();
                initializeCommonComputedValues();

                mockStateManager.setState("settings", {
                    theme: "dark",
                    mapTheme: true,
                });
                computedStateManager.invalidateComputed("themeInfo");
                const result = getComputed("themeInfo");

                expect(result).toMatchObject({
                    currentTheme: "dark",
                    isDarkTheme: true,
                    isLightTheme: false,
                    mapThemeInverted: true,
                });
            });

            it("should handle auto theme with matchMedia", () => {
                expect.hasAssertions();
                initializeCommonComputedValues();

                mockStateManager.setState("settings", {
                    theme: "auto",
                    mapTheme: true,
                });
                computedStateManager.invalidateComputed("themeInfo");
                const result = getComputed("themeInfo");

                expect(result.currentTheme).toBe("auto");
                expect(result.isDarkTheme).toStrictEqual(true); // Based on mock matchMedia
            });
        });

        describe("cleanupCommonComputedValues", () => {
            it("should remove all common computed values", () => {
                expect.hasAssertions();
                initializeCommonComputedValues();

                const initialCount = computedStateManager.computedValues.size;
                expect(initialCount).toBeGreaterThan(0);

                cleanupCommonComputedValues();

                const finalCount = computedStateManager.computedValues.size;
                expect(finalCount).toBeLessThan(initialCount);
                expect(
                    computedStateManager.computedValues.has("isFileLoaded")
                ).not.toStrictEqual(true);
            });
        });
    });

    describe("state reactivity", () => {
        it("should trigger recomputation when dependencies change", () => {
            expect.hasAssertions();
            const computeFn = vi.fn(
                (state) => state.globalData?.test || "default"
            );
            computedStateManager.addComputed("reactive", computeFn, [
                "globalData.test",
            ]);

            expect(computeFn).toHaveBeenCalledTimes(1); // Initial computation
            expect(getComputed("reactive")).toBe("default");

            // Test that the subscription was set up
            expect(mockStateManager.subscribe).toHaveBeenCalledWith(
                "globalData.test",
                expect.any(Function)
            );

            mockStateManager.setState("globalData.test", "updated");
            mockStateManager.triggerSubscriptions("globalData.test");

            expect(
                computedStateManager.computedValues.get("reactive").isValid
            ).toStrictEqual(false);
            expect(getComputed("reactive")).toBe("updated");
            expect(
                computedStateManager.dependencies.get("reactive")
            ).not.toContain("globalData.missing");
        });

        it("should handle multiple dependencies correctly", () => {
            expect.hasAssertions();
            const computeFn = vi.fn(
                (state) => `${state.app?.status}-${state.ui?.mode}`
            );
            computedStateManager.addComputed("multiDep", computeFn, [
                "app.status",
                "ui.mode",
            ]);

            expect(getComputed("multiDep")).toBe("undefined-undefined");

            expect(mockStateManager.subscribe).toHaveBeenCalledWith(
                "app.status",
                expect.any(Function)
            );
            expect(mockStateManager.subscribe).toHaveBeenCalledWith(
                "ui.mode",
                expect.any(Function)
            );

            mockStateManager.setState("app.status", "ready");
            mockStateManager.setState("ui.mode", "edit");
            mockStateManager.triggerSubscriptions("app.status");

            expect(getComputed("multiDep")).toBe("ready-edit");
            expect(
                computedStateManager.dependencies.get("multiDep")
            ).not.toContain("globalData.test");
        });
    });

    describe("error handling", () => {
        it("should handle state manager errors gracefully", () => {
            expect.hasAssertions();
            mockStateManager.getState.mockImplementationOnce(() => {
                throw new Error("State access error");
            });

            const computeFn = vi.fn((state) => state.test);
            computedStateManager.addComputed("errorState", computeFn, []);

            const computed =
                computedStateManager.computedValues.get("errorState");
            expect(computed.error).toBeInstanceOf(Error);
            expect(computed.isValid).toStrictEqual(false);
        });

        it("should handle subscription setup errors", () => {
            expect.hasAssertions();
            mockStateManager.subscribe.mockImplementationOnce(() => {
                throw new Error("Subscription error");
            });

            expect(() => {
                computedStateManager.addComputed("subError", () => "value", [
                    "test",
                ]);
            }).toThrow("Subscription error");
        });
    });
});
