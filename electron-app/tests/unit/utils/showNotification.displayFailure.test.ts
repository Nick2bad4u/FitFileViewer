import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
    clearAllNotifications,
    isShowingNotification,
    notificationQueue,
    showNotification,
} from "../../../utils/ui/notifications/showNotification.js";

describe("showNotification display failure handling", () => {
    const originalError = console.error;
    const originalWarn = console.warn;

    beforeEach(() => {
        vi.useFakeTimers();
        vi.restoreAllMocks();
        console.error = vi.fn();
        console.warn = vi.fn();

        const notificationElement = document.createElement("div");
        notificationElement.id = "notification";
        notificationElement.className = "notification";
        notificationElement.style.display = "none";
        document.body.replaceChildren(notificationElement);
    });

    afterEach(() => {
        clearAllNotifications();
        vi.runOnlyPendingTimers();
        vi.useRealTimers();
        console.error = originalError;
        console.warn = originalWarn;
        document.body.replaceChildren();
    });

    it("resolves the caller promise and clears queue state when display fails", async () => {
        const notificationElement = document.querySelector<HTMLElement>(
            "#notification"
        );
        expect(notificationElement!.id).toBe("notification");

        const displayError = new Error("Display unavailable");
        let displayValue = notificationElement!.style.display;
        Object.defineProperty(notificationElement!.style, "display", {
            configurable: true,
            get: () => displayValue,
            set: (value: string) => {
                displayValue = value;
                if (value === "flex") {
                    throw displayError;
                }
            },
        });

        const shown = showNotification("Display failure", "info", 1000);

        await expect(shown).resolves.toBeUndefined();
        expect(console.error).toHaveBeenCalledWith(
            "Error displaying notification:",
            displayError
        );
        expect(console.error).toHaveBeenCalledWith(
            "Error displaying notification: Display unavailable"
        );
        expect(
            notificationElement!.querySelector(".notification-message")
                ?.textContent
        ).toBe("Display failure");
        expect(notificationElement!.getAttribute("aria-label")).toBe(
            "Information: Display failure"
        );
        expect(notificationElement!.classList.contains("show")).toBe(false);
        expect(notificationQueue).toHaveLength(0);
        expect(isShowingNotification).toBe(false);
    });

    it("rejects invalid messages without rendering notification content", async () => {
        const notificationElement = document.querySelector<HTMLElement>(
            "#notification"
        );
        expect(notificationElement!.id).toBe("notification");

        const result = await showNotification("", "info", 1000);

        expect(result).toBeUndefined();
        expect(console.warn).toHaveBeenCalledWith(
            "showNotification: Invalid message provided"
        );
        expect(console.error).not.toHaveBeenCalled();
        expect(notificationElement!.children).toHaveLength(0);
        expect(notificationElement!.className).toBe("notification");
        expect(notificationElement!.style.display).toBe("none");
        expect(notificationQueue).toHaveLength(0);
        expect(isShowingNotification).toBe(false);
    });
});
