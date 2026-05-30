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
        expect.hasAssertions();

        const handler = vi.fn<(event: Event) => void>();
        const cleanup = addEventListenerWithCleanup(window, "click", handler);
        expect(cleanup).toBeTypeOf("function");
        expect({ listenerCount: getListenerCount() }).toStrictEqual({
            listenerCount: 1,
        });

        // Dispatch event
        const firstClick = new CustomEvent("click", {
            detail: "before-cleanup",
        });
        window.dispatchEvent(firstClick);
        expect(handler).toHaveBeenCalledOnce();

        // Remove
        cleanup();
        const secondClick = new CustomEvent("click", {
            detail: "after-cleanup",
        });
        window.dispatchEvent(secondClick);
        expect({
            handlerCalls: handler.mock.calls,
            listenerCount: getListenerCount(),
        }).toStrictEqual({
            handlerCalls: [[firstClick]],
            listenerCount: 0,
        });
    });

    it("returns no-op when given invalid element", () => {
        expect.hasAssertions();

        const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
        const cleanup = addEventListenerWithCleanup(
            null as any,
            "click",
            (() => {}) as any
        );
        expect(cleanup).toBeTypeOf("function");
        cleanup(); // should be safe no-op
        expect(warn).toHaveBeenCalledWith(
            "[EventListenerManager] Invalid element provided to addEventListenerWithCleanup"
        );
    });

    it("returns no-op when given invalid handler", () => {
        expect.hasAssertions();

        const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
        const cleanup = addEventListenerWithCleanup(
            window,
            "click",
            null as any
        );
        expect(cleanup).toBeTypeOf("function");
        cleanup();
        expect(warn).toHaveBeenCalledWith(
            "[EventListenerManager] Invalid handler provided to addEventListenerWithCleanup"
        );
    });

    it("cleanupEventListeners removes all tracked listeners and logs count", () => {
        expect.hasAssertions();

        const log = vi.spyOn(console, "log").mockImplementation(() => {});
        const h1 = vi.fn<(event: Event) => void>();
        const h2 = vi.fn<(event: Event) => void>();
        addEventListenerWithCleanup(window, "focus", h1);
        addEventListenerWithCleanup(window, "blur", h2);
        expect({ listenerCount: getListenerCount() }).toStrictEqual({
            listenerCount: 2,
        });
        cleanupEventListeners();
        expect({
            listenerCount: getListenerCount(),
            logMessages: log.mock.calls.map(([message]) => message),
        }).toStrictEqual({
            listenerCount: 0,
            logMessages: [
                "[EventListenerManager] Cleaned up 2 event listeners",
            ],
        });
    });

    it("addDragDropListeners wires up provided handlers and supports cleanup", () => {
        expect.hasAssertions();

        const onDragEnter = vi.fn<(event: DragEvent) => void>();
        const onDragLeave = vi.fn<(event: DragEvent) => void>();
        const onDragOver = vi.fn<(event: DragEvent) => void>();
        const onDrop = vi.fn<(event: DragEvent) => void>();
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
        expect({ listenerCount: getListenerCount() }).toStrictEqual({
            listenerCount: 0,
        });
    });
});
