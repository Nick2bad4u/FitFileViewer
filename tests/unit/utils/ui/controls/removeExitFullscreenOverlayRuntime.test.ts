import { describe, expect, it } from "vitest";

import { getRemoveExitFullscreenOverlayRuntime } from "../../../../../electron-app/utils/ui/controls/removeExitFullscreenOverlayRuntime.js";

describe("getRemoveExitFullscreenOverlayRuntime", () => {
    it("identifies elements through the injected document", () => {
        expect.assertions(2);

        const runtime = getRemoveExitFullscreenOverlayRuntime({ document });

        expect(runtime.isHTMLElement(document.createElement("div"))).toBe(true);
        expect(runtime.isHTMLElement({})).toBe(false);
    });

    it("does not borrow ambient element constructors for explicit documents", () => {
        expect.assertions(1);

        const scopedDocument = { defaultView: undefined } as Document;
        const runtime = getRemoveExitFullscreenOverlayRuntime({
            document: scopedDocument,
        });

        expect(runtime.isHTMLElement(document.createElement("div"))).toBe(
            false
        );
    });

    it("fails clearly when the document runtime is unavailable", () => {
        expect.assertions(1);

        const runtime = getRemoveExitFullscreenOverlayRuntime({});

        expect(() => runtime.isHTMLElement({})).toThrow(
            "removeExitFullscreenOverlay requires a document runtime"
        );
    });
});
