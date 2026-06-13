import { describe, expect, it } from "vitest";

import { getRecentFilesContextMenuRuntime } from "../../../../../electron-app/utils/app/lifecycle/recentFilesContextMenuRuntime.js";

describe("recentFilesContextMenuRuntime", () => {
    it("reads finite viewport dimensions from a scoped window", () => {
        expect.assertions(1);

        expect(
            getRecentFilesContextMenuRuntime({
                window: {
                    innerHeight: 720,
                    innerWidth: 1280,
                },
            }).getViewport()
        ).toStrictEqual({
            height: 720,
            width: 1280,
        });
    });

    it("falls back to zero dimensions outside renderer scopes", () => {
        expect.assertions(1);

        expect(getRecentFilesContextMenuRuntime({}).getViewport()).toStrictEqual(
            {
                height: 0,
                width: 0,
            }
        );
    });

    it("normalizes invalid dimensions to zero", () => {
        expect.assertions(1);

        expect(
            getRecentFilesContextMenuRuntime({
                window: {
                    innerHeight: Number.NaN,
                    innerWidth: Number.POSITIVE_INFINITY,
                },
            }).getViewport()
        ).toStrictEqual({
            height: 0,
            width: 0,
        });
    });
});
