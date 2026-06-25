import { describe, expect, it } from "vitest";

import {
    getLoadingOverlayRuntime,
    type LoadingOverlayRuntimeScope,
} from "../../../../../electron-app/utils/ui/components/LoadingOverlayRuntime.js";

describe("getLoadingOverlayRuntime", () => {
    it("creates HTML and SVG elements through the injected document", () => {
        expect.assertions(3);

        const runtime = getLoadingOverlayRuntime({
            getDocument: () => document,
        });

        expect(runtime.createElement("div")).toBeInstanceOf(HTMLDivElement);
        expect(runtime.createElement("style")).toBeInstanceOf(HTMLStyleElement);
        expect(runtime.createSvgElement("svg")).toBeInstanceOf(SVGSVGElement);
    });

    it("queries and appends through the injected document", () => {
        expect.assertions(2);

        const runtime = getLoadingOverlayRuntime({
            getDocument: () => document,
        });
        const overlay = runtime.createElement("div");
        overlay.id = "fitfile-loading-overlay";

        runtime.appendToBody(overlay);

        expect(runtime.querySelector("#fitfile-loading-overlay")).toBe(overlay);
        expect(document.body.lastElementChild).toBe(overlay);
    });

    it("uses default browser document providers", () => {
        expect.assertions(3);

        const runtime = getLoadingOverlayRuntime();
        const overlay = runtime.createElement("div");
        overlay.id = "fitfile-loading-overlay";

        runtime.appendToBody(overlay);

        expect(overlay).toBeInstanceOf(HTMLDivElement);
        expect(runtime.querySelector("#fitfile-loading-overlay")).toBe(overlay);
        expect(runtime.createSvgElement("svg")).toBeInstanceOf(SVGSVGElement);
    });

    it("fails clearly when required runtimes are unavailable", () => {
        expect.assertions(3);

        const runtime = getLoadingOverlayRuntime({});

        expect(() => runtime.createElement("div")).toThrow(
            "LoadingOverlay requires a document runtime"
        );
        expect(() => runtime.createSvgElement("svg")).toThrow(
            "LoadingOverlay requires a document runtime"
        );
        expect(() => runtime.querySelector("body")).toThrow(
            "LoadingOverlay requires a document runtime"
        );
    });

    it("ignores legacy direct runtime scope properties", () => {
        expect.assertions(1);

        const legacyScope = {
            document,
        } as unknown as LoadingOverlayRuntimeScope;
        const runtime = getLoadingOverlayRuntime(legacyScope);

        expect(() => runtime.createElement("div")).toThrow(
            "LoadingOverlay requires a document runtime"
        );
    });
});
