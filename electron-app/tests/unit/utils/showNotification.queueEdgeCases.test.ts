import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import {
    __testResetNotifications,
    clearAllNotifications,
    isShowingNotification,
    notificationQueue,
    notify,
    processNotificationQueue,
    showNotification,
    type NotificationElement,
    type NotificationType,
    type QueuedNotification,
} from "../../../utils/ui/notifications/showNotification.js";

type NotifyMethod = "error" | "info" | "success" | "warning";

describe("showNotification queue edge cases", () => {
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
        const notificationElement = document.createElement("div");
        notificationElement.id = "notification";
        notificationElement.className = "notification";
        notificationElement.style.display = "none";
        document.body.replaceChildren(notificationElement);
        // Reset internal notification state using provided test helper
        __testResetNotifications();
    });

    afterEach(() => {
        vi.runOnlyPendingTimers();
        vi.useRealTimers();
        console.warn = originalWarn;
        console.error = originalError;
        window.requestAnimationFrame = originalRAF;
        document.body.replaceChildren();
    });

    it("handles missing notification element gracefully", async () => {
        document.body.replaceChildren(); // Remove notification element
        const p = showNotification("Test");
        await p;
        expect(console.warn).toHaveBeenCalledWith(
            "Notification element not found. Unable to display notification."
        );
        expect(notificationQueue).toHaveLength(0);
        expect(document.getElementById("notification")).toBeNull();
    });

    it("handles errors during displayNotification process", async () => {
        // Create a notification element that throws when the display pipeline adds its class.
        vi.spyOn(document, "querySelector").mockImplementationOnce(() => {
            const mockEl = document.createElement("div");
            // Set a property to cause an error when accessed
            Object.defineProperty(mockEl, "classList", {
                get() {
                    throw new Error("Simulated error");
                },
            });
            return mockEl;
        });

        const p = showNotification("Error test");
        await p;
        await vi.runAllTimersAsync();
        expect(console.error).toHaveBeenCalledWith(
            "Error displaying notification:",
            expect.objectContaining({ message: "Simulated error" })
        );
        expect(notificationQueue).toHaveLength(0);
        expect(isShowingNotification).toBe(false);
    });

    it("clears existing hideTimeout when displaying new notification", async () => {
        const mockClearTimeout = vi.spyOn(window, "clearTimeout");
        const notificationEl = document.getElementById(
            "notification"
        ) as NotificationElement | null;

        // Manually set a hideTimeout on the element
        if (notificationEl) {
            notificationEl.hideTimeout = 123;
        }

        const p = showNotification("Testing clearTimeout");
        await p;
        expect(mockClearTimeout).toHaveBeenCalledWith(123);
        expect(notificationEl?.style.display).toBe("flex");
        expect(notificationEl?.hideTimeout).not.toBe(123);
    });

    it("handles all notification types through the notify object", async () => {
        const typeTests: Array<{
            readonly duration: number;
            readonly method: NotifyMethod;
            readonly type: NotificationType;
        }> = [
            { method: "info", type: "info", duration: 4000 },
            { method: "success", type: "success", duration: 3000 },
            { method: "error", type: "error", duration: 6000 },
            { method: "warning", type: "warning", duration: 5000 },
        ];

        for (const test of typeTests) {
            const p = notify[test.method](`${test.type} notification`);
            await p;
            const el = document.getElementById("notification")!;
            expect(el.style.display).toBe("flex");
            expect(el.className).toContain(test.type);

            // Clear notification before next test
            clearAllNotifications();
            vi.advanceTimersByTime(300); // Wait for hide transition
        }
    });

    it("handles mouseover and mouseout events on close button", async () => {
        const p = notify.persistent("Hover test");
        await p;
        const closeBtn = document.querySelector(
            ".notification-close"
        ) as HTMLButtonElement;
        expect(closeBtn).toBeInstanceOf(HTMLButtonElement);
        expect(closeBtn.getAttribute("aria-label")).toBe(
            "Close notification"
        );

        // Simulate mouseover and mouseout
        const mouseoverEvent = new MouseEvent("mouseover");
        const mouseoutEvent = new MouseEvent("mouseout");

        closeBtn.dispatchEvent(mouseoverEvent);
        expect(closeBtn.style.opacity).toBe("1");

        closeBtn.dispatchEvent(mouseoutEvent);
        expect(closeBtn.style.opacity).toBe("0.7");
    });

    it("handles action button without onClick handler", async () => {
        const p = notify.withActions("No action", "info", [
            { text: "No handler" },
        ]);
        await p;
        const el = document.getElementById("notification")!;
        const btn = el.querySelector(
            ".notification-actions button"
        ) as HTMLButtonElement;
        expect(btn).toBeInstanceOf(HTMLButtonElement);
        expect(btn.textContent).toBe("No handler");

        // Click should still hide notification even without handler
        btn.click();
        vi.advanceTimersByTime(300);
        expect(el.style.display).toBe("none");
    });

    it("handles notification click on non-HTMLElement target", async () => {
        const onClick = vi.fn();
        const p = showNotification("Click test", "info", undefined, {
            onClick,
            persistent: true,
        });
        await p;
        const el = document.getElementById("notification")!;

        // Create and dispatch a click event with a non-HTMLElement target
        const clickEvent = new MouseEvent("click");
        // Override the target property
        Object.defineProperty(clickEvent, "target", {
            get: () => null,
        });

        el.dispatchEvent(clickEvent);
        expect(onClick).not.toHaveBeenCalled();
        expect(el.style.display).toBe("flex");
        expect(el.style.cursor).toBe("pointer");
    });

    it("handles click target inside notification actions area", async () => {
        const onClick = vi.fn();
        const p = showNotification("Action area test", "info", undefined, {
            onClick,
            persistent: true,
        });
        await p;

        // Create a mock event with a target that would be inside the notification-actions area
        const mockEvent = new MouseEvent("click");
        const mockTarget = document.createElement("span");
        mockTarget.className = "inside-action";

        // Create actions container and add it to the notification
        const actionsContainer = document.createElement("div");
        actionsContainer.className = "notification-actions";
        actionsContainer.appendChild(mockTarget);
        document.getElementById("notification")!.appendChild(actionsContainer);

        const closestSpy = vi
            .spyOn(mockTarget, "closest")
            .mockReturnValue(actionsContainer);

        // Override the event target
        Object.defineProperty(mockEvent, "target", { get: () => mockTarget });

        // Dispatch the event
        document.getElementById("notification")!.dispatchEvent(mockEvent);

        // Should not trigger onClick since it's inside action area
        expect(onClick).not.toHaveBeenCalled();
        expect(document.getElementById("notification")!.style.display).toBe(
            "flex"
        );

        closestSpy.mockRestore();
    });

    it("handles error when resolveShown throws", async () => {
        const notification: QueuedNotification = {
            message: "Error test",
            type: "info",
            duration: 1000,
            icon: "ℹ️",
            ariaLabel: "Information",
            onClick: undefined,
            actions: [],
            timestamp: Date.now(),
            resolveShown: () => {
                throw new Error("resolveShown error");
            },
        };
        notificationQueue.push(notification);

        // This shouldn't throw despite the error in resolveShown
        await processNotificationQueue();
        expect(console.error).toHaveBeenCalledWith(
            "Error displaying notification:",
            expect.objectContaining({ message: "resolveShown error" })
        );
        expect(notificationQueue).toHaveLength(0);
        expect(isShowingNotification).toBe(false);
    });

    it("processes empty queue without errors", async () => {
        // Ensure queue is empty
        clearAllNotifications();
        expect(notificationQueue.length).toBe(0);

        // Should not throw or cause issues
        await processNotificationQueue();
        expect(isShowingNotification).toBe(false);
    });

    it("handles multiple notifications in queue properly", async () => {
        // Queue multiple notifications
        showNotification("First", "info", 100);
        showNotification("Second", "success", 100);
        showNotification("Third", "error", 100);

        // First should be displayed immediately
        await vi.advanceTimersByTimeAsync(10);
        let el = document.getElementById("notification")!;
        expect(el.querySelector(".notification-message")!.textContent).toBe(
            "First"
        );
        expect(el.className).toContain("info");

        // Advance past first notification duration + hide animation
        await vi.advanceTimersByTimeAsync(400);

        // Second should be displayed
        el = document.getElementById("notification")!;
        expect(el.querySelector(".notification-message")!.textContent).toBe(
            "Second"
        );
        expect(el.className).toContain("success");

        // Advance past second notification duration + hide animation
        await vi.advanceTimersByTimeAsync(400);

        // Third should be displayed
        el = document.getElementById("notification")!;
        expect(el.querySelector(".notification-message")!.textContent).toBe(
            "Third"
        );
        expect(el.className).toContain("error");

        // Clear everything
        await vi.advanceTimersByTimeAsync(400);
        expect(el.style.display).toBe("none");
    });
});
