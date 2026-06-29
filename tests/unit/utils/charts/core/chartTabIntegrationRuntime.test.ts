// @vitest-environment jsdom
import { describe, expect, it } from "vitest";

import {
    getChartTabIntegrationRuntime,
    type ChartTabIntegrationRuntimeScope,
} from "../../../../../electron-app/utils/charts/core/chartTabIntegrationRuntime.js";

function cleanupFixture(): void {
    document.body.replaceChildren();
}

describe("getChartTabIntegrationRuntime", () => {
    const unavailableChartTabIntegrationRuntimeScope = {
        getDocument: () => undefined,
        getHTMLElement: () => undefined,
    } satisfies ChartTabIntegrationRuntimeScope;

    it("resolves chart tab buttons through the injected document", () => {
        expect.assertions(2);

        try {
            const legacyTab = document.createElement("button");
            legacyTab.id = "tab_chart";
            document.body.append(legacyTab);

            expect(
                getChartTabIntegrationRuntime({
                    getDocument: () => document,
                    getHTMLElement: () => HTMLElement,
                }).queryChartTabButton()
            ).toBe(legacyTab);

            const chartJsTab = document.createElement("button");
            chartJsTab.id = "tab_chartjs";
            document.body.prepend(chartJsTab);

            expect(
                getChartTabIntegrationRuntime({
                    getDocument: () => document,
                    getHTMLElement: () => HTMLElement,
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
                getDocument: () => document,
                getHTMLElement: () => HTMLElement,
            });

            expect(runtime.querySelector('[data-tab="chart"]')).toBe(tab);
            expect(runtime.isHTMLElement(tab)).toBe(true);
            expect(
                getChartTabIntegrationRuntime({
                    getDocument: () =>
                        ({
                            defaultView: {
                                HTMLElement,
                            },
                            querySelector: (selector: string) =>
                                document.querySelector(selector),
                        }) as unknown as Document,
                    getHTMLElement: () => undefined,
                }).querySelector('[data-tab="chart"]')
            ).toBeNull();
            expect(
                getChartTabIntegrationRuntime({
                    getDocument: () =>
                        ({
                            querySelector: () => document,
                        }) as unknown as Document,
                    getHTMLElement: () => HTMLElement,
                }).querySelector('[data-tab="chart"]')
            ).toBeNull();
        } finally {
            cleanupFixture();
        }
    });

    it("returns empty results when runtime providers are unavailable", () => {
        expect.assertions(3);

        const runtime = getChartTabIntegrationRuntime(
            unavailableChartTabIntegrationRuntimeScope
        );
        const tab = document.createElement("button");

        expect(runtime.querySelector('[data-tab="chart"]')).toBeNull();
        expect(runtime.queryChartTabButton()).toBeNull();
        expect(runtime.isHTMLElement(tab)).toBe(false);
    });

    it("fails clearly when required providers are omitted", () => {
        expect.assertions(3);

        const runtime = getChartTabIntegrationRuntime(
            {} as unknown as ChartTabIntegrationRuntimeScope
        );
        const tab = document.createElement("button");

        expect(() => runtime.querySelector('[data-tab="chart"]')).toThrow(
            "chartTabIntegration requires a document provider"
        );
        expect(() => runtime.queryChartTabButton()).toThrow(
            "chartTabIntegration requires a document provider"
        );
        expect(() => runtime.isHTMLElement(tab)).toThrow(
            "chartTabIntegration requires an HTMLElement provider"
        );
    });

    it("resolves production DOM defaults through browser runtime providers", () => {
        expect.assertions(3);

        try {
            const tab = document.createElement("button");
            tab.dataset.tab = "chart";
            document.body.append(tab);

            const runtime = getChartTabIntegrationRuntime();

            expect(runtime.queryChartTabButton()).toBe(tab);
            expect(runtime.querySelector('[data-tab="chart"]')).toBe(tab);
            expect(runtime.isHTMLElement(tab)).toBe(true);
        } finally {
            cleanupFixture();
        }
    });

    it("ignores legacy direct runtime scope properties", () => {
        expect.assertions(3);

        try {
            const tab = document.createElement("button");
            tab.dataset.tab = "chart";
            document.body.append(tab);
            const runtime = getChartTabIntegrationRuntime({
                ...unavailableChartTabIntegrationRuntimeScope,
                document,
                HTMLElement,
            } as unknown as ChartTabIntegrationRuntimeScope);

            expect(runtime.querySelector('[data-tab="chart"]')).toBeNull();
            expect(runtime.queryChartTabButton()).toBeNull();
            expect(runtime.isHTMLElement(tab)).toBe(false);
        } finally {
            cleanupFixture();
        }
    });
});
