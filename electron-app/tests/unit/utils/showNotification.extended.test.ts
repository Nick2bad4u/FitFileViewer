import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import {
    showNotification,
    notify,
    clearAllNotifications,
    __testResetNotifications,
} from "../../../utils/ui/notifications/showNotification.js";

// Access internal variables and functions for testing
// @ts-ignore - Accessing internals for testing
const { notificationQueue, isShowingNotification, processNotificationQueue } = await import(
    "../../../utils/ui/notifications/showNotification.js"
);

describe("showNotification.js - extended coverage", () => {
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
        document.body.innerHTML = '<div id="notification" class="notification" style="display:none"></div>';
        // Reset internal notification state using provided test helper
        __testResetNotifications();
    });

    afterEach(() => {
        vi.runOnlyPendingTimers();
        vi.useRealTimers();
        console.warn = originalWarn;
        console.error = originalError;
        window.requestAnimationFrame = originalRAF;
        document.body.innerHTML = "";
    });

    it("handles missing notification element gracefully", async () => {
        document.body.innerHTML = ""; // Remove notification element
        const p = showNotification("Test");
        await p;
        expect(console.warn).toHaveBeenCalledWith("Notification element not found. Unable to display notification.");
    });

    it("handles errors during displayNotification process", async () => {
        // Create a spy on getElementById that throws an error
        vi.spyOn(document, "getElementById").mockImplementation(() => {
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
        await vi.runAllTimersAsync();
        expect(console.error).toHaveBeenCalledWith(expect.stringContaining("Error displaying notification:"));
    });

    it("clears existing hideTimeout when displaying new notification", async () => {
        const mockClearTimeout = vi.spyOn(window, "clearTimeout");
        const notificationEl = document.getElementById("notification");

        // Manually set a hideTimeout on the element
        if (notificationEl) {
            // @ts-expect-error - Setting property for test
            notificationEl.hideTimeout = 123;
        }

        const p = showNotification("Testing clearTimeout");
        await p;
        expect(mockClearTimeout).toHaveBeenCalledWith(123);
    });

    it("handles all notification types through the notify object", async () => {
        const typeTests = [
            { method: "info", type: "info", duration: 4000 },
            { method: "success", type: "success", duration: 3000 },
            { method: "error", type: "error", duration: 6000 },
            { method: "warning", type: "warning", duration: 5000 },
        ];

        for (const test of typeTests) {
            // @ts-expect-error - Dynamic method call
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
        const closeBtn = document.querySelector(".notification-close") as HTMLButtonElement;
        expect(closeBtn).toBeTruthy();

        // Simulate mouseover and mouseout
        const mouseoverEvent = new MouseEvent("mouseover");
        const mouseoutEvent = new MouseEvent("mouseout");

        closeBtn.dispatchEvent(mouseoverEvent);
        expect(closeBtn.style.opacity).toBe("1");

        closeBtn.dispatchEvent(mouseoutEvent);
        expect(closeBtn.style.opacity).toBe("0.7");
    });

    it("handles action button without onClick handler", async () => {
        const p = notify.withActions("No action", "info", [{ text: "No handler" }]);
        await p;
        const el = document.getElementById("notification")!;
        const btn = el.querySelector(".notification-actions button") as HTMLButtonElement;
        expect(btn).toBeTruthy();

        // Click should still hide notification even without handler
        btn.click();
        vi.advanceTimersByTime(300);
        expect(el.style.display).toBe("none");
    });

    it("handles notification click on non-HTMLElement target", async () => {
        const onClick = vi.fn();
        const p = showNotification("Click test", "info", undefined, { onClick, persistent: true });
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
    });

    it("handles click target inside notification actions area", async () => {
        const onClick = vi.fn();
        const p = showNotification("Action area test", "info", undefined, { onClick, persistent: true });
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

        // Mock closest to return the actions container
        const originalClosest = Element.prototype.closest;
        // @ts-ignore - Mocking
        mockTarget.closest = vi.fn().mockReturnValue(actionsContainer);

        // Override the event target
        Object.defineProperty(mockEvent, "target", { get: () => mockTarget });

        // Dispatch the event
        document.getElementById("notification")!.dispatchEvent(mockEvent);

        // Should not trigger onClick since it's inside action area
        expect(onClick).not.toHaveBeenCalled();

        // Restore original
        // @ts-ignore - Restoring
        Element.prototype.closest = originalClosest;
    });

    it("handles error when resolveShown throws", async () => {
        // Create a notification with a resolveShown that throws
        // @ts-ignore - Modifying internals for testing
        notificationQueue.push({
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
        });

        // This shouldn't throw despite the error in resolveShown
        await processNotificationQueue();
        expect(console.error).toHaveBeenCalledWith(expect.stringContaining("Error displaying notification:"));
    });

    it("processes empty queue without errors", async () => {
        // Ensure queue is empty
        clearAllNotifications();
        // @ts-ignore - Accessing internals for testing
        expect(notificationQueue.length).toBe(0);

        // Should not throw or cause issues
        await processNotificationQueue();
        // @ts-ignore - Accessing internals for testing
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
        expect(el.querySelector(".notification-message")!.textContent).toBe("First");
        expect(el.className).toContain("info");

        // Advance past first notification duration + hide animation
        await vi.advanceTimersByTimeAsync(400);

        // Second should be displayed
        el = document.getElementById("notification")!;
        expect(el.querySelector(".notification-message")!.textContent).toBe("Second");
        expect(el.className).toContain("success");

        // Advance past second notification duration + hide animation
        await vi.advanceTimersByTimeAsync(400);

        // Third should be displayed
        el = document.getElementById("notification")!;
        expect(el.querySelector(".notification-message")!.textContent).toBe("Third");
        expect(el.className).toContain("error");

        // Clear everything
        await vi.advanceTimersByTimeAsync(400);
        expect(el.style.display).toBe("none");
    });
});
