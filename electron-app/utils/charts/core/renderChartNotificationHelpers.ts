import type {
    NotificationOptions,
    NotificationType,
} from "../../ui/notifications/showNotification.js";
import { isObjectRecord } from "./renderChartModuleHelpers.js";

type NotificationInvoker = (
    message: string,
    type?: NotificationType,
    duration?: null | number,
    options?: RenderChartNotificationOptions
) => unknown;

interface RenderChartNotificationOptions extends NotificationOptions {
    silent?: boolean;
}

let notificationSuppressed: boolean | undefined;

function isNotificationInvoker(value: unknown): value is NotificationInvoker {
    return typeof value === "function";
}

function resolveNotificationInvoker(
    value: unknown
): NotificationInvoker | null {
    if (isNotificationInvoker(value)) {
        return value;
    }

    if (!isObjectRecord(value)) {
        return null;
    }

    if (isNotificationInvoker(value["showNotification"])) {
        return value["showNotification"];
    }

    const defaultExport = value["default"];
    if (isNotificationInvoker(defaultExport)) {
        return defaultExport;
    }

    if (
        isObjectRecord(defaultExport) &&
        isNotificationInvoker(defaultExport["showNotification"])
    ) {
        return defaultExport["showNotification"];
    }

    return null;
}

/**
 * Returns the current chart-notification suppression flag.
 */
export function getNotificationSuppressed(): boolean | undefined {
    return notificationSuppressed;
}

/**
 * Sets or clears the chart-notification suppression flag.
 */
export function setNotificationSuppressed(value: boolean | undefined): void {
    notificationSuppressed = typeof value === "boolean" ? value : undefined;
}

/**
 * Lazily sends chart notifications without forcing notification modules into
 * the renderer import graph during test and SSR-style module evaluation.
 */
export async function notify(
    message: string,
    type: NotificationType = "info",
    duration: null | number = null,
    options: RenderChartNotificationOptions = {}
): Promise<void> {
    try {
        const suppress =
            options.silent === true || getNotificationSuppressed() === true;
        if (suppress) {
            return;
        }

        const mod = await import("../../ui/notifications/showNotification.js");
        const importedNotifier = resolveNotificationInvoker(mod);
        if (importedNotifier) {
            await invokeNotification(
                importedNotifier,
                message,
                type,
                duration,
                options
            );
            return;
        }

        console.warn(
            "[ChartJS] Notification module missing showNotification export"
        );
    } catch (error) {
        console.warn("[ChartJS] notify() fallback failed:", error);
    }
}

async function invokeNotification(
    notifier: NotificationInvoker,
    message: string,
    type: NotificationType,
    duration: null | number,
    options: RenderChartNotificationOptions
): Promise<void> {
    const hasOptions = Object.keys(options).length > 0;

    if (duration === null && !hasOptions) {
        await notifier(message, type);
        return;
    }

    if (!hasOptions) {
        await notifier(message, type, duration);
        return;
    }

    await notifier(message, type, duration, options);
}
