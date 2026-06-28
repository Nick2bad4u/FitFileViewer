import { describe, expect, it, vi } from "vitest";

type SetupWindowModule =
    typeof import("../../../../../electron-app/utils/app/initialization/setupWindow.js");

const mocks = vi.hoisted(() => ({
    applyTheme: vi.fn<(theme: string, withTransition?: boolean) => void>(),
    chartStateDestroy: vi.fn<() => void>(),
    chartTabDestroy: vi.fn<() => void>(),
    chartTabInitialize: vi.fn<() => void>(),
    listenForThemeChange:
        vi.fn<(onThemeChange: (theme: string) => void) => void>(),
    setupTheme: vi.fn<
        (
            applyTheme: unknown,
            listenForThemeChange?: unknown,
            options?: unknown
        ) => Promise<"dark">
    >(() => Promise.resolve("dark")),
    showNotification:
        vi.fn<(message: string, type: string, duration?: number) => void>(),
    tabStateCleanup: vi.fn<() => void>(),
    tabSetElectronApiScope: vi.fn<(scope: unknown) => void>(),
    tabSwitchToTab: vi.fn<(tabId: string) => void>(),
}));

vi.mock(
    import("../../../../../electron-app/utils/charts/core/chartStateManagerRegistry.js"),
    () => ({
        getRegisteredChartStateManager: () => ({
            destroy: mocks.chartStateDestroy,
        }),
    })
);

vi.mock(
    import("../../../../../electron-app/utils/charts/core/chartTabIntegration.js"),
    () => ({
        chartTabIntegration: {
            destroy: mocks.chartTabDestroy,
            initialize: mocks.chartTabInitialize,
        },
    })
);

vi.mock(
    import("../../../../../electron-app/utils/theming/core/setupTheme.js"),
    () => ({
        setupTheme: mocks.setupTheme,
    })
);

vi.mock(
    import("../../../../../electron-app/utils/theming/core/theme.js"),
    () => ({
        applyTheme: mocks.applyTheme,
        listenForThemeChange: mocks.listenForThemeChange,
    })
);

vi.mock(
    import("../../../../../electron-app/utils/ui/notifications/showNotification.js"),
    () => ({
        showNotification: mocks.showNotification,
    })
);

vi.mock(
    import("../../../../../electron-app/utils/ui/tabs/tabStateManager.js"),
    () => ({
        tabStateManager: {
            cleanup: mocks.tabStateCleanup,
            setElectronApiScope: mocks.tabSetElectronApiScope,
            switchToTab: mocks.tabSwitchToTab,
        },
    })
);

describe("setupWindow", () => {
    it("initializes theme, chart integration, default tab, and notification", async () => {
        expect.assertions(7);

        resetTestState();

        const { setupWindow } = await importSetupWindow();
        const electronApiScope = {
            getElectronAPI: vi.fn(),
        };
        const result = await setupWindow({ electronApiScope });

        expect(result).toBeUndefined();
        expect(mocks.setupTheme).toHaveBeenCalledWith(
            mocks.applyTheme,
            mocks.listenForThemeChange,
            { electronApiScope }
        );
        expect(mocks.chartTabInitialize).toHaveBeenCalledOnce();
        expect(mocks.tabSetElectronApiScope).toHaveBeenCalledWith(
            electronApiScope
        );
        expect(mocks.tabSwitchToTab).toHaveBeenCalledWith("summary");
        expect(mocks.showNotification).toHaveBeenCalledWith(
            "Application initialized successfully",
            "success",
            2000
        );
        expect(mocks.chartStateDestroy).not.toHaveBeenCalled();
    });

    it("reports and rethrows initialization failures", async () => {
        expect.assertions(4);

        resetTestState();
        const setupError = new Error("theme failed");
        mocks.setupTheme.mockRejectedValueOnce(setupError);

        const { setupWindow } = await importSetupWindow();

        await expect(setupWindow()).rejects.toBe(setupError);
        expect(mocks.chartTabInitialize).not.toHaveBeenCalled();
        expect(mocks.tabSwitchToTab).not.toHaveBeenCalled();
        expect(mocks.showNotification).toHaveBeenCalledWith(
            "Application initialization failed",
            "error",
            5000
        );
    });

    it("cleans up chart, tab, and integration managers", async () => {
        expect.assertions(5);

        resetTestState();

        const { cleanup } = await importSetupWindow();
        const result = cleanup();

        expect(result).toBeUndefined();
        expect(mocks.tabSetElectronApiScope).toHaveBeenCalledWith(undefined);
        expect(mocks.chartStateDestroy).toHaveBeenCalledOnce();
        expect(mocks.tabStateCleanup).toHaveBeenCalledOnce();
        expect(mocks.chartTabDestroy).toHaveBeenCalledOnce();
    });
});

async function importSetupWindow(): Promise<SetupWindowModule> {
    return import("../../../../../electron-app/utils/app/initialization/setupWindow.js");
}

function resetTestState(): void {
    vi.resetModules();
    vi.clearAllMocks();
    mocks.setupTheme.mockResolvedValue("dark");
}
