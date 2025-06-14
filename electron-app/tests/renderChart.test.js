import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { renderChart } from "../utils/renderChart";

describe("renderChart", () => {
    let container;
    beforeEach(() => {
        container = document.createElement("div");
        container.id = "content-chart";
        document.body.appendChild(container);
        window.globalData = { recordMesgs: [{ timestamp: 1, speed: 2.5 }] };
        window.aq = {
            from: (arr) => ({
                columnNames: () => Object.keys(arr[0] || {}),
                fold: () => ({ objects: () => [{ key: "speed", value: 2.5 }] }),
            }),
        };
        window.getChartSpec = vi.fn(() => ({}));
        window.vegaEmbed = vi.fn(() => Promise.resolve({ view: { resize: vi.fn().mockReturnThis(), run: vi.fn() } }));
        localStorage.clear();
    });
    afterEach(() => {
        document.body.removeChild(container);
        delete window.globalData;
        delete window.aq;
        delete window.getChartSpec;
        delete window.vegaEmbed;
        localStorage.clear();
    });
    it("should render chart if recordMesgs and aq are available", async () => {
        await renderChart();
        expect(container.querySelector("#vega-container")).not.toBeNull();
        expect(window.vegaEmbed).toHaveBeenCalled();
    });
    it("should show no data message if no recordMesgs", () => {
        window.globalData = {};
        renderChart();
        expect(container.textContent).toContain("No recordMesgs data available");
    });
    it("should show error if aq is missing", () => {
        delete window.aq;
        renderChart();
        expect(container.textContent).toContain("Skipping chart rendering");
    });
});
