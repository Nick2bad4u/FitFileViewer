import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { showNotification, setLoading } from "../utils/rendererUtils";

describe("showNotification (rendererUtils)", () => {
    let notif;
    beforeEach(() => {
        notif = document.createElement("div");
        notif.id = "notification";
        document.body.appendChild(notif);
        vi.useFakeTimers();
    });
    afterEach(() => {
        document.body.removeChild(notif);
        vi.useRealTimers();
    });
    it("should display a notification with the correct message and type", () => {
        showNotification("Renderer message", "success", 1000);
        expect(notif.style.display).toBe("block");
        expect(notif.className).toContain("success");
        expect(notif.textContent).toBe("Renderer message");
    });
    it("should hide notification after timeout", () => {
        showNotification("Renderer message", "info", 1000);
        vi.advanceTimersByTime(1000);
        expect(notif.style.display).toBe("none");
    });
    it("should do nothing if notification element is missing", () => {
        document.body.removeChild(notif);
        expect(() => showNotification("Test")).not.toThrow();
    });
});

describe("setLoading", () => {
    let overlay;
    beforeEach(() => {
        overlay = document.createElement("div");
        overlay.id = "loadingOverlay";
        document.body.appendChild(overlay);
        document.body.style.cursor = "";
    });
    afterEach(() => {
        document.body.removeChild(overlay);
        document.body.style.cursor = "";
    });
    it("should show overlay and set cursor to wait", () => {
        setLoading(true);
        expect(overlay.style.display).toBe("flex");
        expect(document.body.style.cursor).toBe("wait");
    });
    it("should hide overlay and reset cursor", () => {
        setLoading(true);
        setLoading(false);
        expect(overlay.style.display).toBe("none");
        expect(document.body.style.cursor).toBe("");
    });
    it("should do nothing if overlay is missing", () => {
        document.body.removeChild(overlay);
        expect(() => setLoading(true)).not.toThrow();
    });
});
