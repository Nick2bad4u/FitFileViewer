import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { addFullScreenButton, setupFullscreenListeners, setupDOMContentLoaded } from "../utils/addFullScreenButton";

describe("addFullScreenButton", () => {
    let container;
    beforeEach(() => {
        container = document.createElement("div");
        document.body.appendChild(container);
        window.screenfull = {
            isEnabled: true,
            isFullscreen: false,
            request: vi.fn(),
            exit: vi.fn(),
            on: vi.fn(),
        };
    });
    afterEach(() => {
        document.body.removeChild(container);
        delete window.screenfull;
    });
    it("should add the fullscreen button wrapper", () => {
        addFullScreenButton(container);
        expect(container.querySelector(".fullscreen-btn-wrapper")).not.toBeNull();
    });
    it("should not add multiple wrappers", () => {
        addFullScreenButton(container);
        addFullScreenButton(container);
        expect(container.querySelectorAll(".fullscreen-btn-wrapper").length).toBe(1);
    });
    it("should call screenfull.request when button is clicked and not fullscreen", () => {
        addFullScreenButton(container);
        const btn = container.querySelector(".fullscreen-btn");
        btn.click();
        expect(window.screenfull.request).toHaveBeenCalled();
    });
});

describe("setupFullscreenListeners", () => {
    it("should register change event if screenfull is enabled", () => {
        window.screenfull = { isEnabled: true, on: vi.fn() };
        setupFullscreenListeners();
        expect(window.screenfull.on).toHaveBeenCalledWith("change", expect.any(Function));
    });
});

describe("setupDOMContentLoaded", () => {
    it("should add event listener for DOMContentLoaded", () => {
        const spy = vi.spyOn(window, "addEventListener");
        setupDOMContentLoaded();
        expect(spy).toHaveBeenCalledWith("DOMContentLoaded", expect.any(Function));
        spy.mockRestore();
    });
});
