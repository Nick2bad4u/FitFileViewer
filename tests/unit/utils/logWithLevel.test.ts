import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { logWithLevel } from "../../../electron-app/utils/logging/index.js";

const fixedTimestamp = "2023-01-01T12:00:00.000Z";
const expectedBase = `${fixedTimestamp} [FFV]`;
type ConsoleEntry = {
    args: unknown[];
    level: "error" | "info" | "log" | "warn";
};

describe(logWithLevel, () => {
    let errorSpy: ReturnType<typeof vi.spyOn>;
    let infoSpy: ReturnType<typeof vi.spyOn>;
    let logSpy: ReturnType<typeof vi.spyOn>;
    let warnSpy: ReturnType<typeof vi.spyOn>;
    let consoleEntries: ConsoleEntry[];

    beforeEach(() => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date(fixedTimestamp));

        consoleEntries = [];
        errorSpy = vi.spyOn(console, "error").mockImplementation((...args) => {
            consoleEntries.push({ args, level: "error" });
        });
        infoSpy = vi.spyOn(console, "info").mockImplementation((...args) => {
            consoleEntries.push({ args, level: "info" });
        });
        logSpy = vi.spyOn(console, "log").mockImplementation((...args) => {
            consoleEntries.push({ args, level: "log" });
        });
        warnSpy = vi.spyOn(console, "warn").mockImplementation((...args) => {
            consoleEntries.push({ args, level: "warn" });
        });
    });

    afterEach(() => {
        vi.useRealTimers();
        vi.restoreAllMocks();
        delete (
            globalThis as typeof globalThis & {
                __vitest_object_keys_allow_throw?: boolean;
            }
        ).__vitest_object_keys_allow_throw;
    });

    it("routes each supported level to the matching console method", () => {
        expect.assertions(1);

        logWithLevel("info", "Loaded file");
        logWithLevel("warn", "Missing optional field");
        logWithLevel("error", "Failed to parse file");
        logWithLevel("log", "Debug detail");

        expect(consoleEntries).toStrictEqual([
            { args: [`${expectedBase} Loaded file`], level: "info" },
            {
                args: [`${expectedBase} Missing optional field`],
                level: "warn",
            },
            {
                args: [`${expectedBase} Failed to parse file`],
                level: "error",
            },
            { args: [`${expectedBase} Debug detail`], level: "log" },
        ]);
    });

    it("falls back to console.log for unknown levels", () => {
        expect.assertions(1);

        logWithLevel("debug", "Renderer trace");

        expect(consoleEntries).toStrictEqual([
            { args: [`${expectedBase} Renderer trace`], level: "log" },
        ]);
    });

    it("logs a shallow-cloned context payload only for non-empty plain objects", () => {
        expect.assertions(2);

        const context = { fileName: "activity.fit", records: 125 };

        logWithLevel("info", "Parsed FIT file", context);
        logWithLevel("info", "No context");
        logWithLevel("info", "Empty context", {});
        logWithLevel("info", "Array context", [
            1,
            2,
            3,
        ] as never);
        context.records = 250;

        expect(consoleEntries).toStrictEqual([
            {
                args: [
                    `${expectedBase} Parsed FIT file`,
                    {
                        fileName: "activity.fit",
                        records: 125,
                    },
                ],
                level: "info",
            },
            { args: [`${expectedBase} No context`], level: "info" },
            { args: [`${expectedBase} Empty context`], level: "info" },
            { args: [`${expectedBase} Array context`], level: "info" },
        ]);
        expect(consoleEntries[0]?.args[1]).not.toBe(context);
    });

    it("skips context properties whose getters throw", () => {
        expect.assertions(2);

        const context = { keep: "value" };
        Object.defineProperty(context, "skip", {
            enumerable: true,
            get() {
                throw new Error("getter failed");
            },
        });

        expect(() => {
            logWithLevel("info", "Partial context", context);
        }).not.toThrow();

        expect(consoleEntries).toStrictEqual([
            {
                args: [`${expectedBase} Partial context`, { keep: "value" }],
                level: "info",
            },
        ]);
    });

    it("emits the minimal fallback line when logging setup fails", () => {
        expect.assertions(2);

        vi.spyOn(Object, "keys").mockImplementationOnce(() => {
            throw new Error("Object.keys failed");
        });

        logWithLevel("info", "Broken context", { key: "value" });

        expect(consoleEntries).toStrictEqual([
            {
                args: ["[FFV][logWithLevel] Logging failure"],
                level: "log",
            },
        ]);
        expect({
            objectKeysAllowThrow: (
                globalThis as typeof globalThis & {
                    __vitest_object_keys_allow_throw?: boolean;
                }
            ).__vitest_object_keys_allow_throw,
        }).toEqual({
            objectKeysAllowThrow: false,
        });
    });

    it("does not throw when the selected console method fails", () => {
        expect.assertions(2);

        warnSpy.mockImplementationOnce(() => {
            throw new Error("console.warn failed");
        });

        expect(() => {
            logWithLevel("warn", "Fallback path");
        }).not.toThrow();
        expect(consoleEntries).toStrictEqual([
            {
                args: ["[FFV][logWithLevel] Logging failure"],
                level: "log",
            },
        ]);
    });
});
