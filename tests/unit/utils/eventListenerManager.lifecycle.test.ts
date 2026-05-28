import { describe, it, expect, vi, beforeEach } from "vitest";
import {
    addEventListenerWithCleanup,
    cleanupEventListeners,
    getListenerCount,
    addDragDropListeners,
} from "../../../electron-app/utils/ui/events/eventListenerManager.js";

describe("eventListenerManager listener lifecycle", () => {
    beforeEach(() => {
        // Ensure document body is clean and no lingering listeners via cleanup
        cleanupEventListeners();
    });

    it("adds and removes a listener, tracking count", () => {
        const handler = vi.fn();
        const cleanup = addEventListenerWithCleanup(window, "click", handler);
        expect(typeof cleanup).toBe("function");
        expect(getListenerCount()).toBe(1);

        // Dispatch event
        const firstClick = new CustomEvent("click", {
            detail: "before-cleanup",
        });
        window.dispatchEvent(firstClick);
        expect(handler).toHaveBeenCalledTimes(1);

        // Remove
        cleanup();
        expect(getListenerCount()).toBe(0);
        const secondClick = new CustomEvent("click", {
            detail: "after-cleanup",
        });
        window.dispatchEvent(secondClick);
        expect(handler.mock.calls).toStrictEqual([[firstClick]]);
    });

    it("returns no-op when given invalid element", () => {
        const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
        const cleanup = addEventListenerWithCleanup(
            null as any,
            "click",
            (() => {}) as any
        );
        expect(typeof cleanup).toBe("function");
        cleanup(); // should be safe no-op
        expect(warn).toHaveBeenCalledWith(
            "[EventListenerManager] Invalid element provided to addEventListenerWithCleanup"
        );
    });

    it("returns no-op when given invalid handler", () => {
        const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
        const cleanup = addEventListenerWithCleanup(
            window,
            "click",
            null as any
        );
        expect(typeof cleanup).toBe("function");
        cleanup();
        expect(warn).toHaveBeenCalledWith(
            "[EventListenerManager] Invalid handler provided to addEventListenerWithCleanup"
        );
    });

    it("cleanupEventListeners removes all tracked listeners and logs count", () => {
        const log = vi.spyOn(console, "log").mockImplementation(() => {});
        const h1 = vi.fn();
        const h2 = vi.fn();
        addEventListenerWithCleanup(window, "focus", h1);
        addEventListenerWithCleanup(window, "blur", h2);
        expect(getListenerCount()).toBe(2);
        cleanupEventListeners();
        expect(getListenerCount()).toBe(0);
        expect(log).toHaveBeenCalledWith(
            "[EventListenerManager] Cleaned up 2 event listeners"
        );
    });

    it("addDragDropListeners wires up provided handlers and supports cleanup", () => {
        const onDragEnter = vi.fn();
        const onDragLeave = vi.fn();
        const onDragOver = vi.fn();
        const onDrop = vi.fn();
        const cleanup = addDragDropListeners(
            { onDragEnter, onDragLeave, onDragOver, onDrop },
            window
        );
        // Sanity: should track 4 listeners
        expect(getListenerCount()).toBeGreaterThanOrEqual(4);

        // Dispatch events
        window.dispatchEvent(new Event("dragenter"));
        window.dispatchEvent(new Event("dragleave"));
        window.dispatchEvent(new Event("dragover"));
        window.dispatchEvent(new Event("drop"));
        expect(onDragEnter).toHaveBeenCalledOnce();
        expect(onDragLeave).toHaveBeenCalledOnce();
        expect(onDragOver).toHaveBeenCalledOnce();
        expect(onDrop).toHaveBeenCalledOnce();

        cleanup();
        expect(getListenerCount()).toBe(0);
    });
});
