/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock heavy dependencies that main-ui imports to keep import side-effects safe in tests
vi.mock("../../utils/theming/core/theme.js", () => ({
    applyTheme: vi.fn(),
    listenForThemeChange: vi.fn(),
    loadTheme: vi.fn().mockReturnValue("light"),
}));

vi.mock("../../utils/rendering/core/showFitData.js", () => ({
    showFitData: vi.fn(),
}));

vi.mock(
    "../../utils/formatting/converters/convertArrayBufferToBase64.js",
    () => ({
        convertArrayBufferToBase64: vi.fn().mockReturnValue(""),
    })
);

vi.mock("../../utils/ui/controls/addFullScreenButton.js", () => ({
    setupDOMContentLoaded: vi.fn(),
    setupFullscreenListeners: vi.fn(),
}));

vi.mock("../../utils/app/initialization/setupWindow.js", () => ({
    setupWindow: vi.fn(),
}));

vi.mock("../../utils/charts/core/renderChartJS.js", () => ({
    renderChartJS: vi.fn(),
}));

vi.mock("../../utils/state/core/stateManager.js", () => ({
    getState: vi.fn().mockReturnValue(undefined),
    setState: vi.fn(),
}));

vi.mock("../../utils/state/domain/uiStateManager.js", () => ({
    UIActions: {
        showTab: vi.fn(),
        setTheme: vi.fn(),
    },
}));

vi.mock("../../utils/app/lifecycle/appActions.js", () => ({
    AppActions: {
        clearData: vi.fn(),
        setFileOpening: vi.fn(),
    },
}));

vi.mock("../../utils/state/domain/fitFileState.js", () => ({
    fitFileStateManager: {
        startFileLoading: vi.fn(),
        handleFileLoaded: vi.fn(),
        handleFileLoadingError: vi.fn(),
    },
}));

vi.mock("../../utils/debug/stateDevTools.js", () => ({
    performanceMonitor: {
        isEnabled: () => false,
        startTimer: vi.fn(),
        endTimer: vi.fn(),
    },
}));

vi.mock("../../utils/ui/notifications/showNotification.js", () => ({
    showNotification: vi.fn(),
}));

vi.mock("../../utils/charts/core/chartTabIntegration.js", () => ({
    chartTabIntegration: {
        getStatus: vi.fn().mockReturnValue("ok"),
        destroy: vi.fn(),
    },
}));

describe("main-ui.js import smoke", () => {
    beforeEach(() => {
        // Minimal DOM required by main-ui constants/selectors
        document.body.innerHTML = `
      <div id="${"drop-overlay"}"></div>
      <div id="${"activeFileName"}"></div>
      <div id="${"activeFileNameContainer"}"></div>
      <button id="${"unloadFileBtn"}"></button>
      <div id="${"tab-chart"}"></div>
      <div id="${"tab-summary"}"></div>
      <div id="${"content-map"}"></div>
      <div id="${"content-data"}"></div>
      <div id="${"content-chart"}"></div>
      <div id="${"content-summary"}"></div>
    `;

        // Provide a minimal electronAPI stub used by main-ui
        // @ts-ignore
        globalThis.window = globalThis.window || ({} as any);
        // @ts-ignore
        window.electronAPI = {
            onIpc: vi.fn(),
            send: vi.fn(),
            openExternal: vi.fn().mockResolvedValue(true),
        } as any;
    });

    it("imports without throwing and defines legacy globals", async () => {
        const mod = await import("../../main-ui.js");
        expect(mod).toBeDefined();
        // Legacy globals exposed by main-ui
        // @ts-ignore
        expect(typeof window.showFitData).toBe("function");
        // @ts-ignore
        expect(typeof window.renderChartJS).toBe("function");
        // @ts-ignore
        expect(typeof window.cleanupEventListeners).toBe("function");
    });
});
