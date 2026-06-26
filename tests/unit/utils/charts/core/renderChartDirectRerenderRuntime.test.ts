// @vitest-environment jsdom
import { describe, expect, it } from "vitest";

import {
    getRenderChartDirectRerenderRuntime,
    type RenderChartDirectRerenderRuntimeScope,
} from "../../../../../electron-app/utils/charts/core/renderChartDirectRerenderRuntime.js";

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
                    getDocument: () => document,
                    getHTMLElement: () => HTMLElement,
                }).queryChartContainer()
            ).toBe(contentContainer);

            const chartJsContainer = document.createElement("section");
            chartJsContainer.id = "chartjs_chart_container";
            document.body.prepend(chartJsContainer);

            expect(
                getRenderChartDirectRerenderRuntime({
                    getDocument: () => document,
                    getHTMLElement: () => HTMLElement,
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
                    getDocument: () => document,
                    getHTMLElement: () => HTMLElement,
                }).querySelector("#content_chart")
            ).toBe(chartContainer);
            expect(
                getRenderChartDirectRerenderRuntime({
                    getDocument: () => document,
                }).querySelector("#content_chart")
            ).toBe(chartContainer);
            expect(
                getRenderChartDirectRerenderRuntime({
                    getDocument: () =>
                        ({
                            querySelector: () => document,
                        }) as unknown as Document,
                    getHTMLElement: () => HTMLElement,
                }).querySelector("#content_chart")
            ).toBeNull();
        } finally {
            cleanupFixture();
        }
    });

    it("resolves production DOM defaults through browser runtime providers", () => {
        expect.assertions(2);

        try {
            const chartContainer = document.createElement("section");
            chartContainer.id = "content_chart";
            document.body.append(chartContainer);

            const utils = getRenderChartDirectRerenderRuntime();

            expect(utils.queryChartContainer()).toBe(chartContainer);
            expect(utils.querySelector("#content_chart")).toBe(chartContainer);
        } finally {
            cleanupFixture();
        }
    });

    it("ignores legacy direct runtime scope properties", () => {
        expect.assertions(2);

        try {
            const chartContainer = document.createElement("section");
            chartContainer.id = "content_chart";
            document.body.append(chartContainer);
            expect(
                getRenderChartDirectRerenderRuntime({
                    document,
                    HTMLElement,
                } as unknown as RenderChartDirectRerenderRuntimeScope).querySelector(
                    "#content_chart"
                )
            ).toBeNull();
            expect(
                getRenderChartDirectRerenderRuntime({
                    document,
                    HTMLElement,
                } as unknown as RenderChartDirectRerenderRuntimeScope).queryChartContainer()
            ).toBeNull();
        } finally {
            cleanupFixture();
        }
    });
});
