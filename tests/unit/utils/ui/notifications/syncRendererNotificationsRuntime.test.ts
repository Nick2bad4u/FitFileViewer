import { afterEach, describe, expect, it, vi } from "vitest";

import {
    getSyncRendererNotificationsRuntime,
    type SyncRendererNotificationsRuntimeScope,
} from "../../../../../electron-app/utils/ui/notifications/syncRendererNotificationsRuntime.js";

describe("syncRendererNotificationsRuntime", () => {
    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it("finds the notification element through the injected document provider", () => {
        expect.assertions(1);

        const notification = document.createElement("div");
        notification.id = "notification";
        document.body.replaceChildren(notification);

        const runtime = getSyncRendererNotificationsRuntime({
            getDocument: () => document,
        });

        expect(runtime.getNotificationElement()).toBe(notification);
    });

    it("uses the browser document provider by default", () => {
        expect.assertions(1);

        const notification = document.createElement("div");
        notification.id = "notification";
        document.body.replaceChildren(notification);

        expect(
            getSyncRendererNotificationsRuntime().getNotificationElement()
        ).toBe(notification);
    });

    it("returns null when the notification element is absent", () => {
        expect.assertions(1);

        document.body.replaceChildren();

        const runtime = getSyncRendererNotificationsRuntime({
            getDocument: () => document,
        });

        expect(runtime.getNotificationElement()).toBeNull();
    });

    it("requires an explicit document provider", () => {
        expect.assertions(1);

        expect(() =>
            getSyncRendererNotificationsRuntime(
                {} as SyncRendererNotificationsRuntimeScope
            )
        ).toThrow("syncRendererNotifications requires a document provider");
    });

    it("requires a document runtime", () => {
        expect.assertions(1);

        const runtime = getSyncRendererNotificationsRuntime({
            getDocument: () => undefined,
        });

        expect(() => runtime.getNotificationElement()).toThrow(
            "syncRendererNotifications requires a document runtime"
        );
    });

    it("ignores legacy direct document scope properties", () => {
        expect.assertions(1);

        expect(() =>
            getSyncRendererNotificationsRuntime({
                document,
            } as unknown as SyncRendererNotificationsRuntimeScope)
        ).toThrow("syncRendererNotifications requires a document provider");
    });
});
