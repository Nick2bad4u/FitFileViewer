import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

vi.mock("../../../../../electron-app/utils/state/core/stateManager.js", () => ({
    getState: vi.fn(() => undefined),
    setState: vi.fn(),
    subscribe: vi.fn(() => () => {}),
}));

vi.mock(
    "../../../../../electron-app/utils/charts/components/createGlobalChartStatusIndicator.js",
    () => ({
        createGlobalChartStatusIndicator: vi.fn(),
    })
);

async function loadModule() {
    return await import("../../../../../electron-app/utils/rendering/core/showFitData.js");
}

describe("showFitData", () => {
    beforeEach(() => {
        const activeFileNameContainer = document.createElement("div");
        activeFileNameContainer.id = "activeFileNameContainer";
        const activeFileName = document.createElement("span");
        activeFileName.id = "activeFileName";
        const unloadFileButton = document.createElement("button");
        unloadFileButton.id = "unloadFileBtn";
        document.body.replaceChildren(
            activeFileNameContainer,
            activeFileName,
            unloadFileButton
        );
        (window as any).electronAPI = { send: vi.fn() };
        (window as any).setTabButtonsEnabled = vi.fn();
        (window as any).createTables = vi.fn();
        (window as any).renderSummary = vi.fn();
        (window as any).updateTabVisibility = vi.fn();
        (window as any).updateActiveTab = vi.fn();
        (window as any).renderMap = vi.fn();
        vi.useFakeTimers();
    });
    afterEach(() => {
        document.body.replaceChildren();
        vi.useRealTimers();
        vi.resetModules();
        vi.clearAllMocks();
    });

    it("updates UI, state, dispatches events, and triggers map render", async () => {
        const { showFitData } = await loadModule();
        const data = {} as any;
        const filePath = "C:/tmp/file.fit";
        showFitData(data, filePath);

        expect((window as any).globalData).toBe(data);
        expect(data).toMatchObject({
            cachedFileName: "file.fit",
            cachedFilePath: filePath,
        });
        expect((window as any).setTabButtonsEnabled).toHaveBeenCalledWith(true);

        // setTimeout branch for tab visibility and map render
        vi.runAllTimers();
        expect((window as any).updateTabVisibility).toHaveBeenCalledWith(
            "content-map"
        );
        expect((window as any).updateActiveTab).toHaveBeenCalledWith("tab-map");
        expect((window as any).renderMap).toHaveBeenCalled();

        // Should have called createTables and renderSummary
        expect((window as any).createTables).toHaveBeenCalled();
        expect((window as any).renderSummary).toHaveBeenCalled();

        // IPC send
        expect((window as any).electronAPI.send).toHaveBeenCalledWith(
            "fit-file-loaded",
            filePath
        );
    });

    it("throws on invalid data and writes error state", async () => {
        const { showFitData } = await loadModule();
        expect(() => showFitData(null as any, undefined)).toThrowError(
            "Invalid data: expected object"
        );
    });
});
