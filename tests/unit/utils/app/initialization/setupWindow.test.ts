import { describe, it, expect, beforeEach, vi } from "vitest";

type Cleanup = () => void;
type SetupTheme = (
    applyTheme: (theme: string) => void,
    listenForThemeChange?: (callback: (theme: unknown) => void) => void,
    options?: unknown
) => Promise<"auto" | "dark" | "light">;
type ShowNotification = (
    message: string,
    type: "error" | "success",
    duration: number
) => void;
type SwitchToTab = (tab: string) => void;

const chartStateManagerMock = {
        destroy: vi.fn<Cleanup>(),
    },
    chartTabIntegrationMock = {
        destroy: vi.fn<Cleanup>(),
        initialize: vi.fn<Cleanup>(),
    },
    tabStateManagerMock = {
        cleanup: vi.fn<Cleanup>(),
        switchToTab: vi.fn<SwitchToTab>(),
    },
    setupThemeMock = vi.fn<SetupTheme>(),
    showNotificationMock = vi.fn<ShowNotification>(),
    applyThemeMock = vi.fn<(theme: string) => void>(),
    listenForThemeChangeMock =
        vi.fn<(callback: (theme: unknown) => void) => void>();

vi.mock(
    import("../../../../../electron-app/utils/charts/core/chartStateManagerRegistry.js"),
    () => ({
        getRegisteredChartStateManager: () => chartStateManagerMock,
    })
);

vi.mock(
    import("../../../../../electron-app/utils/charts/core/chartTabIntegration.js"),
    () => ({
        chartTabIntegration: chartTabIntegrationMock,
    })
);

vi.mock(
    import("../../../../../electron-app/utils/ui/tabs/tabStateManager.js"),
    () => ({
        tabStateManager: tabStateManagerMock,
    })
);

vi.mock(
    import("../../../../../electron-app/utils/theming/core/setupTheme.js"),
    () => ({
        setupTheme: setupThemeMock,
    })
);

vi.mock(
    import("../../../../../electron-app/utils/theming/core/theme.js"),
    () => ({
        applyTheme: applyThemeMock,
        listenForThemeChange: listenForThemeChangeMock,
    })
);

vi.mock(
    import("../../../../../electron-app/utils/ui/notifications/showNotification.js"),
    () => ({
        showNotification: showNotificationMock,
    })
);

async function loadModule() {
    return import("../../../../../electron-app/utils/app/initialization/setupWindow.js");
}

describe("setupWindow", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        chartStateManagerMock.destroy.mockReset();
        chartTabIntegrationMock.destroy.mockReset();
        chartTabIntegrationMock.initialize.mockReset();
        tabStateManagerMock.cleanup.mockReset();
        tabStateManagerMock.switchToTab.mockReset();
        setupThemeMock.mockReset();
        showNotificationMock.mockReset();
        applyThemeMock.mockReset();
        listenForThemeChangeMock.mockReset();
    });

    it("cleans up managers successfully", async () => {
        expect.assertions(5);

        const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
        const { cleanup } = await loadModule();

        expect(cleanup()).toBeUndefined();
        expect(chartStateManagerMock.destroy).toHaveBeenCalledOnce();
        expect(tabStateManagerMock.cleanup).toHaveBeenCalledOnce();
        expect(chartTabIntegrationMock.destroy).toHaveBeenCalledOnce();
        expect(logSpy).toHaveBeenCalledWith("[setupWindow] Cleanup completed");

        logSpy.mockRestore();
    });

    it("logs error when cleanup fails", async () => {
        expect.assertions(2);

        const error = new Error("boom");
        chartStateManagerMock.destroy.mockImplementationOnce(() => {
            throw error;
        });
        const errorSpy = vi
            .spyOn(console, "error")
            .mockImplementation(() => {});
        const { cleanup } = await loadModule();

        expect(cleanup()).toBeUndefined();
        expect(errorSpy).toHaveBeenCalledWith(
            "[setupWindow] Cleanup failed:",
            error
        );

        errorSpy.mockRestore();
    });

    it("initializes window successfully", async () => {
        expect.assertions(2);

        const lifecycleEvents: Array<{
            args?: unknown[];
            event: string;
            usesApplyTheme?: boolean;
            usesThemeListener?: boolean;
        }> = [];
        setupThemeMock.mockImplementationOnce(async (apply, listen) => {
            lifecycleEvents.push({
                event: "setupTheme",
                usesApplyTheme: apply === applyThemeMock,
                usesThemeListener: listen === listenForThemeChangeMock,
            });
            return "dark";
        });
        chartTabIntegrationMock.initialize.mockImplementationOnce(() => {
            lifecycleEvents.push({ event: "chartTabIntegration.initialize" });
        });
        tabStateManagerMock.switchToTab.mockImplementationOnce((tab) => {
            lifecycleEvents.push({
                args: [tab],
                event: "tabStateManager.switchToTab",
            });
        });
        showNotificationMock.mockImplementationOnce((...args) => {
            lifecycleEvents.push({ args, event: "showNotification" });
        });
        const logSpy = vi
            .spyOn(console, "log")
            .mockImplementation((...args) => {
                lifecycleEvents.push({ args, event: "console.log" });
            });
        const { setupWindow } = await loadModule();
        const electronApiScope = {
            getElectronAPI: vi.fn(),
        };

        await setupWindow({ electronApiScope });

        expect(lifecycleEvents).toStrictEqual([
            {
                args: [
                    "[setupWindow] Initializing with modern state management...",
                ],
                event: "console.log",
            },
            {
                event: "setupTheme",
                usesApplyTheme: true,
                usesThemeListener: true,
            },
            { event: "chartTabIntegration.initialize" },
            {
                args: ["summary"],
                event: "tabStateManager.switchToTab",
            },
            {
                args: [
                    "Application initialized successfully",
                    "success",
                    2000,
                ],
                event: "showNotification",
            },
            {
                args: ["[setupWindow] Modern initialization complete"],
                event: "console.log",
            },
        ]);
        expect(setupThemeMock).toHaveBeenCalledWith(
            applyThemeMock,
            listenForThemeChangeMock,
            { electronApiScope }
        );

        logSpy.mockRestore();
    });

    it("notifies and rethrows on initialization failure", async () => {
        expect.assertions(5);

        const failure = new Error("setup failed");
        setupThemeMock.mockRejectedValueOnce(failure);
        const errorSpy = vi
            .spyOn(console, "error")
            .mockImplementation(() => {});
        const { setupWindow } = await loadModule();

        await expect(setupWindow()).rejects.toThrow(failure);

        expect(showNotificationMock).toHaveBeenCalledWith(
            "Application initialization failed",
            "error",
            5000
        );
        expect(chartTabIntegrationMock.initialize).not.toHaveBeenCalled();
        expect(tabStateManagerMock.switchToTab).not.toHaveBeenCalled();
        expect(errorSpy).toHaveBeenCalledWith(
            "[setupWindow] Initialization failed:",
            failure
        );

        errorSpy.mockRestore();
    });
});
