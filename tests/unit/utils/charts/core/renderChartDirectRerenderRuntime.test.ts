// @vitest-environment jsdom
import { describe, expect, it } from "vitest";

import { getRenderChartDirectRerenderRuntime } from "../../../../../electron-app/utils/charts/core/renderChartDirectRerenderRuntime.js";

function cleanupFixture(): void {
    document.body.replaceChildren();
}

describe("getRenderChartDirectRerenderRuntime", () => {
    it("resolves chart render containers through the injected document", () => {
        expect.assertions(2);

        try {
            const contentContainer = document.createElement("section");
            contentContainer.id = "content_chartjs";
            document.body.append(contentContainer);

            expect(
                getRenderChartDirectRerenderRuntime({
                    document,
                    HTMLElement,
                }).queryChartContainer()
            ).toBe(contentContainer);

            const chartJsContainer = document.createElement("section");
            chartJsContainer.id = "chartjs_chart_container";
            document.body.prepend(chartJsContainer);

            expect(
                getRenderChartDirectRerenderRuntime({
                    document,
                    HTMLElement,
                }).queryChartContainer()
            ).toBe(chartJsContainer);
        } finally {
            cleanupFixture();
        }
    });

    it("filters selector results through the injected HTMLElement constructor", () => {
        expect.assertions(3);

        try {
            const chartContainer = document.createElement("section");
            chartContainer.id = "content_chart";
            document.body.append(chartContainer);

            expect(
                getRenderChartDirectRerenderRuntime({
                    document,
                    HTMLElement,
                }).querySelector("#content_chart")
            ).toBe(chartContainer);
            expect(
                getRenderChartDirectRerenderRuntime({
                    document,
                }).querySelector("#content_chart")
            ).toBe(chartContainer);
            expect(
                getRenderChartDirectRerenderRuntime({
                    document: {
                        querySelector: () => document,
                    } as unknown as Document,
                    HTMLElement,
                }).querySelector("#content_chart")
            ).toBeNull();
        } finally {
            cleanupFixture();
        }
    });
});
