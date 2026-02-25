import { describe, test, expect, vi, beforeEach, afterEach } from "vitest";
import { JSDOM } from "jsdom";

// Test for uncovered lines in updateTabVisibility.js
describe("updateTabVisibility.js - Coverage Completion", () => {
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
        mockSetState = vi.fn();
        currentActiveTab = "chart";
        currentGlobalData = null;
        currentIsLoading = false;
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

    describe("Uncovered line coverage tests", () => {
        test("should cover globalData subscription logic for switching to summary (lines 127-129)", async () => {
            const { initializeTabVisibilityState } =
                await import("../../../utils/ui/tabs/updateTabVisibility.js");

            // Mock console.log to capture initialization message
            const consoleSpy = vi
                .spyOn(console, "log")
                .mockImplementation(() => {});

            // Initialize the tab visibility state management
            initializeTabVisibilityState();

            // Verify initialization message was logged (line 131)
            expect(consoleSpy).toHaveBeenCalledWith(
                "[TabVisibility] State management initialized"
            );

            // Get the subscription callback for globalData
            expect(mockSubscribe).toHaveBeenCalled();
            const globalDataSubscription = mockSubscribe.mock.calls.find(
                (call: any[]) => call[0] === "globalData"
            );
            expect(globalDataSubscription).toBeTruthy();

            const globalDataCallback = globalDataSubscription[1];

            // Test the specific logic that triggers state change (lines 127-129)
            currentActiveTab = "chart";

            // Call the callback with no data (null/undefined)
            currentGlobalData = null;
            globalDataCallback(null);
            vi.advanceTimersByTime(260);

            // Should call setState to switch to summary tab (line 128)
            expect(mockSetState).toHaveBeenCalledWith(
                "ui.activeTab",
                "summary",
                {
                    source: "initializeTabVisibilityState",
                }
            );

            // Test with undefined data as well
            mockSetState.mockClear();
            currentGlobalData = undefined;
            globalDataCallback(undefined);
            vi.advanceTimersByTime(260);

            expect(mockSetState).toHaveBeenCalledWith(
                "ui.activeTab",
                "summary",
                {
                    source: "initializeTabVisibilityState",
                }
            );

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
            const globalDataCallback = globalDataSubscription[1];

            // Call with no data when already on summary tab
            globalDataCallback(null);
            vi.advanceTimersByTime(260);

            // Should NOT call setState since we're already on summary
            expect(mockSetState).not.toHaveBeenCalled();
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
            const globalDataCallback = globalDataSubscription[1];

            // Call with valid data
            currentGlobalData = { some: "data" };
            globalDataCallback({ some: "data" });

            // Should NOT call setState since data exists
            expect(mockSetState).not.toHaveBeenCalled();
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
            const globalDataCallback = globalDataSubscription[1];

            // Test with falsy values that are NOT null/undefined - these should NOT trigger the switch
            globalDataCallback(false);
            expect(mockSetState).not.toHaveBeenCalled();

            globalDataCallback(0);
            expect(mockSetState).not.toHaveBeenCalled();

            globalDataCallback("");
            expect(mockSetState).not.toHaveBeenCalled();

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

            mockSetState.mockClear();

            currentGlobalData = undefined;
            globalDataCallback(undefined);
            vi.advanceTimersByTime(260);
            expect(mockSetState).toHaveBeenCalledWith(
                "ui.activeTab",
                "summary",
                {
                    source: "initializeTabVisibilityState",
                }
            );
        });
    });
});
