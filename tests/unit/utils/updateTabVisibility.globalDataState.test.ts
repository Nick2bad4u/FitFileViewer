import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { JSDOM } from "jsdom";

describe("updateTabVisibility globalData state subscription", () => {
    let mockWindow: Window;
    let mockDocument: Document;
    let mockSubscribe: ReturnType<
        typeof vi.fn<(path: string, callback: (data: unknown) => void) => void>
    >;
    let mockSetState: ReturnType<
        typeof vi.fn<
            (
                key: string,
                value: unknown,
                options?: Record<string, unknown>
            ) => void
        >
    >;
    let mockGetState: ReturnType<typeof vi.fn<(key: string) => unknown>>;
    let currentActiveTab: string;
    let currentGlobalData: unknown;
    let currentIsLoading: boolean;

    function getRequiredSubscription(
        path: string
    ): [string, (data: unknown) => void] {
        const subscription = mockSubscribe.mock.calls.find(
            ([subscribedPath]) => subscribedPath === path
        );

        if (!subscription) {
            throw new Error(`Expected subscription for ${path}`);
        }

        return subscription;
    }

    beforeEach(() => {
        const dom = new JSDOM("<!DOCTYPE html><html><body></body></html>");
        mockWindow = dom.window;
        mockDocument = dom.window.document;

        (global as any).window = mockWindow;
        (global as any).document = mockDocument;

        // Mock stateManager to capture the subscribe callback
        mockSubscribe =
            vi.fn<(path: string, callback: (data: unknown) => void) => void>();
        currentActiveTab = "chart";
        currentGlobalData = null;
        currentIsLoading = false;
        mockSetState = vi.fn<
            (
                key: string,
                value: unknown,
                options?: Record<string, unknown>
            ) => void
        >((key: string, value: unknown, _options?: Record<string, unknown>) => {
            if (key === "ui.activeTab") {
                currentActiveTab = String(value);
            }
        });
        mockGetState = vi.fn<(key: string) => unknown>((key) => {
            if (key === "ui.activeTab") return currentActiveTab;
            if (key === "globalData") return currentGlobalData;
            if (key === "isLoading") return currentIsLoading;
            return undefined;
        });

        vi.useFakeTimers();

        vi.doMock(
            import("../../../electron-app/utils/state/core/stateManager.js"),
            () => ({
                setState: mockSetState,
                getState: mockGetState,
                subscribe: mockSubscribe,
            })
        );
    });

    afterEach(() => {
        vi.clearAllMocks();
        vi.resetModules();
        vi.useRealTimers();
    });

    describe("globalData subscription", () => {
        it("switches to summary when data is cleared from another tab", async () => {
            expect.assertions(7);

            const { initializeTabVisibilityState } =
                await import("../../../electron-app/utils/ui/tabs/updateTabVisibility.js");

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
            expect(
                mockSubscribe.mock.calls.map(([path, callback]) => [
                    path,
                    typeof callback,
                ])
            ).toStrictEqual([
                ["ui.activeTab", "function"],
                ["globalData", "function"],
            ]);
            const requiredGlobalDataSubscription =
                getRequiredSubscription("globalData");
            expect(requiredGlobalDataSubscription[0]).toBe("globalData");
            expect(requiredGlobalDataSubscription[1]).toBeTypeOf("function");

            const globalDataCallback = requiredGlobalDataSubscription[1];

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

            expect(mockSetState).toHaveBeenCalledOnce();

            consoleSpy.mockRestore();
        });

        it("should not switch to summary when current tab is already summary", async () => {
            expect.assertions(2);

            const { initializeTabVisibilityState } =
                await import("../../../electron-app/utils/ui/tabs/updateTabVisibility.js");

            // Mock getState to return 'summary' as current tab
            currentActiveTab = "summary";
            currentGlobalData = null;

            initializeTabVisibilityState();

            // Get the globalData subscription callback
            const globalDataCallback = getRequiredSubscription("globalData")[1];

            // Call with no data when already on summary tab
            globalDataCallback(null);
            vi.advanceTimersByTime(260);

            // Should NOT call setState since we're already on summary
            expect(mockSetState).not.toHaveBeenCalled();
            expect(currentActiveTab).toBe("summary");
        });

        it("should not switch when data exists", async () => {
            expect.assertions(2);

            const { initializeTabVisibilityState } =
                await import("../../../electron-app/utils/ui/tabs/updateTabVisibility.js");

            // Mock getState to return a non-summary tab
            currentActiveTab = "chart";

            initializeTabVisibilityState();

            // Get the globalData subscription callback
            const globalDataCallback = getRequiredSubscription("globalData")[1];

            // Call with valid data
            currentGlobalData = { some: "data" };
            globalDataCallback({ some: "data" });
            vi.advanceTimersByTime(260);

            // Should NOT call setState since data exists
            expect(mockSetState).not.toHaveBeenCalled();
            expect(currentActiveTab).toBe("chart");
        });

        it("should handle edge case data values", async () => {
            expect.assertions(6);

            const { initializeTabVisibilityState } =
                await import("../../../electron-app/utils/ui/tabs/updateTabVisibility.js");

            // Mock getState to return a non-summary tab
            currentActiveTab = "map";

            initializeTabVisibilityState();

            // Get the globalData subscription callback
            const globalDataCallback = getRequiredSubscription("globalData")[1];

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
            expect(mockSetState).toHaveBeenCalledOnce();
        });
    });
});
