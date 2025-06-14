import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { addExitFullscreenOverlay } from "../utils/addExitFullscreenOverlay";

describe("addExitFullscreenOverlay", () => {
    let container;
    beforeEach(() => {
        container = document.createElement("div");
        document.body.appendChild(container);
    });
    afterEach(() => {
        document.body.removeChild(container);
    });
    it("should add the exit fullscreen overlay button", () => {
        addExitFullscreenOverlay(container);
        expect(container.querySelector(".exit-fullscreen-overlay")).not.toBeNull();
    });
    it("should not add multiple overlays", () => {
        addExitFullscreenOverlay(container);
        addExitFullscreenOverlay(container);
        expect(container.querySelectorAll(".exit-fullscreen-overlay").length).toBe(1);
    });
    it("should call document.exitFullscreen when clicked", () => {
        addExitFullscreenOverlay(container);
        const overlay = container.querySelector(".exit-fullscreen-overlay");
        document.exitFullscreen = vi.fn();
        overlay.click();
        expect(document.exitFullscreen).toHaveBeenCalled();
    });
});
