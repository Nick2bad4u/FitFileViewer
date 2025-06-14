import { detectCurrentTheme } from "./chartThemeUtils.js";
import { createChartCanvas } from "./createChartCanvas.js";
import { formatTime } from "./formatTime.js";
import { getZoneTypeFromField, getChartZoneColors } from "./zoneColorUtils.js";

// Helper function to render individual zone chart

export function renderZoneChart(container, title, zoneData, chartId, options) {
    console.log(`[ChartJS] renderZoneChart called for ${title} with data:`, zoneData);

    // Get theme using robust detection
    const currentTheme = detectCurrentTheme();
    const canvas = createChartCanvas(chartId, chartId);

    // Apply theme-aware canvas styling (background handled by plugin)
    canvas.style.borderRadius = "12px";
    canvas.style.boxShadow = "0 2px 16px 0 rgba(0,0,0,0.18)";

    container.appendChild(canvas);

    // Determine zone type and get user-selected colors
    let colors = ["#3b82f665", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#EC4899", "#06B6D4", "#84CC16", "#F97316", "#6366F1"];

    // Check if zone data has color properties (from applyZoneColors), otherwise use saved colors
    if (zoneData.length > 0 && zoneData[0].color) {
        // Use colors from the zone data objects
        colors = zoneData.map((zone) => zone.color);
    } else {
        // Fall back to getting saved colors by zone type
        const zoneType = getZoneTypeFromField(chartId);
        if (zoneType) {
            colors = getChartZoneColors(zoneType, zoneData.length);
        }
    }

    const config = {
        type: "doughnut",
        data: {
            labels: zoneData.map((zone) => zone.label || `Zone ${zone.zone || 1}`),
            datasets: [
                {
                    data: zoneData.map((zone) => zone.time || 0),
                    backgroundColor: colors.slice(0, zoneData.length),
                    borderColor: "#000",
                    borderWidth: 3,
                    borderAlign: "center",
                    borderRadius: 4,
                    borderJoinStyle: "round",
                    hoverBackgroundColor: colors.slice(0, zoneData.length).map((color) => {
                        // Lighten the color on hover
                        const r = parseInt(color.slice(1, 3), 16);
                        const g = parseInt(color.slice(3, 5), 16);
                        const b = parseInt(color.slice(5, 7), 16);
                        return `rgba(${Math.min(255, r + 30)}, ${Math.min(255, g + 30)}, ${Math.min(255, b + 30)}, 0.9)`;
                    }),
                    hoverBorderColor: "#ffffff",
                    hoverBorderWidth: 4,
                    hoverOffset: 8,
                    offset: 2,
                    spacing: 2,
                    rotation: -90, // Start from top
                    circumference: 360, // Full circle
                    weight: 1,
                },
            ],
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            // Creates a nice donut hole
            radius: "90%",
            plugins: {
                legend: {
                    display: options.showLegend,
                    position: "right",
                    labels: {
                        display: true,
                        font: {
                            size: 14,
                            weight: "600",
                        },
                        padding: 20,
                        usePointStyle: true,
                        pointStyle: "circle",
                        generateLabels: function (chart) {
                            const data = chart.data;
                            if (data.labels.length && data.datasets.length) {
                                const dataset = data.datasets[0];
                                const total = dataset.data.reduce((a, b) => a + b, 0);

                                return data.labels.map((label, i) => {
                                    const value = dataset.data[i];
                                    const percentage = ((value / total) * 100).toFixed(1);
                                    const meta = chart.getDatasetMeta(0);
                                    const hidden = meta.data[i] && meta.data[i].hidden;
                                    return {
                                        text: `${label}: ${formatTime(value, true)} (${percentage}%)`,
                                        fillStyle: hidden ? "rgba(128, 128, 128, 0.5)" : dataset.backgroundColor[i],
                                        strokeStyle: hidden ? "rgba(128, 128, 128, 0.8)" : dataset.borderColor,
                                        lineWidth: dataset.borderWidth,
                                        index: i,
                                        fontColor: hidden ? "rgba(128, 128, 128, 0.8)" : dataset.backgroundColor[i],
                                        hidden: hidden,
                                    };
                                });
                            }
                            return [];
                        },
                    },
                    onClick: function (e, legendItem, legend) {
                        const index = legendItem.index;
                        const chart = legend.chart;
                        const meta = chart.getDatasetMeta(0);

                        // Toggle visibility
                        meta.data[index].hidden = !meta.data[index].hidden;
                        chart.update();
                    },
                },
                title: {
                    display: options.showTitle,
                    text: title,
                    font: { size: 18, weight: "bold" },
                    position: "top",
                    align: "center",
                    color: currentTheme === "dark" ? "#fff" : "#000",
                    padding: {
                        top: 10,
                        bottom: 20,
                    },
                },
                tooltip: {
                    backgroundColor: currentTheme === "dark" ? "#222" : "#fff",
                    titleColor: currentTheme === "dark" ? "#fff" : "#000",
                    bodyColor: currentTheme === "dark" ? "#fff" : "#000",
                    borderColor: currentTheme === "dark" ? "#555" : "#ddd",
                    borderWidth: 1,
                    cornerRadius: 8,
                    displayColors: true,
                    usePointStyle: true,
                    callbacks: {
                        title: function (context) {
                            return context[0].label;
                        },
                        label: function (context) {
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = total > 0 ? ((context.parsed / total) * 100).toFixed(1) : "0.0";
                            const timeFormatted = formatTime(context.parsed, true);
                            return [`Time: ${timeFormatted}`, `Percentage: ${percentage}%`];
                        },
                        labelColor: function (context) {
                            return {
                                borderColor: context.dataset.borderColor,
                                backgroundColor: context.dataset.backgroundColor[context.dataIndex],
                                borderWidth: 2,
                                borderRadius: 2,
                            };
                        },
                    },
                },
                backgroundColorPlugin: {
                    backgroundColor: currentTheme === "dark" ? "#181c24" : "#ffffff",
                },
            },
            animation: {
                animateRotate: true,
                animateScale: true,
                duration: 2000,
                easing: "easeOutQuart",
            },
            interaction: {
                intersect: false,
                mode: "point",
            },
            elements: {
                arc: {
                    borderWidth: 3,
                    borderColor: "#ffffff",
                    hoverBorderWidth: 4,
                },
            },
        },
        plugins: ["backgroundColorPlugin"],
    };

    console.log(`[ChartJS] Creating zone chart with config:`, config);
    const chart = new window.Chart(canvas, config);
    if (chart) {
        console.log(`[ChartJS] Zone chart created successfully for ${title}`);
        window._chartjsInstances.push(chart);
    } else {
        console.error(`[ChartJS] Failed to create zone chart for ${title}`);
    }
}
