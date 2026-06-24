import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import {
    showNotification,
    notify,
    clearAllNotifications,
    notificationQueue,
    processNotificationQueue,
    __testResetNotifications,
} from "../../../electron-app/utils/ui/notifications/showNotification.js";
import { getShowNotificationRuntime } from "../../../electron-app/utils/ui/notifications/showNotificationRuntime.js";

function createNotificationFixture(): HTMLDivElement {
    const notificationElement = document.createElement("div");
    notificationElement.id = "notification";
    notificationElement.className = "notification";
    notificationElement.style.display = "none";
    document.body.replaceChildren(notificationElement);
    return notificationElement;
}

function getRequiredNotificationElement(): HTMLDivElement {
    const element = document.getElementById("notification");
    expect(element).toBeInstanceOf(HTMLDivElement);
    return element as HTMLDivElement;
}

function getRequiredNotificationMessage(element: HTMLElement): HTMLElement {
    const message = element.querySelector(".notification-message");
    expect(message).toBeInstanceOf(HTMLElement);
    return message as HTMLElement;
}

function getRequiredConsoleErrorCall(index = 0): unknown[] {
    const call = vi.mocked(console.error).mock.calls[index];

    if (!call) {
        throw new Error(`Expected console.error call ${index}`);
    }

    return call;
}

function getClassPresence(
    element: HTMLElement,
    classNames: string[]
): Record<string, boolean> {
    return Object.fromEntries(
        classNames.map((className) => [
            className,
            element.classList.contains(className),
        ])
    );
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
        expect.assertions(7);

        // Craft a queued notification with a resolveShown that throws
        const resolveError = new Error("resolveShown failure");
        const throwingResolve = vi.fn<() => void>(() => {
            throw resolveError;
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
            runtime: getShowNotificationRuntime(),
            resolveShown: throwingResolve,
        };

        // Queue and process
        notificationQueue.push(notification);
        await processNotificationQueue();

        const element = getRequiredNotificationElement();
        expect(element.style.display).toBe("flex");
        expect(
            getClassPresence(element, [
                "notification",
                "info",
                "show",
            ])
        ).toEqual({
            notification: true,
            info: true,
            show: true,
        });
        expect(getRequiredNotificationMessage(element).textContent).toBe(
            "Throwing resolveShown"
        );
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
            resolveError
        );
    });

    it("handles errors during displayNotification process", async () => {
        expect.assertions(5);

        // Create a spy that makes buildNotificationContent throw
        const mockError = new Error("Simulated error in displayNotification");
        vi.spyOn(document, "createElement").mockImplementationOnce(() => {
            throw mockError;
        });

        // This should trigger the catch block in processNotificationQueue
        await showNotification("Display error test");

        const element = getRequiredNotificationElement();
        expect({
            childCount: element.childElementCount,
            display: element.style.display,
            queueSize: notificationQueue.length,
        }).toEqual({
            childCount: 0,
            display: "none",
            queueSize: 0,
        });

        const consoleErrorCall = getRequiredConsoleErrorCall();
        const loggedError = consoleErrorCall[1];
        expect(consoleErrorCall[0]).toBe("Error displaying notification:");
        expect(loggedError).toBeInstanceOf(Error);
        expect((loggedError as Error).message).toBe(
            "Simulated error in displayNotification"
        );
    });

    it("handles errors in notification click handlers", async () => {
        expect.assertions(7);

        // Create a notification with an onClick handler that throws
        const errorHandler = vi.fn<() => void>().mockImplementation(() => {
            throw new Error("Error in click handler");
        });
        const captured = captureWindowErrors();

        await showNotification("Click error test", "info", undefined, {
            onClick: errorHandler,
            persistent: true,
        });

        const el = getRequiredNotificationElement();
        el.click();
        captured.stop();

        expect(errorHandler).toHaveBeenCalledOnce();
        expect(captured.errors.map((error) => error.message)).toStrictEqual([
            "Error in click handler",
        ]);
        expect(el.style.cursor).toBe("pointer");
        expect(el.style.display).toBe("flex");
        expect(
            getClassPresence(el, [
                "notification",
                "info",
                "show",
            ])
        ).toEqual({
            notification: true,
            info: true,
            show: true,
        });
        expect(el.querySelector(".notification-close")).toBeInstanceOf(
            HTMLButtonElement
        );
    });

    it("handles errors in action button click handlers", async () => {
        expect.assertions(10);

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

        const el = getRequiredNotificationElement();
        const btn = el.querySelector(".notification-actions button");

        expect(btn).toBeInstanceOf(HTMLButtonElement);
        const actionButton = btn as HTMLButtonElement;
        expect(actionButton.textContent).toBe("Error Button");
        expect(actionButton.classList.contains("themed-btn")).toBe(true);

        actionButton.click();
        captured.stop();

        expect(errorActionHandler).toHaveBeenCalledOnce();
        expect(captured.errors.map((error) => error.message)).toStrictEqual([
            "Error in action handler",
        ]);
        expect(el.style.display).toBe("flex");
        expect(
            getClassPresence(el, [
                "notification",
                "info",
                "show",
            ])
        ).toEqual({
            notification: true,
            info: true,
            show: true,
        });
        expect(getRequiredNotificationMessage(el).textContent).toBe(
            "Action error test"
        );
    });
});
