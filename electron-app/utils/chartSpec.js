// chartSpec.js
// Vega-Lite chart spec for FIT file viewer

/**
 * Generates a Vega-Lite chart specification for visualizing folded time series data.
 *
 * The chart supports faceting by the 'key' field, interactive interval selection on the x-axis,
 * and overlays multiple layers including lines, rules, and summary text annotations.
 * The configuration is styled for a dark or light theme and supports independent x and y scales per facet.
 *
 * @param {Array<Object>} foldedData - The input data array, where each object should contain at least
 *   'timestamp', 'value', and 'key' fields. 'timestamp' should be a date/time value, 'value' a number,
 *   and 'key' a string or category for faceting.
 * @param {string} theme - 'dark' or 'light' (default: 'dark')
 * @returns {Object} A Vega-Lite v5 chart specification object configured for the provided data.
 */
export function getChartSpec(foldedData, theme = "dark") {
    const isDark = theme === "dark";
    const colors = isDark
        ? {
              background: "#181c24",
              text: "#e0e0e0",
              fill: "#23263a",
              axis: "#b0b0b0",
              axisDomain: "#888",
              legend: "#e0e0e0",
              line: "#00bcd4", // Material Cyan
              point: "#ffeb3b", // Material Yellow
              firebrick: "#ff5252", // Material Red Accent
              shadow: "rgba(0,0,0,0.3)",
          }
        : {
              background: "#f7f9fa",
              text: "#23263a",
              fill: "#f0f0f0",
              axis: "#23263a",
              axisDomain: "#888",
              legend: "#23263a",
              line: "#1976d2", // Material Blue
              point: "#ff9800", // Material Orange
              firebrick: "#e53935", // Material Red
              shadow: "rgba(0,0,0,0.08)",
          };
    return {
        config: {
            background: colors.background,
            padding: 24,
            font: "Inter, Roboto, Segoe UI, Arial, sans-serif",
            view: {
                stroke: null,
                cornerRadius: 18,
                fill: colors.fill,
                shadow: { color: colors.shadow, blur: 16, offsetX: 0, offsetY: 4 },
            },
            axis: {
                domain: true,
                domainColor: colors.axisDomain,
                domainWidth: 1.5,
                grid: true,
                gridColor: isDark ? "#333" : "#e0e0e0",
                gridDash: [2, 4],
                labelColor: colors.axis,
                labelFontSize: 15,
                labelFontWeight: "400",
                tickColor: colors.axisDomain,
                tickSize: 7,
                titleFontSize: 18,
                titleFontWeight: "600",
                titleColor: colors.axis,
            },
            legend: {
                cornerRadius: 12,
                fillColor: isDark ? "#23263a" : "#f7f9fa",
                strokeColor: isDark ? "#333" : "#e0e0e0",
                strokeWidth: 1,
                padding: 12,
                labelColor: colors.legend,
                labelFontSize: 15,
                titleColor: colors.legend,
                titleFontSize: 16,
                symbolType: "circle",
                symbolSize: 120,
            },
            title: {
                anchor: "middle",
                fontWeight: "700",
                fontSize: 32,
                // Ensure title uses theme color
                offset: 18,
                stroke: isDark ? "#23263a" : "#fff", // Outline color for title
                strokeWidth: 4, // Outline thickness for title
                strokeOpacity: 0.2, // Outline opacity for title
            },
            range: {
                category: ["#00bcd4", "#ffeb3b", "#ff5252", "#43a047", "#8e24aa", "#fbc02d", "#1976d2"],
            },
            mark: {
                opacity: 0.9,
                strokeWidth: 2,
                cornerRadius: 8,
            },
            line: {
                interpolate: "monotone",
            },
            point: {
                filled: true,
                size: 100,
                stroke: colors.line,
                strokeWidth: 2,
            },
        },
        data: { values: foldedData },
        facet: {
            row: {
                field: "key",
                header: {
                    labelOrient: "top",
                    anchor: "start",
                    fontSize: 20,
                    fontWeight: "bold",
                    color: colors.text,
                    labelFontSize: 28,
                    labelColor: colors.text,
                    stroke: isDark ? "#23263a" : "#fff", // Outline color for facet label
                    strokeWidth: 3, // Outline thickness for facet label
                    strokeOpacity: 0.2, // Outline opacity for facet label
                },
                type: "nominal",
            },
        },
        spec: {
            layer: [
                {
                    mark: {
                        type: "line",
                        color: colors.line,
                        interpolate: "monotone",
                        strokeWidth: 3,
                        strokeCap: "round",
                    },
                    encoding: {
                        opacity: { value: 0.18 },
                        x: {
                            field: "timestamp",
                            title: "Elapsed time (seconds)",
                            type: "temporal",
                        },
                        y: {
                            field: "value",
                            scale: { zero: false },
                            title: "",
                            type: "quantitative",
                        },
                        tooltip: [
                            {
                                field: "timestamp",
                                type: "temporal",
                                title: "Time",
                                format: "%Y-%m-%d %H:%M:%S",
                                formatType: "time",
                                color: colors.text,
                            },
                            {
                                field: "value",
                                type: "quantitative",
                                title: "Value",
                                format: ".3f",
                                color: colors.text,
                            },
                            {
                                field: "key",
                                type: "nominal",
                                title: "Key",
                                color: colors.text,
                            },
                        ],
                    },
                    name: "view_11",
                },
                {
                    mark: {
                        type: "line",
                        color: colors.line,
                        interpolate: "monotone",
                        strokeWidth: 4,
                        strokeCap: "round",
                    },
                    encoding: {
                        opacity: { value: 1 },
                        x: { field: "timestamp", type: "temporal" },
                        y: { field: "value", scale: { zero: false }, type: "quantitative" },
                        tooltip: [
                            {
                                field: "timestamp",
                                type: "temporal",
                                title: "Time",
                                format: "%Y-%m-%d %H:%M:%S",
                                formatType: "time",
                                color: colors.text,
                            },
                            {
                                field: "value",
                                type: "quantitative",
                                title: "Value",
                                format: ".3f",
                                color: colors.text,
                            },
                            {
                                field: "key",
                                type: "nominal",
                                title: "Key",
                                color: colors.text,
                            },
                        ],
                    },
                    transform: [{ filter: { param: "param_11" } }],
                },
                {
                    mark: {
                        type: "point",
                        color: colors.point,
                        size: 100,
                        filled: true,
                        opacity: 1,
                        stroke: colors.line,
                        strokeWidth: 2,
                    },
                    encoding: {
                        x: { aggregate: "min", field: "timestamp", type: "temporal" },
                        y: { aggregate: "min", field: "value", type: "quantitative" },
                        tooltip: [
                            {
                                field: "timestamp",
                                aggregate: "min",
                                type: "temporal",
                                title: "First Time",
                            },
                            {
                                field: "value",
                                aggregate: "min",
                                type: "quantitative",
                                title: "First Value",
                                format: ".3f",
                            },
                            { field: "key", type: "nominal", title: "Key" },
                        ],
                    },
                    transform: [
                        { filter: "isValid(datum.value) && isValid(datum.timestamp)" },
                        { filter: "length(data('param_11_store')) > 0" },
                        { filter: { param: "param_11" } },
                    ],
                },
                {
                    mark: {
                        type: "point",
                        color: colors.point,
                        size: 100,
                        filled: true,
                        opacity: 1,
                        stroke: colors.line,
                        strokeWidth: 2,
                    },
                    encoding: {
                        x: { aggregate: "max", field: "timestamp", type: "temporal" },
                        y: { aggregate: "max", field: "value", type: "quantitative" },
                        tooltip: [
                            {
                                field: "timestamp",
                                aggregate: "max",
                                type: "temporal",
                                title: "Last Time",
                            },
                            {
                                field: "value",
                                aggregate: "max",
                                type: "quantitative",
                                title: "Last Value",
                                format: ".3f",
                            },
                            { field: "key", type: "nominal", title: "Key" },
                        ],
                    },
                    transform: [
                        { filter: "isValid(datum.value) && isValid(datum.timestamp)" },
                        { filter: "length(data('param_11_store')) > 0" },
                        { filter: { param: "param_11" } },
                    ],
                },
                {
                    mark: {
                        type: "rule",
                        color: colors.firebrick,
                        strokeDash: [5, 5],
                    },
                    encoding: {
                        x: { aggregate: "min", field: "timestamp", type: "temporal" },
                        x2: { aggregate: "max", field: "timestamp" },
                        y: {
                            aggregate: "min",
                            field: "value",
                            scale: { zero: false },
                            type: "quantitative",
                        },
                        y2: {
                            aggregate: "max",
                            field: "value",
                            scale: { zero: false },
                            type: "quantitative",
                        },
                        tooltip: [
                            {
                                field: "timestamp",
                                aggregate: "min",
                                type: "temporal",
                                title: "First Time",
                            },
                            {
                                field: "value",
                                aggregate: "min",
                                type: "quantitative",
                                title: "First Value",
                                format: ".3f",
                            },
                            { field: "key", type: "nominal", title: "Key" },
                        ],
                    },
                    transform: [
                        { filter: "isValid(datum.value) && isValid(datum.timestamp)" },
                        { filter: "length(data('param_11_store')) > 0" },
                        { filter: { param: "param_11" } },
                    ],
                },
                {
                    // Periodic points for visual interest and easier mouseover
                    mark: {
                        type: "point",
                        color: colors.point,
                        size: 180,
                        filled: true,
                        opacity: 0.85,
                        stroke: colors.line,
                        strokeWidth: 2.5,
                    },
                    encoding: {
                        x: { field: "timestamp", type: "temporal" },
                        y: { field: "value", type: "quantitative", scale: { zero: false } },
                        tooltip: [
                            {
                                field: "timestamp",
                                type: "temporal",
                                title: "Time",
                                format: "%Y-%m-%d %H:%M:%S",
                                formatType: "time",
                                color: colors.text,
                            },
                            { field: "value", type: "quantitative", title: "Value", format: ".3f", color: colors.text },
                            { field: "key", type: "nominal", title: "Key", color: colors.text },
                        ],
                    },
                    transform: [
                        // Only process valid data for window transform
                        { filter: "isValid(datum.value) && isValid(datum.timestamp)" },
                        { window: [{ op: "row_number", as: "rownum" }], groupby: ["key"], frame: [null, null] },
                        { filter: "datum.rownum % 150 === 0" },
                    ],
                },
                // Two-layer text shadow effect for summary value text
                {
                    mark: {
                        type: "text",
                        color: isDark ? "#000" : "#fff", // shadow color
                        dx: 0,
                        dy: -50,
                        size: 20,
                        font: "sans-serif",
                        fontWeight: "bold",
                        fontSize: 32,
                        opacity: 0.55,
                        stroke: isDark ? "#000" : "#fff",
                        strokeWidth: 6, // Bolder outline
                        strokeOpacity: 0.7,
                    },
                    encoding: {
                        text: {
                            aggregate: "mean",
                            field: "value",
                            format: ".3f",
                            type: "quantitative",
                        },
                        x: {
                            aggregate: "mean",
                            field: "timestamp",
                            type: "temporal",
                        },
                        y: {
                            aggregate: "min",
                            field: "value",
                            scale: {
                                zero: false,
                            },
                            type: "quantitative",
                        },
                    },
                    transform: [
                        { filter: "isValid(datum.value) && isValid(datum.timestamp)" },
                        { filter: "length(data('param_11_store')) > 0" },
                        { filter: { param: "param_11" } },
                    ],
                },
                {
                    mark: {
                        type: "text",
                        color: isDark ? "#fff" : "#23263a",
                        dx: 0,
                        dy: -50,
                        size: 20,
                        font: "sans-serif",
                        fontWeight: "bold",
                        fontSize: 32,
                        opacity: 1,
                    },
                    encoding: {
                        text: {
                            aggregate: "mean",
                            field: "value",
                            format: ".3f",
                            type: "quantitative",
                        },
                        x: {
                            aggregate: "mean",
                            field: "timestamp",
                            type: "temporal",
                        },
                        y: {
                            aggregate: "min",
                            field: "value",
                            scale: {
                                zero: false,
                            },
                            type: "quantitative",
                        },
                    },
                    transform: [
                        { filter: "isValid(datum.value) && isValid(datum.timestamp)" },
                        { filter: "length(data('param_11_store')) > 0" },
                        { filter: { param: "param_11" } },
                    ],
                },
                // Two-layer text shadow effect for count text
                {
                    mark: {
                        type: "text",
                        color: isDark ? "#000" : "#fff", // shadow color
                        dx: 0,
                        dy: -10,
                        size: 14,
                        stroke: isDark ? "#23263a" : "#fff",
                        strokeWidth: 6, // Bolder outline
                        strokeOpacity: 0.7,
                        opacity: 0.55,
                    },
                    encoding: {
                        text: {
                            aggregate: "count",
                            field: "value",
                            format: ".3f",
                            type: "quantitative",
                        },
                        x: {
                            aggregate: "mean",
                            field: "timestamp",
                            type: "temporal",
                        },
                        y: {
                            aggregate: "min",
                            field: "value",
                            scale: {
                                zero: false,
                            },
                            type: "quantitative",
                        },
                    },
                    transform: [
                        { filter: "isValid(datum.value) && isValid(datum.timestamp)" },
                        { filter: "length(data('param_11_store')) > 0" },
                        { filter: { param: "param_11" } },
                    ],
                },
                {
                    mark: {
                        type: "text",
                        color: colors.firebrick,
                        dx: 0,
                        dy: -10,
                        size: 14,
                        stroke: isDark ? "#23263a" : "#fff",
                        strokeWidth: 3,
                        strokeOpacity: 0.2,
                        opacity: 1,
                    },
                    encoding: {
                        text: {
                            aggregate: "count",
                            field: "value",
                            format: ".3f",
                            type: "quantitative",
                        },
                        x: {
                            aggregate: "mean",
                            field: "timestamp",
                            type: "temporal",
                        },
                        y: {
                            aggregate: "min",
                            field: "value",
                            scale: {
                                zero: false,
                            },
                            type: "quantitative",
                        },
                    },
                    transform: [
                        { filter: "isValid(datum.value) && isValid(datum.timestamp)" },
                        { filter: "length(data('param_11_store')) > 0" },
                        { filter: { param: "param_11" } },
                    ],
                },
                // Two-layer text shadow effect for min timestamp text
                {
                    mark: {
                        type: "text",
                        color: isDark ? "#000" : "#fff", // shadow color
                        dx: -20,
                        dy: -10,
                        size: 14,
                        stroke: isDark ? "#23263a" : "#fff",
                        strokeWidth: 6, // Bolder outline
                        strokeOpacity: 0.7,
                        opacity: 0.55,
                    },
                    encoding: {
                        text: {
                            aggregate: "min",
                            field: "timestamp",
                            formatType: "time",
                            timeUnit: "hoursminutesseconds",
                            type: "temporal",
                        },
                        x: {
                            aggregate: "min",
                            field: "timestamp",
                            type: "temporal",
                        },
                        y: {
                            aggregate: "min",
                            field: "value",
                            scale: {
                                zero: false,
                            },
                            type: "quantitative",
                        },
                    },
                    transform: [
                        { filter: "isValid(datum.value) && isValid(datum.timestamp)" },
                        { filter: "length(data('param_11_store')) > 0" },
                        { filter: { param: "param_11" } },
                    ],
                },
                {
                    mark: {
                        type: "text",
                        color: colors.firebrick,
                        dx: -20,
                        dy: -10,
                        size: 14,
                        stroke: isDark ? "#23263a" : "#fff",
                        strokeWidth: 3,
                        strokeOpacity: 0.2,
                        opacity: 1,
                    },
                    encoding: {
                        text: {
                            aggregate: "min",
                            field: "timestamp",
                            formatType: "time",
                            timeUnit: "hoursminutesseconds",
                            type: "temporal",
                        },
                        x: {
                            aggregate: "min",
                            field: "timestamp",
                            type: "temporal",
                        },
                        y: {
                            aggregate: "min",
                            field: "value",
                            scale: {
                                zero: false,
                            },
                            type: "quantitative",
                        },
                    },
                    transform: [
                        { filter: "isValid(datum.value) && isValid(datum.timestamp)" },
                        { filter: "length(data('param_11_store')) > 0" },
                        { filter: { param: "param_11" } },
                    ],
                },
                // Two-layer text shadow effect for max timestamp text
                {
                    mark: {
                        type: "text",
                        color: isDark ? "#000" : "#fff", // shadow color
                        dx: 20,
                        dy: -10,
                        size: 14,
                        stroke: isDark ? "#23263a" : "#fff",
                        strokeWidth: 6, // Bolder outline
                        strokeOpacity: 0.7,
                        opacity: 0.55,
                    },
                    encoding: {
                        text: {
                            aggregate: "max",
                            field: "timestamp",
                            formatType: "time",
                            timeUnit: "hoursminutesseconds",
                            type: "temporal",
                        },
                        x: {
                            aggregate: "max",
                            field: "timestamp",
                            type: "temporal",
                        },
                        y: {
                            aggregate: "min",
                            field: "value",
                            scale: {
                                zero: false,
                            },
                            type: "quantitative",
                        },
                    },
                    transform: [
                        { filter: "isValid(datum.value) && isValid(datum.timestamp)" },
                        { filter: "length(data('param_11_store')) > 0" },
                        { filter: { param: "param_11" } },
                    ],
                },
                {
                    mark: {
                        type: "text",
                        color: colors.firebrick,
                        dx: 20,
                        dy: -10,
                        size: 14,
                        stroke: isDark ? "#23263a" : "#fff",
                        strokeWidth: 3,
                        strokeOpacity: 0.2,
                        opacity: 1,
                    },
                    encoding: {
                        text: {
                            aggregate: "max",
                            field: "timestamp",
                            formatType: "time",
                            timeUnit: "hoursminutesseconds",
                            type: "temporal",
                        },
                        x: {
                            aggregate: "max",
                            field: "timestamp",
                            type: "temporal",
                        },
                        y: {
                            aggregate: "min",
                            field: "value",
                            scale: {
                                zero: false,
                            },
                            type: "quantitative",
                        },
                    },
                    transform: [
                        { filter: "isValid(datum.value) && isValid(datum.timestamp)" },
                        { filter: "length(data('param_11_store')) > 0" },
                        { filter: { param: "param_11" } },
                    ],
                },
            ],
            height: 220,
            width: "container",
        },
        params: [
            {
                name: "param_11",
                select: {
                    type: "interval",
                    encodings: ["x"],
                    // Enhanced brush style for better visibility
                    translate: "[mousedown[!event.shiftKey], window:mouseup] > window:mousemove!",
                    zoom: "wheel!",
                    mark: {
                        fill: isDark ? "#00bcd4" : "#1976d2",
                        fillOpacity: 0.12,
                        stroke: isDark ? "#ffeb3b" : "#ff9800",
                        strokeWidth: 3,
                        strokeDash: [4, 4],
                        handle: {
                            symbol: "circle",
                            size: 300,
                            fill: isDark ? "#ffeb3b" : "#ff9800",
                            stroke: isDark ? "#00bcd4" : "#1976d2",
                            strokeWidth: 2,
                        },
                    },
                },
                views: ["view_11"],
            },
        ],
        resolve: { scale: { x: "independent", y: "independent" } },
        spacing: 32,
        $schema: "https://vega.github.io/schema/vega-lite/v5.20.1.json",
    };
}
