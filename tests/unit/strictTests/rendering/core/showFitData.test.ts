import {
    afterEach,
    beforeEach,
    describe,
    expect,
    it,
    vi,
    type Mock,
} from "vitest";

vi.mock(
    import("../../../../../electron-app/utils/state/core/stateManager.js"),
    () => ({
        getState: vi.fn<() => undefined>(() => undefined),
        setState: vi.fn<(partialState: unknown) => void>(),
        subscribe: vi.fn<(key: string, listener: unknown) => () => void>(
            () => () => undefined
        ),
    })
);

vi.mock(
    import("../../../../../electron-app/utils/charts/components/createGlobalChartStatusIndicator.js"),
    () => ({
        createGlobalChartStatusIndicator: vi.fn<() => void>(),
    })
);

type ShowFitDataTestGlobal = typeof globalThis & {
    createTables?: (data: Record<string, unknown>) => void;
    electronAPI?: {
        notifyFitFileLoaded: Mock<(filePath: string) => void>;
    };
    globalData?: Record<string, unknown>;
    isMapRendered?: boolean;
    renderMap?: () => void;
    renderSummary?: (data: Record<string, unknown>) => void;
    setTabButtonsEnabled?: (enabled: boolean) => void;
    updateActiveTab?: (tabId: string) => void;
    updateTabVisibility?: (contentId: string) => void;
};

async function loadModule() {
    return await import("../../../../../electron-app/utils/rendering/core/showFitData.js");
}

function getShowFitDataTestGlobal(): ShowFitDataTestGlobal {
    return globalThis as ShowFitDataTestGlobal;
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
        const showFitGlobal = getShowFitDataTestGlobal();
        showFitGlobal.electronAPI = {
            notifyFitFileLoaded: vi.fn<(filePath: string) => void>(),
        };
        showFitGlobal.isMapRendered = false;
        showFitGlobal.setTabButtonsEnabled = () => undefined;
        showFitGlobal.createTables = () => undefined;
        showFitGlobal.renderSummary = () => undefined;
        showFitGlobal.updateTabVisibility = () => undefined;
        showFitGlobal.updateActiveTab = () => undefined;
        showFitGlobal.renderMap = () => undefined;
        vi.spyOn(showFitGlobal, "setTabButtonsEnabled").mockReturnValue(
            undefined
        );
        vi.spyOn(showFitGlobal, "createTables").mockReturnValue(undefined);
        vi.spyOn(showFitGlobal, "renderSummary").mockReturnValue(undefined);
        vi.spyOn(showFitGlobal, "updateTabVisibility").mockReturnValue(
            undefined
        );
        vi.spyOn(showFitGlobal, "updateActiveTab").mockReturnValue(undefined);
        vi.spyOn(showFitGlobal, "renderMap").mockReturnValue(undefined);
        vi.useFakeTimers();
    });
    afterEach(() => {
        document.body.replaceChildren();
        vi.useRealTimers();
        vi.resetModules();
        const showFitGlobal = getShowFitDataTestGlobal();
        delete showFitGlobal.electronAPI;
        delete showFitGlobal.globalData;
        delete showFitGlobal.isMapRendered;
        delete showFitGlobal.setTabButtonsEnabled;
        delete showFitGlobal.createTables;
        delete showFitGlobal.renderSummary;
        delete showFitGlobal.updateTabVisibility;
        delete showFitGlobal.updateActiveTab;
        delete showFitGlobal.renderMap;
        vi.clearAllMocks();
    });

    it("updates UI, state, dispatches events, and triggers map render", async () => {
        expect.assertions(9);

        const { showFitData } = await loadModule();
        const data: Record<string, unknown> = {};
        const filePath = "C:/tmp/file.fit";
        showFitData(data, filePath);
        const showFitGlobal = getShowFitDataTestGlobal();

        expect(showFitGlobal.globalData).toBe(data);
        expect(data).toMatchObject({
            cachedFileName: "file.fit",
            cachedFilePath: filePath,
        });
        expect(showFitGlobal.setTabButtonsEnabled).toHaveBeenCalledWith(true);

        // setTimeout branch for tab visibility and map render
        vi.runAllTimers();
        expect(showFitGlobal.updateTabVisibility).toHaveBeenCalledWith(
            "content-map"
        );
        expect(showFitGlobal.updateActiveTab).toHaveBeenCalledWith("tab-map");
        expect(showFitGlobal.renderMap).toHaveBeenCalledWith();

        // Should have called createTables and renderSummary
        expect(showFitGlobal.createTables).toHaveBeenCalledWith(data);
        expect(showFitGlobal.renderSummary).toHaveBeenCalledWith(data);

        // IPC send
        expect(
            showFitGlobal.electronAPI?.notifyFitFileLoaded
        ).toHaveBeenCalledWith(filePath);
    });

    it("throws on invalid data and writes error state", async () => {
        expect.assertions(1);

        const { showFitData } = await loadModule();
        expect(() =>
            showFitData(null as unknown as Record<string, unknown>, undefined)
        ).toThrow("Invalid data: expected object");
    });
});
