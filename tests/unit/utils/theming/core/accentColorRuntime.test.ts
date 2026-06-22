import { describe, expect, it } from "vitest";

import {
    getAccentColorRuntime,
    type AccentColorRuntimeScope,
} from "../../../../../electron-app/utils/theming/core/accentColorRuntime.js";

describe("getAccentColorRuntime", () => {
    it("resolves accent color targets and storage through providers", () => {
        expect.assertions(3);

        const utils = getAccentColorRuntime({
            getDocument: () => document,
            getHTMLElement: () => HTMLElement,
            getStorage: () => localStorage,
        });

        expect(utils.getAccentColorTargets()).toStrictEqual([
            document.documentElement,
            document.body,
        ]);
        expect(utils.getStorage()).toBe(localStorage);
        expect(utils.getStorage()).toBe(localStorage);
    });

    it("returns no targets when document or element constructor providers are unavailable", () => {
        expect.assertions(2);

        expect(
            getAccentColorRuntime({
                getDocument: () => document,
            }).getAccentColorTargets()
        ).toStrictEqual([]);
        expect(
            getAccentColorRuntime({
                getHTMLElement: () => HTMLElement,
            }).getAccentColorTargets()
        ).toStrictEqual([]);
    });

    it("returns no storage when the storage provider is unavailable", () => {
        expect.assertions(1);

        expect(getAccentColorRuntime({}).getStorage()).toBeUndefined();
    });

    it("ignores legacy direct runtime scope properties", () => {
        expect.assertions(2);

        const utils = getAccentColorRuntime({
            document,
            HTMLElement,
            localStorage,
        } as unknown as AccentColorRuntimeScope);

        expect(utils.getAccentColorTargets()).toStrictEqual([]);
        expect(utils.getStorage()).toBeUndefined();
    });
});
