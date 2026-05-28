import { createRequire } from "node:module";

import { describe, expect, it, vi } from "vitest";

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
        expect.assertions(3);

        const consoleRef = {
            log: vi.fn<(...args: unknown[]) => void>(),
        };
        const preloadLog = createPreloadLogger(consoleRef);

        const result = preloadLog("info", "message", { detail: true });

        expect(result).toBeUndefined();
        expect(consoleRef.log).toHaveBeenCalledWith("message", {
            detail: true,
        });
        expect(consoleRef.log).not.toHaveBeenCalledWith("warn", "message");
    });

    it("routes warnings and errors through matching console methods", () => {
        expect.assertions(3);

        const consoleRef = {
            error: vi.fn<(...args: unknown[]) => void>(),
            warn: vi.fn<(...args: unknown[]) => void>(),
        };
        const preloadLog = createPreloadLogger(consoleRef);

        const result = preloadLog("warn", "warning");
        preloadLog("error", "failure");

        expect(result).toBeUndefined();
        expect(consoleRef.warn).toHaveBeenCalledWith("warning");
        expect(consoleRef.error).toHaveBeenCalledWith("failure");
    });

    it("ignores missing console methods without falling back to another level", () => {
        expect.assertions(2);

        const consoleRef = {
            log: vi.fn<(...args: unknown[]) => void>(),
        };
        const preloadLog = createPreloadLogger(consoleRef);

        expect(preloadLog("warn", "ignored")).toBeUndefined();
        expect(consoleRef.log).not.toHaveBeenCalled();
    });
});
