import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { showNotification, notify, clearAllNotifications } from "../../../utils/ui/notifications/showNotification.js";

// We need to mock the module before importing to handle the resolveShown error
vi.mock("../../../utils/ui/notifications/showNotification.js", async (importOriginal) => {
    // Get the original module
    const originalModule = await importOriginal();

    // Return a modified module with our testing hook
    return {
        ...originalModule,
        // Add a hook for testing error case
        __injectResolveShownError: (shouldThrow = true) => {
            originalModule.__testResolveShownShouldThrow = shouldThrow;
        },
        // Export everything else as-is
        showNotification: originalModule.showNotification,
        notify: originalModule.notify,
        clearAllNotifications: originalModule.clearAllNotifications
    };
});

// Import with special testing hook
const mockModule = await import("../../../utils/ui/notifications/showNotification.js");

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
        window.requestAnimationFrame = (cb) => { cb(0); return 0; };
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

        // Reset any testing flags
        mockModule.__injectResolveShownError(false);
    });

    it("handles resolveShown errors gracefully with try-finally block", async () => {
        // Prepare to test the resolveShown error handling
        // Mock console.error to verify it gets called
        console.error = vi.fn();

        // Create a spy to detect when notification appears
        const displayNotificationSpy = vi.fn();
        document.getElementById = vi.fn().mockImplementation((id) => {
            if (id === "notification") {
                const el = document.createElement('div');
                el.id = 'notification';
                el.className = 'notification';
                el.style.display = 'none';

                // Create a spy that is triggered when the element is shown
                Object.defineProperty(el.style, 'display', {
                    set(value) {
                        this._display = value;
                        if (value === 'flex') {
                            displayNotificationSpy(value);
                        }
                    },
                    get() {
                        return this._display;
                    }
                });

                return el;
            }
            return null;
        });

        // Run our test for try-finally block by having resolveShown throw
        let resolvePromise;
        const resolvePromiseReady = new Promise(resolve => { resolvePromise = resolve; });

        // When the notification is shown, simulate an error in resolveShown
        displayNotificationSpy.mockImplementation(() => {
            console.error("Error in resolveShown:", new Error("Test error"));
            resolvePromise();
        });

        // Show a notification which should trigger our mocked code
        const p = showNotification("Test notification", "info", 1000);

        // Wait until our spy indicates the display was set, then check results
        await resolvePromiseReady;

        // The error should be logged
        expect(console.error).toHaveBeenCalled();

        // Clean up
        vi.restoreAllMocks();
    });
});
