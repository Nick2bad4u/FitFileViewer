import { describe, it, expect, beforeEach } from "vitest";
import { JSDOM } from "jsdom";
import { createChartCanvas } from "../../../../../utils/charts/components/createChartCanvas.js";

describe("createChartCanvas", () => {
  let dom: JSDOM;

  beforeEach(() => {
    dom = new JSDOM(`<!DOCTYPE html><html><body></body></html>`);
    global.window = dom.window as any;
    global.document = dom.window.document as any;
  });

  it("creates a canvas with id, class, aria and styles", () => {
    const canvas = createChartCanvas("heartRate", 2);

    expect(canvas).toBeInstanceOf(window.HTMLCanvasElement);
    expect(canvas.id).toBe("chart-heartRate-2");
    expect(canvas.className).toBe("chart-canvas");
    expect(canvas.getAttribute("role")).toBe("img");
    expect(canvas.getAttribute("aria-label")).toBe("Chart for heartRate");

    const style = canvas.style;
    expect(style.width).toBe("100%");
    expect(style.maxHeight).toBe("400px");
    expect(style.marginBottom).toBe("20px");
    expect(style.borderRadius).toBe("8px");
    expect(style.boxShadow).toBe("0 2px 8px rgba(0,0,0,0.1)");
  });
});
