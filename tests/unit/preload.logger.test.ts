import { createRequire } from "node:module";

import { describe, expect, it } from "vitest";

interface PreloadLoggerModule {
    createPreloadLogger: (consoleRef?: {
        error?: (...args: unknown[]) => void;
        log?: (...args: unknown[]) => void;
        warn?: (...args: unknown[]) => void;
    }) => (
        level: "error" | "info" | "warn",
        message: string,
        ...details: unknown[]
    ) => void;
}

const requireFromTest = createRequire(import.meta.url);
const { createPreloadLogger } = requireFromTest(
    "../../electron-app/preload/logger.js"
) as PreloadLoggerModule;

describe("preload logger", () => {
    it("routes info logs through console.log", () => {
        expect.assertions(1);

        const loggedEntries: unknown[][] = [];
        const consoleRef = {
            log: (...args: unknown[]) => loggedEntries.push(args),
        };
        const preloadLog = createPreloadLogger(consoleRef);

        preloadLog("info", "message", { detail: true });

        expect(loggedEntries).toStrictEqual([["message", { detail: true }]]);
    });

    it("routes warnings and errors through matching console methods", () => {
        expect.assertions(1);

        const loggedEntries: Array<{ args: unknown[]; level: string }> = [];
        const consoleRef = {
            error: (...args: unknown[]) =>
                loggedEntries.push({ args, level: "error" }),
            warn: (...args: unknown[]) =>
                loggedEntries.push({ args, level: "warn" }),
        };
        const preloadLog = createPreloadLogger(consoleRef);

        preloadLog("warn", "warning");
        preloadLog("error", "failure");

        expect(loggedEntries).toStrictEqual([
            { args: ["warning"], level: "warn" },
            { args: ["failure"], level: "error" },
        ]);
    });

    it("ignores missing console methods without falling back to another level", () => {
        expect.assertions(1);

        const loggedEntries: unknown[][] = [];
        const consoleRef = {
            log: (...args: unknown[]) => loggedEntries.push(args),
        };
        const preloadLog = createPreloadLogger(consoleRef);

        preloadLog("warn", "ignored");
        expect(loggedEntries).toStrictEqual([]);
    });
});
