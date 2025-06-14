import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { renderSummary } from "../utils/renderSummary";

describe("renderSummary", () => {
    let container;
    beforeEach(() => {
        container = document.createElement("div");
        container.id = "content-summary";
        document.body.appendChild(container);
        window.aq = {
            from: (arr) => ({
                numRows: () => arr.length,
                get: (idx, key) => arr[idx][key],
                columnNames: () => Object.keys(arr[0] || {}),
                array: (key) => arr.map((row) => row[key]),
            }),
        };
    });
    afterEach(() => {
        document.body.removeChild(container);
        delete window.aq;
    });
    it("should render summary from sessionMesgs", () => {
        renderSummary({ sessionMesgs: [{ total_ascent: 100, total_descent: 80, foo: 1 }] });
        expect(container.querySelector("table")).not.toBeNull();
        expect(container.textContent).toContain("Activity Summary");
    });
    it("should render summary from recordMesgs", () => {
        renderSummary({ recordMesgs: [{ timestamp: 1, distance: 1000, speed: 2.5, altitude: 10 }] });
        expect(container.querySelector("table")).not.toBeNull();
        expect(container.textContent).toContain("Activity Summary");
    });
    it("should show no data message if no summary data", () => {
        renderSummary({});
        expect(container.textContent).toContain("No summary data available");
    });
});
