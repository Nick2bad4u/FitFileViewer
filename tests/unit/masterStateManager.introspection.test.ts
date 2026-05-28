import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { masterStateManager } from "../../electron-app/utils/state/core/masterStateManager.js";
import {
    setState,
    subscribe,
    resetState,
} from "../../electron-app/utils/state/core/stateManager.js";

interface SubscriptionSnapshot {
    paths: string[];
    subscriptionDetails: Record<
        string,
        { hasListeners: boolean; listenerCount: number } | undefined
    >;
    totalListeners: number;
}

interface InitializationStatusSnapshot {
    systemState: {
        missing?: unknown;
    };
}

interface RootStateSnapshot {
    charts: {
        controlsVisible: boolean;
        isRendered: boolean;
        selectedChart: string;
        zoomLevel: number;
    };
    map: {
        baseLayer: string;
        trackVisible: boolean;
        zoom: number;
    };
    performance: {
        lastLoadTime: null | number;
        memoryUsage: null | number;
    };
    tables: {
        currentPage: number;
        pageSize: number;
        sortDirection: string;
    };
    ui: {
        activeTab: string;
        theme: string;
        unloadButtonVisible: boolean;
    };
}

interface StateHistorySnapshot {
    newValue: unknown;
    oldValue: unknown;
    path: string;
    source: string;
    timestamp: number;
}

describe("MasterStateManager introspection", () => {
    beforeEach(() => {
        // Reset state before each test
        resetState();
    });

    afterEach(() => {
        // Clean up after each test
        resetState();
    });

    describe("Introspection Methods", () => {
        it("should provide getState method", () => {
            expect(typeof masterStateManager.getState).toBe("function");

            // Test basic state access
            const initialState =
                masterStateManager.getState() as RootStateSnapshot;
            expect(initialState.charts).toMatchObject({
                controlsVisible: true,
                isRendered: false,
                selectedChart: "elevation",
                zoomLevel: 1,
            });
            expect(initialState.map).toMatchObject({
                baseLayer: "openstreetmap",
                trackVisible: true,
                zoom: 13,
            });
            expect(initialState.performance).toMatchObject({
                lastLoadTime: null,
                memoryUsage: null,
            });
            expect(initialState.tables).toMatchObject({
                currentPage: 1,
                pageSize: 50,
                sortDirection: "asc",
            });
            expect(initialState.ui).toMatchObject({
                activeTab: "summary",
                theme: "system",
                unloadButtonVisible: false,
            });
            expect(
                masterStateManager.getState("missing.branch")
            ).toBeUndefined();
        });

        it("should provide getHistory method", () => {
            expect(typeof masterStateManager.getHistory).toBe("function");

            // Test history access
            const history = masterStateManager.getHistory();
            expect(Array.isArray(history)).toBe(true);
        });

        it("should provide getSubscriptions method", () => {
            expect(typeof masterStateManager.getSubscriptions).toBe("function");

            // Test subscriptions access
            const subscriptions = masterStateManager.getSubscriptions();
            expect(subscriptions).toEqual({
                paths: [],
                subscriptionDetails: {},
                totalListeners: 0,
            });
        });
    });

    describe("State Management Integration", () => {
        it("should get state changes through masterStateManager", () => {
            // Set a test value using direct stateManager
            setState("test.value", "hello world");

            // Get it back through masterStateManager
            const value = masterStateManager.getState("test.value");
            expect(value).toBe("hello world");
            expect(masterStateManager.getState("test.missing")).toBeUndefined();
        });

        it("should track state history through masterStateManager", () => {
            const initialHistoryLength = masterStateManager.getHistory().length;

            // Make some state changes using direct stateManager
            setState("test.counter", 1);
            setState("test.counter", 2);
            setState("test.counter", 3);

            // Check history through masterStateManager
            const newHistory = masterStateManager
                .getHistory()
                .slice(initialHistoryLength) as StateHistorySnapshot[];
            expect(
                newHistory.map(({ newValue, oldValue, path, source }) => ({
                    newValue,
                    oldValue,
                    path,
                    source,
                }))
            ).toStrictEqual([
                {
                    newValue: 1,
                    oldValue: undefined,
                    path: "test.counter",
                    source: "unknown",
                },
                {
                    newValue: 2,
                    oldValue: 1,
                    path: "test.counter",
                    source: "unknown",
                },
                {
                    newValue: 3,
                    oldValue: 2,
                    path: "test.counter",
                    source: "unknown",
                },
            ]);
            expect(newHistory.every(({ timestamp }) => timestamp > 0)).toBe(
                true
            );
        });

        it("should access subscriptions through masterStateManager", () => {
            let callCount = 0;

            // Subscribe using direct stateManager
            const unsubscribe = subscribe("test.subscription", () => {
                callCount++;
            });

            // Make a change using direct stateManager
            setState("test.subscription", "triggered");

            // Check subscription was called
            expect(callCount).toBe(1);

            // Check subscriptions list through masterStateManager
            const subscriptions =
                masterStateManager.getSubscriptions() as SubscriptionSnapshot;
            expect(
                subscriptions.subscriptionDetails["test.subscription"]
            ).toEqual({
                hasListeners: true,
                listenerCount: 1,
            });
            expect(subscriptions.paths).toContain("test.subscription");
            expect(subscriptions.totalListeners).toBe(1);

            // Clean up
            unsubscribe();
            expect(
                (masterStateManager.getSubscriptions() as SubscriptionSnapshot)
                    .subscriptionDetails["test.subscription"]
            ).toBeUndefined();
        });
    });

    describe("Initialization Status", () => {
        it("should provide initialization status", () => {
            expect(typeof masterStateManager.getInitializationStatus).toBe(
                "function"
            );

            const status = masterStateManager.getInitializationStatus();
            expect(status).toEqual({
                components: {},
                isInitialized: false,
                systemState: {
                    initialized: undefined,
                    mode: undefined,
                    startupTime: undefined,
                    version: undefined,
                },
            });
            expect(
                (status as InitializationStatusSnapshot).systemState.missing
            ).toBeUndefined();
        });
    });
});
