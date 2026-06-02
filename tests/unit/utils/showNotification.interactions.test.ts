import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import {
    showNotification,
    notify,
    clearAllNotifications,
} from "../../../electron-app/utils/ui/notifications/showNotification.js";

function getNotificationState(element: HTMLElement) {
    const message = element.querySelector(".notification-message");
    if (!message) {
        throw new Error("Expected .notification-message to exist");
    }

    return {
        ariaLabel: element.getAttribute("aria-label"),
        classList: [...element.classList],
        display: element.style.display,
        message: message.textContent,
    };
}

function getRequiredNotificationElement(): HTMLElement {
    const element = document.getElementById("notification");

    if (!(element instanceof HTMLElement)) {
        throw new Error("Expected #notification to exist");
    }

    return element;
}

function getRequiredButton(
    element: HTMLElement,
    selector: string
): HTMLButtonElement {
    const button = element.querySelector(selector);

    if (!(button instanceof HTMLButtonElement)) {
        throw new Error(`Expected button for selector: ${selector}`);
    }

    return button;
}

describe("showNotification interactions", () => {
    beforeEach(() => {
        vi.useFakeTimers();
        vi.restoreAllMocks();
        vi.spyOn(console, "warn").mockImplementation(() => {});
        vi.spyOn(console, "error").mockImplementation(() => {});
        const notificationElement = document.createElement("div");
        notificationElement.id = "notification";
        notificationElement.className = "notification";
        notificationElement.style.display = "none";
        document.body.replaceChildren(notificationElement);
    });

    afterEach(() => {
        vi.runOnlyPendingTimers();
        vi.useRealTimers();
        vi.restoreAllMocks();
        document.body.replaceChildren();
        clearAllNotifications();
    });

    it("shows basic info notification and auto hides after default duration", async () => {
        expect.assertions(4);

        const p = showNotification("Hello world", "info");
        // queue processed immediately; animation frame -> we just advance timers
        await p;
        const el = getRequiredNotificationElement();
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
        expect.assertions(4);

        const p = notify.persistent("Stay", "warning");
        await p;
        const el = getRequiredNotificationElement();
        expect(el.style.display).toBe("flex");
        const close = getRequiredButton(el, ".notification-close");
        expect(close.getAttribute("aria-label")).toBe("Close notification");
        expect(close.textContent).toBe("×");
        close.click();
        // transition 300ms
        vi.advanceTimersByTime(300);
        expect(el.style.display).toBe("none");
    });

    it("renders action buttons and fires callbacks, hiding after click", async () => {
        expect.assertions(4);

        const onAct = vi.fn<() => void>();
        const p = notify.withActions("Actions", "success", [
            { text: "Do", onClick: onAct },
        ]);
        await p;
        const el = getRequiredNotificationElement();
        const btn = getRequiredButton(el, ".notification-actions button");
        expect(btn.textContent).toBe("Do");
        expect(btn.className).toBe("themed-btn");
        btn.click();
        expect(onAct).toHaveBeenCalledOnce();
        vi.advanceTimersByTime(300);
        expect(el.style.display).toBe("none");
    });

    it("invokes onClick for main notification click when not clicking an action button", async () => {
        expect.assertions(2);

        const onClick = vi.fn<() => void>();
        const p = showNotification("Clickable", "info", undefined, {
            onClick,
            persistent: true,
        });
        await p;
        const el = getRequiredNotificationElement();
        el.click();
        expect(onClick).toHaveBeenCalledOnce();
        vi.advanceTimersByTime(300);
        expect(el.style.display).toBe("none");
    });

    it("handles invalid inputs and unknown type fallback", async () => {
        expect.assertions(4);

        // invalid message
        await showNotification(null as any);
        expect(console.warn).toHaveBeenCalledWith(
            "showNotification: Invalid message provided"
        );

        // unknown type
        const p = showNotification("Msg", "unknown" as any);
        await p;
        const el = getRequiredNotificationElement();
        expect(vi.mocked(console.warn).mock.calls).toStrictEqual([
            ["showNotification: Invalid message provided"],
            [
                "showNotification: Unknown notification type 'unknown', falling back to 'info'",
            ],
        ]);
        expect(getNotificationState(el)).toStrictEqual({
            ariaLabel: "Information: Msg",
            classList: ["notification", "info"],
            display: "flex",
            message: "Msg",
        });
        // auto-hide default of info (4000)
        vi.advanceTimersByTime(4500);
        vi.advanceTimersByTime(300);
        expect(el.style.display).toBe("none");
    });

    it("clearAllNotifications empties queue and hides current", async () => {
        expect.assertions(2);

        await showNotification("One", "info", 10000); // long duration to keep visible
        const el = getRequiredNotificationElement();
        expect(el.style.display).toBe("flex");
        clearAllNotifications();
        vi.advanceTimersByTime(300);
        expect(el.style.display).toBe("none");
    });

    it("queues multiple notifications and shows sequentially", async () => {
        expect.assertions(6);

        // two short notifications
        const p1 = showNotification("First", "success", 500);
        const p2 = showNotification("Second", "error", 500);
        await p1; // first scheduled
        let el = getRequiredNotificationElement();
        expect(el.style.display).toBe("flex");
        expect(getNotificationState(el).message).toBe("First");
        expect(el.className).toBe("notification success");
        // finish first
        vi.advanceTimersByTime(500 + 300);
        // allow queue processor to kick in
        vi.advanceTimersByTime(50);
        await p2;
        el = getRequiredNotificationElement();
        expect(getNotificationState(el).message).toBe("Second");
        expect(el.className).toBe("notification error");
        // finish second
        vi.advanceTimersByTime(500 + 300);
        expect(el.style.display).toBe("none");
    });

    it("resolves and logs when notification rendering throws", async () => {
        expect.assertions(4);

        const el = getRequiredNotificationElement();
        const renderError = new Error("render failed");
        const replaceChildrenSpy = vi
            .spyOn(el, "replaceChildren")
            .mockImplementation(() => {
                throw renderError;
            });

        await showNotification("Broken", "info");

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
