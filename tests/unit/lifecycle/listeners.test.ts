// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Mock } from "vitest";

vi.mock("../../../electron-app/utils/files/import/openFileSelector.js", () => ({
    openFileSelector: vi.fn(),
}));

import { openFileSelector } from "../../../electron-app/utils/files/import/openFileSelector.js";
import { setupListeners } from "../../../electron-app/utils/app/lifecycle/listeners.js";

const openFileSelectorMock = vi.mocked(openFileSelector);

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
        Object.assign(window, {
            electronAPI: undefined,
            showFitData: undefined,
            ChartUpdater: undefined,
            renderChartJS: undefined,
        });
        Object.assign(globalThis, {
            __ffvMenuForwardRegistry: undefined,
            electronAPI: undefined,
            showFitData: undefined,
            ChartUpdater: undefined,
            renderChartJS: undefined,
        });
    });

    function mount(openRecentReturn: string[] | null = null) {
        const openFileBtn = document.getElementById(
            "openFileBtn"
        ) as HTMLButtonElement;
        const isOpeningFileRef = { current: false } as any;
        const setLoading = vi.fn();
        const showNotification = vi.fn((message: string, type: string) => {
            document.body.dataset.lastNotification = `${type}:${message}`;
        });
        const handleOpenFile = vi.fn(({ isOpeningFileRef: ref }) => {
            ref.current = true;
            openFileBtn.dataset.opened = "true";
        });
        const showUpdateNotification = vi.fn();
        const showAboutModal = vi.fn();

        const electronAPI = {
            recentFiles: vi.fn(async () => openRecentReturn),
            onMenuOpenFile: vi.fn(),
            onOpenRecentFile: vi.fn(),
            readFile: vi.fn(),
            parseFitFile: vi.fn(),
            addRecentFile: vi.fn(),
            onIpc: vi.fn(),
            send: vi.fn(),
        } as any;
        (window as any).electronAPI = electronAPI;
        (globalThis as any).electronAPI = electronAPI;
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
            openFileBtn,
            isOpeningFileRef,
            setLoading,
            showNotification,
            handleOpenFile,
        };
    }

    it("clicking openFileBtn calls handleOpenFile with expected args", () => {
        const {
            openFileBtn,
            handleOpenFile,
            isOpeningFileRef,
            setLoading,
            showNotification,
        } = mount([]);
        openFileBtn.click();
        expect(handleOpenFile).toHaveBeenCalledTimes(1);
        expect(handleOpenFile).toHaveBeenCalledWith({
            isOpeningFileRef,
            openFileBtn,
            setLoading,
            showNotification,
        });
        expect(isOpeningFileRef.current).toBe(true);
        expect(openFileBtn.dataset.opened).toBe("true");
    });

    it("contextmenu with no electronAPI.recentFiles early-returns and shows info", async () => {
        const { openFileBtn } = mount(null);
        // Remove electronAPI to simulate missing API
        delete (window as any).electronAPI;
        const evt = new MouseEvent("contextmenu", {
            bubbles: true,
            cancelable: true,
            clientX: 10,
            clientY: 10,
        });
        openFileBtn.dispatchEvent(evt);
        // Nothing to assert – ensuring no throw. Menu shouldn't exist
        expect(document.getElementById("recent-files-menu")).toBeNull();
    });

    it("resize while chart tab active triggers ChartUpdater.updateCharts if available", async () => {
        // create active chart tab
        const tab = document.createElement("div");
        tab.id = "tab-chart";
        tab.classList.add("active");
        document.body.appendChild(tab);
        const updateCharts = vi.fn((reason: string) => {
            document.body.dataset.chartUpdateReason = reason;
        });
        (window as any).ChartUpdater = { updateCharts };

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
        openFileSelectorMock.mockImplementationOnce(() => {
            document.body.dataset.overlaySelectorOpened = "true";
        });
        const { showNotification } = mount([]);
        const onIpcMock = (window as any).electronAPI.onIpc as Mock;
        const entry = onIpcMock.mock.calls.find(
            (args: any[]) => args[0] === "menu-open-overlay"
        );
        expect(entry).toEqual(["menu-open-overlay", expect.any(Function)]);
        const handler = entry[1] as () => Promise<void>;
        await handler();
        expect(openFileSelectorMock).toHaveBeenCalledTimes(1);
        expect(document.body.dataset.overlaySelectorOpened).toBe("true");
        expect(showNotification).not.toHaveBeenCalled();
    });

    it("menu-open-overlay handler reports errors", async () => {
        openFileSelectorMock.mockImplementationOnce(() => {
            throw new Error("fail");
        });
        const { showNotification } = mount([]);
        const onIpcMock = (window as any).electronAPI.onIpc as Mock;
        const entry = onIpcMock.mock.calls.find(
            (args: any[]) => args[0] === "menu-open-overlay"
        );
        expect(entry).toEqual(["menu-open-overlay", expect.any(Function)]);
        const handler = entry[1] as () => Promise<void>;
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
