import { describe, expect, it } from "vitest";

import {
    getAccentColorRuntime,
    type AccentColorRuntimeScope,
} from "../../../../../electron-app/utils/theming/core/accentColorRuntime.js";

function createAccentColorRuntimeScope(
    overrides: Partial<AccentColorRuntimeScope> = {}
): AccentColorRuntimeScope {
    return {
        getDocument: () => undefined,
        getHTMLElement: () => undefined,
        getStorage: () => undefined,
        ...overrides,
    };
}

describe("getAccentColorRuntime", () => {
    it("resolves accent color targets and storage through providers", () => {
        expect.assertions(3);

        const utils = getAccentColorRuntime(
            createAccentColorRuntimeScope({
                getDocument: () => document,
                getHTMLElement: () => HTMLElement,
                getStorage: () => localStorage,
            })
        );

        expect(utils.getAccentColorTargets()).toStrictEqual([
            document.documentElement,
            document.body,
        ]);
        expect(utils.getStorage()).toBe(localStorage);
        expect(utils.getStorage()).toBe(localStorage);
    });

    it("resolves production accent color defaults through browser runtime providers", () => {
        expect.assertions(2);

        const utils = getAccentColorRuntime();

        expect(utils.getAccentColorTargets()).toStrictEqual([
            document.documentElement,
            document.body,
        ]);
        expect(utils.getStorage()).toBe(localStorage);
    });

    it("returns no targets when document or element constructor providers are unavailable", () => {
        expect.assertions(2);

        expect(
            getAccentColorRuntime(
                createAccentColorRuntimeScope({
                    getDocument: () => document,
                })
            ).getAccentColorTargets()
        ).toStrictEqual([]);
        expect(
            getAccentColorRuntime(
                createAccentColorRuntimeScope({
                    getHTMLElement: () => HTMLElement,
                })
            ).getAccentColorTargets()
        ).toStrictEqual([]);
    });

    it("returns no storage when the storage provider is unavailable", () => {
        expect.assertions(1);

        expect(
            getAccentColorRuntime(createAccentColorRuntimeScope()).getStorage()
        ).toBeUndefined();
    });

    it("fails clearly when accent color provider slots are omitted", () => {
        expect.assertions(3);

        const runtime = getAccentColorRuntime(
            {} as unknown as AccentColorRuntimeScope
        );
        const documentOnlyRuntime = getAccentColorRuntime({
            getDocument: () => document,
        } as unknown as AccentColorRuntimeScope);

        expect(() => runtime.getAccentColorTargets()).toThrow(
            "accentColorRuntime requires document provider"
        );
        expect(() => runtime.getStorage()).toThrow(
            "accentColorRuntime requires storage provider"
        );
        expect(() => documentOnlyRuntime.getAccentColorTargets()).toThrow(
            "accentColorRuntime requires HTMLElement provider"
        );
    });

    it("ignores legacy direct runtime scope properties", () => {
        expect.assertions(2);

        const utils = getAccentColorRuntime({
            document,
            HTMLElement,
            localStorage,
        } as unknown as AccentColorRuntimeScope);

        expect(() => utils.getAccentColorTargets()).toThrow(
            "accentColorRuntime requires document provider"
        );
        expect(() => utils.getStorage()).toThrow(
            "accentColorRuntime requires storage provider"
        );
    });
});
