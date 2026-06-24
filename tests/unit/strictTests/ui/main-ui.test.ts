import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

type IpcCallback = (...args: unknown[]) => void;

type DroppedFitFile = {
    name: string;
    path?: string;
};

type DragDropHandlerUnderTest = {
    processDroppedFile: (file: DroppedFitFile) => Promise<void>;
    readFileAsArrayBuffer: (
        file: DroppedFitFile
    ) => Promise<ArrayBuffer | null>;
    showDropOverlay: () => void;
};

const processEnvironmentMock = vi.hoisted(() => ({
    isDevelopmentEnvironment: vi.fn<() => boolean>(() => false),
    isTestEnvironment: vi.fn<() => boolean>(() => true),
}));

const mainUiRuntimeEnvironmentMock = vi.hoisted(() => ({
    electronApiCandidate: undefined as unknown,
}));

vi.mock(
    import("../../../../electron-app/utils/runtime/processEnvironment.js"),
    () => processEnvironmentMock
);

vi.mock(
    import("../../../../electron-app/renderer/mainUiRuntimeEnvironment.js"),
    () => ({
        getMainUiRuntimeEnvironment: () => ({
            consoleRef: console,
            dateNow: () => Date.now(),
            documentRef: document,
            electronApiCandidate:
                mainUiRuntimeEnvironmentMock.electronApiCandidate,
        }),
    })
);

// Hoisted module mocks for all imports used by main-ui.js
const applyTheme = vi.fn<(theme: string) => void>();
let listenCb: ((t: string) => void) | null = null;
const listenForThemeChange = vi.fn<(cb: (t: string) => void) => void>((cb) => {
    listenCb = cb;
});
const loadTheme = vi.fn<() => string>(() => "dark");
vi.mock(import("../../../../electron-app/utils/theming/core/theme.js"), () => ({
    applyTheme,
    listenForThemeChange,
    loadTheme,
}));

const showFitData = vi.fn<(data: unknown, filePath: string) => void>();
vi.mock(
    import("../../../../electron-app/utils/rendering/core/showFitData.js"),
    () => ({
        showFitData,
    })
);

const convertArrayBufferToBase64 = vi.fn<(buffer: ArrayBuffer) => string>(
    () => "BASE64DATA"
);
vi.mock(
    import("../../../../electron-app/utils/formatting/converters/convertArrayBufferToBase64.js"),
    () => ({
        convertArrayBufferToBase64,
    })
);

const sendFitFileToAltFitReader = vi.fn<(buffer: ArrayBuffer) => void>();
vi.mock(
    import("../../../../electron-app/utils/files/import/sendFitFileToAltFitReader.js"),
    () => ({
        sendFitFileToAltFitReader,
    })
);

const setupFullscreenListeners = vi.fn<() => void>();
vi.mock(
    import("../../../../electron-app/utils/ui/controls/addFullScreenButton.js"),
    () => ({
        setupFullscreenListeners,
    })
);

const ensureRendererVendorBundle = vi.fn<
    (entryName: "chart-data" | "core" | "map") => Promise<void>
>(() => Promise.resolve());
vi.mock(
    import("../../../../electron-app/renderer/vendorBundleLoader.js"),
    () => ({
        ensureRendererVendorBundle,
    })
);

const setupWindow = vi.fn<() => void>();
vi.mock(
    import("../../../../electron-app/utils/app/initialization/setupWindow.js"),
    () => ({
        setupWindow,
    })
);

const renderChartJS = vi.fn<() => void>();
vi.mock(
    import("../../../../electron-app/utils/charts/core/renderChartJS.js"),
    () => ({
        renderChartJS,
    })
);

const DEFAULT_TITLE = "Fit File Viewer";
const mockState: Record<string, unknown> = {
    "ui.dragCounter": 0,
    "ui.dropOverlay.visible": false,
    "ui.fileInfo": { displayName: "", hasFile: false, title: DEFAULT_TITLE },
    "ui.loadingIndicator": { active: false, progress: 0 },
    "ui.unloadButtonVisible": false,
};
const getState = vi.fn<(key: string) => unknown>((key) => mockState[key]);
const setState = vi.fn<(key: string, value: unknown) => void>((key, value) => {
    mockState[key] = value;
    if (key === "ui.dropOverlay.visible") {
        const isVisible = Boolean(value);
        const overlay = document.getElementById(
            "drop_overlay"
        ) as HTMLElement | null;
        if (overlay) {
            overlay.style.display = isVisible ? "flex" : "none";
        }
        const alt = document.getElementById(
            "altfit-iframe"
        ) as HTMLElement | null;
        if (alt) {
            alt.style.pointerEvents = isVisible ? "none" : "";
        }
        const zwift = document.getElementById(
            "zwift-iframe"
        ) as HTMLElement | null;
        if (zwift) {
            zwift.style.pointerEvents = isVisible ? "none" : "";
        }
    } else if (key === "ui.fileInfo") {
        const info =
            typeof value === "object" && value !== null
                ? (value as Record<string, unknown>)
                : {};
        const hasFile = Boolean(info.hasFile);
        const displayName =
            typeof info.displayName === "string" ? info.displayName : "";
        const title =
            typeof info.title === "string" && info.title.trim().length > 0
                ? info.title
                : DEFAULT_TITLE;

        const fileNameContainer = document.getElementById(
            "activeFileNameContainer"
        );
        if (fileNameContainer) {
            fileNameContainer.classList.toggle("has-file", hasFile);
        }

        const fileSpan = document.getElementById("activeFileName");
        if (fileSpan) {
            if (hasFile && displayName) {
                const activeLabel = document.createElement("span");
                activeLabel.className = "active-label";
                activeLabel.textContent = "Active:";
                fileSpan.replaceChildren(
                    activeLabel,
                    document.createTextNode(` ${displayName}`)
                );
                fileSpan.setAttribute("title", displayName);
            } else {
                fileSpan.replaceChildren();
                fileSpan.removeAttribute("title");
            }
        }

        document.title = title;
    } else if (key === "ui.unloadButtonVisible") {
        const unloadBtn = document.getElementById("unloadFileBtn");
        if (unloadBtn) {
            unloadBtn.style.display = value ? "" : "none";
        }
    } else if (key === "ui.loadingIndicator") {
        const indicator =
            typeof value === "object" && value !== null
                ? (value as Record<string, unknown>)
                : {};
        const progressElement = document.getElementById(
            "file-loading-progress"
        );
        if (progressElement) {
            const progressValue =
                typeof indicator.progress === "number" ? indicator.progress : 0;
            progressElement.style.width = `${progressValue}%`;
            progressElement.setAttribute(
                "aria-valuenow",
                progressValue.toString()
            );
            progressElement.setAttribute(
                "aria-hidden",
                (!indicator.active).toString()
            );
        }
    }
});
const subscribe =
    vi.fn<(key: string, callback: (value: unknown) => void) => void>();
vi.mock(
    import("../../../../electron-app/utils/state/core/stateManager.js"),
    () => ({
        getState,
        setState,
        subscribe,
    })
);

const UIActions = {
    setTheme: vi.fn<(theme: string) => void>(),
    showTab: vi.fn<(tabId: string) => void>(),
};
vi.mock(
    import("../../../../electron-app/utils/state/domain/uiStateManager.js"),
    () => ({ UIActions })
);

const AppActions = {
    clearData: vi.fn<(options?: unknown) => void>(),
    setFileOpening: vi.fn<(isOpening: boolean) => void>(),
};
vi.mock(
    import("../../../../electron-app/utils/app/lifecycle/appActions.js"),
    () => ({
        AppActions,
    })
);
AppActions.clearData.mockImplementation(() => {
    fitFileStateManager.clearFileState();
});

const fitFileStateManager = {
    clearFileState: vi.fn<() => void>(),
    handleFileLoaded: vi.fn<(data: unknown, filePath: string) => void>(),
    handleFileLoadingError: vi.fn<(error: unknown) => void>(),
    startFileLoading: vi.fn<(filePath: string) => void>(),
};
vi.mock(
    import("../../../../electron-app/utils/state/domain/fitFileState.js"),
    () => ({
        fitFileStateManager,
    })
);

const performanceMonitor = {
    endTimer: vi.fn<(label: string) => void>(),
    isEnabled: vi.fn<() => boolean>(() => true),
    startTimer: vi.fn<(label: string) => void>(),
};
vi.mock(
    import("../../../../electron-app/utils/debug/stateDevTools.js"),
    () => ({
        performanceMonitor,
    })
);

const showNotification = vi.fn<(message: string, type: string) => void>();
vi.mock(
    import("../../../../electron-app/utils/ui/notifications/showNotification.js"),
    () => ({
        showNotification,
    })
);

const chartTabIntegration = {
    destroy: vi.fn<() => void>(),
    getStatus: vi.fn<() => string>(() => "ok"),
};
vi.mock(
    import("../../../../electron-app/utils/charts/core/chartTabIntegration.js"),
    () => ({
        chartTabIntegration,
    })
);

// Helpers
function appendElement<K extends keyof HTMLElementTagNameMap>(
    tagName: K,
    attributes: Record<string, string> = {}
) {
    const element = document.createElement(tagName);
    for (const [name, value] of Object.entries(attributes)) {
        element.setAttribute(name, value);
    }
    document.body.append(element);
    return element;
}

function installBaseDOM() {
    document.title = "FitFileViewer Tests";
    document.body.replaceChildren();
    appendElement("div", { id: "activeFileName" });
    appendElement("div", { id: "activeFileNameContainer" });
    appendElement("button", { id: "unloadFileBtn" });
    appendElement("div", { id: "loading-indicator" });
    appendElement("div", { id: "file-loading-progress" });
    appendElement("div", { id: "tab-chart" });
    appendElement("button", { id: "tab-summary" });
    appendElement("button", { id: "tab-map" });
    appendElement("div", { id: "content-map" });
    appendElement("div", { id: "content-data" });
    appendElement("div", { id: "content-chart" });
    appendElement("div", { id: "content-summary" });
    appendElement("div", { id: "drop_overlay", style: "display:none" });
    appendElement("iframe", { id: "altfit-iframe" });
    appendElement("iframe", { id: "zwift-iframe" });
    appendElement("button", { class: "summary-gear-btn" });
    const externalLink = appendElement("a", {
        "data-external-link": "true",
        href: "https://example.com/",
        id: "ext",
        target: "_blank",
    });
    externalLink.textContent = "ext";
}

type TestElectronAPI = ReturnType<typeof createElectronAPI>;

let currentElectronAPI: TestElectronAPI | undefined;

function createElectronAPI() {
    const ipc = new Map<string, IpcCallback>();

    return {
        decodeFitFile: vi.fn<(buffer: ArrayBuffer) => Promise<unknown>>(),
        emit: (channel: string, ...args: unknown[]) =>
            ipc.get(channel)?.(...args),
        injectMenu: vi.fn<(theme: string, fitFilePath: string) => void>(),
        notifyFitFileLoaded: vi.fn<(filePath: null | string) => void>(),
        onIpc: vi.fn<(channel: string, cb: IpcCallback) => void>(
            (channel, cb) => {
                ipc.set(channel, cb);
            }
        ),
        onOpenSummaryColumnSelector: vi.fn<(cb: IpcCallback) => void>((cb) => {
            ipc.set("open-summary-column-selector", cb);
        }),
        onSetTheme: vi.fn<(cb: (theme: string) => void) => void>(),
        onUnloadFitFile: vi.fn<(cb: IpcCallback) => void>((cb) => {
            ipc.set("unload-fit-file", cb);
        }),
        openExternal: vi.fn<(url: string) => Promise<void>>(() =>
            Promise.reject(new Error("fail"))
        ),
        send: vi.fn<(channel: string, payload?: unknown) => void>(),
        sendThemeChanged: vi.fn<(theme: string) => void>(),
    };
}

function installElectronAPI() {
    currentElectronAPI = createElectronAPI();
    mainUiRuntimeEnvironmentMock.electronApiCandidate = currentElectronAPI;
    return currentElectronAPI;
}

function getRequiredElement<T extends Element>(
    id: string,
    constructor: new (...args: never[]) => T
) {
    const element = document.getElementById(id);
    expect(element).toBeInstanceOf(constructor);
    return element as T;
}

function getRequiredSelector<T extends Element>(
    selector: string,
    constructor: new (...args: never[]) => T
) {
    const element = document.querySelector(selector);
    expect(element).toBeInstanceOf(constructor);
    return element as T;
}

function getCurrentElectronAPI(): TestElectronAPI {
    const api = currentElectronAPI;

    if (
        !api ||
        typeof api.decodeFitFile !== "function" ||
        typeof api.emit !== "function" ||
        typeof api.notifyFitFileLoaded !== "function" ||
        typeof api.openExternal !== "function" ||
        typeof api.send !== "function"
    ) {
        throw new TypeError("Expected Electron API test double");
    }

    return api;
}

type MainUiModule = Awaited<ReturnType<typeof importMainUI>>;

function getDragDropHandler(mainUiModule: MainUiModule) {
    const handler = mainUiModule.mainUiDragDropHandler;

    if (
        !handler ||
        typeof handler.processDroppedFile !== "function" ||
        typeof handler.readFileAsArrayBuffer !== "function" ||
        typeof handler.showDropOverlay !== "function"
    ) {
        throw new TypeError("Expected mainUiDragDropHandler test double");
    }

    return handler as DragDropHandlerUnderTest;
}

// Basic globals
const alertSpy = vi.spyOn(window, "alert").mockImplementation(() => {});
const openSpy = vi.spyOn(window, "open").mockReturnValue(null);

async function importMainUI() {
    // Import the module under test. Path is from this test file.
    return await import("../../../../electron-app/main-ui.js");
}

describe("main-ui.js core flows", () => {
    beforeEach(async () => {
        vi.useFakeTimers();
        vi.resetModules();
        vi.clearAllMocks();
        mainUiRuntimeEnvironmentMock.electronApiCandidate = undefined;
        ensureRendererVendorBundle.mockResolvedValue(undefined);
        processEnvironmentMock.isDevelopmentEnvironment.mockReturnValue(false);
        processEnvironmentMock.isTestEnvironment.mockReturnValue(true);
        listenCb = null;
        mockState["ui.dragCounter"] = 0;
        mockState["ui.dropOverlay.visible"] = false;
        installBaseDOM();
        installElectronAPI();
        // Simulate DOMContentLoaded so external link handlers attach
        Object.defineProperty(document, "readyState", {
            value: "loading",
            configurable: true,
        });
    });

    afterEach(() => {
        vi.useRealTimers();
        mainUiRuntimeEnvironmentMock.electronApiCandidate = undefined;
        currentElectronAPI = undefined;
        document.body.replaceChildren();
    });

    it("applies the stored theme and handles theme-change callbacks", async () => {
        expect.assertions(7);

        await importMainUI();

        expect(loadTheme).toHaveBeenCalledOnce();
        expect(applyTheme).toHaveBeenCalledWith("dark");
        expect(listenForThemeChange).toHaveBeenCalledOnce();
        expect(listenCb).toBeTypeOf("function");

        listenCb?.("light");

        expect(applyTheme).toHaveBeenLastCalledWith("light");
        expect(applyTheme).toHaveBeenCalledTimes(2);
        expect(UIActions.setTheme).toHaveBeenCalledExactlyOnceWith("light");
    });

    it("unloads file via button and emits IPC", async () => {
        expect.assertions(9);

        const api = installElectronAPI();
        await importMainUI();

        const btn = getRequiredElement("unloadFileBtn", HTMLButtonElement);
        btn.click();
        expect(api.notifyFitFileLoaded).toHaveBeenCalledWith(null);
        expect(AppActions.clearData).toHaveBeenCalledExactlyOnceWith({
            notificationMessage: "File unloaded successfully",
        });
        expect(fitFileStateManager.clearFileState).toHaveBeenCalledOnce();
        expect(fitFileStateManager.handleFileLoaded).not.toHaveBeenCalled();
        expect(btn.style.display).toBe("none");
        expect(document.title).toBe(DEFAULT_TITLE);
        expect(UIActions.showTab).toHaveBeenCalledWith("map");

        api.emit("unload-fit-file");
        expect(api.notifyFitFileLoaded).toHaveBeenCalledTimes(2);
    });

    it("opens summary column selector from IPC and clicks gear after delay", async () => {
        expect.assertions(8);

        await importMainUI();
        const summaryTab = getRequiredElement("tab-summary", HTMLButtonElement);
        const gear = getRequiredSelector(
            ".summary-gear-btn",
            HTMLButtonElement
        );
        const listenerController = new AbortController();
        summaryTab.addEventListener(
            "click",
            () => {
                if (summaryTab.classList.contains("active")) {
                    summaryTab.dataset.clickedWhileActive = "true";
                }
                summaryTab.classList.add("active");
            },
            { signal: listenerController.signal }
        );
        gear.addEventListener(
            "click",
            () => {
                const currentCount = Number(
                    gear.dataset.selectorOpenCount ?? 0
                );
                gear.dataset.selectorOpenCount = String(currentCount + 1);
            },
            { signal: listenerController.signal }
        );
        const gearSpy = vi.spyOn(gear, "click");
        const tabSpy = vi.spyOn(summaryTab, "click");

        getCurrentElectronAPI().emit("open-summary-column-selector");

        vi.advanceTimersByTime(150);
        expect(gearSpy).toHaveBeenCalledWith();
        expect(tabSpy).toHaveBeenCalledOnce();
        expect(gear.dataset.selectorOpenCount).toBe("1");
        expect(summaryTab.className).toMatch(/\bactive\b/);

        getCurrentElectronAPI().emit("open-summary-column-selector");
        vi.advanceTimersByTime(150);
        expect(summaryTab.dataset).not.toHaveProperty("clickedWhileActive");
        expect(gear.dataset.selectorOpenCount).toBe("2");
        listenerController.abort();
    });

    it("does not expose the Alt FIT handoff as a window global", async () => {
        expect.assertions(1);

        await importMainUI();

        expect("sendFitFileToAltFitReader" in window).toBe(false);
    });

    it("drag and drop overlay shows/hides", async () => {
        expect.assertions(8);

        const mainUiModule = await importMainUI();

        const overlay = getRequiredElement("drop_overlay", HTMLElement);
        const alt = getRequiredElement("altfit-iframe", HTMLElement);
        const zwift = getRequiredElement("zwift-iframe", HTMLElement);

        const handler = getDragDropHandler(mainUiModule);
        handler.showDropOverlay();
        expect(overlay.style.display).toBe("flex");
        expect(alt.style.pointerEvents).toBe("none");
        expect(zwift.style.pointerEvents).toBe("none");

        const over = new Event("dragover");
        const dataTransfer = { dropEffect: "none" };
        Object.defineProperty(over, "dataTransfer", {
            value: dataTransfer,
            configurable: true,
        });
        window.dispatchEvent(over);
        expect(dataTransfer.dropEffect).toBe("copy");

        const drop = new Event("drop");
        Object.defineProperty(drop, "dataTransfer", {
            value: { files: [] },
            configurable: true,
        });
        window.dispatchEvent(drop);
        expect(overlay.style.display).toBe("none");
    });

    it("processDroppedFile handles valid and invalid files and toggles loading", async () => {
        expect.assertions(15);

        const mainUiModule = await importMainUI();
        const handler = getDragDropHandler(mainUiModule);
        const notifications: string[] = [];
        showNotification.mockImplementation((message: string, type: string) => {
            notifications.push(`${type}:${message}`);
        });

        await handler.processDroppedFile({ name: "notes.txt" });
        expect(notifications).toContain(
            "warning:Only .fit files are supported. Please drop a valid .fit file."
        );
        expect(showNotification).toHaveBeenCalledWith(
            "Only .fit files are supported. Please drop a valid .fit file.",
            "warning"
        );
        expect(AppActions.setFileOpening).not.toHaveBeenCalled();
        expect(fitFileStateManager.startFileLoading).not.toHaveBeenCalled();

        const droppedFileBuffer = new ArrayBuffer(4);
        const readSpy = vi
            .spyOn(handler, "readFileAsArrayBuffer")
            .mockResolvedValue(droppedFileBuffer);
        const api = getCurrentElectronAPI();
        const decodedFitData = {
            recordMesgs: [{ positionLat: 1, positionLong: 2 }],
        };
        api.decodeFitFile.mockResolvedValue(decodedFitData);
        sendFitFileToAltFitReader.mockReset();

        const absoluteFile = {
            name: "activity.fit",
            path: "C:/rides/activity.fit",
        };
        await handler.processDroppedFile(absoluteFile);
        expect(api.decodeFitFile).toHaveBeenCalledWith(droppedFileBuffer);
        expect(sendFitFileToAltFitReader).toHaveBeenCalledWith(
            droppedFileBuffer
        );
        expect(fitFileStateManager.startFileLoading).toHaveBeenLastCalledWith(
            "C:/rides/activity.fit"
        );
        expect(showFitData).toHaveBeenCalledWith(
            decodedFitData,
            "C:/rides/activity.fit"
        );
        expect(AppActions.setFileOpening).toHaveBeenLastCalledWith(false);
        expect(notifications).toContain(
            'success:File "activity.fit" loaded successfully'
        );
        expect(showNotification).toHaveBeenCalledWith(
            'File "activity.fit" loaded successfully',
            "success"
        );

        api.decodeFitFile.mockResolvedValue({ error: "bad file" });
        await handler.processDroppedFile({
            name: "bad.fit",
            path: "C:/rides/bad.fit",
        });
        expect(showNotification).toHaveBeenCalledWith(
            "Failed to load FIT file",
            "error"
        );
        expect(notifications).toContain("error:Failed to load FIT file");
        const loadingError =
            fitFileStateManager.handleFileLoadingError.mock.calls.at(-1)?.[0];
        expect(loadingError).toStrictEqual(new Error("bad file"));

        const err = new Error("boom");
        api.decodeFitFile.mockRejectedValue(err);
        await handler.processDroppedFile({
            name: "oops.fit",
            path: "C:/rides/oops.fit",
        });
        expect(fitFileStateManager.handleFileLoadingError).toHaveBeenCalledWith(
            err
        );

        readSpy.mockRestore();
    });

    it("external link handlers call electronAPI.openExternal", async () => {
        expect.assertions(5);

        await importMainUI();
        document.dispatchEvent(new Event("DOMContentLoaded"));
        const link = getRequiredElement("ext", HTMLAnchorElement);

        const clickEvent = new MouseEvent("click", {
            bubbles: true,
            cancelable: true,
        });
        const mouseDispatchResult = link.dispatchEvent(clickEvent);
        expect({
            defaultPrevented: clickEvent.defaultPrevented,
            dispatchResult: mouseDispatchResult,
        }).toStrictEqual({
            defaultPrevented: true,
            dispatchResult: false,
        });
        expect(getCurrentElectronAPI().openExternal).toHaveBeenCalledWith(
            "https://example.com/"
        );

        const evt = new KeyboardEvent("keydown", {
            bubbles: true,
            cancelable: true,
            key: "Enter",
        });
        const keyboardDispatchResult = link.dispatchEvent(evt);
        expect({
            defaultPrevented: evt.defaultPrevented,
            dispatchResult: keyboardDispatchResult,
        }).toStrictEqual({
            defaultPrevented: true,
            dispatchResult: false,
        });
        expect(getCurrentElectronAPI().openExternal).toHaveBeenCalledTimes(2);
    });

    it("does not fall back to window.open when openExternal fails", async () => {
        expect.assertions(5);

        const api = installElectronAPI();
        api.openExternal.mockRejectedValueOnce(new Error("blocked"));

        const openSpy = vi.spyOn(window, "open").mockReturnValue(null);

        await importMainUI();
        document.dispatchEvent(new Event("DOMContentLoaded"));

        const link = getRequiredElement("ext", HTMLAnchorElement);
        const clickEvent = new MouseEvent("click", {
            bubbles: true,
            cancelable: true,
        });
        const dispatchResult = link.dispatchEvent(clickEvent);
        expect({
            defaultPrevented: clickEvent.defaultPrevented,
            dispatchResult,
        }).toStrictEqual({
            defaultPrevented: true,
            dispatchResult: false,
        });

        await Promise.resolve();

        expect(api.openExternal).toHaveBeenCalledWith("https://example.com/");
        expect(openSpy).not.toHaveBeenCalled();
        expect(showNotification).toHaveBeenCalledWith(
            "Failed to open link in your browser.",
            "error"
        );
    });

    it("does not expose development helpers as window globals", async () => {
        expect.assertions(2);

        await importMainUI();

        expect(Reflect.has(window, "devCleanup")).toBe(false);
        expect(Reflect.has(window, "injectMenu")).toBe(false);
    });

    it("development helper exports inject menu and cleanup", async () => {
        expect.assertions(6);

        const api = installElectronAPI();
        const mainUiModule = await importMainUI();
        mainUiModule.requestMainUiMenuInjection("dark", "path.fit");
        expect(api.injectMenu).toHaveBeenCalledWith("dark", "path.fit");

        mockState["charts.isRendered"] = true;
        mockState["ui.dragCounter"] = 3;
        mainUiModule.runMainUiDevelopmentCleanup();
        expect(AppActions.clearData).toHaveBeenCalledOnce();
        expect(chartTabIntegration.destroy).toHaveBeenCalledOnce();
        expect(setState).toHaveBeenCalledWith("charts.isRendered", false, {
            silent: false,
            source: "devCleanup",
        });
        expect(setState).toHaveBeenCalledWith("ui.dragCounter", 0, {
            silent: false,
            source: "devCleanup",
        });
        expect({
            chartsIsRendered: mockState["charts.isRendered"],
            dragCounter: mockState["ui.dragCounter"],
        }).toStrictEqual({
            chartsIsRendered: false,
            dragCounter: 0,
        });
    });
});
