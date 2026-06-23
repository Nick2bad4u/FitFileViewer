import { describe, expect, it } from "vitest";

import {
    getMapActionButtonsRuntime,
    type MapActionButtonsRuntimeScope,
} from "../../../../electron-app/utils/maps/controls/mapActionButtonsRuntime.js";

describe("getMapActionButtonsRuntime", () => {
    it("uses the injected timer scheduler", () => {
        expect.assertions(3);

        let callbackRan = false;
        let scheduledDelayMs = 0;
        const runtime = getMapActionButtonsRuntime({
            getSetTimeout: () =>
                function setTimeout(
                    callback,
                    delayMs
                ): ReturnType<typeof globalThis.setTimeout> {
                    scheduledDelayMs = delayMs;
                    callback();
                    return 7 as ReturnType<typeof globalThis.setTimeout>;
                },
        });
        const retryDelayMs = Number.parseInt("150", 10);

        const timer = runtime.setTimeout(() => {
            callbackRan = true;
        }, retryDelayMs);

        expect(timer).toBe(7);
        expect(callbackRan).toBe(true);
        expect(scheduledDelayMs).toBe(retryDelayMs);
    });

    it("uses the injected timer clearer", () => {
        expect.assertions(1);

        let clearedTimer: ReturnType<typeof setTimeout> | undefined;
        const runtime = getMapActionButtonsRuntime({
            getClearTimeout: () =>
                function clearTimeout(timer): void {
                    clearedTimer = timer;
                },
        });
        const timer = 9 as ReturnType<typeof setTimeout>;

        runtime.clearTimeout(timer);

        expect(clearedTimer).toBe(timer);
    });

    it("uses the injected document and HTMLElement providers", () => {
        expect.assertions(3);

        const documentRef = document;
        const element = documentRef.createElement("button");
        const runtime = getMapActionButtonsRuntime({
            getDocument: () => documentRef,
            getHTMLElement: () => HTMLElement,
        });

        expect(runtime.getDocument()).toBe(documentRef);
        expect(runtime.isHTMLElement(element)).toBe(true);
        expect(runtime.isHTMLElement({})).toBe(false);
    });

    it("does not borrow ambient timers for explicit scopes", () => {
        expect.assertions(4);

        const runtime = getMapActionButtonsRuntime({});

        expect(() => runtime.setTimeout(() => {}, 1)).toThrow(
            "mapActionButtonsRuntime requires setTimeout"
        );
        expect(() =>
            runtime.clearTimeout(1 as ReturnType<typeof globalThis.setTimeout>)
        ).toThrow("mapActionButtonsRuntime requires clearTimeout");
        expect(() => runtime.getDocument()).toThrow(
            "mapActionButtonsRuntime requires document"
        );
        expect(runtime.isHTMLElement(document.createElement("div"))).toBe(
            false
        );
    });

    it("ignores legacy direct timer scope properties", () => {
        expect.assertions(4);

        const runtime = getMapActionButtonsRuntime({
            clearTimeout() {
                throw new Error("legacy clearTimeout should not run");
            },
            document,
            HTMLElement,
            setTimeout() {
                throw new Error("legacy setTimeout should not run");
            },
        } as unknown as MapActionButtonsRuntimeScope);

        expect(() => runtime.setTimeout(() => {}, 1)).toThrow(
            "mapActionButtonsRuntime requires setTimeout"
        );
        expect(() =>
            runtime.clearTimeout(1 as ReturnType<typeof globalThis.setTimeout>)
        ).toThrow("mapActionButtonsRuntime requires clearTimeout");
        expect(() => runtime.getDocument()).toThrow(
            "mapActionButtonsRuntime requires document"
        );
        expect(runtime.isHTMLElement(document.createElement("div"))).toBe(
            false
        );
    });
});
