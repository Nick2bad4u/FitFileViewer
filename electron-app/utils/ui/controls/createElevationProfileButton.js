import { getThemeColors } from "../../charts/theming/getThemeColors.js";
import { sanitizeCssColorToken } from "../../dom/index.js";
const SVG_NS = "http://www.w3.org/2000/svg";
function createElevationIcon(color) {
    const icon = document.createElementNS(SVG_NS, "svg");
    icon.classList.add("icon");
    icon.setAttribute("viewBox", "0 0 20 20");
    icon.setAttribute("width", "18");
    icon.setAttribute("height", "18");
    const polyline = document.createElementNS(SVG_NS, "polyline");
    polyline.setAttribute("points", "2,16 6,10 10,14 14,6 18,12");
    polyline.setAttribute("fill", "none");
    polyline.setAttribute("stroke", color);
    polyline.setAttribute("stroke-width", "2");
    icon.append(polyline);
    const points = [
        ["2", "16"],
        ["6", "10"],
        ["10", "14"],
        ["14", "6"],
        ["18", "12"],
    ];
    for (const [cx, cy] of points) {
        const circle = document.createElementNS(SVG_NS, "circle");
        circle.setAttribute("cx", cx);
        circle.setAttribute("cy", cy);
        circle.setAttribute("r", "1.5");
        circle.setAttribute("fill", color);
        icon.append(circle);
    }
    return icon;
}
/**
 * Creates the map toolbar button that opens an elevation profile popup.
 */
export function createElevationProfileButton() {
    const btn = document.createElement("button");
    btn.className = "map-action-btn";
    const themeColorsInit = getThemeColors(),
        p = sanitizeCssColorToken(themeColorsInit["primary"], "#3b82f6");
    const label = document.createElement("span");
    label.textContent = "Elevation";
    btn.append(createElevationIcon(p), label);
    btn.title = "Show Elevation Profile";
    const buttonListener = new AbortController();
    btn.addEventListener(
        "click",
        () => {
            const fitFiles = getElevationFitFiles();
            const chartWin = window.open(
                    "",
                    "Elevation Profile",
                    "width=900,height=600"
                ),
                isDark = document.body.classList.contains("theme-dark"),
                themeColors = getThemeColors();
            if (!chartWin) {
                return;
            }
            const fitFilesModel = fitFiles.map(createElevationProfileFileModel);
            // Sanitize the theme colors used in template-string CSS.
            const safeThemeColors = {
                background: sanitizeCssColorToken(
                    themeColors["background"],
                    isDark ? "#0b1220" : "#ffffff"
                ),
                border: sanitizeCssColorToken(
                    themeColors["border"],
                    isDark ? "#334155" : "#e5e7eb"
                ),
                borderLight: sanitizeCssColorToken(
                    themeColors["borderLight"],
                    isDark ? "#475569" : "#f1f5f9"
                ),
                primary: sanitizeCssColorToken(
                    themeColors["primary"],
                    "#3b82f6"
                ),
                primaryShadow: sanitizeCssColorToken(
                    themeColors["primaryShadow"],
                    isDark ? "rgba(59,130,246,0.35)" : "rgba(59,130,246,0.25)"
                ),
                shadowLight: sanitizeCssColorToken(
                    themeColors["shadowLight"],
                    isDark ? "rgba(0,0,0,0.35)" : "rgba(15,23,42,0.08)"
                ),
                shadowMedium: sanitizeCssColorToken(
                    themeColors["shadowMedium"],
                    isDark ? "rgba(0,0,0,0.45)" : "rgba(15,23,42,0.12)"
                ),
                surface: sanitizeCssColorToken(
                    themeColors["surface"],
                    isDark ? "#111827" : "#ffffff"
                ),
                text: sanitizeCssColorToken(
                    themeColors["text"],
                    isDark ? "#e5e7eb" : "#0f172a"
                ),
                textSecondary: sanitizeCssColorToken(
                    themeColors["textSecondary"],
                    isDark ? "#cbd5e1" : "#475569"
                ),
            };
            buildElevationProfilePopup(chartWin, {
                fitFilesModel,
                isDark,
                safeThemeColors,
            });
        },
        { signal: buttonListener.signal }
    );
    return btn;
}
function createElevationProfileFileModel(file, idx) {
    return {
        altitudes: getElevationPoints(file),
        color: getOverlayColor(idx),
        filePath: getDisplayFilePath(file, idx),
    };
}
function getDisplayFilePath(file, idx) {
    return typeof file.filePath === "string" && file.filePath.length > 0
        ? file.filePath
        : `File ${idx + 1}`;
}
function getElevationFitFiles() {
    const { globalData, loadedFitFiles } = getElevationGlobal();
    if (Array.isArray(loadedFitFiles) && loadedFitFiles.length > 0) {
        return loadedFitFiles.filter(isElevationFitFile);
    }
    if (
        isElevationFitData(globalData) &&
        Array.isArray(globalData.recordMesgs)
    ) {
        return [
            {
                data: globalData,
                filePath: globalData.cachedFilePath,
            },
        ];
    }
    return [];
}
function getElevationGlobal() {
    return globalThis;
}
function getElevationPoints(file) {
    const records = file.data?.recordMesgs;
    if (!Array.isArray(records)) {
        return [];
    }
    return records.reduce((points, record, index) => {
        if (isAltitudeRecord(record)) {
            points.push({ x: index, y: record.altitude });
        }
        return points;
    }, []);
}
function getOverlayColor(idx) {
    const { chartOverlayColorPalette } = getElevationGlobal();
    if (
        Array.isArray(chartOverlayColorPalette) &&
        chartOverlayColorPalette.length > 0
    ) {
        return sanitizeCssColorToken(
            chartOverlayColorPalette[idx % chartOverlayColorPalette.length],
            "#1976d2"
        );
    }
    return "#1976d2";
}
function isAltitudeRecord(value) {
    if (!value || typeof value !== "object") {
        return false;
    }
    const altitude = getAltitudeRecordProperty(value, "altitude");
    return (
        getAltitudeRecordProperty(value, "positionLat") != null &&
        getAltitudeRecordProperty(value, "positionLong") != null &&
        typeof altitude === "number" &&
        Number.isFinite(altitude)
    );
}
function getAltitudeRecordProperty(value, key) {
    return key in value ? value[key] : undefined;
}
function isElevationFitData(value) {
    return value !== null && typeof value === "object";
}
function isElevationFitFile(value) {
    return value !== null && typeof value === "object";
}
function isElevationChartConstructor(value) {
    return typeof value === "function";
}
function buildElevationProfilePopup(
    chartWin,
    { fitFilesModel, isDark, safeThemeColors }
) {
    const chartDoc = chartWin.document;
    chartDoc.title = "Elevation Profiles";
    chartDoc.head.replaceChildren();
    chartDoc.body.replaceChildren();
    chartDoc.body.className = isDark ? "theme-dark" : "theme-light";
    const viewport = chartDoc.createElement("meta");
    viewport.name = "viewport";
    viewport.content = "width=device-width, initial-scale=1";
    const chartScript = chartDoc.createElement("script");
    chartScript.src = "./vendor/chart.umd.js";
    const stylesheet = chartDoc.createElement("link");
    stylesheet.rel = "stylesheet";
    stylesheet.href = "./elevProfile.css";
    const style = chartDoc.createElement("style");
    style.textContent = createElevationPopupStyles(safeThemeColors, isDark);
    chartDoc.head.append(viewport, stylesheet, style);
    const header = chartDoc.createElement("header");
    const heading = chartDoc.createElement("h2");
    heading.style.cssText =
        "margin:0;font-size:1.5em;font-weight:700;letter-spacing:0.01em;";
    heading.textContent = "Elevation Profiles";
    const fileCount = chartDoc.createElement("span");
    fileCount.style.cssText = "font-size:1.1em;opacity:0.7;";
    fileCount.textContent = `${fitFilesModel.length} file${fitFilesModel.length > 1 ? "s" : ""}`;
    header.append(heading, fileCount);
    const container = chartDoc.createElement("div");
    container.id = "elevChartsContainer";
    chartDoc.body.append(header, container);
    const scriptLoadListener = new AbortController();
    chartScript.addEventListener(
        "load",
        () => {
            renderElevationCharts(chartWin, container, fitFilesModel, isDark);
            scriptLoadListener.abort();
        },
        { signal: scriptLoadListener.signal }
    );
    chartDoc.head.append(chartScript);
}
function createElevationPopupStyles(colors, isDark) {
    return `
        body {
            margin: 0;
            padding: 0;
            font-family: 'Segoe UI', 'Roboto', 'Arial', sans-serif;
            background: ${colors.background};
            color: ${colors.text};
        }
        header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 24px 32px 0 32px;
            background: ${colors.surface};
            box-shadow: 0 2px 12px ${colors.shadowLight};
            border-radius: 0 0 18px 18px;
        }
        #elevChartsContainer {
            display: flex;
            flex-direction: column;
            gap: 32px;
            max-height: 90vh;
            overflow: auto;
            padding: 32px 32px 32px 32px;
        }
        .elev-profile-block {
            background: ${colors.surface};
            border-radius: 14px;
            box-shadow: 0 4px 24px ${colors.shadowMedium};
            padding: 24px 24px 18px 24px;
            display: flex;
            flex-direction: column;
            align-items: stretch;
            transition: box-shadow 0.2s;
            border: 1px solid ${colors.border};
        }
        .elev-profile-block:hover {
            box-shadow: 0 8px 32px ${colors.primaryShadow};
            border-color: ${colors.primary};
        }
        .elev-profile-label {
            font-weight: 600;
            margin-bottom: 12px;
            font-size: 1.13em;
            color: inherit;
            text-shadow: ${isDark ? "0 0 2px #000, 0 0 1px #000" : "0 0 2px #fff, 0 0 1px #fff"};
            letter-spacing: 0.01em;
            display: flex;
            align-items: center;
            gap: 8px;
        }
        .elev-profile-label .dot {
            display: inline-block;
            width: 14px;
            height: 14px;
            border-radius: 50%;
            margin-right: 2px;
            box-shadow: 0 0 0 2px ${colors.borderLight}, 0 1px 4px ${colors.shadowMedium};
            border: 2px solid ${colors.surface};
        }
        .elev-profile-canvas {
            width: 100%;
            min-width: 320px;
            max-width: 100vw;
            height: 200px;
            background: inherit;
            border-radius: 8px;
            box-shadow: 0 2px 8px ${colors.shadowLight};
        }
        .no-altitude-data {
            color: ${colors.textSecondary};
            font-size: 1em;
            margin-top: 12px;
            text-align: center;
        }
        ::-webkit-scrollbar {
            width: 10px;
            background: ${colors.surface};
        }
        ::-webkit-scrollbar-thumb {
            background: ${colors.border};
            border-radius: 6px;
        }
        @media (max-width: 700px) {
            header, #elevChartsContainer { padding: 10px; }
            .elev-profile-block { padding: 12px 8px 10px 8px; }
            .elev-profile-canvas { min-width: 0; }
        }
    `;
}
function renderElevationCharts(chartWin, container, fitFiles, isDark) {
    const Chart = chartWin.Chart;
    if (!isElevationChartConstructor(Chart)) {
        return;
    }
    for (const [idx, file] of fitFiles.entries()) {
        const block = createElevationChartBlock(chartWin.document, file, idx);
        container.append(block);
        if (file.altitudes.length === 0) {
            const noData = chartWin.document.createElement("div");
            noData.className = "no-altitude-data";
            noData.textContent = "No altitude data.";
            block.append(noData);
            continue;
        }
        const canvas = block.querySelector("canvas");
        const ctx =
            canvas instanceof HTMLCanvasElement
                ? canvas.getContext("2d")
                : null;
        if (!ctx) {
            continue;
        }
        const colorHelper = Chart.helpers?.color;
        const backgroundColor =
            typeof colorHelper === "function"
                ? colorHelper(file.color)
                      .alpha(isDark ? 0.18 : 0.1)
                      .rgbString()
                : file.color;
        new Chart(ctx, {
            data: {
                datasets: [
                    {
                        backgroundColor,
                        borderColor: file.color,
                        borderWidth: 2.5,
                        data: file.altitudes.map((point) => point.y),
                        fill: true,
                        hoverBorderWidth: 3.2,
                        label: "Altitude",
                        pointRadius: 0,
                        tension: 0.22,
                    },
                ],
                labels: file.altitudes.map((point) => point.x),
            },
            options: createElevationChartOptions(file.color, isDark),
            type: "line",
        });
    }
}
function createElevationChartBlock(doc, file, idx) {
    const block = doc.createElement("div");
    block.className = "elev-profile-block";
    const label = doc.createElement("div");
    label.className = "elev-profile-label";
    label.style.color = file.color;
    const dot = doc.createElement("span");
    dot.className = "dot";
    dot.style.background = file.color;
    const text = doc.createElement("span");
    text.textContent = file.filePath;
    label.append(dot, text);
    block.append(label);
    const canvas = doc.createElement("canvas");
    canvas.id = `elevChart_${idx}`;
    canvas.className = "elev-profile-canvas";
    block.append(canvas);
    return block;
}
function createElevationChartOptions(fileColor, isDark) {
    return {
        maintainAspectRatio: true,
        plugins: {
            legend: { display: false },
            tooltip: {
                backgroundColor: isDark ? "#23263a" : "#fff",
                bodyColor: isDark ? "#fff" : "#222",
                borderColor: fileColor,
                borderWidth: 1.5,
                callbacks: {
                    title(context) {
                        const idx = context[0]?.dataIndex ?? 0;
                        return `Second: ${idx}`;
                    },
                },
                displayColors: true,
                intersect: false,
                mode: "index",
                padding: 10,
                titleColor: isDark ? "#fff" : "#222",
            },
        },
        responsive: true,
        scales: {
            x: {
                grid: { color: isDark ? "#2e3347" : "#e3e8f0" },
                ticks: {
                    color: isDark ? "#b0b8c9" : "#222",
                    font: { size: 13 },
                    maxTicksLimit: 12,
                },
                title: {
                    color: isDark ? "#eee" : "#222",
                    display: true,
                    font: { weight: 500 },
                    text: "Seconds (Point Index)",
                },
            },
            y: {
                grid: { color: isDark ? "#2e3347" : "#e3e8f0" },
                ticks: {
                    color: isDark ? "#b0b8c9" : "#222",
                    font: { size: 13 },
                    maxTicksLimit: 7,
                },
                title: {
                    color: isDark ? "#eee" : "#222",
                    display: true,
                    font: { weight: 500 },
                    text: "Altitude (m)",
                },
            },
        },
    };
}
