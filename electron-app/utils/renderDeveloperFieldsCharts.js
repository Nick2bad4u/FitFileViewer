import { fieldLabels } from "./chartFields.js";
import { createChartCanvas } from "./createChartCanvas.js";
import { createEnhancedChart } from "./createEnhancedChart.js";

// Developer fields charts renderer

export function renderDeveloperFieldsCharts(container, data, labels, options) {
    try {
        console.log("[ChartJS] renderDeveloperFieldsCharts called");

        if (!data || data.length === 0) {
            console.log("[ChartJS] No data available for developer fields charts");
            return;
        } // Extract developer fields from the data
        const fieldMaps = new Map();

        data.forEach((row, index) => {
            if (row.developerFields && typeof row.developerFields === "string") {
                try {
                    const devFields = JSON.parse(row.developerFields);
                    Object.keys(devFields).forEach((fieldId) => {
                        const value = devFields[fieldId];

                        // Handle both array and scalar values
                        if (Array.isArray(value)) {
                            value.forEach((val, arrayIndex) => {
                                const fieldKey = `dev_${fieldId}_${arrayIndex}`;
                                if (!fieldMaps.has(fieldKey)) {
                                    fieldMaps.set(fieldKey, []);
                                }
                                fieldMaps.get(fieldKey).push({ x: labels[index], y: val });
                            });
                        } else if (typeof value === "number" && !isNaN(value)) {
                            const fieldKey = `dev_${fieldId}`;
                            if (!fieldMaps.has(fieldKey)) {
                                fieldMaps.set(fieldKey, []);
                            }
                            fieldMaps.get(fieldKey).push({ x: labels[index], y: value });
                        }
                    });
                } catch {
                    // Skip malformed JSON
                }
            }
        });

        console.log(`[ChartJS] Found ${fieldMaps.size} developer fields to chart`);

        // Create charts for each developer field that has enough data
        fieldMaps.forEach((chartData, fieldKey) => {
            if (chartData.length < 2) return; // Skip fields with insufficient data

            // Check if this field is hidden
            const visibility = localStorage.getItem(`chartjs_field_${fieldKey}`);
            if (visibility === "hidden") {
                return;
            }

            // Apply data point limiting
            if (options.maxPoints !== "all" && chartData.length > options.maxPoints) {
                const step = Math.ceil(chartData.length / options.maxPoints);
                chartData = chartData.filter((_, i) => i % step === 0);
            }

            const canvas = createChartCanvas(fieldKey, fieldKey);
            container.appendChild(canvas);

            // Create enhanced chart for developer field
            const chart = createEnhancedChart(canvas, {
                field: fieldKey,
                chartData,
                chartType: options.chartType,
                interpolation: options.interpolation,
                animationStyle: options.animationStyle,
                showGrid: options.showGrid,
                showLegend: options.showLegend,
                showTitle: options.showTitle,
                showPoints: options.showPoints,
                showFill: options.showFill,
                smoothing: options.smoothing,
                customColors: options.customColors,
                zoomPluginConfig: options.zoomPluginConfig,
                fieldLabels: {
                    ...fieldLabels,
                    [fieldKey]: `Developer Field ${fieldKey.replace("dev_", "")}`,
                },
                theme: options.theme,
            });

            if (chart) {
                window._chartjsInstances.push(chart);
                console.log(`[ChartJS] Created developer field chart for ${fieldKey}`);
            }
        });
    } catch (error) {
        console.error("[ChartJS] Error rendering developer fields charts:", error);
    }
}
