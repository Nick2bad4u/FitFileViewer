import { AppActions } from "../app/lifecycle/appActions.js";
import { UI_CONSTANTS } from "../config/constants.js";
import { performanceMonitor } from "../debug/stateDevTools.js";
import {
    getFitParseErrorMessage,
    unwrapFitParseMessages,
} from "../files/import/fitParsePayload.js";
import { sendFitFileToAltFitReader } from "../files/import/sendFitFileToAltFitReader.js";
import { renderDecodedFitData } from "../rendering/core/loadShowFitData.js";
import {
    getRendererElectronApi,
    type RendererElectronApiScope,
} from "../runtime/electronApiRuntime.js";
import { fitFileStateManager } from "../state/domain/fitFileState.js";
import {
    getRendererDragCounter,
    isRendererDropOverlayVisible,
    setRendererDragCounter,
    setRendererDropOverlayVisible,
} from "../state/domain/rendererDragDropState.js";
import {
    addEventListenerWithCleanup,
    validateElement,
} from "./mainUiDomUtils.js";
import {
    getDragDropHandlerRuntime,
    type DragDropHandlerRuntime,
    type DragDropHandlerRuntimeScope,
} from "./dragDropHandlerRuntime.js";
import { showNotification } from "./notifications/showNotification.js";
import type { ElectronAPI } from "../../shared/preloadApi.js";

type DroppedFile = File & { path?: string };

type ElectronApiLike = Required<Pick<ElectronAPI, "decodeFitFile">>;

type PerformanceMonitorLike = {
    endTimer?: (id: string) => void;
    isEnabled?: boolean | (() => boolean);
    startTimer?: (id: string) => void;
};

type DragDropHandlerOptions = {
    readonly electronApiScope?: RendererElectronApiScope | undefined;
    readonly runtimeScope?: DragDropHandlerRuntimeScope | undefined;
};

function getDragDropElectronApi(
    scope?: RendererElectronApiScope
): ElectronApiLike | null {
    return getRendererElectronApi(isDragDropElectronApi, scope);
}

function isDragDropElectronApi(value: unknown): value is ElectronApiLike {
    if (value === null || typeof value !== "object") {
        return false;
    }

    return (
        typeof (value as Partial<ElectronApiLike>).decodeFitFile === "function"
    );
}

function getPerformanceMonitor(): PerformanceMonitorLike {
    return performanceMonitor ?? {};
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
    private readonly electronApiScope: RendererElectronApiScope | undefined;
    private readonly runtime: DragDropHandlerRuntime;

    constructor({
        electronApiScope,
        runtimeScope,
    }: DragDropHandlerOptions = {}) {
        this.electronApiScope = electronApiScope;
        this.runtime = runtimeScope
            ? getDragDropHandlerRuntime(runtimeScope)
            : getDragDropHandlerRuntime();
        try {
            const initialCounter = getRendererDragCounter();
            if (Number.isFinite(initialCounter)) {
                this.dragCounter = initialCounter;
                this.dragCounterStateValue = initialCounter;
            }
            this.overlayVisible = isRendererDropOverlayVisible();
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
                if (!isRendererDropOverlayVisible()) {
                    return;
                }
            } catch {
                /* Ignore state sync errors */
            }
        }
        setRendererDropOverlayVisible(false, {
            silent: false,
            source: "DragDropHandler.hideDropOverlay",
        });
        this.overlayVisible = false;
    }

    async processDroppedFile(file: File): Promise<void> {
        const operationId = `process_dropped_file_${this.runtime.dateNow()}`,
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

            const electronAPI = getDragDropElectronApi(this.electronApiScope);
            if (!electronAPI) {
                const message =
                    "FIT file decoding is not supported in this environment.";
                showNotification(message, "error");
                return;
            }

            const result = await electronAPI.decodeFitFile(arrayBuffer);
            const parseErrorMessage = result
                ? getFitParseErrorMessage(result)
                : null;
            if (result && !parseErrorMessage) {
                const fitData = unwrapFitParseMessages(result);
                await renderDecodedFitData(fitData, filePath);
                sendFitFileToAltFitReader(arrayBuffer);
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
            const reader = this.runtime.createFileReader();
            const abortController = this.runtime.createAbortController();
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
        this.dragOverAnimationFrame = this.runtime.requestAnimationFrame(() => {
            this.dragOverAnimationFrame = null;
            this.dragOverScheduled = false;
            this.showDropOverlay();
        });
        if (this.dragOverAnimationFrame === null) {
            this.dragOverScheduled = false;
        }
    }

    private cancelScheduledDropOverlay(): void {
        if (this.dragOverAnimationFrame !== null) {
            this.runtime.cancelAnimationFrame(this.dragOverAnimationFrame);
            this.dragOverAnimationFrame = null;
        }
        this.dragOverScheduled = false;
    }

    setupEventListeners(): void {
        // Show overlay on dragenter, hide on dragleave/drop
        const documentTarget = this.runtime.getDocument();
        const documentBody = documentTarget?.body ?? null;
        const eventTarget = this.runtime.getEventTarget();

        addEventListenerWithCleanup(eventTarget, "dragenter", (e) => {
            if (e.target === documentTarget || e.target === documentBody) {
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

        addEventListenerWithCleanup(eventTarget, "dragleave", (e) => {
            if (e.target === documentTarget || e.target === documentBody) {
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

        addEventListenerWithCleanup(eventTarget, "dragover", (event) => {
            const e = event as DragEvent;
            e.preventDefault();
            if (e.dataTransfer) {
                e.dataTransfer.dropEffect = "copy";
            }
            this.scheduleDropOverlay();
        });

        addEventListenerWithCleanup(eventTarget, "drop", async (event) => {
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

        // Prevent app iframes from swallowing drag/drop events.
        this.setupIframeEventListeners();
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
                if (isRendererDropOverlayVisible()) {
                    return;
                }
            } catch {
                /* Ignore state sync errors */
            }
        }
        setRendererDropOverlayVisible(true, {
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
            setRendererDragCounter(value, { silent: false, source });
            this.dragCounterStateValue = value;
        } catch {
            /* Ignore drag counter sync errors */
        }
    }
}
