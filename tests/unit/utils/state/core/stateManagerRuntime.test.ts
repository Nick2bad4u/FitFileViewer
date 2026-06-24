import { describe, expect, it, vi } from "vitest";

import { getStateManagerRuntime } from "../../../../../electron-app/utils/state/core/stateManagerRuntime.js";

describe("stateManagerRuntime", () => {
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

        expect(() => utils.dateNow()).toThrow("stateManager requires dateNow");
        expect(dateNow).not.toHaveBeenCalled();
    });

    it("fails clearly when explicit scopes omit timing providers", () => {
        expect.assertions(1);

        expect(() => getStateManagerRuntime({}).dateNow()).toThrow(
            "stateManager requires dateNow"
        );
    });
});
