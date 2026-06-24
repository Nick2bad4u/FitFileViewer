// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Mock } from "vitest";
import type { ElectronAPI } from "../../../electron-app/shared/preloadApi.js";
import type {
    FileOpeningStateRef,
    SetupListenersOptions,
} from "../../../electron-app/utils/app/lifecycle/listeners.js";

const openFileSelectorMock = vi.hoisted(() => vi.fn<() => void>());
const updateChartsMock = vi.hoisted(() =>
    vi.fn<(reason: string) => Promise<boolean>>((reason) => {
        document.body.dataset.chartUpdateReason = reason;
        return Promise.resolve(true);
    })
);

vi.mock(
    import("../../../electron-app/utils/files/import/openFileSelector.js"),
    () => ({
        openFileSelector: openFileSelectorMock,
    })
);

vi.mock(
    import("../../../electron-app/utils/charts/core/chartUpdater.js"),
    () => ({
        updateCharts: updateChartsMock,
    })
);

import { setupListeners } from "../../../electron-app/utils/app/lifecycle/listeners.js";
import { getLifecycleListenerCleanup } from "../../../electron-app/utils/app/lifecycle/lifecycleListenerCleanupRegistry.js";
import { resetMenuIpcListenerStateForTests } from "../../../electron-app/utils/app/lifecycle/menuIpcListeners.js";
import type { RendererElectronApiScope } from "../../../electron-app/utils/runtime/electronApiRuntime.js";

type TestElectronAPI = {
    addRecentFile: Mock<ElectronAPI["addRecentFile"]>;
    checkForUpdates: Mock<ElectronAPI["checkForUpdates"]>;
    onIpc: Mock<ElectronAPI["onIpc"]>;
    onMenuOpenFile: Mock<ElectronAPI["onMenuOpenFile"]>;
    onMenuOpenOverlay: Mock<ElectronAPI["onMenuOpenOverlay"]>;
    onOpenRecentFile: Mock<ElectronAPI["onOpenRecentFile"]>;
    onSetFontSize: Mock<ElectronAPI["onSetFontSize"]>;
    onSetHighContrast: Mock<ElectronAPI["onSetHighContrast"]>;
    parseFitFile: Mock<ElectronAPI["parseFitFile"]>;
    readFile: Mock<ElectronAPI["readFile"]>;
    recentFiles: Mock<() => Promise<null | string[]>>;
};

type TestGlobal = typeof globalThis & {
    renderChartJS?: unknown;
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

function getAccessibilityHandler<
    MethodName extends "onSetFontSize" | "onSetHighContrast",
>(
    electronAPI: TestElectronAPI,
    methodName: MethodName
): Parameters<NonNullable<ElectronAPI[MethodName]>>[0] {
    const entry = electronAPI[methodName].mock.calls[0];
    if (!entry) {
        throw new TypeError(`Expected ${methodName} registration`);
    }

    const handler = entry[0];
    if (typeof handler !== "function") {
        throw new TypeError(`Expected ${methodName} handler`);
    }

    return handler;
}

function createMutableElectronApiScope(api: unknown): {
    readonly deactivateElectronApi: () => void;
    readonly electronApiScope: RendererElectronApiScope;
} {
    let activeApi: unknown = api;

    return {
        deactivateElectronApi: () => {
            activeApi = null;
        },
        electronApiScope: {
            getElectronAPI: () => activeApi,
        },
    };
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
        Object.assign(getTestWindow(), {
            renderChartJS: undefined,
        });
        Object.assign(getTestGlobal(), {
            renderChartJS: undefined,
        });
        resetMenuIpcListenerStateForTests();
        updateChartsMock.mockClear();
    });

    function mount(openRecentReturn: string[] | null = null): {
        electronAPI: TestElectronAPI;
        deactivateElectronApi: () => void;
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
            onSetFontSize: vi.fn<ElectronAPI["onSetFontSize"]>(),
            onSetHighContrast: vi.fn<ElectronAPI["onSetHighContrast"]>(),
            readFile: vi.fn<ElectronAPI["readFile"]>(),
            parseFitFile: vi.fn<ElectronAPI["parseFitFile"]>(),
            addRecentFile: vi.fn<ElectronAPI["addRecentFile"]>(),
            onIpc: vi.fn<ElectronAPI["onIpc"]>(),
        };
        const { deactivateElectronApi, electronApiScope } =
            createMutableElectronApiScope(electronAPI);

        setupListeners({
            electronApiScope,
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
            deactivateElectronApi,
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

    it("replaces existing Open File listeners during repeated setup", () => {
        expect.assertions(4);

        const firstMount = mount([]);
        const secondMount = mount([]);

        firstMount.openFileBtn.click();

        expect(firstMount.handleOpenFile).not.toHaveBeenCalled();
        expect(secondMount.handleOpenFile).toHaveBeenCalledOnce();
        expect(getLifecycleListenerCleanup(firstMount.openFileBtn)).toBeTypeOf(
            "function"
        );

        getLifecycleListenerCleanup(firstMount.openFileBtn)?.();

        expect(
            getLifecycleListenerCleanup(firstMount.openFileBtn)
        ).toBeUndefined();
    });

    it("contextmenu with no electronAPI.recentFiles early-returns and shows info", async () => {
        expect.assertions(1);

        const { deactivateElectronApi, openFileBtn } = mount(null);
        deactivateElectronApi();
        const evt = new MouseEvent("contextmenu", {
            bubbles: true,
            cancelable: true,
            clientX: 10,
            clientY: 10,
        });
        openFileBtn.dispatchEvent(evt);
        expect(document.getElementById("recent-files-menu")).toBeNull();
    });

    it("resize while chart tab active triggers the typed chart updater", async () => {
        expect.assertions(2);

        // create active chart tab
        const tab = document.createElement("div");
        tab.id = "tab-chart";
        tab.classList.add("active");
        document.body.append(tab);
        mount([]);

        vi.useFakeTimers();
        window.dispatchEvent(new Event("resize"));
        // Allow debounce timeout of 200ms
        vi.advanceTimersByTime(210);
        expect(updateChartsMock).toHaveBeenCalledWith("window-resize");
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

    it("accessibility IPC updates body classes through the listener runtime", () => {
        expect.assertions(4);

        const { electronAPI } = mount([]);
        const setFontSize = getAccessibilityHandler(
            electronAPI,
            "onSetFontSize"
        );
        const setHighContrast = getAccessibilityHandler(
            electronAPI,
            "onSetHighContrast"
        );

        document.body.classList.add("font-small", "high-contrast-yellow");

        setFontSize("large");
        expect(document.body.classList.contains("font-small")).toBe(false);
        expect(document.body.classList.contains("font-large")).toBe(true);

        setHighContrast("white");
        expect(document.body.classList.contains("high-contrast-yellow")).toBe(
            false
        );
        expect(document.body.classList.contains("high-contrast-white")).toBe(
            true
        );
    });
});
