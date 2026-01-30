import { AppActions } from "../app/lifecycle/appActions.js";
import { UI_CONSTANTS } from "../config/constants.js";
import { performanceMonitor } from "../debug/stateDevTools.js";
import { showFitData } from "../rendering/core/showFitData.js";
import { getState, setState } from "../state/core/stateManager.js";
import { fitFileStateManager } from "../state/domain/fitFileState.js";
import {
    addEventListenerWithCleanup,
    validateElectronAPI,
    validateElement,
} from "./mainUiDomUtils.js";
import { showNotification } from "./notifications/showNotification.js";

// Enhanced Drag and Drop UI and Global Handling with State Management
export class DragDropHandler {
    /** @type {number} */
    dragCounter = 0;
    /** @type {number} */
    dragCounterStateValue = 0;
    /** @type {boolean} */
    dragOverScheduled = false;
    /** @type {boolean} */
    overlayVisible = false;

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

    hideDropOverlay() {
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

    /** @param {File} file */
    async processDroppedFile(file) {
        const operationId = `process_dropped_file_${Date.now()}`,
            // Start performance monitoring
            /**
             * @type {{
             *     isEnabled?: () => boolean;
             *     startTimer?: (id: string) => void;
             *     endTimer?: (id: string) => void;
             * }}
             */
            pm = /** @type {any} */ (performanceMonitor) || {};
        if (
            (typeof pm.isEnabled === "function"
                ? pm.isEnabled()
                : Boolean(pm.isEnabled)) &&
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

        const filePath =
            typeof (/** @type {File & { path?: string }} */ (file).path) ===
                "string" &&
            /** @type {File & { path?: string }} */ (file).path.trim().length >
                0
                ? /** @type {File & { path?: string }} */ (file).path
                : file.name;

        try {
            // Update loading state
            AppActions.setFileOpening(true);

            // Start file loading in state manager
            if (fitFileStateManager) {
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

            const fitData =
                await globalThis.electronAPI.decodeFitFile(arrayBuffer);
            if (fitData && !fitData.error) {
                showFitData(fitData, filePath);
                // @ts-ignore ensured above
                globalThis.sendFitFileToAltFitReader(arrayBuffer);
                showNotification(
                    `File "${file.name}" loaded successfully`,
                    "success"
                );
            } else {
                showNotification("Failed to load FIT file", "error");

                // Handle error in state manager
                if (fitFileStateManager) {
                    fitFileStateManager.handleFileLoadingError(
                        new Error(fitData.error || "Unknown error")
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
                fitFileStateManager.handleFileLoadingError(
                    /** @type {Error} */ (
                        error instanceof Error
                            ? error
                            : new Error(String(error))
                    )
                );
            }
        } finally {
            // Clear loading state
            AppActions.setFileOpening(false);

            // End performance monitoring
            const pm2 = /** @type {any} */ (performanceMonitor) || {};
            if (
                (typeof pm2.isEnabled === "function"
                    ? pm2.isEnabled()
                    : Boolean(pm2.isEnabled)) &&
                typeof pm2.endTimer === "function"
            ) {
                pm2.endTimer(operationId);
            }
        }
    }

    /** @param {File} file */
    readFileAsArrayBuffer(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.addEventListener("load", (event) => {
                resolve(/** @type {any} */ (event).target?.result || null);
            });
            reader.onerror = (error) => reject(error);
            reader.readAsArrayBuffer(file);
        });
    }

    setupEventListeners() {
        // Show overlay on dragenter, hide on dragleave/drop
        addEventListenerWithCleanup(
            globalThis,
            "dragenter",
            (/** @type {Event} */ e) => {
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
            }
        );

        addEventListenerWithCleanup(
            globalThis,
            "dragleave",
            (/** @type {Event} */ e) => {
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
                        this.syncDragCounter(
                            0,
                            "DragDropHandler.dragleave.reset"
                        );
                    }
                }
            }
        );

        addEventListenerWithCleanup(
            globalThis,
            "dragover",
            (/** @type {Event} */ e) => {
                e.preventDefault();
                const de = /** @type {any} */ (e);
                if (de.dataTransfer) {
                    de.dataTransfer.dropEffect = "copy";
                }
                if (this.dragOverScheduled) {
                    return;
                }
                this.dragOverScheduled = true;
                requestAnimationFrame(() => {
                    this.dragOverScheduled = false;
                    this.showDropOverlay();
                });
            }
        );

        addEventListenerWithCleanup(
            globalThis,
            "drop",
            async (/** @type {Event} */ e) => {
                this.dragCounter = 0;
                this.syncDragCounter(0, "DragDropHandler.drop");
                this.dragOverScheduled = false;
                this.hideDropOverlay();
                e.preventDefault();
                const de = /** @type {any} */ (e);
                if (
                    !de.dataTransfer ||
                    !de.dataTransfer.files ||
                    de.dataTransfer.files.length === 0
                ) {
                    const message =
                        "No valid files detected. Please drop a .fit file.";
                    showNotification(message, "warning");
                    return;
                }

                const [first] = de.dataTransfer.files;
                if (first) {
                    await this.processDroppedFile(first);
                }
            }
        );

        // Prevent iframe from blocking drag/drop events if drag-and-drop is enabled
        if (/** @type {any} */ (globalThis).enableDragAndDrop) {
            this.setupIframeEventListeners();
        }
    }

    setupIframeEventListeners() {
        const iframe = validateElement(UI_CONSTANTS.DOM_IDS.ALT_FIT_IFRAME);
        if (iframe) {
            addEventListenerWithCleanup(iframe, "dragover", (e) => {
                e.preventDefault();
                if (this.dragOverScheduled) {
                    return;
                }
                this.dragOverScheduled = true;
                requestAnimationFrame(() => {
                    this.dragOverScheduled = false;
                    this.showDropOverlay();
                });
            });
            addEventListenerWithCleanup(iframe, "drop", (e) => {
                e.preventDefault();
                this.dragCounter = 0;
                this.syncDragCounter(0, "DragDropHandler.iframe.drop");
                this.dragOverScheduled = false;
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
                if (this.dragOverScheduled) {
                    return;
                }
                this.dragOverScheduled = true;
                requestAnimationFrame(() => {
                    this.dragOverScheduled = false;
                    this.showDropOverlay();
                });
            });
            addEventListenerWithCleanup(zwiftIframe, "drop", (e) => {
                e.preventDefault();
                this.dragCounter = 0;
                this.syncDragCounter(0, "DragDropHandler.zwift.drop");
                this.dragOverScheduled = false;
                this.hideDropOverlay();
                showNotification(
                    "Please drop files outside the ZwiftMap iframe to process them.",
                    "info"
                );
            });
        }
    }

    showDropOverlay() {
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

    syncDragCounter(value, source) {
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
