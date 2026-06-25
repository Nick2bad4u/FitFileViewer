import { afterEach, describe, expect, it, vi } from "vitest";

import {
    getFitFileStateRuntime,
    type FitFileStateRuntimeScope,
} from "../../../../../electron-app/utils/state/domain/fitFileStateRuntime.js";

describe("getFitFileStateRuntime", () => {
    afterEach(() => {
        vi.restoreAllMocks();
    });

    it("reads wall-clock time through the injected provider", () => {
        expect.assertions(2);

        const dateNow = vi.fn<() => number>(() => 123);
        const runtime = getFitFileStateRuntime({
            getDateNow: () => dateNow,
        });

        expect(runtime.dateNow()).toBe(123);
        expect(dateNow).toHaveBeenCalledOnce();
    });

    it("fails clearly when explicit scopes omit the clock", () => {
        expect.assertions(1);

        expect(() => getFitFileStateRuntime({}).dateNow()).toThrow(
            "fitFileState requires dateNow"
        );
    });

    it("ignores legacy direct runtime scope properties", () => {
        expect.assertions(2);

        const dateNow = vi.fn<() => number>(() => 123);
        const runtime = getFitFileStateRuntime({
            dateNow,
        } as unknown as FitFileStateRuntimeScope);

        expect(() => runtime.dateNow()).toThrow(
            "fitFileState requires dateNow"
        );
        expect(dateNow).not.toHaveBeenCalled();
    });

    it("uses the browser runtime provider for the production clock default", () => {
        expect.assertions(2);

        const dateNow = vi.spyOn(Date, "now").mockReturnValue(1234);
        const runtime = getFitFileStateRuntime();

        expect(runtime.dateNow()).toBe(1234);
        expect(dateNow).toHaveBeenCalledOnce();
    });
});
