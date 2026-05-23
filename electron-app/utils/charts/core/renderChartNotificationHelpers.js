import { isObjectRecord } from "./renderChartModuleHelpers.js";
function isNotificationInvoker(value) {
    return typeof value === "function";
}
function resolveNotificationInvoker(value) {
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
export function getNotificationSuppressed() {
    return globalThis.__FFV_suppressNotifications;
}
/**
 * Sets or clears the global chart-notification suppression flag.
 */
export function setNotificationSuppressed(value) {
    const chartGlobal = globalThis;
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
    message,
    type = "info",
    _duration = null,
    options = {}
) {
    try {
        const chartGlobal = globalThis;
        const suppress =
            options.silent === true || getNotificationSuppressed() === true;
        if (suppress) {
            return;
        }
        const globalNotifier = resolveNotificationInvoker(
            chartGlobal.showNotification
        );
        if (globalNotifier) {
            await globalNotifier(message, type);
            return;
        }
        const mod = await import("../../ui/notifications/showNotification.js");
        const importedNotifier = resolveNotificationInvoker(mod);
        if (importedNotifier) {
            await importedNotifier(message, type);
            return;
        }
        console.warn(
            "[ChartJS] Notification module missing showNotification export"
        );
    } catch (error) {
        console.warn("[ChartJS] notify() fallback failed:", error);
    }
}
