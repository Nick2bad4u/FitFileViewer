import { describe, expect, it, vi } from "vitest";

import { loggingTimestampRuntime } from "../../../electron-app/utils/logging/loggingTimestampRuntime.js";

describe("loggingTimestampRuntime", () => {
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

        const utils = loggingTimestampRuntime({
            getDateConstructor: () => DateConstructor,
        });

        expect(utils.isoNow()).toBe("2024-01-02T03:04:05.000Z");
        expect(constructedCount).toBe(1);
        expect(dateValue.toISOString).toHaveBeenCalledOnce();
    });

    it("reads the default Date constructor through the named provider", () => {
        expect.assertions(1);

        vi.useFakeTimers();
        try {
            vi.setSystemTime(new Date("2026-01-02T03:04:05.006Z"));

            const utils = loggingTimestampRuntime();

            expect(utils.isoNow()).toBe("2026-01-02T03:04:05.006Z");
        } finally {
            vi.useRealTimers();
        }
    });

    it("fails clearly when date construction is unavailable", () => {
        expect.assertions(1);

        const utils = loggingTimestampRuntime({});

        expect(() => utils.isoNow()).toThrow(
            "loggingTimestampRuntime requires a date constructor"
        );
    });

    it("ignores legacy direct runtime scope properties", () => {
        expect.assertions(2);

        let constructedCount = 0;

        class DateConstructor {
            constructor() {
                constructedCount += 1;
            }

            toISOString(): string {
                return "2024-01-02T03:04:05.000Z";
            }
        }

        const utils = loggingTimestampRuntime({
            Date: DateConstructor,
        } as unknown as Parameters<typeof loggingTimestampRuntime>[0]);

        expect(() => utils.isoNow()).toThrow(
            "loggingTimestampRuntime requires a date constructor"
        );
        expect(constructedCount).toBe(0);
    });
});
