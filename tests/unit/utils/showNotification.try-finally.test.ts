import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import {
    __testResetNotifications,
    notificationQueue,
    processNotificationQueue,
} from "../../../electron-app/utils/ui/notifications/showNotification.js";
import { getShowNotificationRuntime } from "../../../electron-app/utils/ui/notifications/showNotificationRuntime.js";

type QueuedNotification = (typeof notificationQueue)[number];

function createNotificationFixture(): HTMLDivElement {
    const notificationElement = document.createElement("div");
    notificationElement.id = "notification";
    notificationElement.className = "notification";
    notificationElement.style.display = "none";
    document.body.replaceChildren(notificationElement);
    return notificationElement;
}

describe("showNotification.js - resolveShown error handling", () => {
    beforeEach(() => {
        vi.useFakeTimers();
        vi.restoreAllMocks();
        vi.spyOn(console, "warn").mockImplementation(() => {});
        vi.spyOn(console, "error").mockImplementation(() => {});
        // Mock requestAnimationFrame to execute immediately
        vi.spyOn(window, "requestAnimationFrame").mockImplementation((cb) => {
            cb(0);
            return 0;
        });
        createNotificationFixture();
        __testResetNotifications();
    });

    afterEach(() => {
        __testResetNotifications();
        vi.runOnlyPendingTimers();
        vi.useRealTimers();
        vi.restoreAllMocks();
        document.body.replaceChildren();
    });

    it("clears resolveShown and logs the error when the shown resolver throws", async () => {
        expect.assertions(6);

        const resolveShownError = new Error("resolveShown failure");
        const throwingResolve = vi.fn<() => void>(() => {
            throw resolveShownError;
        });

        const notification: QueuedNotification = {
            actions: [],
            ariaLabel: "Information",
            duration: 100,
            icon: "i",
            message: "Throwing resolveShown",
            onClick: undefined,
            resolveShown: throwingResolve,
            runtime: getShowNotificationRuntime(),
            timestamp: 1,
            type: "info",
        };

        notificationQueue.push(notification);

        await processNotificationQueue();

        const notificationElement = document.getElementById("notification");
        expect(notificationElement).toBeInstanceOf(HTMLDivElement);
        expect({
            className: notificationElement?.className,
            display: notificationElement?.style.display,
            message: notificationElement?.querySelector(".notification-message")
                ?.textContent,
            queueSize: notificationQueue.length,
            resolveShown: notification.resolveShown,
        }).toEqual({
            className: "notification info show",
            display: "flex",
            message: "Throwing resolveShown",
            queueSize: 0,
            resolveShown: undefined,
        });
        expect(throwingResolve).toHaveBeenCalledOnce();
        expect(console.error).toHaveBeenCalledTimes(2);
        expect(console.error).toHaveBeenNthCalledWith(
            1,
            "Error displaying notification:",
            resolveShownError
        );
        expect(console.error).toHaveBeenNthCalledWith(
            2,
            "Error displaying notification: resolveShown failure"
        );
    });
});
