import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { addExitFullscreenOverlay } from "../../../../../utils/ui/controls/addExitFullscreenOverlay.js";

const OVERLAY_CLASS = "exit-fullscreen-overlay";

describe("addExitFullscreenOverlay", () => {
    let exitFullscreenMock: ReturnType<typeof vi.fn>;
    let fullscreenElementRef: Element | null;

    const originalExitFullscreen = (document as any).exitFullscreen;
    const originalFullscreenDescriptor = Object.getOwnPropertyDescriptor(document, "fullscreenElement");

    const setFullscreenElement = (element: Element | null) => {
        fullscreenElementRef = element;
    };

    beforeEach(() => {
        document.body.innerHTML = "";
        fullscreenElementRef = null;
        exitFullscreenMock = vi.fn(async () => {});
        (document as any).exitFullscreen = exitFullscreenMock;

        Object.defineProperty(document, "fullscreenElement", {
            configurable: true,
            get: () => fullscreenElementRef,
        });
    });

    afterEach(() => {
        fullscreenElementRef = null;

        if (originalExitFullscreen) {
            (document as any).exitFullscreen = originalExitFullscreen;
        } else {
            delete (document as any).exitFullscreen;
        }

        if (originalFullscreenDescriptor) {
            Object.defineProperty(document, "fullscreenElement", originalFullscreenDescriptor);
        } else {
            delete (document as any).fullscreenElement;
        }

        vi.restoreAllMocks();
        document.body.innerHTML = "";
    });

    it("throws a TypeError when container is not a valid element", () => {
        expect(() => addExitFullscreenOverlay(null as unknown as HTMLElement)).toThrow(TypeError);
    });

    it("creates an overlay button with the expected structure", () => {
        const container = document.createElement("div");

        addExitFullscreenOverlay(container);

        const button = container.querySelector(`button.${OVERLAY_CLASS}`);
        expect(button).toBeInstanceOf(HTMLButtonElement);
        expect(button?.classList.contains("themed-btn")).toBe(true);
        expect(button?.classList.contains("exit-fullscreen-btn")).toBe(true);
        expect(button?.innerHTML).toContain("Exit Fullscreen Icon");
    });

    it("skips creating a duplicate overlay and logs a debug message", () => {
        const container = document.createElement("div");
        const debugSpy = vi.spyOn(console, "debug").mockImplementation(() => {});

        addExitFullscreenOverlay(container);
        addExitFullscreenOverlay(container);

        const overlays = container.querySelectorAll(`button.${OVERLAY_CLASS}`);
        expect(overlays).toHaveLength(1);
        expect(debugSpy).toHaveBeenCalledWith("[addExitFullscreenOverlay] Overlay already exists, skipping creation");
    });

    it("stops propagation and exits fullscreen when an overlay button is clicked", async () => {
        const container = document.createElement("div");
        setFullscreenElement(container);
        addExitFullscreenOverlay(container);

        const button = container.querySelector(`button.${OVERLAY_CLASS}`);
        expect(button).toBeTruthy();

        const event = new Event("click", { bubbles: true, cancelable: true });
        const stopSpy = vi.spyOn(event, "stopPropagation");

        button?.dispatchEvent(event);

        await Promise.resolve();

        expect(stopSpy).toHaveBeenCalledTimes(1);
        expect(exitFullscreenMock).toHaveBeenCalledTimes(1);
    });

    it("logs a warning instead of calling exitFullscreen when no element is in fullscreen", () => {
        const container = document.createElement("div");
        const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

        setFullscreenElement(null);
        addExitFullscreenOverlay(container);

        const button = container.querySelector(`button.${OVERLAY_CLASS}`);
        expect(button).toBeTruthy();

        const event = new Event("click", { bubbles: true, cancelable: true });
        button?.dispatchEvent(event);

        expect(exitFullscreenMock).not.toHaveBeenCalled();
        expect(warnSpy).toHaveBeenCalledWith("[addExitFullscreenOverlay] No element is currently in fullscreen mode.");
    });

    it("logs an error when exiting fullscreen fails", async () => {
        const container = document.createElement("div");
        const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

        setFullscreenElement(container);
        exitFullscreenMock.mockRejectedValueOnce(new Error("exit failed"));
        addExitFullscreenOverlay(container);

        const button = container.querySelector(`button.${OVERLAY_CLASS}`);
        expect(button).toBeTruthy();

        const event = new Event("click", { bubbles: true, cancelable: true });
        button?.dispatchEvent(event);

        await Promise.resolve();

        expect(exitFullscreenMock).toHaveBeenCalledTimes(1);
        expect(errorSpy).toHaveBeenCalledWith(
            "[addExitFullscreenOverlay] Failed to exit fullscreen mode:",
            expect.any(Error)
        );
    });
});
