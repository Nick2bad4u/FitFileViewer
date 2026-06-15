// @vitest-environment jsdom
import { describe, expect, it } from "vitest";

import { getChartTabIntegrationRuntime } from "../../../../../electron-app/utils/charts/core/chartTabIntegrationRuntime.js";

function cleanupFixture(): void {
    document.body.replaceChildren();
}

describe("getChartTabIntegrationRuntime", () => {
    it("resolves chart tab buttons through the injected document", () => {
        expect.assertions(2);

        try {
            const legacyTab = document.createElement("button");
            legacyTab.id = "tab_chart";
            document.body.append(legacyTab);

            expect(
                getChartTabIntegrationRuntime({
                    document,
                    HTMLElement,
                }).queryChartTabButton()
            ).toBe(legacyTab);

            const chartJsTab = document.createElement("button");
            chartJsTab.id = "tab_chartjs";
            document.body.prepend(chartJsTab);

            expect(
                getChartTabIntegrationRuntime({
                    document,
                    HTMLElement,
                }).queryChartTabButton()
            ).toBe(chartJsTab);
        } finally {
            cleanupFixture();
        }
    });

    it("filters selector results through the injected HTMLElement constructor", () => {
        expect.assertions(4);

        try {
            const tab = document.createElement("button");
            tab.dataset.tab = "chart";
            document.body.append(tab);
            const runtime = getChartTabIntegrationRuntime({
                document,
                HTMLElement,
            });

            expect(runtime.querySelector('[data-tab="chart"]')).toBe(tab);
            expect(runtime.isHTMLElement(tab)).toBe(true);
            expect(
                getChartTabIntegrationRuntime({
                    document,
                }).querySelector('[data-tab="chart"]')
            ).toBe(tab);
            expect(
                getChartTabIntegrationRuntime({
                    document: {
                        querySelector: () => document,
                    } as unknown as Document,
                    HTMLElement,
                }).querySelector('[data-tab="chart"]')
            ).toBeNull();
        } finally {
            cleanupFixture();
        }
    });
});
