import { showUpdateNotification } from "../utils/showUpdateNotification";
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

describe("showUpdateNotification", () => {
    let notification;
    beforeEach(() => {
        notification = document.createElement("div");
        notification.id = "notification";
        document.body.appendChild(notification);
        window.electronAPI = { installUpdate: vi.fn() };
        vi.useFakeTimers();
    });
    afterEach(() => {
        document.body.removeChild(notification);
        vi.useRealTimers();
    });
    it("should display a notification with the correct message and type", () => {
        showUpdateNotification("Test message", "success");
        expect(notification.style.display).toBe("block");
        expect(notification.className).toContain("success");
        expect(notification.textContent).toContain("Test message");
    });
    it("should hide notification after duration if no action", () => {
        showUpdateNotification("Test", "info", 1000);
        vi.advanceTimersByTime(1000);
        expect(notification.style.display).toBe("none");
    });
    it("should add Restart & Update and Later buttons for update-downloaded", () => {
        showUpdateNotification("Update ready", "info", 6000, "update-downloaded");
        const restartBtn = notification.querySelector("button");
        expect(restartBtn.textContent).toBe("Restart & Update");
        restartBtn.click();
        expect(window.electronAPI.installUpdate).toHaveBeenCalled();
        const laterBtn = notification.querySelectorAll("button")[1];
        expect(laterBtn.textContent).toBe("Later");
        laterBtn.click();
        expect(notification.style.display).toBe("none");
    });
    it("should add only Restart & Update button for withAction true", () => {
        showUpdateNotification("Update", "info", 6000, true);
        const btn = notification.querySelector("button");
        expect(btn.textContent).toBe("Restart & Update");
        btn.click();
        expect(window.electronAPI.installUpdate).toHaveBeenCalled();
    });
});
