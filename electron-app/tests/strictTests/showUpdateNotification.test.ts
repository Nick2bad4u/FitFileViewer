import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// SUT
import { showUpdateNotification } from "../../utils/ui/notifications/showUpdateNotification.js";

type UpdateNotificationTestWindow = Window & {
    electronAPI?: {
        installUpdate: ReturnType<typeof vi.fn>;
    };
};

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
        document.body.replaceChildren();
        // Reset window.electronAPI between tests
        (window as UpdateNotificationTestWindow).electronAPI = undefined;
        clock = vi.useFakeTimers();
    });

    afterEach(() => {
        clock.runOnlyPendingTimers();
        vi.useRealTimers();
        vi.restoreAllMocks();
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
        (window as UpdateNotificationTestWindow).electronAPI = {
            installUpdate: vi.fn(),
        };

        showUpdateNotification("Update ready", "success", 1500, true);

        const btn = el.querySelector("button");
        expect(btn).toBeInstanceOf(HTMLButtonElement);
        expect(btn?.className).toBe("themed-btn");
        expect(btn?.textContent).toBe("Restart & Update");

        // Clicking should attempt to call installUpdate
        btn?.dispatchEvent(new MouseEvent("click"));
        expect(
            (window as UpdateNotificationTestWindow).electronAPI?.installUpdate
        ).toHaveBeenCalledTimes(1);

        // Auto-hide still applies when withAction=true
        const hideSpy = vi.spyOn(el.style, "display", "set");
        clock.advanceTimersByTime(1500);
        expect(hideSpy).toHaveBeenCalledWith("none");
    });

    it("renders update-downloaded with two buttons and Later hides", () => {
        const el = ensureNotificationDiv();
        (window as UpdateNotificationTestWindow).electronAPI = {
            installUpdate: vi.fn(),
        };

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
        expect(restart).toBeInstanceOf(HTMLButtonElement);
        expect(restart?.className).toBe("themed-btn");
        expect(restart?.textContent).toBe("Restart & Update");
        expect(later).toBeInstanceOf(HTMLButtonElement);
        expect(later?.className).toBe("themed-btn");
        expect(later?.textContent).toBe("Later");
        expect(later?.style.marginLeft).toBe("10px");

        // Clicking Restart triggers install
        restart?.dispatchEvent(new MouseEvent("click"));
        expect(
            (window as UpdateNotificationTestWindow).electronAPI?.installUpdate
        ).toHaveBeenCalledTimes(1);

        // Clicking Later hides the notification immediately
        const hideSpy = vi.spyOn(el.style, "display", "set");
        later?.dispatchEvent(new MouseEvent("click"));
        expect(hideSpy).toHaveBeenCalledWith("none");
    });

    it("logs a warning and no crash when electronAPI missing", () => {
        const el = ensureNotificationDiv();
        const logSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
        const errorSpy = vi
            .spyOn(console, "error")
            .mockImplementation(() => undefined);

        // withAction true will attempt installUpdate; missing API should warn
        showUpdateNotification("Try update", "info", 0, true);

        // One button exists; clicking should attempt install and emit a warn since API is missing
        const btn = el.querySelector("button");
        expect(btn).toBeInstanceOf(HTMLButtonElement);
        expect(btn?.textContent).toBe("Restart & Update");
        btn?.dispatchEvent(new MouseEvent("click"));
        expect(logSpy).toHaveBeenCalled();
        expect(errorSpy).toHaveBeenCalledWith(
            expect.stringContaining(
                "Cannot install update - electronAPI not available"
            )
        );
        // No electronAPI, so nothing to assert besides no throw; ensure code continues
        expect(el.style.display).toBe("block");
    });
});
