/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Mock dependencies
const mockRenderChartJS = vi.fn();
const mockShowNotification = vi.fn();
const mockChartStateManager = {
    debouncedRender: vi.fn(),
};
const mockSetChartSetting = vi.fn();
const mockSetChartFieldVisibility = vi.fn();

// Mock modules
vi.mock("../../../../../utils/charts/core/renderChartJS.js", () => ({
    renderChartJS: mockRenderChartJS,
}));

vi.mock("../../../../../utils/ui/notifications/showNotification.js", () => ({
    showNotification: mockShowNotification,
}));

vi.mock("../../../../../utils/charts/core/chartStateManager.js", () => ({
    chartStateManager: mockChartStateManager,
}));

vi.mock("../../../../../utils/state/domain/settingsStateManager.js", () => ({
    setChartSetting: mockSetChartSetting,
    setChartFieldVisibility: mockSetChartFieldVisibility,
}));

describe("loadSharedConfiguration.js", () => {
    let originalConsoleError: any;
    let mockLocalStorage: { [key: string]: string } = {};

    beforeEach(() => {
        vi.resetAllMocks();
        originalConsoleError = console.error;
        console.error = vi.fn();

        mockSetChartSetting.mockClear();
        mockSetChartFieldVisibility.mockClear();
        mockShowNotification.mockClear();
        mockRenderChartJS.mockClear();

        // Mock localStorage
        mockLocalStorage = {};
        Object.defineProperty(window, "localStorage", {
            value: {
                getItem: vi.fn((key) => mockLocalStorage[key] || null),
                setItem: vi.fn((key, value) => {
                    mockLocalStorage[key] = String(value);
                }),
                removeItem: vi.fn((key) => delete mockLocalStorage[key]),
                clear: vi.fn(() => {
                    mockLocalStorage = {};
                }),
            },
            writable: true,
        });

        // Mock setTimeout
        vi.useFakeTimers();
    });

    afterEach(() => {
        console.error = originalConsoleError;
        vi.useRealTimers();
    });

    it("should load configuration from URL and update chart settings", async () => {
        // Reset modules to ensure we have a clean slate
        vi.resetModules();

        // Mock URL parameters
        const configObject = {
            visibleFields: {
                heart_rate: true,
                power: true,
                speed: false,
            },
            smoothing: 5,
            showMarkers: true,
        };

        // Encode the config as base64 (as it would be in the URL)
        const base64Config = btoa(JSON.stringify(configObject));

        // Set up URL parameter
        Object.defineProperty(window, "location", {
            value: {
                search: `?chartConfig=${base64Config}`,
            },
            writable: true,
        });

        // Re-setup mocks for this specific test
        const localChartStateManager = { debouncedRender: vi.fn() };
        vi.doMock("../../../../../utils/charts/core/chartStateManager.js", () => ({
            chartStateManager: localChartStateManager,
        }));

        vi.doMock("../../../../../utils/charts/core/renderChartJS.js", () => ({
            renderChartJS: mockRenderChartJS,
        }));

        vi.doMock("../../../../../utils/ui/notifications/showNotification.js", () => ({
            showNotification: mockShowNotification,
        }));

        // Import the module under test with our freshly created mocks
        const { loadSharedConfiguration } =
            await import("../../../../../utils/app/initialization/loadSharedConfiguration.js");

        // Call the function
        loadSharedConfiguration();

        expect(mockSetChartFieldVisibility).toHaveBeenCalledWith("heart_rate", "visible");
        expect(mockSetChartFieldVisibility).toHaveBeenCalledWith("power", "visible");
        expect(mockSetChartFieldVisibility).toHaveBeenCalledWith("speed", "hidden");
        expect(mockSetChartSetting).toHaveBeenCalledWith("smoothing", 5);
        expect(mockSetChartSetting).toHaveBeenCalledWith("showMarkers", true);

        // Check notification was shown
        expect(mockShowNotification).toHaveBeenCalledWith("Chart configuration loaded from URL", "success");

        // Advance timers and check if rendering was triggered
        vi.advanceTimersByTime(100);
        expect(localChartStateManager.debouncedRender).toHaveBeenCalledWith("Configuration loaded from URL");
    });

    it("should use renderChartJS as fallback when chartStateManager is undefined", async () => {
        vi.resetModules();

        // Provide URL with minimal valid config
        const configObject = { smoothing: 3 };
        const base64Config = btoa(JSON.stringify(configObject));
        Object.defineProperty(window, "location", {
            value: {
                search: `?chartConfig=${base64Config}`,
            },
            writable: true,
        });

        // Ensure chartStateManager import resolves to undefined
        vi.doMock("../../../../../utils/charts/core/chartStateManager.js", () => ({
            chartStateManager: undefined,
        }));

        // Keep renderChartJS mock to observe fallback
        vi.doMock("../../../../../utils/charts/core/renderChartJS.js", () => ({
            renderChartJS: mockRenderChartJS,
        }));

        const { loadSharedConfiguration } =
            await import("../../../../../utils/app/initialization/loadSharedConfiguration.js");

        loadSharedConfiguration();
        // Advance timers to trigger fallback render
        vi.advanceTimersByTime(120);
        expect(mockRenderChartJS).toHaveBeenCalled();
    });

    // Adding a simpler test instead that verifies settings are updated correctly
    it("should handle basic configuration correctly", async () => {
        // Reset modules and localStorage
        vi.resetModules();
        mockLocalStorage = {};

        // Mock showNotification
        vi.doMock("../../../../../utils/ui/notifications/showNotification.js", () => ({
            showNotification: mockShowNotification,
        }));

        // Set up URL parameter with simple configuration
        const configObject = { smoothing: 10 };
        const base64Config = btoa(JSON.stringify(configObject));

        Object.defineProperty(window, "location", {
            value: {
                search: `?chartConfig=${base64Config}`,
            },
            writable: true,
        });

        // Import the module under test
        const { loadSharedConfiguration } =
            await import("../../../../../utils/app/initialization/loadSharedConfiguration.js");

        // Call the function
        loadSharedConfiguration();

        expect(mockSetChartSetting).toHaveBeenCalledWith("smoothing", 10);
    });

    it("should handle missing chartConfig parameter", async () => {
        // Set URL with no config parameter
        Object.defineProperty(window, "location", {
            value: {
                search: "?otherParam=value",
            },
            writable: true,
        });

        // Import module under test
        const { loadSharedConfiguration } =
            await import("../../../../../utils/app/initialization/loadSharedConfiguration.js");

        // Call the function
        loadSharedConfiguration();

        expect(mockSetChartSetting).not.toHaveBeenCalled();
        expect(mockSetChartFieldVisibility).not.toHaveBeenCalled();

        // No notifications should be shown
        expect(mockShowNotification).not.toHaveBeenCalled();

        // No chart rendering should happen
        vi.advanceTimersByTime(100);
        expect(mockChartStateManager.debouncedRender).not.toHaveBeenCalled();
        expect(mockRenderChartJS).not.toHaveBeenCalled();
    });

    it("should handle invalid JSON in chartConfig parameter", async () => {
        // Set URL with invalid base64 JSON
        const invalidBase64 = btoa("not-valid-json");
        Object.defineProperty(window, "location", {
            value: {
                search: `?chartConfig=${invalidBase64}`,
            },
            writable: true,
        });

        // Import module under test
        const { loadSharedConfiguration } =
            await import("../../../../../utils/app/initialization/loadSharedConfiguration.js");

        // Call the function
        loadSharedConfiguration();

        // Error should be logged
        expect(console.error).toHaveBeenCalled();

        // Warning notification should be shown
        expect(mockShowNotification).toHaveBeenCalledWith("Failed to load shared configuration", "warning");
    });

    it("should handle other exceptions during processing", async () => {
        // Set up a situation that will cause an error
        // Mock URLSearchParams to throw an error
        const originalURLSearchParams = global.URLSearchParams;
        global.URLSearchParams = vi.fn(() => {
            throw new Error("Mock URLSearchParams error");
        }) as any;

        // Import module under test
        const { loadSharedConfiguration } =
            await import("../../../../../utils/app/initialization/loadSharedConfiguration.js");

        // Call the function
        loadSharedConfiguration();

        // Error should be logged
        expect(console.error).toHaveBeenCalled();

        // Warning notification should be shown
        expect(mockShowNotification).toHaveBeenCalledWith("Failed to load shared configuration", "warning");

        // Restore original URLSearchParams
        global.URLSearchParams = originalURLSearchParams;
    });
});
