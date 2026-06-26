import { describe, expect, it, vi } from "vitest";

import { createChartCanvas } from "../../../../../electron-app/utils/charts/components/createChartCanvas.js";
import type { CreateChartCanvasRuntime } from "../../../../../electron-app/utils/charts/components/createChartCanvasRuntime.js";

describe(createChartCanvas, () => {
    it("creates an accessible canvas for a chart field", () => {
        expect.assertions(6);

        const canvas = createChartCanvas("speed-vs-distance", 2);

        expect(canvas).toBeInstanceOf(HTMLCanvasElement);
        expect(canvas.id).toBe("chart-speed-vs-distance-2");
        expect(canvas.className).toBe("chart-canvas");
        expect(canvas.getAttribute("role")).toBe("img");
        expect(canvas.getAttribute("aria-label")).toBe(
            "Chart for speed-vs-distance"
        );
        expect(canvas.style.width).toBe("100%");
    });

    it("applies the shared chart canvas visual defaults", () => {
        expect.assertions(4);

        const canvas = createChartCanvas("power", 0);

        expect(canvas.style.maxHeight).toBe("400px");
        expect(canvas.style.marginBottom).toBe("20px");
        expect(canvas.style.borderRadius).toBe("8px");
        expect(canvas.style.boxShadow).toBe("0 2px 8px rgba(0,0,0,0.1)");
    });

    it("does not reuse IDs for different chart indexes", () => {
        expect.assertions(1);

        const firstCanvas = createChartCanvas("power", 0),
            secondCanvas = createChartCanvas("power", 1);

        expect(firstCanvas.id).not.toBe(secondCanvas.id);
    });

    it("creates the canvas through an injected runtime", () => {
        expect.assertions(4);

        const canvas = document.createElement("canvas");
        const runtime: CreateChartCanvasRuntime = {
            createCanvas: vi.fn(() => canvas),
        };

        const result = createChartCanvas("heart-rate", 3, runtime);

        expect(runtime.createCanvas).toHaveBeenCalledOnce();
        expect(result).toBe(canvas);
        expect(result.id).toBe("chart-heart-rate-3");
        expect(result.getAttribute("aria-label")).toBe("Chart for heart-rate");
    });
});
