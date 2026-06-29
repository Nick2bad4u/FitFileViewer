import { describe, expect, it, vi } from "vitest";

import {
    getFitParserRuntime,
    type FitParserRuntimeScope,
} from "../../electron-app/fitParserRuntime.js";

const unavailableFitParserRuntimeScope = {
    getDateConstructor: () => undefined,
    getDateNow: () => undefined,
} satisfies FitParserRuntimeScope;

describe("getFitParserRuntime", () => {
    it("reads wall-clock timestamps through the injected provider", () => {
        expect.assertions(2);

        const dateNow = vi.fn<() => number>(() => 1234);
        const utils = getFitParserRuntime({
            ...unavailableFitParserRuntimeScope,
            getDateNow: () => dateNow,
        });

        expect(utils.dateNow()).toBe(1234);
        expect(dateNow).toHaveBeenCalledOnce();
    });

    it("builds ISO timestamps through the injected date constructor", () => {
        expect.assertions(3);

        const dateValue = {
            toISOString: vi.fn<() => string>(() => "2024-01-02T03:04:05.000Z"),
        };
        let constructedCount = 0;

        class DateConstructor {
            constructor() {
                constructedCount += 1;
            }

            toISOString(): string {
                return dateValue.toISOString();
            }
        }

        const utils = getFitParserRuntime({
            ...unavailableFitParserRuntimeScope,
            getDateConstructor: () => DateConstructor,
        });

        expect(utils.isoTimestamp()).toBe("2024-01-02T03:04:05.000Z");
        expect(constructedCount).toBe(1);
        expect(dateValue.toISOString).toHaveBeenCalledOnce();
    });

    it("fails clearly when clock providers are unavailable", () => {
        expect.assertions(2);

        const utils = getFitParserRuntime(unavailableFitParserRuntimeScope);

        expect(() => utils.dateNow()).toThrow(
            "fitParserRuntime requires a date clock"
        );
        expect(() => utils.isoTimestamp()).toThrow(
            "fitParserRuntime requires a date constructor"
        );
    });

    it("fails clearly when runtime providers are omitted", () => {
        expect.assertions(2);

        const utils = getFitParserRuntime(
            {} as unknown as FitParserRuntimeScope
        );

        expect(() => utils.dateNow()).toThrow(
            "fitParserRuntime requires a date clock provider"
        );
        expect(() => utils.isoTimestamp()).toThrow(
            "fitParserRuntime requires a date constructor provider"
        );
    });

    it("ignores legacy direct runtime scope properties", () => {
        expect.assertions(4);

        const dateNow = vi.fn<() => number>(() => 1234);
        const dateValue = {
            toISOString: vi.fn<() => string>(() => "2024-01-02T03:04:05.000Z"),
        };
        let constructedCount = 0;

        class DateConstructor {
            constructor() {
                constructedCount += 1;
            }

            toISOString(): string {
                return dateValue.toISOString();
            }
        }

        const utils = getFitParserRuntime({
            ...unavailableFitParserRuntimeScope,
            Date: DateConstructor,
            dateNow,
        } as unknown as Parameters<typeof getFitParserRuntime>[0]);

        expect(() => utils.dateNow()).toThrow(
            "fitParserRuntime requires a date clock"
        );
        expect(() => utils.isoTimestamp()).toThrow(
            "fitParserRuntime requires a date constructor"
        );
        expect(dateNow).not.toHaveBeenCalled();
        expect(constructedCount).toBe(0);
    });
});
