import { afterEach, describe, expect, it, vi } from "vitest";

import {
    getStateManagerRuntime,
    type StateManagerRuntimeScope,
} from "../../../../../electron-app/utils/state/core/stateManagerRuntime.js";

describe("stateManagerRuntime", () => {
    afterEach(() => {
        vi.restoreAllMocks();
    });

    it("reads timestamps through the injected provider", () => {
        expect.assertions(2);

        const dateNow = vi.fn<() => number>(() => 1234);
        const utils = getStateManagerRuntime({
            getDateNow: () => dateNow,
        });

        expect(utils.dateNow()).toBe(1234);
        expect(dateNow).toHaveBeenCalledOnce();
    });

    it("ignores legacy direct clock runtime properties", () => {
        expect.assertions(2);

        const dateNow = vi.fn<() => number>(() => 1234);
        const utils = getStateManagerRuntime({
            dateNow,
        } as unknown as Parameters<typeof getStateManagerRuntime>[0]);

        expect(() => utils.dateNow()).toThrow(
            "stateManager requires a dateNow provider"
        );
        expect(dateNow).not.toHaveBeenCalled();
    });

    it("uses the browser runtime provider for the production clock default", () => {
        expect.assertions(2);

        const dateNow = vi.spyOn(Date, "now").mockReturnValue(4321);
        const utils = getStateManagerRuntime();

        expect(utils.dateNow()).toBe(4321);
        expect(dateNow).toHaveBeenCalledOnce();
    });

    it("fails clearly when explicit scopes omit timing providers", () => {
        expect.assertions(1);

        expect(() =>
            getStateManagerRuntime(
                {} as unknown as StateManagerRuntimeScope
            ).dateNow()
        ).toThrow("stateManager requires a dateNow provider");
    });

    it("fails clearly when explicit providers return unavailable clocks", () => {
        expect.assertions(1);

        expect(() =>
            getStateManagerRuntime({
                getDateNow: () => undefined,
            }).dateNow()
        ).toThrow("stateManager requires dateNow");
    });
});
