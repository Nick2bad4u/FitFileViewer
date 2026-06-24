import type { MainUiElectronApi } from "./mainUiElectronApi.js";

import { AppActions } from "../utils/app/lifecycle/appActions.js";
import { performanceMonitor } from "../utils/debug/stateDevTools.js";
import { fitFileStateManager } from "../utils/state/domain/fitFileState.js";
import { clearRendererActiveFileState } from "../utils/state/domain/rendererActiveFileState.js";
import { UIActions } from "../utils/state/domain/uiStateManager.js";
import { getElementByIdFlexible } from "../utils/ui/dom/elementIdUtils.js";
import {
    addEventListenerWithCleanup,
    validateElement,
} from "../utils/ui/mainUiDomUtils.js";
import { showNotification } from "../utils/ui/notifications/showNotification.js";

interface PerformanceMonitorLike {
    readonly endTimer?: (operationId: string) => void;
    readonly isEnabled?: (() => boolean) | boolean;
    readonly startTimer?: (operationId: string) => void;
}

export interface MainUiUnloadFlowOptions {
    readonly contentIds: readonly string[];
    readonly dateNow: () => number;
    readonly documentRef: Document;
    readonly getElectronAPI: () => MainUiElectronApi | null;
    readonly logMainUi: (
        level: "error" | "info" | "warn",
        message: string,
        ...args: unknown[]
    ) => void;
}

export interface MainUiUnloadRegistrationOptions {
    readonly electronAPI: MainUiElectronApi | null;
    readonly unloadButtonId: string;
    readonly unloadFitFile: () => void;
}

function isPerformanceMonitorEnabled(monitor: PerformanceMonitorLike): boolean {
    return typeof monitor.isEnabled === "function"
        ? monitor.isEnabled()
        : Boolean(monitor.isEnabled);
}

function clearContentAreas(
    documentRef: Document,
    contentIds: readonly string[]
) {
    for (const id of contentIds) {
        const element = getElementByIdFlexible(documentRef, id);
        if (element) {
            element.replaceChildren();
        }
    }
}

function clearFitFileDomainState(
    logMainUi: MainUiUnloadFlowOptions["logMainUi"]
): void {
    if (typeof fitFileStateManager.clearFileState !== "function") {
        return;
    }

    try {
        fitFileStateManager.clearFileState();
    } catch (error) {
        logMainUi(
            "warn",
            "[main-ui] Failed to clear fit file domain state",
            error
        );
    }
}

export function createMainUiUnloadFitFile({
    contentIds,
    dateNow,
    documentRef,
    getElectronAPI,
    logMainUi,
}: MainUiUnloadFlowOptions): () => void {
    return () => {
        const operationId = `unload_file_${dateNow()}`;
        const pm = performanceMonitor as PerformanceMonitorLike;
        const startTimer = pm.startTimer;

        if (
            isPerformanceMonitorEnabled(pm) &&
            typeof startTimer === "function"
        ) {
            startTimer.call(pm, operationId);
        }

        try {
            AppActions.clearData({
                notificationMessage: "File unloaded successfully",
            });
            clearFitFileDomainState(logMainUi);
            clearRendererActiveFileState({
                silent: false,
                source: "main-ui.unloadFitFile",
            });
            clearContentAreas(documentRef, contentIds);
            UIActions.showTab("map");

            const electronAPI = getElectronAPI();
            if (typeof electronAPI?.notifyFitFileLoaded === "function") {
                electronAPI.notifyFitFileLoaded(null);
            }

            logMainUi("info", "[main-ui] File unloaded successfully");
        } catch (error) {
            logMainUi("error", "[main-ui] Error unloading file:", error);
            void showNotification("Error unloading file", "error");
        } finally {
            const endTimer = pm.endTimer;
            if (
                isPerformanceMonitorEnabled(pm) &&
                typeof endTimer === "function"
            ) {
                endTimer.call(pm, operationId);
            }
        }
    };
}

export function registerMainUiUnloadHandlers({
    electronAPI,
    unloadButtonId,
    unloadFitFile,
}: MainUiUnloadRegistrationOptions): void {
    if (typeof electronAPI?.onUnloadFitFile === "function") {
        electronAPI.onUnloadFitFile(unloadFitFile);
    }

    const unloadBtn = validateElement(unloadButtonId);
    if (unloadBtn) {
        addEventListenerWithCleanup(unloadBtn, "click", unloadFitFile);
    }
}
