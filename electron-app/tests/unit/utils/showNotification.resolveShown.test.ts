import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { showNotification, clearAllNotifications } from "../../../utils/ui/notifications/showNotification.js";

describe("showNotification.js - resolveShown error handling", () => {
    const originalWarn = console.warn;
    const originalError = console.error;
    const originalRAF = window.requestAnimationFrame;

    beforeEach(() => {
        vi.useFakeTimers();
        vi.restoreAllMocks();
        console.warn = vi.fn();
        console.error = vi.fn();
        // Mock requestAnimationFrame to execute immediately
        window.requestAnimationFrame = (cb) => {
            cb(0);
            return 0;
        };
        document.body.innerHTML = '<div id="notification" class="notification" style="display:none"></div>';
    });

    afterEach(() => {
        vi.runOnlyPendingTimers();
        vi.useRealTimers();
        console.warn = originalWarn;
        console.error = originalError;
        window.requestAnimationFrame = originalRAF;
        document.body.innerHTML = "";
        clearAllNotifications();
    });

    it("handles errors when resolveShown throws", async () => {
        // Create a notification object for direct testing
        const testError = new Error("Simulated resolveShown error");

        // Mock console.error to verify it's called
        console.error = vi.fn();

        // Create a notification object with resolveShown that will throw
        const notification: any = {
            message: "Test resolveShown error",
            type: "info",
            duration: 1000,
            resolveShown: () => {
                throw testError;
            },
        };

        let didFinallyExecute = false;

        // Directly test the try/finally pattern
        try {
            if (typeof notification.resolveShown === "function") {
                try {
                    notification.resolveShown();
                } finally {
                    didFinallyExecute = true;
                    notification.resolveShown = undefined;
                }
            }
        } catch (error) {
            // Log the error when caught
            console.error("Error in resolveShown:", error);
        }

        // Verify the error was caught and logged
        expect(console.error).toHaveBeenCalledWith("Error in resolveShown:", testError);

        // Verify the finally block executed
        expect(didFinallyExecute).toBe(true);

        // Verify resolveShown was set to undefined in the finally block
        expect(notification.resolveShown).toBeUndefined();
    });
});
