import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
    clearAllNotifications,
    isShowingNotification,
    notificationQueue,
    showNotification,
} from "../../../electron-app/utils/ui/notifications/showNotification.js";

describe("showNotification display failure handling", () => {
    beforeEach(() => {
        vi.useFakeTimers();
        vi.restoreAllMocks();
        vi.spyOn(console, "error").mockImplementation(() => {});
        vi.spyOn(console, "warn").mockImplementation(() => {});

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
        vi.restoreAllMocks();
        document.body.replaceChildren();
    });

    it("resolves the caller promise and clears queue state when display fails", async () => {
        expect.hasAssertions();

        const notificationElement =
            document.querySelector<HTMLElement>("#notification");
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
        expect({
            isShowingNotification,
            queueSize: notificationQueue.length,
            visibleClassPresent:
                notificationElement!.classList.contains("show"),
        }).toEqual({
            isShowingNotification: false,
            queueSize: 0,
            visibleClassPresent: false,
        });
    });

    it("rejects invalid messages without rendering notification content", async () => {
        expect.hasAssertions();

        const notificationElement =
            document.querySelector<HTMLElement>("#notification");
        expect(notificationElement!.id).toBe("notification");

        const result = await showNotification("", "info", 1000);

        expect(result).toBeUndefined();
        expect(console.warn).toHaveBeenCalledWith(
            "showNotification: Invalid message provided"
        );
        expect(console.error).not.toHaveBeenCalled();
        expect({
            childCount: notificationElement!.childElementCount,
            className: notificationElement!.className,
            display: notificationElement!.style.display,
            isShowingNotification,
            queueSize: notificationQueue.length,
        }).toEqual({
            childCount: 0,
            className: "notification",
            display: "none",
            isShowingNotification: false,
            queueSize: 0,
        });
    });
});
