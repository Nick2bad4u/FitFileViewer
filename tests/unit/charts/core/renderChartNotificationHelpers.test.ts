import { afterEach, describe, expect, it, vi } from "vitest";

const notificationMocks = vi.hoisted(() => ({
    showNotification:
        vi.fn<
            (
                message: string,
                type?: string,
                duration?: null | number,
                options?: unknown
            ) => unknown
        >(),
}));

vi.mock(
    import("../../../../electron-app/utils/ui/notifications/showNotification.js"),
    () => ({
        showNotification: notificationMocks.showNotification,
    })
);

import {
    getNotificationSuppressed,
    notify,
    setNotificationSuppressed,
} from "../../../../electron-app/utils/charts/core/renderChartNotificationHelpers.js";

describe("render chart notification helpers", () => {
    afterEach(() => {
        notificationMocks.showNotification.mockReset();
        setNotificationSuppressed(undefined);
    });

    it("tracks notification suppression through module state", () => {
        expect.assertions(3);

        expect(getNotificationSuppressed()).toBeUndefined();

        setNotificationSuppressed(true);

        expect(getNotificationSuppressed()).toBe(true);

        setNotificationSuppressed(undefined);

        expect(getNotificationSuppressed()).toBeUndefined();
    });

    it("suppresses notifications through module state", async () => {
        expect.assertions(2);

        const deliveredNotifications: string[] = [];
        notificationMocks.showNotification.mockImplementation(
            (message, type) => {
                deliveredNotifications.push(`${type ?? "info"}:${message}`);
            }
        );

        setNotificationSuppressed(true);
        await notify("Hidden chart notification", "warning");

        expect(deliveredNotifications).toStrictEqual([]);

        setNotificationSuppressed(false);
        await notify("Visible chart notification", "success");

        expect(deliveredNotifications).toStrictEqual([
            "success:Visible chart notification",
        ]);
    });

    it("respects per-call silent options without mutating suppression state", async () => {
        expect.assertions(2);

        const deliveredNotifications: string[] = [];
        notificationMocks.showNotification.mockImplementation(
            (message, type) => {
                deliveredNotifications.push(`${type ?? "info"}:${message}`);
            }
        );

        await notify("Silent chart notification", "info", null, {
            silent: true,
        });

        expect(deliveredNotifications).toStrictEqual([]);
        expect(getNotificationSuppressed()).toBeUndefined();
    });
});
