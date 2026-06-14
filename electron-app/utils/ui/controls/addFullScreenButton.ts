import { getActiveTabContent } from "../../rendering/helpers/getActiveTabContent.js";
import { addExitFullscreenOverlay } from "./addExitFullscreenOverlay.js";
import { removeExitFullscreenOverlay } from "./removeExitFullscreenOverlay.js";
import {
    resolveScreenfullRuntime,
    type ScreenfullRuntime,
} from "./screenfullRuntime.js";
import { getRendererElectronApi } from "../../runtime/electronApiRuntime.js";
import type { ElectronAPI } from "../../../shared/preloadApi.js";
import { getAddFullScreenButtonRuntime } from "./addFullScreenButtonRuntime.js";

type ElectronFullscreenAPI = Partial<Pick<ElectronAPI, "setFullScreen">>;

type StoredEventHandler = (event: Event) => void;

type VendorFullscreenDocument = Document & {
    MSFullscreenElement?: Element | null;
    mozFullScreenElement?: Element | null;
    msFullscreenElement?: Element | null;
    msExitFullscreen?: () => Promise<void> | void;
    webkitExitFullscreen?: () => Promise<void> | void;
    webkitFullscreenElement?: Element | null;
    mozCancelFullScreen?: () => Promise<void> | void;
};

type VendorFullscreenElement = HTMLElement & {
    msRequestFullscreen?: () => Promise<void> | void;
    mozRequestFullScreen?: () => Promise<void> | void;
    webkitRequestFullscreen?: () => Promise<void> | void;
};

// Constants for better maintainability
const FULLSCREEN_BUTTON_ID = "global-fullscreen-btn";
const FULLSCREEN_WRAPPER_ID = "global-fullscreen-btn-wrapper";
const NATIVE_FULLSCREEN_EVENTS = [
    "fullscreenchange",
    "webkitfullscreenchange",
    "mozfullscreenchange",
    "MSFullscreenChange",
];
const SVG_NS = "http://www.w3.org/2000/svg";
let isWindowFullscreenRequested = false;
let fullscreenKeydownHandler: null | StoredEventHandler = null;
let nativeFullscreenChangeHandler: null | StoredEventHandler = null;
const addFullScreenButtonRuntime = getAddFullScreenButtonRuntime();

const getElectronAPI = (): ElectronFullscreenAPI | undefined =>
    getRendererElectronApi(isElectronFullscreenApi) ?? undefined;

function isElectronFullscreenApi(
    value: unknown
): value is ElectronFullscreenAPI {
    if (value === null || typeof value !== "object") {
        return false;
    }

    const setFullScreen = (value as Record<string, unknown>)["setFullScreen"];
    return setFullScreen === undefined || typeof setFullScreen === "function";
}

const getScreenfullInstance = (): ScreenfullRuntime | undefined =>
    resolveScreenfullRuntime();
const isFullscreenActive = (): boolean => {
    const instance = getScreenfullInstance();
    if (instance && instance.isEnabled) {
        return Boolean(instance.isFullscreen);
    }
    const doc = document as VendorFullscreenDocument;
    return Boolean(
        document.fullscreenElement ||
        doc.webkitFullscreenElement ||
        doc.mozFullScreenElement ||
        doc.msFullscreenElement
    );
};

/** Detect whether chart fullscreen is active (native or overlay fallback). */
const isChartFullscreenActive = (): boolean => {
    const doc = document as VendorFullscreenDocument;
    const fullscreenElement =
        document.fullscreenElement ||
        doc.webkitFullscreenElement ||
        doc.mozFullScreenElement ||
        doc.msFullscreenElement;

    const nativeChartFullscreen =
        fullscreenElement instanceof HTMLElement &&
        fullscreenElement.classList.contains("chart-wrapper");

    const overlayChartFullscreen =
        document.querySelector(".chart-wrapper--overlay-fullscreen") !== null;

    return nativeChartFullscreen || overlayChartFullscreen;
};
/** Adds a global fullscreen toggle button for the active tab content. */
export function addFullScreenButton(): void {
    try {
        if (document.getElementById(FULLSCREEN_WRAPPER_ID)) {
            logWithContext(
                "Fullscreen button already exists, skipping creation"
            );
            return;
        }
        const screenfull = getScreenfullInstance();
        if (!screenfull || !screenfull.isEnabled) {
            const wrapper = document.createElement("div");
            wrapper.className = "fullscreen-btn-wrapper";
            wrapper.id = FULLSCREEN_WRAPPER_ID;
            const btn = document.createElement("button");
            btn.id = FULLSCREEN_BUTTON_ID;
            btn.className = "fullscreen-btn improved themed-btn";
            btn.dataset["tooltip"] = "Fullscreen (F11)";
            btn.setAttribute("aria-label", "Toggle full screen mode");
            btn.setAttribute("role", "button");
            btn.setAttribute("tabindex", "0");
            btn.style.pointerEvents = "auto";
            btn.append(createFullscreenIconWrapper("enter"));
            const buttonListener =
                addFullScreenButtonRuntime.createAbortController();
            btn.addEventListener("click", () => nativeToggleFullscreen(), {
                signal: buttonListener.signal,
            });
            wrapper.append(btn);
            document.body.append(wrapper);
            logWithContext(
                "Screenfull not available or not enabled; using native fullscreen fallback",
                "warn"
            );
            return;
        }
        const wrapper = document.createElement("div");
        wrapper.className = "fullscreen-btn-wrapper";
        wrapper.id = FULLSCREEN_WRAPPER_ID;
        const btn = document.createElement("button");
        btn.id = FULLSCREEN_BUTTON_ID;
        btn.className = "fullscreen-btn improved themed-btn";
        btn.dataset["tooltip"] = "Fullscreen (F11)";
        btn.setAttribute("aria-label", "Toggle full screen mode");
        btn.setAttribute("role", "button");
        btn.setAttribute("tabindex", "0");
        btn.style.pointerEvents = "auto";
        btn.append(createFullscreenIconWrapper("enter"));
        const buttonListener =
            addFullScreenButtonRuntime.createAbortController();
        btn.addEventListener("click", handleFullscreenToggle, {
            signal: buttonListener.signal,
        });
        wrapper.append(btn);
        document.body.append(wrapper);
        logWithContext("Fullscreen button created successfully");
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        logWithContext(
            `Failed to create fullscreen button: ${message}`,
            "error"
        );
    }
}
/** Sets up fullscreen state listeners, F11 handling, and initialization. */
export function setupFullscreenListeners(): void {
    try {
        const screenfull = getScreenfullInstance();
        if (fullscreenKeydownHandler) {
            addFullScreenButtonRuntime.removeWindowEventListener(
                "keydown",
                fullscreenKeydownHandler
            );
            fullscreenKeydownHandler = null;
        }
        if (nativeFullscreenChangeHandler) {
            for (const evt of NATIVE_FULLSCREEN_EVENTS) {
                addFullScreenButtonRuntime.removeDocumentEventListener(
                    evt,
                    nativeFullscreenChangeHandler
                );
            }
            nativeFullscreenChangeHandler = null;
        }
        addFullScreenButtonRuntime.removeWindowEventListener(
            "DOMContentLoaded",
            handleDOMContentLoaded
        );
        if (screenfull && screenfull.isEnabled) {
            if (typeof screenfull.off === "function") {
                try {
                    screenfull.off("change", handleFullscreenStateChange);
                } catch (error) {
                    void error;
                    /* ignore off errors */
                }
            }
            screenfull.on("change", handleFullscreenStateChange);
            const keyHandler = (event: Event): void => {
                if (event instanceof KeyboardEvent) {
                    handleKeyboardShortcuts(event);
                }
            };
            const keyListener =
                addFullScreenButtonRuntime.createAbortController();
            addFullScreenButtonRuntime.addWindowEventListener(
                "keydown",
                keyHandler,
                {
                    signal: keyListener.signal,
                }
            );
            fullscreenKeydownHandler = keyHandler;
            nativeFullscreenChangeHandler = null;
            if (document.readyState === "loading") {
                const domReadyListener =
                    addFullScreenButtonRuntime.createAbortController();
                addFullScreenButtonRuntime.addWindowEventListener(
                    "DOMContentLoaded",
                    handleDOMContentLoaded,
                    { signal: domReadyListener.signal }
                );
            } else {
                handleDOMContentLoaded();
            }
            logWithContext("Fullscreen listeners setup completed (screenfull)");
            return;
        }
        const nativeHandler = () => {
            try {
                handleFullscreenStateChange();
            } catch (error) {
                const message =
                    error instanceof Error ? error.message : String(error);
                logWithContext(
                    `Error in native fullscreen change handler: ${message}`,
                    "error"
                );
            }
        };
        const nativeListener =
            addFullScreenButtonRuntime.createAbortController();
        for (const evt of NATIVE_FULLSCREEN_EVENTS) {
            addFullScreenButtonRuntime.addDocumentEventListener(
                evt,
                nativeHandler,
                {
                    signal: nativeListener.signal,
                }
            );
        }
        nativeFullscreenChangeHandler = nativeHandler;
        const keyHandler = (event: Event): void => {
            if (event instanceof KeyboardEvent) {
                handleKeyboardShortcuts(event);
            }
        };
        const keyListener =
            addFullScreenButtonRuntime.createAbortController();
        addFullScreenButtonRuntime.addWindowEventListener(
            "keydown",
            keyHandler,
            {
                signal: keyListener.signal,
            }
        );
        fullscreenKeydownHandler = keyHandler;
        if (document.readyState === "loading") {
            const domReadyListener =
                addFullScreenButtonRuntime.createAbortController();
            addFullScreenButtonRuntime.addWindowEventListener(
                "DOMContentLoaded",
                handleDOMContentLoaded,
                { signal: domReadyListener.signal }
            );
        } else {
            handleDOMContentLoaded();
        }
        logWithContext(
            "Using native fullscreen listeners (screenfull not enabled)"
        );
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        logWithContext(
            `Failed to setup fullscreen listeners: ${message}`,
            "error"
        );
    }
}

/**
 * Reset fullscreen listener state for isolated tests.
 */
export function resetFullscreenListenerStateForTests(): void {
    if (fullscreenKeydownHandler) {
        addFullScreenButtonRuntime.removeWindowEventListener(
            "keydown",
            fullscreenKeydownHandler
        );
        fullscreenKeydownHandler = null;
    }

    if (nativeFullscreenChangeHandler) {
        for (const eventName of NATIVE_FULLSCREEN_EVENTS) {
            addFullScreenButtonRuntime.removeDocumentEventListener(
                eventName,
                nativeFullscreenChangeHandler
            );
        }
        nativeFullscreenChangeHandler = null;
    }

    addFullScreenButtonRuntime.removeWindowEventListener(
        "DOMContentLoaded",
        handleDOMContentLoaded
    );
    isWindowFullscreenRequested = false;
}
/** Creates the icon wrapper used by the fullscreen button. */
function createFullscreenIconWrapper(state: "enter" | "exit"): HTMLSpanElement {
    const icon = document.createElement("span");
    icon.className = "fullscreen-icon";
    icon.setAttribute("aria-hidden", "true");
    icon.append(
        state === "enter"
            ? createEnterFullscreenIcon()
            : createExitFullscreenIcon()
    );

    return icon;
}

/** Creates SVG icon for fullscreen enter state. */
function createEnterFullscreenIcon(): SVGSVGElement {
    return createFullscreenSvg("Enter Fullscreen", [
        "M5 9V5H9",
        "M19 5H23V9",
        "M23 19V23H19",
        "M9 23H5V19",
    ]);
}
/** Creates SVG icon for fullscreen exit state. */
function createExitFullscreenIcon(): SVGSVGElement {
    return createFullscreenSvg("Exit Fullscreen", [
        "M9 5V9H5",
        "M23 9V5H19",
        "M19 23V19H23",
        "M5 19V23H9",
    ]);
}

/** Creates an SVG from path definitions. */
function createFullscreenSvg(
    titleText: string,
    paths: string[]
): SVGSVGElement {
    const svg = document.createElementNS(SVG_NS, "svg");
    svg.classList.add("inline-svg");
    svg.setAttribute("width", "28");
    svg.setAttribute("height", "28");
    svg.setAttribute("viewBox", "0 0 28 28");
    svg.setAttribute("fill", "none");

    const title = document.createElementNS(SVG_NS, "title");
    title.textContent = titleText;
    svg.append(title);

    for (const d of paths) {
        const path = document.createElementNS(SVG_NS, "path");
        path.setAttribute("d", d);
        path.setAttribute("stroke", "currentColor");
        path.setAttribute("stroke-width", "2");
        path.setAttribute("stroke-linecap", "round");
        path.setAttribute("stroke-linejoin", "round");
        svg.append(path);
    }

    return svg;
}
/** Handles DOM content loaded initialization. */
function handleDOMContentLoaded(): void {
    try {
        addFullScreenButton();
        // Watch for file load state changes
        const observer = new MutationObserver(() => {
            updateFullscreenButtonState();
        });
        observer.observe(document.body, {
            attributes: true,
            attributeFilter: ["class"],
        });
        // Initial state check
        updateFullscreenButtonState();
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        logWithContext(
            `Error in DOMContentLoaded handler: ${message}`,
            "error"
        );
    }
}
/** Handles fullscreen state change events. */
function handleFullscreenStateChange(): void {
    try {
        const activeContent = getActiveTabContent();
        const globalBtn = document.getElementById(FULLSCREEN_BUTTON_ID);
        const screenfull = getScreenfullInstance();
        const fullscreenEnabled = screenfull && screenfull.isEnabled;
        const nativeFullscreen = isFullscreenActive();
        if (nativeFullscreen) {
            isWindowFullscreenRequested = true;
        } else if (
            (!fullscreenEnabled || !screenfull?.isFullscreen) &&
            isWindowFullscreenRequested
        ) {
            isWindowFullscreenRequested = false;
        }
        const isFullscreen =
            isWindowFullscreenRequested ||
            nativeFullscreen ||
            (fullscreenEnabled ? Boolean(screenfull.isFullscreen) : false);
        if (isFullscreen) {
            if (activeContent) {
                addExitFullscreenOverlay(activeContent as HTMLElement);
                logWithContext(`Added exit overlay for: ${activeContent.id}`);
            }
            if (globalBtn) {
                updateButtonState(globalBtn, true);
            }
            const contentBtn =
                activeContent &&
                document.getElementById(`${activeContent.id}-fullscreen-btn`);
            if (contentBtn) {
                updateButtonState(contentBtn, true);
            }
        } else {
            if (activeContent) {
                removeExitFullscreenOverlay(activeContent as HTMLElement);
                logWithContext(`Removed exit overlay for: ${activeContent.id}`);
            }
            if (globalBtn) {
                updateButtonState(globalBtn, false);
            }
            const contentBtn =
                activeContent &&
                document.getElementById(`${activeContent.id}-fullscreen-btn`);
            if (contentBtn) {
                updateButtonState(contentBtn, false);
            }
        }
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        logWithContext(
            `Error handling fullscreen state change: ${message}`,
            "error"
        );
    }
}
/** Handles fullscreen toggle button click events. */
function handleFullscreenToggle(event: Event): void {
    try {
        event.stopPropagation();
        const activeContent = getActiveTabContent();
        const electronAPI = getElectronAPI();

        if (electronAPI && typeof electronAPI.setFullScreen === "function") {
            isWindowFullscreenRequested = !isWindowFullscreenRequested;
            electronAPI.setFullScreen(isWindowFullscreenRequested);
            logWithContext(
                `${isWindowFullscreenRequested ? "Entering" : "Exiting"} window fullscreen via IPC`
            );

            const globalBtn = document.getElementById(FULLSCREEN_BUTTON_ID);
            if (globalBtn) {
                updateButtonState(globalBtn, isWindowFullscreenRequested);
            }
            return;
        }

        if (!activeContent) {
            logWithContext(
                "No active tab content found for fullscreen toggle",
                "warn"
            );
            nativeToggleFullscreen(document.documentElement);
            return;
        }

        nativeToggleFullscreen(activeContent as HTMLElement);
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        logWithContext(`Failed to toggle fullscreen: ${message}`, "error");
    }
}
/** Handles keyboard shortcuts for fullscreen functionality. */
function handleKeyboardShortcuts(event: KeyboardEvent): void {
    try {
        if (event.key === "Escape") {
            // Let chart-level fullscreen handlers own Escape when chart fullscreen is active.
            if (isChartFullscreenActive()) {
                return;
            }

            const electronAPI = getElectronAPI();
            if (
                electronAPI &&
                typeof electronAPI.setFullScreen === "function" &&
                isWindowFullscreenRequested
            ) {
                event.preventDefault();
                isWindowFullscreenRequested = false;
                electronAPI.setFullScreen(false);
                logWithContext("Escape: Exiting window fullscreen via IPC");

                const globalBtn = document.getElementById(FULLSCREEN_BUTTON_ID);
                if (globalBtn) {
                    updateButtonState(globalBtn, false);
                }

                const activeContent = getActiveTabContent();
                if (activeContent) {
                    removeExitFullscreenOverlay(activeContent as HTMLElement);
                }
                return;
            }
        }

        if (event.key === "F11") {
            event.preventDefault();
            const activeContent = getActiveTabContent();
            const electronAPI = getElectronAPI();

            if (
                electronAPI &&
                typeof electronAPI.setFullScreen === "function"
            ) {
                isWindowFullscreenRequested = !isWindowFullscreenRequested;
                electronAPI.setFullScreen(isWindowFullscreenRequested);
                logWithContext(
                    `F11: ${isWindowFullscreenRequested ? "Entering" : "Exiting"} window fullscreen via IPC`
                );

                const globalBtn = document.getElementById(FULLSCREEN_BUTTON_ID);
                if (globalBtn) {
                    updateButtonState(globalBtn, isWindowFullscreenRequested);
                }
                return;
            }

            if (!activeContent) {
                logWithContext(
                    "No active content for F11 fullscreen toggle; using document root",
                    "warn"
                );
            }
            nativeToggleFullscreen(
                activeContent instanceof HTMLElement
                    ? activeContent
                    : document.documentElement
            );
        }
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        logWithContext(`Error handling keyboard shortcut: ${message}`, "error");
    }
}
/** Logs messages with context for fullscreen operations. */
function logWithContext(
    message: string,
    level: "error" | "info" | "warn" = "info"
): void {
    const prefix = "[FullscreenButton]";
    try {
        switch (level) {
            case "error": {
                console.error(`${prefix} ${message}`);
                break;
            }
            case "warn": {
                console.warn(`${prefix} ${message}`);
                break;
            }
            default: {
                console.log(`${prefix} ${message}`);
            }
        }
    } catch (error) {
        void error;
        // Silently fail if logging encounters an error
    }
}
/**
 * Native fullscreen fallback when screenfull is unavailable
 */
function nativeToggleFullscreen(target?: Document | HTMLElement): void {
    try {
        const activeContent =
            target instanceof HTMLElement ? target : getActiveTabContent();
        const doc = document as VendorFullscreenDocument;
        const docEl = (activeContent ||
            document.documentElement) as VendorFullscreenElement;
        const isFs = Boolean(
            document.fullscreenElement ||
            doc.webkitFullscreenElement ||
            doc.mozFullScreenElement ||
            doc.msFullscreenElement
        );
        if (isFs) {
            const exit =
                document.exitFullscreen ||
                doc.webkitExitFullscreen ||
                doc.mozCancelFullScreen ||
                doc.msExitFullscreen;
            if (typeof exit === "function") exit.call(document);
            isWindowFullscreenRequested = false;
            logWithContext("Exiting fullscreen mode (native fallback)");
        } else {
            const req =
                docEl.requestFullscreen ||
                docEl.webkitRequestFullscreen ||
                docEl.mozRequestFullScreen ||
                docEl.msRequestFullscreen;
            if (typeof req === "function") req.call(docEl);
            isWindowFullscreenRequested = true;
            logWithContext("Entering fullscreen mode (native fallback)");
        }
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        logWithContext(
            `Native fullscreen fallback failed: ${message}`,
            "error"
        );
    }
}
/** Updates the fullscreen button icon and title based on current state. */
function updateButtonState(button: HTMLElement, isFullscreen: boolean): void {
    try {
        const icon = button.querySelector(".fullscreen-icon");
        if (!icon) {
            logWithContext("Fullscreen icon element not found", "warn");
            return;
        }
        if (isFullscreen) {
            button.title = "Exit Full Screen (F11)";
            button.setAttribute("aria-label", "Exit full screen mode");
            icon.replaceChildren(createExitFullscreenIcon());
        } else {
            button.title = "Toggle Full Screen (F11)";
            button.setAttribute("aria-label", "Enter full screen mode");
            icon.replaceChildren(createEnterFullscreenIcon());
        }
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        logWithContext(`Failed to update button state: ${message}`, "error");
    }
}
// logWithContext moved above nativeToggleFullscreen to satisfy lint ordering
/** Updates fullscreen button state based on whether a file is loaded. */
function updateFullscreenButtonState(): void {
    const btn = document.getElementById(FULLSCREEN_BUTTON_ID);
    if (!btn) return;
    const hasFile = document.body.classList.contains("app-has-file");
    btn.setAttribute("tabindex", hasFile ? "0" : "-1");
    btn.dataset["tooltip"] = hasFile ? "Fullscreen (F11)" : "Load a file first";
}
