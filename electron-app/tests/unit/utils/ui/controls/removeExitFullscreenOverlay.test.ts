import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { removeExitFullscreenOverlay } from "../../../../../utils/ui/controls/removeExitFullscreenOverlay.js";

describe("removeExitFullscreenOverlay", () => {
    let container: HTMLElement;

    beforeEach(() => {
        container = document.createElement("div");
        document.body.appendChild(container);
    });

    afterEach(() => {
        vi.restoreAllMocks();
        container.remove();
    });

    it("throws when container is not a valid element", () => {
        expect(() =>
            removeExitFullscreenOverlay(null as unknown as HTMLElement)
        ).toThrowError("Container must be a valid DOM element");
    });

    it("removes overlay element and clears cache", () => {
        const overlay = document.createElement("button");
        overlay.classList.add("exit-fullscreen-overlay");
        const removeSpy = vi.fn(() => overlay.parentNode?.removeChild(overlay));
        overlay.remove = removeSpy as typeof overlay.remove;
        container.appendChild(overlay);

        removeExitFullscreenOverlay(container);

        expect(removeSpy).toHaveBeenCalledTimes(1);
        expect(container.querySelector(".exit-fullscreen-overlay")).toBeNull();

        const debugSpy = vi
            .spyOn(console, "debug")
            .mockImplementation(() => {});
        removeExitFullscreenOverlay(container);
        expect(debugSpy).toHaveBeenCalledWith(
            expect.stringContaining(
                "No exit fullscreen overlay found in container"
            )
        );
    });

    it("propagates removal errors with context", () => {
        const overlay = document.createElement("div");
        overlay.classList.add("exit-fullscreen-overlay");
        overlay.remove = vi.fn(() => {
            throw new Error("removal failed");
        }) as typeof overlay.remove;
        container.appendChild(overlay);
        const errorSpy = vi
            .spyOn(console, "error")
            .mockImplementation(() => {});

        expect(() => removeExitFullscreenOverlay(container)).toThrowError(
            "removal failed"
        );
        expect(errorSpy).toHaveBeenCalledWith(
            expect.stringContaining(
                "Failed to remove exit fullscreen overlay:"
            ),
            expect.any(Error)
        );
    });

    it("locates overlay using DOM fallback when not cached", () => {
        const overlay = document.createElement("div");
        overlay.classList.add("exit-fullscreen-overlay");
        const querySpy = vi
            .spyOn(container, "querySelector")
            .mockReturnValue(overlay);
        const removeSpy = vi.fn(() => overlay.parentNode?.removeChild(overlay));
        overlay.remove = removeSpy as typeof overlay.remove;

        removeExitFullscreenOverlay(container);

        expect(querySpy).toHaveBeenCalledWith(".exit-fullscreen-overlay");
        expect(removeSpy).toHaveBeenCalledTimes(1);
    });
});
