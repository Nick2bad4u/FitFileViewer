import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { JSDOM } from "jsdom";

const originalGlobalDescriptors = new Map<
    "document" | "window",
    PropertyDescriptor
>();

function rememberGlobalDescriptor(name: "document" | "window"): void {
    if (!originalGlobalDescriptors.has(name)) {
        const descriptor = Object.getOwnPropertyDescriptor(globalThis, name);
        if (!descriptor) {
            throw new Error(`Expected globalThis.${name} to exist`);
        }
        originalGlobalDescriptors.set(name, descriptor);
    }
}

function setGlobalValue(name: "document" | "window", value: unknown): void {
    rememberGlobalDescriptor(name);
    Object.defineProperty(globalThis, name, {
        configurable: true,
        value,
        writable: true,
    });
}

function restoreGlobalValues(): void {
    for (const [name, descriptor] of originalGlobalDescriptors) {
        Object.defineProperty(globalThis, name, descriptor);
    }
    originalGlobalDescriptors.clear();
}

describe("updateTabVisibility FIT raw-data state subscription", () => {
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
    let currentRawFitData: unknown;
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

        setGlobalValue("window", mockWindow);
        setGlobalValue("document", mockDocument);

        // Mock stateManager to capture the subscribe callback
        mockSubscribe =
            vi.fn<(path: string, callback: (data: unknown) => void) => void>();
        currentActiveTab = "chart";
        currentRawFitData = null;
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
        vi.doMock(
            import("../../../electron-app/utils/state/domain/fitFileState.js"),
            () => ({
                FitFileSelectors: {
                    getEventMessages: () => [],
                    getLapMessages: () => [],
                    getRawData: () => currentRawFitData,
                    getRecordMessages: () =>
                        currentRawFitData !== null &&
                        typeof currentRawFitData === "object" &&
                        Array.isArray(
                            (currentRawFitData as { recordMesgs?: unknown })
                                .recordMesgs
                        )
                            ? (currentRawFitData as { recordMesgs: unknown[] })
                                  .recordMesgs
                            : [],
                    getSessionMessages: () => [],
                    getTimeInZoneMessages: () => [],
                },
            })
        );
    });

    afterEach(() => {
        vi.clearAllMocks();
        vi.resetModules();
        vi.useRealTimers();
        restoreGlobalValues();
    });

    describe("fitFile.rawData subscription", () => {
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

            // Get the subscription callback for fitFile.rawData
            expect(
                mockSubscribe.mock.calls.map(([path, callback]) => [
                    path,
                    typeof callback,
                ])
            ).toStrictEqual([
                ["ui.activeTab", "function"],
                ["fitFile.rawData", "function"],
            ]);
            const requiredRawFitDataSubscription =
                getRequiredSubscription("fitFile.rawData");
            expect(requiredRawFitDataSubscription[0]).toBe("fitFile.rawData");
            expect(requiredRawFitDataSubscription[1]).toBeTypeOf("function");

            const rawFitDataCallback = requiredRawFitDataSubscription[1];

            // Trigger the state change when data is cleared.
            currentActiveTab = "chart";

            // Call the callback with no data (null/undefined)
            currentRawFitData = null;
            rawFitDataCallback(null);
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
            currentRawFitData = undefined;
            rawFitDataCallback(undefined);
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
            currentRawFitData = null;

            initializeTabVisibilityState();

            // Get the fitFile.rawData subscription callback
            const rawFitDataCallback =
                getRequiredSubscription("fitFile.rawData")[1];

            // Call with no data when already on summary tab
            rawFitDataCallback(null);
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

            // Get the fitFile.rawData subscription callback
            const rawFitDataCallback =
                getRequiredSubscription("fitFile.rawData")[1];

            // Call with valid data
            currentRawFitData = { some: "data" };
            rawFitDataCallback({ some: "data" });
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

            // Get the fitFile.rawData subscription callback
            const rawFitDataCallback =
                getRequiredSubscription("fitFile.rawData")[1];

            // Test with falsy values that are NOT null/undefined - these should NOT trigger the switch
            rawFitDataCallback(false);
            expect(currentActiveTab).toBe("map");

            rawFitDataCallback(0);
            expect(mockSetState).toHaveBeenCalledTimes(0);

            rawFitDataCallback("");
            expect(currentRawFitData).toBeNull();

            // Test with values that SHOULD trigger the switch (null/undefined)
            currentRawFitData = null;
            rawFitDataCallback(null);
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
            currentRawFitData = undefined;
            rawFitDataCallback(undefined);
            vi.advanceTimersByTime(260);
            expect(mockSetState).toHaveBeenCalledOnce();
        });
    });
});
