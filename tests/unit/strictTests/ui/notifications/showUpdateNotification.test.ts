import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { RendererElectronApiScope } from "../../../../../electron-app/utils/runtime/electronApiRuntime.js";
import type { NotificationTimerRuntime } from "../../../../../electron-app/utils/ui/notifications/notificationTimerRuntime.js";
import type { ShowUpdateNotificationRuntime } from "../../../../../electron-app/utils/ui/notifications/showUpdateNotificationRuntime.js";

type UpdateElectronApi = {
    installUpdate: () => void;
};
type ScopedUpdateElectronApi = {
    api: UpdateElectronApi;
    electronApiScope: RendererElectronApiScope;
};

const createUpdateApiFixture = (): ScopedUpdateElectronApi => {
    const api = {
        installUpdate: vi.fn<() => void>(),
    };

    return {
        api,
        electronApiScope: {
            getElectronAPI: () => api,
        },
    };
};

function createNotificationHost(): HTMLDivElement {
    const host = document.createElement("div");
    host.id = "notification";
    document.body.appendChild(host);
    return host;
}

function getNotificationButtons(host: HTMLElement): HTMLButtonElement[] {
    return Array.from(host.querySelectorAll("button"));
}

function getRequiredNotificationButton(
    buttons: readonly HTMLButtonElement[],
    text: string
): HTMLButtonElement {
    const button = buttons.find((candidate) => candidate.textContent === text);

    if (!button) {
        throw new Error(`Expected ${text} notification button`);
    }

    return button;
}

function stripRendererLogPrefix(message: unknown): string {
    return String(message).replace(/^\[[^\]]+\] \[renderer\] /u, "");
}

describe("showUpdateNotification", () => {
    beforeEach(() => {
        document.body.replaceChildren();
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.runOnlyPendingTimers();
        vi.useRealTimers();
        vi.restoreAllMocks();
    });

    it("returns early when notification element missing", async () => {
        expect.assertions(1);

        const mod =
            await import("../../../../../electron-app/utils/ui/notifications/showUpdateNotification.js");
        // Should not throw
        mod.showUpdateNotification("msg", "info");
        // Nothing to assert in DOM
        expect(document.getElementById("notification")).toBeNull();
    });

    it("renders message and update downloaded buttons; actions work", async () => {
        expect.assertions(10);

        const host = createNotificationHost();
        const { api, electronApiScope } = createUpdateApiFixture();

        const { showUpdateNotification } =
            await import("../../../../../electron-app/utils/ui/notifications/showUpdateNotification.js");

        showUpdateNotification(
            "Update ready",
            "success",
            0,
            "update-downloaded",
            { electronApiScope }
        );
        const buttons = getNotificationButtons(host);
        expect(buttons).toHaveLength(2);
        expect(host.className).toBe("notification success");
        expect(host.style.display).toBe("block");
        expect(host.textContent).toContain("Update ready");

        const restartButton = getRequiredNotificationButton(
                buttons,
                "Restart & Update"
            ),
            laterButton = getRequiredNotificationButton(buttons, "Later");

        expect(restartButton.className).toBe("themed-btn");
        expect(restartButton.textContent).toBe("Restart & Update");
        expect(laterButton.className).toBe("themed-btn");
        expect(laterButton.style.marginLeft).toBe("10px");

        restartButton.click();
        expect(api.installUpdate).toHaveBeenCalledWith();

        laterButton.click();
        expect(host.style.display).toBe("none");
    });

    it("auto hides when withAction is true (single button) using timers", async () => {
        expect.assertions(5);

        const host = createNotificationHost();
        const { api, electronApiScope } = createUpdateApiFixture();

        const { showUpdateNotification } =
            await import("../../../../../electron-app/utils/ui/notifications/showUpdateNotification.js");
        showUpdateNotification("Update available", "info", 1234, true, {
            electronApiScope,
        });
        expect(host.className).toBe("notification info");
        expect(host.style.display).toBe("block");
        expect(getNotificationButtons(host)).toHaveLength(1);
        getRequiredNotificationButton(
            getNotificationButtons(host),
            "Restart & Update"
        ).click();
        expect(api.installUpdate).toHaveBeenCalledOnce();

        vi.runAllTimers();
        expect(host.style.display).toBe("none");
    });

    it("uses injected DOM and timer runtimes for auto-hide notifications", async () => {
        expect.assertions(8);

        const host = createNotificationHost();
        const timeoutHandle = Number("59");
        const timerRuntime: NotificationTimerRuntime = {
            clearTimeout: vi.fn(),
            dateNow: vi.fn(() => Number("1000")),
            setTimeout: vi.fn(() => timeoutHandle),
        };
        const notificationRuntime: ShowUpdateNotificationRuntime = {
            createElement: vi.fn((tagName) =>
                document.createElement(tagName)
            ) as ShowUpdateNotificationRuntime["createElement"],
            queryNotificationElement: vi.fn(() => host),
        };

        const { showUpdateNotification } =
            await import("../../../../../electron-app/utils/ui/notifications/showUpdateNotification.js");

        showUpdateNotification("Injected update", "info", 4321, false, {
            notificationRuntime,
            timerRuntime,
        });

        expect(
            notificationRuntime.queryNotificationElement
        ).toHaveBeenCalledWith("#notification");
        expect(notificationRuntime.createElement).toHaveBeenCalledWith("span");
        expect(host.textContent).toBe("Injected update");
        expect(host.style.display).toBe("block");
        expect(timerRuntime.setTimeout).toHaveBeenCalledExactlyOnceWith(
            expect.any(Function),
            4321
        );

        showUpdateNotification("Replacement update", "success", 0, false, {
            notificationRuntime,
            timerRuntime,
        });

        expect(timerRuntime.clearTimeout).toHaveBeenCalledExactlyOnceWith(
            timeoutHandle
        );
        expect(host.textContent).toBe("Replacement update");
        expect(host.className).toBe("notification success");
    });

    it("logs update install failures when electronAPI is missing", async () => {
        expect.assertions(4);

        const host = createNotificationHost();
        const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
        const errorSpy = vi
            .spyOn(console, "error")
            .mockImplementation(() => {});
        const { showUpdateNotification } =
            await import("../../../../../electron-app/utils/ui/notifications/showUpdateNotification.js");

        showUpdateNotification("Try update", "info", 0, true);
        getRequiredNotificationButton(
            getNotificationButtons(host),
            "Restart & Update"
        ).click();

        expect(host.style.display).toBe("block");
        expect(getNotificationButtons(host)).toHaveLength(1);
        expect(
            warnSpy.mock.calls.map(([message]) =>
                stripRendererLogPrefix(message)
            )
        ).toStrictEqual([
            "ShowUpdateNotification: electronAPI.installUpdate not available",
        ]);
        expect(
            errorSpy.mock.calls.map(([message]) =>
                stripRendererLogPrefix(message)
            )
        ).toStrictEqual([
            "ShowUpdateNotification: Cannot install update - electronAPI not available",
        ]);
    });

    it("rejects malformed scoped update APIs without invoking install", async () => {
        expect.assertions(5);

        const host = createNotificationHost();
        const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
        const errorSpy = vi
            .spyOn(console, "error")
            .mockImplementation(() => {});
        const getElectronAPI = vi.fn<() => unknown>(() => ({
            installUpdate: "restart",
        }));
        const electronApiScope: RendererElectronApiScope = {
            getElectronAPI,
        };

        const { showUpdateNotification } =
            await import("../../../../../electron-app/utils/ui/notifications/showUpdateNotification.js");

        showUpdateNotification("Try malformed update", "info", 0, true, {
            electronApiScope,
        });
        getRequiredNotificationButton(
            getNotificationButtons(host),
            "Restart & Update"
        ).click();

        expect(host.style.display).toBe("block");
        expect(getNotificationButtons(host)).toHaveLength(1);
        expect(getElectronAPI).toHaveBeenCalledOnce();
        expect(
            warnSpy.mock.calls.map(([message]) =>
                stripRendererLogPrefix(message)
            )
        ).toStrictEqual([
            "ShowUpdateNotification: electronAPI.installUpdate not available",
        ]);
        expect(
            errorSpy.mock.calls.map(([message]) =>
                stripRendererLogPrefix(message)
            )
        ).toStrictEqual([
            "ShowUpdateNotification: Cannot install update - electronAPI not available",
        ]);
    });
});
