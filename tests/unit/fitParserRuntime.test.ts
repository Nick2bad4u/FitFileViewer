import { describe, expect, it, vi } from "vitest";

import { getFitParserRuntime } from "../../electron-app/fitParserRuntime.js";

describe("getFitParserRuntime", () => {
    it("reads wall-clock timestamps through the injected provider", () => {
        expect.assertions(2);

        const dateNow = vi.fn<() => number>(() => 1234);
        const utils = getFitParserRuntime({
            getDateNow: () => dateNow,
        });

        expect(utils.dateNow()).toBe(1234);
        expect(dateNow).toHaveBeenCalledOnce();
    });

    it("builds ISO timestamps through the injected date constructor", () => {
        expect.assertions(3);

        const dateValue = {
            toISOString: vi.fn<() => string>(
                () => "2024-01-02T03:04:05.000Z"
            ),
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
            getDateConstructor: () => DateConstructor,
        });

        expect(utils.isoTimestamp()).toBe("2024-01-02T03:04:05.000Z");
        expect(constructedCount).toBe(1);
        expect(dateValue.toISOString).toHaveBeenCalledOnce();
    });

    it("fails clearly when clock providers are unavailable", () => {
        expect.assertions(2);

        const utils = getFitParserRuntime({});

        expect(() => utils.dateNow()).toThrow(
            "fitParserRuntime requires a date clock"
        );
        expect(() => utils.isoTimestamp()).toThrow(
            "fitParserRuntime requires a date constructor"
        );
    });

    it("ignores legacy direct runtime scope properties", () => {
        expect.assertions(4);

        const dateNow = vi.fn<() => number>(() => 1234);
        const dateValue = {
            toISOString: vi.fn<() => string>(
                () => "2024-01-02T03:04:05.000Z"
            ),
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
