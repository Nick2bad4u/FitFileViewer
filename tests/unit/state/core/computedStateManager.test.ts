// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

type MockMediaQueryList = {
    addEventListener: () => void;
    dispatchEvent: () => void;
    matches: boolean;
    media: string;
    onchange: null;
    removeEventListener: () => void;
};

function getRequiredLastMockCall(
    mockFn: { mock: { calls: any[][] } },
    label: string
): any[] {
    const call = mockFn.mock.calls.at(-1);

    if (!call) {
        throw new Error(`Expected ${label} to have been called`);
    }

    return call;
}

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
            now: vi.fn<() => number>().mockReturnValue(1000),
        });

        // Mock console methods
        vi.spyOn(console, "log").mockImplementation(() => {});
        vi.spyOn(console, "warn").mockImplementation(() => {});
        vi.spyOn(console, "error").mockImplementation(() => {});

        // Mock matchMedia for theme tests
        Object.defineProperty(globalThis, "matchMedia", {
            writable: true,
            value: vi.fn<(query: string) => MockMediaQueryList>((query) => ({
                matches: query.includes("dark"),
                media: query,
                onchange: null,
                addEventListener: vi.fn<() => void>(),
                removeEventListener: vi.fn<() => void>(),
                dispatchEvent: vi.fn<() => void>(),
            })),
        });

        // Mock state manager with proper subscription handling
        let stateData: any = {
            fitFile: {
                rawData: null,
            },
            sampleData: {},
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

        const subscriptions = new Map<string, Set<() => void>>();

        mockStateManager = {
            getState: vi.fn<(path: string) => any>((path) => {
                if (path === "") return stateData;
                const keys = path.split(".");
                let current = stateData;
                for (const key of keys) {
                    current = current?.[key];
                    if (current === undefined) break;
                }
                return current;
            }),
            setState: vi.fn<(path: string, value: any) => void>(
                (path, value) => {
                    const keys = path.split(".");
                    let current = stateData;
                    for (let i = 0; i < keys.length - 1; i++) {
                        if (!current[keys[i]]) current[keys[i]] = {};
                        current = current[keys[i]];
                    }
                    current[keys[keys.length - 1]] = value;
                }
            ),
            subscribe: vi.fn<
                (path: string, callback: () => void) => () => void
            >((path, callback) => {
                if (!subscriptions.has(path)) {
                    subscriptions.set(path, new Set());
                }
                subscriptions.get(path)?.add(callback);

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
                expect.assertions(6);
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
                expect.assertions(5);
                const computeFn = vi.fn<(state: any) => string>((state) =>
                    state.sampleData ? "loaded" : "empty"
                );
                const cleanup = computedStateManager.addComputed(
                    "testComputed",
                    computeFn,
                    ["sampleData"]
                );

                expect(
                    computedStateManager.computedValues.has("testComputed")
                ).toStrictEqual(true);
                expect(
                    computedStateManager.dependencies.get("testComputed")
                ).toEqual(["sampleData"]);
                expect(
                    computedStateManager.subscriptions.get("testComputed")
                ).toHaveLength(1);
                expect(
                    computedStateManager.dependencies.get("missingComputed")
                ).not.toEqual(["sampleData"]);
                expect(cleanup).toBeTypeOf("function");
            });

            it("should replace existing computed value with warning", () => {
                expect.assertions(2);
                const firstFn = vi.fn<() => string>(() => "first");
                const secondFn = vi.fn<() => string>(() => "second");

                computedStateManager.addComputed("duplicate", firstFn, []);
                computedStateManager.addComputed("duplicate", secondFn, []);

                expect(console.warn).toHaveBeenCalledWith(
                    '[ComputedState] Computed value "duplicate" already exists, replacing...'
                );
                expect(
                    computedStateManager.computedValues.get("duplicate")
                        .computeFn
                ).toBe(secondFn);
            });

            it("should compute initial value on registration", () => {
                expect.assertions(2);
                const computeFn = vi.fn<() => string>(() => "computed-value");
                computedStateManager.addComputed("initialTest", computeFn, []);

                expect(
                    getRequiredLastMockCall(computeFn, "computeFn")[0]
                        .sampleData
                ).toEqual({});
                expect(
                    computedStateManager.computedValues.get("initialTest").value
                ).toBe("computed-value");
            });

            it("should handle empty dependencies array", () => {
                expect.assertions(2);
                const computeFn = vi.fn<() => string>(() => "no-deps");
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
                expect.assertions(2);
                const computeFn = vi.fn<(state: any) => string>((state) =>
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
                expect.assertions(3);
                const computationError = new Error("Computation failed");
                const errorFn = vi.fn<() => never>(() => {
                    throw computationError;
                });
                computedStateManager.addComputed("errorTest", errorFn, []);

                const computed =
                    computedStateManager.computedValues.get("errorTest");
                expect(computed.error).toBeInstanceOf(Error);
                expect(computed.isValid).toStrictEqual(false);
                expect(console.error).toHaveBeenCalledWith(
                    '[ComputedState] Error computing value for "errorTest":',
                    computationError
                );
            });

            it("should prevent circular dependencies", () => {
                expect.assertions(3);
                const circularFn = vi.fn<() => string>(() => "circular");
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
                    '[ComputedState] Circular dependency detected for computed value "circular"'
                );
                expect(circularFn).not.toHaveBeenCalled();
                const computed =
                    computedStateManager.computedValues.get("circular");
                expect({
                    isValid: computed.isValid,
                    value: computed.value,
                }).toStrictEqual({
                    isValid: false,
                    value: undefined,
                });
            });

            it("should log slow computations", () => {
                expect.assertions(2);
                vi.mocked(performance.now)
                    .mockReturnValueOnce(1000) // Start time
                    .mockReturnValueOnce(1015); // End time (15ms duration)

                const slowFn = vi.fn<() => string>(() => "slow-result");
                computedStateManager.addComputed("slowTest", slowFn, []);

                expect(console.warn).toHaveBeenCalledWith(
                    '[ComputedState] Slow computation for "slowTest": 15.00ms'
                );
                const computed =
                    computedStateManager.computedValues.get("slowTest");
                expect({
                    error: computed.error,
                    isValid: computed.isValid,
                    value: computed.value,
                }).toStrictEqual({
                    error: null,
                    isValid: true,
                    value: "slow-result",
                });
            });

            it("should skip computation for non-existent keys", () => {
                expect.assertions(3);
                const computedCount = computedStateManager.computedValues.size;

                expect(
                    computedStateManager.computeValue("nonExistent")
                ).toBeUndefined();

                expect(computedStateManager.computedValues.size).toBe(
                    computedCount
                );
                expect(console.error).not.toHaveBeenCalled();
            });
        });

        describe("getComputed", () => {
            it("should return computed value when valid", () => {
                expect.assertions(1);
                const computeFn = vi.fn<() => string>(() => "test-value");
                computedStateManager.addComputed("validTest", computeFn, []);

                const result = computedStateManager.getComputed("validTest");
                expect(result).toBe("test-value");
            });

            it("should recompute when value is invalid", () => {
                expect.assertions(2);
                const computeFn = vi.fn<() => string>(() => "recomputed-value");
                computedStateManager.addComputed("invalidTest", computeFn, []);

                // Manually invalidate
                const computed =
                    computedStateManager.computedValues.get("invalidTest");
                computed.isValid = false;
                computeFn.mockClear();

                const result = computedStateManager.getComputed("invalidTest");
                expect(
                    getRequiredLastMockCall(computeFn, "computeFn")[0]
                        .sampleData
                ).toEqual({});
                expect(result).toBe("recomputed-value");
            });

            it("should recompute when there is an error", () => {
                expect.assertions(2);
                const computeFn = vi.fn<() => string>(() => "fixed-value");
                computedStateManager.addComputed("errorTest", computeFn, []);

                // Manually set error
                const computed =
                    computedStateManager.computedValues.get("errorTest");
                computed.error = new Error("Previous error");
                computeFn.mockClear();

                const result = computedStateManager.getComputed("errorTest");
                expect(
                    getRequiredLastMockCall(computeFn, "computeFn")[0]
                        .sampleData
                ).toEqual({});
                expect(result).toBe("fixed-value");
            });

            it("should warn and return undefined for non-existent keys", () => {
                expect.assertions(1);
                const result = computedStateManager.getComputed("nonExistent");
                expect({
                    result,
                    warning: getRequiredLastMockCall(
                        vi.mocked(console.warn),
                        "console.warn"
                    )[0],
                }).toStrictEqual({
                    result: undefined,
                    warning:
                        '[ComputedState] Computed value "nonExistent" does not exist',
                });
            });
        });

        describe("invalidateComputed", () => {
            it("should mark computed value as invalid", () => {
                expect.assertions(1);
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
                expect.assertions(3);
                const computedCount = computedStateManager.computedValues.size;

                expect(
                    computedStateManager.invalidateComputed("nonExistent")
                ).toBeUndefined();

                expect(computedStateManager.computedValues.size).toBe(
                    computedCount
                );
                expect(console.warn).not.toHaveBeenCalled();
            });
        });

        describe("removeComputed", () => {
            it("should remove computed value and clean up subscriptions", () => {
                expect.assertions(2);
                const unsubscribe = vi.fn<() => void>();
                computedStateManager.addComputed("removeTest", () => "value", [
                    "sampleData",
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
                expect(unsubscribe).toHaveBeenCalledWith();
            });

            it("should warn when removing non-existent computed value", () => {
                expect.assertions(2);
                const computedCount = computedStateManager.computedValues.size;

                computedStateManager.removeComputed("nonExistent");

                expect(computedStateManager.computedValues.size).toBe(
                    computedCount
                );
                expect(console.warn).toHaveBeenCalledWith(
                    '[ComputedState] Computed value "nonExistent" does not exist'
                );
            });

            it("should handle subscriptions cleanup safely", () => {
                expect.assertions(2);
                computedStateManager.subscriptions.set("cleanupTest", [
                    null,
                    undefined,
                    vi.fn<() => void>(),
                ]);
                computedStateManager.addComputed(
                    "cleanupTest",
                    () => "value",
                    []
                );

                expect(
                    computedStateManager.removeComputed("cleanupTest")
                ).toBeUndefined();
                expect(
                    computedStateManager.computedValues.has("cleanupTest")
                ).not.toStrictEqual(true);
            });
        });

        describe("recomputeAll", () => {
            it("should invalidate and recompute all computed values", () => {
                expect.assertions(5);
                let firstVersion = 0;
                let secondVersion = 0;
                const fn1 = vi.fn<() => string>(
                    () => `value1-${++firstVersion}`
                );
                const fn2 = vi.fn<() => string>(
                    () => `value2-${++secondVersion}`
                );

                computedStateManager.addComputed("test1", fn1, []);
                computedStateManager.addComputed("test2", fn2, []);

                fn1.mockClear();
                fn2.mockClear();

                computedStateManager.recomputeAll();

                expect(
                    getRequiredLastMockCall(fn1, "fn1")[0].sampleData
                ).toEqual({});
                expect(
                    getRequiredLastMockCall(fn2, "fn2")[0].sampleData
                ).toEqual({});
                const firstComputed =
                    computedStateManager.computedValues.get("test1");
                expect({
                    error: firstComputed.error,
                    isValid: firstComputed.isValid,
                    value: firstComputed.value,
                }).toStrictEqual({
                    error: null,
                    isValid: true,
                    value: "value1-2",
                });
                const secondComputed =
                    computedStateManager.computedValues.get("test2");
                expect({
                    error: secondComputed.error,
                    isValid: secondComputed.isValid,
                    value: secondComputed.value,
                }).toStrictEqual({
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
                expect.assertions(3);
                computedStateManager.addComputed("meta1", () => "value1", [
                    "dep1",
                ]);
                computedStateManager.addComputed("meta2", () => "value2", [
                    "dep2",
                ]);

                const result = computedStateManager.getAllComputed();

                expect(result).toHaveProperty("meta1");
                expect(result).toHaveProperty("meta2");
                expect({
                    dependencies: result.meta1.dependencies,
                    error: result.meta1.error,
                    isValid: result.meta1.isValid,
                    value: result.meta1.value,
                }).toStrictEqual({
                    dependencies: ["dep1"],
                    error: null,
                    isValid: true,
                    value: "value1",
                });
            });
        });

        describe("getDependencyGraph", () => {
            it("should return dependency relationships", () => {
                expect.assertions(2);
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
                expect.assertions(2);
                computedStateManager.addComputed("cleanup1", () => "value1", [
                    "sampleData",
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
                expect.assertions(5);
                const computeFn = () => "convenience-test";
                const cleanup = addComputed("convenience", computeFn, ["dep"]);

                expect(
                    computedStateManager.computedValues.has("convenience")
                ).toStrictEqual(true);
                vi.mocked(console.warn).mockClear();
                const result = getComputed("missingConvenience");
                const warning = getRequiredLastMockCall(
                    vi.mocked(console.warn),
                    "console.warn"
                )[0];
                expect(result).not.toBe("convenience-test");
                expect(vi.mocked(console.warn)).toHaveBeenCalledWith(
                    '[ComputedState] Computed value "missingConvenience" does not exist'
                );
                expect({
                    result,
                    warning,
                }).toStrictEqual({
                    result: undefined,
                    warning:
                        '[ComputedState] Computed value "missingConvenience" does not exist',
                });
                expect(cleanup).toBeTypeOf("function");
            });
        });

        describe("getComputed", () => {
            it("should delegate to computedStateManager.getComputed", () => {
                expect.assertions(4);
                computedStateManager.addComputed(
                    "getTest",
                    () => "get-value",
                    []
                );
                const result = getComputed("getTest");
                expect(result).toBe("get-value");
                vi.mocked(console.warn).mockClear();
                const missingResult = getComputed("missingGetTest");
                const warning = getRequiredLastMockCall(
                    vi.mocked(console.warn),
                    "console.warn"
                )[0];
                expect(missingResult).not.toBe("get-value");
                expect(vi.mocked(console.warn)).toHaveBeenCalledWith(
                    '[ComputedState] Computed value "missingGetTest" does not exist'
                );
                expect({
                    result: missingResult,
                    warning,
                }).toStrictEqual({
                    result: undefined,
                    warning:
                        '[ComputedState] Computed value "missingGetTest" does not exist',
                });
            });
        });

        describe("removeComputed", () => {
            it("should delegate to computedStateManager.removeComputed", () => {
                expect.assertions(2);
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
                    '[ComputedState] Computed value "removeTest" does not exist'
                );
            });
        });
    });

    describe("createReactiveComputed", () => {
        it("should create property descriptor with getter", () => {
            expect.assertions(3);
            const descriptor = createReactiveComputed(
                "reactive",
                () => "reactive-value",
                ["dep"]
            );

            expect({
                configurable: descriptor.configurable,
                enumerable: descriptor.enumerable,
                getType: typeof descriptor.get,
            }).toStrictEqual({
                configurable: true,
                enumerable: true,
                getType: "function",
            });
            expect("set" in descriptor).not.toBe(true);

            expect(descriptor.get()).toBe("reactive-value");
        });
    });

    describe("common computed values", () => {
        describe("initializeCommonComputedValues", () => {
            it("should initialize all predefined computed values", () => {
                expect.assertions(9);
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
                expect(
                    computedStateManager.computedValues.has("missingComputed")
                ).not.toStrictEqual(true);
            });

            it("subscribes common FIT computed values to raw FIT data state", () => {
                expect.assertions(1);
                initializeCommonComputedValues();

                expect(computedStateManager.getDependencyGraph()).toEqual(
                    expect.objectContaining({
                        hasChartData: ["fitFile.rawData.recordMesgs"],
                        hasMapData: ["fitFile.rawData.recordMesgs"],
                        isFileLoaded: ["fitFile.rawData"],
                        performanceMetrics: [
                            "app.startTime",
                            "fitFile.rawData",
                            "ui.tabs",
                            "system.lastActivity",
                        ],
                        summaryData: ["fitFile.rawData.sessionMesgs"],
                    })
                );
            });

            it("should compute isFileLoaded correctly", () => {
                expect.assertions(2);
                initializeCommonComputedValues();

                // Test with empty raw FIT data
                let result = getComputed("isFileLoaded");
                expect(result).toStrictEqual(false);

                // Test with data
                mockStateManager.setState("fitFile.rawData", {
                    records: ["data"],
                });
                computedStateManager.invalidateComputed("isFileLoaded");
                result = getComputed("isFileLoaded");
                expect(result).toStrictEqual(true);
            });

            it("should compute isAppReady correctly", () => {
                expect.assertions(1);
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
                expect.assertions(1);
                initializeCommonComputedValues();

                mockStateManager.setState("fitFile.rawData", {
                    recordMesgs: [{ data: "test" }],
                });
                computedStateManager.invalidateComputed("hasChartData");
                const result = getComputed("hasChartData");
                expect(result).toStrictEqual(true);
            });

            it("should compute hasMapData correctly", () => {
                expect.assertions(1);
                initializeCommonComputedValues();

                mockStateManager.setState("fitFile.rawData", {
                    recordMesgs: [{ positionLat: 123, positionLong: 456 }],
                });
                computedStateManager.invalidateComputed("hasMapData");
                const result = getComputed("hasMapData");
                expect(result).toStrictEqual(true);
            });

            it("should compute summaryData correctly", () => {
                expect.assertions(1);
                initializeCommonComputedValues();

                const sessionData = {
                    avgHeartRate: 140,
                    avgPower: 250,
                    maxSpeed: 45,
                    totalDistance: 10000,
                };
                mockStateManager.setState("fitFile.rawData", {
                    sessionMesgs: [sessionData],
                });
                computedStateManager.invalidateComputed("summaryData");
                const result = getComputed("summaryData");

                expect(result).toStrictEqual({
                    avgHeartRate: 140,
                    avgPower: 250,
                    avgSpeed: undefined,
                    maxHeartRate: undefined,
                    maxPower: undefined,
                    maxSpeed: 45,
                    totalAscent: undefined,
                    totalDescent: undefined,
                    totalDistance: 10000,
                    totalTime: undefined,
                });
            });

            it("should compute themeInfo correctly", () => {
                expect.assertions(1);
                initializeCommonComputedValues();

                mockStateManager.setState("settings", {
                    theme: "dark",
                    mapTheme: true,
                });
                computedStateManager.invalidateComputed("themeInfo");
                const result = getComputed("themeInfo");

                expect(result).toStrictEqual({
                    currentTheme: "dark",
                    isDarkTheme: true,
                    isLightTheme: false,
                    mapThemeInverted: true,
                });
            });

            it("should handle auto theme with matchMedia", () => {
                expect.assertions(2);
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
                expect.assertions(3);
                initializeCommonComputedValues();

                const initialCount = computedStateManager.computedValues.size;
                expect(initialCount).toBe(8);

                cleanupCommonComputedValues();

                const finalCount = computedStateManager.computedValues.size;
                expect(finalCount).toBe(0);
                expect(
                    computedStateManager.computedValues.has("isFileLoaded")
                ).not.toStrictEqual(true);
            });
        });
    });

    describe("state reactivity", () => {
        it("should trigger recomputation when dependencies change", () => {
            expect.assertions(6);
            const computeFn = vi.fn<(state: any) => string>(
                (state) => state.sampleData?.test || "default"
            );
            computedStateManager.addComputed("reactive", computeFn, [
                "sampleData.test",
            ]);

            expect(computeFn).toHaveBeenCalledOnce(); // Initial computation
            expect(getComputed("reactive")).toBe("default");

            // Test that the subscription was set up
            expect(
                mockStateManager.subscribe.mock.calls.map(
                    ([path, callback]) => [path, typeof callback]
                )
            ).toStrictEqual([["sampleData.test", "function"]]);

            mockStateManager.setState("sampleData.test", "updated");
            mockStateManager.triggerSubscriptions("sampleData.test");

            expect(
                computedStateManager.computedValues.get("reactive").isValid
            ).toStrictEqual(false);
            expect(getComputed("reactive")).toBe("updated");
            expect(
                computedStateManager.dependencies.get("reactive")
            ).not.toContain("sampleData.missing");
        });

        it("should handle multiple dependencies correctly", () => {
            expect.assertions(4);
            const computeFn = vi.fn<(state: any) => string>(
                (state) => `${state.app?.status}-${state.ui?.mode}`
            );
            computedStateManager.addComputed("multiDep", computeFn, [
                "app.status",
                "ui.mode",
            ]);

            expect(getComputed("multiDep")).toBe("undefined-undefined");

            expect(
                mockStateManager.subscribe.mock.calls.map(
                    ([path, callback]) => [path, typeof callback]
                )
            ).toEqual([
                ["app.status", "function"],
                ["ui.mode", "function"],
            ]);

            mockStateManager.setState("app.status", "ready");
            mockStateManager.setState("ui.mode", "edit");
            mockStateManager.triggerSubscriptions("app.status");

            expect(getComputed("multiDep")).toBe("ready-edit");
            expect(
                computedStateManager.dependencies.get("multiDep")
            ).not.toContain("sampleData.test");
        });
    });

    describe("error handling", () => {
        it("should handle state manager errors gracefully", () => {
            expect.assertions(2);
            mockStateManager.getState.mockImplementationOnce(() => {
                throw new Error("State access error");
            });

            const computeFn = vi.fn<(state: any) => unknown>(
                (state) => state.test
            );
            computedStateManager.addComputed("errorState", computeFn, []);

            const computed =
                computedStateManager.computedValues.get("errorState");
            expect(computed.error).toBeInstanceOf(Error);
            expect(computed.isValid).toStrictEqual(false);
        });

        it("should handle subscription setup errors", () => {
            expect.assertions(1);
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
