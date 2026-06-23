// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

type ChartFieldVisibility = "hidden" | "visible";
type DebouncedRender = (reason: string) => void;
type RenderChart = () => void;
type SetChartFieldVisibility = (
    field: string,
    visibility: ChartFieldVisibility
) => void;
type SetChartSetting = (key: string, value: unknown) => void;
type ShowNotification = (message: string, type: "success" | "warning") => void;
type TestGlobalProperty = "URLSearchParams";

// Mock dependencies
const mockRenderChartJS = vi.fn<RenderChart>();
const mockShowNotification = vi.fn<ShowNotification>();
const mockChartStateManager = {
    debouncedRender: vi.fn<DebouncedRender>(),
};
let registeredChartStateManager: null | typeof mockChartStateManager =
    mockChartStateManager;
const mockSetChartSetting = vi.fn<SetChartSetting>();
const mockSetChartFieldVisibility = vi.fn<SetChartFieldVisibility>();
const originalGlobalDescriptors = new Map<
    TestGlobalProperty,
    PropertyDescriptor
>();

function setTestGlobal(name: TestGlobalProperty, value: unknown): void {
    if (!originalGlobalDescriptors.has(name)) {
        const descriptor = Object.getOwnPropertyDescriptor(globalThis, name);

        if (!descriptor) {
            throw new Error(`Expected globalThis.${name} to exist`);
        }

        originalGlobalDescriptors.set(name, descriptor);
    }

    Object.defineProperty(globalThis, name, {
        configurable: true,
        value,
        writable: true,
    });
}

function restoreTestGlobals(): void {
    for (const [name, descriptor] of originalGlobalDescriptors) {
        Object.defineProperty(globalThis, name, descriptor);
    }
    originalGlobalDescriptors.clear();
}

// Mock modules
vi.mock(
    import("../../../../../electron-app/utils/charts/core/renderChartJS.js"),
    () => ({
        renderChartJS: mockRenderChartJS,
    })
);

vi.mock(
    import("../../../../../electron-app/utils/ui/notifications/showNotification.js"),
    () => ({
        showNotification: mockShowNotification,
    })
);

vi.mock(
    import("../../../../../electron-app/utils/charts/core/chartStateManagerRegistry.js"),
    () => ({
        getRegisteredChartStateManager: () => registeredChartStateManager,
    })
);

vi.mock(
    import("../../../../../electron-app/utils/state/domain/settingsStateManager.js"),
    () => ({
        setChartSetting: mockSetChartSetting,
        setChartFieldVisibility: mockSetChartFieldVisibility,
    })
);

describe("loadSharedConfiguration.js", () => {
    let consoleErrorSpy: ReturnType<typeof vi.spyOn>;
    let mockLocalStorage: { [key: string]: string } = {};

    beforeEach(() => {
        vi.resetAllMocks();
        consoleErrorSpy = vi
            .spyOn(console, "error")
            .mockImplementation(() => {});

        mockSetChartSetting.mockClear();
        mockSetChartFieldVisibility.mockClear();
        mockShowNotification.mockClear();
        mockRenderChartJS.mockClear();
        mockChartStateManager.debouncedRender.mockClear();
        registeredChartStateManager = mockChartStateManager;

        // Mock localStorage
        mockLocalStorage = {};
        Object.defineProperty(window, "localStorage", {
            value: {
                getItem: vi.fn<(key: string) => string | null>(
                    (key) => mockLocalStorage[key] || null
                ),
                setItem: vi.fn<(key: string, value: string) => void>(
                    (key, value) => {
                        mockLocalStorage[key] = String(value);
                    }
                ),
                removeItem: vi.fn<(key: string) => void>((key) => {
                    delete mockLocalStorage[key];
                }),
                clear: vi.fn<() => void>(() => {
                    mockLocalStorage = {};
                }),
            },
            writable: true,
        });

        // Mock setTimeout
        vi.useFakeTimers();
    });

    afterEach(() => {
        consoleErrorSpy.mockRestore();
        vi.useRealTimers();
        restoreTestGlobals();
    });

    it("should load configuration from URL and update chart settings", async () => {
        expect.assertions(8);

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

        const localChartStateManager = {
            debouncedRender: vi.fn<DebouncedRender>(),
        };
        registeredChartStateManager = localChartStateManager;

        vi.doMock(
            import("../../../../../electron-app/utils/charts/core/renderChartJS.js"),
            () => ({
                renderChartJS: mockRenderChartJS,
            })
        );

        vi.doMock(
            import("../../../../../electron-app/utils/ui/notifications/showNotification.js"),
            () => ({
                showNotification: mockShowNotification,
            })
        );

        // Import the module under test with our freshly created mocks
        const { loadSharedConfiguration } =
            await import("../../../../../electron-app/utils/app/initialization/loadSharedConfiguration.js");

        // Call the function
        expect(loadSharedConfiguration()).toBeUndefined();

        expect(mockSetChartFieldVisibility).toHaveBeenCalledWith(
            "heart_rate",
            "visible"
        );
        expect(mockSetChartFieldVisibility).toHaveBeenCalledWith(
            "power",
            "visible"
        );
        expect(mockSetChartFieldVisibility).toHaveBeenCalledWith(
            "speed",
            "hidden"
        );
        expect(mockSetChartSetting).toHaveBeenCalledWith("smoothing", 5);
        expect(mockSetChartSetting).toHaveBeenCalledWith("showMarkers", true);

        // Check notification was shown
        expect(mockShowNotification).toHaveBeenCalledWith(
            "Chart configuration loaded from URL",
            "success"
        );

        // Advance timers and check if rendering was triggered
        vi.advanceTimersByTime(100);
        expect(localChartStateManager.debouncedRender).toHaveBeenCalledWith(
            "Configuration loaded from URL"
        );
    });

    it("should use renderChartJS as fallback when chartStateManager is undefined", async () => {
        expect.assertions(2);

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

        registeredChartStateManager = null;

        // Keep renderChartJS mock to observe fallback
        vi.doMock(
            import("../../../../../electron-app/utils/charts/core/renderChartJS.js"),
            () => ({
                renderChartJS: mockRenderChartJS,
            })
        );

        const { loadSharedConfiguration } =
            await import("../../../../../electron-app/utils/app/initialization/loadSharedConfiguration.js");

        expect(loadSharedConfiguration()).toBeUndefined();
        // Advance timers to trigger fallback render
        vi.advanceTimersByTime(120);
        expect(mockRenderChartJS).toHaveBeenCalledWith();
    });

    // Adding a simpler test instead that verifies settings are updated correctly
    it("should handle basic configuration correctly", async () => {
        expect.assertions(2);

        // Reset modules and localStorage
        vi.resetModules();
        mockLocalStorage = {};

        // Mock showNotification
        vi.doMock(
            import("../../../../../electron-app/utils/ui/notifications/showNotification.js"),
            () => ({
                showNotification: mockShowNotification,
            })
        );

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
            await import("../../../../../electron-app/utils/app/initialization/loadSharedConfiguration.js");

        // Call the function
        expect(loadSharedConfiguration()).toBeUndefined();

        expect(mockSetChartSetting).toHaveBeenCalledWith("smoothing", 10);
    });

    it("should handle missing chartConfig parameter", async () => {
        expect.assertions(6);

        // Set URL with no config parameter
        Object.defineProperty(window, "location", {
            value: {
                search: "?otherParam=value",
            },
            writable: true,
        });

        // Import module under test
        const { loadSharedConfiguration } =
            await import("../../../../../electron-app/utils/app/initialization/loadSharedConfiguration.js");

        // Call the function
        expect(loadSharedConfiguration()).toBeUndefined();

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
        expect.assertions(3);

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
            await import("../../../../../electron-app/utils/app/initialization/loadSharedConfiguration.js");

        // Call the function
        expect(loadSharedConfiguration()).toBeUndefined();

        // Error should be logged
        expect(consoleErrorSpy).toHaveBeenCalledWith(
            "Error loading shared configuration:",
            expect.any(Error)
        );

        // Warning notification should be shown
        expect(mockShowNotification).toHaveBeenCalledWith(
            "Failed to load shared configuration",
            "warning"
        );
    });

    it("should handle other exceptions during processing", async () => {
        expect.assertions(3);

        // Set up a situation that will cause an error
        // Mock URLSearchParams to throw an error
        setTestGlobal(
            "URLSearchParams",
            vi.fn<typeof URLSearchParams>(() => {
                throw new Error("Mock URLSearchParams error");
            }) as unknown as typeof URLSearchParams
        );

        // Import module under test
        const { loadSharedConfiguration } =
            await import("../../../../../electron-app/utils/app/initialization/loadSharedConfiguration.js");

        // Call the function
        expect(loadSharedConfiguration()).toBeUndefined();

        // Error should be logged
        expect(consoleErrorSpy).toHaveBeenCalledWith(
            "Error loading shared configuration:",
            expect.any(Error)
        );

        // Warning notification should be shown
        expect(mockShowNotification).toHaveBeenCalledWith(
            "Failed to load shared configuration",
            "warning"
        );
    });
});
