import { afterEach, describe, expect, it } from "vitest";

import {
    getNotificationSuppressed,
    notify,
    setNotificationSuppressed,
} from "../../../../electron-app/utils/charts/core/renderChartNotificationHelpers.js";

type NotificationGlobal = typeof globalThis & {
    __FFV_suppressNotifications?: boolean;
    showNotification?: (
        message: string,
        type?: string,
        duration?: null | number,
        options?: unknown
    ) => unknown;
};

const notificationGlobal = globalThis as NotificationGlobal;

describe("render chart notification helpers", () => {
    afterEach(() => {
        setNotificationSuppressed(undefined);
        delete notificationGlobal.__FFV_suppressNotifications;
        delete notificationGlobal.showNotification;
    });

    it("tracks notification suppression without writing a global bridge flag", () => {
        expect.assertions(4);

        expect(getNotificationSuppressed()).toBeUndefined();

        setNotificationSuppressed(true);

        expect(getNotificationSuppressed()).toBe(true);
        expect(notificationGlobal.__FFV_suppressNotifications).toBeUndefined();

        setNotificationSuppressed(undefined);

        expect(getNotificationSuppressed()).toBeUndefined();
    });

    it("suppresses notifications through module state", async () => {
        expect.assertions(2);

        const deliveredNotifications: string[] = [];
        notificationGlobal.showNotification = (message, type) => {
            deliveredNotifications.push(`${type ?? "info"}:${message}`);
        };

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
        notificationGlobal.showNotification = (message, type) => {
            deliveredNotifications.push(`${type ?? "info"}:${message}`);
        };

        await notify("Silent chart notification", "info", null, {
            silent: true,
        });

        expect(deliveredNotifications).toStrictEqual([]);
        expect(getNotificationSuppressed()).toBeUndefined();
    });
});
