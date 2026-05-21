import { describe, expect, it } from "vitest";

import {
    escapeHtml,
    resolveChartTitleIconName,
} from "../../../../../utils/charts/plugins/chartTitleOverlayUtils.js";

describe(escapeHtml, () => {
    it("escapes text for chart title overlay HTML", () => {
        expect.assertions(2);

        const escaped = escapeHtml(`A&B <tag attr="value">'`);

        expect(escaped).toBe("A&amp;B &lt;tag attr=&quot;value&quot;&gt;&#39;");
        expect(escaped).not.toContain("<tag");
    });
});

describe(resolveChartTitleIconName, () => {
    it("maps known chart title families to icon names", () => {
        expect.assertions(2);

        expect([
            resolveChartTitleIconName("Power Output"),
            resolveChartTitleIconName("Speed and Pace"),
            resolveChartTitleIconName("Distance Grade"),
            resolveChartTitleIconName("Elapsed Time"),
            resolveChartTitleIconName("Route Map"),
        ]).toStrictEqual([
            "activity",
            "gauge",
            "ruler",
            "timer",
            "route",
        ]);
        expect(resolveChartTitleIconName("Power Output")).not.toBe("table");
    });

    it("uses the table icon for unclassified titles", () => {
        expect.assertions(2);

        expect(resolveChartTitleIconName("Custom Developer Metric")).toBe(
            "table"
        );
        expect(resolveChartTitleIconName("Custom Developer Metric")).not.toBe(
            "activity"
        );
    });
});
