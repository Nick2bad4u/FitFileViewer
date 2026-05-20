import { getThemeColors } from "../../charts/theming/getThemeColors.js";
import { sanitizeCssColorToken } from "../../dom/index.js";

const SVG_NS = "http://www.w3.org/2000/svg";

/**
 * @param {string} color
 *
 * @returns {SVGSVGElement}
 */
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
 * Create the Elevation Profile action button (Map toolbar) which opens a new
 * window rendering elevation charts for each currently loaded FIT file (or the
 * active file if none explicitly loaded as overlays).
 *
 * Implementation notes / typing strategy:
 *
 * - GetThemeColors() returns an index-signature based object; due to
 *   noPropertyAccessFromIndexSignature we must use bracket notation.
 * - Many dynamic data objects (window.loadedFitFiles / window.globalData) are
 *   loosely typed; we defensively treat them as any while keeping local
 *   structures documented via JSDoc typedefs.
 * - Guard the popup window (can be blocked and be null) before dereferencing.
 *
 * @returns {HTMLButtonElement}
 */
export function createElevationProfileButton() {
    const btn = /** @type {HTMLButtonElement} */ (
        document.createElement("button")
    );
    btn.className = "map-action-btn";
    const themeColorsInit = getThemeColors(),
        // Use bracket notation because themeColorsInit comes from an index signature
        p = sanitizeCssColorToken(themeColorsInit.primary, "#3b82f6");
    const label = document.createElement("span");
    label.textContent = "Elevation";
    btn.append(createElevationIcon(p), label);
    btn.title = "Show Elevation Profile";

    btn.addEventListener("click", () => {
        /** @type {any[]} */
        let fitFiles = [];
        const w = /** @type {any} */ (globalThis);
        if (Array.isArray(w.loadedFitFiles) && w.loadedFitFiles.length > 0) {
            fitFiles = w.loadedFitFiles;
        } else if (w.globalData && Array.isArray(w.globalData.recordMesgs)) {
            fitFiles = [
                {
                    data: w.globalData,
                    filePath: w.globalData?.cachedFilePath,
                },
            ];
        }
        const chartWin = window.open(
                "",
                "Elevation Profile",
                "width=900,height=600"
            ),
            isDark = document.body.classList.contains("theme-dark"),
            themeColors = getThemeColors();
        if (!chartWin) {
            // Popup likely blocked; fail silently or optionally notify
            return;
        }

        /**
         * Prepare a safe, serialisable model for the popup. IMPORTANT: Do not
         * inline JSON into a <script> tag (e.g. const x =
         * ${JSON.stringify(...)}) because strings like "</script>" inside file
         * paths can terminate the tag and enable injection.
         */
        const fitFilesModel = fitFiles.map((f, idx) => ({
            altitudes:
                f?.data?.recordMesgs && Array.isArray(f.data.recordMesgs)
                    ? /** @type {any[]} */ (f.data.recordMesgs)
                          .filter(
                              (r) =>
                                  r &&
                                  r.positionLat != null &&
                                  r.positionLong != null &&
                                  r.altitude != null
                          )
                          .map((r, i) => ({ x: i, y: r.altitude }))
                    : [],
            color:
                globalThis.chartOverlayColorPalette &&
                Array.isArray(globalThis.chartOverlayColorPalette)
                    ? sanitizeCssColorToken(
                          globalThis.chartOverlayColorPalette[
                              idx % globalThis.chartOverlayColorPalette.length
                          ],
                          "#1976d2"
                      )
                    : "#1976d2",
            filePath: f?.filePath || `File ${idx + 1}`,
        }));

        // Sanitize the theme colors used in template-string CSS.
        const safeThemeColors = {
            background: sanitizeCssColorToken(
                themeColors.background,
                isDark ? "#0b1220" : "#ffffff"
            ),
            border: sanitizeCssColorToken(
                themeColors.border,
                isDark ? "#334155" : "#e5e7eb"
            ),
            borderLight: sanitizeCssColorToken(
                themeColors.borderLight,
                isDark ? "#475569" : "#f1f5f9"
            ),
            primary: sanitizeCssColorToken(themeColors.primary, "#3b82f6"),
            primaryShadow: sanitizeCssColorToken(
                themeColors.primaryShadow,
                isDark ? "rgba(59,130,246,0.35)" : "rgba(59,130,246,0.25)"
            ),
            shadowLight: sanitizeCssColorToken(
                themeColors.shadowLight,
                isDark ? "rgba(0,0,0,0.35)" : "rgba(15,23,42,0.08)"
            ),
            shadowMedium: sanitizeCssColorToken(
                themeColors.shadowMedium,
                isDark ? "rgba(0,0,0,0.45)" : "rgba(15,23,42,0.12)"
            ),
            surface: sanitizeCssColorToken(
                themeColors.surface,
                isDark ? "#111827" : "#ffffff"
            ),
            text: sanitizeCssColorToken(
                themeColors.text,
                isDark ? "#e5e7eb" : "#0f172a"
            ),
            textSecondary: sanitizeCssColorToken(
                themeColors.textSecondary,
                isDark ? "#cbd5e1" : "#475569"
            ),
        };

        buildElevationProfilePopup(chartWin, {
            fitFilesModel,
            isDark,
            safeThemeColors,
        });
    });
    return btn;
}

/**
 * @typedef {{
 *     altitudes: Array<{ x: number; y: unknown }>;
 *     color: string;
 *     filePath: string;
 * }} ElevationProfileFileModel
 */

/**
 * @typedef {{
 *     background: string;
 *     border: string;
 *     borderLight: string;
 *     primary: string;
 *     primaryShadow: string;
 *     shadowLight: string;
 *     shadowMedium: string;
 *     surface: string;
 *     text: string;
 *     textSecondary: string;
 * }} ElevationPopupThemeColors
 */

/**
 * @param {Window} chartWin
 * @param {{
 *     fitFilesModel: ElevationProfileFileModel[];
 *     isDark: boolean;
 *     safeThemeColors: ElevationPopupThemeColors;
 * }} options
 */
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
    chartScript.src = "./node_modules/chart.js/dist/chart.umd.js";

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
    fileCount.textContent = `${fitFilesModel.length} file${
        fitFilesModel.length > 1 ? "s" : ""
    }`;
    header.append(heading, fileCount);

    const container = chartDoc.createElement("div");
    container.id = "elevChartsContainer";
    chartDoc.body.append(header, container);

    chartScript.addEventListener("load", () => {
        renderElevationCharts(chartWin, container, fitFilesModel, isDark);
    });
    chartDoc.head.append(chartScript);
}

/**
 * @param {ElevationPopupThemeColors} colors
 * @param {boolean} isDark
 *
 * @returns {string}
 */
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

/**
 * @param {Window} chartWin
 * @param {HTMLDivElement} container
 * @param {ElevationProfileFileModel[]} fitFiles
 * @param {boolean} isDark
 */
function renderElevationCharts(chartWin, container, fitFiles, isDark) {
    const Chart = /** @type {any} */ (chartWin).Chart;
    if (typeof Chart !== "function") {
        return;
    }

    for (const [idx, file] of fitFiles.entries()) {
        const block = createElevationChartBlock(
            chartWin.document,
            file,
            idx
        );
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
            canvas instanceof chartWin.HTMLCanvasElement
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

/**
 * @param {Document} doc
 * @param {ElevationProfileFileModel} file
 * @param {number} idx
 *
 * @returns {HTMLDivElement}
 */
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

/**
 * @param {string} fileColor
 * @param {boolean} isDark
 *
 * @returns {object}
 */
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
                        const idx = context[0].dataIndex;
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
