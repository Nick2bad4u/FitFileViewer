import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import {
    showNotification,
    notify,
    clearAllNotifications,
    notificationQueue,
    processNotificationQueue,
    __testResetNotifications,
} from "../../../electron-app/utils/ui/notifications/showNotification.js";

function createNotificationFixture(): HTMLDivElement {
    const notificationElement = document.createElement("div");
    notificationElement.id = "notification";
    notificationElement.className = "notification";
    notificationElement.style.display = "none";
    document.body.replaceChildren(notificationElement);
    return notificationElement;
}

function captureWindowErrors(): {
    errors: Error[];
    stop: () => void;
} {
    const errors: Error[] = [];
    const controller = new AbortController();
    const listener = (event: ErrorEvent): void => {
        event.preventDefault();
        errors.push(
            event.error instanceof Error
                ? event.error
                : new Error(event.message)
        );
    };

    window.addEventListener("error", listener, { signal: controller.signal });

    return {
        errors,
        stop: () => controller.abort(),
    };
}

describe("showNotification.js - error handling coverage", () => {
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
        vi.runOnlyPendingTimers();
        vi.useRealTimers();
        console.warn = originalWarn;
        console.error = originalError;
        window.requestAnimationFrame = originalRAF;
        document.body.replaceChildren();
        clearAllNotifications();
    });

    it("handles errors when resolveShown throws", async () => {
        // Craft a queued notification with a resolveShown that throws
        const throwingResolve = vi.fn<() => void>(() => {
            throw new Error("resolveShown failure");
        });

        const notification = {
            message: "Throwing resolveShown",
            type: "info",
            duration: 100,
            icon: "ℹ️",
            ariaLabel: "Information",
            onClick: undefined,
            actions: [],
            timestamp: Date.now(),
            resolveShown: throwingResolve,
        };

        // Queue and process
        notificationQueue.push(notification);
        await processNotificationQueue();

        const element = document.getElementById("notification");
        expect(element).toBeInstanceOf(HTMLDivElement);
        expect(element?.style.display).toBe("flex");
        expect(element?.className).toBe("notification info show");
        expect(
            element?.querySelector(".notification-message")?.textContent
        ).toBe("Throwing resolveShown");
        expect(notificationQueue).toHaveLength(0);
        expect(notification.resolveShown).toBeUndefined();

        // Error should be logged and queue processing should not crash
        expect(console.error).toHaveBeenCalledWith(
            "Error displaying notification:",
            expect.any(Error)
        );
    });

    it("handles errors during displayNotification process", async () => {
        // Create a spy that makes buildNotificationContent throw
        const mockError = new Error("Simulated error in displayNotification");
        vi.spyOn(document, "createElement").mockImplementationOnce(() => {
            throw mockError;
        });

        // This should trigger the catch block in processNotificationQueue
        await expect(
            showNotification("Display error test")
        ).resolves.toBeUndefined();

        const element = document.getElementById("notification");
        expect(element).toBeInstanceOf(HTMLDivElement);
        expect(element?.style.display).toBe("none");
        expect(element?.childElementCount).toBe(0);
        expect(notificationQueue).toHaveLength(0);

        // Error should be caught and logged
        expect(console.error).toHaveBeenCalledWith(
            "Error displaying notification:",
            expect.objectContaining({
                message: "Simulated error in displayNotification",
            })
        );
    });

    it("handles errors in notification click handlers", async () => {
        // Create a notification with an onClick handler that throws
        const errorHandler = vi.fn<() => void>().mockImplementation(() => {
            throw new Error("Error in click handler");
        });
        const captured = captureWindowErrors();

        await showNotification("Click error test", "info", undefined, {
            onClick: errorHandler,
            persistent: true,
        });

        const el = document.getElementById("notification")!;
        el.click();
        captured.stop();

        expect(errorHandler).toHaveBeenCalledOnce();
        expect(captured.errors).toHaveLength(1);
        expect(captured.errors[0]?.message).toBe("Error in click handler");
        expect(el.style.cursor).toBe("pointer");
        expect(el.style.display).toBe("flex");
        expect(el.classList.contains("show")).toBe(true);
        expect(el.querySelector(".notification-close")).toBeInstanceOf(
            HTMLButtonElement
        );
    });

    it("handles errors in action button click handlers", async () => {
        // Create action with handler that throws
        const errorActionHandler = vi
            .fn<() => void>()
            .mockImplementation(() => {
                throw new Error("Error in action handler");
            });
        const captured = captureWindowErrors();

        await notify.withActions("Action error test", "info", [
            { text: "Error Button", onClick: errorActionHandler },
        ]);

        const el = document.getElementById("notification")!;
        const btn = el.querySelector(
            ".notification-actions button"
        ) as HTMLButtonElement;

        expect(btn).toBeInstanceOf(HTMLButtonElement);
        expect(btn.textContent).toBe("Error Button");
        expect(btn.className).toBe("themed-btn");

        btn.click();
        captured.stop();

        expect(errorActionHandler).toHaveBeenCalledOnce();
        expect(captured.errors).toHaveLength(1);
        expect(captured.errors[0]?.message).toBe("Error in action handler");
        expect(el.style.display).toBe("flex");
        expect(el.classList.contains("show")).toBe(true);
        expect(el.querySelector(".notification-message")?.textContent).toBe(
            "Action error test"
        );
    });
});
