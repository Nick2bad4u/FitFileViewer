import { afterEach, describe, expect, it, vi } from "vitest";

import {
    getAppDomainStateRuntime,
    type AppDomainStateRuntimeScope,
} from "../../../../../electron-app/utils/state/domain/appDomainStateRuntime.js";

describe("getAppDomainStateRuntime", () => {
    afterEach(() => {
        vi.restoreAllMocks();
    });

    const appDomainStateRuntimeScope = {
        getDateNow: () => Date.now,
    } satisfies AppDomainStateRuntimeScope;

    it("reads wall-clock timestamps through the injected provider", () => {
        expect.assertions(2);

        const dateNow = vi.fn<() => number>(() => 123);
        const runtime = getAppDomainStateRuntime({
            getDateNow: () => dateNow,
        });

        expect(runtime.dateNow()).toBe(123);
        expect(dateNow).toHaveBeenCalledOnce();
    });

    it("fails clearly when the clock provider returns unavailable", () => {
        expect.assertions(1);

        expect(() =>
            getAppDomainStateRuntime({
                getDateNow: () => undefined,
            }).dateNow()
        ).toThrow("appDomainState requires dateNow");
    });

    it("fails clearly when explicit scopes omit the clock provider", () => {
        expect.assertions(1);

        expect(() =>
            getAppDomainStateRuntime(
                {} as unknown as AppDomainStateRuntimeScope
            ).dateNow()
        ).toThrow("appDomainState requires a dateNow provider");
    });

    it("fails clearly when the clock provider slot is omitted", () => {
        expect.assertions(1);

        expect(() =>
            getAppDomainStateRuntime({
                ...appDomainStateRuntimeScope,
                getDateNow: undefined,
            }).dateNow()
        ).toThrow("appDomainState requires a dateNow provider");
    });

    it("ignores legacy direct runtime scope properties", () => {
        expect.assertions(2);

        const dateNow = vi.fn<() => number>(() => 123);
        const runtime = getAppDomainStateRuntime({
            dateNow,
        } as unknown as AppDomainStateRuntimeScope);

        expect(() => runtime.dateNow()).toThrow(
            "appDomainState requires a dateNow provider"
        );
        expect(dateNow).not.toHaveBeenCalled();
    });

    it("uses the browser runtime provider for the production clock default", () => {
        expect.assertions(2);

        const dateNow = vi.spyOn(Date, "now").mockReturnValue(1234);
        const runtime = getAppDomainStateRuntime();

        expect(runtime.dateNow()).toBe(1234);
        expect(dateNow).toHaveBeenCalledOnce();
    });
});
