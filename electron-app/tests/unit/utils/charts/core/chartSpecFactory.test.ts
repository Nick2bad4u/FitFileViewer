import { describe, expect, it } from "vitest";

import {
    buildChartConfigFromSpec,
    buildChartSpecFromDefinition,
    type ChartDefinition,
    type ChartSpec,
} from "../../../../../utils/charts/core/chartSpecFactory.js";

describe("chartSpecFactory", () => {
    it("builds Chart.js config from a chart spec and theme colors", () => {
        expect.assertions(1);

        const spec: ChartSpec = {
            axes: [
                { id: "x", label: "Distance", type: "linear" },
                { id: "y1", label: "Power", type: "linear" },
            ],
            datasets: [
                {
                    colorRole: "primary",
                    data: [
                        1,
                        2,
                        3,
                    ],
                    fill: true,
                    id: "power",
                    label: "Power",
                },
            ],
            showGrid: false,
            title: "Power Curve",
            type: "line",
        };

        expect(
            buildChartConfigFromSpec(spec, {
                colors: {
                    gridLines: "#ddd",
                    primary: "#123456",
                    text: "#111",
                    textPrimary: "#222",
                },
            })
        ).toStrictEqual({
            data: {
                datasets: [
                    {
                        backgroundColor: "#12345633",
                        borderColor: "#123456",
                        data: [
                            1,
                            2,
                            3,
                        ],
                        fill: true,
                        hidden: false,
                        label: "Power",
                        pointHoverRadius: 4,
                        pointRadius: 2,
                        showLine: true,
                        tension: 0.1,
                        yAxisID: "y",
                    },
                ],
            },
            options: {
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: true,
                        labels: { color: "#111" },
                    },
                    title: {
                        color: "#111",
                        display: true,
                        font: { size: 16, weight: "bold" },
                        text: "Power Curve",
                    },
                },
                responsive: true,
                scales: {
                    x: {
                        display: true,
                        grid: { color: "#ddd", display: false },
                        position: undefined,
                        ticks: { color: "#222" },
                        title: {
                            color: "#222",
                            display: true,
                            text: "Distance",
                        },
                        type: "linear",
                    },
                    y1: {
                        display: true,
                        grid: { color: "#ddd", display: false },
                        position: "right",
                        ticks: { color: "#222" },
                        title: {
                            color: "#222",
                            display: true,
                            text: "Power",
                        },
                        type: "linear",
                    },
                },
            },
            type: "line",
        });
    });

    it("builds a chart spec from a declarative definition", () => {
        expect.assertions(1);

        const definition: ChartDefinition = {
            chartType: "area",
            datasets: [
                {
                    dataKey: "speed",
                    datasetOptions: { pointRadius: 0 },
                    id: "speed",
                    label: "Speed",
                    transform: (value) =>
                        value === null ? null : Number(value.toFixed(1)),
                },
                {
                    dataKey: "power",
                    hidden: true,
                    id: "power",
                    label: "Power",
                    yAxisId: "y1",
                },
            ],
            id: "activity",
            labelSelector: (_, index) => index + 1,
            title: "Activity",
            xAxisLabel: "Sample",
            yAxisLabel: "Value",
        };

        expect(
            buildChartSpecFromDefinition(
                definition,
                [
                    { power: 200, speed: 4.44 },
                    { power: 210, speed: 5.55 },
                ],
                {
                    chartSettings: {
                        fieldVisibility: { power: "visible" },
                    },
                    defaultColorPalette: ["#f00", "#0f0"],
                }
            )
        ).toStrictEqual({
            axes: [
                {
                    display: true,
                    id: "x",
                    label: "Sample",
                    type: "linear",
                },
                {
                    display: true,
                    id: "y",
                    label: "Value",
                    type: "linear",
                },
            ],
            datasets: [
                {
                    backgroundColor: "#f00",
                    borderColor: "#f00",
                    data: [4.4, 5.5],
                    hidden: false,
                    id: "speed",
                    label: "Speed",
                    pointRadius: 0,
                },
                {
                    backgroundColor: "#0f0",
                    borderColor: "#0f0",
                    data: [200, 210],
                    hidden: true,
                    id: "power",
                    label: "Power",
                    yAxisID: "y1",
                },
            ],
            id: "activity",
            labels: [1, 2],
            title: "Activity",
            type: "line",
        });
    });

    it("normalizes invalid keyed record values to null", () => {
        expect.assertions(2);

        const spec = buildChartSpecFromDefinition(
            {
                chartType: "line",
                datasets: [
                    {
                        dataKey: "speed",
                        id: "speed",
                        label: "Speed",
                    },
                ],
                id: "activity",
                title: "Activity",
            },
            [{ speed: "fast" }, { speed: null }]
        );

        expect(spec.datasets[0]?.data).toStrictEqual([null, null]);
        expect(spec.axes).toBeUndefined();
    });
});
