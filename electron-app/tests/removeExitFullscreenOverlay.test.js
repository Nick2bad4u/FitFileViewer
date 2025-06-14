import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { removeExitFullscreenOverlay } from "../utils/removeExitFullscreenOverlay";

describe("removeExitFullscreenOverlay", () => {
    let container;
    beforeEach(() => {
        container = document.createElement("div");
        const overlay = document.createElement("button");
        overlay.className = "exit-fullscreen-overlay";
        container.appendChild(overlay);
        document.body.appendChild(container);
    });
    afterEach(() => {
        document.body.removeChild(container);
    });
    it("should remove the exit fullscreen overlay if present", () => {
        expect(container.querySelector(".exit-fullscreen-overlay")).not.toBeNull();
        removeExitFullscreenOverlay(container);
        expect(container.querySelector(".exit-fullscreen-overlay")).toBeNull();
    });
    it("should do nothing if overlay is not present", () => {
        removeExitFullscreenOverlay(container); // remove first
        expect(() => removeExitFullscreenOverlay(container)).not.toThrow();
    });
});
