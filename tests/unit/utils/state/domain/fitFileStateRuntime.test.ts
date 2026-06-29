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

    it("fails clearly when the clock provider returns unavailable", () => {
        expect.assertions(1);

        expect(() =>
            getFitFileStateRuntime({
                getDateNow: () => undefined,
            }).dateNow()
        ).toThrow("fitFileState requires dateNow");
    });

    it("fails clearly when explicit scopes omit the clock provider", () => {
        expect.assertions(1);

        expect(() =>
            getFitFileStateRuntime(
                {} as unknown as FitFileStateRuntimeScope
            ).dateNow()
        ).toThrow("fitFileState requires a dateNow provider");
    });

    it("ignores legacy direct runtime scope properties", () => {
        expect.assertions(2);

        const dateNow = vi.fn<() => number>(() => 123);
        const runtime = getFitFileStateRuntime({
            dateNow,
        } as unknown as FitFileStateRuntimeScope);

        expect(() => runtime.dateNow()).toThrow(
            "fitFileState requires a dateNow provider"
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
