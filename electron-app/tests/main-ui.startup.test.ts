/**
 * @vitest-environment jsdom
 */
import "../../tests/vitest/shims/nodeWebStorage";
import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the DOM elements and utilities that main-ui.js depends on
vi.mock("../utils/theming/core/theme.js", () => ({
    applyTheme: vi.fn(),
    listenForThemeChange: vi.fn(),
    loadTheme: vi.fn(() => "dark"),
}));

vi.mock("../utils/rendering/core/showFitData.js", () => ({
    showFitData: vi.fn(),
}));

vi.mock("../utils/formatting/converters/convertArrayBufferToBase64.js", () => ({
    convertArrayBufferToBase64: vi.fn(),
}));

vi.mock("../utils/ui/controls/addFullScreenButton.js", () => ({
    setupDOMContentLoaded: vi.fn(),
    setupFullscreenListeners: vi.fn(),
}));

vi.mock("../utils/app/initialization/setupWindow.js", () => ({
    setupWindow: vi.fn(),
}));

vi.mock("../utils/app/lifecycle/resourceManager.js", () => ({
    resourceManager: {
        addShutdownHook: vi.fn(),
        cleanupAll: vi.fn(),
        registerTimer: vi.fn(),
    },
}));

vi.mock("../utils/charts/core/renderChartJS.js", () => ({
    renderChartJS: vi.fn(),
}));

vi.mock("../utils/state/core/stateManager.js", () => ({
    getState: vi.fn(),
    setState: vi.fn(),
}));

vi.mock("../utils/state/domain/uiStateManager.js", () => ({
    UIActions: {
        TOGGLE_TAB: "UI_TOGGLE_TAB",
        SET_ACTIVE_TAB: "UI_SET_ACTIVE_TAB",
        SHOW_LOADING: "UI_SHOW_LOADING",
        HIDE_LOADING: "UI_HIDE_LOADING",
    },
}));

vi.mock("../utils/app/lifecycle/appActions.js", () => ({
    AppActions: {
        APP_INITIALIZED: "APP_INITIALIZED",
        APP_ERROR: "APP_ERROR",
        APP_READY: "APP_READY",
        clearData: vi.fn(),
    },
}));

vi.mock("../utils/state/domain/fitFileState.js", () => ({
    fitFileStateManager: {
        updateLoadingProgress: vi.fn(),
        updateError: vi.fn(),
        updateFitData: vi.fn(),
    },
}));

vi.mock("../utils/debug/stateDevTools.js", () => ({
    performanceMonitor: {
        mark: vi.fn(),
        measure: vi.fn(),
    },
}));

vi.mock("../utils/ui/notifications/showNotification.js", () => ({
    showNotification: vi.fn(),
}));

vi.mock("../utils/charts/core/chartTabIntegration.js", () => ({
    chartTabIntegration: {
        destroy: vi.fn(),
        getStatus: vi.fn(() => ({ initialized: true })),
        initialize: vi.fn(),
        updateCharts: vi.fn(),
    },
}));

vi.mock("../utils/ui/dragDropHandler.js", () => ({
    DragDropHandler: vi.fn(function MockDragDropHandler() {
        return { dispose: vi.fn() };
    }),
}));

vi.mock("../utils/ui/setupExternalLinkHandlers.js", () => ({
    setupExternalLinkHandlers: vi.fn(),
}));

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

type MainUiTestGlobal = typeof globalThis & {
    electronAPI?: {
        onIpc: ReturnType<typeof vi.fn>;
        onSetTheme: ReturnType<typeof vi.fn>;
        sendThemeChanged: ReturnType<typeof vi.fn>;
    };
};

describe("main-ui.js - UI Controller and State Management", () => {
    beforeEach(() => {
        setupMainUiDom();
        vi.clearAllMocks();
        vi.resetModules();
        Reflect.deleteProperty(globalThis, "dragDropHandler");
        Reflect.deleteProperty(globalThis, "electronAPI");
        Reflect.deleteProperty(globalThis, "showFitData");
        Reflect.deleteProperty(globalThis, "renderChartJS");
        Reflect.deleteProperty(globalThis, "cleanupEventListeners");
    });

    it("registers legacy globals and rejects invalid legacy FIT data", async () => {
        await import("../main-ui.js");
        const { renderChartJS } =
            await import("../utils/charts/core/renderChartJS.js");
        const { showFitData } =
            await import("../utils/rendering/core/showFitData.js");
        const renderChartJSMock = vi.mocked(renderChartJS);
        const showFitDataMock = vi.mocked(showFitData);

        expect(globalThis.showFitData).toBeInstanceOf(Function);
        expect(globalThis.renderChartJS).toBeInstanceOf(Function);
        expect(globalThis.cleanupEventListeners).toBeInstanceOf(Function);
        expect(document.querySelectorAll(".tab-button")).toHaveLength(3);

        (globalThis.showFitData as (fitData: unknown) => void)(null);
        expect(showFitDataMock).not.toHaveBeenCalled();

        const fitData = { records: [] };
        (
            globalThis.showFitData as (
                fitData: unknown,
                filePath: string
            ) => void
        )(fitData, "activity.fit");
        expect(showFitDataMock).toHaveBeenCalledWith(fitData, "activity.fit");

        const targetContainer = createElement("div", { id: "chart-target" });
        (globalThis.renderChartJS as (target: HTMLElement) => void)(
            targetContainer
        );
        expect(renderChartJSMock).toHaveBeenCalledWith(targetContainer);
    });

    it("initializes UI side effects when loaded", async () => {
        const onIpc = vi.fn();
        const onSetTheme = vi.fn();
        const sendThemeChanged = vi.fn();
        (globalThis as MainUiTestGlobal).electronAPI = {
            onIpc,
            onSetTheme,
            sendThemeChanged,
        };

        await import("../main-ui.js");
        const { setupWindow } =
            await import("../utils/app/initialization/setupWindow.js");
        const { AppActions } =
            await import("../utils/app/lifecycle/appActions.js");
        const { resourceManager } =
            await import("../utils/app/lifecycle/resourceManager.js");
        const { chartTabIntegration } =
            await import("../utils/charts/core/chartTabIntegration.js");
        const { applyTheme, listenForThemeChange, loadTheme } =
            await import("../utils/theming/core/theme.js");
        const { setupFullscreenListeners } =
            await import("../utils/ui/controls/addFullScreenButton.js");
        const { DragDropHandler } =
            await import("../utils/ui/dragDropHandler.js");
        const { setupExternalLinkHandlers } =
            await import("../utils/ui/setupExternalLinkHandlers.js");
        const applyThemeMock = vi.mocked(applyTheme);
        const dragDropHandlerMock = vi.mocked(DragDropHandler);
        const listenForThemeChangeMock = vi.mocked(listenForThemeChange);
        const loadThemeMock = vi.mocked(loadTheme);
        const resourceManagerMock = vi.mocked(resourceManager);
        const appActionsMock = vi.mocked(AppActions);
        const setupExternalLinkHandlersMock = vi.mocked(
            setupExternalLinkHandlers
        );
        const setupFullscreenListenersMock = vi.mocked(
            setupFullscreenListeners
        );
        const setupWindowMock = vi.mocked(setupWindow);

        expect(loadThemeMock).toHaveBeenCalledOnce();
        expect(applyThemeMock).toHaveBeenCalledWith("dark");
        expect(listenForThemeChangeMock).toHaveBeenCalledOnce();
        expect(setupFullscreenListenersMock).toHaveBeenCalledOnce();
        expect(setupWindowMock).toHaveBeenCalledOnce();
        expect(setupExternalLinkHandlersMock).toHaveBeenCalledOnce();
        const [externalLinkOptions] =
            setupExternalLinkHandlersMock.mock.calls[0] ?? [];
        expect(externalLinkOptions).toMatchObject({
            cleanupExternalLinkHandlers: null,
        });
        expect(externalLinkOptions?.setCleanup).toBeInstanceOf(Function);

        expect(resourceManagerMock.addShutdownHook).toHaveBeenCalledOnce();
        const [shutdownHook] =
            resourceManagerMock.addShutdownHook.mock.calls[0] ?? [];
        expect(shutdownHook).toBeInstanceOf(Function);

        const cleanupExternalLinks = vi.fn();
        externalLinkOptions?.setCleanup(cleanupExternalLinks);
        shutdownHook?.();
        expect(cleanupExternalLinks).toHaveBeenCalledOnce();
        expect(appActionsMock.clearData).toHaveBeenCalledOnce();

        expect(dragDropHandlerMock).toHaveBeenCalledOnce();
        const dragDropInstance = dragDropHandlerMock.mock.results[0]?.value;
        expect(globalThis.dragDropHandler).toBe(dragDropInstance);
        expect(dragDropInstance.dispose).toBeInstanceOf(Function);
        expect(onIpc).toHaveBeenCalledWith(
            "unload-fit-file",
            expect.any(Function)
        );
        expect(chartTabIntegration.getStatus).toHaveBeenCalledOnce();
    });
});
