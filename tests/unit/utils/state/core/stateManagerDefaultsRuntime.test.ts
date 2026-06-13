import { describe, expect, it } from "vitest";

import { getStateManagerDefaultsRuntime } from "../../../../../electron-app/utils/state/core/stateManagerDefaultsRuntime.js";

describe("stateManagerDefaultsRuntime", () => {
    it("prefers performance timing for startup timestamps", () => {
        expect.assertions(1);

        expect(
            getStateManagerDefaultsRuntime({
                dateNow: () => 123,
                performance: { now: () => 45.5 },
            }).getStartTime()
        ).toBe(45.5);
    });

    it("falls back to the provided date clock without performance timing", () => {
        expect.assertions(1);

        expect(
            getStateManagerDefaultsRuntime({
                dateNow: () => 123,
            }).getStartTime()
        ).toBe(123);
    });

    it("resolves document titles with the default fallback", () => {
        expect.assertions(3);

        expect(
            getStateManagerDefaultsRuntime({
                document: { title: "Activity Viewer" },
            }).getDefaultDocumentTitle()
        ).toBe("Activity Viewer");
        expect(
            getStateManagerDefaultsRuntime({
                document: { title: "" },
            }).getDefaultDocumentTitle()
        ).toBe("Fit File Viewer");
        expect(
            getStateManagerDefaultsRuntime({}).getDefaultDocumentTitle()
        ).toBe("Fit File Viewer");
    });
});
