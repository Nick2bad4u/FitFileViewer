import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const stateManagerMocks = vi.hoisted(() => ({
    getState: vi.fn<(path?: string) => unknown>(() => undefined),
    setState:
        vi.fn<(path: string, value: unknown, options?: unknown) => void>(),
    subscribe: vi.fn<(key: string, listener: unknown) => () => void>(
        () => () => undefined
    ),
}));

vi.mock(
    import("../../../../../electron-app/utils/state/core/stateManager.js"),
    () => ({
        getState: stateManagerMocks.getState,
        setState: stateManagerMocks.setState,
        subscribe: stateManagerMocks.subscribe,
    })
);

vi.mock(
    import("../../../../../electron-app/utils/charts/components/createGlobalChartStatusIndicator.js"),
    () => ({
        createGlobalChartStatusIndicator: vi.fn<() => void>(),
    })
);

const rendererDependencyMocks = vi.hoisted(() => ({
    createTables: vi.fn<(data: unknown) => void>(),
    renderMap: vi.fn<() => void>(),
    renderSummary: vi.fn<(data: Record<string, unknown>) => void>(),
    setTabButtonsEnabled: vi.fn<(enabled: boolean) => void>(),
    updateActiveTab: vi.fn<(tabId: string) => void>(),
    updateTabVisibility: vi.fn<(contentId: string) => void>(),
    ensureRendererVendorBundle: vi.fn<() => Promise<void>>(),
    waitForMapLeafletRuntime: vi.fn<() => Promise<boolean>>(),
}));

vi.mock(
    import("../../../../../electron-app/utils/maps/core/renderMap.js"),
    () => ({
        renderMap: rendererDependencyMocks.renderMap,
        waitForMapLeafletRuntime:
            rendererDependencyMocks.waitForMapLeafletRuntime,
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

vi.mock(
    import("../../../../../electron-app/renderer/vendorBundleLoader.js"),
    () => ({
        ensureRendererVendorBundle:
            rendererDependencyMocks.ensureRendererVendorBundle,
    })
);

type ShowFitDataElectronApi = {
    notifyFitFileLoaded: ReturnType<typeof vi.fn<(filePath: string) => void>>;
};

async function loadModule() {
    return await import("../../../../../electron-app/utils/rendering/core/showFitData.js");
}

async function registerShowFitDataApi(
    api: ShowFitDataElectronApi
): Promise<void> {
    const { registerRendererElectronApiCandidate } =
        await import("../../../../../electron-app/utils/runtime/electronApiRuntime.js");
    registerRendererElectronApiCandidate(api);
}

async function resetRegisteredElectronApi(): Promise<void> {
    const { resetRendererElectronApiCandidate } =
        await import("../../../../../electron-app/utils/runtime/electronApiRuntime.js");
    resetRendererElectronApiCandidate();
}

describe("showFitData", () => {
    let showFitDataElectronApi: ShowFitDataElectronApi;

    beforeEach(async () => {
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
        showFitDataElectronApi = {
            notifyFitFileLoaded: vi.fn<(filePath: string) => void>(),
        };
        await registerShowFitDataApi(showFitDataElectronApi);
        stateManagerMocks.getState.mockReturnValue(undefined);
        stateManagerMocks.setState.mockClear();
        stateManagerMocks.subscribe.mockClear();
        rendererDependencyMocks.createTables.mockClear();
        rendererDependencyMocks.renderMap.mockClear();
        rendererDependencyMocks.renderSummary.mockClear();
        rendererDependencyMocks.setTabButtonsEnabled.mockClear();
        rendererDependencyMocks.updateActiveTab.mockClear();
        rendererDependencyMocks.updateTabVisibility.mockClear();
        rendererDependencyMocks.ensureRendererVendorBundle.mockResolvedValue(
            undefined
        );
        rendererDependencyMocks.waitForMapLeafletRuntime.mockResolvedValue(
            true
        );
        vi.useFakeTimers();
    });
    afterEach(async () => {
        document.body.replaceChildren();
        vi.useRealTimers();
        await resetRegisteredElectronApi();
        vi.resetModules();
        vi.clearAllMocks();
    });

    it("updates UI, state, dispatches events, and triggers map render", async () => {
        expect.assertions(8);

        const { showFitData } = await loadModule();
        const data: Record<string, unknown> = {
            invalidTable: [null],
            recordMesgs: [{ timestamp: 1 }],
        };
        const filePath = "C:/tmp/file.fit";
        showFitData(data, filePath);
        await vi.waitFor(() => {
            if (rendererDependencyMocks.renderMap.mock.calls.length === 0) {
                throw new Error("Expected map render");
            }
        });

        expect(data).toMatchObject({
            cachedFileName: "file.fit",
            cachedFilePath: filePath,
        });
        expect(
            rendererDependencyMocks.setTabButtonsEnabled
        ).toHaveBeenCalledWith(true);

        expect(
            rendererDependencyMocks.updateTabVisibility
        ).toHaveBeenCalledWith("content_map");
        expect(rendererDependencyMocks.updateActiveTab).toHaveBeenCalledWith(
            "tab_map"
        );
        expect(rendererDependencyMocks.renderMap).toHaveBeenCalledWith();
        // Should have called createTables and renderSummary
        expect(rendererDependencyMocks.createTables).toHaveBeenCalledWith([
            {
                key: "recordMesgs",
                rows: data.recordMesgs,
            },
        ]);
        expect(rendererDependencyMocks.renderSummary).toHaveBeenCalledWith(
            data
        );

        // IPC send
        expect(showFitDataElectronApi.notifyFitFileLoaded).toHaveBeenCalledWith(
            filePath
        );
    });

    it("does not render the map again when it is already rendered", async () => {
        expect.assertions(5);

        const { showFitData } = await loadModule();
        const data: Record<string, unknown> = {};
        const filePath = "C:/tmp/file.fit";
        stateManagerMocks.getState.mockImplementation((path?: string) =>
            path === "map.isRendered" ? true : undefined
        );

        showFitData(data, filePath);

        expect(
            rendererDependencyMocks.updateTabVisibility
        ).toHaveBeenCalledWith("content_map");
        expect(rendererDependencyMocks.updateActiveTab).toHaveBeenCalledWith(
            "tab_map"
        );
        expect(data).toMatchObject({
            cachedFileName: "file.fit",
            cachedFilePath: filePath,
        });
        expect(stateManagerMocks.getState).toHaveBeenCalledWith(
            "map.isRendered"
        );
        expect(rendererDependencyMocks.renderMap).not.toHaveBeenCalled();
    });

    it("marks the map rendered without rerendering when the map container already exists", async () => {
        expect.assertions(5);

        const { showFitData } = await loadModule();
        const data: Record<string, unknown> = {};
        const filePath = "C:/tmp/file.fit";
        const mapContainer = document.createElement("div");
        mapContainer.id = "leaflet-map";
        document.body.append(mapContainer);

        showFitData(data, filePath);

        await vi.waitFor(() => {
            const renderedStateCall =
                stateManagerMocks.setState.mock.calls.find(
                    ([path, value]) =>
                        path === "map.isRendered" && value === true
                );
            if (!renderedStateCall) {
                throw new Error("Expected map render state update");
            }
        });

        expect(
            rendererDependencyMocks.ensureRendererVendorBundle
        ).toHaveBeenCalledWith("map");
        expect(
            rendererDependencyMocks.waitForMapLeafletRuntime
        ).toHaveBeenCalledWith();
        expect(data).toMatchObject({
            cachedFileName: "file.fit",
            cachedFilePath: filePath,
        });
        expect(stateManagerMocks.setState).toHaveBeenCalledWith(
            "map.isRendered",
            true,
            expect.objectContaining({
                source: "showFitData.renderMapIfReady",
            })
        );
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
