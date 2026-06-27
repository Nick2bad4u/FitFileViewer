// @vitest-environment jsdom
import "../vitest/shims/nodeWebStorage";
import { describe, it, expect, vi, afterEach, beforeEach } from "vitest";
import type { Mock } from "vitest";
import type { ElectronAPI } from "../../electron-app/shared/preloadApi.js";

type DragDropInstance = {
    dispose: Mock<() => void>;
};

type ExternalLinkOptions = {
    cleanupExternalLinkHandlers: (() => void) | null;
    setCleanup: (cleanup: (() => void) | null) => void;
};

type MainUiElectronApi = Partial<
    Pick<
        ElectronAPI,
        | "notifyFitFileLoaded"
        | "onOpenSummaryColumnSelector"
        | "onSetTheme"
        | "onUnloadFitFile"
        | "sendThemeChanged"
    >
>;

const mocks = vi.hoisted(() => ({
    applyTheme: vi.fn<(theme: string) => void>(),
    clearData: vi.fn<(options?: unknown) => void>(),
    cleanupAll: vi.fn<() => void>(),
    convertArrayBufferToBase64: vi.fn<(buffer: ArrayBuffer) => string>(),
    dragDropDispose: vi.fn<() => void>(),
    ensureRendererVendorBundle: vi.fn<
        (entryName: "chart-data" | "core" | "map") => Promise<void>
    >(() => Promise.resolve()),
    getState: vi.fn<(path?: string) => unknown>(),
    listenForThemeChange: vi.fn<(callback: (theme: string) => void) => void>(),
    loadTheme: vi.fn<() => string>().mockReturnValue("dark"),
    mainUiElectronApiCandidate: undefined as unknown,
    mark: vi.fn<(name: string) => void>(),
    measure: vi.fn<(name: string) => void>(),
    registerTimer:
        vi.fn<
            (timer: ReturnType<typeof setTimeout>, options?: unknown) => void
        >(),
    renderChartJS: vi.fn<(target: HTMLElement) => void>(),
    resourceAddShutdownHook: vi.fn<(callback: () => void) => void>(),
    setState:
        vi.fn<(path: string, value: unknown, options?: unknown) => void>(),
    setupExternalLinkHandlers: vi.fn<(options: ExternalLinkOptions) => void>(),
    setupFullscreenListeners: vi.fn<() => void>(),
    setupWindow: vi.fn<() => void>(),
    showTab: vi.fn<(tabId: string) => void>(),
    showFitData: vi.fn<(fitData: unknown, filePath?: string) => void>(),
    showNotification: vi.fn<(message: string, type?: string) => void>(),
    updateCharts: vi.fn<() => void>(),
    updateError: vi.fn<(error: Error | string) => void>(),
    updateFitData: vi.fn<(data: unknown) => void>(),
    updateLoadingProgress: vi.fn<(progress: number) => void>(),
}));

vi.mock(
    import("../../electron-app/renderer/mainUiRuntimeEnvironment.js"),
    () => ({
        getMainUiRuntimeEnvironment: () => ({
            consoleRef: console,
            dateNow: () => Date.now(),
            documentRef: document,
            electronApiCandidate: mocks.mainUiElectronApiCandidate,
        }),
    })
);

const chartTabStatus = { initialized: true } as const;

// Mock the DOM elements and utilities that main-ui.js depends on
vi.mock(import("../../electron-app/utils/theming/core/theme.js"), () => ({
    applyTheme: mocks.applyTheme,
    listenForThemeChange: mocks.listenForThemeChange,
    loadTheme: mocks.loadTheme,
}));

vi.mock(import("../../electron-app/renderer/vendorBundleLoader.js"), () => ({
    ensureRendererVendorBundle: mocks.ensureRendererVendorBundle,
}));

vi.mock(
    import("../../electron-app/utils/rendering/core/showFitData.js"),
    () => ({
        showFitData: mocks.showFitData,
    })
);

vi.mock(
    import("../../electron-app/utils/formatting/converters/convertArrayBufferToBase64.js"),
    () => ({
        convertArrayBufferToBase64: mocks.convertArrayBufferToBase64,
    })
);

vi.mock(
    import("../../electron-app/utils/ui/controls/addFullScreenButton.js"),
    () => ({
        setupFullscreenListeners: mocks.setupFullscreenListeners,
    })
);

vi.mock(
    import("../../electron-app/utils/app/initialization/setupWindow.js"),
    () => ({
        setupWindow: mocks.setupWindow,
    })
);

vi.mock(
    import("../../electron-app/utils/app/lifecycle/resourceManager.js"),
    () => ({
        resourceManager: {
            addShutdownHook: mocks.resourceAddShutdownHook,
            cleanupAll: mocks.cleanupAll,
            registerTimer: mocks.registerTimer,
        },
    })
);

vi.mock(
    import("../../electron-app/utils/charts/core/renderChartJS.js"),
    () => ({
        renderChartJS: mocks.renderChartJS,
    })
);

vi.mock(import("../../electron-app/utils/state/core/stateManager.js"), () => ({
    getState: mocks.getState,
    setState: mocks.setState,
}));

vi.mock(
    import("../../electron-app/utils/state/domain/uiStateManager.js"),
    () => ({
        UIActions: {
            TOGGLE_TAB: "UI_TOGGLE_TAB",
            SET_ACTIVE_TAB: "UI_SET_ACTIVE_TAB",
            SHOW_LOADING: "UI_SHOW_LOADING",
            HIDE_LOADING: "UI_HIDE_LOADING",
            setTheme: vi.fn<(theme: string) => void>(),
            showTab: mocks.showTab,
        },
    })
);

vi.mock(import("../../electron-app/utils/app/lifecycle/appActions.js"), () => ({
    AppActions: {
        APP_INITIALIZED: "APP_INITIALIZED",
        APP_ERROR: "APP_ERROR",
        APP_READY: "APP_READY",
        clearData: mocks.clearData,
    },
}));

vi.mock(
    import("../../electron-app/utils/state/domain/fitFileState.js"),
    () => ({
        fitFileStateManager: {
            clearFileState: vi.fn<() => void>(),
            updateLoadingProgress: mocks.updateLoadingProgress,
            updateError: mocks.updateError,
            updateFitData: mocks.updateFitData,
        },
    })
);

vi.mock(import("../../electron-app/utils/debug/stateDevTools.js"), () => ({
    performanceMonitor: {
        mark: mocks.mark,
        measure: mocks.measure,
    },
}));

vi.mock(
    import("../../electron-app/utils/ui/notifications/showNotification.js"),
    () => ({
        showNotification: mocks.showNotification,
    })
);

vi.mock(
    import("../../electron-app/utils/charts/core/chartTabIntegration.js"),
    () => ({
        chartTabIntegration: {
            destroy: vi.fn<() => void>(),
            getStatus: vi
                .fn<() => typeof chartTabStatus>()
                .mockReturnValue(chartTabStatus),
            initialize: vi.fn<() => void>(),
            updateCharts: mocks.updateCharts,
        },
    })
);

vi.mock(import("../../electron-app/utils/ui/dragDropHandler.js"), () => ({
    DragDropHandler: vi.fn<() => DragDropInstance>(
        function MockDragDropHandler() {
            return { dispose: mocks.dragDropDispose };
        }
    ),
}));

vi.mock(
    import("../../electron-app/utils/ui/setupExternalLinkHandlers.js"),
    () => ({
        setupExternalLinkHandlers: mocks.setupExternalLinkHandlers,
    })
);

function createElement<K extends keyof HTMLElementTagNameMap>(
    tagName: K,
    {
        className,
        id,
        text,
    }: { className?: string; id?: string; text?: string } = {}
): HTMLElementTagNameMap[K] {
    const element = document.createElement(tagName);
    if (id) {
        element.id = id;
    }
    if (className) {
        element.className = className;
    }
    if (text) {
        element.textContent = text;
    }
    return element;
}

function setupMainUiDom(): void {
    const tabButtons = createElement("div", { id: "tab-buttons" });
    tabButtons.replaceChildren(
        createElement("button", {
            className: "tab-button",
            id: "tab_summary",
            text: "Summary",
        }),
        createElement("button", {
            className: "tab-button",
            id: "tab_chart",
            text: "Charts",
        }),
        createElement("button", {
            className: "tab-button",
            id: "tab_map",
            text: "Map",
        })
    );

    const contentTabs = createElement("div", { id: "content-tabs" });
    contentTabs.replaceChildren(
        createElement("div", {
            className: "content-tab",
            id: "content_summary",
        }),
        createElement("div", {
            className: "content-tab",
            id: "content_data",
        }),
        createElement("div", {
            className: "content-tab",
            id: "content_chart",
        }),
        createElement("div", {
            className: "content-tab",
            id: "content_map",
        })
    );

    document.body.replaceChildren(
        tabButtons,
        contentTabs,
        createElement("button", {
            id: "unload_file_btn",
            text: "Unload",
        }),
        createElement("div", { id: "loading-overlay" })
    );
}

describe("main-ui.js - UI Controller and State Management", () => {
    beforeEach(async () => {
        setupMainUiDom();
        vi.clearAllMocks();
        mocks.mainUiElectronApiCandidate = undefined;
        mocks.ensureRendererVendorBundle.mockResolvedValue(undefined);
        mocks.loadTheme.mockReturnValue("dark");
        vi.resetModules();
    });

    afterEach(async () => {
        mocks.mainUiElectronApiCandidate = undefined;
    });

    it("does not register renderer compatibility globals", async () => {
        expect.assertions(7);

        await import("../../electron-app/main-ui.js");

        expect(document.querySelectorAll(".tab-button")).toHaveLength(3);
        expect("showFitData" in globalThis).toBe(false);
        expect("renderChartJS" in globalThis).toBe(false);
        expect("cleanupEventListeners" in globalThis).toBe(false);
        expect("dragDropHandler" in globalThis).toBe(false);
        expect("injectMenu" in globalThis).toBe(false);
        expect("devCleanup" in globalThis).toBe(false);
    });

    it("isolates malformed main UI Electron API domains", async () => {
        expect.assertions(5);

        const onOpenSummaryColumnSelector =
            vi.fn<MainUiElectronApi["onOpenSummaryColumnSelector"]>();
        const onSetTheme = vi.fn<MainUiElectronApi["onSetTheme"]>();
        const onUnloadFitFile = vi.fn<MainUiElectronApi["onUnloadFitFile"]>();
        mocks.mainUiElectronApiCandidate = {
            onOpenSummaryColumnSelector,
            onSetTheme,
            onUnloadFitFile: "not callable",
        };

        await import("../../electron-app/main-ui.js");

        expect(document.querySelectorAll(".tab-button")).toHaveLength(3);
        expect(mocks.loadTheme).toHaveBeenCalledOnce();
        expect(onOpenSummaryColumnSelector).toHaveBeenCalledOnce();
        expect(onSetTheme).not.toHaveBeenCalled();
        expect(onUnloadFitFile).not.toHaveBeenCalled();
    });

    it("initializes UI side effects when loaded", async () => {
        expect.assertions(20);

        const notifyFitFileLoaded =
            vi.fn<MainUiElectronApi["notifyFitFileLoaded"]>();
        const onOpenSummaryColumnSelector =
            vi.fn<MainUiElectronApi["onOpenSummaryColumnSelector"]>();
        const onSetTheme = vi.fn<MainUiElectronApi["onSetTheme"]>();
        const onUnloadFitFile = vi.fn<MainUiElectronApi["onUnloadFitFile"]>();
        const sendThemeChanged = vi.fn<MainUiElectronApi["sendThemeChanged"]>();
        mocks.mainUiElectronApiCandidate = {
            notifyFitFileLoaded,
            onOpenSummaryColumnSelector,
            onSetTheme,
            onUnloadFitFile,
            sendThemeChanged,
        };

        const mainUiModule = await import("../../electron-app/main-ui.js");
        const { resourceManager } =
            await import("../../electron-app/utils/app/lifecycle/resourceManager.js");
        const { chartTabIntegration } =
            await import("../../electron-app/utils/charts/core/chartTabIntegration.js");
        const { DragDropHandler } =
            await import("../../electron-app/utils/ui/dragDropHandler.js");
        const resourceManagerMock = vi.mocked(resourceManager);
        const dragDropHandlerMock = vi.mocked(DragDropHandler);

        expect(mocks.loadTheme).toHaveBeenCalledOnce();
        expect(mocks.applyTheme).toHaveBeenCalledWith("dark");
        expect(mocks.listenForThemeChange).toHaveBeenCalledOnce();
        await vi.waitFor(() => {
            expect(mocks.setupFullscreenListeners).toHaveBeenCalledOnce();
        });
        expect(mocks.setupWindow).toHaveBeenCalledOnce();
        expect(mocks.setupExternalLinkHandlers).toHaveBeenCalledOnce();
        const [externalLinkOptions] =
            mocks.setupExternalLinkHandlers.mock.calls[0] ?? [];
        expect({
            cleanupExternalLinkHandlers:
                externalLinkOptions?.cleanupExternalLinkHandlers,
            setCleanupType: typeof externalLinkOptions?.setCleanup,
        }).toStrictEqual({
            cleanupExternalLinkHandlers: null,
            setCleanupType: "function",
        });

        expect(resourceManagerMock.addShutdownHook).toHaveBeenCalledOnce();
        const [shutdownHook] =
            resourceManagerMock.addShutdownHook.mock.calls[0] ?? [];

        const cleanupExternalLinks = vi.fn<() => void>();
        externalLinkOptions?.setCleanup(cleanupExternalLinks);
        shutdownHook?.();
        expect(cleanupExternalLinks).toHaveBeenCalledOnce();
        expect(mocks.clearData).toHaveBeenCalledOnce();

        expect(dragDropHandlerMock).toHaveBeenCalledOnce();
        const dragDropInstance = dragDropHandlerMock.mock.results[0]?.value;
        expect(Reflect.has(mainUiModule, "mainUiDragDropHandler")).toBe(false);
        expect(dragDropInstance.dispose).toBe(mocks.dragDropDispose);
        expect(onOpenSummaryColumnSelector).toHaveBeenCalledOnce();
        expect(onUnloadFitFile).toHaveBeenCalledOnce();
        onUnloadFitFile.mock.calls[0]?.[0]?.();
        expect(mocks.clearData).toHaveBeenCalledTimes(2);
        expect(notifyFitFileLoaded).toHaveBeenCalledWith(null);
        expect(mocks.showTab).toHaveBeenCalledWith("map");
        expect(mocks.clearData.mock.calls[1]).toStrictEqual([
            { notificationMessage: "File unloaded successfully" },
        ]);
        expect(chartTabIntegration.getStatus).toHaveBeenCalledOnce();
    });
});
