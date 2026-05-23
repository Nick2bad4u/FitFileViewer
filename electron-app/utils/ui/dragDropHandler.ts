import { AppActions } from "../app/lifecycle/appActions.js";
import { UI_CONSTANTS } from "../config/constants.js";
import { performanceMonitor } from "../debug/stateDevTools.js";
import {
    getFitParseErrorMessage,
    unwrapFitParseMessages,
} from "../files/import/fitParsePayload.js";
import { showFitData } from "../rendering/core/showFitData.js";
import { getState, setState } from "../state/core/stateManager.js";
import { fitFileStateManager } from "../state/domain/fitFileState.js";
import {
    addEventListenerWithCleanup,
    validateElectronAPI,
    validateElement,
} from "./mainUiDomUtils.js";
import { showNotification } from "./notifications/showNotification.js";
import type { FitDecodeResult } from "../../shared/fit";

type DroppedFile = File & { path?: string };

type ElectronApiLike = {
    decodeFitFile?: (buffer: ArrayBuffer) => Promise<FitDecodeResult>;
};

type DragDropGlobal = typeof globalThis & {
    electronAPI?: ElectronApiLike;
    enableDragAndDrop?: unknown;
    sendFitFileToAltFitReader?: (buffer: ArrayBuffer) => void;
};

type PerformanceMonitorLike = {
    endTimer?: (id: string) => void;
    isEnabled?: boolean | (() => boolean);
    startTimer?: (id: string) => void;
};

function getDragDropGlobal(): DragDropGlobal {
    return globalThis as DragDropGlobal;
}

function getPerformanceMonitor(): PerformanceMonitorLike {
    return (performanceMonitor ?? {}) as PerformanceMonitorLike;
}

function isPerformanceMonitorEnabled(monitor: PerformanceMonitorLike): boolean {
    return typeof monitor.isEnabled === "function"
        ? monitor.isEnabled()
        : Boolean(monitor.isEnabled);
}

function getDroppedFilePath(file: File): string {
    const { path } = file as DroppedFile;
    return typeof path === "string" && path.trim().length > 0
        ? path
        : file.name;
}

/** Coordinates global FIT-file drag/drop handling and drop overlay state. */
export class DragDropHandler {
    dragCounter = 0;
    dragCounterStateValue = 0;
    dragOverScheduled = false;
    overlayVisible = false;
    private dragOverAnimationFrame: null | number = null;

    constructor() {
        try {
            const initialCounter = Number(getState("ui.dragCounter")) || 0;
            if (Number.isFinite(initialCounter)) {
                this.dragCounter = initialCounter;
                this.dragCounterStateValue = initialCounter;
            }
            this.overlayVisible = Boolean(getState("ui.dropOverlay.visible"));
        } catch {
            /* Ignore state access issues during bootstrap */
        }
        this.setupEventListeners();
        // Initialize drag counter in state without redundant writes
        this.dragCounter = 0;
        this.syncDragCounter(0, "DragDropHandler.initialize");
        this.hideDropOverlay();
    }

    hideDropOverlay(): void {
        if (!this.overlayVisible) {
            try {
                if (!getState("ui.dropOverlay.visible")) {
                    return;
                }
            } catch {
                /* Ignore state sync errors */
            }
        }
        setState("ui.dropOverlay.visible", false, {
            silent: false,
            source: "DragDropHandler.hideDropOverlay",
        });
        this.overlayVisible = false;
    }

    async processDroppedFile(file: File): Promise<void> {
        const operationId = `process_dropped_file_${Date.now()}`,
            // Start performance monitoring
            pm = getPerformanceMonitor();
        if (
            isPerformanceMonitorEnabled(pm) &&
            typeof pm.startTimer === "function"
        ) {
            pm.startTimer(operationId);
        }

        if (!file || !file.name.toLowerCase().endsWith(".fit")) {
            const message =
                "Only .fit files are supported. Please drop a valid .fit file.";
            showNotification(message, "warning");
            return;
        }

        const filePath = getDroppedFilePath(file);

        try {
            // Update loading state
            AppActions.setFileOpening(true);

            // Start file loading in state manager
            if (typeof fitFileStateManager.startFileLoading === "function") {
                fitFileStateManager.startFileLoading(filePath);
            }

            const arrayBuffer = await this.readFileAsArrayBuffer(file);
            if (!arrayBuffer) {
                return;
            }

            if (!validateElectronAPI()) {
                const message =
                    "FIT file decoding is not supported in this environment.";
                showNotification(message, "error");
                return;
            }

            const result =
                await getDragDropGlobal().electronAPI?.decodeFitFile?.(
                    arrayBuffer
                );
            const parseErrorMessage = result
                ? getFitParseErrorMessage(result)
                : null;
            if (result && !parseErrorMessage) {
                const fitData = unwrapFitParseMessages(result);
                showFitData(fitData, filePath);
                getDragDropGlobal().sendFitFileToAltFitReader?.(arrayBuffer);
                showNotification(
                    `File "${file.name}" loaded successfully`,
                    "success"
                );
            } else {
                showNotification("Failed to load FIT file", "error");

                // Handle error in state manager
                if (fitFileStateManager) {
                    const errorMessage =
                        parseErrorMessage?.display ?? "Unknown error";
                    fitFileStateManager.handleFileLoadingError?.(
                        new Error(errorMessage)
                    );
                }
            }
        } catch (error) {
            console.error("[main-ui] Error processing dropped file:", error);
            const message =
                "An unexpected error occurred while processing the FIT file.";
            showNotification(message, "error");

            // Handle error in state manager
            if (fitFileStateManager) {
                fitFileStateManager.handleFileLoadingError?.(
                    error instanceof Error ? error : new Error(String(error))
                );
            }
        } finally {
            // Clear loading state
            AppActions.setFileOpening(false);

            // End performance monitoring
            const pm2 = getPerformanceMonitor();
            if (
                isPerformanceMonitorEnabled(pm2) &&
                typeof pm2.endTimer === "function"
            ) {
                pm2.endTimer(operationId);
            }
        }
    }

    readFileAsArrayBuffer(file: File): Promise<ArrayBuffer | null> {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            const abortController = new AbortController();
            const cleanup = (): void => {
                abortController.abort();
            };
            reader.addEventListener(
                "load",
                () => {
                    const { result } = reader;
                    cleanup();
                    resolve(result instanceof ArrayBuffer ? result : null);
                },
                { signal: abortController.signal }
            );
            reader.addEventListener(
                "error",
                () => {
                    const readError =
                        reader.error ?? new Error("Failed to read file");
                    cleanup();
                    reject(readError);
                },
                { signal: abortController.signal }
            );
            reader.readAsArrayBuffer(file);
        });
    }

    private scheduleDropOverlay(): void {
        if (this.dragOverScheduled) {
            return;
        }
        this.dragOverScheduled = true;
        this.dragOverAnimationFrame = requestAnimationFrame(() => {
            this.dragOverAnimationFrame = null;
            this.dragOverScheduled = false;
            this.showDropOverlay();
        });
    }

    private cancelScheduledDropOverlay(): void {
        if (this.dragOverAnimationFrame !== null) {
            cancelAnimationFrame(this.dragOverAnimationFrame);
            this.dragOverAnimationFrame = null;
        }
        this.dragOverScheduled = false;
    }

    setupEventListeners(): void {
        // Show overlay on dragenter, hide on dragleave/drop
        addEventListenerWithCleanup(globalThis, "dragenter", (e) => {
            if (e.target === document || e.target === document.body) {
                const nextCounter = this.dragCounter + 1;
                if (nextCounter !== this.dragCounter) {
                    this.dragCounter = nextCounter;
                    this.syncDragCounter(
                        nextCounter,
                        "DragDropHandler.dragenter"
                    );
                }
                this.showDropOverlay();
            }
        });

        addEventListenerWithCleanup(globalThis, "dragleave", (e) => {
            if (e.target === document || e.target === document.body) {
                const nextCounter = Math.max(this.dragCounter - 1, 0);
                if (nextCounter !== this.dragCounter) {
                    this.dragCounter = nextCounter;
                    this.syncDragCounter(
                        nextCounter,
                        "DragDropHandler.dragleave"
                    );
                }
                if (nextCounter <= 0) {
                    this.hideDropOverlay();
                    this.dragCounter = 0;
                    this.syncDragCounter(0, "DragDropHandler.dragleave.reset");
                }
            }
        });

        addEventListenerWithCleanup(globalThis, "dragover", (event) => {
            const e = event as DragEvent;
            e.preventDefault();
            if (e.dataTransfer) {
                e.dataTransfer.dropEffect = "copy";
            }
            this.scheduleDropOverlay();
        });

        addEventListenerWithCleanup(globalThis, "drop", async (event) => {
            const e = event as DragEvent;
            this.dragCounter = 0;
            this.syncDragCounter(0, "DragDropHandler.drop");
            this.cancelScheduledDropOverlay();
            this.hideDropOverlay();
            e.preventDefault();
            if (
                !e.dataTransfer ||
                !e.dataTransfer.files ||
                e.dataTransfer.files.length === 0
            ) {
                const message =
                    "No valid files detected. Please drop a .fit file.";
                showNotification(message, "warning");
                return;
            }

            const [first] = e.dataTransfer.files;
            if (first) {
                await this.processDroppedFile(first);
            }
        });

        // Prevent iframe from blocking drag/drop events if drag-and-drop is enabled
        if (getDragDropGlobal().enableDragAndDrop) {
            this.setupIframeEventListeners();
        }
    }

    setupIframeEventListeners(): void {
        const iframe = validateElement(UI_CONSTANTS.DOM_IDS.ALT_FIT_IFRAME);
        if (iframe) {
            addEventListenerWithCleanup(iframe, "dragover", (e) => {
                e.preventDefault();
                this.scheduleDropOverlay();
            });
            addEventListenerWithCleanup(iframe, "drop", (e) => {
                e.preventDefault();
                this.dragCounter = 0;
                this.syncDragCounter(0, "DragDropHandler.iframe.drop");
                this.cancelScheduledDropOverlay();
                this.hideDropOverlay();
                showNotification(
                    "Please drop files outside the iframe to process them.",
                    "info"
                );
            });
        }

        const zwiftIframe = validateElement(UI_CONSTANTS.DOM_IDS.ZWIFT_IFRAME);
        if (zwiftIframe) {
            addEventListenerWithCleanup(zwiftIframe, "dragover", (e) => {
                e.preventDefault();
                this.scheduleDropOverlay();
            });
            addEventListenerWithCleanup(zwiftIframe, "drop", (e) => {
                e.preventDefault();
                this.dragCounter = 0;
                this.syncDragCounter(0, "DragDropHandler.zwift.drop");
                this.cancelScheduledDropOverlay();
                this.hideDropOverlay();
                showNotification(
                    "Please drop files outside the ZwiftMap iframe to process them.",
                    "info"
                );
            });
        }
    }

    showDropOverlay(): void {
        if (this.overlayVisible) {
            try {
                if (getState("ui.dropOverlay.visible")) {
                    return;
                }
            } catch {
                /* Ignore state sync errors */
            }
        }
        setState("ui.dropOverlay.visible", true, {
            silent: false,
            source: "DragDropHandler.showDropOverlay",
        });
        this.overlayVisible = true;
    }

    syncDragCounter(value: number, source: string): void {
        if (value === this.dragCounterStateValue) {
            return;
        }
        try {
            setState("ui.dragCounter", value, { silent: false, source });
            this.dragCounterStateValue = value;
        } catch {
            /* Ignore drag counter sync errors */
        }
    }
}
