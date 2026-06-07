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
        setState:
            vi.fn<(path: string, value: unknown, options?: unknown) => void>(),
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

const rendererDependencyMocks = vi.hoisted(() => ({
    createTables: vi.fn<(data: Record<string, unknown>) => void>(),
    renderMap: vi.fn<() => void>(),
    renderSummary: vi.fn<(data: Record<string, unknown>) => void>(),
    setTabButtonsEnabled: vi.fn<(enabled: boolean) => void>(),
    updateActiveTab: vi.fn<(tabId: string) => void>(),
    updateTabVisibility: vi.fn<(contentId: string) => void>(),
}));

vi.mock(
    import("../../../../../electron-app/utils/maps/core/renderMap.js"),
    () => ({
        renderMap: rendererDependencyMocks.renderMap,
    })
);

vi.mock(
    import("../../../../../electron-app/utils/rendering/components/createTables.js"),
    () => ({
        createTables: rendererDependencyMocks.createTables,
    })
);

vi.mock(
    import("../../../../../electron-app/utils/rendering/core/renderSummary.js"),
    () => ({
        renderSummary: rendererDependencyMocks.renderSummary,
    })
);

vi.mock(
    import("../../../../../electron-app/utils/ui/controls/enableTabButtons.js"),
    () => ({
        setTabButtonsEnabled: rendererDependencyMocks.setTabButtonsEnabled,
    })
);

vi.mock(
    import("../../../../../electron-app/utils/ui/tabs/updateActiveTab.js"),
    () => ({
        updateActiveTab: rendererDependencyMocks.updateActiveTab,
    })
);

vi.mock(
    import("../../../../../electron-app/utils/ui/tabs/updateTabVisibility.js"),
    () => ({
        updateTabVisibility: rendererDependencyMocks.updateTabVisibility,
    })
);

import { setState } from "../../../../../electron-app/utils/state/core/stateManager.js";

type ShowFitDataTestGlobal = typeof globalThis & {
    electronAPI?: {
        notifyFitFileLoaded: Mock<(filePath: string) => void>;
    };
    globalData?: Record<string, unknown>;
    isMapRendered?: boolean;
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
        rendererDependencyMocks.createTables.mockClear();
        rendererDependencyMocks.renderMap.mockClear();
        rendererDependencyMocks.renderSummary.mockClear();
        rendererDependencyMocks.setTabButtonsEnabled.mockClear();
        rendererDependencyMocks.updateActiveTab.mockClear();
        rendererDependencyMocks.updateTabVisibility.mockClear();
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
        vi.clearAllMocks();
    });

    it("updates UI, state, dispatches events, and triggers map render", async () => {
        expect.assertions(9);

        const { showFitData } = await loadModule();
        const data: Record<string, unknown> = {};
        const filePath = "C:/tmp/file.fit";
        showFitData(data, filePath);
        const showFitGlobal = getShowFitDataTestGlobal();

        expect(setState).toHaveBeenCalledWith("globalData", data, {
            source: "showFitData",
        });
        expect(data).toMatchObject({
            cachedFileName: "file.fit",
            cachedFilePath: filePath,
        });
        expect(
            rendererDependencyMocks.setTabButtonsEnabled
        ).toHaveBeenCalledWith(true);

        expect(rendererDependencyMocks.updateTabVisibility).toHaveBeenCalledWith(
            "content_map"
        );
        expect(rendererDependencyMocks.updateActiveTab).toHaveBeenCalledWith(
            "tab_map"
        );
        expect(rendererDependencyMocks.renderMap).toHaveBeenCalledWith();

        // Should have called createTables and renderSummary
        expect(rendererDependencyMocks.createTables).toHaveBeenCalledWith(data);
        expect(rendererDependencyMocks.renderSummary).toHaveBeenCalledWith(
            data
        );

        // IPC send
        expect(
            showFitGlobal.electronAPI?.notifyFitFileLoaded
        ).toHaveBeenCalledWith(filePath);
    });

    it("does not render the map again when it is already rendered", async () => {
        expect.assertions(4);

        const { showFitData } = await loadModule();
        const data: Record<string, unknown> = {};
        const filePath = "C:/tmp/file.fit";
        const showFitGlobal = getShowFitDataTestGlobal();
        showFitGlobal.isMapRendered = true;

        showFitData(data, filePath);

        expect(rendererDependencyMocks.updateTabVisibility).toHaveBeenCalledWith(
            "content_map"
        );
        expect(rendererDependencyMocks.updateActiveTab).toHaveBeenCalledWith(
            "tab_map"
        );
        expect(showFitGlobal.isMapRendered).toBe(true);
        expect(rendererDependencyMocks.renderMap).not.toHaveBeenCalled();
    });

    it("throws on invalid data and writes error state", async () => {
        expect.assertions(1);

        const { showFitData } = await loadModule();
        expect(() =>
            showFitData(null as unknown as Record<string, unknown>, undefined)
        ).toThrow("Invalid data: expected object");
    });
});
