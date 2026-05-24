import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import {
    __testResetNotifications,
    notificationQueue,
    processNotificationQueue,
} from "../../../utils/ui/notifications/showNotification.js";

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
    const originalWarn = console.warn;
    const originalError = console.error;
    const originalRAF = window.requestAnimationFrame;

    beforeEach(() => {
        vi.useFakeTimers();
        vi.restoreAllMocks();
        console.warn = vi.fn();
        console.error = vi.fn();
        // Mock requestAnimationFrame to execute immediately
        window.requestAnimationFrame = (cb) => {
            cb(0);
            return 0;
        };
        createNotificationFixture();
        __testResetNotifications();
    });

    afterEach(() => {
        __testResetNotifications();
        vi.runOnlyPendingTimers();
        vi.useRealTimers();
        console.warn = originalWarn;
        console.error = originalError;
        window.requestAnimationFrame = originalRAF;
        document.body.replaceChildren();
    });

    it("clears resolveShown and logs the error when the shown resolver throws", async () => {
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
            timestamp: 1,
            type: "info",
        };

        notificationQueue.push(notification);

        await processNotificationQueue();

        const notificationElement = document.getElementById("notification");
        expect(notificationElement).toBeInstanceOf(HTMLDivElement);
        expect(notificationElement?.style.display).toBe("flex");
        expect(notificationElement?.className).toBe("notification info show");
        expect(
            notificationElement?.querySelector(".notification-message")
                ?.textContent
        ).toBe("Throwing resolveShown");
        expect(notificationQueue).toHaveLength(0);
        expect(throwingResolve).toHaveBeenCalledOnce();
        expect(notification.resolveShown).toBeUndefined();
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
