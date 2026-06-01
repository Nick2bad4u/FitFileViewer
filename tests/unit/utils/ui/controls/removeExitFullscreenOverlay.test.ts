import { describe, expect, it, vi } from "vitest";

import { removeExitFullscreenOverlay } from "../../../../../electron-app/utils/ui/controls/removeExitFullscreenOverlay.js";

function createContainer(): HTMLElement {
    const container = document.createElement("div");
    document.body.append(container);
    return container;
}

function resetTestState(container?: HTMLElement): void {
    vi.restoreAllMocks();
    container?.remove();
    document.body.innerHTML = "";
}

describe(removeExitFullscreenOverlay, () => {
    it("throws when container is not a valid element", () => {
        expect.assertions(1);

        expect(() =>
            removeExitFullscreenOverlay(null as unknown as HTMLElement)
        ).toThrow("Container must be a valid DOM element");
    });

    it("removes overlay element and clears cache", () => {
        expect.assertions(3);

        const container = createContainer();
        const overlay = document.createElement("button");
        overlay.classList.add("exit-fullscreen-overlay");
        const removeSpy = vi.fn<() => void>(() => {
            overlay.parentNode?.removeChild(overlay);
        });
        overlay.remove = removeSpy as typeof overlay.remove;
        container.append(overlay);

        removeExitFullscreenOverlay(container);

        expect(removeSpy).toHaveBeenCalledOnce();
        expect(container.querySelector(".exit-fullscreen-overlay")).toBeNull();

        const debugSpy = vi
            .spyOn(console, "debug")
            .mockImplementation(() => {});
        removeExitFullscreenOverlay(container);

        expect(debugSpy).toHaveBeenCalledWith(
            "[removeExitFullscreenOverlay] No exit fullscreen overlay found in container"
        );

        resetTestState(container);
    });

    it("falls back to parentNode removal when element.remove is unavailable", () => {
        expect.assertions(2);

        const container = createContainer();
        const overlay = document.createElement("button");
        overlay.classList.add("exit-fullscreen-overlay");
        Object.defineProperty(overlay, "remove", {
            configurable: true,
            value: undefined,
        });
        container.append(overlay);

        removeExitFullscreenOverlay(container);

        expect(container.querySelector(".exit-fullscreen-overlay")).toBeNull();
        expect(overlay.parentNode).toBeNull();

        resetTestState(container);
    });

    it("propagates removal errors with context", () => {
        expect.assertions(2);

        const container = createContainer();
        const overlay = document.createElement("div");
        overlay.classList.add("exit-fullscreen-overlay");
        overlay.remove = vi.fn<() => void>(() => {
            throw new Error("removal failed");
        }) as typeof overlay.remove;
        container.append(overlay);
        const errorSpy = vi
            .spyOn(console, "error")
            .mockImplementation(() => {});

        expect(() => removeExitFullscreenOverlay(container)).toThrow(
            "removal failed"
        );
        expect(errorSpy).toHaveBeenCalledWith(
            "[removeExitFullscreenOverlay] Failed to remove exit fullscreen overlay:",
            expect.any(Error)
        );

        resetTestState(container);
    });

    it("locates overlay using DOM fallback when not cached", () => {
        expect.assertions(3);

        const container = createContainer();
        const overlay = document.createElement("div");
        overlay.classList.add("exit-fullscreen-overlay");
        container.append(overlay);
        const querySpy = vi.spyOn(container, "querySelector");
        const removeSpy = vi.fn<() => void>(() => {
            overlay.parentNode?.removeChild(overlay);
        });
        overlay.remove = removeSpy as typeof overlay.remove;

        removeExitFullscreenOverlay(container);

        expect(querySpy).toHaveBeenCalledWith(".exit-fullscreen-overlay");
        expect(removeSpy).toHaveBeenCalledOnce();
        expect(container.querySelector(".exit-fullscreen-overlay")).toBeNull();

        resetTestState(container);
    });
});
