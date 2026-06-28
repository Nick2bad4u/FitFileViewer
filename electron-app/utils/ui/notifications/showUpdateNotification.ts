/** Specialized utility for showing update-related notifications with actions. */

import { createRendererLogger } from "../../logging/rendererLogger.js";
import {
    getRendererElectronApi,
    type RendererElectronApiScope,
} from "../../runtime/electronApiRuntime.js";
import { addEventListenerWithCleanup } from "../events/eventListenerManager.js";
import type { ElectronMenuEventApi } from "../../../shared/preloadApi.js";
import {
    getNotificationTimerRuntime,
    type NotificationTimerHandle,
    type NotificationTimerRuntime,
} from "./notificationTimerRuntime.js";
import {
    getShowUpdateNotificationRuntime,
    type ShowUpdateNotificationRuntime,
} from "./showUpdateNotificationRuntime.js";

type UpdateNotificationAction = boolean | string;

type ElectronUpdateAPI = {
    readonly installUpdate?: ElectronMenuEventApi["installUpdate"];
};

type ElectronUpdateApiMethods = Readonly<{
    readonly installUpdate?: ElectronMenuEventApi["installUpdate"];
}>;

type ShowUpdateNotificationOptions = {
    readonly electronApiScope?: RendererElectronApiScope | undefined;
    readonly notificationRuntime?: ShowUpdateNotificationRuntime | undefined;
    readonly timerRuntime?: NotificationTimerRuntime | undefined;
};

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

const activeAutoHideTimers = new WeakMap<
    HTMLElement,
    NotificationTimerHandle
>();
const activeAutoHideTimerRuntimes = new WeakMap<
    HTMLElement,
    NotificationTimerRuntime
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
    withAction: UpdateNotificationAction = false,
    options: ShowUpdateNotificationOptions = {}
): void {
    try {
        const notificationRuntime =
                options.notificationRuntime ??
                getShowUpdateNotificationRuntime(),
            timerRuntime =
                options.timerRuntime ?? getNotificationTimerRuntime();

        log("info", "Showing update notification", {
            duration,
            message,
            type,
            withAction,
        });

        // Get and validate notification element
        const notification = getNotificationElement(notificationRuntime);
        if (!notification) {
            return;
        }

        // Clear previous content
        clearNotificationContent(notification);

        // Set notification properties
        notification.className = `notification ${type}`;
        notification.style.display = "block";

        // Create message span
        const msgSpan = notificationRuntime.createElement("span");
        msgSpan.textContent = message;
        notification.append(msgSpan);

        // Handle different action types
        if (withAction === NOTIFICATION_CONSTANTS.UPDATE_DOWNLOADED) {
            createUpdateDownloadedButtons(notification, options, {
                notificationRuntime,
                timerRuntime,
            });
        } else if (withAction) {
            createUpdateActionButton(
                notification,
                options,
                notificationRuntime
            );
        }

        // Set up auto-hide if needed
        if (!withAction || withAction === true) {
            setupAutoHide(notification, duration, timerRuntime);
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
    notificationRuntime: ShowUpdateNotificationRuntime,
    styles: Partial<CSSStyleDeclaration> = {}
): HTMLElement | null {
    try {
        const button = notificationRuntime.createElement("button");
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
function createUpdateActionButton(
    notification: HTMLElement,
    options: ShowUpdateNotificationOptions,
    notificationRuntime: ShowUpdateNotificationRuntime
): void {
    try {
        const button = createThemedButton(
            BUTTON_TEXTS.RESTART_UPDATE,
            () => handleUpdateInstall(options),
            notificationRuntime
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
function createUpdateDownloadedButtons(
    notification: HTMLElement,
    options: ShowUpdateNotificationOptions,
    runtimes: {
        readonly notificationRuntime: ShowUpdateNotificationRuntime;
        readonly timerRuntime: NotificationTimerRuntime;
    }
): void {
    try {
        const laterBtn = createThemedButton(
                BUTTON_TEXTS.LATER,
                () => hideNotification(notification, runtimes.timerRuntime),
                runtimes.notificationRuntime,
                {
                    marginLeft: NOTIFICATION_CONSTANTS.BUTTON_MARGIN,
                }
            ),
            restartBtn = createThemedButton(
                BUTTON_TEXTS.RESTART_UPDATE,
                () => handleUpdateInstall(options),
                runtimes.notificationRuntime
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
function getNotificationElement(
    notificationRuntime: ShowUpdateNotificationRuntime
): HTMLElement | null {
    const notification = notificationRuntime.queryNotificationElement(
        `#${NOTIFICATION_CONSTANTS.NOTIFICATION_ID}`
    );
    if (!notification) {
        log("error", "Notification element not found in DOM");
        return null;
    }
    return notification;
}

/** Handle update installation with validation. */
function handleUpdateInstall({
    electronApiScope,
}: ShowUpdateNotificationOptions): void {
    try {
        if (validateElectronAPI(electronApiScope)) {
            const installUpdate = getInstallUpdate(electronApiScope);
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
function hideNotification(
    notification: HTMLElement,
    timerRuntime: NotificationTimerRuntime = getNotificationTimerRuntime()
): void {
    try {
        if (notification && notification.style) {
            clearAutoHideTimer(notification, timerRuntime);
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
function setupAutoHide(
    notification: HTMLElement,
    duration: number,
    timerRuntime: NotificationTimerRuntime
): void {
    try {
        clearAutoHideTimer(notification, timerRuntime);
        const timeoutHandle = timerRuntime.setTimeout(() => {
            activeAutoHideTimers.delete(notification);
            activeAutoHideTimerRuntimes.delete(notification);
            hideNotification(notification, timerRuntime);
        }, duration);
        activeAutoHideTimers.set(notification, timeoutHandle);
        activeAutoHideTimerRuntimes.set(notification, timerRuntime);

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
function validateElectronAPI(
    electronApiScope: RendererElectronApiScope | undefined
): boolean {
    const hasAPI = getInstallUpdate(electronApiScope) !== null;
    if (!hasAPI) {
        log("warn", "electronAPI.installUpdate not available");
    }
    return hasAPI;
}

function getInstallUpdate(
    electronApiScope: RendererElectronApiScope | undefined
): (() => void) | null {
    const electronAPI = getRendererElectronApi(
        isElectronUpdateApi,
        electronApiScope
    );
    if (!electronAPI) {
        return null;
    }

    const installUpdate = readElectronApiValue(() => electronAPI.installUpdate);

    return typeof installUpdate === "function" ? installUpdate : null;
}

function isElectronUpdateApi(value: unknown): value is ElectronUpdateAPI {
    if (!isElectronUpdateApiMethods(value)) {
        return false;
    }

    const candidate = readElectronApiValue(() => value.installUpdate);
    return candidate === undefined || typeof candidate === "function";
}

function isElectronUpdateApiMethods(
    value: unknown
): value is ElectronUpdateApiMethods {
    return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function readElectronApiValue<T>(readValue: () => T): T | undefined {
    try {
        return readValue();
    } catch {
        return undefined;
    }
}

function clearAutoHideTimer(
    notification: HTMLElement,
    timerRuntime: NotificationTimerRuntime = getNotificationTimerRuntime()
): void {
    const timeoutHandle = activeAutoHideTimers.get(notification);
    if (timeoutHandle === undefined) {
        return;
    }

    const runtime =
        activeAutoHideTimerRuntimes.get(notification) ?? timerRuntime;
    runtime.clearTimeout(timeoutHandle);
    activeAutoHideTimers.delete(notification);
    activeAutoHideTimerRuntimes.delete(notification);
}

function getErrorMessage(error: unknown): string {
    return error instanceof Error ? error.message : String(error);
}
