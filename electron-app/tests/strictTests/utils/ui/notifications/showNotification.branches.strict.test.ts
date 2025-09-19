import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
    showNotification,
    notify,
    clearAllNotifications,
    processNotificationQueue,
    __testResetNotifications,
} from "../../../../../utils/ui/notifications/showNotification.js";
import * as notifMod from "../../../../../utils/ui/notifications/showNotification.js";

describe("showNotification.js - branches (strict)", () => {
    const originalWarn = console.warn;
    const originalError = console.error;
    const originalRAF = window.requestAnimationFrame;

    beforeEach(() => {
        vi.useFakeTimers();
        vi.restoreAllMocks();
        console.warn = vi.fn();
        console.error = vi.fn();
        window.requestAnimationFrame = (cb: FrameRequestCallback): number => {
            cb(0);
            // jsdom doesn't care about the return value; 0 is fine
            return 0 as unknown as number;
        };
        document.body.innerHTML = '<div id="notification" class="notification" style="display:none"></div>';
        __testResetNotifications();
    });

    afterEach(() => {
        try {
            vi.runOnlyPendingTimers();
        } catch {
            // ignore when no pending timers
        }
        vi.useRealTimers();
        console.warn = originalWarn;
        console.error = originalError;
        window.requestAnimationFrame = originalRAF;
        document.body.innerHTML = "";
        clearAllNotifications();
        __testResetNotifications();
    });

    it("falls back to 'info' when unknown type is provided and logs a warning", async () => {
        const p = showNotification("Hello world", "unknown" as any, 100);
        await p;
        const el = document.getElementById("notification")!;
        // Class should include 'info' after fallback
        expect(el.className).toContain("info");
        expect(console.warn).toHaveBeenCalledWith(
            "showNotification: Unknown notification type 'unknown', falling back to 'info'"
        );
    });

    it("returns early and warns on invalid message", async () => {
        const res1 = showNotification(123 as any);
        // async functions always return a Promise, even on early return
        expect(res1).toBeInstanceOf(Promise);
        await res1;
        expect(console.warn).toHaveBeenCalledWith("showNotification: Invalid message provided");

        // Empty string should also warn and return
        const res2 = showNotification("");
        expect(res2).toBeInstanceOf(Promise);
        await res2;
        expect(
            (console.warn as any).mock.calls.filter((c: any[]) => c[0] === "showNotification: Invalid message provided")
                .length
        ).toBeGreaterThanOrEqual(2);
    });

    it("triggers onClick when clicking outside actions and hides", async () => {
        const onClick = vi.fn();
        const p = showNotification("Clickable", "info", undefined, { onClick, persistent: true });
        await p;
        const el = document.getElementById("notification")!;
        // Dispatch a click with target as the element itself (outside actions)
        el.dispatchEvent(new MouseEvent("click", { bubbles: true }));
        expect(onClick).toHaveBeenCalledTimes(1);
        // Hide runs with 300ms transition
        vi.advanceTimersByTime(300);
        expect(el.style.display).toBe("none");
    });

    it("close button click hides persistent notification", async () => {
        const p = notify.persistent("Persistent one");
        await p;
        const el = document.getElementById("notification")!;
        const closeBtn = el.querySelector(".notification-close") as HTMLButtonElement;
        expect(closeBtn).toBeTruthy();
        closeBtn.click();
        vi.advanceTimersByTime(300);
        expect(el.style.display).toBe("none");
    });

    it("omits icon element when options.icon is an empty string", async () => {
        const p = showNotification("No icon please", "info", undefined, { icon: "" });
        await p;
        const el = document.getElementById("notification")!;
        expect(el.querySelector(".notification-icon")).toBeNull();
    });

    it("action with onClick executes and clears hideTimeout before transition hides", async () => {
        const onAction = vi.fn();
        const p = showNotification("With action", "info", 500, { actions: [{ text: "Do it", onClick: onAction }] });
        await p;
        const el = document.getElementById("notification")! as any;
        const spyClear = vi.spyOn(window, "clearTimeout");
        // Pre-set a timeout to ensure hideNotification clears it on click
        el.hideTimeout = setTimeout(() => {
            /* no-op */
        }, 999_999);
        const btn = el.querySelector(".notification-actions button") as HTMLButtonElement;
        btn.click();
        expect(onAction).toHaveBeenCalledTimes(1);
        expect(spyClear).toHaveBeenCalled();
        vi.advanceTimersByTime(300);
        expect((document.getElementById("notification") as HTMLElement).style.display).toBe("none");
        spyClear.mockRestore();
    });

    it("processNotificationQueue handles empty queue without side effects", async () => {
        __testResetNotifications();
        await processNotificationQueue();
        // Nothing to assert besides no throw; cover the empty-queue branch
        expect(true).toBe(true);
    });

    it("uses the default type duration when none is provided (error => 6000ms)", async () => {
        const p = showNotification("Default duration path", "error");
        await p; // visible
        const el = document.getElementById("notification")! as any;
        // Should be visible initially
        expect(el.style.display).toBe("flex");

        // Advance just before the default duration; still visible
        vi.advanceTimersByTime(5999);
        expect(el.style.display).toBe("flex");

        // Advance to the duration boundary; hideNotification schedules a 300ms transition
        vi.advanceTimersByTime(1);
        expect(el.style.display).toBe("flex");

        // Advance almost all transition time; still visible
        vi.advanceTimersByTime(299);
        expect(el.style.display).toBe("flex");

        // Final 1ms triggers the hide after transition
        vi.advanceTimersByTime(1);
        expect(el.style.display).toBe("none");
    });

    it("clicking an action button does not invoke container onClick", async () => {
        const onContainerClick = vi.fn();
        const p = showNotification("Action present", "info", undefined, {
            onClick: onContainerClick,
            actions: [{ text: "Act" }],
        });
        await p;
        const el = document.getElementById("notification")!;
        const btn = el.querySelector(".notification-actions button") as HTMLButtonElement;
        btn.click();
        // onClick is guarded by target.closest('.notification-actions'); ensure it didn't fire
        expect(onContainerClick).not.toHaveBeenCalled();
    });

    // Note: Back-to-back invocation behavior is covered by explicit queue + flag checks
    // via the 'returns early if already showing' test below, which deterministically
    // exercises the same branch without relying on interleaved microtasks.

    it("processNotificationQueue returns early if already showing", async () => {
        // Start one notification to set isShowingNotification = true inside the processor
        const p = showNotification("Now showing", "info", 1000);
        await p; // visible
        // Enqueue another item manually without starting a new processor
        const fake = {
            message: "Queued",
            type: "info",
            duration: 100,
            icon: "ℹ️",
            ariaLabel: "Information",
            onClick: undefined,
            actions: [],
            timestamp: Date.now(),
            resolveShown: () => {},
        } as any;
        const { notificationQueue } = notifMod as any;
        const before = notificationQueue.length;
        notificationQueue.push(fake);
        // Call processor explicitly while first is still shown; should early return and not shift
        await processNotificationQueue();
        expect(notificationQueue.length).toBe(before + 1);
    });

    it("logs errors and resolves when display pipeline throws (build fails)", async () => {
        // Make document.createElement throw on first call to trigger rejection from displayNotification
        const origCreate = document.createElement.bind(document);
        const spy = vi
            .spyOn(document, "createElement")
            .mockImplementationOnce(() => {
                throw new Error("createElement fail");
            })
            .mockImplementation(origCreate as any);

        const p = showNotification("Boom", "info", 100);
        await p; // should resolve due to catch resolving resolveShown

        // At least one console.error call should include the prefix
        const errorCalls = (console.error as any).mock.calls as any[];
        expect(errorCalls.some((args) => String(args[0]).includes("Error displaying notification"))).toBe(true);

        // Restore explicitly to avoid cross-test effects
        spy.mockRestore();
    });
});
