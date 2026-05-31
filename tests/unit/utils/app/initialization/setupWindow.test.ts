import { describe, it, expect, beforeEach, vi } from "vitest";

const chartStateManagerMock = {
        cleanup: vi.fn(),
    },
    chartTabIntegrationMock = {
        cleanup: vi.fn(),
        initialize: vi.fn(),
    },
    tabStateManagerMock = {
        cleanup: vi.fn(),
        switchToTab: vi.fn(),
    },
    setupThemeMock = vi.fn(),
    showNotificationMock = vi.fn(),
    applyThemeMock = vi.fn(),
    listenForThemeChangeMock = vi.fn();

vi.mock(
    "../../../../../electron-app/utils/charts/core/chartStateManager.js",
    () => ({
        chartStateManager: chartStateManagerMock,
    })
);

vi.mock(
    "../../../../../electron-app/utils/charts/core/chartTabIntegration.js",
    () => ({
        chartTabIntegration: chartTabIntegrationMock,
    })
);

vi.mock("../../../../../electron-app/utils/ui/tabs/tabStateManager.js", () => ({
    tabStateManager: tabStateManagerMock,
}));

vi.mock("../../../../../electron-app/utils/theming/core/setupTheme.js", () => ({
    setupTheme: setupThemeMock,
}));

vi.mock("../../../../../electron-app/utils/theming/core/theme.js", () => ({
    applyTheme: applyThemeMock,
    listenForThemeChange: listenForThemeChangeMock,
}));

vi.mock(
    "../../../../../electron-app/utils/ui/notifications/showNotification.js",
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
        chartStateManagerMock.cleanup.mockReset();
        chartTabIntegrationMock.cleanup.mockReset();
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

        expect(() => cleanup()).not.toThrow();
        expect(chartStateManagerMock.cleanup).toHaveBeenCalledTimes(1);
        expect(tabStateManagerMock.cleanup).toHaveBeenCalledTimes(1);
        expect(chartTabIntegrationMock.cleanup).toHaveBeenCalledTimes(1);
        expect(logSpy).toHaveBeenCalledWith("[setupWindow] Cleanup completed");

        logSpy.mockRestore();
    });

    it("logs error when cleanup fails", async () => {
        expect.assertions(2);

        const error = new Error("boom");
        chartStateManagerMock.cleanup.mockImplementationOnce(() => {
            throw error;
        });
        const errorSpy = vi
            .spyOn(console, "error")
            .mockImplementation(() => {});
        const { cleanup } = await loadModule();

        expect(() => cleanup()).not.toThrow();
        expect(errorSpy).toHaveBeenCalledWith(
            "[setupWindow] Cleanup failed:",
            error
        );

        errorSpy.mockRestore();
    });

    it("initializes window successfully", async () => {
        expect.assertions(1);

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

        await setupWindow();

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
