import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
    createRendererLogger,
    logWithRendererContext,
} from "../../../electron-app/utils/logging/rendererLogger.js";

const fixedTimestamp = "2026-01-02T03:04:05.006Z";
const expectedPrefix = `[${fixedTimestamp}] [renderer]`;

describe("rendererLogger", () => {
    let logSpy: ReturnType<typeof vi.spyOn>;
    let warnSpy: ReturnType<typeof vi.spyOn>;

    beforeEach(() => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date(fixedTimestamp));

        logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
        warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    });

    afterEach(() => {
        vi.useRealTimers();
        vi.restoreAllMocks();
    });

    it("logs renderer messages with timestamped prefixes", () => {
        expect.assertions(2);

        expect(logWithRendererContext("log", "Loaded renderer")).toBeUndefined();

        expect(logSpy).toHaveBeenCalledWith(
            `${expectedPrefix} Loaded renderer`
        );
    });

    it("serializes non-empty renderer context payloads", () => {
        expect.assertions(2);

        expect(
            logWithRendererContext("warn", "Missing optional field", {
                fileName: "activity.fit",
            })
        ).toBeUndefined();

        expect(warnSpy).toHaveBeenCalledWith(
            `${expectedPrefix} Missing optional field`,
            JSON.stringify({ fileName: "activity.fit" })
        );
    });

    it("adds scoped prefixes through created renderer loggers", () => {
        expect.assertions(2);

        const utils = createRendererLogger("startup");

        expect(utils("log", "Ready")).toBeUndefined();

        expect(logSpy).toHaveBeenCalledWith(`${expectedPrefix} startup: Ready`);
    });
});
