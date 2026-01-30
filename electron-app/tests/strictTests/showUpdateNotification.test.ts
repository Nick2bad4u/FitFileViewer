import { describe, it, expect, beforeEach, vi } from "vitest";

// SUT
import { showUpdateNotification } from "../../utils/ui/notifications/showUpdateNotification.js";

// Minimal DOM setup helper
function ensureNotificationDiv() {
    let el = document.getElementById("notification");
    if (!el) {
        el = document.createElement("div");
        el.id = "notification";
        document.body.appendChild(el);
    }
    return el as HTMLDivElement;
}

describe("showUpdateNotification strict", () => {
    let clock: ReturnType<typeof vi.useFakeTimers>;

    beforeEach(() => {
        document.body.innerHTML = "";
        // Reset window.electronAPI between tests
        // @ts-expect-error test setup
        window.electronAPI = undefined;
        clock = vi.useFakeTimers();
    });

    it("renders basic info notification and auto-hides", () => {
        const el = ensureNotificationDiv();
        const hideSpy = vi.spyOn(el.style, "display", "set");

        showUpdateNotification("Update available", "info", 2000, false);

        expect(el.className).toContain("notification info");
        expect(el.style.display).toBe("block");
        expect(el.querySelector("span")?.textContent).toBe("Update available");

        // Should set up auto-hide since withAction is false
        clock.advanceTimersByTime(2000);
        expect(hideSpy).toHaveBeenCalledWith("none");
    });

    it("creates action button and auto-hides when withAction=true", () => {
        const el = ensureNotificationDiv();

        // Mock electronAPI.installUpdate to verify no crash upon click
        // @ts-expect-error test setup
        window.electronAPI = { installUpdate: vi.fn() };

        showUpdateNotification("Update ready", "success", 1500, true);

        const btn = el.querySelector("button");
        expect(btn).toBeTruthy();
        expect(btn?.textContent).toContain("Restart");

        // Clicking should attempt to call installUpdate
        btn?.dispatchEvent(new MouseEvent("click"));
        expect(window.electronAPI.installUpdate).toHaveBeenCalledTimes(1);

        // Auto-hide still applies when withAction=true
        const hideSpy = vi.spyOn(el.style, "display", "set");
        clock.advanceTimersByTime(1500);
        expect(hideSpy).toHaveBeenCalledWith("none");
    });

    it("renders update-downloaded with two buttons and Later hides", () => {
        const el = ensureNotificationDiv();
        // @ts-expect-error test setup
        window.electronAPI = { installUpdate: vi.fn() };

        showUpdateNotification(
            "Update downloaded",
            "success",
            0,
            "update-downloaded"
        );

        const buttons = Array.from(el.querySelectorAll("button"));
        expect(buttons.length).toBe(2);

        const restart = buttons.find((b) => b.textContent?.includes("Restart"));
        const later = buttons.find((b) => b.textContent?.includes("Later"));
        expect(restart).toBeTruthy();
        expect(later).toBeTruthy();

        // Clicking Restart triggers install
        restart?.dispatchEvent(new MouseEvent("click"));
        expect(window.electronAPI.installUpdate).toHaveBeenCalledTimes(1);

        // Clicking Later hides the notification immediately
        const hideSpy = vi.spyOn(el.style, "display", "set");
        later?.dispatchEvent(new MouseEvent("click"));
        expect(hideSpy).toHaveBeenCalledWith("none");
    });

    it("logs a warning and no crash when electronAPI missing", () => {
        const el = ensureNotificationDiv();
        const logSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

        // withAction true will attempt installUpdate; missing API should warn
        showUpdateNotification("Try update", "info", 0, true);

        // One button exists; clicking should attempt install and emit a warn since API is missing
        const btn = el.querySelector("button");
        expect(btn).toBeTruthy();
        btn?.dispatchEvent(new MouseEvent("click"));
        expect(logSpy).toHaveBeenCalled();
        // No electronAPI, so nothing to assert besides no throw; ensure code continues
        expect(el.style.display).toBe("block");
    });
});
