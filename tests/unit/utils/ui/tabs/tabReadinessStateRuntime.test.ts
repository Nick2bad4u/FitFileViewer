import { describe, expect, it, vi } from "vitest";

import {
    getTabReadinessStateRuntime,
    type TabReadinessStateRuntimeScope,
} from "../../../../../electron-app/utils/ui/tabs/tabReadinessStateRuntime.js";

describe("tabReadinessStateRuntime", () => {
    it("reads timestamps through the injected date clock", () => {
        expect.assertions(2);

        const dateNow = vi.fn(() => 123_456);
        const runtime = getTabReadinessStateRuntime({
            getDateNow: () => dateNow,
        });

        expect(runtime.now()).toBe(123_456);
        expect(dateNow).toHaveBeenCalledOnce();
    });

    it("does not borrow ambient clocks for explicit scopes", () => {
        expect.assertions(1);

        const runtime = getTabReadinessStateRuntime({});

        expect(() => runtime.now()).toThrow(
            "tabReadinessState requires a date clock runtime"
        );
    });

    it("ignores legacy direct runtime scope properties", () => {
        expect.assertions(1);

        const runtime = getTabReadinessStateRuntime({
            dateNow: () => 123_456,
        } as unknown as TabReadinessStateRuntimeScope);

        expect(() => runtime.now()).toThrow(
            "tabReadinessState requires a date clock runtime"
        );
    });
});
