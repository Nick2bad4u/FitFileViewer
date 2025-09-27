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

vi.mock("../../../../../utils/charts/core/chartStateManager.js", () => ({
    chartStateManager: chartStateManagerMock,
}));

vi.mock("../../../../../utils/charts/core/chartTabIntegration.js", () => ({
    chartTabIntegration: chartTabIntegrationMock,
}));

vi.mock("../../../../../utils/ui/tabs/tabStateManager.js", () => ({
    tabStateManager: tabStateManagerMock,
}));

vi.mock("../../../../../utils/theming/core/setupTheme.js", () => ({
    setupTheme: setupThemeMock,
}));

vi.mock("../../../../../utils/theming/core/theme.js", () => ({
    applyTheme: applyThemeMock,
    listenForThemeChange: listenForThemeChangeMock,
}));

vi.mock("../../../../../utils/ui/notifications/showNotification.js", () => ({
    showNotification: showNotificationMock,
}));

async function loadModule() {
    return import("../../../../../utils/app/initialization/setupWindow.js");
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
        const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
        const { cleanup } = await loadModule();

        cleanup();

        expect(chartStateManagerMock.cleanup).toHaveBeenCalledTimes(1);
        expect(tabStateManagerMock.cleanup).toHaveBeenCalledTimes(1);
        expect(chartTabIntegrationMock.cleanup).toHaveBeenCalledTimes(1);
        expect(logSpy).toHaveBeenCalledWith("[setupWindow] Cleanup completed");

        logSpy.mockRestore();
    });

    it("logs error when cleanup fails", async () => {
        const error = new Error("boom");
        chartStateManagerMock.cleanup.mockImplementationOnce(() => {
            throw error;
        });
        const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
        const { cleanup } = await loadModule();

        cleanup();

        expect(errorSpy).toHaveBeenCalledWith("[setupWindow] Cleanup failed:", error);

        errorSpy.mockRestore();
    });

    it("initializes window successfully", async () => {
        setupThemeMock.mockResolvedValueOnce("dark");
        const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
        const { setupWindow } = await loadModule();

        await expect(setupWindow()).resolves.toBeUndefined();

        expect(setupThemeMock).toHaveBeenCalledWith(applyThemeMock, listenForThemeChangeMock);
        expect(chartTabIntegrationMock.initialize).toHaveBeenCalledTimes(1);
        expect(tabStateManagerMock.switchToTab).toHaveBeenCalledWith("summary");
        expect(showNotificationMock).toHaveBeenCalledWith("Application initialized successfully", "success", 2000);
        expect(logSpy).toHaveBeenCalledWith("[setupWindow] Modern initialization complete");

        logSpy.mockRestore();
    });

    it("notifies and rethrows on initialization failure", async () => {
        const failure = new Error("setup failed");
        setupThemeMock.mockRejectedValueOnce(failure);
        const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
        const { setupWindow } = await loadModule();

        await expect(setupWindow()).rejects.toThrow(failure);

        expect(showNotificationMock).toHaveBeenCalledWith("Application initialization failed", "error", 5000);
        expect(chartTabIntegrationMock.initialize).not.toHaveBeenCalled();
        expect(tabStateManagerMock.switchToTab).not.toHaveBeenCalled();
        expect(errorSpy).toHaveBeenCalledWith("[setupWindow] Initialization failed:", failure);

        errorSpy.mockRestore();
    });
});
