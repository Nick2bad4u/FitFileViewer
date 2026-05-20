import type {
    NotificationOptions,
    NotificationType,
} from "../../ui/notifications/showNotification.js";

type NotificationInvoker = (
    message: string,
    type?: NotificationType
) => Promise<unknown> | unknown;

interface RenderChartNotificationOptions extends NotificationOptions {
    silent?: boolean;
}

interface RenderChartNotificationGlobal {
    __FFV_suppressNotifications?: boolean;
    require?: unknown;
    showNotification?: unknown;
}

function isRecord(value: unknown): value is Record<string, unknown> {
    return value !== null && typeof value === "object";
}

function isNotificationInvoker(value: unknown): value is NotificationInvoker {
    return typeof value === "function";
}

function resolveNotificationInvoker(value: unknown): NotificationInvoker | null {
    if (isNotificationInvoker(value)) {
        return value;
    }

    if (!isRecord(value)) {
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
        isRecord(defaultExport) &&
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
    _duration: null | number = null,
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
            await globalNotifier(message, type);
            return;
        }

        if (typeof chartGlobal.require === "function") {
            try {
                const reqMod = chartGlobal.require(
                    "../../ui/notifications/showNotification.js"
                );
                const requiredNotifier = resolveNotificationInvoker(reqMod);
                if (requiredNotifier) {
                    await requiredNotifier(message, type);
                    return;
                }
            } catch {
                // Ignore and fall through to dynamic import.
            }
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
