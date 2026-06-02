import { describe, it, expect, beforeEach, vi } from "vitest";

type UpdateElectronApi = {
    installUpdate: () => void;
};

type UpdateWindow = Window & { electronAPI: UpdateElectronApi };

const installUpdateApi = (): UpdateElectronApi => {
    const api = {
        installUpdate: vi.fn<() => void>(),
    };

    (window as UpdateWindow).electronAPI = api;

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

describe("showUpdateNotification", () => {
    beforeEach(() => {
        document.body.replaceChildren();
        vi.useRealTimers();
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
        expect.assertions(4);

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
        expect(host.textContent).toContain("Update ready");

        // Click restart
        buttons[0].click();
        expect(api.installUpdate).toHaveBeenCalledWith();

        // Click later hides
        buttons[1].click();
        expect(host.style.display).toBe("none");
    });

    it("auto hides when withAction is true (single button) using timers", async () => {
        expect.assertions(2);

        const host = createNotificationHost();
        installUpdateApi();
        vi.useFakeTimers();

        const { showUpdateNotification } =
            await import("../../../../../electron-app/utils/ui/notifications/showUpdateNotification.js");
        showUpdateNotification("Update available", "info", 1234, true);
        expect(getNotificationButtons(host)).toHaveLength(1);
        // Advance timers to trigger auto hide
        vi.runAllTimers();
        expect(host.style.display).toBe("none");
    });
});
