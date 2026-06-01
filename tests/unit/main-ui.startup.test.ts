// @vitest-environment jsdom
import "../vitest/shims/nodeWebStorage";
import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Mock } from "vitest";
import type { ElectronAPIWithDevFlags } from "../../electron-app/shared/preloadApi.js";

type DragDropInstance = {
    dispose: Mock<() => void>;
};

type ExternalLinkOptions = {
    cleanupExternalLinkHandlers: (() => void) | null;
    setCleanup: (cleanup: (() => void) | null) => void;
};

type MainUiTestGlobal = typeof globalThis & {
    cleanupEventListeners?: () => void;
    dragDropHandler?: DragDropInstance;
    electronAPI?: Partial<
        Pick<
            ElectronAPIWithDevFlags,
            "onIpc" | "onSetTheme" | "sendThemeChanged"
        >
    >;
    renderChartJS?: (target: HTMLElement) => void;
    showFitData?: (fitData: unknown, filePath?: string) => void;
};

const mocks = vi.hoisted(() => ({
    applyTheme: vi.fn<(theme: string) => void>(),
    clearData: vi.fn<() => void>(),
    cleanupAll: vi.fn<() => void>(),
    convertArrayBufferToBase64: vi.fn<(buffer: ArrayBuffer) => string>(),
    dragDropDispose: vi.fn<() => void>(),
    getState: vi.fn<(path?: string) => unknown>(),
    listenForThemeChange: vi.fn<(callback: (theme: string) => void) => void>(),
    loadTheme: vi.fn<() => string>().mockReturnValue("dark"),
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
    setupDOMContentLoaded: vi.fn<() => void>(),
    setupExternalLinkHandlers: vi.fn<(options: ExternalLinkOptions) => void>(),
    setupFullscreenListeners: vi.fn<() => void>(),
    setupWindow: vi.fn<() => void>(),
    showFitData: vi.fn<(fitData: unknown, filePath?: string) => void>(),
    showNotification: vi.fn<(message: string, type?: string) => void>(),
    updateCharts: vi.fn<() => void>(),
    updateError: vi.fn<(error: Error | string) => void>(),
    updateFitData: vi.fn<(data: unknown) => void>(),
    updateLoadingProgress: vi.fn<(progress: number) => void>(),
}));

const chartTabStatus = { initialized: true } as const;

// Mock the DOM elements and utilities that main-ui.js depends on
vi.mock(import("../../electron-app/utils/theming/core/theme.js"), () => ({
    applyTheme: mocks.applyTheme,
    listenForThemeChange: mocks.listenForThemeChange,
    loadTheme: mocks.loadTheme,
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
        setupDOMContentLoaded: mocks.setupDOMContentLoaded,
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
            showTab: vi.fn<(tabId: string) => void>(),
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

function getMainUiTestGlobal(): MainUiTestGlobal {
    return globalThis as MainUiTestGlobal;
}

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
    beforeEach(() => {
        setupMainUiDom();
        vi.clearAllMocks();
        mocks.loadTheme.mockReturnValue("dark");
        vi.resetModules();
        Reflect.deleteProperty(globalThis, "dragDropHandler");
        Reflect.deleteProperty(globalThis, "electronAPI");
        Reflect.deleteProperty(globalThis, "showFitData");
        Reflect.deleteProperty(globalThis, "renderChartJS");
        Reflect.deleteProperty(globalThis, "cleanupEventListeners");
    });

    it("registers legacy globals and rejects invalid legacy FIT data", async () => {
        expect.assertions(5);

        await import("../../electron-app/main-ui.js");
        const { addEventListenerWithCleanup } =
            await import("../../electron-app/utils/ui/mainUiDomUtils.js");
        const mainUiGlobal = getMainUiTestGlobal();

        expect(document.querySelectorAll(".tab-button")).toHaveLength(3);

        mainUiGlobal.showFitData?.(null);
        expect(mocks.showFitData).not.toHaveBeenCalled();

        const fitData = { records: [] };
        mainUiGlobal.showFitData?.(fitData, "activity.fit");
        expect(mocks.showFitData).toHaveBeenCalledWith(fitData, "activity.fit");

        const targetContainer = createElement("div", { id: "chart-target" });
        mainUiGlobal.renderChartJS?.(targetContainer);
        expect(mocks.renderChartJS).toHaveBeenCalledWith(targetContainer);

        const cleanupTarget = createElement("button");
        const cleanupListener = vi.fn<() => void>();
        addEventListenerWithCleanup(cleanupTarget, "click", cleanupListener);
        mainUiGlobal.cleanupEventListeners?.();
        cleanupTarget.click();
        expect(cleanupListener).not.toHaveBeenCalled();
    });

    it("initializes UI side effects when loaded", async () => {
        expect.assertions(16);

        const onIpc =
            vi.fn<NonNullable<MainUiTestGlobal["electronAPI"]>["onIpc"]>();
        const onSetTheme =
            vi.fn<NonNullable<MainUiTestGlobal["electronAPI"]>["onSetTheme"]>();
        const sendThemeChanged =
            vi.fn<
                NonNullable<MainUiTestGlobal["electronAPI"]>["sendThemeChanged"]
            >();
        getMainUiTestGlobal().electronAPI = {
            onIpc,
            onSetTheme,
            sendThemeChanged,
        };

        await import("../../electron-app/main-ui.js");
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
        expect(mocks.setupFullscreenListeners).toHaveBeenCalledOnce();
        expect(mocks.setupWindow).toHaveBeenCalledOnce();
        expect(mocks.setupExternalLinkHandlers).toHaveBeenCalledOnce();
        const [externalLinkOptions] =
            mocks.setupExternalLinkHandlers.mock.calls[0] ?? [];
        expect(externalLinkOptions).toMatchObject({
            cleanupExternalLinkHandlers: null,
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
        expect(getMainUiTestGlobal().dragDropHandler).toBe(dragDropInstance);
        expect(dragDropInstance.dispose).toBe(mocks.dragDropDispose);
        const ipcHandlers = new Map(onIpc.mock.calls);
        expect([...ipcHandlers.keys()]).toStrictEqual([
            "open-summary-column-selector",
            "unload-fit-file",
        ]);
        ipcHandlers.get("unload-fit-file")?.();
        expect(mocks.clearData).toHaveBeenCalledTimes(2);
        expect(chartTabIntegration.getStatus).toHaveBeenCalledOnce();
    });
});
