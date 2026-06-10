import { afterEach, describe, expect, it } from "vitest";

import {
    isChartDebugLoggingEnabled,
    isChartFullscreenTraceEnabled,
    isChartVerboseDebugLoggingEnabled,
    resetChartDebugStateForTests,
    setChartDebugLoggingEnabled,
    setChartFullscreenTraceEnabled,
    setChartVerboseDebugLoggingEnabled,
} from "../../../../electron-app/utils/charts/core/chartDebugState.js";

const originalNodeEnv = process.env.NODE_ENV;

function setNodeEnv(value: string | undefined): void {
    if (value === undefined) {
        Reflect.deleteProperty(process.env, "NODE_ENV");
        return;
    }

    process.env.NODE_ENV = value;
}

describe("chartDebugState", () => {
    afterEach(() => {
        resetChartDebugStateForTests();
        setNodeEnv(originalNodeEnv);
    });

    it("gates chart debug and verbose logging behind development mode", () => {
        expect.assertions(4);

        setNodeEnv("production");
        setChartDebugLoggingEnabled(true);
        setChartVerboseDebugLoggingEnabled(true);

        expect(isChartDebugLoggingEnabled()).toBe(false);
        expect(isChartVerboseDebugLoggingEnabled()).toBe(false);

        setNodeEnv("development");

        expect(isChartDebugLoggingEnabled()).toBe(true);
        expect(isChartVerboseDebugLoggingEnabled()).toBe(true);
    });

    it("supports fullscreen trace overrides while defaulting to development mode", () => {
        expect.assertions(4);

        setNodeEnv("production");
        expect(isChartFullscreenTraceEnabled()).toBe(false);

        setNodeEnv("development");
        expect(isChartFullscreenTraceEnabled()).toBe(true);

        setChartFullscreenTraceEnabled(false);
        expect(isChartFullscreenTraceEnabled()).toBe(false);

        setChartFullscreenTraceEnabled(true);
        setNodeEnv("production");
        expect(isChartFullscreenTraceEnabled()).toBe(true);
    });

    it("resets all chart debug flags for tests", () => {
        expect.assertions(3);

        setNodeEnv("development");
        setChartDebugLoggingEnabled(true);
        setChartVerboseDebugLoggingEnabled(true);
        setChartFullscreenTraceEnabled(false);

        resetChartDebugStateForTests();

        expect(isChartDebugLoggingEnabled()).toBe(false);
        expect(isChartVerboseDebugLoggingEnabled()).toBe(false);
        expect(isChartFullscreenTraceEnabled()).toBe(true);
    });
});
