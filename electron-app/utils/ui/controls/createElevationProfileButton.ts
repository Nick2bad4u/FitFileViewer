import { getThemeColors } from "../../charts/theming/getThemeColors.js";
import { resolveChartRuntime } from "../../charts/core/chartRuntime.js";
import { sanitizeCssColorToken } from "../../dom/index.js";
import { getActiveFitFileMetadata } from "../../state/domain/activeFitFileMetadataState.js";
import { getActiveFitActivityData } from "../../state/domain/fitActivityDataState.js";
import { getLoadedFitFiles } from "../../state/domain/loadedFitFilesState.js";
import {
    getCreateElevationProfileButtonRuntime,
    type CreateElevationProfileButtonRuntime,
} from "./createElevationProfileButtonRuntime.js";

interface ElevationFitData {
    cachedFilePath?: unknown;
    recordMesgs?: unknown;
}

interface ElevationFitFile {
    data?: ElevationFitData;
    filePath?: unknown;
}

interface ElevationPoint {
    readonly x: number;
    readonly y: number;
}

interface ElevationProfileFileModel {
    readonly altitudes: ElevationPoint[];
    readonly color: string;
    readonly filePath: string;
}

interface ElevationPopupOptions {
    readonly chartConstructor: ElevationChartConstructor | undefined;
    readonly fitFilesModel: ElevationProfileFileModel[];
    readonly isDark: boolean;
    readonly safeThemeColors: ElevationPopupThemeColors;
}

interface ElevationPopupThemeColors {
    readonly background: string;
    readonly border: string;
    readonly borderLight: string;
    readonly primary: string;
    readonly primaryShadow: string;
    readonly shadowLight: string;
    readonly shadowMedium: string;
    readonly surface: string;
    readonly text: string;
    readonly textSecondary: string;
}

interface ChartColorBuilder {
    alpha: (opacity: number) => {
        rgbString: () => string;
    };
}

interface ElevationChartConstructor {
    new (
        context: CanvasRenderingContext2D,
        config: ElevationChartConfig
    ): ElevationChartInstance;
    helpers?: {
        color?: (color: string) => ChartColorBuilder;
    };
}

interface ElevationChartInstance {
    update?: () => void;
}

interface ElevationChartWindow extends Window {
    HTMLCanvasElement?: typeof HTMLCanvasElement;
}

interface ElevationChartConfig {
    readonly data: {
        readonly datasets: Array<{
            readonly backgroundColor: string;
            readonly borderColor: string;
            readonly borderWidth: number;
            readonly data: number[];
            readonly fill: boolean;
            readonly hoverBorderWidth: number;
            readonly label: string;
            readonly pointRadius: number;
            readonly tension: number;
        }>;
        readonly labels: number[];
    };
    readonly options: ElevationChartOptions;
    readonly type: "line";
}

interface ElevationChartOptions {
    readonly maintainAspectRatio: boolean;
    readonly plugins: {
        readonly legend: { readonly display: boolean };
        readonly tooltip: {
            readonly backgroundColor: string;
            readonly bodyColor: string;
            readonly borderColor: string;
            readonly borderWidth: number;
            readonly callbacks: {
                readonly title: (context: ChartTooltipContext[]) => string;
            };
            readonly displayColors: boolean;
            readonly intersect: boolean;
            readonly mode: "index";
            readonly padding: number;
            readonly titleColor: string;
        };
    };
    readonly responsive: boolean;
    readonly scales: Record<
        "x" | "y",
        {
            readonly grid: { readonly color: string };
            readonly ticks: {
                readonly color: string;
                readonly font: { readonly size: number };
                readonly maxTicksLimit: number;
            };
            readonly title: {
                readonly color: string;
                readonly display: boolean;
                readonly font: { readonly weight: number };
                readonly text: string;
            };
        }
    >;
}

interface ChartTooltipContext {
    readonly dataIndex: number;
}

function createElevationIcon(
    runtime: CreateElevationProfileButtonRuntime,
    color: string
): SVGSVGElement {
    const icon = runtime.createSvgElement("svg");
    icon.classList.add("icon");
    icon.setAttribute("viewBox", "0 0 20 20");
    icon.setAttribute("width", "18");
    icon.setAttribute("height", "18");

    const polyline = runtime.createSvgElement("polyline");
    polyline.setAttribute("points", "2,16 6,10 10,14 14,6 18,12");
    polyline.setAttribute("fill", "none");
    polyline.setAttribute("stroke", color);
    polyline.setAttribute("stroke-width", "2");
    icon.append(polyline);

    const points: Array<readonly [string, string]> = [
        ["2", "16"],
        ["6", "10"],
        ["10", "14"],
        ["14", "6"],
        ["18", "12"],
    ];
    for (const [cx, cy] of points) {
        const circle = runtime.createSvgElement("circle");
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
export function createElevationProfileButton(): HTMLButtonElement {
    const runtime = getCreateElevationProfileButtonRuntime();
    const btn = runtime.createButton();
    btn.className = "map-action-btn";
    const themeColorsInit = getThemeColors(),
        p = sanitizeCssColorToken(themeColorsInit["primary"], "#3b82f6");
    const label = runtime.createElement("span");
    label.textContent = "Elevation";
    btn.append(createElevationIcon(runtime, p), label);
    btn.title = "Show Elevation Profile";

    const buttonListener = runtime.createAbortController();
    btn.addEventListener(
        "click",
        () => {
            void openElevationProfilePopup().catch((error: unknown) => {
                console.error(
                    "[elevationProfile] Failed to open elevation profile",
                    error
                );
            });
        },
        { signal: buttonListener.signal }
    );
    return btn;
}

async function openElevationProfilePopup(): Promise<void> {
    const runtime = getCreateElevationProfileButtonRuntime();
    const fitFiles = getElevationFitFiles();
    const chartWin = runtime.openPopupWindow(
            "",
            "Elevation Profile",
            "width=900,height=600"
        ),
        isDark = runtime.isDarkTheme(),
        themeColors = getThemeColors();
    if (!chartWin) {
        return;
    }

    const chartConstructor = await resolveElevationChartConstructor();
    const fitFilesModel = fitFiles.map((file, idx) =>
        createElevationProfileFileModel(file, idx)
    );

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
        primary: sanitizeCssColorToken(themeColors["primary"], "#3b82f6"),
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
        chartConstructor,
        fitFilesModel,
        isDark,
        safeThemeColors,
    });
}

function createElevationProfileFileModel(
    file: ElevationFitFile,
    idx: number
): ElevationProfileFileModel {
    return {
        altitudes: getElevationPoints(file),
        color: getOverlayColor(idx),
        filePath: getDisplayFilePath(file, idx),
    };
}

function getDisplayFilePath(file: ElevationFitFile, idx: number): string {
    return typeof file.filePath === "string" && file.filePath.length > 0
        ? file.filePath
        : `File ${idx + 1}`;
}

function getElevationFitFiles(): ElevationFitFile[] {
    const loadedFitFiles = getLoadedFitFiles();
    if (loadedFitFiles.length > 0) {
        return loadedFitFiles.filter(isElevationFitFile);
    }

    const activityData = getActiveFitActivityData();
    const sourceData = activityData.rawData;
    if (
        isElevationFitData(sourceData) &&
        Array.isArray(sourceData.recordMesgs)
    ) {
        return [
            {
                data: {
                    ...sourceData,
                    recordMesgs: activityData.recordMesgs,
                },
                filePath: getActiveFitFileMetadata({
                    sourceData,
                }).storageIdentity,
            },
        ];
    }

    return [];
}

async function resolveElevationChartConstructor(): Promise<
    ElevationChartConstructor | undefined
> {
    return resolveChartRuntime(isElevationChartConstructor) ?? undefined;
}

function getElevationPoints(file: ElevationFitFile): ElevationPoint[] {
    const records = file.data?.recordMesgs;
    if (!Array.isArray(records)) {
        return [];
    }

    return records.reduce<ElevationPoint[]>((points, record, index) => {
        if (isAltitudeRecord(record)) {
            points.push({ x: index, y: record.altitude });
        }

        return points;
    }, []);
}

function getOverlayColor(idx: number): string {
    const chartOverlayColorPalette =
        getCreateElevationProfileButtonRuntime().getChartOverlayColorPalette();
    if (chartOverlayColorPalette && chartOverlayColorPalette.length > 0) {
        return sanitizeCssColorToken(
            chartOverlayColorPalette[idx % chartOverlayColorPalette.length],
            "#1976d2"
        );
    }

    return "#1976d2";
}

function isAltitudeRecord(value: unknown): value is {
    altitude: number;
    positionLat: unknown;
    positionLong: unknown;
} {
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

function getAltitudeRecordProperty(
    value: object,
    key: "altitude" | "positionLat" | "positionLong"
): unknown {
    return key in value ? value[key as keyof typeof value] : undefined;
}

function isElevationFitData(value: unknown): value is ElevationFitData {
    return value !== null && typeof value === "object";
}

function isElevationFitFile(value: unknown): value is ElevationFitFile {
    return value !== null && typeof value === "object";
}

function isElevationChartConstructor(
    value: unknown
): value is ElevationChartConstructor {
    return typeof value === "function";
}

function buildElevationProfilePopup(
    chartWin: Window,
    {
        chartConstructor,
        fitFilesModel,
        isDark,
        safeThemeColors,
    }: ElevationPopupOptions
): void {
    const runtime = getCreateElevationProfileButtonRuntime();
    const chartDoc = chartWin.document;

    chartDoc.head.replaceChildren();
    chartDoc.body.replaceChildren();
    chartDoc.title = "Elevation Profiles";
    chartDoc.body.className = isDark ? "theme-dark" : "theme-light";

    const viewport = runtime.createDocumentElement(chartDoc, "meta");
    viewport.name = "viewport";
    viewport.content = "width=device-width, initial-scale=1";

    const stylesheet = runtime.createDocumentElement(chartDoc, "link");
    stylesheet.rel = "stylesheet";
    stylesheet.href = "./elevProfile.css";

    const style = runtime.createDocumentElement(chartDoc, "style");
    style.textContent = createElevationPopupStyles(safeThemeColors, isDark);

    chartDoc.head.append(viewport, stylesheet, style);

    const header = runtime.createDocumentElement(chartDoc, "header");
    const heading = runtime.createDocumentElement(chartDoc, "h2");
    heading.style.cssText =
        "margin:0;font-size:1.5em;font-weight:700;letter-spacing:0.01em;";
    heading.textContent = "Elevation Profiles";

    const fileCount = runtime.createDocumentElement(chartDoc, "span");
    fileCount.style.cssText = "font-size:1.1em;opacity:0.7;";
    fileCount.textContent = `${fitFilesModel.length} file${
        fitFilesModel.length > 1 ? "s" : ""
    }`;
    header.append(heading, fileCount);

    const container = runtime.createDocumentElement(chartDoc, "div");
    container.id = "elevChartsContainer";
    chartDoc.body.append(header, container);

    renderElevationCharts(
        chartWin,
        container,
        fitFilesModel,
        isDark,
        chartConstructor
    );
}

function createElevationPopupStyles(
    colors: ElevationPopupThemeColors,
    isDark: boolean
): string {
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

function renderElevationCharts(
    chartWin: ElevationChartWindow,
    container: HTMLDivElement,
    fitFiles: ElevationProfileFileModel[],
    isDark: boolean,
    chartConstructor: ElevationChartConstructor | undefined
): void {
    const Chart = chartConstructor;
    if (!isElevationChartConstructor(Chart)) {
        return;
    }
    const runtime = getCreateElevationProfileButtonRuntime();

    for (const [idx, file] of fitFiles.entries()) {
        const block = createElevationChartBlock(chartWin.document, file, idx);
        container.append(block);

        if (file.altitudes.length === 0) {
            const noData = runtime.createDocumentElement(
                chartWin.document,
                "div"
            );
            noData.className = "no-altitude-data";
            noData.textContent = "No altitude data.";
            block.append(noData);
            continue;
        }

        const canvas = block.querySelector("canvas");
        const CanvasElement = chartWin.HTMLCanvasElement ?? HTMLCanvasElement;
        const ctx =
            canvas instanceof CanvasElement ? canvas.getContext("2d") : null;
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

        const chart = new Chart(ctx, {
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
        chart.update?.();
    }
}

function createElevationChartBlock(
    doc: Document,
    file: ElevationProfileFileModel,
    idx: number
): HTMLDivElement {
    const runtime = getCreateElevationProfileButtonRuntime();
    const block = runtime.createDocumentElement(doc, "div");
    block.className = "elev-profile-block";

    const label = runtime.createDocumentElement(doc, "div");
    label.className = "elev-profile-label";
    label.style.color = file.color;

    const dot = runtime.createDocumentElement(doc, "span");
    dot.className = "dot";
    dot.style.background = file.color;

    const text = runtime.createDocumentElement(doc, "span");
    text.textContent = file.filePath;
    label.append(dot, text);
    block.append(label);

    const canvas = runtime.createDocumentElement(doc, "canvas");
    canvas.id = `elevChart_${idx}`;
    canvas.className = "elev-profile-canvas";
    block.append(canvas);

    return block;
}

function createElevationChartOptions(
    fileColor: string,
    isDark: boolean
): ElevationChartOptions {
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
