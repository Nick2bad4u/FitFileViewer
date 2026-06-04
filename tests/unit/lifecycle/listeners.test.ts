// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Mock } from "vitest";
import type { ElectronAPI } from "../../../electron-app/shared/preloadApi.js";
import type {
    FileOpeningStateRef,
    SetupListenersOptions,
} from "../../../electron-app/utils/app/lifecycle/listeners.js";

const openFileSelectorMock = vi.hoisted(() => vi.fn<() => void>());

vi.mock(
    import("../../../electron-app/utils/files/import/openFileSelector.js"),
    () => ({
        openFileSelector: openFileSelectorMock,
    })
);

import { setupListeners } from "../../../electron-app/utils/app/lifecycle/listeners.js";

type TestElectronAPI = {
    addRecentFile: Mock<ElectronAPI["addRecentFile"]>;
    checkForUpdates: Mock<ElectronAPI["checkForUpdates"]>;
    onIpc: Mock<ElectronAPI["onIpc"]>;
    onMenuOpenFile: Mock<ElectronAPI["onMenuOpenFile"]>;
    onMenuOpenOverlay: Mock<ElectronAPI["onMenuOpenOverlay"]>;
    onOpenRecentFile: Mock<ElectronAPI["onOpenRecentFile"]>;
    parseFitFile: Mock<ElectronAPI["parseFitFile"]>;
    readFile: Mock<ElectronAPI["readFile"]>;
    recentFiles: Mock<() => Promise<null | string[]>>;
};

type TestGlobal = typeof globalThis & {
    ChartUpdater?: {
        updateCharts: Mock<(reason: string) => void>;
    };
    __ffvMenuForwardRegistry?: unknown;
    electronAPI?: TestElectronAPI;
    renderChartJS?: unknown;
    showFitData?: unknown;
};

function getTestGlobal(): TestGlobal {
    return globalThis as TestGlobal;
}

function getTestWindow(): Window & TestGlobal {
    return window as Window & TestGlobal;
}

function getMenuOpenOverlayHandler(
    electronAPI: TestElectronAPI
): Parameters<ElectronAPI["onMenuOpenOverlay"]>[0] {
    const entry = electronAPI.onMenuOpenOverlay.mock.calls[0];
    if (!entry) {
        throw new TypeError("Expected menu-open-overlay registration");
    }

    const handler = entry[0];
    if (typeof handler !== "function") {
        throw new TypeError("Expected menu-open-overlay handler");
    }

    return handler;
}

describe("utils/app/lifecycle/listeners.js", () => {
    beforeEach(() => {
        const openFileButton = document.createElement("button");
        openFileButton.id = "openFileBtn";
        openFileButton.textContent = "Open";
        const contentSummary = document.createElement("div");
        contentSummary.id = "content-summary";
        document.body.replaceChildren(openFileButton, contentSummary);
        openFileSelectorMock.mockReset();
        openFileSelectorMock.mockImplementation(() => {});
        // Clean any previous window properties
        Object.assign(getTestWindow(), {
            electronAPI: undefined,
            showFitData: undefined,
            ChartUpdater: undefined,
            renderChartJS: undefined,
        });
        Object.assign(getTestGlobal(), {
            __ffvMenuForwardRegistry: undefined,
            electronAPI: undefined,
            showFitData: undefined,
            ChartUpdater: undefined,
            renderChartJS: undefined,
        });
    });

    function mount(openRecentReturn: string[] | null = null): {
        electronAPI: TestElectronAPI;
        handleOpenFile: Mock<SetupListenersOptions["handleOpenFile"]>;
        isOpeningFileRef: FileOpeningStateRef;
        openFileBtn: HTMLButtonElement;
        setLoading: Mock<SetupListenersOptions["setLoading"]>;
        showNotification: Mock<SetupListenersOptions["showNotification"]>;
    } {
        const openFileBtn = document.getElementById(
            "openFileBtn"
        ) as HTMLButtonElement;
        const isOpeningFileRef: FileOpeningStateRef = { current: false };
        const setLoading = vi.fn<SetupListenersOptions["setLoading"]>();
        const showNotification = vi
            .fn<SetupListenersOptions["showNotification"]>()
            .mockImplementation((message, type) => {
                document.body.dataset.lastNotification = `${type}:${message}`;
            });
        const handleOpenFile = vi
            .fn<SetupListenersOptions["handleOpenFile"]>()
            .mockImplementation(({ isOpeningFileRef: ref }) => {
                ref.current = true;
                openFileBtn.dataset.opened = "true";
            });
        const showUpdateNotification =
            vi.fn<SetupListenersOptions["showUpdateNotification"]>();
        const showAboutModal = vi.fn<SetupListenersOptions["showAboutModal"]>();

        const electronAPI: TestElectronAPI = {
            checkForUpdates: vi.fn<ElectronAPI["checkForUpdates"]>(),
            recentFiles: vi
                .fn<() => Promise<null | string[]>>()
                .mockResolvedValue(openRecentReturn),
            onMenuOpenFile: vi.fn<ElectronAPI["onMenuOpenFile"]>(),
            onMenuOpenOverlay: vi.fn<ElectronAPI["onMenuOpenOverlay"]>(),
            onOpenRecentFile: vi.fn<ElectronAPI["onOpenRecentFile"]>(),
            readFile: vi.fn<ElectronAPI["readFile"]>(),
            parseFitFile: vi.fn<ElectronAPI["parseFitFile"]>(),
            addRecentFile: vi.fn<ElectronAPI["addRecentFile"]>(),
            onIpc: vi.fn<ElectronAPI["onIpc"]>(),
        };
        Object.assign(getTestWindow(), { electronAPI });
        Object.assign(getTestGlobal(), { electronAPI });

        setupListeners({
            openFileBtn,
            isOpeningFileRef,
            setLoading,
            showNotification,
            handleOpenFile,
            showUpdateNotification,
            showAboutModal,
        });

        return {
            electronAPI,
            openFileBtn,
            isOpeningFileRef,
            setLoading,
            showNotification,
            handleOpenFile,
        };
    }

    it("clicking openFileBtn calls handleOpenFile with expected args", () => {
        expect.assertions(2);

        const {
            openFileBtn,
            handleOpenFile,
            isOpeningFileRef,
            setLoading,
            showNotification,
        } = mount([]);
        openFileBtn.click();
        expect(handleOpenFile).toHaveBeenCalledExactlyOnceWith({
            isOpeningFileRef,
            openFileBtn,
            setLoading,
            showNotification,
        });
        expect({
            isOpeningFile: isOpeningFileRef.current,
            openedDatasetValue: openFileBtn.dataset.opened,
        }).toStrictEqual({
            isOpeningFile: true,
            openedDatasetValue: "true",
        });
    });

    it("contextmenu with no electronAPI.recentFiles early-returns and shows info", async () => {
        expect.assertions(1);

        const { openFileBtn } = mount(null);
        // Remove electronAPI to simulate missing API
        delete getTestWindow().electronAPI;
        const evt = new MouseEvent("contextmenu", {
            bubbles: true,
            cancelable: true,
            clientX: 10,
            clientY: 10,
        });
        openFileBtn.dispatchEvent(evt);
        expect(document.getElementById("recent-files-menu")).toBeNull();
    });

    it("resize while chart tab active triggers ChartUpdater.updateCharts if available", async () => {
        expect.assertions(2);

        // create active chart tab
        const tab = document.createElement("div");
        tab.id = "tab-chart";
        tab.classList.add("active");
        document.body.append(tab);
        const updateCharts = vi
            .fn<(reason: string) => void>()
            .mockImplementation((reason) => {
                document.body.dataset.chartUpdateReason = reason;
            });
        getTestWindow().ChartUpdater = { updateCharts };

        mount([]);

        vi.useFakeTimers();
        window.dispatchEvent(new Event("resize"));
        // Allow debounce timeout of 200ms
        vi.advanceTimersByTime(210);
        expect(updateCharts).toHaveBeenCalledWith("window-resize");
        expect(document.body.dataset.chartUpdateReason).toBe("window-resize");
        vi.useRealTimers();
    });

    it("menu-open-overlay IPC triggers openFileSelector", async () => {
        expect.assertions(3);

        openFileSelectorMock.mockImplementationOnce(() => {
            document.body.dataset.overlaySelectorOpened = "true";
        });
        const { electronAPI, showNotification } = mount([]);
        const handler = getMenuOpenOverlayHandler(electronAPI);
        await handler();
        expect(openFileSelectorMock).toHaveBeenCalledOnce();
        expect(document.body.dataset.overlaySelectorOpened).toBe("true");
        expect(showNotification).not.toHaveBeenCalled();
    });

    it("menu-open-overlay handler reports errors", async () => {
        expect.assertions(2);

        openFileSelectorMock.mockImplementationOnce(() => {
            throw new Error("fail");
        });
        const { electronAPI, showNotification } = mount([]);
        const handler = getMenuOpenOverlayHandler(electronAPI);
        await handler();
        expect(showNotification).toHaveBeenCalledWith(
            "Failed to open overlay selector.",
            "error",
            3000
        );
        expect(document.body.dataset.lastNotification).toBe(
            "error:Failed to open overlay selector."
        );
    });
});
