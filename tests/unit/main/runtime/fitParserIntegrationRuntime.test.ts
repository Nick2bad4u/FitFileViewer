import { describe, expect, it, vi } from "vitest";

import { getFitParserIntegrationRuntime } from "../../../../electron-app/main/runtime/fitParserIntegrationRuntime.js";

describe("getFitParserIntegrationRuntime", () => {
    it("reads wall-clock timestamps through the injected provider", () => {
        expect.assertions(2);

        const dateNow = vi.fn<() => number>(() => 1234);
        const utils = getFitParserIntegrationRuntime({
            getDateNow: () => dateNow,
        });

        expect(utils.dateNow()).toBe(1234);
        expect(dateNow).toHaveBeenCalledOnce();
    });

    it("reads monotonic timestamps through the injected performance provider", () => {
        expect.assertions(2);

        const performanceNow = vi.fn<() => number>(() => 56.7);
        const utils = getFitParserIntegrationRuntime({
            getPerformance: () => ({ now: performanceNow }),
        });

        expect(utils.monotonicNowMs()).toBe(56.7);
        expect(performanceNow).toHaveBeenCalledOnce();
    });

    it("falls back to the date provider when performance timing is unavailable", () => {
        expect.assertions(2);

        const dateNow = vi.fn<() => number>(() => 9876);
        const utils = getFitParserIntegrationRuntime({
            getDateNow: () => dateNow,
            getPerformance: () => undefined,
        });

        expect(utils.monotonicNowMs()).toBe(9876);
        expect(dateNow).toHaveBeenCalledOnce();
    });

    it("fails clearly when clock providers are unavailable", () => {
        expect.assertions(2);

        const utils = getFitParserIntegrationRuntime({});

        expect(() => utils.dateNow()).toThrow(
            "fitParserIntegrationRuntime requires a date clock"
        );
        expect(() => utils.monotonicNowMs()).toThrow(
            "fitParserIntegrationRuntime requires a date clock"
        );
    });

    it("ignores legacy direct runtime scope properties", () => {
        expect.assertions(4);

        const dateNow = vi.fn<() => number>(() => 1234);
        const performanceNow = vi.fn<() => number>(() => 56.7);
        const utils = getFitParserIntegrationRuntime({
            dateNow,
            performance: { now: performanceNow },
        } as unknown as Parameters<typeof getFitParserIntegrationRuntime>[0]);

        expect(() => utils.dateNow()).toThrow(
            "fitParserIntegrationRuntime requires a date clock"
        );
        expect(() => utils.monotonicNowMs()).toThrow(
            "fitParserIntegrationRuntime requires a date clock"
        );
        expect(dateNow).not.toHaveBeenCalled();
        expect(performanceNow).not.toHaveBeenCalled();
    });
});
