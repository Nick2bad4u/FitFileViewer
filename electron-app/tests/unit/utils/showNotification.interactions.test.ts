import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import {
    showNotification,
    notify,
    clearAllNotifications,
} from "../../../utils/ui/notifications/showNotification.js";

describe("showNotification interactions", () => {
    const originalWarn = console.warn;
    const originalError = console.error;

    beforeEach(() => {
        vi.useFakeTimers();
        vi.restoreAllMocks();
        console.warn = vi.fn();
        console.error = vi.fn();
        const notificationElement = document.createElement("div");
        notificationElement.id = "notification";
        notificationElement.className = "notification";
        notificationElement.style.display = "none";
        document.body.replaceChildren(notificationElement);
    });

    afterEach(() => {
        vi.runOnlyPendingTimers();
        vi.useRealTimers();
        console.warn = originalWarn;
        console.error = originalError;
        document.body.replaceChildren();
        clearAllNotifications();
    });

    it("shows basic info notification and auto hides after default duration", async () => {
        const p = showNotification("Hello world", "info");
        // queue processed immediately; animation frame -> we just advance timers
        await p;
        const el = document.getElementById("notification")!;
        expect(el.style.display).toBe("flex");
        // Advance past duration (default 4000) + animation 500
        vi.advanceTimersByTime(4500);
        // hide after 300ms transition
        vi.advanceTimersByTime(300);
        expect(el.style.display).toBe("none");
        expect(console.warn).not.toHaveBeenCalled();
        expect(console.error).not.toHaveBeenCalled();
    });

    it("supports persistent notification with close button", async () => {
        const p = notify.persistent("Stay", "warning");
        await p;
        const el = document.getElementById("notification")!;
        expect(el.style.display).toBe("flex");
        const close = el.querySelector(
            ".notification-close"
        ) as HTMLButtonElement;
        expect(close?.getAttribute("aria-label")).toBe("Close notification");
        expect(close?.textContent).toBe("×");
        close.click();
        // transition 300ms
        vi.advanceTimersByTime(300);
        expect(el.style.display).toBe("none");
    });

    it("renders action buttons and fires callbacks, hiding after click", async () => {
        const onAct = vi.fn();
        const p = notify.withActions("Actions", "success", [
            { text: "Do", onClick: onAct },
        ]);
        await p;
        const el = document.getElementById("notification")!;
        const btn = el.querySelector(
            ".notification-actions button"
        ) as HTMLButtonElement;
        expect(btn?.textContent).toBe("Do");
        expect(btn?.className).toBe("themed-btn");
        btn.click();
        expect(onAct).toHaveBeenCalled();
        vi.advanceTimersByTime(300);
        expect(el.style.display).toBe("none");
    });

    it("invokes onClick for main notification click when not clicking an action button", async () => {
        const onClick = vi.fn();
        const p = showNotification("Clickable", "info", undefined, {
            onClick,
            persistent: true,
        });
        await p;
        const el = document.getElementById("notification")!;
        el.click();
        expect(onClick).toHaveBeenCalled();
        vi.advanceTimersByTime(300);
        expect(el.style.display).toBe("none");
    });

    it("handles invalid inputs and unknown type fallback", async () => {
        // invalid message
        await showNotification(null as any);
        expect(console.warn).toHaveBeenCalled();

        // unknown type
        const p = showNotification("Msg", "unknown" as any);
        await p;
        const el = document.getElementById("notification")!;
        expect(el.className).toContain("notification");
        // auto-hide default of info (4000)
        vi.advanceTimersByTime(4500);
        vi.advanceTimersByTime(300);
        expect(el.style.display).toBe("none");
    });

    it("clearAllNotifications empties queue and hides current", async () => {
        await showNotification("One", "info", 10000); // long duration to keep visible
        const el = document.getElementById("notification")!;
        expect(el.style.display).toBe("flex");
        clearAllNotifications();
        vi.advanceTimersByTime(300);
        expect(el.style.display).toBe("none");
    });

    it("queues multiple notifications and shows sequentially", async () => {
        // two short notifications
        const p1 = showNotification("First", "success", 500);
        const p2 = showNotification("Second", "error", 500);
        await p1; // first scheduled
        let el = document.getElementById("notification")!;
        expect(el.style.display).toBe("flex");
        expect(el.querySelector(".notification-message")?.textContent).toBe(
            "First"
        );
        expect(el.className).toBe("notification success");
        // finish first
        vi.advanceTimersByTime(500 + 300);
        // allow queue processor to kick in
        vi.advanceTimersByTime(50);
        await p2;
        el = document.getElementById("notification")!;
        expect(el.querySelector(".notification-message")?.textContent).toBe(
            "Second"
        );
        expect(el.className).toBe("notification error");
        // finish second
        vi.advanceTimersByTime(500 + 300);
        expect(el.style.display).toBe("none");
    });

    it("resolves and logs when notification rendering throws", async () => {
        const el = document.getElementById("notification")!;
        const renderError = new Error("render failed");
        const replaceChildrenSpy = vi
            .spyOn(el, "replaceChildren")
            .mockImplementation(() => {
                throw renderError;
            });

        await expect(showNotification("Broken", "info")).resolves.toBeUndefined();

        expect(replaceChildrenSpy).toHaveBeenCalledOnce();
        expect(console.error).toHaveBeenCalledWith(
            "Error displaying notification:",
            renderError
        );
        expect(console.error).toHaveBeenCalledWith(
            "Error displaying notification: render failed"
        );
        expect(el.style.display).toBe("none");
    });
});
