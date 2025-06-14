import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { showNotification } from "../utils/showNotification";

describe("showNotification", () => {
    let notification;
    beforeEach(() => {
        notification = document.createElement("div");
        notification.id = "notification";
        document.body.appendChild(notification);
        vi.useFakeTimers();
    });
    afterEach(() => {
        document.body.removeChild(notification);
        vi.useRealTimers();
    });
    it("should display a notification with the correct message and type", () => {
        showNotification("Test message", "success");
        expect(notification.style.display).toBe("block");
        expect(notification.className).toContain("success");
        expect(notification.textContent).toBe("Test message");
    });
    it("should hide notification after duration", () => {
        showNotification("Test", "info", 1000);
        vi.advanceTimersByTime(1000);
        expect(notification.style.display).toBe("none");
    });
    it("should do nothing if notification element is missing", () => {
        document.body.removeChild(notification);
        expect(() => showNotification("Test")).not.toThrow();
    });
});
