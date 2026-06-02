import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
    clearAllNotifications,
    isShowingNotification,
    notificationQueue,
    showNotification,
} from "../../../electron-app/utils/ui/notifications/showNotification.js";

function getRequiredNotificationElement(): HTMLElement {
    const notificationElement =
        document.querySelector<HTMLElement>("#notification");
    expect(notificationElement).toBeInstanceOf(HTMLElement);
    return notificationElement as HTMLElement;
}

function getRequiredNotificationMessage(element: HTMLElement): HTMLElement {
    const message = element.querySelector(".notification-message");
    expect(message).toBeInstanceOf(HTMLElement);
    return message as HTMLElement;
}

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
        expect.assertions(10);

        const notificationElement = getRequiredNotificationElement();
        expect(notificationElement.id).toBe("notification");

        const displayError = new Error("Display unavailable");
        let displayValue = notificationElement.style.display;
        Object.defineProperty(notificationElement.style, "display", {
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

        await shown;
        expect(console.error).toHaveBeenCalledWith(
            "Error displaying notification:",
            displayError
        );
        expect(console.error).toHaveBeenCalledWith(
            "Error displaying notification: Display unavailable"
        );
        expect(
            getRequiredNotificationMessage(notificationElement).textContent
        ).toBe("Display failure");
        expect(notificationElement.getAttribute("aria-label")).toBe(
            "Information: Display failure"
        );
        expect(isShowingNotification).toStrictEqual(false);
        expect(notificationQueue).toHaveLength(0);
        expect({
            info: notificationElement.classList.contains("info"),
            notification:
                notificationElement.classList.contains("notification"),
            show: notificationElement.classList.contains("show"),
        }).toEqual({
            info: true,
            notification: true,
            show: false,
        });
    });

    it("rejects invalid messages without rendering notification content", async () => {
        expect.assertions(5);

        const notificationElement = getRequiredNotificationElement();
        expect(notificationElement.id).toBe("notification");

        await showNotification("", "info", 1000);

        expect(console.warn).toHaveBeenCalledWith(
            "showNotification: Invalid message provided"
        );
        expect(console.error).not.toHaveBeenCalled();
        expect({
            childCount: notificationElement.childElementCount,
            className: notificationElement.className,
            display: notificationElement.style.display,
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
