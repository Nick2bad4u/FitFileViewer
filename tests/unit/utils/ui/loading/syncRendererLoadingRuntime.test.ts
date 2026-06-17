// @vitest-environment jsdom
import { describe, expect, it } from "vitest";

import type { SyncRendererLoadingRuntimeScope } from "../../../../../electron-app/utils/ui/loading/syncRendererLoadingRuntime.js";
import { getSyncRendererLoadingRuntime } from "../../../../../electron-app/utils/ui/loading/syncRendererLoadingRuntime.js";

function resetBody(): void {
    document.body.replaceChildren();
    document.body.removeAttribute("aria-busy");
    document.body.style.cursor = "";
}

describe("getSyncRendererLoadingRuntime", () => {
    it("finds the loading overlay using flexible id matching", () => {
        expect.assertions(1);

        resetBody();
        const overlay = document.createElement("div");
        overlay.id = "loadingOverlay";
        document.body.append(overlay);

        expect(
            getSyncRendererLoadingRuntime({
                getDocument: () => document,
            }).getLoadingOverlay()
        ).toBe(overlay);
    });

    it("updates body loading attributes through the injected document", () => {
        expect.assertions(4);

        resetBody();
        const utils = getSyncRendererLoadingRuntime({
            getDocument: () => document,
        });

        utils.setBodyLoading(true);

        expect(document.body.style.cursor).toBe("wait");
        expect(document.body.getAttribute("aria-busy")).toBe("true");

        utils.setBodyLoading(false);

        expect(document.body.style.cursor).toBe("");
        expect(document.body.getAttribute("aria-busy")).toBe("false");
    });

    it("returns interactive elements and identifies disableable form controls", () => {
        expect.assertions(6);

        resetBody();
        const button = document.createElement("button");
        const input = document.createElement("input");
        const select = document.createElement("select");
        const textArea = document.createElement("textarea");
        const link = document.createElement("a");
        document.body.append(button, input, select, textArea, link);
        const utils = getSyncRendererLoadingRuntime({
            getDocument: () => document,
            getHTMLButtonElement: () => HTMLButtonElement,
            getHTMLInputElement: () => HTMLInputElement,
            getHTMLSelectElement: () => HTMLSelectElement,
            getHTMLTextAreaElement: () => HTMLTextAreaElement,
        });

        expect(utils.getInteractiveElements()).toStrictEqual([
            button,
            input,
            select,
            textArea,
        ]);
        expect(utils.isDisableableFormControl(button)).toBe(true);
        expect(utils.isDisableableFormControl(input)).toBe(true);
        expect(utils.isDisableableFormControl(select)).toBe(true);
        expect(utils.isDisableableFormControl(textArea)).toBe(true);
        expect(utils.isDisableableFormControl(link)).toBe(false);
    });

    it("falls back to false for invalid form control constructors", () => {
        expect.assertions(1);

        resetBody();
        const button = document.createElement("button");
        const utils = getSyncRendererLoadingRuntime({
            getDocument: () => document,
            getHTMLButtonElement: () =>
                "HTMLButtonElement" as unknown as typeof HTMLButtonElement,
        });

        expect(utils.isDisableableFormControl(button)).toBe(false);
    });

    it("fails clearly when document access is unavailable", () => {
        expect.assertions(3);

        const utils = getSyncRendererLoadingRuntime({});

        expect(() => utils.getLoadingOverlay()).toThrow(
            "syncRendererLoading requires a document runtime"
        );
        expect(() => utils.getInteractiveElements()).toThrow(
            "syncRendererLoading requires a document runtime"
        );
        expect(() => utils.setBodyLoading(true)).toThrow(
            "syncRendererLoading requires a document runtime"
        );
    });

    it("ignores legacy direct runtime scope properties", () => {
        expect.assertions(4);

        resetBody();
        const button = document.createElement("button");
        document.body.append(button);
        const legacyScope = {
            document,
            HTMLButtonElement,
            HTMLInputElement,
            HTMLSelectElement,
            HTMLTextAreaElement,
        } as unknown as SyncRendererLoadingRuntimeScope;
        const utils = getSyncRendererLoadingRuntime(legacyScope);

        expect(() => utils.getLoadingOverlay()).toThrow(
            "syncRendererLoading requires a document runtime"
        );
        expect(() => utils.getInteractiveElements()).toThrow(
            "syncRendererLoading requires a document runtime"
        );
        expect(() => utils.setBodyLoading(true)).toThrow(
            "syncRendererLoading requires a document runtime"
        );
        expect(utils.isDisableableFormControl(button)).toBe(false);
    });
});
