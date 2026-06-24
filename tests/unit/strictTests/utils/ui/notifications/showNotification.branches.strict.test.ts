import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
    showNotification,
    notify,
    clearAllNotifications,
    processNotificationQueue,
    __testResetNotifications,
    isShowingNotification,
    notificationQueue,
} from "../../../../../../electron-app/utils/ui/notifications/showNotification.js";
import type {
    NotificationElement,
    QueuedNotification,
} from "../../../../../../electron-app/utils/ui/notifications/showNotification.js";
import {
    getShowNotificationRuntime,
    type ShowNotificationRuntime,
} from "../../../../../../electron-app/utils/ui/notifications/showNotificationRuntime.js";
import * as notifMod from "../../../../../../electron-app/utils/ui/notifications/showNotification.js";

describe("showNotification.js - branches (strict)", () => {
    beforeEach(() => {
        vi.useFakeTimers();
        vi.restoreAllMocks();
        vi.spyOn(console, "warn").mockReturnValue(undefined);
        vi.spyOn(console, "error").mockReturnValue(undefined);
        vi.spyOn(window, "requestAnimationFrame").mockImplementation(
            (cb: FrameRequestCallback): number => {
                cb(0);
                // jsdom doesn't care about the return value; 0 is fine
                return 0;
            }
        );
        const notificationElement = document.createElement("div");
        notificationElement.id = "notification";
        notificationElement.className = "notification";
        notificationElement.style.display = "none";
        document.body.replaceChildren(notificationElement);
        __testResetNotifications();
    });

    afterEach(() => {
        try {
            vi.runOnlyPendingTimers();
        } catch {
            // ignore when no pending timers
        }
        vi.useRealTimers();
        document.body.replaceChildren();
        clearAllNotifications();
        __testResetNotifications();
    });

    it("falls back to 'info' when unknown type is provided and logs a warning", async () => {
        expect.hasAssertions();

        const p = showNotification("Hello world", "unknown", 100);
        await p;
        const el = document.getElementById("notification")!;
        // Class should include 'info' after fallback
        expect(el.className).toContain("info");
        expect(console.warn).toHaveBeenCalledWith(
            "showNotification: Unknown notification type 'unknown', falling back to 'info'"
        );
    });

    it("returns early and warns on invalid message", async () => {
        expect.hasAssertions();

        const res1 = showNotification(123 as unknown as string);
        // async functions always return a Promise, even on early return
        expect(res1).toBeInstanceOf(Promise);
        await res1;
        expect(console.warn).toHaveBeenCalledWith(
            "showNotification: Invalid message provided"
        );

        // Empty string should also warn and return
        const res2 = showNotification("");
        expect(res2).toBeInstanceOf(Promise);
        await res2;
        expect(
            vi
                .mocked(console.warn)
                .mock.calls.filter(
                    (call) =>
                        call[0] === "showNotification: Invalid message provided"
                ).length
        ).toBeGreaterThanOrEqual(2);
    });

    it("triggers onClick when clicking outside actions and hides", async () => {
        expect.hasAssertions();

        const onClick = vi.fn<() => void>();
        const p = showNotification("Clickable", "info", undefined, {
            onClick,
            persistent: true,
        });
        await p;
        const el = document.getElementById("notification")!;
        // Dispatch a click with target as the element itself (outside actions)
        el.dispatchEvent(new MouseEvent("click", { bubbles: true }));
        expect(onClick).toHaveBeenCalledOnce();
        // Hide runs with 300ms transition
        vi.advanceTimersByTime(300);
        expect(el.style.display).toBe("none");
    });

    it("close button click hides persistent notification", async () => {
        expect.hasAssertions();

        const p = notify.persistent("Persistent one");
        await p;
        const el = document.getElementById("notification")!;
        const closeBtn = el.querySelector(
            ".notification-close"
        ) as HTMLButtonElement;
        expect(closeBtn).toBeInstanceOf(HTMLButtonElement);
        expect(closeBtn.getAttribute("aria-label")).toBe("Close notification");
        closeBtn.click();
        vi.advanceTimersByTime(300);
        expect(el.style.display).toBe("none");
    });

    it("omits icon element when options.icon is an empty string", async () => {
        expect.hasAssertions();

        const p = showNotification("No icon please", "info", undefined, {
            icon: "",
        });
        await p;
        const el = document.getElementById("notification")!;
        expect(el.querySelector(".notification-icon")).toBeNull();
    });

    it("action with onClick executes and clears hideTimeout before transition hides", async () => {
        expect.hasAssertions();

        const onAction = vi.fn<() => void>();
        const p = showNotification("With action", "info", 500, {
            actions: [{ text: "Do it", onClick: onAction }],
        });
        await p;
        const el = document.getElementById(
            "notification"
        )! as NotificationElement;
        const spyClear = vi.spyOn(window, "clearTimeout");
        // Pre-set a timeout to ensure hideNotification clears it on click
        el.hideTimeout = 123 as unknown as ReturnType<typeof setTimeout>;
        const btn = el.querySelector(
            ".notification-actions button"
        ) as HTMLButtonElement;
        btn.click();
        expect(onAction).toHaveBeenCalledOnce();
        expect(spyClear).toHaveBeenCalledWith(123);
        vi.advanceTimersByTime(300);
        expect(
            (document.getElementById("notification") as HTMLElement).style
                .display
        ).toBe("none");
        spyClear.mockRestore();
    });

    it("processNotificationQueue handles empty queue without side effects", async () => {
        expect.hasAssertions();

        __testResetNotifications();
        await processNotificationQueue();
        expect(isShowingNotification).toBe(false);
        expect(notificationQueue).toHaveLength(0);
    });

    it("uses the default type duration when none is provided (error => 6000ms)", async () => {
        expect.hasAssertions();

        const p = showNotification("Default duration path", "error");
        await p; // visible
        const el = document.getElementById(
            "notification"
        )! as NotificationElement;
        // Should be visible initially
        expect(el.style.display).toBe("flex");
        expect(el.classList.contains("show")).toBe(true);
        const initialHideTimeout = el.hideTimeout;
        expect(Object.prototype.toString.call(initialHideTimeout)).toBe(
            "[object Object]"
        );
        expect(Number(initialHideTimeout)).toBeGreaterThan(0);

        // Advance just before the default duration; still visible
        vi.advanceTimersByTime(5999);
        expect(el.className).toBe("notification error show");

        // Advance to the duration boundary; hideNotification schedules a 300ms transition
        vi.advanceTimersByTime(1);
        expect(el.classList.contains("show")).toBe(false);
        expect(el.hideTimeout).toBeUndefined();

        // Advance almost all transition time; still visible
        vi.advanceTimersByTime(299);
        expect(el.style.display).not.toBe("none");

        // Final 1ms triggers the hide after transition
        vi.advanceTimersByTime(1);
        expect(el.style.display).toBe("none");
    });

    it("clicking an action button does not invoke container onClick", async () => {
        expect.hasAssertions();

        const onContainerClick = vi.fn<() => void>();
        const p = showNotification("Action present", "info", undefined, {
            onClick: onContainerClick,
            actions: [{ text: "Act" }],
        });
        await p;
        const el = document.getElementById("notification")!;
        const btn = el.querySelector(
            ".notification-actions button"
        ) as HTMLButtonElement;
        btn.click();
        // onClick is guarded by target.closest('.notification-actions'); ensure it didn't fire
        expect(onContainerClick).not.toHaveBeenCalled();
        vi.advanceTimersByTime(300);
        expect(el.style.display).toBe("none");
    });

    // Note: Back-to-back invocation behavior is covered by explicit queue + flag checks
    // via the 'returns early if already showing' test below, which deterministically
    // exercises the same branch without relying on interleaved microtasks.

    it("processNotificationQueue returns early if already showing", async () => {
        expect.hasAssertions();

        // Start one notification to set isShowingNotification = true inside the processor
        const p = showNotification("Now showing", "info", 1000);
        await p; // visible
        // Enqueue another item manually without starting a new processor
        const fake: QueuedNotification = {
            message: "Queued",
            type: "info",
            duration: 100,
            icon: "ℹ️",
            ariaLabel: "Information",
            onClick: undefined,
            actions: [],
            timestamp: Date.now(),
            runtime: getShowNotificationRuntime(),
            resolveShown: vi.fn<() => void>(),
        };
        const before = notificationQueue.length;
        notificationQueue.push(fake);
        // Call processor explicitly while first is still shown; should early return and not shift
        await processNotificationQueue();
        expect(notificationQueue).toHaveLength(before + 1);
    });

    it("uses the injected runtime for DOM, animation, and timeout work", async () => {
        expect.assertions(9);

        const host = document.getElementById(
            "notification"
        )! as NotificationElement;
        const runtime: ShowNotificationRuntime = {
            cancelAnimationFrame: vi.fn(),
            clearTimeout: vi.fn((timer) => {
                window.clearTimeout(timer as ReturnType<typeof setTimeout>);
            }),
            createElement: vi.fn((tagName) =>
                document.createElement(tagName)
            ) as ShowNotificationRuntime["createElement"],
            dateNow: vi.fn(() => Number("1000")),
            queryElement: vi.fn(() => host),
            requestAnimationFrame: vi.fn((onFrame) => {
                onFrame(0);
                return Number("42");
            }),
            setTimeout: vi.fn((callback, timeout) =>
                window.setTimeout(callback, timeout)
            ),
        };

        await showNotification("Injected runtime", "success", 250, {
            runtime,
        });

        expect(runtime.queryElement).toHaveBeenCalledWith("#notification");
        expect(runtime.dateNow).toHaveBeenCalledOnce();
        expect(runtime.createElement).toHaveBeenCalledWith("div");
        expect(runtime.createElement).toHaveBeenCalledWith("span");
        expect(runtime.requestAnimationFrame).toHaveBeenCalledOnce();
        expect(runtime.setTimeout).toHaveBeenCalledWith(
            expect.any(Function),
            250
        );
        expect(runtime.setTimeout).toHaveBeenCalledWith(
            expect.any(Function),
            550
        );
        expect(host.textContent).toBe("✅Injected runtime");

        vi.advanceTimersByTime(250);

        expect(runtime.clearTimeout).toHaveBeenCalledWith(
            expect.any(Object)
        );
    });

    it("logs errors and resolves when display pipeline throws (build fails)", async () => {
        expect.hasAssertions();

        // Make document.createElement throw on first call to trigger rejection from displayNotification
        const origCreate = document.createElement.bind(document);
        const spy = vi
            .spyOn(document, "createElement")
            .mockImplementationOnce((): never => {
                throw new Error("createElement fail");
            })
            .mockImplementation(origCreate);

        const p = showNotification("Boom", "info", 100);
        await p; // should resolve due to catch resolving resolveShown

        // At least one console.error call should include the prefix
        const errorCalls = vi.mocked(console.error).mock.calls;
        expect(
            errorCalls.some((args) =>
                String(args[0]).includes("Error displaying notification")
            )
        ).toBe(true);
        expect(errorCalls).toEqual(
            expect.arrayContaining([
                [
                    "Error displaying notification:",
                    expect.objectContaining({ message: "createElement fail" }),
                ],
                ["Error displaying notification: createElement fail"],
            ])
        );
        expect(notifMod.isShowingNotification).toBe(false);
        expect(notifMod.notificationQueue).toHaveLength(0);

        // Restore explicitly to avoid cross-test effects
        spy.mockRestore();
    });
});
