import { describe, expect, it, vi } from "vitest";

import type { CreateChartCanvasRuntimeScope } from "../../../../../electron-app/utils/charts/components/createChartCanvasRuntime.js";
import { getCreateChartCanvasRuntime } from "../../../../../electron-app/utils/charts/components/createChartCanvasRuntime.js";

describe("getCreateChartCanvasRuntime", () => {
    it("creates canvases through the injected document", () => {
        expect.assertions(3);

        const documentRef =
            document.implementation.createHTMLDocument("chart canvas");
        const createElement = vi.spyOn(documentRef, "createElement");
        const runtime = getCreateChartCanvasRuntime({
            getDocument: () => documentRef,
        });

        const canvas = runtime.createCanvas();

        expect(canvas).toBeInstanceOf(HTMLCanvasElement);
        expect(canvas.ownerDocument).toBe(documentRef);
        expect(createElement).toHaveBeenCalledExactlyOnceWith("canvas");
    });

    it("creates canvases through default browser providers", () => {
        expect.assertions(2);

        const runtime = getCreateChartCanvasRuntime();
        const canvas = runtime.createCanvas();

        expect(canvas).toBeInstanceOf(HTMLCanvasElement);
        expect(canvas.ownerDocument).toBe(document);
    });

    it("fails clearly when the document runtime is unavailable", () => {
        expect.assertions(1);

        const runtime = getCreateChartCanvasRuntime({});

        expect(() => runtime.createCanvas()).toThrow(
            "createChartCanvas requires a document runtime"
        );
    });

    it("ignores legacy direct runtime scope properties", () => {
        expect.assertions(2);

        const documentRef = document.implementation.createHTMLDocument(
            "legacy chart canvas"
        );
        const createElement = vi.spyOn(documentRef, "createElement");
        const legacyScope = {
            document: documentRef,
        } as unknown as CreateChartCanvasRuntimeScope;
        const runtime = getCreateChartCanvasRuntime(legacyScope);

        expect(() => runtime.createCanvas()).toThrow(
            "createChartCanvas requires a document runtime"
        );
        expect(createElement).not.toHaveBeenCalled();
    });
});
