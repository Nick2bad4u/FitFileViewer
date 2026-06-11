import { describe, expect, it } from "vitest";

import { getSummaryColModalRuntime } from "../../../../../electron-app/utils/rendering/helpers/summaryColModalRuntime.js";

describe("getSummaryColModalRuntime", () => {
    it("reads viewport dimensions from an injected runtime scope", () => {
        expect.assertions(1);

        expect(
            getSummaryColModalRuntime({
                innerHeight: 900,
                innerWidth: 1440,
            }).getViewport()
        ).toStrictEqual({
            height: 900,
            width: 1440,
        });
    });

    it("uses zero dimensions when viewport values are unavailable", () => {
        expect.assertions(1);

        expect(getSummaryColModalRuntime({}).getViewport()).toStrictEqual({
            height: 0,
            width: 0,
        });
    });
});
