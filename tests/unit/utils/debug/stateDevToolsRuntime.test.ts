import { afterEach, describe, expect, it, vi } from "vitest";

import type {
    BrowserClearInterval,
    BrowserIntervalHandle,
    BrowserSetInterval,
} from "../../../../electron-app/utils/runtime/browserRuntime.js";
import {
    getStateDevToolsRuntime,
    type StateDevToolsIntervalHandle,
} from "../../../../electron-app/utils/debug/stateDevToolsRuntime.js";

describe("stateDevToolsRuntime", () => {
    afterEach(() => {
        vi.restoreAllMocks();
        vi.unstubAllGlobals();
    });

    it("treats localhost renderer scopes as development", () => {
        expect.assertions(2);

        expect(
            getStateDevToolsRuntime({
                getIsRendererScope: () => true,
                getLocation: () => ({
                    hostname: "localhost",
                    protocol: "http:",
                }),
            }).isDevelopmentScope()
        ).toBe(true);
        expect(
            getStateDevToolsRuntime({
                getIsRendererScope: () => true,
                getLocation: () => ({
                    hostname: "127.0.0.1",
                    protocol: "http:",
                }),
            }).isDevelopmentScope()
        ).toBe(true);
    });

    it("treats file protocol renderer scopes as development", () => {
        expect.assertions(1);

        expect(
            getStateDevToolsRuntime({
                getIsRendererScope: () => true,
                getLocation: () => ({ hostname: "app", protocol: "file:" }),
            }).isDevelopmentScope()
        ).toBe(true);
    });

    it("rejects production and non-renderer scopes", () => {
        expect.assertions(2);

        expect(
            getStateDevToolsRuntime({
                getIsRendererScope: () => true,
                getLocation: () => ({
                    hostname: "example.com",
                    protocol: "https:",
                }),
            }).isDevelopmentScope()
        ).toBe(false);
        expect(
            getStateDevToolsRuntime({
                getIsRendererScope: () => false,
                getLocation: () => ({
                    hostname: "localhost",
                    protocol: "http:",
                }),
            }).isDevelopmentScope()
        ).toBe(false);
    });

    it("delegates interval scheduling and clearing through the provided scope", () => {
        expect.assertions(4);

        const intervalHandle = 123 as StateDevToolsIntervalHandle;
        const callback = vi.fn();
        const clearIntervalMock = vi.fn<BrowserClearInterval>();
        const setIntervalMock = vi.fn<BrowserSetInterval>(() => intervalHandle);
        const runtime = getStateDevToolsRuntime({
            getClearInterval: () => clearIntervalMock,
            getSetInterval: () => setIntervalMock,
        });
        const handle = runtime.setInterval(callback, 1000);

        expect(handle).toBe(intervalHandle);
        expect(setIntervalMock).toHaveBeenCalledWith(callback, 1000);

        runtime.clearInterval(handle);

        expect(clearIntervalMock).toHaveBeenCalledWith(intervalHandle);
        expect(callback).not.toHaveBeenCalled();
    });

    it("delegates date, performance, and memory reads through provider functions", () => {
        expect.assertions(5);

        const dateNow = vi.fn<() => number>(() => 123);
        const performanceNow = vi.fn<() => number>(() => 456);
        const memory = {
            jsHeapSizeLimit: 3,
            totalJSHeapSize: 2,
            usedJSHeapSize: 1,
        };
        const performance = {
            memory,
            now: performanceNow,
        };
        const getDateNow = vi.fn(() => dateNow);
        const getPerformance = vi.fn(() => performance);
        const utils = getStateDevToolsRuntime({
            getDateNow,
            getPerformance,
        });

        expect(utils.dateNow()).toBe(123);
        expect(utils.performanceNow()).toBe(456);
        expect(utils.getPerformanceMemory()).toBe(memory);
        expect(getDateNow).toHaveBeenCalledOnce();
        expect(getPerformance).toHaveBeenCalledTimes(2);
    });

    it("delegates development checks and intervals through provider functions", () => {
        expect.assertions(9);

        const intervalHandle = 321 as BrowserIntervalHandle;
        const callback = vi.fn();
        const clearIntervalMock = vi.fn<BrowserClearInterval>();
        const setIntervalMock = vi.fn<BrowserSetInterval>(() => intervalHandle);
        const getClearInterval = vi.fn(() => clearIntervalMock);
        const getLocation = vi.fn(() => ({
            hostname: "localhost",
            protocol: "http:",
        }));
        const getSetInterval = vi.fn(() => setIntervalMock);
        const getIsRendererScope = vi.fn(() => true);
        const utils = getStateDevToolsRuntime({
            getClearInterval,
            getIsRendererScope,
            getLocation,
            getSetInterval,
        });
        const delay = 1000;

        expect(utils.isDevelopmentScope()).toBe(true);
        const handle = utils.setInterval(callback, delay);
        expect(handle).toBe(intervalHandle);
        utils.clearInterval(handle);

        expect(getLocation).toHaveBeenCalledOnce();
        expect(getIsRendererScope).toHaveBeenCalledOnce();
        expect(getSetInterval).toHaveBeenCalledOnce();
        expect(getClearInterval).toHaveBeenCalledOnce();
        expect(setIntervalMock).toHaveBeenCalledWith(callback, delay);
        expect(clearIntervalMock).toHaveBeenCalledWith(intervalHandle);
        expect(callback).not.toHaveBeenCalled();
    });

    it("uses browser runtime providers for production defaults", () => {
        expect.assertions(11);

        const intervalHandle = 222 as BrowserIntervalHandle;
        const callback = vi.fn();
        const dateNow = vi.spyOn(Date, "now").mockReturnValue(1234);
        const memory = {
            jsHeapSizeLimit: 3,
            totalJSHeapSize: 2,
            usedJSHeapSize: 1,
        };
        const now = vi.fn(function defaultPerformanceNow(this: Performance) {
            return 56.78;
        });
        const clearIntervalMock = vi.fn<BrowserClearInterval>();
        const setIntervalMock = vi.fn<BrowserSetInterval>(() => intervalHandle);
        const delay = Number("1000");

        vi.stubGlobal("clearInterval", clearIntervalMock);
        vi.stubGlobal("document", {});
        vi.stubGlobal("location", { hostname: "localhost", protocol: "http:" });
        vi.stubGlobal("performance", { memory, now });
        vi.stubGlobal("setInterval", setIntervalMock);

        const utils = getStateDevToolsRuntime();

        expect(utils.isDevelopmentScope()).toBe(true);
        expect(utils.dateNow()).toBe(1234);
        expect(utils.performanceNow()).toBe(56.78);
        expect(utils.getPerformanceMemory()).toBe(memory);
        const handle = utils.setInterval(callback, delay);
        expect(handle).toBe(intervalHandle);
        utils.clearInterval(handle);

        expect(dateNow).toHaveBeenCalledOnce();
        expect(now).toHaveBeenCalledOnce();
        expect(now.mock.contexts[0]).toBe(globalThis.performance);
        expect(setIntervalMock).toHaveBeenCalledWith(callback, delay);
        expect(clearIntervalMock).toHaveBeenCalledWith(intervalHandle);
        expect(callback).not.toHaveBeenCalled();
    });

    it("does not borrow ambient intervals for explicit scopes", () => {
        expect.assertions(4);

        const utils = getStateDevToolsRuntime({});

        expect(() => utils.dateNow()).toThrow(
            "stateDevToolsRuntime requires dateNow"
        );
        expect(() => utils.performanceNow()).toThrow(
            "stateDevToolsRuntime requires performance.now"
        );
        expect(() => utils.setInterval(() => {}, 0)).toThrow(
            "stateDevToolsRuntime requires setInterval"
        );
        expect(() => {
            utils.clearInterval(123 as BrowserIntervalHandle);
        }).toThrow("stateDevToolsRuntime requires clearInterval");
    });

    it("ignores legacy direct renderer-scope properties", () => {
        expect.assertions(1);

        const utils = getStateDevToolsRuntime({
            isRendererScope: true,
            location: { hostname: "localhost", protocol: "http:" },
        } as unknown as Parameters<typeof getStateDevToolsRuntime>[0]);

        expect(utils.isDevelopmentScope()).toBe(false);
    });

    it("ignores legacy direct interval, location, and clock properties", () => {
        expect.assertions(10);

        const clearIntervalMock = vi.fn<BrowserClearInterval>();
        const dateNow = vi.fn<() => number>(() => 123);
        const performanceNow = vi.fn<() => number>(() => 456);
        const setIntervalMock = vi.fn<BrowserSetInterval>(
            () => 123 as BrowserIntervalHandle
        );
        const utils = getStateDevToolsRuntime({
            clearInterval: clearIntervalMock,
            dateNow,
            getIsRendererScope: () => true,
            location: { hostname: "localhost", protocol: "http:" },
            performance: { now: performanceNow },
            setInterval: setIntervalMock,
        } as unknown as Parameters<typeof getStateDevToolsRuntime>[0]);

        expect(utils.isDevelopmentScope()).toBe(false);
        expect(() => utils.dateNow()).toThrow(
            "stateDevToolsRuntime requires dateNow"
        );
        expect(() => utils.performanceNow()).toThrow(
            "stateDevToolsRuntime requires performance.now"
        );
        expect(utils.getPerformanceMemory()).toBeUndefined();
        expect(() => utils.setInterval(() => {}, 0)).toThrow(
            "stateDevToolsRuntime requires setInterval"
        );
        expect(() => {
            utils.clearInterval(123 as BrowserIntervalHandle);
        }).toThrow("stateDevToolsRuntime requires clearInterval");
        expect(dateNow).not.toHaveBeenCalled();
        expect(performanceNow).not.toHaveBeenCalled();
        expect(setIntervalMock).not.toHaveBeenCalled();
        expect(clearIntervalMock).not.toHaveBeenCalled();
    });
});
