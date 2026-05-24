import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import {
    showNotification,
    notify,
    clearAllNotifications,
} from "../../../utils/ui/notifications/showNotification.js";
import type { NotificationType } from "../../../utils/ui/notifications/showNotification.js";

type NotificationElementWithHideTimeout = HTMLElement & {
    hideTimeout?: number;
};

type NotifyTypeMethod = "error" | "info" | "success" | "warning";

function createNotificationFixture(): HTMLDivElement {
    const notificationElement = document.createElement("div");
    notificationElement.id = "notification";
    notificationElement.className = "notification";
    notificationElement.style.display = "none";
    document.body.replaceChildren(notificationElement);
    return notificationElement;
}

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
        createNotificationFixture();
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

    it("handles missing notification element gracefully", async () => {
        document.body.replaceChildren();

        await showNotification("Test");

        expect(document.querySelector("#notification")).toBeNull();
        expect(document.body.childElementCount).toBe(0);
        expect(console.warn).toHaveBeenCalledWith(
            "Notification element not found. Unable to display notification."
        );
    });

    it("processes queue gracefully when element missing (smoke)", async () => {
        document.body.replaceChildren();

        const p = showNotification("No element present");

        await p;

        expect(document.querySelector(".notification-message")).toBeNull();
        expect(document.body.childElementCount).toBe(0);
        expect(console.warn).toHaveBeenCalledWith(
            "Notification element not found. Unable to display notification."
        );
    });

    it("clears existing hideTimeout when displaying new notification", async () => {
        const mockClearTimeout = vi.spyOn(window, "clearTimeout");
        const notificationEl = document.getElementById(
            "notification"
        ) as NotificationElementWithHideTimeout | null;

        if (!notificationEl) {
            throw new Error("Expected notification fixture to exist");
        }

        notificationEl.hideTimeout = 123;

        const p = showNotification("Testing clearTimeout");

        await p;

        expect(notificationEl.style.display).toBe("flex");
        expect(
            notificationEl.querySelector(".notification-message")?.textContent
        ).toBe("Testing clearTimeout");
        expect(notificationEl.hideTimeout).not.toBe(123);
        expect(mockClearTimeout).toHaveBeenCalledWith(123);
    });

    it("handles all notification types through the notify object", async () => {
        const typeTests: readonly {
            method: NotifyTypeMethod;
            type: NotificationType;
        }[] = [
            { method: "info", type: "info" },
            { method: "success", type: "success" },
            { method: "error", type: "error" },
            { method: "warning", type: "warning" },
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
        const closeBtn = document.querySelector(".notification-close");
        expect(closeBtn).toBeInstanceOf(HTMLButtonElement);

        if (!(closeBtn instanceof HTMLButtonElement)) {
            throw new Error("Expected persistent notification close button");
        }

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
        const btn = el.querySelector(".notification-actions button");
        expect(btn).toBeInstanceOf(HTMLButtonElement);

        if (!(btn instanceof HTMLButtonElement)) {
            throw new Error("Expected action button to be rendered");
        }

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
        expect(el.style.display).toBe("flex");
        expect(el.style.cursor).toBe("pointer");
        expect(onClick).not.toHaveBeenCalled();
    });

    it("handles click target inside notification actions area", async () => {
        const onClick = vi.fn();
        const p = showNotification("Action area test", "info", undefined, {
            onClick,
            persistent: true,
        });
        await p;
        const notificationEl = document.getElementById("notification")!;

        // Create a mock event with a target that would be inside the notification-actions area
        const mockEvent = new MouseEvent("click");
        const mockTarget = document.createElement("span");
        mockTarget.className = "inside-action";

        // Create actions container and add it to the notification
        const actionsContainer = document.createElement("div");
        actionsContainer.className = "notification-actions";
        actionsContainer.appendChild(mockTarget);
        notificationEl.appendChild(actionsContainer);

        // Mock closest to return the actions container
        const closestSpy = vi
            .spyOn(mockTarget, "closest")
            .mockReturnValue(actionsContainer);

        // Override the event target
        Object.defineProperty(mockEvent, "target", { get: () => mockTarget });

        // Dispatch the event
        notificationEl.dispatchEvent(mockEvent);

        // Should not trigger onClick since it's inside action area
        expect(notificationEl.style.display).toBe("flex");
        expect(
            notificationEl.querySelector(".notification-message")?.textContent
        ).toBe("Action area test");
        expect(onClick).not.toHaveBeenCalled();
        closestSpy.mockRestore();
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
        expect(el.querySelector(".notification-message")?.textContent).toBe(
            "First"
        );
    });
});
