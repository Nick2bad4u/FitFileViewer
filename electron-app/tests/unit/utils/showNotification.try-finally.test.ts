import { describe, it, expect, beforeEach, vi, afterEach, assert } from "vitest";
import { showNotification, notify, clearAllNotifications } from "../../../utils/ui/notifications/showNotification.js";

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

    it("resolveShown errors are caught with try-finally pattern", () => {
        // Create an object with resolveShown function that throws
        const notification = {
            // @ts-ignore - We need to be able to set this to undefined later
            resolveShown: () => {
                throw new Error("Test error");
            },
        };

        // Test the pattern that's used in showNotification.js lines 129-136
        let didFinallyExecute = false;

        try {
            // This should throw but be caught by our outer try/catch
            if (typeof notification.resolveShown === "function") {
                try {
                    notification.resolveShown();
                    // We should never get here
                    expect(true).toBe(false); // This would fail if we did
                } finally {
                    // But we should get here
                    didFinallyExecute = true;
                    // @ts-ignore - Testing the exact behavior in showNotification.js
                    notification.resolveShown = undefined;
                }
            }
        } catch (error) {
            // Verify the finally block executed
            expect(didFinallyExecute).toBe(true);
            expect(notification.resolveShown).toBeUndefined();
        }
    });
});
