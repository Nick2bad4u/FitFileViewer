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

interface RenderChartNotificationGlobal {
    __FFV_suppressNotifications?: boolean;
    showNotification?: unknown;
}

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
 * Returns the current global chart-notification suppression flag.
 */
export function getNotificationSuppressed(): boolean | undefined {
    return (globalThis as RenderChartNotificationGlobal)
        .__FFV_suppressNotifications;
}

/**
 * Sets or clears the global chart-notification suppression flag.
 */
export function setNotificationSuppressed(value: boolean | undefined): void {
    const chartGlobal = globalThis as RenderChartNotificationGlobal;
    if (typeof value === "boolean") {
        chartGlobal.__FFV_suppressNotifications = value;
        return;
    }

    delete chartGlobal.__FFV_suppressNotifications;
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
        const chartGlobal = globalThis as RenderChartNotificationGlobal;
        const suppress =
            options.silent === true || getNotificationSuppressed() === true;
        if (suppress) {
            return;
        }

        const globalNotifier = resolveNotificationInvoker(
            chartGlobal.showNotification
        );
        if (globalNotifier) {
            await globalNotifier(message, type, duration, options);
            return;
        }

        const mod = await import("../../ui/notifications/showNotification.js");
        const importedNotifier = resolveNotificationInvoker(mod);
        if (importedNotifier) {
            await importedNotifier(message, type, duration, options);
            return;
        }

        console.warn(
            "[ChartJS] Notification module missing showNotification export"
        );
    } catch (error) {
        console.warn("[ChartJS] notify() fallback failed:", error);
    }
}
