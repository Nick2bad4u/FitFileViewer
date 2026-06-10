import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
    registerRendererElectronApiCandidate as registerElectronApiCandidate,
    resetRendererElectronApiCandidate as resetElectronApiCandidate,
} from "../../../../../electron-app/utils/runtime/electronApiRuntime.js";

type UpdateElectronApi = {
    installUpdate: () => void;
};

const installUpdateApi = (): UpdateElectronApi => {
    const api = {
        installUpdate: vi.fn<() => void>(),
    };

    registerElectronApiCandidate(api);

    return api;
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
        resetElectronApiCandidate();
    });

    afterEach(() => {
        vi.runOnlyPendingTimers();
        vi.useRealTimers();
        vi.restoreAllMocks();
        resetElectronApiCandidate();
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
        const api = installUpdateApi();

        const { showUpdateNotification } =
            await import("../../../../../electron-app/utils/ui/notifications/showUpdateNotification.js");

        showUpdateNotification(
            "Update ready",
            "success",
            0,
            "update-downloaded"
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
        const api = installUpdateApi();

        const { showUpdateNotification } =
            await import("../../../../../electron-app/utils/ui/notifications/showUpdateNotification.js");
        showUpdateNotification("Update available", "info", 1234, true);
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
});
