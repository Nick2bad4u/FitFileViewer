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

declare global {
    interface Window {
        sendFitFileToAltFitReader: (buffer: ArrayBuffer) => Promise<void>;
    }
}

// Hoisted module mocks for all imports used by main-ui.js
const applyTheme = vi.fn();
let listenCb: ((t: string) => void) | null = null;
const listenForThemeChange = vi.fn((cb: (t: string) => void) => {
    listenCb = cb;
});
const loadTheme = vi.fn(() => "dark");
vi.mock("../../../../electron-app/utils/theming/core/theme.js", () => ({
    applyTheme,
    listenForThemeChange,
    loadTheme,
}));

const showFitData = vi.fn();
vi.mock("../../../../electron-app/utils/rendering/core/showFitData.js", () => ({
    showFitData,
}));

const convertArrayBufferToBase64 = vi.fn(() => "BASE64DATA");
vi.mock(
    "../../../../electron-app/utils/formatting/converters/convertArrayBufferToBase64.js",
    () => ({
        convertArrayBufferToBase64,
    })
);

const setupDOMContentLoaded = vi.fn();
const setupFullscreenListeners = vi.fn();
vi.mock(
    "../../../../electron-app/utils/ui/controls/addFullScreenButton.js",
    () => ({
        setupDOMContentLoaded,
        setupFullscreenListeners,
    })
);

const setupWindow = vi.fn();
vi.mock(
    "../../../../electron-app/utils/app/initialization/setupWindow.js",
    () => ({
        setupWindow,
    })
);

const renderChartJS = vi.fn();
vi.mock("../../../../electron-app/utils/charts/core/renderChartJS.js", () => ({
    renderChartJS,
}));

const DEFAULT_TITLE = "Fit File Viewer";
const mockState: Record<string, unknown> = {
    globalData: undefined,
    "ui.dragCounter": 0,
    "ui.dropOverlay.visible": false,
    "ui.fileInfo": { displayName: "", hasFile: false, title: DEFAULT_TITLE },
    "ui.loadingIndicator": { active: false, progress: 0 },
    "ui.unloadButtonVisible": false,
};
const getState = vi.fn((key: string) => mockState[key]);
const setState = vi.fn((key: string, value: unknown) => {
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
const subscribe = vi.fn();
vi.mock("../../../../electron-app/utils/state/core/stateManager.js", () => ({
    getState,
    setState,
    subscribe,
}));

const UIActions = { showTab: vi.fn(), setTheme: vi.fn() };
vi.mock(
    "../../../../electron-app/utils/state/domain/uiStateManager.js",
    () => ({ UIActions })
);

const AppActions = { setFileOpening: vi.fn(), clearData: vi.fn() };
vi.mock("../../../../electron-app/utils/app/lifecycle/appActions.js", () => ({
    AppActions,
}));
AppActions.clearData.mockImplementation(() => {
    fitFileStateManager.clearFileState();
});

const fitFileStateManager = {
    startFileLoading: vi.fn(),
    handleFileLoaded: vi.fn(),
    handleFileLoadingError: vi.fn(),
    clearFileState: vi.fn(),
};
vi.mock("../../../../electron-app/utils/state/domain/fitFileState.js", () => ({
    fitFileStateManager,
}));

const performanceMonitor = {
    isEnabled: vi.fn(() => true),
    startTimer: vi.fn(),
    endTimer: vi.fn(),
};
vi.mock("../../../../electron-app/utils/debug/stateDevTools.js", () => ({
    performanceMonitor,
}));

const showNotification = vi.fn();
vi.mock(
    "../../../../electron-app/utils/ui/notifications/showNotification.js",
    () => ({
        showNotification,
    })
);

const chartTabIntegration = {
    destroy: vi.fn(),
    getStatus: vi.fn(() => "ok"),
};
vi.mock(
    "../../../../electron-app/utils/charts/core/chartTabIntegration.js",
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

function installElectronAPI() {
    const ipc = new Map<string, IpcCallback>();
    const electronAPI = {
        onIpc: vi.fn((channel: string, cb: IpcCallback) => {
            ipc.set(channel, cb);
        }),
        emit: (channel: string, ...args: unknown[]) =>
            ipc.get(channel)?.(...args),
        send: vi.fn(),
        openExternal: vi.fn(() => Promise.reject(new Error("fail"))),
        injectMenu: vi.fn(),
        onSetTheme: vi.fn(),
        sendThemeChanged: vi.fn(),
        onOpenSummaryColumnSelector: undefined,
        decodeFitFile: vi.fn(),
    };
    Reflect.set(window, "electronAPI", electronAPI);
    Reflect.set(globalThis, "electronAPI", electronAPI);
    return electronAPI;
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

function getCurrentElectronAPI(): ReturnType<typeof installElectronAPI> {
    const api = Reflect.get(window, "electronAPI");
    expect(api).toMatchObject({
        decodeFitFile: expect.any(Function),
        emit: expect.any(Function),
        openExternal: expect.any(Function),
        send: expect.any(Function),
    });
    return api as ReturnType<typeof installElectronAPI>;
}

function getDragDropHandler() {
    const handler = Reflect.get(window, "dragDropHandler");
    expect(handler).toMatchObject({
        processDroppedFile: expect.any(Function),
        readFileAsArrayBuffer: expect.any(Function),
        showDropOverlay: expect.any(Function),
    });
    return handler as DragDropHandlerUnderTest;
}

function getWindowFunction<T extends (...args: never[]) => unknown>(
    name: string
) {
    const fn = Reflect.get(window, name);
    expect(fn).toEqual(expect.any(Function));
    return fn as T;
}

// Basic globals
const alertSpy = vi.spyOn(window, "alert").mockImplementation(() => {});
const openSpy = vi.spyOn(window, "open").mockImplementation(() => null);

async function importMainUI() {
    // Import the module under test. Path is from this test file.
    return await import("../../../../electron-app/main-ui.js");
}

describe("main-ui.js core flows", () => {
    beforeEach(() => {
        vi.useFakeTimers();
        vi.resetModules();
        vi.clearAllMocks();
        listenCb = null;
        mockState["globalData"] = undefined;
        mockState["ui.dragCounter"] = 0;
        mockState["ui.dropOverlay.visible"] = false;
        installBaseDOM();
        Reflect.set(window, "enableDragAndDrop", true);
        Reflect.set(globalThis, "enableDragAndDrop", true);
        installElectronAPI();
        // Simulate DOMContentLoaded so external link handlers attach
        Object.defineProperty(document, "readyState", {
            value: "loading",
            configurable: true,
        });
    });

    afterEach(() => {
        vi.useRealTimers();
        document.body.replaceChildren();
    });

    it("applies the stored theme and handles theme-change callbacks", async () => {
        expect.assertions(8);

        await importMainUI();

        expect(loadTheme).toHaveBeenCalledTimes(1);
        expect(applyTheme).toHaveBeenCalledWith("dark");
        expect(listenForThemeChange).toHaveBeenCalledTimes(1);
        expect(typeof listenCb).toBe("function");

        listenCb?.("light");

        expect(applyTheme).toHaveBeenLastCalledWith("light");
        expect(applyTheme).toHaveBeenCalledTimes(2);
        expect(UIActions.setTheme).toHaveBeenCalledWith("light");
        expect(UIActions.setTheme).toHaveBeenCalledTimes(1);
    });

    it("unloads file via button and emits IPC", async () => {
        const api = installElectronAPI();
        await importMainUI();

        const btn = getRequiredElement("unloadFileBtn", HTMLButtonElement);
        btn.click();
        expect(api.send).toHaveBeenCalledWith("fit-file-loaded", null);
        expect(AppActions.clearData).toHaveBeenCalledTimes(1);
        expect(fitFileStateManager.clearFileState).toHaveBeenCalledTimes(1);
        expect(fitFileStateManager.handleFileLoaded).not.toHaveBeenCalled();
        expect(btn.style.display).toBe("none");
        expect(document.title).toBe(DEFAULT_TITLE);

        api.emit("unload-fit-file");
        expect(api.send).toHaveBeenCalledTimes(2);
    });

    it("opens summary column selector from IPC and clicks gear after delay", async () => {
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
        expect(gearSpy).toHaveBeenCalled();
        expect(tabSpy).toHaveBeenCalledTimes(1);
        expect(gear.dataset.selectorOpenCount).toBe("1");
        expect(summaryTab.className).toMatch(/\bactive\b/);

        getCurrentElectronAPI().emit("open-summary-column-selector");
        vi.advanceTimersByTime(150);
        expect(summaryTab.dataset.clickedWhileActive).toBeUndefined();
        expect(gear.dataset.selectorOpenCount).toBe("2");
        listenerController.abort();
    });

    it("sends fit file to Alt FIT iframe with proper base64", async () => {
        await importMainUI();
        const iframe = getRequiredElement("altfit-iframe", HTMLIFrameElement);
        const postMessage = vi.fn();
        Object.defineProperty(iframe, "contentWindow", {
            value: { postMessage },
            configurable: true,
        });

        const buf = new ArrayBuffer(8);
        const fn = getWindowFunction<(ab: ArrayBuffer) => Promise<void>>(
            "sendFitFileToAltFitReader"
        );
        await fn(buf);
        expect(iframe.src).toContain("ffv/index.html");
        iframe.dispatchEvent(new Event("load"));
        expect(postMessage).toHaveBeenCalledWith(
            { type: "fit-file", base64: expect.any(String) },
            window.location.origin
        );
    });

    it("drag and drop overlay shows/hides", async () => {
        await importMainUI();

        const overlay = getRequiredElement("drop_overlay", HTMLElement);
        const alt = getRequiredElement("altfit-iframe", HTMLElement);
        const zwift = getRequiredElement("zwift-iframe", HTMLElement);

        const handler = getDragDropHandler();
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
        await importMainUI();
        const handler = getDragDropHandler();
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

        const readSpy = vi
            .spyOn(handler, "readFileAsArrayBuffer")
            .mockResolvedValue(new ArrayBuffer(4));
        const api = getCurrentElectronAPI();
        api.decodeFitFile.mockResolvedValue({
            recordMesgs: [{ positionLat: 1, positionLong: 2 }],
        });
        const sendAltSpy = vi
            .spyOn(window, "sendFitFileToAltFitReader")
            .mockResolvedValue(undefined);

        const absoluteFile = {
            name: "activity.fit",
            path: "C:/rides/activity.fit",
        };
        await handler.processDroppedFile(absoluteFile);
        expect(api.decodeFitFile).toHaveBeenCalled();
        expect(sendAltSpy).toHaveBeenCalled();
        expect(fitFileStateManager.startFileLoading).toHaveBeenLastCalledWith(
            "C:/rides/activity.fit"
        );
        expect(showFitData).toHaveBeenCalledWith(
            expect.anything(),
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
        expect(fitFileStateManager.handleFileLoadingError).toHaveBeenCalledWith(
            expect.objectContaining({ message: "bad file" })
        );

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
        const api = installElectronAPI();
        api.openExternal.mockRejectedValueOnce(new Error("blocked"));

        const openSpy = vi.spyOn(window, "open").mockImplementation(() => null);

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

        expect(api.openExternal).toHaveBeenCalled();
        expect(openSpy).not.toHaveBeenCalled();
        expect(showNotification).toHaveBeenCalledWith(
            "Failed to open link in your browser.",
            "error"
        );
    });

    it("dev helpers injectMenu and devCleanup work", async () => {
        const api = installElectronAPI();
        await importMainUI();
        const injectMenu =
            getWindowFunction<(theme: string, fitFilePath: string) => void>(
                "injectMenu"
            );
        injectMenu("dark", "path.fit");
        expect(api.injectMenu).toHaveBeenCalledWith("dark", "path.fit");

        mockState["charts.isRendered"] = true;
        mockState["ui.dragCounter"] = 3;
        const devCleanup = getWindowFunction<() => void>("devCleanup");
        devCleanup();
        expect(AppActions.clearData).toHaveBeenCalledTimes(1);
        expect(chartTabIntegration.destroy).toHaveBeenCalledTimes(1);
        expect(mockState).toMatchObject({
            "charts.isRendered": false,
            "ui.dragCounter": 0,
        });
    });
});
