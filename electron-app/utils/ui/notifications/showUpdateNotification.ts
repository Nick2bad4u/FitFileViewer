/** Specialized utility for showing update-related notifications with actions. */

import { createRendererLogger } from "../../logging/rendererLogger.js";
import { getRendererElectronApi } from "../../runtime/electronApiRuntime.js";
import { addEventListenerWithCleanup } from "../events/eventListenerManager.js";
import type { ElectronAPI } from "../../../shared/preloadApi.js";
import {
    getNotificationTimerRuntime,
    type NotificationTimerHandle,
} from "./notificationTimerRuntime.js";
import { getShowUpdateNotificationRuntime } from "./showUpdateNotificationRuntime.js";

type UpdateNotificationAction = boolean | string;

type ElectronUpdateAPI = Partial<Pick<ElectronAPI, "installUpdate">>;

// Constants for better maintainability
const BUTTON_TEXTS = {
        LATER: "Later",
        RESTART_UPDATE: "Restart & Update",
    } as const,
    LOG_SCOPE = "ShowUpdateNotification",
    NOTIFICATION_CONSTANTS = {
        BUTTON_CLASS: "themed-btn",
        BUTTON_MARGIN: "10px",
        DEFAULT_DURATION: 6000,
        DEFAULT_TYPE: "info",
        NOTIFICATION_ID: "notification",
        UPDATE_DOWNLOADED: "update-downloaded",
    } as const;

const log = createRendererLogger(LOG_SCOPE);
const notificationTimerRuntime = getNotificationTimerRuntime();
const showUpdateNotificationRuntime = getShowUpdateNotificationRuntime();

const activeAutoHideTimers = new WeakMap<
    HTMLElement,
    NotificationTimerHandle
>();

/**
 * Shows update notifications with enhanced features and error handling.
 *
 * @example // Basic notification showUpdateNotification("Update available",
 * "info");
 *
 * @example // Update downloaded notification with restart option
 * showUpdateNotification( "Update downloaded", "success", 0,
 * "update-downloaded" );
 *
 * @example // Simple update available with action
 * showUpdateNotification("Update ready", "info", 6000, true);
 *
 * @param message - The notification message to display.
 * @param type - Notification type.
 * @param duration - Auto-hide duration in milliseconds; 0 means no auto-hide.
 * @param withAction - Action type: false, true, or "update-downloaded".
 */
export function showUpdateNotification(
    message: string,
    type: string = NOTIFICATION_CONSTANTS.DEFAULT_TYPE,
    duration: number = NOTIFICATION_CONSTANTS.DEFAULT_DURATION,
    withAction: UpdateNotificationAction = false
): void {
    try {
        log("info", "Showing update notification", {
            duration,
            message,
            type,
            withAction,
        });

        // Get and validate notification element
        const notification = getNotificationElement();
        if (!notification) {
            return;
        }

        // Clear previous content
        clearNotificationContent(notification);

        // Set notification properties
        notification.className = `notification ${type}`;
        notification.style.display = "block";

        // Create message span
        const msgSpan = showUpdateNotificationRuntime.createElement("span");
        msgSpan.textContent = message;
        notification.append(msgSpan);

        // Handle different action types
        if (withAction === NOTIFICATION_CONSTANTS.UPDATE_DOWNLOADED) {
            createUpdateDownloadedButtons(notification);
        } else if (withAction) {
            createUpdateActionButton(notification);
        }

        // Set up auto-hide if needed
        if (!withAction || withAction === true) {
            setupAutoHide(notification, duration);
        }

        log("info", "Update notification displayed successfully");
    } catch (error) {
        log("error", "Failed to show update notification", {
            duration,
            error: getErrorMessage(error),
            message,
            type,
            withAction,
        });
    }
}

/** Clear notification content. */
function clearNotificationContent(notification: HTMLElement): void {
    try {
        while (notification.firstChild) {
            notification.firstChild.remove();
        }
    } catch (error) {
        log("error", "Failed to clear notification content", {
            error: getErrorMessage(error),
        });
    }
}

/**
 * Create a themed button element.
 *
 * @returns Button element.
 */
function createThemedButton(
    text: string,
    clickHandler: EventListener,
    styles: Partial<CSSStyleDeclaration> = {}
): HTMLElement | null {
    try {
        const button = showUpdateNotificationRuntime.createElement("button");
        button.textContent = text;
        button.className = NOTIFICATION_CONSTANTS.BUTTON_CLASS;
        addEventListenerWithCleanup(button, "click", clickHandler);

        // Apply additional styles
        Object.assign(button.style, styles);

        return button;
    } catch (error) {
        log("error", "Failed to create themed button", {
            error: getErrorMessage(error),
            text,
        });
        return null;
    }
}

/** Create simple update action button. */
function createUpdateActionButton(notification: HTMLElement): void {
    try {
        const button = createThemedButton(
            BUTTON_TEXTS.RESTART_UPDATE,
            handleUpdateInstall
        );

        if (button) {
            notification.append(button);
            log("info", "Update action button created");
        }
    } catch (error) {
        log("error", "Failed to create update action button", {
            error: getErrorMessage(error),
        });
    }
}

/** Create update downloaded action buttons. */
function createUpdateDownloadedButtons(notification: HTMLElement): void {
    try {
        const laterBtn = createThemedButton(
                BUTTON_TEXTS.LATER,
                () => hideNotification(notification),
                {
                    marginLeft: NOTIFICATION_CONSTANTS.BUTTON_MARGIN,
                }
            ),
            restartBtn = createThemedButton(
                BUTTON_TEXTS.RESTART_UPDATE,
                handleUpdateInstall
            );

        if (restartBtn && laterBtn) {
            notification.append(restartBtn);
            notification.append(laterBtn);
            log("info", "Update downloaded buttons created");
        }
    } catch (error) {
        log("error", "Failed to create update downloaded buttons", {
            error: getErrorMessage(error),
        });
    }
}

/**
 * Get notification element with validation.
 *
 * @returns Notification element or null if not found.
 */
function getNotificationElement(): HTMLElement | null {
    const notification = showUpdateNotificationRuntime.queryNotificationElement(
        `#${NOTIFICATION_CONSTANTS.NOTIFICATION_ID}`
    );
    if (!notification) {
        log("error", "Notification element not found in DOM");
        return null;
    }
    return notification;
}

/** Handle update installation with validation. */
function handleUpdateInstall(): void {
    try {
        if (validateElectronAPI()) {
            const installUpdate = getInstallUpdate();
            log("info", "Initiating update installation");
            installUpdate?.();
        } else {
            log("error", "Cannot install update - electronAPI not available");
        }
    } catch (error) {
        log("error", "Failed to install update", {
            error: getErrorMessage(error),
        });
    }
}

/** Hide notification with validation. */
function hideNotification(notification: HTMLElement): void {
    try {
        if (notification && notification.style) {
            clearAutoHideTimer(notification);
            notification.style.display = "none";
            log("info", "Notification hidden");
        }
    } catch (error) {
        log("error", "Failed to hide notification", {
            error: getErrorMessage(error),
        });
    }
}

/**
 * Set up auto-hide for a notification.
 */
function setupAutoHide(notification: HTMLElement, duration: number): void {
    try {
        clearAutoHideTimer(notification);
        const timeoutHandle = notificationTimerRuntime.setTimeout(() => {
            activeAutoHideTimers.delete(notification);
            hideNotification(notification);
        }, duration);
        activeAutoHideTimers.set(notification, timeoutHandle);

        log("info", "Auto-hide timeout set", { duration });
    } catch (error) {
        log("error", "Failed to setup auto-hide", {
            duration,
            error: getErrorMessage(error),
        });
    }
}

/**
 * Validate electronAPI availability.
 *
 * @returns True if electronAPI is available.
 */
function validateElectronAPI(): boolean {
    const hasAPI = getInstallUpdate() !== null;
    if (!hasAPI) {
        log("warn", "electronAPI.installUpdate not available");
    }
    return hasAPI;
}

function getInstallUpdate(): (() => void) | null {
    const installUpdate =
        getRendererElectronApi(isElectronUpdateApi)?.installUpdate;

    return typeof installUpdate === "function" ? installUpdate : null;
}

function isElectronUpdateApi(value: unknown): value is ElectronUpdateAPI {
    if (value === null || typeof value !== "object") {
        return false;
    }

    const installUpdate = (value as Record<string, unknown>)["installUpdate"];
    return installUpdate === undefined || typeof installUpdate === "function";
}

function clearAutoHideTimer(notification: HTMLElement): void {
    const timeoutHandle = activeAutoHideTimers.get(notification);
    if (timeoutHandle === undefined) {
        return;
    }

    notificationTimerRuntime.clearTimeout(timeoutHandle);
    activeAutoHideTimers.delete(notification);
}

function getErrorMessage(error: unknown): string {
    return error instanceof Error ? error.message : String(error);
}
