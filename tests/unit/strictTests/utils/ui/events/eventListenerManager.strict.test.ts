import { describe, it, expect, vi } from "vitest";
import {
    addEventListenerWithCleanup,
    cleanupEventListeners,
    getListenerCount,
} from "../../../../../../electron-app/utils/ui/events/eventListenerManager.js";

describe("eventListenerManager.strict branches", () => {
    it("warns if aborting an event listener throws during cleanup", () => {
        expect.hasAssertions();

        const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
        const el = document.createElement("div");
        const abortSpy = vi
            .spyOn(AbortController.prototype, "abort")
            .mockImplementationOnce(() => {
                throw new Error("abort fail");
            });

        const cleanup = addEventListenerWithCleanup(el, "click", () => {});

        expect(getListenerCount()).toBe(1);
        expect(() => cleanup()).not.toThrow();
        expect(warn).toHaveBeenCalledWith(
            "[EventListenerManager] Error removing event listener:",
            expect.any(Error)
        );

        abortSpy.mockRestore();
        cleanupEventListeners();
    });
});
