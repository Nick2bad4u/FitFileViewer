import { afterEach, describe, expect, it, vi } from "vitest";

import {
    getStateManagerRuntime,
    type StateManagerRuntimeScope,
} from "../../../../../electron-app/utils/state/core/stateManagerRuntime.js";

describe("stateManagerRuntime", () => {
    afterEach(() => {
        vi.restoreAllMocks();
    });

    it("reads timestamps through the injected provider", () => {
        expect.assertions(2);

        const dateNow = vi.fn<() => number>(() => 1234);
        const utils = getStateManagerRuntime({
            getDateNow: () => dateNow,
            getIsTestEnvironment: () => () => false,
        });

        expect(utils.dateNow()).toBe(1234);
        expect(dateNow).toHaveBeenCalledOnce();
    });

    it("reads test-environment state through the injected provider", () => {
        expect.assertions(2);

        const isTestEnvironment = vi.fn<() => boolean>(() => true);
        const utils = getStateManagerRuntime({
            getDateNow: () => () => 1234,
            getIsTestEnvironment: () => isTestEnvironment,
        });

        expect(utils.isTestEnvironment()).toBe(true);
        expect(isTestEnvironment).toHaveBeenCalledOnce();
    });

    it("ignores legacy direct clock and test-environment runtime properties", () => {
        expect.assertions(4);

        const dateNow = vi.fn<() => number>(() => 1234);
        const isTestEnvironment = vi.fn<() => boolean>(() => true);
        const utils = getStateManagerRuntime({
            dateNow,
            isTestEnvironment,
        } as unknown as Parameters<typeof getStateManagerRuntime>[0]);

        expect(() => utils.dateNow()).toThrow(
            "stateManager requires a dateNow provider"
        );
        expect(() => utils.isTestEnvironment()).toThrow(
            "stateManager requires an isTestEnvironment provider"
        );
        expect(dateNow).not.toHaveBeenCalled();
        expect(isTestEnvironment).not.toHaveBeenCalled();
    });

    it("uses the browser runtime provider for the production clock default", () => {
        expect.assertions(3);

        const dateNow = vi.spyOn(Date, "now").mockReturnValue(4321);
        const utils = getStateManagerRuntime();

        expect(utils.dateNow()).toBe(4321);
        expect(utils.isTestEnvironment()).toBe(process.env.NODE_ENV === "test");
        expect(dateNow).toHaveBeenCalledOnce();
    });

    it("fails clearly when explicit scopes omit timing providers", () => {
        expect.assertions(2);

        const utils = getStateManagerRuntime(
            {} as unknown as StateManagerRuntimeScope
        );

        expect(() => utils.dateNow()).toThrow(
            "stateManager requires a dateNow provider"
        );
        expect(() => utils.isTestEnvironment()).toThrow(
            "stateManager requires an isTestEnvironment provider"
        );
    });

    it("fails clearly when explicit providers return unavailable runtimes", () => {
        expect.assertions(2);

        const utils = getStateManagerRuntime({
            getDateNow: () => undefined,
            getIsTestEnvironment: () => undefined,
        });

        expect(() => utils.dateNow()).toThrow("stateManager requires dateNow");
        expect(() => utils.isTestEnvironment()).toThrow(
            "stateManager requires an isTestEnvironment runtime"
        );
    });
});
