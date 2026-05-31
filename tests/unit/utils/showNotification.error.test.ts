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
        vi.runOnlyPendingTimers();
        vi.useRealTimers();
        vi.restoreAllMocks();
        document.body.replaceChildren();
        clearAllNotifications();
    });

    it("handles errors when resolveShown throws", async () => {
        expect.assertions(6);

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
        expect({
            queueSize: notificationQueue.length,
            resolveShown: notification.resolveShown,
        }).toEqual({
            queueSize: 0,
            resolveShown: undefined,
        });

        // Error should be logged and queue processing should not crash
        expect(console.error).toHaveBeenCalledWith(
            "Error displaying notification:",
            expect.any(Error)
        );
    });

    it("handles errors during displayNotification process", async () => {
        expect.assertions(4);

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
        expect({
            childCount: element?.childElementCount,
            display: element?.style.display,
            queueSize: notificationQueue.length,
        }).toEqual({
            childCount: 0,
            display: "none",
            queueSize: 0,
        });

        // Error should be caught and logged
        expect(console.error).toHaveBeenCalledWith(
            "Error displaying notification:",
            expect.objectContaining({
                message: "Simulated error in displayNotification",
            })
        );
    });

    it("handles errors in notification click handlers", async () => {
        expect.assertions(3);

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
        expect({
            capturedMessages: captured.errors.map((error) => error.message),
            cursor: el.style.cursor,
            display: el.style.display,
            visibleClassPresent: el.classList.contains("show"),
        }).toEqual({
            capturedMessages: ["Error in click handler"],
            cursor: "pointer",
            display: "flex",
            visibleClassPresent: true,
        });
        expect(el.querySelector(".notification-close")).toBeInstanceOf(
            HTMLButtonElement
        );
    });

    it("handles errors in action button click handlers", async () => {
        expect.assertions(6);

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
        expect({
            capturedMessages: captured.errors.map((error) => error.message),
            display: el.style.display,
            visibleClassPresent: el.classList.contains("show"),
        }).toEqual({
            capturedMessages: ["Error in action handler"],
            display: "flex",
            visibleClassPresent: true,
        });
        expect(el.querySelector(".notification-message")?.textContent).toBe(
            "Action error test"
        );
    });
});
