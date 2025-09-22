import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { showNotification, notify, clearAllNotifications } from "../../../utils/ui/notifications/showNotification.js";

describe("showNotification.js - advanced coverage", () => {
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
    });

    afterEach(() => {
        vi.runOnlyPendingTimers();
        vi.useRealTimers();
        console.warn = originalWarn;
        console.error = originalError;
        window.requestAnimationFrame = originalRAF;
        document.body.innerHTML = "";
        clearAllNotifications();
    });

    it("handles missing notification element gracefully", () => {
        document.body.innerHTML = ""; // Remove notification element

        // Call showNotification with no element - don't await the promise
        showNotification("Test");

        // Just check that the warning was logged
        expect(console.warn).toHaveBeenCalledWith("Notification element not found. Unable to display notification.");
    });

    it("processes queue gracefully when element missing (smoke)", async () => {
        // Ensure no notification element exists
        document.body.innerHTML = "";
        const p = showNotification("No element present");
        await p;
        expect(console.warn).toHaveBeenCalledWith(
            "Notification element not found. Unable to display notification."
        );
    });

    it("clears existing hideTimeout when displaying new notification", async () => {
        const mockClearTimeout = vi.spyOn(window, "clearTimeout");
        const notificationEl = document.getElementById("notification");

        // Manually set a hideTimeout on the element
        if (notificationEl) {
            // @ts-ignore - Setting property for test
            notificationEl.hideTimeout = 123;
        }

        const p = showNotification("Testing clearTimeout");
        await p;
        expect(mockClearTimeout).toHaveBeenCalled();
    });

    it("handles all notification types through the notify object", async () => {
        const typeTests = [
            { method: "info", type: "info" },
            { method: "success", type: "success" },
            { method: "error", type: "error" },
            { method: "warning", type: "warning" },
        ];

        for (const test of typeTests) {
            // @ts-ignore - Dynamic method call
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

    it("clearAllNotifications clears pending notifications and hides active one", async () => {
        // Queue multiple notifications
        const p1 = showNotification("First", "info", 100);
        showNotification("Second", "success", 100); // This one should be cleared
        showNotification("Third", "error", 100); // This one should be cleared

        // Wait for first to display
        await p1;
        let el = document.getElementById("notification")!;
        expect(el.style.display).toBe("flex");

        // Clear all notifications
        clearAllNotifications();

        // Should hide current notification
        vi.advanceTimersByTime(300); // Wait for hide transition
        expect(el.style.display).toBe("none");

        // Wait a bit to ensure no further notifications appear
        await vi.advanceTimersByTimeAsync(500);
        expect(el.style.display).toBe("none");
    });
});
