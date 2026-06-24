import { describe, expect, it, vi } from "vitest";

import { getUnifiedStateManagerRuntime } from "../../../../../electron-app/utils/state/core/unifiedStateManagerRuntime.js";

describe("unifiedStateManagerRuntime", () => {
    it("reads timestamps through the injected provider", () => {
        expect.assertions(2);

        const dateNow = vi.fn<() => number>(() => 1234);
        const utils = getUnifiedStateManagerRuntime({
            getDateNow: () => dateNow,
        });

        expect(utils.dateNow()).toBe(1234);
        expect(dateNow).toHaveBeenCalledOnce();
    });

    it("ignores legacy direct clock runtime properties", () => {
        expect.assertions(2);

        const dateNow = vi.fn<() => number>(() => 1234);
        const utils = getUnifiedStateManagerRuntime({
            dateNow,
        } as unknown as Parameters<typeof getUnifiedStateManagerRuntime>[0]);

        expect(() => utils.dateNow()).toThrow(
            "unifiedStateManager requires dateNow"
        );
        expect(dateNow).not.toHaveBeenCalled();
    });

    it("fails clearly when explicit scopes omit timing providers", () => {
        expect.assertions(1);

        expect(() => getUnifiedStateManagerRuntime({}).dateNow()).toThrow(
            "unifiedStateManager requires dateNow"
        );
    });
});
