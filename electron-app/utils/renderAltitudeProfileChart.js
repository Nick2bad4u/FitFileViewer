import { getThemeConfig } from "./theme.js";
import { createChartCanvas } from "./createChartCanvas.js";
import { formatTime } from "./formatTime.js";
import { getUnitSymbol } from "./getUnitSymbol.js";
import { zoomResetPlugin } from "./zoomResetPlugin.js";

// Altitude profile with gradient visualization
export function renderAltitudeProfileChart(container, data, labels, options) {
    try {
        const hasAltitude = data.some(
            (row) => (row.altitude !== undefined && row.altitude !== null) || (row.enhancedAltitude !== undefined && row.enhancedAltitude !== null)
        );

        if (!hasAltitude) {
            return;
        }

        const visibility = localStorage.getItem("chartjs_field_altitude_profile");
        if (visibility === "hidden") {
            return;
        }

        const themeConfig = getThemeConfig();

        let chartData = data
            .map((row, index) => {
                const altitude = row.enhancedAltitude || row.altitude;

                if (altitude !== undefined && altitude !== null) {
                    return {
                        x: labels[index],
                        y: altitude,
                    };
                }
                return null;
            })
            .filter((point) => point !== null);

        if (chartData.length === 0) return;

        // Apply data point limiting
        if (options.maxPoints !== "all" && chartData.length > options.maxPoints) {
            const step = Math.ceil(chartData.length / options.maxPoints);
            chartData = chartData.filter((_, i) => i % step === 0);
        }

        const canvas = createChartCanvas("altitude-profile", "altitude-profile");
        canvas.style.background = themeConfig.colors.chartBackground;
        canvas.style.borderRadius = "12px";
        canvas.style.boxShadow = `0 2px 16px 0 ${themeConfig.colors.shadow}`;
        container.appendChild(canvas);

        const config = {
            type: "line",
            data: {
                datasets: [
                    {
                        label: "Altitude Profile",
                        data: chartData,
                        backgroundColor: themeConfig.colors.success + "4D", // Green with alpha
                        borderColor: themeConfig.colors.success,
                        pointRadius: 0,
                        pointHoverRadius: 4,
                        borderWidth: 2,
                        fill: "origin",
                        tension: 0.1,
                    },
                ],
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: options.showLegend,
                        labels: { color: themeConfig.colors.textPrimary },
                    },
                    title: {
                        display: options.showTitle,
                        text: "Altitude Profile",
                        font: { size: 16, weight: "bold" },
                        color: themeConfig.colors.textPrimary,
                    },
                    tooltip: {
                        backgroundColor: themeConfig.colors.chartSurface,
                        titleColor: themeConfig.colors.textPrimary,
                        bodyColor: themeConfig.colors.textPrimary,
                        borderColor: themeConfig.colors.chartBorder,
                        borderWidth: 1,
                        callbacks: {
                            title: function (context) {
                                return `Time: ${formatTime(context[0].parsed.x)}`;
                            },
                            label: function (context) {
                                return `Altitude: ${context.parsed.y.toFixed(1)} m`;
                            },
                        },
                    },
                    zoom: {
                        pan: {
                            enabled: true,
                            mode: "x",
                            modifierKey: null,
                        },
                        zoom: {
                            wheel: {
                                enabled: true,
                                speed: 0.1,
                            },
                            pinch: {
                                enabled: true,
                            },
                            drag: {
                                enabled: true,
                                backgroundColor: themeConfig.colors.primaryAlpha,
                                borderColor: themeConfig.colors.primary + "CC", // Primary with more opacity
                                borderWidth: 2,
                                modifierKey: "shift",
                            },
                            mode: "x",
                        },
                        limits: {
                            x: {
                                min: "original",
                                max: "original",
                            },
                            y: {
                                min: "original",
                                max: "original",
                            },
                        },
                    },
                    backgroundColorPlugin: {
                        backgroundColor: themeConfig.colors.chartBackground,
                    },
                },
                scales: {
                    x: {
                        type: "linear",
                        display: true,
                        grid: {
                            display: options.showGrid,
                            color: themeConfig.colors.chartGrid,
                        },
                        title: {
                            display: true,
                            text: `Time (${getUnitSymbol("time", "time")})`,
                            color: themeConfig.colors.textPrimary,
                        },
                        ticks: {
                            color: themeConfig.colors.textPrimary,
                            callback: function (value) {
                                return formatTime(value, true);
                            },
                        },
                    },
                    y: {
                        type: "linear",
                        display: true,
                        grid: {
                            display: options.showGrid,
                            color: themeConfig.colors.chartGrid,
                        },
                        title: {
                            display: true,
                            text: "Altitude (m)",
                            color: themeConfig.colors.textPrimary,
                        },
                        ticks: { color: themeConfig.colors.textPrimary },
                    },
                },
            },
            plugins: [zoomResetPlugin, "backgroundColorPlugin"],
        };

        const chart = new window.Chart(canvas, config);
        if (chart) {
            window._chartjsInstances.push(chart);
            console.log("[ChartJS] Altitude Profile chart created successfully");
        }
    } catch (error) {
        console.error("[ChartJS] Error rendering altitude profile chart:", error);
    }
}
