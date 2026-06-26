import { describe, expect, it, vi } from "vitest";

import {
    getShowRenderNotificationRuntime,
    type ShowRenderNotificationRuntimeScope,
} from "../../../../../electron-app/utils/ui/notifications/showRenderNotificationRuntime.js";

describe("showRenderNotificationRuntime", () => {
    it("delegates timestamp reads through the scoped runtime", () => {
        expect.assertions(2);

        const timestamp = Number("2100");
        const dateNow = vi.fn<() => number>(() => timestamp);
        const utils = getShowRenderNotificationRuntime({
            getDateNow: () => dateNow,
        });

        expect(utils.dateNow()).toBe(timestamp);
        expect(dateNow).toHaveBeenCalledOnce();
    });

    it("uses the browser runtime provider for production timestamp reads", () => {
        expect.assertions(1);

        vi.useFakeTimers();
        vi.setSystemTime(new Date("2026-06-25T21:10:00.000Z"));
        try {
            const utils = getShowRenderNotificationRuntime();

            expect(utils.dateNow()).toBe(
                new Date("2026-06-25T21:10:00.000Z").getTime()
            );
        } finally {
            vi.useRealTimers();
        }
    });

    it("fails fast when the clock provider is unavailable", () => {
        expect.assertions(1);

        const utils = getShowRenderNotificationRuntime({});

        expect(() => utils.dateNow()).toThrow(
            "render notification runtime requires dateNow"
        );
    });

    it("ignores legacy direct clock scope properties", () => {
        expect.assertions(1);

        const utils = getShowRenderNotificationRuntime({
            dateNow() {
                throw new Error("legacy dateNow should not run");
            },
        } as unknown as ShowRenderNotificationRuntimeScope);

        expect(() => utils.dateNow()).toThrow(
            "render notification runtime requires dateNow"
        );
    });
});
