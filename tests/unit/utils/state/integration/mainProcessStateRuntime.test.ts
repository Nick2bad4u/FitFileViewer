import { describe, expect, it } from "vitest";

import { getMainProcessStateRuntime } from "../../../../../electron-app/utils/state/integration/mainProcessStateRuntime.js";

describe("mainProcessStateRuntime", () => {
    it("prefers performance timing for monotonic durations", () => {
        expect.assertions(1);

        expect(
            getMainProcessStateRuntime({
                dateNow: () => 123,
                performance: { now: () => 45.5 },
            }).monotonicNowMs()
        ).toBe(45.5);
    });

    it("falls back to the provided date clock without performance timing", () => {
        expect.assertions(1);

        expect(
            getMainProcessStateRuntime({
                dateNow: () => 123,
            }).monotonicNowMs()
        ).toBe(123);
    });
});
