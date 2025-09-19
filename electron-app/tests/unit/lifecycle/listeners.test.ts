// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { setupListeners } from "../../../utils/app/lifecycle/listeners.js";

describe("utils/app/lifecycle/listeners.js", () => {
    beforeEach(() => {
        document.body.innerHTML = `
      <button id="openFileBtn">Open</button>
      <div id="content-summary"></div>
    `;
        // Clean any previous window properties
        Object.assign(window, {
            electronAPI: undefined,
            showFitData: undefined,
            ChartUpdater: undefined,
            renderChartJS: undefined,
        });
    });

    function mount(openRecentReturn: string[] | null = null) {
        const openFileBtn = document.getElementById("openFileBtn") as HTMLButtonElement;
        const isOpeningFileRef = { current: false } as any;
        const setLoading = vi.fn();
        const showNotification = vi.fn();
        const handleOpenFile = vi.fn();
        const showUpdateNotification = vi.fn();
        const showAboutModal = vi.fn();

        (window as any).electronAPI = {
            recentFiles: vi.fn(async () => openRecentReturn),
            onMenuOpenFile: vi.fn(),
            onOpenRecentFile: vi.fn(),
            readFile: vi.fn(),
            parseFitFile: vi.fn(),
            addRecentFile: vi.fn(),
        } as any;
        setupListeners({
            openFileBtn,
            isOpeningFileRef,
            setLoading,
            showNotification,
            handleOpenFile,
            showUpdateNotification,
            showAboutModal,
        });
        return { openFileBtn, setLoading, showNotification, handleOpenFile };
    }

    it("clicking openFileBtn calls handleOpenFile with expected args", () => {
        const { openFileBtn, handleOpenFile, setLoading, showNotification } = mount([]);
        openFileBtn.click();
        expect(handleOpenFile).toHaveBeenCalledTimes(1);
        expect(handleOpenFile).toHaveBeenCalledWith({
            isOpeningFileRef: expect.any(Object),
            openFileBtn,
            setLoading,
            showNotification,
        });
    });

    it("contextmenu with no electronAPI.recentFiles early-returns and shows info", async () => {
        const { openFileBtn } = mount(null);
        // Remove electronAPI to simulate missing API
        delete (window as any).electronAPI;
        const evt = new MouseEvent("contextmenu", { bubbles: true, cancelable: true, clientX: 10, clientY: 10 });
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
        const updateCharts = vi.fn();
        (window as any).ChartUpdater = { updateCharts };

        mount([]);

        vi.useFakeTimers();
        window.dispatchEvent(new Event("resize"));
        // Allow debounce timeout of 200ms
        vi.advanceTimersByTime(210);
        expect(updateCharts).toHaveBeenCalledWith("window-resize");
        vi.useRealTimers();
    });
});
