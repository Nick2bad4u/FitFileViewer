import { describe, test, expect, vi, beforeEach, afterEach } from "vitest";
import { JSDOM } from "jsdom";

describe("updateTabVisibility globalData state subscription", () => {
    let mockWindow: any;
    let mockDocument: any;
    let mockSubscribe: any;
    let mockSetState: any;
    let mockGetState: any;
    let currentActiveTab: string;
    let currentGlobalData: any;
    let currentIsLoading: boolean;

    beforeEach(() => {
        const dom = new JSDOM("<!DOCTYPE html><html><body></body></html>");
        mockWindow = dom.window;
        mockDocument = dom.window.document;

        (global as any).window = mockWindow;
        (global as any).document = mockDocument;

        // Mock stateManager to capture the subscribe callback
        mockSubscribe = vi.fn();
        currentActiveTab = "chart";
        currentGlobalData = null;
        currentIsLoading = false;
        mockSetState = vi.fn((key: string, value: unknown) => {
            if (key === "ui.activeTab") {
                currentActiveTab = String(value);
            }
        });
        mockGetState = vi.fn((key: string) => {
            if (key === "ui.activeTab") return currentActiveTab;
            if (key === "globalData") return currentGlobalData;
            if (key === "isLoading") return currentIsLoading;
            return undefined;
        });

        vi.useFakeTimers();

        vi.doMock("../../../utils/state/core/stateManager.js", () => ({
            setState: mockSetState,
            getState: mockGetState,
            subscribe: mockSubscribe,
        }));
    });

    afterEach(() => {
        vi.clearAllMocks();
        vi.resetModules();
        vi.useRealTimers();
    });

    describe("globalData subscription", () => {
        test("switches to summary when data is cleared from another tab", async () => {
            const { initializeTabVisibilityState } =
                await import("../../../utils/ui/tabs/updateTabVisibility.js");

            // Mock console.log to capture initialization message
            const consoleSpy = vi
                .spyOn(console, "log")
                .mockImplementation(() => {});

            // Initialize the tab visibility state management
            initializeTabVisibilityState();

            // Verify initialization message was logged
            expect(consoleSpy).toHaveBeenCalledWith(
                "[TabVisibility] State management initialized"
            );

            // Get the subscription callback for globalData
            expect(mockSubscribe).toHaveBeenCalled();
            const globalDataSubscription = mockSubscribe.mock.calls.find(
                (call: any[]) => call[0] === "globalData"
            );
            expect(globalDataSubscription?.[0]).toBe("globalData");
            expect(typeof globalDataSubscription?.[1]).toBe("function");

            const globalDataCallback = globalDataSubscription[1] as (
                data: unknown
            ) => void;

            // Trigger the state change when data is cleared.
            currentActiveTab = "chart";

            // Call the callback with no data (null/undefined)
            currentGlobalData = null;
            globalDataCallback(null);
            vi.advanceTimersByTime(260);

            // Should call setState to switch to summary tab.
            expect(mockSetState).toHaveBeenCalledWith(
                "ui.activeTab",
                "summary",
                {
                    source: "initializeTabVisibilityState",
                }
            );
            expect(currentActiveTab).toBe("summary");

            // Test with undefined data as well
            mockSetState.mockClear();
            currentActiveTab = "chart";
            currentGlobalData = undefined;
            globalDataCallback(undefined);
            vi.advanceTimersByTime(260);

            expect(mockSetState).toHaveBeenCalledTimes(1);

            consoleSpy.mockRestore();
        });

        test("should not switch to summary when current tab is already summary", async () => {
            const { initializeTabVisibilityState } =
                await import("../../../utils/ui/tabs/updateTabVisibility.js");

            // Mock getState to return 'summary' as current tab
            currentActiveTab = "summary";
            currentGlobalData = null;

            initializeTabVisibilityState();

            // Get the globalData subscription callback
            const globalDataSubscription = mockSubscribe.mock.calls.find(
                (call: any[]) => call[0] === "globalData"
            );
            const globalDataCallback = globalDataSubscription[1] as (
                data: unknown
            ) => void;

            // Call with no data when already on summary tab
            globalDataCallback(null);
            vi.advanceTimersByTime(260);

            // Should NOT call setState since we're already on summary
            expect(mockSetState).not.toHaveBeenCalled();
            expect(currentActiveTab).toBe("summary");
        });

        test("should not switch when data exists", async () => {
            const { initializeTabVisibilityState } =
                await import("../../../utils/ui/tabs/updateTabVisibility.js");

            // Mock getState to return a non-summary tab
            currentActiveTab = "chart";

            initializeTabVisibilityState();

            // Get the globalData subscription callback
            const globalDataSubscription = mockSubscribe.mock.calls.find(
                (call: any[]) => call[0] === "globalData"
            );
            const globalDataCallback = globalDataSubscription[1] as (
                data: unknown
            ) => void;

            // Call with valid data
            currentGlobalData = { some: "data" };
            globalDataCallback({ some: "data" });
            vi.advanceTimersByTime(260);

            // Should NOT call setState since data exists
            expect(mockSetState).not.toHaveBeenCalled();
            expect(currentActiveTab).toBe("chart");
        });

        test("should handle edge case data values", async () => {
            const { initializeTabVisibilityState } =
                await import("../../../utils/ui/tabs/updateTabVisibility.js");

            // Mock getState to return a non-summary tab
            currentActiveTab = "map";

            initializeTabVisibilityState();

            // Get the globalData subscription callback
            const globalDataSubscription = mockSubscribe.mock.calls.find(
                (call: any[]) => call[0] === "globalData"
            );
            const globalDataCallback = globalDataSubscription[1] as (
                data: unknown
            ) => void;

            // Test with falsy values that are NOT null/undefined - these should NOT trigger the switch
            globalDataCallback(false);
            expect(currentActiveTab).toBe("map");

            globalDataCallback(0);
            expect(mockSetState).toHaveBeenCalledTimes(0);

            globalDataCallback("");
            expect(currentGlobalData).toBeNull();

            // Test with values that SHOULD trigger the switch (null/undefined)
            currentGlobalData = null;
            globalDataCallback(null);
            vi.advanceTimersByTime(260);
            expect(mockSetState).toHaveBeenCalledWith(
                "ui.activeTab",
                "summary",
                {
                    source: "initializeTabVisibilityState",
                }
            );
            expect(currentActiveTab).toBe("summary");

            mockSetState.mockClear();

            currentActiveTab = "map";
            currentGlobalData = undefined;
            globalDataCallback(undefined);
            vi.advanceTimersByTime(260);
            expect(mockSetState).toHaveBeenCalledTimes(1);
        });
    });
});
